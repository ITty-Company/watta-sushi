'use client'

import React from 'react'
import { useRouter, useParams } from 'next/navigation'
import ProductView from '../../components/ProductView'

export default function ProductPage() {
  const router = useRouter()
  const params = useParams()
  
  // Проверяем админа (упрощенно)
  const isAdmin = typeof window !== 'undefined' && localStorage.getItem('isAdmin') === 'true'

  // Функции навигации
  const handleBack = () => router.back()
  const handleProfile = () => router.push('/profile')
  const handleFavorites = () => router.push('/favorites')
  const handleNotifications = () => router.push('/notifications')
  const handleMenu = () => router.push('/menu')
  const handleCart = () => router.push('/cart')
  const handlePhone = () => window.location.href = 'tel:+380930000000'

  return (
    <ProductView 
      productId={params.id as string}
      isAdmin={isAdmin}
      
      onBack={handleBack}
      onOpenProfile={handleProfile}
      onOpenFavorites={handleFavorites}
      onOpenNotifications={handleNotifications}
      onMenuClick={handleMenu}
      onCartClick={handleCart}
      onOpenPhone={handlePhone}
    />
  )
}