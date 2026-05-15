/**
 * Мови сайту (синхронно з useLanguage: uk | en | ru | nl).
 * Винесено в окремий модуль, щоб імпортувати з Server Components без "use client".
 */
export const WATTA_LANGUAGES = ['uk', 'en', 'ru', 'nl'] as const
export type WattaLanguage = (typeof WATTA_LANGUAGES)[number]

export const WATTA_LANG_COOKIE = 'watta_lang'
/** Встановлюється лише коли користувач сам обрав мову в селекторі (не авто / legacy). */
export const WATTA_LANG_EXPLICIT_COOKIE = 'watta_lang_explicit'
export const WATTA_LANG_MAX_AGE = 60 * 60 * 24 * 365

/** Мова за замовчуванням (без cookie / localStorage). Сайт NL — дефолт нідерландська. */
export const WATTA_DEFAULT_SITE_LANGUAGE: WattaLanguage = 'nl'

function escapeCookieNameForRegex(name: string): string {
  return name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function readOneCookieValue(cookieHeader: string, cookieName: string): string | null {
  const m = cookieHeader.match(new RegExp(`(?:^|; )${escapeCookieNameForRegex(cookieName)}=([^;]*)`))
  if (!m?.[1]) return null
  try {
    return decodeURIComponent(m[1])
  } catch {
    return m[1]
  }
}

/**
 * NL-first: старі `watta_lang=uk|ru` (без явного вибору) трактуємо як дефолт `nl`.
 * Після вибору мови в UI ставимо `watta_lang_explicit=1` — тоді cookie мови поважається як є.
 */
export function resolveWattaSiteLanguage(
  langCookieValue: string | undefined | null,
  explicitCookieValue: string | undefined | null,
): WattaLanguage {
  const lang = parseWattaLanguage(langCookieValue?.trim() || null)
  if (explicitCookieValue?.trim() === '1') return lang
  if (lang === 'uk' || lang === 'ru') return WATTA_DEFAULT_SITE_LANGUAGE
  return lang
}

/** Клієнт / global-error: один рядок `document.cookie`. */
export function resolveWattaSiteLanguageFromDocumentCookie(cookieHeader: string): WattaLanguage {
  const langRaw = readOneCookieValue(cookieHeader, WATTA_LANG_COOKIE)
  const explicitRaw = readOneCookieValue(cookieHeader, WATTA_LANG_EXPLICIT_COOKIE)
  return resolveWattaSiteLanguage(langRaw, explicitRaw)
}

export function parseWattaLanguage(s: string | undefined | null): WattaLanguage {
  if (s && (WATTA_LANGUAGES as readonly string[]).includes(s)) {
    return s as WattaLanguage
  }
  return WATTA_DEFAULT_SITE_LANGUAGE
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
