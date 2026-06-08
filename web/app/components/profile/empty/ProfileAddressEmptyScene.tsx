'use client'

import Image from 'next/image'
import { ChefHat, Home } from 'lucide-react'
import { WattaInViewFadeDiv } from '@/app/components/WattaInViewFade'
import { PROFILE_EMPTY_ROLL_SIZES, profileEmptyRolls } from './profileEmptyAssets'

type Props = {
  title: string
  subtitle: string
}

/** Прямий маршрут «кухня → дім» (viewBox 240×160). */
const ROUTE_FROM = { x: 48, y: 68 }
const ROUTE_TO = { x: 192, y: 68 }
const ADDR_ROUTE = `M ${ROUTE_FROM.x} ${ROUTE_FROM.y} L ${ROUTE_TO.x} ${ROUTE_TO.y}`

/** Звичайний кур’єр — кепка, форма, сумка. */
function ProfileAddrCourier({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 76"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M14 10 C14 6 19 4 24 4 C29 4 34 6 34 10 L34 16 L14 16 Z"
        fill="#5c9010"
        stroke="#466e0a"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <rect x="16" y="6" width="16" height="3" rx="1.2" fill="#ff5c00" opacity="0.9" />
      <circle cx="24" cy="24" r="11" fill="#fff5eb" stroke="#5c9010" strokeWidth="2" />
      <circle cx="20" cy="23" r="1.5" fill="#5c9010" />
      <circle cx="28" cy="23" r="1.5" fill="#5c9010" />
      <path d="M21 27 Q24 29 27 27" stroke="#5c9010" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M14 36 C14 33 18 31 24 31 C30 31 34 33 34 36 L32 68 C24 65 16 65 12 68 Z"
        fill="#5c9010"
      />
      <path d="M18 40 H30" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.35" />
      <rect x="30" y="38" width="12" height="14" rx="3" fill="#ff5c00" stroke="#5c9010" strokeWidth="1.4" />
      <path d="M33 41 H39" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
      <path d="M18 68 L22 76 M30 68 L26 76" stroke="#5c9010" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}

/** Порожні адреси — карта на всю панель, прямий маршрут, емодзі під точками. */
export default function ProfileAddressEmptyScene({ title, subtitle }: Props) {
  return (
    <WattaInViewFadeDiv className="watta-profile-empty watta-profile-empty--address">
      <div className="watta-profile-address-flow__art">
        <div
          className="watta-profile-empty__stage watta-profile-empty__stage--address watta-profile-empty__stage--address-story"
          aria-hidden
        >
          <svg
            className="watta-profile-empty__addr-map-svg"
            viewBox="0 0 240 160"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              <linearGradient id="wattaAddrSheet" x1="0" y1="0" x2="240" y2="160" gradientUnits="userSpaceOnUse">
                <stop stopColor="#fafcfb" />
                <stop offset="1" stopColor="#e6eeea" />
              </linearGradient>
              <linearGradient
                id="wattaAddrRoute"
                x1={ROUTE_FROM.x}
                y1={ROUTE_FROM.y}
                x2={ROUTE_TO.x}
                y2={ROUTE_TO.y}
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#ff5c00" />
                <stop offset="0.55" stopColor="#ff8a3d" />
                <stop offset="1" stopColor="#5c9010" />
              </linearGradient>
            </defs>

            <rect width="240" height="160" fill="url(#wattaAddrSheet)" />

            <rect x="18" y="24" width="38" height="28" rx="5" className="watta-profile-empty__addr-block" />
            <rect x="72" y="18" width="46" height="34" rx="5" className="watta-profile-empty__addr-block watta-profile-empty__addr-block--2" />
            <rect x="146" y="22" width="42" height="26" rx="5" className="watta-profile-empty__addr-block" />
            <rect x="168" y="96" width="48" height="32" rx="5" className="watta-profile-empty__addr-block watta-profile-empty__addr-block--3" />
            <rect x="32" y="104" width="36" height="24" rx="5" className="watta-profile-empty__addr-block watta-profile-empty__addr-block--2" />

            <path
              d={ADDR_ROUTE}
              className="watta-profile-empty__addr-route"
              stroke="url(#wattaAddrRoute)"
              strokeWidth="4"
              strokeLinecap="round"
            />

            <circle
              cx={ROUTE_FROM.x}
              cy={ROUTE_FROM.y}
              r="6"
              className="watta-profile-empty__addr-node watta-profile-empty__addr-node--from"
            />
            <circle
              cx={ROUTE_TO.x}
              cy={ROUTE_TO.y}
              r="6"
              className="watta-profile-empty__addr-node watta-profile-empty__addr-node--to"
            />
          </svg>

          <div className="watta-profile-empty__addr-marker watta-profile-empty__addr-marker--from">
            <div className="watta-profile-empty__addr-marker-emojis">
              <span className="watta-profile-empty__addr-marker-icon watta-profile-empty__addr-marker-icon--shop">
                <ChefHat strokeWidth={2.1} aria-hidden />
              </span>
              <Image
                src={profileEmptyRolls.salmon}
                alt=""
                width={256}
                height={256}
                className="watta-profile-empty__addr-marker-roll"
                sizes={PROFILE_EMPTY_ROLL_SIZES}
              />
            </div>
          </div>

          <div className="watta-profile-empty__addr-marker watta-profile-empty__addr-marker--to">
            <div className="watta-profile-empty__addr-marker-emojis">
              <span className="watta-profile-empty__addr-marker-icon watta-profile-empty__addr-marker-icon--home">
                <Home strokeWidth={2.15} aria-hidden />
              </span>
              <Image
                src={profileEmptyRolls.front}
                alt=""
                width={256}
                height={256}
                className="watta-profile-empty__addr-marker-roll watta-profile-empty__addr-marker-roll--door"
                sizes={PROFILE_EMPTY_ROLL_SIZES}
              />
            </div>
          </div>

          <div className="watta-profile-empty__addr-courier">
            <ProfileAddrCourier className="watta-profile-empty__addr-courier-fig" />
            <Image
              src={profileEmptyRolls.poke}
              alt=""
              width={256}
              height={256}
              className="watta-profile-empty__addr-courier-bag"
              sizes="3rem"
            />
          </div>
        </div>
      </div>

      <div className="watta-favorites-empty__copy watta-profile-address-flow__copy">
        <h2 className="watta-favorites-empty__title">{title}</h2>
        <p className="watta-favorites-empty__subtitle">{subtitle}</p>
      </div>
    </WattaInViewFadeDiv>
  )
}
