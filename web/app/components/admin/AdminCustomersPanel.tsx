'use client'

import { useCallback, useEffect, useState } from 'react'
import { ExternalLink, Search, Sheet } from 'lucide-react'
import toast from 'react-hot-toast'
import { X } from '@/lib/wattaInlineIcons'
import { useLanguage } from '../../context/LanguageContext'

type CrmCustomerRow = {
  phoneKey: string
  displayPhone: string
  customerName: string
  email: string | null
  userId: number | null
  orderCount: number
  totalSpent: number
  lastOrderAt: string | null
  dataProcessingConsentAt: string | null
  bonusBalance: number
  registered: boolean
}

type CrmCustomerDetail = CrmCustomerRow & {
  orders: {
    id: number
    createdAt: string
    status: string
    totalPrice: number
    usedBonuses: number
    customerName: string
    phone: string
    address: string
    fulfillmentType: string
    deliveryFee: number
    paymentMethod: string
    paymentStatus: string
    comment: string | null
    noCallbackConfirm: boolean
    noDoorbellRing: boolean
    dataProcessingConsentAt: string | null
    items: {
      id: number
      quantity: number
      price: number
      productId: number
      productName: string
    }[]
  }[]
}

function adminAuthHeaders(): HeadersInit {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('token') : null
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export default function AdminCustomersPanel() {
  const { t, adminUiLanguage } = useLanguage()
  const c = t.adminPanel.crm
  const common = t.adminPanel.common
  const locale = adminUiLanguage === 'ru' ? 'ru-RU' : 'uk-UA'

  const formatDate = (iso: string | null): string => {
    if (!iso) return '—'
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

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [customers, setCustomers] = useState<CrmCustomerRow[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<CrmCustomerDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [sheetsConfigured, setSheetsConfigured] = useState(false)
  const [sheetsStatusLoaded, setSheetsStatusLoaded] = useState(false)
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string | null>(null)
  const [crmSheetTitle, setCrmSheetTitle] = useState('Клиенты')
  const [serviceAccountEmail, setServiceAccountEmail] = useState<string | null>(null)
  const [sheetsSyncing, setSheetsSyncing] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => window.clearTimeout(timer)
  }, [search])

  const loadCustomers = useCallback(async () => {
    setLoading(true)
    try {
      const params = debouncedSearch
        ? `?q=${encodeURIComponent(debouncedSearch)}`
        : ''
      const res = await fetch(`/api/crm/customers${params}`, {
        headers: adminAuthHeaders(),
      })
      if (!res.ok) {
        setCustomers([])
        return
      }
      const list = (await res.json()) as CrmCustomerRow[]
      setCustomers(Array.isArray(list) ? list : [])
    } catch {
      setCustomers([])
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch])

  useEffect(() => {
    void loadCustomers()
  }, [loadCustomers])

  const loadSheetsStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/crm/customers/sheets-status?probe=1', {
        headers: adminAuthHeaders(),
      })
      if (!res.ok) return
      const data = (await res.json()) as {
        configured?: boolean
        spreadsheetUrl?: string | null
        crmSheetTitle?: string
        serviceAccountEmail?: string | null
        writeAccess?: { ok?: boolean; error?: string } | null
      }
      setSheetsStatusLoaded(true)
      setSheetsConfigured(Boolean(data.configured))
      setSpreadsheetUrl(data.spreadsheetUrl ?? null)
      if (data.crmSheetTitle) setCrmSheetTitle(data.crmSheetTitle)
      setServiceAccountEmail(data.serviceAccountEmail ?? null)
      if (data.configured && data.writeAccess && !data.writeAccess.ok && data.writeAccess.error) {
        toast.error(data.writeAccess.error, { duration: 8000 })
      }
    } catch {
      // Не скидаємо configured — інакше показується хибне «не налаштовано».
    }
  }, [])

  useEffect(() => {
    void loadSheetsStatus()
  }, [loadSheetsStatus])

  const syncToGoogleSheets = async () => {
    if (!sheetsConfigured) {
      toast.error(c.sheetsNotConfigured)
      return
    }
    setSheetsSyncing(true)
    try {
      const res = await fetch('/api/crm/customers/sync-sheets', {
        method: 'POST',
        headers: adminAuthHeaders(),
      })
      const data = (await res.json()) as {
        message?: string
        count?: number
        sheetTitle?: string
        spreadsheetUrl?: string | null
      }
      if (!res.ok) {
        toast.error(data.message || c.sheetsSyncError, { duration: 8000 })
        return
      }
      if (data.spreadsheetUrl) setSpreadsheetUrl(data.spreadsheetUrl)
      if (data.sheetTitle) setCrmSheetTitle(data.sheetTitle)
      toast.success(
        c.sheetsSyncSuccess
          .replace('{{count}}', String(data.count ?? 0))
          .replace('{{sheet}}', data.sheetTitle || crmSheetTitle),
      )
    } catch {
      toast.error(c.sheetsSyncError)
    } finally {
      setSheetsSyncing(false)
    }
  }

  const openDetail = async (phoneKey: string) => {
    setDetailLoading(true)
    setSelected(null)
    try {
      const res = await fetch(
        `/api/crm/customers/detail?phone=${encodeURIComponent(phoneKey)}`,
        { headers: adminAuthHeaders() },
      )
      if (!res.ok) return
      const data = (await res.json()) as CrmCustomerDetail
      setSelected(data)
    } catch {
      setSelected(null)
    } finally {
      setDetailLoading(false)
    }
  }

  return (
    <>
      <section className="admin-watta-glass-panel admin-watta-scroll-x admin-watta-scroll-hint">
        <div className="mb-4 flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="admin-watta-section-title">{c.customersTitle}</h3>
            <div className="relative w-full sm:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-watta-action/50" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={c.searchPlaceholder}
                className="w-full rounded-xl border-2 border-watta-action/20 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-watta-action"
              />
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <button
              type="button"
              onClick={() => void syncToGoogleSheets()}
              disabled={!sheetsConfigured || sheetsSyncing}
              className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-watta-action/25 bg-white px-4 py-2.5 text-sm font-semibold text-watta-action transition hover:bg-watta-action/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Sheet className="h-4 w-4" />
              {sheetsSyncing ? c.sheetsSyncing : c.sheetsSyncBtn}
            </button>
            {spreadsheetUrl && (
              <a
                href={spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-emerald-600/30 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
              >
                <ExternalLink className="h-4 w-4" />
                {c.sheetsOpenBtn}
              </a>
            )}
            {sheetsStatusLoaded && (
              <div className="text-xs text-watta-action/60 sm:ml-1 space-y-1">
                <p>
                  {sheetsConfigured
                    ? c.sheetsHint.replace('{{sheet}}', crmSheetTitle)
                    : c.sheetsNotConfigured}
                </p>
                {sheetsConfigured && serviceAccountEmail ? (
                  <p className="break-all">
                    Service account: <span className="font-medium">{serviceAccountEmail}</span>
                  </p>
                ) : null}
              </div>
            )}
          </div>
        </div>

        <table className="admin-watta-crm-table min-w-full text-sm">
          <thead>
            <tr className="text-left text-watta-action/80 border-b border-watta-action/15">
              <th className="py-3 pr-4">{c.colName}</th>
              <th className="py-3 pr-4">{c.colPhone}</th>
              <th className="py-3 pr-4">{c.colEmail}</th>
              <th className="py-3 pr-4">{c.colOrders}</th>
              <th className="py-3 pr-4">{c.colTotal}</th>
              <th className="py-3 pr-4">{c.colConsent}</th>
              <th className="py-3 pr-4">{c.colLastOrder}</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((row) => (
              <tr
                key={row.phoneKey}
                className="cursor-pointer border-b border-watta-action/10 text-[#0f241e]/80 transition hover:bg-watta-action/5"
                onClick={() => void openDetail(row.phoneKey)}
              >
                <td className="py-3 pr-4 font-semibold">{row.customerName}</td>
                <td className="py-3 pr-4 whitespace-nowrap">{row.displayPhone}</td>
                <td className="py-3 pr-4">{row.email || '—'}</td>
                <td className="py-3 pr-4">{row.orderCount}</td>
                <td className="py-3 pr-4 font-semibold text-watta-action">
                  {row.totalSpent.toFixed(2)} €
                </td>
                <td className="py-3 pr-4">
                  {row.dataProcessingConsentAt ? (
                    <span className="font-medium text-emerald-700">{common.yes}</span>
                  ) : (
                    <span className="text-watta-action/35">—</span>
                  )}
                </td>
                <td className="py-3 pr-4 whitespace-nowrap text-xs">
                  {formatDate(row.lastOrderAt)}
                </td>
              </tr>
            ))}
            {!loading && customers.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-watta-action/45">
                  {c.empty}
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-watta-action/60">
                  {c.loading}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <p className="mt-3 text-xs text-watta-action/60">{c.rowHint}</p>
      </section>

      {(selected || detailLoading) && (
        <div
          className="fixed inset-0 z-[10050] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="crm-customer-detail-title"
        >
          <div className="admin-watta-modal-panel flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
            <div className="flex items-center justify-between border-b border-watta-action/10 px-4 py-3 sm:px-6">
              <h4
                id="crm-customer-detail-title"
                className="text-lg font-bold text-watta-action"
              >
                {c.cardTitle}
              </h4>
              <button
                type="button"
                onClick={() => {
                  setSelected(null)
                  setDetailLoading(false)
                }}
                className="rounded-lg p-2 text-watta-action/55 hover:bg-watta-action/10"
                aria-label={t.adminPanel.actions.closeAria}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-y-auto px-4 py-4 sm:px-6">
              {detailLoading && (
                <p className="py-8 text-center text-watta-action/70">{c.loading}</p>
              )}
              {!detailLoading && selected && (
                <div className="flex flex-col gap-4 text-sm text-[#0f241e]/85">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <p>
                      <span className="font-semibold text-watta-action">{c.fieldName}</span>{' '}
                      {selected.customerName}
                    </p>
                    <p>
                      <span className="font-semibold text-watta-action">{c.fieldPhone}</span>{' '}
                      {selected.displayPhone}
                    </p>
                    <p>
                      <span className="font-semibold text-watta-action">{c.fieldEmail}</span>{' '}
                      {selected.email || '—'}
                    </p>
                    <p>
                      <span className="font-semibold text-watta-action">{c.fieldAccount}</span>{' '}
                      {selected.registered ? `ID ${selected.userId}` : common.guest}
                    </p>
                    <p>
                      <span className="font-semibold text-watta-action">{c.fieldOrders}</span>{' '}
                      {selected.orderCount}
                    </p>
                    <p>
                      <span className="font-semibold text-watta-action">{c.fieldTotal}</span>{' '}
                      {selected.totalSpent.toFixed(2)} €
                    </p>
                    <p>
                      <span className="font-semibold text-watta-action">{c.fieldBonuses}</span>{' '}
                      {Number(selected.bonusBalance).toFixed(2)} €
                    </p>
                    <p>
                      <span className="font-semibold text-watta-action">{c.fieldConsent}</span>{' '}
                      {selected.dataProcessingConsentAt
                        ? formatDate(selected.dataProcessingConsentAt)
                        : common.noRecord}
                    </p>
                  </div>

                  <h5 className="text-base font-bold text-watta-action">{c.orderHistory}</h5>
                  <div className="flex flex-col gap-3">
                    {selected.orders.map((o) => (
                      <div
                        key={o.id}
                        className="rounded-xl border border-watta-action/15 bg-watta-action/[0.03] p-3"
                      >
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                          <span className="font-bold text-watta-action">№ {o.id}</span>
                          <span className="text-xs text-watta-action/55">
                            {formatDate(o.createdAt)}
                          </span>
                        </div>
                        <p>
                          <span className="font-medium">{c.orderStatus}</span> {o.status} ·{' '}
                          {o.totalPrice.toFixed(2)} €
                        </p>
                        <p>
                          <span className="font-medium">{c.orderAddress}</span> {o.address || '—'}
                        </p>
                        <p>
                          <span className="font-medium">{c.orderPayment}</span> {o.paymentMethod} /{' '}
                          {o.paymentStatus}
                        </p>
                        {o.comment && (
                          <p>
                            <span className="font-medium">{c.orderComment}</span> {o.comment}
                          </p>
                        )}
                        <ul className="mt-2 list-disc pl-5 text-xs">
                          {o.items.map((line) => (
                            <li key={line.id}>
                              {line.productName} × {line.quantity} —{' '}
                              {(line.price * line.quantity).toFixed(2)} €
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                    {selected.orders.length === 0 && (
                      <p className="text-watta-action/45">{c.noOrders}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
