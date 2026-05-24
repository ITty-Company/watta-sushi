import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import { fetchPublicApi } from '@/lib/publicApiFetch'
import { warmMenuCatalogCache } from '@/lib/menuCatalogSessionCache'
import { warmCitiesCache, writeCitiesCache } from '@/lib/wattaCitiesCache'
import { prefetchHref } from '@/lib/instantNav'

const PROMOTIONS_LIST_CACHE_KEY = 'watta_promotions_list_v1'
const PROMOTIONS_LIST_TIME_KEY = 'watta_promotions_list_v1_time'
const REVIEWS_LIST_CACHE_KEY = 'watta_public_reviews_v1'
const REVIEWS_LIST_TIME_KEY = 'watta_public_reviews_v1_time'
const SETTINGS_CACHE_KEY = 'watta_site_settings_v1'
const SETTINGS_TIME_KEY = 'watta_site_settings_v1_time'
const LIST_TTL_MS = 5 * 60 * 1000

function readJsonCache(key: string, timeKey: string): unknown | null {
  if (typeof sessionStorage === 'undefined') return null
  const raw = sessionStorage.getItem(key)
  const time = sessionStorage.getItem(timeKey)
  if (!raw || !time) return null
  if (Date.now() - parseInt(time, 10) >= LIST_TTL_MS) return null
  try {
    return JSON.parse(raw) as unknown
  } catch {
    return null
  }
}

function writeJsonCache(key: string, timeKey: string, value: unknown): void {
  if (typeof sessionStorage === 'undefined') return
  sessionStorage.setItem(key, JSON.stringify(value))
  sessionStorage.setItem(timeKey, String(Date.now()))
}

export function readPromotionsListCache(): unknown[] | null {
  const data = readJsonCache(PROMOTIONS_LIST_CACHE_KEY, PROMOTIONS_LIST_TIME_KEY)
  return Array.isArray(data) ? data : null
}

export function readPublicReviewsCache(): unknown[] | null {
  const data = readJsonCache(REVIEWS_LIST_CACHE_KEY, REVIEWS_LIST_TIME_KEY)
  return Array.isArray(data) ? data : null
}

export function readSiteSettingsCache(): Record<string, unknown> | null {
  const data = readJsonCache(SETTINGS_CACHE_KEY, SETTINGS_TIME_KEY)
  return data && typeof data === 'object' && !Array.isArray(data)
    ? (data as Record<string, unknown>)
    : null
}

export function writeSiteSettingsCache(data: Record<string, unknown>): void {
  writeJsonCache(SETTINGS_CACHE_KEY, SETTINGS_TIME_KEY, data)
}

const BANNERS_WARM_CACHE_KEY = 'watta_banners_warm_v1'
const BANNERS_WARM_TIME_KEY = 'watta_banners_warm_v1_time'

export function readBannersWarmCache(): unknown[] | null {
  const data = readJsonCache(BANNERS_WARM_CACHE_KEY, BANNERS_WARM_TIME_KEY)
  return Array.isArray(data) ? data : null
}

export function writeBannersWarmCache(data: unknown[]): void {
  writeJsonCache(BANNERS_WARM_CACHE_KEY, BANNERS_WARM_TIME_KEY, data)
}

async function warmPromotionsList(): Promise<void> {
  if (readPromotionsListCache()) return
  try {
    const res = await fetchPublicApi('/api/promotions')
    if (!res.ok) return
    const data = await res.json()
    if (Array.isArray(data)) writeJsonCache(PROMOTIONS_LIST_CACHE_KEY, PROMOTIONS_LIST_TIME_KEY, data)
  } catch {
    /* ignore */
  }
}

async function warmPublicReviews(): Promise<void> {
  if (readPublicReviewsCache()) return
  try {
    const res = await fetchPublicApi('/api/reviews')
    if (!res.ok) return
    const data = await res.json()
    if (Array.isArray(data)) writeJsonCache(REVIEWS_LIST_CACHE_KEY, REVIEWS_LIST_TIME_KEY, data)
  } catch {
    /* ignore */
  }
}

async function warmSiteSettings(): Promise<void> {
  if (readSiteSettingsCache()) return
  try {
    const res = await fetchPublicApi('/api/settings')
    if (!res.ok) return
    const data = await res.json()
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      writeSiteSettingsCache(data as Record<string, unknown>)
    }
  } catch {
    /* ignore */
  }
}

async function warmBanners(): Promise<void> {
  if (readBannersWarmCache()) return
  try {
    const res = await fetchPublicApi('/api/banners')
    if (!res.ok) return
    const data = await res.json()
    if (Array.isArray(data) && data.length > 0) writeBannersWarmCache(data)
  } catch {
    /* ignore */
  }
}

const BLOG_INDEX_CACHE_KEY = 'watta_blog_index_v1'
const BLOG_INDEX_TIME_KEY = 'watta_blog_index_v1_time'

export function readBlogIndexCache(): unknown[] | null {
  const data = readJsonCache(BLOG_INDEX_CACHE_KEY, BLOG_INDEX_TIME_KEY)
  return Array.isArray(data) ? data : null
}

async function warmBlogIndex(): Promise<void> {
  if (readJsonCache(BLOG_INDEX_CACHE_KEY, BLOG_INDEX_TIME_KEY)) return
  try {
    const res = await fetchPublicApi('/api/blog')
    if (!res.ok) return
    const posts = await res.json()
    if (Array.isArray(posts) && posts.length > 0) {
      writeJsonCache(BLOG_INDEX_CACHE_KEY, BLOG_INDEX_TIME_KEY, posts)
    }
  } catch {
    /* ignore */
  }
}

let warmAllInflight: Promise<void> | null = null

/** Прогрів API-даних до переходу на сторінки доставки, акцій, відгуків тощо. */
export function warmPublicRouteCaches(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (warmAllInflight) return warmAllInflight
  warmAllInflight = Promise.all([
    warmMenuCatalogCache(),
    warmCitiesCache(),
    warmSiteSettings(),
    warmBanners(),
    warmPromotionsList(),
    warmPublicReviews(),
    warmBlogIndex(),
  ])
    .then(() => {})
    .finally(() => {
      warmAllInflight = null
    })
  return warmAllInflight
}

/** Prefetch посилань у viewport — RSC вже в кеші до кліку. */
export function installVisibleLinkPrefetch(router: AppRouterInstance): () => void {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return () => {}

  const seen = new WeakSet<Element>()
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        const el = entry.target
        if (seen.has(el)) continue
        seen.add(el)
        const href =
          el.getAttribute('href') ||
          el.getAttribute('data-href') ||
          el.getAttribute('data-prefetch-href')
        if (href?.startsWith('/')) prefetchHref(router, href)
      }
    },
    { rootMargin: '480px 0px', threshold: 0.01 },
  )

  const observeAnchors = () => {
    const nodes = document.querySelectorAll<HTMLElement>(
      'a[href^="/"], [data-href^="/"], [data-prefetch-href^="/"]',
    )
    nodes.forEach((el) => {
      if (el.tagName === 'A') {
        const a = el as HTMLAnchorElement
        if (a.target === '_blank' || a.hasAttribute('download')) return
      }
      io.observe(el)
    })
  }

  observeAnchors()
  const mo = new MutationObserver(() => observeAnchors())
  mo.observe(document.body, { childList: true, subtree: true })

  return () => {
    io.disconnect()
    mo.disconnect()
  }
}

/** Зберегти список акцій після завантаження сторінки (для наступних візитів). */
export function writePromotionsListCache(data: unknown[]): void {
  writeJsonCache(PROMOTIONS_LIST_CACHE_KEY, PROMOTIONS_LIST_TIME_KEY, data)
}

export function writePublicReviewsCache(data: unknown[]): void {
  writeJsonCache(REVIEWS_LIST_CACHE_KEY, REVIEWS_LIST_TIME_KEY, data)
}
