'use client'

import { Heart } from '@/lib/wattaInlineIcons'
import { useRef } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { useProductFavorite } from '@/hooks/useProductFavorite'
import { cn } from '@/lib/utils'
import { runFavoritesAddFeedback } from '@/lib/favoritesAddFeedback'

type HomeMenuProductFavoriteButtonProps = {
  productId: number
  className?: string
}

/** Сердечко на картці меню — без окремого HTTP-лічильника на кожну картку. */
export function HomeMenuProductFavoriteButton({
  productId,
  className,
}: HomeMenuProductFavoriteButtonProps) {
  const { t } = useLanguage()
  const { liked, toggle } = useProductFavorite(productId, 0, { skipStandaloneFetch: true })
  const btnRef = useRef<HTMLButtonElement>(null)

  if (!Number.isFinite(productId) || productId <= 0) return null

  return (
    <button
      type="button"
      className={cn('home-menu-product-favorite-btn-web pointer-events-auto', className)}
      ref={btnRef}
      data-watta-skip-instant-nav=""
      aria-pressed={liked}
      aria-label={t.siteAria.favorites}
      onClick={(e) => {
        const was = liked
        void toggle(e)
        if (!was) {
          runFavoritesAddFeedback({ sourceEl: btnRef.current, emoji: '❤️' })
        }
      }}
    >
      <Heart
        className={cn('home-menu-product-favorite-icon-web', liked && 'is-liked')}
        strokeWidth={2.2}
        aria-hidden
      />
    </button>
  )
}
