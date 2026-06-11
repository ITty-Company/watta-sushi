'use client'

import { useEffect, useMemo, type ReactNode } from 'react'
import Image from 'next/image'
import {
  BarChart2,
  BookOpen,
  ChefHat,
  Home,
  Image as ImageIcon,
  Layers,
  ListOrdered,
  LucideIcon,
  Mail,
  Package,
  Settings,
  Shield,
  Sparkles,
  Tag,
  Users,
} from 'lucide-react'
import { MapPin, ShoppingBag, Star, User, X } from '@/lib/wattaInlineIcons'
import { useLanguage } from '../../context/LanguageContext'
import WattaNavDrawerShell from '../WattaNavDrawerShell'
import WattaBrandWordmark from '../WattaBrandWordmark'
import { useNavDrawerCloseSwipeHandlers } from '@/components/NavDrawerSwipeGestures'
import { useWattaNavDrawerOpenSync } from '@/hooks/useWattaNavDrawerOpenSync'

export type AdminNavTabId =
  | 'dashboard'
  | 'orders'
  | 'products'
  | 'promos'
  | 'promotions'
  | 'blog'
  | 'reviews'
  | 'crm'
  | 'cities'
  | 'banners'
  | 'menuCategories'
  | 'users'
  | 'adminPhones'
  | 'team'
  | 'settings'
  | 'newsletter'
  | 'ingredients'
  | 'cartUpsell'

type NavItem = {
  id: AdminNavTabId
  label: string
  Icon: LucideIcon
}

function NavIconWrap({ tone, children }: { tone: number; children: ReactNode }) {
  return (
    <span
      className={`watta-nav-compact__nav-ico-wrap watta-nav-compact__nav-ico-wrap--tone-${tone % 4}`}
    >
      {children}
    </span>
  )
}

type Props = {
  isOpen: boolean
  onClose: () => void
  onBackToSite: () => void
  activeTab: AdminNavTabId
  onSelectTab: (tab: AdminNavTabId) => void
}

export default function AdminNavDrawer({
  isOpen,
  onClose,
  onBackToSite,
  activeTab,
  onSelectTab,
}: Props) {
  const { t } = useLanguage()
  const nav = t.navigation
  const closeSwipe = useNavDrawerCloseSwipeHandlers(isOpen, onClose)
  useWattaNavDrawerOpenSync(isOpen)

  useEffect(() => {
    if (!isOpen) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [isOpen, onClose])

  const items = useMemo<NavItem[]>(
    () => [
      { id: 'dashboard', label: t.adminPanel.sidebar.dashboard, Icon: BarChart2 },
      { id: 'orders', label: t.adminPanel.sidebar.orders, Icon: ListOrdered },
      { id: 'products', label: t.adminPanel.sidebar.products, Icon: Package },
      { id: 'cartUpsell', label: t.adminPanel.sidebar.cartUpsell, Icon: ShoppingBag },
      { id: 'promos', label: t.adminPanel.sidebar.promos, Icon: Tag },
      { id: 'promotions', label: t.adminPanel.news.title, Icon: Sparkles },
      { id: 'blog', label: t.adminPanel.sidebar.blog, Icon: BookOpen },
      { id: 'reviews', label: t.adminPanel.sidebar.reviews, Icon: Star },
      { id: 'newsletter', label: t.adminPanel.sidebar.newsletter, Icon: Mail },
      { id: 'crm', label: t.adminPanel.sidebar.crm, Icon: Users },
      { id: 'cities', label: t.adminPanel.sidebar.cities, Icon: MapPin },
      { id: 'banners', label: t.adminPanel.sidebar.banners, Icon: ImageIcon },
      { id: 'menuCategories', label: t.adminPanel.sidebar.categories, Icon: Layers },
      { id: 'users', label: t.adminPanel.sidebar.users, Icon: User },
      { id: 'adminPhones', label: t.adminPanel.sidebar.adminPhones, Icon: Shield },
      { id: 'team', label: t.adminPanel.sidebar.team, Icon: Users },
      { id: 'settings', label: t.adminPanel.sidebar.settings, Icon: Settings },
      { id: 'ingredients', label: t.adminPanel.sidebar.ingredients, Icon: ChefHat },
    ],
    [t],
  )

  const handleBackToSite = () => {
    onClose()
    onBackToSite()
  }

  return (
    <WattaNavDrawerShell
      isOpen={isOpen}
      onClose={onClose}
      id="watta-admin-nav-drawer"
      ariaLabel={t.adminPanel.sidebar.selectSection}
      closeSwipeHandlers={closeSwipe}
    >
      {isOpen ? (
        <div className="watta-nav-compact watta-nav-compact--drawer watta-nav-compact--admin flex h-full min-h-0 flex-col">
          <header className="watta-nav-compact__head watta-nav-compact__head--admin">
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
                  <WattaBrandWordmark active={isOpen} mdUpOnly={false} deferUntilSplashEnd={false} />
                </div>
                <p className="watta-nav-compact__tagline">{nav.drawerBrandLine}</p>
                <span className="watta-nav-compact__admin-kicker">{t.adminPanel.header.title}</span>
              </div>
            </div>
            <button
              type="button"
              className="watta-nav-compact__close"
              onClick={onClose}
              aria-label={t.adminPanel.header.closeDrawerAria}
            >
              <X size={18} strokeWidth={2.2} aria-hidden />
            </button>
          </header>

          <div className="watta-nav-compact__scroll watta-nav-compact__scroll--admin">
            <div className="watta-nav-compact__inner watta-nav-compact__inner--animate">
              <p className="watta-nav-compact__section-label watta-nav-compact__section-label--admin">
                <span className="watta-nav-compact__section-ico" aria-hidden>
                  ◆
                </span>
                {t.adminPanel.sidebar.selectSection}
              </p>

              <nav
                className="watta-nav-compact__nav-grid watta-nav-compact__nav-grid--admin"
                aria-label={t.adminPanel.sidebar.selectSection}
              >
                {items.map((item, i) => {
                  const isActive = activeTab === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`watta-nav-compact__nav-tile watta-nav-compact__nav-tile--admin watta-nav-compact__pop${
                        isActive ? ' watta-nav-compact__nav-tile--active' : ''
                      }`}
                      style={{ animationDelay: `${80 + i * 18}ms` }}
                      onClick={() => onSelectTab(item.id)}
                    >
                      <NavIconWrap tone={i}>
                        <item.Icon size={14} strokeWidth={2} className="watta-nav-compact__nav-ico" />
                      </NavIconWrap>
                      <span className="watta-nav-compact__nav-label">{item.label}</span>
                    </button>
                  )
                })}
              </nav>

              <div
                className="watta-nav-compact__admin-footer watta-nav-compact__pop"
                style={{ animationDelay: `${80 + items.length * 18 + 40}ms` }}
              >
                <button type="button" className="watta-nav-compact__admin-site" onClick={handleBackToSite}>
                  <span className="watta-nav-compact__admin-site-ico" aria-hidden>
                    <Home size={15} strokeWidth={2.2} />
                  </span>
                  <span>{t.adminPanel.header.siteMenu}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </WattaNavDrawerShell>
  )
}
