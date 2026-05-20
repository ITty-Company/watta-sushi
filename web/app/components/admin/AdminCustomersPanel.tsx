'use client'

import { useCallback, useEffect, useState } from 'react'
import { Search, X } from 'lucide-react'

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

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('uk-UA', {
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

export default function AdminCustomersPanel() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [customers, setCustomers] = useState<CrmCustomerRow[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<CrmCustomerDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => window.clearTimeout(t)
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
      <section className="admin-watta-scroll-x admin-watta-scroll-hint rounded-[24px] border-2 border-white/70 bg-white/80 p-4 shadow-2xl shadow-[#145142]/15 backdrop-blur-2xl sm:p-6 md:p-8">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-xl font-bold text-[#145142]">База клиентов</h3>
          <div className="relative w-full sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#145142]/50" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск: имя, телефон, email…"
              className="w-full rounded-xl border-2 border-[#145142]/20 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[#145142]"
            />
          </div>
        </div>

        <table className="admin-watta-crm-table min-w-full text-sm">
          <thead>
            <tr className="text-left text-[#145142]/80 border-b border-[#145142]/15">
              <th className="py-3 pr-4">Имя</th>
              <th className="py-3 pr-4">Телефон</th>
              <th className="py-3 pr-4">Email</th>
              <th className="py-3 pr-4">Заказы</th>
              <th className="py-3 pr-4">Сумма</th>
              <th className="py-3 pr-4">Согласие</th>
              <th className="py-3 pr-4">Последний заказ</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr
                key={c.phoneKey}
                className="cursor-pointer border-b border-[#145142]/10 text-gray-700 transition hover:bg-[#145142]/5"
                onClick={() => void openDetail(c.phoneKey)}
              >
                <td className="py-3 pr-4 font-semibold">{c.customerName}</td>
                <td className="py-3 pr-4 whitespace-nowrap">{c.displayPhone}</td>
                <td className="py-3 pr-4">{c.email || '—'}</td>
                <td className="py-3 pr-4">{c.orderCount}</td>
                <td className="py-3 pr-4 font-semibold text-[#145142]">
                  {c.totalSpent.toFixed(2)} €
                </td>
                <td className="py-3 pr-4">
                  {c.dataProcessingConsentAt ? (
                    <span className="font-medium text-emerald-700">Да</span>
                  ) : (
                    <span className="text-neutral-400">—</span>
                  )}
                </td>
                <td className="py-3 pr-4 whitespace-nowrap text-xs">
                  {formatDate(c.lastOrderAt)}
                </td>
              </tr>
            ))}
            {!loading && customers.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-gray-400">
                  Клиентов не найдено
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-[#145142]/60">
                  Загрузка…
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <p className="mt-3 text-xs text-[#145142]/60">
          Нажмите на строку, чтобы открыть полную карточку клиента и историю заказов.
        </p>
      </section>

      {(selected || detailLoading) && (
        <div
          className="fixed inset-0 z-[10050] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="crm-customer-detail-title"
        >
          <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
            <div className="flex items-center justify-between border-b border-[#145142]/10 px-4 py-3 sm:px-6">
              <h4
                id="crm-customer-detail-title"
                className="text-lg font-bold text-[#145142]"
              >
                Карточка клиента
              </h4>
              <button
                type="button"
                onClick={() => {
                  setSelected(null)
                  setDetailLoading(false)
                }}
                className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100"
                aria-label="Закрыть"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-y-auto px-4 py-4 sm:px-6">
              {detailLoading && (
                <p className="py-8 text-center text-[#145142]/70">Загрузка…</p>
              )}
              {!detailLoading && selected && (
                <div className="flex flex-col gap-4 text-sm text-gray-700">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <p>
                      <span className="font-semibold text-[#145142]">Имя:</span>{' '}
                      {selected.customerName}
                    </p>
                    <p>
                      <span className="font-semibold text-[#145142]">Телефон:</span>{' '}
                      {selected.displayPhone}
                    </p>
                    <p>
                      <span className="font-semibold text-[#145142]">Email:</span>{' '}
                      {selected.email || '—'}
                    </p>
                    <p>
                      <span className="font-semibold text-[#145142]">Аккаунт:</span>{' '}
                      {selected.registered ? `ID ${selected.userId}` : 'Гость'}
                    </p>
                    <p>
                      <span className="font-semibold text-[#145142]">Заказов:</span>{' '}
                      {selected.orderCount}
                    </p>
                    <p>
                      <span className="font-semibold text-[#145142]">Сумма:</span>{' '}
                      {selected.totalSpent.toFixed(2)} €
                    </p>
                    <p>
                      <span className="font-semibold text-[#145142]">Бонусы:</span>{' '}
                      {Number(selected.bonusBalance).toFixed(2)} €
                    </p>
                    <p>
                      <span className="font-semibold text-[#145142]">Согласие на данные:</span>{' '}
                      {selected.dataProcessingConsentAt
                        ? formatDate(selected.dataProcessingConsentAt)
                        : 'Нет записи'}
                    </p>
                  </div>

                  <h5 className="text-base font-bold text-[#145142]">История заказов</h5>
                  <div className="flex flex-col gap-3">
                    {selected.orders.map((o) => (
                      <div
                        key={o.id}
                        className="rounded-xl border border-[#145142]/15 bg-[#145142]/[0.03] p-3"
                      >
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                          <span className="font-bold text-[#145142]">№ {o.id}</span>
                          <span className="text-xs text-neutral-500">
                            {formatDate(o.createdAt)}
                          </span>
                        </div>
                        <p>
                          <span className="font-medium">Статус:</span> {o.status} ·{' '}
                          {o.totalPrice.toFixed(2)} €
                        </p>
                        <p>
                          <span className="font-medium">Адрес:</span> {o.address || '—'}
                        </p>
                        <p>
                          <span className="font-medium">Оплата:</span> {o.paymentMethod} /{' '}
                          {o.paymentStatus}
                        </p>
                        {o.comment && (
                          <p>
                            <span className="font-medium">Комментарий:</span> {o.comment}
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
                      <p className="text-neutral-400">Заказов пока нет</p>
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