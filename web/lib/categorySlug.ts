const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'h',
  ґ: 'g',
  д: 'd',
  е: 'e',
  є: 'ye',
  ё: 'yo',
  ж: 'zh',
  з: 'z',
  и: 'y',
  і: 'i',
  ї: 'yi',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'kh',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'shch',
  ъ: '',
  ы: 'y',
  ь: '',
  э: 'e',
  ю: 'yu',
  я: 'ya',
}

function transliterate(text: string): string {
  return String(text ?? '')
    .toLowerCase()
    .trim()
    .split('')
    .map((ch) => CYRILLIC_TO_LATIN[ch] ?? ch)
    .join('')
}

export function sanitizeCategorySlug(input: unknown): string | null {
  if (input == null) return null
  const s = String(input)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  if (!s || s.length < 2 || s === '-') return null
  return s
}

/** Slug для форми адмінки: EN → UA → RU → NL. */
export function suggestCategorySlug(fields: {
  slug?: string
  name_ru?: string
  name_ua?: string
  name_en?: string
  name_nl?: string
}): string {
  const manual = sanitizeCategorySlug(fields.slug)
  if (manual) return manual

  const candidates = [fields.name_en, fields.name_ua, fields.name_ru, fields.name_nl]
  for (const name of candidates) {
    const fromName = sanitizeCategorySlug(
      transliterate(String(name ?? '')).replace(/\s+/g, '-'),
    )
    if (fromName) return fromName
  }

  return 'category'
}

export function isBrokenCategorySlug(slug: unknown): boolean {
  const s = sanitizeCategorySlug(slug)
  return !s
}
