import { getLocalizedField, readLocalizedFieldSlot } from './getLocalizedField'
import type { WattaLanguage } from './language'

function isBlank(v: unknown): boolean {
  return v == null || (typeof v === 'string' && !v.trim())
}

/**
 * Назва категорії в меню: якщо в БД не заповнено переклад для поточної мови,
 * `getLocalized` підставляє іншу мову (часто російську) — для відомих slug'ів
 * замість цього беремо `t.categories` (rolls, sushi, …).
 */
export function getMenuCategoryDisplayName(
  cat: Record<string, unknown> | null | undefined,
  language: WattaLanguage,
  staticBySlug: Readonly<Record<string, string>>,
): string {
  if (!cat) return ''
  const slug = String(cat.slug ?? '')

  if (language === 'uk') {
    const s = readLocalizedFieldSlot(cat, 'name', 'ua')
    if (!isBlank(s)) return s
  }
  if (language === 'en') {
    const s = readLocalizedFieldSlot(cat, 'name', 'en')
    if (!isBlank(s)) return s
  }
  if (language === 'nl') {
    const s = readLocalizedFieldSlot(cat, 'name', 'nl')
    if (!isBlank(s)) return s
  }
  if (language === 'ru') {
    const s = readLocalizedFieldSlot(cat, 'name', 'ru')
    if (!isBlank(s)) return s
  }

  const fromUi = staticBySlug[slug]
  if (fromUi) return fromUi

  const fromApi = getLocalizedField(cat, 'name', language)
  if (fromApi) return fromApi
  return String(readLocalizedFieldSlot(cat, 'name', 'ru') || (cat.name as string | undefined) || '')
}
