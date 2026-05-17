'use client'

import React, { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useRightNavDrawer } from '../context/RightNavDrawerContext'
import { cn } from '@/lib/utils'
import { syncFavoritesAfterAuth } from '@/lib/favoritesStorage'
import {
  useNavDrawerCloseSwipeHandlers,
  useNavDrawerOpenSwipe,
} from '@/components/NavDrawerSwipeGestures'
import WattaNavDrawerPanel from './WattaNavDrawerPanel'

export default function WattaRightNavDrawer() {
  const pathname = usePathname() || '/'
  const { isOpen, open, close, enabled, cityChangeHandlerRef } = useRightNavDrawer()
  useEffect(() => {
    close()
  }, [pathname, close])

  useNavDrawerOpenSwipe(enabled && !isOpen, open)
  const closeSwipe = useNavDrawerCloseSwipeHandlers(isOpen, close)

  useEffect(() => {
    if (!enabled || !isOpen) return
    void syncFavoritesAfterAuth()
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [enabled, isOpen])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, close])

  const isHomeRoute = pathname === '/'
  if (!enabled || isHomeRoute) return null

  return (
    <aside
      id="watta-right-nav-drawer"
      role="dialog"
      aria-modal="true"
      aria-hidden={!isOpen}
      className={cn(
        'watta-nav-sidebar-drawer watta-nav-sidebar-drawer--fullscreen',
        isOpen && 'is-open',
      )}
      {...closeSwipe}
    >
      <WattaNavDrawerPanel
        mode="link"
        pathname={pathname}
        onClose={close}
        onNavigate={close}
        onCityChange={(cityId) => cityChangeHandlerRef.current?.(cityId)}
      />
    </aside>
  )
}
