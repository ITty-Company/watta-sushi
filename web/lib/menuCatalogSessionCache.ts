import { getApiUrl } from '@/lib/utils'
import { fetchPublicApi } from '@/lib/publicApiFetch'
import { menuCategoriesSessionKey, menuItemsSessionKey } from '@/lib/i18n/menuDataCacheBust'
import { readCityIdForProductApi } from '@/lib/wattaSiteLocalePrefs'

export function coerceProductsArray(body: unknown): unknown[] {
  if (Array.isArray(body)) return body
  if (body && typeof body === 'object') {
    const o = body as Record<string, unknown>
    const nested = o.products ?? o.data
    if (Array.isArray(nested)) return nested
  }
  return []
}

export function readRawMenuProductsFromSession(cityId?: number | null): unknown[] | null {
  if (typeof sessionStorage === 'undefined') return null
  const id = cityId ?? readCityIdForProductApi()
  const key = menuItemsSessionKey(id)
  try {
    const cached = sessionStorage.getItem(key)
    if (!cached) return null
    const data = JSON.parse(cached) as unknown
    return Array.isArray(data) && data.length > 0 ? data : null
  } catch {
    return null
  }
}

export function readRawMenuCategoriesFromSession(): Record<string, unknown>[] | null {
  if (typeof sessionStorage === 'undefined') return null
  const key = menuCategoriesSessionKey()
  try {
    const cached = sessionStorage.getItem(key)
    if (!cached) return null
    const data = JSON.parse(cached) as unknown
    return Array.isArray(data) && data.length > 0 ? (data as Record<string, unknown>[]) : null
  } catch {
    return null
  }
}

export function hasMenuProductsSessionCache(cityId?: number | null): boolean {
  return readRawMenuProductsFromSession(cityId) != null
}

function writeProductsCache(cityId: number | null, list: unknown[]): void {
  if (typeof sessionStorage === 'undefined' || list.length === 0) return
  const key = menuItemsSessionKey(cityId)
  sessionStorage.setItem(key, JSON.stringify(list))
  sessionStorage.setItem(`${key}_time`, String(Date.now()))
}

function writeCategoriesCache(list: Record<string, unknown>[]): void {
  if (typeof sessionStorage === 'undefined' || list.length === 0) return
  const key = menuCategoriesSessionKey()
  sessionStorage.setItem(key, JSON.stringify(list))
  sessionStorage.setItem(`${key}_time`, String(Date.now()))
}

const MENU_WARM_TTL_MS = 5 * 60 * 1000
let warmMenuCatalogInflight: Promise<void> | null = null

function isMenuCatalogWarmFresh(cityId: number | null): boolean {
  if (typeof sessionStorage === 'undefined') return false
  const productsKey = menuItemsSessionKey(cityId)
  const productsTime = sessionStorage.getItem(`${productsKey}_time`)
  const categoriesTime = sessionStorage.getItem(`${menuCategoriesSessionKey()}_time`)
  if (!productsTime || !categoriesTime) return false
  const now = Date.now()
  const productsFresh = now - Number.parseInt(productsTime, 10) < MENU_WARM_TTL_MS
  const categoriesFresh = now - Number.parseInt(categoriesTime, 10) < MENU_WARM_TTL_MS
  return productsFresh && categoriesFresh && hasMenuProductsSessionCache(cityId)
}

async function warmMenuCatalogCacheInner(cityId: number | null): Promise<void> {
  const hasCity = cityId != null && cityId > 0
  const productsUrl = hasCity ? getApiUrl(`/api/products?cityId=${cityId}`) : getApiUrl('/api/products')

  const [prodRes, catRes] = await Promise.all([
    fetchPublicApi(productsUrl),
    fetchPublicApi(getApiUrl('/api/products/categories')),
  ])

  if (catRes.ok) {
    const cats = await catRes.json()
    if (Array.isArray(cats) && cats.length > 0) {
      writeCategoriesCache(cats as Record<string, unknown>[])
    }
  }

  if (prodRes.ok) {
    let list = coerceProductsArray(await prodRes.json())
    if (hasCity && list.length === 0) {
      const fallback = await fetchPublicApi(getApiUrl('/api/products'))
      if (fallback.ok) list = coerceProductsArray(await fallback.json())
    }
    if (list.length > 0) writeProductsCache(cityId, list)
  }
}

/** Прогрів кешу меню до переходу на /menu — товари + категорії в sessionStorage. */
export async function warmMenuCatalogCache(cityId?: number | null): Promise<void> {
  if (typeof window === 'undefined') return
  const id = cityId ?? readCityIdForProductApi()
  if (isMenuCatalogWarmFresh(id)) return
  if (warmMenuCatalogInflight) {
    await warmMenuCatalogInflight
    return
  }
  warmMenuCatalogInflight = warmMenuCatalogCacheInner(id)
    .catch(() => {
      /* ignore — сторінка сама дотягне */
    })
    .finally(() => {
      warmMenuCatalogInflight = null
    })
  await warmMenuCatalogInflight
}
