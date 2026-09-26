'use client'

import { Stamp, Upload } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { ActionCard } from '@/components/orders/action-card'
import { selectClass } from '@/components/orders/order-form'
import { useRpc } from '@/components/orders/use-rpc'
import { SignaturePad } from '@/components/signature-pad'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { errorMessage, formatMoney } from '@/lib/format'
import { createClient } from '@/lib/supabase/client'
import type { ExpenseRequest, Order } from '@/lib/types'

const MAX_RECEIPT_BYTES = 5 * 1024 * 1024

export function AccountantActions({ order, expenses }: { order: Order; expenses: ExpenseRequest[] }) {
  const { run, pending } = useRpc()
  const [signature, setSignature] = useState<string | null>(null)
  const [taxRate, setTaxRate] = useState(String(order.tax_rate))
  const toDisburse = expenses.filter((e) => e.status === 'approved')

  return (
    <>
      {order.status === 'approved' && (
        <ActionCard title="Issue official invoice" description="Confirm tax terms and stamp your signature to generate the A4 invoice.">
          <div className="flex flex-col gap-2">
            <Label htmlFor="tax-rate">VAT rate (%)</Label>
            <Input id="tax-rate" type="number" min={0} max={100} step="0.01" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} />
          </div>
          <SignaturePad label="Accountant stamp signature" onChange={setSignature} />
          <Button
            disabled={!signature || pending !== null}
            onClick={() => run('accountant_issue_invoice', { p_order: order.id, p_tax_rate: Number(taxRate), p_signature: signature }, 'Invoice issued')}
          >
            <Stamp aria-hidden />
            Stamp & issue invoice
          </Button>
        </ActionCard>
      )}
      {toDisburse.map((e) => (
        <DisburseCard key={e.id} expense={e} currency={order.currency} />
      ))}
    </>
  )
}

function DisburseCard({ expense, currency }: { expense: ExpenseRequest; currency: string }) {
  const { run } = useRpc()
  const [method, setMethod] = useState<'check' | 'transfer'>('transfer')
  const [reference, setReference] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)

  async function disburse(e: React.FormEvent) {
    e.preventDefault()
    if (file && file.size > MAX_RECEIPT_BYTES) return toast.error('Receipt must be 5 MB or smaller.')
    setBusy(true)
    let receiptPath: string | null = null
    if (file) {
      const safeName = file.name.replace(/[^\w.-]+/g, '_').slice(-80)
      receiptPath = `${expense.id}/${Date.now()}-${safeName}`
      const { error } = await createClient().storage.from('receipts').upload(receiptPath, file, { contentType: file.type })
      if (error) {
        toast.error(errorMessage(error))
        setBusy(false)
        return
      }
    }
    await run('accountant_disburse', { p_expense: expense.id, p_method: method, p_reference: reference, p_receipt_path: receiptPath }, 'Funds marked as disbursed')
    setBusy(false)
  }

  return (
    <ActionCard title="Disburse approved budget" description={`${formatMoney(expense.amount, currency)} — ${expense.purpose}`}>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 rounded-md bg-muted p-3 text-sm">
        <dt className="text-muted-foreground">Bank</dt>
        <dd>{expense.bank_name}</dd>
        <dt className="text-muted-foreground">Account name</dt>
        <dd>{expense.account_name}</dd>
        <dt className="text-muted-foreground">Account no.</dt>
        <dd className="font-mono">{expense.account_number}</dd>
      </dl>
      <form onSubmit={disburse} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor={`method-${expense.id}`}>Method</Label>
            <select id={`method-${expense.id}`} className={selectClass} value={method} onChange={(e) => setMethod(e.target.value as 'check' | 'transfer')}>
              <option value="transfer">Bank transfer</option>
              <option value="check">Company check</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`ref-${expense.id}`}>{method === 'check' ? 'Check number' : 'Transfer reference'}</Label>
            <Input id={`ref-${expense.id}`} required maxLength={80} value={reference} onChange={(e) => setReference(e.target.value)} />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={`receipt-${expense.id}`}>Deposit receipt (optional)</Label>
          <Input id={`receipt-${expense.id}`} type="file" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </div>
        <Button type="submit" disabled={busy || !reference.trim()}>
          <Upload aria-hidden />
          {busy ? 'Processing…' : 'Mark funds disbursed'}
        </Button>
      </form>
    </ActionCard>
  )
}
