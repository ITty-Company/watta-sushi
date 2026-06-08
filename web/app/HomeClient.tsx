'use client'

import { useState, useEffect, useLayoutEffect, useCallback, useSyncExternalStore } from 'react'
import dynamic from 'next/dynamic'
import './styles/watta-site-hero-delivery.css'
import MenuView from './components/MenuView'
import Footer from './components/Footer'
import { WattaInViewFadeDiv } from './components/WattaInViewFade'
import WattaBootSplashGate from './components/WattaBootSplashGate'
import { scrollEntireAppToTop, markHomeScrollReady, readAppScrollTop } from '@/lib/menuScroll'
import { useInstantRouter } from '@/hooks/useInstantRouter'
import { openWattaNotifications } from '@/lib/openWattaNotifications'
import { useOptionalNotificationsDrawer } from './context/NotificationsDrawerContext'

/**
 * Перший екран — лише `MenuView`. `CartView`/`ProfileView`/`NotificationsView`
 * тягнемо `next/dynamic` (без SSR): головна не несе сотні КБ JS, які
 * не потрібні до першого кліка користувача.
 */
const CartView = dynamic(() => import('./components/CartView'), { ssr: false })
const ProfileView = dynamic(() => import('./components/ProfileView'), { ssr: false })

export default function HomeClient() {
  const router = useInstantRouter()
  const notificationsDrawer = useOptionalNotificationsDrawer()
  const [activeTab, setActiveTab] = useState(0)
  const hidePublicFooter = useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === 'undefined') return () => {}
      const handler = () => onStoreChange()
      window.addEventListener('wattaHomeFullPageOverlay', handler)
      return () => window.removeEventListener('wattaHomeFullPageOverlay', handler)
    },
    () => {
      if (typeof document === 'undefined') return false
      return (
        document.body.classList.contains('watta-home-admin-open') ||
        document.documentElement.classList.contains('watta-admin-active') ||
        Boolean(document.querySelector('.full-page-web--admin, .admin-shell-watta-web'))
      )
    },
    () => false,
  )

  const handleBootSplashEnded = useCallback(() => {
    markHomeScrollReady()
    if (readAppScrollTop() <= 20) {
      scrollEntireAppToTop({ force: true })
    }
  }, [])

  /** bfcache: показати контент без примусового scroll-to-top. */
  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) markHomeScrollReady()
    }
    window.addEventListener('pageshow', onPageShow)
    return () => window.removeEventListener('pageshow', onPageShow)
  }, [])

  useLayoutEffect(() => {
    markHomeScrollReady()
  }, [])

  const handleSwitchTab = useCallback((tab: number) => {
    if (tab === 1) {
      router.push('/cart')
      return
    }
    if (tab >= 0 && tab <= 2) {
      setActiveTab(tab)
    }
  }, [router])

  /** Меню / кошик / профіль — зверху контейнера, щоб була видима початкова секція. */
  useLayoutEffect(() => {
    scrollEntireAppToTop({ force: true })
  }, [activeTab])

  const handleBack = useCallback(() => setActiveTab(0), [])
  const handleOpenProfile = useCallback(() => setActiveTab(2), [])
  const handleOpenFavorites = useCallback(() => router.push('/favorites'), [router])
  const handleOpenPhone = useCallback(() => {}, [])
  const handleOpenNotifications = useCallback(
    () => openWattaNotifications(router, notificationsDrawer?.open),
    [router, notificationsDrawer],
  )
  const handleMenuClick = useCallback(() => {}, [])
  const handleProfileBack = useCallback(() => setActiveTab(0), [])
  const handleOpenCart = useCallback(() => router.push('/cart'), [router])
  const handleSelectCategory = useCallback(() => setActiveTab(0), [])
  const handleOpenAdmin = useCallback(() => {}, [])

  /**
   * Тільки події: подія `storage` спрацьовує сама при зміні з іншої вкладки;
   * `switchTab` — наш кастомний CustomEvent. Жодного `setInterval` (раніше 400 ms
   * без потреби крутив `setState` на кожному кадрі).
   */
  useEffect(() => {
    if (typeof window === 'undefined') return

    const applySwitchTabFromStorage = () => {
      const tab = localStorage.getItem('switchToTab')
      if (tab === null) return
      const tabNumber = parseInt(tab, 10)
      if (!Number.isNaN(tabNumber) && tabNumber >= 0 && tabNumber <= 2) {
        handleSwitchTab(tabNumber)
        localStorage.removeItem('switchToTab')
      }
    }

    const handleSwitchTabEvent = (e: Event) => {
      const customEvent = e as CustomEvent<number>
      if (typeof customEvent.detail === 'number') {
        handleSwitchTab(customEvent.detail)
        localStorage.removeItem('switchToTab')
      }
    }

    window.addEventListener('switchTab', handleSwitchTabEvent)
    window.addEventListener('storage', applySwitchTabFromStorage)
    applySwitchTabFromStorage()

    return () => {
      window.removeEventListener('switchTab', handleSwitchTabEvent)
      window.removeEventListener('storage', applySwitchTabFromStorage)
    }
  }, [handleSwitchTab])

  return (
    <WattaBootSplashGate onEnded={handleBootSplashEnded}>
    <div className="app-web flex min-h-0 flex-1 flex-col" suppressHydrationWarning>
      <div className="content-web content-web--watta-craft flex min-h-0 flex-1 flex-col">
        {activeTab === 0 && <MenuView />}
        {activeTab === 1 && (
          <CartView
            onBack={handleBack}
            onOpenProfile={handleOpenProfile}
            onOpenFavorites={handleOpenFavorites}
            onOpenPhone={handleOpenPhone}
            onOpenNotifications={handleOpenNotifications}
            onMenuClick={handleMenuClick}
          />
        )}
        {activeTab === 2 && (
          <ProfileView
            onBack={handleProfileBack}
            onMenuClick={handleMenuClick}
            onOpenPhone={handleOpenPhone}
            onOpenNotifications={handleOpenNotifications}
            onOpenFavorites={handleOpenFavorites}
            onOpenCart={handleOpenCart}
            onSelectCategory={handleSelectCategory}
            onOpenAdmin={handleOpenAdmin}
          />
        )}
        {!hidePublicFooter && activeTab === 0 ? (
          <WattaInViewFadeDiv className="w-full shrink-0">
            <Footer />
          </WattaInViewFadeDiv>
        ) : !hidePublicFooter ? (
          <Footer />
        ) : null}
      </div>
    </div>
    </WattaBootSplashGate>
  )
}
