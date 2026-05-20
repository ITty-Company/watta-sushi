'use client'

import { useCallback, useState } from 'react'
import { Star, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useLanguage } from '@/app/context/LanguageContext'
import { getBearerAuthHeaders } from '@/lib/authHeaders'

export type ReviewComposeResult = {
  id: number
  rating: number
  text: string
  images?: unknown
}

type ReviewComposeModalProps = {
  orderId: number
  orderLabel: string
  onClose: () => void
  onSubmitted: (review: ReviewComposeResult) => void
}

export default function ReviewComposeModal({
  orderId,
  orderLabel,
  onClose,
  onSubmitted,
}: ReviewComposeModalProps) {
  const { t } = useLanguage()
  const cp = t.clientProfile
  const [reviewText, setReviewText] = useState('')
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewImages, setReviewImages] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  const onPickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return
    const max = 6
    for (let i = 0; i < files.length && reviewImages.length < max; i++) {
      const f = files[i]
      if (!f.type.startsWith('image/')) continue
      if (f.size > 2_000_000) {
        toast.error(t.appToasts.fileTooBig)
        continue
      }
      const reader = new FileReader()
      reader.onload = () => {
        const r = String(reader.result || '')
        if (r) {
          setReviewImages((prev) => (prev.length >= max ? prev : [...prev, r]))
        }
      }
      reader.readAsDataURL(f)
    }
    e.target.value = ''
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
          orderId,
          rating: reviewRating,
          text: txt,
          images: reviewImages,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error((data.message as string) || t.appToasts.reviewSaveError)
        return
      }
      toast.success(t.appToasts.reviewThanks)
      onSubmitted({
        id: data.id,
        rating: data.rating,
        text: data.text,
        images: data.images,
      })
      onClose()
    } finally {
      setSubmitting(false)
    }
  }, [orderId, reviewImages, reviewRating, reviewText, onClose, onSubmitted, t.appToasts])

  return (
    <div
      className="fixed inset-0 z-[500] flex items-end justify-center bg-black/45 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-compose-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-[1.35rem] border border-[#145142]/12 bg-white p-5 shadow-2xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 id="review-compose-title" className="text-lg font-bold text-[#0f2a22]">
              {cp.reviewModalTitle}
            </h3>
            <p className="mt-1 text-sm text-[#145142]/70">{orderLabel}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
            aria-label={t.auth.back}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4 flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setReviewRating(n)}
              className="rounded p-0.5 transition hover:scale-110"
              aria-label={`${n}`}
            >
              <Star
                className={`h-8 w-8 ${
                  n <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'
                }`}
              />
            </button>
          ))}
        </div>

        <textarea
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          placeholder={cp.reviewText}
          rows={4}
          className="w-full resize-none rounded-xl border border-[#145142]/18 bg-[#f8faf9] px-4 py-3 text-[15px] text-[#0f2a22] outline-none ring-[#145142]/30 focus:ring-2"
        />

        <div className="mt-4">
          <p className="mb-2 text-sm font-semibold text-gray-700">{cp.reviewPhotos}</p>
          <label className="inline-flex cursor-pointer items-center rounded-lg border border-dashed border-[#145142]/25 px-3 py-2 text-sm font-semibold text-[#145142] hover:bg-[#145142]/5">
            <input type="file" accept="image/*" multiple className="sr-only" onChange={onPickFiles} />
            +
          </label>
          {reviewImages.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {reviewImages.map((src, i) => (
                <div key={i} className="relative h-16 w-16 overflow-hidden rounded-lg border border-[#145142]/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    className="absolute right-0 top-0 bg-black/50 px-1 text-xs text-white"
                    onClick={() => setReviewImages((prev) => prev.filter((_, j) => j !== i))}
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
          disabled={submitting}
          onClick={() => void submitReview()}
          className="mt-5 w-full rounded-xl bg-[#145142] py-3 text-sm font-bold text-white transition hover:bg-[#0f3d32] disabled:opacity-60"
        >
          {submitting ? '…' : cp.reviewSend}
        </button>
      </div>
    </div>
  )
}
