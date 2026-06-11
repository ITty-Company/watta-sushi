'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useCartLineSwipeToDelete } from '@/hooks/useCartLineSwipeToDelete'

type WattaCartSwipeLineProps = {
  lineId: string
  onRemove: () => void
  openLineId: string | null
  onOpenChange: (id: string | null) => void
  deleteLabel: string
  className?: string
  children: ReactNode
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.15}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  )
}

export default function WattaCartSwipeLine({
  lineId,
  onRemove,
  openLineId,
  onOpenChange,
  deleteLabel,
  className,
  children,
}: WattaCartSwipeLineProps) {
  const [touchEnabled, setTouchEnabled] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)')
    const sync = () => setTouchEnabled(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  const swipe = useCartLineSwipeToDelete({
    lineId,
    onRemove,
    openLineId,
    onOpenChange,
    enabled: touchEnabled,
  })

  if (!touchEnabled) {
    return <div className={className}>{children}</div>
  }

  return (
    <div className={`watta-cart-swipe-line${className ? ` ${className}` : ''}`}>
      <div className="watta-cart-swipe-line__actions" aria-hidden={!swipe.revealedSide}>
        <button
          type="button"
          className={`watta-cart-swipe-line__delete watta-cart-swipe-line__delete--start${
            swipe.showLeftDelete ? ' is-visible' : ''
          }`}
          onClick={swipe.handleDeleteTap}
          aria-label={deleteLabel}
          tabIndex={swipe.showLeftDelete ? 0 : -1}
        >
          <TrashIcon className="watta-cart-swipe-line__delete-ico" />
        </button>
        <button
          type="button"
          className={`watta-cart-swipe-line__delete watta-cart-swipe-line__delete--end${
            swipe.showRightDelete ? ' is-visible' : ''
          }`}
          onClick={swipe.handleDeleteTap}
          aria-label={deleteLabel}
          tabIndex={swipe.showRightDelete ? 0 : -1}
        >
          <TrashIcon className="watta-cart-swipe-line__delete-ico" />
        </button>
      </div>

      <div
        className={`watta-cart-swipe-line__content${swipe.dragging ? ' is-dragging' : ''}`}
        style={{ transform: `translate3d(${swipe.offset}px, 0, 0)` }}
        {...swipe.handlers}
      >
        {children}
      </div>
    </div>
  )
}
