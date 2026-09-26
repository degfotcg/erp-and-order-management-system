import { AppShell } from '@/components/app-shell'
import { requireRole } from '@/lib/auth'

export default async function AccountantLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireRole('accountant')
  return <AppShell profile={profile}>{children}</AppShell>
}
