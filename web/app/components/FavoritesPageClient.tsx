'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Heart, UtensilsCrossed } from 'lucide-react'
import toast from 'react-hot-toast'
import { useLanguage } from '../context/LanguageContext'
import { loadFavoriteProducts } from '@/lib/favoritesStorage'
import WattaSiteStickyChrome from './WattaSiteStickyChrome'
import { MenuHighlightStack, type MenuHighlightStackItem } from './MenuHighlightStack'
import type { WattaMenuProductCardModel } from './WattaMenuProductCard'

function FavoritesGridSkeleton() {
  return (
    <div className="px-6 pb-4 sm:px-8 sm:pb-5" aria-hidden>
      <div className="menu-highlight-stack-products favorites-page-products-grid mx-auto grid w-full grid-cols-1 items-start gap-3 sm:grid-cols-2 sm:gap-2.5">
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
  const { t, getLocalized, language } = useLanguage()
  const cp = t.clientProfile
  const wf = t.productDetail.weightFallback
  const pf = t.productDetail.piecesFallback
  const [items, setItems] = useState<WattaMenuProductCardModel[]>([])
  const [loading, setLoading] = useState(true)

  const mapRawToCard = useCallback(
    (p: Record<string, unknown>): WattaMenuProductCardModel => ({
      id: Number(p.id),
      name: getLocalized(p as never, 'name'),
      description: getLocalized(p as never, 'description') || '',
      price: Number(p.price),
      emoji: '🍣',
      imageUrl: typeof p.imageUrl === 'string' ? p.imageUrl : undefined,
      isTop: p.isPopular === true,
      promoDiscountPercent:
        typeof p.promoDiscountPercent === 'number'
          ? p.promoDiscountPercent
          : Number(p.promoDiscountPercent) || 0,
    }),
    [getLocalized],
  )

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const list = await loadFavoriteProducts((p) => mapRawToCard(p))
      setItems(list)
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [mapRawToCard])

  useEffect(() => {
    void load()
  }, [load, language])

  useEffect(() => {
    const onFav = () => void load()
    const onUser = () => void load()
    window.addEventListener('favoritesUpdated', onFav)
    window.addEventListener('userChanged', onUser)
    return () => {
      window.removeEventListener('favoritesUpdated', onFav)
      window.removeEventListener('userChanged', onUser)
    }
  }, [load])

  const addToCart = (item: MenuHighlightStackItem | WattaMenuProductCardModel) => {
    if (typeof window === 'undefined' || !window.localStorage) return
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    const n = cart.filter((x: { id?: number }) => x?.id === item.id).length
    if (n >= 99) {
      toast.error(t.appToasts.maxCartQty)
      return
    }
    cart.push({
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      category: '',
      emoji: item.emoji ?? '🍣',
      imageUrl: item.imageUrl,
      promoDiscountPercent: item.promoDiscountPercent,
    })
    localStorage.setItem('cart', JSON.stringify(cart))
    window.dispatchEvent(new CustomEvent('cartUpdated'))
    toast.success(t.addToCart)
  }

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

  return (
    <div className="menu-page-web watta-favorites-page relative flex w-full max-w-[100vw] min-w-0 shrink-0 flex-col overflow-x-hidden watta-page-bg">
      <WattaSiteStickyChrome flowHeightFudgePx={4} />
      <div className="menu-content-top-gap-web w-full shrink-0 bg-transparent" aria-hidden />

      <div className="watta-favorites-page__content relative z-[1] w-full min-w-0">
        {loading ? (
          <FavoritesGridSkeleton />
        ) : items.length === 0 ? (
          <div className="mx-auto flex max-w-lg flex-col items-center justify-center px-6 py-16 text-center sm:py-24">
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-rose-50 to-[#145142]/[0.06] text-rose-400/70">
              <Heart className="h-9 w-9" strokeWidth={1.5} />
            </div>
            <h1 className="home-after-hero-intro-title-web text-[clamp(1.5rem,4vw,2.25rem)] font-semibold leading-[1.12] tracking-[-0.02em] text-[#0f2a22]">
              {cp.favoritesTitle}
            </h1>
            <p className="home-after-hero-intro-body-web mt-3 text-sm leading-relaxed text-[#145142]/88 sm:text-base">
              {cp.favEmpty}
            </p>
            <p className="mt-2 max-w-sm text-sm text-[#145142]/60">{cp.favEmptyHint}</p>
            <Link
              href="/menu"
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#145142] px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#145142]/20 transition hover:bg-[#0f3d32]"
            >
              <UtensilsCrossed className="h-4 w-4" strokeWidth={2.2} aria-hidden />
              {cp.favToMenu}
            </Link>
          </div>
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
