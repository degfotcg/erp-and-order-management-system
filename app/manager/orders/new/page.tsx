import { PageHeader } from '@/components/app-shell'
import { OrderForm } from '@/components/orders/order-form'
import { requireRole } from '@/lib/auth'

export const metadata = { title: 'New order' }

export default async function NewOrderPage() {
  const { profile } = await requireRole('manager')
  return (
    <>
      <PageHeader title="New draft order" description="Add line items and estimated costs. Submit for CEO approval when ready." />
      <OrderForm userId={profile.id} />
    </>
  )
}
