'use client'

import React, { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import { ArrowLeft, Phone, Bell, Heart, ShoppingBag, User, Menu } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useOptionalRightNavDrawer } from '../context/RightNavDrawerContext'
import { promoGalleryUrls, promoTpl } from '@/app/lib/promoDisplay'
// @ts-ignore
import LogoBackground from './LogoBackground'
import { WattaMenuProductCard } from './WattaMenuProductCard'
import { getClientFallbackPromotionById, isClientFallbackPromoId } from '@/app/lib/demoPromotionsFallback'

interface OfferProduct {
  id: number
  name_ru: string
  name_ua?: string | null
  name_en?: string | null
  name_nl?: string | null
  description_ru?: string | null
  description_ua?: string | null
  description_en?: string | null
  description_nl?: string | null
  price: number
  imageUrl?: string | null
  offerDiscountPercent?: number
  category?: { name_ru?: string }
}

interface PromotionsDetailViewProps {
  id: number
  onBack: () => void
  onMenuClick: () => void
  onOpenPhone?: () => void
  onOpenNotifications?: () => void
  onOpenFavorites?: () => void
  onOpenProfile?: () => void
}

export default function PromotionsDetailView({
  id,
  onBack,
  onMenuClick,
  onOpenPhone,
  onOpenNotifications,
  onOpenFavorites,
  onOpenProfile
}: PromotionsDetailViewProps) {
  const { t, getLocalized, language } = useLanguage()
  const rightNavDrawer = useOptionalRightNavDrawer()
  const p = t.promotionsPage
  const [promo, setPromo] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isClientFallbackPromoId(id)) {
      const local = getClientFallbackPromotionById(id, language)
      setPromo(local)
      setLoading(false)
      return
    }
    fetch(`/api/promotions/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setPromo(data)
        setLoading(false)
      })
      .catch((e) => {
        console.error(e)
        setLoading(false)
      })
  }, [id, language])

  const handleGlobalNavMenu = () => {
    if (rightNavDrawer?.enabled) rightNavDrawer.open()
    else onMenuClick()
  }

  const Header = () => (
    <div className="absolute top-4 left-0 right-0 w-[95%] max-w-[1800px] h-[80px] mx-auto bg-white rounded-[20px] shadow-lg flex items-center justify-between px-4 sm:px-6 z-[1000]">
      <div className="flex items-center gap-2 cursor-pointer" onClick={onBack}>
        <img src="/logo.png" alt="Logo" className="h-10 w-10 object-contain" />
        <img src="/1.jpg" alt="Watta Sushi" className="h-6 w-auto object-contain hidden sm:block" />
      </div>
      <div className="flex items-center gap-2 sm:gap-3 md:gap-6 text-gray-700">
        <button type="button" onClick={onOpenPhone} className="hover:bg-gray-100 p-2 rounded-full" aria-label="Phone"><Phone size={22}/></button>
        {onOpenNotifications ? (
          <button
            type="button"
            onClick={onOpenNotifications}
            className="rounded-full p-2 text-[#FF5C00] transition hover:bg-orange-50"
            aria-label={t.notifications.title}
          >
            <Bell size={22} strokeWidth={2.25} />
          </button>
        ) : null}
        <button type="button" onClick={onOpenFavorites} className="hover:bg-gray-100 p-2 rounded-full hidden sm:inline-flex" aria-label="Favorites"><Heart size={22}/></button>
        <button type="button" className="hover:bg-gray-100 p-2 rounded-full text-[#145142] hidden sm:inline-flex" aria-label="Cart"><ShoppingBag size={22}/></button>
        <button type="button" onClick={onOpenProfile} className="hover:bg-gray-100 p-2 rounded-full" aria-label="Profile"><User size={22}/></button>
        <button type="button" onClick={handleGlobalNavMenu} className="hover:bg-gray-100 p-2 rounded-full" aria-label="Menu"><Menu size={22}/></button>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24 px-4 text-[#145142] font-semibold">
        {p.loading}
      </div>
    )
  }
  if (!promo || promo.error) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24 px-4 text-gray-600">
        {p.notFound}
      </div>
    )
  }

  const gallery = promoGalleryUrls(promo)
  const offerProducts: OfferProduct[] = Array.isArray(promo.offerProducts) ? promo.offerProducts : []

  const addOfferToCart = useCallback(
    (product: OfferProduct) => {
      if (typeof window === 'undefined' || !window.localStorage) return
      const pct = Math.min(100, Math.max(0, Math.round(Number(product.offerDiscountPercent) || 0)))
      const base = Number(product.price) || 0
      const deal = Math.round(base * (1 - pct / 100) * 100) / 100
      const name = getLocalized(product, 'name') || product.name_ru
      const desc = getLocalized(product, 'description') || product.description_ru || ''
      const cart = JSON.parse(localStorage.getItem('cart') || '[]')
      const n = cart.filter((x: { id?: number }) => x?.id === product.id).length
      if (n >= 99) {
        toast.error('Максимальна кількість товару — 99 шт.')
        return
      }
      cart.push({
        id: product.id,
        name,
        description: desc,
        price: pct > 0 && base > 0 ? deal : base,
        category: product.category?.name_ru || '',
        emoji: '🍣',
        imageUrl: product.imageUrl ?? undefined,
        promoDiscountPercent: 0,
      })
      localStorage.setItem('cart', JSON.stringify(cart))
      window.dispatchEvent(new CustomEvent('cartUpdated'))
      toast.success(t.addToCart)
    },
    [getLocalized, t.addToCart],
  )

  return (
    <div className="menu-page-web relative min-h-screen pt-[120px] pb-20 px-3 sm:px-4"
         style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.5), rgba(255,255,255,0.9)), url('/background.jpg')", backgroundRepeat: 'repeat', backgroundSize: '300px', backgroundAttachment: 'fixed' }}>
      <div className="absolute inset-0 pointer-events-none z-0 opacity-50"><LogoBackground /></div>
      <Header />
      
      <div className="w-full max-w-[1200px] mx-auto mb-6 px-1 sm:px-2 flex justify-start relative z-20">
         <button type="button" onClick={onBack} className="bg-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-[15px] flex items-center gap-2 text-[#145142] font-bold shadow-sm hover:bg-gray-50 transition text-sm sm:text-base">
           <ArrowLeft size={20} /> {t.auth.back}
         </button>
      </div>

      <article className="max-w-[1000px] mx-auto bg-white rounded-[24px] sm:rounded-[30px] shadow-lg overflow-hidden relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {gallery.length > 0 && (
          <div
            className="w-full border-b border-gray-100"
            aria-label={p.galleryAria}
          >
            <div
              className="flex gap-0 overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-thin"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {gallery.map((url, i) => (
                <div
                  key={`${url}-${i}`}
                  className="relative shrink-0 w-full min-w-full sm:min-w-[85%] sm:max-w-[85%] md:min-w-[70%] md:max-w-[70%] h-[220px] sm:h-[320px] md:h-[420px] snap-center"
                >
                  <img
                    src={url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  {promo.isHit && i === 0 && (
                    <div className="absolute top-4 right-4 bg-[#155044] text-white px-4 py-2 rounded-xl text-lg font-bold shadow-lg">
                      {p.hitBadge}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {gallery.length > 1 && (
              <p className="text-center text-xs text-gray-500 py-2 px-4">
                {gallery.length} · {p.galleryAria}
              </p>
            )}
          </div>
        )}

        <div className="p-6 sm:p-8 md:p-12">
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
            {promo.title}
          </h1>
          <div className="prose max-w-none text-gray-700 text-base sm:text-lg md:text-xl whitespace-pre-wrap leading-relaxed">
            {promo.content || promo.description}
          </div>

          {offerProducts.length > 0 && (
            <section className="mt-10 pt-8 border-t border-gray-100">
              <h2 className="text-xl sm:text-2xl font-bold text-[#155044] mb-4 sm:mb-6">
                {p.offersTitle}
              </h2>
              <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 sm:gap-5">
                {offerProducts.map((product) => {
                  const pct = Math.min(100, Math.max(0, Math.round(Number(product.offerDiscountPercent) || 0)))
                  const base = Number(product.price) || 0
                  const name = getLocalized(product, 'name') || product.name_ru
                  const desc = getLocalized(product, 'description') || product.description_ru || ''
                  return (
                    <li key={product.id}>
                      <WattaMenuProductCard
                        variant="grid"
                        product={{
                          id: product.id,
                          name,
                          description: desc,
                          price: base,
                          emoji: '🍣',
                          imageUrl: product.imageUrl ?? undefined,
                          isTop: false,
                          promoDiscountPercent: pct,
                        }}
                        onAddToCart={() => addOfferToCart(product)}
                      />
                    </li>
                  )
                })}
              </ul>
            </section>
          )}
        </div>
      </article>
    </div>
  )
}
