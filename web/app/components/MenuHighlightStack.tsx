'use client'

import { WattaMenuProductCard } from './WattaMenuProductCard'

function parseSpecsFromDescription(
  desc: string,
  weightFallback: string,
  piecesFallback: string,
): { weightLine: string; piecesLine: string } {
  const g = desc.match(/(\d+)\s*г\b/i)?.[1]
  const ml = desc.match(/(\d+)\s*мл\b/i)?.[1]
  const pcs =
    desc.match(/(\d+)\s*(шт|pcs|st\.|stuks)/i)?.[1] ||
    desc.match(/(\d+)\s*(pieces|pcs)\b/i)?.[1]
  const weightLine = ml ? `${ml} мл` : g ? `${g} г` : weightFallback
  const piecesLine = pcs ? `${pcs} шт` : piecesFallback
  return { weightLine, piecesLine }
}

export type MenuHighlightStackItem = {
  id: number
  name: string
  description: string
  price: number
  emoji?: string
  imageUrl?: string
  isTop?: boolean
  isHomeHit?: boolean
  isMenuNew?: boolean
  promoDiscountPercent?: number
}

type Props = {
  title: string
  /** Короткий рядок під заголовком (наприклад пояснення до блоку хітів). */
  lead?: string
  ariaLabel: string
  items: MenuHighlightStackItem[]
  weightFallback: string
  piecesFallback: string
  onAddToCart: (item: MenuHighlightStackItem) => void
  onBeforeNavigateToProduct?: () => void
  /** `stack` — сітка карток (≤768px на /menu). `rail` — горизонтальний свайп як у каталозі. */
  layout?: 'stack' | 'rail'
}

export function MenuHighlightStack({
  title,
  lead,
  ariaLabel,
  items,
  weightFallback,
  piecesFallback,
  onAddToCart,
  onBeforeNavigateToProduct,
  layout = 'stack',
}: Props) {
  if (items.length === 0) return null

  const headingBlock = (
    <header className="text-center">
      <h2 className="mb-2 font-sans text-base font-extrabold tracking-tight text-[#145142] sm:text-lg">
        {title}
      </h2>
      {lead ? (
        <p className="mx-auto max-w-md px-1 text-[13px] font-medium leading-snug text-[#145142]/72 sm:max-w-lg sm:text-sm sm:leading-relaxed">
          {lead}
        </p>
      ) : null}
    </header>
  )

  if (layout === 'rail') {
    return (
      <section
        className="menu-highlight-stack-web w-full max-w-[100vw] shrink-0 border-b border-[#145142]/10 bg-transparent px-0 py-4 sm:py-5"
        aria-label={ariaLabel}
      >
        <div className="px-5 pb-3 pt-0.5 sm:px-8 sm:pb-4">{headingBlock}</div>
        <div className="home-menu-category-rail-outer-web">
          <div className="home-menu-category-rail-web" role="list">
            {items.map((item) => {
              const subtitleLine = parseSpecsFromDescription(
                item.description,
                weightFallback,
                piecesFallback,
              ).weightLine
              return (
                <WattaMenuProductCard
                  key={item.id}
                  variant="rail"
                  className="home-menu-product-card--rail-web shadow-sm"
                  product={{
                    id: item.id,
                    name: item.name,
                    description: item.description,
                    price: item.price,
                    emoji: item.emoji,
                    imageUrl: item.imageUrl,
                    isTop: item.isTop,
                    isHomeHit: item.isHomeHit,
                    isMenuNew: item.isMenuNew,
                    promoDiscountPercent: item.promoDiscountPercent,
                  }}
                  subtitleLine={subtitleLine}
                  onAddToCart={() => onAddToCart(item)}
                  onBeforeNavigateToProduct={onBeforeNavigateToProduct}
                />
              )
            })}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section
      className="menu-highlight-stack-web w-full max-w-[100vw] shrink-0 border-b border-[#145142]/10 bg-transparent px-6 py-4 sm:px-8 sm:py-5"
      aria-label={ariaLabel}
    >
      <div className="mb-3 sm:mb-4">{headingBlock}</div>
      <div className="menu-highlight-stack-products mx-auto grid w-full max-w-lg grid-cols-1 items-start gap-3 sm:max-w-xl sm:grid-cols-2 sm:gap-2.5">
        {items.map((item) => {
          const subtitleLine = parseSpecsFromDescription(item.description, weightFallback, piecesFallback).weightLine
          return (
            <WattaMenuProductCard
              key={item.id}
              variant="grid"
              className="min-w-0 w-full shadow-sm"
              product={{
                id: item.id,
                name: item.name,
                description: item.description,
                price: item.price,
                emoji: item.emoji,
                imageUrl: item.imageUrl,
                isTop: item.isTop,
                isHomeHit: item.isHomeHit,
                isMenuNew: item.isMenuNew,
                promoDiscountPercent: item.promoDiscountPercent,
              }}
              subtitleLine={subtitleLine}
              onAddToCart={() => onAddToCart(item)}
              onBeforeNavigateToProduct={onBeforeNavigateToProduct}
            />
          )
        })}
      </div>
    </section>
  )
}
