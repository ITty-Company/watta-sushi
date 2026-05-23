'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import toast from 'react-hot-toast'

export type AdminBonusUser = {
  id: number
  name: string | null
  email: string
  phone: string | null
  bonusBalance: number
  bonusCashbackPercentOverride: number | null
}

type Props = {
  user: AdminBonusUser
  globalCashbackPercent: number
  globalCashbackEnabled: boolean
  onClose: () => void
  onSaved: (updated: AdminBonusUser) => void
}

function adminAuthHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' }
}

export default function AdminUserBonusEditor({
  user,
  globalCashbackPercent,
  globalCashbackEnabled,
  onClose,
  onSaved,
}: Props) {
  const [usePersonalPercent, setUsePersonalPercent] = useState(
    user.bonusCashbackPercentOverride != null,
  )
  const [personalPercent, setPersonalPercent] = useState(
    user.bonusCashbackPercentOverride != null
      ? String(user.bonusCashbackPercentOverride)
      : String(globalCashbackPercent),
  )
  const [balanceDelta, setBalanceDelta] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setUsePersonalPercent(user.bonusCashbackPercentOverride != null)
    setPersonalPercent(
      user.bonusCashbackPercentOverride != null
        ? String(user.bonusCashbackPercentOverride)
        : String(globalCashbackPercent),
    )
    setBalanceDelta('')
  }, [user, globalCashbackPercent])

  const effectivePercent = usePersonalPercent
    ? clampPercent(parseFloat(personalPercent) || 0)
    : globalCashbackEnabled
      ? globalCashbackPercent
      : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        bonusCashbackPercentOverride: usePersonalPercent
          ? clampPercent(parseFloat(personalPercent) || 0)
          : null,
      }
      const delta = balanceDelta.trim() === '' ? null : parseFloat(balanceDelta)
      if (delta != null && Number.isFinite(delta) && delta !== 0) {
        body.bonusBalanceDelta = delta
      }

      const res = await fetch(`/api/crm/users/${user.id}/bonus`, {
        method: 'PATCH',
        headers: adminAuthHeaders(),
        body: JSON.stringify(body),
      })
      const json = (await res.json().catch(() => null)) as AdminBonusUser & { message?: string }
      if (!res.ok) {
        toast.error(json?.message || 'Не вдалося зберегти')
        return
      }
      toast.success('Збережено')
      onSaved({
        id: json.id,
        name: json.name,
        email: json.email,
        phone: json.phone,
        bonusBalance: Number(json.bonusBalance ?? 0),
        bonusCashbackPercentOverride:
          json.bonusCashbackPercentOverride != null
            ? Number(json.bonusCashbackPercentOverride)
            : null,
      })
      onClose()
    } catch {
      toast.error('Помилка мережі')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4">
      <div
        role="dialog"
        aria-labelledby="bonus-editor-title"
        className="relative w-full max-w-md rounded-2xl border-2 border-[#145142]/15 bg-white p-6 shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-2 text-gray-500 hover:bg-gray-100"
          aria-label="Закрити"
        >
          <X size={20} />
        </button>

        <h3 id="bonus-editor-title" className="mb-1 text-lg font-bold text-[#145142]">
          Бонуси клієнта
        </h3>
        <p className="mb-4 text-sm text-gray-600">
          {user.name || '—'} · {user.email}
        </p>

        <p className="mb-4 rounded-xl bg-[#145142]/5 px-3 py-2 text-sm">
          Баланс:{' '}
          <strong className="tabular-nums text-[#145142]">
            {Number(user.bonusBalance).toFixed(2)} €
          </strong>
          <br />
          Загальний кешбэк сайту:{' '}
          <strong>
            {globalCashbackEnabled ? `${globalCashbackPercent}%` : 'вимкнено'}
          </strong>
          <br />
          Ефективний % для клієнта: <strong>{effectivePercent}%</strong>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-[#145142]">
            <input
              type="checkbox"
              checked={usePersonalPercent}
              onChange={(e) => setUsePersonalPercent(e.target.checked)}
              className="h-4 w-4 accent-[#145142]"
            />
            Персональний % кешбэку (вище загального)
          </label>

          {usePersonalPercent ? (
            <div>
              <label className="mb-1 block text-xs font-bold text-[#145142]">
                Кешбэк для цього клієнта, %
              </label>
              <input
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={personalPercent}
                onChange={(e) => setPersonalPercent(e.target.value)}
                className="w-full rounded-xl border-2 border-[#145142]/20 p-3 font-bold outline-none focus:border-[#145142]"
                required
              />
            </div>
          ) : (
            <p className="text-xs text-gray-500">
              Використовується загальний відсоток з налаштувань сайту.
            </p>
          )}

          <div>
            <label className="mb-1 block text-xs font-bold text-[#145142]">
              Коригування балансу (± €), необовʼязково
            </label>
            <input
              type="number"
              step={0.01}
              value={balanceDelta}
              onChange={(e) => setBalanceDelta(e.target.value)}
              placeholder="Наприклад: 5 або -2.5"
              className="w-full rounded-xl border-2 border-[#145142]/20 p-3 outline-none focus:border-[#145142]"
            />
            <p className="mt-1 text-xs text-gray-400">
              Додати або зняти бонуси вручну (подарунок, виправлення).
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border-2 border-[#145142]/20 py-3 font-semibold text-[#145142]"
            >
              Скасувати
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl bg-[#145142] py-3 font-bold text-white disabled:opacity-50"
            >
              {saving ? '…' : 'Зберегти'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function clampPercent(n: number): number {
  if (!Number.isFinite(n)) return 0
  return Math.min(100, Math.max(0, n))
}
