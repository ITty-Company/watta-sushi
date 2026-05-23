import { fetchPublicApi } from '@/lib/publicApiFetch'

export const CITIES_SESSION_KEY = 'cities_cache'
export const CITIES_PERSIST_KEY = 'watta_cities_cache'
export const CITIES_PERSIST_TIME_KEY = 'watta_cities_cache_time'
export const CITIES_TTL_MS = 10 * 60 * 1000

export function readCitiesCacheRaw(): unknown[] | null {
  if (typeof window === 'undefined') return null
  const now = Date.now()
  const cached =
    sessionStorage.getItem(CITIES_SESSION_KEY) || localStorage.getItem(CITIES_PERSIST_KEY)
  const cacheTimeRaw =
    sessionStorage.getItem(`${CITIES_SESSION_KEY}_time`) ||
    localStorage.getItem(CITIES_PERSIST_TIME_KEY)
  if (!cached || !cacheTimeRaw) return null
  if (now - parseInt(cacheTimeRaw, 10) >= CITIES_TTL_MS) return null
  try {
    const data = JSON.parse(cached) as unknown
    return Array.isArray(data) && data.length > 0 ? data : null
  } catch {
    return null
  }
}

export function writeCitiesCache(data: unknown[]): void {
  if (typeof window === 'undefined' || data.length === 0) return
  const t = Date.now().toString()
  const json = JSON.stringify(data)
  sessionStorage.setItem(CITIES_SESSION_KEY, json)
  sessionStorage.setItem(`${CITIES_SESSION_KEY}_time`, t)
  try {
    localStorage.setItem(CITIES_PERSIST_KEY, json)
    localStorage.setItem(CITIES_PERSIST_TIME_KEY, t)
  } catch {
    /* quota */
  }
}

let warmCitiesInflight: Promise<void> | null = null

export function warmCitiesCache(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (readCitiesCacheRaw()) return Promise.resolve()
  if (warmCitiesInflight) return warmCitiesInflight
  warmCitiesInflight = fetchPublicApi('/api/cities')
    .then(async (res) => {
      if (!res.ok) return
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) writeCitiesCache(data)
    })
    .catch(() => {})
    .finally(() => {
      warmCitiesInflight = null
    })
  return warmCitiesInflight
}
