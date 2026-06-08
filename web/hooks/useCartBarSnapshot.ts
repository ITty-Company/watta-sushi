'use client'

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import {
  getCartRevision,
  getCartTotalPieceCount,
  lineQuantity,
  readCartFromStorage,
  subscribeCartStorage,
} from '@/lib/cartStorage'
import { cartLineChargeUnitPrice } from '@/lib/cartUpsell'

export type CartBarSnapshot = {
  pieces: number
  total: number
  hasItems: boolean
}

/** Зведення кошика для мобільної смуги та оверлею на картці товару. */
export function useCartBarSnapshot(): CartBarSnapshot {
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => setHydrated(true), [])

  const revision = useSyncExternalStore(
    subscribeCartStorage,
    () => (hydrated ? getCartRevision() : 0),
    () => 0,
  )

  return useMemo(() => {
    try {
      if (!hydrated) return { pieces: 0, total: 0, hasItems: false }
      const _revision = revision
      void _revision
      const lines = readCartFromStorage()
      const pieces = getCartTotalPieceCount(lines)
      const total = lines.reduce(
        (sum, line) => sum + cartLineChargeUnitPrice(line) * lineQuantity(line),
        0,
      )
      return { pieces, total, hasItems: lines.length > 0 }
    } catch {
      return { pieces: 0, total: 0, hasItems: false }
    }
  }, [revision, hydrated])
}
