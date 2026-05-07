import type { WattaLanguage } from './language'

/**
 * Порядок полів `name_*` / `description_*` для кожної мови UI.
 * Для всіх локалей, крім `ru`, мову `ru` ставимо в кінці — інакше при порожньому
 * `name_en` / `name_nl` миттєво показувалась російська, навіть якщо є en/ua/nl.
 */
const FIELD_ORDER: Record<WattaLanguage, string[]> = {
  uk: ['ua', 'en', 'nl', 'ru'],
  en: ['en', 'nl', 'ua', 'ru'],
  ru: ['ru', 'en', 'ua', 'nl'],
  nl: ['nl', 'en', 'ua', 'ru'],
}

export type LocalizedFieldSuffix = 'ua' | 'en' | 'nl' | 'ru'

/** Prisma/JSON: `name_ru` або рідше `nameRu` — одна «ковпачка» для назв/описів. */
function pickStringField(obj: Record<string, unknown>, field: string, suf: LocalizedFieldSuffix): string {
  const snake = `${field}_${suf}`
  const camel = `${field}${suf[0]!.toUpperCase() + suf.slice(1)}`
  for (const k of [snake, camel]) {
    const v = obj[k]
    if (typeof v === 'string' && v.trim()) return v.trim()
  }
  return ''
}

/** Читати одне поле `field_ua` / `fieldUa` тощо. */
export function readLocalizedFieldSlot(
  obj: Record<string, unknown> | null | undefined,
  field: string,
  suffix: LocalizedFieldSuffix,
): string {
  if (!obj) return ''
  return pickStringField(obj, field, suffix)
}

/**
 * Текст з об'єкта API (name_ru, name_ua, description_en, …) згідно з мовою сайту.
 */
export function getLocalizedField(
  obj: Record<string, unknown> | null | undefined,
  field: string,
  language: WattaLanguage,
): string {
  if (!obj) return ''
  const order = FIELD_ORDER[language] as LocalizedFieldSuffix[]
  for (const suf of order) {
    const s = pickStringField(obj, field, suf)
    if (s) return s
  }
  return ''
}
