import type { WattaLanguage } from './i18n/language'
import { getMenuCategoryDisplayName } from './i18n/getMenuCategoryDisplayName'

/** Сирі рядки з /api/products/categories (поля name_* з Prisma). Старий кеш: лише `name` без name_ru. */
function isRawCategoriesJson(data: unknown): data is Record<string, unknown>[] {
  if (!Array.isArray(data) || data.length === 0) return false
  const a = data[0] as Record<string, unknown>
  if (typeof a?.slug !== 'string') return false
  if ('name' in a && typeof a.name === 'string' && !('name_ru' in a) && !('name_ua' in a)) return false
  return true
}

/** Кеш сесії: лише сирі категорії; локалізуємо при читанні. */
export function parseCategoriesCacheJson(cached: string): Record<string, unknown>[] | null {
  try {
    const data = JSON.parse(cached) as unknown
    if (isRawCategoriesJson(data)) return data
  } catch {
    /* ignore */
  }
  return null
}

export function buildMenuCategoriesFromApi(
  data: Record<string, unknown>[],
  language: WattaLanguage,
  categoryLabels: Record<string, string>,
) {
  return data
    .filter((cat) => cat.isActive !== false)
    .map((cat) => {
      const slugRaw = String(cat.slug ?? '')
        .trim()
        .toLowerCase()
      return {
        id: String(cat.id),
        key: slugRaw.length > 0 ? slugRaw : `id-${String(cat.id)}`,
        slug: slugRaw.length > 0 ? slugRaw : `id-${String(cat.id)}`,
        name: getMenuCategoryDisplayName(cat, language, categoryLabels),
        emoji: (cat.emoji as string) || '🍣',
        subcategories: [],
      }
    })
    .sort((a, b) => {
      const catA = data.find((c) => String(c.slug ?? '').trim().toLowerCase() === a.key)
      const catB = data.find((c) => String(c.slug ?? '').trim().toLowerCase() === b.key)
      return (Number((catA as { order?: number })?.order) || 0) - (Number((catB as { order?: number })?.order) || 0)
    })
}
