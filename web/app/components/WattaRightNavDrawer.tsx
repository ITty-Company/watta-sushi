'use client'

import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BookOpen,
  Home,
  Info,
  Phone,
  Sparkles,
  Star,
  Truck,
  UtensilsCrossed,
  Heart,
  ShoppingBag,
  User,
  X,
} from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useRightNavDrawer } from '../context/RightNavDrawerContext'
import { CountryCitySelector } from './CountryCitySelector'
import { cn } from '@/lib/utils'
import { useFavoriteCount } from '@/hooks/useFavoriteCount'
import { mergeServerFavoritesIntoLocal } from '@/lib/favoritesStorage'

const EDGE_PX = 28
const OPEN_SWIPE_PX = 56
const CLOSE_SWIPE_PX = 56

function RightEdgeOpenGesture({ onOpen, active }: { onOpen: () => void; active: boolean }) {
  const startX = useRef<number | null>(null)

  if (!active) return null

  return (
    <div
      className="fixed top-0 right-0 z-40 touch-none md:hidden"
      style={{ width: EDGE_PX, height: '100dvh' }}
      aria-hidden
      onTouchStart={(e) => {
        const x = e.touches[0]?.clientX ?? 0
        if (typeof window !== 'undefined' && x >= window.innerWidth - EDGE_PX - 2) {
          startX.current = x
        } else {
          startX.current = null
        }
      }}
      onTouchMove={(e) => {
        if (startX.current == null) return
        const x = e.touches[0]?.clientX ?? startX.current
        if (startX.current - x > OPEN_SWIPE_PX) {
          onOpen()
          startX.current = null
        }
      }}
      onTouchEnd={(e) => {
        if (startX.current == null) return
        const endX = e.changedTouches[0]?.clientX ?? startX.current
        if (startX.current - endX > OPEN_SWIPE_PX) onOpen()
        startX.current = null
      }}
    />
  )
}

/** Лівий край відкритої панелі: свайп вправо (зліва направо) — закрити */
function DrawerLeftEdgeCloseSwipe({ onClose, active }: { onClose: () => void; active: boolean }) {
  const startX = useRef<number | null>(null)

  if (!active) return null

  return (
    <div
      className="absolute left-0 top-0 z-[80] w-7 touch-none"
      style={{ height: '100%' }}
      aria-hidden
      onTouchStart={(e) => {
        startX.current = e.touches[0]?.clientX ?? null
      }}
      onTouchMove={(e) => {
        if (startX.current == null) return
        const x = e.touches[0]?.clientX ?? startX.current
        if (x - startX.current > CLOSE_SWIPE_PX) {
          onClose()
          startX.current = null
        }
      }}
      onTouchEnd={(e) => {
        if (startX.current == null) return
        const endX = e.changedTouches[0]?.clientX ?? startX.current
        if (endX - startX.current > CLOSE_SWIPE_PX) onClose()
        startX.current = null
      }}
    />
  )
}

/** Хвиля між шапкою й тілом панелі (світла тема) */
function DrawerWaveDivider({ className }: { className?: string }) {
  return (
    <svg
      className={cn('w-full shrink-0 text-[#f4faf7]', className)}
      viewBox="0 0 400 28"
      preserveAspectRatio="none"
      aria-hidden
    >
      <path
        fill="currentColor"
        d="M0 12 Q100 0 200 12 T400 12 L400 28 L0 28 Z"
      />
      <path
        fill="rgba(20, 81, 66, 0.06)"
        d="M0 18 Q100 8 200 18 T400 18 L400 28 L0 28 Z"
      />
    </svg>
  )
}

export default function WattaRightNavDrawer() {
  const pathname = usePathname() || '/'
  const { t } = useLanguage()
  const nav = t.navigation
  const { isOpen, open, close, enabled, cityChangeHandlerRef } = useRightNavDrawer()
  const panelRef = useRef<HTMLElement>(null)
  const favCount = useFavoriteCount()

  const [cartCount, setCartCount] = React.useState(0)
  const [isAdmin, setIsAdmin] = React.useState(false)

  useEffect(() => {
    const readAdmin = () => {
      try {
        const raw = typeof window !== 'undefined' ? localStorage.getItem('currentUser') : null
        if (!raw) {
          setIsAdmin(false)
          return
        }
        const p = JSON.parse(raw) as { role?: string }
        setIsAdmin(p?.role === 'ADMIN')
      } catch {
        setIsAdmin(false)
      }
    }
    readAdmin()
    window.addEventListener('userChanged', readAdmin)
    return () => window.removeEventListener('userChanged', readAdmin)
  }, [])

  useEffect(() => {
    const read = () => {
      try {
        const raw = localStorage.getItem('cart')
        const c = raw ? JSON.parse(raw) : []
        setCartCount(Array.isArray(c) ? c.length : 0)
      } catch {
        setCartCount(0)
      }
    }
    read()
    window.addEventListener('cartUpdated', read)
    return () => window.removeEventListener('cartUpdated', read)
  }, [])

  useEffect(() => {
    close()
  }, [pathname, close])

  useEffect(() => {
    if (!enabled || !isOpen) return
    void mergeServerFavoritesIntoLocal()
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [enabled, isOpen])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, close])

  useEffect(() => {
    if (!isOpen) return
    const timer = window.setTimeout(() => {
      panelRef.current?.querySelector<HTMLElement>('a[href]')?.focus()
    }, 50)
    return () => clearTimeout(timer)
  }, [isOpen])

  type NavItem = {
    href: string
    label: string
    Icon: typeof Home
    isActive: (path: string) => boolean
    badge?: number
  }

  const primaryItems: NavItem[] = useMemo(() => {
    const items: NavItem[] = [
      { href: '/', label: nav.home, Icon: Home, isActive: (p) => p === '/' },
      {
        href: '/menu',
        label: nav.menu,
        Icon: UtensilsCrossed,
        isActive: (p) =>
          p.startsWith('/menu') || p.startsWith('/product') || p.startsWith('/menu/category'),
      },
      {
        href: '/favorites',
        label: nav.favorites,
        Icon: Heart,
        isActive: (p) => p.startsWith('/favorites'),
        badge: favCount,
      },
      {
        href: '/cart',
        label: t.cart,
        Icon: ShoppingBag,
        isActive: (p) => p.startsWith('/cart'),
        badge: cartCount,
      },
      {
        href: '/profile',
        label: t.profile,
        Icon: User,
        isActive: (p) => p.startsWith('/profile'),
      },
    ]
    if (isAdmin) {
      items.push({
        href: '/admin',
        label: t.admin,
        Icon: Sparkles,
        isActive: (p) => p === '/admin' || p.startsWith('/admin/'),
      })
    }
    return items
  }, [t.admin, t.cart, t.profile, nav, favCount, cartCount, isAdmin])

  const exploreItems = useMemo(
    () => [
      { href: '/delivery', label: nav.delivery, Icon: Truck, span: 'full' as const },
      { href: '/about', label: nav.about, Icon: Info, span: 'half' as const },
      { href: '/promotions', label: nav.promotions, Icon: Sparkles, span: 'half' as const },
      { href: '/blog', label: t.blogPublic.title, Icon: BookOpen, span: 'wide' as const },
      { href: '/reviews', label: t.reviewsPublic.title, Icon: Star, span: 'half' as const },
      { href: '/contacts', label: nav.contacts, Icon: Phone, span: 'half' as const },
    ],
    [nav, t.blogPublic.title, t.reviewsPublic.title],
  )

  const year = new Date().getFullYear()
  const legal = nav.footerLegal.replace('{{year}}', String(year))

  const backdropTouchStart = useRef<{ x: number; y: number } | null>(null)

  const onBackdropPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.target !== e.currentTarget) return
      /* На тачі не закриваємо по pointerdown — інакше не встигне свайп; тап закриває onClick */
      if (e.pointerType === 'mouse') close()
    },
    [close],
  )

  const onBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) close()
    },
    [close],
  )

  const linkFocus =
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b35] focus-visible:ring-offset-2 focus-visible:ring-offset-white'

  if (!enabled) return null

  return (
    <>
      <RightEdgeOpenGesture onOpen={open} active={!isOpen} />

      <div
        className={cn(
          'fixed inset-0 z-[9990] md:z-[9990]',
          isOpen ? 'pointer-events-auto' : 'pointer-events-none',
        )}
        aria-hidden={!isOpen}
      >
        <div
          className={cn(
            'absolute inset-0 bg-[#0f241e]/35 backdrop-blur-[10px] transition-opacity duration-300',
            isOpen ? 'opacity-100' : 'opacity-0',
          )}
          onPointerDown={onBackdropPointerDown}
          onClick={onBackdropClick}
          onTouchStart={(e) => {
            if (e.target !== e.currentTarget) return
            const t = e.touches[0]
            if (!t) return
            backdropTouchStart.current = { x: t.clientX, y: t.clientY }
          }}
          onTouchEnd={(e) => {
            if (e.target !== e.currentTarget) return
            const start = backdropTouchStart.current
            backdropTouchStart.current = null
            if (!start) return
            const t = e.changedTouches[0]
            if (!t) return
            const dx = t.clientX - start.x
            const dy = t.clientY - start.y
            if (dx > CLOSE_SWIPE_PX && Math.abs(dx) > Math.abs(dy) * 1.1) close()
          }}
          style={{ pointerEvents: isOpen ? 'auto' : 'none' }}
        />

        <aside
          ref={panelRef}
          id="watta-right-nav-drawer"
          role="dialog"
          aria-modal="true"
          aria-label={nav.bottomNavAria}
          className={cn(
            'absolute right-0 top-0 flex h-[100dvh] w-[min(100vw-0.75rem,23.5rem)] max-w-[min(100vw-0.75rem,23.5rem)] flex-col overflow-hidden rounded-l-[1.75rem] border-l border-[#145142]/10 bg-white pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)] shadow-[-6px_0_28px_rgba(20,81,66,0.06),-2px_0_12px_rgba(0,0,0,0.05)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
            isOpen ? 'translate-x-0' : 'translate-x-full',
          )}
          style={{ pointerEvents: isOpen ? 'auto' : 'none' }}
        >
          {/* Шапка — світлий м’ятний градієнт */}
          <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-[#f0faf6] via-[#ffffff] to-[#e8f4ef] px-4 pb-2 pt-4">
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.22]"
              style={{
                backgroundImage: `radial-gradient(ellipse 120% 80% at 100% 0%, rgba(20, 81, 66, 0.05), transparent 55%),
                  radial-gradient(ellipse 80% 60% at 0% 100%, rgba(255, 107, 53, 0.05), transparent 50%)`,
              }}
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -right-2 top-1/2 -translate-y-1/2 text-[4rem] leading-none opacity-[0.14]"
              aria-hidden
            >
              🍣
            </div>
            <div className="relative flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="relative h-[52px] w-[52px] shrink-0 rotate-[-3deg] overflow-hidden rounded-2xl bg-white p-1 shadow-[0_8px_24px_rgba(20,81,66,0.12)] ring-1 ring-[#145142]/10">
                  <Image src="/logo.png" alt="" width={52} height={52} className="object-contain" />
                </div>
                <div className="min-w-0">
                  <p
                    className="font-serif text-[clamp(1.05rem,4.2vw,1.25rem)] font-bold leading-tight tracking-tight text-[#0f241e]"
                    style={{ fontFamily: 'var(--font-brand-playfair), Georgia, serif' }}
                  >
                    {t.common.brandName}
                  </p>
                  <p className="mt-1 max-w-[13rem] text-[11px] font-medium leading-snug text-[#145142]/75">
                    {nav.drawerBrandLine}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={close}
                className={cn(
                  'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#145142]/12 bg-white/90 text-[#145142] shadow-sm transition hover:border-[#145142]/25 hover:bg-[#f4faf7]',
                  linkFocus,
                  'focus-visible:ring-offset-[#f0faf6]',
                )}
                aria-label={nav.closeNavDrawerAria}
              >
                <X className="h-5 w-5" strokeWidth={2.2} />
              </button>
            </div>
          </div>

          <DrawerWaveDivider />

          {/* Тіло — світле повітряне меню */}
          <div className="relative flex min-h-0 flex-1 flex-col watta-page-bg">
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.5]"
              style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, rgba(20, 81, 66, 0.06) 1px, transparent 0)`,
                backgroundSize: '18px 18px',
              }}
              aria-hidden
            />
            <div
              className="pointer-events-none absolute bottom-0 right-0 h-48 w-48 rounded-full bg-[#52b788]/15 blur-3xl"
              aria-hidden
            />

            <nav
              className="relative flex min-h-0 flex-1 flex-col gap-0 overflow-y-auto overscroll-contain px-3 pb-3 pt-1"
              aria-label={nav.bottomNavAria}
            >
              <div className="relative z-[2] mb-3 min-[1025px]:hidden">
                <p className="mb-2 px-1 text-[9px] font-black uppercase tracking-[0.35em] text-[#145142]/50">
                  {nav.drawerLocationTitle}
                </p>
                <div className="rounded-2xl border border-[#145142]/10 bg-white/95 p-2.5 shadow-sm">
                  <CountryCitySelector
                    onCityChange={(cityId) => {
                      cityChangeHandlerRef.current?.(cityId)
                    }}
                  />
                </div>
              </div>

              <div className="mb-3 flex items-center justify-between gap-2 px-1">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#145142]/20 to-transparent" />
                <span className="shrink-0 px-2 text-[9px] font-black uppercase tracking-[0.42em] text-[#145142]/55">
                  {nav.bottomNavAria}
                </span>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#145142]/20 to-transparent" />
              </div>

              <ul className="flex flex-col gap-2">
                {primaryItems.map(({ href, label, Icon, isActive, badge }, i) => {
                  const active = isActive(pathname)
                  return (
                    <li key={href} style={{ animationDelay: `${i * 35}ms` }}>
                      <Link
                        href={href}
                        onClick={close}
                        className={cn(
                          linkFocus,
                          'group relative flex items-center gap-3 overflow-hidden rounded-2xl border py-3 pl-3 pr-3 shadow-sm transition-all duration-200',
                          active
                            ? 'border-[#ff6b35]/35 bg-white shadow-[0_4px_20px_rgba(20,81,66,0.08)] ring-1 ring-[#145142]/8'
                            : 'border-[#145142]/10 bg-white/80 hover:border-[#145142]/22 hover:bg-white hover:shadow-md',
                        )}
                      >
                        <span
                          className={cn(
                            'absolute left-0 top-2 bottom-2 w-1 rounded-full transition-colors',
                            active ? 'bg-[#ff6b35]' : 'bg-transparent group-hover:bg-[#145142]/35',
                          )}
                          aria-hidden
                        />
                        <span
                          className={cn(
                            'relative ml-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border transition-all',
                            active
                              ? 'border-[#ff6b35]/25 bg-[#fff5f0] text-[#ff6b35]'
                              : 'border-[#145142]/10 bg-[#f0faf6] text-[#145142]/70 group-hover:border-[#145142]/20 group-hover:bg-[#e8f4ef] group-hover:text-[#145142]',
                          )}
                        >
                          <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.5 : 2} />
                          {badge != null && badge > 0 ? (
                            <span className="absolute -right-1.5 -top-1.5 flex min-h-[20px] min-w-[20px] items-center justify-center rounded-full border-2 border-white bg-[#ff6b35] px-1 text-[10px] font-black text-white shadow-md">
                              {badge > 99 ? '99+' : badge}
                            </span>
                          ) : null}
                        </span>
                        <span
                          className={cn(
                            'min-w-0 flex-1 text-[15px] font-bold tracking-tight',
                            active ? 'text-[#0f241e]' : 'text-[#1a3d33] group-hover:text-[#0f241e]',
                          )}
                        >
                          {label}
                        </span>
                        <span
                          className={cn(
                            'text-lg font-light transition-transform duration-200',
                            active
                              ? 'translate-x-0 text-[#ff6b35]'
                              : 'translate-x-1 text-[#145142]/25 group-hover:translate-x-0 group-hover:text-[#ff6b35]/75',
                          )}
                          aria-hidden
                        >
                          ↗
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ul>

              <div className="my-5 flex items-center gap-2 px-1">
                <span className="text-lg opacity-50 grayscale" aria-hidden>
                  🥢
                </span>
                <div className="h-px flex-1 bg-gradient-to-r from-[#145142]/25 to-transparent" />
                <span className="text-[9px] font-black uppercase tracking-[0.35em] text-[#145142]/45">
                  {nav.drawerExploreTitle}
                </span>
                <div className="h-px flex-1 bg-gradient-to-l from-[#145142]/25 to-transparent" />
                <span className="text-lg opacity-50 grayscale" aria-hidden>
                  🍱
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pb-2">
                {exploreItems.map(({ href, label, Icon, span }) => {
                  const active =
                    href === '/'
                      ? pathname === '/'
                      : pathname === href || pathname.startsWith(`${href}/`)
                  const colClass =
                    span === 'full'
                      ? 'col-span-2 min-h-[4.25rem]'
                      : span === 'wide'
                        ? 'col-span-2 min-h-[4rem]'
                        : 'min-h-[5.5rem]'
                  return (
                    <Link
                      key={`${href}-${label}`}
                      href={href}
                      onClick={close}
                      className={cn(
                        linkFocus,
                        colClass,
                        'group relative flex flex-col justify-between overflow-hidden rounded-2xl border p-3 shadow-sm transition-all duration-200',
                        active
                          ? 'border-[#ff6b35]/30 bg-white shadow-[0_6px_22px_rgba(20,81,66,0.1)] ring-1 ring-[#145142]/10'
                          : 'border-[#145142]/10 bg-white/90 hover:-translate-y-0.5 hover:border-[#145142]/18 hover:bg-white hover:shadow-md',
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <Icon
                          className={cn(
                            'h-5 w-5 shrink-0 transition-colors',
                            active ? 'text-[#ff6b35]' : 'text-[#145142]/55 group-hover:text-[#ff6b35]',
                          )}
                          strokeWidth={2}
                        />
                        <span
                          className="text-[10px] font-black uppercase tracking-widest text-[#145142]/15 transition-colors group-hover:text-[#ff6b35]/35"
                          aria-hidden
                        >
                          ·
                        </span>
                      </div>
                      <span
                        className={cn(
                          'line-clamp-3 text-left text-[11px] font-bold leading-snug',
                          active ? 'text-[#0f241e]' : 'text-[#2d4a42] group-hover:text-[#0f241e]',
                        )}
                      >
                        {label}
                      </span>
                    </Link>
                  )
                })}
              </div>
            </nav>

            <div className="relative shrink-0 border-t border-[#145142]/10 bg-white/90 px-4 py-3 backdrop-blur-sm">
              <p className="text-center text-[9px] font-medium leading-relaxed tracking-wide text-[#145142]/50">
                {legal}
              </p>
            </div>
          </div>

          <DrawerLeftEdgeCloseSwipe onClose={close} active={isOpen} />
        </aside>
      </div>
    </>
  )
}
