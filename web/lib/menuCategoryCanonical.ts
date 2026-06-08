/**
 * Канонічні slug-и категорій для UI.
 * API/БД інколи повертає варіанти (singular/plural або інші аліаси) — це ламає
 * перехід зі стрічки категорій, бо `id="full-menu-heading-${slug}"` не знаходиться.
 */
export function canonicalMenuCategorySlug(slug: string): string {
  const s = String(slug ?? '').trim().toLowerCase()
  if (!s) return ''
  // singular -> plural
  if (s === 'roll') return 'rolls'
  if (s === 'set') return 'sets'
  if (s === 'soup') return 'soups'
  if (s === 'bowl') return 'bowls'
  if (s === 'snack') return 'snacks'
  if (s === 'drink') return 'drinks'
  if (s === 'sauce') return 'sauces'
  return s
}

