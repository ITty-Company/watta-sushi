/** Постійні іконки категорій у `public/` — не залежать від uploads в адмінці. */
export const MENU_CATEGORY_SUSHI_BURGER_ICON = '/category-icons/sushi-burger.png' as const
export const MENU_CATEGORY_DESSERTS_ICON = '/category-icons/desserts.png' as const

const PERMANENT_MENU_CATEGORY_IMAGES: Record<string, string> = {
  /* Прод: slug «-» для «Суші бургер» */
  '-': MENU_CATEGORY_SUSHI_BURGER_ICON,
  'sushi-burger': MENU_CATEGORY_SUSHI_BURGER_ICON,
  'sushi-burgers': MENU_CATEGORY_SUSHI_BURGER_ICON,
  /* Прод: slug «category» для «Десерти» */
  category: MENU_CATEGORY_DESSERTS_ICON,
  desserts: MENU_CATEGORY_DESSERTS_ICON,
  dessert: MENU_CATEGORY_DESSERTS_ICON,
}

/** Незмінна іконка для slug (якщо задана в коді). */
export function resolvePermanentMenuCategoryImage(slug: string): string | null {
  const key = String(slug ?? '').trim().toLowerCase()
  if (!key) return null
  return PERMANENT_MENU_CATEGORY_IMAGES[key] ?? null
}

/** Завжди підставляє постійні іконки для суші-бургерів і десертів. */
export function applyPermanentMenuCategoryImages(
  slug: string,
  imageUrl?: string | null,
  hoverImageUrl?: string | null,
): { imageUrl: string | null; hoverImageUrl: string | null } {
  const permanent = resolvePermanentMenuCategoryImage(slug)
  if (permanent) {
    return { imageUrl: permanent, hoverImageUrl: permanent }
  }
  return {
    imageUrl: typeof imageUrl === 'string' && imageUrl.trim() ? imageUrl.trim() : null,
    hoverImageUrl:
      typeof hoverImageUrl === 'string' && hoverImageUrl.trim() ? hoverImageUrl.trim() : null,
  }
}
