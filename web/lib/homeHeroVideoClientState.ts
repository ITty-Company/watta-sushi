import type { Dispatch, SetStateAction } from 'react'
import { parseHomeHeroVideoUrlsFromApi } from '@/lib/homeHeroVideoSettings'
import { readSiteSettingsRecord } from '@/lib/heroSettingsSiteCache'
import { filterReachableHeroUrls } from '@/lib/wattaHeroVideo'

export const HOME_HERO_URLS_CACHE_KEY = 'watta_home_hero_urls_v2'

export type HomeHeroProbeRef = { current: AbortController | null }

function persistHomeHeroUrlsCache(urls: string[]): void {
  if (typeof sessionStorage === 'undefined') return
  try {
    sessionStorage.setItem(HOME_HERO_URLS_CACHE_KEY, JSON.stringify(urls))
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
    if (fromSettings.length > 0) return fromSettings
  }

  try {
    const raw = sessionStorage.getItem(HOME_HERO_URLS_CACHE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed)
      ? parsed.filter((u): u is string => typeof u === 'string' && u.trim().length > 0)
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
  setHomeHeroVideoUrls(urls)
  persistHomeHeroUrlsCache(urls)

  if (!urls.some((u) => u.startsWith('/uploads/'))) return

  probeRef?.current?.abort()
  const ac = new AbortController()
  if (probeRef) probeRef.current = ac

  void filterReachableHeroUrls(urls, ac.signal).then((reachable) => {
    if (ac.signal.aborted) return
    if (reachable.length === 0) {
      setHomeHeroVideoUrls((prev) => {
        if (prev.length === 0) return prev
        persistHomeHeroUrlsCache([])
        return []
      })
      return
    }
    setHomeHeroVideoUrls((prev) => {
      if (prev.length === reachable.length && prev.every((u, i) => u === reachable[i])) {
        return prev
      }
      persistHomeHeroUrlsCache(reachable)
      return [...reachable]
    })
  })
}
