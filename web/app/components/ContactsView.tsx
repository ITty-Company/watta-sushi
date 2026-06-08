'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { m } from 'framer-motion'
import toast from 'react-hot-toast'
import type { LucideIcon } from 'lucide-react'
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  ChevronDown,
  Instagram,
  Truck,
  UtensilsCrossed,
  Building2,
  Handshake,
  Star,
  BadgeCheck,
  ArrowRight,
} from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import {
  wattaRestaurantEmbedUrl,
  wattaRestaurantExternalMapsUrl,
} from '@/lib/wattaRestaurantLocation'
import { WATTA_INSTAGRAM_URL } from '@/lib/wattaSiteDefaults'
import { readSiteSettingsCache } from '@/lib/publicRouteWarmCache'
import { cn } from '@/lib/utils'
import DeliveryHeroCopy from './DeliveryHeroCopy'
import WattaStellarHeroSection from './WattaStellarHeroSection'
import {
  WATTA_IN_VIEW_FADE_VIEWPORT,
  WattaInViewFadeDiv,
  WattaInViewFadeSection,
  useWattaDisableScrollReveal,
  wattaInViewFadeViewport,
} from './WattaInViewFade'
import { WattaStaggerSectionTitle } from './WattaStaggerSectionTitle'

type SiteLinks = { telegramUrl: string; whatsappUrl: string; instagramUrl: string }
type FormTopic = 'menu' | 'delivery' | 'corporate' | 'other'

const FAQ_TONE_CYCLE = ['green', 'lime', 'orange'] as const

type FormTopicTone = (typeof FAQ_TONE_CYCLE)[number]

function FormFieldReveal({
  children,
  delay = 0,
  reduce,
}: {
  children: ReactNode
  delay?: number
  reduce: boolean
}) {
  return (
    <m.div
      initial={reduce ? false : { opacity: 0, y: 14 }}
      animate={reduce ? { opacity: 1, y: 0 } : undefined}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={WATTA_IN_VIEW_FADE_VIEWPORT}
      transition={{ duration: 0.42, delay }}
    >
      {children}
    </m.div>
  )
}

function FormTopicPicker({
  label,
  value,
  onChange,
  options,
  reduce,
}: {
  label: string
  value: FormTopic
  onChange: (topic: FormTopic) => void
  options: { value: FormTopic; icon: LucideIcon; tone: FormTopicTone; label: string }[]
  reduce: boolean
}) {
  return (
    <fieldset className="contact-watta-form-topic-field">
      <legend className="contact-watta-form-label">{label}</legend>
      <div className="contact-watta-form-topic-grid" role="radiogroup" aria-label={label}>
        {options.map((opt, i) => {
          const active = value === opt.value
          return (
            <m.button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={active}
              className={cn(
                'contact-watta-form-topic',
                `contact-watta-form-topic--${opt.tone}`,
                active && 'contact-watta-form-topic--active',
              )}
              onClick={() => onChange(opt.value)}
              initial={reduce ? false : { opacity: 0, scale: 0.94 }}
              animate={reduce ? { opacity: 1, scale: 1 } : undefined}
              whileInView={reduce ? undefined : { opacity: 1, scale: 1 }}
              viewport={WATTA_IN_VIEW_FADE_VIEWPORT}
              transition={{ delay: i * 0.05, duration: 0.35 }}
              whileTap={reduce ? undefined : { scale: 0.97 }}
            >
              {active ? (
                <m.span
                  layoutId="contact-form-topic-highlight"
                  className="contact-watta-form-topic__highlight"
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                />
              ) : null}
              <span className="contact-watta-form-topic__ico" aria-hidden>
                <opt.icon size={18} strokeWidth={2.1} />
              </span>
              <span className="contact-watta-form-topic__label">{opt.label}</span>
            </m.button>
          )
        })}
      </div>
    </fieldset>
  )
}

export type ContactsViewProps = {
  embedded?: boolean
  onBack?: () => void
}

function IconTelegram({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.896-.417-1.388.258-2.193.177-.22 3.255-2.977 3.315-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"
      />
    </svg>
  )
}

function IconWhatsApp({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"
      />
    </svg>
  )
}

function TopicChip({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: LucideIcon
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'contact-watta-topic-chip',
        active && 'contact-watta-topic-chip--active',
      )}
    >
      <span className="contact-watta-topic-chip__ico" aria-hidden>
        <Icon size={18} strokeWidth={2.1} />
      </span>
      <span>{label}</span>
    </button>
  )
}

function ContactFlowSection({
  children,
  className,
  ariaLabel,
  ariaLabelledBy,
}: {
  children: ReactNode
  className?: string
  ariaLabel?: string
  ariaLabelledBy?: string
}) {
  return (
    <WattaInViewFadeSection
      className={cn('delivery-flow-section bg-white py-14 sm:py-18', className)}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">{children}</div>
    </WattaInViewFadeSection>
  )
}

function FlowStep({
  step,
  title,
  body,
  fade,
  delay,
}: {
  step: string
  title: string
  body: string
  fade:
    | { initial: false; animate: { opacity: number; y: number } }
    | { initial: { opacity: number; y: number }; whileInView: { opacity: number; y: number } }
  delay: number
}) {
  return (
    <m.article
      className="contact-watta-flow-step"
      {...fade}
      viewport={wattaInViewFadeViewport('-40px')}
      transition={{ duration: 0.45, delay }}
    >
      <span className="contact-watta-flow-step__num" aria-hidden>
        {step}
      </span>
      <h3 className="contact-watta-flow-step__title">{title}</h3>
      <p className="contact-watta-flow-step__body">{body}</p>
    </m.article>
  )
}

export default function ContactsView({ embedded = false, onBack }: ContactsViewProps) {
  const { t } = useLanguage()
  const c = t.contactPage
  const reduce = useWattaDisableScrollReveal()

  const [links, setLinks] = useState<SiteLinks>({ telegramUrl: '', whatsappUrl: '', instagramUrl: '' })
  const [pickupAddress, setPickupAddress] = useState('')
  const [faqOpen, setFaqOpen] = useState<number | null>(0)
  const [activeTopic, setActiveTopic] = useState(0)
  const [formTopic, setFormTopic] = useState<FormTopic>('other')
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' })
  const [honeypot, setHoneypot] = useState('')
  const [sending, setSending] = useState(false)

  useLayoutEffect(() => {
    const cached = readSiteSettingsCache()
    if (!cached) return
    setLinks({
      telegramUrl: String(cached.telegramUrl || '').trim(),
      whatsappUrl: String(cached.whatsappUrl || '').trim(),
      instagramUrl: String(cached.instagramUrl || '').trim() || WATTA_INSTAGRAM_URL,
    })
    setPickupAddress(String(cached.restaurantPickupAddress || '').trim())
  }, [])

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((d) => {
        setLinks({
          telegramUrl: String(d.telegramUrl || '').trim(),
          whatsappUrl: String(d.whatsappUrl || '').trim(),
          instagramUrl: String(d.instagramUrl || '').trim() || WATTA_INSTAGRAM_URL,
        })
        setPickupAddress(String(d.restaurantPickupAddress || '').trim())
      })
      .catch(() => {})
  }, [])

  const addressLine = pickupAddress || c.addressLine

  const topicChips = useMemo(
    () => [
      { icon: UtensilsCrossed, label: c.topicMenu, topic: 'menu' as const },
      { icon: Truck, label: c.topicDelivery, topic: 'delivery' as const },
      { icon: Building2, label: c.topicCorporate, topic: 'corporate' as const },
      { icon: Handshake, label: c.topicPartners, topic: 'other' as const },
      { icon: Star, label: c.topicFeedback, topic: 'other' as const },
    ],
    [c],
  )

  const scrollToForm = useCallback(() => {
    document.getElementById('watta-contact-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const scrollToFormWithTopic = useCallback((topic: FormTopic) => {
    setFormTopic(topic)
    requestAnimationFrame(() => {
      document.getElementById('watta-contact-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }, [])

  const topicLabelForSubmit = useMemo(() => {
    const map: Record<FormTopic, string> = {
      menu: c.formTopicMenu,
      delivery: c.formTopicDelivery,
      corporate: c.formTopicCorporate,
      other: c.formTopicOther,
    }
    return map[formTopic]
  }, [c, formTopic])

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (String(honeypot || '').trim()) {
      return
    }
    const name = form.name.trim()
    const email = form.email.trim()
    const messageBody = form.message.trim()
    const message = `[${c.formTopicLabel}: ${topicLabelForSubmit}]\n\n${messageBody}`
    if (name.length < 2 || name.length > 120) {
      toast.error(c.errName)
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error(c.errEmail)
      return
    }
    if (messageBody.length < 10 || messageBody.length > 4000) {
      toast.error(c.errMessage)
      return
    }
    setSending(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone: form.phone.trim(),
          message,
          website: honeypot,
        }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean
        error?: string
        message?: string
      }
      if (!res.ok) {
        const err = data?.error
        if (err === 'bad_name') toast.error(c.errName)
        else if (err === 'bad_email') toast.error(c.errEmail)
        else if (err === 'bad_message') toast.error(c.errMessage)
        else if (data?.message) toast.error(data.message)
        else toast.error(c.formError)
        return
      }
      if (data?.ok) {
        toast.success(c.formSuccess)
        setForm({ name: '', email: '', phone: '', message: '' })
        setHoneypot('')
        setFormTopic('other')
      } else {
        toast.error(c.formError)
      }
    } catch {
      toast.error(c.formNetwork)
    } finally {
      setSending(false)
    }
  }

  const faqs = buildFaqList(c)

  const formTopicOptions = useMemo(
    () =>
      [
        { value: 'menu' as const, icon: UtensilsCrossed, tone: 'green' as const, label: c.formTopicMenu },
        { value: 'delivery' as const, icon: Truck, tone: 'lime' as const, label: c.formTopicDelivery },
        { value: 'corporate' as const, icon: Building2, tone: 'orange' as const, label: c.formTopicCorporate },
        { value: 'other' as const, icon: Star, tone: 'green' as const, label: c.formTopicOther },
      ] satisfies {
        value: FormTopic
        icon: LucideIcon
        tone: FormTopicTone
        label: string
      }[],
    [c],
  )

  const fadeUp = reduce
    ? ({ initial: false as const, animate: { opacity: 1, y: 0 } })
    : ({
        initial: { opacity: 0, y: 28 },
        whileInView: { opacity: 1, y: 0 },
      } as const)

  const quickLinks = [
    { href: '/menu', label: c.quickMenu },
    { href: '/delivery', label: c.quickDelivery },
    { href: '/promotions', label: c.quickPromo },
    { href: '/about', label: c.quickAbout },
  ]

  const flowSteps = [
    { title: c.flowStep1Title, body: c.flowStep1Body },
    { title: c.flowStep2Title, body: c.flowStep2Body },
    { title: c.flowStep3Title, body: c.flowStep3Body },
  ]

  const messengerCards = [
    links.telegramUrl
      ? {
          href: links.telegramUrl,
          title: c.tgCardTitle,
          sub: c.tgCardSub,
          className: 'contact-watta-messenger--tg',
          icon: <IconTelegram className="h-7 w-7" />,
          aria: c.ariaTelegram,
        }
      : null,
    links.whatsappUrl
      ? {
          href: links.whatsappUrl,
          title: c.waCardTitle,
          sub: c.waCardSub,
          className: 'contact-watta-messenger--wa',
          icon: <IconWhatsApp className="h-7 w-7" />,
          aria: c.ariaWhatsapp,
        }
      : null,
    links.instagramUrl
      ? {
          href: links.instagramUrl,
          title: c.igCardTitle,
          sub: c.igCardSub,
          className: 'contact-watta-messenger--ig',
          icon: <Instagram className="h-7 w-7" strokeWidth={2} />,
          aria: c.ariaInstagram,
        }
      : null,
  ].filter(Boolean) as {
    href: string
    title: string
    sub: string
    className: string
    icon: React.ReactNode
    aria: string
  }[]

  const contactHeroCtaRow = (
    <div className="contact-page-hero-cta-row contact-page-hero-cta-row--below-intro flex flex-wrap justify-center gap-3">
      <button
        type="button"
        onClick={scrollToForm}
        className="rounded-2xl bg-watta-action px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#145142]/25 transition hover:bg-watta-action"
      >
        {c.ctaForm}
      </button>
      <Link
        href="/delivery"
        className="rounded-2xl border-2 border-[#145142]/25 bg-white px-5 py-3 text-sm font-bold text-[#145142] transition hover:border-[#145142]/45"
      >
        {c.ctaDelivery}
      </Link>
    </div>
  )

  const contactStandaloneHeroStack = (
    <WattaStellarHeroSection
      introId="contact-page-lead-intro"
      ariaLabelledBy="contact-page-lead-title"
    >
      <DeliveryHeroCopy
        titleId="contact-page-lead-title"
        kickerScript={c.heroKicker}
        headlineLead={c.heroTitleLead}
        headlineMark={c.heroTitleMark}
        sub={c.heroSubtitle}
        statFresh=""
        statFast=""
        statCity=""
        showStats={false}
      />
    </WattaStellarHeroSection>
  )

  return (
    <m.div
      id="contacts-page-container"
      className="menu-page-web watta-site-hero-page-web delivery-page-web contact-page-web watta-delivery-page watta-delivery-page-about watta-contacts-page relative flex w-full max-w-[100vw] min-w-0 flex-1 flex-col overflow-x-hidden bg-white pb-24"
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      {embedded && onBack ? (
        <m.div
          className="border-b border-gray-100 bg-white px-4 py-4 sm:px-6"
          initial={reduce ? false : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <m.div
            className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4"
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 rounded-2xl border border-[#145142]/15 bg-white px-4 py-2.5 text-sm font-bold text-[#145142] shadow-sm transition hover:bg-gray-50"
            >
              <ArrowLeft size={20} strokeWidth={2.25} />
              {t.auth.back}
            </button>
            <m.div
              className="flex flex-wrap gap-2"
              initial={reduce ? false : { opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <button
                type="button"
                onClick={scrollToForm}
                className="rounded-2xl bg-watta-action px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#145142]/25 transition hover:bg-watta-action"
              >
                {c.ctaForm}
              </button>
              <Link
                href="/delivery"
                className="rounded-2xl border-2 border-[#145142]/30 bg-white px-4 py-2.5 text-sm font-bold text-[#145142] transition hover:border-[#145142]"
              >
                {c.ctaDelivery}
              </Link>
            </m.div>
          </m.div>
        </m.div>
      ) : null}

      <div className="delivery-page-home-flow w-full">
        {contactStandaloneHeroStack}

        <div className="delivery-page-tools-flow">
          <div className="contact-page-intro-cta-wrap mx-auto max-w-6xl px-4 pt-2 sm:px-6">
            {contactHeroCtaRow}
          </div>
          <div className="delivery-page-flow delivery-page-web relative">
      {/* Теми звернень */}
      <ContactFlowSection ariaLabelledBy="contact-topics-heading">
        <m.div
          {...fadeUp}
          viewport={wattaInViewFadeViewport('-50px')}
          transition={{ duration: 0.55 }}
        >
          <div className="mb-8 text-center sm:mb-10">
            <WattaStaggerSectionTitle
              id="contact-topics-heading"
              className="contact-watta-section-title mb-2"
              text={c.topicsTitle}
            />
            <p className="contact-watta-topics-sub delivery-page-section-lead contact-watta-section-sub mx-auto max-w-lg text-center">
              {c.topicsSub}
            </p>
          </div>
          <m.div
            className="flex flex-wrap justify-center gap-2.5"
            initial={reduce ? false : { opacity: 0 }}
            animate={reduce ? { opacity: 1 } : undefined}
            whileInView={reduce ? undefined : { opacity: 1 }}
            viewport={WATTA_IN_VIEW_FADE_VIEWPORT}
            transition={{ staggerChildren: 0.05 }}
          >
            {topicChips.map((chip, i) => (
              <m.div
                key={chip.label}
                initial={reduce ? false : { opacity: 0, y: 10 }}
                animate={reduce ? { opacity: 1, y: 0 } : undefined}
                whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                viewport={WATTA_IN_VIEW_FADE_VIEWPORT}
                transition={{ delay: i * 0.04 }}
              >
                <TopicChip
                  icon={chip.icon}
                  label={chip.label}
                  active={activeTopic === i}
                  onClick={() => {
                    setActiveTopic(i)
                    scrollToFormWithTopic(chip.topic)
                  }}
                />
              </m.div>
            ))}
          </m.div>
        </m.div>
      </ContactFlowSection>

      {/* Як відповідаємо */}
      <ContactFlowSection ariaLabelledBy="contact-flow-heading">
          <m.div className="mb-10 text-center sm:mb-12" {...fadeUp} viewport={WATTA_IN_VIEW_FADE_VIEWPORT}>
            <WattaStaggerSectionTitle
              id="contact-flow-heading"
              className="contact-watta-section-title"
              text={c.flowTitle}
            />
            <p className="contact-watta-flow-sub delivery-page-section-lead contact-watta-section-sub mx-auto text-center">
              {c.flowSub}
            </p>
          </m.div>
          <div className="contact-watta-flow-grid">
            {flowSteps.map((step, i) => (
              <FlowStep
                key={step.title}
                step={String(i + 1).padStart(2, '0')}
                title={step.title}
                body={step.body}
                fade={fadeUp}
                delay={i * 0.08}
              />
            ))}
          </div>
      </ContactFlowSection>

      {/* Канали */}
      <ContactFlowSection ariaLabelledBy="contact-channels-heading">
        <m.div
          {...fadeUp}
          viewport={wattaInViewFadeViewport('-60px')}
          transition={{ duration: 0.55 }}
        >
          <div className="mb-10 text-center sm:mb-12">
            <WattaStaggerSectionTitle
              id="contact-channels-heading"
              className="contact-watta-section-title mb-2"
              text={c.channelsTitle}
            />
            <p className="contact-watta-channels-sub delivery-page-section-lead contact-watta-section-sub mx-auto max-w-lg text-center">
              {c.channelsSub}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
            <m.a
              href={`tel:${c.phoneTel.replace(/\s/g, '')}`}
              className="contact-watta-channel-card group"
              whileHover={reduce ? undefined : { y: -3 }}
            >
              <m.div
                className="contact-watta-channel-card__ico"
                whileHover={reduce ? undefined : { scale: 1.06, rotate: -4 }}
              >
                <Phone size={18} strokeWidth={2.1} />
              </m.div>
              <span className="contact-watta-channel-card__label">{c.cardCall}</span>
              <div className="contact-watta-channel-card__value-row">
                <span className="contact-watta-channel-card__value">{c.phoneDisplay}</span>
                <ArrowRight
                  size={15}
                  strokeWidth={2.25}
                  className="contact-watta-channel-card__arrow shrink-0 text-[#145142]/40 transition group-hover:translate-x-0.5 group-hover:text-[#145142]"
                  aria-hidden
                />
              </div>
            </m.a>
            <m.a
              href={`mailto:${c.emailMailto}`}
              className="contact-watta-channel-card group"
              whileHover={reduce ? undefined : { y: -3 }}
            >
              <m.div className="contact-watta-channel-card__ico contact-watta-channel-card__ico--grad" whileHover={reduce ? undefined : { scale: 1.06 }}>
                <Mail size={18} strokeWidth={2.1} />
              </m.div>
              <span className="contact-watta-channel-card__label">{c.cardEmail}</span>
              <div className="contact-watta-channel-card__value-row">
                <span className="contact-watta-channel-card__value break-all">{c.emailDisplay}</span>
                <ArrowRight
                  size={15}
                  strokeWidth={2.25}
                  className="contact-watta-channel-card__arrow shrink-0 text-[#145142]/40 transition group-hover:translate-x-0.5 group-hover:text-[#145142]"
                  aria-hidden
                />
              </div>
            </m.a>
            <m.div className="contact-watta-channel-card" whileHover={reduce ? undefined : { y: -3 }}>
              <m.div className="contact-watta-channel-card__ico" whileHover={reduce ? undefined : { scale: 1.06 }}>
                <MapPin size={18} strokeWidth={2.1} />
              </m.div>
              <span className="contact-watta-channel-card__label">{c.cardAddress}</span>
              <p className="contact-watta-channel-card__value leading-snug">{addressLine}</p>
              <a
                href={wattaRestaurantExternalMapsUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="contact-watta-channel-card__maps-link inline-flex items-center gap-1 font-bold text-[#145142] hover:underline"
              >
                {c.openMaps}
                <ArrowRight size={14} strokeWidth={2.25} />
              </a>
            </m.div>
            <m.div className="contact-watta-channel-card" whileHover={reduce ? undefined : { y: -3 }}>
              <m.div className="contact-watta-channel-card__ico" whileHover={reduce ? undefined : { scale: 1.06 }}>
                <Clock size={18} strokeWidth={2.1} />
              </m.div>
              <span className="contact-watta-channel-card__label">{c.cardHours}</span>
              <p className="contact-watta-channel-card__value">{c.hoursDetail}</p>
            </m.div>
          </div>
        </m.div>
      </ContactFlowSection>

      {/* Месенджери */}
      {messengerCards.length > 0 ? (
        <ContactFlowSection>
          <m.div
            {...fadeUp}
            viewport={WATTA_IN_VIEW_FADE_VIEWPORT}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-8 text-center sm:mb-10">
              <WattaStaggerSectionTitle
                className="contact-watta-section-title mb-2"
                text={c.socialTitle}
              />
              <p className="delivery-page-section-lead contact-watta-section-sub mx-auto max-w-lg text-center">
                {c.messengerSub}
              </p>
            </div>
            <m.div
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              initial={reduce ? false : { opacity: 0 }}
              animate={reduce ? { opacity: 1 } : undefined}
              whileInView={reduce ? undefined : { opacity: 1 }}
              viewport={WATTA_IN_VIEW_FADE_VIEWPORT}
            >
              {messengerCards.map((card, i) => (
                <m.a
                  key={card.title}
                  href={card.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={card.aria}
                  className={cn('contact-watta-messenger', card.className)}
                  initial={reduce ? false : { opacity: 0, y: 16 }}
                  animate={reduce ? { opacity: 1, y: 0 } : undefined}
                  whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                  viewport={WATTA_IN_VIEW_FADE_VIEWPORT}
                  transition={{ delay: i * 0.07 }}
                  whileHover={reduce ? undefined : { y: -4, scale: 1.01 }}
                >
                  <span className="contact-watta-messenger__ico">{card.icon}</span>
                  <span className="contact-watta-messenger__title">{card.title}</span>
                  <span className="contact-watta-messenger__sub">{card.sub}</span>
                  <ArrowRight size={20} className="contact-watta-messenger__arrow" />
                </m.a>
              ))}
            </m.div>
          </m.div>
        </ContactFlowSection>
      ) : null}

      {/* Корпоративи */}
      <ContactFlowSection className="py-10 sm:py-14">
        <m.div
          {...fadeUp}
          viewport={WATTA_IN_VIEW_FADE_VIEWPORT}
          transition={{ duration: 0.5 }}
        >
          <div className="contact-watta-corporate">
            <m.div
              className="relative z-[1] max-w-xl"
              initial={reduce ? false : { opacity: 0, x: -16 }}
              animate={reduce ? { opacity: 1, x: 0 } : undefined}
              whileInView={reduce ? undefined : { opacity: 1, x: 0 }}
              viewport={WATTA_IN_VIEW_FADE_VIEWPORT}
            >
              <span className="contact-watta-corporate__kicker">{c.topicCorporate}</span>
              <WattaStaggerSectionTitle
                className="contact-watta-corporate__title"
                text={c.corporateTitle}
              />
              <p className="contact-watta-corporate__sub">{c.corporateSub}</p>
              <button
                type="button"
                onClick={() => scrollToFormWithTopic('corporate')}
                className="contact-watta-corporate__cta"
              >
                {c.corporateCta}
                <ArrowRight size={18} aria-hidden />
              </button>
            </m.div>
            <Building2 className="contact-watta-corporate__deco sm:h-40 sm:w-40" strokeWidth={1} aria-hidden />
          </div>
        </m.div>
      </ContactFlowSection>

      {/* Швидкі посилання */}
      <ContactFlowSection className="py-10">
          <p className="delivery-flow-kicker mb-4 text-center">{c.quickLinksTitle}</p>
          <m.div className="flex flex-wrap justify-center gap-2">
            {quickLinks.map((link) => (
              <Link key={link.href} href={link.href} className="contact-watta-quick-link">
                {link.label}
              </Link>
            ))}
          </m.div>
      </ContactFlowSection>

      {/* Карта */}
      <ContactFlowSection>
        <m.div
          {...fadeUp}
          viewport={WATTA_IN_VIEW_FADE_VIEWPORT}
          transition={{ duration: 0.55 }}
        >
          <div className="mb-8 text-center sm:mb-10">
            <WattaStaggerSectionTitle
              className="contact-watta-section-title mb-2"
              text={c.mapTitle}
            />
            <p className="contact-watta-map-sub delivery-page-section-lead contact-watta-section-sub mx-auto max-w-lg text-center">
              {c.mapSub}
            </p>
          </div>
          <div className="contact-watta-map-wrap">
            <div className="aspect-[16/10] min-h-[280px] w-full sm:min-h-[380px]">
              <iframe
                title={c.mapTitle}
                src={wattaRestaurantEmbedUrl()}
                className="h-full w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          </div>
        </m.div>
      </ContactFlowSection>

      {/* FAQ */}
      <ContactFlowSection>
        <m.div
          {...fadeUp}
          viewport={WATTA_IN_VIEW_FADE_VIEWPORT}
          transition={{ duration: 0.55 }}
        >
          <div className="mb-8 text-center sm:mb-10">
            <WattaStaggerSectionTitle
              className="contact-watta-section-title mb-2"
              text={c.faqTitle}
            />
            <p className="delivery-page-section-lead contact-watta-section-sub mx-auto max-w-lg text-center">
              {c.faqSub}
            </p>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            {faqs.map((item, i) => {
              const open = faqOpen === i
              const tone = FAQ_TONE_CYCLE[i % FAQ_TONE_CYCLE.length]
              return (
                <m.div
                  key={i}
                  className={cn(
                    'contact-watta-faq-item',
                    `contact-watta-faq-item--${tone}`,
                    open && 'contact-watta-faq-item--open',
                  )}
                  layout={!reduce}
                  initial={reduce ? false : { opacity: 0, y: 8 }}
                  animate={reduce ? { opacity: 1, y: 0 } : undefined}
                  whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                  viewport={WATTA_IN_VIEW_FADE_VIEWPORT}
                  transition={{ delay: (i % 3) * 0.04 }}
                >
                  <button
                    type="button"
                    className="contact-watta-faq-item__trigger"
                    onClick={() => setFaqOpen(open ? null : i)}
                    aria-expanded={open}
                  >
                    <span className="contact-watta-faq-item__q">{item.q}</span>
                    <ChevronDown
                      size={22}
                      className={cn('contact-watta-faq-item__chevron shrink-0', open && 'rotate-180')}
                      aria-hidden
                    />
                  </button>
                  {open ? (
                    <m.div
                      className="contact-watta-faq-item__a"
                      initial={reduce ? false : { opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                    >
                      {item.a}
                    </m.div>
                  ) : null}
                </m.div>
              )
            })}
          </div>
        </m.div>
      </ContactFlowSection>

      {/* Форма */}
      <ContactFlowSection
        className="scroll-mt-[calc(5rem+env(safe-area-inset-top))]"
        ariaLabelledBy="contact-form-heading"
      >
        <m.div
          id="watta-contact-form"
          {...fadeUp}
          viewport={WATTA_IN_VIEW_FADE_VIEWPORT}
          transition={{ duration: 0.55 }}
        >
          <m.div
            className="grid gap-8 lg:grid-cols-[1fr_0.42fr] lg:gap-10"
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={reduce ? { opacity: 1, y: 0 } : undefined}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={WATTA_IN_VIEW_FADE_VIEWPORT}
          >
            <m.div
              className="contact-watta-form-panel"
              initial={reduce ? false : { opacity: 0, y: 24, scale: 0.98 }}
              animate={reduce ? { opacity: 1, y: 0, scale: 1 } : undefined}
              whileInView={reduce ? undefined : { opacity: 1, y: 0, scale: 1 }}
              viewport={WATTA_IN_VIEW_FADE_VIEWPORT}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <WattaStaggerSectionTitle
                id="contact-form-heading"
                className="contact-watta-section-title mb-2"
                text={c.formTitle}
              />
              <p className="delivery-page-section-lead contact-watta-section-sub mb-8">{c.formSub}</p>
              <form onSubmit={submitForm} className="grid gap-5">
                <label className="sr-only" htmlFor="contact-honey">
                  {c.honeyLabel}
                </label>
                <input
                  id="contact-honey"
                  type="text"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  className="pointer-events-none absolute -left-[9999px] h-px w-px opacity-0"
                  tabIndex={-1}
                  aria-hidden
                  autoComplete="off"
                />
                <FormFieldReveal delay={0.04} reduce={reduce}>
                  <FormTopicPicker
                    label={c.formTopicLabel}
                    value={formTopic}
                    onChange={setFormTopic}
                    options={formTopicOptions}
                    reduce={reduce}
                  />
                </FormFieldReveal>
                <div className="grid gap-5 sm:grid-cols-2">
                  <FormFieldReveal delay={0.1} reduce={reduce}>
                    <label className="contact-watta-form-label" htmlFor="contact-form-name">
                      {c.phName}
                    </label>
                    <input
                      id="contact-form-name"
                      required
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      className="contact-watta-form-input"
                      placeholder={c.phName}
                      maxLength={120}
                    />
                  </FormFieldReveal>
                  <FormFieldReveal delay={0.14} reduce={reduce}>
                    <label className="contact-watta-form-label" htmlFor="contact-form-email">
                      {c.phEmail}
                    </label>
                    <input
                      id="contact-form-email"
                      required
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      className="contact-watta-form-input"
                      placeholder={c.phEmail}
                      maxLength={120}
                    />
                  </FormFieldReveal>
                </div>
                <FormFieldReveal delay={0.18} reduce={reduce}>
                  <label className="contact-watta-form-label" htmlFor="contact-form-phone">
                    {c.phPhone}
                  </label>
                  <input
                    id="contact-form-phone"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    className="contact-watta-form-input"
                    placeholder={c.phPhone}
                    maxLength={48}
                  />
                </FormFieldReveal>
                <FormFieldReveal delay={0.22} reduce={reduce}>
                  <label className="contact-watta-form-label" htmlFor="contact-form-message">
                    {c.phMessage}
                  </label>
                  <textarea
                    id="contact-form-message"
                    required
                    value={form.message}
                    onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                    rows={5}
                    className="contact-watta-form-input resize-y"
                    placeholder={c.phMessage}
                    maxLength={4000}
                  />
                </FormFieldReveal>
                <FormFieldReveal delay={0.28} reduce={reduce}>
                  <m.button
                    type="submit"
                    disabled={sending}
                    className="contact-watta-form-submit"
                    whileHover={reduce ? undefined : { scale: 1.02 }}
                    whileTap={reduce ? undefined : { scale: 0.98 }}
                  >
                    <Send size={20} className={sending ? 'animate-pulse' : undefined} />
                    {sending ? c.formSending : c.formSubmit}
                  </m.button>
                </FormFieldReveal>
              </form>
            </m.div>

            <m.aside
              className="contact-watta-form-aside"
              initial={reduce ? false : { opacity: 0, x: 20 }}
              animate={reduce ? { opacity: 1, x: 0 } : undefined}
              whileInView={reduce ? undefined : { opacity: 1, x: 0 }}
              viewport={WATTA_IN_VIEW_FADE_VIEWPORT}
              transition={{ duration: 0.5, delay: 0.12 }}
            >
              <h3 className="contact-watta-form-aside__title">{c.formAsideTitle}</h3>
              <ul className="mt-5 space-y-4">
                {[c.formAside1, c.formAside2, c.formAside3].map((line, i) => (
                  <m.li
                    key={i}
                    className="flex gap-3 text-sm leading-relaxed text-[#4a5c54]"
                    initial={reduce ? false : { opacity: 0, x: 8 }}
                    animate={reduce ? { opacity: 1, x: 0 } : undefined}
                    whileInView={reduce ? undefined : { opacity: 1, x: 0 }}
                    viewport={WATTA_IN_VIEW_FADE_VIEWPORT}
                    transition={{ delay: 0.1 + i * 0.08 }}
                  >
                    <BadgeCheck size={20} className="mt-0.5 shrink-0 text-[#145142]" strokeWidth={2.2} />
                    {line}
                  </m.li>
                ))}
              </ul>
              <m.div
                className="mt-8 overflow-hidden rounded-2xl border border-[#145142]/12 bg-white p-4 shadow-sm"
                whileHover={reduce ? undefined : { scale: 1.01 }}
              >
                <Image src="/logo.png" alt="" width={72} height={72} className="mx-auto object-contain" />
                <p className="mt-3 text-center text-sm font-bold text-[#145142]">Watta Sushi</p>
                <p className="mt-1 text-center text-xs text-gray-500">{c.channelsSub}</p>
              </m.div>
            </m.aside>
          </m.div>
        </m.div>
      </ContactFlowSection>

          </div>
        </div>
      </div>
    </m.div>
  )
}

function buildFaqList(c: {
  faq1Q: string
  faq1A: string
  faq2Q: string
  faq2A: string
  faq3Q: string
  faq3A: string
  faq4Q: string
  faq4A: string
  faq5Q: string
  faq5A: string
  faq6Q: string
  faq6A: string
}) {
  return [
    { q: c.faq1Q, a: c.faq1A },
    { q: c.faq2Q, a: c.faq2A },
    { q: c.faq3Q, a: c.faq3A },
    { q: c.faq4Q, a: c.faq4A },
    { q: c.faq5Q, a: c.faq5A },
    { q: c.faq6Q, a: c.faq6A },
  ]
}
