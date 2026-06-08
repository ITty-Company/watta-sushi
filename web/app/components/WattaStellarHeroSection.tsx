'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { WattaInViewFadeSection } from './WattaInViewFade'
import WattaStellarHeroBackground from './WattaStellarHeroBackground'

type WattaStellarHeroSectionProps = {
  introId: string
  ariaLabelledBy?: string
  children: ReactNode
  innerClassName?: string
  stackClassName?: string
  /** Фото за текстом (за замовч. вимкнено — intro лише з типографіки). */
  withPhoto?: boolean
  backgroundSrc?: string
  /** contain — фото цілком; cover — заповнити кадр */
  imageFit?: 'cover' | 'contain'
}

export default function WattaStellarHeroSection({
  introId,
  ariaLabelledBy,
  children,
  innerClassName,
  stackClassName,
  withPhoto = false,
  backgroundSrc,
  imageFit = 'cover',
}: WattaStellarHeroSectionProps) {
  return (
    <div className="delivery-page-intro-web delivery-page-intro-web--video w-full shrink-0">
      <div
        className={cn(
          'delivery-page-hero-stack delivery-page-hero-stack--intro-first watta-stellar-hero-stack menu-stellar-hero-stack w-full shrink-0 bg-white',
          !withPhoto && 'watta-stellar-hero-stack--text-only',
          stackClassName,
        )}
        data-watta-cart-bar-gate=""
      >
        {withPhoto ? <WattaStellarHeroBackground backgroundSrc={backgroundSrc} imageFit={imageFit} /> : null}
        <WattaInViewFadeSection
          id={introId}
          className="home-after-hero-intro-web watta-stellar-hero-intro menu-stellar-hero-intro relative z-[20] w-full max-w-[100vw] shrink-0"
          aria-labelledby={ariaLabelledBy}
        >
          <div
            className={cn(
              'menu-stellar-fade-in-up watta-stellar-hero-intro__inner home-after-hero-intro-inner-web home-after-hero-intro-inner-web--home-menu home-after-hero-intro-inner-web--headroom relative z-[1] mx-auto max-w-7xl px-4 pb-3 pt-6 text-center sm:px-6 sm:pb-4 sm:pt-8 md:px-12 md:pb-5',
              innerClassName,
            )}
            style={{ animationDelay: '0.2s' }}
          >
            {children}
          </div>
        </WattaInViewFadeSection>
      </div>
    </div>
  )
}
