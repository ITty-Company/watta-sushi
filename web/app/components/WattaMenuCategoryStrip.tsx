'use client'

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useLanguage } from '../context/LanguageContext'
import { buildMenuCategoriesFromApi, parseCategoriesCacheJson } from '@/lib/buildMenuCategoriesFromApi'
import { menuCategoriesSessionKey } from '@/lib/i18n/menuDataCacheBust'
import { MENU_CATEGORY_EMOJI, MENU_CATEGORY_FALLBACK_SLUGS } from '@/lib/menuCategoryFallback'
import { WATTA_MENU_REQUEST_SCROLL_TO_CAT, FULL_MENU_ALL_SLUG, WATTA_HOME_REQUEST_SCROLL_TO_CAT } from '@/lib/fullMenuCategoryNav'
import { getApiUrl } from '@/lib/utils'

type MenuCategory = {
  id: string
  key: string
  slug?: string
  name: string
  emoji: string
  subcategories: { id: string; name: string; items: unknown[] }[]
}

/**
 * Горизонтальні категорії як на головній.
 * Підсвічування: URL (/menu?cat=, /menu/category/…, /product/:id), скрол на /menu та на головній (події з FullMenuPageClient / MenuView).
 */
function WattaMenuCategoryStripInner() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
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
  const productReqRef = useRef(0)

  /** Підсвічування: на /menu та / — підказка зі скролу; інакше URL або slug з картки товару. */
  const activeKey = (() => {
    if ((pathname === '/menu' || pathname === '/') && menuScrollHint != null) return menuScrollHint
    if (urlHighlight != null) return urlHighlight
    if (productHighlight != null) return productHighlight
    return ''
  })()

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
        setUrlHighlight(decodeURIComponent(raw).trim() || null)
      } catch {
        setUrlHighlight(raw.trim() || null)
      }
      return
    }
    if (p === '/menu') {
      const c = searchParams.get('cat')?.trim()
      if (c) {
        setUrlHighlight(c)
      } else {
        setUrlHighlight(FULL_MENU_ALL_SLUG)
      }
      return
    }
    const pm = p.match(/^\/product\/(\d+)$/)
    if (pm) {
      const id = pm[1]
      const my = ++productReqRef.current
      setUrlHighlight(null)
      fetch(getApiUrl(`/api/products/${id}`))
        .then((r) => (r.ok ? r.json() : null))
        .then((data: { category?: { slug?: string } } | null) => {
          if (my !== productReqRef.current) return
          const slug = data?.category?.slug
          setProductHighlight(typeof slug === 'string' && slug.trim() ? slug.trim() : null)
        })
        .catch(() => {
          if (my !== productReqRef.current) return
          setProductHighlight(null)
        })
      return
    }
    setUrlHighlight(null)
  }, [pathname, searchParams])

  useEffect(() => {
    const h = (ev: Event) => {
      const p = pathname || ''
      if (p !== '/menu' && p !== '/') return
      const slug = (ev as CustomEvent<{ slug?: string }>).detail?.slug
      if (typeof slug === 'string' && slug) {
        setMenuScrollHint(slug)
      }
    }
    window.addEventListener('wattaMenuCategoryHighlight', h)
    return () => window.removeEventListener('wattaMenuCategoryHighlight', h)
  }, [pathname])

  const loadCategories = useCallback(() => {
    const cacheKey = menuCategoriesSessionKey()
    const cached = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(cacheKey) : null
    const cacheTime = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(`${cacheKey}_time`) : null
    const now = Date.now()
    const CACHE_TTL = 5 * 60 * 1000

    const mapApi = (data: Record<string, unknown>[]) =>
      buildMenuCategoriesFromApi(data, language, t.categories as Record<string, string>)

    const applyCategories = (categories: MenuCategory[]) => {
      setMenuCategories(categories)
    }

    if (cached && cacheTime && (now - parseInt(cacheTime, 10)) < CACHE_TTL) {
      const raw = parseCategoriesCacheJson(cached)
      if (raw) {
        applyCategories(mapApi(raw))
        fetch('/api/products/categories', { cache: 'no-store' })
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

    fetch('/api/products/categories', { cache: 'no-store' })
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
  }, [fallbackCategories, language, t.categories])

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

  useEffect(() => {
    const panel = categoriesPanelRef.current
    if (!panel) return
    const savedPosition = scrollPositionRef.current
    const restorePosition = () => {
      if (!panel || isUserScrollingRef.current) return
      const currentScroll = panel.scrollLeft
      if (savedPosition > 0 && Math.abs(currentScroll - savedPosition) > 5) {
        panel.scrollLeft = savedPosition
      }
    }
    if (restorePositionTimeoutRef.current) clearTimeout(restorePositionTimeoutRef.current)
    restorePositionTimeoutRef.current = setTimeout(restorePosition, 50)
    const t1 = setTimeout(restorePosition, 100)
    const t2 = setTimeout(restorePosition, 250)
    const t3 = setTimeout(restorePosition, 500)
    return () => {
      if (restorePositionTimeoutRef.current) clearTimeout(restorePositionTimeoutRef.current)
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [activeKey, menuCategories])

  useEffect(() => {
    const panel = categoriesPanelRef.current
    if (!panel) return
    checkScrollButtons(panel)
    const t1 = setTimeout(() => checkScrollButtons(panel), 100)
    const t2 = setTimeout(() => checkScrollButtons(panel), 400)
    const ro = new ResizeObserver(() => checkScrollButtons(panel))
    ro.observe(panel)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      ro.disconnect()
    }
  }, [menuCategories.length, activeKey, checkScrollButtons])

  /** Головна: після вибору категорії — прокрутити відповідний чіп у панелі в видиму зону */
  useEffect(() => {
    const p = pathname || ''
    if (p !== '/' && p !== '') return
    const scrollChip = (ev: Event) => {
      const slug = (ev as CustomEvent<{ slug?: string }>).detail?.slug?.trim()
      if (!slug) return
      requestAnimationFrame(() => {
        const panel = categoriesPanelRef.current
        if (!panel) return
        const safe =
          typeof CSS !== 'undefined' && typeof CSS.escape === 'function' ? CSS.escape(slug) : slug.replace(/"/g, '\\"')
        panel.querySelector<HTMLElement>(`[data-watta-cat="${safe}"]`)?.scrollIntoView({
          behavior: 'smooth',
          inline: 'nearest',
          block: 'nearest',
        })
      })
    }
    window.addEventListener(WATTA_HOME_REQUEST_SCROLL_TO_CAT, scrollChip as EventListener)
    return () => window.removeEventListener(WATTA_HOME_REQUEST_SCROLL_TO_CAT, scrollChip as EventListener)
  }, [pathname])

  /** /menu — те саме після запиту скролу до секції */
  useEffect(() => {
    if (pathname !== '/menu') return
    const scrollChip = (ev: Event) => {
      const slug = (ev as CustomEvent<{ slug?: string }>).detail?.slug?.trim()
      if (!slug) return
      requestAnimationFrame(() => {
        const panel = categoriesPanelRef.current
        if (!panel) return
        const safe =
          typeof CSS !== 'undefined' && typeof CSS.escape === 'function' ? CSS.escape(slug) : slug.replace(/"/g, '\\"')
        panel.querySelector<HTMLElement>(`[data-watta-cat="${safe}"]`)?.scrollIntoView({
          behavior: 'smooth',
          inline: 'nearest',
          block: 'nearest',
        })
      })
    }
    window.addEventListener(WATTA_MENU_REQUEST_SCROLL_TO_CAT, scrollChip as EventListener)
    return () => window.removeEventListener(WATTA_MENU_REQUEST_SCROLL_TO_CAT, scrollChip as EventListener)
  }, [pathname])

  const scrollPanelBy = (direction: 'left' | 'right') => {
    const panel = categoriesPanelRef.current
    if (!panel) return
    const amount = panel.clientWidth * 0.7
    panel.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' })
    ;[150, 350, 550].forEach((ms) => setTimeout(() => checkScrollButtons(panel), ms))
  }

  const onCategoryClick = (key: string) => {
    if (categoriesPanelRef.current) {
      scrollPositionRef.current = categoriesPanelRef.current.scrollLeft
    }
    const p = pathname || ''
    if (p === '/menu') {
      if (key === FULL_MENU_ALL_SLUG) {
        router.push('/menu')
      } else {
        router.push(`/menu?cat=${encodeURIComponent(key)}`)
      }
      /* Після `router.push` — після коміту React/Next, інакше слухач у FullMenuPageClient інколи не встигає / DOM ще старий */
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.dispatchEvent(
            new CustomEvent(WATTA_MENU_REQUEST_SCROLL_TO_CAT, { detail: { slug: key } }),
          )
        })
      })
      return
    }
    if (p === '/' || p === '') {
      window.dispatchEvent(new CustomEvent(WATTA_HOME_REQUEST_SCROLL_TO_CAT, { detail: { slug: key } }))
      return
    }
    router.push(`/menu/category/${encodeURIComponent(key)}`)
  }

  const onFullMenu = pathname === '/menu'
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
          {onFullMenu ? (
            <button
              key="full-menu-all"
              type="button"
              data-watta-cat={FULL_MENU_ALL_SLUG}
              className={`category-button-web ${activeKey === FULL_MENU_ALL_SLUG ? 'category-button-active-web' : ''}`}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onCategoryClick(FULL_MENU_ALL_SLUG)
              }}
              onMouseDown={(e) => {
                e.preventDefault()
                if (categoriesPanelRef.current) {
                  scrollPositionRef.current = categoriesPanelRef.current.scrollLeft
                }
              }}
              onFocus={(e) => {
                e.preventDefault()
                e.currentTarget.blur()
              }}
              tabIndex={-1}
              style={{ scrollMargin: 0, scrollPadding: 0, outline: 'none' }}
            >
              <div className="category-button-icon-web" aria-hidden>
                🍱
              </div>
              <span className="category-button-label-web">{mv.fullMenuAllTab}</span>
            </button>
          ) : null}
          {menuCategories.map((category) => (
            <button
              key={category.key}
              type="button"
              data-watta-cat={category.key}
              className={`category-button-web ${activeKey === category.key ? 'category-button-active-web' : ''}`}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onCategoryClick(category.key)
              }}
              onMouseDown={(e) => {
                e.preventDefault()
                if (categoriesPanelRef.current) {
                  scrollPositionRef.current = categoriesPanelRef.current.scrollLeft
                }
              }}
              onFocus={(e) => {
                e.preventDefault()
                e.currentTarget.blur()
              }}
              tabIndex={-1}
              style={{ scrollMargin: 0, scrollPadding: 0, outline: 'none' }}
            >
              <div className="category-button-icon-web">{category.emoji}</div>
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
      <div className="categories-panel-spacer-web" aria-hidden />
    </>
  )
}

export function WattaMenuCategoryStrip() {
  return (
    <Suspense fallback={null}>
      <WattaMenuCategoryStripInner />
    </Suspense>
  )
}
