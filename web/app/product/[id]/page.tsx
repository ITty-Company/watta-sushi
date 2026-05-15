'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import ProductView from '../../components/ProductView'
import { readIsAdminFromCurrentUserJson } from '@/lib/isAdminRole'

export default function ProductPage() {
  const router = useRouter()
  const params = useParams()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const sync = () => setIsAdmin(readIsAdminFromCurrentUserJson(localStorage.getItem('currentUser')))
    sync()
    window.addEventListener('userChanged', sync)
    return () => window.removeEventListener('userChanged', sync)
  }, [])

  // Функции навигации
  const handleBack = () => router.back()
  const handleProfile = () => router.push('/profile')
  const handleFavorites = () => router.push('/favorites')
  const handleNotifications = () => router.push('/notifications')
  const handleMenu = () => router.push('/menu')
  const handleCart = () => router.push('/cart')
  const handlePhone = () => window.location.href = 'tel:+31649326549'

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