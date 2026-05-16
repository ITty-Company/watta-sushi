'use client'

import React, { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useRightNavDrawer } from '../context/RightNavDrawerContext'
import { cn } from '@/lib/utils'
import { syncFavoritesAfterAuth } from '@/lib/favoritesStorage'
import WattaNavDrawerPanel from './WattaNavDrawerPanel'

const EDGE_PX = 28
const OPEN_SWIPE_PX = 56
const CLOSE_SWIPE_PX = 56

function RightEdgeOpenGesture({ onOpen, active }: { onOpen: () => void; active: boolean }) {
  const startX = useRef<number | null>(null)

  if (!active) return null

  return (
    <div
      className="fixed top-0 right-0 z-[10000] touch-none md:hidden"
      style={{ width: EDGE_PX, height: '100dvh' }}
      aria-hidden
      onTouchStart={(e) => {
        const x = e.touches[0]?.clientX ?? 0
        if (typeof window !== 'undefined' && x >= window.innerWidth - EDGE_PX - 2) {
          startX.current = x
        } else {
          startX.current = null
        }
      }}
      onTouchMove={(e) => {
        if (startX.current == null) return
        const x = e.touches[0]?.clientX ?? startX.current
        if (startX.current - x > OPEN_SWIPE_PX) {
          onOpen()
          startX.current = null
        }
      }}
      onTouchEnd={(e) => {
        if (startX.current == null) return
        const endX = e.changedTouches[0]?.clientX ?? startX.current
        if (startX.current - endX > OPEN_SWIPE_PX) onOpen()
        startX.current = null
      }}
    />
  )
}

function DrawerLeftEdgeCloseSwipe({ onClose, active }: { onClose: () => void; active: boolean }) {
  const startX = useRef<number | null>(null)

  if (!active) return null

  return (
    <div
      className="absolute left-0 top-0 z-[80] w-7 touch-none"
      style={{ height: '100%' }}
      aria-hidden
      onTouchStart={(e) => {
        startX.current = e.touches[0]?.clientX ?? null
      }}
      onTouchMove={(e) => {
        if (startX.current == null) return
        const x = e.touches[0]?.clientX ?? startX.current
        if (x - startX.current > CLOSE_SWIPE_PX) {
          onClose()
          startX.current = null
        }
      }}
      onTouchEnd={(e) => {
        if (startX.current == null) return
        const endX = e.changedTouches[0]?.clientX ?? startX.current
        if (endX - startX.current > CLOSE_SWIPE_PX) onClose()
        startX.current = null
      }}
    />
  )
}

export default function WattaRightNavDrawer() {
  const pathname = usePathname() || '/'
  const { isOpen, open, close, enabled, cityChangeHandlerRef } = useRightNavDrawer()
  useEffect(() => {
    close()
  }, [pathname, close])

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
    <>
      <RightEdgeOpenGesture onOpen={open} active={!isOpen} />

      <aside
        id="watta-right-nav-drawer"
        role="dialog"
        aria-modal="true"
        aria-hidden={!isOpen}
        className={cn(
          'watta-nav-sidebar-drawer watta-nav-sidebar-drawer--fullscreen',
          isOpen && 'is-open',
        )}
      >
        <WattaNavDrawerPanel
          mode="link"
          pathname={pathname}
          onClose={close}
          onNavigate={close}
          onCityChange={(cityId) => cityChangeHandlerRef.current?.(cityId)}
        />
        <DrawerLeftEdgeCloseSwipe onClose={close} active={isOpen} />
      </aside>
    </>
  )
}
