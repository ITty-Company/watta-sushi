'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import toast from 'react-hot-toast'
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
} from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import {
  wattaRestaurantEmbedUrl,
  wattaRestaurantExternalMapsUrl,
} from '@/lib/wattaRestaurantLocation'
import { WATTA_INSTAGRAM_URL } from '@/lib/wattaSiteDefaults'

/** Спокійний тон (як фон сайту), без контрастного «кінематографічного» зеленого */
const HERO_BG =
  'linear-gradient(165deg, #f2f6f4 0%, #e8f0ec 42%, #dfe9e4 78%, #eef3f0 100%)'

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

type SiteLinks = { telegramUrl: string; whatsappUrl: string; instagramUrl: string }

export type ContactsViewProps = {
  /** Якщо true — компактний хедер «назад» (без глобальної шапки сайту) */
  embedded?: boolean
  onBack?: () => void
}

export default function ContactsView({ embedded = false, onBack }: ContactsViewProps) {
  const { t } = useLanguage()
  const c = t.contactPage
  const reduce = useReducedMotion()

  const [links, setLinks] = useState<SiteLinks>({ telegramUrl: '', whatsappUrl: '', instagramUrl: '' })
  const [pickupAddress, setPickupAddress] = useState('')
  const [faqOpen, setFaqOpen] = useState<number | null>(0)
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

  const scrollToForm = useCallback(() => {
    document.getElementById('watta-contact-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (String(form.website || '').trim()) {
      toast.success(c.formSuccess)
      return
    }
    const name = form.name.trim()
    const email = form.email.trim()
    const message = form.message.trim()
    if (name.length < 2 || name.length > 120) {
      toast.error(c.errName)
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error(c.errEmail)
      return
    }
    if (message.length < 10 || message.length > 4000) {
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
    { val: c.stat1Val, label: c.stat1Label },
    { val: c.stat2Val, label: c.stat2Label },
    { val: c.stat3Val, label: c.stat3Label },
  ]

  return (
    <div className="relative min-h-[100dvh] w-full overflow-x-hidden bg-white pb-24">
      {embedded && onBack ? (
        <div className="border-b border-gray-100 bg-white px-4 py-4 sm:px-6">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 rounded-2xl border border-[#145142]/15 bg-white px-4 py-2.5 text-sm font-bold text-[#145142] shadow-sm transition hover:bg-gray-50"
            >
              <ArrowLeft size={20} strokeWidth={2.25} />
              {t.auth.back}
            </button>
            <div className="flex flex-wrap gap-2">
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
            </div>
          </div>
        </div>
      ) : null}

      {/* Герой: м’який світлий блок у тон сайту */}
      <section
        className="relative overflow-hidden text-[#1a2c24]"
        style={{ background: HERO_BG }}
        aria-labelledby="contacts-hero-title"
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.55]"
          style={{
            background: `repeating-linear-gradient(
              -32deg,
              transparent,
              transparent 14px,
              rgba(20, 81, 66, 0.028) 14px,
              rgba(20, 81, 66, 0.028) 15px
            )`,
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-[15%] top-1/2 h-[min(70vw,480px)] w-[min(70vw,480px)] -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,107,53,0.07)_0%,transparent_68%)]"
          aria-hidden
        />

        <div className="relative z-[1] mx-auto grid max-w-6xl gap-12 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.12fr_0.88fr] lg:items-center lg:gap-16 lg:py-24">
          <div>
            <motion.p
              className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#145142]/14 bg-white/85 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-[#145142]/90 shadow-sm backdrop-blur-sm sm:text-xs"
              {...fadeUp}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5 }}
            >
              <Sparkles size={14} className="text-[#e85d2a]" />
              {c.heroKicker}
            </motion.p>
            <motion.h1
              id="contacts-hero-title"
              className="max-w-xl text-4xl font-black leading-[1.05] tracking-tight text-[#0f241e] sm:text-5xl md:text-6xl lg:text-[3.25rem] xl:text-7xl"
              {...fadeUp}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: 0.05 }}
            >
              {c.heroTitle}
            </motion.h1>
            <motion.p
              className="mt-5 max-w-xl text-base leading-relaxed text-[#4a5c54] sm:text-lg"
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
                className="rounded-2xl bg-[#145142] px-6 py-3.5 text-sm font-black text-white shadow-md shadow-[#145142]/20 transition hover:bg-[#104034]"
              >
                {c.ctaForm}
              </button>
              <Link
                href="/delivery"
                className="rounded-2xl border-2 border-[#145142]/22 bg-white/75 px-6 py-3.5 text-sm font-black text-[#145142] shadow-sm transition hover:border-[#145142]/35 hover:bg-white"
              >
                {c.ctaDelivery}
              </Link>
            </motion.div>

            <motion.div
              className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3"
              {...fadeUp}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: 0.16 }}
            >
              {statCards.map((s, i) => (
                <div
                  key={i}
                  className="rounded-[18px] border border-[#145142]/10 bg-white/80 px-4 py-4 shadow-sm backdrop-blur-sm sm:py-5"
                >
                  <div className="text-2xl font-black text-[#0f241e] sm:text-3xl">{s.val}</div>
                  <div className="mt-1 text-xs font-semibold leading-snug text-[#5a6d64]">{s.label}</div>
                </div>
              ))}
            </motion.div>

            <p className="mt-8 text-center text-xs font-medium text-[#7a8c84] sm:text-left">{c.scrollHint}</p>
          </div>

          <motion.div
            className="relative mx-auto w-full max-w-[340px] lg:max-w-none lg:justify-self-end"
            {...fadeUp}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.1 }}
          >
            <div className="overflow-hidden rounded-[28px] border border-[#145142]/10 bg-white/95 p-8 shadow-[0_18px_48px_rgba(20,81,66,0.08)]">
              <div className="mx-auto mb-5 flex justify-center">
                <div className="rounded-2xl border-[3px] border-[#145142] bg-gradient-to-br from-gray-50 to-white p-5 shadow-inner">
                  <Image src="/logo.png" alt="" width={108} height={108} className="object-contain" priority />
                </div>
              </div>
              <p className="text-center text-base font-black text-[#145142]">Watta Sushi</p>
              <p className="mt-3 text-center text-sm leading-relaxed text-[#5a5a5a]">{c.channelsSub}</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Канали звʼязку */}
      <section className="border-t border-gray-100 bg-[#f5f5f7] py-16 sm:py-20">
        <motion.div
          className="mx-auto max-w-6xl px-4 sm:px-6"
          {...fadeUp}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.55 }}
        >
          <h2 className="mb-2 text-3xl font-black tracking-tight text-gray-900 sm:text-4xl md:text-5xl">
            {c.channelsTitle}
          </h2>
          <p className="mb-10 max-w-2xl text-base text-gray-600 sm:text-lg">{c.channelsSub}</p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            <a
              href={`tel:${c.phoneTel.replace(/\s/g, '')}`}
              className="group flex flex-col rounded-[22px] border border-gray-200/90 bg-white p-6 shadow-[0_8px_40px_rgba(0,0,0,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_48px_rgba(0,0,0,0.08)]"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#145142] text-white shadow-md transition group-hover:scale-105">
                <Phone size={22} />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#145142]/85">{c.cardCall}</span>
              <span className="mt-1 text-lg font-black text-gray-900">{c.phoneDisplay}</span>
            </a>
            <a
              href={`mailto:${c.emailMailto}`}
              className="group flex flex-col rounded-[22px] border border-gray-200/90 bg-white p-6 shadow-[0_8px_40px_rgba(0,0,0,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_48px_rgba(0,0,0,0.08)]"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#145142] to-[#1a6b58] text-white shadow-md transition group-hover:scale-105">
                <Mail size={22} />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#145142]/85">{c.cardEmail}</span>
              <span className="mt-1 break-all text-lg font-black text-gray-900">{c.emailDisplay}</span>
            </a>
            <div className="flex flex-col rounded-[22px] border border-gray-200/90 bg-white p-6 shadow-[0_8px_40px_rgba(0,0,0,0.06)]">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#145142] text-white shadow-md">
                <MapPin size={22} />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#145142]/85">{c.cardAddress}</span>
              <p className="mt-1 text-sm font-semibold leading-snug text-gray-800">{addressLine}</p>
              <a
                href={wattaRestaurantExternalMapsUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 text-sm font-bold text-[#145142] underline-offset-4 hover:underline"
              >
                {c.openMaps}
              </a>
            </div>
            <div className="flex flex-col rounded-[22px] border border-gray-200/90 bg-white p-6 shadow-[0_8px_40px_rgba(0,0,0,0.06)]">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#145142] text-white shadow-md">
                <Clock size={22} />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#145142]/85">{c.cardHours}</span>
              <p className="mt-1 text-lg font-black text-gray-900">{c.hoursDetail}</p>
            </div>
          </div>
        </motion.div>
      </section>

      {(links.telegramUrl || links.whatsappUrl || links.instagramUrl) && (
        <section className="border-t border-gray-100 bg-white py-14 sm:py-16">
          <motion.div
            className="mx-auto max-w-6xl px-4 sm:px-6"
            {...fadeUp}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="mb-8 text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">{c.socialTitle}</h2>
            <div className="flex flex-wrap gap-4">
              {links.telegramUrl ? (
                <a
                  href={links.telegramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#229ED9] text-white shadow-lg transition hover:scale-110"
                  aria-label="Telegram"
                >
                  <IconTelegram className="h-7 w-7" />
                </a>
              ) : null}
              {links.whatsappUrl ? (
                <a
                  href={links.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#25D366] text-white shadow-lg transition hover:scale-110"
                  aria-label="WhatsApp"
                >
                  <IconWhatsApp className="h-7 w-7" />
                </a>
              ) : null}
              {links.instagramUrl ? (
                <a
                  href={links.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#f09433] via-[#dc2743] to-[#bc1888] text-white shadow-lg transition hover:scale-110"
                  aria-label="Instagram"
                >
                  <Instagram className="h-7 w-7" strokeWidth={2} />
                </a>
              ) : null}
            </div>
          </motion.div>
        </section>
      )}

      <section className="border-t border-gray-100 bg-white py-16 sm:py-20">
        <motion.div
          className="mx-auto max-w-6xl px-4 sm:px-6"
          {...fadeUp}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
        >
          <h2 className="mb-2 text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">{c.mapTitle}</h2>
          <p className="mb-8 max-w-2xl text-base text-gray-600 sm:text-lg">{c.mapSub}</p>
          <div className="overflow-hidden rounded-[28px] border border-gray-200/80 bg-white shadow-[0_12px_48px_rgba(0,0,0,0.08)]">
            <div className="aspect-[16/10] min-h-[280px] w-full sm:min-h-[360px]">
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
        </motion.div>
      </section>

      <section className="border-t border-gray-100 bg-[#f5f5f7] py-16 sm:py-20">
        <motion.div
          className="mx-auto max-w-6xl px-4 sm:px-6"
          {...fadeUp}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
        >
          <h2 className="mb-2 text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">{c.faqTitle}</h2>
          <p className="mb-10 max-w-2xl text-gray-600">{c.faqSub}</p>
          <div className="space-y-3">
            {faqs.map((item, i) => {
              const open = faqOpen === i
              return (
                <div
                  key={i}
                  className="overflow-hidden rounded-[20px] border border-gray-200/90 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.05)]"
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
                      className={`shrink-0 text-[#145142] transition-transform ${open ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {open ? (
                    <div className="border-t border-gray-100 px-5 py-4 text-sm leading-relaxed text-gray-600">{item.a}</div>
                  ) : null}
                </div>
              )
            })}
          </div>
        </motion.div>
      </section>

      <section id="watta-contact-form" className="scroll-mt-[calc(5rem+env(safe-area-inset-top))] border-t border-gray-100 bg-white py-16 sm:py-20">
        <motion.div
          className="mx-auto max-w-6xl px-4 sm:px-6"
          {...fadeUp}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
        >
          <div className="overflow-hidden rounded-[28px] border border-gray-200/90 bg-gradient-to-br from-white via-[#f8fbf9] to-[#eef6f1] p-6 shadow-[0_20px_70px_rgba(20,81,66,0.1)] sm:p-10 lg:max-w-4xl">
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
                <div>
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
                </div>
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
              <button
                type="submit"
                disabled={sending}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#145142] px-8 py-4 text-base font-bold text-white shadow-lg shadow-[#145142]/30 transition hover:bg-[#1a6b58] disabled:opacity-60"
              >
                <Send size={20} />
                {sending ? c.formSending : c.formSubmit}
              </button>
            </form>
          </div>
        </motion.div>
      </section>

      <div className="border-t border-gray-100 bg-[#f5f5f7] px-4 py-12 sm:px-6 sm:py-16">
        <motion.div
          className="relative mx-auto max-w-6xl overflow-hidden rounded-[28px] border border-[#145142]/25 bg-[#145142] p-8 text-center text-white shadow-[0_20px_60px_rgba(20,81,66,0.35)] sm:p-12"
          {...fadeUp}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-30 animate-watta-shimmer"
            style={{
              background: 'linear-gradient(110deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%)',
              backgroundSize: '200% 100%',
            }}
            aria-hidden
          />
          <h3 className="relative z-[1] text-2xl font-black sm:text-3xl md:text-4xl">{c.bottomTitle}</h3>
          <Link
            href="/"
            className="relative z-[1] mt-6 inline-flex rounded-2xl bg-white px-8 py-3.5 text-base font-bold text-[#145142] shadow-lg transition hover:scale-[1.02]"
          >
            {c.bottomCta}
          </Link>
        </motion.div>
      </div>
    </div>
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
}) {
  return [
    { q: c.faq1Q, a: c.faq1A },
    { q: c.faq2Q, a: c.faq2A },
    { q: c.faq3Q, a: c.faq3A },
    { q: c.faq4Q, a: c.faq4A },
    { q: c.faq5Q, a: c.faq5A },
  ]
}
