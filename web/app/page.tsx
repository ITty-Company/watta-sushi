'use client'

import { useState, useEffect, useCallback } from 'react'
import MenuView from './components/MenuView'
import CartView from './components/CartView'
import ProfileView from './components/ProfileView'

export default function Home() {
  const [activeTab, setActiveTab] = useState(0)
  
  // Стабильная функция для переключения вкладок
  const handleSwitchTab = useCallback((tab: number) => {
    if (tab >= 0 && tab <= 2) {
      setActiveTab(tab)
    }
  }, [])

  // Функции для навигации в CartView
  const handleBack = useCallback(() => {
    setActiveTab(0)
  }, [])

  const handleOpenProfile = useCallback(() => {
    setActiveTab(2)
  }, [])

  const handleOpenFavorites = useCallback(() => {
    setActiveTab(2)
  }, [])

  const handleOpenPhone = useCallback(() => {
    // Можно добавить логику для открытия страницы телефона
  }, [])

  const handleOpenNotifications = useCallback(() => {
    // Можно добавить логику для открытия уведомлений
  }, [])

  const handleMenuClick = useCallback(() => {
    // Можно добавить логику для открытия меню
  }, [])

  // Функции для навигации в ProfileView
  const handleProfileBack = useCallback(() => {
    setActiveTab(0)
  }, [])

  const handleOpenCart = useCallback(() => {
    setActiveTab(1)
  }, [])

  const handleSelectCategory = useCallback((key: string) => {
    setActiveTab(0)
    // Можно добавить логику для выбора категории
  }, [])

  const handleOpenAdmin = useCallback(() => {
    // Можно добавить логику для открытия админ-панели
  }, [])

  useEffect(() => {
    // Проверяем, что мы на клиенте
    if (typeof window === 'undefined') return

    const handleCartUpdate = () => {
      // Можно добавить уведомление или обновление счетчика
    }
    window.addEventListener('cartUpdated', handleCartUpdate)
    
    const handleSwitchTabEvent = (e: Event) => {
      const customEvent = e as CustomEvent<number>
      if (customEvent.detail !== undefined && typeof customEvent.detail === 'number') {
        handleSwitchTab(customEvent.detail)
        // Также очищаем localStorage для синхронизации
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.removeItem('switchToTab')
        }
      }
    }
    window.addEventListener('switchTab', handleSwitchTabEvent)
    
    // Также слушаем изменения в localStorage
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
    
    // Проверяем при загрузке
    handleStorageChange()
    
    // Polling для проверки изменений в localStorage (так как storage event не срабатывает в том же окне)
    const intervalId = setInterval(() => {
      handleStorageChange()
    }, 25)
    
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
      </div>
    </div>
  )
}
