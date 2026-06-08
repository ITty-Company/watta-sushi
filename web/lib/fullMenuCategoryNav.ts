import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import { navigateInstant, prefetchHref } from '@/lib/instantNav'
import { prefetchRouteChunk } from '@/lib/prefetchRouteChunks'
import { canonicalMenuCategorySlug } from '@/lib/menuCategoryCanonical'
import { markMenuCategoryNavigation, markPendingMenuCatScroll } from '@/lib/wattaChromeScroll'
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
  markMenuCategoryNavigation({ restoreCompact: isWattaCompactChromeViewport() })
  markPendingMenuCatScroll(scrollSlug)

  const loc = currentMenuLocationHref()
  const onMenu = pathname === '/menu' || loc === '/menu' || loc.startsWith('/menu?')

  if (onMenu) {
    if (loc !== href) {
      navigateInstant(router as AppRouterInstance, href, { replace: true, scroll: false, immediate: true })
    }
    dispatchFullMenuScrollToCategory(scrollSlug)
    return
  }

  navigateInstant(router as AppRouterInstance, href, { scroll: false, immediate: true })
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

  markMenuCategoryNavigation({ restoreCompact: isWattaCompactChromeViewport() })

  if (onMenu) {
    if (loc !== href) {
      navigateInstant(router as AppRouterInstance, href, { replace: true, scroll: false, immediate: true })
    }
    dispatchFullMenuScrollToCategory(scrollSlug)
    return
  }

  if (scrollSlug !== FULL_MENU_ALL_SLUG) {
    markPendingMenuCatScroll(scrollSlug)
  }
  navigateInstant(router as AppRouterInstance, href, { scroll: false, immediate: true })
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
  const instant = options?.instant !== false
  window.dispatchEvent(new CustomEvent('wattaMenuCategoryHighlight', { detail: { slug: trimmed } }))
  window.dispatchEvent(
    new CustomEvent(WATTA_MENU_REQUEST_SCROLL_TO_CAT, {
      detail: { slug: trimmed, instant } satisfies MenuCategoryScrollDetail,
    }),
  )
}
