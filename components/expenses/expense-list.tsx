import Link from 'next/link'
import { StatusBadge } from '@/components/orders/status-badge'
import { formatDate, formatMoney, orderRef } from '@/lib/format'
import type { ExpenseWithOrder } from '@/lib/queries'

export function ExpenseList({ expenses, emptyText }: { expenses: ExpenseWithOrder[]; emptyText: string }) {
  if (expenses.length === 0) {
    return <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">{emptyText}</p>
  }
  return (
    <ul className="flex flex-col divide-y rounded-lg border bg-card">
      {expenses.map((e) => (
        <li key={e.id} className="relative flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-0.5">
            <Link href={`/orders/${e.order_id}`} className="font-medium after:absolute after:inset-0">
              {e.purpose}
            </Link>
            <span className="text-xs text-muted-foreground">
              {e.orders ? `${orderRef(e.orders)} · ${e.orders.title}` : 'Order'} · {formatDate(e.created_at)}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-semibold tabular-nums">{formatMoney(e.amount, e.orders?.currency)}</span>
            <StatusBadge status={e.status} kind="expense" />
          </div>
        </li>
      ))}
    </ul>
  )
}
