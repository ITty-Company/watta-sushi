'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Phone, Bell, Heart, ShoppingBag, User, Menu } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useOptionalRightNavDrawer } from '../context/RightNavDrawerContext'
import { promoCoverUrl, promoGalleryUrls, promoProductOffersCount, promoTpl } from '@/app/lib/promoDisplay'
import {
  getClientFallbackPromotions,
} from '@/app/lib/demoPromotionsFallback'
// @ts-ignore
import LogoBackground from './LogoBackground'

const READ_LINK = '#27AE60'

interface PromotionsViewProps {
  /** Усередині MenuView: та сама шапка + категорії, без дубльованого хедера */
  embedded?: boolean
  onBack: () => void
  onMenuClick: () => void
  onOpenPhone?: () => void
  onOpenNotifications?: () => void
  onOpenFavorites?: () => void
  onOpenProfile?: () => void
  onOpenDetail: (id: number) => void
}

function formatListDate(iso: string | undefined, lang: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  if (lang === 'en') {
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }
  if (lang === 'nl') {
    return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })
  }
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const y = d.getFullYear()
  return `${day}.${month}.${y}`
}

export default function PromotionsView({
  embedded = false,
  onBack,
  onMenuClick,
  onOpenPhone,
  onOpenNotifications,
  onOpenFavorites,
  onOpenProfile,
  onOpenDetail,
}: PromotionsViewProps) {
  const { t, language } = useLanguage()
  const rightNavDrawer = useOptionalRightNavDrawer()
  const [promotions, setPromotions] = useState<any[]>([])
  const [loaded, setLoaded] = useState(false)
  const p = t.promotionsPage
  const a = t.siteAria

  useEffect(() => {
    fetch('/api/promotions')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setPromotions(data)
      })
      .catch((e) => console.error(e))
      .finally(() => setLoaded(true))
  }, [])

  const displayPromos = useMemo(() => {
    if (promotions.length > 0) return promotions
    return getClientFallbackPromotions(language)
  }, [promotions, language])

  const showingFallback = loaded && promotions.length === 0

  const handleGlobalNavMenu = () => {
    if (rightNavDrawer?.enabled) rightNavDrawer.open()
    else onMenuClick()
  }

  const Header = () => (
    <div className="absolute top-4 left-0 right-0 z-[1000] mx-auto flex h-[80px] w-[95%] max-w-[1800px] items-center justify-between rounded-[20px] bg-white px-6 shadow-lg">
      <button type="button" className="flex cursor-pointer items-center gap-2" onClick={onBack}>
        <img src="/logo.png" alt="" className="h-10 w-10 object-contain" />
        <img src="/1.jpg" alt={t.common.brandName} className="hidden h-6 w-auto object-contain sm:block" />
      </button>
      <div className="flex items-center gap-3 text-gray-700 md:gap-6">
        <button type="button" onClick={onOpenPhone} className="rounded-full p-2 hover:bg-gray-100" aria-label={a.phone}>
          <Phone size={24} />
        </button>
        {onOpenNotifications ? (
          <button
            type="button"
            onClick={onOpenNotifications}
            className="rounded-full p-2 text-[#FF5C00] transition hover:bg-orange-50"
            aria-label={t.notifications.title}
          >
            <Bell size={24} strokeWidth={2.25} />
          </button>
        ) : null}
        <button type="button" onClick={onOpenFavorites} className="hidden rounded-full p-2 hover:bg-gray-100 sm:inline-flex" aria-label={a.favorites}>
          <Heart size={24} />
        </button>
        <button type="button" className="hidden rounded-full p-2 text-[#145142] sm:inline-flex" aria-label={a.cart}>
          <ShoppingBag size={24} />
        </button>
        <button type="button" onClick={onOpenProfile} className="rounded-full p-2 hover:bg-gray-100" aria-label={a.profile}>
          <User size={24} />
        </button>
        <button type="button" onClick={handleGlobalNavMenu} className="rounded-full p-2 hover:bg-gray-100" aria-label={a.menu}>
          <Menu size={24} />
        </button>
      </div>
    </div>
  )

  return (
    <div
      className={
        embedded
          ? 'relative w-full px-4 pb-12 pt-2 sm:px-6 watta-page-bg'
          : 'menu-page-web watta-page-bg relative min-h-screen px-4 pb-20 pt-[120px]'
      }
    >
      {!embedded ? (
        <>
          <div className="pointer-events-none absolute inset-0 z-0 opacity-[0.12]">
            <LogoBackground />
          </div>
          <Header />
        </>
      ) : null}
      <div className="relative z-20 mx-auto mb-6 flex w-full max-w-[1800px] justify-start px-2">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-bold text-gray-800 shadow-sm transition hover:bg-gray-50"
        >
          <ArrowLeft size={20} /> {t.auth.back}
        </button>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1440px] px-2">
        <h1
          className="mb-6 text-3xl font-black tracking-tight text-gray-900 sm:mb-8 sm:text-4xl md:text-5xl lg:text-6xl"
          style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
        >
          {p.listHeading}
        </h1>

        {showingFallback ? (
          <p className="mb-8 max-w-3xl text-sm leading-relaxed text-gray-600 sm:text-base">{p.fallbackHint}</p>
        ) : null}

        {!loaded ? (
          <p className="py-16 text-center font-semibold text-gray-500">{p.loading}</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-7 lg:grid-cols-3 xl:grid-cols-4">
            {displayPromos.map((promo) => {
              const cover = promoCoverUrl(promo)
              const galleryCount = promoGalleryUrls(promo).length
              const offers = promoProductOffersCount(promo.productOffers)
              const category =
                typeof promo.categoryLabel === 'string' && promo.categoryLabel
                  ? promo.categoryLabel
                  : p.defaultCategoryTag
              const dateStr =
                typeof promo.displayDate === 'string' && promo.displayDate
                  ? promo.displayDate
                  : formatListDate(promo.createdAt, language)

              return (
                <article
                  key={promo.id}
                  className="flex flex-col overflow-hidden rounded-[22px] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.06)] transition hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)]"
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-gray-100">
                    {cover ? (
                      <img src={cover} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-gray-400">{p.noPhoto}</div>
                    )}
                    {galleryCount > 1 && (
                      <span className="absolute bottom-3 left-3 rounded-lg bg-black/55 px-2 py-1 text-xs font-bold text-white">
                        {promoTpl(p.morePhotosBadge, { count: galleryCount - 1 })}
                      </span>
                    )}
                    {offers > 0 && (
                      <span className="absolute bottom-3 right-3 rounded-lg bg-[#155044] px-2 py-1 text-xs font-bold text-white">
                        {promoTpl(p.offersBadge, { count: offers })}
                      </span>
                    )}
                    {promo.isHit && (
                      <div
                        className="absolute right-3 top-3 flex items-center justify-center shadow-md"
                        style={{
                          minWidth: '88px',
                          height: '36px',
                          borderRadius: '12px',
                          background: '#155044',
                          color: '#FFF',
                          fontSize: '14px',
                          fontWeight: 700,
                          padding: '0 12px',
                        }}
                      >
                        {p.hitBadge}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col p-5 sm:p-6">
                    <div className="mb-3 flex items-center justify-between gap-2 text-xs sm:text-sm">
                      <span className="max-w-[65%] truncate rounded-full bg-gray-100 px-3 py-1 font-semibold text-gray-600">
                        {category}
                      </span>
                      <time className="shrink-0 font-medium text-gray-400">{dateStr}</time>
                    </div>
                    <h2 className="line-clamp-3 text-lg font-black leading-snug text-gray-900 sm:text-xl">{promo.title}</h2>
                    <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-gray-500">{promo.description}</p>
                    <button
                      type="button"
                      onClick={() => onOpenDetail(promo.id)}
                      className="mt-4 self-start text-sm font-bold transition hover:opacity-80"
                      style={{ color: READ_LINK }}
                    >
                      {p.readCta}
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
