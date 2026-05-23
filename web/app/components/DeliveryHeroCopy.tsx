'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { Sparkles, Timer, Navigation, type LucideIcon } from 'lucide-react'
import {
  AnimatedWords,
  HERO_COPY_EASE,
  HERO_COPY_TYPE_MS,
  TypewriterBrand,
  splitHeroWords,
} from './heroCopyMotion'

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
    <motion.li variants={variants}>
      <motion.span
        className="delivery-hero-copy-home__stat-ico-wrap"
        initial={{ rotate: -18, scale: 0.6, opacity: 0 }}
        animate={{ rotate: 0, scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 420, damping: 22, delay: 0.06 }}
      >
        <Icon className="delivery-hero-copy-home__stat-ico" strokeWidth={2} aria-hidden />
      </motion.span>
      <motion.span
        initial={{ opacity: 0, x: -4 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.32, ease: HERO_COPY_EASE, delay: 0.1 }}
      >
        {label}
      </motion.span>
    </motion.li>
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
}: DeliveryHeroCopyProps) {
  const reduceMotion = useReducedMotion() ?? false
  const kickerText = kicker?.trim() ?? ''
  const showKickerBrand = kickerText.length > 0

  const kickerDoneMs =
    reduceMotion || !showKickerBrand ? 0 : kickerText.length * HERO_COPY_TYPE_MS + 80
  const headlineDelay = showKickerBrand
    ? kickerDoneMs / 1000 + 0.22
    : reduceMotion
      ? 0
      : 0.08
  const markDelay =
    headlineDelay + splitHeroWords(headlineLead).length * 0.055 + 0.12
  const scriptDelay =
    markDelay + splitHeroWords(headlineMark).length * 0.055 + 0.1
  const bodyDelay = scriptDelay + 0.14
  const statsDelay = bodyDelay + splitHeroWords(sub).length * 0.028 + 0.2

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

  return (
    <header className="delivery-hero-copy-home delivery-hero-copy-home--stage mx-auto w-full max-w-4xl text-center">
      {showKickerBrand ? (
        <p className="delivery-hero-copy-home__kicker delivery-hero-copy-home__kicker--brand-only">
          <TypewriterBrand
            text={kickerText}
            reduceMotion={reduceMotion}
            className="delivery-hero-copy-home__kicker-brand"
          />
        </p>
      ) : null}

      <h1
        id={titleId}
        className="delivery-hero-copy-home__title delivery-hero-copy-home__title--stage"
      >
        <span className="delivery-hero-copy-home__title-line">
          <AnimatedWords
            text={headlineLead}
            reduceMotion={reduceMotion}
            delay={headlineDelay}
            stagger={0.07}
          />
        </span>
        <span className="delivery-hero-copy-home__title-line delivery-hero-copy-home__title-line--accent">
          <AnimatedWords
            text={headlineMark}
            reduceMotion={reduceMotion}
            delay={markDelay}
            stagger={0.07}
          />
        </span>
      </h1>

      <p className="delivery-hero-copy-home__kicker delivery-hero-copy-home__kicker--script-after-title">
        <motion.span
          className="delivery-hero-copy-home__script"
          style={{ fontFamily: 'var(--font-brand-marck), cursive' }}
          initial={reduceMotion ? false : { opacity: 0, y: 14, rotate: -2, filter: 'blur(4px)' }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0, rotate: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.65, ease: HERO_COPY_EASE, delay: scriptDelay }}
        >
          {kickerScript}
        </motion.span>
      </p>

      <p className="delivery-hero-copy-home__body delivery-hero-copy-home__body--stage">
        <AnimatedWords
          text={sub}
          reduceMotion={reduceMotion}
          delay={bodyDelay}
          stagger={0.028}
        />
      </p>

      {reduceMotion ? (
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
        <motion.ul
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
        </motion.ul>
      )}
    </header>
  )
}
