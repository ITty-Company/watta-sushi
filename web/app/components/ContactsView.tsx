'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
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
  Sparkles,
  Instagram,
  MessageCircle,
  Truck,
  UtensilsCrossed,
  Building2,
  Handshake,
  Star,
  BadgeCheck,
  ArrowRight,
  Zap,
} from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import {
  wattaRestaurantEmbedUrl,
  wattaRestaurantExternalMapsUrl,
} from '@/lib/wattaRestaurantLocation'
import { WATTA_INSTAGRAM_URL } from '@/lib/wattaSiteDefaults'
import { cn } from '@/lib/utils'

const ACCENT = '#FF5C00'
const HERO_BG =
  'linear-gradient(165deg, #0c3028 0%, #145142 38%, #1a6b58 72%, #145142 100%)'

type SiteLinks = { telegramUrl: string; whatsappUrl: string; instagramUrl: string }
type FormTopic = 'menu' | 'delivery' | 'corporate' | 'other'

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
    | { initial: false }
    | { initial: { opacity: number; y: number }; whileInView: { opacity: number; y: number } }
  delay: number
}) {
  return (
    <motion.article
      className="contact-watta-flow-step"
      {...fade}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.45, delay }}
    >
      <span className="contact-watta-flow-step__num" aria-hidden>
        {step}
      </span>
      <h3 className="contact-watta-flow-step__title">{title}</h3>
      <p className="contact-watta-flow-step__body">{body}</p>
    </motion.article>
  )
}

export default function ContactsView({ embedded = false, onBack }: ContactsViewProps) {
  const { t } = useLanguage()
  const c = t.contactPage
  const reduce = useReducedMotion()

  const [links, setLinks] = useState<SiteLinks>({ telegramUrl: '', whatsappUrl: '', instagramUrl: '' })
  const [pickupAddress, setPickupAddress] = useState('')
  const [faqOpen, setFaqOpen] = useState<number | null>(0)
  const [activeTopic, setActiveTopic] = useState(0)
  const [formTopic, setFormTopic] = useState<FormTopic>('other')
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '', website: '' })
  const [sending, setSending] = useState(false)

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
    if (String(form.website || '').trim()) {
      toast.success(c.formSuccess)
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
          website: form.website,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(c.formError)
        return
      }
      if (data?.ok) {
        toast.success(c.formSuccess)
        setForm({ name: '', email: '', phone: '', message: '', website: '' })
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

  const fadeUp = reduce
    ? ({ initial: false as const } satisfies { initial: false })
    : ({
        initial: { opacity: 0, y: 28 },
        whileInView: { opacity: 1, y: 0 },
      } as const)

  const statCards = [
    { val: c.stat1Val, label: c.stat1Label, icon: Zap },
    { val: c.stat2Val, label: c.stat2Label, icon: MapPin },
    { val: c.stat3Val, label: c.stat3Label, icon: BadgeCheck },
    { val: c.stat4Val, label: c.stat4Label, icon: Star },
  ]

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

  return (
    <motion.div
      className="contact-page-web relative min-h-[100dvh] w-full overflow-x-hidden watta-page-bg pb-24"
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      {embedded && onBack ? (
        <motion.div
          className="border-b border-gray-100 bg-white px-4 py-4 sm:px-6"
          initial={reduce ? false : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <motion.div
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
            <motion.div
              className="flex flex-wrap gap-2"
              initial={reduce ? false : { opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <button
                type="button"
                onClick={scrollToForm}
                className="rounded-2xl bg-[#145142] px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#145142]/25 transition hover:bg-[#1a6b58]"
              >
                {c.ctaForm}
              </button>
              <Link
                href="/delivery"
                className="rounded-2xl border-2 border-[#145142]/30 bg-white px-4 py-2.5 text-sm font-bold text-[#145142] transition hover:border-[#145142]"
              >
                {c.ctaDelivery}
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
      ) : null}

      {/* Кінематографічний герой */}
      <section
        className="contact-page-hero-web relative overflow-hidden text-white"
        style={{ background: HERO_BG }}
        aria-labelledby="contacts-hero-title"
      >
        <motion.div
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
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ duration: 0.8 }}
        />
        <div
          className="pointer-events-none absolute -right-[18%] top-1/2 h-[min(75vw,500px)] w-[min(75vw,500px)] -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,92,0,0.16)_0%,transparent_68%)]"
          aria-hidden
        />

        <div className="relative z-[1] mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-14 lg:py-24">
          <div>
            <motion.p
              className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-white/90 backdrop-blur-sm sm:text-xs"
              {...fadeUp}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <Sparkles size={14} style={{ color: ACCENT }} />
              {c.heroKicker}
            </motion.p>
            <motion.h1
              id="contacts-hero-title"
              className="max-w-xl text-4xl font-black leading-[1.02] tracking-tight sm:text-5xl md:text-6xl lg:text-[3.5rem]"
              {...fadeUp}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: 0.05 }}
            >
              {c.heroTitle}
            </motion.h1>
            <motion.p
              className="mt-5 max-w-xl text-base leading-relaxed text-white/78 sm:text-lg"
              {...fadeUp}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: 0.1 }}
            >
              {c.heroSubtitle}
            </motion.p>

            <motion.div
              className="mt-8 flex flex-wrap gap-3"
              {...fadeUp}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.12 }}
            >
              <button
                type="button"
                onClick={scrollToForm}
                className="rounded-2xl bg-white px-6 py-3.5 text-sm font-black text-[#145142] shadow-lg transition hover:scale-[1.02] hover:bg-white/95"
              >
                {c.ctaForm}
              </button>
              <Link
                href="/delivery"
                className="rounded-2xl border-2 border-white/35 bg-white/10 px-6 py-3.5 text-sm font-black text-white backdrop-blur-sm transition hover:border-white/55 hover:bg-white/15"
              >
                {c.ctaDelivery}
              </Link>
              <Link
                href="/menu"
                className="rounded-2xl border-2 border-white/20 px-6 py-3.5 text-sm font-bold text-white/90 transition hover:border-white/40"
              >
                {c.ctaMenu}
              </Link>
            </motion.div>

            <motion.div
              className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4"
              {...fadeUp}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: 0.16 }}
            >
              {statCards.map((s, i) => (
                <motion.div
                  key={i}
                  className="contact-watta-stat-pill"
                  whileHover={reduce ? undefined : { y: -3 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                >
                  <s.icon size={16} className="mb-2 text-white/55" strokeWidth={2.2} />
                  <motion.div
                    className="text-xl font-black sm:text-2xl"
                    initial={reduce ? false : { opacity: 0, scale: 0.92 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + i * 0.06, duration: 0.4 }}
                  >
                    {s.val}
                  </motion.div>
                  <motion.div
                    className="mt-1 text-[10px] font-semibold leading-snug text-white/65 sm:text-xs"
                    initial={reduce ? false : { opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.28 + i * 0.06 }}
                  >
                    {s.label}
                  </motion.div>
                </motion.div>
              ))}
            </motion.div>

            <p className="mt-8 text-center text-xs font-medium text-white/45 sm:text-left">{c.trustLine}</p>
          </div>

          <motion.div
            className="relative mx-auto w-full max-w-[360px] lg:max-w-none lg:justify-self-end"
            {...fadeUp}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.12 }}
          >
            <div className="contact-watta-hero-visual">
              <div className="contact-watta-hero-visual__glow" aria-hidden />
              <Image
                src="/sushi.webp"
                alt=""
                width={420}
                height={420}
                className="contact-watta-hero-visual__img"
                priority
              />
              <motion.div
                className="contact-watta-hero-visual__badge"
                animate={reduce ? undefined : { y: [0, -6, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <MessageCircle size={18} className="text-[#145142]" />
                <span>{c.stat1Val}</span>
                <span className="text-white/70">·</span>
                <span className="font-semibold text-white/90">{c.stat1Label}</span>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Теми звернень */}
      <section className="border-b border-gray-100 watta-page-bg py-14 sm:py-18" aria-labelledby="contact-topics-heading">
        <motion.div
          className="mx-auto max-w-6xl px-4 sm:px-6"
          {...fadeUp}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.55 }}
        >
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <motion.div
              initial={reduce ? false : { opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45 }}
            >
              <h2 id="contact-topics-heading" className="text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">
                {c.topicsTitle}
              </h2>
              <p className="mt-2 max-w-xl text-base text-gray-600">{c.topicsSub}</p>
            </motion.div>
          </div>
          <motion.div
            className="flex flex-wrap gap-2.5"
            initial={reduce ? false : { opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ staggerChildren: 0.05 }}
          >
            {topicChips.map((chip, i) => (
              <motion.div
                key={chip.label}
                initial={reduce ? false : { opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
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
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Як відповідаємо */}
      <section className="border-b border-gray-100 bg-white py-14 sm:py-18" aria-labelledby="contact-flow-heading">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <motion.div className="mb-10 text-center sm:mb-12" {...fadeUp} viewport={{ once: true }}>
            <h2 id="contact-flow-heading" className="text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">
              {c.flowTitle}
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-gray-600">{c.flowSub}</p>
          </motion.div>
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
        </div>
      </section>

      {/* Канали */}
      <section className="watta-page-bg py-14 sm:py-18" aria-labelledby="contact-channels-heading">
        <motion.div
          className="mx-auto max-w-6xl px-4 sm:px-6"
          {...fadeUp}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.55 }}
        >
          <h2 id="contact-channels-heading" className="mb-2 text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">
            {c.channelsTitle}
          </h2>
          <p className="mb-10 max-w-2xl text-base text-gray-600 sm:text-lg">{c.channelsSub}</p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            <motion.a
              href={`tel:${c.phoneTel.replace(/\s/g, '')}`}
              className="contact-watta-channel-card group"
              whileHover={reduce ? undefined : { y: -4 }}
            >
              <motion.div
                className="contact-watta-channel-card__ico"
                whileHover={reduce ? undefined : { scale: 1.06, rotate: -4 }}
              >
                <Phone size={22} />
              </motion.div>
              <span className="contact-watta-channel-card__label">{c.cardCall}</span>
              <span className="contact-watta-channel-card__value">{c.phoneDisplay}</span>
              <ArrowRight size={18} className="mt-4 text-[#145142]/40 transition group-hover:translate-x-1 group-hover:text-[#145142]" />
            </motion.a>
            <motion.a
              href={`mailto:${c.emailMailto}`}
              className="contact-watta-channel-card group"
              whileHover={reduce ? undefined : { y: -4 }}
            >
              <motion.div className="contact-watta-channel-card__ico contact-watta-channel-card__ico--grad" whileHover={reduce ? undefined : { scale: 1.06 }}>
                <Mail size={22} />
              </motion.div>
              <span className="contact-watta-channel-card__label">{c.cardEmail}</span>
              <span className="contact-watta-channel-card__value break-all">{c.emailDisplay}</span>
              <ArrowRight size={18} className="mt-4 text-[#145142]/40 transition group-hover:translate-x-1 group-hover:text-[#145142]" />
            </motion.a>
            <motion.div className="contact-watta-channel-card" whileHover={reduce ? undefined : { y: -4 }}>
              <motion.div className="contact-watta-channel-card__ico" whileHover={reduce ? undefined : { scale: 1.06 }}>
                <MapPin size={22} />
              </motion.div>
              <span className="contact-watta-channel-card__label">{c.cardAddress}</span>
              <p className="contact-watta-channel-card__value text-sm leading-snug">{addressLine}</p>
              <a
                href={wattaRestaurantExternalMapsUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-[#145142] hover:underline"
              >
                {c.openMaps}
                <ArrowRight size={16} />
              </a>
            </motion.div>
            <motion.div className="contact-watta-channel-card" whileHover={reduce ? undefined : { y: -4 }}>
              <motion.div className="contact-watta-channel-card__ico" whileHover={reduce ? undefined : { scale: 1.06 }}>
                <Clock size={22} />
              </motion.div>
              <span className="contact-watta-channel-card__label">{c.cardHours}</span>
              <p className="contact-watta-channel-card__value">{c.hoursDetail}</p>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Месенджери */}
      {messengerCards.length > 0 ? (
        <section className="border-y border-gray-100 bg-[#f6f9f7] py-14 sm:py-18">
          <motion.div
            className="mx-auto max-w-6xl px-4 sm:px-6"
            {...fadeUp}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="mb-2 text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">{c.socialTitle}</h2>
            <p className="mb-8 max-w-2xl text-gray-600">{c.messengerSub}</p>
            <motion.div
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              initial={reduce ? false : { opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              {messengerCards.map((card, i) => (
                <motion.a
                  key={card.title}
                  href={card.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={card.aria}
                  className={cn('contact-watta-messenger', card.className)}
                  initial={reduce ? false : { opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07 }}
                  whileHover={reduce ? undefined : { y: -4, scale: 1.01 }}
                >
                  <span className="contact-watta-messenger__ico">{card.icon}</span>
                  <span className="contact-watta-messenger__title">{card.title}</span>
                  <span className="contact-watta-messenger__sub">{card.sub}</span>
                  <ArrowRight size={20} className="contact-watta-messenger__arrow" />
                </motion.a>
              ))}
            </motion.div>
          </motion.div>
        </section>
      ) : null}

      {/* Корпоративи */}
      <section className="watta-page-bg py-10 sm:py-14">
        <motion.div
          className="mx-auto max-w-6xl px-4 sm:px-6"
          {...fadeUp}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="contact-watta-corporate">
            <motion.div
              className="relative z-[1] max-w-xl"
              initial={reduce ? false : { opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="contact-watta-corporate__kicker">{c.topicCorporate}</span>
              <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl md:text-4xl">{c.corporateTitle}</h2>
              <p className="mt-3 text-sm leading-relaxed text-white/80 sm:text-base">{c.corporateSub}</p>
              <button
                type="button"
                onClick={() => scrollToFormWithTopic('corporate')}
                className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-black text-[#145142] shadow-lg transition hover:scale-[1.02]"
              >
                {c.corporateCta}
                <ArrowRight size={18} />
              </button>
            </motion.div>
            <Building2
              className="pointer-events-none absolute -right-4 bottom-0 h-32 w-32 text-white/10 sm:h-40 sm:w-40"
              strokeWidth={1}
              aria-hidden
            />
          </div>
        </motion.div>
      </section>

      {/* Швидкі посилання */}
      <section className="border-t border-gray-100 bg-white py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[#145142]/70">{c.quickLinksTitle}</p>
          <motion.div className="flex flex-wrap gap-2">
            {quickLinks.map((link) => (
              <Link key={link.href} href={link.href} className="contact-watta-quick-link">
                {link.label}
              </Link>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Карта */}
      <section className="watta-page-bg py-14 sm:py-18">
        <motion.div
          className="mx-auto max-w-6xl px-4 sm:px-6"
          {...fadeUp}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
        >
          <h2 className="mb-2 text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">{c.mapTitle}</h2>
          <p className="mb-8 max-w-2xl text-base text-gray-600 sm:text-lg">{c.mapSub}</p>
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
            <motion.div
              className="contact-watta-map-card"
              initial={reduce ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <p className="font-black text-gray-900">{addressLine}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="contact-watta-map-badge">{c.mapBadgePickup}</span>
                <span className="contact-watta-map-badge contact-watta-map-badge--open">{c.mapBadgeOpen}</span>
              </div>
              <a
                href={wattaRestaurantExternalMapsUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-[#145142]"
              >
                {c.openMaps}
                <ArrowRight size={16} />
              </a>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* FAQ */}
      <section className="border-t border-gray-100 bg-white py-14 sm:py-18">
        <motion.div
          className="mx-auto max-w-6xl px-4 sm:px-6"
          {...fadeUp}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
        >
          <h2 className="mb-2 text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">{c.faqTitle}</h2>
          <p className="mb-10 max-w-2xl text-gray-600">{c.faqSub}</p>
          <div className="grid gap-3 lg:grid-cols-2">
            {faqs.map((item, i) => {
              const open = faqOpen === i
              return (
                <motion.div
                  key={i}
                  className={cn('contact-watta-faq-item', open && 'contact-watta-faq-item--open')}
                  layout={!reduce}
                  initial={reduce ? false : { opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: (i % 3) * 0.04 }}
                >
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                    onClick={() => setFaqOpen(open ? null : i)}
                    aria-expanded={open}
                  >
                    <span className="font-bold text-gray-900">{item.q}</span>
                    <ChevronDown
                      size={22}
                      className={cn('shrink-0 text-[#145142] transition-transform', open && 'rotate-180')}
                    />
                  </button>
                  {open ? (
                    <motion.div
                      className="border-t border-gray-100 px-5 py-4 text-sm leading-relaxed text-gray-600"
                      initial={reduce ? false : { opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                    >
                      {item.a}
                    </motion.div>
                  ) : null}
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      </section>

      {/* Форма */}
      <section
        id="watta-contact-form"
        className="scroll-mt-[calc(5rem+env(safe-area-inset-top))] border-t border-gray-100 watta-page-bg py-14 sm:py-18"
      >
        <motion.div
          className="mx-auto max-w-6xl px-4 sm:px-6"
          {...fadeUp}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
        >
          <motion.div
            className="grid gap-8 lg:grid-cols-[1fr_0.42fr] lg:gap-10"
            initial={reduce ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="overflow-hidden rounded-[28px] border border-gray-200/90 bg-white p-6 shadow-[0_20px_70px_rgba(20,81,66,0.1)] sm:p-10">
              <h2 className="mb-2 text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">{c.formTitle}</h2>
              <p className="mb-8 text-gray-600 sm:text-lg">{c.formSub}</p>
              <form onSubmit={submitForm} className="grid gap-5">
                <label className="sr-only" htmlFor="contact-honey">
                  {c.honeyLabel}
                </label>
                <input
                  id="contact-honey"
                  name="website"
                  value={form.website}
                  onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                  className="hidden"
                  tabIndex={-1}
                  autoComplete="off"
                />
                <motion.div
                  initial={reduce ? false : { opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                >
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#145142]/80">
                    {c.formTopicLabel}
                  </label>
                  <select
                    value={formTopic}
                    onChange={(e) => setFormTopic(e.target.value as FormTopic)}
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-inner outline-none ring-[#145142]/30 transition focus:ring-2"
                  >
                    <option value="menu">{c.formTopicMenu}</option>
                    <option value="delivery">{c.formTopicDelivery}</option>
                    <option value="corporate">{c.formTopicCorporate}</option>
                    <option value="other">{c.formTopicOther}</option>
                  </select>
                </motion.div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#145142]/80">
                      {c.phName}
                    </label>
                    <input
                      required
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-inner outline-none ring-[#145142]/30 transition focus:ring-2"
                      placeholder={c.phName}
                      maxLength={120}
                    />
                  </div>
                  <motion.div
                    initial={reduce ? false : { opacity: 0, x: 8 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.05 }}
                  >
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#145142]/80">
                      {c.phEmail}
                    </label>
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-inner outline-none ring-[#145142]/30 transition focus:ring-2"
                      placeholder={c.phEmail}
                      maxLength={120}
                    />
                  </motion.div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#145142]/80">
                    {c.phPhone}
                  </label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-inner outline-none ring-[#145142]/30 transition focus:ring-2"
                    placeholder={c.phPhone}
                    maxLength={48}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#145142]/80">
                    {c.phMessage}
                  </label>
                  <textarea
                    required
                    value={form.message}
                    onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                    rows={5}
                    className="w-full resize-y rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-inner outline-none ring-[#145142]/30 transition focus:ring-2"
                    placeholder={c.phMessage}
                    maxLength={4000}
                  />
                </div>
                <motion.button
                  type="submit"
                  disabled={sending}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#145142] px-8 py-4 text-base font-bold text-white shadow-lg shadow-[#145142]/30 transition hover:bg-[#1a6b58] disabled:opacity-60"
                  whileTap={reduce ? undefined : { scale: 0.98 }}
                >
                  <Send size={20} />
                  {sending ? c.formSending : c.formSubmit}
                </motion.button>
              </form>
            </div>

            <aside className="contact-watta-form-aside">
              <h3 className="text-lg font-black text-[#0f241e]">{c.formAsideTitle}</h3>
              <ul className="mt-5 space-y-4">
                {[c.formAside1, c.formAside2, c.formAside3].map((line, i) => (
                  <motion.li
                    key={i}
                    className="flex gap-3 text-sm leading-relaxed text-[#4a5c54]"
                    initial={reduce ? false : { opacity: 0, x: 8 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 + i * 0.08 }}
                  >
                    <BadgeCheck size={20} className="mt-0.5 shrink-0 text-[#145142]" strokeWidth={2.2} />
                    {line}
                  </motion.li>
                ))}
              </ul>
              <motion.div
                className="mt-8 overflow-hidden rounded-2xl border border-[#145142]/12 bg-white p-4 shadow-sm"
                whileHover={reduce ? undefined : { scale: 1.01 }}
              >
                <Image src="/logo.png" alt="" width={72} height={72} className="mx-auto object-contain" />
                <p className="mt-3 text-center text-sm font-bold text-[#145142]">Watta Sushi</p>
                <p className="mt-1 text-center text-xs text-gray-500">{c.channelsSub}</p>
              </motion.div>
            </aside>
          </motion.div>
        </motion.div>
      </section>

      {/* Низ */}
      <div className="border-t border-gray-100 watta-page-bg px-4 py-12 sm:px-6 sm:py-16">
        <motion.div
          className="contact-watta-bottom-cta relative mx-auto max-w-6xl overflow-hidden rounded-[28px] p-8 text-center text-white sm:p-12"
          {...fadeUp}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
        >
          <motion.div
            className="pointer-events-none absolute inset-0 opacity-30"
            style={{
              background: 'linear-gradient(110deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%)',
              backgroundSize: '200% 100%',
            }}
            animate={reduce ? undefined : { backgroundPosition: ['200% 0', '-200% 0'] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            aria-hidden
          />
          <h3 className="relative z-[1] text-2xl font-black sm:text-3xl md:text-4xl">{c.bottomTitle}</h3>
          <div className="relative z-[1] mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/"
              className="inline-flex rounded-2xl bg-white px-8 py-3.5 text-base font-bold text-[#145142] shadow-lg transition hover:scale-[1.02]"
            >
              {c.bottomCta}
            </Link>
            <Link
              href="/menu"
              className="inline-flex rounded-2xl border-2 border-white/40 px-8 py-3.5 text-base font-bold text-white transition hover:bg-white/10"
            >
              {c.ctaMenu}
            </Link>
          </div>
        </motion.div>
      </div>
    </motion.div>
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
