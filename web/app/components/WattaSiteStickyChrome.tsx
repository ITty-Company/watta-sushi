'use client'

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { usePathname } from 'next/navigation'
import { useInstantRouter } from '@/hooks/useInstantRouter'
import { getAuthUrl, isUserLoggedIn } from '@/lib/authGate'
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
  const pathname = usePathname() || '/'
  const isHome = pathname === '/'
  /** Hero-відео лише на головній — категорії «над» роликом. Інші сторінки: текст нижче панелі категорій. */
  const isHeroOverlayPage = isHome
  const isChromeHeroPage = isHeroOverlayPage || pathname === '/contacts'
  /** ≥768: категорії «над» hero; телефон — повний резерв шапка+чіпи, контент нижче панелі. */
  const isDesktopViewport = useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === 'undefined') return () => {}
      const mq = window.matchMedia('(min-width: 768px)')
      const handler = () => onStoreChange()
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    },
    () =>
      typeof window !== 'undefined' ? window.matchMedia('(min-width: 768px)').matches : false,
    () => false,
  )
  /** Головна та hero-сторінки: точний резерв під fixed chrome — відео одразу під категоріями. */
  const chromeFlowFudgePx =
    pathname === '/cart' ? Math.max(flowHeightFudgePx, 16) : isChromeHeroPage ? 12 : flowHeightFudgePx
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

  return (
    <WattaStickyChromeLayout
      chromeClassName="watta-full-menu-sticky-chrome"
      flowHeightFudgePx={chromeFlowFudgePx}
      flowHeightMaxPx={flowHeightMaxPx}
      flowAnchorHeaderOnly={isHeroOverlayPage && isDesktopViewport}
    >
      <div className="watta-chrome-top-band-web">
        <WattaGlobalSiteHeader
          disableSticky
          onCityChange={onCityChange}
          deliveryEmbeddedActive={isHome && homeDeliveryEmbed}
          onPromotionsClick={onPromotionsClick}
          onCartClick={() =>
            router.push(isUserLoggedIn() ? '/cart' : getAuthUrl('/cart'))
          }
          onMenuClick={onMenuClick}
          onProfileClick={() =>
            router.push(isUserLoggedIn() ? '/profile' : getAuthUrl('/profile'))
          }
          onFavoritesClick={() =>
            router.push(isUserLoggedIn() ? '/favorites' : getAuthUrl('/favorites'))
          }
          onLogoClick={onLogoClick}
        />
      </div>
      <div className="watta-chrome-categories-row-web">
        <WattaMenuCategoryStrip />
      </div>
    </WattaStickyChromeLayout>
  )
}
