'use client'

import dynamic from 'next/dynamic'
import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
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

const LogoBackground = dynamic(() => import('./LogoBackground'), { ssr: false, loading: () => null })

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

function TiltSurface({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [tf, setTf] = useState('perspective(900px) rotateX(0deg) rotateY(0deg)')
  const reduce = useReducedMotion()

  const onMove = (e: React.MouseEvent) => {
    if (reduce) return
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width - 0.5
    const py = (e.clientY - r.top) / r.height - 0.5
    setTf(`perspective(900px) rotateX(${py * -12}deg) rotateY(${px * 12}deg) scale3d(1.02,1.02,1.02)`)
  }
  const onLeave = () => setTf('perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)')

  return (
    <div
      ref={ref}
      className={className}
      style={{
        transform: tf,
        transition: 'transform 0.18s ease-out',
        transformStyle: 'preserve-3d',
      }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      {children}
    </div>
  )
}

type SiteLinks = { telegramUrl: string; whatsappUrl: string; instagramUrl: string }

export default function ContactsView({ onBack }: { onBack: () => void }) {
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
          instagramUrl: String(d.instagramUrl || '').trim(),
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
    ? { initial: false, whileInView: undefined }
    : { initial: { opacity: 0, y: 28 }, whileInView: { opacity: 1, y: 0 } }

  return (
    <div
      className="relative min-h-[100dvh] overflow-x-hidden pb-24 pt-6 sm:pt-10"
      style={{
        backgroundImage:
          "linear-gradient(165deg, rgba(244,251,247,0.97) 0%, rgba(232,241,236,0.98) 45%, rgba(220,234,228,0.95) 100%), url('/background.jpg')",
        backgroundSize: 'cover, 280px',
        backgroundAttachment: 'scroll, fixed',
      }}
    >
      <div className="pointer-events-none absolute inset-0 z-0 opacity-40">
        <LogoBackground />
      </div>

      <div className="relative z-[1] mx-auto w-full max-w-6xl px-4 sm:px-6">
        <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-2xl border border-[#145142]/15 bg-white/90 px-4 py-2.5 text-sm font-bold text-[#145142] shadow-sm backdrop-blur-md transition hover:bg-white"
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
              className="rounded-2xl border-2 border-[#145142]/30 bg-white/90 px-4 py-2.5 text-sm font-bold text-[#145142] backdrop-blur-md transition hover:border-[#145142]"
            >
              {c.ctaDelivery}
            </Link>
          </div>
        </header>

        {/* Hero + 3D */}
        <section className="relative mb-16 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="relative">
            <motion.p
              className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#145142]/20 bg-white/80 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-[#145142]/90 backdrop-blur-md"
              {...fadeUp}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5 }}
            >
              <Sparkles size={14} className="text-[#145142]" />
              {c.heroKicker}
            </motion.p>
            <motion.h1
              className="mb-4 max-w-xl text-4xl font-black leading-[1.05] tracking-tight text-gray-900 sm:text-5xl md:text-6xl"
              style={{ textShadow: '0 2px 40px rgba(20,81,66,0.08)' }}
              {...fadeUp}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: 0.05 }}
            >
              {c.heroTitle}
            </motion.h1>
            <motion.p
              className="mb-8 max-w-xl text-base leading-relaxed text-gray-600 sm:text-lg"
              {...fadeUp}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: 0.1 }}
            >
              {c.heroSubtitle}
            </motion.p>

            <motion.div
              className="grid grid-cols-1 gap-3 sm:grid-cols-3"
              {...fadeUp}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: 0.14 }}
            >
              {[
                { val: c.stat1Val, label: c.stat1Label },
                { val: c.stat2Val, label: c.stat2Label },
                { val: c.stat3Val, label: c.stat3Label },
              ].map((s, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-white/60 bg-white/70 p-4 shadow-md shadow-[#145142]/10 backdrop-blur-md"
                >
                  <div className="text-2xl font-black text-[#145142]">{s.val}</div>
                  <div className="text-xs font-semibold leading-snug text-gray-600">{s.label}</div>
                </div>
              ))}
            </motion.div>

            <p className="mt-6 hidden text-center text-xs font-medium text-[#145142]/60 md:block">{c.scrollHint}</p>
          </div>

          <div className="relative mx-auto flex h-[min(420px,55vh)] w-full max-w-md items-center justify-center lg:h-[480px]">
            <div
              className="pointer-events-none absolute inset-0 rounded-[40px] bg-gradient-to-br from-[#145142]/20 via-transparent to-emerald-400/20 blur-3xl"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute left-1/2 top-8 h-24 w-24 -translate-x-1/2 rounded-full border border-[#145142]/20 opacity-60 animate-watta-orbit"
              aria-hidden
            />
            <TiltSurface className="relative z-[1] w-full max-w-[320px]">
              <div
                className="relative overflow-hidden rounded-[32px] border border-white/70 bg-gradient-to-br from-white via-[#f4faf7] to-[#e3efe8] p-8 shadow-[0_24px_80px_rgba(20,81,66,0.22)]"
                style={{ transform: 'translateZ(24px)' }}
              >
                <div
                  className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full bg-[#145142]/10 blur-2xl"
                  aria-hidden
                />
                <div className="mx-auto mb-6 flex justify-center animate-watta-float will-change-transform">
                  <div className="relative h-36 w-36">
                    <div
                      className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#145142] to-[#0f3d32] shadow-xl"
                      style={{ transform: 'rotateY(12deg) rotateX(8deg)' }}
                    />
                    <div className="absolute inset-2 flex items-center justify-center rounded-2xl bg-white/95 shadow-inner">
                      <Image src="/logo.png" alt="" width={100} height={100} className="object-contain drop-shadow-lg" priority />
                    </div>
                  </div>
                </div>
                <p className="text-center text-sm font-bold text-[#145142]">Watta Sushi</p>
                <p className="mt-2 text-center text-xs leading-relaxed text-gray-600">{c.channelsSub}</p>
              </div>
            </TiltSurface>
          </div>
        </section>

        {/* Channels */}
        <motion.section
          className="mb-16"
          {...fadeUp}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.55 }}
        >
          <h2 className="mb-2 text-2xl font-black text-gray-900 sm:text-3xl">{c.channelsTitle}</h2>
          <p className="mb-8 max-w-2xl text-gray-600">{c.channelsSub}</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <a
              href={`tel:${c.phoneTel.replace(/\s/g, '')}`}
              className="group flex flex-col rounded-3xl border border-white/70 bg-white/85 p-6 shadow-lg shadow-[#145142]/10 backdrop-blur-md transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#145142] text-white shadow-md transition group-hover:scale-110">
                <Phone size={22} />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#145142]/80">{c.cardCall}</span>
              <span className="mt-1 text-lg font-bold text-gray-900">{c.phoneDisplay}</span>
            </a>
            <a
              href={`mailto:${c.emailMailto}`}
              className="group flex flex-col rounded-3xl border border-white/70 bg-white/85 p-6 shadow-lg shadow-[#145142]/10 backdrop-blur-md transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#145142] to-[#1a6b58] text-white shadow-md transition group-hover:scale-110">
                <Mail size={22} />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#145142]/80">{c.cardEmail}</span>
              <span className="mt-1 break-all text-lg font-bold text-gray-900">{c.emailDisplay}</span>
            </a>
            <div className="flex flex-col rounded-3xl border border-white/70 bg-white/85 p-6 shadow-lg shadow-[#145142]/10 backdrop-blur-md">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#145142]/90 text-white shadow-md">
                <MapPin size={22} />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#145142]/80">{c.cardAddress}</span>
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
            <div className="flex flex-col rounded-3xl border border-white/70 bg-white/85 p-6 shadow-lg shadow-[#145142]/10 backdrop-blur-md">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#145142]/90 text-white shadow-md">
                <Clock size={22} />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#145142]/80">{c.cardHours}</span>
              <p className="mt-1 text-lg font-bold text-gray-900">{c.hoursDetail}</p>
            </div>
          </div>
        </motion.section>

        {/* Social */}
        {(links.telegramUrl || links.whatsappUrl || links.instagramUrl) && (
          <motion.section
            className="mb-16"
            {...fadeUp}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="mb-6 text-2xl font-black text-gray-900">{c.socialTitle}</h2>
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
          </motion.section>
        )}

        {/* Map */}
        <motion.section
          className="mb-16"
          {...fadeUp}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
        >
          <h2 className="mb-2 text-2xl font-black text-gray-900 sm:text-3xl">{c.mapTitle}</h2>
          <p className="mb-6 max-w-2xl text-gray-600">{c.mapSub}</p>
          <div className="overflow-hidden rounded-[28px] border border-white/80 bg-white/90 shadow-2xl shadow-[#145142]/15 backdrop-blur-md">
            <div className="aspect-[16/10] w-full min-h-[280px] sm:min-h-[360px]">
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
        </motion.section>

        {/* FAQ */}
        <motion.section
          className="mb-16"
          {...fadeUp}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
        >
          <h2 className="mb-2 text-2xl font-black text-gray-900 sm:text-3xl">{c.faqTitle}</h2>
          <p className="mb-8 text-gray-600">{c.faqSub}</p>
          <div className="space-y-3">
            {faqs.map((item, i) => {
              const open = faqOpen === i
              return (
                <div
                  key={i}
                  className="overflow-hidden rounded-2xl border border-[#145142]/10 bg-white/90 shadow-md backdrop-blur-md"
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
        </motion.section>

        {/* Form */}
        <motion.section
          id="watta-contact-form"
          className="mb-20 scroll-mt-24"
          {...fadeUp}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
        >
          <div className="overflow-hidden rounded-[32px] border border-[#145142]/15 bg-gradient-to-br from-white via-[#f7fbf9] to-[#eaf4ef] p-6 shadow-[0_28px_90px_rgba(20,81,66,0.12)] sm:p-10">
            <h2 className="mb-2 text-2xl font-black text-gray-900">{c.formTitle}</h2>
            <p className="mb-8 text-gray-600">{c.formSub}</p>
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
        </motion.section>

        {/* Bottom CTA */}
        <motion.div
          className="relative overflow-hidden rounded-[28px] border border-[#145142]/20 bg-[#145142] p-8 text-center text-white shadow-2xl"
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
          <h3 className="relative z-[1] text-2xl font-black sm:text-3xl">{c.bottomTitle}</h3>
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
