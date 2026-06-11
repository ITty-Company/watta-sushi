'use client'

import { useCallback, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Star } from '@/lib/wattaInlineIcons'
import toast from 'react-hot-toast'
import { useLanguage } from '../../context/LanguageContext'

export type AdminReviewRow = {
  id: number
  orderId: number | null
  userId: number
  rating: number
  text: string
  images: string[]
  published: boolean
  createdAt: string
  authorName: string
  authorEmail: string
}

type AdminReviewsPanelProps = {
  reviews: AdminReviewRow[]
  onReload: () => Promise<void>
  getAuthHeaders: () => Record<string, string> | null
}

export default function AdminReviewsPanel({ reviews, onReload, getAuthHeaders }: AdminReviewsPanelProps) {
  const { t, adminUiLanguage } = useLanguage()
  const r = t.adminPanel.reviews
  const auth = t.adminPage.auth
  const [editingId, setEditingId] = useState<number | null>(null)
  const [rating, setRating] = useState(5)
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const [publishingId, setPublishingId] = useState<number | null>(null)

  const locale = adminUiLanguage === 'ru' ? 'ru-RU' : 'uk-UA'

  const startEdit = (row: AdminReviewRow) => {
    setEditingId(row.id)
    setRating(row.rating)
    setText(row.text)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setRating(5)
    setText('')
  }

  const saveEdit = async () => {
    if (editingId == null) return
    const headers = getAuthHeaders()
    if (!headers) {
      toast.error(auth.notAuthorized)
      return
    }
    const txt = text.trim()
    if (txt.length < 3) {
      toast.error(r.textTooShort)
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/reviews/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ rating, text: txt }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error((data.message as string) || r.saveError)
        return
      }
      toast.success(r.saved)
      cancelEdit()
      await onReload()
      window.dispatchEvent(new CustomEvent('reviewsUpdated'))
    } finally {
      setSaving(false)
    }
  }

  const setPublished = useCallback(
    async (id: number, published: boolean) => {
      const headers = getAuthHeaders()
      if (!headers) {
        toast.error(auth.notAuthorized)
        return
      }
      setPublishingId(id)
      try {
        const res = await fetch(`/api/reviews/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...headers },
          body: JSON.stringify({ published }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          toast.error((data.message as string) || r.updateError)
          return
        }
        toast.success(published ? r.published : r.unpublished)
        await onReload()
        window.dispatchEvent(new CustomEvent('reviewsUpdated'))
      } finally {
        setPublishingId(null)
      }
    },
    [auth.notAuthorized, getAuthHeaders, onReload, r.published, r.unpublished, r.updateError],
  )

  const deleteReview = useCallback(
    async (id: number) => {
      if (!confirm(r.deleteConfirm)) return
      const headers = getAuthHeaders()
      if (!headers) {
        toast.error(auth.notAuthorized)
        return
      }
      const res = await fetch(`/api/reviews/${id}`, {
        method: 'DELETE',
        headers,
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error((data.message as string) || r.deleteError)
        return
      }
      toast.success(r.deleted)
      if (editingId === id) cancelEdit()
      await onReload()
      window.dispatchEvent(new CustomEvent('reviewsUpdated'))
    },
    [auth.notAuthorized, editingId, getAuthHeaders, onReload, r.deleteConfirm, r.deleteError, r.deleted],
  )

  if (reviews.length === 0) {
    return (
      <p className="admin-watta-empty-state rounded-xl border border-dashed border-watta-action/20 bg-white/80 p-8 text-center text-watta-action/60">
        {r.empty}
      </p>
    )
  }

  const pendingCount = reviews.filter((row) => !row.published).length

  return (
    <div className="space-y-4">
      {pendingCount > 0 ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
          {r.pendingBanner.replace('{{count}}', String(pendingCount))}
        </p>
      ) : null}
      {reviews.map((row) => (
        <article
          key={row.id}
          className={`admin-watta-hover-lift rounded-xl border bg-white p-4 shadow-sm sm:p-5 ${
            row.published ? 'border-watta-action/12' : 'border-amber-300 ring-1 ring-amber-100'
          }`}
        >
          <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-[#0f241e]">
                {row.authorName}
                {row.orderId != null ? (
                  <span className="ml-2 text-sm font-normal text-watta-action/55">#{row.orderId}</span>
                ) : (
                  <span className="ml-2 text-sm font-normal text-watta-action/55">{r.noOrder}</span>
                )}
              </p>
              <p className="text-xs text-watta-action/55">{row.authorEmail}</p>
              <p className="text-xs text-watta-action/45">
                {new Date(row.createdAt).toLocaleString(locale)}
              </p>
              <span
                className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                  row.published
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-900'
                }`}
              >
                {row.published ? r.statusPublished : r.statusModeration}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${i < row.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
                  />
                ))}
              </div>
              {!row.published ? (
                <button
                  type="button"
                  disabled={publishingId === row.id}
                  onClick={() => void setPublished(row.id, true)}
                  className="rounded-lg bg-watta-action px-3 py-1.5 text-xs font-semibold text-white hover:bg-watta-action-hover disabled:opacity-60"
                >
                  {publishingId === row.id ? '…' : r.publishBtn}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={publishingId === row.id}
                  onClick={() => void setPublished(row.id, false)}
                  className="rounded-lg border border-watta-action/15 px-3 py-1.5 text-xs font-semibold text-watta-action hover:bg-watta-action/5 disabled:opacity-60"
                >
                  {r.unpublishBtn}
                </button>
              )}
              <button
                type="button"
                onClick={() => void deleteReview(row.id)}
                className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                aria-label={r.deleteAria}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {editingId === row.id ? (
            <div className="space-y-3 border-t border-watta-action/10 pt-3">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" onClick={() => setRating(n)} className="p-0.5">
                    <Star
                      className={`h-6 w-6 ${n <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
                    />
                  </button>
                ))}
              </div>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-watta-action/15 px-3 py-2 text-sm"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void saveEdit()}
                  className="rounded-lg bg-watta-action px-4 py-2 text-sm font-semibold text-white hover:bg-watta-action-hover disabled:opacity-60"
                >
                  {saving ? '…' : r.saveBtn}
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="rounded-lg border border-watta-action/15 px-4 py-2 text-sm font-semibold text-watta-action"
                >
                  {r.cancelBtn}
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#0f241e]/85">{row.text}</p>
              {row.images?.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {row.images.map((src, i) => (
                    <div key={i} className="h-16 w-16 overflow-hidden rounded-lg border border-watta-action/10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" className="h-full w-full object-cover" />
                    </div>
                  ))}
                </div>
              ) : null}
              <button
                type="button"
                onClick={() => startEdit(row)}
                className="mt-3 text-sm font-semibold text-watta-action hover:underline"
              >
                {r.editBtn}
              </button>
            </>
          )}
        </article>
      ))}
    </div>
  )
}
