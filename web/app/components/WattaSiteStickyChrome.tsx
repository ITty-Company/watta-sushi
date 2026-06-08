'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useInstantRouter } from '@/hooks/useInstantRouter'
import { openWattaCart } from '@/lib/openWattaCart'
import { useOptionalCartDrawer } from '../context/CartDrawerContext'
import WattaChromeCompactBack from './WattaChromeCompactBack'
import WattaChromeCompactCart from './WattaChromeCompactCart'
import WattaGlobalSiteHeader from './WattaGlobalSiteHeader'
import { WattaMenuCategoryStrip } from './WattaMenuCategoryStrip'
import WattaStickyChromeLayout from './WattaStickyChromeLayout'
import { dispatchWattaChromeGoHome } from '@/lib/wattaChromeGoHome'

type Props = {
  /** Поправка резерву висоти в потоці (на головній — 0). */
  flowHeightFudgePx?: number
  flowHeightMaxPx?: number
}

/**
 * Верхня шапка + стрічка категорій — fixed через portal, як на головній.
 */
export default function WattaSiteStickyChrome({
  flowHeightFudgePx = 0,
  flowHeightMaxPx = 480,
}: Props) {
  const router = useInstantRouter()
  const cartDrawer = useOptionalCartDrawer()
  const pathname = usePathname() || '/'
  const isHome = pathname === '/'
  const isMenuHeroPage = pathname === '/menu' || pathname.startsWith('/menu/')
  /** Hero photo-first: головна та /menu — контент під fixed chrome без стрибка anchor. */
  const isHeroOverlayPage = isHome || isMenuHeroPage
  const isChromeHeroPage = isHeroOverlayPage || pathname === '/contacts'
  /** Головна та hero-сторінки: точний резерв під fixed chrome. */
  const chromeFlowFudgePx = isChromeHeroPage ? 12 : flowHeightFudgePx
  const chromeFlowSafetyPx = 0
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

  const onMenuClick = useCallback(() => {
    if (isHome) {
      window.dispatchEvent(new CustomEvent('wattaChromeMenuClick'))
      return
    }
    router.push('/')
  }, [isHome, router])

  const onPromotionsClick = useCallback(() => {
    if (isHome) {
      window.dispatchEvent(new CustomEvent('wattaChromeOpenPromotions'))
      return
    }
    router.push('/promotions')
  }, [isHome, router])

  const onLogoClick = useCallback(() => {
    if (isHome) {
      dispatchWattaChromeGoHome()
      return
    }
    router.push('/')
  }, [isHome, router])

  const onCartClick = useCallback(
    () => openWattaCart(router, cartDrawer?.open, cartDrawer?.enabled !== false),
    [router, cartDrawer],
  )

  return (
    <WattaStickyChromeLayout
      chromeClassName="watta-full-menu-sticky-chrome"
      flowHeightFudgePx={chromeFlowFudgePx}
      flowHeightMaxPx={flowHeightMaxPx}
      flowAnchorSafetyPx={chromeFlowSafetyPx}
      flowAnchorHeaderOnly={false}
    >
      <div className="watta-chrome-top-band-web">
        <WattaGlobalSiteHeader
          disableSticky
          onCityChange={onCityChange}
          deliveryEmbeddedActive={isHome && homeDeliveryEmbed}
          onPromotionsClick={onPromotionsClick}
          onCartClick={onCartClick}
          onMenuClick={onMenuClick}
          onLogoClick={onLogoClick}
        />
      </div>
      <div className="watta-chrome-categories-row-web">
        <WattaChromeCompactBack />
        <WattaMenuCategoryStrip />
        <WattaChromeCompactCart />
      </div>
    </WattaStickyChromeLayout>
  )
}
