'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ExternalLink, Sheet } from 'lucide-react'
import toast from 'react-hot-toast'
import { useLanguage } from '../../context/LanguageContext'

type ReportType = 'products' | 'orders' | 'customers'
type ReportPeriod = 'all' | 'month' | 'lastMonth' | 'year' | 'custom'

type ReportSummary = {
  orderCount: number
  revenue: number
  itemCount: number
}

type ProductRow = {
  productId: number
  productName: string
  categoryName: string
  quantity: number
  revenue: number
  orderCount: number
}

type OrderRow = {
  id: number
  createdAt: string
  customerName: string
  phone: string
  status: string
  totalPrice: number
  paymentMethod: string
  paymentStatus: string
  address: string
  itemsSummary: string
}

type CustomerRow = {
  phoneKey: string
  displayPhone: string
  customerName: string
  email: string | null
  orderCount: number
  totalSpent: number
  lastOrderAt: string | null
}

type ReportPayload = {
  rows: ProductRow[] | OrderRow[] | CustomerRow[]
  summary: ReportSummary
  period?: { label: string }
}

function adminAuthHeaders(): HeadersInit {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('token') : null
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function todayYmd(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Kyiv',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

function firstDayOfMonthYmd(): string {
  const today = todayYmd()
  return `${today.slice(0, 8)}01`
}

type AdminReportsPanelProps = {
  embedded?: boolean
  linkedPeriod?: {
    crmPeriod: 'all' | 'month' | 'lastMonth' | 'year' | 'custom'
    from?: string | null
    to?: string | null
  } | null
}

export default function AdminReportsPanel({
  embedded = false,
  linkedPeriod = null,
}: AdminReportsPanelProps = {}) {
  const { t, adminUiLanguage } = useLanguage()
  const r = t.adminPanel.crmReports
  const c = t.adminPanel.crm
  const locale = adminUiLanguage === 'ru' ? 'ru-RU' : 'uk-UA'

  const [reportType, setReportType] = useState<ReportType>('products')
  const [period, setPeriod] = useState<ReportPeriod>('month')
  const [customFrom, setCustomFrom] = useState(firstDayOfMonthYmd())
  const [customTo, setCustomTo] = useState(todayYmd())
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState<ReportSummary | null>(null)
  const [periodLabel, setPeriodLabel] = useState('')
  const [productRows, setProductRows] = useState<ProductRow[]>([])
  const [orderRows, setOrderRows] = useState<OrderRow[]>([])
  const [customerRows, setCustomerRows] = useState<CustomerRow[]>([])
  const [sheetsConfigured, setSheetsConfigured] = useState(false)
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string | null>(null)
  const [sheetsSyncing, setSheetsSyncing] = useState(false)

  const queryString = useMemo(() => {
    const effectivePeriod = linkedPeriod?.crmPeriod ?? period
    const params = new URLSearchParams({ period: effectivePeriod })
    if (effectivePeriod === 'custom') {
      const from = linkedPeriod?.from ?? customFrom
      const to = linkedPeriod?.to ?? customTo
      if (from && to) {
        params.set('from', from <= to ? from : to)
        params.set('to', from <= to ? to : from)
      }
    }
    return params.toString()
  }, [period, customFrom, customTo, linkedPeriod])

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

  const loadSheetsStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/crm/customers/sheets-status', {
        headers: adminAuthHeaders(),
      })
      if (!res.ok) return
      const data = (await res.json()) as {
        configured?: boolean
        spreadsheetUrl?: string | null
      }
      setSheetsConfigured(Boolean(data.configured))
      setSpreadsheetUrl(data.spreadsheetUrl ?? null)
    } catch {
      // ignore
    }
  }, [])

  const loadReport = useCallback(async () => {
    setLoading(true)
    try {
      const endpoint =
        reportType === 'products'
          ? '/api/crm/reports/products'
          : reportType === 'orders'
            ? '/api/crm/reports/orders'
            : '/api/crm/reports/customers'
      const res = await fetch(`${endpoint}?${queryString}`, {
        headers: adminAuthHeaders(),
      })
      if (!res.ok) {
        setProductRows([])
        setOrderRows([])
        setCustomerRows([])
        setSummary(null)
        return
      }
      const data = (await res.json()) as ReportPayload
      setSummary(data.summary)
      setPeriodLabel(data.period?.label || '')
      if (reportType === 'products') {
        setProductRows((data.rows as ProductRow[]) || [])
      } else if (reportType === 'orders') {
        setOrderRows((data.rows as OrderRow[]) || [])
      } else {
        setCustomerRows((data.rows as CustomerRow[]) || [])
      }
    } catch {
      setProductRows([])
      setOrderRows([])
      setCustomerRows([])
      setSummary(null)
    } finally {
      setLoading(false)
    }
  }, [reportType, queryString])

  useEffect(() => {
    void loadSheetsStatus()
  }, [loadSheetsStatus])

  useEffect(() => {
    void loadReport()
  }, [loadReport])

  const syncToGoogleSheets = async () => {
    if (!sheetsConfigured) {
      toast.error(c.sheetsNotConfigured)
      return
    }
    setSheetsSyncing(true)
    try {
      const res = await fetch('/api/crm/reports/sync-sheets', {
        method: 'POST',
        headers: {
          ...adminAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: reportType,
          period: linkedPeriod?.crmPeriod ?? period,
          ...((linkedPeriod?.crmPeriod ?? period) === 'custom'
            ? {
                from: linkedPeriod?.from ?? customFrom,
                to: linkedPeriod?.to ?? customTo,
              }
            : {}),
        }),
      })
      const data = (await res.json()) as {
        message?: string
        count?: number
        sheetTitle?: string
        spreadsheetUrl?: string | null
      }
      if (!res.ok) {
        toast.error(data.message || r.sheetsSyncError)
        return
      }
      if (data.spreadsheetUrl) setSpreadsheetUrl(data.spreadsheetUrl)
      toast.success(
        r.sheetsSyncSuccess
          .replace('{{count}}', String(data.count ?? 0))
          .replace('{{sheet}}', data.sheetTitle || ''),
      )
    } catch {
      toast.error(r.sheetsSyncError)
    } finally {
      setSheetsSyncing(false)
    }
  }

  const rowCount =
    reportType === 'products'
      ? productRows.length
      : reportType === 'orders'
        ? orderRows.length
        : customerRows.length

  return (
    <section
      className={`admin-watta-glass-panel admin-watta-scroll-x admin-watta-scroll-hint${embedded ? ' admin-orders-crm-panel' : ''}`}
    >
      <div className="mb-4 flex flex-col gap-4">
        <h3 className={embedded ? 'admin-watta-section-title' : 'admin-watta-section-title'}>
          {embedded ? r.embeddedTitle : r.title}
        </h3>
        {embedded && linkedPeriod ? (
          <p className="text-xs font-medium text-watta-action/65">{r.linkedRangeHint}</p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {(['products', 'orders', 'customers'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setReportType(type)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                reportType === type
                  ? 'bg-watta-action text-white shadow-md'
                  : 'border border-watta-action/20 text-watta-action hover:bg-watta-action/10'
              }`}
            >
              {type === 'products'
                ? r.productsTab
                : type === 'orders'
                  ? r.ordersTab
                  : r.customersTab}
            </button>
          ))}
        </div>

        {!linkedPeriod ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-watta-action/15 bg-white/70 p-3 sm:p-4">
          <p className="text-sm font-semibold text-watta-action">{r.periodLabel}</p>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ['all', r.periodAll],
                ['month', r.periodMonth],
                ['lastMonth', r.periodLastMonth],
                ['year', r.periodYear],
                ['custom', r.periodCustom],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setPeriod(value)}
                className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                  period === value
                    ? 'bg-watta-action text-white'
                    : 'bg-watta-action/10 text-watta-action hover:bg-watta-action/20'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {period === 'custom' && (
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-watta-action">
                <span>{r.fromLabel}</span>
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="rounded-lg border border-watta-action/25 px-2 py-1.5"
                />
              </label>
              <label className="flex items-center gap-2 text-sm text-watta-action">
                <span>{r.toLabel}</span>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="rounded-lg border border-watta-action/25 px-2 py-1.5"
                />
              </label>
            </div>
          )}
          {periodLabel && (
            <p className="text-xs text-watta-action/65">
              {r.selectedPeriod}: <span className="font-semibold">{periodLabel}</span>
            </p>
          )}
        </div>
        ) : periodLabel ? (
          <p className="rounded-xl border border-watta-action/12 bg-white/70 px-3 py-2 text-xs text-watta-action/70">
            {r.selectedPeriod}: <span className="font-semibold">{periodLabel}</span>
          </p>
        ) : null}

        {summary && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-watta-action/15 bg-emerald-50/80 px-4 py-3">
              <p className="text-xs text-watta-action/60">{r.summaryOrders}</p>
              <p className="text-xl font-bold text-watta-action">{summary.orderCount}</p>
            </div>
            <div className="rounded-xl border border-watta-action/15 bg-emerald-50/80 px-4 py-3">
              <p className="text-xs text-watta-action/60">{r.summaryRevenue}</p>
              <p className="text-xl font-bold text-watta-action">
                {summary.revenue.toFixed(2)} €
              </p>
            </div>
            <div className="rounded-xl border border-watta-action/15 bg-emerald-50/80 px-4 py-3">
              <p className="text-xs text-watta-action/60">
                {reportType === 'customers' ? r.summaryClients : r.summaryItems}
              </p>
              <p className="text-xl font-bold text-watta-action">{summary.itemCount}</p>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <button
            type="button"
            onClick={() => void syncToGoogleSheets()}
            disabled={!sheetsConfigured || sheetsSyncing || loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-watta-action/25 bg-white px-4 py-2.5 text-sm font-semibold text-watta-action transition hover:bg-watta-action/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Sheet className="h-4 w-4" />
            {sheetsSyncing ? c.sheetsSyncing : r.sheetsSyncBtn}
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
          <p className="text-xs text-watta-action/60 sm:ml-1">{r.sheetsHint}</p>
        </div>
      </div>

      <table className="admin-watta-crm-table min-w-full text-sm">
        <thead>
          <tr className="border-b border-watta-action/15 text-left text-watta-action/80">
            {reportType === 'products' && (
              <>
                <th className="py-3 pr-4">{r.colProduct}</th>
                <th className="py-3 pr-4">{r.colCategory}</th>
                <th className="py-3 pr-4">{r.colQty}</th>
                <th className="py-3 pr-4">{r.colRevenue}</th>
                <th className="py-3 pr-4">{r.colOrders}</th>
              </>
            )}
            {reportType === 'orders' && (
              <>
                <th className="py-3 pr-4">№</th>
                <th className="py-3 pr-4">{r.colDate}</th>
                <th className="py-3 pr-4">{r.colCustomer}</th>
                <th className="py-3 pr-4">{r.colPhone}</th>
                <th className="py-3 pr-4">{r.colStatus}</th>
                <th className="py-3 pr-4">{r.colTotal}</th>
                <th className="py-3 pr-4">{r.colItems}</th>
              </>
            )}
            {reportType === 'customers' && (
              <>
                <th className="py-3 pr-4">{r.colCustomer}</th>
                <th className="py-3 pr-4">{r.colPhone}</th>
                <th className="py-3 pr-4">{r.colEmail}</th>
                <th className="py-3 pr-4">{r.colOrders}</th>
                <th className="py-3 pr-4">{r.colTotal}</th>
                <th className="py-3 pr-4">{r.colLastOrder}</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {reportType === 'products' &&
            productRows.map((row) => (
              <tr key={row.productId} className="border-b border-watta-action/10 text-[#0f241e]/80">
                <td className="py-3 pr-4 font-semibold">{row.productName}</td>
                <td className="py-3 pr-4">{row.categoryName}</td>
                <td className="py-3 pr-4">{row.quantity}</td>
                <td className="py-3 pr-4 font-semibold text-watta-action">
                  {row.revenue.toFixed(2)} €
                </td>
                <td className="py-3 pr-4">{row.orderCount}</td>
              </tr>
            ))}
          {reportType === 'orders' &&
            orderRows.map((row) => (
              <tr key={row.id} className="border-b border-watta-action/10 text-[#0f241e]/80">
                <td className="py-3 pr-4 font-semibold">{row.id}</td>
                <td className="py-3 pr-4 whitespace-nowrap text-xs">
                  {formatDate(row.createdAt)}
                </td>
                <td className="py-3 pr-4">{row.customerName}</td>
                <td className="py-3 pr-4 whitespace-nowrap">{row.phone}</td>
                <td className="py-3 pr-4">{row.status}</td>
                <td className="py-3 pr-4 font-semibold text-watta-action">
                  {row.totalPrice.toFixed(2)} €
                </td>
                <td className="py-3 pr-4 text-xs">{row.itemsSummary}</td>
              </tr>
            ))}
          {reportType === 'customers' &&
            customerRows.map((row) => (
              <tr key={row.phoneKey} className="border-b border-watta-action/10 text-[#0f241e]/80">
                <td className="py-3 pr-4 font-semibold">{row.customerName}</td>
                <td className="py-3 pr-4 whitespace-nowrap">{row.displayPhone}</td>
                <td className="py-3 pr-4">{row.email || '—'}</td>
                <td className="py-3 pr-4">{row.orderCount}</td>
                <td className="py-3 pr-4 font-semibold text-watta-action">
                  {row.totalSpent.toFixed(2)} €
                </td>
                <td className="py-3 pr-4 whitespace-nowrap text-xs">
                  {formatDate(row.lastOrderAt)}
                </td>
              </tr>
            ))}
          {!loading && rowCount === 0 && (
            <tr>
              <td colSpan={7} className="py-8 text-center text-watta-action/45">
                {r.empty}
              </td>
            </tr>
          )}
          {loading && (
            <tr>
              <td colSpan={7} className="py-8 text-center text-watta-action/60">
                {r.loading}
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <p className="mt-3 text-xs text-watta-action/60">{r.footerHint}</p>
    </section>
  )
}
