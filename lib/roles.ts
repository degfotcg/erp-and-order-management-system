import type { Role } from './types'

const ROLE_ALIASES: Record<string, Role> = {
  ceo: 'ceo',
  'chief executive officer': 'ceo',
  manager: 'manager',
  'operations manager': 'manager',
  accountant: 'accountant',
}

export function normalizeRole(raw: unknown): Role | null {
  if (typeof raw !== 'string') return null
  const key = raw.trim().toLowerCase().replace(/[\s_-]+/g, ' ')
  return ROLE_ALIASES[key] ?? null
}
