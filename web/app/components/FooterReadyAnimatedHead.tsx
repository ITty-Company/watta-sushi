'use client'

import { useLayoutEffect, useState } from 'react'
import { useWattaStaggerRevealCycle } from '@/lib/useWattaStaggerRevealCycle'
import { WATTA_PHONE_VIEWPORT_MQ } from '@/lib/wattaTouchViewport'
import {
  renderWattaStaggerRevealChars,
  WATTA_STAGGER_CHAR_DELAY,
} from './WattaStaggerRevealChars'

type FooterReadyAnimatedHeadProps = {
  kicker: string
  sub: string
  eyebrow: string
}

function usePhoneViewport(): boolean {
  const [phone, setPhone] = useState(false)

  useLayoutEffect(() => {
    const mq = window.matchMedia(WATTA_PHONE_VIEWPORT_MQ)
    const apply = () => setPhone(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  return phone
}

export function FooterReadyAnimatedHead({ kicker, sub, eyebrow }: FooterReadyAnimatedHeadProps) {
  const isPhone = usePhoneViewport()
  const cycle = useWattaStaggerRevealCycle(0, !isPhone)
  const charIndex = { value: 0 }

  if (isPhone) {
    return (
      <div className="footer-ready-head footer-ready-head--mobile" key={cycle}>
        <div className="footer-ready-title-stack">
          <h2 className="footer-ready-heading w-full min-w-0 text-center">
            <span
              className="footer-ready-display footer-ready-mobile-reveal-line"
              style={{ animationDelay: '0s' }}
            >
              {kicker}
            </span>
          </h2>
          <blockquote className="footer-ready-quote">
            <p
              className="footer-ready-lede footer-ready-mobile-reveal-line"
              style={{ animationDelay: '0.1s' }}
            >
              {sub}
            </p>
          </blockquote>
        </div>
        <p
          className="footer-ready-eyebrow footer-ready-mobile-reveal-line"
          style={{ animationDelay: '0.2s' }}
        >
          <span className="footer-ready-eyebrow-line footer-ready-reveal-line" aria-hidden />
          <span className="footer-ready-eyebrow-label">{eyebrow}</span>
          <span
            className="footer-ready-eyebrow-line footer-ready-eyebrow-line--end footer-ready-reveal-line"
            aria-hidden
          />
        </p>
      </div>
    )
  }

  const kickerChars = renderWattaStaggerRevealChars(kicker, 'footer-ready-reveal-char', charIndex)
  const subChars = renderWattaStaggerRevealChars(
    sub,
    'footer-ready-reveal-char footer-ready-reveal-char--lede',
    charIndex,
  )
  const eyebrowLineDelay = charIndex.value * WATTA_STAGGER_CHAR_DELAY
  const eyebrowChars = renderWattaStaggerRevealChars(
    eyebrow,
    'footer-ready-reveal-char footer-ready-reveal-char--eyebrow',
    charIndex,
  )

  return (
    <div className="footer-ready-head" key={cycle}>
      <div className="footer-ready-title-stack">
        <h2 className="footer-ready-heading w-full min-w-0 text-center">
          <span className="footer-ready-display">{kickerChars}</span>
        </h2>
        <blockquote className="footer-ready-quote">
          <p className="footer-ready-lede">{subChars}</p>
        </blockquote>
      </div>
      <p className="footer-ready-eyebrow">
        <span
          className="footer-ready-eyebrow-line footer-ready-reveal-line"
          aria-hidden
          style={{ animationDelay: `${eyebrowLineDelay}s` }}
        />
        <span className="footer-ready-eyebrow-label">{eyebrowChars}</span>
        <span
          className="footer-ready-eyebrow-line footer-ready-eyebrow-line--end footer-ready-reveal-line"
          aria-hidden
          style={{ animationDelay: `${eyebrowLineDelay}s` }}
        />
      </p>
    </div>
  )
}
