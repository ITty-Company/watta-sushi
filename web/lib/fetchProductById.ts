import { getApiUrl } from '@/lib/utils'
import { fetchPublicApi, fetchPublicApiFresh } from '@/lib/publicApiFetch'
import { menuItemsSessionKey } from '@/lib/i18n/menuDataCacheBust'
import { readCityIdForProductApi } from '@/lib/wattaSiteLocalePrefs'
import { productGalleryFromApi, productHasGalleryImages } from '@/lib/productGallery'
import {
  attachIngredientsFromCatalog,
  ensureIngredientsCatalog,
  enrichProductRow,
  parseIngredientIds,
} from '@/lib/wattaIngredientsCatalog'
import { resolveCatalogMediaUrl } from '@/lib/catalogMediaUrl'
import { preloadImageUrls } from '@/lib/preloadImages'

export const WATTA_PRODUCT_DETAIL_CACHED_EVENT = 'watta:product-detail-cached' as const

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

function hasIngredients(row: Record<string, unknown>): boolean {
  const ing = row.ingredients
  return Array.isArray(ing) && ing.length > 0
}

function hasIngredientIds(row: Record<string, unknown>): boolean {
  return parseIngredientIds(row).length > 0
}

function enrichAndStoreDetail(row: Record<string, unknown>): Record<string, unknown> {
  const enriched = enrichProductRow(row) ?? row
  if (hasIngredients(enriched)) writeProductDetailCache(enriched)
  return enriched
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
const PRODUCT_DETAIL_PREFIX = 'watta_product_detail_'

const memoryDetailCache = new Map<number, Record<string, unknown>>()
const prefetchingIds = new Set<number>()
const warmupInflight = new Map<number, Promise<Record<string, unknown> | null>>()

function isAbortError(e: unknown): boolean {
  return Boolean(e && typeof e === 'object' && (e as { name?: string }).name === 'AbortError')
}

function dispatchDetailCached(id: number): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent(WATTA_PRODUCT_DETAIL_CACHED_EVENT, { detail: { id } }),
  )
}

/** Скидає кеш сторінки товару після змін у адмінці — щоб не лишались старі фото/текст. */
export function purgeProductClientCaches(): void {
  memoryDetailCache.clear()
  warmupInflight.clear()
  prefetchingIds.clear()
  if (typeof sessionStorage === 'undefined') return
  for (let i = sessionStorage.length - 1; i >= 0; i -= 1) {
    const key = sessionStorage.key(i)
    if (
      key?.startsWith(PRODUCT_DETAIL_PREFIX) ||
      key?.startsWith(PRODUCT_PRIME_PREFIX)
    ) {
      sessionStorage.removeItem(key)
    }
  }
}

/** Повний товар з API (інгредієнти, категорія, галерея) — памʼять + sessionStorage. */
export function writeProductDetailCache(row: Record<string, unknown>): void {
  const id = Number(row.id)
  if (!Number.isFinite(id) || id <= 0) return
  memoryDetailCache.set(id, row)
  if (typeof sessionStorage === 'undefined') return
  try {
    sessionStorage.setItem(`${PRODUCT_DETAIL_PREFIX}${id}`, JSON.stringify(row))
  } catch {
    /* quota */
  }
}

function readProductDetailCache(id: number): Record<string, unknown> | null {
  const mem = memoryDetailCache.get(id)
  if (mem && isProductRow(mem)) return mem
  if (typeof sessionStorage === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(`${PRODUCT_DETAIL_PREFIX}${id}`)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    if (!isProductRow(parsed)) return null
    const row = parsed as Record<string, unknown>
    memoryDetailCache.set(id, row)
    return row
  } catch {
    return null
  }
}

/** Зберегти з картки меню перед переходом — не перезаписує повний detail-кеш. */
export function primeProductPageCache(product: {
  id: number
  name: string
  description?: string
  price: number
  imageUrl?: string
  promoDiscountPercent?: number
}): void {
  const id = product.id
  const existingDetail = readProductDetailCache(id)
  if (existingDetail && hasIngredients(existingDetail)) return

  const fromMenu = findProductInMenuSessionCaches(id)
  const desc = product.description ?? ''
  const img = product.imageUrl?.trim() ?? ''
  const gallery = productGalleryFromApi(
    fromMenu ?? { imageUrl: img, imageUrls: img ? [img] : [] },
  )
  const snapshot: Record<string, unknown> = {
    ...(fromMenu ?? {}),
    id,
    name_ru: product.name,
    name_ua: product.name,
    name_en: product.name,
    name_nl: product.name,
    description_ru: desc,
    description_ua: desc,
    description_en: desc,
    description_nl: desc,
    price: product.price,
    imageUrl: gallery[0] ?? img,
    imageUrls: gallery.length > 0 ? gallery : img ? [img] : [],
    promoDiscountPercent: product.promoDiscountPercent ?? 0,
    categoryId:
      Number(fromMenu?.categoryId) ||
      Number((fromMenu?.category as { id?: unknown } | undefined)?.id) ||
      0,
    category: fromMenu?.category,
    ingredients: existingDetail?.ingredients ?? fromMenu?.ingredients,
    ingredientIds:
      parseIngredientIds(fromMenu ?? {}) ||
      parseIngredientIds(existingDetail ?? {}) ||
      [],
  }

  const merged = enrichProductRow({ ...existingDetail, ...snapshot } as Record<string, unknown>) ?? snapshot

  if (existingDetail) {
    writeProductDetailCache(merged as Record<string, unknown>)
    return
  }

  if (typeof sessionStorage === 'undefined') return
  try {
    sessionStorage.setItem(`${PRODUCT_PRIME_PREFIX}${id}`, JSON.stringify(merged))
  } catch {
    /* quota */
  }
  memoryDetailCache.set(id, merged as Record<string, unknown>)
  const cover = resolveCatalogMediaUrl(String(merged.imageUrl ?? gallery[0] ?? ''))
  if (cover) preloadImageUrls([cover], { limit: 4, highPriorityCount: 2 })
  preloadImageUrls(
    gallery.map((u) => resolveCatalogMediaUrl(u) ?? u),
    { limit: 6, highPriorityCount: 2 },
  )
}

async function fetchAndStoreProductDetail(
  id: number,
  signal?: AbortSignal,
  fresh = false,
): Promise<Record<string, unknown> | null> {
  const fetchFn = fresh ? fetchPublicApiFresh : fetchPublicApi
  try {
    const res = await fetchFn(getApiUrl(`/api/products/${id}`), { signal })
    if (!res.ok) return null
    const body = (await res.json()) as unknown
    if (!isProductRow(body)) return null
    let row = body as Record<string, unknown>
    if (!productHasGalleryImages(row)) {
      const cityIdOk = typeof window !== 'undefined' ? readCityIdForProductApi() : null
      const list = await fetchProductList(cityIdOk, signal, fresh)
      row = mergeProductImages(row, findInRawList(list, id))
    }
    const enriched = enrichAndStoreDetail(row)
    dispatchDetailCached(id)
    return enriched
  } catch (e) {
    if (isAbortError(e)) throw e
    return null
  }
}

/** Прогрів повного товара (склад, галерея) — hover / touch / перед відкриттям. */
export function warmupProductDetail(id: number, opts?: { fresh?: boolean }): Promise<Record<string, unknown> | null> {
  if (typeof window === 'undefined' || !Number.isFinite(id) || id <= 0) {
    return Promise.resolve(null)
  }
  const cached = readProductDetailCache(id)
  if (cached && hasIngredients(cached) && !opts?.fresh) {
    return Promise.resolve(cached)
  }
  const inflight = warmupInflight.get(id)
  if (inflight) return inflight

  const ac = new AbortController()
  const p = fetchAndStoreProductDetail(id, ac.signal, Boolean(opts?.fresh)).finally(() => {
    warmupInflight.delete(id)
    prefetchingIds.delete(id)
  })
  warmupInflight.set(id, p)
  return p
}

/** Прогрів GET /api/products/:id при наведенні на картку. */
export function prefetchProductById(id: number): void {
  if (typeof window === 'undefined' || !Number.isFinite(id) || id <= 0) return
  if (prefetchingIds.has(id)) return
  const cached = readProductDetailCache(id)
  if (cached && hasIngredients(cached)) return
  prefetchingIds.add(id)
  void warmupProductDetail(id)
}

function pickMenuRowName(row: Record<string, unknown>): string {
  for (const key of ['name_ua', 'name_en', 'name_ru', 'name_nl', 'name']) {
    const v = row[key]
    if (typeof v === 'string' && v.trim()) return v.trim()
  }
  return ''
}

function pickMenuRowDescription(row: Record<string, unknown>): string {
  for (const key of ['description_ua', 'description_en', 'description_ru', 'description_nl', 'description']) {
    const v = row[key]
    if (typeof v === 'string') return v
  }
  return ''
}

/** RSC + API + snapshot з кешу меню — до кліку по /product/:id. */
export function warmProductRouteData(id: number): void {
  if (typeof window === 'undefined' || !Number.isFinite(id) || id <= 0) return
  prefetchProductById(id)
  const cached = readProductDetailCache(id)
  if (cached && hasIngredients(cached)) return
  const fromMenu = findProductInMenuSessionCaches(id)
  if (!fromMenu) return
  const name = pickMenuRowName(fromMenu)
  if (!name) return
  primeProductPageCache({
    id,
    name,
    description: pickMenuRowDescription(fromMenu),
    price: Number(fromMenu.price) || 0,
    imageUrl: typeof fromMenu.imageUrl === 'string' ? fromMenu.imageUrl : undefined,
    promoDiscountPercent: Number(fromMenu.promoDiscountPercent) || 0,
  })
}

export function parseProductIdFromHref(href: string): number | null {
  const m = href.match(/^\/product\/(\d+)(?:\/|$|\?)/)
  if (!m) return null
  const id = parseInt(m[1]!, 10)
  return Number.isFinite(id) && id > 0 ? id : null
}

/** Slug категорії з кешу товару — для підсвітки стрічки категорій без зайвого fetch. */
export function readProductCategorySlugFromCache(id: number): string | null {
  const row = readProductFromClientCache(id)
  const slug = (row?.category as { slug?: string } | undefined)?.slug
  return typeof slug === 'string' && slug.trim() ? slug.trim() : null
}

/** Кеш меню, detail з API або snapshot з картки — синхронно. */
export function readProductFromClientCache(id: number): Record<string, unknown> | null {
  const detail = readProductDetailCache(id)
  if (detail) return enrichProductRow(detail) ?? detail

  if (typeof sessionStorage === 'undefined') {
    const fromMenu = findProductInMenuSessionCaches(id)
    return fromMenu ? enrichProductRow(fromMenu) : null
  }

  try {
    const prime = sessionStorage.getItem(`${PRODUCT_PRIME_PREFIX}${id}`)
    if (prime) {
      const parsed = JSON.parse(prime) as unknown
      if (isProductRow(parsed)) {
        const row = parsed as Record<string, unknown>
        return enrichProductRow(row) ?? row
      }
    }
  } catch {
    /* ignore */
  }
  const fromMenu = findProductInMenuSessionCaches(id)
  return fromMenu ? enrichProductRow(fromMenu) : null
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
      if (isAbortError(e)) throw e
    }
  }
  return []
}

/**
 * Завантажує товар для /product/:id: detail-кеш → GET /api/products/:id → кеш меню.
 */
export async function fetchProductById(
  id: number,
  signal?: AbortSignal,
  options?: { fresh?: boolean },
): Promise<Record<string, unknown> | null> {
  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError')
  }

  void ensureIngredientsCatalog()

  if (!options?.fresh) {
    const cached = readProductDetailCache(id)
    if (cached) {
      const enriched = enrichProductRow(cached) ?? cached
      if (enriched !== cached && hasIngredients(enriched)) writeProductDetailCache(enriched)
      if (hasIngredients(enriched) || productHasGalleryImages(enriched)) return enriched
      const withIng = attachIngredientsFromCatalog(enriched)
      if (withIng && hasIngredients(withIng)) {
        writeProductDetailCache(withIng)
        return withIng
      }
    }
  }

  try {
    const fromNetwork = await warmupProductDetail(id, { fresh: Boolean(options?.fresh) })
    if (fromNetwork) return fromNetwork
  } catch (e) {
    if (isAbortError(e)) throw e
  }

  const fromCache = readProductFromClientCache(id)
  if (fromCache && isProductRow(fromCache)) {
    return enrichProductRow(fromCache) ?? fromCache
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
