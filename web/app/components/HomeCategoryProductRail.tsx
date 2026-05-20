'use client'

import React from 'react'
import { useLanguage } from '../context/LanguageContext'
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

export function HomeCategoryProductRail({ categoryLabel, items, addToCart, onBeforeNavigateToProduct }: Props) {
  const { t } = useLanguage()
  const aria = `${categoryLabel} — ${t.menuView.categoryRailAria}`

  return (
    <div className="home-menu-category-rail-outer-web">
      <div className="home-menu-category-rail-web" role="region" aria-label={aria}>
        {items.map((item) => (
          <WattaMenuProductCard
            key={item.id}
            variant="rail"
            product={item}
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
        ))}
      </div>
    </div>
  )
}
