import {
  bindDecorHeroVideoVisibility,
  isDecorHeroVideoInViewport,
} from '@/lib/decorHeroVideoVisibility'
import { isWebKitBrowser } from '@/lib/isWebKitBrowser'
import { shouldSkipHeroVideoWatchdog } from '@/lib/heroScrollPerf'
import { resolveHeroVideoPreload } from '@/lib/heroVideoPreload'

/** Hero-відео на головній (MenuView). */
export const WELCOME_HERO_VIDEO_SELECTOR =
  'section.welcome-hero-section-web.menu-snap-section-welcome-web:not(.delivery-page-hero-embed-web) video.watta-home-hero-native-video'

/** Усі декоративні hero-ролики (головна, /menu, /delivery). */
const DECORATIVE_HERO_VIDEO_SELECTORS = [
  '#watta-hero-preroll-video',
  WELCOME_HERO_VIDEO_SELECTOR,
  '.welcome-hero-video-stack-web video.watta-home-hero-native-video',
  '.welcome-hero-video-stack-web .welcome-video-native-web',
] as const

/** Рідше, ніж rAF — лише підстраховка autopause (Safari / bfcache). */
const HERO_CONTINUOUS_TICK_MS = 2200
const HERO_BURST_DEBOUNCE_MS = 1400

let heroBurstCleanup: (() => void) | null = null
let lastHeroBurstAt = 0

let webKitDocUnlockInstalled = false
let continuousPlaybackCleanup: (() => void) | null = null
const lastAttrsAt = new WeakMap<HTMLVideoElement, number>()
const playInflight = new WeakMap<HTMLVideoElement, Promise<void>>()
const playRetryTimer = new WeakMap<HTMLVideoElement, number>()
const playRetryCount = new WeakMap<HTMLVideoElement, number>()
const PRIME_ATTRS_GAP_MS = 180
const MAX_PLAY_RETRIES = 6
const PLAY_RETRY_DELAY_MS = 220

export type ResumeHeroVideoOptions = {
  loop?: boolean
  /** Зняти play-lock і запустити одразу (pause / watchdog). */
  urgent?: boolean
}

function applyHeroVideoAttrs(video: HTMLVideoElement, loop?: boolean): void {
  try {
    video.defaultMuted = true
    video.muted = true
    video.volume = 0
    video.preload = resolveHeroVideoPreload()
    video.autoplay = true
    video.playsInline = true
    if (loop === true) {
      video.loop = true
      video.setAttribute('loop', '')
    } else if (loop === false) {
      video.loop = false
      video.removeAttribute('loop')
    }
    video.controls = false
    video.removeAttribute('controls')
    video.disablePictureInPicture = true
    video.disableRemotePlayback = true
    video.setAttribute('muted', '')
    video.setAttribute('playsinline', '')
    video.setAttribute('webkit-playsinline', 'true')
    video.setAttribute('autoplay', '')
    video.setAttribute(
      'controlsList',
      'nodownload nofullscreen noremoteplayback noplaybackrate',
    )
    try {
      video.setAttribute('x-webkit-airplay', 'deny')
    } catch {
      /* ignore */
    }
  } catch {
    /* ignore */
  }
}

function clearPlayLock(video: HTMLVideoElement): void {
  playInflight.delete(video)
  playRetryCount.delete(video)
  const tid = playRetryTimer.get(video)
  if (tid != null) {
    window.clearTimeout(tid)
    playRetryTimer.delete(video)
  }
}

const lastPlayAttemptAt = new WeakMap<HTMLVideoElement, number>()
const MIN_PLAY_ATTEMPT_GAP_MS = 36

/**
 * Єдиний play() для hero. urgent=true — при pause не чекаємо попередній promise.
 */
export function resumeHeroVideoPlayback(
  video: HTMLVideoElement,
  options?: ResumeHeroVideoOptions,
): void {
  if (!video || video.error) return
  if (!video.paused && !video.ended) {
    if (options?.loop === true && !video.loop) {
      try {
        video.loop = true
        video.setAttribute('loop', '')
      } catch {
        /* ignore */
      }
    }
    return
  }

  const now = performance.now()
  if (!options?.urgent) {
    if (playInflight.has(video)) return
    const last = lastPlayAttemptAt.get(video) ?? 0
    if (now - last < MIN_PLAY_ATTEMPT_GAP_MS) return
  }

  if (options?.urgent) {
    clearPlayLock(video)
  }

  lastPlayAttemptAt.set(video, now)
  const lastAttrs = lastAttrsAt.get(video) ?? 0
  if (now - lastAttrs >= PRIME_ATTRS_GAP_MS) {
    lastAttrsAt.set(video, now)
    applyHeroVideoAttrs(video, options?.loop)
  }

  const p = video.play()
  if (!p || typeof p.then !== 'function') return

  playInflight.set(
    video,
    p
      .then(() => {
        playRetryCount.delete(video)
      })
      .catch(() => {
        const attempts = (playRetryCount.get(video) ?? 0) + 1
        if (attempts > MAX_PLAY_RETRIES) {
          playRetryCount.delete(video)
          return
        }
        playRetryCount.set(video, attempts)
        window.clearTimeout(playRetryTimer.get(video))
        playRetryTimer.set(
          video,
          window.setTimeout(() => {
            playInflight.delete(video)
            if (video.paused && !video.error) {
              resumeHeroVideoPlayback(video, { ...options, urgent: true })
            }
          }, PLAY_RETRY_DELAY_MS),
        )
      })
      .finally(() => {
        playInflight.delete(video)
      }),
  )
}

/** Muted autoplay attrs + play() — без load() / seek (ламають autoplay у Safari). */
export function primeHeroVideoElement(
  video: HTMLVideoElement,
  options?: ResumeHeroVideoOptions,
): void {
  const now = performance.now()
  const last = lastAttrsAt.get(video) ?? 0
  if (now - last >= PRIME_ATTRS_GAP_MS) {
    lastAttrsAt.set(video, now)
    applyHeroVideoAttrs(video, options?.loop)
  }
  resumeHeroVideoPlayback(video, options)
}

function isSsrHeroPreroll(video: HTMLVideoElement): boolean {
  return video.id === 'watta-hero-preroll-video'
}

/** Hero-відео головної сторінки — має грати безперервно, навіть поза viewport. */
export function isWelcomeHeroVideo(video: HTMLVideoElement): boolean {
  if (video.id === 'watta-hero-preroll-video') return true
  try {
    if (
      document.documentElement.classList.contains('watta-html-home-hero') &&
      video.classList.contains('watta-home-hero-native-video')
    ) {
      return true
    }
    return video.matches(WELCOME_HERO_VIDEO_SELECTOR)
  } catch {
    return false
  }
}

function shouldSkipDecorativeHeroVideo(video: HTMLVideoElement): boolean {
  if (typeof document === 'undefined') return false
  if (
    isSsrHeroPreroll(video) &&
    document.documentElement.hasAttribute('data-watta-preroll-retired')
  ) {
    return true
  }
  return false
}

function forEachDecorativeHeroVideo(fn: (video: HTMLVideoElement) => void): boolean {
  if (typeof document === 'undefined') return false
  let hit = false
  const seen = new Set<HTMLVideoElement>()
  for (const sel of DECORATIVE_HERO_VIDEO_SELECTORS) {
    document.querySelectorAll<HTMLVideoElement>(sel).forEach((v) => {
      if (seen.has(v)) return
      if (shouldSkipDecorativeHeroVideo(v)) return
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

/** Усі декоративні hero — play, якщо paused/ended (loop). */
export function ensureAllHeroVideosPlaying(): void {
  if (typeof document === 'undefined') return
  if (document.visibilityState !== 'visible') return
  if (shouldSkipHeroVideoWatchdog()) return

  forEachDecorativeHeroVideo((v) => {
    if (v.error) return
    // Hero головної грає безперервно — інші декоративні ролики лише у viewport.
    if (!isWelcomeHeroVideo(v) && !isDecorHeroVideoInViewport(v)) return
    if (v.ended && !v.loop) return
    if (!v.paused && !v.ended) return
    resumeHeroVideoPlayback(v, { loop: v.loop, urgent: true })
  })
}

export function kickWelcomeHeroVideoPlayOnce(): boolean {
  return forEachDecorativeHeroVideo((v) =>
    primeHeroVideoElement(v, { loop: v.loop, urgent: true }),
  )
}

/** Підстраховка autoplay після сплешу / SPA-back / bfcache. */
export function kickWelcomeHeroVideoPlayBurst(): () => void {
  const now = performance.now()
  if (now - lastHeroBurstAt < HERO_BURST_DEBOUNCE_MS && heroBurstCleanup) {
    return heroBurstCleanup
  }
  lastHeroBurstAt = now
  heroBurstCleanup?.()

  kickWelcomeHeroVideoPlayOnce()
  const delays = isWebKitBrowser()
    ? [0, 24, 80, 200, 500, 1200, 2400]
    : [0, 48, 160, 400, 900, 1800]
  const ids = delays.map((ms) => window.setTimeout(kickWelcomeHeroVideoPlayOnce, ms))
  const cancel = () => ids.forEach((id) => window.clearTimeout(id))
  heroBurstCleanup = cancel
  return () => {
    cancel()
    if (heroBurstCleanup === cancel) heroBurstCleanup = null
  }
}

/**
 * Рідкий watchdog — hero не лишається на pause після bfcache / tab switch.
 * Без rAF-циклу (60fps перевірки гальмували скрол).
 */
export function startHeroVideoContinuousPlayback(): () => void {
  if (typeof window === 'undefined') return () => {}
  if (continuousPlaybackCleanup) return continuousPlaybackCleanup

  installWebKitHeroAutoplayDocUnlock()
  const stopVisibility = bindDecorHeroVideoVisibility()
  kickWelcomeHeroVideoPlayBurst()

  const tick = () => ensureAllHeroVideosPlaying()
  tick()

  const intervalId = window.setInterval(tick, HERO_CONTINUOUS_TICK_MS)

  const onVisible = () => {
    if (document.visibilityState === 'visible') tick()
  }
  document.addEventListener('visibilitychange', onVisible)
  window.addEventListener('focus', tick)
  window.addEventListener('pageshow', tick)

  continuousPlaybackCleanup = () => {
    window.clearInterval(intervalId)
    document.removeEventListener('visibilitychange', onVisible)
    window.removeEventListener('focus', tick)
    window.removeEventListener('pageshow', tick)
    stopVisibility()
    continuousPlaybackCleanup = null
  }

  return continuousPlaybackCleanup
}

/**
 * Muted autoplay інколи потребує жесту (Safari / Low Power Mode).
 */
export function installWebKitHeroAutoplayDocUnlock(): void {
  if (typeof window === 'undefined' || webKitDocUnlockInstalled) return
  webKitDocUnlockInstalled = true

  let unlockCooldown = 0
  const unlock = () => {
    const now = performance.now()
    if (now - unlockCooldown < 48) return
    unlockCooldown = now
    ensureAllHeroVideosPlaying()
  }

  const opts: AddEventListenerOptions = { passive: true, capture: true }
  window.addEventListener('pointerdown', unlock, opts)
  window.addEventListener('touchstart', unlock, opts)
  window.addEventListener('wheel', unlock, opts)
  window.addEventListener('keydown', unlock, opts)
}
