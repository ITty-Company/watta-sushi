import { HOME_HERO_URLS_CACHE_KEY } from '@/lib/homeHeroVideoClientState'
import { normalizeSameOriginMediaPath } from '@/lib/resolveUploadMediaUrl'
import { getPrimaryHomeHeroVideoSrc, WATTA_HERO_PRIMARY_MP4 } from '@/lib/wattaHeroVideo'

const warmedUrls = new Set<string>()
let pageHideAbort: AbortController | null = null

/** SSR preroll `<video>` уже качає mp4 — дублювати Range-fetch не потрібно. */
function isPrerollHeroVideoActive(): boolean {
  if (typeof document === 'undefined') return false
  return Boolean(document.getElementById('watta-hero-preroll-video'))
}

function heroWarmSignal(): AbortSignal | undefined {
  if (typeof window === 'undefined') return undefined
  if (!pageHideAbort) {
    pageHideAbort = new AbortController()
    window.addEventListener(
      'pagehide',
      () => {
        pageHideAbort?.abort()
      },
      { once: true },
    )
  }
  return pageHideAbort.signal
}

function readCachedFirstHeroUrl(): string | null {
  if (typeof sessionStorage === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(HOME_HERO_URLS_CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return null
    const first = parsed.find((u): u is string => typeof u === 'string' && u.trim().length > 0)
    return first?.trim() ?? null
  } catch {
    return null
  }
}

function isHeroUrlLoadedByVideoElement(url: string): boolean {
  if (typeof document === 'undefined') return false
  const needle = normalizeSameOriginMediaPath(url.trim()).split('?')[0]?.split('#')[0] ?? ''
  if (!needle) return false
  const videos = document.querySelectorAll<HTMLVideoElement>(
    '#watta-hero-preroll-video, video.watta-home-hero-native-video, .welcome-video-native-web',
  )
  for (let i = 0; i < videos.length; i++) {
    const v = videos[i]
    const raw = (v.currentSrc || v.getAttribute('src') || '').trim()
    if (!raw) continue
    const path = normalizeSameOriginMediaPath(raw).split('?')[0]?.split('#')[0] ?? ''
    if (path === needle) return true
  }
  return false
}

function warmOneHeroUrl(url: string): void {
  const src = normalizeSameOriginMediaPath(url.trim())
  if (!src || warmedUrls.has(src)) return
  if (isHeroUrlLoadedByVideoElement(src)) return
  warmedUrls.add(src)
  const signal = heroWarmSignal()
  if (signal?.aborted) return
  void fetch(src, {
    method: 'GET',
    headers: { Range: 'bytes=0-524287' },
    credentials: 'same-origin',
    cache: 'default',
    signal,
  }).catch(() => {})
}

/**
 * Прогріває HTTP-кеш hero mp4 через fetch (без другого <video> — Safari лімітує декодер).
 * Спочатку перший URL з session cache (адмінка), інакше public fallback.
 */
export function warmHeroVideoCache(url?: string): void {
  if (typeof window === 'undefined') return
  if (isPrerollHeroVideoActive()) return

  if (url?.trim()) {
    warmOneHeroUrl(url)
    return
  }

  const cached = readCachedFirstHeroUrl()
  if (cached) {
    warmOneHeroUrl(cached)
    return
  }

  warmOneHeroUrl(getPrimaryHomeHeroVideoSrc() || WATTA_HERO_PRIMARY_MP4)
}

/** Прогріває перший ролик плейлиста (HTTP-кеш). Наступні — лише при onEnded, без дубля fetch+video. */
export function warmHeroVideoPlaylist(urls: readonly string[], limit = 1): void {
  if (typeof window === 'undefined') return
  if (isPrerollHeroVideoActive()) return
  const run = () => {
    for (const u of urls.slice(0, limit)) warmOneHeroUrl(u)
  }
  type IdleWindow = Window & {
    requestIdleCallback?: (cb: () => void, opts?: { timeout?: number }) => number
  }
  const w = window as IdleWindow
  if (typeof w.requestIdleCallback === 'function') {
    w.requestIdleCallback(run, { timeout: 2000 })
  } else {
    window.setTimeout(run, 400)
  }
}
