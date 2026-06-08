'use client'

import { useSyncExternalStore } from 'react'
import { getCartLineQuantity, subscribeCartStorage } from '@/lib/cartStorage'

/** O(1) quantity for one product — без окремого addEventListener на кожну картку. */
export function useCartLineQuantity(productId: number): number {
  const valid = Number.isFinite(productId) && productId > 0
  return useSyncExternalStore(
    subscribeCartStorage,
    () => (valid ? getCartLineQuantity(productId) : 0),
    () => 0,
  )
}
