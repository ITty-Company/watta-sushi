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
import {
  isWattaHomeHeroPathname,
  isWattaMenuHeaderScrollPathname,
} from '@/lib/wattaHtmlRouteClass'
import {
  WATTA_CART_BAR_GATED_ATTR,
  WATTA_CART_BAR_VISIBLE_ATTR,
  WATTA_PAST_HERO_ATTR,
} from '@/hooks/useMobileCartBarGate'
import { WATTA_PHONE_VIEWPORT_MQ } from '@/lib/wattaTouchViewport'

const TOP_ALWAYS_EXPAND_PX = 64
/** Накопичений зсув вниз перед hide — великий гістерезис проти смикання на iOS. */
const SCROLL_DOWN_HIDE_PX = 48
/** Поріг скролу вгору перед появою шапки — без цього шапка вистрибує миттєво
    і штовхає товари вниз, створюючи ефект «стрибка». */
const SCROLL_UP_SHOW_PX = 36
/** Після hide/reveal — пауза, щоб не смикати шапку під час інерційного скролу. */
const HEADER_TOGGLE_COOLDOWN_MS = 320
/** Після кліку по категорії — не ховати шапку від програмного скролу. */
const NAV_SCROLL_SUPPRESS_MS = 420
const LEGACY_HOME_PAST_HERO_ATTR = 'data-watta-home-past-hero'

/** Головна (телефон): у hero лише шапка — compact лише після другої секції. */
function isHomeHeroCategoriesGateClosed(pathname: string): boolean {
  if (!isWattaHomeHeroPathname(pathname)) return false
  const root = document.documentElement
  return (
    root.getAttribute(WATTA_CART_BAR_GATED_ATTR) === '1' &&
    !root.hasAttribute(WATTA_CART_BAR_VISIBLE_ATTR) &&
    !root.hasAttribute(WATTA_PAST_HERO_ATTR) &&
    !root.hasAttribute(LEGACY_HOME_PAST_HERO_ATTR)
  )
}

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
    let pendingUpPx = 0
    let suppressUntil = 0
    let headerToggleUntil = 0
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
      if (performance.now() < headerToggleUntil) return
      if (!isWattaMenuHeaderBandHidden()) {
        pendingDownPx = 0
        pendingUpPx = 0
        return
      }
      revealWattaMenuHeaderBand()
      pendingDownPx = 0
      pendingUpPx = 0
      headerToggleUntil = performance.now() + HEADER_TOGGLE_COOLDOWN_MS
      syncScrollBaseline()
    }

    const hide = () => {
      if (performance.now() < suppressUntil) return
      if (performance.now() < headerToggleUntil) return
      if (readAppScrollTop() <= TOP_ALWAYS_EXPAND_PX) return
      if (isHomeHeroCategoriesGateClosed(pathname)) return
      if (isWattaMenuHeaderBandHidden()) return
      hideWattaMenuHeaderBand()
      pendingDownPx = 0
      pendingUpPx = 0
      headerToggleUntil = performance.now() + HEADER_TOGGLE_COOLDOWN_MS
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

      if (delta > 0) {
        pendingDownPx += delta
        pendingUpPx = 0
        if (pendingDownPx >= SCROLL_DOWN_HIDE_PX) hide()
        return
      }

      if (delta < 0) {
        pendingUpPx += -delta
        pendingDownPx = 0
        if (pendingUpPx >= SCROLL_UP_SHOW_PX) {
          reveal()
        }
      }
    }

    const { onScroll, cancel: cancelRaf } = createRafScrollListener(evaluateScroll, {
      minIntervalMs: 16,
    })
    const unbindScroll = bindAppVerticalScroll(onScroll)
    window.addEventListener(WATTA_MENU_REQUEST_SCROLL_TO_CAT, onCategoryNavigation)

    scheduleBaselineSync()

    return () => {
      cancelRaf()
      window.clearTimeout(baselineSyncTimer)
      unbindScroll()
      window.removeEventListener(WATTA_MENU_REQUEST_SCROLL_TO_CAT, onCategoryNavigation)
      if (!isWattaMenuHeaderScrollPathname(window.location.pathname || '/')) {
        clearWattaMenuHeaderBandState()
      }
    }
  }, [enabled, pathname])
}
