import { bindHeroScrollPerf } from '@/lib/heroScrollPerf'
import {
  ensureAllHeroVideosPlaying,
  kickWelcomeHeroVideoPlayBurst,
  kickWelcomeHeroVideoPlayOnce,
  resumeHeroVideoPlayback,
  startHeroVideoContinuousPlayback,
} from '@/lib/kickWelcomeHeroVideo'
import {
  seekHeroVideoToStartSec,
  WATTA_BOOT_SPLASH_ENDED_EVENT,
  WATTA_HERO_VIDEO_READY_EVENT,
} from '@/lib/wattaHeroVideo'

const HERO_VIDEO_SELECTOR =
  'video.watta-home-hero-native-video, .welcome-hero-video-stack-web video.welcome-video-native-web'

function resumeHeroVideo(video: HTMLVideoElement): void {
  if (video.error) return

  if (video.ended) {
    if (!video.loop) return
    try {
      seekHeroVideoToStartSec(video)
    } catch {
      /* ignore */
    }
    resumeHeroVideoPlayback(video, { loop: true, urgent: true })
    return
  }

  if (!video.paused) return
  resumeHeroVideoPlayback(video, { loop: video.loop, urgent: true })
}

function resumeAllHeroVideosInView(): void {
  if (typeof document === 'undefined') return

  const seen = new Set<HTMLVideoElement>()
  document.querySelectorAll<HTMLVideoElement>(HERO_VIDEO_SELECTOR).forEach((video) => {
    if (seen.has(video)) return
    seen.add(video)
    resumeHeroVideo(video)
  })
}

/**
 * Підстраховка 24/7: hero не лишається в paused після сплешу, bfcache, tab switch, Safari.
 */
export function bindHeroVideoKeepAlive(): () => void {
  if (typeof window === 'undefined') return () => {}

  const stopScrollPerf = bindHeroScrollPerf()
  const stopContinuous = startHeroVideoContinuousPlayback()

  const onVisible = () => {
    if (document.visibilityState !== 'visible') return
    kickWelcomeHeroVideoPlayOnce()
    ensureAllHeroVideosPlaying()
  }

  const onPageShow = (e: PageTransitionEvent) => {
    if (e.persisted) {
      kickWelcomeHeroVideoPlayBurst()
    } else {
      kickWelcomeHeroVideoPlayOnce()
    }
    ensureAllHeroVideosPlaying()
    if (e.persisted) {
      window.setTimeout(() => {
        kickWelcomeHeroVideoPlayOnce()
        resumeAllHeroVideosInView()
      }, 50)
    }
  }

  const onSplashEnded = () => kickWelcomeHeroVideoPlayBurst()

  const onHeroReady = () => {
    kickWelcomeHeroVideoPlayOnce()
    ensureAllHeroVideosPlaying()
  }

  document.addEventListener('visibilitychange', onVisible)
  window.addEventListener('pageshow', onPageShow)
  window.addEventListener('focus', onVisible)
  window.addEventListener('online', onVisible)
  document.addEventListener('resume', onVisible)
  window.addEventListener(WATTA_BOOT_SPLASH_ENDED_EVENT, onSplashEnded)
  window.addEventListener(WATTA_HERO_VIDEO_READY_EVENT, onHeroReady)

  queueMicrotask(ensureAllHeroVideosPlaying)
  requestAnimationFrame(ensureAllHeroVideosPlaying)

  return () => {
    stopScrollPerf()
    stopContinuous()
    document.removeEventListener('visibilitychange', onVisible)
    window.removeEventListener('pageshow', onPageShow)
    window.removeEventListener('focus', onVisible)
    window.removeEventListener('online', onVisible)
    document.removeEventListener('resume', onVisible)
    window.removeEventListener(WATTA_BOOT_SPLASH_ENDED_EVENT, onSplashEnded)
    window.removeEventListener(WATTA_HERO_VIDEO_READY_EVENT, onHeroReady)
  }
}
