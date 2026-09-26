import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { PageHeader } from '@/components/app-shell'
import { AccountantActions } from '@/components/orders/accountant-actions'
import { CeoActions } from '@/components/orders/ceo-actions'
import { ManagerActions } from '@/components/orders/manager-actions'
import { OrderChat } from '@/components/orders/order-chat'
import { OrderExpenses } from '@/components/orders/order-expenses'
import { OrderOverview } from '@/components/orders/order-overview'
import { OrderSignatures } from '@/components/orders/order-signatures'
import { OrderSummary } from '@/components/orders/order-summary'
import { PaymentBadge, StatusBadge } from '@/components/orders/status-badge'
import { buttonVariants } from '@/components/ui/button'
import { requireRole } from '@/lib/auth'
import { computeTotals, orderRef } from '@/lib/format'
import { getOrderDetail } from '@/lib/queries'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const metadata: Metadata = { title: 'Order details' }

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!UUID_RE.test(id)) notFound()

  const { supabase, profile } = await requireRole(['ceo', 'accountant', 'manager'])
  const detail = await getOrderDetail(supabase, id)
  if (!detail) notFound()

  const { order, expenses, messages, names } = detail
  const totals = computeTotals(order.order_items, order.tax_rate, order.estimated_cost)

  return (
    <>
      <Link href={`/${profile.role}`} className={buttonVariants({ variant: 'ghost', size: 'sm', className: 'self-start' })}>
        <ArrowLeft aria-hidden />
        Back to dashboard
      </Link>

      <PageHeader
        title={order.title}
        description={`${orderRef(order)} · ${order.client_name}`}
        actions={
          <>
            <StatusBadge status={order.status} />
            <PaymentBadge status={order.payment_status} />
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <OrderOverview order={order} createdByName={names[order.created_by]} />
          <OrderSummary order={order} totals={totals} />
          <OrderSignatures order={order} />
          <OrderExpenses expenses={expenses} currency={order.currency} names={names} />
        </div>

        <aside aria-label="Actions" className="flex flex-col gap-4">
          {profile.role === 'ceo' && <CeoActions order={order} total={totals.total} expenses={expenses} />}
          {profile.role === 'accountant' && <AccountantActions order={order} expenses={expenses} />}
          {profile.role === 'manager' && <ManagerActions order={order} expenses={expenses} userId={profile.id} />}
          <OrderChat orderId={order.id} userId={profile.id} names={names} initial={messages} />
        </aside>
      </div>
    </>
  )
}
