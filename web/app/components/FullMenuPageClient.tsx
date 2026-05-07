'use client'

import { useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { useLanguage } from '../context/LanguageContext'
import { getApiUrl } from '@/lib/utils'
import { filterNonAggregateCategoryRows } from '@/lib/menuCategoryFilters'
import { getMenuCategoryDisplayName } from '@/lib/i18n/getMenuCategoryDisplayName'
import { bindHeroVideoAutoplay } from '@/lib/bindHeroVideoAutoplay'
import { bindHeroVideoMirrorToCanvas } from '@/lib/heroVideoMirrorToCanvas'
import { MENU_CATEGORY_EMOJI, MENU_CATEGORY_FALLBACK_SLUGS } from '@/lib/menuCategoryFallback'
import { WattaMenuProductCard } from './WattaMenuProductCard'

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

/** Псевдо-категорія «Усі» — показує весь каталог, скрол на початок сторінки меню */
const FULL_MENU_ALL_SLUG = '__all__'

/** Має збігатися з `WattaMenuCategoryStrip` — скрол до секції тільки після кліку по стрічці, не з головної «Подивитися всі». */
const MENU_SCROLL_TO_CAT_INTENT_KEY = 'watta_menu_scroll_to_cat'

/** Ті самі джерела, що на головній (`MenuView` → `HERO_VIDEO_SOURCES_MENU`) */
const HERO_VIDEO_SOURCES_MENU = [
  '/menu-hero-keeping-safe-road-ready.mp4',
  '/watta-sushi-2-hero.mp4',
  '/welcome.mp4',
] as const

export default function FullMenuPageClient() {
  const searchParams = useSearchParams()
  const { t, language, getLocalized } = useLanguage()
  const mv = t.menuView

  const [categories, setCategories] = useState<MenuCategoryRow[]>([])
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const scrollLockRef = useRef(false)
  /** Під `WattaPublicSiteChrome` (шапка + стрічка) — той самий візуальний блок, що на /product, /cart, … */
  const FULL_MENU_STICKY_RESERVE_PX = 180

  const [heroVideoFailed, setHeroVideoFailed] = useState(false)
  const [heroVideoSourceIndex, setHeroVideoSourceIndex] = useState(0)
  const heroVideoRef = useRef<HTMLVideoElement | null>(null)
  const heroVideoCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const heroVideoSrc =
    HERO_VIDEO_SOURCES_MENU[heroVideoSourceIndex] ?? HERO_VIDEO_SOURCES_MENU[0]

  const mapProductsToItems = useCallback(
    (data: unknown[]) =>
      (data || []).map((raw) => {
        const p = raw as Record<string, unknown>
        const cat = p.category as Record<string, unknown> | undefined
        return {
          id: Number(p.id),
          name: getLocalized(p as never, 'name'),
          description: getLocalized(p as never, 'description') || '',
          price: Number(p.price),
          category:
            getMenuCategoryDisplayName((cat || {}) as Record<string, unknown>, language, t.categories) || '—',
          categorySlug:
            (typeof cat?.slug === 'string' && cat.slug.trim()) ||
            (typeof p.categorySlug === 'string' && p.categorySlug.trim()) ||
            'misc',
          categoryId: Number(p.categoryId) || Number(cat?.id) || 0,
          emoji: '🍣',
          imageUrl: typeof p.imageUrl === 'string' ? p.imageUrl : undefined,
          isTop: p.isPopular === true,
          isHomeHit: p.isHomeHit === true,
          recommendOrder: typeof p.recommendOrder === 'number' ? p.recommendOrder : 0,
          allowRecommendations: (cat as { allowRecommendations?: boolean } | undefined)?.allowRecommendations !== false,
          promoDiscountPercent:
            typeof p.promoDiscountPercent === 'number' ? p.promoDiscountPercent : Number(p.promoDiscountPercent) || 0,
          rawCategoryName: typeof p.category === 'string' ? p.category : undefined,
        }
      }),
    [getLocalized, language, t.categories]
  )

  const loadCategories = useCallback(async () => {
    const fallbackRows: MenuCategoryRow[] = MENU_CATEGORY_FALLBACK_SLUGS.map((slug, idx) => ({
      id: idx + 1,
      slug,
      name: t.categories[slug] ?? slug,
      emoji: MENU_CATEGORY_EMOJI[slug],
      order: idx,
    }))
    try {
      const res = await fetch(getApiUrl('/api/products/categories'), { cache: 'no-store' })
      if (!res.ok) {
        setCategories(fallbackRows)
        return
      }
      const data = await res.json()
      const rows: MenuCategoryRow[] = (Array.isArray(data) ? data : [])
        .filter((cat: { isActive?: boolean }) => cat.isActive !== false)
        .map((cat: Record<string, unknown>) => {
          const name = getMenuCategoryDisplayName(cat, language, t.categories) || String(cat.name_ru ?? '')
          return {
            id: Number(cat.id) || 0,
            slug: String(cat.slug ?? ''),
            name,
            emoji: typeof cat.emoji === 'string' && cat.emoji ? String(cat.emoji) : '🍣',
            order: typeof cat.order === 'number' ? cat.order : 0,
          }
        })
        .filter((c) => c.slug.length > 0)
        .sort((a, b) => a.order - b.order)
      if (rows.length > 0) {
        setCategories(rows)
        return
      }
      setCategories(fallbackRows)
    } catch {
      setCategories(fallbackRows)
    }
  }, [language, t.categories])

  const loadProducts = useCallback(async () => {
    setLoading(true)
    try {
      const rawCity = typeof window !== 'undefined' ? localStorage.getItem('selectedCityId') : null
      const cityId = rawCity ? parseInt(rawCity, 10) : NaN
      const hasCity = Number.isFinite(cityId) && cityId > 0
      const scopedUrl = hasCity ? getApiUrl(`/api/products?cityId=${cityId}`) : getApiUrl('/api/products')
      const scopedRes = await fetch(scopedUrl, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      })
      const scopedData = scopedRes.ok ? await scopedRes.json() : []
      const scopedList = Array.isArray(scopedData) ? scopedData : []
      if (hasCity && scopedList.length === 0) {
        const fallbackRes = await fetch(getApiUrl('/api/products'), {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        })
        const fallbackData = fallbackRes.ok ? await fallbackRes.json() : []
        setItems(mapProductsToItems(Array.isArray(fallbackData) ? fallbackData : []))
      } else {
        setItems(mapProductsToItems(scopedList))
      }
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [mapProductsToItems])

  useEffect(() => {
    void loadCategories()
    void loadProducts()
  }, [loadCategories, loadProducts, language])

  useEffect(() => {
    if (heroVideoFailed) return
    const video = heroVideoRef.current
    const canvas = heroVideoCanvasRef.current
    if (!video || !canvas) return
    const stack = video.closest('.welcome-hero-video-stack-web')
    const offMirror = bindHeroVideoMirrorToCanvas(video, canvas)
    const offAutoplay = bindHeroVideoAutoplay(video, {
      extendedRetries: true,
      blockInteractionRoot: stack instanceof HTMLElement ? stack : null,
    })
    return () => {
      offMirror()
      offAutoplay()
    }
  }, [heroVideoSrc, heroVideoFailed])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const onProducts = () => void loadProducts()
    const onCity = () => void loadProducts()
    const onCat = () => void loadCategories()
    window.addEventListener('productsUpdated', onProducts)
    window.addEventListener('cityChanged', onCity)
    window.addEventListener('categoriesUpdated', onCat)
    return () => {
      window.removeEventListener('productsUpdated', onProducts)
      window.removeEventListener('cityChanged', onCity)
      window.removeEventListener('categoriesUpdated', onCat)
    }
  }, [loadProducts, loadCategories])

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
      if (c.id > 0) byId.set(c.id, c.slug)
      if (c.name) byName.set(normalize(c.name), c.slug)
    }
    for (const it of items) {
      let resolvedSlug = it.categorySlug
      if (!resolvedSlug || !categories.some((c) => c.slug === resolvedSlug)) {
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
      const list = m.get(resolvedSlug) ?? []
      list.push(it)
      m.set(resolvedSlug, list)
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
  }, [items])

  const visibleCategories = useMemo(() => {
    return categories.filter((c) => (itemsBySlug.get(c.slug)?.length ?? 0) > 0)
  }, [categories, itemsBySlug])

  /** Зсув для scroll-margin + поріг «Усі» — глобальна фіксована шапка (див. AppClient → WattaPublicSiteChrome) */
  const scrollPadTotal = FULL_MENU_STICKY_RESERVE_PX
  const scrollPadPx = `${scrollPadTotal}px`

  useEffect(() => {
    if (visibleCategories.length === 0) return

    const publishCategoryStrip = (slug: string) => {
      window.dispatchEvent(new CustomEvent('wattaMenuCategoryHighlight', { detail: { slug } }))
    }

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
          if (visibleCategories.some((c) => c.slug === urlCat)) {
            publishCategoryStrip(urlCat)
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

    window.addEventListener('scroll', syncActiveFromScroll, { passive: true })
    window.addEventListener('resize', syncActiveFromScroll)
    const id = window.requestAnimationFrame(syncActiveFromScroll)
    return () => {
      window.cancelAnimationFrame(id)
      window.removeEventListener('scroll', syncActiveFromScroll)
      window.removeEventListener('resize', syncActiveFromScroll)
    }
  }, [visibleCategories, scrollPadTotal])

  const scrollToCategory = useCallback((slug: string) => {
    scrollLockRef.current = true
    window.dispatchEvent(new CustomEvent('wattaMenuCategoryHighlight', { detail: { slug } }))
    if (slug === FULL_MENU_ALL_SLUG) {
      const topEl = document.getElementById('full-menu-page-start')
      topEl?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else {
      const el = document.getElementById(`full-menu-section-${slug}`)
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    window.setTimeout(() => {
      scrollLockRef.current = false
    }, 700)
  }, [])

  /** Скрол до секції лише після кліку в стрічці категорій (див. sessionStorage key у WattaMenuCategoryStrip). */
  useEffect(() => {
    if (loading || visibleCategories.length === 0) return
    if (typeof window === 'undefined') return
    const raw = searchParams.get('cat')?.trim()
    if (!raw) return
    if (!visibleCategories.some((c) => c.slug === raw)) return
    let intent: string | null = null
    try {
      intent = sessionStorage.getItem(MENU_SCROLL_TO_CAT_INTENT_KEY)?.trim() ?? null
    } catch {
      intent = null
    }
    if (intent !== raw) return
    try {
      sessionStorage.removeItem(MENU_SCROLL_TO_CAT_INTENT_KEY)
    } catch {
      /* ignore */
    }
    const id = window.setTimeout(() => {
      scrollToCategory(raw)
    }, 120)
    return () => window.clearTimeout(id)
  }, [loading, searchParams, visibleCategories, scrollToCategory])

  const addToCart = useCallback(
    (item: MenuItem) => {
      if (typeof window === 'undefined' || !window.localStorage) return
      const cart = JSON.parse(localStorage.getItem('cart') || '[]')
      const n = cart.filter((x: { id?: number }) => x?.id === item.id).length
      if (n >= 99) {
        toast.error(t.appToasts.maxCartQty)
        return
      }
      cart.push(item)
      localStorage.setItem('cart', JSON.stringify(cart))
      window.dispatchEvent(new CustomEvent('cartUpdated'))
      toast.success(t.addToCart)
    },
    [t.addToCart]
  )

  return (
    <div className="watta-full-menu-page menu-page-web watta-page-bg flex w-full max-w-[100vw] flex-1 flex-col overflow-x-clip">
      <div className="watta-full-menu-intro mb-10 sm:mb-12">
        <section
          className="welcome-hero-section-web menu-snap-section-welcome-web menu-welcome-hero-tight-web"
          aria-label={mv.fullMenuTitle}
        >
          <div className="welcome-hero-video-fill-web">
            {heroVideoFailed ? (
              <div
                className="welcome-video-native-web welcome-hero-fallback-image-web"
                style={{ backgroundImage: "url('/watta-sushi.jpg')" }}
                role="img"
                aria-hidden
              />
            ) : (
              <div className="welcome-hero-video-stack-web h-full w-full min-h-0">
                <video
                  key={heroVideoSrc}
                  ref={heroVideoRef}
                  className="welcome-video-native-web welcome-hero-video-source-for-canvas-web"
                  autoPlay
                  muted
                  loop
                  playsInline
                  controls={false}
                  disablePictureInPicture
                  preload="auto"
                  tabIndex={-1}
                  aria-hidden
                  onContextMenu={(e) => e.preventDefault()}
                  onError={() => {
                    setHeroVideoSourceIndex((prev) => {
                      if (prev < HERO_VIDEO_SOURCES_MENU.length - 1) return prev + 1
                      setHeroVideoFailed(true)
                      return prev
                    })
                  }}
                  onEnded={(e) => {
                    const el = e.currentTarget
                    el.currentTime = 0
                    void el.play()
                  }}
                >
                  <source src={heroVideoSrc} type="video/mp4" />
                </video>
                <canvas
                  ref={heroVideoCanvasRef}
                  className="welcome-hero-video-canvas-mirror-web"
                  aria-hidden
                />
                <div
                  className="welcome-hero-video-input-shield-web"
                  aria-hidden
                  role="presentation"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  onAuxClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  onDoubleClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                />
              </div>
            )}
          </div>
        </section>
      </div>

      <div
        id="full-menu-page-start"
        style={{ scrollMarginTop: scrollPadPx }}
        className="relative z-[1] mx-auto max-w-[1800px] px-3 pb-16 pt-5 sm:px-6 sm:pb-20 sm:pt-7"
      >
        {loading ? (
          <p className="py-20 text-center text-base font-semibold text-[#145142]">{mv.fullMenuLoading}</p>
        ) : visibleCategories.length === 0 && items.length === 0 ? (
          <p className="py-20 text-center text-[#1a2e28]/65">{mv.fullMenuEmpty}</p>
        ) : (
          <div className="flex flex-col gap-14 sm:gap-16">
            {(visibleCategories.length > 0
              ? visibleCategories.map((cat) => ({ cat, list: itemsBySlug.get(cat.slug) ?? [] }))
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
                  className="watta-full-menu-section"
                >
                  <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-[#145142]/14 pb-4">
                    <h2 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-[#0f241e] sm:gap-3 sm:text-3xl">
                      <span
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_0_0_1px_rgba(20,81,66,0.08)] sm:h-12 sm:w-12 sm:text-[1.75rem]"
                        aria-hidden
                      >
                        {cat.emoji}
                      </span>
                      <span className="leading-tight">{cat.name}</span>
                    </h2>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#145142]/80 ring-1 ring-[#145142]/12 sm:text-sm">
                      {list.length} {mv.itemsCount}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
                    {list.map((item) => (
                      <WattaMenuProductCard
                        key={item.id}
                        variant="grid"
                        product={item}
                        onAddToCart={() => addToCart(item)}
                      />
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
