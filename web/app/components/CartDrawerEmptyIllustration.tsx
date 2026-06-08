'use client'

import Image from 'next/image'
import { useEffect, useState, type CSSProperties } from 'react'

const WORDMARK_SRC = '/favorites-empty/watta-wordmark.webp'

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

type Props = {
  /** Перезапуск анімації при кожному відкритті drawer */
  play: boolean
}

/** Сцена порожньої корзини: велика сумка по центру → з першим ролом зникає → решта роллів → лого. */
export default function CartDrawerEmptyIllustration({ play }: Props) {
  const [runId, setRunId] = useState(0)

  useEffect(() => {
    if (play) setRunId((n) => n + 1)
  }, [play])

  return (
    <div className="watta-cart-drawer-empty__art" aria-hidden>
      <div
        key={runId}
        className="watta-cart-drawer-empty__scene watta-cart-drawer-empty__scene--play"
      >
        <svg
          className="watta-cart-drawer-empty__svg"
          viewBox="-10 -14 248 228"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          overflow="visible"
        >
          <ellipse cx="110" cy="134" rx="104" ry="58" className="watta-cart-drawer-empty__blob" />
        </svg>

        <div className="watta-cart-drawer-empty__brand">
          <Image
            src={WORDMARK_SRC}
            alt=""
            width={1166}
            height={222}
            className="watta-cart-drawer-empty__brand-wordmark"
            sizes="(max-width: 480px) 52vw, 10rem"
          />
        </div>

        <div className="watta-cart-drawer-empty__bag" aria-hidden>
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"
              stroke="currentColor"
              strokeWidth="1.65"
              strokeLinejoin="round"
            />
            <path
              d="M3 6h18"
              stroke="currentColor"
              strokeWidth="1.65"
              strokeLinecap="round"
            />
            <path
              d="M16 10a4 4 0 0 1-8 0"
              stroke="currentColor"
              strokeWidth="1.65"
              strokeLinecap="round"
            />
          </svg>
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
