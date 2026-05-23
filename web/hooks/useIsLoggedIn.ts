'use client'

import { useEffect, useState } from 'react'
import { sanitizeAuthStorage } from '@/lib/authSession'
import { readIsLoggedInFromStorage } from '@/lib/isAdminRole'

/** Чи увійшов користувач (синхронізується після login/register/logout). */
export function useIsLoggedIn(): boolean {
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    const sync = () => {
      try {
        sanitizeAuthStorage()
        setLoggedIn(readIsLoggedInFromStorage())
      } catch {
        setLoggedIn(false)
      }
    }
    sync()
    window.addEventListener('userChanged', sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener('userChanged', sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  return loggedIn
}
