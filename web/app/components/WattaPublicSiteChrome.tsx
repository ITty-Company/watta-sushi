'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import WattaGlobalSiteHeader from './WattaGlobalSiteHeader'
import { WattaMenuCategoryStrip } from './WattaMenuCategoryStrip'

/**
 * Єдина верхня панель + горизонталь категорій для усіх публічних сторінок,
 * окрім головної (/), повного меню (/menu) та auth/admin.
 */
export default function WattaPublicSiteChrome() {
  const router = useRouter()

  const onCityChange = useCallback((cityId: number) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cityChanged', { detail: { cityId } }))
    }
  }, [])

  return (
    <div className="watta-public-sticky-chrome shrink-0">
      <WattaGlobalSiteHeader
        disableSticky
        logoHref="/"
        onCityChange={onCityChange}
        onPromotionsClick={() => router.push('/promotions')}
        onCartClick={() => router.push('/cart')}
        onMenuClick={() => router.push('/')}
        onProfileClick={() => router.push('/profile')}
      />
      <WattaMenuCategoryStrip />
    </div>
  )
}
