'use client'

import { useCallback, useEffect, useState } from 'react'
import { readFavoriteIds, writeFavoriteIds } from '@/lib/favoritesStorage'

export function useProductFavorite(productId: number) {
  const [liked, setLiked] = useState(false)
  const validId = Number.isFinite(productId) && productId > 0

  const sync = useCallback(() => {
    if (!validId) {
      setLiked(false)
      return
    }
    setLiked(readFavoriteIds().includes(productId))
  }, [productId, validId])

  useEffect(() => {
    sync()
    const onUpd = () => sync()
    window.addEventListener('favoritesUpdated', onUpd)
    return () => window.removeEventListener('favoritesUpdated', onUpd)
  }, [sync])

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
      window.dispatchEvent(new CustomEvent('favoritesUpdated'))

      const userStr =
        typeof window !== 'undefined' ? localStorage.getItem('currentUser') : null
      if (userStr) {
        try {
          const user = JSON.parse(userStr)
          await fetch('/api/favorites/toggle', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-user-id': String(user.id),
            },
            body: JSON.stringify({ productId }),
          })
        } catch {
          /* ignore */
        }
      }
    },
    [productId, validId],
  )

  return { liked, toggle }
}
