'use client'

import { ReactNode, useEffect, useLayoutEffect, useRef, useSyncExternalStore } from 'react'
import { usePathname } from 'next/navigation'
import type { WattaLanguage } from '@/lib/i18n/language'
import LanguageProviderWrapper from './components/LanguageProviderWrapper'
import FloatingContactButtons from './components/FloatingContactButtons'
import Footer from './components/Footer'
import WattaRightNavDrawer from './components/WattaRightNavDrawer'
import WattaPublicSiteChrome from './components/WattaPublicSiteChrome'
import WattaHtmlRouteClass from './components/WattaHtmlRouteClass'
import { RightNavDrawerProvider } from './context/RightNavDrawerContext'
import { sanitizeAuthStorage } from '@/lib/authSession'
import { syncFavoritesAfterAuth } from '@/lib/favoritesStorage'
import { ensureDocumentScrollUnlocked } from '@/lib/ensureDocumentScroll'
import { bindMobileViewportHeightLock, lockMobileViewportHeight } from '@/lib/lockMobileViewportHeight'
import { scrollEntireAppToTop } from '@/lib/menuScroll'
import { subscribeWattaCatalogCrossTab } from '@/lib/wattaCatalogSync'
import { ensureCountriesCatalog } from '@/lib/fetchCountriesCatalog'
import {
  ensureIngredientsCatalog,
  readIngredientsCatalogSync,
} from '@/lib/wattaIngredientsCatalog'
import { resolveCatalogMediaUrl } from '@/lib/catalogMediaUrl'
import { preloadImageUrls } from '@/lib/preloadImages'
import { preloadLocationPickerMascot } from '@/lib/locationPickerMascot'
import { useInstantNavBoot } from '@/hooks/useInstantNavBoot'
import { useInstantRouter } from '@/hooks/useInstantRouter'
import { isBrowserReloadOnHome } from '@/lib/menuBrowseRestore'
import { resetHomepageLikeLogoClick } from '@/lib/wattaChromeGoHome'
import { warmMenuCatalogCache } from '@/lib/menuCatalogSessionCache'

export default function AppClient({
  children,
  initialLocale,
}: {
  children: ReactNode
  initialLocale: WattaLanguage
}) {
  const pathname = usePathname()
  const router = useInstantRouter()
  useInstantNavBoot()
  const prevPathnameForScrollRef = useRef<string | null>(null)
  const isHomeRoute = pathname === '/'
  const isAuthRoute = pathname === '/login' || pathname === '/register'
  const isAdminShellRoute = pathname === '/admin' || pathname?.startsWith('/admin/')
  const hidePublicSiteChromeExtras = useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === 'undefined') return () => {}
      const handler = () => onStoreChange()
      window.addEventListener('wattaHomeFullPageOverlay', handler)
      return () => window.removeEventListener('wattaHomeFullPageOverlay', handler)
    },
    () => {
      if (typeof document === 'undefined') return false
      return (
        document.documentElement.classList.contains('watta-admin-active') ||
        document.body.classList.contains('watta-home-admin-open') ||
        Boolean(document.querySelector('.admin-shell-watta-web, .full-page-web--admin'))
      )
    },
    () => false,
  )
  const showPublicNavChrome = !isAuthRoute
  /** Єдина fixed шапка + категорії (як на головній) на всіх публічних маршрутах; не в адмінці. */
  const showGlobalSiteChrome =
    !isAuthRoute && !isAdminShellRoute && !hidePublicSiteChromeExtras
  /**
   * Скрол наверх лише при зміні pathname; raніше тригерилось і на кожну зміну `searchParams`
   * (фільтри / cat= / lang=), що зайво ганяло layout на швидких переходах.
   */
  useLayoutEffect(() => {
    void warmMenuCatalogCache()
    preloadLocationPickerMascot()
  }, [])

  useLayoutEffect(() => {
    const path = pathname ?? '/'
    const prev = prevPathnameForScrollRef.current
    prevPathnameForScrollRef.current = path
    ensureDocumentScrollUnlocked()
    if (prev === path) return
    if (path === '/menu' && prev === '/menu') return
    scrollEntireAppToTop()
  }, [pathname])

  /** F5 на головній — одразу той самий reset, що клік по логотипу (до HomeClient). */
  useLayoutEffect(() => {
    if (!isBrowserReloadOnHome()) return
    resetHomepageLikeLogoClick(router, { skipRefresh: true })
  }, [router])

  /**
   * Одноразова міграція схеми кешу меню. Запускається через requestIdleCallback,
   * щоб не блокувати перший корисний кадр на головній.
   */
  useEffect(() => {
    if (typeof window === 'undefined') return
    sanitizeAuthStorage()
    const stampKey = 'watta_menu_cache_schema_v3'
    if (localStorage.getItem(stampKey) === '1') return

    const runMigration = () => {
      const purgeByPrefix = (store: Storage, prefixes: string[]) => {
        for (let i = store.length - 1; i >= 0; i -= 1) {
          const k = store.key(i)
          if (!k) continue
          if (prefixes.some((p) => k.startsWith(p))) store.removeItem(k)
        }
      }
      const prefixes = ['menu_items_', 'menu_categories_']
      purgeByPrefix(sessionStorage, prefixes)
      purgeByPrefix(localStorage, prefixes)
      sessionStorage.removeItem('cities_cache')
      sessionStorage.removeItem('cities_cache_time')
      localStorage.removeItem('watta_cities_cache')
      localStorage.removeItem('watta_cities_cache_time')
      localStorage.setItem(stampKey, '1')
    }

    type IdleWindow = Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout?: number }) => number
    }
    const w = window as IdleWindow
    if (typeof w.requestIdleCallback === 'function') {
      w.requestIdleCallback(runMigration, { timeout: 2000 })
    } else {
      window.setTimeout(runMigration, 800)
    }
  }, [])

  useEffect(() => {
    const onUser = () => {
      void syncFavoritesAfterAuth()
    }
    window.addEventListener('userChanged', onUser)
    return () => window.removeEventListener('userChanged', onUser)
  }, [])

  /** Після bfcache / жесту «назад» — зняти залишковий overflow:hidden з модалок. */
  useEffect(() => {
    const onPageShow = () => {
      ensureDocumentScrollUnlocked()
      lockMobileViewportHeight()
    }
    window.addEventListener('pageshow', onPageShow)
    return () => window.removeEventListener('pageshow', onPageShow)
  }, [])

  /** Телефон: «заморожена» висота вікна — не стискається від клавіатури. */
  useEffect(() => bindMobileViewportHeightLock(), [])

  useEffect(() => subscribeWattaCatalogCrossTab(() => {}), [])

  useEffect(() => {
    type IdleWindow = Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout?: number }) => number
    }
    const w = window as IdleWindow
    const runDeferred = () => {
      void ensureCountriesCatalog()
      const cachedIng = readIngredientsCatalogSync()
      if (cachedIng?.size) {
        preloadImageUrls(
          Array.from(cachedIng.values()).map((ing) => resolveCatalogMediaUrl(ing.imageUrl)),
          { limit: 12, highPriorityCount: 8 },
        )
      }
      void ensureIngredientsCatalog().then((map) => {
        if (!map?.size) return
        preloadImageUrls(
          Array.from(map.values()).map((ing) => resolveCatalogMediaUrl(ing.imageUrl)),
          { limit: 12, highPriorityCount: 8 },
        )
      })
      void warmMenuCatalogCache()
    }
    if (typeof w.requestIdleCallback === 'function') {
      w.requestIdleCallback(runDeferred, { timeout: 800 })
    } else {
      window.setTimeout(runDeferred, 250)
    }
  }, [])

  return (
    <LanguageProviderWrapper initialLocale={initialLocale}>
      <RightNavDrawerProvider enabled={showPublicNavChrome}>
        {/* Мінімум висоти вікна: футер лишається внизу; фон сторінки — як у шапки контенту */}
        <div className="watta-app-shell-root watta-page-bg flex min-h-[100dvh] min-h-[100svh] flex-col">
          <WattaHtmlRouteClass />
          {/* flex-1: основний блок забирає вільну висоту до min-h екрана — інакше «повітря» лишалось під футером */}
          <main className="flex min-h-0 w-full max-w-[100vw] flex-1 flex-col">
            {showGlobalSiteChrome ? <WattaPublicSiteChrome /> : null}
            <div className="watta-app-main-grow relative flex min-h-0 min-w-0 flex-1 flex-col">
              {children}
            </div>
            {/* mt-auto: коротка сторінка — підвал внизу вікна; довга — після контенту при скролі body */}
            {!isHomeRoute && !isAuthRoute && !isAdminShellRoute ? (
              <Footer className="mt-auto" />
            ) : null}
          </main>

          {showPublicNavChrome && <WattaRightNavDrawer />}
          {!isAuthRoute && !isAdminShellRoute && !hidePublicSiteChromeExtras && (
            <FloatingContactButtons />
          )}
        </div>
      </RightNavDrawerProvider>
    </LanguageProviderWrapper>
  )
}