'use client'

import { useRouter } from 'next/navigation'
import { ShoppingBag } from '@/lib/wattaInlineIcons'
import { useLanguage } from '../context/LanguageContext'
import { useInstantRouter } from '@/hooks/useInstantRouter'
import { useLiveCartCount } from '@/hooks/useLiveCartCount'
import { prefetchHref } from '@/lib/instantNav'
import { useOptionalCartDrawer } from '../context/CartDrawerContext'
import { openWattaCart } from '@/lib/openWattaCart'

/** Плаваючий «Кошик» поруч із панеллю категорій у compact-режимі chrome. */
export default function WattaChromeCompactCart() {
  const { t } = useLanguage()
  const router = useInstantRouter()
  const prefetchRouter = useRouter()
  const cartDrawer = useOptionalCartDrawer()
  const cartCount = useLiveCartCount()
  const cartDrawerOpen = cartDrawer?.isOpen === true

  return (
    <button
      type="button"
      className="watta-chrome-compact-cart-web watta-cart-trigger-press"
      data-watta-skip-instant-nav=""
      data-watta-cart-filled={cartCount > 0 ? 'true' : undefined}
      data-watta-cart-target=""
      aria-label={t.siteAria.cart}
      aria-expanded={cartDrawerOpen}
      onPointerDown={() => prefetchHref(prefetchRouter, '/cart')}
      onClick={() => openWattaCart(router, cartDrawer?.open, cartDrawer?.enabled !== false)}
    >
      <ShoppingBag size={20} className="watta-chrome-compact-cart-ico" strokeWidth={2.25} aria-hidden />
      <span className="watta-chrome-compact-cart-label">{t.cart}</span>
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
