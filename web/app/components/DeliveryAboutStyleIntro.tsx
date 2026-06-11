'use client'

import { memo, useMemo } from 'react'
import { m } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { MessagesSquare, Snowflake, Truck, UtensilsCrossed } from 'lucide-react'
import { MapPin } from '@/lib/wattaInlineIcons'
import {
  WATTA_IN_VIEW_FADE_VIEWPORT,
  useWattaDisableScrollReveal,
  wattaInViewFadeViewport,
} from './WattaInViewFade'

const ACCENT = '#FF5C00'
const HERO_BG =
  'linear-gradient(165deg, #0c3028 0%, #145142 38%, #1a6b58 72%, #145142 100%)'

type DeliveryLabels = {
  headlineLead: string
  headlineMark: string
  sub: string
  statFresh: string
  statFast: string
  statCity: string
  statCardColdValue: string
  statCardColdLabel: string
  statCardOrderValue: string
  statCardOrderLabel: string
  statCardPriceValue: string
  statCardPriceLabel: string
  statCardChannelsValue: string
  statCardChannelsLabel: string
}


function FeatureCard({
  icon: Icon,
  title,
  body,
  fade,
  delay,
}: {
  icon: LucideIcon
  title: string
  body: string
  fade:
    | { initial: false; animate: { opacity: number; y: number } }
    | { initial: { opacity: number; y: number }; whileInView: { opacity: number; y: number } }
  delay: number
}) {
  return (
    <m.article
      className="flex flex-col rounded-[22px] border border-gray-200/80 bg-white p-4 shadow-[0_8px_40px_rgba(0,0,0,0.06)] transition hover:shadow-[0_16px_48px_rgba(0,0,0,0.08)] sm:p-6"
      {...fade}
      viewport={wattaInViewFadeViewport('-40px')}
      transition={{ duration: 0.45, delay }}
    >
      <div className="relative mb-5 flex h-[4.5rem] w-[4.5rem] shrink-0 items-center justify-center">
        <div
          className="absolute h-16 w-20 -rotate-12 rounded-[45%_55%_50%_50%] opacity-90"
          style={{
            background: `linear-gradient(135deg, rgba(255,180,140,0.95) 0%, rgba(255,92,0,0.25) 55%, rgba(255,200,170,0.4) 100%)`,
          }}
          aria-hidden
        />
        <Icon className="relative z-[1] h-9 w-9 text-gray-900" strokeWidth={1.35} />
      </div>
      <h3 className="text-lg font-black leading-tight text-gray-900 sm:text-xl">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-[#7a7a7a] sm:text-[15px]">{body}</p>
    </m.article>
  )
}

function StatPill({
  icon: Icon,
  value,
  label,
  fade,
  delay,
  accent,
}: {
  icon: LucideIcon
  value: string
  label: string
  fade:
    | { initial: false; animate: { opacity: number; y: number } }
    | { initial: { opacity: number; y: number }; whileInView: { opacity: number; y: number } }
  delay: number
  accent?: boolean
}) {
  return (
    <m.div
      className="about-page-stat-pill flex flex-col items-center justify-center rounded-2xl bg-white/10 px-2 py-3.5 text-center backdrop-blur-sm sm:rounded-[18px] sm:px-3 sm:py-4"
      {...fade}
      viewport={wattaInViewFadeViewport('-30px')}
      transition={{ duration: 0.4, delay }}
    >
      <Icon
        className="mb-1.5 h-5 w-5 text-white/90 sm:mb-2 sm:h-6 sm:w-6"
        strokeWidth={2}
        style={accent ? { color: ACCENT } : undefined}
      />
      <div
        className="text-xl font-black leading-none text-white sm:text-2xl md:text-[1.65rem]"
        style={accent ? { color: ACCENT } : undefined}
      >
        {value}
      </div>
      <div className="mt-1.5 text-[10px] font-semibold leading-snug text-white/75 sm:text-xs">{label}</div>
    </m.div>
  )
}

function DeliveryAboutStyleIntro({
  d,
  skipHero = false,
  skipLowerFlow = false,
  skipHeading = false,
}: {
  d: DeliveryLabels
  skipHero?: boolean
  /** Без дубля «inside» + зеленої stats-стрічки (коли зверху вже є hero + stat-картки). */
  skipLowerFlow?: boolean
  /** Заголовок «Доставка · …» уже над відео. */
  skipHeading?: boolean
}) {
  const reduce = useWattaDisableScrollReveal()

  const fade = reduce
    ? ({ initial: false as const, animate: { opacity: 1, y: 0 } })
    : ({
        initial: { opacity: 0, y: 26 },
        whileInView: { opacity: 1, y: 0 },
      } as const)

  const features = useMemo(
    () => [
      { icon: Snowflake, title: d.statCardColdValue, body: d.statCardColdLabel },
      { icon: UtensilsCrossed, title: d.statCardOrderValue, body: d.statCardOrderLabel },
      { icon: MapPin, title: d.statCardPriceValue, body: d.statCardPriceLabel },
      { icon: MessagesSquare, title: d.statCardChannelsValue, body: d.statCardChannelsLabel },
    ],
    [d],
  )

  const heroStats = useMemo(
    () => [
      { icon: Snowflake, value: d.statCardColdValue, label: d.statCardColdLabel, accent: true },
      { icon: UtensilsCrossed, value: d.statCardOrderValue, label: d.statCardOrderLabel, accent: false },
      { icon: MapPin, value: d.statCardPriceValue, label: d.statCardPriceLabel, accent: true },
      { icon: MessagesSquare, value: d.statCardChannelsValue, label: d.statCardChannelsLabel, accent: false },
    ],
    [d],
  )

  const highlights = useMemo(
    () => [
      { icon: Truck, title: d.statFresh, body: d.sub },
      { icon: MapPin, title: d.statFast, body: d.statCity },
      { icon: MessagesSquare, title: d.statCardChannelsValue, body: d.statCardChannelsLabel },
    ],
    [d],
  )

  return (
    <>
      {!skipHero && (
      <section
        className="about-page-hero-web relative overflow-hidden text-white"
        style={{ background: HERO_BG }}
        aria-labelledby="delivery-about-hero-title"
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.4]"
          style={{
            background: `repeating-linear-gradient(
              -32deg,
              transparent,
              transparent 14px,
              rgba(255, 255, 255, 0.04) 14px,
              rgba(255, 255, 255, 0.04) 15px
            )`,
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-[20%] top-1/2 h-[min(80vw,520px)] w-[min(80vw,520px)] -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,92,0,0.14)_0%,transparent_68%)]"
          aria-hidden
        />

        <div className="relative z-[1] mx-auto max-w-3xl px-4 pb-12 pt-8 text-center max-[380px]:px-3 sm:px-6 sm:pb-20 sm:pt-10 lg:pt-12">
          <h1
            id="delivery-about-hero-title"
            className="about-page-hero-wordmark font-black lowercase leading-[0.95] tracking-tight text-white"
            style={{ fontFamily: 'var(--font-inter, ui-sans-serif), system-ui, sans-serif' }}
          >
            watta sushi
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-balance text-[15px] leading-relaxed text-white/75 sm:mt-6 sm:text-base md:text-lg">
            {d.sub}
          </p>
        </div>
      </section>
      )}

      <section
        className={`about-page-section-web relative z-10 w-full watta-page-bg px-4 sm:px-6 sm:py-16 md:py-20${skipHeading ? ' py-8 sm:py-12' : ' py-10'}`}
        aria-labelledby={skipHeading ? undefined : 'delivery-about-features-heading'}
        aria-label={skipHeading ? d.headlineLead : undefined}
      >
        <div className="mx-auto max-w-6xl">
          {!skipHeading && (
            <m.div
              className="about-page-philosophy-heading-wrap mb-8 flex justify-center sm:mb-12 md:mb-16"
              {...fade}
              viewport={WATTA_IN_VIEW_FADE_VIEWPORT}
              transition={{ duration: 0.5 }}
            >
              <h2
                id="delivery-about-features-heading"
                className="about-page-philosophy-heading inline-flex max-w-full flex-wrap items-center justify-center gap-2 text-center text-[clamp(1.75rem,7.5vw,3.75rem)] font-black leading-[1.08] tracking-tight text-gray-900 sm:gap-3"
              >
                <span>{d.headlineLead}</span>{' '}
                <span className="inline-flex items-center gap-2 whitespace-nowrap sm:gap-3">
                  <span style={{ color: ACCENT }}>{d.headlineMark}</span>
                  <span
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#145142] to-[#1a6b58] text-white shadow-lg shadow-[#145142]/25 sm:h-14 sm:w-14"
                    aria-hidden
                  >
                    <Truck className="h-5 w-5 sm:h-7 sm:w-7" strokeWidth={1.5} />
                  </span>
                </span>
              </h2>
            </m.div>
          )}

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {features.map((item, i) => (
              <FeatureCard
                key={item.title}
                icon={item.icon}
                title={item.title}
                body={item.body}
                fade={fade}
                delay={i * 0.05}
              />
            ))}
          </div>
        </div>
      </section>

      {!skipLowerFlow && (
      <div className="about-page-lower-flow relative z-10 watta-page-bg">
        <section className="about-page-inside-web relative px-4 pt-1 pb-6 sm:px-6 sm:pt-2 sm:pb-8">
          <div className="about-page-inside-shell mx-auto max-w-6xl rounded-[28px] bg-gradient-to-b from-[#f6f9f7] via-[#f6f9f7] to-white px-3 py-6 sm:rounded-[32px] sm:px-5 sm:py-8 md:py-10">
            <m.div
              className="mb-6 text-center sm:mb-8"
              {...fade}
              viewport={WATTA_IN_VIEW_FADE_VIEWPORT}
              transition={{ duration: 0.45 }}
            >
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[#145142]/70 sm:text-xs">
                Watta Sushi
              </p>
              <h2 className="text-[clamp(1.35rem,5vw,2rem)] font-black leading-tight tracking-tight text-gray-900">
                {d.statFresh} · {d.statFast} · {d.statCity}
              </h2>
              <span
                className="mx-auto mt-3 block h-1 w-12 rounded-full"
                style={{ background: `linear-gradient(90deg, ${ACCENT}, #145142)` }}
                aria-hidden
              />
            </m.div>

            <div className="grid gap-4 sm:grid-cols-3 sm:gap-5">
              {highlights.map((item, i) => (
                <FeatureCard
                  key={item.title}
                  icon={item.icon}
                  title={item.title}
                  body={item.body}
                  fade={fade}
                  delay={i * 0.05}
                />
              ))}
            </div>

            <div
              className="about-page-stats-band mt-6 grid grid-cols-2 gap-2 rounded-[22px] p-3 sm:mt-8 sm:grid-cols-4 sm:gap-3 sm:rounded-[26px] sm:p-4 md:p-5"
              style={{
                background: 'linear-gradient(135deg, #0c3028 0%, #145142 48%, #1a6b58 100%)',
                boxShadow: '0 16px 48px rgba(20, 81, 66, 0.22)',
              }}
            >
              {heroStats.map((s, i) => (
                <StatPill
                  key={s.label}
                  icon={s.icon}
                  value={s.value}
                  label={s.label}
                  fade={fade}
                  delay={0.15 + i * 0.04}
                  accent={s.accent}
                />
              ))}
            </div>
          </div>
        </section>
      </div>
      )}
    </>
  )
}

export default memo(DeliveryAboutStyleIntro)
