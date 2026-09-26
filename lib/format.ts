import type { FulfillmentStage, Order, OrderItem, OrderStatus, Role } from './types'

export const ROLE_LABELS: Record<Role, string> = {
  ceo: 'Chief Executive Officer',
  accountant: 'Accountant',
  manager: 'Operations Manager',
}

export const STATUS_LABELS: Record<OrderStatus, string> = {
  draft: 'Draft',
  pending_approval: 'Awaiting CEO approval',
  approved: 'Approved',
  rejected: 'Rejected',
  invoiced: 'Invoiced',
  in_progress: 'In progress',
  completed: 'Completed',
}

export const STAGE_LABELS: Record<FulfillmentStage, string> = {
  not_started: 'Not started',
  sourcing: 'Sourcing',
  development: 'Development',
  packaging: 'Packaging',
  shipping: 'Shipping',
  qa: 'Quality assurance',
  delivered: 'Delivered',
}

export const ORDER_TYPE_LABELS = {
  Software: 'Software Development',
  Import_Export: 'Import / Export',
} as const

export function formatMoney(value: number | string | null | undefined, currency = 'AED') {
  const n = Number(value ?? 0)
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0)
}

export function formatDate(value: string | null | undefined, withTime = false) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(new Date(value))
}

export function orderRef(order: Pick<Order, 'order_number'>) {
  return `EDL-${String(order.order_number).padStart(5, '0')}`
}

export function computeTotals(items: OrderItem[] = [], taxRate = 0, estimatedCost = 0) {
  const subtotal = items.reduce((sum, i) => sum + Number(i.quantity) * Number(i.unit_price), 0)
  const tax = Math.round(subtotal * (Number(taxRate) / 100) * 100) / 100
  const total = Math.round((subtotal + tax) * 100) / 100
  const margin = subtotal - Number(estimatedCost)
  const marginPct = subtotal > 0 ? (margin / subtotal) * 100 : 0
  return { subtotal, tax, total, margin, marginPct }
}

export function errorMessage(error: unknown) {
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: string }).message)
  }
  return 'Something went wrong. Please try again.'
}
