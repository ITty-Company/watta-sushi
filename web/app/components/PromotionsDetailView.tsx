'use client'

import '../promotions-page-theme.css'
import React, { useState, useEffect, useCallback } from 'react'
import { useInstantRouter } from '@/hooks/useInstantRouter'
import toast from 'react-hot-toast'
import { addToCartWithAuthGate } from '@/lib/cartStorage'
import type { MenuAddToCartResult } from '@/hooks/useMenuAddToCart'
import { ArrowLeft, ArrowRight, ShoppingBag } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { promoGalleryUrls, promoTpl, type PromoListItem } from '@/app/lib/promoDisplay'
import { WattaMenuProductCard } from './WattaMenuProductCard'
import { parseProductSpecsFromDescription } from '@/lib/i18n/parseProductSpecsFromDescription'
import type { WattaLanguage } from '@/lib/i18n/language'
import { getMenuCategoryDisplayName } from '@/lib/i18n/getMenuCategoryDisplayName'
import { WattaInViewFadeDiv, WattaInViewFadeSection } from './WattaInViewFade'
import WattaPageHeroStagger from './WattaPageHeroStagger'
import { WattaStaggerSectionTitle } from './WattaStaggerSectionTitle'

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

function formatDetailDate(iso: string | undefined, lang: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  if (lang === 'en') {
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  }
  if (lang === 'nl') {
    return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })
  }
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const y = d.getFullYear()
  return `${day}.${month}.${y}`
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
  onMenuClick,
  onOpenPhone: _onOpenPhone,
  onOpenNotifications: _onOpenNotifications,
  onOpenFavorites: _onOpenFavorites,
  onOpenProfile: _onOpenProfile,
}: PromotionsDetailViewProps) {
  const router = useInstantRouter()
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
    (product: OfferProduct): MenuAddToCartResult | void => {
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
        return 'max'
      }
      if (result === 'auth_redirect') return 'auth_redirect'
      return 'ok'
    },
    [getLocalized, router, t.appToasts.maxCartQty, t.categories, language],
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
  const categoryLabel =
    typeof promo.categoryLabel === 'string' && promo.categoryLabel ? promo.categoryLabel : p.defaultCategoryTag
  const dateStr =
    typeof promo.displayDate === 'string' && promo.displayDate
      ? promo.displayDate
      : formatDetailDate(promo.createdAt, language)
  const proseText = promo.content || promo.description || ''
  const leadParagraph = proseText.split(/\n\n|\n/).find((line) => line.trim()) ?? proseText
  const restParagraphs = proseText
    .split(/\n\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .slice(1)
    .join('\n\n')

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

      <div className="watta-promotions-page__inner watta-promotions-page__inner--detail">
        <article className="watta-promo-detail-card">
          {gallery.length > 0 ? (
            <WattaInViewFadeDiv className="watta-promo-detail-card__hero">
              <div className="watta-promo-detail-card__hero-frame" aria-label={p.galleryAria}>
                <img
                  src={gallery[0]}
                  alt=""
                  className="watta-promo-detail-card__hero-img"
                  loading="eager"
                />
                <div className="watta-promo-detail-card__hero-shade" aria-hidden />
                {promo.isHit ? (
                  <span className="watta-promo-card__hit watta-promo-detail-card__hero-hit">{p.hitBadge}</span>
                ) : null}
                <div className="watta-promo-detail-card__hero-caption">
                  <div className="watta-promo-detail-card__meta watta-promo-detail-card__meta--hero">
                    <span className="watta-promo-detail-card__category">{categoryLabel}</span>
                    {dateStr ? <time className="watta-promo-detail-card__date">{dateStr}</time> : null}
                  </div>
                  <WattaPageHeroStagger
                    title={promo.title}
                    titleClassName="watta-promo-detail-card__title watta-promo-detail-card__title--hero home-after-hero-intro-title-web"
                  />
                </div>
              </div>
              {gallery.length > 1 ? (
                <div className="watta-promo-detail-card__gallery-strip">
                  <div className="watta-promo-detail-card__gallery-track">
                    {gallery.slice(1).map((url, i) => (
                      <div key={`${url}-${i}`} className="watta-promo-detail-card__slide watta-promo-detail-card__slide--thumb">
                        <img src={url} alt="" className="watta-promo-detail-card__slide-img" loading="lazy" />
                      </div>
                    ))}
                  </div>
                  <p className="watta-promo-detail-card__gallery-hint">
                    {promoTpl(p.morePhotosBadge, { count: gallery.length - 1 })}
                  </p>
                </div>
              ) : null}
            </WattaInViewFadeDiv>
          ) : (
            <WattaInViewFadeDiv className="watta-promo-detail-card__content watta-promo-detail-card__content--no-hero">
              <div className="watta-promo-detail-card__meta">
                <span className="watta-promo-detail-card__category">{categoryLabel}</span>
                {dateStr ? <time className="watta-promo-detail-card__date">{dateStr}</time> : null}
              </div>
              <WattaPageHeroStagger
                title={promo.title}
                titleClassName="watta-promo-detail-card__title home-after-hero-intro-title-web"
              />
              <div className="watta-promo-detail-card__title-accent" aria-hidden />
            </WattaInViewFadeDiv>
          )}

          <WattaInViewFadeDiv
            className={`watta-promo-detail-card__content${gallery.length > 0 ? ' watta-promo-detail-card__content--overlap' : ''}`}
          >
            {gallery.length === 0 ? null : (
              <>
                <div className="watta-promo-detail-card__title-accent watta-promo-detail-card__title-accent--inset" aria-hidden />
              </>
            )}

            {leadParagraph ? (
              <blockquote className="watta-promo-detail-card__lead">{leadParagraph}</blockquote>
            ) : null}

            {restParagraphs ? (
              <div className="watta-promo-detail-card__prose home-after-hero-intro-body-web">{restParagraphs}</div>
            ) : !leadParagraph && proseText ? (
              <div className="watta-promo-detail-card__prose home-after-hero-intro-body-web">{proseText}</div>
            ) : null}

            <div className="watta-promo-detail-card__menu-cta-wrap">
              <button type="button" className="watta-promo-detail-card__menu-cta" onClick={onMenuClick}>
                <ShoppingBag className="h-4 w-4 shrink-0" aria-hidden />
                {p.menuCta}
                <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
              </button>
            </div>

            {offerProducts.length > 0 && (
              <WattaInViewFadeSection className="watta-promo-detail-card__offers">
                <WattaStaggerSectionTitle
                  className="watta-promo-detail-card__offers-title"
                  text={p.offersTitle}
                />
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
                          subtitleLine={
                            parseProductSpecsFromDescription(
                              desc,
                              t.productDetail.weightFallback,
                              t.productDetail.piecesFallback,
                              language as WattaLanguage,
                            ).weightLine
                          }
                          onAddToCart={() => addOfferToCart(product)}
                        />
                      </li>
                    )
                  })}
                </ul>
              </WattaInViewFadeSection>
            )}
          </WattaInViewFadeDiv>
        </article>
      </div>
    </div>
  )
}
