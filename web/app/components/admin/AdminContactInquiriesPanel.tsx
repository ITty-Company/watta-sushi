'use client'

import { useCallback, useEffect, useState } from 'react'
import { Mail, MessageSquare, Phone, RefreshCw, Trash2, User, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useLanguage } from '../../context/LanguageContext'

export type ContactInquiryRow = {
  id: number
  name: string
  email: string
  phone: string
  message: string
  isRead: boolean
  createdAt: string
}

type Filter = 'all' | 'unread' | 'read'

type AdminContactInquiriesPanelProps = {
  getAuthHeaders: () => Record<string, string> | null
}

export default function AdminContactInquiriesPanel({
  getAuthHeaders,
}: AdminContactInquiriesPanelProps) {
  const { t, adminUiLanguage } = useLanguage()
  const c = t.adminPanel.contactInquiries
  const auth = t.adminPage.auth
  const common = t.adminPage.common
  const locale = adminUiLanguage === 'ru' ? 'ru-RU' : 'uk-UA'

  const formatDate = (iso: string): string => {
    try {
      return new Date(iso).toLocaleString(locale, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return iso
    }
  }

  const [filter, setFilter] = useState<Filter>('all')
  const [items, setItems] = useState<ContactInquiryRow[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<ContactInquiryRow | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const load = useCallback(async () => {
    const headers = getAuthHeaders()
    if (!headers) {
      toast.error(auth.notAuthorized)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/contact/inquiries?filter=${filter}`, { headers })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        if (res.status === 401 || res.status === 403) {
          toast.error(auth.notAuthorized, { id: 'contact-inquiries-auth' })
        } else if (res.status >= 500) {
          toast.error((data.message as string) || c.loadError, {
            id: 'contact-inquiries-load',
          })
        }
        setItems([])
        setUnreadCount(0)
        setTotalCount(0)
        return
      }
      const data = (await res.json()) as {
        items?: ContactInquiryRow[]
        unreadCount?: number
        totalCount?: number
      }
      setItems(Array.isArray(data.items) ? data.items : [])
      setUnreadCount(Number(data.unreadCount ?? 0))
      setTotalCount(Number(data.totalCount ?? 0))
    } catch {
      toast.error(common.networkError, { id: 'contact-inquiries-network' })
      setItems([])
      setUnreadCount(0)
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }, [auth.notAuthorized, c.loadError, common.networkError, filter, getAuthHeaders])

  useEffect(() => {
    void load()
  }, [load])

  const openDetail = async (row: ContactInquiryRow) => {
    setSelected(row)
    if (row.isRead) return
    const headers = getAuthHeaders()
    if (!headers) return
    try {
      const res = await fetch(`/api/contact/inquiries/${row.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ isRead: true }),
      })
      if (!res.ok) return
      setItems((prev) =>
        prev.map((it) => (it.id === row.id ? { ...it, isRead: true } : it)),
      )
      setSelected({ ...row, isRead: true })
      setUnreadCount((n) => Math.max(0, n - 1))
    } catch {
      /* ignore */
    }
  }

  const markAllRead = async () => {
    const headers = getAuthHeaders()
    if (!headers) {
      toast.error(auth.notAuthorized)
      return
    }
    try {
      const res = await fetch('/api/contact/inquiries/mark-all-read', {
        method: 'PATCH',
        headers,
      })
      if (!res.ok) {
        toast.error(c.markReadError)
        return
      }
      toast.success(c.markAllReadSuccess)
      await load()
      if (selected) setSelected({ ...selected, isRead: true })
    } catch {
      toast.error(common.networkError)
    }
  }

  const deleteInquiry = async (id: number) => {
    if (!window.confirm(c.deleteConfirm)) return
    const headers = getAuthHeaders()
    if (!headers) {
      toast.error(auth.notAuthorized)
      return
    }
    setDeletingId(id)
    try {
      const res = await fetch(`/api/contact/inquiries/${id}`, {
        method: 'DELETE',
        headers,
      })
      if (!res.ok) {
        toast.error(c.deleteError)
        return
      }
      toast.success(c.deleted)
      if (selected?.id === id) setSelected(null)
      await load()
    } catch {
      toast.error(common.networkError)
    } finally {
      setDeletingId(null)
    }
  }

  const filterLabel = (f: Filter) =>
    f === 'all' ? c.filterAll : f === 'unread' ? c.filterUnread : c.filterRead

  return (
    <>
      <section className="admin-watta-scroll-x admin-watta-scroll-hint rounded-[24px] border-2 border-white/70 bg-white/80 p-4 shadow-2xl shadow-[#145142]/15 backdrop-blur-2xl sm:p-6 md:p-8">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="admin-watta-section-title flex items-center gap-2 text-xl font-bold text-[#145142]">
              <MessageSquare className="h-5 w-5" aria-hidden />
              {c.title}
            </h3>
            <p className="mt-1 text-sm text-[#145142]/70">
              {c.totalLabel} {totalCount}
              {unreadCount > 0 ? (
                <span className="ml-2 font-semibold text-amber-700">
                  {c.unreadLabel} {unreadCount}
                </span>
              ) : null}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(['all', 'unread', 'read'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                  filter === f
                    ? 'bg-watta-action text-white'
                    : 'bg-watta-action/10 text-[#145142] hover:bg-watta-action/15'
                }`}
              >
                {filterLabel(f)}
              </button>
            ))}
            <button
              type="button"
              onClick={() => void load()}
              className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[#145142]/20 px-3 py-2 text-sm font-semibold text-[#145142] hover:bg-watta-action/5"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden />
              {c.refreshBtn}
            </button>
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={() => void markAllRead()}
                className="rounded-xl bg-watta-action/10 px-3 py-2 text-sm font-semibold text-[#145142] hover:bg-watta-action/15"
              >
                {c.markAllReadBtn}
              </button>
            ) : null}
          </div>
        </div>

        <table className="admin-watta-crm-table min-w-full text-sm">
          <thead>
            <tr className="border-b border-[#145142]/15 text-left text-[#145142]/80">
              <th className="py-3 pr-3">{c.colDate}</th>
              <th className="py-3 pr-3">{c.colName}</th>
              <th className="py-3 pr-3">{c.colContacts}</th>
              <th className="py-3 pr-3">{c.colMessage}</th>
              <th className="py-3 pr-3 w-20" />
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr
                key={row.id}
                className={`cursor-pointer border-b border-[#145142]/10 transition hover:bg-watta-action/5 ${
                  !row.isRead ? 'bg-amber-50/80 font-medium' : 'text-[#0f241e]/80'
                }`}
                onClick={() => void openDetail(row)}
              >
                <td className="py-3 pr-3 whitespace-nowrap text-xs">
                  {formatDate(row.createdAt)}
                  {!row.isRead ? (
                    <span className="ml-1 inline-block rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      NEW
                    </span>
                  ) : null}
                </td>
                <td className="py-3 pr-3">{row.name}</td>
                <td className="py-3 pr-3 text-xs">
                  <div>{row.email}</div>
                  {row.phone ? <div className="text-[#145142]/70">{row.phone}</div> : null}
                </td>
                <td className="py-3 pr-3 max-w-xs truncate">{row.message}</td>
                <td className="py-3 pr-3">
                  <button
                    type="button"
                    className="rounded-lg p-1.5 text-red-600 hover:bg-red-50"
                    aria-label={c.deleteAria}
                    onClick={(e) => {
                      e.stopPropagation()
                      void deleteInquiry(row.id)
                    }}
                    disabled={deletingId === row.id}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={5} className="py-10 text-center text-[#145142]/45">
                  {c.empty}
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={5} className="py-10 text-center text-[#145142]/60">
                  {c.loading}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <p className="mt-3 text-xs text-[#145142]/60">{c.footerHint}</p>
      </section>

      {selected && (
        <div
          className="fixed inset-0 z-[10050] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="contact-inquiry-detail-title"
        >
          <div className="admin-watta-modal-panel flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
            <div className="flex items-center justify-between border-b border-[#145142]/10 px-4 py-3 sm:px-6">
              <h4 id="contact-inquiry-detail-title" className="text-lg font-bold text-[#145142]">
                {c.detailTitle.replace('{{id}}', String(selected.id))}
              </h4>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-lg p-2 text-[#145142] hover:bg-watta-action/10"
                aria-label={c.closeAria}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-y-auto px-4 py-4 sm:px-6 sm:py-5 space-y-4">
              <p className="text-xs text-[#145142]/60">{formatDate(selected.createdAt)}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <p className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-[#145142]/50" aria-hidden />
                  <span className="font-semibold text-[#145142]">{selected.name}</span>
                </p>
                <p className="flex items-center gap-2 text-sm break-all">
                  <Mail className="h-4 w-4 shrink-0 text-[#145142]/50" aria-hidden />
                  <a href={`mailto:${selected.email}`} className="text-[#145142] underline">
                    {selected.email}
                  </a>
                </p>
                {selected.phone ? (
                  <p className="flex items-center gap-2 text-sm sm:col-span-2">
                    <Phone className="h-4 w-4 text-[#145142]/50" aria-hidden />
                    <a href={`tel:${selected.phone}`} className="text-[#145142]">
                      {selected.phone}
                    </a>
                  </p>
                ) : null}
              </div>
              <div className="rounded-xl border border-[#145142]/15 bg-watta-action/5 p-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#145142]/70">
                  {c.messageLabel}
                </p>
                <p className="whitespace-pre-wrap text-sm text-[#0f241e]/85">{selected.message}</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-[#145142]/10 px-4 py-3 sm:px-6">
              <button
                type="button"
                onClick={() => void deleteInquiry(selected.id)}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                disabled={deletingId === selected.id}
              >
                {c.deleteBtn}
              </button>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-xl bg-watta-action px-4 py-2 text-sm font-semibold text-white"
              >
                {c.closeBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
