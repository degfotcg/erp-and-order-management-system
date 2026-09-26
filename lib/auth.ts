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

  const { data } = await supabase
    .from('profiles')
    .select('id, email, full_name, role')
    .eq('id', user.id)
    .maybeSingle<Omit<Profile, 'role'> & { role: string | null }>()

  const profile: Profile | null = data
    ? { ...data, role: normalizeRole(data.role) ?? normalizeRole(user.user_metadata?.role) }
    : null

  return { supabase, user, profile, rawRole: data?.role ?? null }
}

export async function requireRole(allowed: Role | Role[]) {
  const ctx = await getSessionProfile()
  const list = Array.isArray(allowed) ? allowed : [allowed]
  if (!ctx.user || !ctx.profile?.role) redirect('/')
  if (!list.includes(ctx.profile.role)) redirect(`/${ctx.profile.role}`)
  return ctx as typeof ctx & { profile: Profile & { role: Role } }
}
