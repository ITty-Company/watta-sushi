'use client'

import { useCallback, useEffect, useState } from 'react'
import { requestFavoriteCount } from '@/lib/favoriteCountsBatcher'

/**
 * Один батч лічильників для списку товарів. Залежність ефекту — рядок id (стабільний за значенням).
 *
 * Внутрішньо використовуємо глобальний `favoriteCountsBatcher`, тож запити,
 * згенеровані цим хуком, злипаються з тими, що ідуть з окремих `<ProductCard>`.
 */
export function useFavoriteCountsMap(productIds: readonly number[]): Record<number, number> {
  const idsKey = Array.from(new Set(productIds.filter((id) => Number.isFinite(id) && id > 0)))
    .sort((a, b) => a - b)
    .join(',')

  const [map, setMap] = useState<Record<number, number>>({})

  const load = useCallback(async () => {
    if (!idsKey) {
      setMap({})
      return
    }
    const ids = idsKey.split(',').map((x) => parseInt(x, 10)).filter((n) => n > 0)
    try {
      const values = await Promise.all(ids.map((id) => requestFavoriteCount(id)))
      const next: Record<number, number> = {}
      ids.forEach((id, idx) => {
        next[id] = Math.max(0, values[idx] ?? 0)
      })
      setMap(next)
    } catch {
      /* ignore */
    }
  }, [idsKey])

  useEffect(() => {
    void load()
  }, [load])

  return map
}
