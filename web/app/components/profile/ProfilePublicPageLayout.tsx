'use client'

import { useEffect, useMemo } from 'react'
import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import {
  Bell,
  Clock,
  Heart,
  LogOut,
  Mail,
  MapPin,
  Phone,
  Settings,
  Shield,
  ShoppingBag,
  Sparkles,
  X,
} from 'lucide-react'
import AnimatedHeroIntroBlock from '../AnimatedHeroIntroBlock'
import ClientProfileOrders from './ClientProfileOrders'
import ProfileDeliveryAddressCard from './ProfileDeliveryAddressCard'
import ProfilePersonalDataForm from './ProfilePersonalDataForm'
import type { ProfileOrder } from './ClientProfileOrders'
import type { Language, Translations } from '@/app/context/LanguageContext'

type TabId = 'history' | 'address' | 'favorites' | 'data'

type FavoriteItem = {
  id: number
  name: string
  description?: string
  price: number
  imageUrl?: string
}

type UserData = {
  name: string
  email: string
  phone: string
  address: string
}

export type ProfilePublicPageLayoutProps = {
  t: Translations
  language: Language
  displayName: string
  headingName: string
  user: UserData | null
  bonusBalance: number
  isAdmin: boolean
  orders: ProfileOrder[]
  ordersLoading: boolean
  favoriteItems: FavoriteItem[]
  favLoading: boolean
  showBlogNav: boolean
  highlightOrderId?: number
  initialTab?: TabId
  onGoMenu: () => void
  onReorder: (order: ProfileOrder) => void
  onReviewSubmitted: (
    orderId: number,
    review: { id: number; rating: number; text: string; images?: unknown },
  ) => void
  onRemoveFavorite: (productId: number) => void
  onAddFavoriteToCart: (item: FavoriteItem) => void
  onLogout: () => void
  onOpenAdmin: () => void
  onAddressSaved: (address: string) => void
  onPersonalDataSaved: (payload: { name: string; phone: string }) => void
  removeFavoriteAria: string
  addCartAria: string
}

const SECTION_IDS: Record<TabId, string> = {
  history: 'profile-orders',
  address: 'profile-address',
  favorites: 'profile-favorites',
  data: 'profile-data',
}

export default function ProfilePublicPageLayout({
  t,
  language,
  displayName,
  headingName,
  user,
  bonusBalance,
  isAdmin,
  orders,
  ordersLoading,
  favoriteItems,
  favLoading,
  showBlogNav,
  highlightOrderId,
  initialTab = 'history',
  onGoMenu,
  onReorder,
  onReviewSubmitted,
  onRemoveFavorite,
  onAddFavoriteToCart,
  onLogout,
  onOpenAdmin,
  onAddressSaved,
  onPersonalDataSaved,
  removeFavoriteAria,
  addCartAria,
}: ProfilePublicPageLayoutProps) {
  const cp = t.clientProfile
  const reduce = useReducedMotion()

  const heroTitleLines = useMemo(() => {
    const words = headingName.trim().split(/\s+/)
    if (words.length <= 1) return [t.profilePage.title, headingName]
    return [words[0], words.slice(1).join(' ')]
  }, [headingName, t.profilePage.title])

  const ordersCount = orders.length
  const favCount = favoriteItems.length
  const hasAddress = Boolean(user?.address?.trim())

  useEffect(() => {
    const id = SECTION_IDS[initialTab]
    const el = document.getElementById(id)
    if (!el) return
    const tmr = window.setTimeout(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 320)
    return () => window.clearTimeout(tmr)
  }, [initialTab])

  const fade = reduce
    ? ({ initial: false as const } satisfies { initial: false })
    : ({
        initial: { opacity: 0, y: 18 },
        whileInView: { opacity: 1, y: 0 },
      } as const)

  const scrollTo = (tab: TabId) => {
    document.getElementById(SECTION_IDS[tab])?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const quickNav = [
    { id: 'history' as const, icon: Clock, label: cp.tabHistory },
    { id: 'favorites' as const, icon: Heart, label: cp.tabFavorites },
    { id: 'address' as const, icon: MapPin, label: cp.tabAddress },
    { id: 'data' as const, icon: Settings, label: cp.tabData },
  ]

  const stats = [
    { value: `${bonusBalance.toFixed(2)} €`, label: cp.bonuses, orange: true },
    { value: String(ordersCount), label: cp.tabHistory, orange: false },
    { value: String(favCount), label: cp.tabFavorites, orange: true },
    {
      value: hasAddress ? '✓' : '—',
      label: cp.tabAddress,
      orange: false,
    },
  ]

  const leadIntro = (
    <AnimatedHeroIntroBlock
      sectionId="profile-page-lead-intro"
      ariaLabel={t.profilePage.title}
      titleId="profile-hero-title"
      titleLines={heroTitleLines}
      body={cp.publicHeroLead}
      accentLineIndex={heroTitleLines.length > 1 ? 1 : 0}
      headingLevel="h1"
      reserveTopSpace
      innerClassName="home-after-hero-intro-inner-web home-after-hero-intro-inner-web--home-menu delivery-page-intro-inner-web--standalone relative z-[1] mx-auto w-full max-w-6xl px-4 pb-3 text-center sm:px-6 sm:pb-4 md:pb-5"
    >
      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
        {user?.email ? (
          <span className="inline-flex max-w-full items-center gap-1.5 truncate rounded-full border border-[#145142]/15 bg-[#f0f6f3] px-3 py-1.5 text-[11px] font-semibold text-[#145142] sm:text-xs">
            <Mail size={12} aria-hidden />
            <span className="min-w-0 truncate">{user.email}</span>
          </span>
        ) : null}
        {user?.phone ? (
          <span className="inline-flex max-w-full items-center gap-1.5 truncate rounded-full border border-[#145142]/15 bg-[#f0f6f3] px-3 py-1.5 text-[11px] font-semibold text-[#145142] sm:text-xs">
            <Phone size={12} aria-hidden />
            <span className="min-w-0 truncate">{user.phone}</span>
          </span>
        ) : null}
      </div>
    </AnimatedHeroIntroBlock>
  )

  return (
    <div
      id="profile-page-root"
      className="watta-profile-page profile-page-web menu-page-web contact-page-web watta-delivery-page-about flex w-full max-w-[100vw] flex-1 flex-col overflow-x-hidden bg-white"
    >
      <div className="delivery-page-intro-web w-full shrink-0 bg-white">{leadIntro}</div>

      <section className="delivery-page-stats-band w-full border-b border-[#145142]/8 bg-white py-4 sm:py-5" aria-label={cp.bonuses}>
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-2.5">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                className={`contact-watta-stat-pill delivery-stat-pill--blob watta-profile-stat-pill flex flex-col items-center text-center ${
                  s.orange ? 'delivery-stat-pill--orange' : 'delivery-stat-pill--green'
                }`}
                {...fade}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: i * 0.04 }}
              >
                <div className="delivery-stat-pill__val delivery-stat-pill__val">{s.value}</div>
                <div className="contact-watta-stat-pill__label">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <div className="watta-profile-page__flow">
        <div className="watta-profile-page__inner mx-auto w-full max-w-6xl px-4 sm:px-6">
          <motion.div {...fade} viewport={{ once: true }} transition={{ duration: 0.4 }}>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#145142]/55 sm:text-[11px]">
              <Sparkles className="mr-1 inline h-3 w-3 text-[#ff5c00]" aria-hidden />
              {cp.publicHubTitle}
            </p>
            <nav className="watta-profile-quick-nav" aria-label={t.siteAria.profileNav}>
              {quickNav.map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  type="button"
                  className="watta-profile-quick-nav__btn"
                  onClick={() => scrollTo(id)}
                >
                  <Icon size={14} strokeWidth={2.25} aria-hidden />
                  {label}
                </button>
              ))}
            </nav>
            <div className="watta-profile-actions-bar">
              <button type="button" className="watta-profile-action-link watta-profile-action-link--primary" onClick={onGoMenu}>
                {cp.goMenu}
              </button>
              <Link href="/notifications" className="watta-profile-action-link watta-profile-action-link--ghost">
                <Bell size={14} aria-hidden />
                {t.notifications.title}
              </Link>
              <Link href="/reviews" className="watta-profile-action-link watta-profile-action-link--ghost">
                {t.reviewsPublic.title}
              </Link>
              {showBlogNav ? (
                <Link href="/blog" className="watta-profile-action-link watta-profile-action-link--ghost">
                  {t.blogPublic.title}
                </Link>
              ) : null}
              {isAdmin ? (
                <button type="button" className="watta-profile-action-link watta-profile-action-link--ghost" onClick={onOpenAdmin}>
                  <Shield size={14} aria-hidden />
                  {cp.tabAdmin}
                </button>
              ) : null}
              <button type="button" className="watta-profile-logout-btn" onClick={onLogout}>
                <LogOut size={14} aria-hidden />
                {cp.logout}
              </button>
            </div>
          </motion.div>

          <section id="profile-orders" className="watta-profile-section-card" aria-labelledby="profile-orders-title">
            <h2 id="profile-orders-title" className="watta-profile-page__section-title">
              {cp.tabHistory}
            </h2>
            <p className="watta-profile-page__section-sub">{displayName}</p>
            <div className="mt-4">
              <ClientProfileOrders
                orders={orders}
                loading={ordersLoading}
                loadingLabel={cp.loading}
                lang={language}
                t={cp}
                emptyMessage={cp.emptyOrders}
                goMenuLabel={cp.goMenu}
                onGoMenu={onGoMenu}
                onReorder={onReorder}
                onReviewSubmitted={onReviewSubmitted}
                highlightOrderId={highlightOrderId}
              />
            </div>
          </section>

          <section id="profile-data" className="watta-profile-section-card" aria-labelledby="profile-data-title">
            <h2 id="profile-data-title" className="watta-profile-page__section-title">
              {cp.dataTitle}
            </h2>
            <p className="watta-profile-page__section-sub">{cp.dataSub}</p>
            <ProfilePersonalDataForm
              initialName={user?.name ?? ''}
              initialPhone={user?.phone ?? ''}
              email={user?.email ?? ''}
              cp={cp}
              invalidPhoneMessage={t.cartSection.invalidPhone}
              onSaved={onPersonalDataSaved}
            />
          </section>

          <section id="profile-address" className="watta-profile-section-card" aria-labelledby="profile-address-title">
            <h2 id="profile-address-title" className="watta-profile-page__section-title">
              {cp.addrTitle}
            </h2>
            <p className="watta-profile-page__section-sub">{cp.addrSub}</p>
            <ProfileDeliveryAddressCard
              initialAddress={user?.address ?? ''}
              onSaved={onAddressSaved}
              cp={cp}
              d={t.deliveryPage}
              enterAddressHint={t.cartSection.enterAddressForDeliveryFee}
            />
          </section>

          <section id="profile-favorites" className="watta-profile-section-card" aria-labelledby="profile-favorites-title">
            <h2 id="profile-favorites-title" className="watta-profile-page__section-title">
              <span className="watta-profile-page__section-title-accent">{cp.tabFavorites}</span>
            </h2>
            <p className="watta-profile-page__section-sub">{cp.favSubtitle}</p>
            {favLoading ? (
              <p className="mt-6 text-center text-sm text-[#64748b]">{cp.loading}</p>
            ) : favoriteItems.length > 0 ? (
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {favoriteItems.map((item) => (
                  <div key={item.id} className="watta-profile-fav-card group relative">
                    <div className="h-[4.5rem] w-[4.5rem] shrink-0 overflow-hidden rounded-xl bg-[#f0f6f3]">
                      {item.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-2xl">🍣</div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 pr-8">
                      <h3 className="line-clamp-1 text-sm font-bold text-[#0f241e]">{item.name}</h3>
                      <p className="line-clamp-1 text-xs text-[#64748b]">{item.description}</p>
                      <p className="mt-0.5 text-sm font-bold text-[#145142]">{item.price} €</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveFavorite(item.id)}
                      className="absolute right-2 top-2 rounded-lg p-1.5 text-[#94a3b8] transition hover:bg-red-50 hover:text-red-600"
                      aria-label={removeFavoriteAria}
                    >
                      <X size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onAddFavoriteToCart(item)}
                      className="shrink-0 rounded-xl border border-[#145142]/15 p-2 text-[#145142] transition hover:bg-[#f0f6f3]"
                      aria-label={addCartAria}
                    >
                      <ShoppingBag size={18} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="watta-profile-empty mt-4">
                <Heart size={36} className="mx-auto mb-3 text-[#145142]/25" aria-hidden />
                <p className="text-sm font-semibold text-[#334155]">{cp.favEmpty}</p>
                <p className="mx-auto mt-1 max-w-sm text-xs text-[#64748b]">{cp.favEmptyHint}</p>
                <button type="button" onClick={onGoMenu} className="mt-4 text-sm font-bold text-[#ff5c00] hover:underline">
                  {cp.favToMenu}
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
