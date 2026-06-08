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
import { useInstantRouter } from '@/hooks/useInstantRouter'
import { useWattaNavDrawerOpenSync } from '@/hooks/useWattaNavDrawerOpenSync'

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
  const router = useInstantRouter()
  const [manualOpen, setManualOpen] = useState(false)
  const isNotificationsRoute = pathname === '/notifications'
  const isOpen = enabled && (isNotificationsRoute || manualOpen)

  const open = useCallback(() => {
    if (enabled) setManualOpen(true)
  }, [enabled])

  const close = useCallback(() => {
    setManualOpen(false)
    if (isNotificationsRoute) {
      if (typeof window !== 'undefined' && window.history.length > 1) {
        router.back()
      } else {
        router.push('/')
      }
    }
  }, [isNotificationsRoute, router])

  useEffect(() => {
    if (!enabled) setManualOpen(false)
  }, [enabled])

  useEffect(() => {
    if (isNotificationsRoute) return
    setManualOpen(false)
  }, [pathname, isNotificationsRoute])

  useWattaNavDrawerOpenSync(isOpen)

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
