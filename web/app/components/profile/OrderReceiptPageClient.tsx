'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { m } from 'framer-motion'
import { AlertCircle, CheckCircle2, CreditCard, Package, Truck } from 'lucide-react'
import { Clock } from '@/lib/wattaInlineIcons'
import { ArrowLeft, MapPin, Phone } from '@/lib/wattaInlineIcons'
import { useLanguage } from '@/app/context/LanguageContext'
import { getLocalizedField } from '@/lib/i18n/getLocalizedField'
import type { WattaLanguage } from '@/lib/i18n/language'
import { resolveCatalogMediaUrl, isNextImageOptimizableCatalogUrl } from '@/lib/catalogMediaUrl'
import { HERO_COPY_EASE } from '../heroCopyMotion'
import WattaLink from '../WattaLink'
import { WattaInViewFadeArticle } from '../WattaInViewFade'
import OrderReceiptIllustration from './OrderReceiptIllustration'
import type { ProfileOrder, ProfileOrderItem } from './ClientProfileOrders'

function productLineName(
  p: ProfileOrderItem['product'],
  lang: WattaLanguage,
  snapshot?: string,
): string {
  if (p) {
    const localized = getLocalizedField(p as unknown as Record<string, unknown>, 'name', lang)
    if (localized) return localized
    if (p.name_ru) return p.name_ru
  }
  const snap = String(snapshot || '').trim()
  if (snap) return snap
  return '—'
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
  if (s === 'FAILED' || s === 'ERROR') return t.paymentStatusError
  return t.paymentStatusWaiting
}

function paymentVisual(status: string | undefined): 'paid' | 'waiting' | 'failed' {
  const s = String(status || '').toUpperCase()
  if (s === 'PAID') return 'paid'
  if (s === 'FAILED' || s === 'ERROR') return 'failed'
  return 'waiting'
}

function ReceiptItemThumb({ item }: { item: ProfileOrderItem }) {
  const imageUrl = resolveCatalogMediaUrl(item.product?.imageUrl)
  if (imageUrl && isNextImageOptimizableCatalogUrl(imageUrl)) {
    return (
      <div className="watta-order-receipt-page__item-thumb">
        <Image src={imageUrl} alt="" width={88} height={88} sizes="2.75rem" />
      </div>
    )
  }
  if (imageUrl) {
    return (
      <div className="watta-order-receipt-page__item-thumb">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt="" loading="lazy" decoding="async" />
      </div>
    )
  }
  return (
    <div className="watta-order-receipt-page__item-thumb watta-order-receipt-page__item-thumb--emoji">
      🍣
    </div>
  )
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
      if (res.status === 404 || !res.ok) {
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

  const visual = paymentVisual(order?.paymentStatus)
  const paid = visual === 'paid'
  const itemsSubtotal =
    order?.items?.reduce((sum, i) => sum + Number(i.price) * Number(i.quantity), 0) ?? 0
  const deliveryFee = Number(order?.deliveryFee ?? 0)
  const usedBonuses = Number(order?.usedBonuses ?? 0)
  const isPickup = String(order?.fulfillmentType || '').toUpperCase() === 'PICKUP'

  return (
    <div className="watta-order-receipt-page watta-public-page-shell relative flex min-h-screen flex-1 flex-col font-sans">
      <div className="watta-order-receipt-page__content">
        <WattaLink
          href={`/profile?tab=history&order=${orderId}`}
          className="watta-order-receipt-page__back"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {cp.receiptBackProfile}
        </WattaLink>

        {loading ? (
          <div className="watta-order-receipt-page__skeleton" aria-busy="true" aria-label={cp.loading}>
            <div className="watta-order-receipt-page__skeleton-block watta-order-receipt-page__skeleton-block--hero" />
            <div className="watta-order-receipt-page__skeleton-block watta-order-receipt-page__skeleton-block--card" />
          </div>
        ) : error ? (
          <div className="watta-order-receipt-page__error" role="alert">
            <AlertCircle aria-hidden />
            <p>{error}</p>
            <WattaLink
              href="/profile?tab=history"
              className="watta-order-receipt-page__btn watta-order-receipt-page__btn--ghost"
            >
              {cp.receiptBackProfile}
            </WattaLink>
          </div>
        ) : order ? (
          <>
            <header className="watta-order-receipt-page__hero">
              <OrderReceiptIllustration paymentVisual={visual} />
              <h1 className="watta-order-receipt-page__hero-title">{cp.receiptTitle}</h1>
              <p className="watta-order-receipt-page__hero-order">
                {cp.orderLabel} <span>#{order.id}</span>
              </p>
            </header>

            <WattaInViewFadeArticle className="watta-order-receipt-page__card">
              <m.div
                className="watta-order-receipt-page__status-band"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.34, ease: HERO_COPY_EASE }}
              >
                <span
                  className={`watta-order-receipt-page__status-pill watta-order-receipt-page__status-pill--${visual}`}
                >
                  {paid ? (
                    <CheckCircle2 aria-hidden />
                  ) : visual === 'failed' ? (
                    <AlertCircle aria-hidden />
                  ) : (
                    <Clock aria-hidden />
                  )}
                  {paymentStatusLabel(order.paymentStatus, cp)}
                </span>
                {paid && order.paidAt ? (
                  <p className="watta-order-receipt-page__status-hint">
                    {cp.receiptPaidAt}{' '}
                    <strong>{new Date(order.paidAt).toLocaleString(locale)}</strong>
                  </p>
                ) : !paid ? (
                  <p
                    className={`watta-order-receipt-page__status-hint${visual === 'waiting' ? ' watta-order-receipt-page__status-hint--waiting' : ''}`}
                  >
                    {cp.receiptAwaitingPayment}
                  </p>
                ) : null}
              </m.div>

              <div className="watta-order-receipt-page__meta-row">
                <span className="watta-order-receipt-page__meta-chip">
                  <Clock aria-hidden />
                  {new Date(order.createdAt).toLocaleString(locale)}
                </span>
                <span className="watta-order-receipt-page__meta-chip">
                  {isPickup ? <Package aria-hidden /> : <Truck aria-hidden />}
                  {isPickup ? cp.fulfillmentPickup : cp.fulfillmentDelivery}
                </span>
              </div>

              <section className="watta-order-receipt-page__section" aria-labelledby="receipt-items-title">
                <h2 id="receipt-items-title" className="watta-order-receipt-page__section-title">
                  {cp.receiptItemsTitle}
                </h2>
                <ul className="watta-order-receipt-page__items">
                  {order.items.map((item) => (
                    <li key={item.id} className="watta-order-receipt-page__item">
                      <ReceiptItemThumb item={item} />
                      <div className="watta-order-receipt-page__item-body">
                        <span className="watta-order-receipt-page__item-name">
                          {productLineName(
                            item.product,
                            language as WattaLanguage,
                            item.productNameSnapshot,
                          )}
                          <span className="watta-order-receipt-page__item-qty">×{item.quantity}</span>
                        </span>
                        <span className="watta-order-receipt-page__item-price">
                          {(item.price * item.quantity).toFixed(2)} €
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>

                <dl className="watta-order-receipt-page__totals">
                  <div className="watta-order-receipt-page__totals-row">
                    <dt>{cp.receiptMerchandise}</dt>
                    <dd>{itemsSubtotal.toFixed(2)} €</dd>
                  </div>
                  {deliveryFee > 0 ? (
                    <div className="watta-order-receipt-page__totals-row">
                      <dt>{cp.receiptDeliveryFee}</dt>
                      <dd>{deliveryFee.toFixed(2)} €</dd>
                    </div>
                  ) : null}
                  {usedBonuses > 0 ? (
                    <div className="watta-order-receipt-page__totals-row watta-order-receipt-page__totals-row--bonus">
                      <dt>{cp.receiptBonusesUsed}</dt>
                      <dd>−{usedBonuses.toFixed(2)} €</dd>
                    </div>
                  ) : null}
                  <div className="watta-order-receipt-page__totals-grand">
                    <dt>{cp.total}</dt>
                    <dd>{Number(order.totalPrice).toFixed(2)} €</dd>
                  </div>
                </dl>
              </section>

              <div className="watta-order-receipt-page__details">
                <div className="watta-order-receipt-page__detail">
                  <span className="watta-order-receipt-page__detail-ico">
                    <CreditCard aria-hidden />
                  </span>
                  <div>
                    <span className="watta-order-receipt-page__detail-label">{cp.labelPayment}</span>
                    <span className="watta-order-receipt-page__detail-value">
                      {order.paymentMethod === 'CARD' ? cp.paymentCard : cp.paymentCash}
                    </span>
                  </div>
                </div>
                {order.address ? (
                  <div className="watta-order-receipt-page__detail">
                    <span className="watta-order-receipt-page__detail-ico">
                      <MapPin aria-hidden />
                    </span>
                    <div>
                      <span className="watta-order-receipt-page__detail-label">{cp.labelAddress}</span>
                      <span className="watta-order-receipt-page__detail-value">{order.address}</span>
                    </div>
                  </div>
                ) : null}
                {order.phone ? (
                  <div className="watta-order-receipt-page__detail">
                    <span className="watta-order-receipt-page__detail-ico">
                      <Phone aria-hidden />
                    </span>
                    <div>
                      <span className="watta-order-receipt-page__detail-label">{cp.labelPhoneShort}</span>
                      <span className="watta-order-receipt-page__detail-value">{order.phone}</span>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="watta-order-receipt-page__actions">
                <WattaLink
                  href={`/profile?tab=history&order=${orderId}`}
                  className="watta-order-receipt-page__btn watta-order-receipt-page__btn--primary"
                >
                  {cp.receiptBackProfile}
                </WattaLink>
              </div>
            </WattaInViewFadeArticle>
          </>
        ) : null}
      </div>
    </div>
  )
}
