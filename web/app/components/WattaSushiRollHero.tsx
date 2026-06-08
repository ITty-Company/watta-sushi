'use client'

import { useEffect, useMemo, useRef } from 'react'
import WattaSushiRollMarquee from './WattaSushiRollMarquee'
import WattaHeroRollTitle, { type WattaHeroRollMobileIntroContent } from './WattaHeroRollTitle'
import {
  WATTA_HERO_ROLL_IMAGES,
  getHeroRollMarqueeSpeed,
  type WattaSushiRollData,
} from '@/lib/wattaSushiRolls'
import { WATTA_HERO_VIDEO_READY_EVENT } from '@/lib/wattaHeroVideo'

type WattaSushiRollHeroProps = {
  mobileIntro?: WattaHeroRollMobileIntroContent
}

export default function WattaSushiRollHero({ mobileIntro }: WattaSushiRollHeroProps) {
  const heroRef = useRef<HTMLElement>(null)
  const displayRolls = useMemo<WattaSushiRollData[]>(() => WATTA_HERO_ROLL_IMAGES, [])

  useEffect(() => {
    const signalReady = () => {
      try {
        document.documentElement.setAttribute('data-watta-hero-content-ready', '1')
      } catch {
        /* ignore */
      }
      window.dispatchEvent(new CustomEvent(WATTA_HERO_VIDEO_READY_EVENT))
    }
    requestAnimationFrame(() => {
      requestAnimationFrame(signalReady)
    })
  }, [])

  return (
    <section
      ref={heroRef}
      className="watta-sushi-roll-hero"
      aria-label="WATTA SUSHI"
      data-watta-roll-hero=""
    >
      <WattaSushiRollMarquee
        rolls={displayRolls}
        speed={getHeroRollMarqueeSpeed(displayRolls.length)}
        tilt={-4}
        middleSlot={<WattaHeroRollTitle mobileIntro={mobileIntro} />}
      />
    </section>
  )
}
