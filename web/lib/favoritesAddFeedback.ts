import { isWattaPhoneViewport } from '@/lib/wattaTouchViewport'

export type FavoritesAddFeedbackSource = {
  sourceEl: HTMLElement | null
  emoji?: string
}

function isVisible(el: HTMLElement): boolean {
  const style = getComputedStyle(el)
  if (style.display === 'none' || style.visibility === 'hidden') return false
  const rect = el.getBoundingClientRect()
  return rect.width > 4 && rect.height > 4
}

const WATTA_MOBILE_FAV_FAB_SELECTOR = '.watta-mobile-fav-fab'

function findMobileFavoritesFab(): HTMLElement | null {
  const fab = document.querySelector<HTMLElement>(WATTA_MOBILE_FAV_FAB_SELECTOR)
  return fab && isVisible(fab) ? fab : null
}

function findFavoritesTargetElement(): HTMLElement | null {
  if (typeof document === 'undefined') return null

  // Phone UX: fly into the floating heart FAB above the cart bar (not the header).
  if (isWattaPhoneViewport()) {
    const fab = findMobileFavoritesFab()
    if (fab) return fab
    const header = document.querySelector<HTMLElement>('.header-favorites-btn-web')
    if (header && isVisible(header)) return header
    return null
  }

  const header = document.querySelector<HTMLElement>('.header-favorites-btn-web')
  if (header && isVisible(header)) return header

  const marked = Array.from(document.querySelectorAll<HTMLElement>('[data-watta-fav-target]'))
  for (const el of marked) {
    if (isVisible(el)) return el
  }

  return null
}

function findFavoritesPulseElement(): HTMLElement | null {
  if (typeof document === 'undefined') return null
  if (isWattaPhoneViewport()) {
    return findMobileFavoritesFab() ?? findFavoritesTargetElement()
  }
  return findFavoritesTargetElement()
}

function pulseFavoritesTarget(): void {
  const target = findFavoritesPulseElement()
  if (!target) return
  target.classList.remove('watta-fav-target-pulse')
  void target.offsetWidth
  target.classList.add('watta-fav-target-pulse')
  window.setTimeout(() => target.classList.remove('watta-fav-target-pulse'), 720)
}

function appendFlyHeartGhost(ghost: HTMLDivElement, size: number): void {
  ghost.innerHTML = `
    <svg viewBox="0 0 24 24" width="${Math.round(size * 0.52)}" height="${Math.round(size * 0.52)}" aria-hidden="true">
      <path
        d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
        fill="#ef4444"
        stroke="#ef4444"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  `
}

/** Анімація сердечка з картки до іконки обраного (шапка або мобільна FAB). */
export function flyFavoriteToTarget(source: FavoritesAddFeedbackSource): void {
  if (typeof document === 'undefined' || !source.sourceEl) return

  const target = findFavoritesTargetElement()
  if (!target) return

  const sourceRect = source.sourceEl.getBoundingClientRect()
  const targetRect = target.getBoundingClientRect()
  if (sourceRect.width < 8 || sourceRect.height < 8) return

  const size = Math.min(Math.max(32, Math.min(sourceRect.width, sourceRect.height)), 96)
  const ghost = document.createElement('div')
  ghost.setAttribute('aria-hidden', 'true')

  const startX = sourceRect.left + sourceRect.width / 2 - size / 2
  const startY = sourceRect.top + sourceRect.height / 2 - size / 2
  ghost.style.width = `${size}px`
  ghost.style.height = `${size}px`
  ghost.style.left = `${startX}px`
  ghost.style.top = `${startY}px`

  const endX = targetRect.left + targetRect.width / 2 - size / 2
  const endY = targetRect.top + targetRect.height / 2 - size / 2
  const dx = endX - startX
  const dy = endY - startY
  const useArcFly = isWattaPhoneViewport() && Boolean(findMobileFavoritesFab())

  if (useArcFly) {
    ghost.className = 'watta-fly-to-fav-ghost'
    appendFlyHeartGhost(ghost, size)
    ghost.style.setProperty('--watta-fly-dx', `${dx}px`)
    ghost.style.setProperty('--watta-fly-dy', `${dy}px`)
    ghost.style.setProperty('--watta-fly-arc', `${Math.min(48, Math.max(18, Math.abs(dx) * 0.14))}px`)
  } else {
    ghost.className = 'watta-fly-to-cart-ghost watta-fly-to-cart-ghost--emoji'
    ghost.textContent = source.emoji ?? '❤️'
    ghost.style.fontSize = `${Math.round(size * 0.5)}px`
  }

  document.body.appendChild(ghost)

  if (useArcFly) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => ghost.classList.add('is-flying'))
    })
  } else {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        ghost.style.transform = `translate(${dx}px, ${dy}px) scale(0.18)`
        ghost.style.opacity = '0.2'
      })
    })
  }

  const cleanup = () => {
    ghost.remove()
    pulseFavoritesTarget()
  }

  if (useArcFly) {
    ghost.addEventListener('animationend', cleanup, { once: true })
    window.setTimeout(cleanup, 920)
  } else {
    ghost.addEventListener('transitionend', cleanup, { once: true })
    window.setTimeout(cleanup, 740)
  }
}

export function runFavoritesAddFeedback(source: FavoritesAddFeedbackSource): void {
  flyFavoriteToTarget(source)
}
