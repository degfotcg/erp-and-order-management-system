import { Progress } from '@/components/ui/progress'
import { ORDER_TYPE_LABELS, STAGE_LABELS, formatDate } from '@/lib/format'
import type { Order } from '@/lib/types'

export function OrderOverview({ order, createdByName }: { order: Order; createdByName?: string }) {
  const fields: [string, React.ReactNode][] = [
    ['Service line', ORDER_TYPE_LABELS[order.order_type]],
    ['Created by', createdByName ?? '—'],
    ['Created', formatDate(order.created_at)],
    ['Last updated', formatDate(order.updated_at, true)],
    ['Client email', order.client_email ?? '—'],
    ['Invoice no.', order.invoice_number ? <span className="font-mono">{order.invoice_number}</span> : '—'],
  ]

  return (
    <section aria-labelledby="overview-heading" className="flex flex-col gap-5 rounded-lg border bg-card p-5">
      <h2 id="overview-heading" className="text-base font-semibold">
        Overview
      </h2>
      <dl className="grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
        {fields.map(([label, value]) => (
          <div key={label} className="flex flex-col gap-0.5">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
        {order.client_address && (
          <div className="flex flex-col gap-0.5 sm:col-span-2">
            <dt className="text-xs text-muted-foreground">Billing address</dt>
            <dd className="whitespace-pre-line">{order.client_address}</dd>
          </div>
        )}
        {order.notes && (
          <div className="flex flex-col gap-0.5 sm:col-span-2">
            <dt className="text-xs text-muted-foreground">Internal notes</dt>
            <dd className="whitespace-pre-line leading-relaxed">{order.notes}</dd>
          </div>
        )}
        {order.status === 'rejected' && order.rejection_reason && (
          <div className="flex flex-col gap-0.5 rounded-md bg-destructive/10 p-3 sm:col-span-2">
            <dt className="text-xs font-medium text-destructive">Rejection reason</dt>
            <dd className="leading-relaxed">{order.rejection_reason}</dd>
          </div>
        )}
      </dl>

      <div className="flex flex-col gap-2 border-t pt-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Fulfilment: <span className="font-medium text-foreground">{STAGE_LABELS[order.fulfillment_stage]}</span>
          </span>
          <span className="font-mono tabular-nums">{order.progress}%</span>
        </div>
        <Progress value={order.progress} aria-label="Fulfilment progress" />
      </div>
    </section>
  )
}
