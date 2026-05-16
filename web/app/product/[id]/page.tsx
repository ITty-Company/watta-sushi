'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import ProductView from '../../components/ProductView'
import { readIsAdminFromCurrentUserJson } from '@/lib/isAdminRole'
import { normalizeProductRouteId } from '@/lib/fetchProductById'
import { getAuthUrl, isUserLoggedIn } from '@/lib/authGate'

export default function ProductPage() {
  const router = useRouter()
  const params = useParams()
  const productId = useMemo(() => {
    const id = normalizeProductRouteId(params?.id)
    return id != null ? String(id) : ''
  }, [params?.id])
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const sync = () => setIsAdmin(readIsAdminFromCurrentUserJson(localStorage.getItem('currentUser')))
    sync()
    window.addEventListener('userChanged', sync)
    return () => window.removeEventListener('userChanged', sync)
  }, [])

  // Функции навигации
  const handleBack = () => router.back()
  const handleProfile = () =>
    router.push(isUserLoggedIn() ? '/profile' : getAuthUrl('/profile'))
  const handleFavorites = () =>
    router.push(isUserLoggedIn() ? '/favorites' : getAuthUrl('/favorites'))
  const handleNotifications = () => router.push('/notifications')
  const handleMenu = () => router.push('/menu')
  const handleCart = () => router.push(isUserLoggedIn() ? '/cart' : getAuthUrl('/cart'))
  const handlePhone = () => window.location.href = 'tel:+31649326549'

  return (
    <ProductView 
      productId={productId}
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