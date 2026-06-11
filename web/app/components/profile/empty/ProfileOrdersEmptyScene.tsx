'use client'

import Image from 'next/image'
import { ArrowRight, ChefHat, Receipt, Truck } from 'lucide-react'
import { Clock } from '@/lib/wattaInlineIcons'
import { WattaInViewFadeDiv } from '@/app/components/WattaInViewFade'
import { PROFILE_EMPTY_ROLL_SIZES, profileEmptyRolls } from './profileEmptyAssets'

type Props = {
  title: string
  subtitle: string
  ctaLabel: string
  onCta: () => void
}

const CARD_SUSHI = [
  { src: profileEmptyRolls.front, mod: 'a' },
  { src: profileEmptyRolls.salmon, mod: 'b' },
] as const

/** Великі суші на сірій середині голубої тарілки (після сюжету з карткою). */
const PLATE_SUSHI = [
  { src: profileEmptyRolls.front, mod: '1' },
  { src: profileEmptyRolls.salmon, mod: '2' },
] as const

/** Порожня історія — картка → статуси → голуба тарілка → великі суші. */
export default function ProfileOrdersEmptyScene({ title, subtitle, ctaLabel, onCta }: Props) {
  return (
    <WattaInViewFadeDiv className="watta-profile-empty watta-profile-empty--orders">
      <div className="watta-profile-empty__glow watta-profile-empty__glow--orders" aria-hidden />

      <div
        className="watta-profile-empty__stage watta-profile-empty__stage--orders watta-profile-empty__stage--orders-story"
        aria-hidden
      >
        <svg
          className="watta-profile-empty__svg-bg"
          viewBox="0 0 280 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <ellipse cx="140" cy="128" rx="118" ry="58" className="watta-profile-empty__blob" />
          <ellipse
            cx="140"
            cy="128"
            rx="92"
            ry="44"
            className="watta-profile-empty__blob watta-profile-empty__blob--inner"
          />
        </svg>

        <div className="watta-profile-empty__plate-scene">
          {PLATE_SUSHI.map(({ src, mod }) => (
            <Image
              key={mod}
              src={src}
              alt=""
              width={256}
              height={256}
              className={`watta-profile-empty__plate-sushi watta-profile-empty__plate-sushi--${mod}`}
              sizes={PROFILE_EMPTY_ROLL_SIZES}
            />
          ))}
        </div>

        <div className="watta-profile-empty__order-card watta-profile-empty__order-card--story">
          <div className="watta-profile-empty__order-card-head">
            <span className="watta-profile-empty__order-receipt" aria-hidden>
              <Receipt strokeWidth={2} />
            </span>
            <span className="watta-profile-empty__order-kicker" />
          </div>
          <div className="watta-profile-empty__order-sushi-row">
            {CARD_SUSHI.map(({ src, mod }) => (
              <Image
                key={mod}
                src={src}
                alt=""
                width={128}
                height={128}
                className={`watta-profile-empty__order-sushi-item watta-profile-empty__order-sushi-item--${mod}`}
                sizes="4.5rem"
              />
            ))}
          </div>
          <span className="watta-profile-empty__order-line watta-profile-empty__order-line--story" />
          <span className="watta-profile-empty__order-total watta-profile-empty__order-total--story" />
        </div>

        <div className="watta-profile-empty__timeline watta-profile-empty__timeline--story">
          <div className="watta-profile-empty__timeline-step watta-profile-empty__timeline-step--pending">
            <span className="watta-profile-empty__timeline-node watta-profile-empty__timeline-node--1">
              <Clock strokeWidth={2.1} aria-hidden />
            </span>
            <span className="watta-profile-empty__timeline-rail watta-profile-empty__timeline-rail--1" />
          </div>
          <div className="watta-profile-empty__timeline-step watta-profile-empty__timeline-step--cook">
            <span className="watta-profile-empty__timeline-node watta-profile-empty__timeline-node--2">
              <ChefHat strokeWidth={2.1} aria-hidden />
            </span>
            <span className="watta-profile-empty__timeline-rail watta-profile-empty__timeline-rail--2" />
          </div>
          <div className="watta-profile-empty__timeline-step watta-profile-empty__timeline-step--deliver">
            <span className="watta-profile-empty__timeline-node watta-profile-empty__timeline-node--3">
              <Truck strokeWidth={2.1} aria-hidden />
            </span>
          </div>
        </div>
      </div>

      <div className="watta-profile-empty__copy">
        <h2 className="watta-profile-empty__title">{title}</h2>
        <p className="watta-profile-empty__subtitle">{subtitle}</p>
        <button type="button" className="watta-favorites-empty__cta" onClick={onCta}>
          <span>{ctaLabel}</span>
          <ArrowRight className="watta-favorites-empty__cta-arrow" size={18} strokeWidth={2.2} aria-hidden />
        </button>
      </div>
    </WattaInViewFadeDiv>
  )
}
