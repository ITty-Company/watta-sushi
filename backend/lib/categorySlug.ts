import type { PrismaClient } from '@prisma/client'

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

export function transliterateCategorySlugSource(text: string): string {
  return String(text ?? '')
    .toLowerCase()
    .trim()
    .split('')
    .map((ch) => CYRILLIC_TO_LATIN[ch] ?? ch)
    .join('')
}

/** Нормалізує slug: лише a-z0-9-; «-» / «—» / порожнє → null. */
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

type CategoryNameFields = {
  slug?: unknown
  name_ru?: string | null
  name_ua?: string | null
  name_en?: string | null
  name_nl?: string | null
}

/** Slug з явного поля або з назв (EN → UA → RU → NL), з транслитерацією. */
export function categorySlugFromNames(fields: CategoryNameFields): string {
  const manual = sanitizeCategorySlug(fields.slug)
  if (manual) return manual

  const candidates = [fields.name_en, fields.name_ua, fields.name_ru, fields.name_nl]
  for (const name of candidates) {
    const fromName = sanitizeCategorySlug(
      transliterateCategorySlugSource(String(name ?? '')).replace(/\s+/g, '-'),
    )
    if (fromName) return fromName
  }

  return 'category'
}

/** Унікальний slug; при колізії додає -2, -3… (окрім excludeCategoryId). */
export async function resolveUniqueCategorySlug(
  prisma: PrismaClient,
  baseSlug: string,
  excludeCategoryId?: number,
): Promise<string> {
  const root = sanitizeCategorySlug(baseSlug) ?? 'category'
  let finalSlug = root
  let counter = 1

  while (counter <= 100) {
    const existing = await prisma.category.findUnique({ where: { slug: finalSlug } })
    if (!existing || (excludeCategoryId != null && existing.id === excludeCategoryId)) {
      return finalSlug
    }
    counter += 1
    finalSlug = `${root}-${counter}`
  }

  return `${root}-${Date.now()}`
}
