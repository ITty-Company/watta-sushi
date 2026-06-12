'use client'

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useWattaNavDrawerOpenSync } from '@/hooks/useWattaNavDrawerOpenSync'
import {
  WATTA_CART_DRAWER_LAYOUT_SYNC_EVENT,
} from '@/hooks/useMobileCartBarGate'

export type CartDrawerContextValue = {
  open: () => void
  close: () => void
  toggle: () => void
  isOpen: boolean
  enabled: boolean
}

const CartDrawerContext = createContext<CartDrawerContextValue | null>(null)

export function CartDrawerProvider({
  enabled,
  children,
}: {
  enabled: boolean
  children: React.ReactNode
}) {
  const [isOpen, setOpen] = useState(false)

  const open = useCallback(() => {
    if (!enabled) return
    window.getSelection?.()?.removeAllRanges?.()
    setOpen(true)
  }, [enabled])

  const close = useCallback(() => setOpen(false), [])

  const toggle = useCallback(() => {
    if (!enabled) return
    setOpen((o) => {
      if (!o) window.getSelection?.()?.removeAllRanges?.()
      return !o
    })
  }, [enabled])

  useEffect(() => {
    if (!enabled) setOpen(false)
  }, [enabled])

  useWattaNavDrawerOpenSync(enabled && isOpen)

  useEffect(() => {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    if (enabled && isOpen) {
      root.setAttribute('data-watta-cart-drawer-open', '')
    } else {
      root.removeAttribute('data-watta-cart-drawer-open')
      window.dispatchEvent(new Event(WATTA_CART_DRAWER_LAYOUT_SYNC_EVENT))
    }
    return () => {
      root.removeAttribute('data-watta-cart-drawer-open')
      window.dispatchEvent(new Event(WATTA_CART_DRAWER_LAYOUT_SYNC_EVENT))
    }
  }, [enabled, isOpen])

  const value = useMemo<CartDrawerContextValue>(
    () => ({
      open,
      close,
      toggle,
      isOpen: enabled && isOpen,
      enabled,
    }),
    [enabled, isOpen, open, close, toggle],
  )

  return <CartDrawerContext.Provider value={value}>{children}</CartDrawerContext.Provider>
}

export function useCartDrawer(): CartDrawerContextValue {
  const ctx = useContext(CartDrawerContext)
  if (!ctx) {
    throw new Error('useCartDrawer must be used within CartDrawerProvider')
  }
  return ctx
}

export function useOptionalCartDrawer(): CartDrawerContextValue | null {
  return useContext(CartDrawerContext)
}
