'use client'

import { ShoppingBag } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useInstantRouter } from '@/hooks/useInstantRouter'
import { useCartBarSnapshot } from '@/hooks/useCartBarSnapshot'
import { openWattaCart } from '@/lib/openWattaCart'
import { useOptionalCartDrawer } from '../context/CartDrawerContext'
import {
  formatMobileCartBarAria,
  WattaMobileCartBarSummary,
} from './WattaMobileCartBarSummary'

type Props = {
  visible: boolean
}

/** Зелена смуга поверх фото картки — зведення кошика та «Оформити», як нижній mobile bar. */
export function HomeMenuProductCartMediaOverlay({ visible }: Props) {
  const router = useInstantRouter()
  const cartDrawer = useOptionalCartDrawer()
  const { t } = useLanguage()
  const cs = t.cartSection
  const { pieces, total, hasItems } = useCartBarSnapshot()

  if (!visible || !hasItems) return null

  const totalFormatted = total.toFixed(2)
  const summaryAria = formatMobileCartBarAria(
    pieces,
    totalFormatted,
    true,
    '',
    cs.mobileBarSummaryLead,
    cs.mobileBarSummaryAmount,
  )

  return (
    <button
      type="button"
      className="home-menu-product-cart-media-overlay-web watta-mobile-cart-bar watta-mobile-cart-bar--card-overlay"
      data-watta-cart-filled="true"
      data-watta-skip-instant-nav=""
      aria-label={`${summaryAria}. ${t.siteAria.cart}`}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        openWattaCart(router, cartDrawer?.open, cartDrawer?.enabled !== false)
      }}
    >
      <WattaMobileCartBarSummary
        pieces={pieces}
        totalFormatted={totalFormatted}
        hasItems
        emptyLabel=""
        leadTemplate={cs.mobileBarSummaryLead}
        amountTemplate={cs.mobileBarSummaryAmount}
      />
      <span className="watta-mobile-cart-bar__cta">
        {t.siteAria.cart}
        <ShoppingBag className="watta-mobile-cart-bar__ico" strokeWidth={2.25} aria-hidden />
      </span>
    </button>
  )
}
