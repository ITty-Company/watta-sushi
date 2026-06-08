'use client'

import { useMemo, type ReactNode } from 'react'
import Image from 'next/image'
import {
  BarChart2,
  BookOpen,
  ChefHat,
  Image as ImageIcon,
  Layers,
  ListOrdered,
  Mail,
  MapPin,
  Package,
  Settings,
  Shield,
  ShoppingBag,
  Sparkles,
  Star,
  Tag,
  User,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react'
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

type Props = {
  isOpen: boolean
  onClose: () => void
  activeTab: AdminNavTabId
  onSelectTab: (tab: AdminNavTabId) => void
}

export default function AdminNavDrawer({ isOpen, onClose, activeTab, onSelectTab }: Props) {
  const { t } = useLanguage()
  const nav = t.navigation
  const closeSwipe = useNavDrawerCloseSwipeHandlers(isOpen, onClose)
  useWattaNavDrawerOpenSync(isOpen)

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

  return (
    <WattaNavDrawerShell
      isOpen={isOpen}
      onClose={onClose}
      id="watta-admin-nav-drawer"
      ariaLabel={t.adminPanel.sidebar.selectSection}
      closeSwipeHandlers={closeSwipe}
    >
      <div className="watta-nav-compact flex h-full min-h-0 flex-col">
        <header className="watta-nav-compact__head">
          <div className="watta-nav-compact__head-brand">
            <div className="logo-icon-web watta-nav-compact__logo-icon">
              <Image
                src="/logo.png"
                alt={t.common.brandName}
                width={40}
                height={40}
                className="logo-image-web"
              />
            </div>
            <div className="watta-nav-compact__head-text">
              <div className="logo-text-images-web watta-nav-compact__logo-wordmark">
                <WattaBrandWordmark
                  active={isOpen}
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
            aria-label={t.adminPanel.header.closeDrawerAria}
          >
            <X size={18} strokeWidth={2.2} aria-hidden />
          </button>
        </header>

        <div className="watta-nav-compact__scroll">
          <div className="watta-nav-compact__inner watta-nav-compact__inner--animate">
            <p className="watta-nav-compact__section-label">
              <span className="watta-nav-compact__section-ico" aria-hidden>
                ◆
              </span>
              {t.adminPanel.sidebar.selectSection}
            </p>

            <nav
              className="watta-nav-compact__nav-grid admin-watta-nav-grid"
              aria-label={t.adminPanel.sidebar.selectSection}
            >
              {items.map((item, i) => {
                const isActive = activeTab === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`watta-nav-compact__nav-tile admin-watta-nav-tile watta-nav-compact__pop${
                      isActive ? ' watta-nav-compact__nav-tile--active' : ''
                    }`}
                    style={{ animationDelay: `${120 + i * 24}ms` }}
                    onClick={() => onSelectTab(item.id)}
                  >
                    <NavIconWrap index={i}>
                      <item.Icon size={14} strokeWidth={2} className="watta-nav-compact__nav-ico" />
                    </NavIconWrap>
                    <span className="watta-nav-compact__nav-label">{item.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>
        </div>
      </div>
    </WattaNavDrawerShell>
  )
}
