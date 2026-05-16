/** Підняти версію, коли змінилися дані API/локалізація — client sessionStorage знову тягне меню. */
export const MENU_CLIENT_CACHE_BUMP = 'i18n7' as const

/**
 * Сирі товари з /api/products (усі name_*) — один ключ на місто, без мови UI,
 * щоб при перемиканні мови миттєво перелічити `getLocalized` без додаткового fetch.
 */
export function menuItemsSessionKey(cityId: string | null | number): string {
  return `menu_items_${MENU_CLIENT_CACHE_BUMP}_${cityId ?? '0'}`
}

/** Сирі категорії з /api/products/categories (усі name_*), локалізуємо при відображенні. */
export function menuCategoriesSessionKey(): string {
  return `menu_categories_raw_${MENU_CLIENT_CACHE_BUMP}`
}
