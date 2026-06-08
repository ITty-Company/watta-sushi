'use client'

import Image from 'next/image'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import WattaLink from './WattaLink'
import { Minus, Plus } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { cn } from '@/lib/utils'
import { isNextImageOptimizableCatalogUrl, resolveCatalogMediaUrl } from '@/lib/catalogMediaUrl'
import { preloadImageUrls } from '@/lib/preloadImages'
import { prefetchHref } from '@/lib/instantNav'
import { primeProductPageChrome } from '@/lib/wattaProductChrome'
import { warmProductRouteData } from '@/lib/fetchProductById'
import { clampPromoPercent, effectiveUnitPrice } from '@/lib/productPricing'
import { productCompositionLine } from '@/lib/i18n/parseProductSpecsFromDescription'
import type { WattaLanguage } from '@/lib/i18n/language'
import { ensureIngredientsCatalog, readIngredientsCatalogSync } from '@/lib/wattaIngredientsCatalog'
import { HomeMenuProductFavoriteButton } from './HomeMenuProductFavoriteButton'
import { runCartAddFeedback } from '@/lib/cartAddFeedback'
import type { MenuAddToCartResult } from '@/hooks/useMenuAddToCart'
import { decrementCartProduct, incrementCartProduct } from '@/lib/cartLineMutations'
import { useCartLineQuantity } from '@/hooks/useCartLineQuantity'

export type WattaMenuProductCardModel = {
  id: number
  name: string
  description: string
  price: number
  emoji?: string
  imageUrl?: string
  isTop?: boolean
  /** Рекомендація з адмінки (порядок/блоки), без окремого бейджа на картці */
  isHomeHit?: boolean
  /** Блок «Новинки» на /menu */
  isMenuNew?: boolean
  promoDiscountPercent?: number
  /** Ціна зі знижкою кошика (upsell); якщо задано — показуємо compareAtPrice закресленим */
  saleUnitPrice?: number
  compareAtPrice?: number
  /** Бейдж фіксованої знижки € */
  cartFixedDiscountEur?: number
  /** Застосований склад з адмінки (GET /api/products → ingredientIds). */
  ingredientIds?: number[]
}

type Props = {
  product: WattaMenuProductCardModel
  onAddToCart: (product: WattaMenuProductCardModel) => MenuAddToCartResult | void
  variant: 'rail' | 'grid'
  /** Рядок під назвою (вага / шт.) */
  subtitleLine?: string
  /** Знижку € показати біля ціни, а не на фото (компактні картки в кошику). */
  discountNearPrice?: boolean
  className?: string
  /** Перед переходом на картку товару (зберегти скрол/категорію для повернення). */
  onBeforeNavigateToProduct?: () => void
  /** Перші картки в зоні видимості — eager; решта lazy (швидше LCP / менше мережі). */
  imagePriority?: boolean
}

/**
 * Єдина візуальна картка товару на сайті: стрічка на головній і сітка в меню/кошику
 * використовують ті самі `home-menu-product-*` стилі; `variant` лише вмикає ширину в горизонтальному ряді.
 */
export function WattaMenuProductCardInner({
  product,
  onAddToCart,
  variant,
  subtitleLine,
  discountNearPrice = false,
  className,
  onBeforeNavigateToProduct,
  imagePriority = false,
}: Props) {
  const { t, language } = useLanguage()
  const lang = language as WattaLanguage
  const router = useRouter()
  const mediaRef = useRef<HTMLDivElement>(null)
  const promoPct = clampPromoPercent(product.promoDiscountPercent)
  const catalogEff = effectiveUnitPrice(product.price, promoPct)
  const eff =
    product.saleUnitPrice != null && Number.isFinite(product.saleUnitPrice)
      ? product.saleUnitPrice
      : catalogEff
  const oldPrice =
    product.compareAtPrice != null && product.compareAtPrice > eff
      ? product.compareAtPrice
      : promoPct > 0
        ? product.price
        : null
  const fixedOff = Number(product.cartFixedDiscountEur) || 0
  const emoji = product.emoji ?? '🍣'
  const orderLabel = t.menuView.fullMenuWant

  const cartQty = useCartLineQuantity(product.id)
  const [ingredientsCatalogReady, setIngredientsCatalogReady] = useState(
    () => (readIngredientsCatalogSync()?.size ?? 0) > 0,
  )

  useEffect(() => {
    if (ingredientsCatalogReady) return
    void ensureIngredientsCatalog().then((map) => {
      if (map && map.size > 0) setIngredientsCatalogReady(true)
    })
  }, [ingredientsCatalogReady])

  const ingredientsLine = useMemo(
    () => productCompositionLine(product.description, lang, product.ingredientIds),
    [product.description, product.ingredientIds, lang, ingredientsCatalogReady],
  )

  const changeCartQty = useCallback(
    (delta: number) => {
      if (delta > 0) {
        const result = incrementCartProduct({
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          category: '',
          emoji: product.emoji,
          imageUrl: product.imageUrl,
          promoDiscountPercent: product.promoDiscountPercent,
        })
        return result !== 'max'
      }

      decrementCartProduct(product.id)
      return true
    },
    [product],
  )

  const productHref = `/product/${product.id}`

  const primeBeforeProductNav = useCallback(() => {
    warmProductRouteData(product.id)
    onBeforeNavigateToProduct?.()
  }, [product.id, onBeforeNavigateToProduct])
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const photoSrc = useMemo(() => resolveCatalogMediaUrl(product.imageUrl), [product.imageUrl])
  useEffect(() => {
    setImageError(false)
    setImageLoaded(false)
  }, [product.id, product.imageUrl])
  useEffect(() => {
    if (!imagePriority || !photoSrc) return
    preloadImageUrls([photoSrc], { limit: 1, highPriorityCount: 1 })
  }, [photoSrc, imagePriority])
  const showPhoto = Boolean(photoSrc) && !imageError
  const useNextImage = showPhoto && isNextImageOptimizableCatalogUrl(photoSrc)
  const markImageLoaded = useCallback(() => setImageLoaded(true), [])
  const bindCatalogImageRef = useCallback(
    (node: HTMLImageElement | null) => {
      if (node?.complete && node.naturalWidth > 0) markImageLoaded()
    },
    [markImageLoaded],
  )

  const warmDetail = useCallback(() => {
    warmProductRouteData(product.id)
    prefetchHref(router, productHref)
    if (photoSrc) preloadImageUrls([photoSrc], { limit: 1, highPriorityCount: 1 })
  }, [product.id, productHref, photoSrc, router])

  const showCartAddedFeedback = useCallback(() => {
    runCartAddFeedback({
      sourceEl: mediaRef.current,
      imageUrl: photoSrc,
      emoji,
    })
  }, [photoSrc, emoji])

  const handleAddToCart = useCallback(() => {
    const result = onAddToCart(product)
    if (result === 'max' || result === 'auth_redirect') return
    showCartAddedFeedback()
  }, [onAddToCart, product, showCartAddedFeedback])

  const pills = (
    <div className="home-menu-product-card-badges-web pointer-events-none">
      {product.isMenuNew ? (
        <span className="home-menu-product-badge-web home-menu-product-badge-web--new">
          {t.productDetail.badgeNew}
        </span>
      ) : null}
      {product.isTop ? (
        <span className="home-menu-product-badge-web home-menu-product-badge-web--hit">{t.popular}</span>
      ) : null}
      {fixedOff > 0 && !discountNearPrice ? (
        <span className="home-menu-product-badge-web home-menu-product-badge-web--promo">−{fixedOff} €</span>
      ) : null}
      {fixedOff <= 0 && promoPct > 0 ? (
        <span className="home-menu-product-badge-web home-menu-product-badge-web--promo">−{promoPct}%</span>
      ) : null}
    </div>
  )

  const priceLabel = `${oldPrice != null ? `${oldPrice} €, ` : ''}${eff} €`

  return (
    <article
      data-menu-product-id={product.id}
      className={cn(
        'home-menu-product-card-web group',
        variant === 'rail' && 'home-menu-product-card--rail-web',
        variant === 'grid' && 'home-menu-product-card--grid-web',
        className,
      )}
      onPointerEnter={warmDetail}
      onFocus={warmDetail}
      onTouchStart={warmDetail}
    >
      <WattaLink
        href={productHref}
        prefetch
        className="home-menu-product-card-nav-hit-web"
        aria-label={product.name}
        onPointerDown={(e) => {
          if (e.defaultPrevented || e.button !== 0) return
          primeProductPageChrome()
          warmDetail()
          primeBeforeProductNav()
        }}
        onClick={primeBeforeProductNav}
      />
      <div className="home-menu-product-card-inner-web">
        <div className="home-menu-product-card-media-frame-web" ref={mediaRef}>
          {pills}
          <div className="home-menu-product-card-media-web" aria-hidden>
            {showPhoto ? (
              <>
                {!imageLoaded ? (
                  <div className="home-menu-product-card-placeholder-web home-menu-product-card-placeholder-web--loading">
                    {emoji}
                  </div>
                ) : null}
                {useNextImage ? (
                  <Image
                    src={photoSrc!}
                    alt=""
                    fill
                    className={cn(
                      'home-menu-product-card-img-web',
                      !imageLoaded && 'home-menu-product-card-img-web--pending',
                    )}
                    sizes="(max-width: 767px) 45vw, (max-width: 1023px) 30vw, 240px"
                    priority={imagePriority}
                    onLoad={markImageLoaded}
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <img
                    ref={bindCatalogImageRef}
                    src={photoSrc ?? undefined}
                    alt=""
                    className={cn(
                      'home-menu-product-card-img-web',
                      !imageLoaded && 'home-menu-product-card-img-web--pending',
                    )}
                    decoding="async"
                    loading={imagePriority ? 'eager' : 'lazy'}
                    fetchPriority={imagePriority ? 'high' : undefined}
                    onLoad={markImageLoaded}
                    onError={() => setImageError(true)}
                  />
                )}
              </>
            ) : (
              <div className="home-menu-product-card-placeholder-web">{emoji}</div>
            )}
          </div>
        </div>

        <div className="home-menu-product-card-body-web">
          <div className="home-menu-product-card-head-web">
            <h2 className="home-menu-product-card-title-web">{product.name}</h2>
            <p
              className={cn(
                'home-menu-product-spec-weight-web',
                !subtitleLine && 'home-menu-product-card-subline-web--placeholder',
              )}
            >
              {subtitleLine || '\u00a0'}
            </p>
            <p
              className={cn(
                'home-menu-product-card-desc-web',
                !ingredientsLine && 'home-menu-product-card-subline-web--placeholder',
              )}
            >
              {ingredientsLine || '\u00a0'}
            </p>
          </div>

          <div
            className={cn(
              'home-menu-product-card-footer-web pointer-events-auto',
              cartQty > 0 && 'home-menu-product-card-footer-web--in-cart',
            )}
            data-watta-skip-instant-nav=""
          >
            <div
              className="home-menu-product-card-price-col-web"
              aria-label={`${subtitleLine ? `${subtitleLine}, ` : ''}${priceLabel}`}
            >
              <div className="home-menu-product-price-row-web">
                <p className="home-menu-product-price-web">
                  <span className="home-menu-product-price-value-web">{eff}</span>
                  <span className="home-menu-product-price-currency-web"> €</span>
                </p>
                {oldPrice != null ? (
                  <span className="home-menu-product-price-old-web">{oldPrice} €</span>
                ) : null}
                {fixedOff > 0 && discountNearPrice ? (
                  <span className="home-menu-product-price-discount-tag-web">−{fixedOff} €</span>
                ) : null}
              </div>
            </div>

            {cartQty > 0 ? (
              <div
                className="home-menu-product-cart-controls-web home-menu-product-cart-controls-web--active"
                role="group"
                aria-label={orderLabel}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    changeCartQty(-1)
                  }}
                  className="home-menu-product-cart-btn-web home-menu-product-cart-btn-web--minus"
                  aria-label="-"
                >
                  <Minus size={14} strokeWidth={2.5} aria-hidden />
                </button>
                <span className="home-menu-product-cart-qty-web" aria-live="polite">
                  {cartQty}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    if (changeCartQty(1)) showCartAddedFeedback()
                  }}
                  className="home-menu-product-cart-btn-web home-menu-product-cart-btn-web--plus"
                  aria-label="+"
                >
                  <Plus size={14} strokeWidth={2.5} aria-hidden />
                </button>
              </div>
            ) : (
              <div className="home-menu-product-card-actions-web">
                <HomeMenuProductFavoriteButton
                  productId={product.id}
                  className="home-menu-product-favorite-btn-web--footer"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleAddToCart()
                  }}
                  className="home-menu-product-add-web home-menu-product-add-web--icon"
                  aria-label={orderLabel}
                >
                  <Plus className="home-menu-product-add-icon-web" size={18} strokeWidth={2.4} aria-hidden />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}

function menuCardPropsEqual(prev: Props, next: Props): boolean {
  const a = prev.product
  const b = next.product
  return (
    prev.variant === next.variant &&
    prev.imagePriority === next.imagePriority &&
    prev.subtitleLine === next.subtitleLine &&
    prev.discountNearPrice === next.discountNearPrice &&
    prev.className === next.className &&
    prev.onAddToCart === next.onAddToCart &&
    prev.onBeforeNavigateToProduct === next.onBeforeNavigateToProduct &&
    a.id === b.id &&
    a.name === b.name &&
    a.description === b.description &&
    JSON.stringify(a.ingredientIds ?? []) === JSON.stringify(b.ingredientIds ?? []) &&
    a.price === b.price &&
    a.emoji === b.emoji &&
    a.imageUrl === b.imageUrl &&
    a.isTop === b.isTop &&
    a.isMenuNew === b.isMenuNew &&
    a.promoDiscountPercent === b.promoDiscountPercent &&
    a.saleUnitPrice === b.saleUnitPrice &&
    a.compareAtPrice === b.compareAtPrice &&
    a.cartFixedDiscountEur === b.cartFixedDiscountEur
  )
}

export const WattaMenuProductCard = memo(WattaMenuProductCardInner, menuCardPropsEqual)
