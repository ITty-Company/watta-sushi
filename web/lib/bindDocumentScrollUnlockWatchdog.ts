import {
  ensureDocumentScrollUnlocked,
  isDocumentScrollAccidentallyLocked,
} from '@/lib/ensureDocumentScroll'

const WATCH_INTERVAL_MS = 2500

let bound = false

/** Знімає залишковий overflow:hidden / position:fixed, якщо модалок уже немає. */
export function recoverDocumentScrollIfStuck(): boolean {
  if (typeof document === 'undefined') return false
  if (!isDocumentScrollAccidentallyLocked()) return false
  ensureDocumentScrollUnlocked()
  return true
}

/** Підстраховка: drawer/модалка закрилась, а body лишився заблокованим. */
export function bindDocumentScrollUnlockWatchdog(): () => void {
  if (typeof window === 'undefined' || typeof document === 'undefined' || bound) {
    return () => {}
  }
  bound = true

  let intervalId = 0

  const check = () => {
    recoverDocumentScrollIfStuck()
  }

  const passiveCapture: AddEventListenerOptions = { passive: true, capture: true }
  document.addEventListener('touchend', check, passiveCapture)
  document.addEventListener('touchcancel', check, passiveCapture)
  window.addEventListener('pointerup', check, passiveCapture)
  window.addEventListener('pageshow', check)
  window.addEventListener('focus', check)
  intervalId = window.setInterval(check, WATCH_INTERVAL_MS)

  return () => {
    bound = false
    window.clearInterval(intervalId)
    document.removeEventListener('touchend', check, passiveCapture)
    document.removeEventListener('touchcancel', check, passiveCapture)
    window.removeEventListener('pointerup', check, passiveCapture)
    window.removeEventListener('pageshow', check)
    window.removeEventListener('focus', check)
  }
}
