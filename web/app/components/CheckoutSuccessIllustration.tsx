'use client'

import Image from 'next/image'
import { Check } from 'lucide-react'
import { type CSSProperties } from 'react'
import '@/app/watta-cart-drawer-empty-art.css'
import '@/app/watta-checkout-success.css'

const ROLLS = [
  { key: 'left', src: '/favorites-empty/inside-roll-left.webp', mod: 'left', drop: 0, tx: '-1.25rem' },
  { key: 'rear', src: '/favorites-empty/inside-roll-rear.webp', mod: 'rear', drop: 1, tx: '-0.5rem' },
  { key: 'back', src: '/favorites-empty/inside-roll.webp', mod: 'back', drop: 2, tx: '0' },
  { key: 'front', src: '/favorites-empty/inside-roll-front.webp', mod: 'front', drop: 3, tx: '-0.75rem' },
  { key: 'mussel', src: '/favorites-empty/inside-roll-mussel.webp', mod: 'mussel', drop: 4, tx: '0.25rem' },
  { key: 'nigiri', src: '/favorites-empty/inside-roll-nigiri.webp', mod: 'nigiri', drop: 5, tx: '1.1rem' },
  { key: 'bottom', src: '/favorites-empty/inside-roll-bottom.webp', mod: 'bottom', drop: 6, tx: '-0.35rem' },
  { key: 'accent', src: '/favorites-empty/inside-accent-roll.webp', mod: 'accent', drop: 7, tx: '0.85rem' },
  { key: 'gunkan-ikura', src: '/favorites-empty/inside-gunkan-ikura.webp', mod: 'gunkan-ikura', drop: 8, tx: '0.15rem' },
  { key: 'gunkan-baked', src: '/favorites-empty/inside-gunkan-baked.webp', mod: 'gunkan-baked', drop: 9, tx: '1rem' },
] as const

/** Ілюстрація успішного замовлення — ролли «падають» як у порожній корзині, галочка замість сумки. */
export default function CheckoutSuccessIllustration() {
  return (
    <div className="watta-checkout-success__art" aria-hidden>
      <div className="watta-cart-drawer-empty__scene watta-cart-drawer-empty__scene--play watta-checkout-success__scene">
        <svg
          className="watta-checkout-success__blob-svg"
          viewBox="-10 -8 248 178"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          overflow="visible"
        >
          <ellipse cx="110" cy="108" rx="104" ry="52" className="watta-checkout-success__blob" />
        </svg>

        <div className="watta-checkout-success__check" aria-hidden>
          <Check strokeWidth={3} />
        </div>

        {ROLLS.map((roll) => (
          <div
            key={roll.key}
            className={`watta-cart-drawer-empty__roll-slot watta-cart-drawer-empty__roll-slot--${roll.mod}`}
          >
            <div
              className="watta-cart-drawer-empty__roll-drop"
              style={
                {
                  '--drop-i': roll.drop,
                  '--drop-tx': roll.tx,
                } as CSSProperties
              }
            >
              <Image
                src={roll.src}
                alt=""
                width={256}
                height={256}
                className={`watta-cart-drawer-empty__roll watta-cart-drawer-empty__roll--${roll.mod}`}
                sizes="(max-width: 480px) 28vw, 4.5rem"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
