'use client'

import { useMemo, useSyncExternalStore } from 'react'
import {
  getCartRevision,
  readCartFromStorage,
  subscribeCartStorage,
  type CartStorageLine,
} from '@/lib/cartStorage'

const EMPTY_CART_LINES: CartStorageLine[] = []

/** Рядки кошика — оновлюється після кожного writeCartToStorage (revision). */
export function useCartLinesSnapshot(): CartStorageLine[] {
  const revision = useSyncExternalStore(
    subscribeCartStorage,
    getCartRevision,
    () => 0,
  )
  return useMemo(() => readCartFromStorage(), [revision])
}
