'use client'

import { ShoppingBag } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useInstantRouter } from '@/hooks/useInstantRouter'
import { useLiveCartCount } from '@/hooks/useLiveCartCount'
import { useOptionalCartDrawer } from '../context/CartDrawerContext'
import { openWattaCart } from '@/lib/openWattaCart'

/** Плаваючий кошик знизу екрана (телефон) — завжди доступний при скролі. */
export default function WattaFloatingCartFab() {
  const { t } = useLanguage()
  const router = useInstantRouter()
  const cartDrawer = useOptionalCartDrawer()
  const cartCount = useLiveCartCount()
  const cartDrawerOpen = cartDrawer?.isOpen === true

  return (
    <button
      type="button"
      className="watta-floating-cart-fab watta-cart-trigger-press"
      data-watta-cart-filled={cartCount > 0 ? 'true' : undefined}
      data-watta-cart-target=""
      aria-label={t.siteAria.cart}
      aria-expanded={cartDrawerOpen}
      onClick={() => openWattaCart(router, cartDrawer?.open)}
    >
      <ShoppingBag className="watta-floating-cart-fab__ico" strokeWidth={2.25} aria-hidden />
      {cartCount > 0 ? (
        <span
          className="cart-badge-web watta-cart-count-badge"
          style={{ padding: cartCount > 9 ? '2px 4px' : '2px' }}
          aria-live="polite"
        >
          {cartCount > 99 ? '99+' : cartCount}
        </span>
      ) : null}
    </button>
  )
}
