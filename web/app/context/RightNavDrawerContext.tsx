'use client'

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
} from 'react'
import { useWattaNavDrawerOpenSync } from '@/hooks/useWattaNavDrawerOpenSync'

/** Стабільний контекст — шапка / кошик не ре-рендеряться при isOpen. */
export type RightNavDrawerActionsValue = {
  open: () => void
  close: () => void
  toggle: () => void
  /** Drawer is available (non-auth public shell). */
  enabled: boolean
  /**
   * Хедер записує сюди onCityChange зі сторінки — drawer викликає при виборі міста в панелі.
   */
  cityChangeHandlerRef: MutableRefObject<((cityId: number) => void) | null>
}

export type RightNavDrawerContextValue = RightNavDrawerActionsValue & {
  isOpen: boolean
}

const RightNavDrawerActionsContext = createContext<RightNavDrawerActionsValue | null>(null)
const RightNavDrawerOpenContext = createContext(false)

export function RightNavDrawerProvider({
  enabled,
  children,
}: {
  enabled: boolean
  children: React.ReactNode
}) {
  const [isOpen, setOpen] = useState(false)
  const cityChangeHandlerRef = useRef<((cityId: number) => void) | null>(null)

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

  useWattaNavDrawerOpenSync(enabled && isOpen)

  const actionsValue = useMemo<RightNavDrawerActionsValue>(
    () => ({
      open,
      close,
      toggle,
      enabled,
      cityChangeHandlerRef,
    }),
    [enabled, open, close, toggle],
  )

  const drawerOpen = enabled && isOpen

  return (
    <RightNavDrawerActionsContext.Provider value={actionsValue}>
      <RightNavDrawerOpenContext.Provider value={drawerOpen}>
        {children}
      </RightNavDrawerOpenContext.Provider>
    </RightNavDrawerActionsContext.Provider>
  )
}

export function useRightNavDrawerActions(): RightNavDrawerActionsValue {
  const ctx = useContext(RightNavDrawerActionsContext)
  if (!ctx) {
    throw new Error('useRightNavDrawerActions must be used within RightNavDrawerProvider')
  }
  return ctx
}

export function useOptionalRightNavDrawerActions(): RightNavDrawerActionsValue | null {
  return useContext(RightNavDrawerActionsContext)
}

export function useRightNavDrawerOpen(): boolean {
  return useContext(RightNavDrawerOpenContext)
}

export function useRightNavDrawer(): RightNavDrawerContextValue {
  const actions = useRightNavDrawerActions()
  const isOpen = useRightNavDrawerOpen()
  return useMemo(() => ({ ...actions, isOpen }), [actions, isOpen])
}

/** @deprecated Prefer useOptionalRightNavDrawerActions in chrome (avoids isOpen re-renders). */
export function useOptionalRightNavDrawer(): RightNavDrawerContextValue | null {
  const actions = useOptionalRightNavDrawerActions()
  const isOpen = useContext(RightNavDrawerOpenContext)
  return useMemo(
    () => (actions ? { ...actions, isOpen } : null),
    [actions, isOpen],
  )
}
