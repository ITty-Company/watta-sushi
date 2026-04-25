'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState, type CSSProperties } from 'react'
import { Menu, Phone, ShoppingBag, User } from 'lucide-react'
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
  logoHref,
  onLogoClick,
}: WattaGlobalSiteHeaderProps) {
  const { t } = useLanguage()
  const rightNavDrawer = useOptionalRightNavDrawer()
  const pathname = usePathname()
  const internalCount = useCartCountFallback(cartCountProp === undefined)
  const cartCount = cartCountProp ?? internalCount

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

  const logoInner = (
    <>
      <div className="logo-icon-web">
        <Image
          src="/logo.png"
          alt="Logo"
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
          alt="WATTA SUSHI"
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
    fontSize: '14px',
    fontWeight: active ? '700' : '500',
    color: active ? '#145142' : '#333',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '6px',
    textDecoration: 'none',
    display: 'inline-block',
  })

  const shellPositionClass = disableSticky
    ? 'relative z-[90]'
    : 'sticky top-0 z-[90] transition-transform duration-300'

  return (
    <div
      className={`menu-fixed-header-shell-web ${shellPositionClass} w-full shrink-0 bg-white shadow-sm menu-top-safe-web md:bg-[var(--watta-page-fill)]`}
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

          <div
            className="header-center-nav-web"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              flex: 1,
              justifyContent: 'center',
              padding: '0 20px',
            }}
          >
            <CountryCitySelector onCityChange={onCityChange} />

            <Link href="/delivery" style={navTextStyle(deliveryNavActive)}>
              {t.navigation.delivery}
            </Link>

            <Link href="/about" style={navTextStyle(pathname === '/about')}>
              {t.navigation.about}
            </Link>

            <button type="button" onClick={onPromotionsClick} style={navTextStyle(false)}>
              {t.navigation.promotions}
            </button>

            <Link
              href="/contacts"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <Phone size={18} style={{ color: '#ff6b35' }} />
              <span style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>{t.navigation.contacts}</span>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ marginLeft: '4px' }}>
                <path d="M3 4.5L6 7.5L9 4.5" stroke="#333" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>

          <div className="header-actions-web">
            <button
              type="button"
              className="header-profile-btn-web"
              onClick={onProfileClick}
              aria-label="Профіль"
              style={{
                width: '44px',
                height: '44px',
                minWidth: '44px',
                borderRadius: '12px',
                border: '2px solid #145142',
                background: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(20,81,66,0.15), inset 0 1px 0 rgba(255,255,255,1)',
                flexShrink: 0,
                backdropFilter: 'blur(10px)',
              }}
            >
              <User
                size={20}
                className="header-profile-icon-web"
                style={{ color: '#145142', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))', strokeWidth: 2.5 }}
              />
            </button>
            <div className="location-section-web header-lang-wrap-web" style={{ display: 'flex', alignItems: 'center' }}>
              <LanguageSelector />
            </div>

            <button
              type="button"
              className="header-menu-btn-web"
              onClick={handleMenuButtonClick}
              aria-label="Меню"
              style={{
                width: '44px',
                height: '44px',
                minWidth: '44px',
                borderRadius: '12px',
                border: '2px solid #145142',
                background: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(20,81,66,0.15), inset 0 1px 0 rgba(255,255,255,1)',
                flexShrink: 0,
                position: 'relative',
                overflow: 'hidden',
                backdropFilter: 'blur(10px)',
              }}
            >
              <Menu
                size={20}
                className="header-menu-icon-web"
                style={{
                  color: '#145142',
                  filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))',
                  strokeWidth: 2.5,
                }}
              />
            </button>

            <button
              type="button"
              className="header-cart-btn-text-web"
              onClick={onCartClick}
              aria-label="Корзина"
              style={{
                display: 'flex',
                alignItems: 'center',
                borderRadius: '12px',
                border: '2px solid #145142',
                background: '#ffffff',
                cursor: 'pointer',
                position: 'relative',
                fontWeight: '600',
                color: '#145142',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 3px 10px rgba(20,81,66,0.12), inset 0 1px 0 rgba(255,255,255,1)',
                overflow: 'hidden',
              }}
            >
              <span className="header-cart-label-web">{t.cart}</span>
              <div
                className="header-cart-icon-wrap-web"
                style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ShoppingBag size={18} className="header-cart-icon-web" />
                {cartCount > 0 && (
                  <span
                    className="cart-badge-web"
                    style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-8px',
                      background: 'linear-gradient(135deg, #ff6b35 0%, #ff8c5a 100%)',
                      color: 'white',
                      fontSize: '11px',
                      fontWeight: '800',
                      borderRadius: '12px',
                      minHeight: '20px',
                      minWidth: '20px',
                      padding: cartCount > 9 ? '3px 6px' : '3px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      lineHeight: '1',
                      boxShadow:
                        '0 4px 12px rgba(255,107,53,0.5), 0 0 0 3px rgba(255,255,255,0.9), inset 0 1px 0 rgba(255,255,255,0.3)',
                      border: '2px solid #ffffff',
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
