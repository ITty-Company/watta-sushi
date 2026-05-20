'use client'

import { useEffect, useMemo, useState } from 'react'
import { WATTA_CATALOG_REFRESH_EVENT } from '@/lib/wattaCatalogSync'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { cn } from '@/lib/utils'
import { resolveCatalogMediaUrl } from '@/lib/catalogMediaUrl'
import { clampPromoPercent, effectiveUnitPrice } from '@/lib/productPricing'
import { HomeMenuProductFavoriteButton } from './HomeMenuProductFavoriteButton'

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
}

type Props = {
  product: WattaMenuProductCardModel
  onAddToCart: (product: WattaMenuProductCardModel) => void
  variant: 'rail' | 'grid'
  /** Рядок під назвою (вага / шт.) */
  subtitleLine?: string
  className?: string
  /** Перед переходом на картку товару (зберегти скрол/категорію для повернення). */
  onBeforeNavigateToProduct?: () => void
}

/**
 * Єдина візуальна картка товару на сайті: стрічка на головній і сітка в меню/кошику
 * використовують ті самі `home-menu-product-*` стилі; `variant` лише вмикає ширину в горизонтальному ряді.
 */
export function WattaMenuProductCard({
  product,
  onAddToCart,
  variant,
  subtitleLine,
  className,
  onBeforeNavigateToProduct,
}: Props) {
  const { t } = useLanguage()
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
  const [imageError, setImageError] = useState(false)
  const [mediaEpoch, setMediaEpoch] = useState(0)
  useEffect(() => {
    const bump = () => setMediaEpoch((n) => n + 1)
    window.addEventListener('productsUpdated', bump)
    window.addEventListener(WATTA_CATALOG_REFRESH_EVENT, bump)
    return () => {
      window.removeEventListener('productsUpdated', bump)
      window.removeEventListener(WATTA_CATALOG_REFRESH_EVENT, bump)
    }
  }, [])
  useEffect(() => {
    setImageError(false)
  }, [product.id, product.imageUrl, mediaEpoch])
  const photoSrc = useMemo(
    () => resolveCatalogMediaUrl(product.imageUrl),
    [product.imageUrl, mediaEpoch],
  )
  const showPhoto = Boolean(photoSrc) && !imageError

  const pillNew =
    'rounded-lg bg-[#e8f6f0] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-[#145142] ring-1 ring-[#145142]/25'
  const pillHit =
    'rounded-lg bg-white px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-[#145142] ring-1 ring-[#145142]/25'
  const pillPromo =
    'rounded-lg bg-[#fff3e8] px-2 py-0.5 text-[10px] font-extrabold text-[#c45a12] ring-1 ring-[#f5c4a8]'

  const pills = (
    <div className="pointer-events-none absolute left-2 top-2 z-[2] flex max-w-[calc(100%-1rem)] flex-wrap gap-1">
      {product.isMenuNew ? <span className={pillNew}>{t.productDetail.badgeNew}</span> : null}
      {product.isTop ? <span className={pillHit}>{t.popular}</span> : null}
      {fixedOff > 0 ? <span className={pillPromo}>−{fixedOff} €</span> : null}
      {fixedOff <= 0 && promoPct > 0 ? <span className={pillPromo}>−{promoPct}%</span> : null}
    </div>
  )

  const media = (
    <div className="relative">
      {pills}
      <HomeMenuProductFavoriteButton productId={product.id} />
      <Link
        href={`/product/${product.id}`}
        className="home-menu-product-card-media-web group/media block"
        onClick={() => onBeforeNavigateToProduct?.()}
      >
        {showPhoto ? (
          <img
            src={photoSrc ?? undefined}
            alt=""
            className="home-menu-product-card-img-web h-full w-full object-cover"
            decoding="async"
            loading="lazy"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="home-menu-product-card-placeholder-web">{emoji}</div>
        )}
      </Link>
    </div>
  )

  return (
    <article
      data-menu-product-id={product.id}
      className={cn(
        'home-menu-product-card-web group',
        variant === 'rail' && 'home-menu-product-card--rail-web',
        variant === 'grid' && 'home-menu-product-card--grid-web',
        className,
      )}
    >
      {media}
      <div className="home-menu-product-card-body-web">
        <Link
          href={`/product/${product.id}`}
          className="home-menu-product-card-title-link-web"
          onClick={() => onBeforeNavigateToProduct?.()}
        >
          <h2 className="home-menu-product-card-title-web">{product.name}</h2>
        </Link>
        {subtitleLine ? <p className="home-menu-product-card-subline-web">{subtitleLine}</p> : null}
        {product.description ? <p className="home-menu-product-card-desc-web">{product.description}</p> : null}

        <div className="home-menu-product-card-footer-web">
          <div className="home-menu-product-price-stack-web">
            {oldPrice != null ? (
              <span className="home-menu-product-price-old-web">{oldPrice} €</span>
            ) : null}
            <span className="home-menu-product-price-web">{eff} €</span>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onAddToCart(product)
            }}
            className="home-menu-product-add-web"
            aria-label={orderLabel}
          >
            <Plus className="home-menu-product-add-icon-web" size={16} strokeWidth={2.4} aria-hidden />
            <span className="home-menu-product-add-text-web">{orderLabel}</span>
          </button>
        </div>
      </div>
    </article>
  )
}
