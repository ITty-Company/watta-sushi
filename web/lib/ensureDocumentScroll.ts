/**
 * Скидає inline-стилі, які інколи лишаються після drawer/модалок/сплешу
 * і блокують вертикальний скрол на iOS/Android.
 */

const SCROLL_LOCK_OVERLAY_SELECTORS = [
  '#watta-cart-drawer.is-open',
  '#watta-notifications-drawer.is-open',
  '.watta-nav-sidebar-overlay.is-open',
  '.watta-kitchen-closed-overlay',
  '.location-picker-backdrop',
  '.watta-review-compose-backdrop',
  '.fixed.inset-0[role="dialog"][aria-modal="true"]',
] as const

/** Чи відкритий drawer/модалка, що навмисно блокує скрол документа. */
export function isScrollLockOverlayActive(): boolean {
  if (typeof document === 'undefined') return false
  const html = document.documentElement
  const body = document.body

  if (html.getAttribute('data-watta-boot-splash-pending') === '1') return true
  if (html.getAttribute('data-watta-boot-splash') === '1') return true
  if (html.hasAttribute('data-watta-auth-modal-open')) return true
  if (html.hasAttribute('data-watta-nav-drawer-open')) return true
  if (html.hasAttribute('data-watta-cart-drawer-open')) return true
  if (body.classList.contains('watta-review-compose-open')) return true
  if (body.classList.contains('watta-auth-route')) return true

  for (const sel of SCROLL_LOCK_OVERLAY_SELECTORS) {
    if (document.querySelector(sel)) return true
  }
  return false
}

/** Чи body/html заблоковані без активної модалки (типовий «залипший» скрол). */
export function isDocumentScrollAccidentallyLocked(): boolean {
  if (typeof document === 'undefined') return false
  if (isScrollLockOverlayActive()) return false

  const { body, documentElement: html } = document
  if (!body) return false

  if (body.style.overflow === 'hidden') return true
  if (body.style.position === 'fixed') return true
  if (html.style.overflow === 'hidden') return true

  const bodyOverflowY = getComputedStyle(body).overflowY
  if (bodyOverflowY === 'hidden' && !body.classList.contains('watta-auth-route')) {
    return true
  }

  const htmlOverflowY = getComputedStyle(html).overflowY
  if (htmlOverflowY === 'hidden' && !body.classList.contains('watta-auth-route')) {
    return true
  }

  return false
}

export function ensureDocumentScrollUnlocked(): void {
  if (typeof document === 'undefined') return
  const { body, documentElement: html } = document
  if (!body) return
  body.style.overflow = ''
  body.style.position = ''
  body.style.top = ''
  body.style.left = ''
  body.style.right = ''
  body.style.width = ''
  body.style.height = ''
  body.style.minHeight = ''
  body.style.touchAction = ''
  html.style.overflow = ''
  html.style.height = ''
  html.style.width = ''
}
