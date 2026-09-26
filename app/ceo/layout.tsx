import { AppShell } from '@/components/app-shell'
import { requireRole } from '@/lib/auth'

export default async function CeoLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireRole('ceo')
  return <AppShell profile={profile}>{children}</AppShell>
}
