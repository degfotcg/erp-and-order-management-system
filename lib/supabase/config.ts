// Publishable (anon) credentials are safe to ship to the browser; RLS enforces access.
// Fallbacks keep the app running when Vercel env vars are not configured.
const FALLBACK_SUPABASE_URL = 'https://teolwmwpabmszeqaxocj.supabase.co'
const FALLBACK_SUPABASE_ANON_KEY = 'sb_publishable_AErRr11DZ_DV9uSZhsv1kA_TVQa5hso'

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  FALLBACK_SUPABASE_ANON_KEY

export const cookieOptions = {
  secure: process.env.NODE_ENV === 'production',
}
