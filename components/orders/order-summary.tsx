import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatMoney } from '@/lib/format'
import type { Order } from '@/lib/types'

type Totals = { subtotal: number; tax: number; total: number; margin: number; marginPct: number }

export function OrderSummary({ order, totals }: { order: Order; totals: Totals }) {
  const items = order.order_items ?? []
  const money = (v: number) => formatMoney(v, order.currency)

  return (
    <section aria-labelledby="items-heading" className="flex flex-col overflow-hidden rounded-lg border bg-card">
      <h2 id="items-heading" className="border-b px-5 py-3 text-base font-semibold">
        Line items
      </h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-5">Description</TableHead>
            <TableHead className="text-right">Qty</TableHead>
            <TableHead className="hidden text-right sm:table-cell">Unit price</TableHead>
            <TableHead className="pr-5 text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="py-6 text-center text-muted-foreground">
                No line items.
              </TableCell>
            </TableRow>
          )}
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="whitespace-normal pl-5">{item.description}</TableCell>
              <TableCell className="text-right font-mono tabular-nums">{Number(item.quantity)}</TableCell>
              <TableCell className="hidden text-right font-mono tabular-nums sm:table-cell">{money(Number(item.unit_price))}</TableCell>
              <TableCell className="pr-5 text-right font-mono tabular-nums">{money(Number(item.quantity) * Number(item.unit_price))}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <SummaryRow label="Subtotal" value={money(totals.subtotal)} />
          <SummaryRow label={`VAT (${Number(order.tax_rate)}%)`} value={money(totals.tax)} />
          <SummaryRow label="Total" value={money(totals.total)} strong />
        </TableFooter>
      </Table>
      <dl className="grid grid-cols-2 gap-4 border-t px-5 py-4 text-sm sm:grid-cols-3">
        <div className="flex flex-col gap-0.5">
          <dt className="text-xs text-muted-foreground">Estimated cost</dt>
          <dd className="font-mono tabular-nums">{money(Number(order.estimated_cost))}</dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-xs text-muted-foreground">Projected margin</dt>
          <dd className={`font-mono tabular-nums ${totals.margin < 0 ? 'text-destructive' : 'text-primary'}`}>
            {money(totals.margin)} ({totals.marginPct.toFixed(1)}%)
          </dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-xs text-muted-foreground">Received</dt>
          <dd className="font-mono tabular-nums">{money(Number(order.amount_received))}</dd>
        </div>
      </dl>
    </section>
  )
}

function SummaryRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <TableRow className={strong ? 'font-semibold' : 'font-normal'}>
      <TableCell colSpan={3} className="pl-5 text-right">
        {label}
      </TableCell>
      <TableCell className="pr-5 text-right font-mono tabular-nums">{value}</TableCell>
    </TableRow>
  )
}
