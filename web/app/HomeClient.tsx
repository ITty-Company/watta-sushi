'use client'

import { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react'
import CartView from './components/CartView'
import ProfileView from './components/ProfileView'
import MenuView from './components/MenuView'
import { NotificationsView } from './components/NotificationsView'
import WattaLoadScreen from './components/WattaLoadScreen'
import { scrollEntireAppToTop } from '@/lib/menuScroll'
import { useLanguage } from './context/LanguageContext'
import { useRouter } from 'next/navigation'

const MIN_BOOT_SPLASH_MS = 1650
/** Якщо прогрес-бар застряг (таймери/замикання), не залишаємо користувача на білому екрані */
const BOOT_SPLASH_FAILSAFE_MS = 12_000

export default function HomeClient() {
  const { t } = useLanguage()
  const router = useRouter()
  /** Після commit на клієнті; ref — щоб інтервал не читав застаріле замикання `clientReady` */
  const clientReadyRef = useRef(false)
  const [bootProgress, setBootProgress] = useState(0)
  const [showBootSplash, setShowBootSplash] = useState(true)
  const [activeTab, setActiveTab] = useState(0)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const bootStartedAtRef = useRef<number | null>(null)

  useLayoutEffect(() => {
    bootStartedAtRef.current = Date.now()
    clientReadyRef.current = true
  }, [])

  /** Під час білого сплешу — не показувати глобальні FAB (Instagram тощо) з AppClient */
  useLayoutEffect(() => {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    if (showBootSplash) {
      root.setAttribute('data-watta-boot-splash', '1')
    } else {
      root.removeAttribute('data-watta-boot-splash')
    }
    return () => {
      root.removeAttribute('data-watta-boot-splash')
    }
  }, [showBootSplash])

  /** Полоса до 100%; після reload на проді даємо мінімальний час, щоб сплеш завжди був помітний */
  useEffect(() => {
    if (!showBootSplash) return
    const id = window.setInterval(() => {
      setBootProgress((prev) => {
        if (prev >= 100) return 100

        const ready = clientReadyRef.current
        const cap = ready ? 100 : 78
        const step = ready ? 5.5 : 0.55
        let next = prev + step
        if (!ready) next = Math.min(cap, next)
        else next = Math.min(100, next)

        if (next >= 100) {
          clearInterval(id)
          const started = bootStartedAtRef.current ?? Date.now()
          const minUntil = started + MIN_BOOT_SPLASH_MS
          const extra = Math.max(520, minUntil - Date.now() + 480)
          window.setTimeout(() => setShowBootSplash(false), extra)
          return 100
        }
        return next
      })
    }, 36)
    return () => clearInterval(id)
  }, [showBootSplash])

  /** Якщо щось пішло не так з інтервалом/гідратацією — показуємо меню */
  useEffect(() => {
    if (!showBootSplash) return
    const fail = window.setTimeout(() => {
      setShowBootSplash(false)
      setBootProgress(100)
    }, BOOT_SPLASH_FAILSAFE_MS)
    return () => clearTimeout(fail)
  }, [showBootSplash])

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
    if (showBootSplash) return
    scrollEntireAppToTop()
  }, [activeTab, showBootSplash])

  const handleBack = useCallback(() => setActiveTab(0), [])
  const handleOpenProfile = useCallback(() => setActiveTab(2), [])
  const handleOpenFavorites = useCallback(() => setActiveTab(2), [])
  const handleOpenPhone = useCallback(() => {}, [])
  const handleOpenNotifications = useCallback(() => setNotificationsOpen(true), [])
  const handleMenuClick = useCallback(() => {}, [])
  const handleProfileBack = useCallback(() => setActiveTab(0), [])
  const handleOpenCart = useCallback(() => router.push('/cart'), [router])
  const handleSelectCategory = useCallback(() => setActiveTab(0), [])
  const handleOpenAdmin = useCallback(() => {}, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const handleCartUpdate = () => {}
    window.addEventListener('cartUpdated', handleCartUpdate)
    const handleSwitchTabEvent = (e: Event) => {
      const customEvent = e as CustomEvent<number>
      if (customEvent.detail !== undefined && typeof customEvent.detail === 'number') {
        handleSwitchTab(customEvent.detail)
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.removeItem('switchToTab')
        }
      }
    }
    window.addEventListener('switchTab', handleSwitchTabEvent)
    const handleStorageChange = () => {
      if (typeof window !== 'undefined' && window.localStorage) {
        const tab = localStorage.getItem('switchToTab')
        if (tab !== null) {
          const tabNumber = parseInt(tab)
          if (!isNaN(tabNumber) && tabNumber >= 0 && tabNumber <= 2) {
            handleSwitchTab(tabNumber)
            localStorage.removeItem('switchToTab')
          }
        }
      }
    }
    window.addEventListener('storage', handleStorageChange)
    handleStorageChange()
    const intervalId = setInterval(handleStorageChange, 400)
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('cartUpdated', handleCartUpdate)
        window.removeEventListener('switchTab', handleSwitchTabEvent)
        window.removeEventListener('storage', handleStorageChange)
      }
      clearInterval(intervalId)
    }
  }, [handleSwitchTab])

  if (showBootSplash) {
    return (
      <div className="app-web min-h-[100dvh] watta-page-bg" suppressHydrationWarning>
        <div className="content-web content-web--watta-craft min-h-[100dvh] w-full max-w-[100vw] overflow-x-hidden">
          <WattaLoadScreen
            className="min-h-[100dvh]"
            progress={bootProgress}
            label={
              <>
                {t.siteAria.loading}
                <span className="watta-dot">.</span>
                <span className="watta-dot">.</span>
                <span className="watta-dot">.</span>
              </>
            }
          />
        </div>
      </div>
    )
  }

  return (
    <div className="app-web" suppressHydrationWarning>
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
  )
}
