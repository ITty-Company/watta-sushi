'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

export type RightNavDrawerContextValue = {
  open: () => void
  close: () => void
  toggle: () => void
  isOpen: boolean
  /** Drawer is available (non-auth public shell). */
  enabled: boolean
}

const RightNavDrawerContext = createContext<RightNavDrawerContextValue | null>(null)

export function RightNavDrawerProvider({
  enabled,
  children,
}: {
  enabled: boolean
  children: React.ReactNode
}) {
  const [isOpen, setOpen] = useState(false)

  const open = useCallback(() => {
    if (enabled) setOpen(true)
  }, [enabled])

  const close = useCallback(() => setOpen(false), [])

  const toggle = useCallback(() => {
    if (!enabled) return
    setOpen((o) => !o)
  }, [enabled])

  useEffect(() => {
    if (!enabled) setOpen(false)
  }, [enabled])

  const value = useMemo<RightNavDrawerContextValue>(
    () => ({
      open,
      close,
      toggle,
      isOpen: enabled && isOpen,
      enabled,
    }),
    [enabled, isOpen, open, close, toggle]
  )

  return <RightNavDrawerContext.Provider value={value}>{children}</RightNavDrawerContext.Provider>
}

export function useRightNavDrawer(): RightNavDrawerContextValue {
  const ctx = useContext(RightNavDrawerContext)
  if (!ctx) {
    throw new Error('useRightNavDrawer must be used within RightNavDrawerProvider')
  }
  return ctx
}

/** For headers that may render outside the provider (tests / storybook). */
export function useOptionalRightNavDrawer(): RightNavDrawerContextValue | null {
  return useContext(RightNavDrawerContext)
}
