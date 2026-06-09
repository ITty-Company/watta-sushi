'use client'

import React, { memo } from 'react'
import { useNearViewportMount } from '@/hooks/useNearViewportMount'
import { WattaInViewFadeSection } from './WattaInViewFade'
import { FULL_MENU_HEADING_SCROLL_MARGIN } from '@/lib/wattaChromeScroll'
import { WattaMenuProductCard, type WattaMenuProductCardModel } from './WattaMenuProductCard'
import { MenuCategorySticker } from './MenuCategorySticker'
import { useLanguage } from '../context/LanguageContext'
import { parseProductSpecsFromDescription } from '@/lib/i18n/parseProductSpecsFromDescription'
import type { WattaLanguage } from '@/lib/i18n/language'

export type FullMenuCategorySectionModel = {
  id: number
  slug: string
  name: string
  emoji: string
  imageUrl?: string | null
  hoverImageUrl?: string | null
}

type MenuItem = WattaMenuProductCardModel & {
  category?: string
}

type Props = {
  cat: FullMenuCategorySectionModel
  list: MenuItem[]
  scrollPadPx: string
  emptyLabel: string
  forceMountGrid?: boolean
  formatItemsCount: (count: number) => string
  onAddToCart: (product: WattaMenuProductCardModel) => void
}

function FullMenuCategorySectionInner({
  cat,
  list,
  scrollPadPx,
  emptyLabel,
  forceMountGrid = false,
  formatItemsCount,
  onAddToCart,
}: Props) {
  const { ref: gridAnchorRef, mounted: gridMounted } = useNearViewportMount({
    forceMount: forceMountGrid,
    rootMargin: '1200px 0px 1200px 0px',
  })
  const { t, language } = useLanguage()
  const pd = t.productDetail

  return (
    <WattaInViewFadeSection
      id={`full-menu-section-${cat.slug}`}
      data-full-menu-cat={cat.slug}
      style={{ scrollMarginTop: scrollPadPx }}
      className="home-menu-cat-block-web watta-full-menu-section"
    >
      <span
        id={`full-menu-anchor-${cat.slug}`}
        className="watta-full-menu-section__anchor"
        aria-hidden
      />
      <div className="home-menu-cat-band-web">
        <div
          id={`full-menu-heading-${cat.slug}`}
          className="home-menu-cat-heading-web"
          style={{ scrollMarginTop: FULL_MENU_HEADING_SCROLL_MARGIN }}
        >
          <MenuCategorySticker
            variant="heading"
            slug={cat.slug}
            emoji={cat.emoji}
            imageUrl={cat.imageUrl}
            hoverImageUrl={cat.hoverImageUrl}
          />
          <div className="home-menu-cat-heading-text-web min-w-0">
            <h2 className="home-menu-cat-title-web">{cat.name}</h2>
            <p className="home-menu-cat-meta-line-web">{formatItemsCount(list.length)}</p>
          </div>
        </div>

        <div
          ref={gridAnchorRef as React.RefObject<HTMLDivElement>}
          className="watta-full-menu-section__grid"
        >
          {!gridMounted ? (
            <div
              className="grid grid-cols-1 items-stretch gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-3 xl:grid-cols-4"
              aria-hidden
            >
              {Array.from({ length: Math.min(list.length || 4, 4) }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse overflow-hidden rounded-2xl bg-gradient-to-b from-[#eef4f1] to-[#dfe9e4] ring-1 ring-[#145142]/6"
                >
                  <div className="aspect-[5/6] w-full" />
                  <div className="space-y-2 px-3 py-3">
                    <div className="h-3.5 w-4/5 rounded bg-[#dfe9e4]" />
                    <div className="h-3 w-1/3 rounded bg-[#e8efec]" />
                  </div>
                </div>
              ))}
            </div>
          ) : list.length === 0 ? (
            <p className="py-8 text-sm text-[#145142]/50">{emptyLabel}</p>
          ) : (
            <div className="grid grid-cols-1 items-stretch gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-3 xl:grid-cols-4">
              {list.map((item, index) => (
                <WattaMenuProductCard
                  key={item.id}
                  variant="grid"
                  imagePriority={index < 3}
                  product={item}
                  subtitleLine={
                    parseProductSpecsFromDescription(
                      item.description,
                      pd.weightFallback,
                      pd.piecesFallback,
                      language as WattaLanguage,
                    ).weightLine
                  }
                  onAddToCart={onAddToCart}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </WattaInViewFadeSection>
  )
}

export const FullMenuCategorySection = memo(FullMenuCategorySectionInner)
