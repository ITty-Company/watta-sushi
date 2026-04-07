'use client'

import { useState, useEffect, useCallback } from 'react'
import CartView from './components/CartView'
import ProfileView from './components/ProfileView'
import MenuView from './components/MenuView'
import WattaLoadScreen from './components/WattaLoadScreen'

export default function HomeClient() {
  /** Після гідратації — уникнення mismatch (динамічні віджети / розширення / dev-оверлеї) */
  const [clientReady, setClientReady] = useState(false)
  const [bootProgress, setBootProgress] = useState(0)
  const [showBootSplash, setShowBootSplash] = useState(true)
  const [activeTab, setActiveTab] = useState(0)

  useEffect(() => {
    setClientReady(true)
  }, [])

  /** Полоса до 100%, потім коротка пауза — лише тоді показуємо застосунок */
  useEffect(() => {
    if (!showBootSplash) return
    const id = window.setInterval(() => {
      setBootProgress((prev) => {
        if (prev >= 100) return 100

        const cap = clientReady ? 100 : 78
        const step = clientReady ? 9 : 0.65
        let next = prev + step
        if (!clientReady) next = Math.min(cap, next)
        else next = Math.min(100, next)

        if (next >= 100) {
          clearInterval(id)
          window.setTimeout(() => setShowBootSplash(false), 520)
          return 100
        }
        return next
      })
    }, 36)
    return () => clearInterval(id)
  }, [showBootSplash, clientReady])

  const handleSwitchTab = useCallback((tab: number) => {
    if (tab >= 0 && tab <= 2) {
      setActiveTab(tab)
    }
  }, [])

  const handleBack = useCallback(() => setActiveTab(0), [])
  const handleOpenProfile = useCallback(() => setActiveTab(2), [])
  const handleOpenFavorites = useCallback(() => setActiveTab(2), [])
  const handleOpenPhone = useCallback(() => {}, [])
  const handleOpenNotifications = useCallback(() => {}, [])
  const handleMenuClick = useCallback(() => {}, [])
  const handleProfileBack = useCallback(() => setActiveTab(0), [])
  const handleOpenCart = useCallback(() => setActiveTab(1), [])
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
      <div className="app-web min-h-[100dvh] bg-white" suppressHydrationWarning>
        <div className="content-web content-web--watta-craft min-h-[100dvh] w-full max-w-[100vw] overflow-x-hidden">
          <WattaLoadScreen className="min-h-[100dvh]" progress={bootProgress} />
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
      </div>
    </div>
  )
}
