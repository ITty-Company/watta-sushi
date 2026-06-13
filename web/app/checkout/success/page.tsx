'use client'

import { Suspense, useCallback, useEffect, useLayoutEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { Bell } from '@/lib/wattaInlineIcons'
import { useLanguage } from '../../context/LanguageContext'
import { useOptionalNotificationsDrawer } from '../../context/NotificationsDrawerContext'
import LogoBackground from '../../components/LogoBackground'
import { WattaInViewFadeDiv } from '../../components/WattaInViewFade'
import WattaLink from '../../components/WattaLink'
import CheckoutSuccessIllustration from '../../components/CheckoutSuccessIllustration'
import CheckoutSuccessSmsIntro from '../../components/CheckoutSuccessSmsIntro'
import { useInstantRouter } from '@/hooks/useInstantRouter'
import { getBearerAuthHeaders } from '../../../lib/authHeaders'
import { openWattaNotifications } from '@/lib/openWattaNotifications'
import { WATTA_NOTIFICATIONS_CHANGED_EVENT } from '@/lib/userNotificationsApi'
import { clearCartStorage } from '@/lib/cartStorage'
import { consumeCheckoutSuccessLineCount } from '@/lib/checkoutSuccessSession'
import '@/app/watta-checkout-success.css'

const SMS_INTRO_MS = 2200
const SMS_EXIT_MS = 420

function CheckoutSuccessContent() {
  const { t } = useLanguage()
  const cs = t.cartSection
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')
  const router = useInstantRouter()
  const notificationsDrawer = useOptionalNotificationsDrawer()
  const [isFirstOrder, setIsFirstOrder] = useState<boolean | null>(null)
  const [showSmsIntro, setShowSmsIntro] = useState(true)
  const [smsExiting, setSmsExiting] = useState(false)
  const [showMainCard, setShowMainCard] = useState(false)
  const [orderLineCount, setOrderLineCount] = useState<number | null>(null)

  useLayoutEffect(() => {
    clearCartStorage()
    window.dispatchEvent(new Event(WATTA_NOTIFICATIONS_CHANGED_EVENT))
    const count = consumeCheckoutSuccessLineCount()
    if (count != null) setOrderLineCount(count)
  }, [])

  useEffect(() => {
    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion) {
      setShowSmsIntro(false)
      setShowMainCard(true)
      return
    }

    const exitTimer = window.setTimeout(() => setSmsExiting(true), SMS_INTRO_MS)
    const hideTimer = window.setTimeout(() => {
      setShowSmsIntro(false)
      setShowMainCard(true)
    }, SMS_INTRO_MS + SMS_EXIT_MS)

    return () => {
      window.clearTimeout(exitTimer)
      window.clearTimeout(hideTimer)
    }
  }, [])

  useEffect(() => {
    if (!orderId) return
    const authHeaders = getBearerAuthHeaders()
    if (Object.keys(authHeaders).length === 0) return
    void fetch('/api/payment/stripe/sync-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ orderId: Number(orderId) }),
    }).catch(() => {
      /* webhook або повторна спроба пізніше */
    })
  }, [orderId])

  useEffect(() => {
    if (orderLineCount != null || !orderId) return
    const authHeaders = getBearerAuthHeaders()
    if (Object.keys(authHeaders).length === 0) return
    void fetch(`/api/orders/my/${orderId}`, {
      headers: authHeaders,
      cache: 'no-store',
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((order: { items?: unknown[] } | null) => {
        if (order && Array.isArray(order.items) && order.items.length > 0) {
          setOrderLineCount(order.items.length)
        }
      })
      .catch(() => {
        /* ignore */
      })
  }, [orderId, orderLineCount])

  useEffect(() => {
    const authHeaders = getBearerAuthHeaders()
    if (Object.keys(authHeaders).length === 0) {
      setIsFirstOrder(false)
      return
    }
    void fetch('/api/orders/my', {
      headers: authHeaders,
      cache: 'no-store',
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((orders: unknown) => {
        setIsFirstOrder(Array.isArray(orders) && orders.length === 1)
      })
      .catch(() => setIsFirstOrder(false))
  }, [])

  const openNotifications = useCallback(() => {
    openWattaNotifications(router, notificationsDrawer?.open ?? null)
  }, [notificationsDrawer?.open, router])

  const title =
    isFirstOrder === true ? cs.checkoutSuccessFirstTitle : cs.checkoutSuccessTitle
  const subtitle =
    isFirstOrder === true ? cs.checkoutSuccessFirstSubtitle : cs.checkoutSuccessSubtitle

  return (
    <div className="watta-public-page-shell watta-page-bg watta-checkout-success-page relative flex flex-1 font-sans">
      <LogoBackground />
      {showSmsIntro ? <CheckoutSuccessSmsIntro exiting={smsExiting} /> : null}

      <WattaInViewFadeDiv
        className={`watta-checkout-success-page__card${
          showMainCard ? ' watta-checkout-success-page__card--visible' : ''
        }`}
      >
        <CheckoutSuccessIllustration orderLineCount={orderLineCount} />

        <h1 className="watta-checkout-success-page__title">{title}</h1>
        <p className="watta-checkout-success-page__subtitle">{subtitle}</p>

        {orderId ? (
          <p className="watta-checkout-success-page__order-id">
            {cs.checkoutOrderNumber} <span>{orderId}</span>
          </p>
        ) : null}

        <button
          type="button"
          className="watta-checkout-success-page__notify-link"
          onClick={openNotifications}
        >
          <span className="watta-checkout-success-page__notify-copy">
            <span className="watta-checkout-success-page__notify-hint-text">
              {cs.checkoutSuccessNotifyHint}
            </span>
            <span className="watta-checkout-success-page__notify-cta">
              {cs.checkoutSuccessNotifyCta}
              <ChevronRight className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} aria-hidden />
            </span>
          </span>
          <span className="watta-checkout-success-page__notify-bell" aria-hidden>
            <Bell size={22} strokeWidth={2.25} />
          </span>
        </button>

        <div className="watta-checkout-success-page__actions">
          {orderId ? (
            <WattaLink
              href={`/profile/order/${orderId}/receipt`}
              className="watta-checkout-success-page__btn watta-checkout-success-page__btn--ghost"
            >
              {t.clientProfile.viewReceipt}
            </WattaLink>
          ) : null}
          <WattaLink
            href={orderId ? `/profile?tab=history&order=${orderId}` : '/profile?tab=history'}
            className="watta-checkout-success-page__btn watta-checkout-success-page__btn--primary"
          >
            {t.clientProfile.tabHistory}
          </WattaLink>
          <WattaLink
            href="/menu"
            onClick={clearCartStorage}
            className="watta-checkout-success-page__btn watta-checkout-success-page__btn--link"
          >
            {cs.checkoutBackToMenu}
          </WattaLink>
        </div>
      </WattaInViewFadeDiv>
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutSuccessContent />
    </Suspense>
  )
}
