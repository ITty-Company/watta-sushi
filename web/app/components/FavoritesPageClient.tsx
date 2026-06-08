'use client'

import { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import { useInstantRouter } from '@/hooks/useInstantRouter'
import { useLanguage } from '../context/LanguageContext'
import { getAuthUrl, isUserLoggedIn } from '@/lib/authGate'
import { useMenuAddToCart } from '@/hooks/useMenuAddToCart'
import { useWattaCatalogSync } from '@/hooks/useWattaCatalogSync'
import {
  loadFavoriteProducts,
  readFavoriteIds,
  syncFavoritesAfterAuth,
} from '@/lib/favoritesStorage'
import { preloadFavoritesEmptyImages } from '@/lib/preloadFavoritesEmptyImages'
import { productGalleryFromApi } from '@/lib/productGallery'
import { MenuHighlightStack, type MenuHighlightStackItem } from './MenuHighlightStack'
import FavoritesEmptyState from './FavoritesEmptyState'
import type { WattaMenuProductCardModel } from './WattaMenuProductCard'

function FavoritesGridSkeleton() {
  return (
    <div className="px-6 pb-4 sm:px-8 sm:pb-5" aria-hidden>
      <div className="menu-highlight-stack-products favorites-page-products-grid mx-auto grid w-full grid-cols-1 items-stretch gap-3 sm:grid-cols-2 sm:gap-2.5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="favorites-grid-skeleton-card min-h-[220px] w-full animate-pulse rounded-[1.15rem] border border-[#145142]/10 bg-white/80"
          />
        ))}
      </div>
    </div>
  )
}

export default function FavoritesPageClient() {
  const router = useInstantRouter()
  const { t, getLocalized } = useLanguage()
  const cp = t.clientProfile
  const wf = t.productDetail.weightFallback
  const pf = t.productDetail.piecesFallback
  const [items, setItems] = useState<WattaMenuProductCardModel[]>([])
  const [loading, setLoading] = useState(() => {
    if (typeof window === 'undefined') return true
    if (!isUserLoggedIn()) return true
    return readFavoriteIds().length > 0
  })

  useLayoutEffect(() => {
    preloadFavoritesEmptyImages()
  }, [])

  const mapRawToCard = useCallback(
    (p: Record<string, unknown>): WattaMenuProductCardModel => ({
      id: Number(p.id),
      name: getLocalized(p as never, 'name'),
      description: getLocalized(p as never, 'description') || '',
      price: Number(p.price),
      emoji: '🍣',
      imageUrl: productGalleryFromApi(p)[0] || (typeof p.imageUrl === 'string' ? p.imageUrl : undefined),
      isTop: p.isPopular === true,
      promoDiscountPercent:
        typeof p.promoDiscountPercent === 'number'
          ? p.promoDiscountPercent
          : Number(p.promoDiscountPercent) || 0,
    }),
    [getLocalized],
  )

  const load = useCallback(async (fresh = false) => {
    const expectItems = readFavoriteIds().length > 0
    if (expectItems) setLoading(true)
    try {
      if (isUserLoggedIn()) {
        await syncFavoritesAfterAuth()
      }
      const list = await loadFavoriteProducts((p) => mapRawToCard(p), { fresh })
      setItems(list)
      return list
    } catch {
      setItems([])
      return [] as WattaMenuProductCardModel[]
    } finally {
      setLoading(false)
    }
  }, [mapRawToCard])

  useEffect(() => {
    if (!isUserLoggedIn()) {
      router.replace(getAuthUrl('/favorites'))
      return
    }
    if (readFavoriteIds().length === 0) {
      setLoading(false)
      void load(true)
      return
    }
    void load()
  }, [load, router])

  useWattaCatalogSync(() => void load(true), 'products')

  useEffect(() => {
    if (!isUserLoggedIn()) return
    const syncListFromStorage = () => {
      const favoriteIds = new Set(readFavoriteIds())
      setItems((prev) => prev.filter((item) => favoriteIds.has(item.id)))
    }
    const onUser = () => void load()
    window.addEventListener('favoritesUpdated', syncListFromStorage)
    window.addEventListener('userChanged', onUser)
    return () => {
      window.removeEventListener('favoritesUpdated', syncListFromStorage)
      window.removeEventListener('userChanged', onUser)
    }
  }, [load])

  const addToCart = useMenuAddToCart()

  const stackItems: MenuHighlightStackItem[] = items.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    price: item.price,
    emoji: item.emoji,
    imageUrl: item.imageUrl,
    isTop: item.isTop,
    promoDiscountPercent: item.promoDiscountPercent,
  }))

  const isEmpty = !loading && items.length === 0

  return (
    <div
      className={`menu-page-web watta-favorites-page relative flex w-full max-w-[100vw] min-w-0 flex-1 flex-col watta-page-bg${isEmpty ? ' watta-favorites-page--empty' : ' overflow-x-hidden'}`}
    >
      <div
        className={`watta-favorites-page__content relative z-[1] w-full min-w-0${isEmpty ? ' watta-favorites-page__content--empty' : ''}`}
      >
        {loading ? (
          <FavoritesGridSkeleton />
        ) : items.length === 0 ? (
          <FavoritesEmptyState
            title={cp.favEmpty}
            subtitle={cp.favEmptyHint}
            ctaLabel={cp.favToMenu}
          />
        ) : (
          <MenuHighlightStack
            title={cp.favoritesTitle}
            ariaLabel={cp.favoritesTitle}
            items={stackItems}
            weightFallback={wf}
            piecesFallback={pf}
            onAddToCart={addToCart}
            layout="stack"
            productsGridClassName="favorites-page-products-grid"
            suppressHeading
          />
        )}
      </div>
    </div>
  )
}
