/**
 * На широкому екрані з мишою показуємо нативне <video> замість canvas-mirror:
 * без даунскейлу по DPR і без CSS scale — максимальна різкість ролика.
 * (На touch / вузьких — лишається canvas-шлях з autoplay-обхідниками WebKit.)
 */
export const HERO_VIDEO_NATIVE_ON_DESKTOP_MEDIA =
  '(min-width: 1025px) and (hover: hover) and (pointer: fine)' as const

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
