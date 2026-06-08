import { buildMenuCategoriesFromApi, parseCategoriesCacheJson } from '@/lib/buildMenuCategoriesFromApi'
import type { WattaLanguage } from '@/lib/i18n/language'
import { menuCategoriesSessionKey } from '@/lib/i18n/menuDataCacheBust'
import { filterNonAggregateMenuCategories } from '@/lib/menuCategoryFilters'
import { MENU_CATEGORY_EMOJI, MENU_CATEGORY_FALLBACK_SLUGS } from '@/lib/menuCategoryFallback'
import { persistMenuCategoriesCache } from '@/lib/menuCatalogSessionCache'

export type NavDrawerCategory = {
  key: string
  name: string
  emoji: string
  imageUrl?: string | null
  hoverImageUrl?: string | null
}

export function buildNavDrawerCategoriesFromApi(
  data: Record<string, unknown>[],
  language: WattaLanguage,
  categoryLabels: Record<string, string>,
): NavDrawerCategory[] {
  return filterNonAggregateMenuCategories(
    buildMenuCategoriesFromApi(data, language, categoryLabels),
  ).map((c) => ({
    key: c.key,
    name: c.name,
    emoji: c.emoji || '🍣',
    imageUrl: c.imageUrl,
    hoverImageUrl: c.hoverImageUrl,
  }))
}

export function readNavDrawerCategoriesFromSession(
  language: WattaLanguage,
  categoryLabels: Record<string, string>,
): NavDrawerCategory[] | null {
  if (typeof sessionStorage === 'undefined') return null
  const cached = sessionStorage.getItem(menuCategoriesSessionKey())
  if (!cached) return null
  const raw = parseCategoriesCacheJson(cached)
  if (!raw?.length) return null
  const mapped = buildNavDrawerCategoriesFromApi(raw, language, categoryLabels)
  return mapped.length > 0 ? mapped : null
}

export function fallbackNavDrawerCategories(
  categoryLabels: Record<string, string>,
): NavDrawerCategory[] {
  return MENU_CATEGORY_FALLBACK_SLUGS.map((key) => ({
    key,
    name: categoryLabels[key] ?? key,
    emoji: MENU_CATEGORY_EMOJI[key],
  }))
}

export async function fetchAndCacheNavDrawerCategories(
  language: WattaLanguage,
  categoryLabels: Record<string, string>,
): Promise<NavDrawerCategory[] | null> {
  const { fetchPublicApi } = await import('@/lib/publicApiFetch')
  const res = await fetchPublicApi('/api/products/categories')
  if (!res.ok) return null
  const data = await res.json()
  const list = Array.isArray(data) ? (data as Record<string, unknown>[]) : []
  if (list.length === 0) return null
  persistMenuCategoriesCache(list)
  return buildNavDrawerCategoriesFromApi(list, language, categoryLabels)
}
