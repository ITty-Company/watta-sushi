import { getApiUrl } from '@/lib/utils'
import { fetchPublicApi, fetchPublicApiFresh } from '@/lib/publicApiFetch'
import { menuItemsSessionKey } from '@/lib/i18n/menuDataCacheBust'
import { readCityIdForProductApi } from '@/lib/wattaSiteLocalePrefs'
import { productGalleryFromApi, productHasGalleryImages } from '@/lib/productGallery'

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

function isProductRow(row: unknown): row is Record<string, unknown> {
  if (!row || typeof row !== 'object') return false
  const id = Number((row as { id?: unknown }).id)
  return Number.isFinite(id) && id > 0
}

function mergeProductImages(
  base: Record<string, unknown>,
  extra: Record<string, unknown> | null,
): Record<string, unknown> {
  if (!extra) return base
  if (productHasGalleryImages(base)) return base
  if (!productHasGalleryImages(extra)) return base
  return {
    ...base,
    imageUrl: extra.imageUrl ?? base.imageUrl,
    imageUrls: extra.imageUrls ?? base.imageUrls,
  }
}

const PRODUCT_PRIME_PREFIX = 'watta_product_prime_'

/** Зберегти з картки меню перед переходом на /product/:id — миттєвий показ сторінки. */
export function primeProductPageCache(product: {
  id: number
  name: string
  description?: string
  price: number
  imageUrl?: string
  promoDiscountPercent?: number
}): void {
  if (typeof sessionStorage === 'undefined') return
  const desc = product.description ?? ''
  const img = product.imageUrl?.trim() ?? ''
  try {
    sessionStorage.setItem(
      `${PRODUCT_PRIME_PREFIX}${product.id}`,
      JSON.stringify({
        id: product.id,
        name_ru: product.name,
        name_ua: product.name,
        name_en: product.name,
        name_nl: product.name,
        description_ru: desc,
        description_ua: desc,
        description_en: desc,
        description_nl: desc,
        price: product.price,
        imageUrl: img,
        imageUrls: img ? [img] : [],
        promoDiscountPercent: product.promoDiscountPercent ?? 0,
      }),
    )
  } catch {
    /* quota */
  }
}

let prefetchingIds = new Set<number>()

/** Прогрів GET /api/products/:id при наведенні на картку. */
export function prefetchProductById(id: number): void {
  if (typeof window === 'undefined' || !Number.isFinite(id) || id <= 0) return
  if (prefetchingIds.has(id)) return
  prefetchingIds.add(id)
  void fetch(getApiUrl(`/api/products/${id}`), { cache: 'default' })
    .catch(() => {})
    .finally(() => {
      prefetchingIds.delete(id)
    })
}

/** Кеш меню або snapshot з картки — синхронно, без мережі. */
export function readProductFromClientCache(id: number): Record<string, unknown> | null {
  if (typeof sessionStorage === 'undefined') return null
  try {
    const prime = sessionStorage.getItem(`${PRODUCT_PRIME_PREFIX}${id}`)
    if (prime) {
      const parsed = JSON.parse(prime) as unknown
      if (isProductRow(parsed)) {
        return parsed
      }
    }
  } catch {
    /* ignore */
  }
  return findProductInMenuSessionCaches(id)
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
      return data.filter((row): row is Record<string, unknown> => isProductRow(row))
    } catch (e) {
      if (e && typeof e === 'object' && (e as { name?: string }).name === 'AbortError') throw e
    }
  }
  return []
}

/**
 * Завантажує товар для /product/:id: прямий GET, потім кеш меню та список /api/products.
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
      if (isProductRow(body)) {
        const row = body as Record<string, unknown>
        if (!productHasGalleryImages(row)) {
          const cityIdOk = typeof window !== 'undefined' ? readCityIdForProductApi() : null
          const list = await fetchProductList(cityIdOk, signal, true)
          return mergeProductImages(row, findInRawList(list, id))
        }
        return row
      }
    }
  } catch (e) {
    if (e && typeof e === 'object' && (e as { name?: string }).name === 'AbortError') throw e
  }

  const fromCache = readProductFromClientCache(id)
  if (fromCache && isProductRow(fromCache)) {
    return fromCache
  }

  const cityIdOk = typeof window !== 'undefined' ? readCityIdForProductApi() : null
  const list = await fetchProductList(cityIdOk, signal, Boolean(options?.fresh))
  let fromList = findInRawList(list, id)
  if (!fromList) {
    const globalList = await fetchProductList(null, signal, Boolean(options?.fresh))
    fromList = findInRawList(globalList, id)
  }
  if (fromList) {
    if (typeof sessionStorage !== 'undefined' && cityIdOk != null && list.length > 0) {
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
