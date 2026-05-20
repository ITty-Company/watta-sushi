import { fetchPublicApi } from '@/lib/publicApiFetch'

/**
 * Single-flight fetch + memory + localStorage cache for `/api/countries`.
 * CountryCitySelector mounts twice (header + drawer); sharing one request avoids duplicate loads.
 */

const TTL_MS = 60_000
const LS_KEY = 'watta_countries_catalog_v1'
const LS_TTL_MS = 24 * 60 * 60 * 1000
const FETCH_TIMEOUT_MS = 12_000

type Row = Record<string, unknown>

let cache: { data: Row[]; at: number } | null = null
let inFlight: Promise<Row[]> | null = null

function readPersistedCatalog(): Row[] | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { at?: number; data?: Row[] }
    if (!parsed?.at || !Array.isArray(parsed.data) || parsed.data.length === 0) return null
    if (Date.now() - parsed.at > LS_TTL_MS) return null
    return parsed.data
  } catch {
    return null
  }
}

function writePersistedCatalog(data: Row[]): void {
  if (typeof window === 'undefined' || data.length === 0) return
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({ at: Date.now(), data }))
  } catch {
    /* ignore quota */
  }
}

function hydrateMemoryFromPersisted(): Row[] | null {
  const persisted = readPersistedCatalog()
  if (!persisted?.length) return null
  cache = { data: persisted, at: Date.now() }
  return persisted
}

/** Синхронно: памʼять або localStorage — другий mount не чекає мережі. */
export function getCountriesCatalogIfCached(): Row[] | null {
  const now = Date.now()
  if (cache && now - cache.at < TTL_MS) return cache.data
  return hydrateMemoryFromPersisted()
}

/** Clear cached rows so the next read hits the network (used after admin/catalog updates). */
export function invalidateCountriesCatalogCache(): void {
  cache = null
  inFlight = null
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(LS_KEY)
    } catch {
      /* ignore */
    }
  }
}

async function fetchCountriesFromNetwork(): Promise<Row[]> {
  const ac = new AbortController()
  const tid =
    typeof window !== 'undefined'
      ? window.setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS)
      : undefined
  try {
    const res = await fetchPublicApi('/api/countries', { signal: ac.signal })
    if (!res.ok) throw new Error(String(res.status))
    const data = await res.json()
    return Array.isArray(data) ? (data as Row[]) : []
  } finally {
    if (tid !== undefined) window.clearTimeout(tid)
  }
}

/**
 * Country rows from API; concurrent callers share one request; cached briefly for instant UI.
 */
export async function getCountriesCatalog(): Promise<Row[]> {
  const now = Date.now()
  if (cache && now - cache.at < TTL_MS) {
    return cache.data
  }

  const persisted = readPersistedCatalog()
  if (persisted?.length) {
    cache = { data: persisted, at: Date.now() }
    void refreshCountriesCatalogInBackground()
    return persisted
  }

  if (!inFlight) {
    inFlight = fetchCountriesFromNetwork()
      .then((data) => {
        cache = { data, at: Date.now() }
        writePersistedCatalog(data)
        return data
      })
      .finally(() => {
        inFlight = null
      })
  }
  return inFlight
}

/** Після показу з localStorage — тихе оновлення з API. */
function refreshCountriesCatalogInBackground(): void {
  if (inFlight) return
  inFlight = fetchCountriesFromNetwork()
    .then((data) => {
      cache = { data, at: Date.now() }
      writePersistedCatalog(data)
      if (typeof window !== 'undefined' && data.length > 0) {
        window.dispatchEvent(new CustomEvent('countriesCatalogUpdated'))
      }
      return data
    })
    .catch(() => cache?.data ?? [])
    .finally(() => {
      inFlight = null
    })
}

/** Ранній prefetch (AppClient, hover на локацію) — ≤1 с до відкриття модалки. */
export function ensureCountriesCatalog(): Promise<Row[]> {
  return getCountriesCatalog()
}
