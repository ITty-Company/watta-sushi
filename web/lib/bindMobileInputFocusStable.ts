import { isWattaPhoneViewport, WATTA_PHONE_VIEWPORT_MQ } from '@/lib/wattaTouchViewport'

export const WATTA_INPUT_FOCUSED_ATTR = 'data-watta-input-focused'

function isTextLikeField(el: EventTarget | null): el is HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement {
  if (!(el instanceof HTMLElement)) return false
  if (el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) return true
  if (el instanceof HTMLInputElement) {
    const type = (el.type || 'text').toLowerCase()
    return !['checkbox', 'radio', 'range', 'file', 'button', 'submit', 'reset', 'hidden', 'color'].includes(type)
  }
  return false
}

const WATTA_AUTH_MODAL_OPEN_ATTR = 'data-watta-auth-modal-open'
const WATTA_AUTH_KEYBOARD_SHADE_VAR = '--watta-auth-keyboard-shade-h'

function isAuthModalOpen(): boolean {
  return document.documentElement.hasAttribute(WATTA_AUTH_MODAL_OPEN_ATTR)
}

function clearAuthKeyboardShade() {
  document.documentElement.style.removeProperty(WATTA_AUTH_KEYBOARD_SHADE_VAR)
}

function updateAuthKeyboardShade() {
  const root = document.documentElement
  if (
    !window.matchMedia(WATTA_PHONE_VIEWPORT_MQ).matches ||
    !isWattaPhoneViewport() ||
    !isAuthModalOpen() ||
    !root.hasAttribute(WATTA_INPUT_FOCUSED_ATTR)
  ) {
    clearAuthKeyboardShade()
    return
  }
  const vv = window.visualViewport
  if (!vv) {
    clearAuthKeyboardShade()
    return
  }
  const gap = Math.max(0, Math.round(window.innerHeight - (vv.offsetTop + vv.height)))
  if (gap <= 0) {
    clearAuthKeyboardShade()
    return
  }
  root.style.setProperty(WATTA_AUTH_KEYBOARD_SHADE_VAR, `${gap}px`)
}

function onVisualViewportChange() {
  updateAuthKeyboardShade()
}

function bindAuthKeyboardShade() {
  const vv = window.visualViewport
  if (!vv) return
  vv.addEventListener('resize', onVisualViewportChange)
  vv.addEventListener('scroll', onVisualViewportChange)
  updateAuthKeyboardShade()
  window.setTimeout(updateAuthKeyboardShade, 80)
  window.setTimeout(updateAuthKeyboardShade, 280)
}

function unbindAuthKeyboardShade() {
  const vv = window.visualViewport
  vv?.removeEventListener('resize', onVisualViewportChange)
  vv?.removeEventListener('scroll', onVisualViewportChange)
  clearAuthKeyboardShade()
}

/** Телефон: фокус у полі не зсуває сторінку / fixed-панелі (Safari scroll-on-focus). */
export function bindMobileInputFocusStable(): () => void {
  if (typeof window === 'undefined') return () => {}

  const mq = window.matchMedia(WATTA_PHONE_VIEWPORT_MQ)
  let focusDepth = 0
  let authKeyboardShadeBound = false
  let pinnedScrollY = 0
  let scrollPinRaf = 0
  let scrollRestoreTimer = 0

  const pinDocumentScroll = () => {
    pinnedScrollY = window.scrollY
    cancelAnimationFrame(scrollPinRaf)
    scrollPinRaf = requestAnimationFrame(() => {
      window.scrollTo(0, pinnedScrollY)
      scrollPinRaf = requestAnimationFrame(() => window.scrollTo(0, pinnedScrollY))
    })
  }

  const setFocused = (active: boolean) => {
    const root = document.documentElement
    if (active) {
      root.setAttribute(WATTA_INPUT_FOCUSED_ATTR, '1')
    } else {
      root.removeAttribute(WATTA_INPUT_FOCUSED_ATTR)
    }
  }

  const onFocusIn = (event: FocusEvent) => {
    if (!mq.matches || !isWattaPhoneViewport()) return
    if (!isTextLikeField(event.target)) return
    focusDepth += 1
    setFocused(true)
    pinDocumentScroll()
    if (isAuthModalOpen() && !authKeyboardShadeBound) {
      bindAuthKeyboardShade()
      authKeyboardShadeBound = true
    }
  }

  const onFocusOut = (event: FocusEvent) => {
    if (!mq.matches || !isWattaPhoneViewport()) return
    if (!isTextLikeField(event.target)) return
    focusDepth = Math.max(0, focusDepth - 1)
    if (focusDepth === 0) {
      setFocused(false)
      if (authKeyboardShadeBound) {
        unbindAuthKeyboardShade()
        authKeyboardShadeBound = false
      }
    }
  }

  const onScrollWhileFocused = () => {
    if (focusDepth <= 0) return
    window.clearTimeout(scrollRestoreTimer)
    scrollRestoreTimer = window.setTimeout(pinDocumentScroll, 0)
  }

  const bind = () => {
    if (!mq.matches) {
      focusDepth = 0
      setFocused(false)
      if (authKeyboardShadeBound) {
        unbindAuthKeyboardShade()
        authKeyboardShadeBound = false
      }
    }
  }

  document.addEventListener('focusin', onFocusIn, true)
  document.addEventListener('focusout', onFocusOut, true)
  window.addEventListener('scroll', onScrollWhileFocused, { passive: true, capture: true })
  mq.addEventListener('change', bind)

  return () => {
    document.removeEventListener('focusin', onFocusIn, true)
    document.removeEventListener('focusout', onFocusOut, true)
    window.removeEventListener('scroll', onScrollWhileFocused, { capture: true })
    mq.removeEventListener('change', bind)
    cancelAnimationFrame(scrollPinRaf)
    window.clearTimeout(scrollRestoreTimer)
    focusDepth = 0
    setFocused(false)
    if (authKeyboardShadeBound) {
      unbindAuthKeyboardShade()
      authKeyboardShadeBound = false
    }
  }
}
