'use client'

import { useEffect, useState } from 'react'
import { X } from '@/lib/wattaInlineIcons'
import toast from 'react-hot-toast'
import { useLanguage } from '../../context/LanguageContext'

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
  const { t } = useLanguage()
  const b = t.adminPanel.userBonus
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
        toast.error(json?.message || b.saveError)
        return
      }
      toast.success(b.saved)
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
      toast.error(b.networkError)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4">
      <div
        role="dialog"
        aria-labelledby="bonus-editor-title"
        className="admin-watta-modal-panel relative w-full max-w-md rounded-2xl border-2 border-watta-action/15 bg-white p-6 shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-2 text-watta-action/55 hover:bg-watta-action/10"
          aria-label={b.closeAria}
        >
          <X size={20} />
        </button>

        <h3 id="bonus-editor-title" className="mb-1 text-lg font-bold text-watta-action">
          {b.title}
        </h3>
        <p className="mb-4 text-sm text-watta-action/70">
          {user.name || '—'} · {user.email}
        </p>

        <p className="mb-4 rounded-xl bg-watta-action/5 px-3 py-2 text-sm">
          {b.balanceLabel}{' '}
          <strong className="tabular-nums text-watta-action">
            {Number(user.bonusBalance).toFixed(2)} €
          </strong>
          <br />
          {b.globalCashbackLabel}{' '}
          <strong>
            {globalCashbackEnabled ? `${globalCashbackPercent}%` : b.disabled}
          </strong>
          <br />
          {b.effectivePercentLabel} <strong>{effectivePercent}%</strong>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-watta-action">
            <input
              type="checkbox"
              checked={usePersonalPercent}
              onChange={(e) => setUsePersonalPercent(e.target.checked)}
              className="h-4 w-4 accent-[var(--watta-brand-action)]"
            />
            {b.personalPercentCheckbox}
          </label>

          {usePersonalPercent ? (
            <div>
              <label className="mb-1 block text-xs font-bold text-watta-action">
                {b.personalPercentField}
              </label>
              <input
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={personalPercent}
                onChange={(e) => setPersonalPercent(e.target.value)}
                className="w-full rounded-xl border-2 border-watta-action/20 p-3 font-bold outline-none focus:border-watta-action"
                required
              />
            </div>
          ) : (
            <p className="text-xs text-watta-action/55">{b.useGlobalHint}</p>
          )}

          <div>
            <label className="mb-1 block text-xs font-bold text-watta-action">
              {b.adjustmentLabel}
            </label>
            <input
              type="number"
              step={0.01}
              value={balanceDelta}
              onChange={(e) => setBalanceDelta(e.target.value)}
              placeholder={b.adjustmentPlaceholder}
              className="w-full rounded-xl border-2 border-watta-action/20 p-3 outline-none focus:border-watta-action"
            />
            <p className="mt-1 text-xs text-watta-action/45">{b.adjustmentHint}</p>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border-2 border-watta-action/20 py-3 font-semibold text-watta-action"
            >
              {b.cancelBtn}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl bg-watta-action py-3 font-bold text-white disabled:opacity-50"
            >
              {saving ? '…' : b.saveBtn}
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
