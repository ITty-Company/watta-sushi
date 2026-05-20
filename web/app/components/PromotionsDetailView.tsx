'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { addToCartWithAuthGate } from '@/lib/cartStorage'
import { ArrowLeft } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { promoGalleryUrls, promoTpl, type PromoListItem } from '@/app/lib/promoDisplay'
import { WattaMenuProductCard } from './WattaMenuProductCard'
import { getMenuCategoryDisplayName } from '@/lib/i18n/getMenuCategoryDisplayName'

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
  embedded?: boolean
  id: number
  onBack: () => void
  onMenuClick: () => void
  onOpenPhone?: () => void
  onOpenNotifications?: () => void
  onOpenFavorites?: () => void
  onOpenProfile?: () => void
}

function PromoDetailBackButton({ label, onBack, inline }: { label: string; onBack: () => void; inline?: boolean }) {
  return (
    <button
      type="button"
      onClick={onBack}
      className={`auth-watta-back-fab watta-promotions-back${inline ? ' watta-promotions-back--inline' : ''}`}
    >
      <span className="auth-watta-back-fab__icon" aria-hidden>
        <ArrowLeft className="auth-watta-back-fab__arrow" strokeWidth={2.5} />
      </span>
      <span className="auth-watta-back-fab__text">{label}</span>
    </button>
  )
}

function PromoDetailSkeleton() {
  return (
    <article className="watta-promo-detail-card watta-promo-detail-card--skeleton" aria-hidden>
      <div className="watta-promo-detail-card__gallery-skeleton" />
      <div className="watta-promo-detail-card__content">
        <div className="watta-promo-skeleton-line watta-promo-skeleton-line--hero" />
        <div className="watta-promo-skeleton-line" />
        <div className="watta-promo-skeleton-line" />
        <div className="watta-promo-skeleton-line watta-promo-skeleton-line--short" />
      </div>
    </article>
  )
}

function isValidPromo(data: unknown): data is PromoListItem {
  if (!data || typeof data !== 'object') return false
  const r = data as Record<string, unknown>
  if ('error' in r) return false
  const pid = Number(r.id)
  const title = typeof r.title === 'string' ? r.title.trim() : ''
  return Number.isFinite(pid) && pid >= 1 && title.length > 0
}

export default function PromotionsDetailView({
  embedded = false,
  id,
  onBack,
  onMenuClick: _onMenuClick,
  onOpenPhone: _onOpenPhone,
  onOpenNotifications: _onOpenNotifications,
  onOpenFavorites: _onOpenFavorites,
  onOpenProfile: _onOpenProfile,
}: PromotionsDetailViewProps) {
  const router = useRouter()
  const { t, getLocalized, language } = useLanguage()
  const p = t.promotionsPage
  const [promo, setPromo] = useState<PromoListItem | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch(`/api/promotions/${id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return
        setPromo(isValidPromo(data) ? data : null)
      })
      .catch(() => {
        if (!cancelled) setPromo(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  useEffect(() => {
    if (!loading && !promo) onBack()
  }, [loading, promo, onBack])

  const addOfferToCart = useCallback(
    (product: OfferProduct) => {
      if (typeof window === 'undefined' || !window.localStorage) return
      const pct = Math.min(100, Math.max(0, Math.round(Number(product.offerDiscountPercent) || 0)))
      const base = Number(product.price) || 0
      const deal = Math.round(base * (1 - pct / 100) * 100) / 100
      const name = getLocalized(product, 'name') || product.name_ru
      const desc = getLocalized(product, 'description') || product.description_ru || ''
      const result = addToCartWithAuthGate(router, {
        id: product.id,
        name,
        description: desc,
        price: pct > 0 && base > 0 ? deal : base,
        category:
          (product.category &&
            getMenuCategoryDisplayName(product.category as Record<string, unknown>, language, t.categories)) ||
          product.category?.name_ru ||
          '',
        emoji: '🍣',
        imageUrl: product.imageUrl ?? undefined,
        promoDiscountPercent: 0,
      })
      if (result === 'max') {
        toast.error(t.appToasts.maxCartQty)
        return
      }
      if (result === 'auth_redirect') return
      toast.success(t.addToCart)
    },
    [getLocalized, router, t.addToCart, t.appToasts.maxCartQty, t.categories, language],
  )

  if (loading) {
    return (
      <div
        className={
          embedded
            ? 'watta-promotions-page watta-promotions-page--embedded watta-promotions-page--detail relative w-full min-w-0'
            : 'watta-promotions-page watta-promotions-page--route watta-promotions-page--detail relative w-full min-w-0'
        }
      >
        <div className="watta-promotions-page__toolbar">
          <PromoDetailBackButton label={t.auth.back} onBack={onBack} inline={embedded} />
        </div>
        <div className="watta-promotions-page__inner">
          <PromoDetailSkeleton />
        </div>
      </div>
    )
  }

  if (!promo) return null

  const gallery = promoGalleryUrls(promo)
  const offerProducts: OfferProduct[] = Array.isArray(promo.offerProducts) ? promo.offerProducts : []

  return (
    <div
      className={
        embedded
          ? 'watta-promotions-page watta-promotions-page--embedded watta-promotions-page--detail relative w-full min-w-0'
          : 'watta-promotions-page watta-promotions-page--route watta-promotions-page--detail relative w-full min-w-0'
      }
    >
      <div className="watta-promotions-page__toolbar">
        <PromoDetailBackButton label={t.auth.back} onBack={onBack} inline={embedded} />
      </div>

      <div className="watta-promotions-page__inner">
        <article className="watta-promo-detail-card">
          {gallery.length > 0 && (
            <div className="watta-promo-detail-card__gallery" aria-label={p.galleryAria}>
              <div className="watta-promo-detail-card__gallery-track">
                {gallery.map((url, i) => (
                  <div key={`${url}-${i}`} className="watta-promo-detail-card__slide">
                    <img src={url} alt="" className="watta-promo-detail-card__slide-img" loading={i === 0 ? 'eager' : 'lazy'} />
                    {promo.isHit && i === 0 ? (
                      <span className="watta-promo-card__hit watta-promo-detail-card__hit">{p.hitBadge}</span>
                    ) : null}
                  </div>
                ))}
              </div>
              {gallery.length > 1 ? (
                <p className="watta-promo-detail-card__gallery-hint">
                  {promoTpl(p.morePhotosBadge, { count: gallery.length - 1 })}
                </p>
              ) : null}
            </div>
          )}

          <div className="watta-promo-detail-card__content">
            <h1 className="watta-promo-detail-card__title home-after-hero-intro-title-web">{promo.title}</h1>
            <div className="watta-promo-detail-card__prose home-after-hero-intro-body-web">
              {promo.content || promo.description}
            </div>

            {offerProducts.length > 0 && (
              <section className="watta-promo-detail-card__offers">
                <h2 className="watta-promo-detail-card__offers-title">{p.offersTitle}</h2>
                <ul className="watta-promo-detail-card__offers-grid">
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
    </div>
  )
}
