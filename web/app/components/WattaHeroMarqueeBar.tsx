'use client'

import { useMemo } from 'react'
import { useLanguage } from '../context/LanguageContext'

function MarqueeRow({ phrases }: { phrases: string[] }) {
  if (phrases.length === 0) return null
  return (
    <div className="flex shrink-0 items-center whitespace-nowrap px-5 text-white sm:px-8">
      {phrases.map((phrase, i) => (
        <span key={`${phrase}-${i}`} className="inline-flex items-center">
          <span className="text-[9px] font-bold uppercase tracking-[0.22em] min-[400px]:text-[10px] min-[400px]:tracking-[0.28em] md:text-xs">
            {phrase}
          </span>
          <span className="mx-5 text-white/75 sm:mx-8 md:mx-10" aria-hidden>
            +
          </span>
        </span>
      ))}
    </div>
  )
}

/** Горизонтальна бігуча смуга на головній: одразу після welcome hero-відео, перед блоком рекомендацій. */
export default function WattaHeroMarqueeBar() {
  const { t } = useLanguage()
  const phrases = useMemo(
    () => t.cinematicFooter.heroMarquee.split('|').map((s) => s.trim()).filter(Boolean),
    [t.cinematicFooter.heroMarquee]
  )

  if (phrases.length === 0) return null

  return (
    <div
      className="watta-hero-marquee-bar relative z-[5] w-full overflow-hidden border-y border-white/20"
      role="presentation"
    >
      <div className="watta-hero-marquee-track flex w-max py-2.5 sm:py-3 md:py-3.5">
        <MarqueeRow phrases={phrases} />
        <MarqueeRow phrases={phrases} />
      </div>
    </div>
  )
}
