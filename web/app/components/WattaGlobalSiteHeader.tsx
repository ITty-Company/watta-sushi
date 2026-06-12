'use client'

import Image from 'next/image'
import WattaLink from './WattaLink'
import { usePathname } from 'next/navigation'
import { useInstantRouter } from '@/hooks/useInstantRouter'
import { useCallback, useEffect, useLayoutEffect, useMemo, type CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import { prefetchHref, WATTA_PRIORITY_PREFETCH_ROUTES } from '@/lib/instantNav'
import { runWhenIdle } from '@/lib/prefetchWhenIdle'
import { warmPriorityNavPageCaches } from '@/lib/publicRouteWarmCache'
import { scrollEntireAppToTop } from '@/lib/menuScroll'
import { resetHomepageLikeLogoClick } from '@/lib/wattaChromeGoHome'
import { getAuthUrl } from '@/lib/authGate'
import { useIsLoggedIn } from '@/hooks/useIsLoggedIn'
import { Phone, ShoppingBag, User, Heart, Menu } from '@/lib/wattaInlineIcons'
import { useLiveCartCount } from '@/hooks/useLiveCartCount'
import { useLiveFavoritesCount } from '@/hooks/useLiveFavoritesCount'
import { useLiveNotificationCount } from '@/hooks/useLiveNotificationCount'
import { useLanguage } from '../context/LanguageContext'
import { useOptionalNotificationsDrawer } from '../context/NotificationsDrawerContext'
import { useOptionalRightNavDrawerActions } from '../context/RightNavDrawerContext'
import { usePublicPromotionsNav } from '@/hooks/usePublicPromotionsNav'
import { CountryCitySelector } from './CountryCitySelector'
import WattaBrandWordmark from './WattaBrandWordmark'

const NAV_TEXT_STYLE_ACTIVE: CSSProperties = {
  background: 'rgba(20, 81, 66, 0.1)',
  border: 'none',
  fontSize: '16px',
  fontWeight: '700',
  color: '#145142',
  cursor: 'pointer',
  textDecoration: 'none',
  display: 'inline-block',
  whiteSpace: 'nowrap',
}
const NAV_TEXT_STYLE_INACTIVE: CSSProperties = {
  background: 'transparent',
  border: 'none',
  fontSize: '16px',
  fontWeight: '500',
  color: '#333',
  cursor: 'pointer',
  textDecoration: 'none',
  display: 'inline-block',
  whiteSpace: 'nowrap',
}

const HEADER_SQUircle_BTN = 40
const HEADER_ACTION_BORDER = 'rgba(0, 0, 0, 0.13)'
const headerSquircleStyle = (extra?: CSSProperties): CSSProperties => ({
  width: `${HEADER_SQUircle_BTN}px`,
  height: `${HEADER_SQUircle_BTN}px`,
  minWidth: `${HEADER_SQUircle_BTN}px`,
  maxWidth: `${HEADER_SQUircle_BTN}px`,
  boxSizing: 'border-box',
  borderRadius: '10px',
  border: `2px solid ${HEADER_ACTION_BORDER}`,
  background: '#ffffff',
  color: '#555555',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: 'none',
  flexShrink: 0,
  position: 'relative' as const,
  overflow: 'hidden',
  ...extra,
})

export type WattaGlobalSiteHeaderProps = {
  /** У `watta-full-menu-sticky-chrome` / `watta-public-sticky-chrome`: шапка без власного `position: sticky` */
  disableSticky?: boolean
  onCityChange: (cityId: number) => void
  /** На головній: підсвітка, коли відкрита вбудована доставка */
  deliveryEmbeddedActive?: boolean
  onPromotionsClick: () => void
  onCartClick: () => void
  onMenuClick: () => void
  /** Додаткова дія на головній (закрити вбудовані сторінки тощо) перед скролом наверх */
  onLogoClick?: () => void
}

export default function WattaGlobalSiteHeader({
  disableSticky = false,
  onCityChange,
  deliveryEmbeddedActive = false,
  onPromotionsClick,
  onCartClick,
  onMenuClick,
  onLogoClick,
}: WattaGlobalSiteHeaderProps) {
  const { t } = useLanguage()
  const router = useInstantRouter()
  const prefetchRouter = useRouter()
  const rightNavDrawer = useOptionalRightNavDrawerActions()
  const notificationsDrawer = useOptionalNotificationsDrawer()
  const pathname = usePathname()

  const closeNotifications = useCallback(() => {
    notificationsDrawer?.close()
  }, [notificationsDrawer])

  const cartCount = useLiveCartCount()
  const favoritesCount = useLiveFavoritesCount()
  const { unreadCount: notificationUnreadCount } = useLiveNotificationCount()
  const loggedIn = useIsLoggedIn()
  const visibleNotificationUnread = loggedIn ? notificationUnreadCount : 0
  const visibleCartCount = cartCount
  const visibleFavoritesCount = loggedIn ? favoritesCount : 0
  const { showPromotionsNav } = usePublicPromotionsNav()

  const profileHref = loggedIn ? '/profile' : getAuthUrl('/profile')
  const favoritesHref = loggedIn ? '/favorites' : getAuthUrl('/favorites')

  useLayoutEffect(() => {
    for (const path of WATTA_PRIORITY_PREFETCH_ROUTES) {
      prefetchHref(prefetchRouter, path)
    }
    prefetchHref(prefetchRouter, profileHref)
    prefetchHref(prefetchRouter, favoritesHref)
    prefetchHref(prefetchRouter, '/cart')
    void warmPriorityNavPageCaches()
  }, [favoritesHref, prefetchRouter, profileHref])

  useEffect(() => {
    const ref = rightNavDrawer?.cityChangeHandlerRef
    if (!ref) return
    ref.current = onCityChange
    return () => {
      ref.current = null
    }
  }, [rightNavDrawer, onCityChange])

  const deliveryNavActive = pathname === '/delivery' || deliveryEmbeddedActive

  const handleMenuButtonClick = () => {
    closeNotifications()
    // Головна: MenuView керує NavigationSidebar (вбудовані сторінки), не глобальним drawer
    if (pathname === '/') {
      rightNavDrawer?.close()
      onMenuClick()
      return
    }
    if (rightNavDrawer?.enabled) {
      rightNavDrawer.open()
      return
    }
    onMenuClick()
  }

  const handleLogoClick = useCallback(() => {
    closeNotifications()
    onLogoClick?.()
    if (pathname !== '/') {
      router.push('/')
    } else {
      resetHomepageLikeLogoClick(router)
      return
    }
    scrollEntireAppToTop({ force: true })
  }, [closeNotifications, onLogoClick, pathname, router])

  const handleCartButtonClick = useCallback(() => {
    closeNotifications()
    rightNavDrawer?.close()
    onCartClick()
  }, [closeNotifications, onCartClick, rightNavDrawer])

  const a = t.siteAria

  const logoInner = (
    <>
      <div className="logo-icon-web">
        <Image
          src="/logo.png"
          alt={t.common.brandName}
          width={50}
          height={50}
          className="logo-image-web"
          priority
          style={{ objectFit: 'contain' }}
        />
      </div>
      <div className="logo-text-images-web">
        {/* native img — CSS sizes wordmark; next/image warns on aspect-ratio overrides */}
        <WattaBrandWordmark />
      </div>
    </>
  )

  const deliveryNavStyle = deliveryNavActive ? NAV_TEXT_STYLE_ACTIVE : NAV_TEXT_STYLE_INACTIVE
  const aboutNavStyle = useMemo(
    () => (pathname === '/about' ? NAV_TEXT_STYLE_ACTIVE : NAV_TEXT_STYLE_INACTIVE),
    [pathname],
  )
  const promotionsNavStyle = useMemo(
    () =>
      pathname === '/promotions' || pathname?.startsWith('/promotions/')
        ? NAV_TEXT_STYLE_ACTIVE
        : NAV_TEXT_STYLE_INACTIVE,
    [pathname],
  )

  const shellPositionClass = disableSticky ? 'relative z-[90]' : 'sticky top-0 z-[90]'

  return (
    <div
      className={`menu-fixed-header-shell-web watta-chrome-header-shell-bg ${shellPositionClass} w-full shrink-0 menu-top-safe-web`}
    >
      <header className="app-header-web relative z-10 max-w-[100vw]">
        <div className="header-content-web">
          <div
            className="logo-section-web"
            onClick={handleLogoClick}
            style={{ cursor: 'pointer' }}
            role="link"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleLogoClick()
              }
            }}
            aria-label={t.common.brandName}
          >
            {logoInner}
          </div>

          <div className="header-center-nav-web">
            <div className="header-center-nav-inner-web">
              <CountryCitySelector onCityChange={onCityChange} />

              <WattaLink
                href="/delivery"
                prefetch
                data-watta-header-nav="1"
                style={deliveryNavStyle}
                className="header-center-nav-tight-web header-center-nav-priority-web"
              >
                {t.navigation.delivery}
              </WattaLink>

              <WattaLink
                href="/about"
                prefetch
                data-watta-header-nav="1"
                style={aboutNavStyle}
                className="header-center-nav-tight-web header-center-nav-priority-web"
              >
                {t.navigation.about}
              </WattaLink>

              {showPromotionsNav ? (
                pathname === '/' ? (
                  <button
                    type="button"
                    onClick={onPromotionsClick}
                    style={NAV_TEXT_STYLE_INACTIVE}
                    className="header-center-nav-tight-web header-center-nav-priority-web"
                  >
                    {t.navigation.promotions}
                  </button>
                ) : (
                  <WattaLink
                    href="/promotions"
                    prefetch
                    style={promotionsNavStyle}
                    className="header-center-nav-tight-web header-center-nav-priority-web"
                  >
                    {t.navigation.promotions}
                  </WattaLink>
                )
              ) : null}

              <WattaLink
                href="/contacts"
                prefetch
                data-watta-header-nav="1"
                className="header-nav-contacts-link-web header-center-nav-priority-web"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  textDecoration: 'none',
                  color: 'inherit',
                  whiteSpace: 'nowrap',
                }}
              >
                <Phone size={19} className="header-nav-contacts-phone-ico" style={{ color: '#ff6b35', flexShrink: 0 }} />
                <span
                  className="header-nav-contacts-txt"
                  style={{ fontSize: '16px', fontWeight: '500', color: '#333' }}
                >
                  {t.navigation.contacts}
                </span>
                <svg
                  className="header-nav-contacts-chevron"
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  style={{ marginLeft: '2px', flexShrink: 0 }}
                  aria-hidden
                >
                  <path d="M3 4.5L6 7.5L9 4.5" stroke="#333" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </WattaLink>
            </div>
          </div>

          <div className="header-actions-web">
            <WattaLink
              href={profileHref}
              prefetch
              className="header-profile-btn-web"
              aria-label={a.profile}
              style={headerSquircleStyle({ textDecoration: 'none' })}
            >
              <User size={20} className="header-profile-icon-web" style={{ strokeWidth: 2.25 }} />
            </WattaLink>

            <WattaLink
              href={favoritesHref}
              prefetch
              className="header-favorites-btn-web"
              aria-label={
                visibleFavoritesCount > 0
                  ? `${a.favorites} (${visibleFavoritesCount})`
                  : a.favorites
              }
              style={headerSquircleStyle({ overflow: 'visible', zIndex: 2, textDecoration: 'none' })}
            >
              <Heart
                size={20}
                className={`header-favorites-icon-web${visibleFavoritesCount > 0 ? ' header-favorites-icon-web--filled' : ''}`}
                aria-hidden
                style={{
                  strokeWidth: 2.25,
                }}
              />
              {visibleFavoritesCount > 0 ? (
                <span
                  className="favorites-badge-web cart-badge-web watta-cart-count-badge watta-favorites-count-badge"
                  style={{ padding: visibleFavoritesCount > 9 ? '2px 4px' : '2px' }}
                  aria-live="polite"
                >
                  {visibleFavoritesCount > 99 ? '99+' : visibleFavoritesCount}
                </span>
              ) : null}
            </WattaLink>

            <button
              type="button"
              className="header-cart-btn-text-web watta-cart-trigger-press"
              data-watta-skip-instant-nav=""
              data-watta-cart-filled={visibleCartCount > 0 ? 'true' : undefined}
              data-watta-cart-target=""
              aria-label={a.cart}
              onPointerDown={() => {
                prefetchHref(prefetchRouter, '/cart')
              }}
              onClick={handleCartButtonClick}
              style={headerSquircleStyle({
                overflow: 'visible',
                zIndex: 2,
                textDecoration: 'none',
              })}
            >
              <ShoppingBag
                size={20}
                className="header-cart-icon-web"
                style={{ strokeWidth: 2.25 }}
              />
              {visibleCartCount > 0 ? (
                <span
                  className="cart-badge-web watta-cart-count-badge"
                  style={{ padding: visibleCartCount > 9 ? '2px 4px' : '2px' }}
                  aria-live="polite"
                >
                  {visibleCartCount > 99 ? '99+' : visibleCartCount}
                </span>
              ) : null}
            </button>

            <button
              type="button"
              className={`header-menu-btn-web${visibleNotificationUnread > 0 ? ' header-menu-btn-web--notify' : ''}`}
              onClick={handleMenuButtonClick}
              aria-label={
                visibleNotificationUnread > 0
                  ? `${a.menu}. ${t.notifications.title}: ${visibleNotificationUnread}`
                  : a.menu
              }
              style={headerSquircleStyle()}
            >
              <Menu size={20} className="header-menu-icon-web" style={{ strokeWidth: 2.25 }} />
            </button>
          </div>
        </div>
      </header>
    </div>
  )
}
