'use client'

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { usePathname } from 'next/navigation'
export type NotificationsDrawerContextValue = {
  open: () => void
  close: () => void
  isOpen: boolean
  enabled: boolean
}

const NotificationsDrawerContext = createContext<NotificationsDrawerContextValue | null>(null)

export function NotificationsDrawerProvider({
  enabled,
  children,
}: {
  enabled: boolean
  children: React.ReactNode
}) {
  const pathname = usePathname() || '/'
  const [manualOpen, setManualOpen] = useState(false)
  const isNotificationsRoute = pathname === '/notifications'
  const isOpen = enabled && manualOpen

  const open = useCallback(() => {
    if (enabled) setManualOpen(true)
  }, [enabled])

  const close = useCallback(() => {
    setManualOpen(false)
  }, [])

  useEffect(() => {
    if (!enabled) setManualOpen(false)
  }, [enabled])

  useEffect(() => {
    if (isNotificationsRoute) return
    setManualOpen(false)
  }, [pathname, isNotificationsRoute])

  useEffect(() => {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    if (isOpen) {
      root.setAttribute('data-watta-notifications-open', '')
    } else {
      root.removeAttribute('data-watta-notifications-open')
    }
    return () => {
      root.removeAttribute('data-watta-notifications-open')
    }
  }, [isOpen])

  const value = useMemo<NotificationsDrawerContextValue>(
    () => ({
      open,
      close,
      isOpen,
      enabled,
    }),
    [enabled, isOpen, open, close],
  )

  return (
    <NotificationsDrawerContext.Provider value={value}>{children}</NotificationsDrawerContext.Provider>
  )
}

export function useNotificationsDrawer(): NotificationsDrawerContextValue {
  const ctx = useContext(NotificationsDrawerContext)
  if (!ctx) {
    throw new Error('useNotificationsDrawer must be used within NotificationsDrawerProvider')
  }
  return ctx
}

export function useOptionalNotificationsDrawer(): NotificationsDrawerContextValue | null {
  return useContext(NotificationsDrawerContext)
}
