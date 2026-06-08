import { isWelcomeHeroVideo, resumeHeroVideoPlayback } from '@/lib/kickWelcomeHeroVideo'

const guarded = new WeakSet<HTMLVideoElement>()

function mayAllowPause(video: HTMLVideoElement): boolean {
  if (!video.isConnected) return true
  if (video.error || video.ended) return true
  if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return true
  if (
    video.id === 'watta-hero-preroll-video' &&
    document.documentElement.hasAttribute('data-watta-preroll-retired')
  ) {
    return true
  }
  return false
}

/**
 * Головна hero: користувач не може «зупинити» відео кліком / нативним UI.
 * pause() ігнорується, поки вкладка видима (окрім teardown / preroll retire).
 */
export function bindHomeHeroVideoGuard(
  video: HTMLVideoElement,
  options?: { loop?: boolean },
): () => void {
  if (typeof window === 'undefined' || !isWelcomeHeroVideo(video)) return () => {}
  if (guarded.has(video)) return () => {}

  guarded.add(video)
  const nativePause = video.pause.bind(video)
  const loop = options?.loop !== false

  const resume = () => {
    if (mayAllowPause(video)) return
    resumeHeroVideoPlayback(video, { loop, urgent: true })
  }

  video.pause = function guardedPause() {
    if (mayAllowPause(video)) return nativePause()
    queueMicrotask(resume)
  }

  const onPause = () => {
    if (mayAllowPause(video)) return
    resume()
  }

  const blockNativeToggle = (e: Event) => {
    e.preventDefault()
    e.stopPropagation()
    if (!video.paused || video.ended || video.error) return
    resume()
  }

  const captureBlock: AddEventListenerOptions = { capture: true, passive: false }
  video.addEventListener('pause', onPause)
  video.addEventListener('click', blockNativeToggle, captureBlock)
  video.addEventListener('pointerdown', blockNativeToggle, captureBlock)
  video.addEventListener('dblclick', blockNativeToggle, captureBlock)
  video.addEventListener('contextmenu', blockNativeToggle, captureBlock)

  try {
    video.setAttribute('inert', '')
    video.tabIndex = -1
  } catch {
    /* ignore */
  }

  return () => {
    guarded.delete(video)
    video.pause = nativePause
    video.removeEventListener('pause', onPause)
    video.removeEventListener('click', blockNativeToggle, captureBlock)
    video.removeEventListener('pointerdown', blockNativeToggle, captureBlock)
    video.removeEventListener('dblclick', blockNativeToggle, captureBlock)
    video.removeEventListener('contextmenu', blockNativeToggle, captureBlock)
    try {
      video.removeAttribute('inert')
    } catch {
      /* ignore */
    }
  }
}
