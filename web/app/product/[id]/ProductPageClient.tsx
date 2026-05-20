'use client'

import { useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import ProductView from '../../components/ProductView'
import { readIsAdminFromCurrentUserJson } from '@/lib/isAdminRole'
import {
  normalizeProductRouteId,
  warmupProductDetail,
  writeProductDetailCache,
} from '@/lib/fetchProductById'
import {
  ensureIngredientsCatalog,
  seedIngredientsCatalog,
  type CatalogIngredient,
} from '@/lib/wattaIngredientsCatalog'
import { getAuthUrl, isUserLoggedIn } from '@/lib/authGate'

type ProductPageClientProps = {
  productId: string
  initialProduct: Record<string, unknown> | null
  initialIngredientsCatalog: CatalogIngredient[]
}

export default function ProductPageClient({
  productId: productIdProp,
  initialProduct,
  initialIngredientsCatalog,
}: ProductPageClientProps) {
  const router = useRouter()
  const params = useParams()
  const productId = useMemo(() => {
    const id = normalizeProductRouteId(params?.id)
    return id != null ? String(id) : productIdProp
  }, [params?.id, productIdProp])
  const [isAdmin, setIsAdmin] = useState(false)

  useLayoutEffect(() => {
    if (initialIngredientsCatalog.length > 0) {
      seedIngredientsCatalog(initialIngredientsCatalog)
    }
    if (initialProduct) {
      writeProductDetailCache(initialProduct)
    }
  }, [initialProduct, initialIngredientsCatalog])

  useEffect(() => {
    const sync = () => setIsAdmin(readIsAdminFromCurrentUserJson(localStorage.getItem('currentUser')))
    sync()
    window.addEventListener('userChanged', sync)
    return () => window.removeEventListener('userChanged', sync)
  }, [])

  useLayoutEffect(() => {
    const id = normalizeProductRouteId(params?.id ?? productIdProp)
    if (!id) return
    void ensureIngredientsCatalog()
    void warmupProductDetail(id)
  }, [params?.id, productIdProp])

  const handleBack = () => router.back()
  const handleProfile = () =>
    router.push(isUserLoggedIn() ? '/profile' : getAuthUrl('/profile'))
  const handleFavorites = () =>
    router.push(isUserLoggedIn() ? '/favorites' : getAuthUrl('/favorites'))
  const handleNotifications = () => router.push('/notifications')
  const handleMenu = () => router.push('/menu')
  const handleCart = () => router.push(isUserLoggedIn() ? '/cart' : getAuthUrl('/cart'))
  const handlePhone = () => {
    window.location.href = 'tel:+31649326549'
  }

  return (
    <ProductView
      productId={productId}
      isAdmin={isAdmin}
      initialProductRow={initialProduct}
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
