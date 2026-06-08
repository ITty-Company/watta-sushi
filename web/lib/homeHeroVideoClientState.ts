import type { Dispatch, SetStateAction } from 'react'
import { parseHomeHeroVideoUrlsFromApi } from '@/lib/homeHeroVideoSettings'
import { readSiteSettingsRecord } from '@/lib/heroSettingsSiteCache'
import { normalizeSameOriginMediaPath } from '@/lib/resolveUploadMediaUrl'
import { filterReachableHeroUrls } from '@/lib/wattaHeroVideo'

export const HOME_HERO_URLS_CACHE_KEY = 'watta_home_hero_urls_v2'

export type HomeHeroProbeRef = { current: AbortController | null }

let lastHomeHeroProbeKey = ''

function homeHeroProbeKey(urls: readonly string[]): string {
  return urls.map((u) => normalizeSameOriginMediaPath(u.trim())).join('\0')
}

function sameUrlList(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false
  return a.every((u, i) => u === b[i])
}

function persistHomeHeroUrlsCache(urls: string[]): void {
  if (typeof sessionStorage === 'undefined') return
  try {
    const normalized = urls.map((u) => normalizeSameOriginMediaPath(u))
    sessionStorage.setItem(HOME_HERO_URLS_CACHE_KEY, JSON.stringify(normalized))
  } catch {
    /* ignore */
  }
}

/** Після mount (useLayoutEffect): site settings warm cache → session hero cache. */
export function readInitialHomeHeroVideoUrls(): string[] {
  if (typeof window === 'undefined') return []

  const settings = readSiteSettingsRecord()
  if (settings) {
    const fromSettings = parseHomeHeroVideoUrlsFromApi(
      settings as { homeHeroVideoUrl?: unknown; homeHeroVideoUrls?: unknown },
    )
    // `/uploads/*` з налаштувань ще не перевірені на доступність (на проді без диска часто 404).
    // Синхронно не робимо їх джерелом — інакше мертвий upload морозить hero на постері.
    // Probe (applyHomeHeroVideoFromApi) додасть їх, щойно підтвердить доступність.
    const verified = fromSettings.filter((u) => !u.startsWith('/uploads/'))
    if (verified.length > 0) return verified
  }

  try {
    const raw = sessionStorage.getItem(HOME_HERO_URLS_CACHE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed)
      ? parsed
          .filter((u): u is string => typeof u === 'string' && u.trim().length > 0)
          .map((u) => normalizeSameOriginMediaPath(u))
      : []
  } catch {
    return []
  }
}

/**
 * Застосувати URL hero з API / кешу. Мертві `/uploads/` прибираємо — лишаються
 * запасні mp4 з `buildHomeHeroPlaylist` без довгих onError-циклів.
 */
export function applyHomeHeroVideoFromApi(
  data: { homeHeroVideoUrl?: unknown; homeHeroVideoUrls?: unknown },
  setHomeHeroVideoUrls: Dispatch<SetStateAction<string[]>>,
  probeRef?: HomeHeroProbeRef,
): void {
  const urls = parseHomeHeroVideoUrlsFromApi(data)

  // Публічні / абсолютні URL доступні одразу — застосовуємо без probe.
  if (!urls.some((u) => u.startsWith('/uploads/'))) {
    setHomeHeroVideoUrls((prev) => {
      if (sameUrlList(prev, urls)) return prev
      persistHomeHeroUrlsCache(urls)
      return urls
    })
    lastHomeHeroProbeKey = ''
    return
  }

  // Є `/uploads/*` — НЕ робимо їх активним джерелом (і не кешуємо), поки probe не підтвердить
  // доступність. Мертвий upload інакше морозить hero на постері (readyState 0), а кеш отруює
  // SSR-preroll на наступному завантаженні. До підтвердження грає публічний запасний mp4
  // (buildHomeHeroPlaylist дає його при порожньому списку).
  const probeKey = homeHeroProbeKey(urls)
  if (probeKey === lastHomeHeroProbeKey) return

  probeRef?.current?.abort()
  const ac = new AbortController()
  if (probeRef) probeRef.current = ac

  void filterReachableHeroUrls(urls, ac.signal).then((reachable) => {
    if (ac.signal.aborted) return
    lastHomeHeroProbeKey = probeKey
    setHomeHeroVideoUrls((prev) => {
      if (sameUrlList(prev, reachable)) return prev
      persistHomeHeroUrlsCache(reachable)
      return [...reachable]
    })
  })
}
