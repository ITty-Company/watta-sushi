import { normalizeSameOriginMediaPath } from '@/lib/resolveUploadMediaUrl'

const SESSION_KEY = 'watta_hero_probe_v1'
const mem = new Map<string, boolean>()

function probeCacheKey(url: string): string {
  const path = normalizeSameOriginMediaPath(url.trim())
  return path.split('#')[0]?.split('?')[0] ?? path
}

function readSessionMap(): Record<string, boolean> {
  if (typeof sessionStorage === 'undefined') return {}
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    const out: Record<string, boolean> = {}
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof k === 'string' && typeof v === 'boolean') out[k] = v
    }
    return out
  } catch {
    return {}
  }
}

function writeSessionMap(map: Record<string, boolean>): void {
  if (typeof sessionStorage === 'undefined') return
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(map))
  } catch {
    /* ignore */
  }
}

/** undefined = ще не перевіряли в цій вкладці / сесії. */
export function getCachedHeroVideoReachability(url: string): boolean | undefined {
  const key = probeCacheKey(url)
  if (mem.has(key)) return mem.get(key)
  const fromSession = readSessionMap()[key]
  if (typeof fromSession === 'boolean') {
    mem.set(key, fromSession)
    return fromSession
  }
  return undefined
}

export function setCachedHeroVideoReachability(url: string, ok: boolean): void {
  const key = probeCacheKey(url)
  mem.set(key, ok)
  const map = readSessionMap()
  map[key] = ok
  writeSessionMap(map)
}
