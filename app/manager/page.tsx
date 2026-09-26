import Link from 'next/link'
import { ClipboardList, Hourglass, PackageCheck, Truck, Plus } from 'lucide-react'
import { PageHeader } from '@/components/app-shell'
import { ExpenseList } from '@/components/expenses/expense-list'
import { OrdersTable } from '@/components/orders/orders-table'
import { SectionCard, StatCard } from '@/components/stat-card'
import { buttonVariants } from '@/components/ui/button'
import { requireRole } from '@/lib/auth'
import { listExpenses, listOrders } from '@/lib/queries'

export const metadata = { title: 'My orders' }

export default async function ManagerDashboard() {
  const { supabase, profile } = await requireRole('manager')
  const [orders, expenses] = await Promise.all([listOrders(supabase), listExpenses(supabase)])

  const drafts = orders.filter((o) => ['draft', 'rejected'].includes(o.status))
  const pending = orders.filter((o) => o.status === 'pending_approval')
  const active = orders.filter((o) => ['approved', 'invoiced', 'in_progress'].includes(o.status))
  const completed = orders.filter((o) => o.status === 'completed')
  const myExpenses = expenses.filter((e) => e.requested_by === profile.id)
  const toAcknowledge = myExpenses.filter((e) => e.status === 'disbursed')

  return (
    <>
      <PageHeader
        title={`Welcome, ${profile.full_name?.split(' ')[0] ?? 'Manager'}`}
        description="Create orders, request budgets and track fulfilment."
        actions={
          <Link href="/manager/orders/new" className={buttonVariants()}>
            <Plus aria-hidden />
            New order
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Drafts & revisions" value={String(drafts.length)} icon={ClipboardList} />
        <StatCard label="Awaiting approval" value={String(pending.length)} icon={Hourglass} />
        <StatCard label="In fulfilment" value={String(active.length)} icon={Truck} />
        <StatCard label="Completed" value={String(completed.length)} icon={PackageCheck} />
      </div>

      {toAcknowledge.length > 0 && (
        <SectionCard title="Funds to acknowledge" description="Accounts has sent these funds. Confirm receipt on the order." count={toAcknowledge.length}>
          <ExpenseList expenses={toAcknowledge} emptyText="" />
        </SectionCard>
      )}

      <SectionCard title="Active fulfilment" count={active.length}>
        <OrdersTable orders={active} emptyText="No orders in fulfilment yet." />
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Drafts & rejected" count={drafts.length}>
          <OrdersTable orders={drafts} emptyText="No drafts. Start a new order." />
        </SectionCard>
        <SectionCard title="My budget requests" count={myExpenses.length}>
          <ExpenseList expenses={myExpenses} emptyText="Request budgets from an approved order's page." />
        </SectionCard>
      </div>

      <SectionCard title="All orders" count={orders.length}>
        <OrdersTable orders={orders} />
      </SectionCard>
    </>
  )
}
