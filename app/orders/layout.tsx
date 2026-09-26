import { AppShell } from '@/components/app-shell'
import { requireRole } from '@/lib/auth'

export default async function OrdersLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireRole(['ceo', 'accountant', 'manager'])
  return <AppShell profile={profile}>{children}</AppShell>
}
