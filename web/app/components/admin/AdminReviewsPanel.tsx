'use client'

import { useCallback, useState } from 'react'
import { Star, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

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
  const [editingId, setEditingId] = useState<number | null>(null)
  const [rating, setRating] = useState(5)
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const [publishingId, setPublishingId] = useState<number | null>(null)

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
      toast.error('Вы не авторизованы')
      return
    }
    const txt = text.trim()
    if (txt.length < 3) {
      toast.error('Текст слишком короткий')
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
        toast.error((data.message as string) || 'Не удалось сохранить')
        return
      }
      toast.success('Отзыв обновлён')
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
        toast.error('Вы не авторизованы')
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
          toast.error((data.message as string) || 'Не удалось обновить')
          return
        }
        toast.success(published ? 'Отзыв опубликован на сайте' : 'Отзыв снят с публикации')
        await onReload()
        window.dispatchEvent(new CustomEvent('reviewsUpdated'))
      } finally {
        setPublishingId(null)
      }
    },
    [getAuthHeaders, onReload],
  )

  const deleteReview = useCallback(
    async (id: number) => {
      if (!confirm('Удалить этот отзыв?')) return
      const headers = getAuthHeaders()
      if (!headers) {
        toast.error('Вы не авторизованы')
        return
      }
      const res = await fetch(`/api/reviews/${id}`, {
        method: 'DELETE',
        headers,
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error((data.message as string) || 'Не удалось удалить')
        return
      }
      toast.success('Отзыв удалён')
      if (editingId === id) cancelEdit()
      await onReload()
      window.dispatchEvent(new CustomEvent('reviewsUpdated'))
    },
    [editingId, getAuthHeaders, onReload],
  )

  if (reviews.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-gray-200 bg-white/80 p-8 text-center text-gray-500">
        Пока нет отзывов от клиентов.
      </p>
    )
  }

  const pendingCount = reviews.filter((row) => !row.published).length

  return (
    <div className="space-y-4">
      {pendingCount > 0 ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
          На модерации: {pendingCount}. Опубликуйте отзыв — он появится на странице /reviews.
        </p>
      ) : null}
      {reviews.map((row) => (
        <article
          key={row.id}
          className={`rounded-xl border bg-white p-4 shadow-sm sm:p-5 ${
            row.published ? 'border-gray-200' : 'border-amber-300 ring-1 ring-amber-100'
          }`}
        >
          <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-gray-900">
                {row.authorName}
                {row.orderId != null ? (
                  <span className="ml-2 text-sm font-normal text-gray-500">#{row.orderId}</span>
                ) : (
                  <span className="ml-2 text-sm font-normal text-gray-500">без заказа</span>
                )}
              </p>
              <p className="text-xs text-gray-500">{row.authorEmail}</p>
              <p className="text-xs text-gray-400">{new Date(row.createdAt).toLocaleString()}</p>
              <span
                className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                  row.published
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-900'
                }`}
              >
                {row.published ? 'На сайте' : 'Модерация'}
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
                  className="rounded-lg bg-[#145142] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0f3d32] disabled:opacity-60"
                >
                  {publishingId === row.id ? '…' : 'Опубликовать'}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={publishingId === row.id}
                  onClick={() => void setPublished(row.id, false)}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                >
                  Снять
                </button>
              )}
              <button
                type="button"
                onClick={() => void deleteReview(row.id)}
                className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                aria-label="Удалить"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {editingId === row.id ? (
            <div className="space-y-3 border-t border-gray-100 pt-3">
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
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void saveEdit()}
                  className="rounded-lg bg-[#145142] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f3d32] disabled:opacity-60"
                >
                  {saving ? '…' : 'Сохранить'}
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700"
                >
                  Отмена
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">{row.text}</p>
              {row.images?.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {row.images.map((src, i) => (
                    <div key={i} className="h-16 w-16 overflow-hidden rounded-lg border border-gray-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" className="h-full w-full object-cover" />
                    </div>
                  ))}
                </div>
              ) : null}
              <button
                type="button"
                onClick={() => startEdit(row)}
                className="mt-3 text-sm font-semibold text-[#145142] hover:underline"
              >
                Редактировать
              </button>
            </>
          )}
        </article>
      ))}
    </div>
  )
}
