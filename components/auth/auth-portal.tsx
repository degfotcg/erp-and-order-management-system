'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ROLE_LABELS } from '@/lib/format'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

type Seat = { role: 'ceo' | 'accountant' | 'manager'; full_name: string; is_claimed: boolean }

function describeAuthError(message: string, status?: number) {
  const m = message.toLowerCase()
  if (m.includes('email not confirmed')) return 'Please confirm your email address before signing in.'
  if (m.includes('invalid login credentials')) return 'Invalid email or password.'
  if (m.includes('password')) return message
  if (status === 429 || m.includes('rate limit')) return 'Too many attempts. Please wait a moment and try again.'
  if (m.includes('already registered')) return 'Unable to create this account. Try signing in instead.'
  return 'Unexpected error. Please try again.'
}

export function AuthPortal({ seats }: { seats: Seat[] }) {
  const openSeats = seats.filter((s) => !s.is_claimed)
  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-semibold">Welcome back</h2>
        <p className="text-sm text-muted-foreground">Sign in with your company account.</p>
      </div>
      <Tabs defaultValue="login">
        <TabsList className="w-full">
          <TabsTrigger value="login">Sign in</TabsTrigger>
          <TabsTrigger value="claim" disabled={openSeats.length === 0}>
            Activate seat
          </TabsTrigger>
        </TabsList>
        <TabsContent value="login" className="pt-4">
          <LoginForm />
        </TabsContent>
        <TabsContent value="claim" className="pt-4">
          <ClaimSeatForm seats={seats} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    setError(null)
    const { error } = await createClient().auth.signInWithPassword({ email, password })
    if (error) {
      setError(describeAuthError(error.message, error.status))
      setPending(false)
      return
    }
    router.refresh()
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="login-email">Email</Label>
        <Input id="login-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="login-password">Password</Label>
        <Input id="login-password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  )
}

function ClaimSeatForm({ seats }: { seats: Seat[] }) {
  const router = useRouter()
  const firstOpen = seats.find((s) => !s.is_claimed)?.role
  const [role, setRole] = useState<Seat['role'] | undefined>(firstOpen)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!role) return
    setPending(true)
    setError(null)
    const { error } = await createClient().auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo:
          process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? `${window.location.origin}/auth/callback`,
        data: { requested_role: role },
      },
    })
    if (error) {
      setError(describeAuthError(error.message, error.status))
      setPending(false)
      return
    }
    router.push('/auth/sign-up-success')
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">Choose your company seat</legend>
        {seats.map((seat) => (
          <label
            key={seat.role}
            className={cn(
              'flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-3 text-sm transition-colors',
              role === seat.role ? 'border-primary bg-primary/5' : 'border-border',
              seat.is_claimed && 'cursor-not-allowed opacity-50',
            )}
          >
            <span className="flex items-center gap-3">
              <input
                type="radio"
                name="seat"
                value={seat.role}
                checked={role === seat.role}
                disabled={seat.is_claimed}
                onChange={() => setRole(seat.role)}
                className="accent-primary"
              />
              <span className="flex flex-col">
                <span className="font-medium">{seat.full_name}</span>
                <span className="text-xs text-muted-foreground">{ROLE_LABELS[seat.role]}</span>
              </span>
            </span>
            {seat.is_claimed && <span className="text-xs text-muted-foreground">Activated</span>}
          </label>
        ))}
      </fieldset>
      <div className="flex flex-col gap-2">
        <Label htmlFor="claim-email">Work email</Label>
        <Input id="claim-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="claim-password">Password</Label>
        <Input
          id="claim-password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">At least 8 characters.</p>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" disabled={pending || !role}>
        {pending ? 'Activating…' : 'Activate seat'}
      </Button>
    </form>
  )
}
