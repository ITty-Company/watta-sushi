'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import WattaGlobalSiteHeader from './WattaGlobalSiteHeader'
import { WattaMenuCategoryStrip } from './WattaMenuCategoryStrip'
import WattaStickyChromeLayout from './WattaStickyChromeLayout'

/**
 * Єдина верхня панель + горизонталь категорій для публічних сторінок (окрім auth/admin).
 * `flowHeightFudgePx` як у `MenuView` — той самий зазор під fixed chrome, що на головній.
 */
export default function WattaPublicSiteChrome() {
  const router = useRouter()
  const pathname = usePathname() || '/'
  const [homeDeliveryEmbed, setHomeDeliveryEmbed] = useState(false)

  useEffect(() => {
    const h = (ev: Event) => {
      const active = (ev as CustomEvent<{ active?: boolean }>).detail?.active === true
      setHomeDeliveryEmbed(active)
    }
    window.addEventListener('wattaHomeDeliveryEmbed', h as EventListener)
    return () => window.removeEventListener('wattaHomeDeliveryEmbed', h as EventListener)
  }, [])

  const onCityChange = useCallback((cityId: number) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cityChanged', { detail: { cityId } }))
    }
  }, [])

  return (
    <WattaStickyChromeLayout chromeClassName="watta-full-menu-sticky-chrome" flowHeightFudgePx={12}>
      <WattaGlobalSiteHeader
        disableSticky
        onCityChange={onCityChange}
        deliveryEmbeddedActive={pathname === '/' && homeDeliveryEmbed}
        onPromotionsClick={() => router.push('/promotions')}
        onCartClick={() => router.push('/cart')}
        onMenuClick={() => router.push('/')}
        onProfileClick={() => router.push('/profile')}
        onFavoritesClick={() => router.push('/favorites')}
      />
      <WattaMenuCategoryStrip />
    </WattaStickyChromeLayout>
  )
}
