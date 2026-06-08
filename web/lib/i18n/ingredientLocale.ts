import type { WattaLanguage } from './language'
import { getLocalizedField } from './getLocalizedField'

/** Поля Prisma: name_ru, name_ua, name_en, name_nl */
export const INGREDIENT_LOCALE_SUFFIXES = ['ru', 'ua', 'en', 'nl'] as const
export type IngredientLocaleSuffix = (typeof INGREDIENT_LOCALE_SUFFIXES)[number]

export type IngredientNameFields = {
  name_ru?: string
  name_ua?: string
  name_en?: string
  name_nl?: string
}

export function ingredientNameForSuffix(
  ing: IngredientNameFields | null | undefined,
  suffix: IngredientLocaleSuffix,
): string {
  if (!ing) return ''
  const key = `name_${suffix}` as keyof IngredientNameFields
  return String(ing[key] ?? '').trim()
}

export function ingredientDisplayName(
  ing: IngredientNameFields | null | undefined,
  language: WattaLanguage,
): string {
  return getLocalizedField(ing as Record<string, unknown>, 'name', language)
}

export function ingredientHasAllLocales(ing: IngredientNameFields): boolean {
  return INGREDIENT_LOCALE_SUFFIXES.every((s) => ingredientNameForSuffix(ing, s).length > 0)
}
