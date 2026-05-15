'use client'

import Image from 'next/image'
import {
  Menu,
  Phone,
  Bell,
  Heart,
  User,
  Home,
  Tag,
  Truck,
  Info,
  X,
  Sparkles,
  BookOpen,
  Star,
  ShoppingBag,
  MapPin,
} from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { LanguageSelector } from './LanguageSelector'

export interface NavigationSidebarProps {
  isOpen: boolean
  onClose: () => void
  isAdmin: boolean
  /** Збільшуйте при кожному відкритті, щоб CSS-анімації пунктів грали знову */
  staggerKey?: number
  onOpenProfileTab: (tab: 'history' | 'address' | 'favorites') => void
  onPageOpen: (page: string) => void
  onGoHome: () => void
  onOpenNotifications: () => void
}

export default function NavigationSidebar({
  isOpen,
  onClose,
  isAdmin,
  staggerKey = 0,
  onOpenProfileTab,
  onPageOpen,
  onGoHome,
  onOpenNotifications,
}: NavigationSidebarProps) {
  const { t } = useLanguage()
  const brandParts = t.common.brandName.trim().split(/\s+/)
  const brandTitle = (brandParts[0] ?? 'Watta').toUpperCase()
  const brandSub = (brandParts.slice(1).join(' ') || 'Sushi').toUpperCase()

  const run = (fn: () => void) => (e: React.MouseEvent) => {
    e.preventDefault()
    onClose()
    fn()
  }

  return (
    <>
      <div
        className={`watta-nav-sidebar-overlay ${isOpen ? 'is-open' : ''}`}
        onClick={onClose}
        aria-hidden={!isOpen}
      />
      <aside
        className={`watta-nav-sidebar-drawer ${isOpen ? 'is-open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-hidden={!isOpen}
        aria-label={t.menu}
      >
        <div className="watta-nav-sidebar-bg-shine" aria-hidden />
        <div className="watta-nav-sidebar-bg-mesh" aria-hidden />

        <header className="watta-nav-sidebar-head">
          <div className="watta-nav-sidebar-brand">
            <div className="watta-nav-sidebar-logo-ring">
              <Image
                src="/logo.png"
                alt=""
                width={40}
                height={40}
                className="watta-nav-sidebar-logo-img"
              />
            </div>
            <div className="watta-nav-sidebar-brand-text">
              <span className="watta-nav-sidebar-brand-title">{brandTitle}</span>
              <span className="watta-nav-sidebar-brand-sub">{brandSub}</span>
            </div>
          </div>
          <button
            type="button"
            className="watta-nav-sidebar-x"
            onClick={onClose}
            aria-label={t.siteAria.close}
          >
            <X size={20} strokeWidth={2.25} />
          </button>
        </header>

        <div className="watta-nav-sidebar-scroll">
          <div key={staggerKey} className="watta-nav-sidebar-anim-root">
          <p className="watta-nav-sidebar-kicker">{t.menu}</p>

          <div className="watta-nav-sidebar-quick">
            <button
              type="button"
              className="watta-nav-sidebar-qbtn watta-nav-sidebar-qbtn--profile"
              onClick={run(() => onOpenProfileTab('history'))}
              aria-label={t.profilePage.title}
            >
              <User size={20} strokeWidth={2.2} />
            </button>
            <button
              type="button"
              className="watta-nav-sidebar-qbtn watta-nav-sidebar-qbtn--phone"
              onClick={run(() => onPageOpen('phone'))}
              aria-label={t.phone}
            >
              <Phone size={20} strokeWidth={2.2} />
            </button>
            <button
              type="button"
              className="watta-nav-sidebar-qbtn watta-nav-sidebar-qbtn--bell"
              onClick={run(() => onOpenNotifications())}
              aria-label={t.notifications.title}
            >
              <Bell size={20} strokeWidth={2.2} />
            </button>
            <button
              type="button"
              className="watta-nav-sidebar-qbtn watta-nav-sidebar-qbtn--heart"
              onClick={run(() => onOpenProfileTab('favorites'))}
              aria-label={t.navigation.favorites}
            >
              <Heart size={20} strokeWidth={2.2} />
            </button>
          </div>

          <div className="mb-4 px-1">
            <p className="watta-nav-sidebar-kicker mb-2">{t.navigation.drawerLanguageTitle}</p>
            <div className="flex justify-center rounded-2xl border border-[#145142]/12 bg-white/90 px-2 py-2 shadow-sm">
              <LanguageSelector />
            </div>
          </div>

          <nav className="watta-nav-sidebar-nav" aria-label={t.menu}>
            <button
              type="button"
              className="watta-nav-sidebar-link"
              onClick={run(() => onGoHome())}
            >
              <span className="watta-nav-sidebar-link-ico watta-nav-sidebar-link-ico--home">
                <Home size={18} strokeWidth={2.25} />
              </span>
              <span className="watta-nav-sidebar-link-txt">{t.navigation.home}</span>
            </button>

            <button
              type="button"
              className="watta-nav-sidebar-link"
              onClick={run(() => onPageOpen('catalogMenu'))}
            >
              <span className="watta-nav-sidebar-link-ico watta-nav-sidebar-link-ico--menu">
                <Menu size={18} strokeWidth={2.25} />
              </span>
              <span className="watta-nav-sidebar-link-txt">{t.menu}</span>
            </button>

            <button
              type="button"
              className="watta-nav-sidebar-link"
              onClick={run(() => onPageOpen('promotions'))}
            >
              <span className="watta-nav-sidebar-link-ico watta-nav-sidebar-link-ico--promo">
                <Tag size={18} strokeWidth={2.25} />
              </span>
              <span className="watta-nav-sidebar-link-txt">{t.navigation.promotions}</span>
            </button>

            <button
              type="button"
              className="watta-nav-sidebar-link"
              onClick={run(() => onPageOpen('delivery'))}
            >
              <span className="watta-nav-sidebar-link-ico watta-nav-sidebar-link-ico--delivery">
                <Truck size={18} strokeWidth={2.25} />
              </span>
              <span className="watta-nav-sidebar-link-txt">{t.navigation.delivery}</span>
            </button>

            <button
              type="button"
              className="watta-nav-sidebar-link"
              onClick={run(() => onPageOpen('blog'))}
            >
              <span className="watta-nav-sidebar-link-ico watta-nav-sidebar-link-ico--blog">
                <BookOpen size={18} strokeWidth={2.25} />
              </span>
              <span className="watta-nav-sidebar-link-txt">{t.blogPublic.title}</span>
            </button>

            <button
              type="button"
              className="watta-nav-sidebar-link"
              onClick={run(() => onPageOpen('reviews'))}
            >
              <span className="watta-nav-sidebar-link-ico watta-nav-sidebar-link-ico--reviews">
                <Star size={18} strokeWidth={2.25} />
              </span>
              <span className="watta-nav-sidebar-link-txt">{t.reviewsPublic.title}</span>
            </button>

            <button
              type="button"
              className="watta-nav-sidebar-link"
              onClick={run(() => onPageOpen('about'))}
            >
              <span className="watta-nav-sidebar-link-ico watta-nav-sidebar-link-ico--about">
                <Info size={18} strokeWidth={2.25} />
              </span>
              <span className="watta-nav-sidebar-link-txt">{t.navigation.about}</span>
            </button>

            <button
              type="button"
              className="watta-nav-sidebar-link"
              onClick={run(() => onPageOpen('contacts'))}
            >
              <span className="watta-nav-sidebar-link-ico watta-nav-sidebar-link-ico--contacts">
                <Phone size={18} strokeWidth={2.25} />
              </span>
              <span className="watta-nav-sidebar-link-txt">{t.navigation.contacts}</span>
            </button>
          </nav>

          <p className="watta-nav-sidebar-subkicker">{t.navigation.sidebarMore}</p>

          <nav
            className="watta-nav-sidebar-nav watta-nav-sidebar-nav--secondary"
            aria-label={t.navigation.sidebarMore}
          >
            <button
              type="button"
              className="watta-nav-sidebar-link"
              onClick={run(() => onPageOpen('cartPublic'))}
            >
              <span className="watta-nav-sidebar-link-ico watta-nav-sidebar-link-ico--cart">
                <ShoppingBag size={18} strokeWidth={2.25} />
              </span>
              <span className="watta-nav-sidebar-link-txt">{t.cart}</span>
            </button>

            <button
              type="button"
              className="watta-nav-sidebar-link"
              onClick={run(() => onPageOpen('favoritesPublic'))}
            >
              <span className="watta-nav-sidebar-link-ico watta-nav-sidebar-link-ico--favorites">
                <Heart size={18} strokeWidth={2.25} />
              </span>
              <span className="watta-nav-sidebar-link-txt">{t.navigation.favorites}</span>
            </button>

            <button
              type="button"
              className="watta-nav-sidebar-link"
              onClick={run(() => onPageOpen('profilePublic'))}
            >
              <span className="watta-nav-sidebar-link-ico watta-nav-sidebar-link-ico--profile">
                <User size={18} strokeWidth={2.25} />
              </span>
              <span className="watta-nav-sidebar-link-txt">{t.profilePage.title}</span>
            </button>

            <button
              type="button"
              className="watta-nav-sidebar-link"
              onClick={run(() => onPageOpen('deliveryPublic'))}
            >
              <span className="watta-nav-sidebar-link-ico watta-nav-sidebar-link-ico--deliverypage">
                <MapPin size={18} strokeWidth={2.25} />
              </span>
              <span className="watta-nav-sidebar-link-txt">{t.navigation.deliveryPage}</span>
            </button>
          </nav>

          {isAdmin && (
            <div className="watta-nav-sidebar-admin">
              <button
                type="button"
                className="watta-nav-sidebar-admin-btn"
                onClick={run(() => onPageOpen('admin'))}
              >
                <span className="watta-nav-sidebar-admin-btn-ico">
                  <Sparkles size={20} strokeWidth={2.25} />
                </span>
                <span className="watta-nav-sidebar-admin-btn-txt">{t.admin}</span>
              </button>
            </div>
          )}

          <footer className="watta-nav-sidebar-foot">
            <p className="watta-nav-sidebar-foot-txt" suppressHydrationWarning>
              {t.navigation.footerLegal.replace('{{year}}', String(new Date().getFullYear()))}
            </p>
          </footer>
          </div>
        </div>
      </aside>
    </>
  )
}
