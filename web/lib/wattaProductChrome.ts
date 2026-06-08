import { isWattaProductPathname } from '@/lib/wattaHtmlRouteClass'
import { WATTA_CHROME_LAYOUT_SYNC_EVENT } from '@/lib/wattaChromeGoHome'
import { isWattaPhoneViewport } from '@/lib/wattaTouchViewport'

/** Клас на <html> — CSS ховає верхню шапку на /product. */
export const WATTA_ROUTE_PRODUCT_CLASS = 'watta-route-product'

/** Показати повну шапку (лого, нав) після свідомого скролу вгору на /product. */
export const WATTA_PRODUCT_HEADER_EXPANDED_ATTR = 'wattaProductHeaderExpanded'

function dispatchCompactChange(compact: boolean): void {
  window.dispatchEvent(new CustomEvent('wattaChromeCompactChange', { detail: { compact } }))
}

/** Телефон: лише панель категорій. Планшет/десктоп: повна шапка з кнопкою кошика. */
export function applyWattaProductChromeEntry(): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.classList.add(WATTA_ROUTE_PRODUCT_CLASS)
  delete root.dataset[WATTA_PRODUCT_HEADER_EXPANDED_ATTR]
  if (isWattaPhoneViewport()) {
    root.dataset.wattaChromeCompact = 'true'
  } else {
    delete root.dataset.wattaChromeCompact
  }
  window.dispatchEvent(new Event(WATTA_CHROME_LAYOUT_SYNC_EVENT))
}

/** Повна шапка на /product (після скролу вгору). */
export function setWattaProductChromeHeaderExpanded(expanded: boolean): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  if (!root.classList.contains(WATTA_ROUTE_PRODUCT_CLASS)) {
    if (expanded) {
      delete root.dataset.wattaChromeCompact
    } else {
      root.dataset.wattaChromeCompact = 'true'
    }
    dispatchCompactChange(!expanded)
    return
  }
  if (expanded) {
    root.dataset[WATTA_PRODUCT_HEADER_EXPANDED_ATTR] = 'true'
    delete root.dataset.wattaChromeCompact
  } else {
    delete root.dataset[WATTA_PRODUCT_HEADER_EXPANDED_ATTR]
    root.dataset.wattaChromeCompact = 'true'
  }
  dispatchCompactChange(!expanded)
  window.dispatchEvent(new Event(WATTA_CHROME_LAYOUT_SYNC_EVENT))
}

/** Вимкнути product-chrome (при виході з /product). */
export function clearWattaProductChromeEntry(): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.classList.remove(WATTA_ROUTE_PRODUCT_CLASS)
  delete root.dataset[WATTA_PRODUCT_HEADER_EXPANDED_ATTR]
  window.dispatchEvent(new Event(WATTA_CHROME_LAYOUT_SYNC_EVENT))
}

/** Перед SPA-переходом на картку — без спалаху повної шапки. */
export function primeProductPageChrome(): void {
  applyWattaProductChromeEntry()
}

export function syncWattaProductChromeForPathname(pathname: string): void {
  if (typeof document === 'undefined') return
  if (isWattaProductPathname(pathname)) {
    applyWattaProductChromeEntry()
  } else {
    clearWattaProductChromeEntry()
  }
}

export function isWattaProductChromeActive(): boolean {
  if (typeof document === 'undefined') return false
  return document.documentElement.classList.contains(WATTA_ROUTE_PRODUCT_CLASS)
}
