'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  message: string
  className?: string
  /** product — плоский тост без тіней (сторінка товару). */
  variant?: 'default' | 'product'
}

/** Повідомлення «додано в кошик» біля картки товару (як на ninjasushi). */
export default function CartAddedInlineToast({ message, className, variant = 'default' }: Props) {
  const isProduct = variant === 'product'

  return (
    <div
      className={cn(
        'watta-cart-added-inline-toast',
        isProduct && 'watta-cart-added-inline-toast--product',
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <span
        className={cn(
          'watta-cart-added-inline-toast__check',
          isProduct && 'watta-cart-added-inline-toast__check--css',
        )}
        aria-hidden
      >
        {!isProduct ? <Check size={13} strokeWidth={3} /> : null}
      </span>
      <span className="watta-cart-added-inline-toast__text">{message}</span>
    </div>
  )
}
