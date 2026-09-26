import { redirect } from 'next/navigation'
import { createClient } from './supabase/server'
import { normalizeRole } from './roles'
import type { Profile, Role } from './types'

export async function getSessionProfile() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, profile: null }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle<Record<string, unknown>>()

  if (error) console.error('Failed to load profile:', error.message)

  const rawRole = typeof data?.role === 'string' ? data.role : null
  const cleanRole = normalizeRole(rawRole) ?? normalizeRole(user.user_metadata?.role)

  const profile: Profile | null =
    data || cleanRole
      ? {
          id: user.id,
          email: (data?.email as string | null | undefined) ?? user.email ?? null,
          full_name:
            (data?.full_name as string | null | undefined) ??
            (user.user_metadata?.full_name as string | undefined) ??
            null,
          role: cleanRole,
        }
      : null

  return { supabase, user, profile, rawRole }
}

export async function requireRole(allowed: Role | Role[]) {
  const ctx = await getSessionProfile()
  const list = Array.isArray(allowed) ? allowed : [allowed]
  if (!ctx.user || !ctx.profile?.role) redirect('/')
  if (!list.includes(ctx.profile.role)) redirect(`/${ctx.profile.role}`)
  return ctx as typeof ctx & { profile: Profile & { role: Role } }
}
