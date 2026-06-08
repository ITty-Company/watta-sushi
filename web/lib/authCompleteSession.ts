import { syncFavoritesAfterAuth } from '@/lib/favoritesStorage'

export type AuthSessionPayload = {
  token?: string
  user?: { id?: number; email?: string; name?: string; phone?: string; role?: string }
}

const AUTH_COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 30

function setClientAuthCookie() {
  if (typeof document === 'undefined') return
  const secure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `is_logged_in=true; path=/; max-age=${AUTH_COOKIE_MAX_AGE_SEC}; SameSite=Lax${secure}`
}

/** Зберегти сесію після login / verify (localStorage + cookie + подія). */
export async function completeAuthSession(data: AuthSessionPayload) {
  if (typeof window !== 'undefined' && data.token) {
    localStorage.setItem('token', data.token)
    localStorage.setItem('currentUser', JSON.stringify(data.user))
    if (data.user?.id != null) {
      localStorage.setItem('userId', String(data.user.id))
    }
    setClientAuthCookie()
  }
  window.dispatchEvent(new Event('userChanged'))
  await syncFavoritesAfterAuth()
}
