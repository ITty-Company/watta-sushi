import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'

/** Псевдо-категорія «Усі» на `/menu` — збігається в `WattaMenuCategoryStrip` та `FullMenuPageClient`. */
export const FULL_MENU_ALL_SLUG = '__all__' as const

type MenuNavRouter = Pick<AppRouterInstance, 'push' | 'replace'>

export function buildMenuCategoryHref(slug: string): string {
  const trimmed = slug.trim()
  if (!trimmed || trimmed === FULL_MENU_ALL_SLUG) return '/menu'
  return `/menu?cat=${encodeURIComponent(trimmed)}`
}

export function menuCategoryScrollSlug(slug: string): string {
  const trimmed = slug.trim()
  if (!trimmed || trimmed === FULL_MENU_ALL_SLUG) return FULL_MENU_ALL_SLUG
  return trimmed
}

/** Бокова панель / профіль: перехід на `/menu` і скрол до секції категорії. */
export function navigateToFullMenuCategory(
  router: MenuNavRouter,
  pathname: string,
  slug: string,
) {
  const href = buildMenuCategoryHref(slug)
  const scrollSlug = menuCategoryScrollSlug(slug)
  if (pathname === '/menu') {
    dispatchFullMenuScrollToCategory(scrollSlug)
    router.replace(href, { scroll: false })
    return
  }
  router.push(href, { scroll: false })
}

/** Клік по стрічці категорій на `/menu` — скрол до секції в каталозі. */
export const WATTA_MENU_REQUEST_SCROLL_TO_CAT = 'wattaMenuRequestScrollToCat' as const

/** Клік по стрічці на головній `/` — скрол до секції каталогу в `MenuView`. */
export const WATTA_HOME_REQUEST_SCROLL_TO_CAT = 'wattaHomeRequestScrollToCat' as const

/** Підсвітка + скрол до секції на `/menu` (лише по кліку в стрічці; без зміни scroll-позиції Next.js). */
export function dispatchFullMenuScrollToCategory(slug: string) {
  if (typeof window === 'undefined') return
  const trimmed = slug.trim()
  if (!trimmed) return
  window.dispatchEvent(new CustomEvent('wattaMenuCategoryHighlight', { detail: { slug: trimmed } }))
  window.dispatchEvent(
    new CustomEvent(WATTA_MENU_REQUEST_SCROLL_TO_CAT, { detail: { slug: trimmed } }),
  )
}
