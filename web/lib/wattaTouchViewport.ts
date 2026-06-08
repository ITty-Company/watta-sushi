/** Телефон (портрет / вузький viewport). */
export const WATTA_PHONE_VIEWPORT_MQ = '(max-width: 767px)' as const

/** Планшет, ноутбук, ПК. */
export const WATTA_TABLET_UP_VIEWPORT_MQ = '(min-width: 768px)' as const

/** Телефон + тач-планшет: знижена анімація й легший scroll spy. */
export const WATTA_TOUCH_SCROLL_PERF_MQ =
  '(max-width: 767px), (hover: none) and (pointer: coarse)' as const

export function isWattaPhoneViewport(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.matchMedia(WATTA_PHONE_VIEWPORT_MQ).matches
  } catch {
    return false
  }
}

export function isWattaTabletUpViewport(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.matchMedia(WATTA_TABLET_UP_VIEWPORT_MQ).matches
  } catch {
    return false
  }
}

/** Головна `/`: один in-flow плеер без SSR preroll handoff. */
export function usesHomeHeroSingleVideoLayer(): boolean {
  return isWattaPhoneViewport() || isWattaTabletUpViewport()
}

export function isWattaTouchScrollPerfViewport(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.matchMedia(WATTA_TOUCH_SCROLL_PERF_MQ).matches
  } catch {
    return true
  }
}

/** Compact chrome при скролі — на всіх пристроях (телефон, планшет, десктоп). */
export function isWattaCompactChromeViewport(): boolean {
  return true
}
