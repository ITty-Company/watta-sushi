import type { WattaLanguage } from '@/lib/i18n/language'

function formatRuDishCount(n: number): string {
  if (n === 0) return '0 блюд'
  if (n === 1) return '1 блюдо'
  return `${n} блюда`
}

function formatUkDishCount(n: number): string {
  if (n === 0) return '0 страв'
  if (n === 1) return '1 страва'
  return `${n} страви`
}

/** Счётчик под категорией: 1 блюдо / 2+ блюда (RU), 1 страва / 2+ страви (UA). */
export function formatMenuItemsCount(count: number, lang: WattaLanguage): string {
  const n = Math.max(0, Math.trunc(count))
  if (lang === 'ru') return formatRuDishCount(n)
  if (lang === 'uk') return formatUkDishCount(n)
  if (lang === 'nl') {
    return n === 1 ? `${n} gerecht` : `${n} gerechten`
  }
  return n === 1 ? `${n} dish` : `${n} dishes`
}
