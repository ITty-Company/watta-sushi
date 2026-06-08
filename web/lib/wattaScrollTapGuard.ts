/**
 * Відрізняє свайп/скрол від навмисного тапу — блокує випадкове відкриття товару під час прокрутки.
 */

const MOVE_THRESHOLD_PX = 10
const POST_SCROLL_SUPPRESS_MS = 200

let activePointerId: number | null = null
let startX = 0
let startY = 0
let pointerMoved = false
let lastScrollAt = 0
let bound = false

function isDocumentScrolling(): boolean {
  if (typeof document === 'undefined') return false
  return document.documentElement.dataset.wattaScrolling === 'true'
}

export function markScrollGesture(): void {
  lastScrollAt = Date.now()
}

/** Чи варто ігнорувати клік/навігацію (користувач скролив або палець зсунувся). */
export function shouldSuppressTapNavigation(): boolean {
  if (pointerMoved) return true
  if (isDocumentScrolling()) return true
  return Date.now() - lastScrollAt < POST_SCROLL_SUPPRESS_MS
}

/** Після click: скидає прапорець руху пальця. */
export function consumePointerScrollGesture(): boolean {
  const suppress = shouldSuppressTapNavigation()
  pointerMoved = false
  activePointerId = null
  return suppress
}

/** Один раз на вкладку: pointermove + scroll → suppress для всіх лінків. */
export function bindWattaScrollTapGuard(): () => void {
  if (typeof document === 'undefined' || bound) return () => {}
  bound = true

  const onPointerDown = (e: PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    activePointerId = e.pointerId
    startX = e.clientX
    startY = e.clientY
    pointerMoved = false
  }

  const onPointerMove = (e: PointerEvent) => {
    if (activePointerId !== e.pointerId) return
    const dx = e.clientX - startX
    const dy = e.clientY - startY
    if (Math.abs(dx) > MOVE_THRESHOLD_PX || Math.abs(dy) > MOVE_THRESHOLD_PX) {
      pointerMoved = true
    }
  }

  const onPointerUp = (e: PointerEvent) => {
    if (activePointerId !== e.pointerId) return
    activePointerId = null
  }

  const onPointerCancel = () => {
    pointerMoved = true
    activePointerId = null
  }

  const onScroll = () => markScrollGesture()

  const opts = { capture: true, passive: true } as const
  document.addEventListener('pointerdown', onPointerDown, opts)
  document.addEventListener('pointermove', onPointerMove, opts)
  document.addEventListener('pointerup', onPointerUp, opts)
  document.addEventListener('pointercancel', onPointerCancel, opts)
  document.addEventListener('scroll', onScroll, opts)

  return () => {
    bound = false
    document.removeEventListener('pointerdown', onPointerDown, opts)
    document.removeEventListener('pointermove', onPointerMove, opts)
    document.removeEventListener('pointerup', onPointerUp, opts)
    document.removeEventListener('pointercancel', onPointerCancel, opts)
    document.removeEventListener('scroll', onScroll, opts)
    activePointerId = null
    pointerMoved = false
    lastScrollAt = 0
  }
}
