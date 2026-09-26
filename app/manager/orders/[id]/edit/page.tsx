import { notFound, redirect } from 'next/navigation'
import { PageHeader } from '@/components/app-shell'
import { OrderForm } from '@/components/orders/order-form'
import { requireRole } from '@/lib/auth'
import { ORDER_LIST_COLUMNS } from '@/lib/queries'
import type { Order } from '@/lib/types'

export const metadata = { title: 'Edit draft' }

export default async function EditOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase, profile } = await requireRole('manager')
  const { data } = await supabase.from('orders').select(ORDER_LIST_COLUMNS).eq('id', id).maybeSingle()
  const order = data as unknown as Order | null
  if (!order) notFound()
  if (order.status !== 'draft' || order.created_by !== profile.id) redirect(`/orders/${id}`)

  return (
    <>
      <PageHeader title={`Edit: ${order.title}`} />
      <OrderForm userId={profile.id} order={order} />
    </>
  )
}
