'use client'

import Image from 'next/image'
import { useInstantRouter } from '@/hooks/useInstantRouter'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import {
  ArrowLeft,
  Award,
  ChefHat,
  CircleDot,
  Fish,
  HandMetal,
  Heart,
  Layers,
  Menu,
  Milk,
  Rocket,
  Salad,
  Sparkles,
  Users,
  Wheat,
  Zap,
} from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import AnimatedHeroIntroBlock from './AnimatedHeroIntroBlock'
import { WattaStatPillsBand, type WattaStatPillItem } from './DeliveryPageStats'
import AboutTeamSection from './AboutTeamSection'
import type { PublicTeamMember } from '@/lib/teamMembers'
import { cn } from '@/lib/utils'

const ACCENT = '#FF5C00'
const BRAND_GREEN = '#145142'

function PhilosophySlideCard({
  icon: Icon,
  title,
  body,
  fade,
  delay,
  accentOrange = true,
}: {
  icon: LucideIcon
  title: string
  body: string
  fade:
    | { initial: false }
    | { initial: { opacity: number; y: number }; whileInView: { opacity: number; y: number } }
  delay: number
  accentOrange?: boolean
}) {
  return (
    <motion.article
      className={cn(
        'about-page-philosophy-card delivery-page-stat-card flex flex-col items-center rounded-[18px] p-3.5 text-center sm:rounded-[22px] sm:p-5',
        accentOrange ? 'delivery-page-stat-card--orange' : 'delivery-page-stat-card--green',
      )}
      {...fade}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.45, delay }}
      whileHover={fade.initial === false ? undefined : { y: -3 }}
    >
      <div className="delivery-page-stat-card__icon-wrap" aria-hidden>
        <div className="delivery-page-stat-card__icon-blob" />
        <Icon className="delivery-page-stat-card__icon" strokeWidth={1.35} />
      </div>
      <h3 className="delivery-page-stat-card__value mt-0 text-base sm:text-lg">{title}</h3>
      <p className="delivery-page-stat-card__label mt-2">{body}</p>
    </motion.article>
  )
}

function InsideCard({
  icon: Icon,
  title,
  body,
  fade,
  delay,
  accentIndex = 0,
}: {
  icon: LucideIcon
  title: string
  body: string
  fade:
    | { initial: false }
    | { initial: { opacity: number; y: number }; whileInView: { opacity: number; y: number } }
  delay: number
  accentIndex?: number
}) {
  const blobTints = [
    'rgba(255,92,0,0.32)',
    'rgba(20,81,66,0.28)',
    'rgba(255,140,60,0.3)',
    'rgba(26,107,88,0.25)',
    'rgba(255,180,140,0.45)',
    'rgba(255,92,0,0.22)',
  ]
  const blobTint = blobTints[accentIndex % blobTints.length]

  return (
    <motion.article
      className="about-page-inside-card group flex flex-col rounded-[22px] border border-gray-200/70 bg-white p-4 shadow-[0_8px_36px_rgba(20,81,66,0.07)] transition hover:-translate-y-0.5 hover:border-[#145142]/15 hover:shadow-[0_14px_44px_rgba(20,81,66,0.12)] sm:p-6"
      {...fade}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.45, delay }}
    >
      <div className="relative mb-4 flex h-[4rem] w-[4rem] shrink-0 items-center justify-center sm:mb-5 sm:h-[4.5rem] sm:w-[4.5rem]">
        <div
          className="absolute h-14 w-[4.25rem] -rotate-12 rounded-[45%_55%_50%_50%] opacity-95 transition group-hover:scale-105"
          style={{
            background: `linear-gradient(135deg, rgba(255,200,170,0.95) 0%, ${blobTint} 55%, rgba(246,249,247,0.5) 100%)`,
          }}
          aria-hidden
        />
        <Icon className="relative z-[1] h-8 w-8 text-gray-900 sm:h-9 sm:w-9" strokeWidth={1.35} />
      </div>
      <h3 className="text-lg font-black leading-tight text-gray-900 sm:text-xl">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-[#6b7280] sm:text-[15px]">{body}</p>
    </motion.article>
  )
}

function AboutStatPill({
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
    | { initial: false }
    | { initial: { opacity: number; y: number }; whileInView: { opacity: number; y: number } }
  delay: number
  accent?: boolean
}) {
  return (
    <motion.div
      className="about-page-stat-pill flex flex-col items-center justify-center rounded-2xl bg-white/10 px-2 py-3.5 text-center backdrop-blur-sm sm:rounded-[18px] sm:px-3 sm:py-4"
      {...fade}
      viewport={{ once: true, margin: '-30px' }}
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
    </motion.div>
  )
}

export type AboutPageViewProps = {
  embedded?: boolean
  onBack?: () => void
  onMenuClick?: () => void
}

function AboutPageView({ embedded = false, onBack, onMenuClick }: AboutPageViewProps) {
  const router = useInstantRouter()
  const { t, getLocalized } = useLanguage()
  const a = t.aboutPage
  const reduce = useReducedMotion()

  const [teamMembers, setTeamMembers] = useState<PublicTeamMember[]>([])
  const [teamReady, setTeamReady] = useState(false)

  const goBack = useCallback(() => {
    if (embedded && onBack) {
      onBack()
      return
    }
    if (typeof window !== 'undefined' && window.history.length > 1) router.back()
    else router.push('/')
  }, [embedded, onBack, router])

  useEffect(() => {
    let cancelled = false
    const load = () => {
      fetch('/api/team')
        .then((r) => r.json())
        .then((data) => {
          if (!cancelled) setTeamMembers(Array.isArray(data) ? data : [])
        })
        .catch(() => {})
        .finally(() => {
          if (!cancelled) setTeamReady(true)
        })
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const stats = useMemo<WattaStatPillItem[]>(
    () => [
      { icon: Users, value: '10K+', label: a.stats.clients },
      { icon: Award, value: '5+', label: a.stats.experience },
      { icon: Zap, value: a.features.fastTitle, label: '' },
      { icon: Heart, value: '100%', label: a.stats.quality },
    ],
    [a.stats, a.features.fastTitle],
  )

  const philosophySlides = useMemo(
    () => [
      { icon: CircleDot, title: a.slide1Title, body: a.slide1Body },
      { icon: Fish, title: a.slide2Title, body: a.slide2Body },
      { icon: ChefHat, title: a.slide3Title, body: a.slide3Body },
      { icon: HandMetal, title: a.slide5Title, body: a.slide5Body },
      { icon: Rocket, title: a.slide6Title, body: a.slide6Body },
    ],
    [a]
  )

  const insideSlides = useMemo(
    () => [
      { icon: Fish, title: a.inside1Title, body: a.inside1Body },
      { icon: Wheat, title: a.inside2Title, body: a.inside2Body },
      { icon: Salad, title: a.inside3Title, body: a.inside3Body },
      { icon: Layers, title: a.inside4Title, body: a.inside4Body },
      { icon: Milk, title: a.inside5Title, body: a.inside5Body },
      { icon: Sparkles, title: a.inside6Title, body: a.inside6Body },
    ],
    [a]
  )

  const fade = reduce
    ? ({ initial: false as const } satisfies { initial: false })
    : ({
        initial: { opacity: 0, y: 26 },
        whileInView: { opacity: 1, y: 0 },
      } as const)

  const aboutPageLeadIntro = (
    <AnimatedHeroIntroBlock
      sectionId="about-page-lead-intro"
      ariaLabel={`${a.philosophyTitlePart1} ${a.philosophyTitlePart2}`}
      titleId="about-page-lead-title"
      titleLines={[a.philosophyTitlePart1, a.philosophyTitlePart2]}
      body={a.darkHeroSubtitle}
      accentLineIndex={1}
      headingLevel="h1"
      reserveTopSpace
      innerClassName="home-after-hero-intro-inner-web home-after-hero-intro-inner-web--home-menu delivery-page-intro-inner-web--standalone about-page-lead-intro-inner relative z-[1] mx-auto w-full max-w-6xl px-4 pb-3 text-center sm:px-6 sm:pb-4 md:pb-5"
    />
  )

  const aboutIntroBand = (
    <div className="about-page-intro-band w-full shrink-0 bg-transparent">
      {aboutPageLeadIntro}
      <WattaStatPillsBand
        items={stats}
        className="about-page-hero-stats"
        accentPattern="delivery"
      />
    </div>
  )

  const aboutMainContent = (
    <>
      {embedded ? (
        <header className="sticky top-0 z-40 border-b border-gray-200/80 bg-white/90 px-4 py-3 backdrop-blur-xl sm:px-6">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={goBack}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-800 shadow-sm transition hover:bg-gray-50"
                aria-label={t.auth.back}
              >
                <ArrowLeft size={22} />
              </button>
              <div className="min-w-0">
                <p className="truncate text-[10px] font-bold uppercase tracking-[0.25em] text-gray-500">{a.heroKicker}</p>
                <h1 className="truncate text-lg font-black text-gray-900 sm:text-xl">{a.title}</h1>
              </div>
            </div>
            {onMenuClick ? (
              <button
                type="button"
                onClick={onMenuClick}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-800 shadow-sm transition hover:bg-gray-50"
                aria-label={t.menu}
              >
                <Menu size={22} />
              </button>
            ) : null}
          </div>
        </header>
      ) : null}

      {embedded ? (
      <section
        className="about-page-hero-web relative overflow-hidden text-white"
        style={{
          background:
            'linear-gradient(165deg, #0c3028 0%, #145142 38%, #1a6b58 72%, #145142 100%)',
        }}
        aria-labelledby="about-dark-hero-title"
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

        <div
          className={cn(
            'about-page-hero-grid relative z-[1] mx-auto grid max-w-6xl gap-8 px-4 max-[380px]:px-3 sm:gap-10 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:gap-16',
            embedded
              ? 'py-12 sm:py-20'
              : 'pb-12 pt-8 sm:pb-20 sm:pt-10 lg:pt-12',
          )}
        >
          <div className="min-w-0">
            <h2
              id="about-dark-hero-title"
              className="about-page-hero-wordmark font-black lowercase leading-[0.95] tracking-tight text-white"
              style={{
                fontFamily: 'var(--font-inter, ui-sans-serif), system-ui, sans-serif',
              }}
            >
              watta sushi
            </h2>
            <p className="mt-4 max-w-xl text-balance text-[15px] leading-relaxed text-white/75 sm:mt-6 sm:text-base md:text-lg">
              {a.darkHeroSubtitle}
            </p>
          </div>
          <div className="about-page-hero-milestone flex min-w-0 flex-col gap-1 text-left lg:items-end lg:text-right">
            <p className="text-xs font-medium text-white/55 sm:text-sm md:text-base">{a.darkFoundedLabel}</p>
            <p className="text-[clamp(1.5rem,6.5vw,2.75rem)] font-black leading-tight tracking-tight break-words">
              {a.darkFoundedYearCity}
            </p>
            <p className="mt-5 text-xs font-medium text-white/55 sm:mt-8 sm:text-sm md:text-base">{a.darkMilestoneLine1}</p>
            <p className="max-w-sm text-balance text-lg font-bold leading-snug text-white sm:text-xl lg:ml-auto lg:text-right">
              {a.darkMilestoneLine2}
            </p>
          </div>
        </div>
      </section>
      ) : null}

      <section
        className="about-page-section-web relative z-10 w-full watta-page-bg px-4 py-10 sm:px-6 sm:py-16 md:py-20"
        aria-labelledby="about-philosophy-heading"
      >
        <div className="mx-auto max-w-6xl">
        {embedded ? (
        <motion.div
          className="about-page-philosophy-heading-wrap mb-8 flex justify-center sm:mb-12 md:mb-16"
          {...fade}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2
            id="about-philosophy-heading"
            className="about-page-philosophy-heading inline-flex max-w-full flex-wrap items-center justify-center gap-2 text-center text-[clamp(1.75rem,7.5vw,3.75rem)] font-black leading-[1.08] tracking-tight text-gray-900 sm:gap-3"
          >
            <span>{a.philosophyTitlePart1}</span>{' '}
            <span className="inline-flex items-center gap-2 whitespace-nowrap sm:gap-3">
              <span style={{ color: ACCENT }}>{a.philosophyTitlePart2}</span>
              <span
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-lg shadow-rose-500/25 sm:h-14 sm:w-14"
                aria-hidden
              >
                <Heart className="h-5 w-5 fill-white sm:h-7 sm:w-7" strokeWidth={1.5} />
              </span>
            </span>
          </h2>
        </motion.div>
        ) : (
          <motion.div
            className="about-page-why-heading-wrap mb-8 flex w-full justify-center sm:mb-10 md:mb-12"
            {...fade}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2
              id="about-philosophy-heading"
              className="about-page-why-heading contact-watta-section-title text-center"
            >
              {a.whyUs}
            </h2>
          </motion.div>
        )}

        <div className="delivery-page-stats-grid grid gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3 lg:gap-4">
          {philosophySlides.map((slide, i) => (
            <PhilosophySlideCard
              key={slide.title}
              icon={slide.icon}
              title={slide.title}
              body={slide.body}
              fade={fade}
              delay={i * 0.05}
              accentOrange={i % 2 === 0}
            />
          ))}
        </div>
        </div>
      </section>

      {/* Арт-блок + «плаваюче» зображення */}
      <section className="about-page-art-web relative z-10 watta-page-bg">
        <div className="mx-auto grid max-w-6xl items-center gap-6 px-4 pb-2 pt-8 sm:gap-8 sm:px-6 sm:pb-4 sm:pt-12 md:pt-14 lg:grid-cols-[1fr_0.9fr] lg:gap-14 lg:pb-6">
          <motion.div {...fade} viewport={{ once: true }} transition={{ duration: 0.5 }}>
            <p className="text-2xl font-black leading-[1.12] tracking-tight text-balance text-gray-900 sm:text-3xl md:text-[2.75rem] lg:text-5xl">
              {a.artHeadlineLine1}
              <br />
              {a.artHeadlineLine2}{' '}
              <span style={{ color: ACCENT }} className="sm:whitespace-nowrap">
                {a.artHeadlineAccent}
              </span>
            </p>
          </motion.div>
          <motion.div
            className="relative flex justify-center lg:justify-end"
            {...fade}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.08 }}
          >
            <div
              className="relative w-full max-w-[min(100%,380px)]"
              style={{ filter: 'drop-shadow(0 36px 48px rgba(0,0,0,0.18))' }}
            >
              <Image
                src="/logo.png"
                alt=""
                width={380}
                height={380}
                className="h-auto w-full object-contain"
                priority
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Що всередині + статистика + історія + команда + контакти — єдиний потік без роздільників */}
      <div className="about-page-lower-flow relative z-10 watta-page-bg">
        <section
          className="about-page-inside-web relative px-4 pt-1 pb-8 sm:px-6 sm:pt-2 sm:pb-12"
          aria-labelledby="about-inside-heading"
        >
          <div className="about-page-inside-shell mx-auto max-w-6xl rounded-[28px] bg-gradient-to-b from-[#f6f9f7] via-[#f6f9f7] to-white px-3 py-6 sm:rounded-[32px] sm:px-5 sm:py-8 md:py-10">
            <motion.div
              className="mb-6 text-center sm:mb-8"
              {...fade}
              viewport={{ once: true }}
              transition={{ duration: 0.45 }}
            >
              <h2
                id="about-inside-heading"
                className="text-[clamp(1.45rem,5.5vw,2.35rem)] font-black leading-tight tracking-tight text-gray-900"
              >
                {a.insideSectionTitle}
              </h2>
              <span
                className="mx-auto mt-3 block h-1 w-12 rounded-full"
                style={{ background: `linear-gradient(90deg, ${ACCENT}, #145142)` }}
                aria-hidden
              />
            </motion.div>

            <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
              {insideSlides.map((item, i) => (
                <InsideCard
                  key={item.title}
                  icon={item.icon}
                  title={item.title}
                  body={item.body}
                  fade={fade}
                  delay={i * 0.05}
                  accentIndex={i}
                />
              ))}
            </div>

            {embedded ? (
              <div
                className="about-page-stats-band mt-6 grid grid-cols-2 gap-2 rounded-[22px] p-3 sm:mt-8 sm:grid-cols-4 sm:gap-3 sm:rounded-[26px] sm:p-4 md:p-5"
                style={{
                  background: 'linear-gradient(135deg, #0c3028 0%, #145142 48%, #1a6b58 100%)',
                  boxShadow: '0 16px 48px rgba(20, 81, 66, 0.22)',
                }}
              >
                {stats.map((s, i) => (
                  <AboutStatPill
                    key={s.label}
                    icon={s.icon}
                    value={s.value}
                    label={s.label}
                    fade={fade}
                    delay={0.15 + i * 0.04}
                    accent={i % 2 === 0}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </section>

        <section className="about-page-story-web px-4 pb-6 sm:px-6 sm:pb-8">
          <motion.div
            className="about-page-story-card mx-auto max-w-6xl rounded-[24px] border border-[#145142]/10 bg-white p-5 shadow-[0_10px_40px_rgba(20,81,66,0.08)] sm:rounded-[28px] sm:p-8 md:p-10"
            {...fade}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="text-[clamp(1.35rem,5vw,2rem)] font-black leading-tight text-gray-900">
              <span className="mr-2 inline-block h-8 w-1.5 rounded-full align-middle sm:h-9" style={{ background: ACCENT }} aria-hidden />
              {a.storyTitle}
            </h3>
            <div className="mt-5 max-w-3xl space-y-4 text-[15px] leading-relaxed text-gray-600 sm:mt-6 sm:space-y-5 sm:text-base">
              <p className="font-semibold text-gray-900">{a.storyLead}</p>
              <p>{a.storyP2}</p>
              <p>{a.storyP3}</p>
            </div>
          </motion.div>
        </section>

        <AboutTeamSection teamMembers={teamMembers} teamReady={teamReady} fade={fade} />
      </div>
    </>
  )

  if (embedded) {
    return (
      <div
        id="about-page-container"
        className="about-page-web delivery-page-web relative min-h-screen w-full min-w-0 overflow-x-hidden watta-page-bg pb-16"
      >
        {aboutMainContent}
      </div>
    )
  }

  return (
    <div
      id="about-page-container"
      className="menu-page-web delivery-page-web contact-page-web watta-about-page watta-delivery-page watta-delivery-page-about about-page-web relative flex w-full max-w-[100vw] min-w-0 flex-1 flex-col overflow-x-hidden bg-white pb-24"
    >
      <div className="delivery-page-home-flow w-full">
        {aboutIntroBand}
        <div className="about-page-content-flow w-full">{aboutMainContent}</div>
      </div>
    </div>
  )
}

export default memo(AboutPageView)
