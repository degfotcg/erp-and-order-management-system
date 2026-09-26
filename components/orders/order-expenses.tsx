import { StatusBadge } from '@/components/orders/status-badge'
import { formatDate, formatMoney } from '@/lib/format'
import type { ExpenseRequest } from '@/lib/types'

export function OrderExpenses({
  expenses,
  currency,
  names,
}: {
  expenses: ExpenseRequest[]
  currency: string
  names: Record<string, string>
}) {
  return (
    <section aria-labelledby="expenses-heading" className="flex flex-col gap-3">
      <h2 id="expenses-heading" className="text-base font-semibold">
        Budget requests
      </h2>
      {expenses.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">No budget requests for this order.</p>
      ) : (
        <ul className="flex flex-col divide-y rounded-lg border bg-card">
          {expenses.map((e) => (
            <li key={e.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="font-medium">{e.purpose}</span>
                <span className="text-xs text-muted-foreground">
                  {names[e.requested_by] ?? 'Manager'} · {formatDate(e.created_at)}
                  {e.disbursement_reference && ` · Ref ${e.disbursement_reference}`}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-semibold tabular-nums">{formatMoney(e.amount, currency)}</span>
                <StatusBadge status={e.status} kind="expense" />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
