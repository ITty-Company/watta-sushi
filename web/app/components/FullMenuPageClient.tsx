'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { useLanguage } from '../context/LanguageContext'
import { getApiUrl } from '@/lib/utils'
import { filterNonAggregateCategoryRows } from '@/lib/menuCategoryFilters'
import WattaGlobalSiteHeader from './WattaGlobalSiteHeader'
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
  promoDiscountPercent?: number
}

interface MenuCategoryRow {
  slug: string
  name: string
  emoji: string
  order: number
}

/** Псевдо-категорія «Усі» — показує весь каталог, скрол на початок сторінки меню */
const FULL_MENU_ALL_SLUG = '__all__'

/** Ті самі джерела, що на головній (`MenuView` → `HERO_VIDEO_SOURCES_MENU`) */
const HERO_VIDEO_SOURCES_MENU = ['/watta-sushi-2-hero.mp4', '/welcome.mp4'] as const

export default function FullMenuPageClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t, language, getLocalized } = useLanguage()
  const mv = t.menuView

  const [categories, setCategories] = useState<MenuCategoryRow[]>([])
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeSlug, setActiveSlug] = useState<string>(FULL_MENU_ALL_SLUG)
  const scrollLockRef = useRef(false)
  const stripRef = useRef<HTMLDivElement>(null)
  const stickyChromeRef = useRef<HTMLDivElement>(null)
  /** Висота шапки + панелі категорій для scroll-margin та підсвітки активної вкладки */
  const [stickyChromeH, setStickyChromeH] = useState(148)
  const activeBtnRef = useRef<HTMLButtonElement | null>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const [heroVideoFailed, setHeroVideoFailed] = useState(false)
  const [heroVideoSourceIndex, setHeroVideoSourceIndex] = useState(0)
  const heroVideoRef = useRef<HTMLVideoElement | null>(null)
  const heroVideoSrc =
    HERO_VIDEO_SOURCES_MENU[heroVideoSourceIndex] ?? HERO_VIDEO_SOURCES_MENU[0]

  const checkScrollButtons = useCallback((el: HTMLElement) => {
    const threshold = 5
    setCanScrollLeft(el.scrollLeft > threshold)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - threshold)
  }, [])

  const handleStripScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      checkScrollButtons(e.currentTarget)
    },
    [checkScrollButtons],
  )

  const scrollStripBy = useCallback(
    (dir: 'left' | 'right') => {
      const el = stripRef.current
      if (!el) return
      const step = el.clientWidth * 0.72
      el.scrollBy({ left: dir === 'left' ? -step : step, behavior: 'smooth' })
      ;[120, 320, 520].forEach((ms) => setTimeout(() => checkScrollButtons(el), ms))
    },
    [checkScrollButtons],
  )

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
          category: getLocalized((cat || {}) as never, 'name') || '—',
          categorySlug: String((cat?.slug as string | undefined) || 'misc'),
          categoryId: Number(p.categoryId),
          emoji: '🍣',
          imageUrl: typeof p.imageUrl === 'string' ? p.imageUrl : undefined,
          isTop: p.isPopular === true,
          promoDiscountPercent:
            typeof p.promoDiscountPercent === 'number' ? p.promoDiscountPercent : Number(p.promoDiscountPercent) || 0,
        }
      }),
    [getLocalized]
  )

  const loadCategories = useCallback(async () => {
    try {
      const res = await fetch(getApiUrl('/api/products/categories'))
      if (!res.ok) return
      const data = await res.json()
      const rows: MenuCategoryRow[] = (Array.isArray(data) ? data : [])
        .filter((cat: { isActive?: boolean }) => cat.isActive !== false)
        .map((cat: Record<string, unknown>) => {
          const name =
            language === 'uk' && cat.name_ua
              ? String(cat.name_ua)
              : language === 'en' && cat.name_en
                ? String(cat.name_en)
                : language === 'nl' && cat.name_nl
                  ? String(cat.name_nl)
                  : String(cat.name_ru ?? '')
          return {
            slug: String(cat.slug ?? ''),
            name,
            emoji: typeof cat.emoji === 'string' && cat.emoji ? String(cat.emoji) : '🍣',
            order: typeof cat.order === 'number' ? cat.order : 0,
          }
        })
        .filter((c) => c.slug.length > 0)
        .sort((a, b) => a.order - b.order)
      setCategories(rows)
    } catch {
      setCategories([])
    }
  }, [language])

  const loadProducts = useCallback(async () => {
    setLoading(true)
    try {
      const rawCity = typeof window !== 'undefined' ? localStorage.getItem('selectedCityId') : null
      const cityId = rawCity ? parseInt(rawCity, 10) : NaN
      const url =
        Number.isFinite(cityId) && cityId > 0
          ? getApiUrl(`/api/products?cityId=${cityId}`)
          : getApiUrl('/api/products')
      const res = await fetch(url, { headers: { 'Cache-Control': 'max-age=120' } })
      const data = res.ok ? await res.json() : []
      setItems(mapProductsToItems(Array.isArray(data) ? data : []))
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [mapProductsToItems])

  useEffect(() => {
    void loadCategories()
  }, [loadCategories])

  useEffect(() => {
    void loadProducts()
  }, [loadProducts, language])

  useEffect(() => {
    if (heroVideoFailed) return
    const video = heroVideoRef.current
    if (!video) return

    const safePlay = () => {
      const p = video.play()
      if (p && typeof p.catch === 'function') {
        p.catch(() => {})
      }
    }

    if (video.readyState >= 2) safePlay()
    const t = window.setTimeout(safePlay, 120)
    const onCanPlay = () => safePlay()
    const onLoadedData = () => safePlay()
    const onPageShow = () => safePlay()
    const onVisibility = () => {
      if (document.visibilityState === 'visible') safePlay()
    }

    video.addEventListener('canplay', onCanPlay)
    video.addEventListener('loadeddata', onLoadedData)
    window.addEventListener('pageshow', onPageShow)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      window.clearTimeout(t)
      video.removeEventListener('canplay', onCanPlay)
      video.removeEventListener('loadeddata', onLoadedData)
      window.removeEventListener('pageshow', onPageShow)
      document.removeEventListener('visibilitychange', onVisibility)
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
    for (const it of items) {
      const list = m.get(it.categorySlug) ?? []
      list.push(it)
      m.set(it.categorySlug, list)
    }
    return m
  }, [items])

  const visibleCategories = useMemo(() => {
    return categories.filter((c) => (itemsBySlug.get(c.slug)?.length ?? 0) > 0)
  }, [categories, itemsBySlug])

  /** Зсув для scroll-margin + поріг «Усі» — sticky-блок + зазор під ним */
  const scrollPadTotal = stickyChromeH + 16
  const scrollPadPx = `${scrollPadTotal}px`

  useLayoutEffect(() => {
    const el = stickyChromeRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const measure = () => {
      const h = Math.ceil(el.getBoundingClientRect().height)
      if (h < 24) return
      const next = h + 12
      setStickyChromeH((prev) => (Math.abs(prev - next) > 2 ? next : prev))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [visibleCategories.length, loading])

  useEffect(() => {
    if (visibleCategories.length === 0) return

    const syncActiveFromScroll = () => {
      if (scrollLockRef.current) return
      const firstSlug = visibleCategories[0]?.slug
      if (!firstSlug) return
      const firstEl = document.getElementById(`full-menu-section-${firstSlug}`)
      if (!firstEl) return
      const bandBase = scrollPadTotal - 8
      if (firstEl.getBoundingClientRect().top > bandBase) {
        setActiveSlug(FULL_MENU_ALL_SLUG)
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
      if (bestSlug) setActiveSlug(bestSlug)
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

  useEffect(() => {
    if (!activeSlug || !stripRef.current || !activeBtnRef.current) return
    const strip = stripRef.current
    const btn = activeBtnRef.current
    const sr = strip.getBoundingClientRect()
    const br = btn.getBoundingClientRect()
    if (br.left < sr.left + 12 || br.right > sr.right - 12) {
      btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    }
  }, [activeSlug])

  useEffect(() => {
    const el = stripRef.current
    if (!el) return
    checkScrollButtons(el)
    const ro = new ResizeObserver(() => checkScrollButtons(el))
    ro.observe(el)
    const t = window.setTimeout(() => checkScrollButtons(el), 250)
    return () => {
      ro.disconnect()
      window.clearTimeout(t)
    }
  }, [visibleCategories.length, checkScrollButtons])

  const scrollToCategory = useCallback((slug: string) => {
    scrollLockRef.current = true
    setActiveSlug(slug)
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

  /** Перехід з головної «Дивитися все» → /menu?cat=slug */
  useEffect(() => {
    if (loading || visibleCategories.length === 0) return
    const raw = searchParams.get('cat')
    const slug = raw?.trim()
    if (!slug) return
    if (!visibleCategories.some((c) => c.slug === slug)) return
    const id = window.setTimeout(() => {
      scrollToCategory(slug)
    }, 120)
    return () => window.clearTimeout(id)
  }, [loading, searchParams, visibleCategories, scrollToCategory])

  const addToCart = useCallback(
    (item: MenuItem) => {
      if (typeof window === 'undefined' || !window.localStorage) return
      const cart = JSON.parse(localStorage.getItem('cart') || '[]')
      const n = cart.filter((x: { id?: number }) => x?.id === item.id).length
      if (n >= 99) {
        toast.error('Максимальна кількість товару — 99 шт.')
        return
      }
      cart.push(item)
      localStorage.setItem('cart', JSON.stringify(cart))
      window.dispatchEvent(new CustomEvent('cartUpdated'))
      toast.success(t.addToCart || 'Додано!')
    },
    [t.addToCart]
  )

  const onCityChange = useCallback((cityId: number) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cityChanged', { detail: { cityId } }))
    }
  }, [])

  return (
    <div className="watta-full-menu-page flex w-full max-w-[100vw] flex-1 flex-col overflow-x-clip bg-[#f2f5f3]">
      <div ref={stickyChromeRef} className="watta-full-menu-sticky-chrome">
        <WattaGlobalSiteHeader
          disableSticky
          logoHref="/"
          onCityChange={onCityChange}
          onPromotionsClick={() => router.push('/')}
          onCartClick={() => router.push('/cart')}
          onMenuClick={() => router.push('/')}
          onProfileClick={() => router.push('/profile')}
        />

        <div className="categories-panel-wrapper-web">
          <button
            type="button"
            className={`categories-scroll-btn-web categories-scroll-left-web ${!canScrollLeft ? 'categories-scroll-btn-hidden-web' : ''}`}
            onClick={(e) => {
              e.preventDefault()
              scrollStripBy('left')
            }}
            aria-label={t.cinematicFooter.prevPromo}
          >
            ‹
          </button>

          <div
            ref={stripRef}
            className="categories-panel-web"
            role="tablist"
            aria-label={mv.fullMenuCategoriesAria}
            onScroll={handleStripScroll}
          >
            <button
              key={FULL_MENU_ALL_SLUG}
              ref={activeSlug === FULL_MENU_ALL_SLUG ? activeBtnRef : undefined}
              type="button"
              role="tab"
              aria-selected={activeSlug === FULL_MENU_ALL_SLUG}
              className={`category-button-web ${activeSlug === FULL_MENU_ALL_SLUG ? 'category-button-active-web' : ''}`}
              onClick={() => scrollToCategory(FULL_MENU_ALL_SLUG)}
              onMouseDown={(e) => e.preventDefault()}
              onFocus={(e) => {
                e.preventDefault()
                e.currentTarget.blur()
              }}
              tabIndex={-1}
            >
              <div className="category-button-icon-web" aria-hidden>
                🍱
              </div>
              <span className="category-button-label-web">{mv.fullMenuAllTab}</span>
            </button>
            {visibleCategories.map((cat) => {
              const isOn = activeSlug === cat.slug
              return (
                <button
                  key={cat.slug}
                  ref={isOn ? activeBtnRef : undefined}
                  type="button"
                  role="tab"
                  aria-selected={isOn}
                  className={`category-button-web ${isOn ? 'category-button-active-web' : ''}`}
                  onClick={() => scrollToCategory(cat.slug)}
                  onMouseDown={(e) => e.preventDefault()}
                  onFocus={(e) => {
                    e.preventDefault()
                    e.currentTarget.blur()
                  }}
                  tabIndex={-1}
                >
                  <div className="category-button-icon-web" aria-hidden>
                    {cat.emoji}
                  </div>
                  <span className="category-button-label-web">{cat.name}</span>
                </button>
              )
            })}
          </div>

          <button
            type="button"
            className={`categories-scroll-btn-web categories-scroll-right-web ${!canScrollRight ? 'categories-scroll-btn-hidden-web' : ''}`}
            onClick={(e) => {
              e.preventDefault()
              scrollStripBy('right')
            }}
            aria-label={t.cinematicFooter.nextPromo}
          >
            ›
          </button>
        </div>
      </div>

      <div className="categories-panel-spacer-web watta-full-menu-below-sticky-spacer" aria-hidden />

      <div
        id="full-menu-page-start"
        style={{ scrollMarginTop: scrollPadPx }}
        className="relative z-[1] mx-auto max-w-[1800px] px-3 pb-16 pt-5 sm:px-6 sm:pb-20 sm:pt-7"
      >
        <div className="watta-full-menu-intro mb-10 sm:mb-12">
          <div
            className="watta-full-menu-intro-video"
            aria-label={mv.fullMenuTitle}
          >
            {heroVideoFailed ? (
              <div
                className="watta-full-menu-intro-fallback"
                style={{ backgroundImage: "url('/watta-sushi.jpg')" }}
                role="img"
                aria-hidden
              />
            ) : (
              <video
                key={heroVideoSrc}
                ref={heroVideoRef}
                className="watta-full-menu-intro-video-el"
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                tabIndex={-1}
                aria-hidden
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
            )}
          </div>

          <header className="mx-auto mt-8 max-w-2xl px-1 text-center sm:mt-9">
            <h1
              className="font-serif text-3xl font-bold tracking-tight text-[#0f241e] sm:text-4xl md:text-[2.5rem]"
              style={{ fontFamily: 'var(--font-brand-playfair), Georgia, serif' }}
            >
              {mv.fullMenuTitle}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-[#5c6f68] sm:text-base">{mv.fullMenuSub}</p>
          </header>
        </div>

        {loading ? (
          <p className="py-20 text-center text-base font-semibold text-[#145142]">{mv.fullMenuLoading}</p>
        ) : visibleCategories.length === 0 ? (
          <p className="py-20 text-center text-[#1a2e28]/65">{mv.fullMenuEmpty}</p>
        ) : (
          <div className="flex flex-col gap-14 sm:gap-16">
            {visibleCategories.map((cat) => {
              const list = itemsBySlug.get(cat.slug) ?? []
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
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#eef6f3] to-[#dceee6] text-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] sm:h-12 sm:w-12 sm:text-[1.75rem]"
                        aria-hidden
                      >
                        {cat.emoji}
                      </span>
                      <span className="leading-tight">{cat.name}</span>
                    </h2>
                    <span className="rounded-full bg-[#eef6f3] px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#145142]/80 sm:text-sm">
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
