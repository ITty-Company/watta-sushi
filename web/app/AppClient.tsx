'use client'

import { ReactNode, useEffect, useLayoutEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import LanguageProviderWrapper from './components/LanguageProviderWrapper'
import FloatingContactButtons from './components/FloatingContactButtons'
import Footer from './components/Footer'
import WattaRightNavDrawer from './components/WattaRightNavDrawer'
import WattaPublicSiteChrome from './components/WattaPublicSiteChrome'
import { RightNavDrawerProvider } from './context/RightNavDrawerContext'
import { scrollEntireAppToTop } from '@/lib/menuScroll'

export default function AppClient({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isHomeRoute = pathname === '/'
  const isAuthRoute = pathname === '/login' || pathname === '/register'
  const isAdminShellRoute = pathname === '/admin' || pathname?.startsWith('/admin/')
  const showPublicNavChrome = !isAuthRoute
  /** Шапка + панель категорій: не дублюємо головну (MenuView), /menu (FullMenuPage), auth, admin */
  /** /menu: ті сама шапка + стрічка категорій, що й на інших публічних сторінках (WattaPublicSiteChrome). */
  const showGlobalSiteChrome = !isHomeRoute && !isAuthRoute && !isAdminShellRoute
  /**
   * Після зміни URL — одразу зверху (до малювання кадру).
   * На `/` скрол у `.content-web`, не в window — тому скидаємо обидва через scrollEntireAppToTop.
   */
  useLayoutEffect(() => {
    scrollEntireAppToTop()
  }, [pathname, searchParams])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const stampKey = 'watta_menu_cache_schema_v3'
    if (localStorage.getItem(stampKey) === '1') return

    const purgeByPrefix = (store: Storage, prefixes: string[]) => {
      for (let i = store.length - 1; i >= 0; i -= 1) {
        const k = store.key(i)
        if (!k) continue
        if (prefixes.some((p) => k.startsWith(p))) {
          store.removeItem(k)
        }
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
  }, [])

  return (
    <LanguageProviderWrapper>
      <RightNavDrawerProvider enabled={showPublicNavChrome}>
        {/* Мінімум висоти вікна: футер лишається внизу; фон сторінки — як у шапки контенту */}
        <div
          className="watta-app-shell-root watta-page-bg flex min-h-[100dvh] min-h-[100svh] flex-col"
        >
          {/* Контент займає вільне місце між шапкою сторінки та глобальним футером */}
          <main className="flex min-h-0 w-full max-w-[100vw] flex-col">
            {showGlobalSiteChrome ? <WattaPublicSiteChrome /> : null}
            <div className="relative z-0 flex min-h-0 min-w-0 flex-col">
              {children}
            </div>
          </main>

          {/* На головній футер у MenuView/HomeClient; на /login /register — без глобального футера */}
          {!isHomeRoute && !isAuthRoute && !isAdminShellRoute && <Footer />}

          {showPublicNavChrome && <WattaRightNavDrawer />}
          {!isAuthRoute && !isAdminShellRoute && <FloatingContactButtons />}
        </div>
      </RightNavDrawerProvider>
    </LanguageProviderWrapper>
  )
}