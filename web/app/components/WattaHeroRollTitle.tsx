'use client'

import { useWattaStaggerRevealCycle } from '@/lib/useWattaStaggerRevealCycle'
import WattaHeroRollMobileIntro from './WattaHeroRollMobileIntro'

const WORDS = ['WATTA', 'SUSHI'] as const
const TAGLINE = 'fresh rolls · delivery'

export type WattaHeroRollMobileIntroContent = {
  titleLines: string[]
  body: string
  ariaLabel: string
}

type WattaHeroRollTitleProps = {
  mobileIntro?: WattaHeroRollMobileIntroContent
}

export default function WattaHeroRollTitle({ mobileIntro }: WattaHeroRollTitleProps) {
  const cycle = useWattaStaggerRevealCycle()

  if (mobileIntro) {
    return (
      <div className="watta-sushi-roll-hero__title-wrap">
        <WattaHeroRollMobileIntro {...mobileIntro} />
      </div>
    )
  }

  let charIndex = 0
  const taglineStartDelay = 0.95

  return (
    <div className="watta-sushi-roll-hero__title-wrap" key={cycle}>
      <h1 className="watta-sushi-roll-hero__title">
        {WORDS.map((word, wordIndex) => (
          <span
            key={word}
            className={`watta-sushi-roll-hero__word watta-sushi-roll-hero__word--${wordIndex + 1}`}
          >
            {word.split('').map((char) => {
              const delay = charIndex * 0.065
              charIndex += 1
              return (
                <span
                  key={`${word}-${char}-${delay}`}
                  className="watta-sushi-roll-hero__char"
                  style={{ animationDelay: `${delay}s` }}
                >
                  {char}
                </span>
              )
            })}
          </span>
        ))}
      </h1>
      <p className="watta-sushi-roll-hero__title-tagline">
        {TAGLINE.split('').map((char, index) => (
          <span
            key={`tagline-${index}-${char}`}
            className="watta-sushi-roll-hero__tagline-char"
            style={{ animationDelay: `${taglineStartDelay + index * 0.038}s` }}
          >
            {char === ' ' ? '\u00a0' : char}
          </span>
        ))}
      </p>
    </div>
  )
}
