/**
 * Мови сайту (синхронно з useLanguage: uk | en | ru | nl).
 * Винесено в окремий модуль, щоб імпортувати з Server Components без "use client".
 */
export const WATTA_LANGUAGES = ['uk', 'en', 'ru', 'nl'] as const
export type WattaLanguage = (typeof WATTA_LANGUAGES)[number]

export const WATTA_LANG_COOKIE = 'watta_lang'
export const WATTA_LANG_MAX_AGE = 60 * 60 * 24 * 365

export function parseWattaLanguage(s: string | undefined | null): WattaLanguage {
  if (s && (WATTA_LANGUAGES as readonly string[]).includes(s)) {
    return s as WattaLanguage
  }
  return 'uk'
}

/** BCP 47 для <html lang> */
export function wattaToHtmlLang(lang: WattaLanguage): string {
  return lang
}

/** OpenGraph locale */
export function wattaToOgLocale(lang: WattaLanguage): string {
  const map: Record<WattaLanguage, string> = {
    uk: 'uk_UA',
    en: 'en_US',
    ru: 'ru_RU',
    nl: 'nl_NL',
  }
  return map[lang]
}
