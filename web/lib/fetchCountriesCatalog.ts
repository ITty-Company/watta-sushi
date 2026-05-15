/**
 * Single-flight fetch + short TTL cache for `/api/countries`.
 * CountryCitySelector mounts twice (header + drawer); sharing one request avoids duplicate loads and effect races.
 */

const TTL_MS = 60_000
const FETCH_TIMEOUT_MS = 18_000

type Row = Record<string, unknown>

let cache: { data: Row[]; at: number } | null = null
let inFlight: Promise<Row[]> | null = null

/** Синхронно: якщо кеш свіжий — другий mount (шапка + drawer) не чекає мережі. */
export function getCountriesCatalogIfCached(): Row[] | null {
  const now = Date.now()
  if (cache && now - cache.at < TTL_MS) return cache.data
  return null
}

/** Clear cached rows so the next read hits the network (used after admin/catalog updates). */
export function invalidateCountriesCatalogCache(): void {
  cache = null
}

async function fetchCountriesFromNetwork(): Promise<Row[]> {
  const ac = new AbortController()
  const tid =
    typeof window !== 'undefined'
      ? window.setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS)
      : undefined
  try {
    const res = await fetch('/api/countries', { cache: 'no-store', signal: ac.signal })
    if (!res.ok) throw new Error(String(res.status))
    const data = await res.json()
    return Array.isArray(data) ? (data as Row[]) : []
  } finally {
    if (tid !== undefined) window.clearTimeout(tid)
  }
}

/**
 * Country rows from API; concurrent callers share one request; cached briefly for instant second mount.
 */
export async function getCountriesCatalog(): Promise<Row[]> {
  const now = Date.now()
  if (cache && now - cache.at < TTL_MS) {
    return cache.data
  }
  if (!inFlight) {
    inFlight = fetchCountriesFromNetwork()
      .then((data) => {
        cache = { data, at: Date.now() }
        return data
      })
      .finally(() => {
        inFlight = null
      })
  }
  return inFlight
}
