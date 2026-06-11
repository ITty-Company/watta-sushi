'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { m, type Variants } from 'framer-motion'
import { ArrowUpRight, Instagram, Smartphone, LucideIcon } from 'lucide-react'
import { Phone } from '@/lib/wattaInlineIcons'
import { WATTA_INSTAGRAM_URL, WATTA_PHONE_E164 } from '@/lib/wattaSiteDefaults'
import { cn } from '@/lib/utils'
import { WATTA_IN_VIEW_FADE_VIEWPORT, useWattaDisableScrollReveal } from './WattaInViewFade'
import { WattaStaggerSectionTitle } from './WattaStaggerSectionTitle'
import DeliveryHowChannelVisual, {
  formatPhoneDisplay,
  instagramHandleFromUrl,
  type DeliveryHowChannelId,
} from './DeliveryHowChannelVisual'

export type DeliveryExperienceLabels = {
  howTitle: string
  stepWeb: string
  stepApp: string
  stepPhone: string
  stepWebDesc: string
  stepAppDesc: string
  stepPhoneDesc: string
}

const easeOut = [0.22, 1, 0.36, 1] as const

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: easeOut },
  },
}

const stagger: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.04 },
  },
}

const howSteps: {
  id: DeliveryHowChannelId
  labelKey: keyof Pick<
    DeliveryExperienceLabels,
    'stepWeb' | 'stepApp' | 'stepPhone'
  >
  descKey: keyof Pick<
    DeliveryExperienceLabels,
    'stepWebDesc' | 'stepAppDesc' | 'stepPhoneDesc'
  >
  Icon: LucideIcon
  href: string | 'instagram' | 'phone'
  external: boolean
}[] = [
  {
    id: 'web',
    labelKey: 'stepWeb',
    descKey: 'stepWebDesc',
    Icon: Smartphone,
    href: '/menu',
    external: false,
  },
  {
    id: 'instagram',
    labelKey: 'stepApp',
    descKey: 'stepAppDesc',
    Icon: Instagram,
    href: 'instagram',
    external: true,
  },
  {
    id: 'phone',
    labelKey: 'stepPhone',
    descKey: 'stepPhoneDesc',
    Icon: Phone,
    href: 'phone',
    external: true,
  },
]

const viewport = { ...WATTA_IN_VIEW_FADE_VIEWPORT, amount: 0.15 } as const

function DeliveryHowChannelsList({
  d,
  reduceMotion,
  instagramUrl,
  instagramHandle,
}: {
  d: DeliveryExperienceLabels
  reduceMotion: boolean
  instagramUrl: string
  instagramHandle: string
}) {
  return (
    <div className="delivery-flow-how">
      <div className="delivery-flow-how__lead">
        <WattaStaggerSectionTitle
          id="how-heading"
          className="contact-watta-section-title"
          text={d.howTitle}
        />
      </div>

      <m.ul
        className="delivery-how-channels"
        variants={reduceMotion ? undefined : stagger}
        initial={reduceMotion ? undefined : 'hidden'}
        animate={reduceMotion ? 'visible' : undefined}
        whileInView={reduceMotion ? undefined : 'visible'}
        viewport={viewport}
      >
        {howSteps.map((step, i) => {
          const href =
            step.href === 'instagram'
              ? instagramUrl
              : step.href === 'phone'
                ? `tel:${WATTA_PHONE_E164}`
                : step.href
          const title = d[step.labelKey]
          const desc = d[step.descKey]
          const accent = i % 2 === 1
          const meta =
            step.id === 'instagram' && instagramHandle
              ? `@${instagramHandle}`
              : step.id === 'phone'
                ? formatPhoneDisplay(WATTA_PHONE_E164)
                : null
          const className = cn(
            'delivery-how-channels__item group',
            accent && 'delivery-how-channels__item--accent',
          )
          const content = (
            <>
              <span
                className={cn(
                  'delivery-how-channels__ico',
                  accent && 'delivery-how-channels__ico--accent',
                )}
                aria-hidden
              >
                <step.Icon size={20} strokeWidth={2.1} />
              </span>
              <span className="delivery-how-channels__body">
                <span className="delivery-how-channels__row">
                  <span
                    className={cn(
                      'delivery-how-channels__num',
                      accent && 'delivery-how-channels__num--accent',
                    )}
                    aria-hidden
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="delivery-how-channels__title">{title}</span>
                  {meta ? <span className="delivery-how-channels__meta">{meta}</span> : null}
                </span>
                <span className="delivery-how-channels__desc">{desc}</span>
              </span>
              <ArrowUpRight
                className="delivery-how-channels__arrow h-[18px] w-[18px]"
                strokeWidth={2.25}
                aria-hidden
              />
            </>
          )

          return (
            <m.li key={step.id} variants={reduceMotion ? undefined : fadeUp} animate={reduceMotion ? { opacity: 1, y: 0 } : undefined}>
              {step.external ? (
                <a
                  href={href}
                  className={className}
                  target={href.startsWith('http') ? '_blank' : undefined}
                  rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                >
                  {content}
                </a>
              ) : (
                <Link href={href} className={className}>
                  {content}
                </Link>
              )}
            </m.li>
          )
        })}
      </m.ul>
    </div>
  )
}

function DeliveryHowStep({
  stepIndex,
  channelId,
  title,
  body,
  href,
  external,
  Icon,
  reduceMotion,
  variant,
  instagramHandle,
}: {
  stepIndex: number
  channelId: DeliveryHowChannelId
  title: string
  body: string
  href: string
  external: boolean
  Icon: LucideIcon
  reduceMotion: boolean
  variant: 'default' | 'about' | 'compact' | 'flow'
  instagramHandle?: string
}) {
  const isCompact = variant === 'compact'
  const isAbout = variant === 'about'
  const isFlow = variant === 'flow'
  const className = isCompact
    ? 'delivery-compact-how__link'
    : isFlow
      ? 'contact-watta-flow-step contact-watta-flow-step--link'
      : isAbout
        ? 'delivery-about-how-card'
        : 'delivery-watta-how__item'
  const content = isCompact ? (
    <>
      <Icon className="delivery-compact-how__ico" strokeWidth={2} aria-hidden />
      <span className="delivery-compact-how__label">{title}</span>
      <ArrowUpRight className="delivery-compact-how__arrow" strokeWidth={2} aria-hidden />
    </>
  ) : isFlow ? (
    <>
      <span className="contact-watta-flow-step__num" aria-hidden>
        {String(stepIndex).padStart(2, '0')}
      </span>
      <DeliveryHowChannelVisual
        channelId={channelId}
        instagramHandle={channelId === 'instagram' ? instagramHandle : undefined}
        phoneE164={channelId === 'phone' ? WATTA_PHONE_E164 : undefined}
      />
      <h3 className="contact-watta-flow-step__title">{title}</h3>
      <p className="contact-watta-flow-step__body">{body}</p>
      <ArrowUpRight
        size={18}
        className="mt-3 text-[#145142]/40 transition group-hover:translate-x-1 group-hover:text-[#145142]"
        strokeWidth={2.25}
        aria-hidden
      />
    </>
  ) : isAbout ? (
    <>
      <span className="delivery-flow-how-step__num" aria-hidden>
        {String(stepIndex).padStart(2, '0')}
      </span>
      <DeliveryHowChannelVisual
        channelId={channelId}
        instagramHandle={channelId === 'instagram' ? instagramHandle : undefined}
        phoneE164={channelId === 'phone' ? WATTA_PHONE_E164 : undefined}
      />
      <span className="delivery-flow-how-step__title">{title}</span>
      <span className="delivery-flow-how-step__desc">{body}</span>
      <ArrowUpRight
        className="delivery-flow-how-step__arrow mt-auto h-5 w-5 shrink-0"
        strokeWidth={2.25}
        aria-hidden
      />
    </>
  ) : (
    <>
      <span className="delivery-watta-how__num" aria-hidden>
        {String(stepIndex).padStart(2, '0')}
      </span>
      <span className="delivery-watta-how__ico" aria-hidden>
        <Icon strokeWidth={2.25} />
      </span>
      <span className="delivery-watta-how__copy">
        <span className="delivery-watta-how__item-title">{title}</span>
        <span className="delivery-watta-how__item-desc">{body}</span>
      </span>
      <ArrowUpRight className="delivery-watta-how__arrow" strokeWidth={2.25} aria-hidden />
    </>
  )

  if (external) {
    return (
      <m.li variants={reduceMotion ? undefined : fadeUp} animate={reduceMotion ? { opacity: 1, y: 0 } : undefined}>
        <a
          href={href}
          className={className}
          target={href.startsWith('http') ? '_blank' : undefined}
          rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
        >
          {content}
        </a>
      </m.li>
    )
  }

  return (
    <m.li variants={reduceMotion ? undefined : fadeUp} animate={reduceMotion ? { opacity: 1, y: 0 } : undefined}>
      <Link href={href} className={className}>
        {content}
      </Link>
    </m.li>
  )
}

export function DeliveryExperienceBlocks({
  d,
  variant = 'default',
}: {
  d: DeliveryExperienceLabels
  variant?: 'default' | 'about' | 'compact' | 'flow'
}) {
  const reduceMotion = useWattaDisableScrollReveal()
  const [instagramUrl, setInstagramUrl] = useState(WATTA_INSTAGRAM_URL)
  const isCompact = variant === 'compact'
  const isAbout = variant === 'about'
  const isFlow = variant === 'flow'
  const instagramHandle = instagramHandleFromUrl(instagramUrl)

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        setInstagramUrl(String(data?.instagramUrl || '').trim() || WATTA_INSTAGRAM_URL)
      })
      .catch(() => {})
  }, [])

  if (isFlow) {
    return (
      <DeliveryHowChannelsList
        d={d}
        reduceMotion={reduceMotion}
        instagramUrl={instagramUrl}
        instagramHandle={instagramHandle}
      />
    )
  }

  if (isCompact) {
    return (
      <section className="delivery-compact-how" aria-label={d.howTitle}>
        <p className="delivery-compact-how__kicker">{d.howTitle}</p>
        <ul className="delivery-compact-how__list">
          {howSteps.map((step) => {
            const href =
              step.href === 'instagram'
                ? instagramUrl
                : step.href === 'phone'
                  ? `tel:${WATTA_PHONE_E164}`
                  : step.href
            const title = d[step.labelKey]
            const className = 'delivery-compact-how__link'
            const content = (
              <>
                <step.Icon className="delivery-compact-how__ico" strokeWidth={2} aria-hidden />
                <span className="delivery-compact-how__label">{title}</span>
                <ArrowUpRight className="delivery-compact-how__arrow" strokeWidth={2} aria-hidden />
              </>
            )
            return (
              <li key={step.id}>
                {step.external ? (
                  <a
                    href={href}
                    className={className}
                    target={href.startsWith('http') ? '_blank' : undefined}
                    rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  >
                    {content}
                  </a>
                ) : (
                  <Link href={href} className={className}>
                    {content}
                  </Link>
                )}
              </li>
            )
          })}
        </ul>
      </section>
    )
  }

  return (
    <div className={`delivery-watta-how${isAbout ? ' delivery-about-panel delivery-about-panel--how' : ''}`}>
      <m.h2
        id="how-heading"
        className="delivery-watta-how__title"
        initial={reduceMotion ? undefined : { opacity: 0, y: 12 }}
        animate={reduceMotion ? { opacity: 1, y: 0 } : undefined}
        whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        viewport={viewport}
        transition={{ duration: 0.45, ease: easeOut }}
      >
        {d.howTitle}
      </m.h2>

      <m.ul
        className={isAbout ? 'delivery-about-how-grid' : 'delivery-watta-how__list'}
        variants={reduceMotion ? undefined : stagger}
        initial={reduceMotion ? undefined : 'hidden'}
        animate={reduceMotion ? 'visible' : undefined}
        whileInView={reduceMotion ? undefined : 'visible'}
        viewport={viewport}
      >
        {howSteps.map((step, i) => {
          const href =
            step.href === 'instagram'
              ? instagramUrl
              : step.href === 'phone'
                ? `tel:${WATTA_PHONE_E164}`
                : step.href
          return (
            <DeliveryHowStep
              key={step.id}
              stepIndex={i + 1}
              channelId={step.id}
              title={d[step.labelKey]}
              body={d[step.descKey]}
              href={href}
              external={step.external}
              Icon={step.Icon}
              reduceMotion={reduceMotion}
              variant={variant}
              instagramHandle={instagramHandle}
            />
          )
        })}
      </m.ul>
    </div>
  )
}
