import { getApiUrl } from '@/lib/utils'
import { fetchPublicApi, fetchPublicApiFresh } from '@/lib/publicApiFetch'
import { menuItemsSessionKey } from '@/lib/i18n/menuDataCacheBust'
import { readCityIdForProductApi } from '@/lib/wattaSiteLocalePrefs'
import { productHasGalleryImages } from '@/lib/productGallery'

export function normalizeProductRouteId(raw: unknown): number | null {
  const value = Array.isArray(raw) ? raw[0] : raw
  const n = parseInt(String(value ?? '').trim(), 10)
  return Number.isFinite(n) && n > 0 ? n : null
}

function findInRawList(list: unknown[], id: number): Record<string, unknown> | null {
  for (const row of list) {
    if (!row || typeof row !== 'object') continue
    if (Number((row as { id?: unknown }).id) === id) {
      return row as Record<string, unknown>
    }
  }
  return null
}

/** Шукає сирий товар у sessionStorage (усі ключі menu_items_*). */
export function findProductInMenuSessionCaches(id: number): Record<string, unknown> | null {
  if (typeof sessionStorage === 'undefined') return null
  for (let i = 0; i < sessionStorage.length; i += 1) {
    const key = sessionStorage.key(i)
    if (!key?.startsWith('menu_items_')) continue
    try {
      const raw = sessionStorage.getItem(key)
      if (!raw) continue
      const parsed = JSON.parse(raw) as unknown
      if (!Array.isArray(parsed)) continue
      const hit = findInRawList(parsed, id)
      if (hit) return hit
    } catch {
      /* ignore corrupt cache */
    }
  }
  return null
}

async function fetchProductList(
  cityId: number | null,
  signal?: AbortSignal,
  fresh = false,
): Promise<Record<string, unknown>[]> {
  const fetchFn = fresh ? fetchPublicApiFresh : fetchPublicApi
  const urls: string[] = []
  if (cityId != null && cityId > 0) {
    urls.push(getApiUrl(`/api/products?cityId=${cityId}`))
  }
  urls.push(getApiUrl('/api/products'))

  for (const url of urls) {
    try {
      const res = await fetchFn(url, { signal })
      if (!res.ok) continue
      const data = (await res.json()) as unknown
      if (!Array.isArray(data)) continue
      return data.filter((row): row is Record<string, unknown> => Boolean(row && typeof row === 'object'))
    } catch (e) {
      if (e && typeof e === 'object' && (e as { name?: string }).name === 'AbortError') throw e
    }
  }
  return []
}

/**
 * Завантажує товар для /product/:id: прямий GET, потім кеш меню та список /api/products
 * (якщо кеш застарів або одиночний запит тимчасово впав).
 */
export async function fetchProductById(
  id: number,
  signal?: AbortSignal,
  options?: { fresh?: boolean },
): Promise<Record<string, unknown> | null> {
  const fetchFn = options?.fresh ? fetchPublicApiFresh : fetchPublicApi
  try {
    const res = await fetchFn(getApiUrl(`/api/products/${id}`), { signal })
    if (res.ok) {
      const body = (await res.json()) as unknown
      if (body && typeof body === 'object') {
        const row = body as Record<string, unknown>
        if (productHasGalleryImages(row)) return row
        const cityIdOk = typeof window !== 'undefined' ? readCityIdForProductApi() : null
        const list = await fetchProductList(cityIdOk, signal, true)
        const fromList = findInRawList(list, id)
        if (fromList && productHasGalleryImages(fromList)) {
          return { ...row, imageUrl: fromList.imageUrl, imageUrls: fromList.imageUrls }
        }
        return row
      }
    }
  } catch (e) {
    if (e && typeof e === 'object' && (e as { name?: string }).name === 'AbortError') throw e
  }

  if (!options?.fresh) {
    const fromCache = findProductInMenuSessionCaches(id)
    if (fromCache && productHasGalleryImages(fromCache)) return fromCache
  }

  const cityIdOk = typeof window !== 'undefined' ? readCityIdForProductApi() : null

  const list = await fetchProductList(cityIdOk, signal, Boolean(options?.fresh))
  const fromList = findInRawList(list, id)
  if (fromList) {
    if (typeof sessionStorage !== 'undefined' && cityIdOk != null) {
      try {
        const key = menuItemsSessionKey(cityIdOk)
        sessionStorage.setItem(key, JSON.stringify(list))
        sessionStorage.setItem(`${key}_time`, String(Date.now()))
      } catch {
        /* quota */
      }
    }
    return fromList
  }

  return null
}
