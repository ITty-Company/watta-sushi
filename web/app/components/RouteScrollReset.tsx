'use client'

import { useLayoutEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { ensureDocumentScrollUnlocked } from '@/lib/ensureDocumentScroll'
import { scrollToTopOnRouteChange } from '@/lib/menuScroll'
import {
  consumePopNavigation,
  restoreScrollForCurrentLocation,
} from '@/lib/wattaScrollMemory'
import {
  consumeSkipScrollReset,
  applyRestoreChromeCompactIfNeeded,
  shouldPreserveMenuCategoryScroll,
  clearMenuScrollNavigationFlags,
} from '@/lib/wattaChromeScroll'
import { markInternalNavBackAvailable } from '@/lib/wattaInternalNavBack'
import { isWattaProductPathname, syncWattaHtmlRouteClass } from '@/lib/wattaHtmlRouteClass'
import { applyWattaProductChromeEntry } from '@/lib/wattaProductChrome'

function runRouteScrollReset(pathname: string, wasPopNavigation: boolean): void {
  const isHomeRoute = pathname === '/'
  ensureDocumentScrollUnlocked()
  if (pathname !== '/menu') {
    clearMenuScrollNavigationFlags()
  }

  const preserveMenuScroll = shouldPreserveMenuCategoryScroll()
  if (preserveMenuScroll) {
    consumeSkipScrollReset()
    applyRestoreChromeCompactIfNeeded()
    return
  }
  consumeSkipScrollReset()

  if (isWattaProductPathname(pathname)) {
    applyWattaProductChromeEntry()
  }
  if (wasPopNavigation && !isHomeRoute && restoreScrollForCurrentLocation()) {
    return
  }
  scrollToTopOnRouteChange()
}

/** Скидає скрол на верх лише при зміні pathname (не при ручному скролі / ?cat= на /menu). */
export default function RouteScrollReset() {
  const pathname = usePathname() || '/'
  const prevPathnameRef = useRef<string | null>(null)

  useLayoutEffect(() => {
    syncWattaHtmlRouteClass(pathname)

    const prev = prevPathnameRef.current
    prevPathnameRef.current = pathname
    const wasPopNavigation = consumePopNavigation()
    if (prev !== null && prev !== pathname) {
      markInternalNavBackAvailable()
    }
    if (prev === pathname) return
    window.getSelection?.()?.removeAllRanges?.()
    runRouteScrollReset(pathname, wasPopNavigation)
  }, [pathname])

  return null
}
