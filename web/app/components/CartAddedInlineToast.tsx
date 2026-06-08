'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  message: string
  className?: string
}

/** Повідомлення «додано в кошик» біля картки товару (як на ninjasushi). */
export default function CartAddedInlineToast({ message, className }: Props) {
  return (
    <div
      className={cn('watta-cart-added-inline-toast', className)}
      role="status"
      aria-live="polite"
    >
      <span className="watta-cart-added-inline-toast__check" aria-hidden>
        <Check size={13} strokeWidth={3} />
      </span>
      <span className="watta-cart-added-inline-toast__text">{message}</span>
    </div>
  )
}
