'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Receipt, CheckCircle2, AlertCircle } from 'lucide-react'
import { useLanguage } from '@/app/context/LanguageContext'
import { getLocalizedField } from '@/lib/i18n/getLocalizedField'
import type { WattaLanguage } from '@/lib/i18n/language'
import LogoBackground from '../LogoBackground'
import type { ProfileOrder, ProfileOrderItem } from './ClientProfileOrders'

function productLineName(p: ProfileOrderItem['product'], lang: WattaLanguage): string {
  return (
    getLocalizedField(p as unknown as Record<string, unknown>, 'name', lang) ||
    p.name_ru
  )
}

function paymentStatusLabel(
  status: string | undefined,
  t: {
    paymentStatusPaid: string
    paymentStatusWaiting: string
    paymentStatusError: string
  },
): string {
  const s = String(status || '').toUpperCase()
  if (s === 'PAID') return t.paymentStatusPaid
  if (s === 'FAILED') return t.paymentStatusError
  return t.paymentStatusWaiting
}

export default function OrderReceiptPageClient({ orderId }: { orderId: number }) {
  const { t, language } = useLanguage()
  const cp = t.clientProfile
  const [order, setOrder] = useState<ProfileOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (!token) {
      setError(cp.receiptUnauthorized)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/orders/my/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      })
      if (res.status === 401) {
        setError(cp.receiptUnauthorized)
        return
      }
      if (res.status === 404) {
        setError(cp.receiptNotFound)
        return
      }
      if (!res.ok) {
        setError(cp.receiptNotFound)
        return
      }
      const data = (await res.json()) as ProfileOrder
      setOrder(data)
    } catch {
      setError(cp.receiptNotFound)
    } finally {
      setLoading(false)
    }
  }, [orderId, cp.receiptNotFound, cp.receiptUnauthorized])

  useEffect(() => {
    void load()
  }, [load])

  const locale =
    language === 'uk' ? 'uk-UA' : language === 'nl' ? 'nl-NL' : language === 'en' ? 'en-GB' : 'ru-RU'

  const paid = String(order?.paymentStatus || '').toUpperCase() === 'PAID'
  const itemsSubtotal =
    order?.items?.reduce((sum, i) => sum + Number(i.price) * Number(i.quantity), 0) ?? 0
  const deliveryFee = Number(order?.deliveryFee ?? 0)
  const usedBonuses = Number((order as ProfileOrder & { usedBonuses?: number })?.usedBonuses ?? 0)

  return (
    <div className="watta-public-page-shell watta-page-bg relative flex min-h-screen flex-1 flex-col font-sans">
      <LogoBackground />
      <div className="relative z-10 mx-auto w-full max-w-lg px-4 py-8 sm:px-6 sm:py-12">
        <Link
          href={`/profile?tab=history&order=${orderId}`}
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#145142] hover:text-[#0f3d32]"
        >
          <ArrowLeft className="h-4 w-4" />
          {cp.receiptBackProfile}
        </Link>

        {loading ? (
          <p className="text-center text-gray-600 py-16">{cp.loading}</p>
        ) : error ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-6 py-8 text-center text-red-800">
            <AlertCircle className="mx-auto mb-3 h-10 w-10" />
            <p>{error}</p>
          </div>
        ) : order ? (
          <article className="rounded-[28px] border border-[#145142]/10 bg-white/95 shadow-[0_20px_60px_rgba(20,81,66,0.12)] backdrop-blur-md">
            <header className="border-b border-gray-100 px-6 py-6 sm:px-8">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#145142] text-white">
                  <Receipt className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-xl font-black text-[#145142] sm:text-2xl">{cp.receiptTitle}</h1>
                  <p className="text-sm text-gray-500">
                    {cp.orderLabel} #{order.id}
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                {new Date(order.createdAt).toLocaleString(locale)}
              </p>
              <div
                className={`mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${
                  paid
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}
              >
                {paid ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                {paymentStatusLabel(order.paymentStatus, cp)}
              </div>
              {paid && order.paidAt ? (
                <p className="mt-2 text-sm text-gray-600">
                  {cp.receiptPaidAt}{' '}
                  <span className="font-semibold text-gray-900">
                    {new Date(order.paidAt).toLocaleString(locale)}
                  </span>
                </p>
              ) : !paid ? (
                <p className="mt-2 text-sm text-amber-800/90">{cp.receiptAwaitingPayment}</p>
              ) : null}
            </header>

            <div className="px-6 py-5 sm:px-8">
              <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-[#145142]/70">
                {cp.receiptItemsTitle}
              </h2>
              <ul className="divide-y divide-gray-100">
                {order.items.map((item) => (
                  <li key={item.id} className="flex justify-between gap-3 py-3 text-sm">
                    <span className="font-medium text-gray-900">
                      {productLineName(item.product, language as WattaLanguage)}
                      <span className="ml-1 text-gray-500">×{item.quantity}</span>
                    </span>
                    <span className="shrink-0 font-bold text-[#145142]">
                      {(item.price * item.quantity).toFixed(2)} €
                    </span>
                  </li>
                ))}
              </ul>

              <dl className="mt-4 space-y-2 border-t border-gray-100 pt-4 text-sm">
                <div className="flex justify-between text-gray-600">
                  <dt>{cp.receiptMerchandise}</dt>
                  <dd className="font-medium text-gray-900">{itemsSubtotal.toFixed(2)} €</dd>
                </div>
                {deliveryFee > 0 ? (
                  <div className="flex justify-between text-gray-600">
                    <dt>{cp.receiptDeliveryFee}</dt>
                    <dd className="font-medium text-gray-900">{deliveryFee.toFixed(2)} €</dd>
                  </div>
                ) : null}
                {usedBonuses > 0 ? (
                  <div className="flex justify-between text-gray-600">
                    <dt>{cp.receiptBonusesUsed}</dt>
                    <dd className="font-medium text-emerald-700">−{usedBonuses.toFixed(2)} €</dd>
                  </div>
                ) : null}
                <div className="flex justify-between border-t border-gray-100 pt-3 text-base font-bold text-gray-900">
                  <dt>{cp.total}</dt>
                  <dd className="text-[#145142]">{Number(order.totalPrice).toFixed(2)} €</dd>
                </div>
              </dl>

              <div className="mt-5 rounded-xl bg-[#f4faf7] px-4 py-3 text-sm text-gray-700">
                <p>
                  <span className="font-semibold text-gray-900">{cp.labelPayment}: </span>
                  {order.paymentMethod === 'CARD' ? cp.paymentCard : cp.paymentCash}
                </p>
                {order.address ? (
                  <p className="mt-1">
                    <span className="font-semibold text-gray-900">{cp.labelAddress}: </span>
                    {order.address}
                  </p>
                ) : null}
              </div>
            </div>
          </article>
        ) : null}
      </div>
    </div>
  )
}
