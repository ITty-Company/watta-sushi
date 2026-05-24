'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { parseDeliveryHeroVideoUrlsFromApi } from '@/lib/deliveryHeroVideoSettings'
import {
  buildDeliveryHeroPlaylist,
  buildDeliveryHeroVideoSources,
  getPrimaryDeliveryHeroVideoSrc,
  WATTA_DELIVERY_HERO_VIDEO_UPDATED_EVENT,
} from '@/lib/wattaDeliveryHeroVideo'
import { filterReachableHeroUrls } from '@/lib/wattaHeroVideo'
import { fetchPublicApi, fetchPublicApiFresh } from '@/lib/publicApiFetch'
import { readSiteSettingsRecord } from '@/lib/heroSettingsSiteCache'

const DELIVERY_HERO_URLS_CACHE_KEY = 'watta_delivery_hero_urls_v2'

export function useDeliveryHeroVideo() {
  const [deliveryHeroVideoUrls, setDeliveryHeroVideoUrls] = useState<string[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const raw = sessionStorage.getItem(DELIVERY_HERO_URLS_CACHE_KEY)
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

  const deliveryHeroPlaylist = useMemo(
    () => buildDeliveryHeroPlaylist(deliveryHeroVideoUrls),
    [deliveryHeroVideoUrls],
  )
  const videoSources = useMemo(
    () => buildDeliveryHeroVideoSources(deliveryHeroVideoUrls),
    [deliveryHeroVideoUrls],
  )
  const heroVideoSrc =
    deliveryHeroPlaylist[heroVideoSourceIndex] ??
    videoSources[heroVideoSourceIndex] ??
    videoSources[0] ??
    getPrimaryDeliveryHeroVideoSrc(deliveryHeroVideoUrls)
  const heroVideoShouldLoop = deliveryHeroPlaylist.length <= 1

  useEffect(() => {
    let probeAbort: AbortController | null = null

    const applySettings = (data: {
      deliveryHeroVideoUrl?: string
      deliveryHeroVideoUrls?: string[]
    }) => {
      const urls = parseDeliveryHeroVideoUrlsFromApi(data)
      setDeliveryHeroVideoUrls(urls)
      try {
        sessionStorage.setItem(DELIVERY_HERO_URLS_CACHE_KEY, JSON.stringify(urls))
      } catch {
        /* ignore */
      }
      if (!urls.some((u) => u.startsWith('/uploads/'))) return
      probeAbort?.abort()
      probeAbort = new AbortController()
      const signal = probeAbort.signal
      void filterReachableHeroUrls(urls, signal).then((reachable) => {
        if (signal.aborted || reachable.length === 0) return
        setDeliveryHeroVideoUrls((prev) => {
          const next = buildDeliveryHeroPlaylist(reachable)
          if (prev.length === next.length && prev.every((u, i) => u === next[i])) return prev
          try {
            sessionStorage.setItem(DELIVERY_HERO_URLS_CACHE_KEY, JSON.stringify(reachable))
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
      const fromEvent = parseDeliveryHeroVideoUrlsFromApi({
        deliveryHeroVideoUrls: detail?.urls,
        deliveryHeroVideoUrl: detail?.url,
      })
      if (fromEvent.length > 0) {
        applySettings({ deliveryHeroVideoUrls: fromEvent, deliveryHeroVideoUrl: fromEvent[0] })
      } else {
        void fetchSettings(true)
      }
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

    window.addEventListener(WATTA_DELIVERY_HERO_VIDEO_UPDATED_EVENT, onHeroUpdated)
    window.addEventListener('settingsUpdated', onSettingsUpdated)
    return () => {
      probeAbort?.abort()
      window.removeEventListener(WATTA_DELIVERY_HERO_VIDEO_UPDATED_EVENT, onHeroUpdated)
      window.removeEventListener('settingsUpdated', onSettingsUpdated)
    }
  }, [])

  useEffect(() => {
    setHeroVideoSourceIndex(0)
    setHeroVideoFailed(false)
  }, [heroVideoSrc, deliveryHeroVideoUrls])

  return {
    heroVideoRef,
    heroVideoSrc,
    heroVideoFailed,
    setHeroVideoFailed,
    heroVideoSourceIndex,
    setHeroVideoSourceIndex,
    videoSources,
    playlistLength: deliveryHeroPlaylist.length,
    heroVideoShouldLoop,
  }
}
