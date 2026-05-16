'use client'

import { useState, useEffect, useLayoutEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import MenuView from './components/MenuView'
import WattaBootSplashGate from './components/WattaBootSplashGate'
import { scrollEntireAppToTop } from '@/lib/menuScroll'
import { kickWelcomeHeroVideoPlayBurst, kickWelcomeHeroVideoPlayOnce } from '@/lib/kickWelcomeHeroVideo'
import { useRouter } from 'next/navigation'

/**
 * Перший екран — лише `MenuView`. `CartView`/`ProfileView`/`NotificationsView`
 * тягнемо `next/dynamic` (без SSR): головна не несе сотні КБ JS, які
 * не потрібні до першого кліка користувача.
 */
const CartView = dynamic(() => import('./components/CartView'), { ssr: false })
const ProfileView = dynamic(() => import('./components/ProfileView'), { ssr: false })
/**
 * Named export → обовʼязково обертаємо в `{ default: ... }`. Без цього `next/dynamic`
 * (Next 14.2) інколи кидає `Unsupported Server Component type: undefined` після hot-reload.
 */
const NotificationsView = dynamic(
  () =>
    import('./components/NotificationsView').then((m) => ({
      default: m.NotificationsView,
    })),
  { ssr: false }
)

export default function HomeClient() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState(0)
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  /**
   * Гідратація + повернення з іншої сторінки (SPA-back / bfcache / pageshow).
   * Серія nudge: queueMicrotask + rAF + delays до 2s. Це окрема страховка від
   * `bindHeroVideoAutoplay` всередині `MenuView`: при mount після SPA-back браузер
   * інколи відкидає перший play() (autoplay-policy after navigation), і binding
   * сам не встигає підхопити video у paused-стані.
   */
  const handleBootSplashEnded = useCallback(() => {
    kickWelcomeHeroVideoPlayBurst()
  }, [])

  useEffect(() => {
    queueMicrotask(kickWelcomeHeroVideoPlayOnce)
    const raf = requestAnimationFrame(() => {
      kickWelcomeHeroVideoPlayOnce()
    })
    const cancelBurst = kickWelcomeHeroVideoPlayBurst()

    /* `popstate` — back/forward через історію браузера, `pageshow` — повернення з
       bfcache (Safari/Firefox). Обидва зазвичай лишають hero у paused-стані. */
    const onPopState = () => {
      kickWelcomeHeroVideoPlayBurst()
    }
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        /* bfcache restore — найчастіше autoplay блокований до user-gesture */
        kickWelcomeHeroVideoPlayBurst()
      } else {
        kickWelcomeHeroVideoPlayOnce()
      }
    }
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        kickWelcomeHeroVideoPlayOnce()
      }
    }

    window.addEventListener('popstate', onPopState)
    window.addEventListener('pageshow', onPageShow)
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      cancelAnimationFrame(raf)
      cancelBurst()
      window.removeEventListener('popstate', onPopState)
      window.removeEventListener('pageshow', onPageShow)
      document.removeEventListener('visibilitychange', onVisible)
    }
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
    scrollEntireAppToTop()
  }, [activeTab])

  const handleBack = useCallback(() => setActiveTab(0), [])
  const handleOpenProfile = useCallback(() => setActiveTab(2), [])
  const handleOpenFavorites = useCallback(() => router.push('/favorites'), [router])
  const handleOpenPhone = useCallback(() => {}, [])
  const handleOpenNotifications = useCallback(() => setNotificationsOpen(true), [])
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
    <div className="app-web min-h-0 flex-1" suppressHydrationWarning>
      <div className="content-web content-web--watta-craft">
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
        {activeTab !== 0 ? (
          <NotificationsView isOpen={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
        ) : null}
      </div>
    </div>
    </WattaBootSplashGate>
  )
}
