import { readSiteSettingsCache, writeSiteSettingsCache } from '@/lib/publicRouteWarmCache'

/** Синхронно з sessionStorage warm cache — без зайвого /api/settings на кожному mount. */
export function readSiteSettingsRecord(): Record<string, unknown> | null {
  return readSiteSettingsCache()
}

export function writeSiteSettingsRecord(data: Record<string, unknown>): void {
  writeSiteSettingsCache(data)
}
