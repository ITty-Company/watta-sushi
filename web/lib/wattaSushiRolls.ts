export interface WattaSushiRollData {
  title: string
  imageUrl: string
}

/** Верхній ряд маркі — 16 позицій (12 базових + 4 додаткових). */
export const WATTA_HERO_ROLL_TOP_ROW_COUNT = 16

const TOP_ROW_NAMES = [
  'Spicy tuna',
  'Golden dragon',
  'Philadelphia',
  'Rainbow',
  'Tempura roll',
  'Unagi roll',
  'Salmon roll',
  'Dragon roll',
  'California',
  'Baked roll',
  'Gunkan',
  'Tuna maki',
  'Bonito roll',
  'Eel sesame',
  'Tobiko creamy',
  'Crispy dragon',
] as const

const BOTTOM_ROW_NAMES = [
  'Ebi roll',
  'Mussels roll',
  'Premium mix',
  'Cream cheese',
  'Tobiko roll',
  'Fire roll',
  'Green roll',
  'Chef special',
  'Watta signature',
  'Aburi salmon',
  'Sesame roll',
  'Crispy onion',
  'Eel dragon',
  'Red dragon',
  'Shrimp tempura',
  'Salmon tempura',
  'Aburi tempura',
  'Black rice roll',
  'Sesame eel',
  'Salmon maki',
  'Baked gunkan',
  'Spicy tobiko',
  'Wakame roll',
  'Seafood gunkan',
  'Lava roll',
  'Philadelphia II',
  'Rainbow II',
  'Dragon II',
  'California II',
  'Tempura II',
  'Unagi II',
  'Salmon II',
  'Fire II',
  'Tobiko II',
] as const

/** Шлях hero-ролла за індексом (1-based). */
export function wattaHeroRollImageUrl(index: number): string {
  return `/watta-hero-rolls/roll-${String(index).padStart(2, '0')}.webp`
}

const TOP_ROW_IMAGE_INDICES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 51, 52, 53, 54] as const

/** Нижній ряд: явний список (без roll-15, roll-16, roll-22 і roll-36). */
const BOTTOM_ROW_IMAGE_INDICES = [
  13, 14, 17, 18, 19, 20, 21, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 37, 38, 39, 40, 41,
  42, 43, 44, 45, 46, 47, 48, 49, 50,
] as const

export const HERO_ROLL_EXCLUDED_URLS = [
  wattaHeroRollImageUrl(15),
  wattaHeroRollImageUrl(16),
  wattaHeroRollImageUrl(22),
  wattaHeroRollImageUrl(36),
] as const

const HERO_ROLL_EXCLUDED_URL_SET = new Set<string>(HERO_ROLL_EXCLUDED_URLS)

export function isHeroRollExcluded(imageUrl: string): boolean {
  return HERO_ROLL_EXCLUDED_URL_SET.has(imageUrl)
}

function buildHeroRollImages(): WattaSushiRollData[] {
  const rows: WattaSushiRollData[] = [
    ...TOP_ROW_NAMES.map((title, i) => ({
      title,
      imageUrl: wattaHeroRollImageUrl(TOP_ROW_IMAGE_INDICES[i]),
    })),
    ...BOTTOM_ROW_NAMES.map((title, i) => ({
      title,
      imageUrl: wattaHeroRollImageUrl(BOTTOM_ROW_IMAGE_INDICES[i]),
    })),
  ]

  return rows.filter((roll) => !isHeroRollExcluded(roll.imageUrl))
}

/** 50 hero-фото: 16 верхній ряд + 34 нижній (webp з прозорим фоном). */
export const WATTA_HERO_ROLL_IMAGES: WattaSushiRollData[] = buildHeroRollImages()

/** @deprecated використовуй WATTA_HERO_ROLL_IMAGES */
export const WATTA_SUSHI_ROLL_FALLBACK = WATTA_HERO_ROLL_IMAGES

export function getHeroRollMarqueeSpeed(count: number): number {
  return Math.max(55, Math.min(110, count * 2.8))
}
