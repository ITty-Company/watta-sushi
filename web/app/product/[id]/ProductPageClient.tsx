'use client'

import { useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { useInstantRouter } from '@/hooks/useInstantRouter'
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
import { openWattaCart } from '@/lib/openWattaCart'
import { openWattaNotifications } from '@/lib/openWattaNotifications'
import { useOptionalCartDrawer } from '../../context/CartDrawerContext'
import { useOptionalNotificationsDrawer } from '../../context/NotificationsDrawerContext'
import { resolveCatalogMediaUrl } from '@/lib/catalogMediaUrl'
import { productGalleryFromApi } from '@/lib/productGallery'
import { preloadImageUrls } from '@/lib/preloadImages'

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
  const router = useInstantRouter()
  const cartDrawer = useOptionalCartDrawer()
  const notificationsDrawer = useOptionalNotificationsDrawer()
  const params = useParams()
  const productId = useMemo(() => {
    const id = normalizeProductRouteId(params?.id)
    return id != null ? String(id) : productIdProp
  }, [params?.id, productIdProp])
  const [isAdmin, setIsAdmin] = useState(false)

  useLayoutEffect(() => {
    if (initialIngredientsCatalog.length > 0) {
      seedIngredientsCatalog(initialIngredientsCatalog)
      preloadImageUrls(
        initialIngredientsCatalog.map((ing) => resolveCatalogMediaUrl(ing.imageUrl)),
        { limit: 24, highPriorityCount: 16 },
      )
    }
    if (initialProduct) {
      writeProductDetailCache(initialProduct)
      const gallery = productGalleryFromApi(initialProduct)
        .map((u) => resolveCatalogMediaUrl(u) ?? u)
        .filter((u) => u.length > 0)
      preloadImageUrls(gallery, { limit: 8, highPriorityCount: 2 })
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
  const handleNotifications = () => openWattaNotifications(router, notificationsDrawer?.open)
  const handleMenu = () => router.push('/menu')
  const handleCart = () => openWattaCart(router, cartDrawer?.open)
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
