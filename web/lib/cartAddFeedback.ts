import { isWattaPhoneViewport } from '@/lib/wattaTouchViewport'

export type CartAddFeedbackSource = {
  sourceEl: HTMLElement | null
  imageUrl?: string | null
  emoji?: string
}

function isVisible(el: HTMLElement): boolean {
  const style = getComputedStyle(el)
  if (style.display === 'none' || style.visibility === 'hidden') return false
  const rect = el.getBoundingClientRect()
  return rect.width > 4 && rect.height > 4
}

const WATTA_MOBILE_CART_BAR_SELECTOR = '.watta-mobile-cart-bar'
const WATTA_MOBILE_CART_ICON_SELECTOR = '.watta-mobile-cart-bar__ico'

export function findCartTargetElement(): HTMLElement | null {
  if (typeof document === 'undefined') return null

  // Phone UX: fly into the bottom green bar (not the header / compact chrome).
  if (isWattaPhoneViewport()) {
    const icon = document.querySelector<HTMLElement>(WATTA_MOBILE_CART_ICON_SELECTOR)
    if (icon && isVisible(icon)) return icon
    const bar = document.querySelector<HTMLElement>(WATTA_MOBILE_CART_BAR_SELECTOR)
    if (bar && isVisible(bar)) return bar
    return null
  }

  const headerFallback = document.querySelector<HTMLElement>('.header-cart-btn-text-web')
  if (headerFallback && isVisible(headerFallback)) return headerFallback

  const marked = Array.from(document.querySelectorAll<HTMLElement>('[data-watta-cart-target]'))
  for (const el of marked) {
    if (isVisible(el)) return el
  }

  return null
}

export function pulseCartTarget(): void {
  const target = findCartTargetElement()
  if (!target) return
  target.classList.remove('watta-cart-target-pulse')
  void target.offsetWidth
  target.classList.add('watta-cart-target-pulse')
  window.setTimeout(() => target.classList.remove('watta-cart-target-pulse'), 650)
}

/** Анімація фото/emoji з картки до іконки кошика (шапка або compact-chrome на телефоні). */
export function flyProductImageToCart(source: CartAddFeedbackSource): void {
  if (typeof document === 'undefined' || !source.sourceEl) return

  const target = findCartTargetElement()
  if (!target) return

  const sourceRect = source.sourceEl.getBoundingClientRect()
  const targetRect = target.getBoundingClientRect()
  if (sourceRect.width < 8 || sourceRect.height < 8) return

  const size = Math.min(sourceRect.width, sourceRect.height, 112)
  const ghost = document.createElement('div')
  ghost.className = 'watta-fly-to-cart-ghost'
  ghost.setAttribute('aria-hidden', 'true')

  const startX = sourceRect.left + sourceRect.width / 2 - size / 2
  const startY = sourceRect.top + sourceRect.height / 2 - size / 2
  ghost.style.width = `${size}px`
  ghost.style.height = `${size}px`
  ghost.style.left = `${startX}px`
  ghost.style.top = `${startY}px`

  const imageUrl = source.imageUrl?.trim()
  if (imageUrl) {
    const img = document.createElement('img')
    img.src = imageUrl
    img.alt = ''
    img.decoding = 'async'
    ghost.appendChild(img)
  } else {
    ghost.classList.add('watta-fly-to-cart-ghost--emoji')
    ghost.textContent = source.emoji ?? '🍣'
    ghost.style.fontSize = `${Math.round(size * 0.42)}px`
  }

  document.body.appendChild(ghost)

  const endX = targetRect.left + targetRect.width / 2 - size / 2
  const endY = targetRect.top + targetRect.height / 2 - size / 2
  const dx = endX - startX
  const dy = endY - startY

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      ghost.style.transform = `translate(${dx}px, ${dy}px) scale(0.14)`
      ghost.style.opacity = '0.2'
    })
  })

  const cleanup = () => {
    ghost.remove()
    pulseCartTarget()
  }

  ghost.addEventListener('transitionend', cleanup, { once: true })
  window.setTimeout(cleanup, 720)
}

export function runCartAddFeedback(source: CartAddFeedbackSource): void {
  if (typeof window === 'undefined') {
    flyProductImageToCart(source)
    return
  }
  flyProductImageToCart(source)
}
