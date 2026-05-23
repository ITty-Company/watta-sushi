'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useInstantRouter } from '@/hooks/useInstantRouter'
import Link from 'next/link'
import { useLanguage } from '../context/LanguageContext'
import { useOptionalRightNavDrawer } from '../context/RightNavDrawerContext'
import ClientProfileOrders from './profile/ClientProfileOrders'
import ProfilePublicPageLayout from './profile/ProfilePublicPageLayout'
import ProfileDeliveryAddressCard from './profile/ProfileDeliveryAddressCard'
import ProfilePersonalDataForm from './profile/ProfilePersonalDataForm'
import {
  Phone, Bell, Heart, ShoppingBag, User, Menu,
  MapPin, Clock, Settings, LogOut, Shield, Mail, X, Sparkles
} from 'lucide-react'
import LogoBackground from './LogoBackground'
import toast from 'react-hot-toast'
import { getBearerAuthHeaders } from '@/lib/authHeaders'
import {
  loadFavoriteProducts,
  readFavoriteIds,
  syncFavoriteIdsToStorage,
} from '@/lib/favoritesStorage'
import { isAdminRole } from '@/lib/isAdminRole'
import { getLocalizedField } from '@/lib/i18n/getLocalizedField'
import type { WattaLanguage } from '@/lib/i18n/language'
import { appendCartLines, writeCartToStorage } from '@/lib/cartStorage'
import { getOrderStatusToastMessage } from '@/lib/orderStatusMessage'
import { WATTA_NOTIFICATIONS_CHANGED_EVENT } from '@/lib/userNotificationsApi'
import { usePublicBlogNav } from '@/hooks/usePublicBlogNav'

const HERO_BG =
  'linear-gradient(165deg, #0c3028 0%, #145142 38%, #1a6b58 72%, #145142 100%)'

// --- ТИПЫ ДАННЫХ ---
interface OrderItem {
  id: number
  quantity: number
  price: number
  productId?: number
  product: {
    name_ru: string
    name_ua?: string | null
    name_en?: string | null
    name_nl?: string | null
    description_ru?: string
    description_ua?: string | null
    description_en?: string | null
    description_nl?: string | null
    imageUrl?: string
  }
}

interface Order {
  id: number
  createdAt: string
  totalPrice: number
  status: string
  items: OrderItem[]
  review?: {
    id: number
    rating: number
    text: string
    images?: unknown
  } | null
}

interface UserData {
  name: string
  email: string
  phone: string
  address: string
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
  const rightNavDrawer = useOptionalRightNavDrawer()
  const [profileAllowed, setProfileAllowed] = useState<boolean | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const ok = !!localStorage.getItem('currentUser')
    setProfileAllowed(ok)
    if (!ok) {
      const ret = layout === 'page' ? '/profile' : '/'
      router.replace('/login?return=' + encodeURIComponent(ret))
    }
  }, [router, layout])

  const [activeTab, setActiveTab] = useState<'history' | 'address' | 'favorites' | 'data'>('history')
  const [orders, setOrders] = useState<Order[]>([])
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
    if (showSpinner) setLoading(true)
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
          for (const o of data as Order[]) {
            const prev = orderStatusRef.current.get(o.id)
            if (prev && prev !== o.status) {
              toast.success(getOrderStatusToastMessage(o.status, o.id, language as WattaLanguage))
              window.dispatchEvent(new Event(WATTA_NOTIFICATIONS_CHANGED_EVENT))
            }
            orderStatusRef.current.set(o.id, o.status)
          }
        }
        setOrders(data)
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

  const handlePersonalDataSaved = useCallback(({ name, phone }: { name: string; phone: string }) => {
    setUser((prev) => {
      const next = {
        name,
        email: prev?.email ?? '',
        phone,
        address: prev?.address ?? '',
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
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, review } : o))
      )
    },
    []
  )

  const handleReorder = (order: Order) => {
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
    localStorage.removeItem('token')
    localStorage.removeItem('currentUser')
    localStorage.removeItem('userId')
    localStorage.removeItem('userOrders')
    window.dispatchEvent(new Event('userChanged'))
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
        imageUrl: typeof p.imageUrl === 'string' ? p.imageUrl : undefined,
      }))
      setFavoriteItems(list)
    } catch (e) {
      console.error(e)
    } finally {
      setFavLoading(false)
    }
  }, [getLocalized])

  useEffect(() => {
    if (layout === 'page' || activeTab === 'favorites') {
      void loadFavoritesList()
    }
  }, [activeTab, layout, loadFavoritesList])

  useEffect(() => {
    const onUser = () => {
      if (activeTab === 'favorites') void loadFavoritesList()
    }
    window.addEventListener('userChanged', onUser)
    return () => window.removeEventListener('userChanged', onUser)
  }, [activeTab, loadFavoritesList])

  useEffect(() => {
    const onFav = () => {
      if (activeTab === 'favorites') void loadFavoritesList()
    }
    window.addEventListener('favoritesUpdated', onFav)
    return () => window.removeEventListener('favoritesUpdated', onFav)
  }, [activeTab, loadFavoritesList])

  const addFavoriteToCart = (item: {
    id: number
    name: string
    description?: string
    price: number
    imageUrl?: string
  }) => {
    const result = appendCartLines({
      id: item.id,
      name: item.name,
      description: item.description || '',
      price: item.price,
      category: '',
      emoji: '🍣',
      imageUrl: item.imageUrl,
    })
    if (result === 'max') {
      toast.error(t.appToasts.maxCartQty)
      return
    }
    toast.success(t.addToCart)
  }

  const removeFavorite = async (productId: number) => {
    try {
      const userStr = localStorage.getItem('currentUser')
      if (!userStr) return
      const auth = getBearerAuthHeaders()
      if (Object.keys(auth as Record<string, string>).length === 0) {
        toast.error(t.clientProfile.redirectLogin || t.appToasts.loginAgain)
        return
      }

      await fetch('/api/favorites/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...auth,
        },
        body: JSON.stringify({ productId })
      })

      setFavoriteItems((prev) => prev.filter((item) => item.id !== productId))
      syncFavoriteIdsToStorage(readFavoriteIds().filter((id) => id !== productId))
    } catch (e) {
      toast.error(t.appToasts.removeFavoriteError)
    }
  }


  if (profileAllowed === null) {
    return (
      <div className="menu-page-web relative min-h-screen w-full flex items-center justify-center watta-page-bg">
        <p className="text-[#145142] font-medium">{t.clientProfile.loading}</p>
      </div>
    )
  }
  if (!profileAllowed) {
    return (
      <div className="menu-page-web relative min-h-screen w-full flex items-center justify-center watta-page-bg px-6 text-center">
        <p className="text-[#145142] font-medium">{t.clientProfile.redirectLogin}</p>
      </div>
    )
  }

  const displayName = (user?.name || t.clientProfile.notSpecified).trim() || t.clientProfile.notSpecified
  const headingName = language === 'en' ? displayName.toLowerCase() : displayName

  const headerIconBtn =
    'flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl text-gray-600 transition hover:bg-gray-100 hover:text-[#145142] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#145142]/40'

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
            <span className="truncate text-sm font-bold text-[#145142]">{t.clientProfile.brandSubtitle}</span>
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
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#145142] text-white sm:h-11 sm:w-11"
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

  const rootPad =
    layout === 'page'
      ? 'pb-16 pt-2 font-sans sm:pb-20 sm:pt-3'
      : 'pb-16 pt-[72px] font-sans sm:pt-[76px] sm:pb-16 lg:pb-16'

  const embeddedTabs = (
    [
      { id: 'history' as const, icon: Clock, label: t.clientProfile.tabHistory },
      { id: 'address' as const, icon: MapPin, label: t.clientProfile.tabAddress },
      { id: 'favorites' as const, icon: Heart, label: t.clientProfile.tabFavorites },
      { id: 'data' as const, icon: Settings, label: t.clientProfile.tabData },
    ] as const
  ).map(({ id, icon: Icon, label }) => {
    const on = activeTab === id
    return (
      <button
        key={id}
        type="button"
        onClick={() => setActiveTab(id)}
        className={`watta-profile-embedded-tab ${on ? 'watta-profile-embedded-tab--on' : 'watta-profile-embedded-tab--off'}`}
      >
        <Icon size={16} strokeWidth={2.25} className={id === 'favorites' && on ? 'fill-current' : ''} aria-hidden />
        {label}
      </button>
    )
  })

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
        onRemoveFavorite={removeFavorite}
        onAddFavoriteToCart={addFavoriteToCart}
        onLogout={handleLogout}
        onOpenAdmin={onOpenAdmin}
        onAddressSaved={handleAddressSaved}
        onPersonalDataSaved={handlePersonalDataSaved}
        removeFavoriteAria={a.remove}
        addCartAria={a.cart}
      />
    )
  }

  return (
    <div className={`menu-page-web relative flex min-h-full w-full max-w-[100vw] flex-col overflow-x-hidden watta-page-bg ${rootPad}`}>
      <LogoBackground />
      <div className="relative z-10">
        {layout === 'embedded' ? <Header /> : null}

      <div className="mx-auto max-w-[1600px] px-3 pb-2 sm:px-4 sm:pb-3">
        <section
          className="relative mt-1 overflow-hidden rounded-2xl text-white shadow-[0_20px_60px_rgba(20,81,66,0.22)] sm:mt-2 sm:rounded-[1.75rem]"
          style={{ background: HERO_BG }}
          aria-labelledby="inapp-profile-hero-title"
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.35]"
            style={{
              background: `repeating-linear-gradient(
                -32deg,
                transparent,
                transparent 14px,
                rgba(255, 255, 255, 0.04) 14px,
                rgba(255, 255, 255, 0.04) 15px
              )`,
            }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-[12%] top-1/2 h-[min(72vw,320px)] w-[min(72vw,320px)] -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,92,0,0.14)_0%,transparent_68%)]"
            aria-hidden
          />
          <div className="relative z-[1] px-4 py-7 sm:px-7 sm:py-9 lg:px-10 lg:py-10">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/90 backdrop-blur-md sm:text-[11px]">
              <Sparkles className="h-3.5 w-3.5 text-[#ffb38a]" strokeWidth={2.4} aria-hidden />
              {t.clientProfile.brandSubtitle}
            </p>
            <h1
              id="inapp-profile-hero-title"
              className="font-black leading-[0.98] tracking-tight text-white"
              style={{
                fontSize: 'clamp(1.85rem, 6.5vw, 3.25rem)',
                fontFamily: 'var(--font-inter, ui-sans-serif), system-ui, sans-serif',
              }}
            >
              {headingName}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/82 sm:text-base lg:text-lg">
              {t.clientProfile.publicHeroLead}
            </p>
            <div className="mt-5 flex flex-wrap gap-2 sm:gap-2.5">
              {user?.email ? (
                <span className="inline-flex max-w-full items-center gap-2 truncate rounded-2xl border border-white/20 bg-black/10 px-3 py-2 text-[11px] font-semibold text-white/95 backdrop-blur-md sm:text-sm">
                  <span className="shrink-0 text-white/60">{t.clientProfile.labelEmail}:</span>
                  <span className="min-w-0 truncate">{user.email}</span>
                </span>
              ) : null}
              {user?.phone ? (
                <span className="inline-flex max-w-full items-center gap-2 truncate rounded-2xl border border-white/20 bg-black/10 px-3 py-2 text-[11px] font-semibold text-white/95 backdrop-blur-md sm:text-sm">
                  <span className="shrink-0 text-white/60">{t.clientProfile.labelPhone}:</span>
                  <span className="min-w-0 truncate">{user.phone}</span>
                </span>
              ) : null}
              <span className="inline-flex items-center gap-2 rounded-2xl border border-emerald-300/35 bg-emerald-950/25 px-3 py-2 text-[11px] font-bold text-emerald-50 backdrop-blur-md sm:text-sm">
                {t.clientProfile.bonuses}:{' '}
                <span className="tabular-nums text-white">{bonusBalance.toFixed(2)} €</span>
              </span>
            </div>
          </div>
        </section>
      </div>

      <div className="max-w-[1600px] mx-auto px-3 sm:px-4 flex flex-col lg:flex-row gap-6 lg:gap-8">
        
        {/* ЛЕВАЯ КОЛОНКА - МЕНЮ (десктоп) */}
        <div className="hidden w-full shrink-0 lg:block lg:w-[320px] xl:w-[340px]">
          <div className="sticky top-20 space-y-6 rounded-2xl border border-gray-200/90 bg-white p-6 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-4">
                <div className="flex h-[100px] w-[100px] items-center justify-center rounded-full bg-gradient-to-br from-[#145142] to-[#0c3028] text-white ring-4 ring-gray-100">
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
              <p className="mt-4 border-t border-gray-100 pt-4 text-left text-xs leading-relaxed text-gray-500">
                {t.clientProfile.inAppNavHint}
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
                        ? 'bg-[#145142] text-white shadow-sm'
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
        <div className="flex-1 min-w-0">
          <nav className="watta-profile-embedded-tabs lg:hidden" aria-label={a.profileNav}>
            {embeddedTabs}
          </nav>
          <div
            className={`relative min-h-[420px] rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:min-h-[520px] sm:p-8 ${
              activeTab === 'favorites' ? 'overflow-visible' : 'overflow-hidden'
            }`}
          >
            <div className="relative z-10">
            {activeTab === 'history' && (
              <div className="animate-in fade-in">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">{t.clientProfile.tabHistory}</h2>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href="/reviews"
                      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:border-[#145142]/30 hover:text-[#145142] sm:text-sm"
                    >
                      {t.reviewsPublic.title}
                    </Link>
                    {showBlogNav ? (
                      <Link
                        href="/blog"
                        className="rounded-lg bg-[#145142] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#0f3d32] sm:text-sm"
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
                  onGoMenu={onBack}
                  onReorder={handleReorder}
                  onReviewSubmitted={handleReviewSubmitted}
                  highlightOrderId={highlightOrderId}
                />
              </div>
            )}
            {activeTab === 'favorites' && (
              <div className="space-y-5">
                <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">{t.clientProfile.favoritesTitle}</h2>

                {favLoading ? (
                  <div className="py-12 text-center text-sm text-gray-500">{t.clientProfile.loading}</div>
                ) : favoriteItems.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                    {favoriteItems.map((item) => (
                      <div
                        key={item.id}
                        className="group relative flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm"
                      >
                        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-2xl">🍣</div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="line-clamp-1 font-semibold text-gray-900">{item.name}</h3>
                          <p className="line-clamp-1 text-sm text-gray-500">{item.description}</p>
                          <p className="mt-1 text-sm font-bold text-[#145142]">{item.price} €</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFavorite(item.id)}
                          className="absolute right-2 top-2 rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                          aria-label={a.remove}
                        >
                          <X size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={() => addFavoriteToCart(item)}
                          className="shrink-0 rounded-lg border border-gray-200 p-2 text-[#145142] transition hover:border-[#145142]/40 hover:bg-[#145142]/5"
                          aria-label={a.cart}
                        >
                          <ShoppingBag size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/80 py-16 text-center">
                    <Heart size={40} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-sm font-medium text-gray-600">{t.clientProfile.favEmpty}</p>
                    <button
                      type="button"
                      onClick={() => onSelectCategory?.('rolls')}
                      className="mt-4 text-sm font-semibold text-[#145142] hover:underline"
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
                  <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">{t.clientProfile.addrTitle}</h2>
                  <p className="mt-1 flex items-center gap-2 text-sm text-gray-600">
                    <MapPin size={16} className="shrink-0 text-[#145142]" />
                    {t.clientProfile.addrSub}
                  </p>
                </div>
                <ProfileDeliveryAddressCard
                  initialAddress={user?.address ?? ''}
                  onSaved={handleAddressSaved}
                  cp={t.clientProfile}
                  d={t.deliveryPage}
                  enterAddressHint={t.cartSection.enterAddressForDeliveryFee}
                />
              </div>
            )}
            {activeTab === 'data' && (
              <div className="animate-in fade-in">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">{t.clientProfile.dataTitle}</h2>
                  <p className="mt-1 flex items-center gap-2 text-sm text-gray-600">
                    <Settings size={16} className="shrink-0 text-[#145142]" />
                    {t.clientProfile.dataSub}
                  </p>
                </div>
                <ProfilePersonalDataForm
                  initialName={user?.name ?? ''}
                  initialPhone={user?.phone ?? ''}
                  email={user?.email ?? ''}
                  cp={t.clientProfile}
                  invalidPhoneMessage={t.cartSection.invalidPhone}
                  onSaved={handlePersonalDataSaved}
                />
              </div>
            )}
            </div>
          </div>
        </div>
      </div>
      </div>


    </div>
   )
}