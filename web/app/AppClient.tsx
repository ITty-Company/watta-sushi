'use client'

import { ReactNode, useLayoutEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import LanguageProviderWrapper from './components/LanguageProviderWrapper'
import FloatingContactButtons from './components/FloatingContactButtons'
import Footer from './components/Footer'
import WattaRightNavDrawer from './components/WattaRightNavDrawer'
import WattaPublicSiteChrome from './components/WattaPublicSiteChrome'
import WattaPublicBottomBar from './components/WattaPublicBottomBar'
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
  const showGlobalSiteChrome =
    !isHomeRoute && !isAuthRoute && !isAdminShellRoute && pathname !== '/menu'
  /** Нижня панель на всіх сторінках, крім головної (там свій UI) та адмінки */
  const showPublicBottomBar = !isHomeRoute && !isAdminShellRoute

  /**
   * Після зміни URL — одразу зверху (до малювання кадру).
   * На `/` скрол у `.content-web`, не в window — тому скидаємо обидва через scrollEntireAppToTop.
   */
  useLayoutEffect(() => {
    scrollEntireAppToTop()
  }, [pathname, searchParams])

  return (
    <LanguageProviderWrapper>
      <RightNavDrawerProvider enabled={showPublicNavChrome}>
        {/* Мінімум висоти вікна: футер лишається внизу; фон сторінки — як у шапки контенту */}
        <div
          className={`watta-app-shell-root flex min-h-[100dvh] min-h-[100svh] flex-col bg-[#f2f5f3]${showPublicBottomBar ? ' watta-app-with-public-bottom-bar' : ''}`}
        >
          {/* Контент займає вільне місце між шапкою сторінки та глобальним футером */}
          <main className="flex min-h-0 w-full max-w-[100vw] flex-1 flex-col">
            {showGlobalSiteChrome ? <WattaPublicSiteChrome /> : null}
            <div className="relative z-0 flex min-h-0 min-w-0 flex-1 flex-col">
              {children}
            </div>
          </main>

          {showPublicBottomBar ? <WattaPublicBottomBar /> : null}

          {/* На головній футер у MenuView/HomeClient; на /login /register — без глобального футера */}
          {!isHomeRoute && !isAuthRoute && !isAdminShellRoute && <Footer />}

          {showPublicNavChrome && <WattaRightNavDrawer />}
          {!isAuthRoute && !isAdminShellRoute && <FloatingContactButtons />}
        </div>
      </RightNavDrawerProvider>
    </LanguageProviderWrapper>
  )
}