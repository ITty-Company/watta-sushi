'use client'

import { useMemo } from 'react'
import { useLanguage } from '../context/LanguageContext'

const MARQUEE_LOOP_COPIES = 3

function MarqueeRow({ phrases }: { phrases: string[] }) {
  const loopPhrases = useMemo(
    () =>
      Array.from({ length: MARQUEE_LOOP_COPIES }, () => phrases)
        .flat()
        .filter(Boolean),
    [phrases],
  )

  if (loopPhrases.length === 0) return null

  return (
    <div className="flex shrink-0 items-center whitespace-nowrap" aria-hidden>
      {loopPhrases.map((phrase, i) => (
        <span
          key={`${phrase}-${i}`}
          className="inline-flex shrink-0 items-center gap-x-2 sm:gap-x-2.5"
        >
          <span className="watta-hero-marquee-phrase text-[11px] font-bold uppercase tracking-[0.1em] text-white min-[400px]:text-xs min-[480px]:text-[13px] sm:text-sm sm:tracking-[0.11em]">
            {phrase}
          </span>
          <span
            className="watta-hero-marquee-sep text-[11px] font-semibold text-white/85 min-[400px]:text-xs min-[480px]:text-[13px] sm:text-sm"
            aria-hidden
          >
            +
          </span>
        </span>
      ))}
    </div>
  )
}

/** Горизонтальна бігуча смуга на головній: без пауз між циклами, щільніші інтервали. */
export default function WattaHeroMarqueeBar() {
  const { t } = useLanguage()
  const phrases = useMemo(
    () => t.cinematicFooter.heroMarquee.split('|').map((s) => s.trim()).filter(Boolean),
    [t.cinematicFooter.heroMarquee],
  )

  if (phrases.length === 0) return null

  return (
    <div
      className="watta-hero-marquee-bar relative z-[5] w-full overflow-hidden border-y border-white/20"
      role="presentation"
    >
      <div className="watta-hero-marquee-track flex w-max items-center">
        <MarqueeRow phrases={phrases} />
        <MarqueeRow phrases={phrases} />
      </div>
    </div>
  )
}
