'use client'

import { useLayoutEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { openWattaAuth, parseAuthModalFromHref } from '@/lib/openWattaAuth'
import { isWattaAuthPathname } from '@/lib/wattaHtmlRouteClass'

/**
 * /login та /register — лише deep-link: відкриваємо модалку і повертаємо URL
 * на попередню сторінку (без окремого екрану входу).
 */
export function AuthPageLoader({ mode }: { mode: 'login' | 'register' }) {
  const searchParams = useSearchParams()

  useLayoutEffect(() => {
    const path = window.location.pathname || '/'
    if (!isWattaAuthPathname(path)) return

    const returnRaw = searchParams.get('return') || searchParams.get('next') || '/'
    const returnUrl = returnRaw.startsWith('/') ? returnRaw : '/'
    const parsed =
      parseAuthModalFromHref(`${path}${window.location.search}`) ?? {
        returnUrl,
        register: mode === 'register',
      }

    openWattaAuth(parsed)

    const clean =
      parsed.returnUrl &&
      parsed.returnUrl !== '/login' &&
      parsed.returnUrl !== '/register'
        ? parsed.returnUrl
        : '/'
    window.history.replaceState(window.history.state, '', clean)

    document.body.classList.remove('watta-auth-route')
  }, [mode, searchParams])

  return null
}
