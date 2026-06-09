'use client'

import { ReactNode, useEffect, useLayoutEffect, useRef, useSyncExternalStore } from 'react'
import { usePathname } from 'next/navigation'
import { LazyMotion } from 'framer-motion'
import { loadFramerFeatures } from '@/lib/framerLazyFeatures'
import type { WattaLanguage } from '@/lib/i18n/language'
import LanguageProviderWrapper from './components/LanguageProviderWrapper'
import FloatingContactButtons from './components/FloatingContactButtons'
import ServiceWorkerRegister from './components/ServiceWorkerRegister'
import Footer from './components/Footer'
import WattaRightNavDrawer from './components/WattaRightNavDrawer'
import WattaCartDrawer from './components/WattaCartDrawer'
import WattaNotificationsPanel from './components/WattaNotificationsPanel'
import WattaNotificationWatcher from './components/WattaNotificationWatcher'
import WattaToaster from './components/WattaToaster'
import WattaPublicSiteChrome from './components/WattaPublicSiteChrome'
import WattaHtmlRouteClass from './components/WattaHtmlRouteClass'
import { RightNavDrawerProvider } from './context/RightNavDrawerContext'
import { AuthModalProvider } from './context/AuthModalContext'
import { CartDrawerProvider } from './context/CartDrawerContext'
import { NotificationsDrawerProvider } from './context/NotificationsDrawerContext'
import { sanitizeAuthStorage } from '@/lib/authSession'
import { syncFavoritesAfterAuth } from '@/lib/favoritesStorage'
import { ensureDocumentScrollUnlocked } from '@/lib/ensureDocumentScroll'
import { bindMobileViewportHeightLock, lockMobileViewportHeight } from '@/lib/lockMobileViewportHeight'
import { scrollEntireAppToTop, disableBrowserScrollRestoration } from '@/lib/menuScroll'
import {
  bindWattaScrollMemory,
  consumePopNavigation,
  restoreScrollForCurrentLocation,
} from '@/lib/wattaScrollMemory'
import {
  consumeSkipScrollReset,
  applyRestoreChromeCompactIfNeeded,
  shouldPreserveMenuCategoryScroll,
} from '@/lib/wattaChromeScroll'
import { subscribeWattaCatalogCrossTab } from '@/lib/wattaCatalogSync'
import { ensureCountriesCatalog } from '@/lib/fetchCountriesCatalog'
import {
  ensureIngredientsCatalog,
  readIngredientsCatalogSync,
} from '@/lib/wattaIngredientsCatalog'
import { isBrokenUploadUrl } from '@/lib/brokenUploadUrlCache'
import { resolveCatalogMediaUrl } from '@/lib/catalogMediaUrl'
import { preloadImageUrls } from '@/lib/preloadImages'
import { preloadHeroRollImageUrls } from '@/lib/wattaHeroRollPreload'
import { preloadLocationPickerMascot } from '@/lib/locationPickerMascot'
import { useInstantNavBoot } from '@/hooks/useInstantNavBoot'
import { useInstantRouter } from '@/hooks/useInstantRouter'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { isDocumentReloadNavigation } from '@/lib/menuBrowseRestore'
import { markInternalNavBackAvailable, resetInternalNavBack } from '@/lib/wattaInternalNavBack'
import { resetHomepageLikeLogoClick, WATTA_CHROME_LAYOUT_SYNC_EVENT } from '@/lib/wattaChromeGoHome'
import { bindHeroScrollPerf } from '@/lib/heroScrollPerf'
import { bindHeroVideoKeepAlive } from '@/lib/heroVideoKeepAlive'
import { warmHeroVideoCache } from '@/lib/warmHeroVideoCache'
import { isWattaHomeHeroPathname, isWattaHomeHeroVideoPathname, isWattaProductPathname } from '@/lib/wattaHtmlRouteClass'
import { applyWattaProductChromeEntry } from '@/lib/wattaProductChrome'
import {
  navigateToFullMenuCategory,
  WATTA_CATEGORY_STRIP_SELECT,
} from '@/lib/fullMenuCategoryNav'
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
  useScrollReveal(pathname)
  const prevPathnameForScrollRef = useRef<string | null>(null)
  const isHomeRoute = pathname === '/'
  const isHomeRollHero = isWattaHomeHeroPathname(pathname ?? '/')
  const isHeroVideoRoute = isWattaHomeHeroVideoPathname(pathname ?? '/') && !isHomeRollHero
  const isAuthRoute = pathname === '/login' || pathname === '/register'
  const isNotificationsRoute = pathname === '/notifications'
  const isCartCheckoutRoute = pathname === '/cart'
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
  const showPublicNavChrome = !isAdminShellRoute
  /** Єдина fixed шапка + категорії; на /login та /register модалка поверх сайту. */
  const showGlobalSiteChrome =
    !isAdminShellRoute && !hidePublicSiteChromeExtras
  /**
   * Скрол наверх лише при зміні pathname; raніше тригерилось і на кожну зміну `searchParams`
   * (фільтри / cat= / lang=), що зайво ганяло layout на швидких переходах.
   */
  useLayoutEffect(() => {
    preloadLocationPickerMascot()
    disableBrowserScrollRestoration()
  }, [])

  /** Прогрів roll webp — одразу на головній, щоб після F5 картинки були в кеші. */
  useLayoutEffect(() => {
    if (!isHomeRoute) return
    preloadHeroRollImageUrls()
  }, [isHomeRoute])

  /** На /login та /register — повна шапка, без compact-режиму з попередньої сторінки. */
  useLayoutEffect(() => {
    if (!isAuthRoute || typeof document === 'undefined') return
    delete document.documentElement.dataset.wattaChromeCompact
    window.dispatchEvent(new Event(WATTA_CHROME_LAYOUT_SYNC_EVENT))
  }, [isAuthRoute])

  /** Клік по чіпу категорії — перехід на /menu?cat= і скрол до секції. */
  useEffect(() => {
    const lastRef = { slug: '', at: 0 }
    const onSelect = (ev: Event) => {
      const slug = (ev as CustomEvent<{ slug?: string }>).detail?.slug?.trim()
      if (!slug) return
      const now = Date.now()
      if (slug === lastRef.slug && now - lastRef.at < 120) return
      lastRef.slug = slug
      lastRef.at = now
      navigateToFullMenuCategory(router, pathname ?? '/', slug)
    }
    window.addEventListener(WATTA_CATEGORY_STRIP_SELECT, onSelect)
    return () => window.removeEventListener(WATTA_CATEGORY_STRIP_SELECT, onSelect)
  }, [router, pathname])

  /** Після reload / прямого заходу — «Назад» не показуємо, доки не буде SPA-переходу. */
  useLayoutEffect(() => {
    resetInternalNavBack()
  }, [])

  useLayoutEffect(() => {
    const path = pathname ?? '/'
    const prev = prevPathnameForScrollRef.current
    prevPathnameForScrollRef.current = path
    ensureDocumentScrollUnlocked()
    // Завжди споживаємо прапорець back/forward на кожну зміну pathname — інакше він «протікає»
    // на наступну (push) навігацію і та помилково відновлює скрол замість scroll-to-top.
    const wasPopNavigation = consumePopNavigation()
    if (prev !== null && prev !== path) {
      markInternalNavBackAvailable()
    }
    if (prev === path) return
    if (path === '/menu' && prev === '/menu') return
    if (consumeSkipScrollReset() || shouldPreserveMenuCategoryScroll()) {
      applyRestoreChromeCompactIfNeeded()
      return
    }
    if (isWattaProductPathname(path)) {
      applyWattaProductChromeEntry()
    }
    // Back/forward: повертаємо збережену позицію (як на звичайних сайтах). Головну не чіпаємо —
    // там окрема hero-логіка (reset на верх). Якщо збереженої позиції нема — звичайний scroll-to-top.
    if (wasPopNavigation && !isHomeRoute && restoreScrollForCurrentLocation()) {
      return
    }
    scrollEntireAppToTop({ force: true })
  }, [pathname, isHomeRoute])

  /** F5 на головній (або reload з іншої публічної → /) — reset як клік по логотипу. */
  useLayoutEffect(() => {
    if (!isDocumentReloadNavigation()) return
    const p = typeof window !== 'undefined' ? window.location.pathname || '/' : '/'
    if (p !== '/' && p !== '') return
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

  /** Hero mp4: /menu, /delivery — на головній roll hero без відео. */
  useEffect(() => {
    if (!isHeroVideoRoute) return
    warmHeroVideoCache()
    return bindHeroVideoKeepAlive()
  }, [isHeroVideoRoute])

  /** Пауза декоративних анімацій під час скролу на всіх сторінках (менше jank). */
  useEffect(() => bindHeroScrollPerf(), [])

  /** Памʼять скролу для back/forward — «Назад» повертає позицію, а не стрибає наверх. */
  useEffect(() => bindWattaScrollMemory(), [])

  /** motion-footer — idle, не в layout phase. */
  useEffect(() => {
    if (!isHomeRoute) return
    type IdleWindow = Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout?: number }) => number
    }
    const w = window as IdleWindow
    const run = () => {
      void import('@/components/ui/motion-footer')
    }
    if (typeof w.requestIdleCallback === 'function') {
      w.requestIdleCallback(run, { timeout: 4000 })
    } else {
      window.setTimeout(run, 1500)
    }
  }, [isHomeRoute])

  useEffect(() => subscribeWattaCatalogCrossTab(() => {}), [])

  useEffect(() => {
    type IdleWindow = Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout?: number }) => number
    }
    const w = window as IdleWindow
    const ingredientPreloadUrls = (map: Map<number, { imageUrl: string }>) =>
      Array.from(map.values())
        .map((ing) => resolveCatalogMediaUrl(ing.imageUrl))
        .filter((u): u is string => Boolean(u?.trim()) && !isBrokenUploadUrl(u))

    const runDeferred = () => {
      void ensureCountriesCatalog()
      const cachedIng = readIngredientsCatalogSync()
      if (cachedIng?.size) {
        preloadImageUrls(ingredientPreloadUrls(cachedIng), { limit: 12, highPriorityCount: 8 })
      }
      void ensureIngredientsCatalog().then((map) => {
        if (!map?.size) return
        preloadImageUrls(ingredientPreloadUrls(map), { limit: 12, highPriorityCount: 8 })
      })
    }
    if (typeof w.requestIdleCallback === 'function') {
      w.requestIdleCallback(runDeferred, { timeout: 800 })
    } else {
      window.setTimeout(runDeferred, 250)
    }
  }, [])

  return (
    <LazyMotion features={loadFramerFeatures}>
    <LanguageProviderWrapper initialLocale={initialLocale}>
      <WattaToaster />
      <AuthModalProvider>
      <RightNavDrawerProvider enabled={showPublicNavChrome}>
        <NotificationsDrawerProvider enabled={showPublicNavChrome}>
        <CartDrawerProvider enabled={showPublicNavChrome}>
        {/* Мінімум висоти вікна: футер лишається внизу; фон сторінки — як у шапки контенту */}
        <div className="watta-app-shell-root watta-page-bg flex min-h-[var(--watta-screen-min-h,100dvh)] flex-col">
          <ServiceWorkerRegister />
          <WattaHtmlRouteClass />
          {/* flex-1: основний блок забирає вільну висоту до min-h екрана — інакше «повітря» лишалось під футером */}
          <main className="flex min-h-0 w-full max-w-[100vw] flex-1 flex-col">
            {showGlobalSiteChrome ? <WattaPublicSiteChrome /> : null}
            <div className="watta-app-main-grow relative flex min-h-0 min-w-0 flex-1 flex-col">
              {children}
            </div>
            {/* mt-auto: коротка сторінка — підвал внизу вікна; довга — після контенту при скролі body */}
            {!isHomeRoute &&
            !isAuthRoute &&
            !isAdminShellRoute &&
            !isNotificationsRoute &&
            !isCartCheckoutRoute ? (
              <Footer className="mt-auto" />
            ) : null}
          </main>

          {showPublicNavChrome && <WattaRightNavDrawer />}
          {showPublicNavChrome && <WattaNotificationsPanel />}
          {showPublicNavChrome && <WattaNotificationWatcher />}
          {showPublicNavChrome && <WattaCartDrawer />}
          {!isAuthRoute && !isAdminShellRoute && !hidePublicSiteChromeExtras && (
            <FloatingContactButtons />
          )}
        </div>
        </CartDrawerProvider>
        </NotificationsDrawerProvider>
      </RightNavDrawerProvider>
      </AuthModalProvider>
    </LanguageProviderWrapper>
    </LazyMotion>
  )
}