import { Banknote, FileClock, TrendingUp, Wallet } from 'lucide-react'
import { PageHeader } from '@/components/app-shell'
import { CashflowChart } from '@/components/ceo/cashflow-chart'
import { ExpenseList } from '@/components/expenses/expense-list'
import { OrdersTable } from '@/components/orders/orders-table'
import { SectionCard, StatCard } from '@/components/stat-card'
import { requireRole } from '@/lib/auth'
import { computeTotals, formatMoney } from '@/lib/format'
import { ledgerTotals, listExpenses, listLedger, listOrders } from '@/lib/queries'

export const metadata = { title: 'Executive overview' }

function monthlySeries(entries: Awaited<ReturnType<typeof listLedger>>) {
  const now = new Date()
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
    return { key: `${d.getFullYear()}-${d.getMonth()}`, month: d.toLocaleString('en-GB', { month: 'short' }), received: 0, disbursed: 0 }
  })
  for (const e of entries) {
    const d = new Date(e.created_at)
    const bucket = months.find((m) => m.key === `${d.getFullYear()}-${d.getMonth()}`)
    if (!bucket) continue
    if (e.entry_type === 'credit') bucket.received += Number(e.amount)
    else bucket.disbursed += Number(e.amount)
  }
  return months.map(({ key: _key, ...rest }) => rest)
}

export default async function CeoDashboard() {
  const { supabase } = await requireRole('ceo')
  const [orders, expenses, ledger] = await Promise.all([listOrders(supabase), listExpenses(supabase), listLedger(supabase)])

  const pendingApproval = orders.filter((o) => o.status === 'pending_approval')
  const awaitingPayment = orders.filter((o) => ['invoiced', 'in_progress'].includes(o.status) && o.payment_status !== 'full')
  const pendingExpenses = expenses.filter((e) => e.status === 'pending')
  const active = orders.filter((o) => !['draft', 'rejected'].includes(o.status))

  const pipeline = active.reduce((s, o) => s + computeTotals(o.order_items, o.tax_rate).total, 0)
  const projectedMargin = active.reduce((s, o) => s + computeTotals(o.order_items, o.tax_rate, o.estimated_cost).margin, 0)
  const { credits, debits, balance } = ledgerTotals(ledger)

  return (
    <>
      <PageHeader title="Executive overview" description="Approvals, payment verification and company financials." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Approved pipeline" value={formatMoney(pipeline)} hint={`${active.length} active orders`} icon={TrendingUp} />
        <StatCard label="Projected margin" value={formatMoney(projectedMargin)} hint="Subtotal minus estimated costs" icon={Banknote} />
        <StatCard label="Cash received" value={formatMoney(credits)} hint={`${formatMoney(debits)} disbursed`} icon={Wallet} />
        <StatCard label="Net position" value={formatMoney(balance)} hint="Receipts less disbursements" icon={FileClock} />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="flex flex-col gap-3 rounded-lg border bg-card p-5 lg:col-span-3">
          <h2 className="text-lg font-semibold">Cash flow, last 6 months</h2>
          <CashflowChart data={monthlySeries(ledger)} />
        </div>
        <div className="lg:col-span-2">
          <SectionCard title="Budget requests" description="Operational spend awaiting your sign-off." count={pendingExpenses.length}>
            <ExpenseList expenses={pendingExpenses} emptyText="No budget requests to review." />
          </SectionCard>
        </div>
      </div>

      <SectionCard title="Quotes awaiting approval" description="Review pricing and margins, then sign." count={pendingApproval.length}>
        <OrdersTable orders={pendingApproval} showMargin emptyText="No quotes waiting for approval." />
      </SectionCard>

      <SectionCard title="Awaiting client payment" description="Only you can verify half or full client payments." count={awaitingPayment.length}>
        <OrdersTable orders={awaitingPayment} showMargin emptyText="No invoices waiting on payment." />
      </SectionCard>

      <SectionCard title="All orders" count={orders.length}>
        <OrdersTable orders={orders} showMargin />
      </SectionCard>
    </>
  )
}
