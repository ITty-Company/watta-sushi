'use client'

import { useLayoutEffect } from 'react'
import { bindAppVerticalScroll, readAppScrollTop } from '@/lib/menuScroll'
import { createRafScrollListener } from '@/lib/scrollSync'
import {
  clearWattaMenuHeaderBandState,
  hideWattaMenuHeaderBand,
  isWattaMenuHeaderBandHidden,
  revealWattaMenuHeaderBand,
} from '@/lib/wattaChromeScroll'
import { WATTA_MENU_REQUEST_SCROLL_TO_CAT } from '@/lib/fullMenuCategoryNav'
import { isWattaMenuHeaderScrollPathname } from '@/lib/wattaHtmlRouteClass'
import { WATTA_PHONE_VIEWPORT_MQ } from '@/lib/wattaTouchViewport'

const TOP_ALWAYS_EXPAND_PX = 64
/** Накопичений зсув вниз перед hide — гістерезис проти смикання на iOS. */
const SCROLL_DOWN_HIDE_PX = 14
const TOUCH_HIDE_PX = 10
/** Після кліку по категорії — не ховати шапку від програмного скролу. */
const NAV_SCROLL_SUPPRESS_MS = 420

function isPhone(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.matchMedia(WATTA_PHONE_VIEWPORT_MQ).matches
  } catch {
    return false
  }
}

/**
 * Головна + /menu (телефон), усі категорії — завжди:
 * вниз → ховає верхню панель; вгору → одразу показує.
 */
export function useWattaMenuHeaderScroll(enabled = true, pathname = '/') {
  useLayoutEffect(() => {
    if (!enabled || typeof window === 'undefined') return

    if (!isPhone()) {
      revealWattaMenuHeaderBand()
      return () => {
        if (!isWattaMenuHeaderScrollPathname(window.location.pathname || '/')) {
          clearWattaMenuHeaderBandState()
        }
      }
    }

    revealWattaMenuHeaderBand()

    let lastScrollY = readAppScrollTop()
    let pendingDownPx = 0
    let lastTouchY = 0
    let touchOnCategoryPanel = false
    let suppressUntil = 0
    let baselineSyncTimer = 0

    const syncScrollBaseline = () => {
      lastScrollY = readAppScrollTop()
      pendingDownPx = 0
    }

    const scheduleBaselineSync = () => {
      window.clearTimeout(baselineSyncTimer)
      requestAnimationFrame(syncScrollBaseline)
      baselineSyncTimer = window.setTimeout(syncScrollBaseline, NAV_SCROLL_SUPPRESS_MS)
    }

    const onCategoryNavigation = () => {
      suppressUntil = performance.now() + NAV_SCROLL_SUPPRESS_MS
      revealWattaMenuHeaderBand()
      scheduleBaselineSync()
    }

    const reveal = () => {
      revealWattaMenuHeaderBand()
      pendingDownPx = 0
      syncScrollBaseline()
    }

    const hide = () => {
      if (performance.now() < suppressUntil) return
      if (readAppScrollTop() <= TOP_ALWAYS_EXPAND_PX) return
      if (isWattaMenuHeaderBandHidden()) return
      hideWattaMenuHeaderBand()
      pendingDownPx = 0
      syncScrollBaseline()
    }

    const evaluateScroll = () => {
      const y = readAppScrollTop()
      const delta = y - lastScrollY
      lastScrollY = y

      if (y <= TOP_ALWAYS_EXPAND_PX) {
        reveal()
        return
      }

      /* Вгору — одразу, навіть під час suppress після зміни категорії. */
      if (delta < 0) {
        reveal()
        return
      }

      if (performance.now() < suppressUntil) return

      if (delta > 0) {
        pendingDownPx += delta
        if (pendingDownPx >= SCROLL_DOWN_HIDE_PX) hide()
      }
    }

    const onTouchStart = (e: TouchEvent) => {
      lastTouchY = e.touches[0]?.clientY ?? 0
      const target = e.target
      touchOnCategoryPanel =
        target instanceof Element &&
        Boolean(target.closest('.categories-panel-web, .categories-panel-wrapper-web'))
    }

    const onTouchEnd = () => {
      touchOnCategoryPanel = false
    }

    const onTouchMove = (e: TouchEvent) => {
      if (touchOnCategoryPanel) return
      const y = e.touches[0]?.clientY
      if (y == null) return
      const dy = y - lastTouchY
      lastTouchY = y
      if (dy > 0) {
        reveal()
        return
      }
      if (performance.now() < suppressUntil) return
      if (dy < -TOUCH_HIDE_PX) hide()
    }

    const onWheel = (e: WheelEvent) => {
      if (e.deltaY < 0) {
        reveal()
        return
      }
      if (performance.now() < suppressUntil) return
      if (e.deltaY > SCROLL_DOWN_HIDE_PX) hide()
    }

    const passiveCapture: AddEventListenerOptions = { passive: true, capture: true }

    const { onScroll, cancel: cancelRaf } = createRafScrollListener(evaluateScroll, {
      minIntervalMs: 16,
    })
    const unbindScroll = bindAppVerticalScroll(onScroll)
    document.addEventListener('touchstart', onTouchStart, passiveCapture)
    document.addEventListener('touchmove', onTouchMove, passiveCapture)
    document.addEventListener('touchend', onTouchEnd, passiveCapture)
    document.addEventListener('touchcancel', onTouchEnd, passiveCapture)
    window.addEventListener('wheel', onWheel, passiveCapture)
    window.addEventListener(WATTA_MENU_REQUEST_SCROLL_TO_CAT, onCategoryNavigation)

    scheduleBaselineSync()

    return () => {
      cancelRaf()
      window.clearTimeout(baselineSyncTimer)
      unbindScroll()
      document.removeEventListener('touchstart', onTouchStart, passiveCapture)
      document.removeEventListener('touchmove', onTouchMove, passiveCapture)
      document.removeEventListener('touchend', onTouchEnd, passiveCapture)
      document.removeEventListener('touchcancel', onTouchEnd, passiveCapture)
      window.removeEventListener('wheel', onWheel, passiveCapture)
      window.removeEventListener(WATTA_MENU_REQUEST_SCROLL_TO_CAT, onCategoryNavigation)
      if (!isWattaMenuHeaderScrollPathname(window.location.pathname || '/')) {
        clearWattaMenuHeaderBandState()
      }
    }
  }, [enabled, pathname])
}
