import { cancelRouteScrollToTopOnNavigation } from '@/lib/menuScroll'
import { isWattaCompactChromeViewport, isWattaPhoneViewport } from '@/lib/wattaTouchViewport'
import { WATTA_PRODUCT_HEADER_EXPANDED_ATTR, WATTA_ROUTE_PRODUCT_CLASS } from '@/lib/wattaProductChrome'

/** Навігація по стрічці категорій — не скидати scroll/compact на наступному маршруті. */
export const WATTA_SKIP_SCROLL_RESET_KEY = 'wattaSkipNextScrollReset'
export const WATTA_RESTORE_CHROME_COMPACT_KEY = 'wattaRestoreChromeCompact'
/** Клік по чіпу з іншої сторінки — на `/menu` скинути scroll попереднього маршруту і перейти до заголовка. */
export const WATTA_PENDING_MENU_CAT_KEY = 'wattaPendingMenuCatScroll'

let compactLockTimer = 0

export function isWattaChromeCompact(): boolean {
  if (typeof document === 'undefined') return false
  if (!isWattaPhoneViewport()) return false
  const root = document.documentElement
  if (root.classList.contains(WATTA_ROUTE_PRODUCT_CLASS)) {
    return root.dataset[WATTA_PRODUCT_HEADER_EXPANDED_ATTR] !== 'true'
  }
  return root.dataset.wattaChromeCompact === 'true'
}

export function isWattaChromeCompactLocked(): boolean {
  if (typeof document === 'undefined') return false
  return document.documentElement.dataset.wattaChromeCompactLock === 'true'
}

/** Висота верхньої смуги (лого + нав) — для компенсації scroll при compact. */
export function readChromeHeaderBandHeightPx(): number {
  if (typeof document === 'undefined') return 76
  const cs = getComputedStyle(document.documentElement)
  const header = parseFloat(cs.getPropertyValue('--watta-chrome-header-measured-h'))
  if (Number.isFinite(header) && header >= 36) return Math.round(header)
  const measured = parseFloat(cs.getPropertyValue('--watta-sticky-chrome-measured-h'))
  const band = parseFloat(cs.getPropertyValue('--watta-chrome-categories-band-h'))
  if (Number.isFinite(measured) && Number.isFinite(band) && measured > band + 20) {
    return Math.round(measured - band)
  }
  const w = typeof window !== 'undefined' ? window.innerWidth : 390
  return w <= 767 ? 76 : 86
}

/** Зсув під повну шапку (без compact) — для scroll-margin на /menu, щоб не стрибало при зміні compact. */
export function readExpandedStickyChromeScrollOffset(): number {
  if (typeof document === 'undefined') return 148
  const cs = getComputedStyle(document.documentElement)
  const measured = parseFloat(cs.getPropertyValue('--watta-sticky-chrome-measured-h'))
  if (Number.isFinite(measured) && measured >= 72) return Math.round(measured + 12)
  const w = typeof window !== 'undefined' ? window.innerWidth : 1200
  return w <= 768 ? 148 : w <= 1024 ? 118 : 168
}

/** CSS scroll-margin для секцій меню — стабільний, не залежить від compact. */
export const FULL_MENU_SECTION_SCROLL_MARGIN =
  'calc(var(--watta-sticky-chrome-measured-h, 148px) + 12px)' as const

export const FULL_MENU_HEADING_SCROLL_MARGIN =
  'calc(var(--watta-sticky-chrome-measured-h, 148px) + 36px)' as const

/** Програмний скрол до заголовка категорії — узгоджено з FULL_MENU_HEADING_SCROLL_MARGIN (+36px). */
export function readFullMenuCategoryHeadingScrollOffset(): number {
  if (typeof document === 'undefined') return 184
  const cs = getComputedStyle(document.documentElement)
  const measured = parseFloat(cs.getPropertyValue('--watta-sticky-chrome-measured-h'))
  const safeTop =
    typeof window !== 'undefined'
      ? Math.max(0, parseFloat(cs.getPropertyValue('env(safe-area-inset-top)')) || 0)
      : 0
  if (Number.isFinite(measured) && measured >= 72) {
    return Math.round(measured + 36 + safeTop)
  }
  const w = typeof window !== 'undefined' ? window.innerWidth : 1200
  return w <= 768 ? 184 : w <= 1024 ? 154 : 204
}

/** Зсув для scroll до секції під fixed chrome (повна шапка або compact). */
export function readStickyChromeScrollOffset(): number {
  if (typeof document === 'undefined') return 148
  const root = document.documentElement
  const cs = getComputedStyle(root)
  const readVar = (name: string) => {
    const v = parseFloat(cs.getPropertyValue(name))
    return Number.isFinite(v) ? v : 0
  }
  const measured = readVar('--watta-sticky-chrome-measured-h')
  const categories = readVar('--watta-chrome-categories-band-h')
  const compact = isWattaChromeCompact()

  if (compact && categories >= 40) {
    return Math.round(categories + 22)
  }
  if (measured >= 72) {
    return Math.round(measured + 12)
  }

  const w = typeof window !== 'undefined' ? window.innerWidth : 1200
  return w <= 768 ? 148 : w <= 1024 ? 118 : 168
}

export function markMenuCategoryNavigation(opts?: { restoreCompact?: boolean }) {
  if (typeof window === 'undefined') return
  cancelRouteScrollToTopOnNavigation()
  const restoreCompact = opts?.restoreCompact !== false
  try {
    sessionStorage.setItem(WATTA_SKIP_SCROLL_RESET_KEY, '1')
    if (restoreCompact && isWattaChromeCompact()) {
      sessionStorage.setItem(WATTA_RESTORE_CHROME_COMPACT_KEY, '1')
    } else {
      sessionStorage.removeItem(WATTA_RESTORE_CHROME_COMPACT_KEY)
    }
  } catch {
    /* ignore */
  }
}

export function markPendingMenuCatScroll(slug: string): void {
  if (typeof window === 'undefined') return
  const trimmed = slug.trim()
  if (!trimmed) return
  try {
    sessionStorage.setItem(WATTA_PENDING_MENU_CAT_KEY, trimmed)
  } catch {
    /* ignore */
  }
}

export function consumePendingMenuCatScroll(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(WATTA_PENDING_MENU_CAT_KEY)
    sessionStorage.removeItem(WATTA_PENDING_MENU_CAT_KEY)
    const trimmed = raw?.trim()
    return trimmed ? trimmed : null
  } catch {
    return null
  }
}

export function consumeSkipScrollReset(): boolean {
  if (typeof window === 'undefined') return false
  try {
    if (sessionStorage.getItem(WATTA_SKIP_SCROLL_RESET_KEY) !== '1') return false
    sessionStorage.removeItem(WATTA_SKIP_SCROLL_RESET_KEY)
    return true
  } catch {
    return false
  }
}

/** Не скидати scroll наверх — лише під час скролу до секції на `/menu` (чіп у стрічці). */
export function shouldPreserveMenuCategoryScroll(): boolean {
  if (typeof window === 'undefined') return false
  if (window.location.pathname !== '/menu') return false
  try {
    if (sessionStorage.getItem(WATTA_SKIP_SCROLL_RESET_KEY) === '1') return true
    if (sessionStorage.getItem(WATTA_PENDING_MENU_CAT_KEY)) return true
  } catch {
    /* ignore */
  }
  return false
}

/** Залишки прапорців меню не повинні блокувати scroll-to-top на інших маршрутах. */
export function clearMenuScrollNavigationFlags(): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.removeItem(WATTA_SKIP_SCROLL_RESET_KEY)
    sessionStorage.removeItem(WATTA_PENDING_MENU_CAT_KEY)
    sessionStorage.removeItem(WATTA_RESTORE_CHROME_COMPACT_KEY)
  } catch {
    /* ignore */
  }
}

export function applyRestoreChromeCompactIfNeeded(): void {
  if (typeof document === 'undefined') return
  try {
    if (sessionStorage.getItem(WATTA_RESTORE_CHROME_COMPACT_KEY) === '1') {
      document.documentElement.dataset.wattaChromeCompact = 'true'
    }
  } catch {
    /* ignore */
  }
}

export function consumeRestoreChromeCompact(): boolean {
  if (typeof window === 'undefined') return false
  try {
    if (sessionStorage.getItem(WATTA_RESTORE_CHROME_COMPACT_KEY) !== '1') return false
    sessionStorage.removeItem(WATTA_RESTORE_CHROME_COMPACT_KEY)
    return true
  } catch {
    return false
  }
}

/** Під час програмного скролу — не перемикати compact/expand (зберігає поточний режим). */
export function lockWattaChromeCompactMutation(ms = 720): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  const wasCompact = isWattaChromeCompact()
  root.dataset.wattaChromeCompactLock = 'true'
  if (wasCompact) {
    root.dataset.wattaChromeCompact = 'true'
  }
  window.clearTimeout(compactLockTimer)
  compactLockTimer = window.setTimeout(() => {
    delete root.dataset.wattaChromeCompactLock
    if (wasCompact) {
      root.dataset.wattaChromeCompact = 'true'
      window.dispatchEvent(new CustomEvent('wattaChromeCompactChange', { detail: { compact: true } }))
    }
  }, ms)
}

/**
 * Перед скролом до категорії на /menu: повна шапка + блок compact,
 * щоб заголовок секції не «стрибав» і не ховався під різні висоти chrome.
 */
export function beginMenuCategoryScrollChromeLock(ms = 1400): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  const wasCompact = isWattaChromeCompact()
  let restoreCompactFromNav = false
  if (isWattaCompactChromeViewport() && typeof window !== 'undefined') {
    try {
      restoreCompactFromNav = sessionStorage.getItem(WATTA_RESTORE_CHROME_COMPACT_KEY) === '1'
    } catch {
      restoreCompactFromNav = false
    }
  }
  root.dataset.wattaChromeCompactLock = 'true'
  // Якщо користувач уже в «лише категорії» (compact), зберігаємо під час програмного скролу.
  // Повна шапка — лише після ручного скролу вгору.
  if (!(isWattaCompactChromeViewport() && (wasCompact || restoreCompactFromNav))) {
    delete root.dataset.wattaChromeCompact
    window.dispatchEvent(new CustomEvent('wattaChromeCompactChange', { detail: { compact: false } }))
  } else {
    root.dataset.wattaChromeCompact = 'true'
    window.dispatchEvent(new CustomEvent('wattaChromeCompactChange', { detail: { compact: true } }))
  }
  window.clearTimeout(compactLockTimer)
  compactLockTimer = window.setTimeout(() => {
    delete root.dataset.wattaChromeCompactLock
  }, ms)
}

export function preserveWattaChromeCompact<T>(fn: () => T): T {
  lockWattaChromeCompactMutation()
  return fn()
}
