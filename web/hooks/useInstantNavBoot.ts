'use client'

import { useEffect } from 'react'

import { usePathname, useRouter } from 'next/navigation'
import {
  installInstantNavClick,
  installInstantNavIntent,
  installInstantNavPointerDown,

  prefetchPublicRoutes,
} from '@/lib/instantNav'
import { bindWattaScrollTapGuard } from '@/lib/wattaScrollTapGuard'
import { warmMenuCatalogCache } from '@/lib/menuCatalogSessionCache'
import {
  prefetchPriorityRouteChunks,
  scheduleIdleRouteChunkPrefetch,
} from '@/lib/prefetchRouteChunks'
import {
  installVisibleLinkPrefetch,
  warmPriorityNavPageCaches,
  warmSecondaryPublicRouteCaches,
} from '@/lib/publicRouteWarmCache'
import { isWattaHomeHeroPathname } from '@/lib/wattaHtmlRouteClass'


/** На головній — JS chunks + warm кешів після idle, щоб не зʼїдати смугу mp4. */
const HOME_BOOT_IDLE_MS = 500

type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, opts?: { timeout?: number }) => number
  cancelIdleCallback?: (id: number) => void
}

function runWhenIdle(cb: () => void, timeoutMs: number): () => void {
  if (typeof window === 'undefined') return () => {}
  const w = window as IdleWindow
  if (typeof w.requestIdleCallback === 'function') {
    const id = w.requestIdleCallback(cb, { timeout: timeoutMs })
    return () => w.cancelIdleCallback?.(id)
  }
  const id = window.setTimeout(cb, Math.min(timeoutMs, 64))
  return () => window.clearTimeout(id)
}

/** Всі публічні маршрути (RSC prefetch) — одразу; JS chunks + кеші — на idle. */
export function useInstantNavBoot(): void {
  const router = useRouter()
  const pathname = usePathname() || '/'
  const deferForHomeHero = isWattaHomeHeroPathname(pathname)

  useEffect(() => {
    // RSC prefetch для всіх публічних маршрутів — малі текстові payload'и, без очікування
    prefetchPublicRoutes(router)

    if (deferForHomeHero) {
      // На головній: JS chunks + warm кешів на idle, щоб не зʼїдати смугу hero-video
      return runWhenIdle(() => {
        prefetchPriorityRouteChunks({ light: true })
        scheduleIdleRouteChunkPrefetch()
        void warmPriorityNavPageCaches()
        void warmMenuCatalogCache()
        void warmSecondaryPublicRouteCaches()
      }, HOME_BOOT_IDLE_MS)
    }

    // Решта сторінок: JS chunks + кеші на idle
    const cancelRun = runWhenIdle(() => {
      prefetchPriorityRouteChunks()
      scheduleIdleRouteChunkPrefetch()
      void warmPriorityNavPageCaches()
      void warmMenuCatalogCache()
      void warmSecondaryPublicRouteCaches()
    }, 400)
    return cancelRun
  }, [router, deferForHomeHero])

  useEffect(() => {
    const removeTapGuard = bindWattaScrollTapGuard()
    const removeIntent = installInstantNavIntent(router)
    const removePointerDown = installInstantNavPointerDown(router)
    const removeClick = installInstantNavClick(router)
    const removeVisible = installVisibleLinkPrefetch(router)

    const onVisible = () => {
      if (document.visibilityState === 'visible') prefetchPublicRoutes(router)
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      removeTapGuard()
      removeIntent()
      removePointerDown()
      removeClick()
      removeVisible()
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [router])
}
