'use client'

import { useEffect, useLayoutEffect } from 'react'
import { useRouter } from 'next/navigation'
import { installInstantNavClick, installInstantNavIntent, prefetchPublicRoutes } from '@/lib/instantNav'
import { warmMenuCatalogCache } from '@/lib/menuCatalogSessionCache'
import {
  prefetchPriorityRouteChunks,
  scheduleIdleRouteChunkPrefetch,
} from '@/lib/prefetchRouteChunks'
import { installVisibleLinkPrefetch, warmPublicRouteCaches } from '@/lib/publicRouteWarmCache'

/**
 * Ранній prefetch усіх публічних маршрутів + prefetch на pointerdown/focus по посиланнях.
 */
export function useInstantNavBoot(): void {
  const router = useRouter()

  useLayoutEffect(() => {
    void warmMenuCatalogCache()
    void warmPublicRouteCaches()
    prefetchPublicRoutes(router)
    prefetchPriorityRouteChunks()
    scheduleIdleRouteChunkPrefetch()
  }, [router])

  useEffect(() => {
    const removeIntent = installInstantNavIntent(router)
    const removeClick = installInstantNavClick(router)
    const removeVisible = installVisibleLinkPrefetch(router)

    const repeat = () => {
      prefetchPublicRoutes(router)
      void warmPublicRouteCaches()
    }
    repeat()
    const t0 = window.setTimeout(repeat, 0)
    const t1 = window.setTimeout(repeat, 120)
    const t2 = window.setTimeout(repeat, 500)

    type IdleWindow = Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout?: number }) => number
      cancelIdleCallback?: (id: number) => void
    }
    const w = window as IdleWindow
    let idleId: number | undefined
    if (typeof w.requestIdleCallback === 'function') {
      idleId = w.requestIdleCallback(repeat, { timeout: 1500 })
    } else {
      window.setTimeout(repeat, 800)
    }

    const onVisible = () => {
      if (document.visibilityState === 'visible') repeat()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      removeIntent()
      removeClick()
      removeVisible()
      window.clearTimeout(t0)
      window.clearTimeout(t1)
      window.clearTimeout(t2)
      if (idleId != null && typeof w.cancelIdleCallback === 'function') {
        w.cancelIdleCallback(idleId)
      }
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [router])
}
