'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { parseProductSpecsFromDescription } from '@/lib/i18n/parseProductSpecsFromDescription'
import type { WattaLanguage } from '@/lib/i18n/language'
import { useLanguage } from '../context/LanguageContext'
import { WattaMenuProductCard } from './WattaMenuProductCard'
import { WattaInViewFadeSection } from './WattaInViewFade'

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
  /** Додаткові класи для контейнера сітки (`layout="stack"`). */
  productsGridClassName?: string
  /** Замість стандартного h2+p (наприклад вступ як на головній). */
  headingSlot?: ReactNode
  /** Без заголовка над сіткою (лише aria-label секції). */
  suppressHeading?: boolean
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
  productsGridClassName,
  headingSlot,
  suppressHeading = false,
}: Props) {
  const { language } = useLanguage()
  const lang = language as WattaLanguage
  const effectiveLayout = layout

  if (items.length === 0) return null

  const headingBlock = headingSlot ?? (
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

  if (effectiveLayout === 'rail') {
    return (
      <WattaInViewFadeSection
        className="menu-highlight-stack-web w-full max-w-[100vw] shrink-0 border-b border-[#145142]/10 bg-transparent px-0 py-4 sm:py-5"
        aria-label={ariaLabel}
      >
        <div className="px-6 pb-3 pt-0.5 sm:px-8 sm:pb-4">{headingBlock}</div>
        <div className="home-menu-category-rail-outer-web">
          <div className="home-menu-category-rail-web watta-product-peek-rail-scroll" role="list">
            {items.map((item, index) => {
              const subtitleLine = parseProductSpecsFromDescription(
                item.description,
                weightFallback,
                piecesFallback,
                lang,
              ).weightLine
              return (
                <div key={item.id}>
                  <WattaMenuProductCard
                    variant="rail"
                    imagePriority={index < 2}
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
                </div>
              )
            })}
          </div>
        </div>
      </WattaInViewFadeSection>
    )
  }

  return (
    <WattaInViewFadeSection
      className="menu-highlight-stack-web w-full max-w-[100vw] shrink-0 border-b border-[#145142]/10 bg-transparent px-7 py-4 sm:px-8 sm:py-5"
      aria-label={ariaLabel}
    >
      {suppressHeading ? null : <div className="mb-3 sm:mb-4">{headingBlock}</div>}
      <div
        className={cn(
          'menu-highlight-stack-products mx-auto grid w-full max-w-lg grid-cols-1 items-stretch gap-3 md:max-w-xl md:grid-cols-2 md:gap-2.5',
          productsGridClassName,
        )}
      >
        {items.map((item, index) => {
          const subtitleLine = parseProductSpecsFromDescription(
            item.description,
            weightFallback,
            piecesFallback,
            lang,
          ).weightLine
          return (
            <div key={item.id}>
              <WattaMenuProductCard
                variant="grid"
                imagePriority={index < 4}
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
            </div>
          )
        })}
      </div>
    </WattaInViewFadeSection>
  )
}
