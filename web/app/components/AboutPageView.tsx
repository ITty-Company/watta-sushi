'use client'

import dynamic from 'next/dynamic'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import {
  ArrowLeft,
  Award,
  ChefHat,
  Heart,
  MapPin,
  Menu,
  Package,
  Phone,
  Sparkles,
  Star,
  Truck,
  Users,
  Zap,
  Clock,
} from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

const LogoBackground = dynamic(() => import('./LogoBackground'), { ssr: false, loading: () => null })

interface TeamMember {
  id: number
  name_ru: string
  name_ua?: string
  name_en?: string
  name_nl?: string
  position_ru: string
  position_ua?: string
  position_en?: string
  position_nl?: string
  imageUrl?: string
  bio_ru?: string
  bio_ua?: string
  bio_en?: string
  bio_nl?: string
}

function TiltLogo({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [tf, setTf] = useState('perspective(960px) rotateX(0deg) rotateY(0deg)')
  const reduce = useReducedMotion()
  const onMove = (e: React.MouseEvent) => {
    if (reduce) return
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width - 0.5
    const py = (e.clientY - r.top) / r.height - 0.5
    setTf(`perspective(960px) rotateX(${py * -14}deg) rotateY(${px * 14}deg) scale3d(1.03,1.03,1.03)`)
  }
  const onLeave = () => setTf('perspective(960px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)')
  return (
    <div
      ref={ref}
      className={className}
      style={{ transform: tf, transition: 'transform 0.2s ease-out', transformStyle: 'preserve-3d' }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      {children}
    </div>
  )
}

export type AboutPageViewProps = {
  embedded?: boolean
  onBack?: () => void
  onMenuClick?: () => void
}

function AboutPageView({ embedded = false, onBack, onMenuClick }: AboutPageViewProps) {
  const router = useRouter()
  const { t, getLocalized } = useLanguage()
  const a = t.aboutPage
  const reduce = useReducedMotion()
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })
  const heroY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 120])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.85], [1, reduce ? 1 : 0.35])

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
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const marqueeItems = useMemo(() => a.marqueeWords.split('|').filter(Boolean), [a.marqueeWords])

  const stats = useMemo(
    () => [
      { icon: Users, value: '10K+', label: a.stats.clients },
      { icon: Award, value: '5+', label: a.stats.experience },
      { icon: Zap, value: '30', label: a.stats.delivery },
      { icon: Heart, value: '100%', label: a.stats.quality },
    ],
    [a.stats]
  )

  const features = useMemo(
    () => [
      { icon: Star, title: a.features.freshTitle, text: a.features.freshText },
      { icon: Zap, title: a.features.fastTitle, text: a.features.fastText },
      { icon: Award, title: a.features.qualityTitle, text: a.features.qualityText },
      { icon: Heart, title: a.features.missionTitle, text: a.features.missionText },
    ],
    [a.features]
  )

  const journey = useMemo(
    () => [
      { icon: Sparkles, title: a.j1Title, body: a.j1Body },
      { icon: ChefHat, title: a.j2Title, body: a.j2Body },
      { icon: Package, title: a.j3Title, body: a.j3Body },
      { icon: Truck, title: a.j4Title, body: a.j4Body },
    ],
    [a]
  )

  const bento = useMemo(
    () => [
      { title: a.bento1Title, body: a.bento1Body, span: 'lg:min-h-[220px]' },
      { title: a.bento2Title, body: a.bento2Body, span: '' },
      { title: a.bento3Title, body: a.bento3Body, span: '' },
      { title: a.bento4Title, body: a.bento4Body, span: 'sm:col-span-2' },
    ],
    [a]
  )

  const fade = reduce
    ? { initial: false, whileInView: undefined as undefined }
    : { initial: { opacity: 0, y: 26 }, whileInView: { opacity: 1, y: 0 } }

  return (
    <div
      id="about-page-container"
      className="relative min-h-screen w-full overflow-x-hidden pb-16"
      style={{ background: 'linear-gradient(180deg, #f4fbf7 0%, #eef6f1 40%, #e5f0ea 100%)' }}
    >
      <div className="pointer-events-none absolute inset-0 z-0 opacity-[0.35]">
        <LogoBackground />
      </div>

      {/* Декоративні орби */}
      <div className="pointer-events-none absolute left-[8%] top-32 h-72 w-72 rounded-full bg-[#145142]/10 blur-[100px]" aria-hidden />
      <div className="pointer-events-none absolute right-[-5%] top-[40vh] h-96 w-96 rounded-full bg-emerald-300/20 blur-[120px]" aria-hidden />

      <header className="sticky top-0 z-40 border-b border-[#145142]/10 bg-white/75 px-4 py-3 backdrop-blur-xl sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={goBack}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#145142]/15 bg-white text-[#145142] shadow-sm transition hover:bg-[#145142]/5"
              aria-label={t.auth.back}
            >
              <ArrowLeft size={22} />
            </button>
            <div className="min-w-0">
              <p className="truncate text-[10px] font-bold uppercase tracking-[0.25em] text-[#145142]/70">{a.heroKicker}</p>
              <h1 className="truncate text-lg font-black text-gray-900 sm:text-xl">{a.title}</h1>
            </div>
          </div>
          {embedded && onMenuClick ? (
            <button
              type="button"
              onClick={onMenuClick}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#145142]/15 bg-white text-[#145142] shadow-sm transition hover:bg-[#145142]/5"
              aria-label={t.menu}
            >
              <Menu size={22} />
            </button>
          ) : (
            <Link
              href="/"
              className="hidden rounded-xl border border-[#145142]/20 bg-[#145142] px-4 py-2 text-sm font-bold text-white shadow-md transition hover:bg-[#1a6b58] sm:inline-flex"
            >
              {t.navigation.home}
            </Link>
          )}
        </div>
      </header>

      {/* Marquee */}
      <div className="relative z-10 border-y border-[#145142]/10 bg-[#145142] py-2.5 text-white overflow-hidden">
        <div className="watta-about-marquee flex w-max gap-10 pr-10 animate-[watta-marquee_32s_linear_infinite] font-bold uppercase tracking-[0.35em] text-[10px] sm:text-xs">
          {[...marqueeItems, ...marqueeItems, ...marqueeItems].map((word, i) => (
            <span key={`${word}-${i}`} className="whitespace-nowrap opacity-90">
              {word}
            </span>
          ))}
        </div>
      </div>

      {/* Hero */}
      <motion.section
        ref={heroRef}
        style={{ y: heroY, opacity: heroOpacity }}
        className="relative z-10 mx-auto grid max-w-6xl gap-10 px-4 pb-16 pt-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-14 lg:pt-14"
      >
        <div>
          <motion.p
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#145142]/20 bg-white/90 px-4 py-1.5 text-xs font-bold text-[#145142] shadow-sm backdrop-blur"
            {...fade}
            viewport={{ once: true, margin: '-20px' }}
            transition={{ duration: 0.45 }}
          >
            <Sparkles size={14} />
            {a.heroWordmark}
          </motion.p>
          <motion.h2
            className="mb-5 text-4xl font-black leading-[1.05] tracking-tight text-gray-900 sm:text-5xl md:text-6xl"
            {...fade}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.04 }}
          >
            <span className="bg-gradient-to-r from-[#145142] via-[#1a6b58] to-[#0f3d32] bg-clip-text text-transparent">
              Watta Sushi
            </span>
          </motion.h2>
          <motion.p
            className="mb-3 text-xl font-bold text-gray-800 sm:text-2xl"
            {...fade}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.08 }}
          >
            {a.subtitle}
          </motion.p>
          <motion.p
            className="max-w-xl text-base leading-relaxed text-gray-600 sm:text-lg"
            {...fade}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.12 }}
          >
            {a.description}
          </motion.p>
          <motion.div
            className="mt-8 flex flex-wrap gap-3"
            {...fade}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.16 }}
          >
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-2xl bg-[#145142] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#145142]/25 transition hover:bg-[#1a6b58]"
            >
              {a.ctaMenu}
            </Link>
            <Link
              href="/contacts"
              className="inline-flex items-center justify-center rounded-2xl border-2 border-[#145142]/30 bg-white px-6 py-3.5 text-sm font-bold text-[#145142] transition hover:border-[#145142]"
            >
              {a.ctaContacts}
            </Link>
            <Link
              href="/delivery"
              className="inline-flex items-center justify-center rounded-2xl border border-transparent px-6 py-3.5 text-sm font-bold text-[#145142]/90 underline-offset-4 hover:underline"
            >
              {a.ctaDelivery}
            </Link>
          </motion.div>
        </div>

        <div className="relative mx-auto flex min-h-[280px] w-full max-w-sm items-center justify-center lg:max-w-none">
          <div
            className="pointer-events-none absolute inset-0 rounded-[40px] bg-gradient-to-br from-[#145142]/15 via-transparent to-teal-300/25 blur-2xl"
            aria-hidden
          />
          <TiltLogo className="relative z-[1] w-full max-w-[280px]">
            <div
              className="relative overflow-hidden rounded-[36px] border border-white/80 bg-gradient-to-br from-white via-[#f3faf7] to-[#dceee4] p-10 shadow-[0_28px_90px_rgba(20,81,66,0.2)]"
              style={{ transform: 'translateZ(20px)' }}
            >
              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#145142]/10 blur-3xl" aria-hidden />
              <div className="mx-auto flex justify-center animate-watta-float">
                <Image src="/logo.png" alt="" width={120} height={120} className="object-contain drop-shadow-xl" priority />
              </div>
              <p className="mt-6 text-center text-xs font-bold uppercase tracking-[0.2em] text-[#145142]/80">Watta Sushi</p>
            </div>
          </TiltLogo>
        </div>
      </motion.section>

      {/* Stats */}
      <section className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              className="rounded-3xl border border-white/80 bg-white/90 p-5 text-center shadow-lg shadow-[#145142]/8 backdrop-blur-md"
              {...fade}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.45, delay: i * 0.05 }}
            >
              <s.icon className="mx-auto mb-2 h-8 w-8 text-[#145142]" strokeWidth={2} />
              <div className="text-2xl font-black text-[#145142] sm:text-3xl">{s.value}</div>
              <div className="mt-1 text-xs font-semibold leading-snug text-gray-600 sm:text-sm">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Story */}
      <section className="relative z-10 mx-auto mt-20 max-w-6xl px-4 sm:px-6">
        <motion.h3
          className="mb-4 text-3xl font-black text-gray-900 sm:text-4xl"
          {...fade}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {a.storyTitle}
        </motion.h3>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <motion.div
            className="space-y-5 text-base leading-relaxed text-gray-700 sm:text-lg"
            {...fade}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
          >
            <p className="font-medium text-gray-800">{a.storyLead}</p>
            <p>{a.storyP2}</p>
            <p>{a.storyP3}</p>
          </motion.div>
          <motion.div
            className="relative overflow-hidden rounded-[28px] border border-[#145142]/15 bg-gradient-to-b from-[#145142] to-[#0c3028] p-8 text-white shadow-xl lg:sticky lg:top-28"
            {...fade}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.08 }}
          >
            <div className="pointer-events-none absolute -right-6 top-0 h-32 w-32 rounded-full bg-white/10 blur-2xl" aria-hidden />
            <p className="text-sm font-bold uppercase tracking-widest text-white/70">{a.whyUs}</p>
            <ul className="mt-6 space-y-4">
              {features.slice(0, 3).map((f) => (
                <li key={f.title} className="flex gap-3">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15">
                    <f.icon size={18} className="text-white" />
                  </span>
                  <span>
                    <span className="font-bold">{f.title}</span>
                    <span className="mt-1 block text-sm text-white/85">{f.text}</span>
                  </span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>

      {/* Journey */}
      <section className="relative z-10 mx-auto mt-24 max-w-6xl px-4 sm:px-6">
        <motion.div className="mb-10 text-center lg:text-left" {...fade} viewport={{ once: true }} transition={{ duration: 0.5 }}>
          <h3 className="text-3xl font-black text-gray-900 sm:text-4xl">{a.journeyTitle}</h3>
          <p className="mt-2 text-gray-600 sm:text-lg">{a.journeySub}</p>
        </motion.div>
        <div className="relative pl-2 sm:pl-4">
          <div className="absolute left-[19px] top-3 bottom-3 w-0.5 bg-gradient-to-b from-[#145142] via-[#1a6b58] to-[#145142]/20 sm:left-[23px]" aria-hidden />
          <div className="space-y-10">
            {journey.map((step, i) => (
              <motion.div
                key={step.title}
                className="relative flex gap-5 sm:gap-8"
                {...fade}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
              >
                <div className="relative z-[1] flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border-4 border-[#eef6f1] bg-[#145142] text-white shadow-md sm:h-12 sm:w-12">
                  <step.icon size={22} strokeWidth={2} />
                </div>
                <div className="rounded-2xl border border-white/90 bg-white/95 p-5 shadow-md backdrop-blur-sm sm:p-6">
                  <h4 className="text-lg font-black text-[#145142] sm:text-xl">{step.title}</h4>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600 sm:text-base">{step.body}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Bento */}
      <section className="relative z-10 mx-auto mt-24 max-w-6xl px-4 sm:px-6">
        <motion.div className="mb-8 text-center" {...fade} viewport={{ once: true }} transition={{ duration: 0.5 }}>
          <h3 className="text-3xl font-black text-gray-900 sm:text-4xl">{a.bentoTitle}</h3>
          <p className="mt-2 text-gray-600 sm:text-lg">{a.bentoSub}</p>
        </motion.div>
        <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bento.map((card, i) => (
            <motion.div
              key={card.title}
              className={`group rounded-[28px] border border-[#145142]/10 bg-white/95 p-6 shadow-lg shadow-[#145142]/6 backdrop-blur-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-[#145142]/10 ${card.span}`}
              {...fade}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
            >
              <div className="mb-4 h-1.5 w-12 rounded-full bg-gradient-to-r from-[#145142] to-teal-400 transition group-hover:w-20" />
              <h4 className="text-xl font-black text-gray-900">{card.title}</h4>
              <p className="mt-3 text-sm leading-relaxed text-gray-600 sm:text-base">{card.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features grid (4) */}
      <section className="relative z-10 mx-auto mt-20 max-w-6xl px-4 sm:px-6">
        <motion.h3
          className="mb-8 text-center text-2xl font-black text-[#145142] sm:text-3xl"
          {...fade}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {a.whyUs}
        </motion.h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              className="rounded-3xl border border-white/90 bg-gradient-to-br from-white to-[#f5faf7] p-6 shadow-md transition hover:shadow-lg"
              {...fade}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.45, delay: i * 0.04 }}
            >
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#145142] to-[#1a6b58] text-white shadow-lg">
                <f.icon size={28} />
              </div>
              <h4 className="text-lg font-bold text-gray-900">{f.title}</h4>
              <p className="mt-2 text-gray-600">{f.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Manifesto */}
      <section className="relative z-10 mx-auto mt-24 max-w-6xl px-4 sm:px-6">
        <motion.blockquote
          className="relative overflow-hidden rounded-[32px] border border-[#145142]/20 bg-[#145142] px-8 py-12 text-center text-white shadow-2xl sm:px-14 sm:py-16"
          {...fade}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-25 animate-watta-shimmer"
            style={{
              background: 'linear-gradient(105deg, transparent 0%, rgba(255,255,255,0.35) 45%, transparent 90%)',
              backgroundSize: '200% 100%',
            }}
            aria-hidden
          />
          <p className="relative z-[1] font-serif text-2xl font-medium italic leading-snug sm:text-3xl md:text-4xl">{a.manifesto}</p>
          <footer className="relative z-[1] mt-6 text-sm font-bold uppercase tracking-widest text-white/80">{a.manifestoSig}</footer>
        </motion.blockquote>
      </section>

      {/* Team */}
      <section className="relative z-10 mx-auto mt-24 max-w-6xl px-4 sm:px-6">
        <motion.h3
          className="mb-8 text-center text-3xl font-black text-gray-900 sm:text-4xl"
          {...fade}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {a.team}
        </motion.h3>
        {teamMembers.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {teamMembers.map((member, index) => (
              <motion.article
                key={member.id}
                className="group overflow-hidden rounded-[28px] border border-[#145142]/10 bg-white shadow-lg transition hover:-translate-y-2 hover:shadow-2xl"
                {...fade}
                viewport={{ once: true, margin: '-20px' }}
                transition={{ duration: 0.45, delay: index * 0.06 }}
              >
                <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-[#145142]/10 to-teal-100/40">
                  {member.imageUrl ? (
                    <Image
                      src={member.imageUrl}
                      alt={getLocalized(member, 'name') || member.name_ru}
                      fill
                      className="object-cover transition duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Users className="h-20 w-20 text-[#145142]/25" />
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h4 className="text-xl font-black text-gray-900">{getLocalized(member, 'name') || member.name_ru}</h4>
                  <p className="mt-1 font-semibold text-[#145142]">{getLocalized(member, 'position') || member.position_ru}</p>
                  {getLocalized(member, 'bio') ? (
                    <p className="mt-3 text-sm text-gray-600">{getLocalized(member, 'bio')}</p>
                  ) : null}
                </div>
              </motion.article>
            ))}
          </div>
        ) : (
          <motion.div
            className="rounded-[28px] border border-dashed border-[#145142]/25 bg-white/80 p-10 text-center backdrop-blur-sm"
            {...fade}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Users className="mx-auto mb-4 h-14 w-14 text-[#145142]/30" />
            <p className="text-lg font-bold text-gray-900">{a.teamEmptyTitle}</p>
            <p className="mx-auto mt-2 max-w-lg text-gray-600">{a.teamEmptyBody}</p>
          </motion.div>
        )}
      </section>

      {/* Visit + contacts */}
      <section className="relative z-10 mx-auto mt-20 max-w-6xl px-4 sm:px-6">
        <motion.h3
          className="mb-6 text-center text-2xl font-black text-gray-900 sm:text-3xl"
          {...fade}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {a.visitStripTitle}
        </motion.h3>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { icon: MapPin, title: a.contacts.address, text: a.addressLine },
            { icon: Clock, title: a.contacts.workTime, text: a.hoursLine },
            { icon: Phone, title: a.contacts.contact, text: a.phoneLine },
          ].map((row, i) => (
            <motion.div
              key={row.title}
              className="flex flex-col rounded-3xl border border-white/90 bg-white/95 p-6 shadow-md backdrop-blur-sm"
              {...fade}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.45, delay: i * 0.05 }}
            >
              <row.icon className="mb-3 h-9 w-9 text-[#145142]" />
              <h4 className="font-bold text-gray-900">{row.title}</h4>
              <p className="mt-2 text-sm font-medium text-gray-600">{row.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="relative z-10 mx-auto mt-16 max-w-6xl px-4 pb-8 sm:px-6">
        <motion.div
          className="flex flex-col items-center justify-center gap-4 rounded-[28px] border border-[#145142]/15 bg-gradient-to-r from-[#f0faf5] to-white px-6 py-10 text-center shadow-inner sm:flex-row sm:flex-wrap sm:gap-6"
          {...fade}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Link
            href="/"
            className="inline-flex min-w-[200px] items-center justify-center rounded-2xl bg-[#145142] px-8 py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-[#1a6b58]"
          >
            {a.ctaMenu}
          </Link>
          <Link
            href="/contacts"
            className="inline-flex min-w-[200px] items-center justify-center rounded-2xl border-2 border-[#145142] bg-transparent px-8 py-3.5 text-sm font-bold text-[#145142] transition hover:bg-[#145142]/5"
          >
            {a.ctaContacts}
          </Link>
          <Link
            href="/delivery"
            className="inline-flex min-w-[200px] items-center justify-center rounded-2xl border border-[#145142]/20 bg-white px-8 py-3.5 text-sm font-bold text-[#145142] transition hover:border-[#145142]/40"
          >
            {a.ctaDelivery}
          </Link>
        </motion.div>
      </section>

      <style jsx global>{`
        @keyframes watta-marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.333%);
          }
        }
      `}</style>
    </div>
  )
}

export default memo(AboutPageView)
