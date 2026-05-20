/** Псевдо-категорія «Усі» на `/menu` — збігається в `WattaMenuCategoryStrip` та `FullMenuPageClient`. */
export const FULL_MENU_ALL_SLUG = '__all__' as const

/** Клік по стрічці категорій на `/menu` — скрол до секції в каталозі. */
export const WATTA_MENU_REQUEST_SCROLL_TO_CAT = 'wattaMenuRequestScrollToCat' as const

/** Клік по стрічці на головній `/` — скрол до секції каталогу в `MenuView`. */
export const WATTA_HOME_REQUEST_SCROLL_TO_CAT = 'wattaHomeRequestScrollToCat' as const

/** Підсвітка + скрол до секції на `/menu` (без зміни scroll-позиції Next.js). */
export function dispatchFullMenuScrollToCategory(slug: string) {
  if (typeof window === 'undefined') return
  const trimmed = slug.trim()
  if (!trimmed) return
  window.dispatchEvent(new CustomEvent('wattaMenuCategoryHighlight', { detail: { slug: trimmed } }))
  window.dispatchEvent(
    new CustomEvent(WATTA_MENU_REQUEST_SCROLL_TO_CAT, { detail: { slug: trimmed } }),
  )
}
