'use client'

import { useSyncExternalStore } from 'react'
import { getLiveCartPieceCount, subscribeCartStorage } from '@/lib/cartStorage'

/** Один підписник на зміни кошика для всієї chrome (шапка, compact cart, FAB). */
export function useLiveCartCount(): number {
  return useSyncExternalStore(
    subscribeCartStorage,
    () => {
      try {
        return getLiveCartPieceCount()
      } catch {
        return 0
      }
    },
    () => 0,
  )
}
