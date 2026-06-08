'use client'

import type { ReactNode } from 'react'
import { CategoryStripIcon } from './CategoryStripIcon'
import { getMenuCategoryIconFallback } from '@/lib/menuCategoryIcon'

export type MenuCategoryStickerProps = {
  slug: string
  emoji: string
  imageUrl?: string | null
  hoverImageUrl?: string | null
  /** strip — лише іконка; heading — без бейджа; drawer — круглий бейдж (legacy, у drawer-сітці — strip) */
  variant?: 'strip' | 'heading' | 'drawer'
  fallback?: ReactNode
  className?: string
}

const ICON_SIZE = {
  strip: 18,
  heading: 22,
  drawer: 20,
} as const

export function MenuCategorySticker({
  slug,
  emoji,
  imageUrl,
  hoverImageUrl,
  variant = 'heading',
  fallback,
  className,
}: MenuCategoryStickerProps) {
  const size = ICON_SIZE[variant]
  const icon = (
    <CategoryStripIcon
      imageUrl={imageUrl}
      hoverImageUrl={hoverImageUrl}
      fallback={fallback ?? getMenuCategoryIconFallback(slug, emoji, size)}
    />
  )

  if (variant === 'strip') {
    return icon
  }

  /* Заголовок секції — іконка без круглого бейджа (лише стрічка / drawer лишають коло). */
  if (variant === 'heading') {
    const rootClass = className
      ? `home-menu-cat-emoji-bare-web home-menu-cat-heading-icon-web ${className}`
      : 'home-menu-cat-emoji-bare-web home-menu-cat-heading-icon-web'
    return (
      <span className={rootClass} aria-hidden>
        {icon}
      </span>
    )
  }

  const rootClass = 'menu-category-sticker-web menu-category-sticker-web--drawer'

  return (
    <span className={className ? `${rootClass} ${className}` : rootClass} aria-hidden>
      <span className="menu-category-sticker-web__icon">{icon}</span>
    </span>
  )
}
