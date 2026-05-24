import { isWebKitBrowser } from '@/lib/isWebKitBrowser'
import { seekHeroVideoToStartSec } from '@/lib/wattaHeroVideo'

/** Hero-відео на головній (MenuView). */
export const WELCOME_HERO_VIDEO_SELECTOR =
  'section.welcome-hero-section-web.menu-snap-section-welcome-web:not(.delivery-page-hero-embed-web) video.watta-home-hero-native-video'

/** Усі декоративні hero-ролики (головна, /menu, /delivery). */
const DECORATIVE_HERO_VIDEO_SELECTORS = [
  WELCOME_HERO_VIDEO_SELECTOR,
  '.welcome-hero-video-stack-web video.watta-home-hero-native-video',
  '.welcome-hero-video-stack-web .welcome-video-native-web',
] as const

let webKitDocUnlockInstalled = false

/** Muted autoplay attrs + play() — одразу при mount <video> (Safari / після сплешу). */
export function primeHeroVideoElement(video: HTMLVideoElement): void {
  try {
    video.defaultMuted = true
    video.muted = true
    video.volume = 0
    video.preload = 'auto'
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
  const seekStart = () => seekHeroVideoToStartSec(video)
  seekStart()
  if (video.readyState < HTMLMediaElement.HAVE_METADATA) {
    video.addEventListener('loadedmetadata', seekStart, { once: true })
  }
  video.addEventListener(
    'loadeddata',
    () => {
      seekStart()
    },
    { once: true },
  )
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

function forEachDecorativeHeroVideo(fn: (video: HTMLVideoElement) => void): boolean {
  if (typeof document === 'undefined') return false
  let hit = false
  const seen = new Set<HTMLVideoElement>()
  for (const sel of DECORATIVE_HERO_VIDEO_SELECTORS) {
    document.querySelectorAll<HTMLVideoElement>(sel).forEach((v) => {
      if (seen.has(v)) return
      seen.add(v)
      hit = true
      try {
        fn(v)
      } catch {
        /* ignore */
      }
    })
  }
  return hit
}

export function kickWelcomeHeroVideoPlayOnce(): boolean {
  return forEachDecorativeHeroVideo(primeHeroVideoElement)
}

/** Підстраховка autoplay після сплешу / SPA-back / bfcache. */
export function kickWelcomeHeroVideoPlayBurst(): () => void {
  kickWelcomeHeroVideoPlayOnce()
  const delays = isWebKitBrowser()
    ? [16, 60, 150, 400, 900, 1800, 3200]
    : [16, 120, 400]
  const ids = delays.map((ms) => window.setTimeout(kickWelcomeHeroVideoPlayOnce, ms))
  return () => ids.forEach((id) => window.clearTimeout(id))
}

/**
 * Safari/macOS: після programmatic pause() autoplay часто не відновлюється.
 * Перший scroll / tap / wheel на сторінці — безпечний unlock (passive, once).
 */
export function installWebKitHeroAutoplayDocUnlock(): void {
  if (typeof window === 'undefined' || webKitDocUnlockInstalled || !isWebKitBrowser()) return
  webKitDocUnlockInstalled = true

  const unlock = () => {
    kickWelcomeHeroVideoPlayOnce()
    cleanup()
  }

  const opts: AddEventListenerOptions = { passive: true, capture: true, once: true }
  const cleanup = () => {
    window.removeEventListener('pointerdown', unlock, opts)
    window.removeEventListener('touchstart', unlock, opts)
    window.removeEventListener('wheel', unlock, opts)
    window.removeEventListener('keydown', unlock, opts)
    window.removeEventListener('scroll', unlock, opts)
  }

  window.addEventListener('pointerdown', unlock, opts)
  window.addEventListener('touchstart', unlock, opts)
  window.addEventListener('wheel', unlock, opts)
  window.addEventListener('keydown', unlock, opts)
  window.addEventListener('scroll', unlock, opts)
}
