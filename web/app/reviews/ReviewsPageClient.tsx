'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useInstantRouter } from '@/hooks/useInstantRouter'
import { motion } from 'framer-motion'
import { LocationPickerMascot } from '@/app/components/LocationPickerMascot'
import { ArrowLeft, PenLine, Star, X } from 'lucide-react'
import { useLanguage } from '@/app/context/LanguageContext'
import { cn } from '@/lib/utils'
import { getAuthUrl, isUserLoggedIn } from '@/lib/authGate'
import { getBearerAuthHeaders } from '@/lib/authHeaders'
import ReviewComposeModal from '@/app/components/ReviewComposeModal'
import type { ReviewComposeResult } from '@/app/components/ReviewComposeModal'
import {
  readPublicReviewsCache,
  writePublicReviewsCache,
} from '@/lib/publicRouteWarmCache'

interface PublicReview {
  id: number
  rating: number
  text: string
  images: string[]
  createdAt: string
  authorName: string
}

type MyOrder = {
  id: number
  status: string
  createdAt: string
  review?: { id: number } | null
}

function StarsRow({ rating, size = 'md' }: { rating: number; size?: 'sm' | 'md' }) {
  const cls = size === 'sm' ? 'h-3.5 w-3.5' : 'h-5 w-5'
  return (
    <div className="flex gap-0.5" aria-label={`${rating}/5`}>
      {Array.from({ length: 5 }).map((_, si) => (
        <Star
          key={si}
          className={`${cls} ${si < rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
        />
      ))}
    </div>
  )
}

function formatReviewDate(iso: string, lang: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  if (lang === 'en') return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  if (lang === 'nl') return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  return `${day}.${month}.${d.getFullYear()}`
}

function authorInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
}

function pickFeaturedReview(list: PublicReview[]): PublicReview | null {
  if (!list.length) return null
  const five = list.filter((r) => r.rating === 5)
  const pool = five.length ? five : list
  return [...pool].sort((a, b) => b.text.length - a.text.length)[0] ?? null
}

function reviewTitleParts(title: string) {
  const words = title.trim().split(/\s+/).filter(Boolean)
  if (words.length <= 1) return { lead: title, accent: '' }
  return {
    lead: words.slice(0, -1).join(' '),
    accent: words[words.length - 1] ?? '',
  }
}

function ReviewsBackButton({ label, onBack }: { label: string; onBack: () => void }) {
  return (
    <button
      type="button"
      onClick={onBack}
      className="auth-watta-back-fab watta-reviews-back watta-reviews-back--inline"
    >
      <span className="auth-watta-back-fab__icon" aria-hidden>
        <ArrowLeft className="auth-watta-back-fab__arrow" strokeWidth={2.5} />
      </span>
      <span className="auth-watta-back-fab__text">{label}</span>
    </button>
  )
}

function ReviewCard({
  rev,
  featured,
  language,
  featuredBadge,
  onPhotoClick,
  index,
}: {
  rev: PublicReview
  featured?: boolean
  language: string
  featuredBadge: string
  onPhotoClick: (src: string) => void
  index: number
}) {
  return (
    <motion.article
      role="listitem"
      className={`watta-review-card${featured ? ' watta-review-card--featured' : ''}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      {featured ? (
        <div className="watta-review-card__badge-row">
          <span className="watta-review-card__badge">{featuredBadge}</span>
        </div>
      ) : null}
      <div className="watta-review-card__head">
        <div className="watta-review-card__who">
          <span className="watta-review-card__avatar" aria-hidden>
            {authorInitials(rev.authorName)}
          </span>
          <div className="watta-review-card__meta">
            <p className="watta-review-card__author">{rev.authorName}</p>
            <time className="watta-review-card__date" dateTime={rev.createdAt}>
              {formatReviewDate(rev.createdAt, language)}
            </time>
          </div>
        </div>
        <div className="watta-review-card__rating">
          <StarsRow rating={rev.rating} size={featured ? 'md' : 'sm'} />
        </div>
      </div>
      <p
        className={`watta-review-card__text${featured ? ' watta-review-card__text--featured' : ''}`}
      >
        {rev.text}
      </p>
      {rev.images?.length ? (
        <div className="watta-review-card__photos">
          {rev.images.map((src, ii) => (
            <button
              key={ii}
              type="button"
              className="watta-review-card__photo"
              onClick={() => onPhotoClick(src)}
              aria-label={`Photo ${ii + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" loading="lazy" decoding="async" />
            </button>
          ))}
        </div>
      ) : null}
    </motion.article>
  )
}

export default function ReviewsPageClient() {
  const router = useInstantRouter()
  const { t, language } = useLanguage()
  const r = t.reviewsPublic
  const titleParts = useMemo(() => reviewTitleParts(r.title), [r.title])

  const [loggedIn, setLoggedIn] = useState(false)
  const [list, setList] = useState<PublicReview[] | null>(() => {
    if (typeof window === 'undefined') return null
    const cached = readPublicReviewsCache()
    return cached ? (cached as PublicReview[]) : null
  })
  const [myOrders, setMyOrders] = useState<MyOrder[] | null>(null)
  const [composeOpen, setComposeOpen] = useState(false)
  const [composeOrder, setComposeOrder] = useState<MyOrder | null>(null)
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
  const [portalReady, setPortalReady] = useState(false)

  useEffect(() => {
    setPortalReady(true)
  }, [])

  const syncAuth = useCallback(() => {
    setLoggedIn(isUserLoggedIn())
  }, [])

  const loadReviews = useCallback(async () => {
    const res = await fetch('/api/reviews', { cache: 'no-store' })
    if (!res.ok) {
      setList([])
      return
    }
    const data = await res.json()
    const rows = Array.isArray(data) ? data : []
    if (rows.length > 0) writePublicReviewsCache(rows)
    setList(rows)
  }, [])

  const loadMyOrders = useCallback(async () => {
    if (!isUserLoggedIn()) {
      setMyOrders(null)
      return
    }
    const auth = getBearerAuthHeaders()
    if (!('Authorization' in auth)) {
      setMyOrders(null)
      return
    }
    const res = await fetch('/api/orders/my', { headers: auth, cache: 'no-store' })
    if (!res.ok) {
      setMyOrders([])
      return
    }
    const data = await res.json()
    setMyOrders(Array.isArray(data) ? data : [])
  }, [])

  useEffect(() => {
    syncAuth()
    void loadReviews()
    const onReviewsUpdated = () => void loadReviews()
    const onAuth = () => {
      syncAuth()
      void loadMyOrders()
    }
    window.addEventListener('userChanged', onAuth)
    window.addEventListener('storage', onAuth)
    window.addEventListener('reviewsUpdated', onReviewsUpdated)
    return () => {
      window.removeEventListener('userChanged', onAuth)
      window.removeEventListener('storage', onAuth)
      window.removeEventListener('reviewsUpdated', onReviewsUpdated)
    }
  }, [loadReviews, loadMyOrders, syncAuth])

  useEffect(() => {
    if (!loggedIn) {
      setMyOrders(null)
      return
    }
    void loadMyOrders()
  }, [loggedIn, loadMyOrders])

  useEffect(() => {
    if (!lightboxSrc) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxSrc(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightboxSrc])

  const eligibleOrders = useMemo(() => {
    if (!myOrders) return []
    return myOrders.filter((o) => o.status === 'COMPLETED' || o.status === 'DELIVERED')
  }, [myOrders])

  const featured = useMemo(() => pickFeaturedReview(list ?? []), [list])
  const feedList = useMemo(() => {
    if (!list?.length) return []
    if (!featured) return list
    return list.filter((rev) => rev.id !== featured.id)
  }, [featured, list])

  const handleReviewSubmitted = useCallback(
    (review: ReviewComposeResult) => {
      const row: PublicReview = {
        id: review.id,
        rating: review.rating,
        text: review.text,
        images: review.images,
        createdAt: review.createdAt,
        authorName: review.authorName,
      }
      setList((prev) => {
        const base = prev ?? []
        if (base.some((r) => r.id === row.id)) return base
        const next = [row, ...base]
        writePublicReviewsCache(next)
        return next
      })
      void loadReviews()
      void loadMyOrders()
    },
    [loadMyOrders, loadReviews],
  )

  const handleComposeClose = useCallback(() => {
    setComposeOpen(false)
    setComposeOrder(null)
  }, [])

  const openCompose = useCallback((order?: MyOrder) => {
    setComposeOrder(order ?? null)
    setComposeOpen(true)
  }, [])

  const hasReviews = Boolean(list && list.length > 0)
  const showEmptyHint = list !== null && list.length === 0
  const showWriteStrip = loggedIn && myOrders !== null && eligibleOrders.length > 0
  const showComposeModal = composeOpen

  return (
    <div
      id="reviews-page-container"
      className={cn(
        'menu-page-web watta-reviews-page reviews-page-web relative flex w-full max-w-[100vw] min-w-0 flex-col',
        hasReviews ? 'flex-1 pb-24' : 'watta-reviews-page--empty',
      )}
    >
      <div className="watta-reviews-hero-zone">
        <div className="watta-reviews-page__toolbar">
          <ReviewsBackButton label={t.auth.back} onBack={() => router.push('/')} />
        </div>

        <header className="watta-reviews-hero-static" aria-labelledby="reviews-hero-title">
        <div className="watta-reviews-hero-static__inner mx-auto max-w-6xl px-4 sm:px-6">
          <div className="watta-reviews-hero-static__mascot-wrap" aria-hidden>
            <LocationPickerMascot className="watta-reviews-hero-static__mascot" />
          </div>
          <div className="watta-reviews-hero-static__copy">
            <h1 id="reviews-hero-title" className="watta-reviews-hero-static__title">
              {titleParts.lead}
              {titleParts.accent ? (
                <>
                  {' '}
                  <span className="watta-reviews-hero-static__title-accent">{titleParts.accent}</span>
                </>
              ) : null}
            </h1>
            <p className="watta-reviews-hero-static__subtitle">{r.subtitle}</p>
            {showEmptyHint ? (
              <p className="watta-reviews-hero-empty-hint" role="status">
                {r.empty} {r.emptyInvite}
              </p>
            ) : null}
            <div className="watta-reviews-hero-actions">
              {loggedIn ? (
                <button
                  type="button"
                  className="watta-reviews-hero-actions__btn watta-reviews-hero-actions__btn--primary"
                  onClick={() => openCompose()}
                >
                  <PenLine className="h-4 w-4 shrink-0" aria-hidden />
                  {r.writeCta}
                </button>
              ) : (
                <button
                  type="button"
                  className="watta-reviews-hero-actions__btn watta-reviews-hero-actions__btn--primary"
                  onClick={() => router.push(getAuthUrl('/reviews'))}
                >
                  {r.loginButton}
                </button>
              )}
            </div>
          </div>
        </div>
        </header>
      </div>

      {list === null ? (
        <div className="watta-reviews-page__loading mx-auto px-4 py-8" aria-busy="true">
          <div
            className="mx-auto h-11 w-11 animate-spin rounded-2xl border-2 border-[#145142]/25 border-t-[#145142]"
            aria-hidden
          />
        </div>
      ) : hasReviews ? (
        <section className="watta-reviews-page__flow" aria-label={r.feedTitle}>
          <div className="watta-reviews-page__inner mx-auto max-w-6xl px-4 sm:px-6">
            <p className="watta-reviews-page__write-desc">{r.writeBlockDesc}</p>
            {showWriteStrip ? (
              <ul className="watta-reviews-write-strip" aria-label={r.writeBlockTitle}>
                {eligibleOrders.map((order) => (
                  <li key={order.id}>
                    <button
                      type="button"
                      className="watta-reviews-write-strip__btn"
                      onClick={() => openCompose(order)}
                    >
                      <PenLine className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      <span>{r.orderPickLabel.replace('{{id}}', String(order.id))}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="watta-reviews-grid" role="list">
              {featured ? (
                <ReviewCard
                  rev={featured}
                  featured
                  language={language}
                  featuredBadge={r.featuredBadge}
                  onPhotoClick={setLightboxSrc}
                  index={0}
                />
              ) : null}
              {feedList.map((rev, i) => (
                <ReviewCard
                  key={rev.id}
                  rev={rev}
                  language={language}
                  featuredBadge={r.featuredBadge}
                  onPhotoClick={setLightboxSrc}
                  index={i + (featured ? 1 : 0)}
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {showComposeModal ? (
        <ReviewComposeModal
          orderId={composeOrder?.id}
          orderLabel={
            composeOrder
              ? r.orderPickLabel.replace('{{id}}', String(composeOrder.id))
              : undefined
          }
          onClose={handleComposeClose}
          onSubmitted={handleReviewSubmitted}
        />
      ) : null}

      {lightboxSrc && portalReady
        ? createPortal(
            <div
              className="watta-reviews-lightbox"
              role="dialog"
              aria-modal="true"
              onClick={() => setLightboxSrc(null)}
            >
              <button
                type="button"
                className="watta-reviews-lightbox__close"
                onClick={() => setLightboxSrc(null)}
                aria-label={t.auth.back}
              >
                <X className="h-5 w-5" />
              </button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={lightboxSrc}
                alt=""
                className="watta-reviews-lightbox__img"
                onClick={(e) => e.stopPropagation()}
              />
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}
