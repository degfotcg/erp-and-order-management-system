import Link from 'next/link'
import { BrandMark } from '@/components/brand-mark'
import { NavLinks } from '@/components/nav-links'
import { SignOutButton } from '@/components/sign-out-button'
import { ROLE_LABELS } from '@/lib/format'
import type { Profile, Role } from '@/lib/types'

const NAV: Record<Role, { href: string; label: string }[]> = {
  ceo: [{ href: '/ceo', label: 'Executive overview' }],
  accountant: [{ href: '/accountant', label: 'Accounts & ledger' }],
  manager: [
    { href: '/manager', label: 'My orders' },
    { href: '/manager/orders/new', label: 'New order' },
  ],
}

export function AppShell({ profile, children }: { profile: Profile & { role: Role }; children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-30 border-b border-sidebar-border bg-sidebar text-sidebar-foreground print:hidden">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 lg:px-6">
          <div className="flex items-center gap-8">
            <Link href={`/${profile.role}`} aria-label="Dashboard home">
              <BrandMark inverted />
            </Link>
            <nav aria-label="Main" className="hidden md:block">
              <NavLinks links={NAV[profile.role]} />
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden flex-col items-end leading-tight sm:flex">
              <span className="text-sm font-medium">{profile.full_name}</span>
              <span className="text-xs text-sidebar-foreground/60">{ROLE_LABELS[profile.role]}</span>
            </div>
            <SignOutButton compact />
          </div>
        </div>
        <nav aria-label="Main mobile" className="border-t border-sidebar-border px-4 py-2 md:hidden">
          <NavLinks links={NAV[profile.role]} />
        </nav>
      </header>
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 lg:px-6">{children}</main>
    </div>
  )
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-1">
        <h1 className="text-balance text-2xl font-semibold">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}
