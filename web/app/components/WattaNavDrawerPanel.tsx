'use client'

import { useCallback, useEffect, useMemo, type ReactNode } from 'react'
import Image from 'next/image'
import WattaLink from './WattaLink'
import {
  Bell,
  BookOpen,
  Heart,
  Home,
  Info,
  LogIn,
  LogOut,
  MapPin,
  Menu,
  Send,
  Shield,
  ShoppingCart,
  Sparkles,
  Star,
  Tag,
  Truck,
  User,
  UserPlus,
  X,
} from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { CountryCitySelector } from './CountryCitySelector'
import { LanguageSelector } from './LanguageSelector'
import type { NavDrawerCategory } from '@/lib/navDrawerCategories'
import { useNavDrawerCategories } from '@/hooks/useNavDrawerCategories'
import {
  WATTA_PHONE_DISPLAY,
  WATTA_PHONE_E164,
  WATTA_TELEGRAM_URL,
} from '@/lib/wattaSiteDefaults'
import { useSiteAdmin } from '@/lib/useSiteAdmin'
import { useIsLoggedIn } from '@/hooks/useIsLoggedIn'
import { logoutClientSession } from '@/lib/authSession'
import { usePublicBlogNav } from '@/hooks/usePublicBlogNav'
import { usePublicPromotionsNav } from '@/hooks/usePublicPromotionsNav'

export type { NavDrawerCategory }

type EmbeddedProps = {
  mode: 'embedded'
  onPageOpen: (page: string) => void
  onGoHome: () => void
  onOpenProfileTab: (tab: 'history' | 'address' | 'favorites') => void
  onOpenNotifications: () => void
  onCityChange?: (cityId: number) => void
}

type LinkProps = {
  mode: 'link'
  pathname: string
  onNavigate?: () => void
  onCityChange?: (cityId: number) => void
}

export type WattaNavDrawerPanelProps = {
  onClose: () => void
  staggerKey?: number
  categories?: NavDrawerCategory[]
  onCategorySelect?: (key: string) => void
  /** Відкритий drawer — оновити категорії з API (усі з адмінки). */
  drawerActive?: boolean
} & (EmbeddedProps | LinkProps)

const NAV_ICON_TONE_COUNT = 4

function navIconToneForIndex(index: number): number {
  const row = Math.floor(index / 2)
  const col = index % 2
  return (row + col) % NAV_ICON_TONE_COUNT
}

function NavIconWrap({ index, children }: { index: number; children: ReactNode }) {
  const tone = navIconToneForIndex(index)
  return (
    <span className={`watta-nav-compact__nav-ico-wrap watta-nav-compact__nav-ico-wrap--tone-${tone}`}>
      {children}
    </span>
  )
}

type DrawerNavPage = {
  key: string
  label: string
  Icon: typeof Home
  href: string
  embedded:
    | { type: 'home' }
    | { type: 'page'; page: string }
    | { type: 'notifications' }
}

function useDrawerNavPages(t: ReturnType<typeof useLanguage>['t']): DrawerNavPage[] {
  const nav = t.navigation
  const sf = t.siteFooter
  return useMemo(
    () => [
      { key: 'home', label: nav.home, Icon: Home, href: '/', embedded: { type: 'home' as const } },
      { key: 'menu', label: nav.menu, Icon: Menu, href: '/menu', embedded: { type: 'page', page: 'catalogMenu' } },
      {
        key: 'promotions',
        label: nav.promotions,
        Icon: Tag,
        href: '/promotions',
        embedded: { type: 'page', page: 'promotions' },
      },
      {
        key: 'delivery',
        label: nav.delivery,
        Icon: Truck,
        href: '/delivery',
        embedded: { type: 'page', page: 'delivery' },
      },
      { key: 'blog', label: sf.blog, Icon: BookOpen, href: '/blog', embedded: { type: 'page', page: 'blog' } },
      {
        key: 'reviews',
        label: sf.reviews,
        Icon: Star,
        href: '/reviews',
        embedded: { type: 'page', page: 'reviews' },
      },
      { key: 'about', label: nav.about, Icon: Info, href: '/about', embedded: { type: 'page', page: 'about' } },
      {
        key: 'contacts',
        label: nav.contacts,
        Icon: MapPin,
        href: '/contacts',
        embedded: { type: 'page', page: 'contacts' },
      },
      {
        key: 'favorites',
        label: nav.favorites,
        Icon: Heart,
        href: '/favorites',
        embedded: { type: 'page', page: 'favoritesPublic' },
      },
      {
        key: 'cart',
        label: t.cart,
        Icon: ShoppingCart,
        href: '/cart',
        embedded: { type: 'page', page: 'cartPublic' },
      },
      {
        key: 'profile',
        label: t.profile,
        Icon: User,
        href: '/profile',
        embedded: { type: 'page', page: 'profilePublic' },
      },
      {
        key: 'notifications',
        label: t.notifications.title,
        Icon: Bell,
        href: '/notifications',
        embedded: { type: 'notifications' },
      },
      {
        key: 'login',
        label: t.auth.login,
        Icon: LogIn,
        href: '/login',
        embedded: { type: 'page', page: 'login' },
      },
      {
        key: 'register',
        label: t.auth.register,
        Icon: UserPlus,
        href: '/register',
        embedded: { type: 'page', page: 'register' },
      },
      {
        key: 'privacy',
        label: sf.privacy,
        Icon: Shield,
        href: '/privacy',
        embedded: { type: 'page', page: 'privacy' },
      },
    ],
    [nav, sf, t.auth.login, t.auth.register, t.cart, t.notifications.title, t.profile],
  )
}

export default function WattaNavDrawerPanel(props: WattaNavDrawerPanelProps) {
  const { onClose, staggerKey = 0, categories: categoriesProp, onCategorySelect, drawerActive = false } =
    props
  const { t } = useLanguage()
  const nav = t.navigation
  const sf = t.siteFooter
  const { showPromotionsNav } = usePublicPromotionsNav()
  const { showBlogNav } = usePublicBlogNav()
  const drawerNavPages = useDrawerNavPages(t)
  const mainNavPages = useMemo(
    () =>
      drawerNavPages.filter(
        (item) =>
          item.key !== 'privacy' &&
          (item.key !== 'promotions' || showPromotionsNav) &&
          (item.key !== 'blog' || showBlogNav),
      ),
    [drawerNavPages, showPromotionsNav, showBlogNav],
  )
  const privacyNavPage = useMemo(
    () => drawerNavPages.find((item) => item.key === 'privacy'),
    [drawerNavPages],
  )
  const displayCategories = useNavDrawerCategories({
    external: categoriesProp,
    drawerActive,
  })
  const isSiteAdmin = useSiteAdmin()
  const isLoggedIn = useIsLoggedIn()

  const visibleNavPages = useMemo(
    () =>
      mainNavPages.filter((item) => {
        if (isLoggedIn && (item.key === 'login' || item.key === 'register')) return false
        return true
      }),
    [mainNavPages, isLoggedIn],
  )

  const handleLogout = useCallback(() => {
    logoutClientSession()
    onClose()
    if (props.mode === 'embedded') {
      props.onGoHome()
      return
    }
    if (typeof window !== 'undefined') {
      window.location.assign('/')
    }
  }, [onClose, props])

  const handleCategory = useCallback(
    (key: string, e?: React.MouseEvent<HTMLAnchorElement>) => {
      if (props.mode === 'link') {
        onClose()
        props.onNavigate?.()
        return
      }
      e?.preventDefault()
      onClose()
      onCategorySelect?.(key)
    },
    [onClose, onCategorySelect, props],
  )

  const cityHandler = props.onCityChange

  const handleNavClick = useCallback(
    (item: DrawerNavPage, e: React.MouseEvent<HTMLAnchorElement>) => {
      if (props.mode === 'link') {
        onClose()
        props.onNavigate?.()
        return
      }
      e.preventDefault()
      onClose()
      const { embedded } = item
      if (embedded.type === 'home') {
        props.onGoHome()
        return
      }
      if (embedded.type === 'notifications') {
        props.onOpenNotifications()
        return
      }
      if (item.key === 'favorites') {
        props.onOpenProfileTab('favorites')
        return
      }
      if (item.key === 'profile') {
        props.onOpenProfileTab('history')
        return
      }
      props.onPageOpen(embedded.page)
    },
    [onClose, props],
  )

  const legal = nav.footerLegal.replace('{{year}}', String(new Date().getFullYear()))

  return (
    <div
      className="watta-nav-compact flex h-full min-h-0 flex-col"
      {...(props.mode === 'embedded' ? { 'data-watta-embedded-nav': '1' } : {})}
    >

      <header className="watta-nav-compact__head">
        <div className="watta-nav-compact__head-brand">
          <div className="logo-icon-web watta-nav-compact__logo-icon">
            <Image
              src="/logo.png"
              alt={t.common.brandName}
              width={40}
              height={40}
              className="logo-image-web"
              priority
            />
          </div>
          <div className="watta-nav-compact__head-text">
            <div className="logo-text-images-web watta-nav-compact__logo-wordmark">
              <Image
                src="/1.jpg"
                alt={t.common.brandName}
                width={140}
                height={40}
                className="logo-text-image-web"
                priority
              />
            </div>
            <p className="watta-nav-compact__tagline">{nav.drawerBrandLine}</p>
          </div>
        </div>
        <button
          type="button"
          className="watta-nav-compact__close"
          onClick={onClose}
          aria-label={t.siteAria.close}
        >
          <X size={18} strokeWidth={2.2} aria-hidden />
        </button>
      </header>

      <div className="watta-nav-compact__scroll">
        <div key={staggerKey} className="watta-nav-compact__inner watta-nav-compact__inner--animate">
          <div className="watta-nav-compact__selectors">
            <div className="watta-nav-compact__selector watta-nav-compact__selector--city">
              <CountryCitySelector appearance="drawer" onCityChange={cityHandler} />
            </div>
            <div className="watta-nav-compact__selector watta-nav-compact__selector--lang">
              <LanguageSelector variant="drawer" />
            </div>
          </div>

          {displayCategories.length > 0 ? (
            <div className="watta-nav-compact__cat-grid" role="list" aria-label={t.menu}>
                {displayCategories.map((cat, i) => {
                  const content = (
                    <>
                      <span className="watta-nav-compact__cat-emoji" aria-hidden>
                        {cat.emoji}
                      </span>
                      <span className="watta-nav-compact__cat-label">{cat.name}</span>
                    </>
                  )
                  const animStyle = { animationDelay: `${70 + i * 32}ms` }
                  if (props.mode === 'link') {
                    return (
                      <WattaLink
                        key={cat.key}
                        href={`/menu?cat=${encodeURIComponent(cat.key)}`}
                        className="watta-nav-compact__cat watta-nav-compact__pop"
                        style={animStyle}
                        role="listitem"
                        onClick={(e) => handleCategory(cat.key, e)}
                      >
                        {content}
                      </WattaLink>
                    )
                  }
                  return (
                    <button
                      key={cat.key}
                      type="button"
                      className="watta-nav-compact__cat watta-nav-compact__pop"
                      style={animStyle}
                      role="listitem"
                      onClick={() => handleCategory(cat.key)}
                    >
                      {content}
                    </button>
                  )
                })}
            </div>
          ) : null}

          <nav className="watta-nav-compact__nav-grid" aria-label={nav.bottomNavAria}>
            {visibleNavPages.map((item, i) => (
              <WattaLink
                key={item.key}
                href={item.href}
                className="watta-nav-compact__nav-tile watta-nav-compact__pop"
                style={{ animationDelay: `${220 + i * 28}ms` }}
                onClick={(e) => handleNavClick(item, e)}
              >
                <NavIconWrap index={i}>
                  <item.Icon size={14} strokeWidth={2} className="watta-nav-compact__nav-ico" />
                </NavIconWrap>
                <span className="watta-nav-compact__nav-label">{item.label}</span>
              </WattaLink>
            ))}
          </nav>

          {privacyNavPage ? (
            <WattaLink
              href={privacyNavPage.href}
              className="watta-nav-compact__nav-privacy watta-nav-compact__pop"
              style={{ animationDelay: `${220 + visibleNavPages.length * 28}ms` }}
              onClick={(e) => handleNavClick(privacyNavPage, e)}
            >
              <Shield size={14} strokeWidth={2} aria-hidden />
              <span>{privacyNavPage.label}</span>
            </WattaLink>
          ) : null}

          <div
            className="watta-nav-compact__extras watta-nav-compact__pop"
            style={{ animationDelay: '400ms' }}
          >
            <a
              href={WATTA_TELEGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="watta-nav-compact__support"
              onClick={onClose}
            >
              <span className="watta-nav-compact__support-ico">
                <Send size={15} strokeWidth={2.2} />
              </span>
              <span>{sf.support}</span>
            </a>

            <div className="watta-nav-compact__contact">
              <p className="watta-nav-compact__contact-title">{sf.colOrder}</p>
              <a href={`tel:${WATTA_PHONE_E164}`} className="watta-nav-compact__phone">
                {sf.phone1 || WATTA_PHONE_DISPLAY}
              </a>
              <p className="watta-nav-compact__hours">{sf.hoursLine}</p>
            </div>

            {isLoggedIn ? (
              <button
                type="button"
                className="watta-nav-compact__logout"
                onClick={handleLogout}
              >
                <LogOut size={14} strokeWidth={2.2} aria-hidden />
                <span>{t.clientProfile.logout}</span>
              </button>
            ) : null}

            {isSiteAdmin ? (
              <WattaLink
                href="/admin"
                className="watta-nav-compact__admin"
                onClick={(e) => {
                  onClose()
                  if (props.mode === 'embedded') {
                    e.preventDefault()
                    props.onPageOpen('admin')
                  } else {
                    props.onNavigate?.()
                  }
                }}
              >
                <Sparkles size={14} strokeWidth={2.2} />
                <span>{t.admin}</span>
              </WattaLink>
            ) : null}

            <p className="watta-nav-compact__legal" suppressHydrationWarning>
              {legal}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
