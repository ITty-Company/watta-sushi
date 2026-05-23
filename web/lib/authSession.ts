/** Клієнтська сесія: token + currentUser, без витоку «привида» адміна для гостей. */

import { clearUserOrdersCache } from '@/lib/userOrdersCache'

export function purgeAuthStorage(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem('token')
    localStorage.removeItem('currentUser')
    localStorage.removeItem('userId')
    clearUserOrdersCache()
  } catch {
    /* ignore */
  }
}

/** Повний вихід з акаунта на клієнті (localStorage + подія для UI). */
export function logoutClientSession(): void {
  purgeAuthStorage()
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('userChanged'))
  }
}

export function isAuthTokenValid(token: string): boolean {
  const t = token.trim()
  if (!t) return false
  const parts = t.split('.')
  if (parts.length !== 3) return true
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
    const payload = JSON.parse(atob(padded)) as { exp?: number }
    if (typeof payload.exp === 'number') {
      return payload.exp * 1000 > Date.now()
    }
    return true
  } catch {
    return true
  }
}

export function sanitizeAuthStorage(): void {
  if (typeof window === 'undefined') return
  const token = localStorage.getItem('token')
  const user = localStorage.getItem('currentUser')
  const hasToken = typeof token === 'string' && token.trim().length > 0
  if (!hasToken) {
    const orphanUserId = localStorage.getItem('userId')
    if (user || orphanUserId) purgeAuthStorage()
    return
  }
  if (!isAuthTokenValid(token)) {
    purgeAuthStorage()
    return
  }
  if (!user?.trim() || user === 'null') {
    purgeAuthStorage()
  }
}
