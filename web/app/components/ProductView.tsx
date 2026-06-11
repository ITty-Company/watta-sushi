'use client'

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, startTransition, useState } from 'react'
import { useInstantRouter } from '@/hooks/useInstantRouter'
import { ArrowRight, Home } from 'lucide-react'
import { ArrowLeft, ChevronLeft, ChevronRight, Clock, Heart, Minus, Plus, ShoppingBag } from '@/lib/wattaInlineIcons'
import { useLanguage } from '../context/LanguageContext'
import { getLocalizedField } from '@/lib/i18n/getLocalizedField'
import { parseProductSpecsFromDescription } from '@/lib/i18n/parseProductSpecsFromDescription'
import type { WattaLanguage } from '@/lib/i18n/language'
import { cn, getApiUrl } from '@/lib/utils'
import {
  fetchProductById,
  normalizeProductRouteId,
  readProductFromClientCache,
  WATTA_PRODUCT_DETAIL_CACHED_EVENT,
  warmupProductDetail,
  writeProductDetailCache,
} from '@/lib/fetchProductById'
import {
  ensureIngredientsCatalog,
  enrichProductRow,
  parseIngredientIds,
} from '@/lib/wattaIngredientsCatalog'
import { getMenuCategoryDisplayName } from '@/lib/i18n/getMenuCategoryDisplayName'
import { enrichProductCategoryFromCache } from '@/lib/wattaProductCategory'
import { CategoryDisplayPill } from './CategoryDisplayPill'
import { buildMenuCategoriesFromApi } from '@/lib/buildMenuCategoriesFromApi'
import { menuCategoriesSessionKey } from '@/lib/i18n/menuDataCacheBust'
import { fetchPublicApi } from '@/lib/publicApiFetch'
import { readCityIdForProductApi } from '@/lib/wattaSiteLocalePrefs'
import { clampPromoPercent, effectiveUnitPrice } from '@/lib/productPricing'
import { useProductFavorite } from '@/hooks/useProductFavorite'
import { WattaMenuProductCard } from './WattaMenuProductCard'
import { ProductImageGallery } from './ProductImageGallery'
import { resolveCatalogMediaUrl } from '@/lib/catalogMediaUrl'
import { markBrokenUploadUrl, isBrokenUploadUrl } from '@/lib/brokenUploadUrlCache'
import { preloadImageUrls } from '@/lib/preloadImages'
import { productGalleryFromApi } from '@/lib/productGallery'
import toast from 'react-hot-toast'
import { addToCartWithAuthGate, lineQuantity, readCartFromStorage } from '@/lib/cartStorage'

import { decrementCartProduct, incrementCartProduct } from '@/lib/cartLineMutations'
import { useCartLineQuantity } from '@/hooks/useCartLineQuantity'
import { runCartAddFeedback } from '@/lib/cartAddFeedback'
import { runFavoritesAddFeedback } from '@/lib/favoritesAddFeedback'
import CartAddedInlineToast from './CartAddedInlineToast'
import { WattaStaggerRevealText } from './WattaStaggerRevealText'
import { WattaStaggerSectionTitle } from './WattaStaggerSectionTitle'
import type { MenuAddToCartResult } from '@/hooks/useMenuAddToCart'
import { useWattaCatalogSync } from '@/hooks/useWattaCatalogSync'
import {
  WATTA_CATALOG_REFRESH_EVENT,
  type CatalogRefreshDetail,
} from '@/lib/wattaCatalogSync'
import { fetchPublicApiFresh } from '@/lib/publicApiFetch'
import { usePhoneMenuOneColumn } from '@/hooks/usePhoneMenuOneColumn'
import { WattaInViewFadeSection } from './WattaInViewFade'
import WattaLink from './WattaLink'

const PRODUCT_RECOMMENDATIONS_PREVIEW_MAX = 5

interface ProductViewProps {
  productId: string
  /** Дані з SSR — перший кадр одразу з товаром і складом. */
  initialProductRow?: Record<string, unknown> | null
  isAdmin?: boolean
  onBack: () => void
  onOpenProfile: () => void
  onOpenFavorites: () => void
  onOpenNotifications: () => void
  onMenuClick: () => void
  onCartClick?: () => void
  onOpenPhone: () => void
}

interface Product {
  id: number
  name_ru: string
  name_ua?: string
  name_en?: string
  name_nl?: string
  description_ru?: string
  description_ua?: string
  description_en?: string
  description_nl?: string
  price: number
  imageUrl?: string
  imageUrls?: unknown
  categoryId: number
  isPopular?: boolean
  isMenuNew?: boolean
  promoDiscountPercent?: number
  category?: {
    id: number
    slug?: string
    name_ru: string
    name_ua?: string
    name_en?: string
    name_nl?: string
    emoji?: string | null
    imageUrl?: string | null
    hoverImageUrl?: string | null
  }
  ingredients?: {
    id: number
    name_ru: string
    name_ua?: string
    name_en?: string
    name_nl?: string
    imageUrl: string
  }[]
}

type IngredientRow = NonNullable<Product['ingredients']>[number]

function ProductIngredientChip({
  photoSrc,
  label,
}: {
  photoSrc: string
  label: string
}) {
  const [imgFailed, setImgFailed] = useState(() => !photoSrc || isBrokenUploadUrl(photoSrc))
  const showImg = photoSrc.length > 0 && !imgFailed

  return (
    <div className="watta-product-page__ing-chip" title={label}>
      <div className="watta-product-page__ing-media">
        {showImg ? (
          <img
            src={photoSrc}
            alt={label}
            width={128}
            height={128}
            decoding="async"
            loading="lazy"
            onError={() => {
              markBrokenUploadUrl(photoSrc)
              setImgFailed(true)
            }}
          />
        ) : (
          <span className="watta-product-page__ing-fallback" aria-hidden>
            🥢
          </span>
        )}
      </div>
      <p className="watta-product-page__ing-label">{label}</p>
    </div>
  )
}

function rowToProduct(row: Record<string, unknown>): Product {
  return row as unknown as Product
}

function cacheHasIngredients(row: Record<string, unknown> | null): boolean {
  const ing = row?.ingredients
  return Array.isArray(ing) && ing.length > 0
}

function cacheHasDisplayableProduct(row: Record<string, unknown> | null): boolean {
  if (!row) return false
  const id = Number(row.id)
  if (!Number.isFinite(id) || id <= 0) return false
  const price = Number(row.price)
  const name = String(row.name_ru ?? row.name_ua ?? row.name_en ?? '').trim()
  return name.length > 0 && Number.isFinite(price)
}

function resolveInitialRow(
  id: number,
  initialProductRow?: Record<string, unknown> | null,
): Record<string, unknown> | null {
  if (initialProductRow && cacheHasDisplayableProduct(initialProductRow)) {
    return enrichProductRow(initialProductRow) ?? initialProductRow
  }
  if (typeof window === 'undefined') return initialProductRow ? enrichProductRow(initialProductRow) ?? initialProductRow : null
  return readProductFromClientCache(id)
}

function readInitialProductState(
  id: number,
  initialProductRow?: Record<string, unknown> | null,
): { product: Product | null; loading: boolean; compositionPending: boolean } {
  if (id <= 0) return { product: null, loading: false, compositionPending: false }
  const cached = resolveInitialRow(id, initialProductRow)
  if (!cached) {
    return { product: null, loading: typeof window !== 'undefined' && !initialProductRow, compositionPending: false }
  }
  const ids = parseIngredientIds(cached)
  return {
    product: rowToProduct(cached),
    loading: !cacheHasDisplayableProduct(cached),
    compositionPending: ids.length > 0 && !cacheHasIngredients(cached),
  }
}

export function ProductViewLoadingFallback() {
  const { t } = useLanguage()
  const pd = t.productDetail
  return (
    <div className="relative flex min-h-[min(100dvh,56rem)] flex-1 flex-col watta-page-bg pb-24">
      <div className="watta-product-page__inner relative mx-auto w-full max-w-6xl flex-1 px-6 py-4 sm:px-7 sm:py-5">
        <div className="watta-product-page__toolbar mb-5 flex min-w-0 items-center gap-3 sm:mb-6">
          <div className="h-11 w-11 shrink-0 rounded-2xl border border-[#145142]/10 bg-white/60 animate-pulse" />
          <div className="h-4 min-w-0 flex-1 max-w-sm rounded-md bg-watta-action/10 animate-pulse" />
        </div>
        <div className="watta-product-page__main flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-12">
          <div className="mx-auto flex w-full max-w-[min(100%,22rem)] flex-col gap-10 lg:contents lg:mx-0 lg:max-w-none">
            <div className="w-full shrink-0 lg:w-[46%]">
              <div className="overflow-hidden rounded-[26px] border border-[#145142]/8 bg-white/50 sm:rounded-[30px]">
                <div className="aspect-square w-full bg-gradient-to-br from-[#e8f0ec] to-[#f4f6f4] animate-pulse" />
              </div>
            </div>
            <div className="flex w-full min-w-0 flex-col gap-5 lg:flex-1">
              <div className="h-9 w-4/5 max-w-md rounded-lg bg-watta-action/12 animate-pulse" />
              <div className="h-9 w-1/2 max-w-xs rounded-lg bg-watta-action/8 animate-pulse" />
              <div className="h-20 w-full rounded-2xl bg-watta-action/6 animate-pulse" />
              <p className="text-xs font-semibold text-[#145142]/70">{pd.loading}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ProductView({ productId, initialProductRow, onBack, onCartClick }: ProductViewProps) {
  const router = useInstantRouter()
  const { t, language } = useLanguage()
  const pd = t.productDetail
  const cs = t.cartSection
  const a = t.siteAria
  const numericProductId = normalizeProductRouteId(productId) ?? 0
  const initialState = useMemo(
    () => readInitialProductState(numericProductId, initialProductRow),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- лише при зміні товару / SSR-рядка
    [numericProductId, initialProductRow],
  )
  const [product, setProduct] = useState<Product | null>(initialState.product)
  const [recommendations, setRecommendations] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(initialState.loading)
  const [catalogRefreshKey, setCatalogRefreshKey] = useState(0)
  const [fetchAttempt, setFetchAttempt] = useState(0)
  const { liked: isFavorite, toggle: toggleFavorite } = useProductFavorite(numericProductId)
  const cartQty = useCartLineQuantity(numericProductId)
  const [showAddedToast, setShowAddedToast] = useState(false)
  const [compositionPending, setCompositionPending] = useState(initialState.compositionPending)
  const recScrollRef = useRef<HTMLDivElement>(null)
  const ingScrollRef = useRef<HTMLDivElement>(null)
  const [ingScrollEnds, setIngScrollEnds] = useState({ atStart: true, atEnd: true })
  const [recScrollEnds, setRecScrollEnds] = useState({ atStart: true, atEnd: true })
  const galleryRef = useRef<HTMLDivElement>(null)
  const addedToastTimerRef = useRef<number | null>(null)

  const handleFavoriteClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const was = isFavorite
      void toggleFavorite(e)
      if (!was) {
        runFavoritesAddFeedback({ sourceEl: e.currentTarget, emoji: '❤️' })
      }
    },
    [isFavorite, toggleFavorite],
  )

  const lang = language as WattaLanguage
  const phoneRecStack = usePhoneMenuOneColumn()

  const getName = (p: Product) => getLocalizedField(p as unknown as Record<string, unknown>, 'name', lang)
  const getDesc = (p: Product) =>
    getLocalizedField(p as unknown as Record<string, unknown>, 'description', lang) || (p.description_ru ?? '')
  const getIngName = (ing: IngredientRow) =>
    getLocalizedField(ing as unknown as Record<string, unknown>, 'name', lang)
  const getCategoryLabel = (p: Product) => {
    const c = p.category
    if (!c) return ''
    return getMenuCategoryDisplayName(
      c as unknown as Record<string, unknown>,
      lang,
      t.categories as Record<string, string>,
    )
  }

  const categoryPill = useMemo(() => {
    if (!product?.category) return null
    const enriched = enrichProductCategoryFromCache(
      { category: product.category } as Record<string, unknown>,
      lang,
      t.categories as Record<string, string>,
    )
    const c = enriched.category as Product['category']
    if (!c) return null
    const slug = String(c.slug ?? '').trim()
    const label = getMenuCategoryDisplayName(
      c as unknown as Record<string, unknown>,
      lang,
      t.categories as Record<string, string>,
    )
    if (!label && !slug) return null
    return {
      slug: slug || 'category',
      emoji: c.emoji || '🍣',
      imageUrl: c.imageUrl,
      hoverImageUrl: c.hoverImageUrl,
      label: label || slug,
      href: slug ? `/menu?cat=${encodeURIComponent(slug)}` : null,
    }
  }, [product?.category, lang, t.categories, catalogRefreshKey])

  useEffect(() => {
    const cacheKey = menuCategoriesSessionKey()
    const cached = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(cacheKey) : null
    if (cached) return
    void fetchPublicApi('/api/products/categories')
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? (data as Record<string, unknown>[]) : []
        if (typeof sessionStorage === 'undefined' || list.length === 0) return
        sessionStorage.setItem(cacheKey, JSON.stringify(list))
        sessionStorage.setItem(`${cacheKey}_time`, Date.now().toString())
        buildMenuCategoriesFromApi(list, lang, t.categories as Record<string, string>)
        setCatalogRefreshKey((k) => k + 1)
      })
      .catch(() => {})
  }, [lang, t.categories])

  useWattaCatalogSync(() => setCatalogRefreshKey((k) => k + 1), ['products', 'categories'])

  useEffect(() => {
    if (numericProductId <= 0) return
    const applyRows = (rows: Record<string, unknown>[] | undefined) => {
      if (!rows?.length) return
      const hit = rows.find((row) => Number(row.id) === numericProductId)
      if (!hit) return
      const enriched = enrichProductRow(hit) ?? hit
      setProduct(rowToProduct(enriched))
      setIsLoading(false)
      const ids = parseIngredientIds(enriched)
      setCompositionPending(ids.length > 0 && !cacheHasIngredients(enriched))
    }
    const onCatalog = (e: Event) => {
      const detail = (e as CustomEvent<CatalogRefreshDetail>).detail
      applyRows(detail?.productRows)
    }
    window.addEventListener(WATTA_CATALOG_REFRESH_EVENT, onCatalog)
    return () => window.removeEventListener(WATTA_CATALOG_REFRESH_EVENT, onCatalog)
  }, [numericProductId])

  useEffect(() => {
    if (numericProductId <= 0) return
    let cancelled = false
    const applyCached = () => {
      const row = readProductFromClientCache(numericProductId)
      if (!row) return
      setProduct(rowToProduct(row))
      if (cacheHasDisplayableProduct(row)) setIsLoading(false)
      if (cacheHasIngredients(row)) {
        setCompositionPending(false)
      } else {
        const ids = parseIngredientIds(row)
        setCompositionPending(ids.length > 0)
      }
    }
    applyCached()
    void ensureIngredientsCatalog().then(() => {
      if (!cancelled) applyCached()
    })
    const onDetail = (e: Event) => {
      const detail = (e as CustomEvent<{ id: number }>).detail
      if (detail?.id === numericProductId) applyCached()
    }
    window.addEventListener(WATTA_PRODUCT_DETAIL_CACHED_EVENT, onDetail)
    void warmupProductDetail(numericProductId)
    return () => {
      cancelled = true
      window.removeEventListener(WATTA_PRODUCT_DETAIL_CACHED_EVENT, onDetail)
    }
  }, [numericProductId])

  useLayoutEffect(() => {
    setShowAddedToast(false)
    if (numericProductId <= 0) {
      setProduct(null)
      setIsLoading(false)
      setCompositionPending(false)
      return
    }
    const cached = resolveInitialRow(numericProductId, initialProductRow)
    if (cached) {
      setProduct(rowToProduct(cached))
      setIsLoading(!cacheHasDisplayableProduct(cached))
      const ids = parseIngredientIds(cached)
      setCompositionPending(ids.length > 0 && !cacheHasIngredients(cached))
      if (cacheHasIngredients(cached)) {
        writeProductDetailCache(cached)
      }
    } else {
      setProduct(null)
      setIsLoading(!initialProductRow)
      setCompositionPending(false)
    }
  }, [numericProductId, initialProductRow])

  useEffect(() => {
    if (numericProductId <= 0) return

    const ac = new AbortController()
    let cancelled = false

    void ensureIngredientsCatalog()

    const fresh = catalogRefreshKey > 0
    const cachedDetail = !fresh ? readProductFromClientCache(numericProductId) : null
    const cacheReady =
      cachedDetail &&
      cacheHasDisplayableProduct(cachedDetail) &&
      (cacheHasIngredients(cachedDetail) || parseIngredientIds(cachedDetail).length === 0)

    if (cacheReady) {
      setIsLoading(false)
    } else {
      void fetchProductById(numericProductId, ac.signal, { fresh })
        .then((row) => {
          if (cancelled) return
          if (row) {
            const enriched = enrichProductRow(row) ?? row
            setProduct(rowToProduct(enriched))
            setCompositionPending(
              parseIngredientIds(enriched).length > 0 && !cacheHasIngredients(enriched),
            )
            return
          }
          const cached = readProductFromClientCache(numericProductId)
          if (cached) {
            setProduct(rowToProduct(cached))
            setCompositionPending(
              parseIngredientIds(cached).length > 0 && !cacheHasIngredients(cached),
            )
          }
        })
        .catch((e) => {
          if (cancelled) return
          if (e && typeof e === 'object' && (e as { name?: string }).name === 'AbortError') return
          console.error(e)
          const cached = readProductFromClientCache(numericProductId)
          if (cached) {
            setProduct(rowToProduct(cached))
            setCompositionPending(
              parseIngredientIds(cached).length > 0 && !cacheHasIngredients(cached),
            )
          }
        })
        .finally(() => {
          if (!cancelled) setIsLoading(false)
        })
    }

    return () => {
      cancelled = true
      ac.abort()
    }
  }, [numericProductId, catalogRefreshKey, fetchAttempt])

  useEffect(() => {
    if (numericProductId <= 0) {
      setRecommendations([])
      return
    }

    const ac = new AbortController()
    let cancelled = false
    let idleId: number | null = null
    let timeoutId: number | null = null

    const loadRecommendations = () => {
      const cityId = typeof window !== 'undefined' ? readCityIdForProductApi() : null
      const recQ = new URLSearchParams({
        excludeId: String(numericProductId),
        limit: String(PRODUCT_RECOMMENDATIONS_PREVIEW_MAX),
      })
      if (cityId != null && cityId > 0) recQ.set('cityId', String(cityId))
      const recUrl = getApiUrl(`/api/products/recommendations?${recQ.toString()}`)
      const fresh = catalogRefreshKey > 0
      const recFetch = fresh
        ? fetchPublicApiFresh(recUrl, { signal: ac.signal })
        : fetch(recUrl, { signal: ac.signal, headers: { 'Cache-Control': 'no-cache' } })

      void recFetch
        .then(async (res) => {
          if (cancelled) return
          if (!res.ok) return
          const data = (await res.json()) as Product[]
          const next = Array.isArray(data) ? data.slice(0, 12) : []
          startTransition(() => {
            if (cancelled) return
            setRecommendations(next)
          })
        })
        .catch((e) => {
          if (e && typeof e === 'object' && (e as { name?: string }).name === 'AbortError') return
        })
    }

    type IdleWindow = Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout?: number }) => number
      cancelIdleCallback?: (id: number) => void
    }
    const w = typeof window !== 'undefined' ? (window as IdleWindow) : null
    if (w && typeof w.requestIdleCallback === 'function') {
      idleId = w.requestIdleCallback(loadRecommendations, { timeout: 900 })
    } else if (typeof window !== 'undefined') {
      timeoutId = window.setTimeout(loadRecommendations, 120)
    }

    return () => {
      cancelled = true
      ac.abort()
      if (idleId != null && w?.cancelIdleCallback) w.cancelIdleCallback(idleId)
      if (timeoutId != null) window.clearTimeout(timeoutId)
    }
  }, [numericProductId, catalogRefreshKey, fetchAttempt])

  useEffect(() => {
    if (isLoading || product || numericProductId <= 0) return
    if (readProductFromClientCache(numericProductId)) return
    const timer = window.setTimeout(() => {
      router.replace('/menu')
    }, 1200)
    return () => window.clearTimeout(timer)
  }, [isLoading, product, numericProductId, router])

  useEffect(
    () => () => {
      if (addedToastTimerRef.current != null) {
        window.clearTimeout(addedToastTimerRef.current)
      }
    },
    [],
  )

  const buildCartLine = useCallback(() => {
    if (!product) return null
    const cover =
      (product.imageUrl && String(product.imageUrl).trim()) ||
      productGalleryFromApi({ imageUrl: product.imageUrl, imageUrls: product.imageUrls })[0]
    return {
      id: product.id,
      name: getName(product),
      description: getDesc(product),
      price: product.price,
      category: getCategoryLabel(product) || '',
      emoji: product.category?.emoji || '🍣',
      imageUrl: cover,
      promoDiscountPercent: product.promoDiscountPercent,
    }
  }, [product, lang, t.categories])

  const showCartAddedFeedback = useCallback(() => {
    if (!product) return
    const cover =
      (product.imageUrl && String(product.imageUrl).trim()) ||
      productGalleryFromApi({ imageUrl: product.imageUrl, imageUrls: product.imageUrls })[0]
    runCartAddFeedback({
      sourceEl: galleryRef.current,
      imageUrl: resolveCatalogMediaUrl(cover),
      emoji: product.category?.emoji || '🍣',
    })
    setShowAddedToast(true)
    if (addedToastTimerRef.current != null) window.clearTimeout(addedToastTimerRef.current)
    addedToastTimerRef.current = window.setTimeout(() => {
      setShowAddedToast(false)
      addedToastTimerRef.current = null
    }, 2200)
  }, [product])

  const changeProductCartQty = useCallback(
    (delta: number) => {
      if (!product) return
      const line = buildCartLine()
      if (!line) return

      if (delta > 0) {
        if (cartQty <= 0) {
          const result = addToCartWithAuthGate(router, line, { quantity: 1 })
          if (result === 'max') {
            toast.error(t.appToasts.maxCartQty)
            return
          }
          if (result === 'auth_redirect') return
          showCartAddedFeedback()
          return
        }
        const result = incrementCartProduct(line)
        if (result === 'max') {
          toast.error(t.appToasts.maxCartQty)
          return
        }
        showCartAddedFeedback()
        return
      }

      decrementCartProduct(product.id)
    },
    [product, cartQty, buildCartLine, router, t.appToasts.maxCartQty, showCartAddedFeedback],
  )

  const addToCart = () => changeProductCartQty(1)

  const addRecToCart = (rec: Product): MenuAddToCartResult => {
    const cover =
      (rec.imageUrl && String(rec.imageUrl).trim()) ||
      productGalleryFromApi({ imageUrl: rec.imageUrl, imageUrls: rec.imageUrls })[0]
    const result = addToCartWithAuthGate(router, {
      id: rec.id,
      name: getName(rec),
      description: getDesc(rec),
      price: rec.price,
      category: getCategoryLabel(rec) || '',
      emoji: rec.category?.emoji || '🍣',
      imageUrl: cover,
      promoDiscountPercent: rec.promoDiscountPercent,
    })
    if (result === 'max') {
      toast.error(t.appToasts.maxCartQty)
      return 'max'
    }
    if (result === 'auth_redirect') return 'auth_redirect'
    return 'ok'
  }

  const recPreview = useMemo(
    () => recommendations.slice(0, PRODUCT_RECOMMENDATIONS_PREVIEW_MAX),
    [recommendations],
  )

  const scrollIngredients = (dir: -1 | 1) => {
    const el = ingScrollRef.current
    if (!el) return
    el.scrollBy({ left: dir * Math.min(220, el.clientWidth * 0.75), behavior: 'smooth' })
  }

  const syncIngredientScrollEnds = useCallback(() => {
    const el = ingScrollRef.current
    if (!el) {
      setIngScrollEnds({ atStart: true, atEnd: true })
      return
    }
    const maxScroll = el.scrollWidth - el.clientWidth
    setIngScrollEnds({
      atStart: el.scrollLeft <= 2,
      atEnd: maxScroll <= 2 || el.scrollLeft >= maxScroll - 2,
    })
  }, [])

  const syncRecScrollEnds = useCallback(() => {
    const el = recScrollRef.current
    if (!el) {
      setRecScrollEnds({ atStart: true, atEnd: true })
      return
    }
    const maxScroll = el.scrollWidth - el.clientWidth
    setRecScrollEnds({
      atStart: el.scrollLeft <= 2,
      atEnd: maxScroll <= 2 || el.scrollLeft >= maxScroll - 2,
    })
  }, [])

  const scrollRecommendations = (dir: -1 | 1) => {
    const el = recScrollRef.current
    if (!el) return
    el.scrollBy({ left: dir * Math.min(280, el.clientWidth * 0.82), behavior: 'smooth' })
  }

  const galleryImages = useMemo(() => {
    if (!product) return []
    return productGalleryFromApi(product)
      .map((u) => resolveCatalogMediaUrl(u) ?? u)
      .filter((u) => u.length > 0)
  }, [product, catalogRefreshKey])

  const ingredientsWithPhotos = useMemo(() => {
    const list = product?.ingredients?.length ? product.ingredients : []
    return list.map((ing) => ({
      ...ing,
      photoSrc: resolveCatalogMediaUrl(ing.imageUrl) ?? '',
    }))
  }, [product?.ingredients, catalogRefreshKey])

  useEffect(() => {
    const el = ingScrollRef.current
    if (!el) return
    syncIngredientScrollEnds()
    el.addEventListener('scroll', syncIngredientScrollEnds, { passive: true })
    const ro = new ResizeObserver(syncIngredientScrollEnds)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', syncIngredientScrollEnds)
      ro.disconnect()
    }
  }, [ingredientsWithPhotos.length, compositionPending, syncIngredientScrollEnds])

  useEffect(() => {
    const el = recScrollRef.current
    if (!el) return
    syncRecScrollEnds()
    el.addEventListener('scroll', syncRecScrollEnds, { passive: true })
    const ro = new ResizeObserver(syncRecScrollEnds)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', syncRecScrollEnds)
      ro.disconnect()
    }
  }, [recommendations.length, phoneRecStack, syncRecScrollEnds])

  useEffect(() => {
    if (!product) return
    preloadImageUrls(galleryImages, { limit: 12, highPriorityCount: 3 })
    preloadImageUrls(
      ingredientsWithPhotos.map((ing) => ing.photoSrc),
      { limit: 12, highPriorityCount: 4 },
    )
  }, [product, galleryImages, ingredientsWithPhotos])

  if (isLoading && !product && !initialProductRow) {
    return <ProductViewLoadingFallback />
  }
  if (!product) {
    return (
      <div className="relative flex min-h-[min(100dvh,56rem)] flex-1 flex-col watta-page-bg pb-24">
        <div className="watta-product-page__inner relative mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center gap-4 px-6 py-12 text-center">
          <p className="text-sm font-semibold text-[#145142]/80">{pd.loading}</p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={onBack}
              className="rounded-xl border border-[#145142]/20 bg-white px-4 py-2 text-sm font-bold text-[#145142]"
            >
              {t.auth.back}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsLoading(true)
                setFetchAttempt((n) => n + 1)
              }}
              className="rounded-xl bg-watta-action px-4 py-2 text-sm font-bold text-white"
            >
              {t.errorPage.retry}
            </button>
            <button
              type="button"
              onClick={() => router.push('/menu')}
              className="rounded-xl border border-[#145142]/20 bg-white px-4 py-2 text-sm font-bold text-[#145142]"
            >
              {t.menuView.fullMenuAllTab}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const desc = getDesc(product)
  const { weightLine } = parseProductSpecsFromDescription(
    desc,
    pd.weightFallback,
    pd.piecesFallback,
    lang,
  )
  const compositionLoading = compositionPending && ingredientsWithPhotos.length === 0
  const promoPct = clampPromoPercent(product.promoDiscountPercent)
  const unitEffective = effectiveUnitPrice(product.price, promoPct)
  return (
    <div
      className="watta-product-page relative flex min-h-0 flex-1 flex-col watta-page-bg pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]"
    >
      <div className="watta-product-page__inner relative mx-auto w-full max-w-6xl flex-1 px-6 pb-4 sm:px-7 sm:pb-8">
        <div className="watta-product-page__toolbar mb-2 flex items-center justify-between gap-2 sm:mb-4">
          <button
            type="button"
            onClick={onBack}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#145142]/15 bg-white text-neutral-800 transition hover:border-[#145142]/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#145142]/35 sm:h-10 sm:w-10 sm:rounded-xl"
            aria-label={t.auth.back}
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2.2} />
          </button>
          {categoryPill ? (
            <CategoryDisplayPill
              slug={categoryPill.slug}
              emoji={categoryPill.emoji}
              label={categoryPill.label}
              imageUrl={categoryPill.imageUrl}
              hoverImageUrl={categoryPill.hoverImageUrl}
              href={categoryPill.href}
              className="watta-product-page__category-chip shrink-0 md:hidden"
            />
          ) : (
            <span className="w-10 shrink-0 md:hidden" aria-hidden />
          )}
          <nav
            className="watta-product-page__crumbs hidden min-w-0 flex-1 items-center justify-end md:flex"
            aria-label={pd.breadcrumbAria}
          >
            <ol className="flex min-w-0 flex-wrap items-center justify-end gap-1.5 text-sm font-semibold text-neutral-500">
              <li className="flex shrink-0 items-center">
                <WattaLink
                  href="/"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-700 transition hover:bg-neutral-100 hover:text-neutral-900"
                  aria-label={pd.breadcrumbHome}
                >
                  <Home className="h-4 w-4" strokeWidth={2.1} aria-hidden />
                </WattaLink>
              </li>
              {categoryPill?.href ? (
                <li className="flex min-w-0 items-center gap-1.5">
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-neutral-300" aria-hidden />
                  <WattaLink
                    href={categoryPill.href}
                    className="truncate text-neutral-600 transition hover:text-neutral-900"
                  >
                    {categoryPill.label}
                  </WattaLink>
                </li>
              ) : null}
              <li className="flex min-w-0 items-center gap-1.5">
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-neutral-300" aria-hidden />
                <span className="truncate text-neutral-900" aria-current="page">
                  {getName(product)}
                </span>
              </li>
            </ol>
          </nav>
        </div>
        <div className="watta-product-page__main flex flex-col gap-3 sm:gap-8 lg:flex-row lg:items-start lg:gap-10 xl:gap-12">
          <div className="mx-auto flex w-full max-w-none flex-col gap-3 sm:max-w-[min(100%,22rem)] sm:gap-3 lg:contents lg:mx-0 lg:max-w-none">
          {/* Image */}
          <div className="relative w-full shrink-0 lg:w-[46%]" ref={galleryRef}>
            <div className="h-full w-full">
              <ProductImageGallery
                images={galleryImages}
                alt={getName(product)}
                navVariant="overlay"
                className="watta-product-page__gallery"
                data-watta-cart-bar-gate=""
                labels={{
                  prev: pd.galleryPrev,
                  next: pd.galleryNext,
                  progress: pd.galleryProgress,
                  open: pd.galleryOpen,
                  close: pd.galleryClose,
                }}
              />
            </div>
          </div>

          {/* Info */}
          <div className="flex w-full min-w-0 flex-col gap-2.5 sm:gap-4 lg:flex-1">
            <div className="flex flex-col gap-1.5 sm:gap-2.5">
              <div className="watta-product-page__title-block flex flex-col gap-0">
                <div className="watta-product-page__hero-badges hidden flex-wrap items-center gap-1.5 md:flex">
                  {product.isPopular ? (
                    <span className="home-menu-product-badge-web home-menu-product-badge-web--hit">
                      {pd.badgeTopSales}
                    </span>
                  ) : null}
                  {product.isMenuNew ? (
                    <span className="home-menu-product-badge-web home-menu-product-badge-web--new">
                      {pd.badgeNew}
                    </span>
                  ) : null}
                  {promoPct > 0 ? (
                    <span className="home-menu-product-badge-web home-menu-product-badge-web--promo">
                      −{promoPct}%
                    </span>
                  ) : null}
                </div>
                <div className="watta-product-page__title-row flex flex-wrap items-center gap-1.5 sm:items-baseline sm:gap-2">
                  <h1 className="watta-product-page__title">
                    <WattaStaggerRevealText
                      text={getName(product)}
                      variant="title"
                      inView
                      replay={false}
                      staggerStyle="catalog"
                      as="span"
                    />
                  </h1>
                  {promoPct > 0 ? (
                    <span className="watta-product-page__promo-badge rounded-full border border-[#f0b090]/60 bg-[#fff4ed] px-2 py-0.5 text-[10px] text-[#b54a0a] md:hidden sm:px-3 sm:py-1 sm:text-xs">
                      −{promoPct}%
                    </span>
                  ) : null}
                </div>
                {weightLine ? (
                  <p className="watta-product-page__weight-mobile md:hidden">{weightLine}</p>
                ) : null}
                {weightLine ? (
                  <p className="watta-product-page__weight-desktop hidden md:block">{weightLine}</p>
                ) : null}
              </div>

            {(ingredientsWithPhotos.length > 0 || compositionLoading) && (
              <section className="watta-product-page__composition w-full max-w-full md:order-none">
                <div className="watta-product-page__composition-head">
                  <WattaStaggerSectionTitle
                    className="watta-product-page__composition-title"
                    text={`${pd.composition}:`}
                  />
                  {!ingScrollEnds.atStart || !ingScrollEnds.atEnd ? (
                    <div className="watta-product-page__composition-nav">
                      <button
                        type="button"
                        onClick={() => scrollIngredients(-1)}
                        disabled={ingScrollEnds.atStart}
                        className="watta-product-page__composition-nav-btn"
                        aria-label={a.scrollLeft}
                      >
                        <ChevronLeft className="h-4 w-4" strokeWidth={2.2} aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={() => scrollIngredients(1)}
                        disabled={ingScrollEnds.atEnd}
                        className="watta-product-page__composition-nav-btn"
                        aria-label={a.scrollRight}
                      >
                        <ChevronRight className="h-4 w-4" strokeWidth={2.2} aria-hidden />
                      </button>
                    </div>
                  ) : null}
                </div>
                <div
                  ref={ingScrollRef}
                  className="watta-product-page__composition-scroll [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                  {ingredientsWithPhotos.length > 0
                    ? ingredientsWithPhotos.map((ing) => (
                        <ProductIngredientChip
                          key={ing.id}
                          photoSrc={ing.photoSrc}
                          label={getIngName(ing)}
                        />
                      ))
                    : Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="watta-product-page__ing-chip watta-product-page__ing-chip--skeleton" aria-hidden>
                          <div className="watta-product-page__ing-media" />
                          <div className="watta-product-page__ing-label watta-product-page__ing-label--skeleton" />
                        </div>
                      ))}
                </div>
              </section>
            )}

              {/* Ціна + кошик + обране — один ряд (як Ninja Sushi) */}
              <div
                className={cn(
                  'watta-product-page__buy-mobile flex',
                  cartQty > 0 && 'watta-product-page__buy-mobile--in-cart',
                )}
              >
                <div
                  className="watta-product-page__buy-mobile-lead min-w-0"
                  aria-label={`${promoPct > 0 ? `${product.price} €, ` : ''}${unitEffective} €`}
                >
                  <div className="watta-product-page__spec-price-col">
                    <span className="watta-product-page__price watta-product-page__price--mobile">
                      {unitEffective}{' '}
                      <span className="watta-product-page__price-currency">€</span>
                    </span>
                    {promoPct > 0 ? (
                      <span className="watta-product-page__price-old watta-product-page__price-old--strike-red">
                        {product.price} €
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="watta-product-page__buy-mobile-actions">
                  {cartQty > 0 ? (
                    <div className="watta-product-page__qty-pill">
                      <button
                        type="button"
                        onClick={() => changeProductCartQty(-1)}
                        className="watta-product-page__qty-pill__btn watta-product-page__qty-pill__btn--minus"
                        aria-label="-"
                      >
                        <Minus className="h-4 w-4" strokeWidth={2.5} aria-hidden />
                      </button>
                      <span className="watta-product-page__qty-pill__val">{cartQty}</span>
                      <button
                        type="button"
                        onClick={() => changeProductCartQty(1)}
                        className="watta-product-page__qty-pill__btn watta-product-page__qty-pill__btn--plus"
                        aria-label="+"
                      >
                        <Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={addToCart}
                      className="watta-product-page__cta watta-product-page__cta--cart watta-product-page__cta--cart-mobile flex items-center justify-center gap-2 px-4 text-sm transition active:scale-[0.99]"
                    >
                      <span>{pd.toCart}</span>
                      <ShoppingBag className="h-5 w-5 shrink-0" strokeWidth={2.25} aria-hidden />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleFavoriteClick}
                    className="watta-product-page__favorite-btn flex items-center justify-center border border-[#145142]/12 bg-white text-[#145142] hover:border-[#145142]/25"
                    aria-pressed={isFavorite}
                    aria-label={a.favorites}
                  >
                    <Heart className={cn('h-5 w-5', isFavorite && 'fill-red-500 text-red-500')} />
                  </button>
                </div>
                {showAddedToast ? (
                  <div className="watta-product-page__buy-toast">
                    <CartAddedInlineToast message={pd.addedHint} />
                  </div>
                ) : null}
              </div>
            </div>

            <div className="hidden flex-wrap items-center gap-2 sm:flex md:hidden">
              <span className="watta-product-page__prep-badge inline-flex items-center gap-1.5 rounded-xl border border-[#145142]/10 bg-white px-3 py-1.5 text-xs text-neutral-600 sm:gap-2 sm:rounded-2xl sm:px-4 sm:py-2 sm:text-sm">
                <Clock className="h-3.5 w-3.5 text-[#145142] sm:h-4 sm:w-4" strokeWidth={2.2} aria-hidden />
                {pd.prepTime}
              </span>
            </div>
          </div>
          </div>
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <WattaInViewFadeSection
            data-watta-reveal-once
            className="watta-product-page__recs relative"
            aria-labelledby="product-recommendations-heading"
          >
            <div className="watta-product-page__rec-inner">
              <header className="watta-product-page__rec-head-simple">
                <div className="watta-product-page__rec-head-row">
                  <WattaStaggerSectionTitle
                    id="product-recommendations-heading"
                    className="watta-product-page__rec-title"
                    text={pd.recommendsTitle}
                  />
                  {!phoneRecStack && (!recScrollEnds.atStart || !recScrollEnds.atEnd) ? (
                    <div className="watta-product-page__rec-nav">
                      <button
                        type="button"
                        onClick={() => scrollRecommendations(-1)}
                        disabled={recScrollEnds.atStart}
                        className="watta-product-page__composition-nav-btn"
                        aria-label={a.scrollLeft}
                      >
                        <ChevronLeft className="h-4 w-4" strokeWidth={2.2} aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={() => scrollRecommendations(1)}
                        disabled={recScrollEnds.atEnd}
                        className="watta-product-page__composition-nav-btn"
                        aria-label={a.scrollRight}
                      >
                        <ChevronRight className="h-4 w-4" strokeWidth={2.2} aria-hidden />
                      </button>
                    </div>
                  ) : null}
                </div>
                <p className="watta-product-page__rec-hint md:hidden">{pd.recommendsHint}</p>
              </header>

              {phoneRecStack ? (
                <div
                  className="watta-product-page__rec-stack mx-auto w-full max-w-lg"
                  role="list"
                  aria-label={pd.recommendsTitle}
                >
                  {recPreview.map((rec, index) => (
                    <div key={rec.id} role="listitem" className="watta-product-page__rec-stack-item">
                      <WattaMenuProductCard
                        variant="grid"
                        imagePriority={index < 4}
                        className="min-w-0 w-full shadow-sm"
                        product={{
                          id: rec.id,
                          name: getName(rec),
                          description: getDesc(rec),
                          price: rec.price,
                          emoji: rec.category?.emoji || '🍣',
                          imageUrl: rec.imageUrl ?? undefined,
                          isTop: rec.isPopular === true,
                          isMenuNew: rec.isMenuNew === true,
                          promoDiscountPercent: rec.promoDiscountPercent,
                        }}
                        subtitleLine={
                          parseProductSpecsFromDescription(getDesc(rec), pd.weightFallback, pd.piecesFallback, lang)
                            .weightLine
                        }
                        onAddToCart={() => addRecToCart(rec)}
                      />
                    </div>
                  ))}
                  <div className="home-menu-cat-view-all-wrap-web" role="listitem">
                    <WattaLink href="/menu" className="watta-product-page__menu-cta">
                      <span>{pd.recommendsMenuCta}</span>
                      <ArrowRight className="watta-product-page__menu-cta-arrow" size={18} strokeWidth={2.2} aria-hidden />
                    </WattaLink>
                  </div>
                </div>
              ) : (
                <div className="watta-product-page__rec-outer cart-upsell-rail-outer relative -mx-0.5 sm:-mx-1">
                  <div
                    ref={recScrollRef}
                    className="watta-product-page__rec-scroll watta-product-peek-rail-scroll cart-upsell-rail-scroll home-menu-category-rail-web flex flex-nowrap gap-2.5 overflow-x-auto scroll-smooth pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-5 sm:px-2 [&::-webkit-scrollbar]:hidden"
                    role="list"
                  >
                    {recPreview.map((rec) => (
                      <div key={rec.id} role="listitem">
                        <WattaMenuProductCard
                          variant="rail"
                          className="home-menu-product-card--rail-web"
                          product={{
                            id: rec.id,
                            name: getName(rec),
                            description: getDesc(rec),
                            price: rec.price,
                            emoji: rec.category?.emoji || '🍣',
                            imageUrl: rec.imageUrl ?? undefined,
                            isTop: rec.isPopular === true,
                            isMenuNew: rec.isMenuNew === true,
                            promoDiscountPercent: rec.promoDiscountPercent,
                          }}
                          subtitleLine={
                            parseProductSpecsFromDescription(getDesc(rec), pd.weightFallback, pd.piecesFallback, lang)
                              .weightLine
                          }
                          onAddToCart={() => addRecToCart(rec)}
                        />
                      </div>
                    ))}
                    <div className="watta-product-page__rec-menu-cta-item" role="listitem">
                      <WattaLink href="/menu" className="watta-product-page__menu-cta">
                        <span>{pd.recommendsMenuCta}</span>
                        <ArrowRight className="watta-product-page__menu-cta-arrow" size={18} strokeWidth={2.2} aria-hidden />
                      </WattaLink>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </WattaInViewFadeSection>
        )}
      </div>
    </div>
  )
}
