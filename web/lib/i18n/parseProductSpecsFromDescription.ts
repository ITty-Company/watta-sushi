import { ingredientDisplayName } from './ingredientLocale'
import type { WattaLanguage } from './language'
import { readIngredientsCatalogSync } from '@/lib/wattaIngredientsCatalog'

/** Одиниці для рядків ваги / кількості на картках (узгоджено з `t.productDetail`). */
const SPEC_UNITS: Record<WattaLanguage, { g: string; ml: string; pcs: string }> = {
  uk: { g: 'г', ml: 'мл', pcs: 'шт' },
  ru: { g: 'г', ml: 'мл', pcs: 'шт' },
  en: { g: 'g', ml: 'ml', pcs: 'pcs' },
  nl: { g: 'g', ml: 'ml', pcs: 'st.' },
}

/**
 * З опису товару (часто RU/UA) витягує вагу / об'єм / кількість і форматує під поточну мову UI.
 */
export function parseProductSpecsFromDescription(
  desc: string,
  weightFallback: string,
  piecesFallback: string,
  lang: WattaLanguage,
): { weightLine: string; piecesLine: string } {
  const u = SPEC_UNITS[lang]
  const d = desc || ''

  const g = d.match(/(\d+)\s*(г|g)\b/i)?.[1]
  const ml = d.match(/(\d+)\s*(мл|ml)\b/i)?.[1]
  const pcs = d.match(/(\d+)\s*(шт\.?|pcs|pieces|stuks|st\.)\b/i)?.[1]

  const weightLine = ml ? `${ml} ${u.ml}` : g ? `${g} ${u.g}` : weightFallback
  const piecesLine = pcs ? `${pcs} ${u.pcs}` : piecesFallback
  return { weightLine, piecesLine }
}

/** Лише рядок ваги / об'єму (для cinematic rail тощо). */
export function formatProductWeightSubtitle(
  desc: string,
  weightFallback: string,
  piecesFallback: string,
  lang: WattaLanguage,
): string {
  return parseProductSpecsFromDescription(desc, weightFallback, piecesFallback, lang).weightLine
}

/** Склад / опис на картці меню (без префікса ваги, якщо він уже в окремому рядку). */
export function productCardIngredientsFromDescription(desc: string): string {
  const d = (desc || '').trim()
  if (!d) return ''
  const withoutLeadingWeight = d
    .replace(/^\s*\d+\s*(г|g|мл|ml|шт\.?|pcs|pieces|stuks|st\.)\b[^,]*,?\s*/i, '')
    .trim()
  return withoutLeadingWeight || d
}

/**
 * Повний склад для картки: спочатку застосовані інгредієнти з адмінки (мовою сайту),
 * інакше — локалізований опис без рядка ваги.
 */
export function productCompositionLine(
  description: string,
  lang: WattaLanguage,
  ingredientIds?: number[],
): string {
  const ids = (ingredientIds ?? []).filter((id) => Number.isFinite(id) && id > 0)
  if (ids.length > 0) {
    const catalog = readIngredientsCatalogSync()
    if (catalog) {
      const names = ids
        .map((id) => catalog.get(id))
        .filter((ing): ing is NonNullable<typeof ing> => Boolean(ing))
        .map((ing) => ingredientDisplayName(ing, lang))
        .filter(Boolean)
      if (names.length > 0) return names.join(', ')
    }
  }
  return productCardIngredientsFromDescription(description)
}
