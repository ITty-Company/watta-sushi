'use client'

import { useState, useEffect, useCallback } from 'react'
import MenuView from './components/MenuView'
import CartView from './components/CartView'
import ProfileView from './components/ProfileView'
import Footer from './components/Footer'

export default function HomeClient() {
  const [activeTab, setActiveTab] = useState(0)

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
    const intervalId = setInterval(handleStorageChange, 25)
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('cartUpdated', handleCartUpdate)
        window.removeEventListener('switchTab', handleSwitchTabEvent)
        window.removeEventListener('storage', handleStorageChange)
      }
      clearInterval(intervalId)
    }
  }, [handleSwitchTab])

  return (
    <div className="app-web" suppressHydrationWarning>
      <div className="content-web">
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
        <Footer />
      </div>
    </div>
  )
}
