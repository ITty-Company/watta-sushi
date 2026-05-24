'use client'

import { useLayoutEffect } from 'react'
import AuthScreen from './AuthScreen'
import { isWattaAuthPathname } from '@/lib/wattaHtmlRouteClass'

/** Блокує скрол document на /login і /register (страховка поверх CSS). */
function useAuthPageScrollLock() {
  useLayoutEffect(() => {
    const path = window.location.pathname || '/'
    if (!isWattaAuthPathname(path)) return

    document.body.classList.add('watta-auth-route')
    const html = document.documentElement
    const prevHtmlOverflow = html.style.overflow
    const prevBodyOverflow = document.body.style.overflow
    html.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'

    return () => {
      html.style.overflow = prevHtmlOverflow
      document.body.style.overflow = prevBodyOverflow
      if (!isWattaAuthPathname(window.location.pathname || '/')) {
        document.body.classList.remove('watta-auth-route')
      }
    }
  }, [])
}

export function AuthPageLoader({ mode }: { mode: 'login' | 'register' }) {
  useAuthPageScrollLock()
  return <AuthScreen variant="page" initialRegister={mode === 'register'} />
}
