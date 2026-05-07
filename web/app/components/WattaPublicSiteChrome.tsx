'use client'

import { useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import WattaGlobalSiteHeader from './WattaGlobalSiteHeader'
import { WattaMenuCategoryStrip } from './WattaMenuCategoryStrip'
import WattaStickyChromeLayout from './WattaStickyChromeLayout'

/**
 * Єдина верхня панель + горизонталь категорій для усіх публічних сторінок,
 * окрім головної (/), повного меню (/menu) та auth/admin.
 */
export default function WattaPublicSiteChrome() {
  const router = useRouter()
  const pathname = usePathname() || '/'
  const hideCategoryStrip = pathname === '/about'

  const onCityChange = useCallback((cityId: number) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cityChanged', { detail: { cityId } }))
    }
  }, [])

  return (
    <WattaStickyChromeLayout chromeClassName="watta-public-sticky-chrome">
      <WattaGlobalSiteHeader
        disableSticky
        logoHref="/"
        onCityChange={onCityChange}
        onPromotionsClick={() => router.push('/promotions')}
        onCartClick={() => router.push('/cart')}
        onMenuClick={() => router.push('/')}
        onProfileClick={() => router.push('/profile')}
        onFavoritesClick={() => router.push('/favorites')}
      />
      {!hideCategoryStrip ? <WattaMenuCategoryStrip /> : null}
    </WattaStickyChromeLayout>
  )
}
