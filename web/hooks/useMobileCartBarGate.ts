'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { bindAppVerticalScroll, readAppScrollTop } from '@/lib/menuScroll'
import { createRafScrollListener } from '@/lib/scrollSync'
import { isWattaPhoneViewport, isWattaTouchScrollPerfViewport } from '@/lib/wattaTouchViewport'

export const WATTA_PAST_HERO_ATTR = 'data-watta-past-hero'
export const WATTA_CART_BAR_VISIBLE_ATTR = 'data-watta-cart-bar-visible'
export const WATTA_CART_BAR_PROGRESS_VAR = '--watta-cart-bar-progress'
export const WATTA_CART_DRAWER_LAYOUT_SYNC_EVENT = 'watta-cart-drawer-layout-sync'
const LEGACY_HOME_PAST_HERO_ATTR = 'data-watta-home-past-hero'
/** Сторінки, де смуга кошика їде лише після hero (/, /menu) — навіть якщо в кошику є товари. */
export const WATTA_CART_BAR_GATED_ATTR = 'data-watta-cart-bar-gated'

/** Порядок важливий: перший знайдений intro/hero на сторінці. */
const HERO_SELECTOR_PRIORITY = [
  '[data-watta-cart-bar-gate]',
  '[data-watta-home-photo-first]',
  '[data-watta-roll-hero]',
  '.watta-stellar-hero-stack',
  '.menu-stellar-hero-stack',
  '.delivery-page-home-flow > .delivery-page-intro-web',
  '.delivery-page-intro-web--video',
  '#home-after-hero-intro',
  '.watta-promotions-hero-zone',
  '.watta-product-page__gallery',
  '.watta-blog-page__header',
  '.delivery-page-intro-web',
] as const

const SCROLL_SHOW_PX = 72
const FALLBACK_REVEAL_VH = 0.72
/** Hero bottom — повна смуга кошика. */
const HERO_BAR_REVEAL_RATIO = 0.68
/** Hero bottom — початок плавного виїзду смуги. */
const HERO_BAR_REVEAL_START_RATIO = 1.04
const CART_BAR_VISIBLE_THRESHOLD = 0.04
const CART_BAR_PAST_THRESHOLD = 0.98

function normalizePath(pathname: string): string {
  const trimmed = pathname.replace(/\/+$/, '')
  return trimmed || '/'
}

/** Лише головна та /menu — смуга кошика з’являється після скролу повз hero. */
function isCartBarScrollGatedPath(pathname: string): boolean {
  const p = normalizePath(pathname)
  return p === '/' || p === '/menu'
}

function findPageHero(): HTMLElement | null {
  if (typeof document === 'undefined') return null
  for (const selector of HERO_SELECTOR_PRIORITY) {
    const el = document.querySelector<HTMLElement>(selector)
    if (el) return el
  }
  return null
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value))
}

function resolveCartBarProgress(hero: HTMLElement | null, scrollTop: number): number {
  if (hero) {
    const rect = hero.getBoundingClientRect()
    const vh = window.innerHeight
    const revealEnd = vh * HERO_BAR_REVEAL_RATIO
    const revealStart = vh * HERO_BAR_REVEAL_START_RATIO
    if (rect.bottom <= revealEnd) {
      if (scrollTop <= SCROLL_SHOW_PX) return 0
      return 1
    }
    if (rect.bottom >= revealStart) return 0
    return clamp01(1 - (rect.bottom - revealEnd) / (revealStart - revealEnd))
  }

  const fallbackStart = Math.max(SCROLL_SHOW_PX, window.innerHeight * FALLBACK_REVEAL_VH)
  if (scrollTop <= SCROLL_SHOW_PX) return 0
  if (scrollTop >= fallbackStart) return 1
  return clamp01((scrollTop - SCROLL_SHOW_PX) / Math.max(1, fallbackStart - SCROLL_SHOW_PX))
}

let lastPublishedCartBarProgress = -1

function setCartBarReveal(progress: number) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  const p = clamp01(progress)

  if (Math.abs(p - lastPublishedCartBarProgress) < 0.02) return
  lastPublishedCartBarProgress = p

  root.style.setProperty(WATTA_CART_BAR_PROGRESS_VAR, p.toFixed(3))

  if (p > CART_BAR_VISIBLE_THRESHOLD) {
    root.setAttribute(WATTA_CART_BAR_VISIBLE_ATTR, '1')
  } else {
    root.removeAttribute(WATTA_CART_BAR_VISIBLE_ATTR)
  }

  if (p >= CART_BAR_PAST_THRESHOLD) {
    root.setAttribute(WATTA_PAST_HERO_ATTR, '1')
    root.setAttribute(LEGACY_HOME_PAST_HERO_ATTR, '1')
  } else {
    root.removeAttribute(WATTA_PAST_HERO_ATTR)
    root.removeAttribute(LEGACY_HOME_PAST_HERO_ATTR)
  }
}

/** Телефон: нижня смуга «Оформити» — одразу скрізь, крім / та /menu (там після hero; якщо в кошику є товари — одразу). */
export function useMobileCartBarGate() {
  const pathname = usePathname() || '/'

  useEffect(() => {
    if (typeof window === 'undefined') return

    if (
      pathname === '/cart' ||
      pathname.startsWith('/admin') ||
      !isCartBarScrollGatedPath(pathname)
    ) {
      document.documentElement.removeAttribute(WATTA_CART_BAR_GATED_ATTR)
      setCartBarReveal(1)
      return
    }

    // Головна / меню: смуга кошика з’являється лише після скролу повз hero,
    // навіть якщо в кошику вже є товари (інакше зелена смуга «стоїть» одразу зверху).
    document.documentElement.setAttribute(WATTA_CART_BAR_GATED_ATTR, '1')

    const mq = window.matchMedia('(max-width: 767px)')
    let unbindScroll: (() => void) | null = null
    let heroObserver: ResizeObserver | null = null
    let cancelScrollRaf: (() => void) | null = null

    const detach = () => {
      unbindScroll?.()
      unbindScroll = null
      cancelScrollRaf?.()
      cancelScrollRaf = null
      heroObserver?.disconnect()
      heroObserver = null
    }

    const sync = () => {
      if (!mq.matches || !isWattaPhoneViewport()) {
        setCartBarReveal(1)
        return
      }
      if (document.documentElement.hasAttribute('data-watta-cart-drawer-open')) {
        setCartBarReveal(1)
        return
      }
      const hero = findPageHero()
      setCartBarReveal(resolveCartBarProgress(hero, readAppScrollTop()))
    }

    const { onScroll: scheduleSync, cancel: cancelScrollListener } = createRafScrollListener(sync, {
      minIntervalMs: isWattaTouchScrollPerfViewport() ? 64 : 0,
    })

    const observeHero = () => {
      heroObserver?.disconnect()
      heroObserver = null
      if (typeof ResizeObserver === 'undefined') return
      const hero = findPageHero()
      if (!hero) return
      heroObserver = new ResizeObserver(scheduleSync)
      heroObserver.observe(hero)
    }

    const bind = () => {
      detach()

      if (!mq.matches || !isWattaPhoneViewport()) {
        setCartBarReveal(1)
        return
      }

      lastPublishedCartBarProgress = -1
      setCartBarReveal(0)
      observeHero()
      sync()
      cancelScrollRaf = cancelScrollListener
      unbindScroll = bindAppVerticalScroll(scheduleSync)
    }

    bind()

    const onMq = () => bind()
    mq.addEventListener('change', onMq)

    const t1 = window.setTimeout(bind, 0)
    const t2 = window.setTimeout(bind, 150)
    const t3 = window.setTimeout(bind, 400)
    const onResize = () => scheduleSync()
    window.addEventListener('resize', onResize, { passive: true })
    window.addEventListener(WATTA_CART_DRAWER_LAYOUT_SYNC_EVENT, scheduleSync)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      mq.removeEventListener('change', onMq)
      window.removeEventListener('resize', onResize)
      window.removeEventListener(WATTA_CART_DRAWER_LAYOUT_SYNC_EVENT, scheduleSync)
      detach()
      document.documentElement.removeAttribute(WATTA_PAST_HERO_ATTR)
      document.documentElement.removeAttribute(LEGACY_HOME_PAST_HERO_ATTR)
      document.documentElement.removeAttribute(WATTA_CART_BAR_VISIBLE_ATTR)
      document.documentElement.removeAttribute(WATTA_CART_BAR_GATED_ATTR)
      document.documentElement.style.removeProperty(WATTA_CART_BAR_PROGRESS_VAR)
    }
  }, [pathname])
}
