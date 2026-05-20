'use client'

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMenuAddToCart } from '@/hooks/useMenuAddToCart'
import type { WattaMenuProductCardModel } from './WattaMenuProductCard'
import { useLanguage } from '../context/LanguageContext'
import { getApiUrl } from '@/lib/utils'
import { fetchPublicApi, fetchPublicApiFresh } from '@/lib/publicApiFetch'
import { useWattaCatalogSync } from '@/hooks/useWattaCatalogSync'
import { getMenuCategoryDisplayName } from '@/lib/i18n/getMenuCategoryDisplayName'
import { bindHeroVideoAutoplay } from '@/lib/bindHeroVideoAutoplay'
import { getHeroVideoTouchLikeViewport } from '@/lib/heroVideoNativeDesktop'
import { WATTA_FULL_MENU_PAGE_HERO_VIDEO_SOURCES } from '@/lib/wattaHeroVideo'
import { MENU_CATEGORY_EMOJI, MENU_CATEGORY_FALLBACK_SLUGS } from '@/lib/menuCategoryFallback'
import { WATTA_MENU_REQUEST_SCROLL_TO_CAT, FULL_MENU_ALL_SLUG } from '@/lib/fullMenuCategoryNav'
import { filterNonAggregateCategoryRows } from '@/lib/menuCategoryFilters'
import { readCityIdForProductApi } from '@/lib/wattaSiteLocalePrefs'
import { menuItemsSessionKey } from '@/lib/i18n/menuDataCacheBust'
import { productGalleryFromApi } from '@/lib/productGallery'
import { createRafScrollListener, publishMenuCategoryHighlight } from '@/lib/scrollSync'
import { MenuHighlightStack } from './MenuHighlightStack'
import { WattaMenuProductCard } from './WattaMenuProductCard'
import WattaHeroMarqueeBar from './WattaHeroMarqueeBar'
import WelcomeHeroSection from './WelcomeHeroSection'
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

function coerceProductsArray(body: unknown): unknown[] {
  if (Array.isArray(body)) return body
  if (body && typeof body === 'object') {
    const o = body as Record<string, unknown>
    const nested = o.products ?? o.data
    if (Array.isArray(nested)) return nested
  }
  return []
}

/** Єдиний регістр slug — інакше товари з `Rolls` vs категорія `rolls` не потрапляють у секції. */
function normMenuSlug(s: string): string {
  const t = s.trim().toLowerCase()
  return t.length > 0 ? t : 'misc'
}

export default function FullMenuPageClient() {
  const router = useRouter()
  const { t, language, getLocalized } = useLanguage()
  const mv = t.menuView
  const cf = t.cinematicFooter
  const wf = t.productDetail.weightFallback
  const pf = t.productDetail.piecesFallback

  const [categories, setCategories] = useState<MenuCategoryRow[]>([])
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const scrollLockRef = useRef(false)
  /** Під `WattaPublicSiteChrome` (шапка + стрічка) — той самий візуальний блок, що на /product, /cart, … */
  const FULL_MENU_STICKY_RESERVE_PX = 180

  const [heroVideoFailed, setHeroVideoFailed] = useState(false)
  const [heroVideoSourceIndex, setHeroVideoSourceIndex] = useState(0)
  const heroVideoRef = useRef<HTMLVideoElement | null>(null)
  const heroVideoSrc =
    WATTA_FULL_MENU_PAGE_HERO_VIDEO_SOURCES[heroVideoSourceIndex] ??
    WATTA_FULL_MENU_PAGE_HERO_VIDEO_SOURCES[0]

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
  const highlightLayout = isNarrowViewport ? 'stack' : 'rail'

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

  const loadCategories = useCallback(async () => {
    const fallbackRows: MenuCategoryRow[] = MENU_CATEGORY_FALLBACK_SLUGS.map((slug, idx) => ({
      id: idx + 1,
      slug,
      name: t.categories[slug] ?? slug,
      emoji: MENU_CATEGORY_EMOJI[slug],
      order: idx,
    }))
    try {
      const res = await fetchPublicApi(getApiUrl('/api/products/categories'))
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
            slug: normMenuSlug(String(cat.slug ?? '')),
            name,
            emoji: typeof cat.emoji === 'string' && cat.emoji ? String(cat.emoji) : '🍣',
            order: typeof cat.order === 'number' ? cat.order : 0,
          }
        })
        .filter((c) => c.slug.length > 0)
        .sort((a, b) => a.order - b.order)
      if (rows.length > 0) {
        setCategories(filterNonAggregateCategoryRows(rows))
        return
      }
      setCategories(fallbackRows)
    } catch {
      setCategories(fallbackRows)
    }
  }, [language, t.categories])

  const loadProducts = useCallback(async (fresh = false) => {
    const cityId = typeof window !== 'undefined' ? readCityIdForProductApi() : null
    const hasCity = cityId != null && cityId > 0
    const scopedUrl = hasCity ? getApiUrl(`/api/products?cityId=${cityId}`) : getApiUrl('/api/products')
    const cacheKey = menuItemsSessionKey(cityId)
    const CACHE_TTL = 5 * 60 * 1000
    const now = Date.now()
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
            if (now - parseInt(cacheTime, 10) < CACHE_TTL) {
              void (async () => {
                try {
                  const res = await fetchFn(scopedUrl)
                  if (!res.ok) return
                  const body: unknown = await res.json()
                  let list = coerceProductsArray(body)
                  if (hasCity && list.length === 0) {
                    const fallback = await fetchFn(getApiUrl('/api/products'))
                    if (fallback.ok) {
                      list = coerceProductsArray(await fallback.json())
                    }
                  }
                  if (list.length > 0) {
                    sessionStorage.setItem(cacheKey, JSON.stringify(list))
                    sessionStorage.setItem(`${cacheKey}_time`, String(Date.now()))
                    setItems(mapProductsToItems(list))
                  }
                } catch {
                  /* keep cached list */
                }
              })()
              return
            }
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
      if (list.length === 0) {
        await new Promise((r) => setTimeout(r, 80))
        list = await fetchProductList(scopedUrl)
      }
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
  }, [mapProductsToItems])

  useEffect(() => {
    void loadCategories()
    void loadProducts()
  }, [loadCategories, loadProducts, language])

  /** До paint: одразу muted play — менше «порожнього» першого кадру поруч із preload у layout. */
  useLayoutEffect(() => {
    if (heroVideoFailed) return
    const video = heroVideoRef.current
    if (!video) return
    try {
      video.defaultMuted = true
      video.muted = true
      video.volume = 0
      video.playsInline = true
      video.preload = 'auto'
      void video.play().catch(() => {})
    } catch {
      /* ignore */
    }
  }, [heroVideoSrc, heroVideoFailed])

  useEffect(() => {
    if (heroVideoFailed) return
    const video = heroVideoRef.current
    if (!video) return
    const stack = video.closest('.welcome-hero-video-stack-web')
    const offAutoplay = bindHeroVideoAutoplay(video, {
      extendedRetries: true,
      blockInteractionRoot:
        !getHeroVideoTouchLikeViewport() && stack instanceof HTMLElement ? stack : null,
      loop: WATTA_FULL_MENU_PAGE_HERO_VIDEO_SOURCES.length <= 1,
    })
    return () => offAutoplay()
  }, [heroVideoSrc, heroVideoFailed])

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

  const scrollToCategory = useCallback((slug: string) => {
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
      scroller.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })

      window.setTimeout(() => {
        scrollLockRef.current = false
      }, 700)
    }

    const el = findTarget()
    if (el) {
      scrollEl(el)
      return
    }
    requestAnimationFrame(() => {
      const late = findTarget()
      if (late) scrollEl(late)
    })
  }, [])

  useEffect(() => {
    const onScrollRequest = (ev: Event) => {
      const slug = (ev as CustomEvent<{ slug?: string }>).detail?.slug?.trim()
      if (!slug) return
      scrollToCategory(slug)
    }
    window.addEventListener(WATTA_MENU_REQUEST_SCROLL_TO_CAT, onScrollRequest)
    return () => window.removeEventListener(WATTA_MENU_REQUEST_SCROLL_TO_CAT, onScrollRequest)
  }, [scrollToCategory])

  /** Перехід на `/menu?cat=` з іншої сторінки: після завантаження каталогу — одразу до секції. */
  useEffect(() => {
    if (loading || visibleCategories.length === 0) return
    let urlCat: string | null = null
    try {
      urlCat = new URLSearchParams(window.location.search).get('cat')?.trim() || null
    } catch {
      return
    }
    if (!urlCat || urlCat === FULL_MENU_ALL_SLUG) return
    if (!visibleCategories.some((c) => normMenuSlug(c.slug) === normMenuSlug(urlCat!))) return
    const id = requestAnimationFrame(() => {
      if (scrollLockRef.current) return
      scrollToCategory(urlCat!)
    })
    return () => cancelAnimationFrame(id)
  }, [loading, visibleCategories, scrollToCategory])

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

  const menuNewItems = useMemo(
    () =>
      items
        .filter((i) => i.isMenuNew === true && i.allowRecommendations !== false)
        .sort((a, b) => b.id - a.id),
    [items],
  )

  const showHighlightStacks = menuNewItems.length > 0

  const fullMenuHeroBlock = (
    <div
      className={`watta-full-menu-intro flex min-h-0 shrink-0 flex-col ${showHighlightStacks ? 'mb-3 sm:mb-4' : 'mb-0'} min-[1025px]:mb-3`}
    >
        <WelcomeHeroSection
          heroVideoFailed={heroVideoFailed}
          setHeroVideoSourceIndex={setHeroVideoSourceIndex}
          setHeroVideoFailed={setHeroVideoFailed}
          heroVideoRef={heroVideoRef}
          heroVideoSrc={heroVideoSrc}
          videoSources={WATTA_FULL_MENU_PAGE_HERO_VIDEO_SOURCES}
          playlistLength={WATTA_FULL_MENU_PAGE_HERO_VIDEO_SOURCES.length}
          ariaLabel={`${mv.fullMenuIntroHeadlineLead} — ${mv.fullMenuIntroHeadlineMark}`}
        >
          <div className="home-hero-after-marquee-wrap-web home-hero-marquee-over-video-web pointer-events-none absolute inset-x-0 bottom-0 z-[25] w-full">
            <WattaHeroMarqueeBar />
          </div>
      </WelcomeHeroSection>
    </div>
  )

  const fullMenuIntroBlock = (
    <section
      id="menu-page-after-hero-intro"
      className="home-after-hero-intro-web menu-after-welcome-web relative z-[2] w-full max-w-[100vw] shrink-0"
      aria-labelledby="menu-page-after-hero-intro-title"
    >
      <div className="home-after-hero-intro-inner-web home-after-hero-intro-inner-web--home-menu relative z-[1] mx-auto max-w-7xl px-6 pb-5 pt-6 sm:px-9 sm:pb-6 sm:pt-7 md:px-12 md:pb-8">
        <DeliveryHeroCopy
          titleId="menu-page-after-hero-intro-title"
          kicker={mv.fullMenuIntroKicker}
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
    <div className="watta-full-menu-page menu-page-web watta-page-bg flex min-h-full w-full max-w-[100vw] min-w-0 flex-1 flex-col">
      <div
        className={`watta-full-menu-top-stack w-full shrink-0 ${isNarrowViewport ? 'watta-full-menu-top-stack--intro-first' : ''}`}
      >
        {isNarrowViewport ? (
          <>
            {fullMenuIntroBlock}
            {fullMenuHeroBlock}
          </>
        ) : (
          <>
            {fullMenuHeroBlock}
            {fullMenuIntroBlock}
          </>
        )}
      </div>

      {showHighlightStacks ? (
        <div
          id="menu-cinematic-block"
          className="menu-snap-section-cinematic-web menu-cinematic-block--ribbon w-full shrink-0"
        >
          <MenuHighlightStack
            title={cf.sectionNewInMenu}
            lead={cf.sectionNewInMenuLead}
            ariaLabel={cf.sectionNewInMenu}
            items={menuNewItems}
            weightFallback={wf}
            piecesFallback={pf}
            onAddToCart={addToCart}
            layout={highlightLayout}
          />
        </div>
      ) : null}

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
                    <div className="grid grid-cols-2 items-start gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
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
                              {list.length} {mv.itemsCount}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 items-start gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
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
  )
}
