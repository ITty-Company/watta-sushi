'use client'

import { useEffect } from 'react'
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import { usePathname, useRouter } from 'next/navigation'
import {
  installInstantNavClick,
  installInstantNavIntent,
  installInstantNavPointerDown,
  prefetchPriorityPublicRoutes,
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
import { WATTA_HERO_VIDEO_READY_EVENT } from '@/lib/wattaHeroVideo'

/** Повний prefetch на головній — після hero, але не довше ~2.5 с. */
const HOME_FULL_PREFETCH_MAX_MS = 2500
/** Другорядні API-кеші — ще +3 с після hero. */
const HOME_SECONDARY_WARM_DELAY_MS = 3000
/** На головній — усе після hero + idle, щоб не зависав перший кадр. */
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

function runPriorityPrefetch(router: AppRouterInstance, light: boolean): void {
  prefetchPriorityRouteChunks(light ? { light: true } : undefined)
  if (!light) prefetchPriorityPublicRoutes(router)
  void warmPriorityNavPageCaches()
}

function scheduleDeferredHomeWarmCaches(run: () => void): () => void {
  let ran = false
  let cancelIdle = () => {}
  const fire = () => {
    if (ran) return
    ran = true
    run()
  }

  const onHeroReady = () => {
    window.removeEventListener(WATTA_HERO_VIDEO_READY_EVENT, onHeroReady)
    cancelIdle = runWhenIdle(fire, HOME_BOOT_IDLE_MS)
  }

  window.addEventListener(WATTA_HERO_VIDEO_READY_EVENT, onHeroReady)
  const failSafeId = window.setTimeout(() => {
    window.removeEventListener(WATTA_HERO_VIDEO_READY_EVENT, onHeroReady)
    cancelIdle()
    fire()
  }, HOME_FULL_PREFETCH_MAX_MS)

  return () => {
    window.removeEventListener(WATTA_HERO_VIDEO_READY_EVENT, onHeroReady)
    window.clearTimeout(failSafeId)
    cancelIdle()
  }
}

function scheduleFullRoutePrefetch(router: AppRouterInstance, waitForHero: boolean): () => void {
  let ran = false
  const run = () => {
    if (ran) return
    ran = true
    prefetchPublicRoutes(router)
    scheduleIdleRouteChunkPrefetch()
  }

  if (!waitForHero) {
    return runWhenIdle(run, 800)
  }

  let cancelIdle = () => {}
  const fire = () => {
    cancelIdle()
    return runWhenIdle(run, 2000)
  }

  const onHeroReady = () => {
    window.removeEventListener(WATTA_HERO_VIDEO_READY_EVENT, onHeroReady)
    cancelIdle = fire()
  }

  window.addEventListener(WATTA_HERO_VIDEO_READY_EVENT, onHeroReady)
  const failSafeId = window.setTimeout(() => {
    window.removeEventListener(WATTA_HERO_VIDEO_READY_EVENT, onHeroReady)
    cancelIdle()
    run()
  }, HOME_FULL_PREFETCH_MAX_MS)

  return () => {
    window.removeEventListener(WATTA_HERO_VIDEO_READY_EVENT, onHeroReady)
    window.clearTimeout(failSafeId)
    cancelIdle()
  }
}

/**
 * Prefetch публічних маршрутів + warm caches.
 * На головній — усе після hero + idle, щоб не зависав перший кадр.
 */
export function useInstantNavBoot(): void {
  const router = useRouter()
  const pathname = usePathname() || '/'
  const deferForHomeHero = isWattaHomeHeroPathname(pathname)

  useEffect(() => {
    prefetchPriorityPublicRoutes(router)

    const warmCaches = () => {
      void warmMenuCatalogCache()
      window.setTimeout(() => {
        void warmSecondaryPublicRouteCaches()
      }, HOME_SECONDARY_WARM_DELAY_MS)
    }

    if (deferForHomeHero) {
      const cancelWarm = scheduleDeferredHomeWarmCaches(() => {
        runWhenIdle(() => runPriorityPrefetch(router, true), HOME_BOOT_IDLE_MS)()
        warmCaches()
      })
      const cancelPrefetch = scheduleFullRoutePrefetch(router, true)
      return () => {
        cancelWarm()
        cancelPrefetch()
      }
    }

    runWhenIdle(() => runPriorityPrefetch(router, false), 400)()
    warmCaches()
    return scheduleFullRoutePrefetch(router, false)
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
