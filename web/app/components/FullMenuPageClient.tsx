'use client'

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, startTransition } from 'react'
import { flushSync } from 'react-dom'
import { useSearchParams } from 'next/navigation'
import { useMenuAddToCart } from '@/hooks/useMenuAddToCart'
import type { WattaMenuProductCardModel } from './WattaMenuProductCard'
import { useLanguage } from '../context/LanguageContext'
import { getApiUrl } from '@/lib/utils'
import { fetchPublicApi, fetchPublicApiFresh } from '@/lib/publicApiFetch'
import { useWattaCatalogSync } from '@/hooks/useWattaCatalogSync'
import { getMenuCategoryDisplayName } from '@/lib/i18n/getMenuCategoryDisplayName'
import { MENU_CATEGORY_EMOJI, MENU_CATEGORY_FALLBACK_SLUGS } from '@/lib/menuCategoryFallback'
import { WATTA_MENU_REQUEST_SCROLL_TO_CAT, FULL_MENU_ALL_SLUG, FULL_MENU_HERO_INTRO_ID } from '@/lib/fullMenuCategoryNav'
import { WattaInViewFadeSection } from './WattaInViewFade'
import { filterNonAggregateCategoryRows } from '@/lib/menuCategoryFilters'
import { readCityIdForProductApi } from '@/lib/wattaSiteLocalePrefs'
import { menuCategoriesSessionKey, menuItemsSessionKey } from '@/lib/i18n/menuDataCacheBust'
import { parseCategoriesCacheJson } from '@/lib/buildMenuCategoriesFromApi'
import { applyPermanentMenuCategoryImages } from '@/lib/menuCategoryDefaultImages'
import {
  coerceProductsArray,
  readRawMenuCategoriesFromSession,
  readRawMenuProductsFromSession,
  warmMenuCatalogCache,
} from '@/lib/menuCatalogSessionCache'
import { productGalleryFromApi } from '@/lib/productGallery'
import {
  runUntilScrollSuccess,
  scrollFullMenuCategoryHeading,
  scrollFullMenuCategoryHeadingEased,
  scrollFullMenuHeroIntro,
  scrollFullMenuHeroIntroEased,
  cancelMenuScrollAnimation,
  cancelRouteScrollToTopOnNavigation,
  isMenuCatalogScrollLocked,
  setMenuCatalogScrollLock,
} from '@/lib/menuScroll'
import {
  beginMenuCategoryScrollChromeLock,
  beginFullMenuHeroScrollChromeLock,
  consumePendingMenuCatScroll,
  FULL_MENU_SECTION_SCROLL_MARGIN,
} from '@/lib/wattaChromeScroll'
import { useMenuCategoryScrollSpy } from '@/hooks/useMenuCategoryScrollSpy'
import { FullMenuCategorySection } from './FullMenuCategorySection'
import WattaHeroRollTitle from './WattaHeroRollTitle'
import WattaStellarHeroBackground from './WattaStellarHeroBackground'
import { canonicalMenuCategorySlug } from '@/lib/menuCategoryCanonical'
import {
  WATTA_FULL_MENU_HERO_LANDSCAPE,
  WATTA_FULL_MENU_HERO_LANDSCAPE_HQ,
} from '@/lib/wattaMenuHeroVideo'
import { WATTA_HERO_VIDEO_READY_EVENT } from '@/lib/wattaHeroVideo'
import WattaMenuBalloonsTrigger from './WattaMenuBalloonsTrigger'

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
  ingredientIds?: number[]
}

interface MenuCategoryRow {
  id: number
  slug: string
  name: string
  emoji: string
  order: number
  imageUrl?: string | null
  hoverImageUrl?: string | null
}

/** Єдиний регістр slug — інакше товари з `Rolls` vs категорія `rolls` не потрапляють у секції. */
function normMenuSlug(s: string): string {
  const t = canonicalMenuCategorySlug(s)
  return t.length > 0 ? t : 'misc'
}

export default function FullMenuPageClient() {
  const { t, language, getLocalized, formatMenuItemsCount } = useLanguage()
  const searchParams = useSearchParams()
  const catFromUrl = searchParams.get('cat')?.trim() ?? ''
  const mv = t.menuView

  const [categories, setCategories] = useState<MenuCategoryRow[]>([])
  const [items, setItems] = useState<MenuItem[]>([])
  /** Завжди true до mount — sessionStorage лише в useLayoutEffect (hydration-safe). */
  const [loading, setLoading] = useState(true)
  /** Slug з sessionStorage (клік категорії з /delivery тощо), поки ?cat= ще не в URL. */
  const [deepLinkCat, setDeepLinkCat] = useState('')
  /** Один автоскрол на цільову категорію за навігацію. */
  const initialCatScrollDoneRef = useRef<string | null>(null)
  /** Скрол до секції після переходу з іншої сторінки по категорії (drawer / стрічка). */
  const catScrollAfterLoadRef = useRef<string | null>(null)
  const catScrollGenerationRef = useRef(0)
  const catScrollSettledRef = useRef(false)
  /** Після кліку по чіпу — не скасовувати програмний скрол дрібним touchmove (iOS). */
  const categoryScrollGraceUntilRef = useRef(0)
  const itemsRef = useRef<MenuItem[]>([])
  itemsRef.current = items
  const visibleCategoriesRef = useRef<MenuCategoryRow[]>([])
  const [pinnedMountSlugs, setPinnedMountSlugs] = useState<Set<string>>(() => new Set())
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
            ingredientIds: Array.isArray(p.ingredientIds)
              ? (p.ingredientIds as unknown[])
                  .map((x) => Number(x))
                  .filter((n) => Number.isFinite(n) && n > 0)
              : [],
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
          const slug = normMenuSlug(String(cat.slug ?? ''))
          const { imageUrl, hoverImageUrl } = applyPermanentMenuCategoryImages(
            slug,
            typeof cat.imageUrl === 'string' ? cat.imageUrl : null,
            typeof cat.hoverImageUrl === 'string' ? cat.hoverImageUrl : null,
          )
          return {
            id: Number(cat.id) || 0,
            slug,
            name,
            emoji: typeof cat.emoji === 'string' && cat.emoji ? String(cat.emoji) : '🍣',
            order: typeof cat.order === 'number' ? cat.order : 0,
            imageUrl,
            hoverImageUrl,
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
          startTransition(() => setItems(mapProductsToItems(list)))
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
            setLoading(false)
            const mapped = mapProductsToItems(data)
            if (itemsRef.current.length === 0) {
              setItems(mapped)
            } else {
              startTransition(() => setItems(mapped))
            }
            void refreshProductsInBackground(scopedUrl, cacheKey, hasCity, fetchFn)
            return
          }
        } catch {
          /* damaged cache */
        }
      }
    }

    const showLoadingSkeleton = !fresh || itemsRef.current.length === 0
    if (showLoadingSkeleton) setLoading(true)
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
      const mapped = mapProductsToItems(list)
      if (showLoadingSkeleton) {
        setItems(mapped)
      } else {
        startTransition(() => setItems(mapped))
      }
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
      setLoading(false)
      setItems(mapProductsToItems(rawProducts))
    }
    const rawCategories = readRawMenuCategoriesFromSession()
    if (rawCategories) {
      const rows = mapApiToCategoryRows(rawCategories)
      if (rows.length > 0) setCategories(rows)
    }
  }, [mapProductsToItems, mapApiToCategoryRows])

  const loadCategoriesRef = useRef(loadCategories)
  loadCategoriesRef.current = loadCategories
  const loadProductsRef = useRef(loadProducts)
  loadProductsRef.current = loadProducts

  useEffect(() => {
    void loadCategoriesRef.current()
    void loadProductsRef.current()
    void warmMenuCatalogCache()
  }, [])

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
    const knownSlugs = new Set(categories.map((c) => normMenuSlug(c.slug)))
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
      if (!knownSlugs.has(resolvedSlug)) {
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

  const visibleCategories = useMemo(() => categories, [categories])

  const targetCategorySlug = useMemo(() => {
    const raw = (catFromUrl || deepLinkCat).trim()
    if (!raw || raw === FULL_MENU_ALL_SLUG) return ''
    const norm = normMenuSlug(raw)
    const row = visibleCategories.find((c) => normMenuSlug(c.slug) === norm)
    return row ? normMenuSlug(row.slug) : norm
  }, [catFromUrl, deepLinkCat, visibleCategories])

  const menuSectionsRef = useRef<Array<{ slug: string; el: HTMLElement }>>([])
  useLayoutEffect(() => {
    menuSectionsRef.current = visibleCategories.flatMap((c) => {
      const el =
        document.getElementById(`full-menu-heading-${c.slug}`) ??
        document.getElementById(`full-menu-section-${c.slug}`)
      return el ? [{ slug: c.slug, el }] : []
    })
  }, [visibleCategories, loading])

  /** Стабільний scroll-margin (CSS var). */
  const scrollPadPx = FULL_MENU_SECTION_SCROLL_MARGIN

  useEffect(
    () => () => {
      cancelMenuScrollAnimation()
    },
    [],
  )

  /** Скасувати відкладений scroll-to-top SPA — інакше /menu «зависає» після переходу з /product. */
  useLayoutEffect(() => {
    cancelRouteScrollToTopOnNavigation()
  }, [])

  const getFullMenuScrollSections = useCallback(() => menuSectionsRef.current, [])

  useMenuCategoryScrollSpy({
    enabled: !loading && visibleCategories.length > 0,
    getSections: getFullMenuScrollSections,
    isScrollLocked: isMenuCatalogScrollLocked,
    beforeFirstSectionSlug: FULL_MENU_ALL_SLUG,
    beforeCatalogSlug: FULL_MENU_ALL_SLUG,
    getCatalogEl: () => document.getElementById('full-menu-page-start'),
  })

  useLayoutEffect(() => {
    const pending = consumePendingMenuCatScroll()
    if (pending) {
      const norm = normMenuSlug(pending)
      if (norm && norm !== FULL_MENU_ALL_SLUG) setDeepLinkCat(norm)
    }
  }, [])

  const findCategoryScrollTarget = useCallback((slug: string): HTMLElement | null => {
    if (slug === FULL_MENU_ALL_SLUG) {
      return (
        document.getElementById(FULL_MENU_HERO_INTRO_ID) ??
        document.querySelector<HTMLElement>('.menu-page-web')
      )
    }
    const norm = normMenuSlug(slug)
    const keys = new Set<string>([slug.trim(), norm])
    const row = visibleCategoriesRef.current.find(
      (c) => normMenuSlug(c.slug) === norm,
    )
    if (row) keys.add(row.slug)
    for (const key of keys) {
      if (!key) continue
      const heading = document.getElementById(`full-menu-heading-${key}`)
      if (heading) return heading
    }
    return null
  }, [])

  const pinSectionMount = useCallback((slug: string) => {
    const norm = normMenuSlug(slug)
    if (!norm || norm === FULL_MENU_ALL_SLUG) return
    setPinnedMountSlugs((prev) => {
      if (prev.has(norm)) return prev
      const next = new Set(prev)
      next.add(norm)
      return next
    })
  }, [])

  /**
   * Mobile UX: avoid "white gaps" during chip-to-section jumps by pre-mounting
   * the target section and its immediate neighbors before the scroll completes.
   */
  const pinSectionMountCluster = useCallback((slug: string) => {
    const norm = normMenuSlug(slug)
    if (!norm || norm === FULL_MENU_ALL_SLUG) return
    const cats = visibleCategoriesRef.current
    const idx = cats.findIndex((c) => normMenuSlug(c.slug) === norm)
    const slugs: string[] = [norm]
    if (idx >= 0) {
      const prev = cats[idx - 1]
      const next = cats[idx + 1]
      if (prev) slugs.push(normMenuSlug(prev.slug))
      if (next) slugs.push(normMenuSlug(next.slug))
    }
    setPinnedMountSlugs((prev) => {
      let changed = false
      const next = new Set(prev)
      for (const s of slugs) {
        if (!s || s === FULL_MENU_ALL_SLUG) continue
        if (!next.has(s)) {
          next.add(s)
          changed = true
        }
      }
      return changed ? next : prev
    })
  }, [])

  const scrollToCategoryOnce = useCallback(
    (slug: string, generation: number, useEasedScroll = false): boolean => {
      if (generation !== catScrollGenerationRef.current) return false
      const trimmed = slug.trim()
      if (!trimmed) return false
      const normalized = trimmed === FULL_MENU_ALL_SLUG ? FULL_MENU_ALL_SLUG : normMenuSlug(trimmed)

      if (normalized === FULL_MENU_ALL_SLUG) {
        window.dispatchEvent(
          new CustomEvent('wattaMenuCategoryHighlight', { detail: { slug: normalized } }),
        )
        if (useEasedScroll) {
          void scrollFullMenuHeroIntroEased()
        } else {
          scrollFullMenuHeroIntro('auto')
        }
        catScrollSettledRef.current = true
        return true
      }

      if (normalized !== FULL_MENU_ALL_SLUG) {
        if (useEasedScroll) {
          pinSectionMountCluster(normalized)
        } else {
          flushSync(() => pinSectionMountCluster(normalized))
        }
      }

      const target = findCategoryScrollTarget(normalized)
      if (!target) return false

      window.dispatchEvent(
        new CustomEvent('wattaMenuCategoryHighlight', { detail: { slug: normalized } }),
      )

      if (useEasedScroll) {
        void scrollFullMenuCategoryHeadingEased(target)
      } else {
        scrollFullMenuCategoryHeading(target, 'auto')
      }

      catScrollSettledRef.current = true
      return true
    },
    [findCategoryScrollTarget, pinSectionMountCluster],
  )

  const armCategoryScrollGrace = useCallback((ms = 520) => {
    categoryScrollGraceUntilRef.current = performance.now() + ms
    setMenuCatalogScrollLock(true)
  }, [])

  const requestScrollToCategory = useCallback(
    (slug: string, options?: { smooth?: boolean }) => {
      const trimmed = slug.trim()
      if (!trimmed) return
      const reduceMotion =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const useEasedScroll = Boolean(options?.smooth && !reduceMotion)
      cancelMenuScrollAnimation()
      catScrollSettledRef.current = false
      armCategoryScrollGrace(useEasedScroll ? 900 : 520)
      if (trimmed === FULL_MENU_ALL_SLUG) {
        beginFullMenuHeroScrollChromeLock(useEasedScroll ? 900 : 380)
      } else {
        beginMenuCategoryScrollChromeLock(useEasedScroll ? 900 : 380)
      }
      const generation = ++catScrollGenerationRef.current
      runUntilScrollSuccess(
        () => scrollToCategoryOnce(trimmed, generation, useEasedScroll),
        useEasedScroll
          ? [0, 48, 120, 280, 480]
          : [0, 16, 32, 64, 96, 160, 240, 360, 520],
      )
      window.setTimeout(() => setMenuCatalogScrollLock(false), useEasedScroll ? 720 : 280)
    },
    [scrollToCategoryOnce, armCategoryScrollGrace],
  )

  useEffect(() => {
    const onScrollRequest = (ev: Event) => {
      const detail = (ev as CustomEvent<{ slug?: string; instant?: boolean }>).detail
      const slug = detail?.slug?.trim()
      if (!slug) return
      initialCatScrollDoneRef.current = null
      catScrollSettledRef.current = false
      const instant = detail?.instant !== false
      armCategoryScrollGrace(instant ? 520 : 900)
      requestScrollToCategory(slug, { smooth: !instant })
    }
    window.addEventListener(WATTA_MENU_REQUEST_SCROLL_TO_CAT, onScrollRequest)
    return () => {
      window.removeEventListener(WATTA_MENU_REQUEST_SCROLL_TO_CAT, onScrollRequest)
      catScrollGenerationRef.current += 1
    }
  }, [requestScrollToCategory, armCategoryScrollGrace])

  const prevCatFromUrlRef = useRef('')

  /** Перехід на /menu?cat= (або pending з іншої сторінки) — скрол до заголовка секції після mount каталогу. */
  useLayoutEffect(() => {
    visibleCategoriesRef.current = visibleCategories
  }, [visibleCategories])

  useLayoutEffect(() => {
    if (prevCatFromUrlRef.current !== catFromUrl) {
      initialCatScrollDoneRef.current = null
      catScrollSettledRef.current = false
      prevCatFromUrlRef.current = catFromUrl
      const norm = catFromUrl ? normMenuSlug(catFromUrl) : ''
      if (norm && norm !== FULL_MENU_ALL_SLUG) {
        setDeepLinkCat(norm)
      }
    }
    if (loading || visibleCategories.length === 0) return

    const pendingScrollSlug = catScrollAfterLoadRef.current
    if (pendingScrollSlug) {
      const norm = normMenuSlug(pendingScrollSlug)
      if (initialCatScrollDoneRef.current === norm) {
        catScrollAfterLoadRef.current = null
        return
      }
      initialCatScrollDoneRef.current = norm
      catScrollAfterLoadRef.current = null
      pinSectionMountCluster(norm)
      requestAnimationFrame(() => {
        requestScrollToCategory(norm)
      })
      return
    }

    const slug = targetCategorySlug
    if (!slug) return
    if (initialCatScrollDoneRef.current === slug) return
    initialCatScrollDoneRef.current = slug
    pinSectionMountCluster(slug)
  }, [
    catFromUrl,
    loading,
    targetCategorySlug,
    requestScrollToCategory,
    visibleCategories.length,
    pinSectionMountCluster,
    armCategoryScrollGrace,
  ])

  useEffect(() => {
    if (!targetCategorySlug) return
    pinSectionMountCluster(targetCategorySlug)
  }, [targetCategorySlug, pinSectionMountCluster])

  /** Під час автоскролу до ?cat= — зупинити ретраї; будь-який свайп скасовує «залипання». */
  useEffect(() => {
    if (typeof window === 'undefined') return
    const cancelPendingCatScroll = () => {
      cancelRouteScrollToTopOnNavigation()
      if (catScrollSettledRef.current) return
      if (isMenuCatalogScrollLocked()) return
      if (performance.now() < categoryScrollGraceUntilRef.current) return
      catScrollGenerationRef.current += 1
    }
    const opts: AddEventListenerOptions = { passive: true, capture: true }
    window.addEventListener('wheel', cancelPendingCatScroll, opts)
    window.addEventListener('touchmove', cancelPendingCatScroll, opts)
    return () => {
      window.removeEventListener('wheel', cancelPendingCatScroll, opts as EventListenerOptions)
      window.removeEventListener('touchmove', cancelPendingCatScroll, opts as EventListenerOptions)
    }
  }, [])

  const addToCart = useMenuAddToCart()
  const addToCartFromCard = useCallback(
    (product: WattaMenuProductCardModel) => {
      const full = itemsRef.current.find((x) => x.id === product.id)
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
    [addToCart],
  )

  const menuHeroTitleLines = useMemo(
    () =>
      [mv.fullMenuIntroHeadlineLead.trim(), mv.fullMenuIntroHeadlineMark.trim()].filter(
        (line) => line.length > 0,
      ),
    [mv.fullMenuIntroHeadlineLead, mv.fullMenuIntroHeadlineMark],
  )

  const menuHeroBody = mv.fullMenuIntroSub

  const menuHeroAriaLabel = `${mv.fullMenuIntroHeadlineLead} ${mv.fullMenuIntroHeadlineMark}. ${mv.fullMenuIntroSub}`

  const menuHeroAccessibleTitle = `${mv.fullMenuIntroHeadlineLead} ${mv.fullMenuIntroHeadlineMark}`.trim()

  useEffect(() => {
    const signalReady = () => {
      try {
        document.documentElement.setAttribute('data-watta-hero-content-ready', '1')
      } catch {
        /* ignore */
      }
      window.dispatchEvent(new CustomEvent(WATTA_HERO_VIDEO_READY_EVENT))
    }
    requestAnimationFrame(() => {
      requestAnimationFrame(signalReady)
    })
  }, [])

  const fullMenuHeroStack = (
    <div className="delivery-page-intro-web delivery-page-intro-web--video w-full shrink-0">
      <div className="watta-home-hero-flow w-full shrink-0">
        <div
          className="watta-home-photo-first-screen watta-stellar-hero-stack menu-stellar-hero-stack watta-home-stellar-hero-stack w-full shrink-0 bg-white"
          data-watta-home-photo-first=""
        >
          <WattaStellarHeroBackground
            backgroundSrc={WATTA_FULL_MENU_HERO_LANDSCAPE}
            backgroundSrcHiRes={WATTA_FULL_MENU_HERO_LANDSCAPE_HQ}
            imageFit="cover"
          />
          <div className="watta-home-hero-overlay-stack delivery-page-hero-stack delivery-page-hero-stack--roll-first w-full shrink-0">
            <div className="watta-home-roll-hero-slot-web relative z-[20] w-full shrink-0">
              <div className="menu-home-narrow-strip-hero-web w-full max-w-[100vw] shrink-0">
                <section
                  id={FULL_MENU_HERO_INTRO_ID}
                  className="watta-sushi-roll-hero watta-menu-photo-hero watta-menu-photo-hero--no-marquee"
                  aria-labelledby="menu-page-after-hero-intro-title"
                >
                  <h1 id="menu-page-after-hero-intro-title" className="sr-only">
                    {menuHeroAccessibleTitle}
                  </h1>
                  <div className="watta-menu-photo-hero__intro-stack">
                    <WattaHeroRollTitle
                      mobileIntro={{
                        titleLines: menuHeroTitleLines,
                        body: menuHeroBody,
                        ariaLabel: menuHeroAriaLabel,
                      }}
                    />
                    <WattaMenuBalloonsTrigger placement="hero" />
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div
      className="menu-page-web watta-site-hero-page-web watta-page-bg relative flex min-h-0 w-full max-w-[100vw] flex-col bg-transparent"
      data-watta-home-narrow-strip-hero="1"
    >
      <div className="delivery-page-home-flow w-full">{fullMenuHeroStack}</div>

      <div
        className="watta-full-menu-page flex min-h-0 w-full min-w-0 flex-1 flex-col"
      >
      <div
        id="full-menu-page-start"
        style={{ scrollMarginTop: scrollPadPx }}
        className="relative z-[1] w-full max-w-[100vw] shrink-0"
      >
        <WattaInViewFadeSection
          className="home-menu-catalog-section-web home-full-menu-catalog-web watta-full-menu-catalog-reveal-web relative z-[2] w-full max-w-[100vw] px-4 pb-8 pt-4 sm:px-6 sm:pb-12 sm:pt-6 md:px-8 md:pb-14"
          aria-labelledby="menu-page-after-hero-intro-title"
        >
          <div className="home-menu-catalog-stack-web relative z-[1] mx-auto w-full max-w-[1800px]">
            {loading ? (
              <div className="home-menu-cat-list-web pb-4" aria-busy="true" aria-live="polite">
                <p className="sr-only">{mv.fullMenuLoading}</p>
                {[0, 1].map((band) => (
                  <div key={band} className="home-menu-cat-band-web animate-pulse">
                    <div className="mb-4 flex gap-3 sm:mb-5">
                      <div className="h-11 w-11 shrink-0 rounded-2xl bg-watta-action/12 sm:h-12 sm:w-12" />
                      <div className="flex min-w-0 flex-1 flex-col gap-2.5 pt-1">
                        <div className="h-5 max-w-[12rem] rounded-md bg-watta-action/14" />
                        <div className="h-3 max-w-[6rem] rounded bg-watta-action/10" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 items-stretch gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-3 xl:grid-cols-4">
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
                ).map(({ cat, list }, sectionIndex) => (
                  <FullMenuCategorySection
                    key={cat.slug}
                    cat={cat}
                    list={list}
                    scrollPadPx={scrollPadPx}
                    emptyLabel={mv.emptyCategoryTitle}
                    forceMountGrid={
                      Boolean(targetCategorySlug) ||
                      sectionIndex === 0 ||
                      pinnedMountSlugs.has(normMenuSlug(cat.slug))
                    }
                    formatItemsCount={formatMenuItemsCount}
                    onAddToCart={addToCartFromCard}
                  />
                ))}
              </div>
            )}
          </div>
        </WattaInViewFadeSection>
      </div>
      </div>
    </div>
  )
}
