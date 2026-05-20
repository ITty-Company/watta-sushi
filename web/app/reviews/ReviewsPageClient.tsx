'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, MessageSquarePlus, Star } from 'lucide-react'
import { useLanguage } from '@/app/context/LanguageContext'
import { isUserLoggedIn, getAuthUrl } from '@/lib/authGate'
import { getBearerAuthHeaders } from '@/lib/authHeaders'
import ReviewComposeModal from '@/app/components/ReviewComposeModal'
import type { ReviewComposeResult } from '@/app/components/ReviewComposeModal'

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
  const cls = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'
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

export default function ReviewsPageClient() {
  const router = useRouter()
  const { t, language } = useLanguage()
  const r = t.reviewsPublic

  const [loggedIn, setLoggedIn] = useState(false)
  const [list, setList] = useState<PublicReview[] | null>(null)
  const [myOrders, setMyOrders] = useState<MyOrder[] | null>(null)
  const [composeOrder, setComposeOrder] = useState<MyOrder | null>(null)

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
    setList(Array.isArray(data) ? data : [])
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
    window.addEventListener('userChanged', syncAuth)
    window.addEventListener('storage', syncAuth)
    window.addEventListener('reviewsUpdated', onReviewsUpdated)
    return () => {
      window.removeEventListener('userChanged', syncAuth)
      window.removeEventListener('storage', syncAuth)
      window.removeEventListener('reviewsUpdated', onReviewsUpdated)
    }
  }, [loadReviews, syncAuth])

  useEffect(() => {
    if (!loggedIn) {
      setMyOrders(null)
      return
    }
    void loadMyOrders()
  }, [loggedIn, loadMyOrders])

  const eligibleOrders = useMemo(() => {
    if (!myOrders) return []
    return myOrders.filter(
      (o) => (o.status === 'COMPLETED' || o.status === 'DELIVERED') && !o.review,
    )
  }, [myOrders])

  const stats = useMemo(() => {
    if (!list?.length) return null
    const sum = list.reduce((acc, rev) => acc + rev.rating, 0)
    return {
      count: list.length,
      avg: (sum / list.length).toFixed(1),
    }
  }, [list])

  const handleReviewSubmitted = useCallback(
    (_review: ReviewComposeResult) => {
      void loadReviews()
      void loadMyOrders()
    },
    [loadMyOrders, loadReviews],
  )

  return (
    <div className="watta-reviews-page watta-reviews-page--route relative w-full min-w-0">
      <div className="watta-reviews-page__toolbar">
        <ReviewsBackButton label={t.auth.back} onBack={() => router.push('/')} />
      </div>

      <div className="watta-reviews-page__inner">
        <header className="watta-reviews-page__header">
          <p className="watta-reviews-page__kicker">
            <Star className="watta-reviews-page__kicker-ico fill-amber-400 text-amber-400" aria-hidden />
            {r.heroKicker}
          </p>
          <h1 className="watta-reviews-page__title home-after-hero-intro-title-web">{r.title}</h1>
          <p className="watta-reviews-page__subtitle home-after-hero-intro-body-web">{r.subtitle}</p>
          {stats ? (
            <p className="watta-reviews-page__stats" role="status">
              {r.statsLine.replace('{{count}}', String(stats.count)).replace('{{avg}}', stats.avg)}
            </p>
          ) : null}
        </header>

        {!loggedIn ? (
          <section className="watta-reviews-page__cta-card" aria-labelledby="reviews-login-cta">
            <MessageSquarePlus className="h-8 w-8 text-[#145142]" aria-hidden />
            <h2 id="reviews-login-cta" className="watta-reviews-page__cta-title">
              {r.loginBlockTitle}
            </h2>
            <p className="watta-reviews-page__cta-desc">{r.loginCta}</p>
            <Link href={getAuthUrl('/reviews')} className="watta-reviews-page__cta-btn watta-reviews-page__cta-btn--primary">
              {r.loginButton}
            </Link>
          </section>
        ) : (
          <section className="watta-reviews-page__cta-card watta-reviews-page__cta-card--logged" aria-labelledby="reviews-write-cta">
            <h2 id="reviews-write-cta" className="watta-reviews-page__cta-title">
              {r.writeBlockTitle}
            </h2>
            <p className="watta-reviews-page__cta-desc">{r.writeBlockDesc}</p>
            {eligibleOrders.length > 0 ? (
              <ul className="watta-reviews-page__order-pick-list">
                {eligibleOrders.map((order) => (
                  <li key={order.id}>
                    <button
                      type="button"
                      className="watta-reviews-page__order-pick"
                      onClick={() => setComposeOrder(order)}
                    >
                      <span className="watta-reviews-page__order-pick-label">
                        {r.orderPickLabel.replace('{{id}}', String(order.id))}
                      </span>
                      <span className="watta-reviews-page__order-pick-date">
                        {formatReviewDate(order.createdAt, language)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="watta-reviews-page__cta-muted">{r.writeBlockNoOrders}</p>
            )}
          </section>
        )}

        <section className="watta-reviews-page__feed" aria-labelledby="reviews-feed-heading">
          <h2 id="reviews-feed-heading" className="watta-reviews-page__feed-title">
            {r.feedTitle}
          </h2>

          {list === null ? (
            <div className="watta-reviews-page__loading" aria-busy="true">
              <div className="h-11 w-11 animate-spin rounded-2xl border-2 border-[#145142]/25 border-t-[#145142]" aria-hidden />
            </div>
          ) : list.length === 0 ? (
            <p className="watta-reviews-page__empty" role="status">
              {r.empty}
            </p>
          ) : (
            <div className="watta-reviews-grid" role="list">
              {list.map((rev, i) => (
                <motion.article
                  key={rev.id}
                  role="listitem"
                  className="watta-review-card"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <div className="watta-review-card__head">
                    <div>
                      <p className="watta-review-card__author">{rev.authorName}</p>
                      <time className="watta-review-card__date" dateTime={rev.createdAt}>
                        {formatReviewDate(rev.createdAt, language)}
                      </time>
                    </div>
                    <StarsRow rating={rev.rating} />
                  </div>
                  <p className="watta-review-card__text">{rev.text}</p>
                  {rev.images?.length ? (
                    <div className="watta-review-card__photos">
                      {rev.images.map((src, ii) => (
                        <div key={ii} className="watta-review-card__photo">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={src} alt="" loading="lazy" decoding="async" />
                        </div>
                      ))}
                    </div>
                  ) : null}
                </motion.article>
              ))}
            </div>
          )}
        </section>
      </div>

      {composeOrder ? (
        <ReviewComposeModal
          orderId={composeOrder.id}
          orderLabel={r.orderPickLabel.replace('{{id}}', String(composeOrder.id))}
          onClose={() => setComposeOrder(null)}
          onSubmitted={handleReviewSubmitted}
        />
      ) : null}
    </div>
  )
}
