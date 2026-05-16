/** Hero-відео на головній (MenuView). */
export const WELCOME_HERO_VIDEO_SELECTOR =
  'section.welcome-hero-section-web.menu-snap-section-welcome-web:not(.delivery-page-hero-embed-web) video.watta-home-hero-native-video'

export function kickWelcomeHeroVideoPlayOnce(): boolean {
  if (typeof document === 'undefined') return false
  const v = document.querySelector<HTMLVideoElement>(WELCOME_HERO_VIDEO_SELECTOR)
  if (!v) return false
  try {
    v.defaultMuted = true
    v.muted = true
    v.volume = 0
    v.playsInline = true
    v.autoplay = true
    void v.play().catch(() => {})
  } catch {
    return false
  }
  return true
}

/** Підстраховка autoplay після сплешу / SPA-back / bfcache. */
export function kickWelcomeHeroVideoPlayBurst(): () => void {
  kickWelcomeHeroVideoPlayOnce()
  const delays = [16, 80, 200, 500, 1000]
  const ids = delays.map((ms) => window.setTimeout(kickWelcomeHeroVideoPlayOnce, ms))
  return () => ids.forEach((id) => window.clearTimeout(id))
}
