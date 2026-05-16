'use client'

import { Heart } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useProductFavorite } from '@/hooks/useProductFavorite'
import { cn } from '@/lib/utils'

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

  if (!Number.isFinite(productId) || productId <= 0) return null

  return (
    <button
      type="button"
      className={cn('home-menu-product-favorite-btn-web', className)}
      aria-pressed={liked}
      aria-label={t.siteAria.favorites}
      onClick={(e) => {
        void toggle(e)
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
