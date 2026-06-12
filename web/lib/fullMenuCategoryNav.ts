import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import { navigateInstant, prefetchHref } from '@/lib/instantNav'
import { prefetchRouteChunk } from '@/lib/prefetchRouteChunks'
import { canonicalMenuCategorySlug } from '@/lib/menuCategoryCanonical'
import { markMenuCategoryNavigation, markPendingMenuCatScroll } from '@/lib/wattaChromeScroll'
import {
  cancelRouteScrollToTopOnNavigation,
  runUntilScrollSuccess,
  scrollHomeCatalogToCategory,
} from '@/lib/menuScroll'
import { isWattaCompactChromeViewport } from '@/lib/wattaTouchViewport'

/** Псевдо-категорія «Усі» на `/menu` — збігається в `WattaMenuCategoryStrip` та `FullMenuPageClient`. */
export const FULL_MENU_ALL_SLUG = '__all__' as const

type MenuNavRouter = Pick<AppRouterInstance, 'push' | 'replace' | 'prefetch'>

/** Префетч RSC + JS-чанк меню для категорії — на pointerdown, до кліку. */
export function prefetchFullMenuCategory(
  router: Pick<AppRouterInstance, 'prefetch'>,
  slug: string,
): void {
  const href = buildMenuCategoryHref(slug)
  prefetchHref(router as AppRouterInstance, href)
  prefetchRouteChunk(href)
}

export function buildMenuCategoryHref(slug: string): string {
  const trimmed = canonicalMenuCategorySlug(slug)
  if (!trimmed || trimmed === FULL_MENU_ALL_SLUG) return '/menu'
  return `/menu?cat=${encodeURIComponent(trimmed)}`
}

export function menuCategoryScrollSlug(slug: string): string {
  const trimmed = canonicalMenuCategorySlug(slug)
  if (!trimmed || trimmed === FULL_MENU_ALL_SLUG) return FULL_MENU_ALL_SLUG
  return trimmed
}

function isMenuCategorySectionMounted(slug: string): boolean {
  if (typeof document === 'undefined') return false
  if (slug === FULL_MENU_ALL_SLUG) {
    return Boolean(document.getElementById('full-menu-page-start'))
  }
  const norm = canonicalMenuCategorySlug(slug)
  return Boolean(
    document.getElementById(`full-menu-heading-${norm}`) ??
      document.getElementById(`full-menu-heading-${slug}`) ??
      document.getElementById(`full-menu-section-${norm}`),
  )
}

/** Після переходу на `/menu` — скрол до секції, коли каталог уже змонтований. */
function scheduleMenuCategoryScrollAfterNav(slug: string): void {
  if (typeof window === 'undefined') return
  const trimmed = slug.trim()
  if (!trimmed || trimmed === FULL_MENU_ALL_SLUG) return
  runUntilScrollSuccess(() => {
    if (window.location.pathname !== '/menu') return false
    if (!isMenuCategorySectionMounted(trimmed)) return false
    dispatchFullMenuScrollToCategory(trimmed)
    return true
  }, [0, 32, 80, 160, 320, 560, 900])
}

function isHomePathname(pathname: string): boolean {
  const p = pathname.trim()
  return p === '/' || p === ''
}

/** Ліва панель (бургер-меню): завжди відкриває `/menu?cat=` і скролить до секції. */
function currentMenuLocationHref(): string {
  if (typeof window === 'undefined') return '/menu'
  return `${window.location.pathname}${window.location.search}`
}

export function navigateFromNavDrawerToCategory(
  router: MenuNavRouter,
  pathname: string,
  slug: string,
) {
  const href = buildMenuCategoryHref(slug)
  prefetchFullMenuCategory(router, slug)
  const scrollSlug = menuCategoryScrollSlug(slug)

  const loc = currentMenuLocationHref()
  const onMenu = pathname === '/menu' || loc === '/menu' || loc.startsWith('/menu?')

  if (onMenu) {
    markMenuCategoryNavigation({ restoreCompact: isWattaCompactChromeViewport() })
    if (loc !== href) {
      navigateInstant(router as AppRouterInstance, href, { replace: true, scroll: false, immediate: true })
    }
    dispatchFullMenuScrollToCategory(scrollSlug)
    return
  }

  if (scrollSlug !== FULL_MENU_ALL_SLUG) {
    markMenuCategoryNavigation({ restoreCompact: isWattaCompactChromeViewport() })
    markPendingMenuCatScroll(scrollSlug)
    navigateInstant(router as AppRouterInstance, href, { scroll: false, immediate: true })
    scheduleMenuCategoryScrollAfterNav(scrollSlug)
    return
  }

  navigateInstant(router as AppRouterInstance, href, { immediate: true })
}

/** Клік по чіпу категорії (capture + React) — один обробник у AppClient. */
export const WATTA_CATEGORY_STRIP_SELECT = 'wattaCategoryStripSelect' as const

export function dispatchCategoryStripSelect(slug: string) {
  if (typeof window === 'undefined') return
  const trimmed = slug.trim()
  if (!trimmed) return
  window.dispatchEvent(
    new CustomEvent(WATTA_CATEGORY_STRIP_SELECT, { detail: { slug: trimmed } }),
  )
}

/** Верхня стрічка категорій: на `/menu` — скрол до секції + ?cat=; на головній та інших → `/menu?cat=`. */
export function navigateToFullMenuCategory(
  router: MenuNavRouter,
  pathname: string,
  slug: string,
) {
  const href = buildMenuCategoryHref(slug)
  prefetchFullMenuCategory(router, slug)
  const scrollSlug = menuCategoryScrollSlug(slug)

  const loc = currentMenuLocationHref()
  const onMenu = pathname === '/menu' || loc === '/menu' || loc.startsWith('/menu?')

  if (onMenu) {
    markMenuCategoryNavigation({ restoreCompact: isWattaCompactChromeViewport() })
    if (loc !== href) {
      navigateInstant(router as AppRouterInstance, href, { replace: true, scroll: false, immediate: true })
    }
    dispatchFullMenuScrollToCategory(scrollSlug)
    return
  }

  if (isHomePathname(pathname)) {
    cancelRouteScrollToTopOnNavigation()
    runUntilScrollSuccess(() => scrollHomeCatalogToCategory(scrollSlug))
    return
  }

  if (scrollSlug !== FULL_MENU_ALL_SLUG) {
    markMenuCategoryNavigation({ restoreCompact: isWattaCompactChromeViewport() })
    markPendingMenuCatScroll(scrollSlug)
    navigateInstant(router as AppRouterInstance, href, { scroll: false, immediate: true })
    scheduleMenuCategoryScrollAfterNav(scrollSlug)
    return
  }

  navigateInstant(router as AppRouterInstance, href, { immediate: true })
}

/** Клік по стрічці категорій на `/menu` — скрол до секції в каталозі. */
export const WATTA_MENU_REQUEST_SCROLL_TO_CAT = 'wattaMenuRequestScrollToCat' as const

export type MenuCategoryScrollDetail = {
  slug: string
  /** false — плавний eased-скрол (лише коли явно потрібно). За замовчуванням миттєво. */
  instant?: boolean
}

/** Підсвітка + скрол до секції на `/menu` (лише по кліку в стрічці; без зміни scroll-позиції Next.js). */
export function dispatchFullMenuScrollToCategory(
  slug: string,
  options?: { instant?: boolean },
) {
  if (typeof window === 'undefined') return
  const trimmed = slug.trim()
  if (!trimmed) return
  cancelRouteScrollToTopOnNavigation()
  const instant = options?.instant !== false
  window.dispatchEvent(new CustomEvent('wattaMenuCategoryHighlight', { detail: { slug: trimmed } }))
  window.dispatchEvent(
    new CustomEvent(WATTA_MENU_REQUEST_SCROLL_TO_CAT, {
      detail: { slug: trimmed, instant } satisfies MenuCategoryScrollDetail,
    }),
  )
}
