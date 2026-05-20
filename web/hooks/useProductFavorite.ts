'use client'

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { getBearerAuthHeaders } from '@/lib/authHeaders'
import { isUserLoggedIn } from '@/lib/authGate'
import {
  isProductFavorite,
  readFavoriteIds,
  subscribeFavoriteIds,
  syncFavoriteIdsToStorage,
} from '@/lib/favoritesStorage'
import {
  requestFavoriteCount,
  setFavoriteCountInCache,
} from '@/lib/favoriteCountsBatcher'

type UseProductFavoriteOptions = {
  skipStandaloneFetch?: boolean
}

export function useProductFavorite(
  productId: number,
  initialCount = 0,
  options?: UseProductFavoriteOptions,
) {
  const validId = Number.isFinite(productId) && productId > 0

  const liked = useSyncExternalStore(
    subscribeFavoriteIds,
    () => (validId ? isProductFavorite(productId) : false),
    () => false,
  )

  const [count, setCount] = useState(
    Number.isFinite(initialCount) ? Math.max(0, Number(initialCount)) : 0,
  )

  const loadCount = useCallback(async () => {
    if (!validId || options?.skipStandaloneFetch) return
    try {
      const value = await requestFavoriteCount(productId)
      setCount(Math.max(0, value))
    } catch {
      /* ignore */
    }
  }, [productId, validId, options?.skipStandaloneFetch])

  useEffect(() => {
    if (options?.skipStandaloneFetch) {
      setCount(Number.isFinite(initialCount) ? Math.max(0, Number(initialCount)) : 0)
    }
  }, [initialCount, options?.skipStandaloneFetch])

  useEffect(() => {
    void loadCount()
  }, [loadCount])

  const toggle = useCallback(
    async (e?: React.MouseEvent) => {
      e?.preventDefault()
      e?.stopPropagation()
      if (!validId) return

      const ids = readFavoriteIds()
      const was = ids.includes(productId)
      const next = was ? ids.filter((id) => id !== productId) : [...ids, productId]
      syncFavoriteIdsToStorage(next)
      setCount((prev) => Math.max(0, prev + (was ? -1 : 1)))

      if (!isUserLoggedIn()) return

      const auth = getBearerAuthHeaders()
      if (Object.keys(auth as Record<string, string>).length === 0) return

      try {
        const res = await fetch('/api/favorites/toggle', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...auth,
          },
          body: JSON.stringify({ productId }),
        })
        if (res.ok) {
          const data = (await res.json()) as { count?: number }
          if (typeof data?.count === 'number' && Number.isFinite(data.count)) {
            const fresh = Math.max(0, data.count)
            setCount(fresh)
            setFavoriteCountInCache(productId, fresh)
          }
        } else {
          syncFavoriteIdsToStorage(ids)
          setCount((prev) => Math.max(0, prev + (was ? 1 : -1)))
        }
      } catch {
        syncFavoriteIdsToStorage(ids)
        setCount((prev) => Math.max(0, prev + (was ? 1 : -1)))
      }
    },
    [productId, validId],
  )

  return { liked, toggle, count }
}
