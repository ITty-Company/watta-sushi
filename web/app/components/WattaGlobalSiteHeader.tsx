'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState, type CSSProperties } from 'react'
import { Heart, Menu, Phone, ShoppingBag, User } from 'lucide-react'
import { readFavoriteIds } from '@/lib/favoritesStorage'
import { useLanguage } from '../context/LanguageContext'
import { useOptionalRightNavDrawer } from '../context/RightNavDrawerContext'
import { LanguageSelector } from './LanguageSelector'
import { CountryCitySelector } from './CountryCitySelector'

function useCartCountFallback(enabled: boolean) {
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!enabled) return
    const u = () => {
      try {
        const cart = JSON.parse(typeof window !== 'undefined' ? localStorage.getItem('cart') || '[]' : '[]')
        setN(Array.isArray(cart) ? cart.length : 0)
      } catch {
        setN(0)
      }
    }
    u()
    window.addEventListener('cartUpdated', u)
    return () => window.removeEventListener('cartUpdated', u)
  }, [enabled])
  return n
}

function useFavoritesCountFallback(enabled: boolean) {
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!enabled) return
    const u = () => {
      setN(readFavoriteIds().length)
    }
    u()
    window.addEventListener('favoritesUpdated', u)
    window.addEventListener('storage', u)
    return () => {
      window.removeEventListener('favoritesUpdated', u)
      window.removeEventListener('storage', u)
    }
  }, [enabled])
  return n
}

const HEADER_SQUircle_BTN = 36
const headerSquircleStyle = (extra?: CSSProperties): CSSProperties => ({
  width: `${HEADER_SQUircle_BTN}px`,
  height: `${HEADER_SQUircle_BTN}px`,
  minWidth: `${HEADER_SQUircle_BTN}px`,
  borderRadius: '10px',
  border: '2px solid #145142',
  background: '#ffffff',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 3px 12px rgba(20,81,66,0.12), inset 0 1px 0 rgba(255,255,255,1)',
  flexShrink: 0,
  position: 'relative' as const,
  overflow: 'hidden',
  backdropFilter: 'blur(10px)',
  ...extra,
})

export type WattaGlobalSiteHeaderProps = {
  /** У `watta-full-menu-sticky-chrome` / `watta-public-sticky-chrome`: шапка без власного `position: sticky` */
  disableSticky?: boolean
  /** Скільки позицій у кошику; якщо не передано — рахуємо з localStorage */
  cartCount?: number
  onCityChange: (cityId: number) => void
  /** На головній: підсвітка, коли відкрита вбудована доставка */
  deliveryEmbeddedActive?: boolean
  onPromotionsClick: () => void
  onCartClick: () => void
  onMenuClick: () => void
  onProfileClick: () => void
  onFavoritesClick: () => void
  /** Якщо не задано — кількість з readFavoriteIds + події */
  favoritesCount?: number
  /** Якщо задано — логотип веде на головну; інакше клік через onLogoClick */
  logoHref?: '/'
  onLogoClick?: () => void
}

export default function WattaGlobalSiteHeader({
  disableSticky = false,
  cartCount: cartCountProp,
  onCityChange,
  deliveryEmbeddedActive = false,
  onPromotionsClick,
  onCartClick,
  onMenuClick,
  onProfileClick,
  onFavoritesClick,
  favoritesCount: favoritesCountProp,
  logoHref,
  onLogoClick,
}: WattaGlobalSiteHeaderProps) {
  const { t } = useLanguage()
  const rightNavDrawer = useOptionalRightNavDrawer()
  const pathname = usePathname()
  const internalCount = useCartCountFallback(cartCountProp === undefined)
  const cartCount = cartCountProp ?? internalCount
  const internalFavCount = useFavoritesCountFallback(favoritesCountProp === undefined)
  const favoritesCount = favoritesCountProp ?? internalFavCount

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
    if (rightNavDrawer?.enabled) rightNavDrawer.open()
    else onMenuClick()
  }

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

  const shellPositionClass = disableSticky
    ? 'relative z-[90]'
    : 'sticky top-0 z-[90] transition-transform duration-300'

  return (
    <div
      className={`menu-fixed-header-shell-web watta-chrome-header-shell-bg ${shellPositionClass} w-full shrink-0 shadow-sm menu-top-safe-web`}
    >
      <header className="app-header-web relative z-10 max-w-[100vw]">
        <div className="header-content-web">
          {logoHref ? (
            <Link href={logoHref} className="logo-section-web" style={{ cursor: 'pointer' }}>
              {logoInner}
            </Link>
          ) : (
            <div className="logo-section-web" onClick={onLogoClick} style={{ cursor: 'pointer' }}>
              {logoInner}
            </div>
          )}

          <div className="header-center-nav-web">
            <div className="header-center-nav-inner-web">
              <CountryCitySelector onCityChange={onCityChange} />

              <Link href="/delivery" style={navTextStyle(deliveryNavActive)} className="header-center-nav-tight-web">
                {t.navigation.delivery}
              </Link>

              <Link href="/about" style={navTextStyle(pathname === '/about')} className="header-center-nav-tight-web">
                {t.navigation.about}
              </Link>

              <button
                type="button"
                onClick={onPromotionsClick}
                style={navTextStyle(false)}
                className="header-center-nav-tight-web"
              >
                {t.navigation.promotions}
              </button>

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
              <User
                size={16}
                className="header-profile-icon-web"
                style={{ color: '#145142', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))', strokeWidth: 2.25 }}
              />
            </button>

            <button
              type="button"
              className="header-favorites-btn-web"
              onClick={onFavoritesClick}
              aria-label={a.favorites}
              style={headerSquircleStyle()}
            >
              <div className="header-favorites-icon-wrap-web" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Heart
                  size={16}
                  className="header-favorites-icon-web"
                  aria-hidden
                  style={{
                    color: '#145142',
                    filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))',
                    strokeWidth: 2.25,
                  }}
                  fill={favoritesCount > 0 ? 'rgba(20, 81, 66, 0.18)' : 'none'}
                />
                {favoritesCount > 0 && (
                  <span
                    className="favorites-badge-web cart-badge-web"
                    style={{
                      position: 'absolute',
                      top: '-6px',
                      right: '-6px',
                      background: 'linear-gradient(135deg, #ff6b35 0%, #ff8c5a 100%)',
                      color: 'white',
                      fontSize: '9px',
                      fontWeight: '800',
                      borderRadius: '10px',
                      minHeight: '16px',
                      minWidth: '16px',
                      padding: favoritesCount > 9 ? '2px 4px' : '2px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      lineHeight: '1',
                      boxShadow:
                        '0 3px 10px rgba(255,107,53,0.45), 0 0 0 2px rgba(255,255,255,0.95), inset 0 1px 0 rgba(255,255,255,0.3)',
                      border: '1.5px solid #ffffff',
                      letterSpacing: '-0.3px',
                    }}
                  >
                    {favoritesCount > 99 ? '99+' : favoritesCount}
                  </span>
                )}
              </div>
            </button>

            <div className="location-section-web header-lang-wrap-web" style={{ display: 'flex', alignItems: 'center' }}>
              <LanguageSelector />
            </div>

            <button
              type="button"
              className="header-menu-btn-web"
              onClick={handleMenuButtonClick}
              aria-label={a.menu}
              style={headerSquircleStyle()}
            >
              <Menu
                size={16}
                className="header-menu-icon-web"
                style={{
                  color: '#145142',
                  filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))',
                  strokeWidth: 2.25,
                }}
              />
            </button>

            <button
              type="button"
              className="header-cart-btn-text-web"
              onClick={onCartClick}
              aria-label={a.cart}
              style={headerSquircleStyle({
                color: '#145142',
                fontWeight: 600,
              })}
            >
              <span className="header-cart-label-web">{t.cart}</span>
              <div
                className="header-cart-icon-wrap-web"
                style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ShoppingBag size={16} className="header-cart-icon-web" />
                {cartCount > 0 && (
                  <span
                    className="cart-badge-web"
                    style={{
                      position: 'absolute',
                      top: '-6px',
                      right: '-6px',
                      background: 'linear-gradient(135deg, #ff6b35 0%, #ff8c5a 100%)',
                      color: 'white',
                      fontSize: '9px',
                      fontWeight: '800',
                      borderRadius: '10px',
                      minHeight: '16px',
                      minWidth: '16px',
                      padding: cartCount > 9 ? '2px 4px' : '2px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      lineHeight: '1',
                      boxShadow:
                        '0 3px 10px rgba(255,107,53,0.45), 0 0 0 2px rgba(255,255,255,0.95), inset 0 1px 0 rgba(255,255,255,0.3)',
                      border: '1.5px solid #ffffff',
                      letterSpacing: '-0.3px',
                    }}
                  >
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </div>
            </button>
          </div>
        </div>
      </header>
    </div>
  )
}
