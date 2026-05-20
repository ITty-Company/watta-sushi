'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useSyncExternalStore, type CSSProperties } from 'react'
import { scrollEntireAppToTop } from '@/lib/menuScroll'
import { Heart, Menu, Phone, ShoppingBag, User } from 'lucide-react'
import { getLiveCartPieceCount, subscribeCartStorage } from '@/lib/cartStorage'
import { readFavoriteIds, subscribeFavoriteIds } from '@/lib/favoritesStorage'
import { useLanguage } from '../context/LanguageContext'
import { useOptionalRightNavDrawer } from '../context/RightNavDrawerContext'
import { usePublicPromotionsNav } from '@/hooks/usePublicPromotionsNav'
import { LanguageSelector } from './LanguageSelector'
import { CountryCitySelector } from './CountryCitySelector'

function useLiveCartCount() {
  return useSyncExternalStore(
    subscribeCartStorage,
    () => {
      try {
        return getLiveCartPieceCount()
      } catch {
        return 0
      }
    },
    () => 0,
  )
}

function useLiveFavoritesCount() {
  return useSyncExternalStore(
    subscribeFavoriteIds,
    () => readFavoriteIds().length,
    () => 0,
  )
}

const HEADER_SQUircle_BTN = 40
const headerSquircleStyle = (extra?: CSSProperties): CSSProperties => ({
  width: `${HEADER_SQUircle_BTN}px`,
  height: `${HEADER_SQUircle_BTN}px`,
  minWidth: `${HEADER_SQUircle_BTN}px`,
  maxWidth: `${HEADER_SQUircle_BTN}px`,
  boxSizing: 'border-box',
  borderRadius: '10px',
  border: '2px solid #145142',
  background: '#ffffff',
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

const headerCornerBadgeStyle = (value: number): CSSProperties => ({
  position: 'absolute',
  top: '-3px',
  right: 0,
  transform: 'translate(36%, -48%)',
  transformOrigin: 'center',
  zIndex: 6,
  background: 'linear-gradient(135deg, #ff6b35 0%, #ff8c5a 100%)',
  color: 'white',
  fontSize: '11px',
  fontWeight: '800',
  borderRadius: '12px',
  minHeight: '20px',
  minWidth: '20px',
  padding: value > 9 ? '3px 5px' : '3px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  lineHeight: '1',
  boxShadow:
    '0 3px 10px rgba(255,107,53,0.45), 0 0 0 2px rgba(255,255,255,0.95), inset 0 1px 0 rgba(255,255,255,0.3)',
  border: '1.5px solid #ffffff',
  letterSpacing: '-0.3px',
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
  onProfileClick: () => void
  onFavoritesClick: () => void
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
  onProfileClick,
  onFavoritesClick,
  onLogoClick,
}: WattaGlobalSiteHeaderProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const rightNavDrawer = useOptionalRightNavDrawer()
  const pathname = usePathname()
  const cartCount = useLiveCartCount()
  const favoritesCount = useLiveFavoritesCount()
  const { showPromotionsNav } = usePublicPromotionsNav()

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
    onLogoClick?.()
    if (pathname !== '/') {
      router.push('/')
    }
    scrollEntireAppToTop()
  }, [onLogoClick, pathname, router])

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
        <Image
          src="/1.jpg"
          alt={t.common.brandName}
          width={180}
          height={60}
          className="logo-text-image-web"
          priority
          style={{ objectFit: 'contain' }}
        />
      </div>
    </>
  )

  const navTextStyle = (active: boolean): CSSProperties => ({
    background: active ? 'rgba(20, 81, 66, 0.1)' : 'transparent',
    border: 'none',
    fontSize: '16px',
    fontWeight: active ? '700' : '500',
    color: active ? '#145142' : '#333',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '6px',
    textDecoration: 'none',
    display: 'inline-block',
    whiteSpace: 'nowrap',
  })

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

              <Link href="/delivery" style={navTextStyle(deliveryNavActive)} className="header-center-nav-tight-web">
                {t.navigation.delivery}
              </Link>

              <Link href="/about" style={navTextStyle(pathname === '/about')} className="header-center-nav-tight-web">
                {t.navigation.about}
              </Link>

              {showPromotionsNav ? (
                <button
                  type="button"
                  onClick={onPromotionsClick}
                  style={navTextStyle(pathname === '/promotions' || pathname?.startsWith('/promotions/'))}
                  className="header-center-nav-tight-web"
                >
                  {t.navigation.promotions}
                </button>
              ) : null}

              <Link
                href="/contacts"
                className="header-nav-contacts-link-web"
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
              </Link>
            </div>
          </div>

          <div className="header-actions-web">
            <button
              type="button"
              className="header-profile-btn-web"
              onClick={onProfileClick}
              aria-label={a.profile}
              style={headerSquircleStyle()}
            >
              <User size={20} className="header-profile-icon-web" style={{ color: '#145142', strokeWidth: 2.25 }} />
            </button>

            <button
              type="button"
              className="header-favorites-btn-web"
              onClick={onFavoritesClick}
              aria-label={a.favorites}
              style={headerSquircleStyle({ overflow: 'visible', zIndex: 2 })}
            >
              <Heart
                size={20}
                className="header-favorites-icon-web"
                aria-hidden
                style={{
                  color: '#145142',
                  strokeWidth: 2.25,
                }}
                fill={favoritesCount > 0 ? 'rgba(20, 81, 66, 0.18)' : 'none'}
              />
              {favoritesCount > 0 ? (
                <span className="favorites-badge-web cart-badge-web" style={headerCornerBadgeStyle(favoritesCount)} aria-live="polite">
                  {favoritesCount > 99 ? '99+' : favoritesCount}
                </span>
              ) : null}
            </button>

            <div className="location-section-web header-lang-wrap-web" style={{ display: 'flex', alignItems: 'center' }}>
              <LanguageSelector />
            </div>

            <button
              type="button"
              className="header-cart-btn-text-web"
              onClick={onCartClick}
              aria-label={a.cart}
              style={headerSquircleStyle({
                color: '#145142',
                fontWeight: 600,
                overflow: 'visible',
                zIndex: 2,
              })}
            >
              <ShoppingBag
                size={20}
                className="header-cart-icon-web"
                style={{
                  color: '#145142',
                  strokeWidth: 2.25,
                }}
              />
              {cartCount > 0 ? (
                <span className="cart-badge-web" style={headerCornerBadgeStyle(cartCount)} aria-live="polite">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              ) : null}
            </button>

            <button
              type="button"
              className="header-menu-btn-web"
              onClick={handleMenuButtonClick}
              aria-label={a.menu}
              style={headerSquircleStyle()}
            >
              <Menu size={20} className="header-menu-icon-web" style={{ color: '#145142', strokeWidth: 2.25 }} />
            </button>
          </div>
        </div>
      </header>
    </div>
  )
}
