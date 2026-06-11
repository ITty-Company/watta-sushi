'use client'

import { useEffect, useRef } from 'react'
import { useInstantRouter } from '@/hooks/useInstantRouter'
import { useOptionalNotificationsDrawer } from '@/app/context/NotificationsDrawerContext'

/** /notifications — лише відкриває drawer і повертає на попередню сторінку. */
export default function NotificationsPageClient() {
  const router = useInstantRouter()
  const drawer = useOptionalNotificationsDrawer()
  const handled = useRef(false)

  useEffect(() => {
    if (handled.current) return
    handled.current = true
    drawer?.open()
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
      return
    }
    router.replace('/')
  }, [drawer, router])

  return null
}
