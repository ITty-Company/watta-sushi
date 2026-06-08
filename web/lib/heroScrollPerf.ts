/**
 * Hero mp4: ніколи не pause() під час скролу — лише data-watta-scrolling для compact chrome.
 * Watchdog завжди підстраховує autoplay, поки вкладка видима.
 */

import { WATTA_CHROME_LAYOUT_SYNC_EVENT } from '@/lib/wattaChromeGoHome'
import { isWattaHomeHeroPathname } from '@/lib/wattaHtmlRouteClass'
import { retireHomeHeroEntryShell } from '@/lib/wattaHeroVideo'

const SCROLL_IDLE_MS = 140
const LAYOUT_SYNC_THROTTLE_MS = 1200

let userScrolling = false
let scrollIdleTimer = 0
let bound = false
let lastLayoutSyncAt = 0

export function isUserVerticallyScrolling(): boolean {
  return userScrolling
}

/** @deprecated hero більше не паузиться поза viewport */
export function isHeroVideoInView(): boolean {
  return true
}

/** Watchdog не чіпає відео у прихованій вкладці. */
export function shouldSkipHeroVideoWatchdog(): boolean {
  if (typeof document === 'undefined') return true
  return document.visibilityState !== 'visible'
}

function setScrollingAttr(active: boolean): void {
  const root = document.documentElement
  if (active) {
    root.dataset.wattaScrolling = 'true'
  } else {
    delete root.dataset.wattaScrolling
  }
}

function nudgeHomeHeroAutoplay(): void {
  const nudge = (video: HTMLVideoElement | null) => {
    if (!video || video.error) return
    try {
      video.defaultMuted = true
      video.muted = true
      video.volume = 0
      if (video.paused || video.ended) {
        const p = video.play()
        if (p?.catch) p.catch(() => {})
      }
    } catch {
      /* ignore */
    }
  }
  nudge(document.getElementById('watta-hero-preroll-video') as HTMLVideoElement | null)
  nudge(
    document.querySelector(
      '.watta-home-hero-client-stack-web video.watta-home-hero-native-video',
    ) as HTMLVideoElement | null,
  )
}

function isClientHomeHeroPlaying(): boolean {
  const client = document.querySelector(
    '.watta-home-hero-client-stack-web video.watta-home-hero-native-video',
  ) as HTMLVideoElement | null
  if (!client || client.error) return false
  return (
    !client.paused &&
    client.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
    client.currentTime > 0.02
  )
}

/** SSR preroll: знімаємо fixed-шар лише коли клієнтський плеер уже грає (не вбиваємо autoplay при скролі). */
function dismissHomePrerollOnScroll(): void {
  if (typeof document === 'undefined') return
  if (!document.body.classList.contains('watta-route-home')) return
  const root = document.documentElement
  if (root.getAttribute('data-watta-preroll-retired') === '1') return

  nudgeHomeHeroAutoplay()
  if (!isClientHomeHeroPlaying()) return

  root.setAttribute('data-watta-preroll-retired', '1')
  root.setAttribute('data-watta-client-hero', '1')
  retireHomeHeroEntryShell(
    document.querySelector('.watta-home-hero-entry-shell') as HTMLElement | null,
  )
  const preroll = document.getElementById('watta-hero-preroll-video') as HTMLVideoElement | null
  if (preroll) {
    try {
      preroll.pause()
      preroll.removeAttribute('src')
      preroll.load()
    } catch {
      /* ignore */
    }
  }
}

function onScrollStart(): void {
  dismissHomePrerollOnScroll()
  if (!userScrolling) {
    userScrolling = true
    setScrollingAttr(true)
  }
  window.clearTimeout(scrollIdleTimer)
  scrollIdleTimer = window.setTimeout(onScrollIdle, SCROLL_IDLE_MS)
}

function onScrollIdle(): void {
  userScrolling = false
  setScrollingAttr(false)
  // Layout sync (вимір sticky chrome) дорогий. На /menu скролять багато секцій — це дає мікрофризи.
  // Тому синхронізуємо лише на головній hero-сторінці, і не частіше ніж раз на N мс.
  try {
    const p = window.location?.pathname || '/'
    if (!isWattaHomeHeroPathname(p)) return
    const now = Date.now()
    if (now - lastLayoutSyncAt < LAYOUT_SYNC_THROTTLE_MS) return
    lastLayoutSyncAt = now
    window.dispatchEvent(new Event(WATTA_CHROME_LAYOUT_SYNC_EVENT))
  } catch {
    /* ignore */
  }
}

/** Підключити один раз на hero-сторінках. */
export function bindHeroScrollPerf(): () => void {
  if (typeof window === 'undefined' || bound) return () => {}
  bound = true

  const onScroll = () => onScrollStart()
  document.addEventListener('scroll', onScroll, { passive: true, capture: true })

  return () => {
    bound = false
    document.removeEventListener('scroll', onScroll, { capture: true })
    window.clearTimeout(scrollIdleTimer)
    delete document.documentElement.dataset.wattaScrolling
    userScrolling = false
  }
}

/** @deprecated scroll/offscreen більше не паузить hero */
export function pauseHeroVideosForScroll(): void {}
