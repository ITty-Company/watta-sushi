/**
 * Декоративне відео: кадри на <canvas>, <video> лише декодує (opacity: 0).
 * requestVideoFrameCallback — у тон з кадрами; без RVFC — rAF ~60fps лише під час відтворення.
 */
export function bindHeroVideoMirrorToCanvas(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement
): () => void {
  const ctx = canvas.getContext('2d', { alpha: false })
  if (!ctx) return () => {}
  try {
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
  } catch {
    /* ignore */
  }

  let ro: ResizeObserver | null = null
  let raf = 0
  let rvfc = 0
  let poll = 0
  let lastDraw = -Infinity
  /** Частіші кадри на старті — швидший перший кадр на canvas; далі обмеження знімається не потрібно */
  const MIN_FRAME_MS = 18

  const V = video as HTMLVideoElement & {
    requestVideoFrameCallback?: (cb: () => void) => number
    cancelVideoFrameCallback?: (h: number) => void
  }
  /** RVFC у різних WebKit збоях не викликається — лишаємо лише rAF + timeupdate (надійніше для hero). */
  const useRvfc = false

  const readFit = (): 'cover' | 'contain' => {
    try {
      const fit = getComputedStyle(video).objectFit
      return fit === 'contain' ? 'contain' : 'cover'
    } catch {
      return 'cover'
    }
  }

  const readObjectPosition = (): { x: number; y: number } => {
    try {
      const raw = getComputedStyle(video).objectPosition || ''
      const tokens = raw.trim().split(/\s+/).filter(Boolean)
      const parseAxis = (token: string | undefined, axis: 'x' | 'y'): number => {
        if (!token) return 0.5
        const t = token.toLowerCase()
        if (t.endsWith('%')) {
          const n = Number.parseFloat(t.slice(0, -1))
          if (Number.isFinite(n)) return Math.max(0, Math.min(1, n / 100))
        }
        if (axis === 'x') {
          if (t === 'left') return 0
          if (t === 'right') return 1
          if (t === 'center') return 0.5
        } else {
          if (t === 'top') return 0
          if (t === 'bottom') return 1
          if (t === 'center') return 0.5
        }
        return 0.5
      }

      if (tokens.length === 1) {
        return {
          x: parseAxis(tokens[0], 'x'),
          y: parseAxis(tokens[0], 'y'),
        }
      }
      return {
        x: parseAxis(tokens[0], 'x'),
        y: parseAxis(tokens[1], 'y'),
      }
    } catch {
      return { x: 0.5, y: 0.5 }
    }
  }

  const letterboxFillUncached = (): string => {
    if (typeof document === 'undefined') return '#e4ebe6'
    try {
      const root = getComputedStyle(document.documentElement)
      const hero = canvas.closest('.welcome-hero-section-web')
      if (hero) {
        const shell = getComputedStyle(hero)
        const resolved = shell.backgroundColor
        if (resolved && resolved !== 'rgba(0, 0, 0, 0)' && resolved !== 'transparent') {
          return resolved
        }
      }
      const letter = root.getPropertyValue('--watta-hero-letterbox-fill').trim()
      if (letter) return letter
      const fill = root.getPropertyValue('--watta-page-fill').trim()
      if (fill) return fill
    } catch {
      /* ignore */
    }
    return '#e4ebe6'
  }

  /** getComputedStyle на кожному кадрі дуже дорого в Safari; оновлюємо лише при resize / metadata */
  let styleDirty = true
  let cachedFit: 'cover' | 'contain' = 'cover'
  let cachedObjectPosition = { x: 0.5, y: 0.5 }
  let cachedLetterbox = '#e4ebe6'

  const refreshStyleCache = () => {
    cachedFit = readFit()
    cachedObjectPosition = readObjectPosition()
    cachedLetterbox = letterboxFillUncached()
    styleDirty = false
  }

  const invalidateStyleCache = () => {
    styleDirty = true
  }

  const draw = () => {
    const vw = video.videoWidth
    const vh = video.videoHeight
    if (!vw || !vh) return

    const rect = canvas.getBoundingClientRect()
    const w = rect.width
    const h = rect.height
    if (w <= 0 || h <= 0) return

    const rawDpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
    /* Повний DPR до 4 (Retina / iPhone Pro); обмеження — розмір canvas. */
    const dpr = Math.min(Math.max(rawDpr, 1), 4)
    const cw = Math.max(1, Math.floor(w * dpr))
    const ch = Math.max(1, Math.floor(h * dpr))
    if (canvas.width !== cw || canvas.height !== ch) {
      canvas.width = cw
      canvas.height = ch
      invalidateStyleCache()
    }

    if (styleDirty) refreshStyleCache()

    const fit = cachedFit
    const scale = fit === 'contain' ? Math.min(cw / vw, ch / vh) : Math.max(cw / vw, ch / vh)
    const dw = vw * scale
    const dh = vh * scale
    const pos = cachedObjectPosition
    const dx = (cw - dw) * pos.x
    const dy = (ch - dh) * pos.y

    ctx.setTransform(1, 0, 0, 1, 0, 0)
    /* Узгоджено з тлом сторінки (letterbox при contain і підмазка під cover) */
    ctx.fillStyle = cachedLetterbox
    ctx.fillRect(0, 0, cw, ch)
    ctx.drawImage(video, 0, 0, vw, vh, dx, dy, dw, dh)
  }

  /**
   * Постер на canvas одразу (до прибуття першого кадру mp4). Так hero миттєво «живий»:
   * картинка вже в кеші браузера (тег <video poster> або CSS background) — drawImage синхронний.
   */
  const drawPoster = () => {
    const posterUrl = video.getAttribute('poster') || '/watta-sushi.jpg'
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => {
      const iw = img.naturalWidth
      const ih = img.naturalHeight
      if (!iw || !ih) return
      const rect = canvas.getBoundingClientRect()
      const w = rect.width
      const h = rect.height
      if (w <= 0 || h <= 0) return
      const rawDpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
      const dpr = Math.min(Math.max(rawDpr, 1), 4)
      const cw = Math.max(1, Math.floor(w * dpr))
      const ch = Math.max(1, Math.floor(h * dpr))
      if (canvas.width !== cw || canvas.height !== ch) {
        canvas.width = cw
        canvas.height = ch
        invalidateStyleCache()
      }
      if (styleDirty) refreshStyleCache()
      /* Якщо вже встиг прийти кадр відео — постер не перетираємо. */
      if (video.readyState >= 2 && !video.paused) return
      const fit = cachedFit
      const scale = fit === 'contain' ? Math.min(cw / iw, ch / ih) : Math.max(cw / iw, ch / ih)
      const dw = iw * scale
      const dh = ih * scale
      const pos = cachedObjectPosition
      const dx = (cw - dw) * pos.x
      const dy = (ch - dh) * pos.y
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.fillStyle = cachedLetterbox
      ctx.fillRect(0, 0, cw, ch)
      ctx.drawImage(img, dx, dy, dw, dh)
    }
    img.src = posterUrl
  }
  drawPoster()

  let running = true
  let resizeRaf = 0
  let timeUpdateRaf = 0

  const cancelRvfc = () => {
    if (rvfc && typeof V.cancelVideoFrameCallback === 'function') {
      try {
        V.cancelVideoFrameCallback(rvfc)
      } catch {
        /* ignore */
      }
    }
    rvfc = 0
  }

  const cancelRaf = () => {
    if (raf) cancelAnimationFrame(raf)
    raf = 0
  }

  const cancelPoll = () => {
    if (poll) window.clearTimeout(poll)
    poll = 0
  }

  const waitPlay = () => {
    if (!running) return
    cancelRvfc()
    cancelRaf()
    poll = window.setTimeout(() => {
      poll = 0
      pump()
    }, 150)
  }

  const tickRaf = (now: number) => {
    if (!running) return
    if (video.paused || video.ended) {
      cancelRaf()
      waitPlay()
      return
    }
    raf = requestAnimationFrame(tickRaf)
    if (now - lastDraw < MIN_FRAME_MS) return
    lastDraw = now
    draw()
  }

  const pump = () => {
    if (!running) return
    cancelRvfc()
    cancelRaf()
    cancelPoll()
    draw()

    if (video.paused || video.ended) {
      waitPlay()
      return
    }

    if (useRvfc) {
      rvfc = V.requestVideoFrameCallback!(() => {
        const now = typeof performance !== 'undefined' ? performance.now() : Date.now()
        if (now - lastDraw >= MIN_FRAME_MS) {
          lastDraw = now
          draw()
        }
        pump()
      })
    } else {
      lastDraw = -Infinity
      raf = requestAnimationFrame(tickRaf)
    }
  }

  const onMeta = () => {
    invalidateStyleCache()
    draw()
  }
  const onSeeked = () => draw()
  const onLoadedData = () => pump()
  const onCanPlay = () => pump()
  const onPlay = () => pump()
  /** Safari: реальний старт декоду після play(); без цього canvas довго лишається на першому кадрі */
  const onPlaying = () => {
    lastDraw = -Infinity
    pump()
  }

  /** Якщо rAF пропустив кадри (сплеш/фонова вкладка), timeupdate все одно рухається з currentTime */
  const onTimeUpdate = () => {
    if (!running || video.paused) return
    if (timeUpdateRaf) return
    timeUpdateRaf = requestAnimationFrame(() => {
      timeUpdateRaf = 0
      const now = typeof performance !== 'undefined' ? performance.now() : Date.now()
      if (now - lastDraw < MIN_FRAME_MS) return
      lastDraw = now
      draw()
    })
  }

  video.addEventListener('loadedmetadata', onMeta)
  video.addEventListener('seeked', onSeeked)
  video.addEventListener('loadeddata', onLoadedData)
  video.addEventListener('canplay', onCanPlay)
  video.addEventListener('play', onPlay)
  video.addEventListener('playing', onPlaying)
  video.addEventListener('timeupdate', onTimeUpdate)

  const scheduleResizeDraw = () => {
    if (resizeRaf) return
    resizeRaf = requestAnimationFrame(() => {
      resizeRaf = 0
      invalidateStyleCache()
      draw()
    })
  }

  if (typeof ResizeObserver !== 'undefined') {
    ro = new ResizeObserver(() => scheduleResizeDraw())
    ro.observe(canvas)
    const stack = canvas.parentElement
    if (stack) ro.observe(stack)
  }

  const onPageShow = () => {
    running = true
    invalidateStyleCache()
    pump()
  }
  window.addEventListener('pageshow', onPageShow)

  const onDocVisibility = () => {
    if (typeof document === 'undefined') return
    if (document.visibilityState === 'hidden') {
      running = false
      cancelRvfc()
      cancelRaf()
      cancelPoll()
      return
    }
    running = true
    pump()
  }
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', onDocVisibility)
  }

  let visibilityIo: IntersectionObserver | null = null
  if (typeof IntersectionObserver !== 'undefined') {
    const observeTarget = canvas.parentElement ?? canvas
    visibilityIo = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((e) => e.isIntersecting)
        if (visible) {
          if (!running) {
            running = true
            pump()
          }
          return
        }
        running = false
        cancelRvfc()
        cancelRaf()
        cancelPoll()
        if (timeUpdateRaf) {
          cancelAnimationFrame(timeUpdateRaf)
          timeUpdateRaf = 0
        }
      },
      { threshold: 0.02, rootMargin: '48px 0px' },
    )
    visibilityIo.observe(observeTarget)
  }

  pump()

  return () => {
    running = false
    if (timeUpdateRaf) cancelAnimationFrame(timeUpdateRaf)
    timeUpdateRaf = 0
    if (resizeRaf) cancelAnimationFrame(resizeRaf)
    resizeRaf = 0
    cancelRvfc()
    cancelRaf()
    cancelPoll()
    ro?.disconnect()
    visibilityIo?.disconnect()
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', onDocVisibility)
    }
    window.removeEventListener('pageshow', onPageShow)
    video.removeEventListener('loadedmetadata', onMeta)
    video.removeEventListener('seeked', onSeeked)
    video.removeEventListener('loadeddata', onLoadedData)
    video.removeEventListener('canplay', onCanPlay)
    video.removeEventListener('play', onPlay)
    video.removeEventListener('playing', onPlaying)
    video.removeEventListener('timeupdate', onTimeUpdate)
  }
}
