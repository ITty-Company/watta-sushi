'use client'

import React from 'react'
import { useInstantRouter } from '@/hooks/useInstantRouter'
import CartView from '../components/CartView'
import { getAuthUrl, isUserLoggedIn } from '@/lib/authGate'

export default function CartPage() {
  const router = useInstantRouter()

  const handleProfile = () =>
    router.push(isUserLoggedIn() ? '/profile' : getAuthUrl('/profile'))
  const handleFavorites = () =>
    router.push(isUserLoggedIn() ? '/favorites' : getAuthUrl('/favorites'))
  const handleNotifications = () => router.push('/notifications')
  const handleMenu = () => router.push('/menu')
  const handlePhone = () => window.location.href = 'tel:+31649326549' // Ваш номер

  return (
    <>
      <CartView 
        onBack={() => router.back()} 
        
        // Передаем недостающие функции:
        onOpenProfile={handleProfile}
        onOpenFavorites={handleFavorites}
        onOpenNotifications={handleNotifications}
        onMenuClick={handleMenu}
        onOpenPhone={handlePhone}
      />
    </>
  )
}