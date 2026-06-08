const OBSERVE_SELECTORS = [
  '#watta-hero-preroll-video',
  'section.welcome-hero-section-web.menu-snap-section-welcome-web:not(.delivery-page-hero-embed-web) video.watta-home-hero-native-video',
  '.welcome-hero-video-stack-web video.watta-home-hero-native-video',
  '.welcome-hero-video-stack-web .welcome-video-native-web',
] as const

/** Hero головної (індекс 1) має грати безперервно — його не паузимо поза viewport. */
const WELCOME_HERO_VIDEO_SELECTOR = OBSERVE_SELECTORS[1]

function isWelcomeHeroVideo(video: HTMLVideoElement): boolean {
  try {
    return video.matches(WELCOME_HERO_VIDEO_SELECTOR)
  } catch {
    return false
  }
}

/** Головна: preroll + in-flow hero — autoplay без паузи при скролі. */
function isHomeHeroAlwaysPlaying(video: HTMLVideoElement): boolean {
  if (video.id === 'watta-hero-preroll-video') return true
  if (typeof document !== 'undefined') {
    if (!document.documentElement.classList.contains('watta-html-home-hero')) {
      return isWelcomeHeroVideo(video)
    }
    try {
      if (video.classList.contains('watta-home-hero-native-video')) return true
    } catch {
      /* ignore */
    }
  }
  return isWelcomeHeroVideo(video)
}

/** undefined = ще не виміряно → вважаємо у viewport (autoplay при mount). */
const inView = new WeakMap<HTMLVideoElement, boolean>()
let observer: IntersectionObserver | null = null
let bound = false

export function isDecorHeroVideoInViewport(video: HTMLVideoElement): boolean {
  const known = inView.get(video)
  return known !== false
}

function collectVideos(): HTMLVideoElement[] {
  if (typeof document === 'undefined') return []
  const seen = new Set<HTMLVideoElement>()
  const out: HTMLVideoElement[] = []
  for (const sel of OBSERVE_SELECTORS) {
    document.querySelectorAll<HTMLVideoElement>(sel).forEach((v) => {
      if (seen.has(v)) return
      seen.add(v)
      out.push(v)
    })
  }
  return out
}

function observeAll() {
  if (!observer) return
  collectVideos().forEach((v) => {
    try {
      observer!.observe(v)
    } catch {
      /* already observed */
    }
  })
}

/**
 * Pause decorative hero mp4 when scrolled away — saves CPU/GPU on catalog and footer.
 */
export function bindDecorHeroVideoVisibility(): () => void {
  if (typeof window === 'undefined' || bound) return () => {}
  if (typeof IntersectionObserver === 'undefined') return () => {}

  bound = true
  observer = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const video = e.target as HTMLVideoElement
        if (e.isIntersecting) {
          inView.set(video, true)
        } else {
          inView.set(video, false)
          if (document.visibilityState !== 'visible') continue
          if (isHomeHeroAlwaysPlaying(video)) continue
          try {
            if (!video.paused) video.pause()
          } catch {
            /* ignore */
          }
        }
      }
    },
    { threshold: 0.08, rootMargin: '48px 0px' },
  )

  observeAll()

  const mo =
    typeof MutationObserver !== 'undefined'
      ? new MutationObserver(() => observeAll())
      : null
  mo?.observe(document.documentElement, { childList: true, subtree: true })

  return () => {
    bound = false
    mo?.disconnect()
    observer?.disconnect()
    observer = null
    collectVideos().forEach((v) => inView.delete(v))
  }
}
