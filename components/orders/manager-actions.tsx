'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Pencil, Send, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { ActionCard } from '@/components/orders/action-card'
import { selectClass } from '@/components/orders/order-form'
import { useRpc } from '@/components/orders/use-rpc'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { errorMessage, formatMoney, STAGE_LABELS } from '@/lib/format'
import { createClient } from '@/lib/supabase/client'
import type { ExpenseRequest, FulfillmentStage, Order } from '@/lib/types'

const ACTIVE = ['approved', 'invoiced', 'in_progress']

export function ManagerActions({ order, expenses, userId }: { order: Order; expenses: ExpenseRequest[]; userId: string }) {
  const router = useRouter()
  const { run, pending } = useRpc()
  const isOwner = order.created_by === userId
  const toAcknowledge = expenses.filter((e) => e.status === 'disbursed' && e.requested_by === userId)

  async function deleteDraft() {
    if (!window.confirm('Delete this draft permanently?')) return
    const { error } = await createClient().from('orders').delete().eq('id', order.id)
    if (error) return toast.error(errorMessage(error))
    toast.success('Draft deleted')
    router.replace('/manager')
    router.refresh()
  }

  return (
    <>
      {isOwner && order.status === 'draft' && (
        <ActionCard title="Draft order" description="Submit to the CEO for price approval and signature.">
          <div className="flex flex-wrap gap-2">
            <Button disabled={pending !== null} onClick={() => run('submit_order', { p_order: order.id }, 'Submitted for approval')}>
              <Send aria-hidden />
              Submit for approval
            </Button>
            <Link href={`/manager/orders/${order.id}/edit`} className={buttonVariants({ variant: 'outline' })}>
              <Pencil aria-hidden />
              Edit
            </Link>
            <Button variant="ghost" onClick={deleteDraft}>
              <Trash2 aria-hidden />
              Delete
            </Button>
          </div>
        </ActionCard>
      )}

      {isOwner && order.status === 'rejected' && (
        <ActionCard title="Quote rejected" description={order.rejection_reason ?? 'The CEO rejected this quote.'}>
          <Button disabled={pending !== null} onClick={() => run('reopen_order', { p_order: order.id }, 'Reopened as draft')}>
            <Pencil aria-hidden />
            Reopen to revise
          </Button>
        </ActionCard>
      )}

      {toAcknowledge.map((e) => (
        <ActionCard key={e.id} title="Funds sent to you" description={`${formatMoney(e.amount, order.currency)} for ${e.purpose} via ${e.disbursement_method === 'check' ? 'check #' : 'transfer '}${e.disbursement_reference}.`}>
          <Button disabled={pending !== null} onClick={() => run('manager_acknowledge_expense', { p_expense: e.id }, 'Receipt acknowledged')}>
            <CheckCircle2 aria-hidden />
            Acknowledge receipt
          </Button>
        </ActionCard>
      ))}

      {ACTIVE.includes(order.status) && (
        <>
          <FulfillmentCard order={order} />
          <ExpenseRequestCard order={order} />
        </>
      )}

      {order.status === 'in_progress' && (
        <ActionCard title="Close out" description="Mark delivered once fulfilment is finished.">
          <Button disabled={pending !== null} onClick={() => run('manager_complete_order', { p_order: order.id }, 'Order completed')}>
            <CheckCircle2 aria-hidden />
            Mark order completed
          </Button>
        </ActionCard>
      )}
    </>
  )
}

function FulfillmentCard({ order }: { order: Order }) {
  const { run, pending } = useRpc()
  const [stage, setStage] = useState<FulfillmentStage>(order.fulfillment_stage)
  const [progress, setProgress] = useState(order.progress)
  const stages = (Object.keys(STAGE_LABELS) as FulfillmentStage[]).filter((s) =>
    order.order_type === 'Software' ? !['sourcing', 'packaging', 'shipping'].includes(s) : s !== 'development',
  )

  return (
    <ActionCard title="Update fulfilment" description="Keep leadership informed of progress.">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="stage">Stage</Label>
          <select id="stage" className={selectClass} value={stage} onChange={(e) => setStage(e.target.value as FulfillmentStage)}>
            {stages.map((s) => (
              <option key={s} value={s}>
                {STAGE_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="progress">Progress: {progress}%</Label>
          <input
            id="progress"
            type="range"
            min={0}
            max={100}
            step={5}
            value={progress}
            onChange={(e) => setProgress(Number(e.target.value))}
            className="h-9 accent-primary"
          />
        </div>
      </div>
      <Button
        variant="outline"
        disabled={pending !== null}
        onClick={() => run('manager_update_fulfillment', { p_order: order.id, p_stage: stage, p_progress: progress }, 'Fulfilment updated')}
      >
        Save progress
      </Button>
    </ActionCard>
  )
}

function ExpenseRequestCard({ order }: { order: Order }) {
  const { run, pending } = useRpc()
  const [open, setOpen] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formEl = e.currentTarget
    const f = new FormData(formEl)
    const ok = await run(
      'create_expense_request',
      {
        p_order: order.id,
        p_amount: Number(f.get('amount')),
        p_purpose: f.get('purpose'),
        p_bank: f.get('bank'),
        p_account_name: f.get('account_name'),
        p_account_number: f.get('account_number'),
      },
      'Budget request sent to CEO',
    )
    if (ok) {
      formEl.reset()
      setOpen(false)
    }
  }

  return (
    <ActionCard title="Operational budget" description="Request funds for packaging, logistics or development. Bank details are posted to the order chat.">
      {!open ? (
        <Button variant="outline" onClick={() => setOpen(true)}>
          Request budget
        </Button>
      ) : (
        <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="amount">Amount ({order.currency})</Label>
            <Input id="amount" name="amount" type="number" min={0.01} step="0.01" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="purpose">Purpose</Label>
            <Input id="purpose" name="purpose" required maxLength={200} placeholder="e.g. Export packaging" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="bank">Bank name</Label>
            <Input id="bank" name="bank" required maxLength={120} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="account_name">Account holder</Label>
            <Input id="account_name" name="account_name" required maxLength={120} />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="account_number">Account number / IBAN</Label>
            <Input id="account_number" name="account_number" required maxLength={64} className="font-mono" />
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" disabled={pending !== null}>
              Submit request
            </Button>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </ActionCard>
  )
}
