'use client'

import { useWattaStaggerRevealCycle } from '@/lib/useWattaStaggerRevealCycle'
import {
  renderWattaStaggerRevealChars,
  WATTA_STAGGER_CHAR_DELAY,
} from './WattaStaggerRevealChars'

type FooterReadyAnimatedHeadProps = {
  kicker: string
  sub: string
  eyebrow: string
}

export function FooterReadyAnimatedHead({ kicker, sub, eyebrow }: FooterReadyAnimatedHeadProps) {
  const cycle = useWattaStaggerRevealCycle()
  const charIndex = { value: 0 }

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
