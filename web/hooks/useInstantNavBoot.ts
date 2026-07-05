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


/** На головній — вторинні чанки/кеші після першого paint (не блокуємо prefetch пріоритету). */
const HOME_SECONDARY_BOOT_IDLE_MS = 120
const SECONDARY_BOOT_IDLE_MS = 64

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

/** Всі публічні маршрути — RSC + JS chunks одразу; вторинні кеші — короткий idle. */
export function useInstantNavBoot(): void {
  const router = useRouter()
  const pathname = usePathname() || '/'
  const deferForHomeHero = isWattaHomeHeroPathname(pathname)

  useEffect(() => {
    // RSC + JS chunks пріоритетних маршрутів — одразу (бюджет переходу ≤1 с).
    prefetchPublicRoutes(router)
    prefetchPriorityRouteChunks()
    void warmPriorityNavPageCaches()
    void warmMenuCatalogCache()

    const cancelSecondary = runWhenIdle(() => {
      scheduleIdleRouteChunkPrefetch()
      void warmSecondaryPublicRouteCaches()
    }, deferForHomeHero ? HOME_SECONDARY_BOOT_IDLE_MS : SECONDARY_BOOT_IDLE_MS)
    return cancelSecondary
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
