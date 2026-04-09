'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
  MapPin,
  Menu,
  Milk,
  Phone,
  Rocket,
  Salad,
  Smartphone,
  Sparkles,
  Users,
  Wheat,
  Zap,
  Clock,
} from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { cn } from '@/lib/utils'

const ACCENT = '#FF5C00'
/** Герой у кольорах бренду замість чорного */
const HERO_BG =
  'linear-gradient(165deg, #0c3028 0%, #145142 38%, #1a6b58 72%, #145142 100%)'

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

function PhilosophySlideCard({
  icon: Icon,
  title,
  body,
  fade,
  delay,
}: {
  icon: LucideIcon
  title: string
  body: string
  fade:
    | { initial: false }
    | { initial: { opacity: number; y: number }; whileInView: { opacity: number; y: number } }
  delay: number
}) {
  return (
    <motion.article
      className="flex flex-col rounded-[22px] border border-gray-200/80 bg-white p-6 shadow-[0_8px_40px_rgba(0,0,0,0.06)] transition hover:shadow-[0_16px_48px_rgba(0,0,0,0.08)]"
      {...fade}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.45, delay }}
    >
      <div className="relative mb-5 flex h-[4.5rem] w-[4.5rem] shrink-0 items-center justify-center">
        <div
          className="absolute h-16 w-20 -rotate-12 rounded-[45%_55%_50%_50%] opacity-90"
          style={{
            background: `linear-gradient(135deg, rgba(255,180,140,0.95) 0%, rgba(255,92,0,0.25) 55%, rgba(255,200,170,0.4) 100%)`,
          }}
          aria-hidden
        />
        <Icon className="relative z-[1] h-9 w-9 text-gray-900" strokeWidth={1.35} />
      </div>
      <h3 className="text-lg font-black leading-tight text-gray-900 sm:text-xl">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-[#7a7a7a] sm:text-[15px]">{body}</p>
    </motion.article>
  )
}

function InsideCard({
  icon: Icon,
  title,
  body,
  fade,
  delay,
}: {
  icon: LucideIcon
  title: string
  body: string
  fade:
    | { initial: false }
    | { initial: { opacity: number; y: number }; whileInView: { opacity: number; y: number } }
  delay: number
}) {
  return (
    <motion.article
      className="flex flex-col rounded-[26px] border border-gray-100 bg-white p-6 shadow-sm sm:p-7"
      {...fade}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.45, delay }}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50 text-gray-800">
        <Icon className="h-7 w-7" strokeWidth={1.35} />
      </div>
      <h3 className="text-lg font-black text-gray-900 sm:text-xl">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-[#7a7a7a] sm:text-[15px]">{body}</p>
    </motion.article>
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

  const stats = useMemo(
    () => [
      { icon: Users, value: '10K+', label: a.stats.clients },
      { icon: Award, value: '5+', label: a.stats.experience },
      { icon: Zap, value: '30', label: a.stats.delivery },
      { icon: Heart, value: '100%', label: a.stats.quality },
    ],
    [a.stats]
  )

  const philosophySlides = useMemo(
    () => [
      { icon: CircleDot, title: a.slide1Title, body: a.slide1Body },
      { icon: Fish, title: a.slide2Title, body: a.slide2Body },
      { icon: ChefHat, title: a.slide3Title, body: a.slide3Body },
      { icon: Smartphone, title: a.slide4Title, body: a.slide4Body },
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

  return (
    <div
      id="about-page-container"
      className={cn(
        'relative min-h-screen w-full overflow-x-hidden pb-16',
        embedded ? 'bg-white' : 'bg-transparent',
      )}
    >
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

      {/* Кінематографічний герой (зелений бренд); на /about — зазор і скруглення, щоб не зливається з білою шапкою */}
      <section
        className={cn(
          'relative overflow-hidden text-white',
          !embedded &&
            'mt-6 rounded-t-[1.25rem] shadow-[0_-1px_0_rgba(0,0,0,0.06)] sm:mt-8 sm:rounded-t-[1.5rem]',
        )}
        style={{ background: HERO_BG }}
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
            'relative z-[1] mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:gap-16',
            embedded
              ? 'py-14 sm:py-20'
              : 'pb-14 pt-10 sm:pb-20 sm:pt-14 md:pt-16',
          )}
        >
          <div>
            <h2
              id="about-dark-hero-title"
              className="font-black lowercase leading-[0.95] tracking-tight text-white"
              style={{
                fontSize: 'clamp(2.75rem, 10vw, 6.5rem)',
                fontFamily: 'var(--font-inter, ui-sans-serif), system-ui, sans-serif',
              }}
            >
              watta sushi
            </h2>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">{a.darkHeroSubtitle}</p>
          </div>
          <div className="flex flex-col gap-1 text-left lg:items-end lg:text-right">
            <p className="text-sm font-medium text-white/55 sm:text-base">{a.darkFoundedLabel}</p>
            <p className="text-3xl font-black tracking-tight sm:text-4xl md:text-[2.75rem]">{a.darkFoundedYearCity}</p>
            <p className="mt-8 text-sm font-medium text-white/55 sm:text-base">{a.darkMilestoneLine1}</p>
            <p className="max-w-sm text-xl font-bold leading-snug text-white lg:ml-auto lg:text-right sm:text-2xl">
              {a.darkMilestoneLine2}
            </p>
          </div>
        </div>
      </section>

      {/* Філософія + слайди-картки */}
      <section
        className="relative z-10 w-full bg-white px-4 py-16 sm:px-6 sm:py-20"
        aria-labelledby="about-philosophy-heading"
      >
        <div className="mx-auto max-w-6xl">
        <motion.div
          className="mb-12 flex flex-col items-center justify-center gap-4 text-center sm:mb-16 sm:flex-row sm:flex-wrap"
          {...fade}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 id="about-philosophy-heading" className="text-4xl font-black tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
            <span>{a.philosophyTitlePart1}</span>{' '}
            <span style={{ color: ACCENT }}>{a.philosophyTitlePart2}</span>
          </h2>
          <span
            className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-lg shadow-rose-500/25"
            aria-hidden
          >
            <Heart className="h-7 w-7 fill-white" strokeWidth={1.5} />
          </span>
        </motion.div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {philosophySlides.map((slide, i) => (
            <PhilosophySlideCard
              key={slide.title}
              icon={slide.icon}
              title={slide.title}
              body={slide.body}
              fade={fade}
              delay={i * 0.05}
            />
          ))}
        </div>
        </div>
      </section>

      {/* Арт-блок + «плаваюче» зображення */}
      <section className="relative z-10 border-y border-gray-100 bg-white">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1fr_0.9fr] lg:gap-14">
          <motion.div {...fade} viewport={{ once: true }} transition={{ duration: 0.5 }}>
            <p className="text-3xl font-black leading-[1.12] tracking-tight text-gray-900 sm:text-4xl md:text-[2.75rem] lg:text-5xl">
              {a.artHeadlineLine1}
              <br />
              {a.artHeadlineLine2}{' '}
              <span style={{ color: ACCENT }} className="whitespace-nowrap">
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

      {/* Що всередині ролу */}
      <section
        className="relative z-10 py-16 sm:py-20"
        style={{ backgroundColor: '#f3f3f5' }}
        aria-labelledby="about-inside-heading"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <motion.h2
            id="about-inside-heading"
            className="mb-10 text-center text-3xl font-black text-gray-900 sm:mb-12 sm:text-4xl"
            {...fade}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
          >
            {a.insideSectionTitle}
          </motion.h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {insideSlides.map((item, i) => (
              <InsideCard
                key={item.title}
                icon={item.icon}
                title={item.title}
                body={item.body}
                fade={fade}
                delay={i * 0.05}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Статистика */}
      <section className="relative z-10 w-full bg-white px-4 pt-14 sm:px-6 sm:pt-20">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              className="rounded-[22px] border border-gray-100 bg-white p-5 text-center shadow-[0_6px_32px_rgba(0,0,0,0.05)]"
              {...fade}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.45, delay: i * 0.05 }}
            >
              <s.icon className="mx-auto mb-2 h-8 w-8 text-gray-800" strokeWidth={2} style={{ color: i % 2 === 0 ? ACCENT : undefined }} />
              <div className="text-2xl font-black text-gray-900 sm:text-3xl">{s.value}</div>
              <div className="mt-1 text-xs font-semibold leading-snug text-[#7a7a7a] sm:text-sm">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Історія */}
      <section className="relative z-10 w-full bg-white px-4 pt-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
        <motion.h3
          className="mb-6 text-3xl font-black text-gray-900 sm:text-4xl"
          {...fade}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {a.storyTitle}
        </motion.h3>
        <motion.div
          className="max-w-3xl space-y-5 text-base leading-relaxed text-gray-700 sm:text-lg"
          {...fade}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
        >
          <p className="font-semibold text-gray-900">{a.storyLead}</p>
          <p>{a.storyP2}</p>
          <p>{a.storyP3}</p>
        </motion.div>
        </div>
      </section>

      {/* Команда */}
      <section className="relative z-10 w-full bg-white px-4 pt-24 sm:px-6">
        <div className="mx-auto max-w-6xl">
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
                className="group overflow-hidden rounded-[24px] border border-gray-200 bg-white shadow-md transition hover:-translate-y-1 hover:shadow-xl"
                {...fade}
                viewport={{ once: true, margin: '-20px' }}
                transition={{ duration: 0.45, delay: index * 0.06 }}
              >
                <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50">
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
                      <Users className="h-20 w-20 text-gray-300" />
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h4 className="text-xl font-black text-gray-900">{getLocalized(member, 'name') || member.name_ru}</h4>
                  <p className="mt-1 font-semibold" style={{ color: ACCENT }}>
                    {getLocalized(member, 'position') || member.position_ru}
                  </p>
                  {getLocalized(member, 'bio') ? (
                    <p className="mt-3 text-sm text-gray-600">{getLocalized(member, 'bio')}</p>
                  ) : null}
                </div>
              </motion.article>
            ))}
          </div>
        ) : (
          <motion.div
            className="rounded-[24px] border border-dashed border-gray-300 bg-gray-50/80 p-10 text-center"
            {...fade}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Users className="mx-auto mb-4 h-14 w-14 text-gray-300" />
            <p className="text-lg font-bold text-gray-900">{a.teamEmptyTitle}</p>
            <p className="mx-auto mt-2 max-w-lg text-gray-600">{a.teamEmptyBody}</p>
          </motion.div>
        )}
        </div>
      </section>

      {/* Візит / контакти */}
      <section className="relative z-10 w-full bg-white px-4 pt-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
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
              className="flex flex-col rounded-[22px] border border-gray-100 bg-white p-6 shadow-sm"
              {...fade}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.45, delay: i * 0.05 }}
            >
              <row.icon className="mb-3 h-9 w-9 text-gray-800" style={{ color: ACCENT }} />
              <h4 className="font-bold text-gray-900">{row.title}</h4>
              <p className="mt-2 text-sm font-medium text-gray-600">{row.text}</p>
            </motion.div>
          ))}
        </div>
        </div>
      </section>

      {/* Нижні CTA */}
      <section className="relative z-10 w-full bg-white px-4 pb-8 pt-16 sm:px-6">
        <div className="mx-auto max-w-6xl">
        <motion.div
          className="flex flex-col items-center justify-center gap-4 rounded-[24px] border border-gray-200 bg-gray-50/80 px-6 py-10 text-center sm:flex-row sm:flex-wrap sm:gap-6"
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
            className="inline-flex min-w-[200px] items-center justify-center rounded-2xl border border-gray-300 bg-white px-8 py-3.5 text-sm font-bold text-gray-800 transition hover:border-gray-400"
          >
            {a.ctaDelivery}
          </Link>
        </motion.div>
        </div>
      </section>
    </div>
  )
}

export default memo(AboutPageView)
