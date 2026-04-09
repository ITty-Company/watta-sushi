'use client'

import { ReactNode, useLayoutEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import LanguageProviderWrapper from './components/LanguageProviderWrapper'
import FloatingContactButtons from './components/FloatingContactButtons'
import Footer from './components/Footer'
import WattaRightNavDrawer from './components/WattaRightNavDrawer'
import { RightNavDrawerProvider } from './context/RightNavDrawerContext'
import { scrollEntireAppToTop } from '@/lib/menuScroll'

export default function AppClient({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isHomeRoute = pathname === '/'
  const isAuthRoute = pathname === '/login' || pathname === '/register'
  const showPublicNavChrome = !isAuthRoute

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
        <div className="flex min-h-[100dvh] min-h-[100svh] flex-col overflow-x-hidden bg-[#f2f5f3]">
          {/* Контент займає вільне місце між шапкою сторінки та глобальним футером */}
          <main className="flex min-h-0 w-full max-w-[100vw] flex-1 flex-col">{children}</main>

          {/* На головній футер у MenuView/HomeClient; на /login /register — без глобального футера */}
          {!isHomeRoute && !isAuthRoute && <Footer />}

          {showPublicNavChrome && <WattaRightNavDrawer />}
          {!isAuthRoute && <FloatingContactButtons />}
        </div>
      </RightNavDrawerProvider>
    </LanguageProviderWrapper>
  )
}