import { startTransition } from 'react'
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import { MENU_CATEGORY_FALLBACK_SLUGS } from '@/lib/menuCategoryFallback'
import {
  readRawMenuCategoriesFromSession,
  warmMenuCatalogCache,
} from '@/lib/menuCatalogSessionCache'

/** Публічні маршрути — префетч при старті, щоб тап відчувався миттєво. */
export const WATTA_PUBLIC_PREFETCH_ROUTES = [
  '/',
  '/menu',
  '/delivery',
  '/about',
  '/about/gallery',
  '/contacts',
  '/reviews',
  '/promotions',
  '/blog',
  '/favorites',
  '/cart',
  '/profile',
  '/notifications',
  '/privacy',
  '/login',
  '/register',
  '/checkout/success',
  '/admin',
] as const

const MAX_CATEGORY_PREFETCH = 24

const prefetchedPaths = new Set<string>()

/** Внутрішній href (pathname + query, без hash). */
export function normalizeInternalHref(href: string): string | null {
  if (!href || href.startsWith('//') || href.startsWith('http') || href.startsWith('mailto:')) {
    return null
  }
  if (!href.startsWith('/')) return null
  const withoutHash = href.split('#')[0]?.trim()
  return withoutHash && withoutHash.startsWith('/') ? withoutHash : null
}

/** Лише pathname — для порівнянь маршруту. */
export function normalizeInternalPath(href: string): string | null {
  const full = normalizeInternalHref(href)
  if (!full) return null
  return full.split('?')[0] || full
}

export function prefetchHref(router: AppRouterInstance, href: string): void {
  const target = normalizeInternalHref(href)
  if (!target || prefetchedPaths.has(target)) return
  prefetchedPaths.add(target)
  try {
    router.prefetch(target)
  } catch {
    prefetchedPaths.delete(target)
  }
}

function prefetchCategoryRoutes(router: AppRouterInstance): void {
  const fromSession = readRawMenuCategoriesFromSession()
  const slugs: string[] = []
  if (fromSession?.length) {
    for (const row of fromSession) {
      const slug = String(row.slug ?? row.key ?? row.id ?? '').trim()
      if (slug) slugs.push(slug)
    }
  }
  if (slugs.length === 0) {
    slugs.push(...MENU_CATEGORY_FALLBACK_SLUGS)
  }
  for (const slug of slugs.slice(0, MAX_CATEGORY_PREFETCH)) {
    prefetchHref(router, `/menu/category/${encodeURIComponent(slug)}`)
    prefetchHref(router, `/menu?cat=${encodeURIComponent(slug)}`)
  }
}

/** href з <a>, data-href або data-prefetch-href (кнопки навігації). */
export function resolveNavHrefFromElement(el: Element | null): string | null {
  if (!el) return null
  const anchor = el.closest?.('a[href]') as HTMLAnchorElement | null
  if (anchor) {
    if (anchor.target === '_blank' || anchor.hasAttribute('download')) return null
    return anchor.getAttribute('href')
  }
  const dataEl = el.closest?.('[data-href],[data-prefetch-href]') as HTMLElement | null
  if (!dataEl) return null
  return dataEl.getAttribute('data-href') || dataEl.getAttribute('data-prefetch-href')
}

function prefetchFromIntentTarget(router: AppRouterInstance, target: EventTarget | null): void {
  const href = resolveNavHrefFromElement(target as Element | null)
  if (href) prefetchHref(router, href)
}

export function prefetchPublicRoutes(router: AppRouterInstance): void {
  for (const href of WATTA_PUBLIC_PREFETCH_ROUTES) {
    prefetchHref(router, href)
  }
  prefetchCategoryRoutes(router)
  void warmMenuCatalogCache()
}

type NavigateOpts = {
  replace?: boolean
  scroll?: boolean
}

/** Миттєвий перехід: префетч + startTransition (UI не блокується). */
export function navigateInstant(
  router: AppRouterInstance,
  href: string,
  options?: NavigateOpts,
): void {
  const target = normalizeInternalHref(href)
  if (!target) return
  prefetchHref(router, target)
  const scroll = options?.scroll ?? true
  startTransition(() => {
    if (options?.replace) router.replace(target, { scroll })
    else router.push(target, { scroll })
  })
}

/**
 * Prefetch на pointerdown / focus — раніше за клік, поки палець ще на кнопці.
 * Повертає cleanup для useEffect.
 */
function isModifiedNavClick(e: MouseEvent): boolean {
  return e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey
}

function currentPathWithSearch(): string {
  if (typeof window === 'undefined') return '/'
  return `${window.location.pathname}${window.location.search}`
}

function shouldSkipInstantNav(el: Element | null): boolean {
  if (!el) return true
  return Boolean(
    el.closest(
      '[data-watta-skip-instant-nav], [data-watta-embedded-nav], [data-watta-link="1"]',
    ),
  )
}

export function installInstantNavIntent(router: AppRouterInstance): () => void {
  if (typeof document === 'undefined') return () => {}

  const onPointerDown = (e: PointerEvent) => prefetchFromIntentTarget(router, e.target)
  const onTouchStart = (e: TouchEvent) => prefetchFromIntentTarget(router, e.target)
  const onFocusIn = (e: FocusEvent) => prefetchFromIntentTarget(router, e.target)
  const onMouseEnter = (e: MouseEvent) => {
    const el = e.target as Element | null
    if (!el?.closest?.('a[href], [data-href], [data-prefetch-href]')) return
    prefetchFromIntentTarget(router, el)
  }

  const opts = { capture: true, passive: true } as const
  document.addEventListener('pointerdown', onPointerDown, opts)
  document.addEventListener('touchstart', onTouchStart, opts)
  document.addEventListener('focusin', onFocusIn, opts)
  document.addEventListener('mouseover', onMouseEnter, opts)

  return () => {
    document.removeEventListener('pointerdown', onPointerDown, opts)
    document.removeEventListener('touchstart', onTouchStart, opts)
    document.removeEventListener('focusin', onFocusIn, opts)
    document.removeEventListener('mouseover', onMouseEnter, opts)
  }
}

/**
 * Після React onClick: миттєвий router.push для звичайних <a> без WattaLink.
 * Кнопки з data-prefetch-href лише префетчаться на pointerdown (installInstantNavIntent).
 */
export function installInstantNavClick(router: AppRouterInstance): () => void {
  if (typeof document === 'undefined') return () => {}

  const onClick = (e: MouseEvent) => {
    if (e.defaultPrevented || isModifiedNavClick(e)) return
    const el = e.target as Element | null
    if (shouldSkipInstantNav(el)) return

    const anchor = el?.closest?.('a[href]') as HTMLAnchorElement | null
    if (!anchor) return
    if (anchor.target === '_blank' || anchor.hasAttribute('download')) return

    const href = anchor.getAttribute('href')
    const target = href ? normalizeInternalHref(href) : null
    if (!target || target === currentPathWithSearch()) return

    e.preventDefault()
    navigateInstant(router, target)
  }

  document.addEventListener('click', onClick, false)
  return () => document.removeEventListener('click', onClick, false)
}
