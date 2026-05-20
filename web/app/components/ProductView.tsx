'use client'

import React, { useEffect, useLayoutEffect, useMemo, useRef, startTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Clock,
  Heart,
  Minus,
  Plus,
  ShoppingBag,
  Sparkles,
} from 'lucide-react'
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
} from '@/lib/fetchProductById'
import { readCityIdForProductApi } from '@/lib/wattaSiteLocalePrefs'
import { clampPromoPercent, effectiveUnitPrice } from '@/lib/productPricing'
import { useProductFavorite } from '@/hooks/useProductFavorite'
import { WattaMenuProductCard } from './WattaMenuProductCard'
import { ProductImageGallery } from './ProductImageGallery'
import { resolveCatalogMediaUrl } from '@/lib/catalogMediaUrl'
import { productGalleryFromApi } from '@/lib/productGallery'
import toast from 'react-hot-toast'
import { addToCartWithAuthGate } from '@/lib/cartStorage'
import { useWattaCatalogSync } from '@/hooks/useWattaCatalogSync'
import { fetchPublicApiFresh } from '@/lib/publicApiFetch'

interface ProductViewProps {
  productId: string
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
  promoDiscountPercent?: number
  category?: {
    id: number
    slug?: string
    name_ru: string
    name_ua?: string
    name_en?: string
    name_nl?: string
    emoji?: string | null
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

function rowToProduct(row: Record<string, unknown>): Product {
  return row as unknown as Product
}

function cacheHasIngredients(row: Record<string, unknown> | null): boolean {
  const ing = row?.ingredients
  return Array.isArray(ing) && ing.length > 0
}

function readInitialProductState(id: number): { product: Product | null; loading: boolean } {
  if (id <= 0) return { product: null, loading: false }
  if (typeof window === 'undefined') return { product: null, loading: true }
  const cached = readProductFromClientCache(id)
  if (!cached) return { product: null, loading: true }
  return { product: rowToProduct(cached), loading: !cacheHasIngredients(cached) }
}

export default function ProductView({ productId, onBack }: ProductViewProps) {
  const router = useRouter()
  const { t, language } = useLanguage()
  const pd = t.productDetail
  const cs = t.cartSection
  const a = t.siteAria
  const numericProductId = normalizeProductRouteId(productId) ?? 0
  const [product, setProduct] = useState<Product | null>(() =>
    readInitialProductState(normalizeProductRouteId(productId) ?? 0).product,
  )
  const [recommendations, setRecommendations] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(
    () => readInitialProductState(normalizeProductRouteId(productId) ?? 0).loading,
  )
  const [quantity, setQuantity] = useState(1)
  const [catalogRefreshKey, setCatalogRefreshKey] = useState(0)
  const [fetchAttempt, setFetchAttempt] = useState(0)
  const { liked: isFavorite, toggle: toggleFavorite } = useProductFavorite(numericProductId)
  const [justAdded, setJustAdded] = useState(false)
  const recScrollRef = useRef<HTMLDivElement>(null)

  const lang = language as WattaLanguage

  const getName = (p: Product) => getLocalizedField(p as unknown as Record<string, unknown>, 'name', lang)
  const getDesc = (p: Product) =>
    getLocalizedField(p as unknown as Record<string, unknown>, 'description', lang) || (p.description_ru ?? '')
  const getIngName = (ing: IngredientRow) =>
    getLocalizedField(ing as unknown as Record<string, unknown>, 'name', lang)
  const getCategoryLabel = (p: Product) => {
    const c = p.category
    if (!c) return ''
    return getLocalizedField(c as unknown as Record<string, unknown>, 'name', lang)
  }

  useWattaCatalogSync(() => setCatalogRefreshKey((k) => k + 1), 'products')

  useEffect(() => {
    if (numericProductId <= 0) return
    const applyCached = () => {
      const row = readProductFromClientCache(numericProductId)
      if (!row) return
      setProduct(rowToProduct(row))
      if (cacheHasIngredients(row)) setIsLoading(false)
    }
    applyCached()
    const onDetail = (e: Event) => {
      const detail = (e as CustomEvent<{ id: number }>).detail
      if (detail?.id === numericProductId) applyCached()
    }
    window.addEventListener(WATTA_PRODUCT_DETAIL_CACHED_EVENT, onDetail)
    void warmupProductDetail(numericProductId)
    return () => window.removeEventListener(WATTA_PRODUCT_DETAIL_CACHED_EVENT, onDetail)
  }, [numericProductId])

  useLayoutEffect(() => {
    setQuantity(1)
    if (numericProductId <= 0) {
      setProduct(null)
      setIsLoading(false)
      return
    }
    const cached = readProductFromClientCache(numericProductId)
    if (cached) {
      setProduct(rowToProduct(cached))
      setIsLoading(!cacheHasIngredients(cached))
    } else {
      setProduct(null)
      setIsLoading(true)
    }
  }, [numericProductId])

  useEffect(() => {
    if (numericProductId <= 0) {
      setRecommendations([])
      return
    }

    const ac = new AbortController()
    let cancelled = false

    const cachedRow = readProductFromClientCache(numericProductId)
    if (!cacheHasIngredients(cachedRow)) {
      setIsLoading(true)
    }

    const cityId = typeof window !== 'undefined' ? readCityIdForProductApi() : null
    const recQ = new URLSearchParams({ excludeId: String(numericProductId), limit: '24' })
    if (cityId != null && cityId > 0) recQ.set('cityId', String(cityId))
    const recUrl = getApiUrl(`/api/products/recommendations?${recQ.toString()}`)

    const fresh = catalogRefreshKey > 0
    const recFetch = fresh
      ? fetchPublicApiFresh(recUrl, { signal: ac.signal })
      : fetch(recUrl, { signal: ac.signal, headers: { 'Cache-Control': 'no-cache' } })

    void fetchProductById(numericProductId, ac.signal, { fresh })
      .then((row) => {
        if (cancelled) return
        if (row) {
          setProduct(rowToProduct(row))
          return
        }
        const cached = readProductFromClientCache(numericProductId)
        if (cached) {
          setProduct(rowToProduct(cached))
        }
      })
      .catch((e) => {
        if (cancelled) return
        if (e && typeof e === 'object' && (e as { name?: string }).name === 'AbortError') return
        console.error(e)
        const cached = readProductFromClientCache(numericProductId)
        if (cached) setProduct(rowToProduct(cached))
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

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
        console.error(e)
      })

    return () => {
      cancelled = true
      ac.abort()
    }
  }, [numericProductId, catalogRefreshKey, fetchAttempt])

  useEffect(() => {
    if (isLoading || product || numericProductId <= 0) return
    if (readProductFromClientCache(numericProductId)) return
    const t = window.setTimeout(() => {
      router.replace('/menu')
    }, 1200)
    return () => window.clearTimeout(t)
  }, [isLoading, product, numericProductId, router])

  const addToCart = () => {
    if (!product) return
    const cover =
      (product.imageUrl && String(product.imageUrl).trim()) ||
      productGalleryFromApi({ imageUrl: product.imageUrl, imageUrls: product.imageUrls })[0]
    const line = {
      id: product.id,
      name: getName(product),
      description: getDesc(product),
      price: product.price,
      category: getCategoryLabel(product) || '',
      emoji: product.category?.emoji || '🍣',
      imageUrl: cover,
      promoDiscountPercent: product.promoDiscountPercent,
    }
    const result = addToCartWithAuthGate(router, line, { quantity })
    if (result === 'max') {
      toast.error(t.appToasts.maxCartQty)
      return
    }
    if (result === 'auth_redirect') return
    toast.success(t.addToCart)
    setJustAdded(true)
    window.setTimeout(() => setJustAdded(false), 2200)
  }

  const addRecToCart = (rec: Product) => {
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
      return
    }
    if (result === 'auth_redirect') return
    toast.success(t.addToCart)
  }

  const scrollRec = (dir: -1 | 1) => {
    const el = recScrollRef.current
    if (!el) return
    el.scrollBy({ left: dir * Math.min(300, el.clientWidth * 0.8), behavior: 'smooth' })
  }

  const galleryImages = useMemo(() => {
    if (!product) return []
    return productGalleryFromApi(product)
      .map((u) => resolveCatalogMediaUrl(u) ?? u)
      .filter((u) => u.length > 0)
  }, [product, catalogRefreshKey])

  if (isLoading && !product) {
    return (
      <div className="relative flex min-h-[min(100dvh,56rem)] flex-1 flex-col watta-page-bg pb-24">
        <div className="watta-product-page__inner relative mx-auto w-full max-w-6xl flex-1 px-6 py-4 sm:px-7 sm:py-5">
          <div className="watta-product-page__toolbar mb-5 flex min-w-0 items-center gap-3 sm:mb-6">
            <div className="h-11 w-11 shrink-0 rounded-2xl border border-[#145142]/10 bg-white/60 animate-pulse" />
            <div className="h-4 min-w-0 flex-1 max-w-sm rounded-md bg-[#145142]/10 animate-pulse" />
          </div>
          <div className="watta-product-page__main flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-12">
            <div className="mx-auto flex w-full max-w-[min(100%,22rem)] flex-col gap-10 lg:contents lg:mx-0 lg:max-w-none">
            <div className="w-full shrink-0 lg:w-[46%]">
              <div className="overflow-hidden rounded-[26px] border border-[#145142]/8 bg-white/50 sm:rounded-[30px]">
                <div className="aspect-square w-full bg-gradient-to-br from-[#e8f0ec] to-[#f4f6f4] animate-pulse" />
              </div>
            </div>
            <div className="flex w-full min-w-0 flex-col gap-5 lg:flex-1">
              <div className="h-9 w-4/5 max-w-md rounded-lg bg-[#145142]/12 animate-pulse" />
              <div className="h-9 w-1/2 max-w-xs rounded-lg bg-[#145142]/8 animate-pulse" />
              <div className="h-20 w-full rounded-2xl bg-[#145142]/6 animate-pulse" />
              <p className="text-xs font-semibold text-[#145142]/70">{pd.loading}</p>
            </div>
            </div>
          </div>
        </div>
      </div>
    )
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
              className="rounded-xl bg-[#145142] px-4 py-2 text-sm font-bold text-white"
            >
              {t.errorPage.retry}
            </button>
            <button
              type="button"
              onClick={() => router.push('/menu')}
              className="rounded-xl border border-[#145142]/20 bg-white px-4 py-2 text-sm font-bold text-[#145142]"
            >
              {t.menuView.fullMenuAllTab ?? 'Меню'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const desc = getDesc(product)
  const { weightLine, piecesLine } = parseProductSpecsFromDescription(
    desc,
    pd.weightFallback,
    pd.piecesFallback,
    lang,
  )
  const ingredients = product.ingredients && product.ingredients.length > 0 ? product.ingredients : []
  const compositionLoading = ingredients.length === 0 && isLoading
  const promoPct = clampPromoPercent(product.promoDiscountPercent)
  const unitEffective = effectiveUnitPrice(product.price, promoPct)
  const lineTotal = Math.round(product.price * quantity * 100) / 100
  const totalEffective = Math.round(unitEffective * quantity * 100) / 100

  const categoryLabel = getCategoryLabel(product)
  const categoryEmoji = product.category?.emoji || '🍣'

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
          {categoryLabel ? (
            <span className="inline-flex max-w-[min(100%,12rem)] shrink-0 items-center gap-1 rounded-full border border-[#145142]/14 bg-white px-2 py-0.5 text-[10px] font-bold text-[#145142] sm:max-w-[min(100%,14rem)] sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-xs">
              <span className="text-xs leading-none sm:text-base" aria-hidden>
                {categoryEmoji}
              </span>
              <span className="truncate">{categoryLabel}</span>
            </span>
          ) : (
            <span className="w-10 shrink-0" aria-hidden />
          )}
        </div>
        <div className="watta-product-page__main flex flex-col gap-3 sm:gap-8 lg:flex-row lg:items-start lg:gap-10 xl:gap-12">
          <div className="mx-auto flex w-full max-w-[min(100%,22rem)] flex-col gap-3 sm:gap-3 lg:contents lg:mx-0 lg:max-w-none">
          {/* Image */}
          <div className="w-full shrink-0 lg:w-[46%]">
            <ProductImageGallery
              images={galleryImages}
              alt={getName(product)}
              labels={{
                prev: pd.galleryPrev,
                next: pd.galleryNext,
                progress: pd.galleryProgress,
              }}
            />
          </div>

          {/* Info */}
          <div className="flex w-full min-w-0 flex-col gap-2.5 sm:gap-5 lg:flex-1">
            <div className="space-y-2 sm:space-y-3">
              <div className="flex flex-wrap items-baseline gap-1.5 sm:gap-2">
                <h1 className="text-lg font-extrabold leading-tight tracking-tight text-[#0a1814] sm:text-3xl">
                  {getName(product)}
                </h1>
                {promoPct > 0 ? (
                  <span className="rounded-full border border-[#f0b090]/60 bg-[#fff4ed] px-2 py-0.5 text-[10px] font-extrabold text-[#b54a0a] sm:px-3 sm:py-1 sm:text-xs">
                    −{promoPct}%
                  </span>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                <span className="inline-flex items-center rounded-full border border-[#e85d2a]/25 bg-[#fff8f3] px-2.5 py-1 text-[11px] font-bold text-[#c95a1a] sm:px-3.5 sm:py-1.5 sm:text-sm">
                  {weightLine}
                </span>
                <span className="inline-flex items-center rounded-full border border-[#145142]/15 bg-[#f0f7f3] px-2.5 py-1 text-[11px] font-bold text-[#145142] sm:px-3.5 sm:py-1.5 sm:text-sm">
                  {piecesLine}
                </span>
              </div>

              <div className="rounded-xl border border-[#145142]/10 bg-white p-2.5 sm:rounded-2xl sm:p-4">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-1.5 sm:gap-2">
                    {promoPct > 0 ? (
                      <span className="text-sm font-semibold text-neutral-400 line-through sm:text-lg">
                        {lineTotal} €
                      </span>
                    ) : null}
                    <p className="text-xl font-black tabular-nums tracking-tight text-[#0a1814] sm:text-3xl">
                      {totalEffective}{' '}
                      <span className="text-base font-bold text-[#145142]/90 sm:text-xl">€</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="flex items-center rounded-lg border border-[#145142]/12 bg-[#f6faf8] p-0.5 sm:rounded-xl">
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="flex h-8 w-8 items-center justify-center rounded-md bg-white text-[#145142] transition hover:bg-[#e4ede8] sm:h-10 sm:w-10 sm:rounded-lg"
                      >
                        <Minus className="h-3.5 w-3.5 sm:h-5 sm:w-5" strokeWidth={2.5} />
                      </button>
                      <span className="min-w-[1.75rem] text-center text-sm font-black text-neutral-900 sm:min-w-[2.25rem] sm:text-lg">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.min(99, quantity + 1))}
                        className="flex h-8 w-8 items-center justify-center rounded-md bg-[#145142] text-white transition hover:bg-[#104034] sm:h-10 sm:w-10 sm:rounded-lg"
                      >
                        <Plus className="h-3.5 w-3.5 sm:h-5 sm:w-5" strokeWidth={2.5} />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleFavorite()}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#145142]/12 bg-[#f6faf8] text-[#145142] transition hover:border-[#145142]/25 sm:h-11 sm:w-11 sm:rounded-xl"
                      aria-pressed={isFavorite}
                      aria-label={a.favorites}
                    >
                      <Heart className={cn('h-4 w-4 sm:h-5 sm:w-5', isFavorite && 'fill-red-500 text-red-500')} />
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={addToCart}
                  className="mt-2 flex min-h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-[#145142] px-3 text-sm font-bold text-white transition hover:bg-[#104034] active:scale-[0.99] sm:mt-3 sm:min-h-12 sm:gap-2 sm:rounded-2xl sm:px-4 sm:text-lg"
                >
                  <ShoppingBag className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
                  {justAdded ? pd.addedHint : pd.toCart}
                </button>
              </div>
            </div>

            {(ingredients.length > 0 || compositionLoading) && (
              <section className="w-full max-w-full rounded-xl border border-[#145142]/20 bg-white sm:rounded-[24px]">
                <div className="flex items-center gap-1.5 border-b border-[#145142]/12 bg-white px-2.5 py-2 sm:gap-2 sm:px-4 sm:py-2.5">
                  <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#e85d2a] sm:h-4 sm:w-4" strokeWidth={2.4} aria-hidden />
                  <h2 className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-[#145142] sm:text-sm sm:tracking-[0.12em]">
                    {pd.composition}
                  </h2>
                </div>
                <div className="bg-white px-2.5 py-2.5 sm:px-4 sm:py-3">
                  <div className="grid grid-cols-4 gap-2 sm:gap-3">
                    {ingredients.length > 0
                      ? ingredients.map((ing) => (
                          <div
                            key={ing.id}
                            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border border-[#145142]/12 bg-[#f6faf8] p-1.5 text-center sm:rounded-2xl sm:p-2"
                          >
                            <div className="flex min-h-0 flex-1 w-full items-center justify-center">
                              {ing.imageUrl ? (
                                <img
                                  src={ing.imageUrl}
                                  alt=""
                                  className="max-h-full max-w-full object-contain"
                                  decoding="async"
                                  loading="lazy"
                                />
                              ) : (
                                <span className="text-lg sm:text-xl" aria-hidden>
                                  🥢
                                </span>
                              )}
                            </div>
                            <p className="line-clamp-2 w-full text-[9px] font-bold leading-tight text-[#0f241e] sm:text-[11px]">
                              {getIngName(ing)}
                            </p>
                          </div>
                        ))
                      : Array.from({ length: 4 }).map((_, i) => (
                          <div
                            key={i}
                            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border border-[#145142]/8 bg-[#f6faf8] p-1.5 sm:rounded-2xl sm:p-2"
                          >
                            <div className="h-8 w-8 animate-pulse rounded-lg bg-[#145142]/10 sm:h-9 sm:w-9" />
                            <div className="h-2 w-10 animate-pulse rounded bg-[#145142]/10" />
                          </div>
                        ))}
                  </div>
                </div>
              </section>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-[#145142]/10 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-600 sm:gap-2 sm:rounded-2xl sm:px-4 sm:py-2 sm:text-sm">
                <Clock className="h-3.5 w-3.5 text-[#145142] sm:h-4 sm:w-4" strokeWidth={2.2} aria-hidden />
                {pd.prepTime}
              </span>
            </div>
          </div>
          </div>
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <section className="relative mt-5 sm:mt-10" aria-labelledby="product-recommendations-heading">
            <div className="relative rounded-2xl border border-[#145142]/10 bg-white sm:rounded-[22px]">
              <div className="overflow-hidden rounded-[15px] px-3 py-5 sm:rounded-[21px] sm:px-5 sm:py-6">
                <div className="mb-4 flex items-end justify-between gap-3 sm:mb-5">
                  <div className="min-w-0">
                    <h2
                      id="product-recommendations-heading"
                      className="text-lg font-black leading-tight tracking-tight text-[#0f241e] sm:text-2xl"
                    >
                      {pd.recommendsTitle}
                    </h2>
                    <p className="hidden max-w-md text-xs leading-relaxed text-neutral-500 sm:block sm:text-sm">
                      {pd.recommendsHint}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    <button
                      type="button"
                      onClick={() => scrollRec(-1)}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-[#145142]/18 bg-white text-[#145142] transition hover:border-[#145142] hover:bg-[#145142] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#145142]/35 sm:h-10 sm:w-10"
                      aria-label={a.scrollLeft}
                    >
                      <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2.4} />
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollRec(1)}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-[#145142]/18 bg-white text-[#145142] transition hover:border-[#145142] hover:bg-[#145142] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#145142]/35 sm:h-10 sm:w-10"
                      aria-label={a.scrollRight}
                    >
                      <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2.4} />
                    </button>
                  </div>
                </div>

                <div className="relative -mx-1">
                  <div
                    ref={recScrollRef}
                    className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-1 pb-1 pt-0.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-5 sm:px-2 [&::-webkit-scrollbar]:hidden"
                  >
                    {recommendations.map((rec) => (
                      <div
                        key={rec.id}
                        className="snap-start snap-always pl-0 first:pl-1 last:pr-1 sm:first:pl-2 sm:last:pr-2"
                      >
                        <WattaMenuProductCard
                          variant="grid"
                          className="w-[min(240px,72vw)] shrink-0 rounded-[18px] border-[#145142]/12 transition duration-300 hover:-translate-y-0.5 sm:w-[min(260px,40vw)]"
                          product={{
                            id: rec.id,
                            name: getName(rec),
                            description: getDesc(rec),
                            price: rec.price,
                            emoji: '🍣',
                            imageUrl: rec.imageUrl ?? undefined,
                            isTop: rec.isPopular === true,
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
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
