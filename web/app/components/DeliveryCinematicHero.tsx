'use client'

import { memo } from 'react'
import { m, useReducedMotion } from 'framer-motion'
import { Navigation, LucideIcon } from 'lucide-react'
import { MapPin } from '@/lib/wattaInlineIcons'
import { HERO_COPY_EASE } from './heroCopyMotion'

const ACCENT = '#FF5C00'

export type DeliveryCinematicHeroLabels = {
  kicker: string
  kickerScript: string
  subtitle: string
  foundedLabel: string
  foundedValue: string
  milestoneLabel: string
  milestoneValue: string
}

const lineReveal = (reduceMotion: boolean, delay: number) =>
  reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.55, ease: HERO_COPY_EASE, delay },
      }

function HeroGlassChip({
  icon: Icon,
  label,
  value,
  reduceMotion,
  delay,
}: {
  icon: LucideIcon
  label: string
  value: string
  reduceMotion: boolean
  delay: number
}) {
  return (
    <m.div
      className="delivery-page-hero-chip flex min-w-0 flex-1 flex-col gap-2 rounded-[20px] border border-white/20 bg-white/[0.09] px-4 py-3.5 text-left shadow-[0_8px_32px_rgba(0,0,0,0.18)] backdrop-blur-md sm:rounded-[22px] sm:px-5 sm:py-4"
      {...lineReveal(reduceMotion, delay)}
    >
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/12">
          <Icon className="h-4 w-4 text-white/90" strokeWidth={2.25} aria-hidden />
        </span>
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/55 sm:text-[11px]">
          {label}
        </span>
      </div>
      <p className="text-[clamp(1.05rem,4.2vw,1.35rem)] font-black leading-snug tracking-tight text-white">
        {value}
      </p>
    </m.div>
  )
}

function DeliveryCinematicHero({ labels: d }: { labels: DeliveryCinematicHeroLabels }) {
  const reduceMotion = useReducedMotion() ?? false

  return (
    <section
      className="delivery-page-hero-web delivery-page-hero-web--page-intro delivery-page-hero-web--cinematic delivery-page-hero-web--showcase relative overflow-hidden text-white"
      aria-labelledby="delivery-cinematic-hero-title"
    >
      <div className="delivery-page-hero-bg-layer pointer-events-none absolute inset-0" aria-hidden />
      <div
        className="delivery-page-hero-showcase-mesh pointer-events-none absolute inset-0"
        aria-hidden
      />
      <div className="delivery-page-hero-orb delivery-page-hero-orb--warm pointer-events-none absolute" aria-hidden />
      <div className="delivery-page-hero-orb delivery-page-hero-orb--mint pointer-events-none absolute" aria-hidden />

      <div className="delivery-page-hero-showcase-inner relative z-[4] mx-auto flex w-full max-w-3xl flex-col items-center px-4 pb-[calc(var(--watta-delivery-hero-wave-h,44px)+1.5rem)] pt-[clamp(2.5rem,7vh,4rem)] text-center max-[380px]:px-3 sm:px-6 sm:pb-[calc(var(--watta-delivery-hero-wave-h,48px)+2rem)] sm:pt-[clamp(2.75rem,7.5vh,4.5rem)]">
        <m.p
          className="delivery-page-hero-showcase-kicker mb-5 inline-flex max-w-full flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-full border border-white/15 bg-white/[0.08] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-white/80 backdrop-blur-sm sm:mb-6 sm:text-xs"
          {...lineReveal(reduceMotion, 0)}
        >
          <span className="text-white">{d.kicker}</span>
          <span className="text-white/35" aria-hidden>
            ·
          </span>
          <span className="font-medium normal-case tracking-normal text-white/70">{d.kickerScript}</span>
        </m.p>

        <m.h1
          id="delivery-cinematic-hero-title"
          className="delivery-page-hero-showcase-title w-full"
          {...lineReveal(reduceMotion, 0.08)}
        >
          <span className="block font-black lowercase leading-[0.88] tracking-tight text-white text-[clamp(2.75rem,14vw,5.5rem)]">
            watta
          </span>
          <span
            className="delivery-page-hero-showcase-sushi -mt-1 block font-black lowercase leading-[0.9] tracking-tight text-[clamp(2.75rem,14vw,5.5rem)]"
            style={{
              background: `linear-gradient(118deg, #fff4ec 0%, #ffaf6e 35%, ${ACCENT} 72%, #ffc090 100%)`,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            sushi
          </span>
        </m.h1>

        <m.p
          className="delivery-page-hero-sub mt-4 max-w-md text-balance text-[15px] font-medium leading-relaxed text-white/72 sm:mt-5 sm:max-w-lg sm:text-base md:text-lg"
          {...lineReveal(reduceMotion, 0.16)}
        >
          {d.subtitle}
        </m.p>

        <div className="delivery-page-hero-chip-row mt-6 flex w-full max-w-xl flex-col gap-3 sm:mt-8 sm:flex-row sm:gap-4">
          <HeroGlassChip
            icon={MapPin}
            label={d.foundedLabel}
            value={d.foundedValue}
            reduceMotion={reduceMotion}
            delay={0.24}
          />
          <HeroGlassChip
            icon={Navigation}
            label={d.milestoneLabel}
            value={d.milestoneValue}
            reduceMotion={reduceMotion}
            delay={0.32}
          />
        </div>
      </div>

      <div className="delivery-page-hero-wave pointer-events-none absolute inset-x-0 bottom-0 z-[5]" aria-hidden>
        <svg
          className="delivery-page-hero-wave__svg delivery-page-hero-wave__svg--back"
          viewBox="0 0 1440 56"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            className="delivery-page-hero-wave__path delivery-page-hero-wave__path--back"
            d="M0,14 C180,32 360,6 540,20 C720,34 900,10 1080,24 C1260,38 1380,16 1440,20 L1440,56 L0,56 Z"
          />
        </svg>
        <svg
          className="delivery-page-hero-wave__svg delivery-page-hero-wave__svg--front"
          viewBox="0 0 1440 56"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            className="delivery-page-hero-wave__path delivery-page-hero-wave__path--front"
            d="M0,10 C200,28 400,4 600,18 C800,32 1000,8 1200,22 C1320,34 1380,12 1440,16 L1440,56 L0,56 Z"
          />
        </svg>
      </div>
    </section>
  )
}

export default memo(DeliveryCinematicHero)
