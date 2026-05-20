'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { parseHomeHeroVideoUrlsFromApi } from '@/lib/homeHeroVideoSettings'
import {
  buildHomeHeroPlaylist,
  buildHomeHeroVideoSources,
  filterReachableHeroUrls,
  getPrimaryHomeHeroVideoSrc,
  WATTA_HOME_HERO_VIDEO_UPDATED_EVENT,
} from '@/lib/wattaHeroVideo'
import { fetchPublicApi, fetchPublicApiFresh } from '@/lib/publicApiFetch'

const HOME_HERO_URLS_CACHE_KEY = 'watta_home_hero_urls_v2'

export function useHomeHeroVideo() {
  const [homeHeroVideoUrls, setHomeHeroVideoUrls] = useState<string[]>(() => {
    if (typeof window === 'undefined') return []
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
  })
  const [heroVideoFailed, setHeroVideoFailed] = useState(false)
  const [heroVideoSourceIndex, setHeroVideoSourceIndex] = useState(0)
  const heroVideoRef = useRef<HTMLVideoElement | null>(null)

  const homeHeroPlaylist = useMemo(
    () => buildHomeHeroPlaylist(homeHeroVideoUrls),
    [homeHeroVideoUrls],
  )
  const videoSources = useMemo(
    () => buildHomeHeroVideoSources(homeHeroVideoUrls),
    [homeHeroVideoUrls],
  )
  const heroVideoSrc =
    homeHeroPlaylist[heroVideoSourceIndex] ??
    videoSources[heroVideoSourceIndex] ??
    videoSources[0] ??
    getPrimaryHomeHeroVideoSrc(homeHeroVideoUrls)
  const heroVideoShouldLoop = homeHeroPlaylist.length <= 1

  useEffect(() => {
    let probeAbort: AbortController | null = null

    const applySettings = (data: { homeHeroVideoUrl?: string; homeHeroVideoUrls?: string[] }) => {
      const urls = parseHomeHeroVideoUrlsFromApi(data)
      setHomeHeroVideoUrls(urls)
      try {
        sessionStorage.setItem(HOME_HERO_URLS_CACHE_KEY, JSON.stringify(urls))
      } catch {
        /* ignore */
      }
      if (!urls.some((u) => u.startsWith('/uploads/'))) return
      probeAbort?.abort()
      probeAbort = new AbortController()
      const signal = probeAbort.signal
      void filterReachableHeroUrls(urls, signal).then((reachable) => {
        if (signal.aborted || reachable.length === 0) return
        setHomeHeroVideoUrls((prev) => {
          const next = buildHomeHeroPlaylist(reachable)
          if (prev.length === next.length && prev.every((u, i) => u === next[i])) return prev
          try {
            sessionStorage.setItem(HOME_HERO_URLS_CACHE_KEY, JSON.stringify(reachable))
          } catch {
            /* ignore */
          }
          return [...next]
        })
      })
    }

    const fetchSettings = async (fresh = false) => {
      try {
        const res = await (fresh ? fetchPublicApiFresh : fetchPublicApi)('/api/settings')
        if (res.ok) applySettings(await res.json())
      } catch {
        /* ignore */
      }
    }

    const onHeroUpdated = (ev: Event) => {
      const detail = (ev as CustomEvent<{ url?: string; urls?: string[] }>).detail
      const fromEvent = parseHomeHeroVideoUrlsFromApi({
        homeHeroVideoUrls: detail?.urls,
        homeHeroVideoUrl: detail?.url,
      })
      if (fromEvent.length > 0) applySettings({ homeHeroVideoUrls: fromEvent, homeHeroVideoUrl: fromEvent[0] })
      else void fetchSettings(true)
    }

    const onSettingsUpdated = () => {
      void fetchSettings(true)
    }

    void fetchSettings()
    window.addEventListener(WATTA_HOME_HERO_VIDEO_UPDATED_EVENT, onHeroUpdated)
    window.addEventListener('settingsUpdated', onSettingsUpdated)
    return () => {
      probeAbort?.abort()
      window.removeEventListener(WATTA_HOME_HERO_VIDEO_UPDATED_EVENT, onHeroUpdated)
      window.removeEventListener('settingsUpdated', onSettingsUpdated)
    }
  }, [])

  useEffect(() => {
    setHeroVideoSourceIndex(0)
    setHeroVideoFailed(false)
  }, [heroVideoSrc, homeHeroVideoUrls])

  return {
    heroVideoRef,
    heroVideoSrc,
    heroVideoFailed,
    setHeroVideoFailed,
    heroVideoSourceIndex,
    setHeroVideoSourceIndex,
    videoSources,
    playlistLength: homeHeroPlaylist.length,
    heroVideoShouldLoop,
  }
}
