import { readMenuCategoriesFromSessionCache } from '@/lib/readMenuCategoriesCache'
import type { WattaLanguage } from '@/lib/i18n/language'
import { canonicalMenuCategorySlug } from '@/lib/menuCategoryCanonical'

export type ProductCategoryRow = {
  id?: number
  slug?: string
  name_ru?: string
  name_ua?: string
  name_en?: string
  name_nl?: string
  emoji?: string | null
  imageUrl?: string | null
  hoverImageUrl?: string | null
}

/** Доповнити category товару іконками з кешу /api/products/categories (якщо в product API їх немає). */
export function enrichProductCategoryFromCache(
  row: Record<string, unknown>,
  language: WattaLanguage,
  categoryLabels: Record<string, string>,
): Record<string, unknown> {
  const raw = row.category
  if (!raw || typeof raw !== 'object') return row
  const cat = raw as ProductCategoryRow
  const hasImage = typeof cat.imageUrl === 'string' && cat.imageUrl.trim().length > 0
  if (hasImage) return row

  const slug = canonicalMenuCategorySlug(String(cat.slug ?? ''))
  if (!slug) return row

  const catalog = readMenuCategoriesFromSessionCache(language, categoryLabels)
  const hit = catalog?.find((c) => c.key === slug || canonicalMenuCategorySlug(c.slug ?? '') === slug)
  if (!hit) return row

  return {
    ...row,
    category: {
      ...cat,
      emoji: cat.emoji ?? hit.emoji,
      imageUrl: hit.imageUrl ?? cat.imageUrl ?? null,
      hoverImageUrl: hit.hoverImageUrl ?? cat.hoverImageUrl ?? null,
    },
  }
}
