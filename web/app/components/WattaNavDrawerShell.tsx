'use client'

import { useLayoutEffect, useState, type HTMLAttributes, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

type Props = {
  isOpen: boolean
  onClose: () => void
  id?: string
  ariaLabel?: string
  closeSwipeHandlers?: Record<string, unknown>
  /** Атрибути / стилі на <aside> (напр. data-cart-lines для висоти кошика) */
  drawerProps?: HTMLAttributes<HTMLElement> & Record<`data-${string}`, string>
  children: ReactNode
}

/**
 * Портал на document.body: drawer завжди поверх футера, hero і scroll-контейнерів.
 * Затемнений фон закриває меню по кліку поза панеллю.
 */
export default function WattaNavDrawerShell({
  isOpen,
  onClose,
  id = 'watta-nav-drawer',
  ariaLabel,
  closeSwipeHandlers,
  drawerProps,
  children,
}: Props) {
  const [mounted, setMounted] = useState(false)

  useLayoutEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || typeof document === 'undefined') return null

  return createPortal(
    <div id={`${id}-root`} className="watta-nav-drawer-portal-root" data-open={isOpen ? '1' : '0'}>
      <button
        type="button"
        className={cn('watta-nav-sidebar-overlay', isOpen && 'is-open')}
        aria-label={ariaLabel}
        tabIndex={isOpen ? 0 : -1}
        onClick={onClose}
      />
      <aside
        id={id}
        role="dialog"
        aria-modal="true"
        aria-hidden={!isOpen}
        className={cn(
          'watta-nav-sidebar-drawer watta-nav-sidebar-drawer--sheet',
          isOpen && 'is-open',
        )}
        {...drawerProps}
        {...closeSwipeHandlers}
      >
        {children}
      </aside>
    </div>,
    document.body,
  )
}
