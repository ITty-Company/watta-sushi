'use client'

import React, { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useRightNavDrawer } from '../context/RightNavDrawerContext'
import { syncFavoritesAfterAuth } from '@/lib/favoritesStorage'
import { useNavDrawerCloseSwipeHandlers } from '@/components/NavDrawerSwipeGestures'
import WattaNavDrawerPanel from './WattaNavDrawerPanel'
import WattaNavDrawerShell from './WattaNavDrawerShell'

export default function WattaRightNavDrawer() {
  const pathname = usePathname() || '/'
  const { isOpen, close, enabled, cityChangeHandlerRef } = useRightNavDrawer()
  useEffect(() => {
    close()
  }, [pathname, close])

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
    <WattaNavDrawerShell
      isOpen={isOpen}
      onClose={close}
      id="watta-right-nav-drawer"
      closeSwipeHandlers={closeSwipe}
    >
      <WattaNavDrawerPanel
        mode="link"
        pathname={pathname}
        onClose={close}
        onNavigate={close}
        drawerActive={isOpen}
        onCityChange={(cityId) => cityChangeHandlerRef.current?.(cityId)}
      />
    </WattaNavDrawerShell>
  )
}
