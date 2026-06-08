'use client'

import { useLayoutEffect } from 'react'
import { usePathname } from 'next/navigation'
import { bindAppVerticalScroll, readAppScrollTop } from '@/lib/menuScroll'
import { consumeRestoreChromeCompact, isWattaChromeCompactLocked } from '@/lib/wattaChromeScroll'
import { createRafScrollListener } from '@/lib/scrollSync'
import {
  isWattaPhoneViewport,
  isWattaTouchScrollPerfViewport,
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
const SCROLL_UP_THRESHOLD_PX = 22
/** Телефон: накопичений зсув (iOS дає дрібні scroll-події). */
const PHONE_SCROLL_DOWN_THRESHOLD_PX = 16
const PHONE_SCROLL_UP_THRESHOLD_PX = 14
/** Тач: рідше вимірюємо scrollTop — менше layout під час свайпу. */
const TOUCH_SCROLL_EVAL_MIN_MS = 56
/** /product (телефон): швидше розгортання шапки після скролу вгору. */
const PRODUCT_PHONE_SCROLL_UP_THRESHOLD_PX = 6
/** /product (десктоп): поріг жесту вгору. */
const PRODUCT_SCROLL_UP_THRESHOLD_PX = 12
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
  if (root.classList.contains(WATTA_ROUTE_PRODUCT_CLASS)) {
    return root.dataset.wattaProductHeaderExpanded !== 'true'
  }
  return root.dataset.wattaChromeCompact === 'true'
}

/**
 * Публічний сайт (усі маршрути з WattaStickyChromeLayout), усі viewport.
 * Вниз — лише панель категорій; вгору — повна шапка + категорії.
 * /product: при вході лише категорії; вгору — повна шапка.
 */
export function useWattaChromeScrollCompact(enabled = true) {
  const pathname = usePathname() || '/'
  const isProductPage = isWattaProductPathname(pathname)

  useLayoutEffect(() => {
    if (!enabled || typeof window === 'undefined') return

    let compact = false
    let lastY = readAppScrollTop()
    let pendingDownPx = 0
    let pendingUpPx = 0
    let suppressUntil = 0
    let suppressFlushTimer = 0
    let restoredCompact = false
    let topAutoExpandArmed = !isProductPage

    const resetPendingScroll = () => {
      pendingDownPx = 0
      pendingUpPx = 0
    }

    const syncCompact = (next: boolean) => {
      if (next === compact) return
      compact = next
      if (isProductPage) {
        setWattaProductChromeHeaderExpanded(!next)
      } else {
        applyCompactAttr(next)
      }
      const cooldown = isProductPage ? PRODUCT_COMPACT_TOGGLE_COOLDOWN_MS : COMPACT_TOGGLE_COOLDOWN_MS
      suppressUntil = performance.now() + cooldown
      resetPendingScroll()
      requestAnimationFrame(() => {
        lastY = readAppScrollTop()
      })
      window.clearTimeout(suppressFlushTimer)
      suppressFlushTimer = window.setTimeout(() => {
        lastY = readAppScrollTop()
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
      if (isPhone && isProductPage) return PRODUCT_PHONE_SCROLL_UP_THRESHOLD_PX
      if (isPhone) return PHONE_SCROLL_UP_THRESHOLD_PX
      if (isProductPage) return PRODUCT_SCROLL_UP_THRESHOLD_PX
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
        const upDelta = -delta
        pendingUpPx += upDelta
        pendingDownPx = 0
        if (pendingUpPx >= upThreshold || (isProductPage && upDelta >= upThreshold * 2)) {
          pendingUpPx = 0
          syncCompact(false)
        }
      }
    }

    const evaluateScroll = () => {
      const y = readAppScrollTop()
      const isPhone = isWattaPhoneViewport()

      if (isWattaChromeCompactLocked()) {
        lastY = y
        resetPendingScroll()
        return
      }

      if (performance.now() < suppressUntil) {
        const deltaDuringSuppress = y - lastY
        lastY = y
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
        if (y > TOP_ALWAYS_EXPAND_PX) {
          topAutoExpandArmed = true
        } else {
          lastY = y
          resetPendingScroll()
          return
        }
      }

      const downThreshold = readDownThreshold(isPhone)
      const upThreshold = readUpThreshold(isPhone)

      if (y <= TOP_ALWAYS_EXPAND_PX) {
        if (!isProductPage) {
          syncCompact(false)
        } else if (compact) {
          const deltaTop = y - lastY
          if (deltaTop <= 0) {
            syncCompact(false)
          }
        }
        lastY = y
        resetPendingScroll()
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
      lastY = readAppScrollTop()
      resetPendingScroll()
      if (lastY <= TOP_ALWAYS_EXPAND_PX) {
        if (!isProductPage) syncCompact(false)
        return
      }
      if (!isProductPage) syncCompact(true)
    }

    const unbindScroll = bindAppVerticalScroll(onScroll)

    const syncCompactFromDom = () => {
      const domCompact = readDomCompact()
      if (domCompact === compact) return
      compact = domCompact
      lastY = readAppScrollTop()
      suppressUntil = performance.now() + COMPACT_TOGGLE_COOLDOWN_MS
    }

    if (consumeRestoreChromeCompact()) {
      compact = true
      if (isProductPage) {
        applyWattaProductChromeEntry()
      } else {
        applyCompactAttr(true)
      }
      lastY = readAppScrollTop()
      restoredCompact = true
      topAutoExpandArmed = false
    } else if (isProductPage) {
      const alreadyOnProduct = isWattaProductChromeActive()
      applyWattaProductChromeEntry()
      compact = true
      lastY = readAppScrollTop()
      topAutoExpandArmed = true
      suppressUntil =
        performance.now() +
        (alreadyOnProduct ? PRODUCT_SWITCH_SCROLL_SUPPRESS_MS : PRODUCT_FIRST_NAV_SCROLL_SUPPRESS_MS)
    } else {
      syncInitial()
    }

    window.addEventListener('wattaChromeCompactChange', syncCompactFromDom)

    const onResize = () => {
      lastY = readAppScrollTop()
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
      if (!isProductPage || !compact || pullHandled) return
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
      if (!isProductPage || !canUseProductRevealGesture()) return
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
      if (!isProductPage || !compact || !canUseProductRevealGesture()) return
      if (e.deltaY >= -8) return
      if (!touchStartsInProductRevealZone(e.clientY) && readAppScrollTop() > 96) return
      pullHandled = true
      resetPendingScroll()
      syncCompact(false)
    }

    const touchOpts: AddEventListenerOptions = { passive: true, capture: true }
    if (isProductPage) {
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
  }, [enabled, isProductPage, pathname])
}
