'use client'

import { m, useReducedMotion } from 'framer-motion'
import { Mail, Sparkles, LucideIcon } from 'lucide-react'
import { Phone } from '@/lib/wattaInlineIcons'
import AnimatedHeroIntroBlock from '../AnimatedHeroIntroBlock'
import { HERO_COPY_EASE } from '../heroCopyMotion'

type ProfilePageIntroProps = {
  sectionId?: string
  ariaLabel: string
  titleId?: string
  kicker?: string
  titleLines: string[]
  body: string
  email?: string
  phone?: string
  bonusLabel: string
  bonusValue: string
  stats: { label: string; value: string; icon: LucideIcon }[]
}

const statVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.38, ease: HERO_COPY_EASE },
  },
}

function ProfileStatChip({
  label,
  value,
  Icon,
  reduceMotion,
}: {
  label: string
  value: string
  Icon: LucideIcon
  reduceMotion: boolean
}) {
  if (reduceMotion) {
    return (
      <li className="watta-profile-stat-chip">
        <Icon className="watta-profile-stat-chip__ico" strokeWidth={2} aria-hidden />
        <span className="watta-profile-stat-chip__val">{value}</span>
        <span className="watta-profile-stat-chip__label">{label}</span>
      </li>
    )
  }

  return (
    <m.li className="watta-profile-stat-chip" variants={statVariants}>
      <m.span
        className="watta-profile-stat-chip__ico-wrap"
        initial={{ rotate: -14, scale: 0.65, opacity: 0 }}
        animate={{ rotate: 0, scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 22, delay: 0.05 }}
      >
        <Icon className="watta-profile-stat-chip__ico" strokeWidth={2} aria-hidden />
      </m.span>
      <span className="watta-profile-stat-chip__text">
        <span className="watta-profile-stat-chip__val">{value}</span>
        <span className="watta-profile-stat-chip__label">{label}</span>
      </span>
    </m.li>
  )
}

export default function ProfilePageIntro({
  sectionId = 'profile-page-lead-intro',
  ariaLabel,
  titleId,
  kicker,
  titleLines,
  body,
  email,
  phone,
  bonusLabel,
  bonusValue,
  stats,
}: ProfilePageIntroProps) {
  const reduceMotion = useReducedMotion() ?? false
  const statsDelay = 0.55

  const meta = (
    <div className="watta-profile-intro-meta">
      {email ? (
        <m.span
          className="watta-profile-intro-meta__chip"
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: HERO_COPY_EASE, delay: 0.42 }}
        >
          <Mail size={13} aria-hidden />
          <span className="min-w-0 truncate">{email}</span>
        </m.span>
      ) : null}
      {phone ? (
        <m.span
          className="watta-profile-intro-meta__chip"
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: HERO_COPY_EASE, delay: 0.48 }}
        >
          <Phone size={13} aria-hidden />
          <span className="min-w-0 truncate">{phone}</span>
        </m.span>
      ) : null}
      <m.span
        className="watta-profile-intro-meta__chip watta-profile-intro-meta__chip--bonus"
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: HERO_COPY_EASE, delay: 0.54 }}
      >
        <Sparkles size={13} aria-hidden />
        <span>
          {bonusLabel}: <strong className="tabular-nums">{bonusValue}</strong>
        </span>
      </m.span>
    </div>
  )

  const statsList = reduceMotion ? (
    <ul className="watta-profile-stat-chips" aria-label={ariaLabel}>
      {stats.map(({ label, value, icon: Icon }) => (
        <ProfileStatChip key={label} label={label} value={value} Icon={Icon} reduceMotion />
      ))}
    </ul>
  ) : (
    <m.ul
      className="watta-profile-stat-chips"
      aria-label={ariaLabel}
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.09, delayChildren: statsDelay } },
      }}
    >
      {stats.map(({ label, value, icon: Icon }) => (
        <ProfileStatChip key={label} label={label} value={value} Icon={Icon} reduceMotion={false} />
      ))}
    </m.ul>
  )

  return (
    <div className="watta-profile-page-intro">
      <AnimatedHeroIntroBlock
        sectionId={sectionId}
        ariaLabel={ariaLabel}
        titleId={titleId}
        kicker={kicker}
        reserveTopSpace
        titleLines={titleLines}
        body={body}
        accentLineIndex={1}
        scriptLineIndex={titleLines.length > 1 ? 1 : undefined}
        headingLevel="h1"
        innerClassName="home-after-hero-intro-inner-web home-after-hero-intro-inner-web--home-menu watta-profile-intro-inner relative z-[1] mx-auto max-w-7xl px-6 pb-2 sm:px-9 sm:pb-3 md:px-12 md:pb-4"
      >
        {meta}
      </AnimatedHeroIntroBlock>
      <div className="watta-profile-stat-chips-wrap mx-auto max-w-3xl px-6 sm:px-9 md:px-12">{statsList}</div>
    </div>
  )
}
