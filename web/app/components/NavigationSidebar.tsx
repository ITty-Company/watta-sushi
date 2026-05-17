'use client'

import { useEffect } from 'react'
import { useLanguage } from '../context/LanguageContext'
import {
  useNavDrawerCloseSwipeHandlers,
  useNavDrawerOpenSwipe,
} from '@/components/NavDrawerSwipeGestures'
import WattaNavDrawerPanel, { type NavDrawerCategory } from './WattaNavDrawerPanel'

export interface NavigationSidebarProps {
  isOpen: boolean
  onClose: () => void
  onOpen: () => void
  staggerKey?: number
  categories?: NavDrawerCategory[]
  onCategorySelect?: (key: string) => void
  onCityChange?: (cityId: number) => void
  onOpenProfileTab: (tab: 'history' | 'address' | 'favorites') => void
  onPageOpen: (page: string) => void
  onGoHome: () => void
  onOpenNotifications: () => void
}

export default function NavigationSidebar({
  isOpen,
  onClose,
  onOpen,
  staggerKey = 0,
  categories,
  onCategorySelect,
  onCityChange,
  onOpenProfileTab,
  onPageOpen,
  onGoHome,
  onOpenNotifications,
}: NavigationSidebarProps) {
  const { t } = useLanguage()

  useNavDrawerOpenSwipe(!isOpen, onOpen)
  const closeSwipe = useNavDrawerCloseSwipeHandlers(isOpen, onClose)

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

  return (
    <aside
      className={`watta-nav-sidebar-drawer watta-nav-sidebar-drawer--fullscreen ${isOpen ? 'is-open' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-hidden={!isOpen}
      aria-label={t.menu}
      {...closeSwipe}
    >
      <WattaNavDrawerPanel
        mode="embedded"
        onClose={onClose}
        staggerKey={staggerKey}
        categories={categories}
        onCategorySelect={onCategorySelect}
        onCityChange={onCityChange}
        onPageOpen={onPageOpen}
        onGoHome={onGoHome}
        onOpenProfileTab={onOpenProfileTab}
        onOpenNotifications={onOpenNotifications}
      />
    </aside>
  )
}
