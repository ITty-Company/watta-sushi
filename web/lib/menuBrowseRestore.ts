/** Стан меню головної сторінки перед переходом на /product/:id — для відновлення після router.back(). */

export const MENU_BROWSE_RETURN_KEY = 'watta_menu_browse_return_v1'

export type MenuBrowseReturnPayload = {
  /** 1 — без горизонтального скролу cinematic; 2 — з рекомендаціями/акціями */
  v: 1 | 2
  savedAt: number
  /** Зберігаємо лише для головної; відновлення тільки якщо збігається. */
  pathname: string
  scrollY: number
  categoryKey: string
  categoriesPanelScrollLeft: number
  activePage: string | null
  cinematicRecScrollLeft?: number
  cinematicPromoScrollLeft?: number
}

const MAX_AGE_MS = 2 * 60 * 60 * 1000

export function parseMenuBrowseReturn(raw: string | null): MenuBrowseReturnPayload | null {
  if (!raw) return null
  try {
    const data = JSON.parse(raw) as Partial<MenuBrowseReturnPayload>
    if (data.v !== 1 && data.v !== 2) return null
    if (typeof data.scrollY !== 'number' || typeof data.categoryKey !== 'string') return null
    if (typeof data.pathname !== 'string') return null
    return {
      v: data.v === 2 ? 2 : 1,
      savedAt: typeof data.savedAt === 'number' ? data.savedAt : 0,
      pathname: data.pathname,
      scrollY: data.scrollY,
      categoryKey: data.categoryKey,
      categoriesPanelScrollLeft:
        typeof data.categoriesPanelScrollLeft === 'number' ? data.categoriesPanelScrollLeft : 0,
      activePage: data.activePage === undefined || data.activePage === null ? null : String(data.activePage),
      cinematicRecScrollLeft:
        typeof data.cinematicRecScrollLeft === 'number' ? data.cinematicRecScrollLeft : undefined,
      cinematicPromoScrollLeft:
        typeof data.cinematicPromoScrollLeft === 'number' ? data.cinematicPromoScrollLeft : undefined,
    }
  } catch {
    return null
  }
}

export function shouldRestoreMenuBrowse(payload: MenuBrowseReturnPayload): boolean {
  if (Date.now() - payload.savedAt > MAX_AGE_MS) return false
  return payload.pathname === '/'
}

export function writeMenuBrowseReturn(
  fields: Omit<MenuBrowseReturnPayload, 'v' | 'savedAt'> & {
    pathname: string
    v?: 1 | 2
  },
): void {
  if (typeof sessionStorage === 'undefined') return
  const fullPayload: MenuBrowseReturnPayload = {
    v: fields.v ?? 2,
    savedAt: Date.now(),
    pathname: fields.pathname,
    scrollY: fields.scrollY,
    categoryKey: fields.categoryKey,
    categoriesPanelScrollLeft: fields.categoriesPanelScrollLeft,
    activePage: fields.activePage,
    cinematicRecScrollLeft: fields.cinematicRecScrollLeft,
    cinematicPromoScrollLeft: fields.cinematicPromoScrollLeft,
  }
  sessionStorage.setItem(MENU_BROWSE_RETURN_KEY, JSON.stringify(fullPayload))
}
