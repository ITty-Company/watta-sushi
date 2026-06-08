'use client'

import '../promotions-page-theme.css'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { WattaInViewFadeArticle, WattaInViewFadeDiv } from './WattaInViewFade'
import { ArrowLeft, ArrowRight, Megaphone, ShoppingBag } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { LocationPickerMascot } from './LocationPickerMascot'
import WattaPageHeroStagger from './WattaPageHeroStagger'
import { cn } from '@/lib/utils'
import { catalogSyncEventNames } from '@/lib/wattaCatalogSync'
import {
  promoCoverUrl,
  promoGalleryUrls,
  promoProductOffersCount,
  promoTpl,
  normalizePromoList,
  type PromoListItem,
} from '@/app/lib/promoDisplay'
import {
  readPromotionsListCache,
  writePromotionsListCache,
} from '@/lib/publicRouteWarmCache'

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

function promoTitleParts(title: string) {
  const words = title.trim().split(/\s+/).filter(Boolean)
  if (words.length <= 1) return { lead: title, accent: '' }
  return {
    lead: words.slice(0, -1).join(' '),
    accent: words[words.length - 1] ?? '',
  }
}

function pickFeaturedPromo(list: PromoListItem[]): PromoListItem | null {
  if (!list.length) return null
  return list.find((p) => p.isHit) ?? list[0]
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
      className={cn(
        'auth-watta-back-fab watta-promotions-back',
        inline && 'watta-promotions-back--inline',
      )}
    >
      <span className="auth-watta-back-fab__icon" aria-hidden>
        <ArrowLeft className="auth-watta-back-fab__arrow" strokeWidth={2.5} />
      </span>
      <span className="auth-watta-back-fab__text">{label}</span>
    </button>
  )
}

function PromoCard({
  promo,
  language,
  p,
  featured,
  onOpenDetail,
  index,
}: {
  promo: PromoListItem
  language: string
  p: ReturnType<typeof useLanguage>['t']['promotionsPage']
  featured?: boolean
  onOpenDetail: (id: number) => void
  index: number
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
  const indexLabel = String(index + 1).padStart(2, '0')

  if (featured) {
    return (
      <WattaInViewFadeArticle
        role="listitem"
        className="watta-promo-card watta-promo-card--featured"
        transition={{ delay: 0 }}
      >
        <button
          type="button"
          className="watta-promo-card__hit-area watta-promo-card__hit-area--featured"
          onClick={() => onOpenDetail(promo.id)}
          aria-label={`${p.readCta}: ${promo.title}`}
        >
          <div className="watta-promo-card__featured-split">
            <div className="watta-promo-card__media watta-promo-card__media--featured">
              {cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cover} alt="" className="watta-promo-card__img" loading="eager" decoding="async" />
              ) : (
                <div className="watta-promo-card__no-photo" aria-hidden>
                  <span className="watta-promo-card__no-photo-mark">W</span>
                </div>
              )}
              <div className="watta-promo-card__media-shade watta-promo-card__media-shade--featured" aria-hidden />
              <span className="watta-promo-card__featured-index" aria-hidden>
                {indexLabel}
              </span>
              {promo.isHit ? (
                <span className="watta-promo-card__hit watta-promo-card__hit--featured">{p.hitBadge}</span>
              ) : null}
            </div>

            <div className="watta-promo-card__featured-panel">
              <span className="watta-promo-card__badge-featured">{p.featuredBadge}</span>
              <h2 className="watta-promo-card__title watta-promo-card__title--featured">{promo.title}</h2>
              {promo.description ? (
                <p className="watta-promo-card__desc watta-promo-card__desc--featured">{promo.description}</p>
              ) : null}
              <div className="watta-promo-card__meta watta-promo-card__meta--featured">
                <span className="watta-promo-card__category">{category}</span>
                {dateStr ? <time className="watta-promo-card__date">{dateStr}</time> : null}
              </div>
              <span className="watta-promo-card__cta-pill">
                {p.readCta}
                <ArrowRight className="watta-promo-card__cta-icon" strokeWidth={2.5} aria-hidden />
              </span>
            </div>
          </div>
        </button>
      </WattaInViewFadeArticle>
    )
  }

  return (
    <WattaInViewFadeArticle
      role="listitem"
      className="watta-promo-card"
      transition={{ delay: Math.min(index * 0.03, 0.24) }}
    >
      <button
        type="button"
        className="watta-promo-card__hit-area watta-promo-card__hit-area--stack"
        onClick={() => onOpenDetail(promo.id)}
        aria-label={`${p.readCta}: ${promo.title}`}
      >
        <div className="watta-promo-card__media watta-promo-card__media--stack">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cover}
              alt=""
              className="watta-promo-card__img"
              loading={index < 4 ? 'eager' : 'lazy'}
              decoding="async"
            />
          ) : (
            <div className="watta-promo-card__no-photo" aria-hidden>
              <span className="watta-promo-card__no-photo-mark">W</span>
            </div>
          )}
          <div className="watta-promo-card__media-shade watta-promo-card__media-shade--stack" aria-hidden />
          <span className="watta-promo-card__index" aria-hidden>
            {indexLabel}
          </span>
          {galleryCount > 1 ? (
            <span className="watta-promo-card__badge watta-promo-card__badge--photos">
              {promoTpl(p.morePhotosBadge, { count: galleryCount - 1 })}
            </span>
          ) : null}
          {offers > 0 ? (
            <span className="watta-promo-card__badge watta-promo-card__badge--offers">
              {promoTpl(p.offersBadge, { count: offers })}
            </span>
          ) : null}
          {promo.isHit ? <span className="watta-promo-card__hit">{p.hitBadge}</span> : null}
        </div>

        <div className="watta-promo-card__body watta-promo-card__body--stack">
          <div className="watta-promo-card__meta">
            <span className="watta-promo-card__category">{category}</span>
            {dateStr ? <time className="watta-promo-card__date">{dateStr}</time> : null}
          </div>
          <h2 className="watta-promo-card__title">{promo.title}</h2>
          {promo.description ? <p className="watta-promo-card__desc">{promo.description}</p> : null}
          <span className="watta-promo-card__cta-pill watta-promo-card__cta-pill--stack">
            {p.readCta}
            <ArrowRight className="watta-promo-card__cta-icon" strokeWidth={2.5} aria-hidden />
          </span>
        </div>
      </button>
    </WattaInViewFadeArticle>
  )
}

export default function PromotionsView({
  embedded = false,
  onBack,
  onMenuClick,
  onOpenDetail,
}: PromotionsViewProps) {
  const { t, language } = useLanguage()
  const [promotions, setPromotions] = useState<PromoListItem[] | null>(() => {
    if (typeof window === 'undefined') return null
    const cached = readPromotionsListCache()
    return cached ? normalizePromoList(cached) : null
  })
  const p = t.promotionsPage
  const titleParts = useMemo(() => promoTitleParts(p.listHeading), [p.listHeading])

  const loadPromotions = useCallback(async () => {
    try {
      const res = await fetch('/api/promotions', { cache: 'no-store' })
      const data = res.ok ? await res.json() : []
      const list = normalizePromoList(data)
      if (Array.isArray(data) && data.length > 0) writePromotionsListCache(data)
      setPromotions(list)
    } catch {
      setPromotions([])
    }
  }, [])

  useEffect(() => {
    void loadPromotions()
    const events = catalogSyncEventNames('promotions')
    const onRefresh = () => void loadPromotions()
    for (const name of events) {
      window.addEventListener(name, onRefresh)
    }
    return () => {
      for (const name of events) {
        window.removeEventListener(name, onRefresh)
      }
    }
  }, [loadPromotions])

  const hasPosts = Boolean(promotions && promotions.length > 0)
  const showEmptyHint = promotions !== null && promotions.length === 0
  const featured = useMemo(() => pickFeaturedPromo(promotions ?? []), [promotions])
  const feedList = useMemo(() => {
    if (!promotions?.length) return []
    if (!featured) return promotions
    return promotions.filter((item) => item.id !== featured.id)
  }, [featured, promotions])

  const pageClass = cn(
    'watta-promotions-page relative flex w-full max-w-[100vw] min-w-0 flex-col',
    !embedded && 'menu-page-web watta-promotions-route',
    hasPosts ? 'flex-1 pb-24' : 'watta-promotions-page--empty',
    embedded && 'watta-promotions-page--embedded',
  )

  return (
    <div
      id={embedded ? undefined : 'promotions-page-container'}
      className={pageClass}
    >
      <WattaInViewFadeDiv className="watta-promotions-hero-zone" data-watta-cart-bar-gate="">
        <div className="watta-promotions-page__toolbar">
          <PromoBackButton label={t.auth.back} onBack={onBack} inline />
        </div>

        <header className="watta-promotions-hero-static" aria-labelledby="promotions-hero-title">
          <div className="watta-promotions-hero-static__glow" aria-hidden />
          <div className="watta-promotions-hero-static__inner mx-auto max-w-6xl px-4 sm:px-6">
            <div className="watta-promotions-hero-static__mascot-wrap" aria-hidden>
              <div className="watta-promotions-hero-static__mascot-ring" aria-hidden />
              <LocationPickerMascot className="watta-promotions-hero-static__mascot" />
            </div>
            <div className="watta-promotions-hero-static__copy">
              <WattaPageHeroStagger
                kickerPrefix={
                  <>
                    <Megaphone className="watta-promotions-hero-static__kicker-ico" strokeWidth={2.25} aria-hidden />
                  </>
                }
                kickerText={`Watta · ${p.title}`}
                kickerClassName="watta-promotions-hero-static__kicker"
                title={titleParts.lead}
                titleAccent={titleParts.accent || undefined}
                titleAccentClassName="watta-promotions-hero-static__title-accent"
                titleId="promotions-hero-title"
                titleClassName="watta-promotions-hero-static__title"
                subtitle={p.description}
                subtitleClassName="watta-promotions-hero-static__subtitle"
              />
              {hasPosts && promotions ? (
                <p className="watta-promotions-hero-static__stat" aria-live="polite">
                  <span className="watta-promotions-hero-static__stat-num">{promotions.length}</span>
                  {p.feedTitle}
                </p>
              ) : null}
              {showEmptyHint ? (
                <p className="watta-promotions-hero-empty-hint" role="status">
                  {p.emptyList} {p.emptyInvite}
                </p>
              ) : null}
              <div className="watta-promotions-hero-actions">
                <button
                  type="button"
                  className="watta-promotions-hero-actions__btn watta-promotions-hero-actions__btn--primary"
                  onClick={onMenuClick}
                >
                  <ShoppingBag className="h-4 w-4 shrink-0" aria-hidden />
                  {p.menuCta}
                </button>
              </div>
            </div>
          </div>
        </header>
      </WattaInViewFadeDiv>

      {promotions === null ? (
        <div className="watta-promotions-page__loading mx-auto px-4 py-8" aria-busy="true">
          <div
            className="mx-auto h-11 w-11 animate-spin rounded-2xl border-2 border-[#145142]/25 border-t-[#145142]"
            aria-hidden
          />
        </div>
      ) : hasPosts ? (
        <section className="watta-promotions-page__flow" aria-label={p.feedTitle}>
          <div className="watta-promotions-page__inner">
            <header className="watta-promotions-page__feed-head">
              <p className="watta-promotions-page__feed-label">{p.feedTitle}</p>
              <span className="watta-promotions-page__feed-count">{promotions.length}</span>
            </header>
            <div className="watta-promotions-grid" role="list">
              {featured ? (
                <PromoCard
                  promo={featured}
                  language={language}
                  p={p}
                  featured
                  onOpenDetail={onOpenDetail}
                  index={0}
                />
              ) : null}
              {feedList.map((promo, i) => (
                <PromoCard
                  key={promo.id}
                  promo={promo}
                  language={language}
                  p={p}
                  onOpenDetail={onOpenDetail}
                  index={i + (featured ? 1 : 0)}
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  )
}
