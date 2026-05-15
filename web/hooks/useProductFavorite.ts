'use client'

import { useCallback, useEffect, useState } from 'react'
import { getBearerAuthHeaders } from '@/lib/authHeaders'
import { readFavoriteIds, writeFavoriteIds } from '@/lib/favoritesStorage'
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
  const [liked, setLiked] = useState(false)
  const [count, setCount] = useState(
    Number.isFinite(initialCount) ? Math.max(0, Number(initialCount)) : 0,
  )
  const validId = Number.isFinite(productId) && productId > 0

  const sync = useCallback(() => {
    if (!validId) {
      setLiked(false)
      setCount(0)
      return
    }
    setLiked(readFavoriteIds().includes(productId))
  }, [productId, validId])

  const loadCount = useCallback(async () => {
    if (!validId || options?.skipStandaloneFetch) return
    try {
      // Окремі виклики hook'а на одній сторінці злипаються в єдиний batch-запит
      // через `favoriteCountsBatcher` — замість 50+ паралельних HTTP отримуємо один.
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
    sync()
    void loadCount()
    const onUpd = () => sync()
    window.addEventListener('favoritesUpdated', onUpd)
    return () => {
      window.removeEventListener('favoritesUpdated', onUpd)
    }
  }, [sync, loadCount])

  const toggle = useCallback(
    async (e?: React.MouseEvent) => {
      e?.preventDefault()
      e?.stopPropagation()
      if (!validId) return
      const ids = readFavoriteIds()
      const was = ids.includes(productId)
      const next = was ? ids.filter((id) => id !== productId) : [...ids, productId]
      writeFavoriteIds(next)
      setLiked(!was)
      setCount((prev) => Math.max(0, prev + (was ? -1 : 1)))
      window.dispatchEvent(new CustomEvent('favoritesUpdated'))

      const userStr =
        typeof window !== 'undefined' ? localStorage.getItem('currentUser') : null
      const auth = getBearerAuthHeaders()
      if (userStr && Object.keys(auth as Record<string, string>).length > 0) {
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
          }
        } catch {
          /* ignore */
        }
      }
    },
    [productId, validId],
  )

  return { liked, toggle, count }
}
