'use client'

import { useEffect, useRef } from 'react'
import {
  catalogSyncEventNames,
  type CatalogRefreshDetail,
  type CatalogRefreshScope,
  WATTA_CATALOG_REFRESH_EVENT,
} from '@/lib/wattaCatalogSync'

function scopeMatches(
  listened: CatalogRefreshScope | CatalogRefreshScope[],
  detail: CatalogRefreshDetail | undefined,
): boolean {
  if (!detail) return true
  if (listened === 'all' || (Array.isArray(listened) && listened.includes('all'))) {
    return true
  }
  const list = Array.isArray(listened) ? listened : [listened]
  return list.includes(detail.scope) || detail.scope === 'all'
}

/**
 * Викликає `onRefresh` після змін у адмінці (товари, банери, відео, налаштування тощо).
 * Debounce за замовчуванням 0 — фото/каталог оновлюються в ту ж секунду після збереження в адмінці.
 */
export function useWattaCatalogSync(
  onRefresh: () => void,
  scope: CatalogRefreshScope | CatalogRefreshScope[] = 'all',
  debounceMs = 0,
): void {
  const onRefreshRef = useRef(onRefresh)
  onRefreshRef.current = onRefresh
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const scheduleRefresh = () => {
      if (timerRef.current != null) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        timerRef.current = null
        onRefreshRef.current()
      }, debounceMs)
    }

    const handler = (e: Event) => {
      if (e.type === WATTA_CATALOG_REFRESH_EVENT) {
        const detail = (e as CustomEvent<CatalogRefreshDetail>).detail
        if (!scopeMatches(scope, detail)) return
      }
      scheduleRefresh()
    }

    const names = catalogSyncEventNames(scope)
    for (const name of names) {
      window.addEventListener(name, handler)
    }
    return () => {
      for (const name of names) {
        window.removeEventListener(name, handler)
      }
      if (timerRef.current != null) clearTimeout(timerRef.current)
    }
  }, [scope, debounceMs])
}
