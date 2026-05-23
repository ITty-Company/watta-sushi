'use client'

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useMenuAddToCart } from '@/hooks/useMenuAddToCart'
import type { WattaMenuProductCardModel } from './WattaMenuProductCard'
import { useLanguage } from '../context/LanguageContext'
import { getApiUrl } from '@/lib/utils'
import { fetchPublicApi, fetchPublicApiFresh } from '@/lib/publicApiFetch'
import { useWattaCatalogSync } from '@/hooks/useWattaCatalogSync'
import { getMenuCategoryDisplayName } from '@/lib/i18n/getMenuCategoryDisplayName'
import { MENU_CATEGORY_EMOJI, MENU_CATEGORY_FALLBACK_SLUGS } from '@/lib/menuCategoryFallback'
import { WATTA_MENU_REQUEST_SCROLL_TO_CAT, FULL_MENU_ALL_SLUG } from '@/lib/fullMenuCategoryNav'
import { filterNonAggregateCategoryRows } from '@/lib/menuCategoryFilters'
import { readCityIdForProductApi } from '@/lib/wattaSiteLocalePrefs'
import { menuCategoriesSessionKey, menuItemsSessionKey } from '@/lib/i18n/menuDataCacheBust'
import { parseCategoriesCacheJson } from '@/lib/buildMenuCategoriesFromApi'
import {
  coerceProductsArray,
  hasMenuProductsSessionCache,
  readRawMenuCategoriesFromSession,
  readRawMenuProductsFromSession,
  warmMenuCatalogCache,
} from '@/lib/menuCatalogSessionCache'
import { productGalleryFromApi } from '@/lib/productGallery'
import { runUntilScrollSuccess } from '@/lib/menuScroll'
import { createRafScrollListener, publishMenuCategoryHighlight } from '@/lib/scrollSync'
import { WattaMenuProductCard } from './WattaMenuProductCard'
import DeliveryHeroCopy from './DeliveryHeroCopy'

interface MenuItem {
  id: number
  name: string
  description: string
  price: number
  category: string
  categorySlug: string
  categoryId: number
  emoji: string
  imageUrl?: string
  isTop?: boolean
  isHomeHit?: boolean
  isMenuNew?: boolean
  recommendOrder?: number
  allowRecommendations?: boolean
  promoDiscountPercent?: number
  rawCategoryName?: string
}

interface MenuCategoryRow {
  id: number
  slug: string
  name: string
  emoji: string
  order: number
}

/** Єдиний регістр slug — інакше товари з `Rolls` vs категорія `rolls` не потрапляють у секції. */
function normMenuSlug(s: string): string {
  const t = s.trim().toLowerCase()
  return t.length > 0 ? t : 'misc'
}

export default function FullMenuPageClient() {
  const { t, language, getLocalized, formatMenuItemsCount } = useLanguage()
  const searchParams = useSearchParams()
  const catFromUrl = searchParams.get('cat')?.trim() ?? ''
  const mv = t.menuView

  const [categories, setCategories] = useState<MenuCategoryRow[]>([])
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(() =>
    typeof window === 'undefined' ? true : !hasMenuProductsSessionCache(),
  )
  const scrollLockRef = useRef(false)
  /** Під `WattaPublicSiteChrome` (шапка + стрічка) — той самий візуальний блок, що на /product, /cart, … */
  const FULL_MENU_STICKY_RESERVE_PX = 180

  /** Як на головній: ≤768px — поточна сітка; планшет+ — горизонтальний свайп. */
  const [isNarrowViewport, setIsNarrowViewport] = useState(false)
  useLayoutEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(max-width: 768px)')
    const apply = () => setIsNarrowViewport(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  const mapProductsToItems = useCallback(
    (data: unknown[]) =>
      (data || [])
        .map((raw) => {
          const p = raw as Record<string, unknown>
          const cat = p.category as Record<string, unknown> | undefined
          const rawSlug =
            (typeof cat?.slug === 'string' && cat.slug.trim()) ||
            (typeof p.categorySlug === 'string' && p.categorySlug.trim()) ||
            'misc'
          const id = Number(p.id)
          return {
            id,
            name: getLocalized(p as never, 'name'),
            description: getLocalized(p as never, 'description') || '',
            price: Number(p.price),
            category:
              getMenuCategoryDisplayName((cat || {}) as Record<string, unknown>, language, t.categories) || '—',
            categorySlug: normMenuSlug(rawSlug),
            categoryId: Number(p.categoryId) || Number(cat?.id) || 0,
            emoji: '🍣',
            imageUrl: productGalleryFromApi(p)[0] || (typeof p.imageUrl === 'string' ? p.imageUrl : undefined),
            isTop: p.isPopular === true,
            isHomeHit: p.isHomeHit === true,
            isMenuNew: p.isMenuNew === true,
            recommendOrder: typeof p.recommendOrder === 'number' ? p.recommendOrder : 0,
            allowRecommendations: (cat as { allowRecommendations?: boolean } | undefined)?.allowRecommendations !== false,
            promoDiscountPercent:
              typeof p.promoDiscountPercent === 'number' ? p.promoDiscountPercent : Number(p.promoDiscountPercent) || 0,
            rawCategoryName: typeof p.category === 'string' ? p.category : undefined,
          }
        })
        .filter((row) => Number.isFinite(row.id) && row.id > 0),
    [getLocalized, language, t.categories]
  )

  const mapApiToCategoryRows = useCallback(
    (data: Record<string, unknown>[]) => {
      const rows: MenuCategoryRow[] = data
        .filter((cat) => (cat as { isActive?: boolean }).isActive !== false)
        .map((cat) => {
          const name = getMenuCategoryDisplayName(cat, language, t.categories) || String(cat.name_ru ?? '')
          return {
            id: Number(cat.id) || 0,
            slug: normMenuSlug(String(cat.slug ?? '')),
            name,
            emoji: typeof cat.emoji === 'string' && cat.emoji ? String(cat.emoji) : '🍣',
            order: typeof cat.order === 'number' ? cat.order : 0,
          }
        })
        .filter((c) => c.slug.length > 0)
        .sort((a, b) => a.order - b.order)
      return filterNonAggregateCategoryRows(rows)
    },
    [language, t.categories],
  )

  const loadCategories = useCallback(async () => {
    const fallbackRows: MenuCategoryRow[] = MENU_CATEGORY_FALLBACK_SLUGS.map((slug, idx) => ({
      id: idx + 1,
      slug,
      name: t.categories[slug] ?? slug,
      emoji: MENU_CATEGORY_EMOJI[slug],
      order: idx,
    }))

    const applyRows = (rows: MenuCategoryRow[]) => {
      if (rows.length > 0) setCategories(rows)
      else setCategories(fallbackRows)
    }

    if (typeof sessionStorage !== 'undefined') {
      const cacheKey = menuCategoriesSessionKey()
      const cached = sessionStorage.getItem(cacheKey)
      const cacheTime = sessionStorage.getItem(`${cacheKey}_time`)
      const now = Date.now()
      const CACHE_TTL = 5 * 60 * 1000
      if (cached) {
        const raw = parseCategoriesCacheJson(cached)
        if (raw) {
          applyRows(mapApiToCategoryRows(raw))
          if (cacheTime && now - parseInt(cacheTime, 10) < CACHE_TTL) {
            void fetchPublicApi(getApiUrl('/api/products/categories'))
              .then((res) => (res.ok ? res.json() : null))
              .then((data) => {
                const list = Array.isArray(data) ? (data as Record<string, unknown>[]) : []
                if (list.length > 0) {
                  sessionStorage.setItem(cacheKey, JSON.stringify(list))
                  sessionStorage.setItem(`${cacheKey}_time`, String(Date.now()))
                  applyRows(mapApiToCategoryRows(list))
                }
              })
              .catch(() => {})
            return
          }
        }
      }
    }

    try {
      const res = await fetchPublicApi(getApiUrl('/api/products/categories'))
      if (!res.ok) {
        setCategories(fallbackRows)
        return
      }
      const data = await res.json()
      const list = Array.isArray(data) ? (data as Record<string, unknown>[]) : []
      if (typeof sessionStorage !== 'undefined' && list.length > 0) {
        const cacheKey = menuCategoriesSessionKey()
        sessionStorage.setItem(cacheKey, JSON.stringify(list))
        sessionStorage.setItem(`${cacheKey}_time`, String(Date.now()))
      }
      if (list.length > 0) {
        applyRows(mapApiToCategoryRows(list))
        return
      }
      applyRows(fallbackRows)
    } catch {
      applyRows(fallbackRows)
    }
  }, [language, mapApiToCategoryRows, t.categories])

  const refreshProductsInBackground = useCallback(
    async (scopedUrl: string, cacheKey: string, hasCity: boolean, fetchFn: typeof fetchPublicApi) => {
      try {
        const res = await fetchFn(scopedUrl)
        if (!res.ok) return
        const body: unknown = await res.json()
        let list = coerceProductsArray(body)
        if (hasCity && list.length === 0) {
          const fallback = await fetchFn(getApiUrl('/api/products'))
          if (fallback.ok) list = coerceProductsArray(await fallback.json())
        }
        if (list.length > 0 && typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem(cacheKey, JSON.stringify(list))
          sessionStorage.setItem(`${cacheKey}_time`, String(Date.now()))
          setItems(mapProductsToItems(list))
        }
      } catch {
        /* keep cached list */
      }
    },
    [mapProductsToItems],
  )

  const loadProducts = useCallback(async (fresh = false) => {
    const cityId = typeof window !== 'undefined' ? readCityIdForProductApi() : null
    const hasCity = cityId != null && cityId > 0
    const scopedUrl = hasCity ? getApiUrl(`/api/products?cityId=${cityId}`) : getApiUrl('/api/products')
    const cacheKey = menuItemsSessionKey(cityId)
    const fetchFn = fresh ? fetchPublicApiFresh : fetchPublicApi

    if (!fresh && typeof sessionStorage !== 'undefined') {
      const cached = sessionStorage.getItem(cacheKey)
      const cacheTime = sessionStorage.getItem(`${cacheKey}_time`)
      if (cached && cacheTime) {
        try {
          const data = JSON.parse(cached)
          if (Array.isArray(data) && data.length > 0) {
            setItems(mapProductsToItems(data))
            setLoading(false)
            void refreshProductsInBackground(scopedUrl, cacheKey, hasCity, fetchFn)
            return
          }
        } catch {
          /* damaged cache */
        }
      }
    }

    setLoading(true)
    try {
      const fetchProductList = async (url: string): Promise<unknown[]> => {
        try {
          const res = await fetchFn(url)
          if (!res.ok) return []
          const body: unknown = await res.json()
          return coerceProductsArray(body)
        } catch {
          return []
        }
      }

      let list = await fetchProductList(scopedUrl)
      if (hasCity && list.length === 0) {
        list = await fetchProductList(getApiUrl('/api/products'))
      }
      if (typeof sessionStorage !== 'undefined' && list.length > 0) {
        sessionStorage.setItem(cacheKey, JSON.stringify(list))
        sessionStorage.setItem(`${cacheKey}_time`, String(Date.now()))
      }
      setItems(mapProductsToItems(list))
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [mapProductsToItems, refreshProductsInBackground])

  useLayoutEffect(() => {
    const cityId = typeof window !== 'undefined' ? readCityIdForProductApi() : null
    const rawProducts = readRawMenuProductsFromSession(cityId)
    if (rawProducts) {
      setItems(mapProductsToItems(rawProducts))
      setLoading(false)
    }
    const rawCategories = readRawMenuCategoriesFromSession()
    if (rawCategories) {
      const rows = mapApiToCategoryRows(rawCategories)
      if (rows.length > 0) setCategories(rows)
    }
  }, [mapProductsToItems, mapApiToCategoryRows])

  useEffect(() => {
    void loadCategories()
    void loadProducts()
    void warmMenuCatalogCache()
  }, [loadCategories, loadProducts, language])

  useWattaCatalogSync(() => {
    void loadProducts(true)
    void loadCategories()
  }, ['products', 'categories'])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const onCity = () => void loadProducts(true)
    window.addEventListener('cityChanged', onCity)
    return () => window.removeEventListener('cityChanged', onCity)
  }, [loadProducts])

  const itemsBySlug = useMemo(() => {
    const m = new Map<string, MenuItem[]>()
    const normalize = (v: string) => v.trim().toLowerCase()
    const byId = new Map<number, string>()
    const byName = new Map<string, string>()
    const unresolved: Array<{
      id: number
      name: string
      categorySlug: string
      categoryId: number
      categoryLabel: string
    }> = []
    for (const c of categories) {
      if (c.id > 0) byId.set(c.id, normMenuSlug(c.slug))
      if (c.name) byName.set(normalize(c.name), normMenuSlug(c.slug))
    }
    for (const it of items) {
      let resolvedSlug = normMenuSlug(it.categorySlug || 'misc')
      if (!categories.some((c) => normMenuSlug(c.slug) === resolvedSlug)) {
        const byCategoryId = it.categoryId > 0 ? byId.get(it.categoryId) : undefined
        if (byCategoryId) {
          resolvedSlug = byCategoryId
        } else {
          const fromName = byName.get(normalize(it.category || it.rawCategoryName || ''))
          if (fromName) resolvedSlug = fromName
        }
      }
      if (!resolvedSlug) {
        unresolved.push({
          id: it.id,
          name: it.name,
          categorySlug: it.categorySlug,
          categoryId: it.categoryId,
          categoryLabel: it.category || it.rawCategoryName || '',
        })
        continue
      }
      const key = normMenuSlug(resolvedSlug)
      const list = m.get(key) ?? []
      list.push(it)
      m.set(key, list)
    }
    if (process.env.NODE_ENV !== 'production' && unresolved.length > 0) {
      console.warn('[FullMenuPageClient] unresolved category mapping', {
        unresolvedCount: unresolved.length,
        totalItems: items.length,
        knownCategorySlugs: categories.map((c) => c.slug),
        sample: unresolved.slice(0, 10),
      })
    }
    const sortInCategory = (arr: MenuItem[]) =>
      [...arr].sort((a, b) => {
        const aRec = a.isHomeHit === true && a.allowRecommendations !== false
        const bRec = b.isHomeHit === true && b.allowRecommendations !== false
        if (aRec !== bRec) return aRec ? -1 : 1
        if (aRec && bRec) return (a.recommendOrder ?? 0) - (b.recommendOrder ?? 0)
        return a.id - b.id
      })
    m.forEach((arr, k) => {
      if (arr.length) m.set(k, sortInCategory(arr))
    })
    return m
  }, [items, categories])

  const visibleCategories = useMemo(() => {
    return categories.filter((c) => (itemsBySlug.get(normMenuSlug(c.slug))?.length ?? 0) > 0)
  }, [categories, itemsBySlug])

  /** Зсув для scroll-margin + поріг «Усі» — глобальна фіксована шапка (див. AppClient → WattaPublicSiteChrome) */
  const scrollPadTotal = FULL_MENU_STICKY_RESERVE_PX
  const scrollPadPx = `${scrollPadTotal}px`

  useEffect(() => {
    if (visibleCategories.length === 0) return

    const lastHighlightSlugRef = { current: '' }
    const publishCategoryStrip = (slug: string) =>
      publishMenuCategoryHighlight(slug, lastHighlightSlugRef)

    const syncActiveFromScroll = () => {
      if (scrollLockRef.current) return
      const firstSlug = visibleCategories[0]?.slug
      if (!firstSlug) return
      // Біля верху: підсвітка з `?cat=` (перехід з головної), а не «Усі», поки користувач не проскролив
      try {
        const urlCat = new URLSearchParams(window.location.search).get('cat')?.trim()
        if (urlCat && window.scrollY < 140) {
          if (urlCat === FULL_MENU_ALL_SLUG) {
            publishCategoryStrip(FULL_MENU_ALL_SLUG)
            return
          }
          if (visibleCategories.some((c) => normMenuSlug(c.slug) === normMenuSlug(urlCat))) {
            publishCategoryStrip(normMenuSlug(urlCat))
            return
          }
        }
      } catch {
        /* ignore */
      }
      const firstEl = document.getElementById(`full-menu-section-${firstSlug}`)
      if (!firstEl) return
      const bandBase = scrollPadTotal - 8
      if (firstEl.getBoundingClientRect().top > bandBase) {
        publishCategoryStrip(FULL_MENU_ALL_SLUG)
        return
      }
      let bestSlug: string | null = null
      let bestScore = -1
      for (const c of visibleCategories) {
        const el = document.getElementById(`full-menu-section-${c.slug}`)
        if (!el) continue
        const r = el.getBoundingClientRect()
        const vh = window.innerHeight
        const bandTop = Math.max(vh * 0.08, scrollPadTotal * 0.32)
        const bandBot = vh * 0.58
        const vis = Math.max(0, Math.min(r.bottom, bandBot) - Math.max(r.top, bandTop))
        if (vis <= 0) continue
        const score = vis + (r.top >= scrollPadTotal * 0.18 && r.top < vh * 0.42 ? 50 : 0)
        if (score > bestScore) {
          bestScore = score
          bestSlug = c.slug
        }
      }
      if (bestSlug) {
        publishCategoryStrip(bestSlug)
      }
    }

    const { onScroll, cancel } = createRafScrollListener(syncActiveFromScroll)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    const id = window.requestAnimationFrame(syncActiveFromScroll)
    return () => {
      window.cancelAnimationFrame(id)
      cancel()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [visibleCategories, scrollPadTotal])

  const scrollToCategory = useCallback((slug: string): boolean => {
    const findTarget = (): HTMLElement | null => {
      if (slug === FULL_MENU_ALL_SLUG) {
        return document.getElementById('full-menu-page-start')
      }
      const byId = document.getElementById(`full-menu-section-${slug}`)
      if (byId) return byId
      const norm = normMenuSlug(slug)
      if (norm !== slug) {
        const byNormId = document.getElementById(`full-menu-section-${norm}`)
        if (byNormId) return byNormId
      }
      const safe =
        typeof CSS !== 'undefined' && typeof CSS.escape === 'function' ? CSS.escape(slug) : slug
      return (
        document.querySelector<HTMLElement>(`[data-full-menu-cat="${safe}"]`) ??
        (norm !== slug
          ? document.querySelector<HTMLElement>(
              `[data-full-menu-cat="${typeof CSS !== 'undefined' && typeof CSS.escape === 'function' ? CSS.escape(norm) : norm}"]`,
            )
          : null)
      )
    }

    const scrollEl = (el: HTMLElement) => {
      scrollLockRef.current = true
      window.dispatchEvent(new CustomEvent('wattaMenuCategoryHighlight', { detail: { slug } }))

      const scroller = (document.scrollingElement as HTMLElement | null) ?? document.documentElement
      const marginRaw = typeof getComputedStyle !== 'undefined' ? getComputedStyle(el).scrollMarginTop : ''
      const marginParsed = Number.parseFloat(marginRaw)
      const margin = Number.isFinite(marginParsed) ? marginParsed : FULL_MENU_STICKY_RESERVE_PX
      const top = el.getBoundingClientRect().top + scroller.scrollTop - margin
      scroller.scrollTo({ top: Math.max(0, top), behavior: 'auto' })

      window.setTimeout(() => {
        scrollLockRef.current = false
      }, 400)
      return true
    }

    const el = findTarget()
    if (el) return scrollEl(el)
    return false
  }, [])

  const scrollToCategoryWithRetry = useCallback(
    (slug: string) => {
      runUntilScrollSuccess(() => scrollToCategory(slug))
    },
    [scrollToCategory],
  )

  useEffect(() => {
    const onScrollRequest = (ev: Event) => {
      const slug = (ev as CustomEvent<{ slug?: string }>).detail?.slug?.trim()
      if (!slug) return
      scrollToCategoryWithRetry(slug)
    }
    window.addEventListener(WATTA_MENU_REQUEST_SCROLL_TO_CAT, onScrollRequest)
    return () => window.removeEventListener(WATTA_MENU_REQUEST_SCROLL_TO_CAT, onScrollRequest)
  }, [scrollToCategoryWithRetry])

  /** Перехід на /menu?cat= або клік у стрічці з іншої сторінки — скрол одразу після появи секцій. */
  useEffect(() => {
    if (loading || !catFromUrl) return
    scrollToCategoryWithRetry(catFromUrl)
  }, [loading, catFromUrl, scrollToCategoryWithRetry, visibleCategories.length])

  const addToCart = useMenuAddToCart()
  const addToCartFromCard = useCallback(
    (product: WattaMenuProductCardModel) => {
      const full = items.find((x) => x.id === product.id)
      addToCart({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        category: full?.category,
        emoji: product.emoji,
        imageUrl: product.imageUrl,
        promoDiscountPercent: product.promoDiscountPercent,
      })
    },
    [addToCart, items],
  )

  const fullMenuIntroBlock = (
    <section
      id="menu-page-after-hero-intro"
      className="home-after-hero-intro-web menu-after-welcome-web relative z-[2] w-full max-w-[100vw] shrink-0"
      aria-labelledby="menu-page-after-hero-intro-title"
    >
      <div className="home-after-hero-intro-inner-web home-after-hero-intro-inner-web--home-menu home-after-hero-intro-inner-web--headroom relative z-[1] mx-auto max-w-7xl px-6 pb-3 pt-6 sm:px-9 sm:pb-4 sm:pt-7 md:px-12 md:pb-5">
        <DeliveryHeroCopy
          titleId="menu-page-after-hero-intro-title"
          kickerScript={mv.fullMenuIntroKickerScript}
          headlineLead={mv.fullMenuIntroHeadlineLead}
          headlineMark={mv.fullMenuIntroHeadlineMark}
          sub={mv.fullMenuIntroSub}
          statFresh={mv.fullMenuIntroStatFresh}
          statFast={mv.fullMenuIntroStatHits}
          statCity={mv.fullMenuIntroStatOrder}
        />
      </div>
    </section>
  )

  return (
    <div className="menu-page-web watta-page-bg relative flex min-h-0 w-full max-w-[100vw] flex-col bg-transparent">
      <div className="delivery-page-home-flow w-full">
        <div className="delivery-page-intro-web w-full shrink-0">{fullMenuIntroBlock}</div>
      </div>

      <div className="watta-full-menu-page flex min-h-0 w-full min-w-0 flex-1 flex-col">
      <div
        id="full-menu-page-start"
        style={{ scrollMarginTop: scrollPadPx }}
        className="relative z-[1] w-full max-w-[100vw] shrink-0"
      >
        <section
          className="home-menu-catalog-section-web home-full-menu-catalog-web watta-full-menu-catalog-reveal-web relative z-[2] w-full max-w-[100vw] px-4 pb-8 pt-4 sm:px-6 sm:pb-12 sm:pt-6 md:px-8 md:pb-14"
          aria-labelledby="menu-page-after-hero-intro-title"
        >
          <div className="home-menu-catalog-stack-web relative z-[1] mx-auto w-full max-w-[1800px]">
            {loading ? (
              <div className="home-menu-cat-list-web pb-4" aria-busy="true" aria-live="polite">
                <p className="sr-only">{mv.fullMenuLoading}</p>
                {[0, 1].map((band) => (
                  <div
                    key={band}
                    className="home-menu-cat-band-web animate-pulse rounded-[1.25rem] border border-[#145142]/10 bg-white/70 p-4 shadow-[0_14px_40px_-24px_rgba(15,36,30,0.35)] sm:p-5"
                  >
                    <div className="mb-5 flex gap-3 sm:mb-6">
                      <div className="h-11 w-11 shrink-0 rounded-2xl bg-[#145142]/12 sm:h-12 sm:w-12" />
                      <div className="flex min-w-0 flex-1 flex-col gap-2.5 pt-1">
                        <div className="h-5 max-w-[12rem] rounded-md bg-[#145142]/14" />
                        <div className="h-3 max-w-[6rem] rounded bg-[#145142]/10" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 items-start gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-3 xl:grid-cols-4">
                      {Array.from({ length: band === 0 ? 8 : 4 }).map((_, i) => (
                        <div
                          key={i}
                          className="aspect-[16/11] rounded-2xl bg-gradient-to-b from-[#eef4f1] to-[#dfe9e4] ring-1 ring-[#145142]/6"
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : visibleCategories.length === 0 && items.length === 0 ? (
              <p className="home-menu-cat-empty-web mx-auto max-w-lg text-center">{mv.fullMenuEmpty}</p>
            ) : (
              <div className="home-menu-cat-list-web">
                {(visibleCategories.length > 0
                  ? visibleCategories.map((cat) => ({
                      cat,
                      list: itemsBySlug.get(normMenuSlug(cat.slug)) ?? [],
                    }))
                  : [
                      {
                        cat: {
                          id: 0,
                          slug: 'all-fallback',
                          name: mv.fullMenuAllTab,
                          emoji: '🍣',
                          order: 0,
                        } as MenuCategoryRow,
                        list: items,
                      },
                    ]
                ).map(({ cat, list }) => {
                  return (
                    <section
                      key={cat.slug}
                      id={`full-menu-section-${cat.slug}`}
                      data-full-menu-cat={cat.slug}
                      style={{ scrollMarginTop: scrollPadPx }}
                      className="home-menu-cat-block-web watta-full-menu-section"
                    >
                      <div className="home-menu-cat-band-web">
                        <div className="home-menu-cat-heading-web">
                          <span className="home-menu-cat-emoji-bare-web" aria-hidden>
                            {cat.emoji}
                          </span>
                          <div className="home-menu-cat-heading-text-web min-w-0">
                            <h2 className="home-menu-cat-title-web">{cat.name}</h2>
                            <p className="home-menu-cat-meta-line-web">
                              {formatMenuItemsCount(list.length)}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 items-start gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-3 xl:grid-cols-4">
                          {list.map((item) => (
                            <WattaMenuProductCard
                              key={item.id}
                              variant="grid"
                              product={item}
                              onAddToCart={addToCartFromCard}
                            />
                          ))}
                        </div>
                      </div>
                    </section>
                  )
                })}
              </div>
            )}
          </div>
        </section>
      </div>
      </div>
    </div>
  )
}
