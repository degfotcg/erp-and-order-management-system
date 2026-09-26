import { NextResponse, type NextRequest } from 'next/server'
import { normalizeRole } from '@/lib/roles'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    const reason = searchParams.get('error_description') ?? 'Missing confirmation code'
    return NextResponse.redirect(`${origin}/auth/error?error=${encodeURIComponent(reason)}`)
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)
  if (error || !data.user) {
    const reason = error?.message ?? 'Could not confirm your email'
    return NextResponse.redirect(`${origin}/auth/error?error=${encodeURIComponent(reason)}`)
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .maybeSingle<{ role: string | null }>()

  const role = normalizeRole(profile?.role) ?? normalizeRole(data.user.user_metadata?.role)
  const destination = role ? `/${role}` : '/'

  return NextResponse.redirect(`${origin}${destination}`)
}
