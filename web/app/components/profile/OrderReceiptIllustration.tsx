'use client'

import Image from 'next/image'
import { AlertCircle, Check, Clock, Receipt, XCircle } from 'lucide-react'
import { profileEmptyRolls } from './empty/profileEmptyAssets'

type PaymentVisual = 'paid' | 'waiting' | 'failed'

type Props = {
  paymentVisual: PaymentVisual
}

const CARD_SUSHI = [
  { src: profileEmptyRolls.front, mod: 'a' },
  { src: profileEmptyRolls.salmon, mod: 'b' },
] as const

/** Декоративна ілюстрація чека — картка + суші + статус оплати. */
export default function OrderReceiptIllustration({ paymentVisual }: Props) {
  const StatusIcon =
    paymentVisual === 'paid' ? Check : paymentVisual === 'failed' ? XCircle : Clock

  return (
    <div className="watta-order-receipt__art" aria-hidden>
      <div className="watta-order-receipt__scene">
        <svg
          className="watta-order-receipt__blob-svg"
          viewBox="-10 -14 248 180"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          overflow="visible"
        >
          <ellipse cx="110" cy="108" rx="104" ry="52" className="watta-order-receipt__blob" />
        </svg>

        <Image
          src={profileEmptyRolls.accent}
          alt=""
          width={128}
          height={128}
          className="watta-order-receipt__roll watta-order-receipt__roll--left"
          sizes="3.25rem"
        />
        <Image
          src={profileEmptyRolls.nigiri}
          alt=""
          width={128}
          height={128}
          className="watta-order-receipt__roll watta-order-receipt__roll--right"
          sizes="2.85rem"
        />

        <div className="watta-order-receipt__card">
          <div className="watta-order-receipt__card-head">
            <span className="watta-order-receipt__card-ico">
              <Receipt strokeWidth={2} />
            </span>
            <span className="watta-order-receipt__card-kicker" />
          </div>
          <div className="watta-order-receipt__card-sushi">
            {CARD_SUSHI.map(({ src, mod }) => (
              <Image key={mod} src={src} alt="" width={64} height={64} sizes="1.65rem" />
            ))}
          </div>
          <span className="watta-order-receipt__card-line" />
          <span className="watta-order-receipt__card-line watta-order-receipt__card-line--short" />
          <span className="watta-order-receipt__card-total" />
        </div>

        <div
          className={`watta-order-receipt__status-badge watta-order-receipt__status-badge--${paymentVisual}`}
        >
          {paymentVisual === 'waiting' ? (
            <AlertCircle strokeWidth={2.5} />
          ) : (
            <StatusIcon strokeWidth={2.5} />
          )}
        </div>
      </div>
    </div>
  )
}
