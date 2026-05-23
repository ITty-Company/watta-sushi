import type { Language } from '@/app/context/LanguageContext'

const LOCALE_BY_LANG: Record<Language, string> = {
  uk: 'uk-UA',
  ru: 'ru-RU',
  en: 'en-GB',
  nl: 'nl-NL',
}

const AMSTERDAM_TZ = 'Europe/Amsterdam'

/** Formats admin-set ready/delivery time for customer-facing UI. */
export function formatOrderReadyAt(iso: string, lang: Language): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const loc = LOCALE_BY_LANG[lang] ?? 'uk-UA'
  return d.toLocaleString(loc, {
    timeZone: AMSTERDAM_TZ,
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Show ETA while order is still in progress (not pending / finished). */
export function shouldShowOrderReadyAt(status: string): boolean {
  return status === 'CONFIRMED' || status === 'COOKING' || status === 'DELIVERING'
}
