'use client'

import { useCallback, useEffect, useState } from 'react'
import { Mail, Shield, Trash2 } from 'lucide-react'
import { Phone, Plus } from '@/lib/wattaInlineIcons'
import toast from 'react-hot-toast'
import { useLanguage } from '../../context/LanguageContext'

export type AdminPhoneRow = {
  id: number
  phone: string
  phoneDigits: string
  label: string | null
  isPrimary: boolean
  createdAt: string
}

export type AdminEmailRow = {
  id: number
  email: string
  label: string | null
  isPrimary: boolean
  createdAt: string
}

type AdminAdminPhonesPanelProps = {
  authHeaders: HeadersInit | null
  onChanged?: () => void
}

export default function AdminAdminPhonesPanel({
  authHeaders,
  onChanged,
}: AdminAdminPhonesPanelProps) {
  const { t, adminUiLanguage } = useLanguage()
  const p = t.adminPanel.adminPhones
  const common = t.adminPage.common
  const locale = adminUiLanguage === 'ru' ? 'ru-RU' : 'uk-UA'

  const [rows, setRows] = useState<AdminPhoneRow[]>([])
  const [emailRows, setEmailRows] = useState<AdminEmailRow[]>([])
  const [loading, setLoading] = useState(true)
  const [emailsLoading, setEmailsLoading] = useState(true)
  const [phoneInput, setPhoneInput] = useState('')
  const [emailInput, setEmailInput] = useState('')
  const [labelInput, setLabelInput] = useState('')
  const [emailLabelInput, setEmailLabelInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [emailSaving, setEmailSaving] = useState(false)

  const loadRows = useCallback(async () => {
    if (!authHeaders) return
    setLoading(true)
    try {
      const res = await fetch('/api/crm/admin-phones', { headers: authHeaders, cache: 'no-store' })
      if (!res.ok) throw new Error('load failed')
      const data = await res.json()
      setRows(Array.isArray(data) ? data : [])
    } catch {
      toast.error(p.loadError)
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [authHeaders, p.loadError])

  const loadEmailRows = useCallback(async () => {
    if (!authHeaders) return
    setEmailsLoading(true)
    try {
      const res = await fetch('/api/crm/admin-emails', { headers: authHeaders, cache: 'no-store' })
      if (!res.ok) throw new Error('load failed')
      const data = await res.json()
      setEmailRows(Array.isArray(data) ? data : [])
    } catch {
      toast.error(p.emailsLoadError)
      setEmailRows([])
    } finally {
      setEmailsLoading(false)
    }
  }, [authHeaders, p.emailsLoadError])

  useEffect(() => {
    void loadRows()
    void loadEmailRows()
  }, [loadRows, loadEmailRows])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!authHeaders) return
    const phone = phoneInput.trim()
    if (!phone) {
      toast.error(p.phoneRequired)
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/crm/admin-phones', {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, label: labelInput.trim() || undefined }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error((data.message as string) || p.addError)
      }
      toast.success(p.added)
      setPhoneInput('')
      setLabelInput('')
      await loadRows()
      onChanged?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : common.error)
    } finally {
      setSaving(false)
    }
  }

  const handleAddEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!authHeaders) return
    const email = emailInput.trim()
    if (!email) {
      toast.error(p.emailRequired)
      return
    }
    setEmailSaving(true)
    try {
      const res = await fetch('/api/crm/admin-emails', {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, label: emailLabelInput.trim() || undefined }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error((data.message as string) || p.emailAddError)
      }
      toast.success(p.emailAdded)
      setEmailInput('')
      setEmailLabelInput('')
      await loadEmailRows()
      onChanged?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : common.error)
    } finally {
      setEmailSaving(false)
    }
  }

  const handleDelete = async (row: AdminPhoneRow) => {
    if (!authHeaders || row.isPrimary) return
    if (!confirm(p.deleteConfirm.replace('{{phone}}', row.phone))) return
    try {
      const res = await fetch(`/api/crm/admin-phones/${row.id}`, {
        method: 'DELETE',
        headers: authHeaders,
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error((data.message as string) || p.error)
      }
      toast.success(p.deleted)
      await loadRows()
      onChanged?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : common.error)
    }
  }

  const handleDeleteEmail = async (row: AdminEmailRow) => {
    if (!authHeaders || row.isPrimary) return
    if (!confirm(p.emailDeleteConfirm.replace('{{email}}', row.email))) return
    try {
      const res = await fetch(`/api/crm/admin-emails/${row.id}`, {
        method: 'DELETE',
        headers: authHeaders,
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error((data.message as string) || p.error)
      }
      toast.success(p.emailDeleted)
      await loadEmailRows()
      onChanged?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : common.error)
    }
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="admin-watta-glass-panel">
        <div className="mb-4 flex items-start gap-3 sm:mb-6">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-watta-action/10 text-watta-action">
            <Shield size={22} aria-hidden />
          </div>
          <div>
            <h2 className="admin-watta-section-title admin-watta-section-title--brand">
              {p.title}
            </h2>
            <p className="admin-watta-section-lead mt-1 text-sm">{p.description}</p>
          </div>
        </div>

        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-watta-action/70">
          {p.colPhone}
        </h3>

        <form onSubmit={handleAdd} className="mb-6 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold text-watta-action">{p.phoneLabel}</span>
            <div className="relative">
              <Phone size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-watta-action/40" />
              <input
                type="tel"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="+380..."
                className="w-full rounded-xl border border-watta-action/20 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-watta-action/50"
                autoComplete="tel"
              />
            </div>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold text-watta-action">{p.noteLabel}</span>
            <input
              type="text"
              value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
              placeholder={p.notePlaceholder}
              className="w-full rounded-xl border border-watta-action/20 px-3 py-2.5 text-sm outline-none focus:border-watta-action/50"
            />
          </label>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-watta-action px-4 py-2.5 text-sm font-bold text-white hover:bg-[var(--watta-brand-action-hover)] disabled:opacity-60 sm:w-auto"
            >
              <Plus size={16} aria-hidden />
              {p.addBtn}
            </button>
          </div>
        </form>

        {loading ? (
          <p className="py-8 text-center text-sm text-watta-action/55">{p.loading}</p>
        ) : rows.length === 0 ? (
          <p className="py-4 text-center text-sm text-watta-action/55">{p.empty}</p>
        ) : (
          <div className="mb-8 overflow-x-auto">
            <table className="admin-watta-crm-table min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-watta-action/10 text-xs uppercase tracking-wide text-watta-action/55">
                  <th className="px-3 py-2 font-semibold">{p.colPhone}</th>
                  <th className="px-3 py-2 font-semibold">{p.colNote}</th>
                  <th className="px-3 py-2 font-semibold">{p.colAdded}</th>
                  <th className="px-3 py-2 font-semibold text-right">{p.colActions}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-watta-action/5 last:border-0">
                    <td className="px-3 py-3 font-medium text-watta-action">
                      {row.phone}
                      {row.isPrimary ? (
                        <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-800">
                          {p.primaryBadge}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-3 py-3 text-watta-action/70">{row.label || '—'}</td>
                    <td className="px-3 py-3 text-watta-action/55">
                      {new Date(row.createdAt).toLocaleDateString(locale)}
                    </td>
                    <td className="px-3 py-3 text-right">
                      {row.isPrimary ? (
                        <span className="text-xs text-watta-action/45">{p.protectedBadge}</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void handleDelete(row)}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-red-600 hover:bg-red-50"
                          aria-label={p.deleteAria.replace('{{phone}}', row.phone)}
                        >
                          <Trash2 size={15} aria-hidden />
                          {p.deleteBtn}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="border-t border-watta-action/10 pt-6">
          <h3 className="mb-1 text-base font-bold text-watta-action">{p.emailsTitle}</h3>
          <p className="admin-watta-section-lead mb-4 text-sm">{p.emailsDescription}</p>

          <form onSubmit={handleAddEmail} className="mb-6 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-semibold text-watta-action">{p.emailLabel}</span>
              <div className="relative">
                <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-watta-action/40" />
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full rounded-xl border border-watta-action/20 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-watta-action/50"
                  autoComplete="email"
                />
              </div>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-semibold text-watta-action">{p.noteLabel}</span>
              <input
                type="text"
                value={emailLabelInput}
                onChange={(e) => setEmailLabelInput(e.target.value)}
                placeholder={p.notePlaceholder}
                className="w-full rounded-xl border border-watta-action/20 px-3 py-2.5 text-sm outline-none focus:border-watta-action/50"
              />
            </label>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={emailSaving}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-watta-action px-4 py-2.5 text-sm font-bold text-white hover:bg-[var(--watta-brand-action-hover)] disabled:opacity-60 sm:w-auto"
              >
                <Plus size={16} aria-hidden />
                {p.addBtn}
              </button>
            </div>
          </form>

          {emailsLoading ? (
            <p className="py-8 text-center text-sm text-watta-action/55">{p.loading}</p>
          ) : emailRows.length === 0 ? (
            <p className="py-4 text-center text-sm text-watta-action/55">{p.emailsEmpty}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="admin-watta-crm-table min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-watta-action/10 text-xs uppercase tracking-wide text-watta-action/55">
                    <th className="px-3 py-2 font-semibold">{p.colEmail}</th>
                    <th className="px-3 py-2 font-semibold">{p.colNote}</th>
                    <th className="px-3 py-2 font-semibold">{p.colAdded}</th>
                    <th className="px-3 py-2 font-semibold text-right">{p.colActions}</th>
                  </tr>
                </thead>
                <tbody>
                  {emailRows.map((row) => (
                    <tr key={row.id} className="border-b border-watta-action/5 last:border-0">
                      <td className="px-3 py-3 font-medium text-watta-action">
                        {row.email}
                        {row.isPrimary ? (
                          <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-800">
                            {p.primaryBadge}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-3 py-3 text-watta-action/70">{row.label || '—'}</td>
                      <td className="px-3 py-3 text-watta-action/55">
                        {new Date(row.createdAt).toLocaleDateString(locale)}
                      </td>
                      <td className="px-3 py-3 text-right">
                        {row.isPrimary ? (
                          <span className="text-xs text-watta-action/45">{p.protectedBadge}</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => void handleDeleteEmail(row)}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-red-600 hover:bg-red-50"
                            aria-label={p.emailDeleteAria.replace('{{email}}', row.email)}
                          >
                            <Trash2 size={15} aria-hidden />
                            {p.deleteBtn}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
