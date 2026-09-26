import Link from 'next/link'
import { PaymentBadge, StatusBadge } from '@/components/orders/status-badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ORDER_TYPE_LABELS, computeTotals, formatDate, formatMoney, orderRef } from '@/lib/format'
import type { Order } from '@/lib/types'

export function OrdersTable({
  orders,
  showMargin = false,
  emptyText = 'No orders yet.',
}: {
  orders: Order[]
  showMargin?: boolean
  emptyText?: string
}) {
  if (orders.length === 0) {
    return <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">{emptyText}</p>
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order</TableHead>
            <TableHead className="hidden md:table-cell">Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden lg:table-cell">Payment</TableHead>
            <TableHead className="text-right">Total</TableHead>
            {showMargin && <TableHead className="hidden text-right sm:table-cell">Margin</TableHead>}
            <TableHead className="hidden text-right md:table-cell">Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => {
            const t = computeTotals(order.order_items, order.tax_rate, order.estimated_cost)
            return (
              <TableRow key={order.id} className="relative">
                <TableCell>
                  <Link href={`/orders/${order.id}`} className="flex flex-col after:absolute after:inset-0">
                    <span className="font-medium">{order.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {orderRef(order)} · {order.client_name}
                    </span>
                  </Link>
                </TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">{ORDER_TYPE_LABELS[order.order_type]}</TableCell>
                <TableCell>
                  <StatusBadge status={order.status} />
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <PaymentBadge status={order.payment_status} />
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums">{formatMoney(t.total, order.currency)}</TableCell>
                {showMargin && (
                  <TableCell className="hidden text-right font-mono tabular-nums sm:table-cell">
                    <span className={t.margin < 0 ? 'text-destructive' : 'text-primary'}>{t.marginPct.toFixed(1)}%</span>
                  </TableCell>
                )}
                <TableCell className="hidden text-right text-muted-foreground md:table-cell">{formatDate(order.updated_at)}</TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
