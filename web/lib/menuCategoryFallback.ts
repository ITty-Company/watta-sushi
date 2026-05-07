/** Slug + emoji, якщо API категорій недоступний — назви завжди з `t.categories`. */
export const MENU_CATEGORY_FALLBACK_SLUGS = [
  'rolls',
  'sushi',
  'sets',
  'soups',
  'bowls',
  'snacks',
  'drinks',
  'sauces',
] as const

export type MenuCategoryFallbackSlug = (typeof MENU_CATEGORY_FALLBACK_SLUGS)[number]

export const MENU_CATEGORY_EMOJI: Record<MenuCategoryFallbackSlug, string> = {
  rolls: '🍣',
  sushi: '🍙',
  sets: '🍱',
  soups: '🍜',
  bowls: '🥗',
  snacks: '🍤',
  drinks: '🧃',
  sauces: '🌶️',
}
