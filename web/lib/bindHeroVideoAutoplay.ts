/**
 * Декоративне hero-відео: одразу play, без паузи з UI.
 * — Поки вкладка видима: `video.pause()` з JS не зупиняє ролик.
 * — У фоні вкладки: справжня pause().
 * — Перехоплення кліків на `blockInteractionRoot` (усі `.welcome-hero-video-stack-web`) без block на touchstart — скрол сторінки не ламаємо.
 * — Watchdog: якщо ролик «затих», знову play().
 */
export function bindHeroVideoAutoplay(
  video: HTMLVideoElement,
  options?: { extendedRetries?: boolean; blockInteractionRoot?: HTMLElement | null }
): () => void {
  const extendedRetries = options?.extendedRetries ?? false
  const blockRoot = options?.blockInteractionRoot ?? null
  const pauseProto = HTMLVideoElement.prototype.pause

  const safePlay = () => {
    if (typeof document !== 'undefined' && document.hidden) return
    try {
      video.defaultMuted = true
      video.muted = true
      video.playsInline = true
      video.autoplay = true
      video.loop = true
      video.controls = false
      video.removeAttribute('controls')
      video.disablePictureInPicture = true
      video.disableRemotePlayback = true
      video.setAttribute('playsinline', 'true')
      video.setAttribute('webkit-playsinline', 'true')
      video.setAttribute('muted', 'true')
      video.setAttribute('autoplay', 'true')
      video.setAttribute('controlsList', 'nodownload nofullscreen noremoteplayback')
      try {
        video.setAttribute('fetchpriority', 'high')
      } catch {
        /* ignore */
      }
    } catch {
      /* ignore */
    }
    const p = video.play()
    if (p && typeof p.catch === 'function') {
      p.catch(() => {})
    }
  }

  const onPause = () => {
    if (typeof document !== 'undefined' && document.hidden) return
    if (video.ended) return
    safePlay()
    requestAnimationFrame(() => {
      if (typeof document !== 'undefined' && document.hidden) return
      safePlay()
    })
  }

  const guardedPause = function (this: HTMLVideoElement) {
    if (typeof document !== 'undefined' && document.hidden) {
      pauseProto.call(this)
    }
  }
  try {
    Object.defineProperty(video, 'pause', {
      configurable: true,
      enumerable: false,
      writable: true,
      value: guardedPause,
    })
  } catch {
    try {
      ;(video as HTMLVideoElement & { pause: () => void }).pause = guardedPause
    } catch {
      /* ignore */
    }
  }

  const blockInteraction = (e: Event) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const blockUiClick = (e: Event) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const blockKey = (e: KeyboardEvent) => {
    if (e.target !== video) return
    const k = e.key
    if (k === ' ' || k === 'Spacebar' || k === 'Enter' || k === 'k' || k === 'K') {
      e.preventDefault()
      e.stopPropagation()
    }
  }

  const captureOpts: AddEventListenerOptions = { capture: true, passive: false }

  const onCanPlay = () => safePlay()
  const onCanPlayThrough = () => safePlay()
  const onLoadedData = () => safePlay()
  const onLoadedMeta = () => safePlay()
  const onPlay = () => safePlay()
  const onPageShow = () => safePlay()
  const onVisibility = () => {
    if (document.visibilityState === 'visible') safePlay()
  }

  const watchdog = () => {
    if (typeof document !== 'undefined' && document.hidden) return
    if (video.ended || video.error) return
    if (video.paused) safePlay()
  }

  queueMicrotask(safePlay)
  requestAnimationFrame(() => safePlay())

  if (video.readyState >= 1) safePlay()
  if (video.readyState >= 2) safePlay()

  const delays = extendedRetries ? [0, 32, 100, 280, 650] : [0, 60, 200]
  const timers = delays.map((ms) => window.setTimeout(safePlay, ms))

  const watchdogId = window.setInterval(watchdog, 1800)

  let intersectionObserver: IntersectionObserver | null = null
  if (typeof IntersectionObserver !== 'undefined') {
    intersectionObserver = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && e.target === video) safePlay()
        }
      },
      { threshold: 0.02, rootMargin: '120px 0px' }
    )
    intersectionObserver.observe(video)
  }

  const onPlaying = () => {
    try {
      if (!video.muted) video.muted = true
    } catch {
      /* ignore */
    }
  }

  video.addEventListener('canplay', onCanPlay)
  video.addEventListener('canplaythrough', onCanPlayThrough)
  video.addEventListener('loadeddata', onLoadedData)
  video.addEventListener('loadedmetadata', onLoadedMeta)
  video.addEventListener('play', onPlay)
  video.addEventListener('pause', onPause)
  video.addEventListener('playing', onPlaying)
  video.addEventListener('click', blockInteraction, captureOpts)
  video.addEventListener('pointerdown', blockInteraction, captureOpts)
  video.addEventListener('pointerup', blockInteraction, captureOpts)
  video.addEventListener('mousedown', blockInteraction, captureOpts)
  video.addEventListener('mouseup', blockInteraction, captureOpts)
  video.addEventListener('touchstart', blockInteraction, captureOpts)
  video.addEventListener('touchend', blockInteraction, captureOpts)
  video.addEventListener('touchcancel', blockInteraction, captureOpts)
  video.addEventListener('contextmenu', blockInteraction, captureOpts)
  video.addEventListener('auxclick', blockInteraction, captureOpts)
  video.addEventListener('dblclick', blockInteraction, captureOpts)
  video.addEventListener('keydown', blockKey, true)
  video.addEventListener('gesturestart', blockInteraction, captureOpts)
  window.addEventListener('pageshow', onPageShow)
  document.addEventListener('visibilitychange', onVisibility)

  const rootClickOpts: AddEventListenerOptions = { capture: true, passive: false }
  if (blockRoot) {
    blockRoot.addEventListener('click', blockUiClick, rootClickOpts)
    blockRoot.addEventListener('dblclick', blockUiClick, rootClickOpts)
    blockRoot.addEventListener('contextmenu', blockUiClick, rootClickOpts)
    blockRoot.addEventListener('auxclick', blockUiClick, rootClickOpts)
  }

  return () => {
    window.clearInterval(watchdogId)
    timers.forEach((id) => window.clearTimeout(id))
    intersectionObserver?.disconnect()
    if (blockRoot) {
      blockRoot.removeEventListener('click', blockUiClick, rootClickOpts)
      blockRoot.removeEventListener('dblclick', blockUiClick, rootClickOpts)
      blockRoot.removeEventListener('contextmenu', blockUiClick, rootClickOpts)
      blockRoot.removeEventListener('auxclick', blockUiClick, rootClickOpts)
    }
    try {
      Reflect.deleteProperty(video, 'pause')
    } catch {
      try {
        delete (video as unknown as { pause?: () => void }).pause
      } catch {
        /* ignore */
      }
    }
    video.removeEventListener('canplay', onCanPlay)
    video.removeEventListener('canplaythrough', onCanPlayThrough)
    video.removeEventListener('loadeddata', onLoadedData)
    video.removeEventListener('loadedmetadata', onLoadedMeta)
    video.removeEventListener('play', onPlay)
    video.removeEventListener('pause', onPause)
    video.removeEventListener('playing', onPlaying)
    video.removeEventListener('click', blockInteraction, captureOpts)
    video.removeEventListener('pointerdown', blockInteraction, captureOpts)
    video.removeEventListener('pointerup', blockInteraction, captureOpts)
    video.removeEventListener('mousedown', blockInteraction, captureOpts)
    video.removeEventListener('mouseup', blockInteraction, captureOpts)
    video.removeEventListener('touchstart', blockInteraction, captureOpts)
    video.removeEventListener('touchend', blockInteraction, captureOpts)
    video.removeEventListener('touchcancel', blockInteraction, captureOpts)
    video.removeEventListener('contextmenu', blockInteraction, captureOpts)
    video.removeEventListener('auxclick', blockInteraction, captureOpts)
    video.removeEventListener('dblclick', blockInteraction, captureOpts)
    video.removeEventListener('keydown', blockKey, true)
    video.removeEventListener('gesturestart', blockInteraction, captureOpts)
    window.removeEventListener('pageshow', onPageShow)
    document.removeEventListener('visibilitychange', onVisibility)
  }
}
