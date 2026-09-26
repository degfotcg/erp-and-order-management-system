export type Role = 'ceo' | 'accountant' | 'manager'

export type OrderStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'invoiced'
  | 'in_progress'
  | 'completed'

export type FulfillmentStage =
  | 'not_started'
  | 'sourcing'
  | 'development'
  | 'packaging'
  | 'shipping'
  | 'qa'
  | 'delivered'

export type ExpenseStatus = 'pending' | 'approved' | 'rejected' | 'disbursed' | 'acknowledged'

export interface Profile {
  id: string
  email: string | null
  full_name: string | null
  role: Role | null
}

export interface OrderItem {
  id: string
  order_id: string
  description: string
  quantity: number
  unit_price: number
}

export interface Order {
  id: string
  order_number: number
  title: string
  client_name: string
  client_email: string | null
  client_address: string | null
  order_type: 'Software' | 'Import_Export'
  status: OrderStatus
  currency: string
  estimated_cost: number
  tax_rate: number
  notes: string | null
  rejection_reason: string | null
  created_by: string
  ceo_signature: string | null
  ceo_signed_at: string | null
  accountant_signature: string | null
  accountant_signed_at: string | null
  invoice_number: string | null
  invoice_issued_at: string | null
  payment_status: 'unpaid' | 'half' | 'full'
  amount_received: number
  payment_verified_at: string | null
  fulfillment_stage: FulfillmentStage
  progress: number
  completed_at: string | null
  created_at: string
  updated_at: string
  order_items?: OrderItem[]
}

export interface ExpenseRequest {
  id: string
  order_id: string
  requested_by: string
  amount: number
  purpose: string
  bank_name: string
  account_name: string
  account_number: string
  status: ExpenseStatus
  ceo_decided_at: string | null
  disbursement_method: 'check' | 'transfer' | null
  disbursement_reference: string | null
  receipt_path: string | null
  disbursed_at: string | null
  acknowledged_at: string | null
  created_at: string
}

export interface LedgerEntry {
  id: string
  order_id: string | null
  expense_id: string | null
  entry_type: 'credit' | 'debit'
  amount: number
  description: string
  reference: string | null
  created_at: string
}

export interface OrderMessage {
  id: string
  order_id: string
  sender_id: string
  body: string
  kind: 'message' | 'system' | 'bank_details'
  created_at: string
}
