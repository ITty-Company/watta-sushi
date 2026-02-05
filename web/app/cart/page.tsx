'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import CartView from '../components/CartView' 

export default function CartPage() {
  const router = useRouter()

  // Функции навигации для Хедера
  const handleProfile = () => router.push('/profile')
  const handleFavorites = () => router.push('/favorites')
  const handleNotifications = () => router.push('/notifications')
  const handleMenu = () => router.push('/menu')
  const handlePhone = () => window.location.href = 'tel:+380930000000' // Ваш номер

  return (
    <CartView 
      onBack={() => router.back()} 
      
      // Передаем недостающие функции:
      onOpenProfile={handleProfile}
      onOpenFavorites={handleFavorites}
      onOpenNotifications={handleNotifications}
      onMenuClick={handleMenu}
      onOpenPhone={handlePhone}
    />
  )
}