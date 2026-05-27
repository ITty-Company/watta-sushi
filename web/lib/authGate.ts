import { getBearerAuthHeaders } from '@/lib/authHeaders'
import {
  sanitizeAuthStorage,
  isUserLoggedIn,
} from '@/lib/authSession'

export { isUserLoggedIn } from '@/lib/authSession'

export type AuthRedirectMode = 'login' | 'register'

/** Чи є валідна сесія (token + currentUser). */
// export function isUserLoggedIn(): boolean {
//   if (typeof window === 'undefined') return false
//   sanitizeAuthStorage()
//   const user = localStorage.getItem('currentUser')
//   if (!user?.trim() || user === 'null') return false
//   const token = localStorage.getItem('token')
//   if (!token?.trim() || !isUserLoggedIn) return false
//   const auth = getBearerAuthHeaders()
//   return Object.keys(auth as Record<string, string>).length > 0
// }

export function getCurrentReturnPath(): string {
  if (typeof window === 'undefined') return '/'
  const path = window.location.pathname + window.location.search
  return path.startsWith('/') ? path : '/'
}

export function getAuthUrl(
  returnPath: string,
  mode: AuthRedirectMode = 'login',
): string {
  const safe = returnPath.startsWith('/') ? returnPath : '/'
  const base = mode === 'register' ? '/register' : '/login'
  return `${base}?return=${encodeURIComponent(safe)}`
}

type RouterPush = { push: (href: string) => void }

export function redirectToAuth(
  router: RouterPush,
  returnPath?: string,
  mode: AuthRedirectMode = 'login',
): void {
  const dest = returnPath ?? getCurrentReturnPath()
  router.push(getAuthUrl(dest, mode))
}

/** Якщо гість — редирект на вхід; повертає true лише для залогіненого. */
export function requireAuth(
  router: RouterPush,
  returnPath?: string,
): boolean {
  if (isUserLoggedIn()) return true
  redirectToAuth(router, returnPath)
  return false
}
