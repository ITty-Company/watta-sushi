'use client'

import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Camera, CheckCircle2, Star, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useLanguage } from '@/app/context/LanguageContext'
import { getBearerAuthHeaders } from '@/lib/authHeaders'
import { readReviewImageDataUrl } from '@/lib/compressReviewImage'
import { getReviewSubmitErrorMessage } from '@/lib/reviewSubmitErrors'

export type ReviewComposeResult = {
  id: number
  rating: number
  text: string
  images: string[]
  createdAt: string
  authorName: string
}

const RATING_HINTS: Record<string, string[]> = {
  uk: ['Погано', 'Так собі', 'Нормально', 'Добре', 'Чудово!'],
  ru: ['Плохо', 'Так себе', 'Нормально', 'Хорошо', 'Отлично!'],
  en: ['Poor', 'Fair', 'Good', 'Great', 'Excellent!'],
  nl: ['Slecht', 'Matig', 'Goed', 'Erg goed', 'Uitstekend!'],
}

type ReviewComposeModalProps = {
  orderId?: number
  orderLabel?: string
  onClose: () => void
  onSubmitted: (review: ReviewComposeResult) => void
}

export default function ReviewComposeModal({
  orderId,
  orderLabel,
  onClose,
  onSubmitted,
}: ReviewComposeModalProps) {
  const { t, language } = useLanguage()
  const cp = t.clientProfile
  const rp = t.reviewsPublic
  const [reviewText, setReviewText] = useState('')
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewImages, setReviewImages] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [phase, setPhase] = useState<'form' | 'thanks'>('form')
  const [portalReady, setPortalReady] = useState(false)

  useEffect(() => {
    setPortalReady(true)
  }, [])

  const ratingHints = RATING_HINTS[language] ?? RATING_HINTS.en
  const ratingHint = ratingHints[reviewRating - 1] ?? ''

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.body.classList.add('watta-review-compose-open')
    return () => {
      document.body.style.overflow = prev
      document.body.classList.remove('watta-review-compose-open')
    }
  }, [])

  const finishThanks = useCallback(() => {
    onClose()
  }, [onClose])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (phase === 'thanks') finishThanks()
        else onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [finishThanks, onClose, phase])

  const onPickFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return
    e.target.value = ''
    const max = 6
    const maxTotalChars = 3_800_000
    const prepared: string[] = []

    for (const f of Array.from(files)) {
      if (prepared.length >= max) break
      const dataUrl = await readReviewImageDataUrl(f)
      if (dataUrl) prepared.push(dataUrl)
    }

    if (!prepared.length) return

    setReviewImages((prev) => {
      if (prev.length >= max) return prev
      let total = prev.reduce((sum, src) => sum + src.length, 0)
      const merged = [...prev]
      for (const src of prepared) {
        if (merged.length >= max) break
        if (total + src.length > maxTotalChars) break
        merged.push(src)
        total += src.length
      }
      return merged.length === prev.length ? prev : merged
    })
  }

  const submitReview = useCallback(async () => {
    const txt = reviewText.trim()
    if (txt.length < 3) {
      toast.error(t.appToasts.reviewNeedText)
      return
    }
    const auth = getBearerAuthHeaders()
    if (!('Authorization' in auth)) {
      toast.error(t.appToasts.loginAgain)
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...auth,
        },
        body: JSON.stringify({
          ...(orderId != null ? { orderId } : {}),
          rating: reviewRating,
          text: txt,
          images: reviewImages,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(
          getReviewSubmitErrorMessage(res.status, data.message as string | undefined, {
            loginAgain: t.appToasts.loginAgain,
            reviewNeedText: t.appToasts.reviewNeedText,
            reviewSaveError: t.appToasts.reviewSaveError,
            reviewDuplicate: t.appToasts.reviewDuplicate,
            reviewImageRejected: t.appToasts.reviewImageRejected,
          }),
        )
        return
      }
      const images = Array.isArray(data.images)
        ? data.images.filter((x: unknown): x is string => typeof x === 'string')
        : []
      const payload: ReviewComposeResult = {
        id: Number(data.id),
        rating: Number(data.rating),
        text: String(data.text ?? txt),
        images,
        createdAt:
          typeof data.createdAt === 'string'
            ? data.createdAt
            : new Date().toISOString(),
        authorName:
          typeof data.authorName === 'string' && data.authorName.trim()
            ? data.authorName.trim()
            : t.appToasts.reviewGuestName,
      }
      window.dispatchEvent(new CustomEvent('reviewsUpdated'))
      onSubmitted(payload)
      setPhase('thanks')
    } catch {
      toast.error(t.appToasts.networkError)
    } finally {
      setSubmitting(false)
    }
  }, [orderId, reviewImages, reviewRating, reviewText, onSubmitted, t.appToasts])

  if (!portalReady) return null

  return createPortal(
    <div
      className="watta-review-compose-backdrop fixed inset-0 z-[11060] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-compose-title"
      onClick={onClose}
    >
      <div
        className={`watta-review-compose watta-review-compose--glass${phase === 'thanks' ? ' watta-review-compose--thanks' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="watta-review-compose__ambient" aria-hidden />
        {phase === 'thanks' ? (
          <div className="watta-review-compose__thanks" role="status">
            <div className="watta-review-compose__thanks-icon" aria-hidden>
              <CheckCircle2 className="h-10 w-10" strokeWidth={2} />
            </div>
            <h3 id="review-compose-title" className="watta-review-compose__thanks-title">
              {rp.reviewThanksTitle}
            </h3>
            <p className="watta-review-compose__thanks-text">{rp.reviewThanksBody}</p>
            <button
              type="button"
              onClick={finishThanks}
              className="watta-review-compose__submit watta-review-compose__submit--thanks"
            >
              {rp.reviewThanksClose}
            </button>
          </div>
        ) : (
          <>
        <div className="watta-review-compose__head">
          <div className="watta-review-compose__head-copy">
            <h3 id="review-compose-title" className="watta-review-compose__title">
              {cp.reviewModalTitle}
            </h3>
            {orderLabel ? <p className="watta-review-compose__order">{orderLabel}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="watta-review-compose__close"
            aria-label={t.auth.back}
          >
            <X className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>

        <div className="watta-review-compose__rating-block">
          <div className="watta-review-compose__stars">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setReviewRating(n)}
                className="watta-review-compose__star-btn"
                aria-label={`${n}`}
              >
                <Star
                  className={`watta-review-compose__star ${
                    n <= reviewRating ? 'watta-review-compose__star--on' : ''
                  }`}
                />
              </button>
            ))}
          </div>
          <p className="watta-review-compose__rating-hint" aria-live="polite">
            {ratingHint}
          </p>
        </div>

        <textarea
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          placeholder={cp.reviewText}
          rows={4}
          maxLength={4000}
          className="watta-review-compose__textarea"
        />
        <p className="watta-review-compose__counter">{reviewText.trim().length} / 4000</p>

        <div className="watta-review-compose__photos">
          <p className="watta-review-compose__photos-label">{cp.reviewPhotos}</p>
          <label className="watta-review-compose__upload">
            <Camera className="h-5 w-5" aria-hidden />
            <input type="file" accept="image/*" multiple className="sr-only" onChange={onPickFiles} />
          </label>
          {reviewImages.length > 0 ? (
            <div className="watta-review-compose__thumbs">
              {reviewImages.map((src, i) => (
                <div key={i} className="watta-review-compose__thumb">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    className="watta-review-compose__thumb-remove"
                    onClick={() => setReviewImages((prev) => prev.filter((_, j) => j !== i))}
                    aria-label="×"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <button
          type="button"
          disabled={submitting || reviewText.trim().length < 3}
          onClick={() => void submitReview()}
          className="watta-review-compose__submit"
        >
          {submitting ? '…' : cp.reviewSend}
        </button>
          </>
        )}
      </div>
    </div>,
    document.body,
  )
}
