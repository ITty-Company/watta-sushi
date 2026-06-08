import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import { fetchPublicApi, isBenignPublicFetchError } from '@/lib/publicApiFetch'
import { warmMenuCatalogCache } from '@/lib/menuCatalogSessionCache'
import { warmCitiesCache, writeCitiesCache } from '@/lib/wattaCitiesCache'
import { prefetchHref } from '@/lib/instantNav'
import { warmProductRouteData } from '@/lib/fetchProductById'

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
  const json = JSON.stringify(value)
  if (json.length > 1_400_000) return
  try {
    sessionStorage.setItem(key, json)
    sessionStorage.setItem(timeKey, String(Date.now()))
  } catch {
    /* quota */
  }
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
const TEAM_MEMBERS_CACHE_KEY = 'watta_team_members_v1'
const TEAM_MEMBERS_TIME_KEY = 'watta_team_members_v1_time'

export function readBlogIndexCache(): unknown[] | null {
  const data = readJsonCache(BLOG_INDEX_CACHE_KEY, BLOG_INDEX_TIME_KEY)
  return Array.isArray(data) ? data : null
}

export function readTeamMembersCache(): unknown[] | null {
  const data = readJsonCache(TEAM_MEMBERS_CACHE_KEY, TEAM_MEMBERS_TIME_KEY)
  return Array.isArray(data) ? data : null
}

export function writeTeamMembersCache(data: unknown[]): void {
  writeJsonCache(TEAM_MEMBERS_CACHE_KEY, TEAM_MEMBERS_TIME_KEY, data)
}

async function warmTeamMembers(): Promise<void> {
  if (readTeamMembersCache()) return
  try {
    const res = await fetchPublicApi('/api/team')
    if (!res.ok) return
    const data = await res.json()
    if (Array.isArray(data)) writeTeamMembersCache(data)
  } catch {
    /* ignore */
  }
}

async function warmBlogIndex(): Promise<void> {
  if (readJsonCache(BLOG_INDEX_CACHE_KEY, BLOG_INDEX_TIME_KEY)) return
  const ac = typeof AbortController !== 'undefined' ? new AbortController() : null
  const timeoutId =
    ac && typeof window !== 'undefined'
      ? window.setTimeout(() => ac.abort(), 12_000)
      : null
  try {
    const res = await fetchPublicApi('/api/blog', { signal: ac?.signal })
    if (!res.ok) return
    const posts = await res.json()
    if (Array.isArray(posts) && posts.length > 0) {
      writeJsonCache(BLOG_INDEX_CACHE_KEY, BLOG_INDEX_TIME_KEY, posts)
    }
  } catch (err) {
    if (!isBenignPublicFetchError(err)) {
      /* Safari інколи логує CORS до catch — ігноруємо лише мережеві/abort */
    }
  } finally {
    if (timeoutId != null) window.clearTimeout(timeoutId)
  }
}

function scheduleIdleBlogWarm(): void {
  if (typeof window === 'undefined') return
  type IdleWindow = Window & {
    requestIdleCallback?: (cb: () => void, opts?: { timeout?: number }) => number
  }
  const run = () => {
    void warmBlogIndex()
  }
  const w = window as IdleWindow
  if (typeof w.requestIdleCallback === 'function') {
    w.requestIdleCallback(run, { timeout: 4000 })
  } else {
    window.setTimeout(run, 800)
  }
}

let warmAllInflight: Promise<void> | null = null
let warmPriorityNavInflight: Promise<void> | null = null

/**
 * Доставка / Про нас / Контакти — прогріваємо одразу (не чекаємо hero на головній).
 * Міста + тарифи для /delivery, settings для /contacts, команда для /about.
 */
export function warmPriorityNavPageCaches(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (warmPriorityNavInflight) return warmPriorityNavInflight
  warmPriorityNavInflight = Promise.all([
    warmCitiesCache(),
    warmSiteSettings(),
    warmTeamMembers(),
  ])
    .then(() => {})
    .finally(() => {
      warmPriorityNavInflight = null
    })
  return warmPriorityNavInflight
}

/** Банери, акції, відгуки, блог — після hero, щоб не з’їдати смугу mp4. */
export function warmSecondaryPublicRouteCaches(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  return Promise.all([warmBanners(), warmPromotionsList(), warmPublicReviews()])
    .then(() => {
      scheduleIdleBlogWarm()
    })
    .then(() => {})
}

/** Прогрів API-даних до переходу на сторінки доставки, акцій, відгуків тощо. */
export function warmPublicRouteCaches(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (warmAllInflight) return warmAllInflight
  warmAllInflight = Promise.all([
    warmMenuCatalogCache(),
    warmPriorityNavPageCaches(),
    warmSecondaryPublicRouteCaches(),
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
        const productIdRaw = el.getAttribute('data-menu-product-id')
        const productId = productIdRaw ? parseInt(productIdRaw, 10) : NaN
        if (Number.isFinite(productId) && productId > 0) warmProductRouteData(productId)
      }
    },
    { rootMargin: '480px 0px', threshold: 0.01 },
  )

  const observeAnchors = () => {
    const nodes = document.querySelectorAll<HTMLElement>(
      'a[href^="/"], [data-href^="/"], [data-prefetch-href^="/"], [data-menu-product-id]',
    )
    nodes.forEach((el) => {
      if (el.tagName === 'A') {
        const a = el as HTMLAnchorElement
        if (a.target === '_blank' || a.hasAttribute('download')) return
      }
      io.observe(el)
    })
  }

  let observeTimer = 0
  const observeAnchorsDebounced = () => {
    if (observeTimer) window.clearTimeout(observeTimer)
    observeTimer = window.setTimeout(() => {
      observeTimer = 0
      observeAnchors()
    }, 250)
  }

  observeAnchors()
  const observeRoot =
    document.querySelector('main') ??
    document.querySelector('.watta-app-shell-root') ??
    document.body
  const mo = new MutationObserver(() => observeAnchorsDebounced())
  mo.observe(observeRoot, { childList: true, subtree: true })

  return () => {
    if (observeTimer) window.clearTimeout(observeTimer)
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
