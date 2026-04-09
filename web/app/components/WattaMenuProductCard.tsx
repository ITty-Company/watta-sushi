'use client'

import Link from 'next/link'
import { Heart, Plus } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { cn } from '@/lib/utils'
import { clampPromoPercent, effectiveUnitPrice } from '@/lib/productPricing'
import { useProductFavorite } from '@/hooks/useProductFavorite'

export type WattaMenuProductCardModel = {
  id: number
  name: string
  description: string
  price: number
  emoji?: string
  imageUrl?: string
  isTop?: boolean
  promoDiscountPercent?: number
}

type Props = {
  product: WattaMenuProductCardModel
  onAddToCart: () => void
  variant: 'rail' | 'grid'
  /** Рядок під назвою (вага / шт.) */
  subtitleLine?: string
  className?: string
  /** Перед переходом на картку товару (зберегти скрол/категорію для повернення). */
  onBeforeNavigateToProduct?: () => void
}

export function WattaMenuProductCard({
  product,
  onAddToCart,
  variant,
  subtitleLine,
  className,
  onBeforeNavigateToProduct,
}: Props) {
  const { t } = useLanguage()
  const { liked, toggle } = useProductFavorite(product.id)
  const promoPct = clampPromoPercent(product.promoDiscountPercent)
  const eff = effectiveUnitPrice(product.price, promoPct)
  const emoji = product.emoji ?? '🍣'
  const orderLabel = t.menuView.fullMenuWant

  const pillHit =
    'rounded-lg bg-[#eef6f3] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-[#145142] ring-1 ring-[#145142]/25'
  const pillPromo =
    'rounded-lg bg-[#fff3e8] px-2 py-0.5 text-[10px] font-extrabold text-[#c45a12] ring-1 ring-[#f5c4a8]'

  const pills = (
    <div className="pointer-events-none absolute left-2 top-2 z-[2] flex max-w-[calc(100%-3rem)] flex-wrap gap-1">
      {product.isTop ? <span className={pillHit}>{t.popular}</span> : null}
      {promoPct > 0 ? <span className={pillPromo}>−{promoPct}%</span> : null}
    </div>
  )

  const heartBtn = (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-full border border-white/90 bg-white/95 text-neutral-500 shadow-md transition hover:scale-[1.03] active:scale-[0.98]',
        liked && 'text-red-500',
      )}
      aria-label={t.navigation.favorites}
      aria-pressed={liked}
    >
      <Heart
        className={cn('h-[18px] w-[18px] sm:h-5 sm:w-5', liked && 'fill-red-500 text-red-500')}
        strokeWidth={2}
      />
    </button>
  )

  const mediaRail = (
    <div className="relative">
      {pills}
      <div className="absolute right-2 top-2 z-[3]">{heartBtn}</div>
      <Link
        href={`/product/${product.id}`}
        className="home-menu-product-card-media-web group/media block"
        onClick={() => onBeforeNavigateToProduct?.()}
      >
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt=""
            className="home-menu-product-card-img-web h-full w-full object-cover"
          />
        ) : (
          <div className="home-menu-product-card-placeholder-web">{emoji}</div>
        )}
        <span className="home-menu-product-card-shine-web" aria-hidden />
      </Link>
    </div>
  )

  const mediaGrid = (
    <div className="relative">
      {pills}
      <div className="absolute right-2 top-2 z-[3]">{heartBtn}</div>
      <Link
        href={`/product/${product.id}`}
        className="group/media relative block aspect-[4/3] overflow-hidden rounded-t-2xl bg-[#eef2ef] sm:rounded-t-2xl"
        onClick={() => onBeforeNavigateToProduct?.()}
      >
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt=""
            className="h-full w-full object-cover transition duration-300 group-hover/media:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-5xl opacity-40">{emoji}</div>
        )}
      </Link>
    </div>
  )

  const titleBlock = (
    <>
      <Link
        href={`/product/${product.id}`}
        className={variant === 'rail' ? 'home-menu-product-card-title-link-web' : ''}
        onClick={() => onBeforeNavigateToProduct?.()}
      >
        <h2
          className={cn(
            variant === 'rail' ? 'home-menu-product-card-title-web' : 'text-sm font-bold leading-snug text-[#0f241e] transition group-hover:text-[#145142] sm:text-base',
          )}
        >
          {product.name}
        </h2>
      </Link>
      {subtitleLine ? (
        <p className="mt-0.5 text-xs font-semibold text-[#e85d2a]">{subtitleLine}</p>
      ) : null}
      {product.description ? (
        <p
          className={cn(
            variant === 'rail'
              ? 'home-menu-product-card-desc-web'
              : 'text-xs leading-relaxed text-[#4a5560] sm:text-[13px] line-clamp-2',
          )}
        >
          {product.description}
        </p>
      ) : null}
    </>
  )

  const priceFooter = (
    <div
      className={cn(
        variant === 'rail'
          ? 'home-menu-product-card-footer-web'
          : 'mt-auto flex items-center justify-between gap-2 border-t border-[#145142]/08 pt-3',
      )}
    >
      <div className={variant === 'rail' ? 'home-menu-product-price-stack-web' : ''}>
        {promoPct > 0 ? (
          <span
            className={variant === 'rail' ? 'home-menu-product-price-old-web' : 'text-sm font-semibold text-[#94a3b8] line-through'}
          >
            {product.price} €
          </span>
        ) : null}
        <span
          className={variant === 'rail' ? 'home-menu-product-price-web' : 'text-base font-extrabold tabular-nums text-[#0f241e] sm:text-lg'}
        >
          {eff} €
        </span>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onAddToCart()
        }}
        className={variant === 'rail' ? 'home-menu-product-add-web' : 'rounded-full border border-[#145142]/20 bg-[#f4faf8] px-3 py-2 text-xs font-bold text-[#145142] transition hover:border-[#145142] hover:bg-[#145142] hover:text-white active:scale-[0.98] sm:px-4 sm:text-sm'}
        aria-label={orderLabel}
      >
        {variant === 'rail' ? (
          <>
            <Plus className="home-menu-product-add-icon-web" size={20} strokeWidth={2.5} aria-hidden />
            <span className="home-menu-product-add-text-web">{orderLabel}</span>
          </>
        ) : (
          orderLabel
        )}
      </button>
    </div>
  )

  if (variant === 'rail') {
    return (
      <article
        data-menu-product-id={product.id}
        className={cn('home-menu-product-card-web home-menu-product-card--rail-web group', className)}
      >
        {mediaRail}
        <div className="home-menu-product-card-body-web">
          {titleBlock}
          {priceFooter}
        </div>
      </article>
    )
  }

  return (
    <article
      data-menu-product-id={product.id}
      className={cn(
        'group flex flex-col overflow-hidden rounded-2xl border border-[#145142]/10 bg-white shadow-[0_6px_24px_rgba(20,81,66,0.06)] transition hover:-translate-y-0.5 hover:border-[#145142]/22 hover:shadow-[0_14px_40px_rgba(20,81,66,0.1)]',
        className,
      )}
    >
      {mediaGrid}
      <div className="flex flex-1 flex-col gap-2 p-3 sm:p-4">
        {titleBlock}
        {priceFooter}
      </div>
    </article>
  )
}
