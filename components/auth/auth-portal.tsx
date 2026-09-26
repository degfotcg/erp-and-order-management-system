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
  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-semibold">Welcome back</h2>
        <p className="text-sm text-muted-foreground">Sign in with your company account.</p>
      </div>
      <Tabs defaultValue="login">
        <TabsList className="w-full">
          <TabsTrigger value="login">Sign in</TabsTrigger>
          <TabsTrigger value="claim">Activate seat</TabsTrigger>
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
  const [step, setStep] = useState<'register' | 'verify'>('register')
  const [email, setEmail] = useState('')

  if (seats.every((s) => s.is_claimed) && step === 'register') {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm leading-relaxed text-muted-foreground">
          All company seats are already activated. If you started activation earlier, enter the code
          from your email below.
        </p>
        <VerifyCodeForm email={email} onEmailChange={setEmail} editableEmail />
      </div>
    )
  }

  if (step === 'verify') {
    return (
      <VerifyCodeForm
        email={email}
        onEmailChange={setEmail}
        onBack={() => setStep('register')}
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <RegisterSeatForm
        seats={seats}
        email={email}
        onEmailChange={setEmail}
        onRegistered={() => setStep('verify')}
      />
      <button
        type="button"
        onClick={() => setStep('verify')}
        className="self-center text-sm font-medium text-primary underline-offset-4 hover:underline"
      >
        Already have an activation code?
      </button>
    </div>
  )
}

function emailRedirect() {
  return process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? `${window.location.origin}/auth/callback`
}

function RegisterSeatForm({
  seats,
  email,
  onEmailChange,
  onRegistered,
}: {
  seats: Seat[]
  email: string
  onEmailChange: (v: string) => void
  onRegistered: () => void
}) {
  const router = useRouter()
  const firstOpen = seats.find((s) => !s.is_claimed)?.role
  const [role, setRole] = useState<Seat['role'] | undefined>(firstOpen)
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!role) return
    setPending(true)
    setError(null)
    const { data, error } = await createClient().auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: emailRedirect(),
        data: { requested_role: role },
      },
    })
    setPending(false)
    if (error) {
      setError(describeAuthError(error.message, error.status))
      return
    }
    if (data.session) {
      router.refresh()
      return
    }
    onRegistered()
  }

  const setEmail = onEmailChange

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

function VerifyCodeForm({
  email,
  onEmailChange,
  onBack,
  editableEmail = false,
}: {
  email: string
  onEmailChange: (v: string) => void
  onBack?: () => void
  editableEmail?: boolean
}) {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [editing, setEditing] = useState(editableEmail || !email)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [resending, setResending] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    setError(null)
    setNotice(null)
    const { error } = await createClient().auth.verifyOtp({
      email,
      token: code.trim(),
      type: 'signup',
    })
    if (error) {
      setPending(false)
      const m = error.message.toLowerCase()
      setError(
        m.includes('expired') || m.includes('invalid')
          ? 'That code is invalid or has expired. Request a new one below.'
          : describeAuthError(error.message, error.status),
      )
      return
    }
    router.refresh()
  }

  async function onResend() {
    if (!email) {
      setError('Enter your work email first.')
      return
    }
    setResending(true)
    setError(null)
    setNotice(null)
    const { error } = await createClient().auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: emailRedirect() },
    })
    setResending(false)
    if (error) {
      setError(describeAuthError(error.message, error.status))
      return
    }
    setNotice(`A new activation email was sent to ${email}.`)
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h3 className="font-semibold">Verify your email</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {editing
            ? 'Enter the email you registered with and the code from your activation email.'
            : (
              <>
                We sent an activation email to <span className="font-medium text-foreground">{email}</span>.
                Click the link in it, or enter the code below.
              </>
            )}
        </p>
      </div>
      {editing ? (
        <div className="flex flex-col gap-2">
          <Label htmlFor="verify-email">Work email</Label>
          <Input
            id="verify-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="self-start text-xs font-medium text-primary underline-offset-4 hover:underline"
        >
          Use a different email
        </button>
      )}
      <div className="flex flex-col gap-2">
        <Label htmlFor="verify-code">Activation code</Label>
        <Input
          id="verify-code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6,10}"
          maxLength={10}
          placeholder="123456"
          required
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          className="font-mono tracking-[0.3em]"
        />
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="text-sm text-primary">
          {notice}
        </p>
      )}
      <Button type="submit" size="lg" disabled={pending || code.length < 6}>
        {pending ? 'Verifying…' : 'Verify and continue'}
      </Button>
      <div className="flex items-center justify-between gap-2 text-sm">
        {onBack ? (
          <button type="button" onClick={onBack} className="text-muted-foreground hover:text-foreground">
            Back
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={onResend}
          disabled={resending}
          className="font-medium text-primary underline-offset-4 hover:underline disabled:opacity-50"
        >
          {resending ? 'Sending…' : 'Resend email'}
        </button>
      </div>
    </form>
  )
}
