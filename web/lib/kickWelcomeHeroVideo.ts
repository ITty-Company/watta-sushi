/** Hero-відео на головній (MenuView). */
export const WELCOME_HERO_VIDEO_SELECTOR =
  'section.welcome-hero-section-web.menu-snap-section-welcome-web:not(.delivery-page-hero-embed-web) video.watta-home-hero-native-video'

/** Muted autoplay attrs + play() — одразу при mount <video> (Safari / після сплешу). */
export function primeHeroVideoElement(video: HTMLVideoElement): void {
  try {
    video.defaultMuted = true
    video.muted = true
    video.volume = 0
    video.autoplay = true
    video.playsInline = true
    video.controls = false
    video.removeAttribute('controls')
    video.setAttribute('muted', '')
    video.setAttribute('playsinline', '')
    video.setAttribute('webkit-playsinline', 'true')
    video.setAttribute('autoplay', '')
    video.setAttribute(
      'controlsList',
      'nodownload nofullscreen noremoteplayback noplaybackrate',
    )
  } catch {
    /* ignore */
  }
  const attempt = () => {
    const p = video.play()
    if (p && typeof p.catch === 'function') {
      p.catch(() => {
        try {
          video.load()
        } catch {
          /* ignore */
        }
        void video.play().catch(() => {})
      })
    }
  }
  attempt()
}

export function kickWelcomeHeroVideoPlayOnce(): boolean {
  if (typeof document === 'undefined') return false
  const v = document.querySelector<HTMLVideoElement>(WELCOME_HERO_VIDEO_SELECTOR)
  if (!v) return false
  try {
    primeHeroVideoElement(v)
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
