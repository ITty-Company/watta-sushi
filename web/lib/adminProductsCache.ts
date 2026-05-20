import { normalizeAdminProductRow } from '@/lib/adminProductMedia'

const CACHE_KEY = 'watta_admin_products_v1'
const CACHE_TIME_KEY = 'watta_admin_products_v1_time'
const MAX_AGE_MS = 1000 * 60 * 60 * 12

export type AdminProductCacheRow = {
  id: number
  name_ru: string
  name_ua?: string
  name_en?: string
  name_nl?: string
  price: number
  description_ru?: string
  description_ua?: string
  description_en?: string
  description_nl?: string
  categoryId: number
  imageUrl?: string
  imageUrls?: unknown
  isPopular: boolean
  isHomeHit?: boolean
  isMenuNew?: boolean
  isCartRecommend?: boolean
  recommendOrder?: number
  cartRecommendOrder?: number
  promoDiscountPercent?: number
}

function isRow(row: unknown): row is AdminProductCacheRow {
  if (!row || typeof row !== 'object') return false
  const id = Number((row as { id?: unknown }).id)
  const price = Number((row as { price?: unknown }).price)
  const name = String((row as { name_ru?: unknown }).name_ru ?? '').trim()
  return Number.isFinite(id) && id > 0 && name.length > 0 && Number.isFinite(price)
}

function readStored(key: string): AdminProductCacheRow[] | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(key) ?? sessionStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return null
    const list = parsed.filter(isRow).map((row) => normalizeAdminProductRow(row) as AdminProductCacheRow)
    return list.length > 0 ? list : null
  } catch {
    return null
  }
}

/** Публічний кеш меню (menu_items_*) — запасний варіант для миттєвого списку в адмінці. */
function readMenuSessionProducts(): AdminProductCacheRow[] | null {
  if (typeof sessionStorage === 'undefined') return null
  const out: AdminProductCacheRow[] = []
  const seen = new Set<number>()
  for (let i = 0; i < sessionStorage.length; i += 1) {
    const key = sessionStorage.key(i)
    if (!key?.startsWith('menu_items_')) continue
    try {
      const raw = sessionStorage.getItem(key)
      if (!raw) continue
      const parsed = JSON.parse(raw) as unknown
      if (!Array.isArray(parsed)) continue
      for (const row of parsed) {
        if (!isRow(row)) continue
        const id = Number(row.id)
        if (seen.has(id)) continue
        seen.add(id)
        out.push(normalizeAdminProductRow(row) as AdminProductCacheRow)
      }
    } catch {
      /* ignore */
    }
  }
  return out.length > 0 ? out : null
}

export function readAdminProductsCache(): AdminProductCacheRow[] | null {
  const dedicated = readStored(CACHE_KEY)
  if (dedicated?.length) return dedicated
  return readMenuSessionProducts()
}

export function writeAdminProductsCache(list: AdminProductCacheRow[]): void {
  if (typeof window === 'undefined' || list.length === 0) return
  const payload = JSON.stringify(list)
  const ts = String(Date.now())
  try {
    localStorage.setItem(CACHE_KEY, payload)
    localStorage.setItem(CACHE_TIME_KEY, ts)
    sessionStorage.setItem(CACHE_KEY, payload)
    sessionStorage.setItem(CACHE_TIME_KEY, ts)
  } catch {
    /* quota */
  }
}

export function adminProductsCacheIsFresh(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const ts = Number(localStorage.getItem(CACHE_TIME_KEY) ?? sessionStorage.getItem(CACHE_TIME_KEY) ?? '0')
    return ts > 0 && Date.now() - ts < MAX_AGE_MS
  } catch {
    return false
  }
}
