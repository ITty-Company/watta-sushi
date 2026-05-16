'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import WattaGlobalSiteHeader from './WattaGlobalSiteHeader'
import { WattaMenuCategoryStrip } from './WattaMenuCategoryStrip'
import WattaStickyChromeLayout from './WattaStickyChromeLayout'

type Props = {
  /** На головній — 4; на інших публічних — 12 за замовчуванням */
  flowHeightFudgePx?: number
}

/**
 * Верхня шапка + стрічка категорій (як на головній / у публічних маршрутах).
 */
export default function WattaSiteStickyChrome({ flowHeightFudgePx = 12 }: Props) {
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
    <WattaStickyChromeLayout chromeClassName="watta-full-menu-sticky-chrome" flowHeightFudgePx={flowHeightFudgePx}>
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
