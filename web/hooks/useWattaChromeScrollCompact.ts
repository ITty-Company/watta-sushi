'use client'

import { useLayoutEffect, useSyncExternalStore } from 'react'
import { usePathname } from 'next/navigation'
import { bindAppVerticalScroll, readAppScrollTop, readScrollTop, getVerticalScrollTarget } from '@/lib/menuScroll'
import { consumeRestoreChromeCompact, isWattaChromeCompactLocked } from '@/lib/wattaChromeScroll'
import { createRafScrollListener } from '@/lib/scrollSync'
import {
  isWattaPhoneViewport,
  isWattaTouchScrollPerfViewport,
  WATTA_PHONE_VIEWPORT_MQ,
} from '@/lib/wattaTouchViewport'
import { isWattaProductPathname } from '@/lib/wattaHtmlRouteClass'
import {
  applyWattaProductChromeEntry,
  clearWattaProductChromeEntry,
  isWattaProductChromeActive,
  setWattaProductChromeHeaderExpanded,
  WATTA_ROUTE_PRODUCT_CLASS,
} from '@/lib/wattaProductChrome'

/** Біля верху сторінки — завжди повна шапка, без compact (не на /product). */
const TOP_ALWAYS_EXPAND_PX = 64
/** Мінімальний крок вниз, щоб сховати шапку. */
const SCROLL_DOWN_THRESHOLD_PX = 18
/** Мінімальний крок вгору, щоб показати шапку (гістерезис проти смикання). */
const SCROLL_UP_THRESHOLD_PX = 1
/** Телефон: накопичений зсув (iOS дає дрібні scroll-події). */
const PHONE_SCROLL_DOWN_THRESHOLD_PX = 16
const PHONE_SCROLL_UP_THRESHOLD_PX = 1
/** Тач: рідше вимірюємо scrollTop — менше layout під час свайпу вниз. */
const TOUCH_SCROLL_EVAL_MIN_MS = 16
/** /product (телефон): швидше розгортання шапки після скролу вгору. */
const PRODUCT_PHONE_SCROLL_UP_THRESHOLD_PX = 1
/** /product (десктоп): поріг жесту вгору. */
const PRODUCT_SCROLL_UP_THRESHOLD_PX = 1
/** Після розгортання шапки — без паузи, щоб вгору реагувало миттєво. */
const EXPAND_COMPACT_TOGGLE_COOLDOWN_MS = 0
/** /product: коротша пауза після перемикання compact. */
const PRODUCT_COMPACT_TOGGLE_COOLDOWN_MS = 280
/** Після перемикання compact — пауза, поки layout не стабілізується. */
const COMPACT_TOGGLE_COOLDOWN_MS = 480
/** /product: після першого входу — коротка пауза лише для «закріпити» compact, не блокувати скрол вгору. */
const PRODUCT_FIRST_NAV_SCROLL_SUPPRESS_MS = 280
/** /product → /product: коротка пауза. */
const PRODUCT_SWITCH_SCROLL_SUPPRESS_MS = 180
/** /product: свайп у верхній зоні — одразу повна шапка (вгору або вниз). */
const PRODUCT_REVEAL_SWIPE_MIN_PX = 16
const PRODUCT_REVEAL_VERTICAL_RATIO = 1.08
const PRODUCT_REVEAL_ZONE_MIN_PX = 148
const PRODUCT_REVEAL_CHROME_PAD_PX = 36

function canUseProductRevealGesture(): boolean {
  return isWattaPhoneViewport() || isWattaTouchScrollPerfViewport()
}

function touchStartsInProductRevealZone(clientY: number): boolean {
  if (typeof document === 'undefined') return false
  const portal = document.querySelector('.watta-sticky-chrome-portal')
  let zoneBottom = PRODUCT_REVEAL_ZONE_MIN_PX
  if (portal instanceof HTMLElement) {
    const rect = portal.getBoundingClientRect()
    zoneBottom = Math.max(zoneBottom, rect.bottom + PRODUCT_REVEAL_CHROME_PAD_PX)
  }
  return clientY <= zoneBottom
}

function isDominantProductRevealSwipe(dx: number, dy: number): boolean {
  const vertical = Math.abs(dy)
  if (vertical < PRODUCT_REVEAL_SWIPE_MIN_PX) return false
  if (vertical <= Math.abs(dx) * PRODUCT_REVEAL_VERTICAL_RATIO) return false
  return dy <= -PRODUCT_REVEAL_SWIPE_MIN_PX || dy >= PRODUCT_REVEAL_SWIPE_MIN_PX
}

function applyCompactAttr(compact: boolean) {
  const root = document.documentElement
  if (compact) {
    root.dataset.wattaChromeCompact = 'true'
  } else {
    delete root.dataset.wattaChromeCompact
  }
  window.dispatchEvent(new CustomEvent('wattaChromeCompactChange', { detail: { compact } }))
}

function readDomCompact(): boolean {
  if (typeof document === 'undefined') return false
  const root = document.documentElement
  if (root.classList.contains(WATTA_ROUTE_PRODUCT_CLASS) && isWattaPhoneViewport()) {
    return root.dataset.wattaProductHeaderExpanded !== 'true'
  }
  return root.dataset.wattaChromeCompact === 'true'
}

function subscribePhoneViewport(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const mq = window.matchMedia(WATTA_PHONE_VIEWPORT_MQ)
  mq.addEventListener('change', onStoreChange)
  return () => mq.removeEventListener('change', onStoreChange)
}

function readPhoneViewport(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia(WATTA_PHONE_VIEWPORT_MQ).matches
}

/** Планшет/ПК: повна шапка без compact при скролі — інакше сторінка «стрибає». */
function ensureDesktopFullChrome(isProductPage: boolean): void {
  const root = document.documentElement
  delete root.dataset.wattaChromeCompact
  delete root.dataset.wattaProductHeaderExpanded
  if (isProductPage) {
    applyWattaProductChromeEntry()
  }
  window.dispatchEvent(new CustomEvent('wattaChromeCompactChange', { detail: { compact: false } }))
}

/**
 * Публічний сайт (усі маршрути з WattaStickyChromeLayout), усі viewport.
 * Вниз — лише панель категорій; вгору — повна шапка + категорії.
 * /product: при вході лише категорії; вгору — повна шапка.
 */
export function useWattaChromeScrollCompact(enabled = true) {
  const pathname = usePathname() || '/'
  const isProductPage = isWattaProductPathname(pathname)
  const isPhone = useSyncExternalStore(subscribePhoneViewport, readPhoneViewport, () => false)

  useLayoutEffect(() => {
    if (!enabled || typeof window === 'undefined') return

    if (!isPhone) {
      ensureDesktopFullChrome(isProductPage)
      return () => {
        const nextPath = window.location.pathname || '/'
        if (!isWattaProductPathname(nextPath)) {
          clearWattaProductChromeEntry()
        }
      }
    }

    const isProductPhoneChrome = () => isProductPage && isWattaPhoneViewport()

    let compact = false
    let lastY = 0
    let pendingDownPx = 0
    let pendingUpPx = 0

    /**
     * Кеш вертикального scroll target: `getVerticalScrollTarget()` викликає
     * `querySelector` і `getComputedStyle`, що дорого під час активного скролу.
     * Визначаємо один раз при старті й перевизначаємо тільки при ресайзі.
     */
    let cachedScrollTarget = getVerticalScrollTarget()
    const refreshScrollTarget = () => {
      cachedScrollTarget = getVerticalScrollTarget()
    }
    const readCachedScrollTop = (): number => {
      if (typeof window === 'undefined') return 0
      return readScrollTop(cachedScrollTarget)
    }

    lastY = readCachedScrollTop()
    let suppressUntil = 0
    let suppressFlushTimer = 0
    let restoredCompact = false
    let topAutoExpandArmed = !isProductPhoneChrome()

    const resetPendingScroll = () => {
      pendingDownPx = 0
      pendingUpPx = 0
    }

    const syncCompact = (next: boolean) => {
      if (next === compact) return
      compact = next
      if (isProductPhoneChrome()) {
        setWattaProductChromeHeaderExpanded(!next)
      } else {
        applyCompactAttr(next)
      }
      const cooldown = next
        ? isProductPhoneChrome()
          ? PRODUCT_COMPACT_TOGGLE_COOLDOWN_MS
          : COMPACT_TOGGLE_COOLDOWN_MS
        : EXPAND_COMPACT_TOGGLE_COOLDOWN_MS
      suppressUntil = performance.now() + cooldown
      resetPendingScroll()
      requestAnimationFrame(() => {
        lastY = readCachedScrollTop()
      })
      window.clearTimeout(suppressFlushTimer)
      suppressFlushTimer = window.setTimeout(() => {
        lastY = readCachedScrollTop()
        if (isWattaChromeCompactLocked()) return
        const isPhone = isWattaPhoneViewport()
        const upThreshold = readUpThreshold(isPhone)
        const downThreshold = readDownThreshold(isPhone)
        if (pendingUpPx >= upThreshold) {
          pendingUpPx = 0
          syncCompact(false)
          return
        }
        if (pendingDownPx >= downThreshold) {
          pendingDownPx = 0
          syncCompact(true)
          return
        }
        evaluateScroll()
      }, cooldown + 20)
    }

    const readUpThreshold = (isPhone: boolean) => {
      if (isPhone && isProductPhoneChrome()) return PRODUCT_PHONE_SCROLL_UP_THRESHOLD_PX
      if (isPhone) return PHONE_SCROLL_UP_THRESHOLD_PX
      if (isProductPhoneChrome()) return PRODUCT_SCROLL_UP_THRESHOLD_PX
      return SCROLL_UP_THRESHOLD_PX
    }

    const readDownThreshold = (isPhone: boolean) => {
      if (isPhone) return PHONE_SCROLL_DOWN_THRESHOLD_PX
      return SCROLL_DOWN_THRESHOLD_PX
    }

    const applyScrollDelta = (delta: number, downThreshold: number, upThreshold: number) => {
      if (delta > 0) {
        pendingDownPx += delta
        pendingUpPx = 0
        if (pendingDownPx >= downThreshold) {
          pendingDownPx = 0
          syncCompact(true)
        }
        return
      }
      if (delta < 0) {
        // У compact — будь-який рух вгору одразу показує шапку + категорії.
        if (compact) {
          resetPendingScroll()
          syncCompact(false)
          return
        }
        const upDelta = -delta
        pendingUpPx += upDelta
        pendingDownPx = 0
        if (pendingUpPx >= upThreshold) {
          pendingUpPx = 0
          syncCompact(false)
        }
      }
    }

    const expandChromeAtPageTop = (y: number) => {
      if (y > TOP_ALWAYS_EXPAND_PX) return false
      restoredCompact = false
      topAutoExpandArmed = true
      if (!isProductPhoneChrome() || compact) {
        syncCompact(false)
      }
      return true
    }

    const evaluateScroll = () => {
      const y = readCachedScrollTop()
      const isPhone = isWattaPhoneViewport()

      if (isWattaChromeCompactLocked()) {
        const deltaDuringLock = y - lastY
        lastY = y
        if (compact && deltaDuringLock < 0) {
          resetPendingScroll()
          syncCompact(false)
          return
        }
        if (expandChromeAtPageTop(y)) {
          lastY = y
          resetPendingScroll()
          return
        }
        resetPendingScroll()
        return
      }

      if (performance.now() < suppressUntil) {
        const deltaDuringSuppress = y - lastY
        lastY = y
        if (deltaDuringSuppress < 0 && compact) {
          resetPendingScroll()
          syncCompact(false)
          return
        }
        if (deltaDuringSuppress > 0) {
          pendingDownPx += deltaDuringSuppress
          pendingUpPx = 0
        } else if (deltaDuringSuppress < 0) {
          pendingUpPx += -deltaDuringSuppress
          pendingDownPx = 0
        }
        return
      }

      if (restoredCompact && !topAutoExpandArmed) {
        if (y <= TOP_ALWAYS_EXPAND_PX) {
          lastY = y
          resetPendingScroll()
          expandChromeAtPageTop(y)
          return
        }
        topAutoExpandArmed = true
      }

      const downThreshold = readDownThreshold(isPhone)
      const upThreshold = readUpThreshold(isPhone)

      if (y <= TOP_ALWAYS_EXPAND_PX) {
        lastY = y
        resetPendingScroll()
        expandChromeAtPageTop(y)
        return
      }

      const delta = y - lastY
      lastY = y
      applyScrollDelta(delta, downThreshold, upThreshold)
    }

    const touchPerf = isWattaTouchScrollPerfViewport()
    const { onScroll, cancel: cancelRaf } = createRafScrollListener(evaluateScroll, {
      minIntervalMs: touchPerf ? TOUCH_SCROLL_EVAL_MIN_MS : 0,
    })

    const syncInitial = () => {
      lastY = readCachedScrollTop()
      resetPendingScroll()
      if (lastY <= TOP_ALWAYS_EXPAND_PX) {
        if (!isProductPhoneChrome()) syncCompact(false)
        return
      }
      if (!isProductPhoneChrome()) syncCompact(true)
    }

    const unbindScroll = bindAppVerticalScroll(onScroll)

    const syncCompactFromDom = () => {
      const domCompact = readDomCompact()
      if (domCompact === compact) return
      compact = domCompact
      lastY = readCachedScrollTop()
      suppressUntil = performance.now() + COMPACT_TOGGLE_COOLDOWN_MS
    }

    if (consumeRestoreChromeCompact()) {
      lastY = readCachedScrollTop()
      restoredCompact = true
      topAutoExpandArmed = false
      if (lastY <= TOP_ALWAYS_EXPAND_PX) {
        restoredCompact = false
        topAutoExpandArmed = true
        compact = false
        if (isProductPhoneChrome()) {
          setWattaProductChromeHeaderExpanded(true)
        } else {
          applyCompactAttr(false)
        }
      } else {
        compact = true
        if (isProductPhoneChrome()) {
          applyWattaProductChromeEntry()
        } else {
          applyCompactAttr(true)
        }
      }
    } else if (isProductPage) {
      applyWattaProductChromeEntry()
      if (isProductPhoneChrome()) {
        const alreadyOnProduct = isWattaProductChromeActive()
        compact = true
        lastY = readCachedScrollTop()
        topAutoExpandArmed = true
        suppressUntil =
          performance.now() +
          (alreadyOnProduct ? PRODUCT_SWITCH_SCROLL_SUPPRESS_MS : PRODUCT_FIRST_NAV_SCROLL_SUPPRESS_MS)
      } else {
        syncInitial()
      }
    } else {
      syncInitial()
    }

    window.addEventListener('wattaChromeCompactChange', syncCompactFromDom)

    const onResize = () => {
      refreshScrollTarget()
      lastY = readCachedScrollTop()
      resetPendingScroll()
    }
    window.addEventListener('resize', onResize)

    let pullTouchId: number | null = null
    let pullStart: { x: number; y: number } | null = null
    let pullHandled = false

    const resetProductPull = () => {
      pullTouchId = null
      pullStart = null
      pullHandled = false
    }

    const tryProductRevealExpand = (dx: number, dy: number) => {
      if (!isProductPhoneChrome() || !compact || pullHandled) return
      if (!isDominantProductRevealSwipe(dx, dy)) return
      pullHandled = true
      resetPendingScroll()
      syncCompact(false)
    }

    const readTouchPoint = (list: TouchList, id: number | null) => {
      if (id == null) return list[0] ?? null
      for (let i = 0; i < list.length; i++) {
        const t = list.item(i)
        if (t && t.identifier === id) return t
      }
      return list[0] ?? null
    }

    const onProductRevealGestureStart = (clientX: number, clientY: number, id: number | null) => {
      if (!isProductPhoneChrome() || !canUseProductRevealGesture()) return
      if (!touchStartsInProductRevealZone(clientY)) {
        resetProductPull()
        return
      }
      pullTouchId = id
      pullStart = { x: clientX, y: clientY }
      pullHandled = false
    }

    const onProductRevealGestureMove = (clientX: number, clientY: number) => {
      if (!pullStart) return
      tryProductRevealExpand(clientX - pullStart.x, clientY - pullStart.y)
    }

    const onProductRevealGestureEnd = (clientX: number, clientY: number) => {
      if (!pullStart) {
        resetProductPull()
        return
      }
      tryProductRevealExpand(clientX - pullStart.x, clientY - pullStart.y)
      resetProductPull()
    }

    const onProductPullTouchStart = (e: TouchEvent) => {
      const t = e.touches[0]
      if (!t) {
        resetProductPull()
        return
      }
      onProductRevealGestureStart(t.clientX, t.clientY, t.identifier)
    }

    const onProductPullTouchMove = (e: TouchEvent) => {
      const t = readTouchPoint(e.touches, pullTouchId)
      if (!t) return
      onProductRevealGestureMove(t.clientX, t.clientY)
    }

    const onProductPullTouchEnd = (e: TouchEvent) => {
      const t = readTouchPoint(e.changedTouches, pullTouchId)
      if (t) onProductRevealGestureEnd(t.clientX, t.clientY)
      else resetProductPull()
    }

    const onProductRevealPointerDown = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      onProductRevealGestureStart(e.clientX, e.clientY, e.pointerId)
    }

    const onProductRevealPointerMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || pullTouchId !== e.pointerId) return
      onProductRevealGestureMove(e.clientX, e.clientY)
    }

    const onProductRevealPointerUp = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || pullTouchId !== e.pointerId) return
      onProductRevealGestureEnd(e.clientX, e.clientY)
    }

    const onProductRevealWheel = (e: WheelEvent) => {
      if (!isProductPhoneChrome() || !compact || !canUseProductRevealGesture()) return
      if (e.deltaY >= -8) return
      if (!touchStartsInProductRevealZone(e.clientY) && readCachedScrollTop() > 96) return
      pullHandled = true
      resetPendingScroll()
      syncCompact(false)
    }

    const touchOpts: AddEventListenerOptions = { passive: true, capture: true }
    if (isProductPhoneChrome()) {
      document.addEventListener('touchstart', onProductPullTouchStart, touchOpts)
      document.addEventListener('touchmove', onProductPullTouchMove, touchOpts)
      document.addEventListener('touchend', onProductPullTouchEnd, touchOpts)
      document.addEventListener('touchcancel', onProductPullTouchEnd, touchOpts)
      document.addEventListener('pointerdown', onProductRevealPointerDown, touchOpts)
      document.addEventListener('pointermove', onProductRevealPointerMove, touchOpts)
      document.addEventListener('pointerup', onProductRevealPointerUp, touchOpts)
      document.addEventListener('pointercancel', onProductRevealPointerUp, touchOpts)
      document.addEventListener('wheel', onProductRevealWheel, { passive: true, capture: true })
    }

    return () => {
      window.clearTimeout(suppressFlushTimer)
      cancelRaf()
      unbindScroll()
      window.removeEventListener('wattaChromeCompactChange', syncCompactFromDom)
      window.removeEventListener('resize', onResize)
      document.removeEventListener('touchstart', onProductPullTouchStart, touchOpts)
      document.removeEventListener('touchmove', onProductPullTouchMove, touchOpts)
      document.removeEventListener('touchend', onProductPullTouchEnd, touchOpts)
      document.removeEventListener('touchcancel', onProductPullTouchEnd, touchOpts)
      document.removeEventListener('pointerdown', onProductRevealPointerDown, touchOpts)
      document.removeEventListener('pointermove', onProductRevealPointerMove, touchOpts)
      document.removeEventListener('pointerup', onProductRevealPointerUp, touchOpts)
      document.removeEventListener('pointercancel', onProductRevealPointerUp, touchOpts)
      document.removeEventListener('wheel', onProductRevealWheel, { capture: true })
      const nextPath = window.location.pathname || '/'
      if (!isWattaProductPathname(nextPath)) {
        delete document.documentElement.dataset.wattaChromeCompact
        delete document.documentElement.dataset.wattaProductHeaderExpanded
        clearWattaProductChromeEntry()
      }
    }
  }, [enabled, isProductPage, isPhone, pathname])
}
