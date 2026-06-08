'use client'

import React from 'react'
import { useLanguage } from '../context/LanguageContext'
import { parseProductSpecsFromDescription } from '@/lib/i18n/parseProductSpecsFromDescription'
import type { WattaLanguage } from '@/lib/i18n/language'
import { usePhoneMenuOneColumn } from '@/hooks/usePhoneMenuOneColumn'
import { WattaMenuProductCard, type WattaMenuProductCardModel } from './WattaMenuProductCard'

/** Мінімальний тип для картки в стрічці та додавання в кошик */
export type HomeCategoryRailProduct = WattaMenuProductCardModel & {
  category?: string
  categorySlug?: string
  categoryId?: number
  subcategory?: string
  isHomeHit?: boolean
  recommendOrder?: number
  allowRecommendations?: boolean
}

type Props = {
  categoryLabel: string
  items: HomeCategoryRailProduct[]
  addToCart: (item: HomeCategoryRailProduct) => void
  onBeforeNavigateToProduct?: () => void
}

/** Планшет / ноутбук / десктоп: 3 колонки × 2 ряди; повний список — «Посмотреть все» */
const HOME_CATEGORY_GRID_PREVIEW_MAX = 6
/** Телефон: одна картка в ряд, до п’яти позицій у секції */
const HOME_CATEGORY_PHONE_PREVIEW_MAX = 5

export function HomeCategoryProductRail({ categoryLabel, items, addToCart, onBeforeNavigateToProduct }: Props) {
  const { t, language } = useLanguage()
  const pd = t.productDetail
  const phoneOneCol = usePhoneMenuOneColumn()
  const aria = phoneOneCol
    ? `${categoryLabel} — ${t.menuView.categoryRailAria}`
    : `${categoryLabel} — ${t.menuView.categoryGridAria}`
  const previewMax = phoneOneCol ? HOME_CATEGORY_PHONE_PREVIEW_MAX : HOME_CATEGORY_GRID_PREVIEW_MAX
  const visibleItems = items.slice(0, previewMax)

  const renderCard = (item: HomeCategoryRailProduct, index: number, variant: 'rail' | 'grid') => (
    <WattaMenuProductCard
      variant={variant}
      imagePriority={index < (variant === 'grid' ? 4 : 2)}
      className={variant === 'grid' ? 'min-w-0 w-full shadow-sm' : undefined}
      product={item}
      subtitleLine={
        parseProductSpecsFromDescription(
          item.description,
          pd.weightFallback,
          pd.piecesFallback,
          language as WattaLanguage,
        ).weightLine
      }
      onAddToCart={(product) =>
        addToCart({
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          category: item.category,
          emoji: product.emoji,
          imageUrl: product.imageUrl,
          promoDiscountPercent: product.promoDiscountPercent,
        })
      }
      onBeforeNavigateToProduct={onBeforeNavigateToProduct}
    />
  )

  if (phoneOneCol) {
    return (
      <div className="home-menu-category-grid-phone-web">
        <div
          className="home-menu-category-grid-phone-inner-web"
          role="region"
          aria-label={aria}
        >
          {visibleItems.map((item, index) => (
            <div key={item.id}>{renderCard(item, index, 'grid')}</div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="home-menu-category-grid-tablet-web">
      <div
        className="home-menu-category-grid-tablet-inner-web"
        role="region"
        aria-label={aria}
      >
        {visibleItems.map((item, index) => (
          <div key={item.id}>{renderCard(item, index, 'grid')}</div>
        ))}
      </div>
    </div>
  )
}
