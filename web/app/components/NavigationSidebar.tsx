'use client'

import { useEffect } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { useNavDrawerCloseSwipeHandlers } from '@/components/NavDrawerSwipeGestures'
import { useWattaNavDrawerOpenSync } from '@/hooks/useWattaNavDrawerOpenSync'
import WattaNavDrawerPanel from './WattaNavDrawerPanel'
import type { NavDrawerCategory } from '@/lib/navDrawerCategories'
import WattaNavDrawerShell from './WattaNavDrawerShell'

export interface NavigationSidebarProps {
  isOpen: boolean
  onClose: () => void
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

  return (
    <WattaNavDrawerShell
      isOpen={isOpen}
      onClose={onClose}
      id="watta-home-nav-drawer"
      ariaLabel={t.menu}
      closeSwipeHandlers={closeSwipe}
    >
      <WattaNavDrawerPanel
        mode="embedded"
        onClose={onClose}
        staggerKey={staggerKey}
        drawerActive={isOpen}
        categories={categories}
        onCategorySelect={onCategorySelect}
        onCityChange={onCityChange}
        onPageOpen={onPageOpen}
        onGoHome={onGoHome}
        onOpenProfileTab={onOpenProfileTab}
        onOpenNotifications={onOpenNotifications}
      />
    </WattaNavDrawerShell>
  )
}
