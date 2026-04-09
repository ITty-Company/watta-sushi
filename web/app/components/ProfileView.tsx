'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useLanguage } from '../context/LanguageContext'
import { useOptionalRightNavDrawer } from '../context/RightNavDrawerContext'
import ClientProfileOrders from './profile/ClientProfileOrders'
import {
  Phone, Bell, Heart, ShoppingBag, User, Menu,
  MapPin, Clock, Settings, LogOut, Shield, Mail, X
} from 'lucide-react'
import LogoBackground from './LogoBackground'
import Footer from './Footer'
import toast from 'react-hot-toast'

// --- ТИПЫ ДАННЫХ ---
interface OrderItem {
  id: number
  quantity: number
  price: number
  productId?: number
  product: {
    name_ru: string
    description_ru?: string
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
  onSelectCategory: (key: string) => void // <--- ДОБАВИЛИ ЭТО ПОЛЕ
  initialTab?: 'history' | 'address' | 'favorites'
}

export default function ProfileView({
  onBack,
  onMenuClick,
  onOpenPhone,
  onOpenNotifications,
  onOpenFavorites,
  onOpenCart,
  onOpenAdmin,
  onSelectCategory, // <--- ДОБАВИЛИ В ПАРАМЕТРЫ
  initialTab = 'history'
}: ProfileViewProps) {
  const router = useRouter()
  const { t, language } = useLanguage()
  const rightNavDrawer = useOptionalRightNavDrawer()
  const [profileAllowed, setProfileAllowed] = useState<boolean | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const ok = !!localStorage.getItem('currentUser')
    setProfileAllowed(ok)
    if (!ok) {
      router.replace('/login?return=' + encodeURIComponent('/'))
    }
  }, [router])

  const [activeTab, setActiveTab] = useState<'history' | 'address' | 'favorites' | 'data'>('history')
  const [orders, setOrders] = useState<Order[]>([])
  const [favorites, setFavorites] = useState<any[]>([])
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [bonusBalance, setBonusBalance] = useState(0)

  const [favoriteItems, setFavoriteItems] = useState<any[]>([])
  const [favLoading, setFavLoading] = useState(false)


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
        setOrders(data)
      }
    } catch (error) {
      console.error(error)
    } finally {
      if (showSpinner) setLoading(false)
    }
  }, [])

  // --- ЗАГРУЗКА ДАННЫХ ---
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('currentUser')
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser)
          setUser(parsed)
          setIsAdmin(parsed.role === 'ADMIN' || false)
        } catch (e) {}
      }

      const savedFav = localStorage.getItem('favorites')
      if (savedFav) {
        try {
          setFavorites(JSON.parse(savedFav))
        } catch (e) {}
      }

      void loadOrdersAndBonus(true)
    }
  }, [loadOrdersAndBonus])

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
    const reorderedItems = order.items.flatMap((item) => {
      const itemId = Number(item.productId ?? item.id)
      const qty = Math.max(1, Number(item.quantity || 1))
      const cartItem = {
        id: itemId,
        name: item.product?.name_ru || 'Товар',
        description: item.product?.description_ru || '',
        price: Number(item.price || 0),
        category: 'Повторный заказ',
        emoji: '🍣',
        imageUrl: item.product?.imageUrl,
      }
      return Array.from({ length: qty }, () => ({ ...cartItem }))
    })

    localStorage.setItem('cart', JSON.stringify(reorderedItems))
    window.dispatchEvent(new CustomEvent('cartUpdated'))
    window.location.href = '/cart'
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('currentUser')
    localStorage.removeItem('userId')
    localStorage.removeItem('userOrders')
    window.dispatchEvent(new Event('userChanged'))
    onBack()
  }

  const loadFavoritesList = async () => {
    setFavLoading(true)
    try {
      const userStr = localStorage.getItem('currentUser')
      if (userStr) {
        const user = JSON.parse(userStr)
        const res = await fetch('/api/favorites/list', {
          headers: { 'x-user-id': user.id.toString() }
        })
        if (res.ok) {
          setFavoriteItems(await res.json())
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setFavLoading(false)
    }
  }

  // Загружаем, когда открывается вкладка 'favorites'
  useEffect(() => {
    if (activeTab === 'favorites') {
      loadFavoritesList()
    }
  }, [activeTab])

  const removeFavorite = async (productId: number) => {
    try {
      const userStr = localStorage.getItem('currentUser')
      if (!userStr) return
      const user = JSON.parse(userStr)

      await fetch('/api/favorites/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id.toString()
        },
        body: JSON.stringify({ productId })
      })

      // Убираем из списка визуально
      setFavoriteItems(prev => prev.filter(item => item.id !== productId))

      // Обновляем глобальное состояние (если нужно)
      window.dispatchEvent(new Event('favoritesUpdated'))
    } catch (e) {
      toast.error('Ошибка удаления')
    }
  }


  if (profileAllowed === null) {
    return (
      <div className="menu-page-web relative min-h-screen w-full flex items-center justify-center bg-[#f2f5f3]">
        <p className="text-[#145142] font-medium">{t.clientProfile.loading}</p>
      </div>
    )
  }
  if (!profileAllowed) {
    return (
      <div className="menu-page-web relative min-h-screen w-full flex items-center justify-center bg-[#f2f5f3] px-6 text-center">
        <p className="text-[#145142] font-medium">{t.clientProfile.redirectLogin}</p>
      </div>
    )
  }

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
            onClick={() => setActiveTab('favorites')}
            className={`${headerIconBtn} ${activeTab === 'favorites' ? 'bg-rose-50 text-rose-600' : ''}`}
            aria-label={t.clientProfile.tabFavorites}
          >
            <Heart size={20} strokeWidth={2.25} className={activeTab === 'favorites' ? 'fill-current' : ''} />
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

  return (
    <div className="menu-page-web relative min-h-screen w-full max-w-[100vw] font-sans pt-[72px] sm:pt-[76px] pb-10 lg:pb-16 overflow-x-hidden bg-[#f4f6f5]">
      <LogoBackground />
      <div className="relative z-10">
        <Header />

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
              <div className="mt-4 w-full space-y-2 border-t border-gray-100 pt-4 text-left text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Phone size={16} className="shrink-0 text-[#145142]" />
                  <span className="truncate">{user?.phone || t.clientProfile.notSpecified}</span>
                </div>
                {user?.email ? (
                  <div className="flex items-center gap-2">
                    <Mail size={16} className="shrink-0 text-[#145142]" />
                    <span className="truncate">{user.email}</span>
                  </div>
                ) : null}
              </div>
            </div>

            <nav className="flex flex-col gap-1 border-t border-gray-100 pt-2" aria-label="Profile">
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
        <div className="flex-1">
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm lg:hidden">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#145142] text-white">
              <User size={22} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-gray-900">{user?.name || t.clientProfile.notSpecified}</p>
              <p className="text-xs text-gray-500">
                {t.clientProfile.bonuses}: <span className="font-semibold tabular-nums text-[#145142]">{bonusBalance.toFixed(2)} €</span>
              </p>
            </div>
          </div>
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
                    <Link
                      href="/blog"
                      className="rounded-lg bg-[#145142] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#0f3d32] sm:text-sm"
                    >
                      {t.blogPublic.title}
                    </Link>
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
                          aria-label="Remove"
                        >
                          <X size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            // addToCart(item)
                          }}
                          className="shrink-0 rounded-lg border border-gray-200 p-2 text-[#145142] transition hover:border-[#145142]/40 hover:bg-[#145142]/5"
                          aria-label="Cart"
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
                {user?.address ? (
                  <div className="flex items-start gap-4 rounded-xl border border-gray-200 bg-gray-50/50 p-5 shadow-sm">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#145142] text-white">
                      <MapPin size={22} />
                    </div>
                    <p className="pt-1 text-base font-medium leading-relaxed text-gray-800">{user.address}</p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/80 px-4 py-16 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-gray-300 shadow-sm">
                      <MapPin size={36} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">{t.clientProfile.addrEmptyTitle}</h3>
                    <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">{t.clientProfile.addrEmptySub}</p>
                  </div>
                )}
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
                <div className="max-w-2xl space-y-5">
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      <User size={14} className="text-[#145142]" />
                      {t.clientProfile.labelName}
                    </label>
                    <div className="rounded-xl border border-gray-200 bg-gray-50/60 px-4 py-3 text-base font-medium text-gray-900">
                      {user?.name || t.clientProfile.notSpecified}
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      <Phone size={14} className="text-[#145142]" />
                      {t.clientProfile.labelPhone}
                    </label>
                    <div className="rounded-xl border border-gray-200 bg-gray-50/60 px-4 py-3 text-base font-medium text-gray-900">
                      {user?.phone || t.clientProfile.notSpecified}
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      <Mail size={14} className="text-[#145142]" />
                      {t.clientProfile.labelEmail}
                    </label>
                    <div className="rounded-xl border border-gray-200 bg-gray-50/60 px-4 py-3 text-base font-medium text-gray-900">
                      {user?.email || t.clientProfile.notSpecified}
                    </div>
                  </div>
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      </div>
      </div>

      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-[1001] border-t border-gray-200 bg-white/95 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
        style={{ paddingBottom: 'max(10px, env(safe-area-inset-bottom, 0px))' }}
        aria-label={t.clientProfile.tabHistory}
      >
        <div className="flex justify-around items-stretch max-w-lg mx-auto px-1 pt-1">
          {(
            [
              { id: 'history' as const, icon: Clock, label: t.clientProfile.tabHistory },
              { id: 'address' as const, icon: MapPin, label: t.clientProfile.tabAddress },
              { id: 'favorites' as const, icon: Heart, label: t.clientProfile.tabFavorites },
              { id: 'data' as const, icon: Settings, label: t.clientProfile.tabData },
            ]
          ).map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 rounded-xl transition ${
                activeTab === id
                  ? 'text-[#145142] bg-[#145142]/10'
                  : 'text-gray-500 hover:text-[#145142]/80'
              }`}
            >
              <Icon size={22} className={activeTab === id && id === 'favorites' ? 'fill-current' : ''} />
              <span className="text-[9px] font-bold leading-tight text-center px-0.5 line-clamp-2">{label}</span>
            </button>
          ))}
        </div>
      </nav>

      <Footer />
    </div>
   )
}