/**
 * Декоративне hero-відео: безперервний muted autoplay + loop, 24/7 поки вкладка жива
 * (без кліку для старту).
 * — Не підміняємо `video.pause`: у WebKit це інколи ламає ланцюг автозапуску / залишає «натисни для play».
 * — Навіть у прихованій вкладці не викликаємо `pause()` самі: браузер сам гальмує декодер,
 *   якщо вирішить економити; як тільки вкладка знову видима — відео вже грає, без «розморозки».
 * — Після повернення на вкладку — серія відкладених `play()` (Safari часто лишає paused).
 * — Перехоплення подій на `blockInteractionRoot` — скрол не ламаємо; кліки не доходять до <video>.
 * — Watchdog / burst + повторні play() після відхилення промісу.
 */
export function bindHeroVideoAutoplay(
  video: HTMLVideoElement,
  options?: {
    extendedRetries?: boolean
    blockInteractionRoot?: HTMLElement | null
    /** false — плейлист з адмінки: onEnded перемикає наступний ролик */
    loop?: boolean
  },
): () => void {
  const extendedRetries = options?.extendedRetries ?? false
  const blockRoot = options?.blockInteractionRoot ?? null
  const shouldLoop = options?.loop !== false

  const applyLoopMode = () => {
    try {
      video.loop = shouldLoop
      if (shouldLoop) video.setAttribute('loop', '')
      else video.removeAttribute('loop')
    } catch {
      /* ignore */
    }
  }

  const safePlay = () => {
    /* 24/7: не блокуємо play() навіть коли `document.hidden`. Хром/Safari у фоні
       все одно знизять частоту таймерів і деко може стихнути; але як тільки вкладка
       знов видима — `video.paused` уже false, і користувач не бачить «склейку». */
    try {
      video.defaultMuted = true
      video.muted = true
      video.volume = 0
      video.playsInline = true
      video.autoplay = true
      applyLoopMode()
      video.controls = false
      video.removeAttribute('controls')
      video.disablePictureInPicture = true
      video.disableRemotePlayback = true
      video.setAttribute('playsinline', 'true')
      video.setAttribute('webkit-playsinline', 'true')
      video.setAttribute('muted', 'true')
      video.setAttribute('autoplay', 'true')
      video.setAttribute(
        'controlsList',
        'nodownload nofullscreen noremoteplayback noplaybackrate',
      )
      /* Не знижуємо fetchpriority: у hero залишаємо високий пріоритет з розмітки (швидший перший байт / decode). */
      try {
        video.setAttribute('x-webkit-airplay', 'deny')
      } catch {
        /* ignore */
      }
    } catch {
      /* ignore */
    }
    const attemptPlay = () => {
      const p = video.play()
      if (p && typeof p.catch === 'function') {
        p.catch(() => {
          try {
            video.defaultMuted = true
            video.muted = true
            video.volume = 0
          } catch {
            /* ignore */
          }
          queueMicrotask(() => {
            video.play().catch(() => {
              window.setTimeout(() => {
                try {
                  video.muted = true
                  video.defaultMuted = true
                } catch {
                  /* ignore */
                }
                video.play().catch(() => {})
              }, 48)
            })
          })
        })
      }
    }
    attemptPlay()
  }

  const onPause = () => {
    /* 24/7: одразу піднімаємо play(), навіть у прихованій вкладці. Якщо браузер сам
       заглушив декодер з причин економії — наш play() поверне його у грає-стан,
       щойно вкладка стане видимою. */
    if (video.ended) return
    safePlay()
    requestAnimationFrame(() => {
      safePlay()
    })
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
  const onLoadedMeta = () => safePlay()
  const onPageShow = () => safePlay()
  const onVisibility = () => {
    /* 24/7: НЕ паузимо самі при `hidden`. Браузер автоматично знизить пріоритет декодера,
       а коли вкладка знову видима — наш play() підстрахує. Якщо ж сам не зупиняли —
       у багатьох випадках decoder продовжує, і «оживає» миттєво. */
    if (document.visibilityState !== 'visible') return
    safePlay()
    /* Серія відкладених play() — Safari/WebKit інколи лишає paused після фокусу. */
    window.setTimeout(safePlay, 40)
    window.setTimeout(safePlay, 120)
    window.setTimeout(safePlay, 420)
    window.setTimeout(safePlay, 1200)
  }

  let focusRaf = 0
  const onWindowFocus = () => {
    /* 24/7: дозволяємо play() навіть якщо document.hidden — у момент колбеку
       стан може ще не оновитись, а ми хочемо першим зрозуміти, що вкладка ожила. */
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
    /* 24/7: тримаємо play() навіть під час прихованої вкладки. Це майже безкоштовно —
       видимих кадрів немає, drawImage у canvas-mirror не виконується (rAF
       призупинено фоновим режимом), але `video.paused` лишається false. */
    if (video.ended || video.error) return
    if (video.paused) safePlay()
  }

  /** Після перезавантаження Safari часто дає stalled/waiting — підштовхуємо play(), не чекаючи 4 с */
  const onWaiting = () => {
    queueMicrotask(safePlay)
    window.setTimeout(safePlay, 80)
  }
  const onStalled = () => {
    window.setTimeout(safePlay, 40)
    window.setTimeout(safePlay, 200)
  }

  queueMicrotask(safePlay)
  requestAnimationFrame(() => safePlay())

  if (video.readyState >= 1) safePlay()
  if (video.readyState >= 2) safePlay()

  const delays = extendedRetries
    ? [0, 40, 120, 420, 900]
    : [0, 60, 200]
  const timers = delays.map((ms) => window.setTimeout(safePlay, ms))

  /* Рідше будимо цикл, коли відео вже грає — менше навантаження на CPU */
  const watchdogMs = extendedRetries ? 480 : 2500
  const watchdogId = window.setInterval(watchdog, watchdogMs)

  /** Якщо Safari коротко ставить на паузу — підштовхуємо рідше, ніж щокадру.
   *  24/7: тримаємо burst навіть у прихованій вкладці; інтервали браузер сам
   *  заклемпить до 1000ms у фоні, тож затрати мінімальні. */
  const burstId = window.setInterval(() => {
    if (video.ended || video.error) return
    if (!video.paused) return
    safePlay()
  }, extendedRetries ? 220 : 400)

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

  /**
   * Перша взаємодія (tap / клавіша) — підштовхує muted autoplay у Safari.
   * Не підписуємося на scroll/wheel: інакше кожен скрол викликає safePlay() тисячі разів і «фризить» сторінку + hero.
   */
  const gestureOpts: AddEventListenerOptions = { capture: true, passive: true }
  const onAnyUserGesture = () => {
    if (video.ended || video.error) return
    if (!video.paused) return
    queueMicrotask(safePlay)
    requestAnimationFrame(safePlay)
    window.setTimeout(safePlay, 32)
    window.setTimeout(safePlay, 200)
  }
  document.addEventListener('pointerdown', onAnyUserGesture, gestureOpts)
  document.addEventListener('touchstart', onAnyUserGesture, gestureOpts)
  document.addEventListener('keydown', onAnyUserGesture, gestureOpts)

  const onPlaying = () => {
    try {
      if (!video.muted) video.muted = true
    } catch {
      /* ignore */
    }
  }

  /** Як тільки з’являється перший шматок буфера — пробуємо play (раніше за canplay на повному файлі). */
  let progressRaf = 0
  const onProgress = () => {
    if (progressRaf) return
    progressRaf = requestAnimationFrame(() => {
      progressRaf = 0
      if (typeof document !== 'undefined' && document.hidden) return
      if (!video.paused) return
      if (video.buffered.length === 0) return
      safePlay()
    })
  }

  video.addEventListener('waiting', onWaiting)
  video.addEventListener('stalled', onStalled)
  video.addEventListener('progress', onProgress)
  video.addEventListener('canplay', onCanPlay)
  video.addEventListener('canplaythrough', onCanPlayThrough)
  video.addEventListener('loadeddata', onLoadedData)
  video.addEventListener('loadedmetadata', onLoadedMeta)
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
  window.addEventListener('focus', onWindowFocus)
  document.addEventListener('visibilitychange', onVisibility)
  document.addEventListener('fullscreenchange', onFullscreenChange)
  document.addEventListener('resume', onDocumentResume)
  window.addEventListener('online', onOnline)
  video.addEventListener('webkitendfullscreen' as keyof HTMLVideoElement, onWebkitEndFullscreen as EventListener)

  const rootClickOpts: AddEventListenerOptions = { capture: true, passive: false }
  if (blockRoot) {
    blockRoot.addEventListener('click', blockUiClick, rootClickOpts)
    blockRoot.addEventListener('dblclick', blockUiClick, rootClickOpts)
    blockRoot.addEventListener('contextmenu', blockUiClick, rootClickOpts)
    blockRoot.addEventListener('auxclick', blockUiClick, rootClickOpts)
    blockRoot.addEventListener('pointerdown', blockUiClick, rootClickOpts)
    blockRoot.addEventListener('pointerup', blockUiClick, rootClickOpts)
    blockRoot.addEventListener('touchstart', blockUiClick, rootClickOpts)
    blockRoot.addEventListener('touchend', blockUiClick, rootClickOpts)
    blockRoot.addEventListener('pointercancel', blockUiClick, rootClickOpts)
  }

  return () => {
    if (progressRaf) cancelAnimationFrame(progressRaf)
    progressRaf = 0
    if (focusRaf) cancelAnimationFrame(focusRaf)
    focusRaf = 0
    window.clearInterval(watchdogId)
    window.clearInterval(burstId)
    timers.forEach((id) => window.clearTimeout(id))
    intersectionObserver?.disconnect()
    document.removeEventListener('pointerdown', onAnyUserGesture, gestureOpts)
    document.removeEventListener('touchstart', onAnyUserGesture, gestureOpts)
    document.removeEventListener('keydown', onAnyUserGesture, gestureOpts)
    if (blockRoot) {
      blockRoot.removeEventListener('click', blockUiClick, rootClickOpts)
      blockRoot.removeEventListener('dblclick', blockUiClick, rootClickOpts)
      blockRoot.removeEventListener('contextmenu', blockUiClick, rootClickOpts)
      blockRoot.removeEventListener('auxclick', blockUiClick, rootClickOpts)
      blockRoot.removeEventListener('pointerdown', blockUiClick, rootClickOpts)
      blockRoot.removeEventListener('pointerup', blockUiClick, rootClickOpts)
      blockRoot.removeEventListener('touchstart', blockUiClick, rootClickOpts)
      blockRoot.removeEventListener('touchend', blockUiClick, rootClickOpts)
      blockRoot.removeEventListener('pointercancel', blockUiClick, rootClickOpts)
    }
    video.removeEventListener('waiting', onWaiting)
    video.removeEventListener('stalled', onStalled)
    video.removeEventListener('progress', onProgress)
    video.removeEventListener('canplay', onCanPlay)
    video.removeEventListener('canplaythrough', onCanPlayThrough)
    video.removeEventListener('loadeddata', onLoadedData)
    video.removeEventListener('loadedmetadata', onLoadedMeta)
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
    window.removeEventListener('focus', onWindowFocus)
    document.removeEventListener('visibilitychange', onVisibility)
    document.removeEventListener('fullscreenchange', onFullscreenChange)
    document.removeEventListener('resume', onDocumentResume)
    window.removeEventListener('online', onOnline)
    video.removeEventListener('webkitendfullscreen' as keyof HTMLVideoElement, onWebkitEndFullscreen as EventListener)
  }
}
