'use client'

import { useCallback, useEffect, useLayoutEffect, useMemo, useState, type CSSProperties } from 'react'
import { usePathname } from 'next/navigation'
import WattaLink from './WattaLink'
import { ArrowRight } from 'lucide-react'
import { Minus, Plus, ShoppingBag, X } from '@/lib/wattaInlineIcons'
import toast from 'react-hot-toast'
import WattaNavDrawerShell from './WattaNavDrawerShell'
import { useCartDrawer } from '../context/CartDrawerContext'
import { useOptionalNotificationsDrawer } from '../context/NotificationsDrawerContext'
import { useOptionalRightNavDrawerActions } from '../context/RightNavDrawerContext'
import { useLanguage } from '../context/LanguageContext'
import { useInstantRouter } from '@/hooks/useInstantRouter'
import { openWattaCheckout } from '@/lib/openWattaCart'
import type { WattaLanguage } from '@/lib/i18n/language'
import {
  parseProductSpecsFromDescription,
  productCompositionLine,
} from '@/lib/i18n/parseProductSpecsFromDescription'
import { cartLineChargeUnitPrice } from '@/lib/cartUpsell'
import { effectiveUnitPrice, clampPromoPercent } from '@/lib/productPricing'
import {
  getCartTotalPieceCount,
  lineQuantity,
  readCartFromStorage,
  refreshCartProductMediaFromCatalog,
  type CartStorageLine,
} from '@/lib/cartStorage'
import { useCartLinesSnapshot } from '@/hooks/useCartLinesSnapshot'
import {
  decrementCartProduct,
  incrementCartProduct,
  removeCartProduct,
} from '@/lib/cartLineMutations'
import { resolveCatalogMediaUrl } from '@/lib/catalogMediaUrl'
import { defaultMinimumOrderEur } from '@/lib/deliveryMinOrder'
import {
  WATTA_CATALOG_REFRESH_EVENT,
  catalogSyncEventNames,
} from '@/lib/wattaCatalogSync'
import { WattaMobileCartBarSummary } from './WattaMobileCartBarSummary'
import CartDrawerEmptyIllustration from './CartDrawerEmptyIllustration'
import WattaCartSwipeLine from './WattaCartSwipeLine'
import '../watta-cart-drawer-empty-art.css'

function lineSubtotal(line: CartStorageLine): number {
  return cartLineChargeUnitPrice(line) * lineQuantity(line)
}

export default function WattaCartDrawer() {
  const pathname = usePathname() || '/'
  const router = useInstantRouter()
  const { isOpen, close, enabled } = useCartDrawer()
  const rightNavDrawer = useOptionalRightNavDrawerActions()
  const notificationsDrawer = useOptionalNotificationsDrawer()
  const { t, language } = useLanguage()
  const cs = t.cartSection
  const pd = t.productDetail
  const a = t.siteAria

  const cartItems = useCartLinesSnapshot()
  const [mounted, setMounted] = useState(false)
  const [openSwipeLineId, setOpenSwipeLineId] = useState<string | null>(null)

  useLayoutEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    close()
  }, [pathname, close])

  useEffect(() => {
    if (!isOpen) setOpenSwipeLineId(null)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    window.getSelection?.()?.removeAllRanges?.()
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    rightNavDrawer?.close()
    notificationsDrawer?.close()
  }, [isOpen, notificationsDrawer, rightNavDrawer])

  useEffect(() => {
    if (!enabled || !isOpen) return
    void refreshCartProductMediaFromCatalog()
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [enabled, isOpen])

  useEffect(() => {
    const sync = () => void refreshCartProductMediaFromCatalog()
    const names = catalogSyncEventNames('products')
    for (const name of names) {
      window.addEventListener(name, sync)
    }
    return () => {
      for (const name of names) {
        window.removeEventListener(name, sync)
      }
    }
  }, [])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, close])

  const subtotal = useMemo(
    () => cartItems.reduce((sum, line) => sum + lineSubtotal(line), 0),
    [cartItems],
  )

  const effectiveMinimumOrderEur = defaultMinimumOrderEur()
  const belowMinimumOrder =
    cartItems.length > 0 && subtotal + Number.EPSILON < effectiveMinimumOrderEur
  const minOrderWarningText = cs.drawerMinOrderWarning.replace(
    '{{amount}}',
    String(Math.round(effectiveMinimumOrderEur)),
  )

  const cartMetaText = cs.cartMeta
    .replace('{{lines}}', String(cartItems.length))
    .replace('{{pieces}}', String(getCartTotalPieceCount(cartItems)))

  const cartDrawerSizingStyle = useMemo((): CSSProperties | undefined => {
    if (cartItems.length === 0) return undefined
    return {
      '--cart-drawer-lines': String(cartItems.length),
      '--cart-drawer-lines-visible': String(Math.min(cartItems.length, 6)),
    } as CSSProperties
  }, [cartItems.length])

  const handleDecrement = useCallback((productId: number) => {
    decrementCartProduct(productId)
  }, [])

  const handleIncrement = useCallback((item: CartStorageLine) => {
    const result = incrementCartProduct(item)
    if (result === 'max') toast.error(cs.toastMaxQty)
  }, [cs.toastMaxQty])

  const handleRemove = useCallback((productId: number) => {
    removeCartProduct(productId)
  }, [])

  const handleCheckout = useCallback(
    (e?: React.MouseEvent | React.PointerEvent) => {
      e?.preventDefault()
      e?.stopPropagation()
      if (cartItems.length === 0) return
      close()
      openWattaCheckout(router)
    },
    [cartItems.length, close, router],
  )

  const handleOpenMenu = useCallback(() => {
    close()
    router.push('/menu')
  }, [close, router])

  if (!mounted || !enabled || pathname === '/cart') return null

  return (
    <WattaNavDrawerShell
      isOpen={isOpen}
      onClose={close}
      id="watta-cart-drawer"
      ariaLabel={cs.closeDrawerAria}
      drawerProps={
        cartDrawerSizingStyle
          ? { style: cartDrawerSizingStyle, 'data-cart-has-lines': 'true' }
          : undefined
      }
    >
      <div className="watta-cart-drawer-panel">
        <header className="watta-cart-drawer-head">
          <div className="watta-cart-drawer-head__text">
            <h2 className="watta-cart-drawer-head__title">{cs.drawerTitle}</h2>
            {cartItems.length > 0 ? (
              <p className="watta-cart-drawer-head__meta">{cartMetaText}</p>
            ) : null}
          </div>
          <button
            type="button"
            className="watta-cart-drawer-close"
            onClick={close}
            aria-label={cs.closeDrawerAria}
          >
            <X className="h-5 w-5" strokeWidth={2.25} aria-hidden />
          </button>
        </header>

        {cartItems.length === 0 ? (
          <div className="watta-cart-drawer-empty" role="status">
            <CartDrawerEmptyIllustration play={isOpen} />
            <div className="watta-cart-drawer-empty__copy">
              <p className="watta-cart-drawer-empty__kicker">{cs.emptyCartKicker}</p>
              <h3 className="watta-cart-drawer-empty__title">{cs.empty}</h3>
              <p className="watta-cart-drawer-empty__hint">{cs.emptyCartHint}</p>
              <button type="button" className="watta-cart-drawer-empty__cta" onClick={handleOpenMenu}>
                <span>{t.navigation.menu}</span>
                <ArrowRight className="watta-cart-drawer-empty__cta-arrow" size={18} strokeWidth={2.2} aria-hidden />
              </button>
            </div>
          </div>
        ) : (
          <>
            <ul className="watta-cart-drawer-list">
              {cartItems.map((item) => {
                const qty = lineQuantity(item)
                const unitCharge = cartLineChargeUnitPrice(item)
                const promo = clampPromoPercent(item.promoDiscountPercent)
                const catalogUnit = effectiveUnitPrice(item.price, item.promoDiscountPercent)
                const hasUpsellOff =
                  Number(item.cartUpsellDiscountEur) > 0 && unitCharge < item.price - 0.004
                const weightLine = parseProductSpecsFromDescription(
                  item.description ?? '',
                  pd.weightFallback,
                  pd.piecesFallback,
                  language as WattaLanguage,
                ).weightLine
                const compositionLine = productCompositionLine(
                  item.description ?? '',
                  language as WattaLanguage,
                )

                const lineKey = item.cartLineId ?? `${item.id}-line`

                return (
                  <li key={lineKey} className="watta-cart-swipe-line-wrap">
                    <WattaCartSwipeLine
                      lineId={lineKey}
                      onRemove={() => handleRemove(item.id)}
                      openLineId={openSwipeLineId}
                      onOpenChange={setOpenSwipeLineId}
                      deleteLabel={a.removeLine}
                    >
                    <div className="watta-cart-drawer-item">
                    <button
                      type="button"
                      className="watta-cart-drawer-item__remove"
                      onClick={() => handleRemove(item.id)}
                      aria-label={a.removeLine}
                    >
                      <X className="h-3.5 w-3.5" strokeWidth={2.4} aria-hidden />
                    </button>

                    <WattaLink
                      href={`/product/${item.id}`}
                      prefetch
                      className="watta-cart-drawer-item__media"
                      onClick={close}
                    >
                      {item.imageUrl ? (
                        <img
                          src={resolveCatalogMediaUrl(item.imageUrl) ?? undefined}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl">{item.emoji ?? '🍣'}</span>
                      )}
                    </WattaLink>

                    <div className="watta-cart-drawer-item__body">
                      <WattaLink
                        href={`/product/${item.id}`}
                        prefetch
                        className="watta-cart-drawer-item__name"
                        onClick={close}
                      >
                        {item.name}
                      </WattaLink>
                      {weightLine ? (
                        <p className="watta-cart-drawer-item__weight">{weightLine}</p>
                      ) : null}
                      {compositionLine ? (
                        <p className="watta-cart-drawer-item__composition">{compositionLine}</p>
                      ) : null}
                    </div>

                    <div className="watta-cart-drawer-item__aside">
                      <p className="watta-cart-drawer-item__price">
                        {hasUpsellOff && unitCharge < catalogUnit - 0.004 ? (
                          <>
                            <span className="watta-cart-drawer-item__price-old">
                              {catalogUnit.toFixed(2)} €
                            </span>
                            <span>{unitCharge.toFixed(2)} €</span>
                          </>
                        ) : !hasUpsellOff && promo > 0 ? (
                          <>
                            <span className="watta-cart-drawer-item__price-old">
                              {item.price.toFixed(2)} €
                            </span>
                            <span>{unitCharge.toFixed(2)} €</span>
                          </>
                        ) : (
                          <span>{unitCharge.toFixed(2)} €</span>
                        )}
                      </p>
                      <div className="watta-cart-drawer-qty" role="group" aria-label={item.name}>
                        <button
                          type="button"
                          className="watta-cart-drawer-qty__btn"
                          onClick={() => handleDecrement(item.id)}
                          aria-label="-1"
                        >
                          <Minus className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
                        </button>
                        <span className="watta-cart-drawer-qty__val">{qty}</span>
                        <button
                          type="button"
                          className="watta-cart-drawer-qty__btn watta-cart-drawer-qty__btn--plus"
                          onClick={() => handleIncrement(item)}
                          aria-label="+1"
                        >
                          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
                        </button>
                      </div>
                    </div>
                    </div>
                    </WattaCartSwipeLine>
                  </li>
                )
              })}
            </ul>

            <footer className="watta-cart-drawer-foot">
              {belowMinimumOrder ? (
                <p className="watta-cart-drawer-foot__min-order" role="status">
                  {minOrderWarningText}
                </p>
              ) : null}
              <div className="watta-cart-drawer-foot__row">
                <div className="watta-cart-drawer-foot__total-block">
                  <span className="watta-cart-drawer-foot__total-label">{cs.totalTogether}</span>
                  <span className="watta-cart-drawer-foot__total-amount">
                    {subtotal.toFixed(2)} €
                  </span>
                </div>
                <button type="button" className="watta-cart-drawer-checkout" onClick={handleCheckout}>
                  {cs.order}
                </button>
              </div>
              {isOpen ? (
                <button
                  type="button"
                  className="watta-mobile-cart-bar watta-cart-drawer-foot__bar"
                  data-watta-cart-filled="true"
                  data-watta-skip-instant-nav=""
                  aria-label={cs.order}
                  onClick={handleCheckout}
                >
                  <WattaMobileCartBarSummary
                    pieces={getCartTotalPieceCount(cartItems)}
                    totalFormatted={subtotal.toFixed(2)}
                    hasItems={cartItems.length > 0}
                    emptyLabel={t.cart}
                    leadTemplate={cs.mobileBarSummaryLead}
                    amountTemplate={cs.mobileBarSummaryAmount}
                  />
                  <span className="watta-mobile-cart-bar__cta">
                    {cs.mobileCheckoutShort}
                    <ShoppingBag className="watta-mobile-cart-bar__ico" strokeWidth={2.25} aria-hidden />
                  </span>
                </button>
              ) : null}
            </footer>
          </>
        )}
      </div>
    </WattaNavDrawerShell>
  )
}
