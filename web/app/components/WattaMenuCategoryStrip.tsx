'use client'

import React, { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useInstantRouter } from '@/hooks/useInstantRouter'
import { MenuUtensilsCrossedIcon } from './MenuUtensilsCrossedIcon'
import { MenuCategorySticker } from './MenuCategorySticker'
import { remapMenuCategoriesFromSessionCache } from '@/lib/readMenuCategoriesCache'
import { canonicalMenuCategorySlug } from '@/lib/menuCategoryCanonical'
import { useLanguage } from '../context/LanguageContext'
import { buildMenuCategoriesFromApi, parseCategoriesCacheJson } from '@/lib/buildMenuCategoriesFromApi'
import { menuCategoriesSessionKey } from '@/lib/i18n/menuDataCacheBust'
import { MENU_CATEGORY_EMOJI, MENU_CATEGORY_FALLBACK_SLUGS } from '@/lib/menuCategoryFallback'
import {
  WATTA_MENU_REQUEST_SCROLL_TO_CAT,
  FULL_MENU_ALL_SLUG,
  dispatchCategoryStripSelect,
  prefetchFullMenuCategory,
} from '@/lib/fullMenuCategoryNav'
import { filterNonAggregateMenuCategories } from '@/lib/menuCategoryFilters'
import { getApiUrl } from '@/lib/utils'
import { fetchPublicApi } from '@/lib/publicApiFetch'
import {
  readProductCategorySlugFromCache,
  WATTA_PRODUCT_DETAIL_CACHED_EVENT,
  warmupProductDetail,
} from '@/lib/fetchProductById'
// На `/menu` — скрол до заголовка секції; на головній та інших маршрутах → `/menu`.

type MenuCategory = {
  id: string
  key: string
  slug?: string
  name: string
  emoji: string
  imageUrl?: string | null
  hoverImageUrl?: string | null
  subcategories: { id: string; name: string; items: unknown[] }[]
}

function normSlug(slug: string): string {
  const t = canonicalMenuCategorySlug(slug)
  if (!t) return ''
  if (t === FULL_MENU_ALL_SLUG) return FULL_MENU_ALL_SLUG
  return t
}

/** Лише горизонтальний скрол панелі — `scrollIntoView` на чіпі в fixed chrome зсуває всю сторінку вниз. */
function scrollCategoryChipInPanel(
  panel: HTMLElement,
  chip: HTMLElement,
  mode: 'nearest' | 'center',
) {
  const chipLeft = chip.offsetLeft
  const chipWidth = chip.offsetWidth
  const panelWidth = panel.clientWidth
  const maxScroll = Math.max(0, panel.scrollWidth - panelWidth)
  const pad = 8

  let next = panel.scrollLeft
  if (mode === 'center') {
    next = chipLeft - (panelWidth - chipWidth) / 2
  } else if (chipLeft < panel.scrollLeft + pad) {
    next = chipLeft - pad
  } else if (chipLeft + chipWidth > panel.scrollLeft + panelWidth - pad) {
    next = chipLeft + chipWidth - panelWidth + pad
  } else {
    return
  }

  panel.scrollTo({
    left: Math.max(0, Math.min(next, maxScroll)),
    behavior: 'auto',
  })
}

/**
 * Горизонтальні категорії як на головній.
 * Підсвічування: URL (/menu?cat=, /product/:id). Скрол до секції — по кліку (події з FullMenuPageClient).
 */
type WattaMenuCategoryStripInnerProps = {
  /** Лише для `/menu?cat=` — решта маршрутів без useSearchParams (без Suspense). */
  menuCatQuery?: string | null
}

function WattaMenuCategoryStripInner({ menuCatQuery = null }: WattaMenuCategoryStripInnerProps) {
  const router = useInstantRouter()
  const prefetchRouter = useRouter()
  const pathname = usePathname()
  const { language, t } = useLanguage()
  const fallbackCategories = useMemo<MenuCategory[]>(
    () =>
      MENU_CATEGORY_FALLBACK_SLUGS.map((key) => ({
        id: key,
        key,
        name: t.categories[key],
        emoji: MENU_CATEGORY_EMOJI[key],
        subcategories: [],
      })),
    [t.categories]
  )
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>(fallbackCategories)
  const [urlHighlight, setUrlHighlight] = useState<string | null>(null)
  const [productHighlight, setProductHighlight] = useState<string | null>(null)
  const [menuScrollHint, setMenuScrollHint] = useState<string | null>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const categoriesPanelRef = useRef<HTMLDivElement | null>(null)
  const scrollPositionRef = useRef(0)
  const isUserScrollingRef = useRef(false)
  const restorePositionTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const categoryTapStartRef = useRef<{ x: number; y: number } | null>(null)
  const categoryPointerHandledRef = useRef(false)
  /** Після кліку не відкатувати горизонтальний скрол панелі (scrollActiveChipIntoView). */
  const suppressPanelRestoreUntilRef = useRef(0)
  const productReqRef = useRef(0)
  const panelAutoScrollTimersRef = useRef<number[]>([])
  const homeScrollTimersRef = useRef<number[]>([])
  const lastScrollDrivenChipKeyRef = useRef('')

  /** Підсвічування: на /menu — підказка зі скролу або кліку; інакше URL або slug з картки товару. */
  const activeKey = (() => {
    if (pathname === '/menu' && menuScrollHint != null) return menuScrollHint
    if (urlHighlight != null) return urlHighlight
    if (productHighlight != null) return productHighlight
    return ''
  })()

  /**
   * Єдиний "ключ панелі" для підсвітки/скролу.
   * На практиці `activeKey` може прийти не в тому регістрі або як `slug`,
   * тому звіряємось із завантаженим списком категорій.
   */
  const panelActiveKey = useMemo(() => {
    const want = normSlug(activeKey)
    if (!want) return ''
    if (want === FULL_MENU_ALL_SLUG) return FULL_MENU_ALL_SLUG
    const byKey = menuCategories.find((c) => normSlug(c.key) === want)
    if (byKey) return byKey.key
    const bySlug = menuCategories.find((c) => normSlug(c.slug ?? '') === want)
    if (bySlug) return bySlug.key
    return want
  }, [activeKey, menuCategories])

  useEffect(() => {
    const p = pathname || ''
    if (!p.match(/^\/product\/\d+/)) {
      setProductHighlight(null)
    }
    if (p !== '/menu' && p !== '/') {
      setMenuScrollHint(null)
    }
  }, [pathname])

  useEffect(() => {
    const p = pathname || ''
    setUrlHighlight(null)
    if (p.startsWith('/menu/category/')) {
      const raw = p.slice('/menu/category/'.length)
      try {
        const s = normSlug(decodeURIComponent(raw))
        setUrlHighlight(s || null)
      } catch {
        const s = normSlug(raw)
        setUrlHighlight(s || null)
      }
      return
    }
    if (p === '/menu') {
      const c = normSlug(menuCatQuery ?? '')
      if (c) {
        setUrlHighlight(c)
      } else {
        setUrlHighlight(FULL_MENU_ALL_SLUG)
      }
      return
    }
    const pm = p.match(/^\/product\/(\d+)$/)
    if (pm) {
      const id = parseInt(pm[1], 10)
      const my = ++productReqRef.current
      setUrlHighlight(null)
      const cachedSlug = Number.isFinite(id) ? readProductCategorySlugFromCache(id) : null
      if (cachedSlug) {
        const s = normSlug(cachedSlug)
        setProductHighlight(s ? s : null)
        return
      }
      setProductHighlight(null)
      if (Number.isFinite(id)) void warmupProductDetail(id)
      fetch(getApiUrl(`/api/products/${pm[1]}`))
        .then((r) => (r.ok ? r.json() : null))
        .then((data: { category?: { slug?: string } } | null) => {
          if (my !== productReqRef.current) return
          const slug = data?.category?.slug
          const s = typeof slug === 'string' ? normSlug(slug) : ''
          setProductHighlight(s ? s : null)
        })
        .catch(() => {
          if (my !== productReqRef.current) return
          setProductHighlight(null)
        })
      return
    }
    setUrlHighlight(null)
  }, [pathname, menuCatQuery])

  useEffect(() => {
    const pm = (pathname || '').match(/^\/product\/(\d+)$/)
    if (!pm) return
    const id = parseInt(pm[1], 10)
    if (!Number.isFinite(id)) return
    const onCached = (ev: Event) => {
      const detail = (ev as CustomEvent<{ id?: number }>).detail
      if (detail?.id !== id) return
      const slug = readProductCategorySlugFromCache(id)
      const s = slug ? normSlug(slug) : ''
      if (s) setProductHighlight(s)
    }
    window.addEventListener(WATTA_PRODUCT_DETAIL_CACHED_EVENT, onCached)
    return () => window.removeEventListener(WATTA_PRODUCT_DETAIL_CACHED_EVENT, onCached)
  }, [pathname])

  useLayoutEffect(() => {
    const remapped = remapMenuCategoriesFromSessionCache(
      language,
      t.categories as Record<string, string>,
    )
    if (remapped?.length) {
      setMenuCategories(remapped)
    }
  }, [language, t.categories])

  useEffect(() => {
    const h = (ev: Event) => {
      const p = pathname || ''
      if (p !== '/menu') return
      const slug = (ev as CustomEvent<{ slug?: string }>).detail?.slug
      if (typeof slug === 'string' && slug) {
        const s = normSlug(slug)
        if (!s) return
        setMenuScrollHint((prev) => (prev === s ? prev : s))
      }
    }
    window.addEventListener('wattaMenuCategoryHighlight', h)
    return () => window.removeEventListener('wattaMenuCategoryHighlight', h)
  }, [pathname])

  const categoryLanguageRef = useRef(language)
  categoryLanguageRef.current = language
  const categoryLabelsRef = useRef(t.categories)
  categoryLabelsRef.current = t.categories

  const loadCategories = useCallback(() => {
    const cacheKey = menuCategoriesSessionKey()
    const cached = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(cacheKey) : null
    const cacheTime = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(`${cacheKey}_time`) : null
    const now = Date.now()
    const CACHE_TTL = 5 * 60 * 1000

    const mapApi = (data: Record<string, unknown>[]) =>
      buildMenuCategoriesFromApi(
        data,
        categoryLanguageRef.current,
        categoryLabelsRef.current as Record<string, string>,
      )

    const applyCategories = (categories: MenuCategory[]) => {
      setMenuCategories(filterNonAggregateMenuCategories(categories))
    }

    if (cached && cacheTime && (now - parseInt(cacheTime, 10)) < CACHE_TTL) {
      const raw = parseCategoriesCacheJson(cached)
      if (raw) {
        applyCategories(mapApi(raw))
        fetchPublicApi('/api/products/categories')
          .then((res) => res.json())
          .then((data) => {
            const list = Array.isArray(data) ? (data as Record<string, unknown>[]) : []
            if (typeof sessionStorage !== 'undefined' && list.length > 0) {
              sessionStorage.setItem(cacheKey, JSON.stringify(list))
              sessionStorage.setItem(`${cacheKey}_time`, Date.now().toString())
            }
            if (list.length > 0) applyCategories(mapApi(list))
          })
          .catch(() => {})
        return
      }
    }

    fetchPublicApi('/api/products/categories')
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? (data as Record<string, unknown>[]) : []
        if (typeof sessionStorage !== 'undefined' && list.length > 0) {
          sessionStorage.setItem(cacheKey, JSON.stringify(list))
          sessionStorage.setItem(`${cacheKey}_time`, Date.now().toString())
        }
        if (list.length > 0) {
          applyCategories(mapApi(list))
          return
        }
        setMenuCategories(fallbackCategories)
      })
      .catch(() => {
        setMenuCategories(fallbackCategories)
      })
  }, [fallbackCategories])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  useEffect(() => {
    const h = () => loadCategories()
    window.addEventListener('categoriesUpdated', h)
    return () => window.removeEventListener('categoriesUpdated', h)
  }, [loadCategories])

  const checkScrollButtons = useCallback((element: HTMLElement | null) => {
    if (!element) return
    const scrollLeft = element.scrollLeft
    const scrollWidth = element.scrollWidth
    const clientWidth = element.clientWidth
    const threshold = 5
    setCanScrollLeft(scrollLeft > threshold)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - threshold)
  }, [])

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const el = e.currentTarget
      isUserScrollingRef.current = true
      scrollPositionRef.current = el.scrollLeft
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)
      scrollTimeoutRef.current = setTimeout(() => {
        /* Не використовувати `e.currentTarget` у відкладеному колбеці — у React воно часто null після виходу з handler. */
        checkScrollButtons(el)
        setTimeout(() => {
          isUserScrollingRef.current = false
        }, 150)
      }, 50)
    },
    [checkScrollButtons],
  )

  // useEffect(() => {
  //   const panel = categoriesPanelRef.current
  //   if (!panel) return
  //   const savedPosition = scrollPositionRef.current
  //   const restorePosition = () => {
  //     if (!panel || isUserScrollingRef.current) return
  //     if (Date.now() < suppressPanelRestoreUntilRef.current) return
  //     const currentScroll = panel.scrollLeft
  //     if (savedPosition > 0 && Math.abs(currentScroll - savedPosition) > 5) {
  //       panel.scrollLeft = savedPosition
  //     }
  //   }
  //   if (restorePositionTimeoutRef.current) clearTimeout(restorePositionTimeoutRef.current)
  //   restorePositionTimeoutRef.current = setTimeout(restorePosition, 50)
  //   const t1 = setTimeout(restorePosition, 100)
  //   const t2 = setTimeout(restorePosition, 250)
  //   const t3 = setTimeout(restorePosition, 500)
  //   return () => {
  //     if (restorePositionTimeoutRef.current) clearTimeout(restorePositionTimeoutRef.current)
  //     clearTimeout(t1)
  //     clearTimeout(t2)
  //     clearTimeout(t3)
  //   }
  // }, [urlHighlight, productHighlight, pathname, menuCategories])

  useEffect(() => {
    const panel = categoriesPanelRef.current
    if (!panel) return
    checkScrollButtons(panel)
    let roRaf = 0
    const ro = new ResizeObserver(() => {
      if (roRaf) return
      roRaf = requestAnimationFrame(() => {
        roRaf = 0
        checkScrollButtons(panel)
      })
    })
    ro.observe(panel)
    return () => {
      if (roRaf) cancelAnimationFrame(roRaf)
      ro.disconnect()
    }
  }, [menuCategories.length, checkScrollButtons])

  /** Після запиту скролу до секції — прокрутити відповідний чіп у видиму зону (працює на будь-якій сторінці). */
  useEffect(() => {
    const scrollChip = (ev: Event) => {
      const slug = (ev as CustomEvent<{ slug?: string }>).detail?.slug?.trim()
      if (!slug) return
      requestAnimationFrame(() => {
        const panel = categoriesPanelRef.current
        if (!panel) return
        const normalized = normSlug(slug)
        const safe =
          typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
            ? CSS.escape(normalized)
            : normalized.replace(/"/g, '\\"')
        const chip = panel.querySelector<HTMLElement>(`[data-watta-cat="${safe}"]`)
        if (chip) scrollCategoryChipInPanel(panel, chip, 'nearest')
      })
    }
    window.addEventListener(WATTA_MENU_REQUEST_SCROLL_TO_CAT, scrollChip as EventListener)
    return () => window.removeEventListener(WATTA_MENU_REQUEST_SCROLL_TO_CAT, scrollChip as EventListener)
  }, [])

  const scrollPanelBy = (direction: 'left' | 'right') => {
    const panel = categoriesPanelRef.current
    if (!panel) return
    const amount = panel.clientWidth * 0.7
    panel.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' })
    ;[150, 350, 550].forEach((ms) => setTimeout(() => checkScrollButtons(panel), ms))
  }

  const categoryPrefetchHref = useCallback((key: string) => {
    if (key === FULL_MENU_ALL_SLUG) return '/menu'
    return `/menu?cat=${encodeURIComponent(key)}`
  }, [])

  const scrollActiveChipIntoView = useCallback((key: string) => {
    requestAnimationFrame(() => {
      const panel = categoriesPanelRef.current
      if (!panel) return
      const safe =
        typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
          ? CSS.escape(key)
          : key.replace(/"/g, '\\"')
      const chip = panel.querySelector<HTMLElement>(`[data-watta-cat="${safe}"]`)
      if (chip) scrollCategoryChipInPanel(panel, chip, 'center')
    })
  }, [])

  /**
   * Автопрокрутка панелі до активної категорії:
   * - при прямому переході по URL (/menu?cat=, /menu/category/:slug, /product/:id)
   * - після завантаження/ремапу категорій
   * Не втручаємось, якщо користувач прямо зараз скролить панель або щойно клікнув категорію.
   */
  /** Під час вертикального скролу на /menu — лише підсвітка + «nearest» у видиму зону (без center/таймерів). */
  useEffect(() => {
    const p = pathname || ''
    if (p !== '/menu') return
    if (!menuScrollHint) {
      lastScrollDrivenChipKeyRef.current = ''
      return
    }
    const isScrollDriven =
      menuScrollHint != null && normSlug(menuScrollHint) === normSlug(activeKey)
    if (!isScrollDriven) return
    const key = panelActiveKey?.trim()
    if (!key || key === lastScrollDrivenChipKeyRef.current) return
    lastScrollDrivenChipKeyRef.current = key
    const panel = categoriesPanelRef.current
    if (!panel) return
    requestAnimationFrame(() => {
      const safe =
        typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
          ? CSS.escape(key)
          : key.replace(/"/g, '\\"')
      const chip = panel.querySelector<HTMLElement>(`[data-watta-cat="${safe}"]`)
      if (chip) scrollCategoryChipInPanel(panel, chip, 'nearest')
    })
  }, [pathname, menuScrollHint, panelActiveKey, activeKey])

  useEffect(() => {
    const key = panelActiveKey?.trim()
    if (!key) return
    const panel = categoriesPanelRef.current
    if (!panel) return
    const isScrollDrivenHighlight =
      pathname === '/menu' &&
      menuScrollHint != null &&
      normSlug(menuScrollHint) === normSlug(activeKey)
    if (isScrollDrivenHighlight) return
    if (isUserScrollingRef.current) return
    if (Date.now() < suppressPanelRestoreUntilRef.current) return

    const doScroll = () => {
      if (!categoriesPanelRef.current) return
      if (isUserScrollingRef.current) return
      if (Date.now() < suppressPanelRestoreUntilRef.current) return
      scrollActiveChipIntoView(key)
    }

    // Не накопичувати таймери — інакше відчувається як "фриз" при швидких кліках/навігації.
    for (const id of panelAutoScrollTimersRef.current) window.clearTimeout(id)
    panelAutoScrollTimersRef.current = []

    // 1) відразу після коміту, 2) після розкладки, 3) після можливої підвантаженої іконки/шрифтів
    doScroll()
    const t1 = window.setTimeout(doScroll, 120)
    panelAutoScrollTimersRef.current = [t1]
    return () => {
      for (const id of panelAutoScrollTimersRef.current) window.clearTimeout(id)
      panelAutoScrollTimersRef.current = []
    }
  }, [panelActiveKey, menuCategories.length, scrollActiveChipIntoView, pathname, menuScrollHint, activeKey])

  const categoryClickRef = useRef<(key: string) => void>(() => {})
  categoryClickRef.current = (key: string) => {
    suppressPanelRestoreUntilRef.current = Date.now() + 320
    if (categoriesPanelRef.current) {
      scrollPositionRef.current = categoriesPanelRef.current.scrollLeft
    }
    dispatchCategoryStripSelect(key)
    scrollActiveChipIntoView(key)
  }

  const categoryHandlersByKey = useMemo(() => {
    const keys = [FULL_MENU_ALL_SLUG, ...menuCategories.map((c) => c.key)]
    const map = new Map<
      string,
      {
        onPointerEnter: () => void
        onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => void
        onPointerUp: (e: React.PointerEvent<HTMLButtonElement>) => void
        onPointerCancel: () => void
        onClick: (e: React.MouseEvent<HTMLButtonElement>) => void
        onKeyDown: (e: React.KeyboardEvent<HTMLButtonElement>) => void
      }
    >()
    for (const key of keys) {
      map.set(key, {
        onPointerEnter: () => prefetchFullMenuCategory(prefetchRouter, key),
        onPointerDown: (e) => {
          prefetchFullMenuCategory(prefetchRouter, key)
          categoryTapStartRef.current = { x: e.clientX, y: e.clientY }
          if (e.defaultPrevented || e.button !== 0 || e.pointerType === 'touch') return
          categoryPointerHandledRef.current = true
          categoryClickRef.current(key)
        },
        onPointerUp: (e) => {
          if (e.pointerType !== 'touch') return
          const start = categoryTapStartRef.current
          categoryTapStartRef.current = null
          if (start) {
            const dx = Math.abs(e.clientX - start.x)
            const dy = Math.abs(e.clientY - start.y)
            if (dx > 14 || dy > 14) return
          }
          e.preventDefault()
          e.stopPropagation()
          categoryPointerHandledRef.current = true
          categoryClickRef.current(key)
        },
        onPointerCancel: () => {
          categoryTapStartRef.current = null
        },
        onClick: (e) => {
          if (categoryPointerHandledRef.current) {
            categoryPointerHandledRef.current = false
            e.preventDefault()
            return
          }
          e.preventDefault()
          e.stopPropagation()
          categoryClickRef.current(key)
        },
        onKeyDown: (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            categoryClickRef.current(key)
          }
        },
      })
    }
    return map
  }, [menuCategories, prefetchRouter])

  const getCategoryHandlers = useCallback(
    (key: string) => categoryHandlersByKey.get(key)!,
    [categoryHandlersByKey],
  )

  const mv = t.menuView

  return (
    <>
      <div className="categories-panel-wrapper-web">
        <button
          type="button"
          className={`categories-scroll-btn-web categories-scroll-left-web ${!canScrollLeft ? 'categories-scroll-btn-hidden-web' : ''}`}
          onClick={(e) => {
            e.preventDefault()
            scrollPanelBy('left')
          }}
        >
          ‹
        </button>

        <div ref={categoriesPanelRef} className="categories-panel-web" onScroll={handleScroll}>
          <button
              key="full-menu-all"
              type="button"
              data-watta-cat={FULL_MENU_ALL_SLUG}
              data-prefetch-href={categoryPrefetchHref(FULL_MENU_ALL_SLUG)}
              className={`category-button-web ${panelActiveKey === FULL_MENU_ALL_SLUG ? 'category-button-active-web' : ''}`}
              {...getCategoryHandlers(FULL_MENU_ALL_SLUG)}
              onFocus={(e) => {
                e.currentTarget.blur()
              }}
              tabIndex={-1}
            >
              <div className="category-button-icon-web">
                <MenuUtensilsCrossedIcon size={18} strokeWidth={1.8} aria-hidden />
              </div>
              <span className="category-button-label-web">{mv.fullMenuAllTab}</span>
            </button>
          {menuCategories.map((category) => (
            <button
              key={category.key}
              type="button"
              data-watta-cat={category.key}
              data-prefetch-href={categoryPrefetchHref(category.key)}
              className={`category-button-web ${panelActiveKey === category.key ? 'category-button-active-web' : ''}`}
              {...getCategoryHandlers(category.key)}
              onFocus={(e) => {
                e.currentTarget.blur()
              }}
              tabIndex={-1}
            >
              <div className="category-button-icon-web">
                <MenuCategorySticker
                  variant="strip"
                  slug={category.key}
                  emoji={category.emoji}
                  imageUrl={category.imageUrl}
                  hoverImageUrl={category.hoverImageUrl}
                />
              </div>
              <span className="category-button-label-web">{category.name}</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          className={`categories-scroll-btn-web categories-scroll-right-web ${!canScrollRight ? 'categories-scroll-btn-hidden-web' : ''}`}
          onClick={(e) => {
            e.preventDefault()
            scrollPanelBy('right')
          }}
        >
          ›
        </button>
      </div>
    </>
  )
}

function WattaMenuCategoryStripWithSearch() {
  const searchParams = useSearchParams()
  return <WattaMenuCategoryStripInner menuCatQuery={searchParams.get('cat')} />
}

/** На головній та hero-сторінках — без Suspense; на `/menu` — лише для ?cat=. */
export function WattaMenuCategoryStrip() {
  const pathname = usePathname() || ''
  if (pathname === '/menu') {
    return (
      <Suspense fallback={<WattaMenuCategoryStripInner />}>
        <WattaMenuCategoryStripWithSearch />
      </Suspense>
    )
  }
  return <WattaMenuCategoryStripInner />
}
