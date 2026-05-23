/**
 * На широкому екрані з мишою показуємо нативне <video> замість canvas-mirror:
 * без даунскейлу по DPR і без CSS scale — максимальна різкість ролика.
 * (На touch / вузьких — лишається canvas-шлях з autoplay-обхідниками WebKit.)
 */
/** Планшет landscape + десктоп: нативне <video> без canvas (максимальна різкість). */
export const HERO_VIDEO_NATIVE_ON_DESKTOP_MEDIA =
  '(min-width: 769px) and (hover: hover) and (pointer: fine)' as const

/** Телефон / планшет — hero не перехоплює touch (вертикальний скрол сторінки). */
export const HERO_VIDEO_TOUCH_LIKE_MEDIA =
  '(max-width: 1024px), (hover: none) and (pointer: coarse)' as const

export function getHeroVideoTouchLikeViewport(): boolean {
  if (typeof window === 'undefined') return true
  try {
    return window.matchMedia(HERO_VIDEO_TOUCH_LIKE_MEDIA).matches
  } catch {
    return true
  }
}

export function getHeroVideoPrefersNativeOnDesktop(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.matchMedia(HERO_VIDEO_NATIVE_ON_DESKTOP_MEDIA).matches
  } catch {
    return false
  }
}

export function subscribeHeroVideoNativeOnDesktop(
  onChange: (preferNative: boolean) => void,
): () => void {
  if (typeof window === 'undefined') {
    onChange(false)
    return () => {}
  }
  const mq = window.matchMedia(HERO_VIDEO_NATIVE_ON_DESKTOP_MEDIA)
  const apply = () => onChange(mq.matches)
  apply()
  mq.addEventListener('change', apply)
  return () => mq.removeEventListener('change', apply)
}
