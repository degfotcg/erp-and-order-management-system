import type { Role } from './types'

export function normalizeRole(value: unknown): Role | null {
  const raw = (typeof value === 'string' ? value : '').toLowerCase()
  if (raw.includes('ceo') || raw.includes('chief executive')) return 'ceo'
  if (raw.includes('account')) return 'accountant'
  if (raw.includes('manager')) return 'manager'
  return null
}
