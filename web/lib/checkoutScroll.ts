import {
  computeElementScrollTop,
  getVerticalScrollTarget,
  readScrollTop,
  writeScrollTop,
} from '@/lib/menuScroll'
import { readStickyChromeScrollOffset } from '@/lib/wattaChromeScroll'
import { isWattaPhoneViewport } from '@/lib/wattaTouchViewport'

const CHECKOUT_FOOT_SELECTOR = '[data-watta-cart-checkout-foot]'

/** Clearance under fixed «Заказать» footer on phone checkout. */
export function readCheckoutMobileFootInsetPx(): number {
  if (typeof window === 'undefined') return 0
  if (window.matchMedia('(min-width: 1024px)').matches) return 0

  const root = document.documentElement
  const fromVar = parseFloat(
    getComputedStyle(root).getPropertyValue('--watta-checkout-foot-clearance'),
  )
  if (Number.isFinite(fromVar) && fromVar > 48) return Math.ceil(fromVar)

  const foot = document.querySelector(CHECKOUT_FOOT_SELECTOR)
  if (!foot) return 104

  const rect = foot.getBoundingClientRect()
  const bottomGap = Math.max(
    12,
    parseFloat(getComputedStyle(root).getPropertyValue('--watta-cart-bar-bottom')) || 12,
  )
  return Math.ceil(rect.height + bottomGap + 16)
}

function scrollByDelta(delta: number, behavior: ScrollBehavior = 'smooth'): void {
  if (Math.abs(delta) < 4) return
  const target = getVerticalScrollTarget()
  writeScrollTop(target, readScrollTop(target) + delta, behavior)
}

/** Scroll a checkout field into the safe band between sticky chrome and fixed footer. */
export function scrollCheckoutFieldIntoView(
  el: HTMLElement,
  behavior: ScrollBehavior = 'smooth',
): void {
  const phone = typeof window !== 'undefined' && isWattaPhoneViewport()
  const scrollBehavior: ScrollBehavior = phone ? 'auto' : behavior
  const headerOffset = readStickyChromeScrollOffset() + 10
  const footerInset = readCheckoutMobileFootInsetPx()
  const rect = el.getBoundingClientRect()
  const viewportH = window.innerHeight
  const maxBottom = viewportH - footerInset - 12
  const minTop = headerOffset

  let delta = 0

  if (rect.bottom > maxBottom) {
    delta = rect.bottom - maxBottom
  } else if (rect.top < minTop) {
    delta = rect.top - minTop
  } else if (!phone) {
    const safeH = maxBottom - minTop
    const idealTop = minTop + Math.max(0, (safeH - rect.height) / 2)
    if (rect.top > maxBottom - rect.height || rect.top < minTop + 24) {
      delta = rect.top - idealTop
    }
  }

  scrollByDelta(delta, scrollBehavior)
}

/** Scroll a checkout section heading under sticky chrome. */
export function scrollCheckoutSectionIntoView(
  el: HTMLElement,
  behavior: ScrollBehavior = 'smooth',
): void {
  const target = getVerticalScrollTarget()
  const headerOffset = readStickyChromeScrollOffset() + 10
  writeScrollTop(target, computeElementScrollTop(el, headerOffset, target), behavior)
}
