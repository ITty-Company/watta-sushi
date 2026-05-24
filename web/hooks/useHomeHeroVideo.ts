'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { parseHomeHeroVideoUrlsFromApi } from '@/lib/homeHeroVideoSettings'
import {
  applyHomeHeroVideoFromApi,
  readInitialHomeHeroVideoUrls,
} from '@/lib/homeHeroVideoClientState'
import {
  buildHomeHeroPlaylist,
  buildHomeHeroVideoSources,
  getPrimaryHomeHeroVideoSrc,
  WATTA_HOME_HERO_VIDEO_UPDATED_EVENT,
} from '@/lib/wattaHeroVideo'
import { fetchPublicApi, fetchPublicApiFresh } from '@/lib/publicApiFetch'
import { readSiteSettingsRecord, writeSiteSettingsRecord } from '@/lib/heroSettingsSiteCache'

export function useHomeHeroVideo() {
  const homeHeroProbeRef = useRef<AbortController | null>(null)
  const [homeHeroVideoUrls, setHomeHeroVideoUrls] = useState<string[]>([])

  useLayoutEffect(() => {
    const cached = readInitialHomeHeroVideoUrls()
    if (cached.length > 0) setHomeHeroVideoUrls(cached)
  }, [])
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
    const src = heroVideoSrc
    if (!src || typeof document === 'undefined') return
    const id = 'watta-hero-video-preload'
    let link = document.getElementById(id) as HTMLLinkElement | null
    if (!link) {
      link = document.createElement('link')
      link.id = id
      link.rel = 'preload'
      link.as = 'video'
      ;(link as HTMLLinkElement & { fetchPriority?: string }).fetchPriority = 'high'
      document.head.appendChild(link)
    }
    if (link.href !== src) link.href = src
  }, [heroVideoSrc])

  useEffect(() => {
    const applySettings = (data: { homeHeroVideoUrl?: string; homeHeroVideoUrls?: string[] }) => {
      applyHomeHeroVideoFromApi(data, setHomeHeroVideoUrls, homeHeroProbeRef)
    }

    const fetchSettings = async (fresh = false) => {
      try {
        const res = await (fresh ? fetchPublicApiFresh : fetchPublicApi)('/api/settings')
        if (!res.ok) return
        const data = await res.json()
        if (data && typeof data === 'object' && !Array.isArray(data)) {
          writeSiteSettingsRecord(data as Record<string, unknown>)
        }
        applySettings(data)
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

    const cached = readSiteSettingsRecord()
    if (cached) {
      applySettings(cached)
      type IdleWindow = Window & {
        requestIdleCallback?: (cb: () => void, opts?: { timeout?: number }) => number
      }
      const w = typeof window !== 'undefined' ? (window as IdleWindow) : null
      const revalidate = () => {
        void fetchSettings()
      }
      if (w && typeof w.requestIdleCallback === 'function') {
        w.requestIdleCallback(revalidate, { timeout: 800 })
      } else if (typeof window !== 'undefined') {
        window.setTimeout(revalidate, 300)
      }
    } else {
      void fetchSettings()
    }

    window.addEventListener(WATTA_HOME_HERO_VIDEO_UPDATED_EVENT, onHeroUpdated)
    window.addEventListener('settingsUpdated', onSettingsUpdated)
    return () => {
      homeHeroProbeRef.current?.abort()
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
