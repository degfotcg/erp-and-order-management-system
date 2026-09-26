import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { SUPABASE_ANON_KEY, SUPABASE_URL, cookieOptions } from './config'

const ROLE_ROUTES: Record<string, string> = {
  '/ceo': 'ceo',
  '/accountant': 'accountant',
  '/manager': 'manager',
}

const PROTECTED_PREFIXES = ['/ceo', '/accountant', '/manager', '/orders', '/invoice']

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookieOptions,
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        )
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const isProtected = PROTECTED_PREFIXES.some(
    (p) => path === p || path.startsWith(`${p}/`),
  )

  if (!isProtected) return response

  const redirectTo = (pathname: string) => {
    const url = request.nextUrl.clone()
    url.pathname = pathname
    url.search = ''
    const redirect = NextResponse.redirect(url)
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c))
    return redirect
  }

  if (!user) return redirectTo('/')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  const role = profile?.role as string | null | undefined
  if (!role) return redirectTo('/')

  for (const [prefix, required] of Object.entries(ROLE_ROUTES)) {
    if ((path === prefix || path.startsWith(`${prefix}/`)) && role !== required) {
      return redirectTo(`/${role}`)
    }
  }

  if ((path === '/invoice' || path.startsWith('/invoice/')) && role === 'manager') {
    return redirectTo('/manager')
  }

  return response
}
