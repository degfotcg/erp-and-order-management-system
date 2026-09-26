import type { SupabaseClient } from '@supabase/supabase-js'
import type { ExpenseRequest, LedgerEntry, Order } from './types'

export const ORDER_LIST_COLUMNS =
  'id, order_number, title, client_name, client_email, client_address, order_type, status, currency, estimated_cost, tax_rate, notes, rejection_reason, created_by, ceo_signed_at, accountant_signed_at, invoice_number, invoice_issued_at, payment_status, amount_received, payment_verified_at, fulfillment_stage, progress, completed_at, created_at, updated_at, order_items(id, order_id, description, quantity, unit_price)'

export async function listOrders(supabase: SupabaseClient) {
  const { data } = await supabase.from('orders').select(ORDER_LIST_COLUMNS).order('updated_at', { ascending: false })
  return (data ?? []) as unknown as Order[]
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
