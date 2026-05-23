/** ID товарів / категорій / інгредієнтів у статті блогу. */

export function parseBlogIdList(raw: unknown): number[] {
  if (Array.isArray(raw)) {
    return [...new Set(raw.map((n) => Number(n)).filter((n) => Number.isInteger(n) && n > 0))]
  }
  if (typeof raw === 'string' && raw.trim()) {
    try {
      return parseBlogIdList(JSON.parse(raw) as unknown)
    } catch {
      return []
    }
  }
  return []
}

export type BlogPostLinkProduct = {
  id: number
  name_ru: string
  name_ua?: string | null
  name_en?: string | null
  name_nl?: string | null
  price: number
  imageUrl?: string | null
  imageUrls?: unknown
}

export type BlogPostLinkCategory = {
  id: number
  slug: string
  name_ru: string
  name_ua?: string | null
  name_en?: string | null
  name_nl?: string | null
  emoji?: string | null
}

export type BlogPostLinkIngredient = {
  id: number
  name_ru: string
  name_ua?: string | null
  name_en?: string | null
  name_nl?: string | null
  imageUrl: string
}

export type BlogPostLinks = {
  products: BlogPostLinkProduct[]
  categories: BlogPostLinkCategory[]
  ingredients: BlogPostLinkIngredient[]
}
