'use client'

import { cn } from '@/lib/utils'
import { MenuCategorySticker } from './MenuCategorySticker'
import WattaLink from './WattaLink'

type Props = {
  slug: string
  emoji: string
  label: string
  imageUrl?: string | null
  hoverImageUrl?: string | null
  href?: string | null
  className?: string
}

export function CategoryDisplayPill({
  slug,
  emoji,
  label,
  imageUrl,
  hoverImageUrl,
  href,
  className,
}: Props) {
  const content = (
    <>
      <span className="watta-category-pill__icon" aria-hidden>
        <MenuCategorySticker
          variant="strip"
          slug={slug}
          emoji={emoji}
          imageUrl={imageUrl}
          hoverImageUrl={hoverImageUrl}
        />
      </span>
      <span className="watta-category-pill__label truncate">{label}</span>
    </>
  )

  const rootClass = cn('watta-category-pill', className)

  if (href) {
    return (
      <WattaLink href={href} className={rootClass}>
        {content}
      </WattaLink>
    )
  }

  return <span className={rootClass}>{content}</span>
}
