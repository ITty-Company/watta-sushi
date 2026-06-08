import { refreshCartProductMediaFromCatalog } from '@/lib/cartStorage'
import { purgeProductClientCaches } from '@/lib/fetchProductById'
import { purgeWattaClientCatalogCaches } from '@/lib/i18n/menuDataCacheBust'
import { applyCatalogProductRows } from '@/lib/wattaCatalogSnapshot'
import { WATTA_BLOG_UPDATED_EVENT } from '@/lib/wattaPublicBlogNav'
import { WATTA_PROMOTIONS_UPDATED_EVENT } from '@/lib/wattaPublicPromotionsNav'

/** Усі відкриті вкладки: слухайте цю подію або вузькі (productsUpdated тощо). */
export const WATTA_CATALOG_REFRESH_EVENT = 'watta:catalog-refresh' as const

export const WATTA_CATALOG_PING_KEY = 'watta_catalog_ping' as const

export type CatalogRefreshScope =
  | 'products'
  | 'banners'
  | 'categories'
  | 'promotions'
  | 'blog'
  | 'settings'
  | 'cartUpsell'
  | 'team'
  | 'countries'
  | 'all'

export type CatalogRefreshDetail = {
  scope: CatalogRefreshScope
  at: number
  /** Свіжі рядки з адмінки — миттєво в меню, кошик, /product без очікування fetch. */
  productRows?: Record<string, unknown>[]
}

function dispatchScopeEvent(scope: CatalogRefreshScope): void {
  if (typeof window === 'undefined') return
  const fire = (name: string) => window.dispatchEvent(new CustomEvent(name))

  switch (scope) {
    case 'products':
      fire('productsUpdated')
      break
    case 'banners':
      fire('bannersUpdated')
      break
    case 'categories':
      fire('categoriesUpdated')
      break
    case 'promotions':
      fire(WATTA_PROMOTIONS_UPDATED_EVENT)
      break
    case 'blog':
      fire(WATTA_BLOG_UPDATED_EVENT)
      break
    case 'settings':
      fire('settingsUpdated')
      break
    case 'cartUpsell':
      fire('cartUpsellUpdated')
      break
    case 'team':
      fire('teamUpdated')
      break
    case 'countries':
      fire('countriesCatalogUpdated')
      break
    case 'all':
      fire('productsUpdated')
      fire('bannersUpdated')
      fire('categoriesUpdated')
      fire(WATTA_PROMOTIONS_UPDATED_EVENT)
      fire(WATTA_BLOG_UPDATED_EVENT)
      fire('settingsUpdated')
      fire('cartUpsellUpdated')
      fire('teamUpdated')
      fire('countriesCatalogUpdated')
      break
    default:
      break
  }

}

/**
 * Після збереження в адмінці: скидає клієнтський кеш і сповіщає всі відкриті сторінки.
 * Інші вкладки отримують оновлення через localStorage ping.
 */
export type BroadcastWattaCatalogOptions = {
  productRows?: Record<string, unknown>[]
}

export function broadcastWattaCatalogUpdate(
  scope: CatalogRefreshScope = 'all',
  options?: BroadcastWattaCatalogOptions,
): void {
  if (typeof window === 'undefined') return
  const at = Date.now()
  const productRows = options?.productRows?.filter(
    (row): row is Record<string, unknown> => Boolean(row && typeof row === 'object'),
  )
  purgeWattaClientCatalogCaches()
  purgeProductClientCaches()
  if (productRows?.length) {
    applyCatalogProductRows(productRows, { replaceMenuCache: false })
  }
  dispatchScopeEvent(scope)
  const detail: CatalogRefreshDetail = { scope, at, productRows }
  window.dispatchEvent(new CustomEvent(WATTA_CATALOG_REFRESH_EVENT, { detail }))
  if (scope === 'products' || scope === 'all') {
    void refreshCartProductMediaFromCatalog()
  }
  try {
    localStorage.setItem(WATTA_CATALOG_PING_KEY, String(at))
  } catch {
    /* ignore */
  }
}

/** Слухач для синхронізації між вкладками (storage event). */
export function subscribeWattaCatalogCrossTab(onRefresh: (detail: CatalogRefreshDetail) => void): () => void {
  if (typeof window === 'undefined') return () => {}

  const onStorage = (e: StorageEvent) => {
    if (e.key !== WATTA_CATALOG_PING_KEY || !e.newValue) return
    purgeWattaClientCatalogCaches()
    purgeProductClientCaches()
    const detail: CatalogRefreshDetail = { scope: 'all', at: Number(e.newValue) || Date.now() }
    void refreshCartProductMediaFromCatalog()
    onRefresh(detail)
    window.dispatchEvent(new CustomEvent(WATTA_CATALOG_REFRESH_EVENT, { detail }))
    dispatchScopeEvent('all')
  }

  window.addEventListener('storage', onStorage)
  return () => window.removeEventListener('storage', onStorage)
}

const SCOPE_EVENT_MAP: Record<CatalogRefreshScope, string[]> = {
  products: ['productsUpdated', WATTA_CATALOG_REFRESH_EVENT],
  banners: ['bannersUpdated', WATTA_CATALOG_REFRESH_EVENT],
  categories: ['categoriesUpdated', WATTA_CATALOG_REFRESH_EVENT],
  promotions: [WATTA_PROMOTIONS_UPDATED_EVENT, WATTA_CATALOG_REFRESH_EVENT],
  blog: [WATTA_BLOG_UPDATED_EVENT, WATTA_CATALOG_REFRESH_EVENT],
  settings: ['settingsUpdated', WATTA_CATALOG_REFRESH_EVENT],
  cartUpsell: ['cartUpsellUpdated', WATTA_CATALOG_REFRESH_EVENT],
  team: ['teamUpdated', WATTA_CATALOG_REFRESH_EVENT],
  countries: ['countriesCatalogUpdated', WATTA_CATALOG_REFRESH_EVENT],
  all: [WATTA_CATALOG_REFRESH_EVENT, 'productsUpdated', 'bannersUpdated', 'categoriesUpdated'],
}

export function catalogSyncEventNames(
  scope: CatalogRefreshScope | CatalogRefreshScope[] = 'all',
): string[] {
  if (Array.isArray(scope)) {
    const set = new Set<string>()
    for (const s of scope) {
      for (const n of SCOPE_EVENT_MAP[s]) set.add(n)
    }
    return Array.from(set)
  }
  if (scope === 'all') {
    return [
      WATTA_CATALOG_REFRESH_EVENT,
      'productsUpdated',
      'bannersUpdated',
      'categoriesUpdated',
      WATTA_PROMOTIONS_UPDATED_EVENT,
      WATTA_BLOG_UPDATED_EVENT,
      'settingsUpdated',
      'cartUpsellUpdated',
    ]
  }
  return SCOPE_EVENT_MAP[scope]
}
