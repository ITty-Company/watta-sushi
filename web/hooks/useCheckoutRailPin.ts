'use client'

import { useLayoutEffect, type RefObject } from 'react'

const DESKTOP_MQ = '(min-width: 768px)'

function readStickyTopPx(): number {
  if (typeof document === 'undefined') return 142
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue('--watta-sticky-chrome-flow-h')
    .trim()
  const chrome = parseFloat(raw) || 132
  return chrome + 10
}

export function useCheckoutRailPin(
  layoutRef: RefObject<HTMLElement | null>,
  asideRef: RefObject<HTMLElement | null>,
  railRef: RefObject<HTMLElement | null>,
  spacerRef: RefObject<HTMLElement | null>,
  enabled: boolean,
) {
  useLayoutEffect(() => {
    if (!enabled) return

    const layout = layoutRef.current
    const aside = asideRef.current
    const rail = railRef.current
    const spacer = spacerRef.current
    if (!layout || !aside || !rail || !spacer) return

    const mq = window.matchMedia(DESKTOP_MQ)
    let raf = 0

    const resetRail = () => {
      rail.classList.remove('watta-cart-checkout-rail--fixed')
      rail.style.removeProperty('left')
      rail.style.removeProperty('width')
      rail.style.removeProperty('top')
      spacer.style.height = '0'
    }

    const sync = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        if (!mq.matches) {
          resetRail()
          return
        }

        const top = readStickyTopPx()
        const asideRect = aside.getBoundingClientRect()
        const layoutRect = layout.getBoundingClientRect()
        const railHeight = rail.offsetHeight

        if (railHeight <= 0 || layoutRect.bottom <= 0 || layoutRect.top >= window.innerHeight) {
          resetRail()
          return
        }

        if (asideRect.top >= top) {
          resetRail()
          return
        }

        const maxTop = layoutRect.bottom - railHeight
        if (maxTop < 0) {
          resetRail()
          return
        }

        let left = asideRect.left
        let width = asideRect.width
        const layoutRight = Math.min(layoutRect.right, window.innerWidth - 8)
        const layoutLeft = Math.max(layoutRect.left, 8)
        width = Math.min(width, layoutRight - layoutLeft)
        left = Math.min(Math.max(left, layoutLeft), layoutRight - width)

        const fixedTop = Math.min(top, maxTop)
        spacer.style.height = `${railHeight}px`
        rail.classList.add('watta-cart-checkout-rail--fixed')
        rail.style.left = `${left}px`
        rail.style.width = `${width}px`
        rail.style.top = `${fixedTop}px`
      })
    }

    sync()

    window.addEventListener('scroll', sync, { passive: true })
    window.addEventListener('resize', sync)
    window.addEventListener('wattaChromeCompactChange', sync)
    mq.addEventListener('change', sync)

    const ro =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(sync)
        : null
    ro?.observe(layout)
    ro?.observe(aside)
    ro?.observe(rail)

    const chromePortal = document.querySelector('.watta-sticky-chrome-portal')
    if (chromePortal instanceof HTMLElement) {
      ro?.observe(chromePortal)
    }

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', sync)
      window.removeEventListener('resize', sync)
      window.removeEventListener('wattaChromeCompactChange', sync)
      mq.removeEventListener('change', sync)
      ro?.disconnect()
      resetRail()
    }
  }, [enabled, layoutRef, asideRef, railRef, spacerRef])
}
