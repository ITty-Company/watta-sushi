'use client'

import { useState, useEffect, useCallback } from 'react'
import MenuView from './components/MenuView'
import CartView from './components/CartView'
import ProfileView from './components/ProfileView'
import { LanguageProvider } from './context/LanguageContext'

export default function Home() {
  const [activeTab, setActiveTab] = useState(0)
  
  // Стабильная функция для переключения вкладок
  const handleSwitchTab = useCallback((tab: number) => {
    if (tab >= 0 && tab <= 2) {
      setActiveTab(tab)
    }
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
    <LanguageProvider>
      <div className="app-web">
        <div className="content-web">
        {activeTab === 0 && <MenuView />}
        {activeTab === 1 && <CartView />}
          {activeTab === 2 && <ProfileView onSwitchTab={handleSwitchTab} />}
      </div>
    </div>
    </LanguageProvider>
  )
}
