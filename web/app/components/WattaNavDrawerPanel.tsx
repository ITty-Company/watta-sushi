'use client'

import { useCallback, useEffect, useMemo, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { navigateInstant, normalizeInternalHref, prefetchHref } from '@/lib/instantNav'
import { markNavDrawerInstantClose } from '@/lib/navDrawerInstantClose'
import { getAuthUrl } from '@/lib/authGate'
import { openWattaCart } from '@/lib/openWattaCart'
import { openWattaNotifications } from '@/lib/openWattaNotifications'
import { useOptionalCartDrawer } from '../context/CartDrawerContext'
import { useOptionalNotificationsDrawer } from '../context/NotificationsDrawerContext'
import { useLiveNotificationCount } from '@/hooks/useLiveNotificationCount'
import Image from 'next/image'
import { useInstantRouter } from '@/hooks/useInstantRouter'
import {
  buildMenuCategoryHref,
  navigateFromNavDrawerToCategory,
  prefetchFullMenuCategory,
} from '@/lib/fullMenuCategoryNav'
import {
  Bell,
  BookOpen,
  FileText,
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
import WattaBrandWordmark from './WattaBrandWordmark'
import { MenuCategorySticker } from './MenuCategorySticker'
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
import { runWhenIdle } from '@/lib/prefetchWhenIdle'

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

function NavIconWrap({ children }: { children: ReactNode }) {
  return <span className="watta-nav-compact__nav-ico-wrap watta-nav-compact__nav-ico-wrap--brand">{children}</span>
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
      {
        key: 'offer',
        label: sf.publicOffer,
        Icon: FileText,
        href: '/offer',
        embedded: { type: 'page', page: 'offer' },
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
          item.key !== 'offer' &&
          (item.key !== 'promotions' || showPromotionsNav) &&
          (item.key !== 'blog' || showBlogNav),
      ),
    [drawerNavPages, showPromotionsNav, showBlogNav],
  )
  const privacyNavPage = useMemo(
    () => drawerNavPages.find((item) => item.key === 'privacy'),
    [drawerNavPages],
  )
  const offerNavPage = useMemo(
    () => drawerNavPages.find((item) => item.key === 'offer'),
    [drawerNavPages],
  )
  const displayCategories = useNavDrawerCategories({
    external: categoriesProp,
    drawerActive,
  })
  const prefetchRouter = useRouter()
  const router = useInstantRouter()
  const cartDrawer = useOptionalCartDrawer()
  const notificationsDrawer = useOptionalNotificationsDrawer()
  const { unreadCount: notificationUnreadCount } = useLiveNotificationCount()
  const isSiteAdmin = useSiteAdmin()
  const isLoggedIn = useIsLoggedIn()
  const visibleNotificationUnread = isLoggedIn ? notificationUnreadCount : 0

  const drawerNavHref = useCallback(
    (item: DrawerNavPage): string => {
      if (item.key === 'favorites') {
        return isLoggedIn ? '/favorites' : getAuthUrl('/favorites')
      }
      if (item.key === 'profile') {
        return isLoggedIn ? '/profile' : getAuthUrl('/profile')
      }
      return item.href
    },
    [isLoggedIn],
  )

  const isDrawerNavCurrent = useCallback((href: string): boolean => {
    if (typeof window === 'undefined') return false
    const target = normalizeInternalHref(href)
    if (!target) return false
    const loc = `${window.location.pathname}${window.location.search}`
    return loc === target
  }, [])

  useEffect(() => {
    if (!drawerActive) return
    const priorityHrefs = [
      '/',
      '/menu',
      '/delivery',
      '/about',
      '/contacts',
      '/reviews',
      '/favorites',
      '/profile',
      '/notifications',
      '/privacy',
      '/offer',
      '/blog',
      '/promotions',
    ]
    // Префетч НЕ під час кадру відкриття drawer — інакше ~30 router.prefetch підряд
    // з'їдають кадр і open відчувається з ривком. Конкретну ціль усе одно префетчить
    // pointerdown самої кнопки, тож відкладення в idle не сповільнює тап.
    const cancelPriority = runWhenIdle(() => {
      for (const href of priorityHrefs) {
        prefetchHref(prefetchRouter, href)
      }
      for (const item of drawerNavPages) {
        prefetchHref(prefetchRouter, drawerNavHref(item))
      }
    }, 200)
    const cancelRest = runWhenIdle(() => {
      for (const item of drawerNavPages) {
        prefetchHref(prefetchRouter, drawerNavHref(item))
      }
      if (privacyNavPage) prefetchHref(prefetchRouter, privacyNavPage.href)
      if (offerNavPage) prefetchHref(prefetchRouter, offerNavPage.href)
      prefetchHref(prefetchRouter, '/admin')
      for (const cat of displayCategories) {
        prefetchFullMenuCategory(prefetchRouter, cat.key)
      }
    })
    return () => {
      cancelPriority()
      cancelRest()
    }
  }, [
    drawerActive,
    drawerNavHref,
    drawerNavPages,
    displayCategories,
    offerNavPage,
    prefetchRouter,
    privacyNavPage,
  ])

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

  const handleCategoryClick = useCallback((e?: React.MouseEvent) => {
    e?.preventDefault()
  }, [])

  const handleCategoryPointerDown = useCallback(
    (key: string) => {
      prefetchFullMenuCategory(router, key)
      markNavDrawerInstantClose()
      if (props.mode === 'link') {
        const href = buildMenuCategoryHref(key)
        if (typeof window !== 'undefined') {
          const loc = `${window.location.pathname}${window.location.search}`
          if (loc === href) return
        }
        navigateFromNavDrawerToCategory(router, props.pathname, key)
        onClose()
        props.onNavigate?.()
        return
      }
      onCategorySelect?.(key)
      onClose()
    },
    [onCategorySelect, onClose, props, router],
  )

  const cityHandler = props.onCityChange

  const finishDrawerNav = useCallback(() => {
    onClose()
    if (props.mode === 'link') props.onNavigate?.()
  }, [onClose, props])

  const runNavDrawerPage = useCallback(
    (item: DrawerNavPage) => {
      markNavDrawerInstantClose()

      if (item.key === 'home') {
        if (props.mode === 'embedded') {
          props.onGoHome()
          onClose()
          return
        }
        if (!isDrawerNavCurrent('/')) {
          navigateInstant(router, '/', { immediate: true })
        }
        finishDrawerNav()
        return
      }

      if (item.key === 'notifications') {
        if (props.mode === 'embedded') {
          props.onOpenNotifications()
          onClose()
          return
        }
        openWattaNotifications(router, notificationsDrawer?.open ?? null)
        finishDrawerNav()
        return
      }

      if (item.key === 'cart') {
        openWattaCart(router, cartDrawer?.open ?? null, cartDrawer?.enabled !== false)
        finishDrawerNav()
        return
      }

      const href = drawerNavHref(item)
      if (!isDrawerNavCurrent(href)) {
        navigateInstant(router, href, { immediate: true })
      }
      finishDrawerNav()
    },
    [
      cartDrawer?.open,
      notificationsDrawer?.open,
      drawerNavHref,
      finishDrawerNav,
      isDrawerNavCurrent,
      onClose,
      props,
      router,
    ],
  )

  const handleNavPointerDown = useCallback(
    (item: DrawerNavPage) => {
      prefetchHref(prefetchRouter, drawerNavHref(item))
      runNavDrawerPage(item)
    },
    [drawerNavHref, prefetchRouter, runNavDrawerPage],
  )

  const handleNavClick = useCallback((e?: React.MouseEvent) => {
    e?.preventDefault()
  }, [])

  const legal = nav.footerLegal.replace('{{year}}', String(new Date().getFullYear()))

  return (
    <div
      className="watta-nav-compact watta-nav-compact--drawer flex h-full min-h-0 flex-col"
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
              <WattaBrandWordmark
                active={drawerActive}
                mdUpOnly={false}
                deferUntilSplashEnd={false}
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
                      <span className="watta-nav-compact__cat-icon" aria-hidden>
                        <MenuCategorySticker
                          variant="strip"
                          slug={cat.key}
                          emoji={cat.emoji}
                          imageUrl={cat.imageUrl}
                          hoverImageUrl={cat.hoverImageUrl}
                        />
                      </span>
                      <span className="watta-nav-compact__cat-label">{cat.name}</span>
                    </>
                  )
                  const animStyle = { animationDelay: `${70 + i * 32}ms` }
                  return (
                    <button
                      key={cat.key}
                      type="button"
                      className="watta-nav-compact__cat watta-nav-compact__pop"
                      style={animStyle}
                      role="listitem"
                      onPointerDown={() => handleCategoryPointerDown(cat.key)}
                      onClick={handleCategoryClick}
                    >
                      {content}
                    </button>
                  )
                })}
            </div>
          ) : null}

          <nav className="watta-nav-compact__nav-grid" aria-label={nav.bottomNavAria}>
            {visibleNavPages.map((item, i) => (
              <button
                key={item.key}
                type="button"
                className="watta-nav-compact__nav-tile watta-nav-compact__pop"
                style={{ animationDelay: `${220 + i * 28}ms` }}
                onPointerDown={() => handleNavPointerDown(item)}
                onClick={handleNavClick}
              >
                <NavIconWrap>
                  <item.Icon size={14} strokeWidth={2} className="watta-nav-compact__nav-ico" />
                </NavIconWrap>
                {item.key === 'notifications' && visibleNotificationUnread > 0 ? (
                  <span className="watta-nav-compact__nav-badge" aria-hidden>
                    {visibleNotificationUnread > 99 ? '99+' : visibleNotificationUnread}
                  </span>
                ) : null}
                <span className="watta-nav-compact__nav-label">{item.label}</span>
              </button>
            ))}
          </nav>

          {privacyNavPage || offerNavPage ? (
            <div className="watta-nav-compact__legal-links watta-nav-compact__pop">
              {privacyNavPage ? (
                <button
                  type="button"
                  className="watta-nav-compact__nav-privacy"
                  onPointerDown={() => handleNavPointerDown(privacyNavPage)}
                  onClick={handleNavClick}
                >
                  <Shield size={13} strokeWidth={2} aria-hidden />
                  <span>{privacyNavPage.label}</span>
                </button>
              ) : null}
              {offerNavPage ? (
                <button
                  type="button"
                  className="watta-nav-compact__nav-privacy"
                  onPointerDown={() => handleNavPointerDown(offerNavPage)}
                  onClick={handleNavClick}
                >
                  <FileText size={13} strokeWidth={2} aria-hidden />
                  <span>{offerNavPage.label}</span>
                </button>
              ) : null}
            </div>
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
              <button
                type="button"
                className="watta-nav-compact__admin"
                onPointerDown={() => {
                  prefetchHref(prefetchRouter, '/admin')
                  markNavDrawerInstantClose()
                  if (!isDrawerNavCurrent('/admin')) {
                    navigateInstant(router, '/admin', { immediate: true })
                  }
                  finishDrawerNav()
                }}
                onClick={handleNavClick}
              >
                <Sparkles size={14} strokeWidth={2.2} />
                <span>{t.admin}</span>
              </button>
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
