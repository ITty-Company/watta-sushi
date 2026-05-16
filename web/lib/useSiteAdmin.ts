'use client'

import { useEffect, useState } from 'react'
import { sanitizeAuthStorage } from '@/lib/authSession'
import { readIsSiteAdminFromStorage } from '@/lib/isAdminRole'

/** Адмін-панель у UI — лише після перевірки сесії на клієнті (не для гостей). */
export function useSiteAdmin(): boolean {
  const [checked, setChecked] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const sync = () => {
      try {
        sanitizeAuthStorage()
        setIsAdmin(readIsSiteAdminFromStorage())
      } catch {
        setIsAdmin(false)
      } finally {
        setChecked(true)
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

  return checked && isAdmin
}
