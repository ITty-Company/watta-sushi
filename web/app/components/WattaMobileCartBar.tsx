'use client'

import { usePathname } from 'next/navigation'
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

/** Плаваюча смуга кошика знизу (телефон) — як Ninja «N товар, сума | Далі». */
export default function WattaMobileCartBar() {
  const pathname = usePathname() || '/'
  const router = useInstantRouter()
  const cartDrawer = useOptionalCartDrawer()
  const { t } = useLanguage()
  const cs = t.cartSection
  const { pieces, total, hasItems } = useCartBarSnapshot()

  // Phone UX: keep the bottom cart bar visible even when empty,
  // so users always have a clear "cart entry point".
  if (pathname === '/cart' || pathname.startsWith('/admin')) {
    return null
  }

  const totalFormatted = total.toFixed(2)
  const summaryAria = formatMobileCartBarAria(
    pieces,
    totalFormatted,
    hasItems,
    t.cart,
    cs.mobileBarSummaryLead,
    cs.mobileBarSummaryAmount,
  )

  return (
    <button
      type="button"
      className="watta-mobile-cart-bar"
      data-watta-cart-filled={hasItems ? 'true' : undefined}
      onClick={() => openWattaCart(router, cartDrawer?.open, cartDrawer?.enabled !== false)}
      aria-label={`${summaryAria}. ${t.siteAria.cart}`}
      data-watta-cart-target=""
    >
      <WattaMobileCartBarSummary
        pieces={pieces}
        totalFormatted={totalFormatted}
        hasItems={hasItems}
        emptyLabel={t.cart}
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
