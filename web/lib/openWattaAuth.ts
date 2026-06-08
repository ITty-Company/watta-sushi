import { getCurrentReturnPath, type AuthRedirectMode } from '@/lib/authGate'

export type OpenWattaAuthOptions = {
  returnUrl?: string
  register?: boolean
  /** Після успішного входу (наприклад, оновити кошик). */
  onSuccess?: () => void
}

type OpenWattaAuthImpl = (options: OpenWattaAuthOptions) => void

let openAuthModalImpl: OpenWattaAuthImpl | null = null

export function registerWattaAuthModalOpener(impl: OpenWattaAuthImpl | null): void {
  openAuthModalImpl = impl
}

function normalizeReturnUrl(path: string): string {
  const safe = path.startsWith('/') ? path : '/'
  if (safe === '/login' || safe === '/register') return '/'
  return safe
}

/** Відкриває модалку входу поверх поточної сторінки (без /login URL). */
export function openWattaAuth(options: OpenWattaAuthOptions = {}): boolean {
  if (typeof window === 'undefined' || !openAuthModalImpl) return false
  openAuthModalImpl({
    returnUrl: normalizeReturnUrl(options.returnUrl ?? getCurrentReturnPath()),
    register: options.register ?? false,
  })
  return true
}

export function parseAuthModalFromHref(href: string): OpenWattaAuthOptions | null {
  const full = href.split('#')[0]?.trim() ?? ''
  const [path, query = ''] = full.split('?')
  if (path !== '/login' && path !== '/register') return null
  const params = new URLSearchParams(query)
  const rawReturn = params.get('return') || params.get('next') || getCurrentReturnPath()
  return {
    returnUrl: normalizeReturnUrl(rawReturn),
    register: path === '/register',
  }
}

/** Перехоплення навігації на /login|/register — модалка замість нової сторінки. */
export function tryOpenAuthModalFromHref(href: string): boolean {
  const parsed = parseAuthModalFromHref(href)
  if (!parsed) return false
  return openWattaAuth(parsed)
}

export function authHrefToModalOptions(
  returnPath: string,
  mode: AuthRedirectMode = 'login',
): OpenWattaAuthOptions {
  return {
    returnUrl: normalizeReturnUrl(returnPath),
    register: mode === 'register',
  }
}
