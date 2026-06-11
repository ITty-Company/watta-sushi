'use client'

import '../profile-page-theme.css'
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { m, useReducedMotion, type Variants } from 'framer-motion'
import { useInstantRouter } from '@/hooks/useInstantRouter'
import Link from 'next/link'
import { useLanguage } from '../context/LanguageContext'
import { useOptionalRightNavDrawerActions } from '../context/RightNavDrawerContext'
import { MenuHighlightStack, type MenuHighlightStackItem } from './MenuHighlightStack'
import { useMenuAddToCart } from '@/hooks/useMenuAddToCart'
import ClientProfileOrders, { type ProfileOrder } from './profile/ClientProfileOrders'
import ProfileAddressesFlow from './profile/ProfileAddressesFlow'
import ProfilePersonalDataForm from './profile/ProfilePersonalDataForm'
import ProfileLeadHero from './profile/ProfileLeadHero'
import ProfilePublicPageLayout from './profile/ProfilePublicPageLayout'
import { Settings, LogOut, Shield, Mail } from 'lucide-react'
import { Heart, Menu, Clock } from '@/lib/wattaInlineIcons'
import { Phone, Bell, ShoppingBag, User, MapPin, ArrowLeft } from '@/lib/wattaInlineIcons'
import toast from 'react-hot-toast'
import { getBearerAuthHeaders } from '@/lib/authHeaders'
import { logoutClientSession } from '@/lib/authSession'
import { getAuthUrl } from '@/lib/authGate'
import { openWattaAuth } from '@/lib/openWattaAuth'
import { readUserOrdersCache, writeUserOrdersCache } from '@/lib/userOrdersCache'
import { loadFavoriteProducts, readFavoriteIds } from '@/lib/favoritesStorage'
import { productGalleryFromApi } from '@/lib/productGallery'
import { isAdminRole } from '@/lib/isAdminRole'
import { getLocalizedField } from '@/lib/i18n/getLocalizedField'
import type { WattaLanguage } from '@/lib/i18n/language'
import { writeCartToStorage } from '@/lib/cartStorage'
import { getOrderStatusToastMessage } from '@/lib/orderStatusMessage'
import { WATTA_NOTIFICATIONS_CHANGED_EVENT } from '@/lib/userNotificationsApi'
import { usePublicBlogNav } from '@/hooks/usePublicBlogNav'

interface UserData {
  name: string
  email: string
  phone: string
  address: string
  isPhoneVerified?: boolean
}

/* Плавні появи секцій профілю — на маунті (не whileInView), щоб контент
   ніколи не «зависав» невидимим на мобільному. Поважаємо reduced-motion. */
const PROFILE_EASE = [0.22, 1, 0.36, 1] as const

const profileFadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: PROFILE_EASE } },
}

const profileStagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
}

// ИСПРАВЛЕННЫЙ ИНТЕРФЕЙС
interface ProfileViewProps {
  onBack: () => void
  onMenuClick: () => void
  onOpenPhone: () => void
  onOpenNotifications: () => void
  onOpenFavorites: () => void
  onOpenCart: () => void
  onOpenAdmin: () => void
  onSelectCategory: (key: string) => void
  initialTab?: 'history' | 'address' | 'favorites' | 'data'
  /** embedded — у MenuView; page — /profile з глобальною шапкою */
  layout?: 'embedded' | 'page'
  highlightOrderId?: number
}

export default function ProfileView({
  onBack,
  onMenuClick,
  onOpenPhone,
  onOpenNotifications,
  onOpenFavorites,
  onOpenCart,
  onOpenAdmin,
  onSelectCategory,
  initialTab = 'history',
  layout = 'embedded',
  highlightOrderId,
}: ProfileViewProps) {
  const router = useInstantRouter()
  const { t, language, getLocalized } = useLanguage()
  const { showBlogNav } = usePublicBlogNav()
  const a = t.siteAria
  const rightNavDrawer = useOptionalRightNavDrawerActions()
  const reduceMotion = useReducedMotion()
  const menuAddToCart = useMenuAddToCart()
  // Поважаємо reduced-motion: вимикаємо появи, але контент завжди видимий.
  const motionSection = reduceMotion
    ? {}
    : { variants: profileFadeUp, initial: 'hidden' as const, animate: 'show' as const }
  const motionStaggerWrap = reduceMotion
    ? {}
    : { variants: profileStagger, initial: 'hidden' as const, animate: 'show' as const }
  const motionStaggerItem = reduceMotion ? {} : { variants: profileFadeUp }
  const [profileAllowed, setProfileAllowed] = useState<boolean | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const ok = !!localStorage.getItem('currentUser')
    setProfileAllowed(ok)
    if (!ok) {
      const ret = layout === 'page' ? '/profile' : '/'
      if (!openWattaAuth({ returnUrl: ret })) {
        router.replace(getAuthUrl(ret))
      }
    }
  }, [router, layout])

  const [activeTab, setActiveTab] = useState<'history' | 'address' | 'favorites' | 'data'>('history')
  const [orders, setOrders] = useState<ProfileOrder[]>([])
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [bonusBalance, setBonusBalance] = useState(0)

  const [favoriteItems, setFavoriteItems] = useState<any[]>([])
  const [favLoading, setFavLoading] = useState(false)
  const orderStatusRef = useRef<Map<number, string>>(new Map())

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab)
  }, [initialTab])

  const loadOrdersAndBonus = useCallback(async (showSpinner: boolean) => {
    if (typeof window === 'undefined') return
    const token = localStorage.getItem('token')
    if (!token) {
      if (showSpinner) setLoading(false)
      return
    }
    if (showSpinner) {
      const cached = readUserOrdersCache<ProfileOrder>()
      if (cached && cached.length > 0) setOrders(cached)
      setLoading(true)
    }
    try {
      const bonusRes = await fetch('/api/orders/bonus', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (bonusRes.ok) {
        const bonusData = await bonusRes.json()
        setBonusBalance(Number(bonusData?.bonusBalance ?? 0))
      }
      const res = await fetch('/api/orders/my', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) {
          for (const o of data as ProfileOrder[]) {
            const prev = orderStatusRef.current.get(o.id)
            if (prev && prev !== o.status) {
              toast.success(getOrderStatusToastMessage(o.status, o.id, language as WattaLanguage))
              window.dispatchEvent(new Event(WATTA_NOTIFICATIONS_CHANGED_EVENT))
            }
            orderStatusRef.current.set(o.id, o.status)
          }
        }
        setOrders(data)
        if (Array.isArray(data)) writeUserOrdersCache(data)
      }
    } catch (error) {
      console.error(error)
    } finally {
      if (showSpinner) setLoading(false)
    }
  }, [language])

  // --- ЗАГРУЗКА ДАННЫХ ---
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('currentUser')
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser)
          setUser(parsed)
          setIsAdmin(isAdminRole(parsed.role))
        } catch (e) {}
      } else {
        setUser(null)
        setIsAdmin(false)
      }

      void loadOrdersAndBonus(true)
    }
  }, [loadOrdersAndBonus])

  useEffect(() => {
    if (typeof window === 'undefined' || !profileAllowed) return
    const auth = getBearerAuthHeaders()
    if (Object.keys(auth).length === 0) return
    void (async () => {
      try {
        const res = await fetch('/api/auth/me', { headers: auth })
        if (!res.ok) return
        const data = await res.json()
        if (!data?.user) return
        setUser((prev) => ({
          name: data.user.name ?? prev?.name ?? '',
          email: data.user.email ?? prev?.email ?? '',
          phone: data.user.phone ?? prev?.phone ?? '',
          address: data.user.address ?? prev?.address ?? '',
          isPhoneVerified:
            typeof data.user.isPhoneVerified === 'boolean'
              ? data.user.isPhoneVerified
              : prev?.isPhoneVerified,
        }))
        try {
          const raw = localStorage.getItem('currentUser')
          const parsed = raw ? JSON.parse(raw) : {}
          localStorage.setItem('currentUser', JSON.stringify({ ...parsed, ...data.user }))
          setIsAdmin(isAdminRole(data.user.role))
        } catch {
          /* ignore */
        }
      } catch {
        /* ignore */
      }
    })()
  }, [profileAllowed])

  const handleAddressSaved = useCallback((address: string) => {
    setUser((prev) => {
      const next = {
        name: prev?.name ?? '',
        email: prev?.email ?? '',
        phone: prev?.phone ?? '',
        address,
      }
      try {
        const raw = localStorage.getItem('currentUser')
        const parsed = raw ? JSON.parse(raw) : {}
        localStorage.setItem('currentUser', JSON.stringify({ ...parsed, address }))
      } catch {
        /* ignore */
      }
      return next
    })
    window.dispatchEvent(new Event('userChanged'))
  }, [])

  const handlePhoneVerified = useCallback(() => {
    setUser((prev) => {
      const next = {
        name: prev?.name ?? '',
        email: prev?.email ?? '',
        phone: prev?.phone ?? '',
        address: prev?.address ?? '',
        isPhoneVerified: true,
      }
      try {
        const raw = localStorage.getItem('currentUser')
        const parsed = raw ? JSON.parse(raw) : {}
        localStorage.setItem('currentUser', JSON.stringify({ ...parsed, isPhoneVerified: true }))
      } catch {
        /* ignore */
      }
      return next
    })
    window.dispatchEvent(new Event('userChanged'))
  }, [])

  const handlePersonalDataSaved = useCallback(({ name, phone }: { name: string; phone: string }) => {
    setUser((prev) => {
      const next = {
        name,
        email: prev?.email ?? '',
        phone,
        address: prev?.address ?? '',
        isPhoneVerified: prev?.isPhoneVerified,
      }
      try {
        const raw = localStorage.getItem('currentUser')
        const parsed = raw ? JSON.parse(raw) : {}
        localStorage.setItem('currentUser', JSON.stringify({ ...parsed, name, phone }))
      } catch {
        /* ignore */
      }
      return next
    })
    window.dispatchEvent(new Event('userChanged'))
  }, [])

  useEffect(() => {
    if (activeTab !== 'history' || typeof document === 'undefined') return
    const tick = () => {
      if (document.visibilityState !== 'visible') return
      void loadOrdersAndBonus(false)
    }
    const id = window.setInterval(tick, 28000)
    return () => window.clearInterval(id)
  }, [activeTab, loadOrdersAndBonus])

  const handleReviewSubmitted = useCallback(
    (
      orderId: number,
      review: { id: number; rating: number; text: string; images?: unknown }
    ) => {
      setOrders((prev) => {
        const next = prev.map((o) => (o.id === orderId ? { ...o, review } : o))
        writeUserOrdersCache(next)
        return next
      })
    },
    []
  )

  const handleReorder = (order: ProfileOrder) => {
    const lang = language as WattaLanguage
    const reorderedItems = order.items.map((item) => {
      const itemId = Number(item.productId ?? item.id)
      const qty = Math.max(1, Number(item.quantity || 1))
      const prod = item.product as Record<string, unknown> | undefined
      return {
        id: itemId,
        name:
          (prod && getLocalizedField(prod, 'name', lang)) ||
          item.product?.name_ru ||
          t.clientProfile.orderLabel,
        description:
          (prod && getLocalizedField(prod, 'description', lang)) ||
          item.product?.description_ru ||
          '',
        price: Number(item.price || 0),
        category: t.clientProfile.reorder,
        emoji: '🍣',
        imageUrl: item.product?.imageUrl,
        quantity: qty,
      }
    })

    writeCartToStorage(reorderedItems)
    router.push('/cart')
  }

  const handleLogout = () => {
    logoutClientSession()
    onBack()
  }

  const loadFavoritesList = useCallback(async () => {
    setFavLoading(true)
    try {
      const list = await loadFavoriteProducts((p) => ({
        id: Number(p.id),
        name: getLocalized(p, 'name'),
        description: getLocalized(p, 'description') || '',
        price: Number(p.price),
        imageUrl:
          productGalleryFromApi(p)[0] ||
          (typeof p.imageUrl === 'string' ? p.imageUrl : undefined),
      }))
      setFavoriteItems(list)
    } catch (e) {
      console.error(e)
    } finally {
      setFavLoading(false)
    }
  }, [getLocalized])

  const syncFavoritesFromStorage = useCallback(() => {
    const idSet = new Set(readFavoriteIds())
    setFavoriteItems((prev) => {
      const next = prev.filter((item) => idSet.has(item.id))
      if (idSet.size > next.length) void loadFavoritesList()
      return next
    })
  }, [loadFavoritesList])

  useEffect(() => {
    if (layout === 'page') {
      void loadFavoritesList()
      return
    }
    if (activeTab === 'favorites') void loadFavoritesList()
  }, [activeTab, layout, loadFavoritesList])

  useEffect(() => {
    const onUser = () => {
      void loadFavoritesList()
    }
    window.addEventListener('userChanged', onUser)
    return () => window.removeEventListener('userChanged', onUser)
  }, [loadFavoritesList])

  useEffect(() => {
    window.addEventListener('favoritesUpdated', syncFavoritesFromStorage)
    return () => window.removeEventListener('favoritesUpdated', syncFavoritesFromStorage)
  }, [syncFavoritesFromStorage])

  // Преміум-картки обраного (як на /favorites) — додавання в кошик і
  // тогл «серця» інкапсульовані всередині WattaMenuProductCard.
  const favoriteStackItems: MenuHighlightStackItem[] = useMemo(
    () =>
      favoriteItems.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description || '',
        price: item.price,
        emoji: '🍣',
        imageUrl: item.imageUrl,
      })),
    [favoriteItems],
  )

  const handleFavoriteAddToCart = useCallback(
    (item: MenuHighlightStackItem) =>
      menuAddToCart({
        id: item.id,
        name: item.name,
        description: item.description || '',
        price: item.price,
        emoji: item.emoji ?? '🍣',
        imageUrl: item.imageUrl,
      }),
    [menuAddToCart],
  )

  const displayName = (user?.name || t.clientProfile.notSpecified).trim() || t.clientProfile.notSpecified
  const headingName = language === 'en' ? displayName.toLowerCase() : displayName

  const profileHeroTitleLines = useMemo(() => {
    const words = headingName.trim().split(/\s+/)
    if (words.length <= 1) return [headingName]
    return [words[0], words.slice(1).join(' ')]
  }, [headingName])

  if (profileAllowed === null) {
    return (
      <div className="menu-page-web relative min-h-screen w-full flex items-center justify-center watta-page-bg">
        <p className="text-watta-action font-medium">{t.clientProfile.loading}</p>
      </div>
    )
  }
  if (!profileAllowed) {
    return (
      <div className="menu-page-web relative min-h-screen w-full flex items-center justify-center watta-page-bg px-6 text-center">
        <p className="text-watta-action font-medium">{t.clientProfile.redirectLogin}</p>
      </div>
    )
  }

  if (layout === 'page') {
    return (
      <ProfilePublicPageLayout
        t={t}
        language={language}
        displayName={displayName}
        headingName={headingName}
        user={user}
        bonusBalance={bonusBalance}
        isAdmin={isAdmin}
        orders={orders}
        ordersLoading={loading}
        favoriteItems={favoriteItems}
        favLoading={favLoading}
        showBlogNav={showBlogNav}
        highlightOrderId={highlightOrderId}
        initialTab={initialTab}
        onGoMenu={() => router.push('/menu')}
        onReorder={handleReorder}
        onReviewSubmitted={handleReviewSubmitted}
        onAddFavoriteToCart={handleFavoriteAddToCart}
        onLogout={handleLogout}
        onOpenAdmin={onOpenAdmin}
        onOpenNotifications={onOpenNotifications}
        onAddressSaved={handleAddressSaved}
        onPersonalDataSaved={handlePersonalDataSaved}
        onPhoneVerified={handlePhoneVerified}
      />
    )
  }

  const headerIconBtn =
    'flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl text-gray-600 transition hover:bg-gray-100 hover:text-watta-action focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-watta-action/40'

  const handleGlobalNavMenu = () => {
    if (rightNavDrawer?.enabled) rightNavDrawer.open()
    else onMenuClick()
  }

  const Header = () => (
    <header className="fixed top-0 left-0 right-0 z-[1000] border-b border-gray-200/90 bg-white/95 shadow-sm backdrop-blur-md">
      <div className="mx-auto flex h-[56px] max-w-[1600px] items-center justify-between gap-2 px-3 sm:h-[60px] sm:px-5">
        <button
          type="button"
          onClick={onBack}
          className="flex min-w-0 items-center gap-2.5 rounded-xl py-1 pr-2 transition hover:bg-gray-50 sm:gap-3 sm:pr-3"
        >
          <img src="/logo.png" alt="" className="h-9 w-9 shrink-0 object-contain sm:h-10 sm:w-10" />
          <div className="hidden min-w-0 flex-col text-left sm:flex">
            <span className="text-[11px] font-medium text-gray-500">{t.clientProfile.backHome}</span>
            <span className="truncate text-sm font-bold text-watta-action">{t.clientProfile.brandSubtitle}</span>
          </div>
        </button>
        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
          <button type="button" onClick={onOpenPhone} className={headerIconBtn} aria-label={t.phone}>
            <Phone size={20} strokeWidth={2.25} />
          </button>
          <button type="button" onClick={onOpenNotifications} className={headerIconBtn} aria-label={t.notifications.title}>
            <Bell size={20} strokeWidth={2.25} />
          </button>
          <button
            type="button"
            onClick={onOpenFavorites}
            className={headerIconBtn}
            aria-label={t.clientProfile.tabFavorites}
          >
            <Heart size={20} strokeWidth={2.25} />
          </button>
          <button type="button" onClick={onOpenCart} className={headerIconBtn} aria-label={t.cartSection.order}>
            <ShoppingBag size={20} strokeWidth={2.25} />
          </button>
          <span
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-watta-action text-white sm:h-11 sm:w-11"
            aria-current="page"
            title={t.profilePage.title}
          >
            <User size={20} strokeWidth={2.25} />
          </span>
          <button type="button" onClick={handleGlobalNavMenu} className={headerIconBtn} aria-label={t.menu}>
            <Menu size={20} strokeWidth={2.25} />
          </button>
        </div>
      </div>
    </header>
  )

  const rootPad = 'pb-16 pt-[72px] font-sans sm:pt-[76px] sm:pb-16 lg:pb-16'

  const quickNavItems = [
    { id: 'address' as const, icon: MapPin, label: t.clientProfile.tabAddress },
    { id: 'favorites' as const, icon: Heart, label: t.clientProfile.tabFavorites },
    { id: 'data' as const, icon: Settings, label: t.clientProfile.tabData },
  ] as const

  const goMenu = onBack

  const profileLeadIntro = (
    <m.div className="delivery-page-intro-web w-full shrink-0 bg-white" data-watta-cart-bar-gate="" {...motionSection}>
      <ProfileLeadHero
        sectionId="profile-inapp-lead-intro"
        nameLines={profileHeroTitleLines}
        reserveTopSpace={layout === 'embedded'}
      >
        {user?.email ? (
          <span className="watta-profile-lead__chip">
            <Mail size={12} aria-hidden />
            <span className="min-w-0 truncate">{user.email}</span>
          </span>
        ) : null}
        {user?.phone ? (
          <span className="watta-profile-lead__chip">
            <Phone size={12} aria-hidden />
            <span className="min-w-0 truncate">{user.phone}</span>
          </span>
        ) : null}
        <span className="watta-profile-lead__chip watta-profile-lead__chip--bonus">
          {t.clientProfile.bonuses}:{' '}
          <strong className="tabular-nums">{bonusBalance.toFixed(2)} €</strong>
        </span>
      </ProfileLeadHero>
    </m.div>
  )

  const ordersBlock = (
    <section className="watta-profile-inapp-orders lg:hidden" aria-labelledby="inapp-profile-orders-title">
      <div className="watta-profile-inapp-orders__head">
        <h2 id="inapp-profile-orders-title" className="watta-profile-inapp-orders__title">
          {t.clientProfile.tabHistory}
        </h2>
        <Link href="/reviews" className="watta-profile-inapp-reviews-btn">
          {t.reviewsPublic.title}
        </Link>
      </div>
      <ClientProfileOrders
        orders={orders}
        loading={loading}
        loadingLabel={t.clientProfile.loading}
        lang={language}
        t={t.clientProfile}
        emptyMessage={t.clientProfile.emptyOrders}
        goMenuLabel={t.clientProfile.goMenu}
        onGoMenu={goMenu}
        onReorder={handleReorder}
        onReviewSubmitted={handleReviewSubmitted}
        highlightOrderId={highlightOrderId}
      />
    </section>
  )

  return (
    <div
      className={`menu-page-web watta-profile-inapp watta-delivery-page-about relative flex min-h-full w-full max-w-[100vw] flex-col overflow-x-hidden bg-white ${rootPad}`}
    >
      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        {layout === 'embedded' ? <Header /> : null}

        {profileLeadIntro}

        <m.nav
          className="watta-profile-quick-nav max-w-[1600px] mx-auto"
          aria-label={a.profileNav}
          {...motionStaggerWrap}
        >
          {quickNavItems.map(({ id, icon: Icon, label }) => {
            const on = activeTab === id
            return (
              <m.button
                key={id}
                type="button"
                onClick={() => setActiveTab(on ? 'history' : id)}
                className={`watta-profile-quick-nav__btn${on ? ' watta-profile-quick-nav__btn--on' : ''}`}
                {...motionStaggerItem}
                whileTap={reduceMotion ? undefined : { scale: 0.96 }}
              >
                <span className="watta-profile-quick-nav__btn-icon" aria-hidden>
                  <Icon size={18} strokeWidth={2.1} className={id === 'favorites' && on ? 'fill-current' : ''} />
                </span>
                <span>{label}</span>
              </m.button>
            )
          })}
        </m.nav>

        {activeTab === 'history' ? ordersBlock : null}

      <div className="max-w-[1600px] mx-auto px-3 sm:px-4 flex flex-col lg:flex-row gap-6 lg:gap-8">
        
        {/* ЛЕВАЯ КОЛОНКА - МЕНЮ (десктоп) */}
        <div className="hidden w-full shrink-0 lg:block lg:w-[320px] xl:w-[340px]">
          <div className="sticky top-20 space-y-6 rounded-2xl border border-gray-200/90 bg-white p-6 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-4">
                <div className="flex h-[100px] w-[100px] items-center justify-center rounded-full bg-gradient-to-br from-watta-action to-watta-action-active text-white ring-4 ring-gray-100">
                  <User size={44} strokeWidth={1.75} />
                </div>
                {isAdmin ? (
                  <div
                    className="absolute -bottom-0.5 -right-0.5 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-rose-500 text-white shadow-sm"
                    title="Admin"
                  >
                    <Shield size={18} />
                  </div>
                ) : null}
              </div>
              <h2 className="text-lg font-bold leading-tight text-gray-900">
                {user?.name || t.clientProfile.notSpecified}
              </h2>
              <p className="mt-3 inline-flex items-baseline gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50 px-3 py-1 text-sm text-emerald-900">
                <span className="font-medium text-emerald-800/90">{t.clientProfile.bonuses}</span>
                <span className="font-bold tabular-nums">{bonusBalance.toFixed(2)} €</span>
              </p>
            </div>

            <nav className="flex flex-col gap-1 border-t border-gray-100 pt-2" aria-label={a.profileNav}>
              {(
                [
                  { id: 'history' as const, icon: Clock, label: t.clientProfile.tabHistory },
                  { id: 'address' as const, icon: MapPin, label: t.clientProfile.tabAddress },
                  { id: 'favorites' as const, icon: Heart, label: t.clientProfile.tabFavorites },
                  { id: 'data' as const, icon: Settings, label: t.clientProfile.tabData },
                ] as const
              ).map(({ id, icon: Icon, label }) => {
                const on = activeTab === id
                const fav = id === 'favorites'
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActiveTab(id)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${
                      on
                        ? 'bg-watta-action text-white shadow-sm'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon
                      size={20}
                      strokeWidth={2.25}
                      className={`shrink-0 ${fav && on ? 'fill-current' : ''}`}
                    />
                    {label}
                  </button>
                )
              })}
              {isAdmin ? (
                <button
                  type="button"
                  onClick={onOpenAdmin}
                  className="mt-2 flex w-full items-center gap-3 rounded-xl border border-rose-200 bg-rose-50/80 px-3 py-3 text-left text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                >
                  <Shield size={20} />
                  {t.clientProfile.tabAdmin}
                </button>
              ) : null}
              <button
                type="button"
                onClick={handleLogout}
                className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50"
              >
                <LogOut size={20} />
                {t.clientProfile.logout}
              </button>
            </nav>
          </div>
        </div>

        {/* ПРАВАЯ КОЛОНКА - КОНТЕНТ */}
        <div className={`flex-1 min-w-0${activeTab === 'history' ? ' hidden lg:block' : ''}`}>
          <m.div
            key={activeTab}
            className={`watta-profile-inapp-content-card${
              activeTab === 'favorites' ? ' watta-profile-inapp-content-card--favorites' : ''
            }`}
            {...motionSection}
          >
            <div className="relative z-10">
            {activeTab !== 'history' ? (
              <button
                type="button"
                className="watta-profile-inapp-back-history lg:hidden"
                onClick={() => setActiveTab('history')}
              >
                <ArrowLeft size={16} strokeWidth={2.25} aria-hidden />
                {t.clientProfile.tabHistory}
              </button>
            ) : null}
            {activeTab === 'history' && (
              <div className="hidden animate-in fade-in lg:block">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="watta-profile-inapp-panel-title">{t.clientProfile.tabHistory}</h2>
                  <div className="flex flex-wrap gap-2">
                    <Link href="/reviews" className="watta-profile-inapp-reviews-btn">
                      {t.reviewsPublic.title}
                    </Link>
                    {showBlogNav ? (
                      <Link
                        href="/blog"
                        className="rounded-lg bg-watta-action px-3 py-2 text-xs font-semibold text-white transition hover:bg-watta-action-hover sm:text-sm"
                      >
                        {t.blogPublic.title}
                      </Link>
                    ) : null}
                  </div>
                </div>
                <ClientProfileOrders
                  orders={orders}
                  loading={loading}
                  loadingLabel={t.clientProfile.loading}
                  lang={language}
                  t={t.clientProfile}
                  emptyMessage={t.clientProfile.emptyOrders}
                  goMenuLabel={t.clientProfile.goMenu}
                  onGoMenu={goMenu}
                  onReorder={handleReorder}
                  onReviewSubmitted={handleReviewSubmitted}
                  highlightOrderId={highlightOrderId}
                />
              </div>
            )}
            {activeTab === 'favorites' && (
              <div className="watta-profile-fav-panel space-y-5">
                <h2 className="watta-profile-inapp-panel-title">{t.clientProfile.favoritesTitle}</h2>

                {favLoading ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4" aria-hidden>
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        className="min-h-[220px] w-full animate-pulse rounded-[1.15rem] border border-watta-action/10 bg-white/80"
                      />
                    ))}
                  </div>
                ) : favoriteStackItems.length > 0 ? (
                  <MenuHighlightStack
                    title={t.clientProfile.favoritesTitle}
                    ariaLabel={t.clientProfile.favoritesTitle}
                    items={favoriteStackItems}
                    weightFallback={t.productDetail.weightFallback}
                    piecesFallback={t.productDetail.piecesFallback}
                    onAddToCart={handleFavoriteAddToCart}
                    layout="stack"
                    productsGridClassName="favorites-page-products-grid"
                    suppressHeading
                  />
                ) : (
                  <div className="rounded-[1.25rem] border border-dashed border-watta-action/20 bg-gradient-to-b from-[#f8fbf9] to-white py-16 text-center">
                    <Heart size={40} className="mx-auto mb-3 text-watta-action/30" />
                    <p className="text-sm font-medium text-gray-600">{t.clientProfile.favEmpty}</p>
                    <button
                      type="button"
                      onClick={() => onSelectCategory?.('rolls')}
                      className="mt-4 text-sm font-semibold text-watta-action hover:underline"
                    >
                      {t.clientProfile.favToMenu}
                    </button>
                  </div>
                )}
              </div>
            )}
            {activeTab === 'address' && (
              <div className="animate-in fade-in">
                <div className="mb-6">
                  <h2 className="watta-profile-inapp-panel-title">{t.clientProfile.addrTitle}</h2>
                  <p className="mt-1 flex items-center gap-2 text-sm text-gray-600">
                    <MapPin size={16} className="shrink-0 text-watta-action" />
                    {t.clientProfile.addrSub}
                  </p>
                </div>
                <ProfileAddressesFlow
                  cp={t.clientProfile}
                  d={t.deliveryPage}
                  enterAddressHint={t.cartSection.enterAddressForDeliveryFee}
                  onPrimaryAddressChange={handleAddressSaved}
                />
              </div>
            )}
            {activeTab === 'data' && (
              <div className="animate-in fade-in">
                <div className="mb-6">
                  <h2 className="watta-profile-inapp-panel-title">{t.clientProfile.dataTitle}</h2>
                  <p className="mt-1 flex items-center gap-2 text-sm text-gray-600">
                    <Settings size={16} className="shrink-0 text-watta-action" />
                    {t.clientProfile.dataSub}
                  </p>
                </div>
                <ProfilePersonalDataForm
                  initialName={user?.name ?? ''}
                  initialPhone={user?.phone ?? ''}
                  email={user?.email ?? ''}
                  isPhoneVerified={user?.isPhoneVerified === true}
                  cp={t.clientProfile}
                  invalidPhoneMessage={t.cartSection.invalidPhone}
                  onSaved={handlePersonalDataSaved}
                  onPhoneVerified={handlePhoneVerified}
                />
              </div>
            )}
            </div>
          </m.div>
        </div>
      </div>
      </div>


    </div>
   )
}