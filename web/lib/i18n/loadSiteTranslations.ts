import type { WattaLanguage } from '@/lib/i18n/language'
import type { SiteTranslations, Translations } from '@/lib/i18n/translations/types'

export type { SiteTranslations, Translations }

const cache = new Map<WattaLanguage, SiteTranslations>()
const inflight = new Map<WattaLanguage, Promise<SiteTranslations>>()

const loaders: Record<WattaLanguage, () => Promise<{ default: SiteTranslations }>> = {
  uk: () => import('@/lib/i18n/translations/uk'),
  ru: () => import('@/lib/i18n/translations/ru'),
  en: () => import('@/lib/i18n/translations/en'),
  nl: () => import('@/lib/i18n/translations/nl'),
}

/** Синхронно з кешу після першого завантаження chunk (перемикання мови без «залипання» uk). */
export function getCachedSiteTranslations(lang: WattaLanguage): SiteTranslations | null {
  return cache.get(lang) ?? null
}

/** Завантажити словник мови (code-split chunk на локаль). */
export function loadSiteTranslations(lang: WattaLanguage): Promise<SiteTranslations> {
  const cached = cache.get(lang)
  if (cached) return Promise.resolve(cached)

  const pending = inflight.get(lang)
  if (pending) return pending

  const promise = loaders[lang]()
    .then((mod) => {
      cache.set(lang, mod.default)
      inflight.delete(lang)
      return mod.default
    })
    .catch((err) => {
      inflight.delete(lang)
      throw err
    })

  inflight.set(lang, promise)
  return promise
}

/** Prefetch іншої мови в idle — перемикання без затримки. */
export function prefetchSiteTranslations(lang: WattaLanguage): void {
  if (cache.has(lang) || inflight.has(lang)) return
  type IdleWindow = Window & {
    requestIdleCallback?: (cb: () => void, opts?: { timeout?: number }) => number
  }
  const run = () => {
    void loadSiteTranslations(lang).catch(() => {})
  }
  if (typeof window === 'undefined') return
  const w = window as IdleWindow
  if (typeof w.requestIdleCallback === 'function') {
    w.requestIdleCallback(run, { timeout: 4000 })
  } else {
    window.setTimeout(run, 1200)
  }
}

/** SSR / global-error: синхронний uk fallback до гідратації. */
export { default as ukTranslationsSync } from '@/lib/i18n/translations/uk'
