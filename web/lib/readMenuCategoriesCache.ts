import { buildMenuCategoriesFromApi, parseCategoriesCacheJson } from '@/lib/buildMenuCategoriesFromApi'
import type { WattaLanguage } from '@/lib/i18n/language'
import { menuCategoriesSessionKey } from '@/lib/i18n/menuDataCacheBust'
import { filterNonAggregateMenuCategories } from '@/lib/menuCategoryFilters'

const CACHE_TTL_MS = 5 * 60 * 1000

export type CachedMenuCategory = {
  id: string
  key: string
  slug?: string
  name: string
  emoji: string
  subcategories: { id: string; name: string; items: unknown[] }[]
}

/** Синхронно з sessionStorage — панель категорій одразу, без «порожнього» кадру. */
export function readMenuCategoriesFromSessionCache(
  language: WattaLanguage,
  categoryLabels: Record<string, string>,
): CachedMenuCategory[] | null {
  if (typeof sessionStorage === 'undefined') return null
  const cacheKey = menuCategoriesSessionKey()
  const cached = sessionStorage.getItem(cacheKey)
  const cacheTime = sessionStorage.getItem(`${cacheKey}_time`)
  if (!cached || !cacheTime) return null
  if (Date.now() - parseInt(cacheTime, 10) >= CACHE_TTL_MS) return null
  const raw = parseCategoriesCacheJson(cached)
  if (!raw) return null
  return filterNonAggregateMenuCategories(
    buildMenuCategoriesFromApi(raw, language, categoryLabels),
  ) as CachedMenuCategory[]
}
