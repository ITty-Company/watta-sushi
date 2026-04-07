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
} from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

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
              <span className="watta-nav-sidebar-brand-title">WATTA</span>
              <span className="watta-nav-sidebar-brand-sub">SUSHI</span>
            </div>
          </div>
          <button
            type="button"
            className="watta-nav-sidebar-x"
            onClick={onClose}
            aria-label="Close"
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
              onClick={run(() => onGoHome())}
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
              onClick={run(() => onPageOpen('phone'))}
            >
              <span className="watta-nav-sidebar-link-ico watta-nav-sidebar-link-ico--contacts">
                <Phone size={18} strokeWidth={2.25} />
              </span>
              <span className="watta-nav-sidebar-link-txt">{t.navigation.contacts}</span>
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
          </div>
        </div>
      </aside>
    </>
  )
}
