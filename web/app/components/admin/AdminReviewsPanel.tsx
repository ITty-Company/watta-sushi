'use client'

import { useCallback, useState } from 'react'
import { Star, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

export type AdminReviewRow = {
  id: number
  orderId: number
  userId: number
  rating: number
  text: string
  images: string[]
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
    } finally {
      setSaving(false)
    }
  }

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

  return (
    <div className="space-y-4">
      {reviews.map((row) => (
        <article
          key={row.id}
          className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5"
        >
          <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-gray-900">
                {row.authorName}
                <span className="ml-2 text-sm font-normal text-gray-500">#{row.orderId}</span>
              </p>
              <p className="text-xs text-gray-500">{row.authorEmail}</p>
              <p className="text-xs text-gray-400">{new Date(row.createdAt).toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${i < row.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
                  />
                ))}
              </div>
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
