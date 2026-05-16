import { isAuthTokenValid, purgeAuthStorage } from '@/lib/authSession'

/** True if stored/API user payload marks site administrator (case-insensitive). */
export function isAdminRole(role: unknown): boolean {
  if (role == null || typeof role !== 'string') return false
  return role.trim().toUpperCase() === 'ADMIN'
}

type StoredUserPayload = {
  role?: unknown
  id?: unknown
  email?: unknown
}

function parseStoredUser(raw: string | null): StoredUserPayload | null {
  if (!raw || !raw.trim() || raw === 'null' || raw === 'undefined') return null
  try {
    const p = JSON.parse(raw) as StoredUserPayload
    if (p == null || typeof p !== 'object' || Array.isArray(p)) return null
    return p
  } catch {
    return null
  }
}

function hasLoggedInUserIdentity(user: StoredUserPayload): boolean {
  if (typeof user.id === 'number' && Number.isFinite(user.id) && user.id > 0) return true
  if (typeof user.id === 'string' && user.id.trim().length > 0) return true
  if (typeof user.email === 'string' && user.email.trim().length > 0) return true
  return false
}

/** ADMIN у збереженому currentUser (без перевірки сесії). */
export function readIsAdminFromCurrentUserJson(raw: string | null): boolean {
  const user = parseStoredUser(raw)
  if (!user || !hasLoggedInUserIdentity(user)) return false
  return isAdminRole(user.role)
}

/** Користувач увійшов: валідний token + currentUser з id/email. */
export function readIsLoggedInFromStorage(): boolean {
  if (typeof window === 'undefined') return false
  const token = localStorage.getItem('token')
  if (typeof token !== 'string' || !token.trim() || !isAuthTokenValid(token)) {
    if (token || localStorage.getItem('currentUser')) purgeAuthStorage()
    return false
  }
  const user = parseStoredUser(localStorage.getItem('currentUser'))
  if (!user || !hasLoggedInUserIdentity(user)) {
    purgeAuthStorage()
    return false
  }
  return true
}

/** Адмін: активна сесія + role === ADMIN. */
export function readIsSiteAdminFromStorage(): boolean {
  if (!readIsLoggedInFromStorage()) return false
  return readIsAdminFromCurrentUserJson(localStorage.getItem('currentUser'))
}
