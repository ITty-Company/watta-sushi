'use client'

import React, { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import {
  promoCoverUrl,
  promoGalleryUrls,
  promoProductOffersCount,
  promoTpl,
  normalizePromoList,
  type PromoListItem,
} from '@/app/lib/promoDisplay'

const READ_LINK = '#27AE60'

interface PromotionsViewProps {
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

function PromoBackButton({
  label,
  onBack,
  inline,
}: {
  label: string
  onBack: () => void
  inline?: boolean
}) {
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

function PromoListSkeleton() {
  return (
    <div className="watta-promotions-grid" aria-hidden>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="watta-promo-card watta-promo-card--skeleton">
          <div className="watta-promo-card__media-skeleton" />
          <div className="watta-promo-card__body">
            <div className="watta-promo-skeleton-line watta-promo-skeleton-line--short" />
            <div className="watta-promo-skeleton-line watta-promo-skeleton-line--title" />
            <div className="watta-promo-skeleton-line" />
          </div>
        </div>
      ))}
    </div>
  )
}

function PromoCard({
  promo,
  language,
  p,
  onOpenDetail,
}: {
  promo: PromoListItem
  language: string
  p: ReturnType<typeof useLanguage>['t']['promotionsPage']
  onOpenDetail: (id: number) => void
}) {
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
    <article className="watta-promo-card" role="listitem">
      <button
        type="button"
        className="watta-promo-card__hit-area"
        onClick={() => onOpenDetail(promo.id)}
        aria-label={`${p.readCta}: ${promo.title}`}
      >
        <div className="watta-promo-card__media">
          {cover ? (
            <img src={cover} alt="" className="watta-promo-card__img" loading="lazy" decoding="async" />
          ) : (
            <div className="watta-promo-card__no-photo" aria-hidden>
              <span className="watta-promo-card__no-photo-mark">W</span>
            </div>
          )}
          {galleryCount > 1 && (
            <span className="watta-promo-card__badge watta-promo-card__badge--photos">
              {promoTpl(p.morePhotosBadge, { count: galleryCount - 1 })}
            </span>
          )}
          {offers > 0 && (
            <span className="watta-promo-card__badge watta-promo-card__badge--offers">
              {promoTpl(p.offersBadge, { count: offers })}
            </span>
          )}
          {promo.isHit ? <span className="watta-promo-card__hit">{p.hitBadge}</span> : null}
        </div>

        <div className="watta-promo-card__body">
          <div className="watta-promo-card__meta">
            <span className="watta-promo-card__category">{category}</span>
            {dateStr ? <time className="watta-promo-card__date">{dateStr}</time> : null}
          </div>
          <h2 className="watta-promo-card__title">{promo.title}</h2>
          {promo.description ? <p className="watta-promo-card__desc">{promo.description}</p> : null}
          <span className="watta-promo-card__cta" style={{ color: READ_LINK }}>
            {p.readCta}
          </span>
        </div>
      </button>
    </article>
  )
}

export default function PromotionsView({
  embedded = false,
  onBack,
  onOpenDetail,
}: PromotionsViewProps) {
  const { t, language } = useLanguage()
  const [promotions, setPromotions] = useState<PromoListItem[]>([])
  const [loaded, setLoaded] = useState(false)
  const p = t.promotionsPage
  const hasPosts = promotions.length > 0

  useEffect(() => {
    let cancelled = false
    fetch('/api/promotions')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (!cancelled) setPromotions(normalizePromoList(data))
      })
      .catch(() => {
        if (!cancelled) setPromotions([])
      })
      .finally(() => {
        if (!cancelled) setLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div
      className={
        embedded
          ? 'watta-promotions-page watta-promotions-page--embedded relative w-full min-w-0'
          : 'watta-promotions-page watta-promotions-page--route relative w-full min-w-0'
      }
    >
      <div className="watta-promotions-page__toolbar">
        <PromoBackButton label={t.auth.back} onBack={onBack} inline={embedded} />
      </div>

      <div className="watta-promotions-page__inner">
        {!loaded ? (
          <>
            {embedded ? null : (
              <header className="watta-promotions-page__header watta-promotions-page__header--placeholder" aria-hidden>
                <div className="watta-promo-skeleton-line watta-promo-skeleton-line--hero" />
              </header>
            )}
            <PromoListSkeleton />
          </>
        ) : !hasPosts ? (
          <div className="watta-promotions-page__empty">
            <header className="watta-promotions-page__header">
              <h1 className="watta-promotions-page__title home-after-hero-intro-title-web">{p.listHeading}</h1>
              <p className="watta-promotions-page__subtitle home-after-hero-intro-body-web">{p.description}</p>
            </header>
            <p className="watta-promotions-page__empty-hint" role="status">
              {p.emptyList}
            </p>
          </div>
        ) : (
          <>
            <header className="watta-promotions-page__header">
              <h1 className="watta-promotions-page__title home-after-hero-intro-title-web">{p.listHeading}</h1>
              <p className="watta-promotions-page__subtitle home-after-hero-intro-body-web">{p.description}</p>
            </header>
            <div className="watta-promotions-grid" role="list">
              {promotions.map((promo) => (
                <PromoCard
                  key={promo.id}
                  promo={promo}
                  language={language}
                  p={p}
                  onOpenDetail={onOpenDetail}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
