'use client'

import { usePathname } from 'next/navigation'
import { Heart } from 'lucide-react'
import { useInstantRouter } from '@/hooks/useInstantRouter'
import { useFavoriteCount } from '@/hooks/useFavoriteCount'
import { cn } from '@/lib/utils'

export default function WattaMobileFavoritesFab({ className }: { className?: string }) {
  const pathname = usePathname() || '/'
  const router = useInstantRouter()
  const count = useFavoriteCount()
  if (pathname.startsWith('/admin')) return null
  if (pathname === '/favorites') return null

  return (
    <button
      type="button"
      className={cn('watta-mobile-fav-fab', className)}
      onClick={() => router.push('/favorites')}
      aria-label={count > 0 ? `Favorites (${count})` : 'Favorites'}
      data-watta-fav-target=""
    >
      <Heart className="watta-mobile-fav-fab__ico" strokeWidth={2.25} aria-hidden />
      {count > 0 ? (
        <span className="watta-mobile-fav-fab__badge" aria-live="polite">
          {count > 99 ? '99+' : count}
        </span>
      ) : null}
    </button>
  )
}

