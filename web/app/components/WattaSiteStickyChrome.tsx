'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { getAuthUrl, isUserLoggedIn } from '@/lib/authGate'
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
  /** /cart: трохи менший резерв під fixed chrome — менший зазор до «Кошик». */
  const chromeFlowFudgePx = pathname === '/cart' ? Math.max(flowHeightFudgePx, 16) : flowHeightFudgePx
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
    <WattaStickyChromeLayout chromeClassName="watta-full-menu-sticky-chrome" flowHeightFudgePx={chromeFlowFudgePx}>
      <WattaGlobalSiteHeader
        disableSticky
        onCityChange={onCityChange}
        deliveryEmbeddedActive={pathname === '/' && homeDeliveryEmbed}
        onPromotionsClick={() => router.push('/promotions')}
        onCartClick={() =>
          router.push(isUserLoggedIn() ? '/cart' : getAuthUrl('/cart'))
        }
        onMenuClick={() => router.push('/')}
        onProfileClick={() =>
          router.push(isUserLoggedIn() ? '/profile' : getAuthUrl('/profile'))
        }
        onFavoritesClick={() =>
          router.push(isUserLoggedIn() ? '/favorites' : getAuthUrl('/favorites'))
        }
      />
      <WattaMenuCategoryStrip />
    </WattaStickyChromeLayout>
  )
}
