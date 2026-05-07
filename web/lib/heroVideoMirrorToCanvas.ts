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

  let ro: ResizeObserver | null = null
  let raf = 0
  let rvfc = 0
  let poll = 0
  let lastDraw = -Infinity
  const MIN_FRAME_MS = 33

  const V = video as HTMLVideoElement & {
    requestVideoFrameCallback?: (cb: () => void) => number
    cancelVideoFrameCallback?: (h: number) => void
  }
  const useRvfc = typeof V.requestVideoFrameCallback === 'function'

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

  const letterboxFill = (): string => {
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

  const draw = () => {
    const vw = video.videoWidth
    const vh = video.videoHeight
    if (!vw || !vh) return

    const rect = canvas.getBoundingClientRect()
    const w = rect.width
    const h = rect.height
    if (w <= 0 || h <= 0) return

    const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 1.5)
    const cw = Math.max(1, Math.floor(w * dpr))
    const ch = Math.max(1, Math.floor(h * dpr))
    if (canvas.width !== cw || canvas.height !== ch) {
      canvas.width = cw
      canvas.height = ch
    }

    const fit = readFit()
    const scale = fit === 'contain' ? Math.min(cw / vw, ch / vh) : Math.max(cw / vw, ch / vh)
    const dw = vw * scale
    const dh = vh * scale
    const pos = readObjectPosition()
    const dx = (cw - dw) * pos.x
    const dy = (ch - dh) * pos.y

    ctx.setTransform(1, 0, 0, 1, 0, 0)
    /* Узгоджено з тлом сторінки (letterbox при contain і підмазка під cover) */
    ctx.fillStyle = letterboxFill()
    ctx.fillRect(0, 0, cw, ch)
    ctx.drawImage(video, 0, 0, vw, vh, dx, dy, dw, dh)
  }

  let running = true

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

  const onMeta = () => draw()
  const onSeeked = () => draw()
  const onLoadedData = () => pump()
  const onCanPlay = () => pump()
  const onPlay = () => pump()

  video.addEventListener('loadedmetadata', onMeta)
  video.addEventListener('seeked', onSeeked)
  video.addEventListener('loadeddata', onLoadedData)
  video.addEventListener('canplay', onCanPlay)
  video.addEventListener('play', onPlay)

  if (typeof ResizeObserver !== 'undefined') {
    ro = new ResizeObserver(() => draw())
    ro.observe(canvas)
  }

  pump()

  return () => {
    running = false
    cancelRvfc()
    cancelRaf()
    cancelPoll()
    ro?.disconnect()
    video.removeEventListener('loadedmetadata', onMeta)
    video.removeEventListener('seeked', onSeeked)
    video.removeEventListener('loadeddata', onLoadedData)
    video.removeEventListener('canplay', onCanPlay)
    video.removeEventListener('play', onPlay)
  }
}
