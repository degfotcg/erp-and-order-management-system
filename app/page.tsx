import { redirect } from 'next/navigation'
import { Building2, FileSignature, Landmark, PackageCheck } from 'lucide-react'
import { AuthPortal } from '@/components/auth/auth-portal'
import { BrandMark } from '@/components/brand-mark'
import { SignOutButton } from '@/components/sign-out-button'
import { getSessionProfile } from '@/lib/auth'

export const dynamic = 'force-dynamic'

type Seat = { role: 'ceo' | 'accountant' | 'manager'; full_name: string; is_claimed: boolean }

// Used when the available_seats RPC is unavailable; the database still decides the final role on sign-up.
const DEFAULT_SEATS: Seat[] = [
  { role: 'ceo', full_name: 'Chief Executive Officer', is_claimed: false },
  { role: 'accountant', full_name: 'Accountant', is_claimed: false },
  { role: 'manager', full_name: 'Operations Manager', is_claimed: false },
]

const WORKFLOW = [
  { icon: Building2, title: 'Draft & quote', body: 'Manager builds orders with line items and cost estimates.' },
  { icon: FileSignature, title: 'Sign & invoice', body: 'CEO signs the quote, Accounts stamps an A4 invoice.' },
  { icon: Landmark, title: 'Verify & disburse', body: 'CEO confirms client payment; Accounts funds operations.' },
  { icon: PackageCheck, title: 'Fulfil & close', body: 'Manager tracks packaging or development to delivery.' },
]

export default async function HomePage() {
  const { supabase, user, profile, rawRole } = await getSessionProfile()

  if (user && profile?.role) redirect(`/${profile.role}`)

  const { data: seatData, error: seatError } = await supabase.rpc('available_seats')
  const seats: Seat[] =
    !seatError && Array.isArray(seatData) && seatData.length > 0
      ? (seatData as Seat[])
      : DEFAULT_SEATS

  return (
    <main className="flex min-h-svh flex-col lg:flex-row">
      <section className="flex flex-col justify-between gap-10 bg-sidebar px-6 py-10 text-sidebar-foreground lg:w-1/2 lg:px-12 lg:py-12">
        <BrandMark inverted />
        <div className="flex max-w-lg flex-col gap-4">
          <p className="text-sm font-medium uppercase tracking-widest text-sidebar-primary">
            Internal operations portal
          </p>
          <h1 className="text-balance text-3xl font-semibold leading-tight lg:text-4xl">
            One ledger from quote to delivery.
          </h1>
          <p className="text-pretty leading-relaxed text-sidebar-foreground/75">
            Approvals, invoicing, payment verification, disbursements and fulfilment for Software
            Development and Import/Export engagements — each step signed off by the right person.
          </p>
        </div>
        <ol className="grid gap-4 sm:grid-cols-2">
          {WORKFLOW.map((step, i) => (
            <li key={step.title} className="flex gap-3 rounded-lg border border-sidebar-border bg-sidebar-accent/60 p-4">
              <step.icon className="mt-0.5 size-5 shrink-0 text-sidebar-primary" aria-hidden />
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold">
                  {i + 1}. {step.title}
                </span>
                <span className="text-sm leading-relaxed text-sidebar-foreground/70">{step.body}</span>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="flex flex-1 items-center justify-center px-6 py-12">
        {user && rawRole ? (
          <div className="flex max-w-sm flex-col gap-4 text-center">
            <h2 className="text-xl font-semibold">Role not recognized</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Your profile ({user.email}) exists, but its role
              {rawRole ? <> &ldquo;<span className="font-medium text-foreground">{rawRole}</span>&rdquo;</> : ' is empty and'}{' '}
              doesn&apos;t match CEO, Operations Manager, or Accountant. Ask an administrator to update it.
            </p>
            <SignOutButton />
          </div>
        ) : user ? (
          <div className="flex max-w-sm flex-col gap-4 text-center">
            <h2 className="text-xl font-semibold">No seat assigned</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Your account ({user.email}) is signed in but isn&apos;t linked to a company role. The
              seat you requested may already have been claimed.
            </p>
            <SignOutButton />
          </div>
        ) : (
          <AuthPortal seats={seats} />
        )}
      </section>
    </main>
  )
}
