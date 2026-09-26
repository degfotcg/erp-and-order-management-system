'use client'

import { Check, X } from 'lucide-react'
import { useState } from 'react'
import { ActionCard } from '@/components/orders/action-card'
import { useRpc } from '@/components/orders/use-rpc'
import { SignaturePad } from '@/components/signature-pad'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { formatMoney } from '@/lib/format'
import type { ExpenseRequest, Order } from '@/lib/types'

export function CeoActions({ order, total, expenses }: { order: Order; total: number; expenses: ExpenseRequest[] }) {
  const { run, pending } = useRpc()
  const [signature, setSignature] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const pendingExpenses = expenses.filter((e) => e.status === 'pending')
  const canVerify = ['invoiced', 'in_progress', 'completed'].includes(order.status) && order.payment_status !== 'full'

  return (
    <>
      {order.status === 'pending_approval' && (
        <ActionCard title="Approve quote" description="Review pricing and margin, then sign to approve.">
          <SignaturePad label="CEO signature" onChange={setSignature} />
          <Button
            disabled={!signature || pending !== null}
            onClick={() => run('ceo_decide_order', { p_order: order.id, p_approve: true, p_signature: signature, p_reason: null }, 'Quote approved and signed')}
          >
            <Check aria-hidden />
            Approve & sign
          </Button>
          <div className="flex flex-col gap-2 border-t pt-4">
            <Label htmlFor="reject-reason">Rejection reason</Label>
            <Textarea id="reject-reason" rows={2} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Optional note for the manager" />
            <Button
              variant="outline"
              disabled={pending !== null}
              onClick={() => run('ceo_decide_order', { p_order: order.id, p_approve: false, p_signature: null, p_reason: reason }, 'Quote rejected')}
            >
              <X aria-hidden />
              Reject quote
            </Button>
          </div>
        </ActionCard>
      )}

      {canVerify && (
        <ActionCard
          title="Verify client payment"
          description={`Invoice total ${formatMoney(total, order.currency)}. Received so far ${formatMoney(order.amount_received, order.currency)}.`}
        >
          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              variant="outline"
              disabled={order.payment_status !== 'unpaid' || pending !== null}
              onClick={() => run('ceo_verify_payment', { p_order: order.id, p_level: 'half' }, 'Half payment verified')}
            >
              Half payment (50%)
            </Button>
            <Button disabled={pending !== null} onClick={() => run('ceo_verify_payment', { p_order: order.id, p_level: 'full' }, 'Full payment verified')}>
              Full payment (100%)
            </Button>
          </div>
        </ActionCard>
      )}

      {pendingExpenses.map((e) => (
        <ActionCard key={e.id} title="Budget request" description={`${formatMoney(e.amount, order.currency)} — ${e.purpose}`}>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            <dt className="text-muted-foreground">Bank</dt>
            <dd>{e.bank_name}</dd>
            <dt className="text-muted-foreground">Account</dt>
            <dd>
              {e.account_name} · {e.account_number}
            </dd>
          </dl>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button variant="outline" disabled={pending !== null} onClick={() => run('ceo_decide_expense', { p_expense: e.id, p_approve: false }, 'Budget declined')}>
              Decline
            </Button>
            <Button disabled={pending !== null} onClick={() => run('ceo_decide_expense', { p_expense: e.id, p_approve: true }, 'Budget approved')}>
              Approve budget
            </Button>
          </div>
        </ActionCard>
      ))}
    </>
  )
}
