'use client'

import {
  createContext,
  useContext,
  useState,
  useLayoutEffect,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  type ReactNode,
} from 'react'
import {
  type WattaLanguage,
  WATTA_DEFAULT_SITE_LANGUAGE,
  WATTA_LANG_COOKIE,
  WATTA_LANG_EXPLICIT_COOKIE,
  WATTA_LANG_MAX_AGE,
  parseWattaLanguage,
  resolveWattaSiteLanguageFromDocumentCookie,
  wattaToHtmlLang,
} from '@/lib/i18n/language'
import { getLocalizedField } from '@/lib/i18n/getLocalizedField'
import { formatMenuItemsCount } from '@/lib/i18n/formatMenuItemsCount'
import type { SiteTranslations, Translations } from '@/lib/i18n/translations/types'
import {
  getCachedSiteTranslations,
  loadSiteTranslations,
  prefetchSiteTranslations,
  ukTranslationsSync,
} from '@/lib/i18n/loadSiteTranslations'

export type Language = WattaLanguage
export type { Translations, SiteTranslations }
export type AdminUiLanguage = 'uk' | 'ru'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  adminUiLanguage: AdminUiLanguage
  setAdminUiLanguage: (lang: AdminUiLanguage) => void
  t: Translations
  getLocalized: (obj: unknown, field: string) => string
  formatMenuItemsCount: (count: number) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

function applyClientLanguage(lang: Language, opts?: { markExplicitChoice?: boolean }) {
  if (typeof document === 'undefined') return
  const safe = parseWattaLanguage(lang)
  document.documentElement.lang = wattaToHtmlLang(safe)
  document.cookie = `${WATTA_LANG_COOKIE}=${safe}; path=/; max-age=${WATTA_LANG_MAX_AGE}; SameSite=Lax`
  if (opts?.markExplicitChoice) {
    document.cookie = `${WATTA_LANG_EXPLICIT_COOKIE}=1; path=/; max-age=${WATTA_LANG_MAX_AGE}; SameSite=Lax`
  }
}

function mergeTranslations(
  base: SiteTranslations,
  admin: SiteTranslations,
): Translations {
  return {
    ...base,
    adminPage: admin.adminPage,
    adminPanel: admin.adminPanel,
  }
}

export function LanguageProvider({
  children,
  initialLocale,
}: {
  children: ReactNode
  initialLocale: WattaLanguage
}) {
  const [language, setLanguageState] = useState<Language>(initialLocale)
  const [adminUiLanguage, setAdminUiLanguageState] = useState<AdminUiLanguage>('uk')
  const [siteDict, setSiteDict] = useState<SiteTranslations | null>(() =>
    getCachedSiteTranslations(initialLocale),
  )
  const [adminDict, setAdminDict] = useState<SiteTranslations | null>(null)
  const dictByLangRef = useRef<Partial<Record<WattaLanguage, SiteTranslations>>>({
    uk: ukTranslationsSync,
  })

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return
    const next = resolveWattaSiteLanguageFromDocumentCookie(document.cookie || '')
    setLanguageState(next)
    applyClientLanguage(next)
    try {
      if (window.localStorage) localStorage.setItem('language', next)
    } catch {
      /* ignore */
    }
    try {
      const adminSaved = window.localStorage?.getItem('adminUiLang')
      if (adminSaved === 'ru' || adminSaved === 'uk') {
        setAdminUiLanguageState(adminSaved)
      }
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const cached = getCachedSiteTranslations(language)
    if (cached) {
      dictByLangRef.current[language] = cached
      setSiteDict(cached)
    }
    const adminLang = adminUiLanguage as WattaLanguage
    const loads: Promise<void>[] = [
      loadSiteTranslations(language).then((dict) => {
        if (cancelled) return
        dictByLangRef.current[language] = dict
        setSiteDict(dict)
      }),
    ]
    if (adminLang !== language) {
      loads.push(
        loadSiteTranslations(adminLang).then((dict) => {
          if (!cancelled) setAdminDict(dict)
        }),
      )
    } else {
      setAdminDict(null)
    }
    void Promise.all(loads).catch(() => {})
    return () => {
      cancelled = true
    }
  }, [language, adminUiLanguage])

  useEffect(() => {
    const others: WattaLanguage[] = ['uk', 'ru', 'en', 'nl'].filter(
      (l): l is WattaLanguage => l !== language,
    )
    for (const l of others) prefetchSiteTranslations(l)
  }, [language])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    const cached = getCachedSiteTranslations(lang)
    if (cached) {
      dictByLangRef.current[lang] = cached
      setSiteDict(cached)
    }
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('language', lang)
    }
    applyClientLanguage(lang, { markExplicitChoice: true })
  }

  const setAdminUiLanguage = (lang: AdminUiLanguage) => {
    setAdminUiLanguageState(lang)
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('adminUiLang', lang)
    }
  }

  const getLocalized = useCallback(
    (obj: unknown, field: string) =>
      getLocalizedField(obj as Record<string, unknown>, field, language),
    [language],
  )

  const formatMenuItemsCountForLang = useCallback(
    (count: number) => formatMenuItemsCount(count, language),
    [language],
  )

  const mergedT = useMemo((): Translations => {
    const base =
      siteDict ??
      dictByLangRef.current[language] ??
      (language === 'uk' ? ukTranslationsSync : ukTranslationsSync)
    const admin =
      adminUiLanguage === language
        ? base
        : adminDict ?? (adminUiLanguage === 'uk' ? ukTranslationsSync : base)
    return mergeTranslations(base, admin)
  }, [siteDict, adminDict, language, adminUiLanguage])

  const contextValue = useMemo(
    () => ({
      language,
      setLanguage,
      adminUiLanguage,
      setAdminUiLanguage,
      t: mergedT,
      getLocalized,
      formatMenuItemsCount: formatMenuItemsCountForLang,
    }),
    [language, adminUiLanguage, mergedT, getLocalized, formatMenuItemsCountForLang],
  )

  return <LanguageContext.Provider value={contextValue}>{children}</LanguageContext.Provider>
}

const defaultContextValue: LanguageContextType = {
  language: WATTA_DEFAULT_SITE_LANGUAGE,
  setLanguage: () => {},
  adminUiLanguage: 'uk',
  setAdminUiLanguage: () => {},
  t: ukTranslationsSync,
  getLocalized: (obj: unknown, field: string) =>
    getLocalizedField(obj as Record<string, unknown> | null, field, WATTA_DEFAULT_SITE_LANGUAGE),
  formatMenuItemsCount: (count: number) =>
    formatMenuItemsCount(count, WATTA_DEFAULT_SITE_LANGUAGE),
}

/** Тексти global-error.tsx поза LanguageProvider */
export function getErrorPageForLanguage(lang: WattaLanguage): Translations['errorPage'] {
  if (lang === 'uk') return ukTranslationsSync.errorPage
  return ukTranslationsSync.errorPage
}

export function useLanguage() {
  try {
    const context = useContext(LanguageContext)
    return context ?? defaultContextValue
  } catch {
    return defaultContextValue
  }
}
