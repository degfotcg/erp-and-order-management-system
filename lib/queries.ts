import type { SupabaseClient } from '@supabase/supabase-js'
import type { ExpenseRequest, LedgerEntry, Order, OrderMessage, Profile } from './types'

export const ORDER_LIST_COLUMNS =
  'id, order_number, title, client_name, client_email, client_address, order_type, status, currency, estimated_cost, tax_rate, notes, rejection_reason, created_by, ceo_signed_at, accountant_signed_at, invoice_number, invoice_issued_at, payment_status, amount_received, payment_verified_at, fulfillment_stage, progress, completed_at, created_at, updated_at, order_items(id, order_id, description, quantity, unit_price)'

export async function listOrders(supabase: SupabaseClient) {
  const { data } = await supabase.from('orders').select(ORDER_LIST_COLUMNS).order('updated_at', { ascending: false })
  return (data ?? []) as unknown as Order[]
}

const EXPENSE_COLUMNS =
  'id, order_id, requested_by, amount, purpose, bank_name, account_name, account_number, status, ceo_decided_at, disbursement_method, disbursement_reference, receipt_path, disbursed_at, acknowledged_at, created_at'

export async function getOrderDetail(supabase: SupabaseClient, id: string) {
  let { data: orderData, error: orderError } = await supabase
    .from('orders')
    .select(`${ORDER_LIST_COLUMNS}, ceo_signature, accountant_signature`)
    .eq('id', id)
    .maybeSingle()

  // Undefined column (42703): the signature columns are missing in this database, so load the order without them.
  if (orderError?.code === '42703') {
    console.error('[orders] signature columns missing, retrying without them:', orderError.message)
    ;({ data: orderData, error: orderError } = await supabase
      .from('orders')
      .select(ORDER_LIST_COLUMNS)
      .eq('id', id)
      .maybeSingle())
  }
  if (orderError) {
    console.error('[orders] failed to load order', id, orderError.code, orderError.message)
  }

  const order = orderData as unknown as Order | null
  if (!order) return null

  const [{ data: expenseData }, { data: messageData }] = await Promise.all([
    supabase.from('expense_requests').select(EXPENSE_COLUMNS).eq('order_id', id).order('created_at', { ascending: false }),
    supabase.from('order_messages').select('id, order_id, sender_id, body, kind, created_at').eq('order_id', id).order('created_at', { ascending: true }),
  ])
  const expenses = (expenseData ?? []) as ExpenseRequest[]
  const messages = (messageData ?? []) as OrderMessage[]

  const userIds = [...new Set([order.created_by, ...expenses.map((e) => e.requested_by), ...messages.map((m) => m.sender_id)])]
  const { data: people } = await supabase.from('profiles').select('id, full_name, email').in('id', userIds)
  const names: Record<string, string> = {}
  for (const p of (people ?? []) as Pick<Profile, 'id' | 'full_name' | 'email'>[]) {
    names[p.id] = p.full_name || p.email || 'Team member'
  }

  return { order, expenses, messages, names }
}

export type ExpenseWithOrder = ExpenseRequest & {
  orders: { id: string; title: string; order_number: number; currency: string } | null
}

export async function listExpenses(supabase: SupabaseClient) {
  const { data } = await supabase
    .from('expense_requests')
    .select(
      'id, order_id, requested_by, amount, purpose, bank_name, account_name, account_number, status, ceo_decided_at, disbursement_method, disbursement_reference, receipt_path, disbursed_at, acknowledged_at, created_at, orders(id, title, order_number, currency)',
    )
    .order('created_at', { ascending: false })
  return (data ?? []) as unknown as ExpenseWithOrder[]
}

export async function listLedger(supabase: SupabaseClient) {
  const { data } = await supabase
    .from('ledger_entries')
    .select('id, order_id, expense_id, entry_type, amount, description, reference, created_at')
    .order('created_at', { ascending: false })
  return (data ?? []) as LedgerEntry[]
}

export function ledgerTotals(entries: LedgerEntry[]) {
  const credits = entries.filter((e) => e.entry_type === 'credit').reduce((s, e) => s + Number(e.amount), 0)
  const debits = entries.filter((e) => e.entry_type === 'debit').reduce((s, e) => s + Number(e.amount), 0)
  return { credits, debits, balance: credits - debits }
}
