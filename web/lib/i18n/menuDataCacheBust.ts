/** Підняти версію, коли змінилися дані API/локалізація — client sessionStorage знову тягне меню. */
export const MENU_CLIENT_CACHE_BUMP = 'i18n7' as const

const CATALOG_REV_KEY = 'watta_catalog_rev'

/** Збільшує ревізію кешу після змін у адмінці — нові ключі sessionStorage, старі ігноруються. */
export function bumpMenuCatalogCacheRev(): string {
  const next = String(Date.now())
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(CATALOG_REV_KEY, next)
    } catch {
      /* quota */
    }
  }
  return next
}

export function getMenuCatalogCacheRev(): string {
  if (typeof localStorage === 'undefined') return '0'
  try {
    return localStorage.getItem(CATALOG_REV_KEY) || '0'
  } catch {
    return '0'
  }
}

const SESSION_PREFIXES = [
  'menu_items_',
  'menu_categories_',
  'banners',
  'watta_banners',
  'cities_cache',
  'watta_cities',
  'watta_public_blog',
  'watta_public_promo',
  'home_hero_urls',
] as const

const LOCAL_PREFIXES = ['menu_items_', 'menu_categories_', 'watta_banners', 'watta_cities'] as const

function purgeStorageByPrefixes(store: Storage, prefixes: readonly string[]): void {
  for (let i = store.length - 1; i >= 0; i -= 1) {
    const k = store.key(i)
    if (!k) continue
    if (prefixes.some((p) => k.startsWith(p) || k.includes(p))) {
      store.removeItem(k)
    }
  }
}

/** Скидає клієнтські кеші меню/банерів/налаштувань після збереження в адмінці. */
export function purgeWattaClientCatalogCaches(): void {
  bumpMenuCatalogCacheRev()
  if (typeof sessionStorage !== 'undefined') {
    purgeStorageByPrefixes(sessionStorage, SESSION_PREFIXES)
    sessionStorage.removeItem('banners')
    sessionStorage.removeItem('banners_time')
  }
  if (typeof localStorage !== 'undefined') {
    purgeStorageByPrefixes(localStorage, LOCAL_PREFIXES)
    localStorage.removeItem('watta_banners_v1')
  }
}

/**
 * Сирі товари з /api/products (усі name_*) — один ключ на місто, без мови UI,
 * щоб при перемиканні мови миттєво перелічити `getLocalized` без додаткового fetch.
 */
export function menuItemsSessionKey(cityId: string | null | number): string {
  return `menu_items_${MENU_CLIENT_CACHE_BUMP}_${getMenuCatalogCacheRev()}_${cityId ?? '0'}`
}

/** Сирі категорії з /api/products/categories (усі name_*), локалізуємо при відображенні. */
export function menuCategoriesSessionKey(): string {
  return `menu_categories_raw_${MENU_CLIENT_CACHE_BUMP}_${getMenuCatalogCacheRev()}`
}
