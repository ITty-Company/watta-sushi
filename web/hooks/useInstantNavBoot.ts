'use client'

import { useEffect, useLayoutEffect } from 'react'
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import { useRouter } from 'next/navigation'
import { installInstantNavClick, installInstantNavIntent, prefetchPublicRoutes } from '@/lib/instantNav'
import { warmMenuCatalogCache } from '@/lib/menuCatalogSessionCache'
import {
  prefetchPriorityRouteChunks,
  scheduleIdleRouteChunkPrefetch,
} from '@/lib/prefetchRouteChunks'
import { installVisibleLinkPrefetch, warmPublicRouteCaches } from '@/lib/publicRouteWarmCache'
import { WATTA_HERO_VIDEO_READY_EVENT } from '@/lib/wattaHeroVideo'

const DEFERRED_PREFETCH_MAX_MS = 6000

function scheduleDeferredRoutePrefetch(router: AppRouterInstance): () => void {
  let ran = false
  const run = () => {
    if (ran) return
    ran = true
    prefetchPublicRoutes(router)
    prefetchPriorityRouteChunks()
    scheduleIdleRouteChunkPrefetch()
  }

  const onHeroReady = () => {
    window.removeEventListener(WATTA_HERO_VIDEO_READY_EVENT, onHeroReady)
    type IdleWindow = Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout?: number }) => number
    }
    const w = window as IdleWindow
    if (typeof w.requestIdleCallback === 'function') {
      w.requestIdleCallback(run, { timeout: 2000 })
    } else {
      window.setTimeout(run, 400)
    }
  }

  window.addEventListener(WATTA_HERO_VIDEO_READY_EVENT, onHeroReady)
  const failSafeId = window.setTimeout(() => {
    window.removeEventListener(WATTA_HERO_VIDEO_READY_EVENT, onHeroReady)
    run()
  }, DEFERRED_PREFETCH_MAX_MS)

  return () => {
    window.removeEventListener(WATTA_HERO_VIDEO_READY_EVENT, onHeroReady)
    window.clearTimeout(failSafeId)
  }
}

/**
 * Ранній prefetch усіх публічних маршрутів + prefetch на pointerdown/focus по посиланнях.
 * На головній prefetch відкладено до hero-ready — не з’їдає смугу під mp4.
 */
export function useInstantNavBoot(): void {
  const router = useRouter()

  useLayoutEffect(() => {
    void warmMenuCatalogCache()
    void warmPublicRouteCaches()
    return scheduleDeferredRoutePrefetch(router)
  }, [router])

  useEffect(() => {
    const removeIntent = installInstantNavIntent(router)
    const removeClick = installInstantNavClick(router)
    const removeVisible = installVisibleLinkPrefetch(router)

    const onVisible = () => {
      if (document.visibilityState === 'visible') prefetchPublicRoutes(router)
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      removeIntent()
      removeClick()
      removeVisible()
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [router])
}
