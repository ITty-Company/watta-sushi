'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, m, useReducedMotion } from 'framer-motion'
import { Settings } from 'lucide-react'
import { Clock, Heart } from '@/lib/wattaInlineIcons'
import { MapPin } from '@/lib/wattaInlineIcons'
import type { LucideIcon } from 'lucide-react'
import ProfileUserCard from './ProfileUserCard'
import ClientProfileOrders from './ClientProfileOrders'
import ProfileAddressesFlow from './ProfileAddressesFlow'
import ProfilePersonalDataForm from './ProfilePersonalDataForm'
import { ProfileSectionBody, ProfileSectionPanel } from './ProfileSectionPanel'
import FavoritesEmptyState from '../FavoritesEmptyState'
import { MenuHighlightStack, type MenuHighlightStackItem } from '../MenuHighlightStack'
import { HERO_COPY_EASE } from '../heroCopyMotion'
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
  isPhoneVerified?: boolean
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
  onAddFavoriteToCart: (item: MenuHighlightStackItem) => void
  onLogout: () => void
  onOpenAdmin: () => void
  onOpenNotifications: () => void
  onAddressSaved: (address: string) => void
  onPersonalDataSaved: (payload: { name: string; phone: string }) => void
  onPhoneVerified?: () => void
}

const STAGE_MOTION = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
}

function preventClickSelection(e: React.MouseEvent) {
  if (e.button === 0) e.preventDefault()
}

function clearTextSelection() {
  if (typeof window === 'undefined') return
  window.getSelection?.()?.removeAllRanges?.()
}

const profileTabs: {
  id: TabId
  icon: LucideIcon
  labelKey: 'tabHistory' | 'tabAddress' | 'tabFavorites' | 'tabData'
}[] = [
  { id: 'history', icon: Clock, labelKey: 'tabHistory' },
  { id: 'address', icon: MapPin, labelKey: 'tabAddress' },
  { id: 'favorites', icon: Heart, labelKey: 'tabFavorites' },
  { id: 'data', icon: Settings, labelKey: 'tabData' },
]

export default function ProfilePublicPageLayout({
  t,
  language,
  displayName,
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
  onAddFavoriteToCart,
  onLogout,
  onOpenAdmin,
  onOpenNotifications,
  onAddressSaved,
  onPersonalDataSaved,
  onPhoneVerified,
}: ProfilePublicPageLayoutProps) {
  const cp = t.clientProfile
  const reduceMotion = useReducedMotion() ?? false
  const [activeTab, setActiveTab] = useState<TabId>(initialTab)

  useEffect(() => {
    setActiveTab(initialTab)
  }, [initialTab])

  useEffect(() => {
    clearTextSelection()
  }, [activeTab])

  const selectTab = (id: TabId) => {
    clearTextSelection()
    setActiveTab(id)
  }

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

  const sectionTitle = useMemo(() => {
    switch (activeTab) {
      case 'history':
        return cp.tabHistory
      case 'address':
        return cp.addrTitle
      case 'favorites':
        return cp.favoritesTitle
      case 'data':
        return cp.dataTitle
      default:
        return cp.tabHistory
    }
  }, [activeTab, cp])

  const stageContent = (() => {
    switch (activeTab) {
      case 'history':
        return (
          <ClientProfileOrders
            orders={orders}
            loading={ordersLoading}
            loadingLabel={cp.loading}
            lang={language}
            t={cp}
            emptyMessage={cp.emptyOrders}
            emptyHint={cp.emptyOrdersHint}
            richEmpty
            goMenuLabel={cp.goMenu}
            onGoMenu={onGoMenu}
            onReorder={onReorder}
            onReviewSubmitted={onReviewSubmitted}
            highlightOrderId={highlightOrderId}
          />
        )
      case 'address':
        return (
          <ProfileAddressesFlow
            cp={cp}
            d={t.deliveryPage}
            enterAddressHint={t.cartSection.enterAddressForDeliveryFee}
            onPrimaryAddressChange={onAddressSaved}
          />
        )
      case 'favorites':
        if (favLoading) {
          return (
            <div className="watta-profile-fav-skeleton-grid" aria-hidden>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="favorites-grid-skeleton-card" />
              ))}
            </div>
          )
        }
        if (favoriteStackItems.length > 0) {
          return (
            <MenuHighlightStack
              title={cp.favoritesTitle}
              ariaLabel={cp.favoritesTitle}
              items={favoriteStackItems}
              weightFallback={t.productDetail.weightFallback}
              piecesFallback={t.productDetail.piecesFallback}
              onAddToCart={onAddFavoriteToCart}
              layout="stack"
              productsGridClassName="favorites-page-products-grid"
              suppressHeading
            />
          )
        }
        return (
          <div className="watta-profile-stage__fav-empty">
            <FavoritesEmptyState title={cp.favEmpty} subtitle={cp.favEmptyHint} ctaLabel={cp.favToMenu} />
          </div>
        )
      case 'data':
        return (
          <div className="watta-profile-data-flow">
            <ProfileSectionPanel>
              <ProfileSectionBody>
              <ProfilePersonalDataForm
                initialName={user?.name ?? ''}
                initialPhone={user?.phone ?? ''}
                email={user?.email ?? ''}
                isPhoneVerified={user?.isPhoneVerified === true}
                cp={cp}
                invalidPhoneMessage={t.cartSection.invalidPhone}
                onSaved={onPersonalDataSaved}
                onPhoneVerified={onPhoneVerified}
              />
              </ProfileSectionBody>
            </ProfileSectionPanel>
          </div>
        )
      default:
        return null
    }
  })()

  const renderTabButton = (
    { id, icon: Icon, labelKey }: (typeof profileTabs)[number],
    variant: 'tile' | 'sidebar',
  ) => {
    const on = activeTab === id
    const className =
      variant === 'tile'
        ? `watta-profile-tab-tile${on ? ' watta-profile-tab-tile--on' : ''}`
        : `watta-profile-sidebar-nav__btn${on ? ' watta-profile-sidebar-nav__btn--on' : ''}`

    return (
      <m.button
        key={`${variant}-${id}`}
        type="button"
        className={className}
        onMouseDown={preventClickSelection}
        onClick={() => selectTab(id)}
        aria-current={on ? 'page' : undefined}
        whileTap={reduceMotion ? undefined : { scale: 0.97 }}
        transition={{ duration: 0.16 }}
      >
        <span className={variant === 'tile' ? 'watta-profile-tab-tile__icon' : 'watta-profile-sidebar-nav__icon'} aria-hidden>
          <Icon size={variant === 'tile' ? 22 : 20} strokeWidth={2} className={on && id === 'favorites' ? 'fill-current' : ''} />
        </span>
        <span className={variant === 'tile' ? 'watta-profile-tab-tile__label' : 'watta-profile-sidebar-nav__label'}>
          {cp[labelKey]}
        </span>
      </m.button>
    )
  }

  return (
    <div
      id="profile-page-root"
      className="watta-profile-page watta-profile-page--soft menu-page-web watta-public-page-shell relative flex w-full max-w-[100vw] min-w-0 flex-1 flex-col overflow-x-clip bg-white font-sans"
    >
      <div className="watta-profile-page__content relative z-10 mx-auto flex w-full min-w-0 flex-col px-3 pb-[max(1.25rem,env(safe-area-inset-bottom,0px))] sm:px-4 sm:pb-8 md:px-6 lg:px-8 xl:px-10">
        <div className="watta-profile-page__shell">
          <aside className="watta-profile-page__aside">
            <ProfileUserCard
              t={t}
              displayName={displayName}
              email={user?.email}
              phone={user?.phone}
              bonusBalance={bonusBalance}
              isAdmin={isAdmin}
              showBlogNav={showBlogNav}
              onLogout={onLogout}
              onOpenAdmin={onOpenAdmin}
              onOpenData={() => selectTab('data')}
              onOpenNotifications={onOpenNotifications}
            />

            <nav className="watta-profile-sidebar-nav" aria-label={t.siteAria.profileNav}>
              {profileTabs.map((tab) => renderTabButton(tab, 'sidebar'))}
            </nav>
          </aside>

          <div className="watta-profile-page__main">
            <nav className="watta-profile-tab-grid" aria-label={t.siteAria.profileNav}>
              {profileTabs.map((tab) => renderTabButton(tab, 'tile'))}
            </nav>

            <div className="watta-profile-stage-head">
              <m.h2
                id="profile-active-section"
                key={sectionTitle}
                className="watta-profile-stage-head__title"
                initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                transition={{ duration: 0.32, ease: HERO_COPY_EASE }}
              >
                {sectionTitle}
              </m.h2>
              {activeTab === 'history' ? (
                <Link
                  href="/reviews"
                  className="watta-profile-stage-head__extra"
                  draggable={false}
                  onMouseDown={preventClickSelection}
                  onClick={clearTextSelection}
                >
                  {t.reviewsPublic.title}
                </Link>
              ) : null}
              {activeTab === 'favorites' && favoriteItems.length > 0 ? (
                <span className="watta-profile-stage-head__count">
                  {cp.favSavedCount.replace('{{count}}', String(favoriteItems.length))}
                </span>
              ) : null}
            </div>

            <div className="watta-profile-stage">
              <AnimatePresence mode="wait" initial={false}>
                <m.div
                  key={activeTab}
                  className="watta-profile-stage__inner"
                  role="tabpanel"
                  aria-labelledby="profile-active-section"
                  {...(reduceMotion
                    ? {}
                    : {
                        ...STAGE_MOTION,
                        transition: { duration: 0.34, ease: HERO_COPY_EASE },
                      })}
                >
                  {stageContent}
                </m.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
