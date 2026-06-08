'use client'

import { usePathname } from 'next/navigation'
import { useSyncExternalStore } from 'react'
import {
  readInternalNavBackAvailable,
  subscribeInternalNavBack,
} from '@/lib/wattaInternalNavBack'

/** Чи був SPA-перехід з іншої сторінки сайту (не перший захід і не reload). */
export function useCanGoBack(): boolean {
  const pathname = usePathname()
  return useSyncExternalStore(
    subscribeInternalNavBack,
    () => {
      void pathname
      return readInternalNavBackAvailable()
    },
    () => false,
  )
}
