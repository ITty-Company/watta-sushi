import { bindHomeHeroVideoGuard } from '@/lib/bindHomeHeroVideoGuard'
import { isDecorHeroVideoInViewport } from '@/lib/decorHeroVideoVisibility'
import { isWebKitBrowser } from '@/lib/isWebKitBrowser'
import { isWelcomeHeroVideo, resumeHeroVideoPlayback } from '@/lib/kickWelcomeHeroVideo'
import {
  bindHeroVideoLoopClamp,
  isHeroVideoAtStartSec,
  seekHeroVideoToStartSec,
} from '@/lib/wattaHeroVideo'

/**
 * Декоративне hero-відео: muted autoplay + loop.
 * Оптимізовано під швидкі кліки по UI: без глобальних gesture-слухачів на document,
 * рідші watchdog/burst, throttle play(), debounce on pause.
 */
export function bindHeroVideoAutoplay(
  video: HTMLVideoElement,
  options?: {
    extendedRetries?: boolean
    /** @deprecated Відео вже `pointer-events: none`; shield у WelcomeHeroSection */
    blockInteractionRoot?: HTMLElement | null
    /** false — плейлист з адмінки: onEnded перемикає наступний ролик */
    loop?: boolean
    /** true — відео грає безперервно навіть поза viewport (не паузиться при скролі). */
    keepPlayingOffscreen?: boolean
  },
): () => void {
  const extendedRetries = options?.extendedRetries ?? false
  const shouldLoop = options?.loop !== false
  const keepPlayingOffscreen = options?.keepPlayingOffscreen ?? false
  const webKit = isWebKitBrowser()
  const aggressiveRetries = extendedRetries || webKit

  /** Поза viewport не граємо — окрім головного hero та keepPlayingOffscreen. */
  const isPlayableNow = () =>
    keepPlayingOffscreen || isWelcomeHeroVideo(video) || isDecorHeroVideoInViewport(video)

  const applyLoopMode = () => {
    try {
      video.loop = shouldLoop
      if (shouldLoop) video.setAttribute('loop', '')
      else video.removeAttribute('loop')
    } catch {
      /* ignore */
    }
  }

  let lastPlayAt = 0
  const MIN_PLAY_GAP_MS = aggressiveRetries ? 90 : 140

  const safePlay = () => {
    if (!isPlayableNow()) return
    const now = performance.now()
    /* На pause — resume одразу, без throttle. */
    if (!video.paused) {
      if (now - lastPlayAt < MIN_PLAY_GAP_MS) return
      lastPlayAt = now
    } else {
      lastPlayAt = now
    }

    applyLoopMode()
    resumeHeroVideoPlayback(video, {
      loop: shouldLoop,
      urgent: video.paused || video.ended,
    })
  }

  let pauseRecoverRaf = 0
  let lastPauseRecoverAt = 0
  const PAUSE_RECOVER_COOLDOWN_MS = 320

  const onPause = () => {
    if (video.ended || video.seeking || video.error) return
    if (!isPlayableNow()) return
    if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return
    if (isWelcomeHeroVideo(video)) {
      resumeHeroVideoPlayback(video, { loop: shouldLoop, urgent: true })
      return
    }
    const now = performance.now()
    if (now - lastPauseRecoverAt < PAUSE_RECOVER_COOLDOWN_MS) return
    if (pauseRecoverRaf) return
    pauseRecoverRaf = requestAnimationFrame(() => {
      pauseRecoverRaf = 0
      if (!video.paused || video.ended || video.error) return
      lastPauseRecoverAt = performance.now()
      resumeHeroVideoPlayback(video, { loop: shouldLoop, urgent: true })
    })
  }

  const blockTapOnVideo = (e: Event) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const blockKey = (e: KeyboardEvent) => {
    if (e.target !== video) return
    const k = e.key
    if (
      k === ' ' ||
      k === 'Spacebar' ||
      k === 'Enter' ||
      k === 'k' ||
      k === 'K' ||
      k === 'MediaPlayPause' ||
      k === 'MediaTrackPrevious' ||
      k === 'MediaTrackNext'
    ) {
      e.preventDefault()
      e.stopPropagation()
    }
  }

  const captureOpts: AddEventListenerOptions = { capture: true, passive: false }

  const onCanPlay = () => safePlay()
  const onCanPlayThrough = () => safePlay()
  const onLoadedData = () => safePlay()
  const onLoadedMeta = () => {
    if (isWelcomeHeroVideo(video)) seekHeroVideoToStartSec(video)
    safePlay()
  }
  const onPlayingSeek = () => {
    if (aggressiveRetries) return
    if (isHeroVideoAtStartSec(video)) return
    if (video.currentTime > 0.5) return
    seekHeroVideoToStartSec(video)
  }
  const onPageShow = () => safePlay()
  const onVisibility = () => {
    if (document.visibilityState !== 'visible') return
    safePlay()
    window.setTimeout(safePlay, 120)
    window.setTimeout(safePlay, 480)
  }

  let focusRaf = 0
  const onWindowFocus = () => {
    if (focusRaf) return
    focusRaf = requestAnimationFrame(() => {
      focusRaf = 0
      safePlay()
    })
  }

  const onFullscreenChange = () => {
    if (typeof document === 'undefined') return
    if (document.fullscreenElement && document.fullscreenElement !== video) return
    queueMicrotask(safePlay)
    window.setTimeout(safePlay, 50)
  }

  const onDocumentResume = () => safePlay()
  const onOnline = () => safePlay()
  const onWebkitEndFullscreen = () => {
    queueMicrotask(safePlay)
    window.setTimeout(safePlay, 32)
  }

  const watchdog = () => {
    if (video.ended || video.error) return
    if (video.paused) safePlay()
  }

  const onWaiting = () => {
    queueMicrotask(safePlay)
    window.setTimeout(safePlay, 80)
  }
  const onStalled = () => {
    window.setTimeout(safePlay, 80)
  }

  queueMicrotask(safePlay)
  requestAnimationFrame(() => safePlay())

  if (video.readyState >= 1) safePlay()
  if (video.readyState >= 2) safePlay()

  const delays = aggressiveRetries ? [0, 40, 120, 300, 700, 1200] : [0, 80]
  const timers = delays.map((ms) => window.setTimeout(safePlay, ms))

  const watchdogMs = aggressiveRetries ? 500 : 2200
  const watchdogId = window.setInterval(watchdog, watchdogMs)

  const burstId = window.setInterval(() => {
    if (video.error) return
    if (video.ended) {
      if (shouldLoop) {
        if (!isHeroVideoAtStartSec(video)) seekHeroVideoToStartSec(video)
        resumeHeroVideoPlayback(video, { loop: shouldLoop, urgent: true })
      }
      return
    }
    if (!video.paused) return
    resumeHeroVideoPlayback(video, { loop: shouldLoop, urgent: true })
  }, aggressiveRetries ? 900 : 1800)

  let intersectionObserver: IntersectionObserver | null = null
  if (typeof IntersectionObserver !== 'undefined') {
    intersectionObserver = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.target !== video) continue
          if (e.isIntersecting) {
            safePlay()
            return
          }
          // keepPlayingOffscreen — hero головної не паузимо при скролі.
          if (keepPlayingOffscreen) continue
          try {
            if (!video.paused) video.pause()
          } catch {
            /* ignore */
          }
        }
      },
      { threshold: 0.04, rootMargin: '64px 0px' },
    )
    intersectionObserver.observe(video)
  }

  /** Лише на самому <video> — не на кожен клік по сторінці */
  const gestureOpts: AddEventListenerOptions = { capture: true, passive: true }
  const onVideoGesture = () => {
    if (video.ended || video.error || !video.paused) return
    safePlay()
  }
  video.addEventListener('pointerdown', onVideoGesture, gestureOpts)
  video.addEventListener('touchstart', onVideoGesture, gestureOpts)

  const onPlaying = () => {
    onPlayingSeek()
    try {
      if (!video.muted) video.muted = true
    } catch {
      /* ignore */
    }
  }

  let progressRaf = 0
  const onProgress = () => {
    if (!isDecorHeroVideoInViewport(video)) return
    if (progressRaf) return
    progressRaf = requestAnimationFrame(() => {
      progressRaf = 0
      if (typeof document !== 'undefined' && document.hidden) return
      if (!isDecorHeroVideoInViewport(video)) return
      if (!video.paused) return
      if (video.buffered.length === 0) return
      safePlay()
    })
  }

  const offLoopClamp = bindHeroVideoLoopClamp(video, { enabled: shouldLoop })
  const offHomeHeroGuard = isWelcomeHeroVideo(video)
    ? bindHomeHeroVideoGuard(video, { loop: shouldLoop })
    : () => {}

  video.addEventListener('waiting', onWaiting)
  video.addEventListener('stalled', onStalled)
  video.addEventListener('progress', onProgress)
  video.addEventListener('canplay', onCanPlay)
  video.addEventListener('canplaythrough', onCanPlayThrough)
  video.addEventListener('loadeddata', onLoadedData)
  video.addEventListener('loadedmetadata', onLoadedMeta)
  video.addEventListener('pause', onPause)
  video.addEventListener('playing', onPlaying)
  video.addEventListener('click', blockTapOnVideo, captureOpts)
  video.addEventListener('mousedown', blockTapOnVideo, captureOpts)
  video.addEventListener('mouseup', blockTapOnVideo, captureOpts)
  video.addEventListener('contextmenu', blockTapOnVideo, captureOpts)
  video.addEventListener('auxclick', blockTapOnVideo, captureOpts)
  video.addEventListener('dblclick', blockTapOnVideo, captureOpts)
  video.addEventListener('keydown', blockKey, true)
  window.addEventListener('pageshow', onPageShow)
  window.addEventListener('focus', onWindowFocus)
  document.addEventListener('visibilitychange', onVisibility)
  document.addEventListener('fullscreenchange', onFullscreenChange)
  document.addEventListener('resume', onDocumentResume)
  window.addEventListener('online', onOnline)
  video.addEventListener(
    'webkitendfullscreen' as keyof HTMLVideoElement,
    onWebkitEndFullscreen as EventListener,
  )

  return () => {
    if (progressRaf) cancelAnimationFrame(progressRaf)
    progressRaf = 0
    if (focusRaf) cancelAnimationFrame(focusRaf)
    focusRaf = 0
    if (pauseRecoverRaf) cancelAnimationFrame(pauseRecoverRaf)
    pauseRecoverRaf = 0
    window.clearInterval(watchdogId)
    window.clearInterval(burstId)
    timers.forEach((id) => window.clearTimeout(id))
    intersectionObserver?.disconnect()
    video.removeEventListener('pointerdown', onVideoGesture, gestureOpts)
    video.removeEventListener('touchstart', onVideoGesture, gestureOpts)
    video.removeEventListener('waiting', onWaiting)
    video.removeEventListener('stalled', onStalled)
    video.removeEventListener('progress', onProgress)
    video.removeEventListener('canplay', onCanPlay)
    video.removeEventListener('canplaythrough', onCanPlayThrough)
    video.removeEventListener('loadeddata', onLoadedData)
    video.removeEventListener('loadedmetadata', onLoadedMeta)
    offLoopClamp()
    offHomeHeroGuard()
    video.removeEventListener('pause', onPause)
    video.removeEventListener('playing', onPlaying)
    video.removeEventListener('click', blockTapOnVideo, captureOpts)
    video.removeEventListener('mousedown', blockTapOnVideo, captureOpts)
    video.removeEventListener('mouseup', blockTapOnVideo, captureOpts)
    video.removeEventListener('contextmenu', blockTapOnVideo, captureOpts)
    video.removeEventListener('auxclick', blockTapOnVideo, captureOpts)
    video.removeEventListener('dblclick', blockTapOnVideo, captureOpts)
    video.removeEventListener('keydown', blockKey, true)
    window.removeEventListener('pageshow', onPageShow)
    window.removeEventListener('focus', onWindowFocus)
    document.removeEventListener('visibilitychange', onVisibility)
    document.removeEventListener('fullscreenchange', onFullscreenChange)
    document.removeEventListener('resume', onDocumentResume)
    window.removeEventListener('online', onOnline)
    video.removeEventListener(
      'webkitendfullscreen' as keyof HTMLVideoElement,
      onWebkitEndFullscreen as EventListener,
    )
  }
}
