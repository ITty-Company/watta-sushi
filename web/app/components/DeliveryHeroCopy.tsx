'use client'

import { useMemo } from 'react'
import { m } from 'framer-motion'
import { Sparkles, Timer, Navigation, type LucideIcon } from 'lucide-react'
import { useWattaStaggerMotion } from '@/lib/wattaStaggerMotion'
import {
  WattaStaggerRevealGroup,
  estimateWattaStaggerEnterSec,
  renderStaggerBodyChars,
  renderStaggerTitleChars,
  type CharIndexRef,
  type WattaStaggerVariant,
} from './WattaStaggerRevealText'
import { HERO_COPY_EASE } from './heroCopyMotion'

type DeliveryHeroCopyProps = {
  /** Порожній рядок — лише курсивний слоган (напр. /menu без «WATTA»). */
  kicker?: string
  kickerScript: string
  headlineLead: string
  headlineMark: string
  sub: string
  statFresh: string
  statFast: string
  statCity: string
  /** Для `aria-labelledby` на сторінці /menu */
  titleId?: string
  /** Inline stat chips під текстом (вимкнути, якщо stats окремим блоком нижче). */
  showStats?: boolean
}

function StatChip({
  label,
  Icon,
  reduceMotion,
  variants,
}: {
  label: string
  Icon: LucideIcon
  reduceMotion: boolean
  variants: {
    hidden: { opacity: number; y: number; scale: number }
    show: { opacity: number; y: number; scale: number }
  }
}) {
  if (reduceMotion) {
    return (
      <li>
        <Icon className="delivery-hero-copy-home__stat-ico" strokeWidth={2} aria-hidden />
        {label}
      </li>
    )
  }

  return (
    <m.li variants={variants}>
      <m.span
        className="delivery-hero-copy-home__stat-ico-wrap"
        initial={{ rotate: -18, scale: 0.6, opacity: 0 }}
        animate={{ rotate: 0, scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 420, damping: 22, delay: 0.06 }}
      >
        <Icon className="delivery-hero-copy-home__stat-ico" strokeWidth={2} aria-hidden />
      </m.span>
      <m.span
        initial={{ opacity: 0, x: -4 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.32, ease: HERO_COPY_EASE, delay: 0.1 }}
      >
        {label}
      </m.span>
    </m.li>
  )
}

function DeliveryHeroCopyAnimated({
  kickerText,
  showKickerBrand,
  headlineLead,
  markText,
  showMark,
  scriptText,
  showScript,
  sub,
  titleId,
  showStats,
  statFresh,
  statFast,
  statCity,
  reduceMotion,
  enterSec,
  charDelay,
  bodyWordDelay,
}: {
  kickerText: string
  showKickerBrand: boolean
  headlineLead: string
  markText: string
  showMark: boolean
  scriptText: string
  showScript: boolean
  sub: string
  titleId?: string
  showStats: boolean
  statFresh: string
  statFast: string
  statCity: string
  reduceMotion: boolean
  enterSec: number
  charDelay: number
  bodyWordDelay: number
}) {
  const charIndex = useMemo<CharIndexRef>(() => ({ value: 0 }), [])

  const statVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.92 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.38, ease: HERO_COPY_EASE },
    },
  }

  const stats = [
    { label: statFresh, Icon: Sparkles },
    { label: statFast, Icon: Timer },
    { label: statCity, Icon: Navigation },
  ] as const

  const statsDelay = Math.max(0, enterSec - 0.35)

  return (
    <>
      {showKickerBrand ? (
        <p className="delivery-hero-copy-home__kicker delivery-hero-copy-home__kicker--brand-only">
          <span className="delivery-hero-copy-home__kicker-brand">
            {reduceMotion ? kickerText : renderStaggerTitleChars(kickerText, charIndex, 'catalog', charDelay)}
          </span>
        </p>
      ) : null}

      <h1
        id={titleId}
        className={`delivery-hero-copy-home__title delivery-hero-copy-home__title--stage${showMark ? '' : ' delivery-hero-copy-home__title--single-line'}`}
      >
        <span className="delivery-hero-copy-home__title-line">
          {reduceMotion
            ? headlineLead
            : renderStaggerTitleChars(headlineLead, charIndex, 'catalog', charDelay)}
        </span>
        {showMark ? (
          <>
            <span className="delivery-hero-copy-home__title-gap" aria-hidden="true">
              {' '}
            </span>
            <span className="delivery-hero-copy-home__title-line delivery-hero-copy-home__title-line--accent">
              {reduceMotion
                ? markText
                : renderStaggerTitleChars(markText, charIndex, 'catalog', charDelay)}
            </span>
          </>
        ) : null}
      </h1>

      {showScript ? (
        <p className="delivery-hero-copy-home__kicker delivery-hero-copy-home__kicker--script-after-title">
          <span
            className="delivery-hero-copy-home__script"
            style={{ fontFamily: 'var(--font-brand-marck), cursive' }}
          >
            {reduceMotion
              ? scriptText
              : renderStaggerTitleChars(scriptText, charIndex, 'catalog', charDelay)}
          </span>
        </p>
      ) : null}

      <p className="delivery-hero-copy-home__body delivery-hero-copy-home__body--stage">
        {reduceMotion
          ? sub
          : renderStaggerBodyChars(sub, charIndex, 'catalog', false, bodyWordDelay)}
      </p>

      {showStats ? (
        reduceMotion ? (
          <ul
            className="delivery-hero-copy-home__stats justify-center"
            aria-label={`${statFresh}, ${statFast}, ${statCity}`}
          >
            {stats.map(({ label, Icon }) => (
              <StatChip
                key={label}
                label={label}
                Icon={Icon}
                reduceMotion
                variants={statVariants}
              />
            ))}
          </ul>
        ) : (
          <m.ul
            className="delivery-hero-copy-home__stats justify-center"
            aria-label={`${statFresh}, ${statFast}, ${statCity}`}
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: {
                transition: { staggerChildren: 0.11, delayChildren: statsDelay },
              },
            }}
          >
            {stats.map(({ label, Icon }) => (
              <StatChip
                key={label}
                label={label}
                Icon={Icon}
                reduceMotion={false}
                variants={statVariants}
              />
            ))}
          </m.ul>
        )
      ) : null}
    </>
  )
}

export default function DeliveryHeroCopy({
  kicker,
  kickerScript,
  headlineLead,
  headlineMark,
  sub,
  statFresh,
  statFast,
  statCity,
  titleId,
  showStats = true,
}: DeliveryHeroCopyProps) {
  const motion = useWattaStaggerMotion()
  const kickerText = kicker?.trim() ?? ''
  const markText = headlineMark.trim()
  const scriptText = kickerScript.trim()
  const showKickerBrand = kickerText.length > 0
  const showMark = markText.length > 0
  const showScript = scriptText.length > 0

  const enterSec = useMemo(() => {
    if (!motion.enabled) return 0
    const texts: string[] = []
    const variants: WattaStaggerVariant[] = []
    if (showKickerBrand) {
      texts.push(kickerText)
      variants.push('kicker')
    }
    texts.push(headlineLead)
    variants.push('title')
    if (showMark) {
      texts.push(markText)
      variants.push('title')
    }
    if (showScript) {
      texts.push(scriptText)
      variants.push('script')
    }
    texts.push(sub)
    variants.push('body')
    return estimateWattaStaggerEnterSec(
      texts,
      variants,
      motion.charDelay,
      motion.bodyWordDelay,
    )
  }, [
    motion.bodyWordDelay,
    motion.charDelay,
    motion.enabled,
    showKickerBrand,
    kickerText,
    headlineLead,
    showMark,
    markText,
    showScript,
    scriptText,
    sub,
  ])

  return (
    <WattaStaggerRevealGroup
      as="header"
      enterSec={enterSec}
      replay={false}
      className="delivery-hero-copy-home delivery-hero-copy-home--stage mx-auto w-full max-w-4xl text-center"
    >
      <DeliveryHeroCopyAnimated
        kickerText={kickerText}
        showKickerBrand={showKickerBrand}
        headlineLead={headlineLead}
        markText={markText}
        showMark={showMark}
        scriptText={scriptText}
        showScript={showScript}
        sub={sub}
        titleId={titleId}
        showStats={showStats}
        statFresh={statFresh}
        statFast={statFast}
        statCity={statCity}
        reduceMotion={!motion.enabled}
        enterSec={enterSec}
        charDelay={motion.charDelay}
        bodyWordDelay={motion.bodyWordDelay}
      />
    </WattaStaggerRevealGroup>
  )
}
