import { STATUS_LABELS } from '@/lib/format'
import type { ExpenseStatus, OrderStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

const TONE: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  pending_approval: 'bg-accent text-accent-foreground',
  pending: 'bg-accent text-accent-foreground',
  approved: 'bg-primary/10 text-primary',
  invoiced: 'bg-chart-3/15 text-chart-3',
  in_progress: 'bg-chart-3/15 text-chart-3',
  disbursed: 'bg-chart-3/15 text-chart-3',
  completed: 'bg-primary text-primary-foreground',
  acknowledged: 'bg-primary text-primary-foreground',
  rejected: 'bg-destructive/10 text-destructive',
}

const EXPENSE_LABELS: Record<ExpenseStatus, string> = {
  pending: 'Awaiting CEO',
  approved: 'Approved — to disburse',
  rejected: 'Declined',
  disbursed: 'Disbursed',
  acknowledged: 'Received',
}

export function StatusBadge({ status, kind = 'order' }: { status: OrderStatus | ExpenseStatus; kind?: 'order' | 'expense' }) {
  const label =
    kind === 'expense' ? EXPENSE_LABELS[status as ExpenseStatus] : STATUS_LABELS[status as OrderStatus]
  return (
    <span className={cn('inline-flex h-6 items-center rounded-full px-2.5 text-xs font-medium', TONE[status])}>
      {label}
    </span>
  )
}

export function PaymentBadge({ status }: { status: 'unpaid' | 'half' | 'full' }) {
  const map = {
    unpaid: ['Unpaid', 'bg-muted text-muted-foreground'],
    half: ['50% received', 'bg-accent text-accent-foreground'],
    full: ['Paid in full', 'bg-primary/10 text-primary'],
  } as const
  const [label, tone] = map[status]
  return <span className={cn('inline-flex h-6 items-center rounded-full px-2.5 text-xs font-medium', tone)}>{label}</span>
}
