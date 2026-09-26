import Link from 'next/link'
import { ArrowDownLeft, ArrowUpRight, Landmark, Stamp } from 'lucide-react'
import { PageHeader } from '@/components/app-shell'
import { ExpenseList } from '@/components/expenses/expense-list'
import { OrdersTable } from '@/components/orders/orders-table'
import { SectionCard, StatCard } from '@/components/stat-card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { requireRole } from '@/lib/auth'
import { formatDate, formatMoney } from '@/lib/format'
import { ledgerTotals, listExpenses, listLedger, listOrders } from '@/lib/queries'

export const metadata = { title: 'Accounts & ledger' }

export default async function AccountantDashboard() {
  const { supabase } = await requireRole('accountant')
  const [orders, expenses, ledger] = await Promise.all([listOrders(supabase), listExpenses(supabase), listLedger(supabase)])

  const toInvoice = orders.filter((o) => o.status === 'approved')
  const invoiced = orders.filter((o) => o.invoice_number)
  const toDisburse = expenses.filter((e) => e.status === 'approved')
  const { credits, debits, balance } = ledgerTotals(ledger)

  return (
    <>
      <PageHeader title="Accounts & ledger" description="Invoicing, disbursements and the company cash book." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Cash book balance" value={formatMoney(balance)} icon={Landmark} />
        <StatCard label="Total receipts" value={formatMoney(credits)} icon={ArrowDownLeft} />
        <StatCard label="Total disbursed" value={formatMoney(debits)} icon={ArrowUpRight} />
        <StatCard label="Invoices issued" value={String(invoiced.length)} hint={`${toInvoice.length} awaiting stamp`} icon={Stamp} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Ready to invoice" description="CEO-approved quotes needing your stamp." count={toInvoice.length}>
          <OrdersTable orders={toInvoice} emptyText="No approved quotes to invoice." />
        </SectionCard>
        <SectionCard title="Funds to disburse" description="CEO-approved budget requests." count={toDisburse.length}>
          <ExpenseList expenses={toDisburse} emptyText="No approved requests to disburse." />
        </SectionCard>
      </div>

      <SectionCard title="General ledger" count={ledger.length}>
        {ledger.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            Entries appear when the CEO verifies payments and you disburse funds.
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="hidden md:table-cell">Reference</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                  <TableHead className="text-right">Credit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ledger.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{formatDate(e.created_at)}</TableCell>
                    <TableCell>
                      {e.order_id ? (
                        <Link href={`/orders/${e.order_id}`} className="hover:underline">
                          {e.description}
                        </Link>
                      ) : (
                        e.description
                      )}
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">{e.reference ?? '—'}</TableCell>
                    <TableCell className="text-right font-mono tabular-nums text-destructive">
                      {e.entry_type === 'debit' ? formatMoney(e.amount) : ''}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums text-primary">
                      {e.entry_type === 'credit' ? formatMoney(e.amount) : ''}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>

      <SectionCard title="All orders" count={orders.length}>
        <OrdersTable orders={orders} />
      </SectionCard>
    </>
  )
}
