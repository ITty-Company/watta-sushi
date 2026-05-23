'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, ShoppingBag } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { LocationPickerMascot } from './LocationPickerMascot'
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

  return (
    <motion.article
      role="listitem"
      className={cn('watta-promo-card', featured && 'watta-promo-card--featured')}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <button
        type="button"
        className="watta-promo-card__hit-area"
        onClick={() => onOpenDetail(promo.id)}
        aria-label={`${p.readCta}: ${promo.title}`}
      >
        <div className="watta-promo-card__media">
          {featured ? (
            <span className="watta-promo-card__badge-featured">{p.featuredBadge}</span>
          ) : null}
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt="" className="watta-promo-card__img" loading="lazy" decoding="async" />
          ) : (
            <div className="watta-promo-card__no-photo" aria-hidden>
              <span className="watta-promo-card__no-photo-mark">W</span>
            </div>
          )}
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
          {promo.isHit && !featured ? (
            <span className="watta-promo-card__hit">{p.hitBadge}</span>
          ) : null}
        </div>

        <div className="watta-promo-card__body">
          <div className="watta-promo-card__meta">
            <span className="watta-promo-card__category">{category}</span>
            {dateStr ? <time className="watta-promo-card__date">{dateStr}</time> : null}
          </div>
          <h2 className="watta-promo-card__title">{promo.title}</h2>
          {promo.description ? <p className="watta-promo-card__desc">{promo.description}</p> : null}
          <span className="watta-promo-card__cta">{p.readCta}</span>
        </div>
      </button>
    </motion.article>
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
      <div className="watta-promotions-hero-zone">
        <div className="watta-promotions-page__toolbar">
          <PromoBackButton label={t.auth.back} onBack={onBack} inline />
        </div>

        <header className="watta-promotions-hero-static" aria-labelledby="promotions-hero-title">
          <div className="watta-promotions-hero-static__inner mx-auto max-w-6xl px-4 sm:px-6">
            <div className="watta-promotions-hero-static__mascot-wrap" aria-hidden>
              <LocationPickerMascot className="watta-promotions-hero-static__mascot" />
            </div>
            <div className="watta-promotions-hero-static__copy">
              <h1 id="promotions-hero-title" className="watta-promotions-hero-static__title">
                {titleParts.lead}
                {titleParts.accent ? (
                  <>
                    {' '}
                    <span className="watta-promotions-hero-static__title-accent">{titleParts.accent}</span>
                  </>
                ) : null}
              </h1>
              <p className="watta-promotions-hero-static__subtitle">{p.description}</p>
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
      </div>

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
            <p className="watta-promotions-page__feed-label">{p.feedTitle}</p>
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
