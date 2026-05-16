'use client'

import React, { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  ArrowUpRight,
  Bell,
  BookOpen,
  Heart,
  LogOut,
  MapPin,
  MessageCircle,
  Shield,
  ShoppingBag,
  Sparkles,
  UtensilsCrossed,
  User,
} from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { syncFavoritesAfterAuth } from '@/lib/favoritesStorage'
import { isAdminRole } from '@/lib/isAdminRole'
import LogoBackground from '../components/LogoBackground'

const HERO_BG =
  'linear-gradient(165deg, #0c3028 0%, #145142 38%, #1a6b58 72%, #145142 100%)'

type DockItem = {
  href: string
  label: string
  Icon: typeof UtensilsCrossed
  tone: 'green' | 'orange' | 'neutral'
}

export default function ProfilePage() {
  const router = useRouter()
  const { t, language } = useLanguage()
  const pp = t.profilePage
  const cp = t.clientProfile
  const nav = t.navigation
  const [user, setUser] = useState<{
    name?: string
    email?: string
    phone?: string
    id?: number
    role?: string
  } | null>(null)
  const [bonus, setBonus] = useState<number | null>(null)

  useEffect(() => {
    const savedUser = typeof window !== 'undefined' ? localStorage.getItem('currentUser') : null
    if (!savedUser) {
      router.replace('/login?return=' + encodeURIComponent('/profile'))
      return
    }
    try {
      setUser(JSON.parse(savedUser))
      void syncFavoritesAfterAuth()
    } catch {
      router.replace('/login?return=' + encodeURIComponent('/profile'))
    }
  }, [router])

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (!token) return
    void fetch('/api/orders/bonus', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && typeof d.bonusBalance === 'number') setBonus(Number(d.bonusBalance))
      })
      .catch(() => {})
  }, [user])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('currentUser')
    localStorage.removeItem('userId')
    localStorage.removeItem('userOrders')
    window.dispatchEvent(new Event('userChanged'))
    router.push('/')
  }

  const openFullProfileOnHome = useCallback(() => {
    try {
      localStorage.setItem('switchToTab', '2')
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new CustomEvent('switchTab', { detail: 2 }))
    router.push('/')
  }, [router])

  if (!user) {
    return (
      <div className="flex min-h-[100dvh] flex-1 items-center justify-center watta-page-bg text-[#145142]">
        {cp.loading}
      </div>
    )
  }

  const displayName = (user.name || '').trim() || cp.notSpecified
  const firstLine = user.email?.trim() || user.phone?.trim() || '—'
  const profileIsAdmin = isAdminRole(user.role)

  const dockItems: DockItem[] = [
    ...(profileIsAdmin
      ? [{ href: '/admin', label: t.admin, Icon: Shield, tone: 'green' as const } satisfies DockItem]
      : []),
    { href: '/menu', label: cp.goMenu, Icon: UtensilsCrossed, tone: 'green' },
    { href: '/cart', label: t.cart, Icon: ShoppingBag, tone: 'orange' },
    { href: '/favorites', label: cp.tabFavorites, Icon: Heart, tone: 'neutral' },
    { href: '/promotions', label: nav.promotions, Icon: Sparkles, tone: 'neutral' },
    { href: '/delivery', label: nav.deliveryPage, Icon: MapPin, tone: 'neutral' },
    { href: '/contacts', label: nav.contacts, Icon: User, tone: 'neutral' },
    { href: '/blog', label: t.blogPublic.title, Icon: BookOpen, tone: 'neutral' },
    { href: '/reviews', label: t.reviewsPublic.title, Icon: MessageCircle, tone: 'neutral' },
    { href: '/notifications', label: t.notifications.title, Icon: Bell, tone: 'neutral' },
  ]

  const toneRing =
    (tone: DockItem['tone']) =>
      tone === 'green'
        ? 'ring-[#145142]/20 hover:ring-[#145142]/40'
        : tone === 'orange'
          ? 'ring-[#ff6b35]/20 hover:ring-[#ff6b35]/45'
          : 'ring-gray-200/80 hover:ring-[#145142]/25'

  return (
    <div className="watta-public-page-shell relative flex min-h-[100dvh] flex-1 flex-col overflow-x-hidden watta-page-bg pb-16 pt-2 sm:pb-20 sm:pt-3">
      <div className="pointer-events-none absolute inset-0 z-0 opacity-[0.14]">
        <LogoBackground />
      </div>

      <div className="relative z-[1] mx-auto w-full max-w-6xl px-3 sm:px-5">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#145142]/12 bg-white/90 px-3 py-2 text-xs font-bold uppercase tracking-wide text-[#145142] shadow-sm backdrop-blur-sm transition hover:bg-white sm:text-sm"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" strokeWidth={2.4} />
          {t.auth.back}
        </button>

        <section
          className="relative overflow-hidden rounded-[1.35rem] text-white shadow-[0_24px_80px_rgba(20,81,66,0.28)] sm:rounded-[2rem]"
          style={{ background: HERO_BG }}
          aria-labelledby="profile-public-hero-title"
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.35]"
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
            className="pointer-events-none absolute -right-[18%] top-1/2 h-[min(85vw,420px)] w-[min(85vw,420px)] -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,92,0,0.16)_0%,transparent_68%)]"
            aria-hidden
          />

          <div className="relative z-[1] grid gap-8 px-4 py-10 sm:gap-10 sm:px-8 sm:py-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center lg:gap-12 lg:py-14">
            <div>
              <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-white/90 backdrop-blur-md sm:text-[11px]">
                <Sparkles className="h-3.5 w-3.5 text-[#ffb38a]" strokeWidth={2.4} aria-hidden />
                {cp.brandSubtitle}
              </p>
              <h1
                id="profile-public-hero-title"
                className="font-black lowercase leading-[0.95] tracking-tight text-white"
                style={{
                  fontSize: 'clamp(2.25rem, 8vw, 4.25rem)',
                  fontFamily: 'var(--font-inter, ui-sans-serif), system-ui, sans-serif',
                }}
              >
                {language === 'en' ? displayName.toLowerCase() : displayName}
              </h1>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">{cp.publicHeroLead}</p>

              <div className="mt-6 flex flex-wrap gap-2 sm:gap-3">
                {user.email ? (
                  <span className="inline-flex max-w-full items-center gap-2 truncate rounded-2xl border border-white/20 bg-black/10 px-3 py-2 text-xs font-semibold text-white/95 backdrop-blur-md sm:text-sm">
                    <span className="text-white/60">{cp.labelEmail}:</span>
                    <span className="truncate">{user.email}</span>
                  </span>
                ) : null}
                {user.phone ? (
                  <span className="inline-flex max-w-full items-center gap-2 truncate rounded-2xl border border-white/20 bg-black/10 px-3 py-2 text-xs font-semibold text-white/95 backdrop-blur-md sm:text-sm">
                    <span className="text-white/60">{cp.labelPhone}:</span>
                    <span className="truncate">{user.phone}</span>
                  </span>
                ) : null}
                {bonus != null ? (
                  <span className="inline-flex items-center gap-2 rounded-2xl border border-emerald-300/35 bg-emerald-950/25 px-3 py-2 text-xs font-bold text-emerald-50 backdrop-blur-md sm:text-sm">
                    {cp.bonuses}:{' '}
                    <span className="tabular-nums text-white">{bonus.toFixed(2)} €</span>
                  </span>
                ) : null}
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <button
                  type="button"
                  onClick={openFullProfileOnHome}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3.5 text-sm font-black text-[#145142] shadow-lg shadow-black/20 transition hover:bg-white/95 sm:px-7"
                >
                  {pp.orderHistory}
                  <ArrowUpRight className="h-4 w-4 shrink-0" strokeWidth={2.5} />
                </button>
                <p className="max-w-md text-xs leading-snug text-white/55 sm:text-sm">{cp.publicOrdersCta}</p>
              </div>
            </div>

            <div className="mx-auto w-full max-w-[360px] justify-self-center lg:max-w-none lg:justify-self-end">
              <div className="overflow-hidden rounded-2xl border border-white/25 bg-white/95 p-6 text-center shadow-xl shadow-black/15 sm:rounded-3xl sm:p-8">
                <div className="mx-auto mb-4 flex justify-center">
                  <div className="rounded-2xl border-[3px] border-[#145142] bg-gradient-to-br from-gray-50 to-white p-4 shadow-inner sm:p-5">
                    <Image src="/logo.png" alt="" width={96} height={96} className="object-contain" priority />
                  </div>
                </div>
                <p className="text-sm font-black uppercase tracking-[0.12em] text-[#145142]">{pp.title}</p>
                <p className="mt-2 text-center text-sm leading-relaxed text-gray-600">{firstLine}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10 sm:mt-12" aria-labelledby="profile-dock-title">
          <div className="mb-5 flex flex-col gap-2 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
            <h2
              id="profile-dock-title"
              className="text-2xl font-black tracking-tight text-[#0f241e] sm:text-3xl md:text-4xl"
            >
              {cp.publicHubTitle}
            </h2>
            <Link
              href="/"
              className="text-sm font-bold text-[#145142] underline-offset-4 transition hover:underline"
            >
              {cp.backHome}
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {dockItems.map(({ href, label, Icon, tone }) => (
              <Link
                key={href + label}
                href={href}
                className={`group flex min-h-[4.75rem] items-center gap-4 rounded-2xl border border-gray-200/90 bg-white/95 p-4 shadow-sm ring-2 ring-transparent transition hover:-translate-y-0.5 hover:shadow-md ${toneRing(tone)} sm:min-h-[5.25rem] sm:rounded-3xl sm:p-5`}
              >
                <span
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl sm:h-14 sm:w-14 ${
                    tone === 'green'
                      ? 'bg-[#145142] text-white'
                      : tone === 'orange'
                        ? 'bg-[#ff6b35] text-white'
                        : 'bg-[#eef4f1] text-[#145142]'
                  }`}
                >
                  <Icon className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={2.2} />
                </span>
                <span className="min-w-0 flex-1 pr-1">
                  <span className="line-clamp-2 text-sm font-extrabold leading-snug text-[#0f241e] sm:text-base">
                    {label}
                  </span>
                  <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-[#145142]/80 sm:text-xs">
                    <ArrowUpRight className="h-3.5 w-3.5 shrink-0 opacity-70" />
                  </span>
                </span>
              </Link>
            ))}
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-red-200/90 bg-red-50/90 py-4 text-sm font-black text-red-700 shadow-sm transition hover:bg-red-100 sm:mt-10 sm:rounded-3xl sm:py-4 sm:text-base"
          >
            <LogOut className="h-5 w-5 shrink-0" strokeWidth={2.3} />
            {pp.logout}
          </button>
        </section>
      </div>
    </div>
  )
}
