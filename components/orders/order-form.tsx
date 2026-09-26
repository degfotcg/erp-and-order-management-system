'use client'

import { Plus, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { computeTotals, errorMessage, formatMoney } from '@/lib/format'
import { createClient } from '@/lib/supabase/client'
import type { Order } from '@/lib/types'

type Line = { key: string; description: string; quantity: string; unit_price: string }

const newLine = (): Line => ({ key: crypto.randomUUID(), description: '', quantity: '1', unit_price: '0' })

export const selectClass =
  'h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50'

export function OrderForm({ userId, order }: { userId: string; order?: Order }) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [orderType, setOrderType] = useState<Order['order_type']>(order?.order_type ?? 'Software')
  const [estimatedCost, setEstimatedCost] = useState(String(order?.estimated_cost ?? '0'))
  const [lines, setLines] = useState<Line[]>(
    order?.order_items?.length
      ? order.order_items.map((i) => ({
          key: i.id,
          description: i.description,
          quantity: String(i.quantity),
          unit_price: String(i.unit_price),
        }))
      : [newLine()],
  )

  const totals = computeTotals(
    lines.map((l) => ({ id: l.key, order_id: '', description: l.description, quantity: Number(l.quantity) || 0, unit_price: Number(l.unit_price) || 0 })),
    order?.tax_rate ?? 5,
    Number(estimatedCost) || 0,
  )

  function updateLine(key: string, patch: Partial<Line>) {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)))
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const items = lines
      .filter((l) => l.description.trim())
      .map((l) => ({ description: l.description.trim(), quantity: Number(l.quantity), unit_price: Number(l.unit_price) }))

    if (items.length === 0) return toast.error('Add at least one line item.')
    if (items.some((i) => !(i.quantity > 0) || !(i.unit_price >= 0))) return toast.error('Quantities must be positive and prices non-negative.')

    const payload = {
      title: String(form.get('title')).trim(),
      client_name: String(form.get('client_name')).trim(),
      client_email: String(form.get('client_email') || '').trim() || null,
      client_address: String(form.get('client_address') || '').trim() || null,
      notes: String(form.get('notes') || '').trim() || null,
      order_type: orderType,
      estimated_cost: Math.max(0, Number(estimatedCost) || 0),
    }

    setPending(true)
    const supabase = createClient()
    try {
      let orderId = order?.id
      if (orderId) {
        const { error } = await supabase.from('orders').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', orderId)
        if (error) throw error
        const { error: delError } = await supabase.from('order_items').delete().eq('order_id', orderId)
        if (delError) throw delError
      } else {
        const { data, error } = await supabase
          .from('orders')
          .insert({ ...payload, created_by: userId, status: 'draft' })
          .select('id')
          .single()
        if (error) throw error
        orderId = data.id
      }
      const { error: itemsError } = await supabase.from('order_items').insert(items.map((i) => ({ ...i, order_id: orderId })))
      if (itemsError) throw itemsError
      toast.success(order ? 'Draft updated' : 'Draft order created')
      router.push(`/orders/${orderId}`)
      router.refresh()
    } catch (err) {
      toast.error(errorMessage(err))
      setPending(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-3">
      <div className="flex flex-col gap-6 lg:col-span-2">
        <fieldset className="grid gap-4 rounded-lg border bg-card p-5 sm:grid-cols-2">
          <legend className="px-1 text-sm font-semibold">Order details</legend>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="title">Order title</Label>
            <Input id="title" name="title" required maxLength={160} defaultValue={order?.title} placeholder="e.g. Inventory portal build" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="order_type">Service line</Label>
            <select id="order_type" className={selectClass} value={orderType} onChange={(e) => setOrderType(e.target.value as Order['order_type'])}>
              <option value="Software">Software Development</option>
              <option value="Import_Export">Import / Export</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="estimated_cost">
              Estimated {orderType === 'Software' ? 'development' : 'logistics'} cost (AED)
            </Label>
            <Input id="estimated_cost" type="number" min={0} step="0.01" value={estimatedCost} onChange={(e) => setEstimatedCost(e.target.value)} />
          </div>
        </fieldset>

        <fieldset className="grid gap-4 rounded-lg border bg-card p-5 sm:grid-cols-2">
          <legend className="px-1 text-sm font-semibold">Client</legend>
          <div className="flex flex-col gap-2">
            <Label htmlFor="client_name">Client name</Label>
            <Input id="client_name" name="client_name" required maxLength={160} defaultValue={order?.client_name} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="client_email">Client email</Label>
            <Input id="client_email" name="client_email" type="email" defaultValue={order?.client_email ?? ''} />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="client_address">Billing address</Label>
            <Textarea id="client_address" name="client_address" rows={2} maxLength={500} defaultValue={order?.client_address ?? ''} />
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-4 rounded-lg border bg-card p-5">
          <legend className="px-1 text-sm font-semibold">Line items</legend>
          <div className="hidden grid-cols-[1fr_6rem_8rem_2.25rem] gap-2 text-xs font-medium text-muted-foreground sm:grid">
            <span>Description</span>
            <span>Qty</span>
            <span>Unit price</span>
            <span className="sr-only">Remove</span>
          </div>
          {lines.map((line, i) => (
            <div key={line.key} className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_6rem_8rem_2.25rem]">
              <Input
                aria-label={`Line ${i + 1} description`}
                className="col-span-2 sm:col-span-1"
                placeholder="Description"
                value={line.description}
                onChange={(e) => updateLine(line.key, { description: e.target.value })}
              />
              <Input aria-label={`Line ${i + 1} quantity`} type="number" min={0.01} step="0.01" value={line.quantity} onChange={(e) => updateLine(line.key, { quantity: e.target.value })} />
              <Input aria-label={`Line ${i + 1} unit price`} type="number" min={0} step="0.01" value={line.unit_price} onChange={(e) => updateLine(line.key, { unit_price: e.target.value })} />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Remove line ${i + 1}`}
                disabled={lines.length === 1}
                onClick={() => setLines((prev) => prev.filter((l) => l.key !== line.key))}
              >
                <Trash2 aria-hidden />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => setLines((p) => [...p, newLine()])}>
            <Plus aria-hidden />
            Add line
          </Button>
        </fieldset>

        <div className="flex flex-col gap-2">
          <Label htmlFor="notes">Internal notes</Label>
          <Textarea id="notes" name="notes" rows={3} maxLength={2000} defaultValue={order?.notes ?? ''} />
        </div>
      </div>

      <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
        <div className="flex flex-col gap-3 rounded-lg border bg-card p-5">
          <h2 className="text-sm font-semibold">Quote summary</h2>
          <dl className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="font-mono tabular-nums">{formatMoney(totals.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">VAT ({order?.tax_rate ?? 5}%)</dt>
              <dd className="font-mono tabular-nums">{formatMoney(totals.tax)}</dd>
            </div>
            <div className="flex justify-between border-t pt-2 font-semibold">
              <dt>Total</dt>
              <dd className="font-mono tabular-nums">{formatMoney(totals.total)}</dd>
            </div>
          </dl>
          <p className="text-xs leading-relaxed text-muted-foreground">Final tax terms are confirmed by Accounts at invoicing.</p>
        </div>
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? 'Saving…' : order ? 'Save draft' : 'Create draft'}
        </Button>
      </aside>
    </form>
  )
}
