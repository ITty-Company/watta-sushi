import { startTransition } from 'react'
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import { tryOpenAuthModalFromHref } from '@/lib/openWattaAuth'
import { MENU_CATEGORY_FALLBACK_SLUGS } from '@/lib/menuCategoryFallback'
import {
  readRawMenuCategoriesFromSession,
  warmMenuCatalogCache,
} from '@/lib/menuCatalogSessionCache'
import { normalizeInternalHref, normalizeInternalPath } from '@/lib/internalHref'
import { prefetchRouteChunk } from '@/lib/prefetchRouteChunks'
import { parseProductIdFromHref, warmProductRouteData } from '@/lib/fetchProductById'
import { consumePointerScrollGesture } from '@/lib/wattaScrollTapGuard'

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
  '/offer',
  '/login',
  '/register',
  '/checkout/success',
] as const

/** Центр шапки (desktop): Доставка / Про нас / Контакти — максимально швидкий перехід. */
export const HEADER_CENTER_NAV_PATHS = ['/delivery', '/about', '/contacts'] as const

export function isHeaderCenterNavPath(href: string): boolean {
  const path = normalizeInternalPath(href)
  return (
    path != null && (HEADER_CENTER_NAV_PATHS as readonly string[]).includes(path)
  )
}

/** Картка товару → /product/:id — той самий миттєвий перехід, що й шапка. */
export function isProductNavPath(href: string): boolean {
  const path = normalizeInternalPath(href)
  return path != null && /^\/product\/\d+$/.test(path)
}

/** Усі внутрішні публічні маршрути — без startTransition, щоб push стартував на першому кліку. */
export function isInstantNavPath(href: string): boolean {
  const path = normalizeInternalPath(href)
  if (!path) return false
  if (path === '/admin' || path.startsWith('/admin/')) return false
  return true
}

/** Шапка / drawer — префетч одразу, навіть коли повний список чекає hero на головній. */
export const WATTA_PRIORITY_PREFETCH_ROUTES = [
  '/delivery',
  '/about',
  '/contacts',
  '/menu',
  '/cart',
  '/favorites',
  '/profile',
  '/promotions',
  '/blog',
  '/reviews',
] as const

const prefetchedPaths = new Set<string>()

let recentPointerNavKey = ''
let recentPointerNavAt = 0

/** Запобігає дублю router.push після navigate на pointerdown. */
export function markRecentPointerNav(href: string): void {
  recentPointerNavKey = href
  recentPointerNavAt = Date.now()
}

export function wasRecentPointerNav(href: string, withinMs = 480): boolean {
  return recentPointerNavKey === href && Date.now() - recentPointerNavAt < withinMs
}

export { normalizeInternalHref, normalizeInternalPath }

export function prefetchHref(router: AppRouterInstance, href: string): void {
  const target = normalizeInternalHref(href)
  if (!target || prefetchedPaths.has(target)) return
  prefetchedPaths.add(target)
  prefetchRouteChunk(target)
  const productId = parseProductIdFromHref(normalizeInternalPath(target) ?? target)
  if (productId != null) warmProductRouteData(productId)
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
  for (const slug of slugs) {
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

/** href для кліку: <a> або лише data-href (data-prefetch-href — тільки prefetch). */
function resolveClickNavHref(el: Element | null): string | null {
  if (!el) return null
  const anchor = el.closest?.('a[href]') as HTMLAnchorElement | null
  if (anchor) {
    if (anchor.target === '_blank' || anchor.hasAttribute('download')) return null
    return anchor.getAttribute('href')
  }
  const dataEl = el.closest?.('[data-href]') as HTMLElement | null
  return dataEl?.getAttribute('data-href') ?? null
}

function prefetchFromIntentTarget(router: AppRouterInstance, target: EventTarget | null): void {
  const href = resolveNavHrefFromElement(target as Element | null)
  if (href) prefetchHref(router, href)
}

/** Найчастіші переходи з шапки — без очікування hero / idle. */
export function prefetchPriorityPublicRoutes(router: AppRouterInstance): void {
  for (const href of WATTA_PRIORITY_PREFETCH_ROUTES) {
    prefetchHref(router, href)
  }
}

export function prefetchPublicRoutes(router: AppRouterInstance): void {
  prefetchPriorityPublicRoutes(router)
  for (const href of WATTA_PUBLIC_PREFETCH_ROUTES) {
    prefetchHref(router, href)
  }
  prefetchCategoryRoutes(router)
  void warmMenuCatalogCache()
}

type NavigateOpts = {
  replace?: boolean
  scroll?: boolean
  /** Без startTransition — для шапкових посилань, щоб router.push відпрацював одразу. */
  immediate?: boolean
}

function markSkipBootSplashForHome(href: string): void {
  if (typeof document === 'undefined') return
  const pathOnly = href.split('?')[0] || href
  if (pathOnly !== '/' && pathOnly !== '') return
  try {
    document.documentElement.setAttribute('data-watta-skip-splash', '1')
    document.documentElement.removeAttribute('data-watta-boot-splash-pending')
  } catch {
    /* ignore */
  }
}

/** Navigate / replace — миттєвий перехід без boot splash на головну. */
export function navigateInstant(
  router: AppRouterInstance,
  href: string,
  options?: NavigateOpts,
): void {
  const target = normalizeInternalHref(href)
  if (!target) return
  if (tryOpenAuthModalFromHref(target)) return
  markSkipBootSplashForHome(target)
  prefetchHref(router, target)
  const scroll = options?.scroll ?? true
  const runNav = () => {
    if (options?.replace) router.replace(target, { scroll })
    else router.push(target, { scroll })
  }
  if (options?.immediate || isInstantNavPath(target)) {
    markRecentPointerNav(target)
    runNav()
  } else {
    startTransition(runNav)
  }
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

function isModifiedPointerNav(e: PointerEvent): boolean {
  return e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey
}

/** pointerdown: prefetch раніше за click (кнопки з data-href, звичайні <a>). Навігація — лише на click. */
export function installInstantNavPointerDown(router: AppRouterInstance): () => void {
  if (typeof document === 'undefined') return () => {}

  const onPointerDown = (e: PointerEvent) => {
    if (e.defaultPrevented || isModifiedPointerNav(e)) return
    const el = e.target as Element | null
    if (shouldSkipInstantNav(el)) return
    if (el?.closest?.('[data-watta-cat], .categories-scroll-btn-web')) {
      const catBtn = el?.closest?.('[data-watta-cat]') as HTMLElement | null
      const slug = catBtn?.getAttribute('data-watta-cat')?.trim()
      if (slug) {
        window.dispatchEvent(
          new CustomEvent('wattaCategoryStripSelect', { detail: { slug } }),
        )
      }
      prefetchFromIntentTarget(router, el)
      return
    }

    prefetchFromIntentTarget(router, el)
  }

  const opts = { capture: true, passive: true } as const
  document.addEventListener('pointerdown', onPointerDown, opts)
  return () => document.removeEventListener('pointerdown', onPointerDown, opts)
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
 * Capture-фаза: миттєвий перехід для <a> без WattaLink і кнопок з data-href.
 * stopPropagation — React onClick не дублює router.push.
 */
export function installInstantNavClick(router: AppRouterInstance): () => void {
  if (typeof document === 'undefined') return () => {}

  const onClick = (e: MouseEvent) => {
    if (e.defaultPrevented || isModifiedNavClick(e)) return
    if (consumePointerScrollGesture()) return
    const el = e.target as Element | null
    if (shouldSkipInstantNav(el)) return

    const href = resolveClickNavHref(el)
    const target = href ? normalizeInternalHref(href) : null
    if (!target || target === currentPathWithSearch()) return
    if (wasRecentPointerNav(target)) return

    e.preventDefault()
    e.stopPropagation()
    navigateInstant(router, target, { immediate: true })
  }

  document.addEventListener('click', onClick, true)
  return () => document.removeEventListener('click', onClick, true)
}
