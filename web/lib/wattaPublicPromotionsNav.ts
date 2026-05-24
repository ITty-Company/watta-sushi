import { normalizePromoList } from '@/app/lib/promoDisplay'
import { fetchPublicApi } from '@/lib/publicApiFetch'
import { readPromotionsListCache } from '@/lib/publicRouteWarmCache'

export const WATTA_PROMOTIONS_UPDATED_EVENT = 'promotionsUpdated'
export const WATTA_PUBLIC_PROMOTIONS_NAV_CACHE_KEY = 'watta_public_promotions_nav_v1'

let promotionsAvailableInflight: Promise<boolean> | null = null

/** Чи є хоча б одна опублікована новина/акція для показу в меню та на /promotions */
export async function fetchPublicPromotionsAvailable(): Promise<boolean> {
  if (promotionsAvailableInflight) return promotionsAvailableInflight

  promotionsAvailableInflight = (async () => {
    try {
      const cached = readPromotionsListCache()
      if (cached) return normalizePromoList(cached).length > 0

      const res = await fetchPublicApi('/api/promotions')
      if (!res.ok) return false
      const data: unknown = await res.json()
      return normalizePromoList(data).length > 0
    } catch {
      return false
    } finally {
      promotionsAvailableInflight = null
    }
  })()

  return promotionsAvailableInflight
}

export function readPublicPromotionsNavCache(): boolean | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(WATTA_PUBLIC_PROMOTIONS_NAV_CACHE_KEY)
    if (raw === '1') return true
    if (raw === '0') return false
  } catch {
    /* ignore */
  }
  return null
}

export function writePublicPromotionsNavCache(available: boolean): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(WATTA_PUBLIC_PROMOTIONS_NAV_CACHE_KEY, available ? '1' : '0')
  } catch {
    /* ignore */
  }
}
