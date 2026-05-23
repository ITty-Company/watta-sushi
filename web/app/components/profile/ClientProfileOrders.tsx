'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import {
  Package,
  Clock,
  Check,
  ChefHat,
  Truck,
  Star,
  X,
  Sparkles,
  ChevronDown,
  MapPin,
  CreditCard,
  Receipt,
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { useLanguage, type Language } from '@/app/context/LanguageContext'
import { canShowOrderReceipt, isActiveOrderStatus } from '@/lib/orderProfile'
import { getLocalizedField } from '@/lib/i18n/getLocalizedField'
import { readReviewImageDataUrl } from '@/lib/compressReviewImage'
import { getReviewSubmitErrorMessage } from '@/lib/reviewSubmitErrors'
import {
  formatOrderReadyAt,
  shouldShowOrderReadyAt,
} from '@/lib/formatOrderReadyAt'
import type { WattaLanguage } from '@/lib/i18n/language'

export interface ProfileOrderItem {
  id: number
  quantity: number
  price: number
  productId?: number
  productNameSnapshot?: string
  product?: {
    name_ru: string
    name_ua?: string | null
    name_en?: string | null
    name_nl?: string | null
    description_ru?: string
    imageUrl?: string
  } | null
}

export interface ProfileOrderReview {
  id: number
  rating: number
  text: string
  images?: unknown
}

export interface ProfileOrder {
  id: number
  createdAt: string
  totalPrice: number
  status: string
  items: ProfileOrderItem[]
  review?: ProfileOrderReview | null
  address?: string
  phone?: string
  paymentMethod?: string
  paymentStatus?: string
  fulfillmentType?: string
  deliveryFee?: number
  comment?: string
  readyAt?: string | null
  paidAt?: string | null
  usedBonuses?: number
}

function orderPipelineRank(status: string): number {
  if (status === 'CANCELLED') return -1
  if (status === 'DELIVERED' || status === 'COMPLETED') return 4
  const m: Record<string, number> = {
    PENDING: 0,
    CONFIRMED: 1,
    COOKING: 2,
    DELIVERING: 3,
  }
  return m[status] ?? 0
}

function productLineName(
  p: ProfileOrderItem['product'] | null | undefined,
  lang: Language,
  snapshot?: string
): string {
  if (p) {
    const localized = getLocalizedField(
      p as unknown as Record<string, unknown>,
      'name',
      lang as WattaLanguage,
    )
    if (localized) return localized
    if (p.name_ru) return p.name_ru
  }
  const snap = String(snapshot || '').trim()
  if (snap) return snap
  return '—'
}

const stepIcons = [Clock, Check, ChefHat, Truck, Package]

interface TProfile {
  journeyHint: string
  stepPending: string
  stepConfirmed: string
  stepCooking: string
  stepDelivering: string
  stepReceived: string
  stepReview: string
  stepReviewDone: string
  orderCancelled: string
  liveUpdating: string
  reviewOpen: string
  reviewModalTitle: string
  reviewText: string
  reviewPhotos: string
  pickPhotos: string
  reviewSend: string
  orderLabel: string
  total: string
  reorder: string
  showDetails: string
  hideDetails: string
  labelAddress: string
  labelFulfillment: string
  fulfillmentDelivery: string
  fulfillmentPickup: string
  labelPayment: string
  labelPhoneShort: string
  timelineTitle: string
  stepCurrentBadge: string
  paymentCard: string
  paymentCash: string
  paymentStatusPaid: string
  paymentStatusWaiting: string
  paymentStatusError: string
  readyAtPickup: string
  readyAtDelivery: string
  activeOrderTitle?: string
  viewReceipt?: string
  paymentCard?: string
  paymentCash?: string
  paymentStatusPaid?: string
  paymentStatusWaiting?: string
  paymentStatusError?: string
}

function formatProfilePaymentStatus(
  status: string | undefined,
  t: Pick<
    TProfile,
    'paymentStatusPaid' | 'paymentStatusWaiting' | 'paymentStatusError'
  >,
): string {
  const s = String(status || '').toUpperCase()
  if (s === 'PAID') return t.paymentStatusPaid
  if (s === 'WAITING' || s === 'PENDING') return t.paymentStatusWaiting
  if (s === 'ERROR' || s === 'FAILED') return t.paymentStatusError
  return status || ''
}

interface Props {
  orders: ProfileOrder[]
  loading: boolean
  loadingLabel: string
  lang: Language
  t: TProfile
  emptyMessage: string
  goMenuLabel: string
  onGoMenu: () => void
  onReorder: (order: ProfileOrder) => void
  onReviewSubmitted: (orderId: number, review: ProfileOrderReview) => void
  highlightOrderId?: number
}

export default function ClientProfileOrders({
  orders,
  loading,
  loadingLabel,
  lang,
  t,
  emptyMessage,
  goMenuLabel,
  onGoMenu,
  onReorder,
  onReviewSubmitted,
  highlightOrderId,
}: Props) {
  const { t: siteT } = useLanguage()
  const [expandedId, setExpandedId] = useState<number | null>(highlightOrderId ?? null)
  const [reviewOrder, setReviewOrder] = useState<ProfileOrder | null>(null)
  const [reviewText, setReviewText] = useState('')
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewImages, setReviewImages] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (highlightOrderId) {
      setExpandedId(highlightOrderId)
      return
    }
    const firstActive = orders.find((o) => isActiveOrderStatus(o.status))
    if (firstActive) setExpandedId(firstActive.id)
  }, [highlightOrderId, orders])

  const stepLabels = [
    t.stepPending,
    t.stepConfirmed,
    t.stepCooking,
    t.stepDelivering,
    t.stepReceived,
  ]

  const closeModal = useCallback(() => {
    setReviewOrder(null)
    setReviewText('')
    setReviewRating(5)
    setReviewImages([])
  }, [])

  const onPickFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return
    e.target.value = ''
    const max = 6
    const maxTotalChars = 3_800_000
    const prepared: string[] = []

    for (const f of Array.from(files)) {
      if (prepared.length >= max) break
      const dataUrl = await readReviewImageDataUrl(f)
      if (dataUrl) prepared.push(dataUrl)
    }

    if (!prepared.length) return

    setReviewImages((prev) => {
      if (prev.length >= max) return prev
      let total = prev.reduce((sum, src) => sum + src.length, 0)
      const merged = [...prev]
      for (const src of prepared) {
        if (merged.length >= max) break
        if (total + src.length > maxTotalChars) break
        merged.push(src)
        total += src.length
      }
      return merged.length === prev.length ? prev : merged
    })
  }

  const submitReview = async () => {
    if (!reviewOrder) return
    const token = localStorage.getItem('token')
    if (!token) {
      toast.error(siteT.appToasts.loginAgain)
      return
    }
    const txt = reviewText.trim()
    if (txt.length < 3) {
      toast.error(siteT.appToasts.reviewNeedText)
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId: reviewOrder.id,
          rating: reviewRating,
          text: txt,
          images: reviewImages,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(
          getReviewSubmitErrorMessage(res.status, data.message as string | undefined, {
            loginAgain: siteT.appToasts.loginAgain,
            reviewNeedText: siteT.appToasts.reviewNeedText,
            reviewSaveError: siteT.appToasts.reviewSaveError,
            reviewDuplicate: siteT.appToasts.reviewDuplicate,
            reviewImageRejected: siteT.appToasts.reviewImageRejected,
          }),
        )
        return
      }
      toast.success(siteT.appToasts.reviewThanks)
      window.dispatchEvent(new CustomEvent('reviewsUpdated'))
      onReviewSubmitted(reviewOrder.id, {
        id: data.id,
        rating: data.rating,
        text: data.text,
        images: data.images,
      })
      closeModal()
    } catch {
      toast.error(siteT.appToasts.networkError)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <motion.div
          className="h-14 w-14 rounded-2xl border-2 border-[#145142]/30 border-t-[#145142]"
          animate={{ rotate: 360 }}
          transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
        />
        <p className="text-[#145142]/70 font-medium">{loadingLabel}</p>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="px-4 py-14 text-center sm:py-20">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 text-[#145142]/35">
          <Package className="h-10 w-10" />
        </div>
        <p className="mb-6 text-base font-medium text-gray-600 sm:text-lg">{emptyMessage}</p>
        <button
          type="button"
          onClick={onGoMenu}
          className="inline-flex items-center gap-2 rounded-xl bg-[#145142] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#0f3d32]"
        >
          <Sparkles className="h-4 w-4" />
          {goMenuLabel}
        </button>
      </div>
    )
  }

  const activeOrders = orders.filter((o) => isActiveOrderStatus(o.status))
  const pastOrders = orders.filter((o) => !isActiveOrderStatus(o.status))

  const renderOrderList = (list: ProfileOrder[], startIndex: number) =>
    list.map((order, idx) => (
      <OrderCard
        key={order.id}
        order={order}
        index={startIndex + idx}
        lang={lang}
        t={t}
        stepLabels={stepLabels}
        stepIcons={stepIcons}
        isActive={isActiveOrderStatus(order.status)}
        expanded={expandedId === order.id}
        onToggleExpand={() =>
          setExpandedId((id) => (id === order.id ? null : order.id))
        }
        onReorder={() => onReorder(order)}
        onOpenReview={() => setReviewOrder(order)}
      />
    ))

  return (
    <div className="space-y-6 sm:space-y-8">
      <p className="flex items-center gap-2 text-sm text-gray-600">
        <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
        {t.journeyHint}
      </p>

      {activeOrders.length > 0 ? (
        <section className="space-y-4">
          <h3 className="text-base font-bold text-[#145142] sm:text-lg">
            {t.activeOrderTitle ?? 'Активне замовлення'}
          </h3>
          {renderOrderList(activeOrders, 0)}
        </section>
      ) : null}

      {renderOrderList(pastOrders, activeOrders.length)}

      <AnimatePresence>
        {reviewOrder ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={closeModal}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                <h3 className="text-lg font-bold text-gray-900">{t.reviewModalTitle}</h3>
                <button
                  type="button"
                  onClick={closeModal}
                  className="p-2 rounded-xl hover:bg-gray-100 text-gray-500"
                  aria-label={siteT.siteAria.close}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <p className="text-sm text-gray-500">
                  #{reviewOrder.id} · {new Date(reviewOrder.createdAt).toLocaleString()}
                </p>
                <div className="flex gap-1 justify-center">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setReviewRating(n)}
                      className="p-1"
                    >
                      <Star
                        className={`w-9 h-9 ${
                          n <= reviewRating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-gray-200'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder={t.reviewText}
                  rows={4}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-gray-800 focus:ring-2 focus:ring-[#145142]/30 focus:border-[#145142] outline-none resize-none"
                />
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">{t.reviewPhotos}</p>
                  <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#145142]/10 text-[#145142] font-semibold cursor-pointer hover:bg-[#145142]/15">
                    <input type="file" accept="image/*" multiple className="hidden" onChange={onPickFiles} />
                    {t.pickPhotos}
                  </label>
                  {reviewImages.length > 0 ? (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {reviewImages.map((src, i) => (
                        <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={src} alt="" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            className="absolute top-0 right-0 bg-black/50 text-white text-xs px-1"
                            onClick={() => setReviewImages((prev) => prev.filter((_, j) => j !== i))}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={submitReview}
                  className="w-full py-3.5 rounded-2xl bg-[#145142] text-white font-bold hover:bg-[#0f3d32] disabled:opacity-60 transition"
                >
                  {submitting ? '…' : t.reviewSend}
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

function OrderCard({
  order,
  index,
  lang,
  t,
  stepLabels,
  stepIcons,
  isActive,
  expanded,
  onToggleExpand,
  onReorder,
  onOpenReview,
}: {
  order: ProfileOrder
  index: number
  lang: Language
  t: TProfile
  stepLabels: string[]
  stepIcons: LucideIcon[]
  isActive?: boolean
  expanded: boolean
  onToggleExpand: () => void
  onReorder: () => void
  onOpenReview: () => void
}) {
  const rank = orderPipelineRank(order.status)
  const cancelled = rank < 0
  const terminal = order.status === 'COMPLETED' || order.status === 'DELIVERED'
  const hasReview = !!order.review
  const showReviewStep = terminal && !cancelled
  const showDetailsLabel = expanded ? t.hideDetails : t.showDetails
  const timelineTitle = t.timelineTitle
  const showReadyAt =
    !!order.readyAt &&
    shouldShowOrderReadyAt(order.status) &&
    !cancelled
  const isPickup = String(order.fulfillmentType || '').toUpperCase() === 'PICKUP'
  const readyAtFormatted = order.readyAt
    ? formatOrderReadyAt(order.readyAt, lang)
    : ''
  const readyAtTemplate = isPickup ? t.readyAtPickup : t.readyAtDelivery
  const readyAtParts = readyAtTemplate.split('{{time}}')

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
      className="relative"
    >
      <div
        className={`rounded-2xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md sm:rounded-2xl sm:p-6 ${
          isActive
            ? 'border-[#ff6b35]/40 ring-2 ring-[#ff6b35]/15 shadow-[0_8px_30px_rgba(255,107,53,0.12)]'
            : 'border-gray-200'
        }`}
      >
        <div className="relative mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#145142] text-white sm:h-14 sm:w-14">
              <Package className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 sm:text-xl">
                {t.orderLabel} #{order.id}
              </h3>
              <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#145142]" />
                {new Date(order.createdAt).toLocaleString(
                  lang === 'uk' ? 'uk-UA' : lang === 'nl' ? 'nl-NL' : lang === 'en' ? 'en-GB' : 'ru-RU'
                )}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wide text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-3 py-1.5 rounded-full">
              {t.liveUpdating}
            </span>
            {cancelled ? (
              <span className="text-xs font-bold text-red-700 bg-red-50 px-3 py-1.5 rounded-full border border-red-100">
                {t.orderCancelled}
              </span>
            ) : null}
            <button
              type="button"
              onClick={onToggleExpand}
              className="inline-flex items-center gap-1 rounded-full border border-[#145142]/20 bg-white px-3 py-1.5 text-xs font-bold text-[#145142] transition hover:bg-[#145142]/5"
            >
              {showDetailsLabel}
              <ChevronDown
                className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
              />
            </button>
          </div>
        </div>

        {showReadyAt ? (
          <div
            className="mb-5 flex items-start gap-3 rounded-xl border border-[#145142]/20 bg-gradient-to-r from-[#f4faf7] to-white px-4 py-3.5 sm:px-5"
            role="status"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#145142] text-white">
              <Clock className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium leading-snug text-gray-800 sm:text-base">
                {readyAtParts[0]}
                <span className="font-bold text-[#145142]">{readyAtFormatted}</span>
                {readyAtParts[1] ?? ''}
              </p>
            </div>
          </div>
        ) : null}

        <AnimatePresence initial={false}>
          {expanded ? (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-5 overflow-hidden"
            >
              <div className="rounded-xl border border-[#145142]/12 bg-[#f4faf7] p-4 sm:p-5">
                <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[#145142]/70">
                  {timelineTitle}
                </p>
                <ol className="space-y-3">
                  {stepLabels.map((label, si) => {
                    const Icon = stepIcons[si]
                    const done = !cancelled && rank > si
                    const current = !cancelled && rank === si
                    return (
                      <li key={label} className="flex gap-3">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 ${
                            done
                              ? 'border-[#145142] bg-[#145142] text-white'
                              : current
                                ? 'border-[#ff6b35] bg-white text-[#ff6b35] ring-2 ring-[#ff6b35]/25'
                                : 'border-gray-200 bg-white text-gray-300'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 pt-0.5">
                          <p
                            className={`text-sm font-bold ${
                              done || current ? 'text-[#145142]' : 'text-gray-400'
                            }`}
                          >
                            {label}
                            {current ? (
                              <span className="ml-2 text-[10px] font-bold uppercase text-[#ff6b35]">
                                · {t.stepCurrentBadge}
                              </span>
                            ) : null}
                          </p>
                        </div>
                      </li>
                    )
                  })}
                </ol>
                <div className="mt-4 grid gap-2 border-t border-[#145142]/10 pt-4 text-sm sm:grid-cols-2">
                  {order.address ? (
                    <p className="flex gap-2 text-gray-700">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#145142]" />
                      <span>
                        <span className="font-semibold text-gray-900">
                          {t.labelAddress}:{' '}
                        </span>
                        {order.address}
                      </span>
                    </p>
                  ) : null}
                  {order.phone ? (
                    <p className="text-gray-700">
                      <span className="font-semibold text-gray-900">{t.labelPhoneShort}: </span>
                      {order.phone}
                    </p>
                  ) : null}
                  <p className="flex gap-2 text-gray-700">
                    <CreditCard className="mt-0.5 h-4 w-4 shrink-0 text-[#145142]" />
                    <span>
                      <span className="font-semibold text-gray-900">
                        {t.labelPayment}:{' '}
                      </span>
                      {order.paymentMethod === 'CARD' ? t.paymentCard : t.paymentCash}
                      {order.paymentStatus
                        ? ` · ${formatProfilePaymentStatus(order.paymentStatus, t)}`
                        : ''}
                    </span>
                  </p>
                  <p className="text-gray-700">
                    <span className="font-semibold text-gray-900">
                      {t.labelFulfillment}:{' '}
                    </span>
                    {order.fulfillmentType === 'PICKUP'
                      ? t.fulfillmentPickup
                      : t.fulfillmentDelivery}
                    {order.deliveryFee != null && order.deliveryFee > 0
                      ? ` · ${order.deliveryFee.toFixed(2)} €`
                      : ''}
                  </p>
                  {order.comment ? (
                    <p className="sm:col-span-2 italic text-gray-600">{order.comment}</p>
                  ) : null}
                </div>
                {showReviewStep ? (
                  <div className="mt-4 flex flex-col gap-3 border-t border-[#145142]/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                          hasReview ? 'bg-emerald-500 text-white' : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        <Star className={`h-5 w-5 ${hasReview ? 'fill-white' : ''}`} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#145142]">
                          {hasReview ? t.stepReviewDone : t.stepReview}
                        </p>
                        {hasReview && order.review ? (
                          <p className="text-xs text-gray-500 line-clamp-2">{order.review.text}</p>
                        ) : null}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={onOpenReview}
                      className="shrink-0 rounded-lg bg-[#145142] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0f3d32]"
                    >
                      {t.reviewOpen}
                    </button>
                  </div>
                ) : null}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {!cancelled && !expanded ? (
          <div
            className="relative mb-6 overflow-x-auto rounded-xl border border-gray-100 bg-gray-50/80 p-4 sm:p-5"
            role="group"
            aria-label={timelineTitle}
          >
            <div className="min-w-[min(100%,520px)] sm:min-w-0">
              <ol className="relative grid grid-cols-5">
                {stepLabels.map((label, si) => {
                  const Icon = stepIcons[si]
                  const done = rank > si
                  const current = rank === si
                  const trackY = 'top-5 sm:top-[22px]'
                  return (
                    <li key={label} className="relative flex justify-center">
                      {si > 0 ? (
                        <span
                          className={`pointer-events-none absolute right-1/2 ${trackY} z-0 h-0.5 w-1/2 -translate-y-1/2 rounded-full ${
                            rank > si - 1 ? 'bg-[#145142]' : 'bg-gray-200'
                          }`}
                          aria-hidden
                        />
                      ) : null}
                      {si < stepLabels.length - 1 ? (
                        <span
                          className={`pointer-events-none absolute left-1/2 ${trackY} z-0 h-0.5 w-1/2 -translate-y-1/2 rounded-full ${
                            rank > si ? 'bg-[#145142]' : 'bg-gray-200'
                          }`}
                          aria-hidden
                        />
                      ) : null}
                      <div
                        className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-lg border-2 transition-all sm:h-11 sm:w-11 ${
                          done
                            ? 'border-[#145142] bg-[#145142] text-white shadow-[0_4px_14px_rgba(20,81,66,0.4)]'
                            : current
                              ? 'border-[#145142] bg-[#e8f5f0] text-[#145142] ring-2 ring-[#145142]/35 shadow-[0_2px_10px_rgba(20,81,66,0.18)]'
                              : 'border-gray-200 bg-white text-gray-400'
                        }`}
                      >
                        <Icon
                          className={`h-4 w-4 shrink-0 sm:h-5 sm:w-5 ${
                            done
                              ? 'text-white'
                              : current
                                ? 'text-[#145142]'
                                : 'text-gray-400'
                          }`}
                          strokeWidth={done || current ? 2.5 : 2}
                          aria-hidden
                        />
                        <span className="sr-only">{label}</span>
                      </div>
                    </li>
                  )
                })}
              </ol>
              <ol className="mt-2 grid grid-cols-5 gap-0" aria-hidden>
                {stepLabels.map((label, si) => {
                  const done = rank > si
                  const current = rank === si
                  return (
                    <li
                      key={`${label}-caption`}
                      className="flex min-h-[2.75rem] items-start justify-center px-0.5 sm:min-h-[2.5rem]"
                    >
                      <p
                        className={`text-center text-[10px] font-bold leading-snug sm:text-xs ${
                          done
                            ? 'text-[#145142]'
                            : current
                              ? 'text-[#145142]'
                              : 'text-gray-400'
                        }`}
                      >
                        {label}
                      </p>
                    </li>
                  )
                })}
              </ol>
            </div>

            {showReviewStep ? (
              <div className="mt-4 flex flex-col gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      hasReview ? 'bg-emerald-500 text-white' : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    <Star className={`w-5 h-5 ${hasReview ? 'fill-white' : ''}`} />
                  </div>
                  <div>
                    <p className="font-bold text-[#145142] text-sm">
                      {hasReview ? t.stepReviewDone : t.stepReview}
                    </p>
                    {hasReview && order.review ? (
                      <p className="text-xs text-gray-500 line-clamp-2">{order.review.text}</p>
                    ) : null}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onOpenReview}
                  className="shrink-0 rounded-lg bg-[#145142] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0f3d32]"
                >
                  {t.reviewOpen}
                </button>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="mb-5 space-y-0 rounded-xl border border-gray-100 bg-white p-3 sm:p-4">
          {order.items.map((item, ii) => (
            <div
              key={ii}
              className="flex justify-between items-center gap-3 py-2 border-b border-gray-100 last:border-0"
            >
              <span className="text-gray-800 font-semibold text-sm sm:text-base">
                {productLineName(item.product, lang, item.productNameSnapshot)}
              </span>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-gray-500 text-xs font-medium bg-gray-100 px-2 py-0.5 rounded-md">
                  ×{item.quantity}
                </span>
                <span className="text-[#145142] font-bold">
                  {(item.price * item.quantity).toFixed(2)} €
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xl font-bold text-gray-900 sm:text-2xl">
            {t.total}: {order.totalPrice} €
          </p>
          <div className="flex flex-wrap gap-2">
            {canShowOrderReceipt(order.paymentStatus, order.paymentMethod) ? (
              <Link
                href={`/profile/order/${order.id}/receipt`}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#145142]/25 bg-white px-5 py-2.5 text-sm font-semibold text-[#145142] transition hover:bg-[#145142]/5"
              >
                <Receipt className="h-4 w-4" aria-hidden />
                {t.viewReceipt ?? 'Чек'}
              </Link>
            ) : null}
            <button
              type="button"
              onClick={onReorder}
              className="rounded-xl bg-[#145142] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0f3d32]"
            >
              {t.reorder}
            </button>
          </div>
        </div>
      </div>
    </motion.article>
  )
}
