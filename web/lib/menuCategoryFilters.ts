/**
 * Категорії-агрегатори («Усе / Все / All») — таб «Усі» є лише на /menu (псевдо __all__),
 * slug-и з БД з цього списку не показуємо в горизонтальній стрічці на головній.
 */
const AGGREGATE_SLUGS = new Set([
  'all',
  '__all__',
  'everything',
  'vse',
  'vsyo',
  'vsio',
  'усе',
  'все',
])

export function isAggregateMenuCategorySlug(slug: string | null | undefined): boolean {
  const s = String(slug ?? '')
    .trim()
    .toLowerCase()
  if (!s) return false
  return AGGREGATE_SLUGS.has(s)
}

export function filterNonAggregateMenuCategories<T extends { key: string }>(categories: T[]): T[] {
  const next = categories.filter((c) => !isAggregateMenuCategorySlug(c.key))
  return next.length > 0 ? next : categories
}

export function filterNonAggregateCategoryRows<T extends { slug: string }>(rows: T[]): T[] {
  const next = rows.filter((c) => !isAggregateMenuCategorySlug(c.slug))
  return next.length > 0 ? next : rows
}
