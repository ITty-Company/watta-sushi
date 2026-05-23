'use client'

import { useEffect, useState } from 'react'
import { parseAuthHeroVideoUrlsFromApi } from '@/lib/authHeroVideoSettings'
import {
  parseAuthHeroPhone2VideoUrlsFromApi,
  parseAuthHeroPhoneCopyFromApi,
  type AuthHeroPhoneCopyMap,
} from '@/lib/authHeroPhoneSettings'
import { filterReachableHeroUrls } from '@/lib/wattaHeroVideo'
import {
  WATTA_AUTH_HERO_VIDEO_UPDATED_EVENT,
  type AuthHeroPhonesUpdatedDetail,
} from '@/lib/wattaAuthHeroVideo'
import { fetchPublicApi, fetchPublicApiFresh } from '@/lib/publicApiFetch'

const PHONE1_CACHE_KEY = 'watta_auth_hero_phone1_urls_v1'
const PHONE2_CACHE_KEY = 'watta_auth_hero_phone2_urls_v1'

function readUrlsCache(key: string): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = sessionStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed)
      ? parsed.filter((u): u is string => typeof u === 'string' && u.trim().length > 0)
      : []
  } catch {
    return []
  }
}

function writeUrlsCache(key: string, urls: string[]) {
  try {
    sessionStorage.setItem(key, JSON.stringify(urls))
  } catch {
    /* ignore */
  }
}

type UseAuthHeroVideosOptions = {
  enabled?: boolean
}

export function useAuthHeroVideos({ enabled = true }: UseAuthHeroVideosOptions = {}) {
  const [phone1Urls, setPhone1Urls] = useState<string[]>(() => readUrlsCache(PHONE1_CACHE_KEY))
  const [phone2Urls, setPhone2Urls] = useState<string[]>(() => readUrlsCache(PHONE2_CACHE_KEY))
  const [phone1Copy, setPhone1Copy] = useState<AuthHeroPhoneCopyMap>({})
  const [phone2Copy, setPhone2Copy] = useState<AuthHeroPhoneCopyMap>({})

  useEffect(() => {
    if (!enabled) return

    let probeAbort: AbortController | null = null

    const applyPhone1 = (urls: string[]) => {
      if (urls.length === 0) return
      setPhone1Urls(urls)
      writeUrlsCache(PHONE1_CACHE_KEY, urls)
    }

    const applyPhone2 = (urls: string[]) => {
      setPhone2Urls(urls)
      writeUrlsCache(PHONE2_CACHE_KEY, urls)
    }

    const probeUploads = (urls: string[], onReachable: (reachable: string[]) => void) => {
      if (!urls.some((u) => u.startsWith('/uploads/'))) return
      probeAbort?.abort()
      probeAbort = new AbortController()
      const signal = probeAbort.signal
      void filterReachableHeroUrls(urls, signal).then((reachable) => {
        if (signal.aborted || reachable.length === 0) return
        onReachable(reachable)
      })
    }

    const applySettings = (data: Record<string, unknown>) => {
      const urls = parseAuthHeroVideoUrlsFromApi(data)
      const urls2 = parseAuthHeroPhone2VideoUrlsFromApi(data)
      applyPhone1(urls)
      applyPhone2(urls2)
      setPhone1Copy(parseAuthHeroPhoneCopyFromApi(data.authHeroPhone1Copy))
      setPhone2Copy(parseAuthHeroPhoneCopyFromApi(data.authHeroPhone2Copy))
      probeUploads(urls, (reachable) => applyPhone1(reachable))
      probeUploads(urls2, (reachable) => applyPhone2(reachable))
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
      const detail = (ev as CustomEvent<AuthHeroPhonesUpdatedDetail>).detail
      const fromEvent = parseAuthHeroVideoUrlsFromApi({
        authHeroVideoUrls: detail?.urls,
        authHeroVideoUrl: detail?.url,
      })
      if (fromEvent.length > 0) applyPhone1(fromEvent)
      if (detail?.phone2Urls) applyPhone2(detail.phone2Urls)
      if (detail?.phone1Copy) setPhone1Copy(parseAuthHeroPhoneCopyFromApi(detail.phone1Copy))
      if (detail?.phone2Copy) setPhone2Copy(parseAuthHeroPhoneCopyFromApi(detail.phone2Copy))
      if (!fromEvent.length && !detail?.phone2Urls) void fetchSettings(true)
    }

    const onSettingsUpdated = () => {
      void fetchSettings(true)
    }

    void fetchSettings()
    window.addEventListener(WATTA_AUTH_HERO_VIDEO_UPDATED_EVENT, onHeroUpdated)
    window.addEventListener('settingsUpdated', onSettingsUpdated)
    return () => {
      probeAbort?.abort()
      window.removeEventListener(WATTA_AUTH_HERO_VIDEO_UPDATED_EVENT, onHeroUpdated)
      window.removeEventListener('settingsUpdated', onSettingsUpdated)
    }
  }, [enabled])

  return { phone1Urls, phone2Urls, phone1Copy, phone2Copy }
}
