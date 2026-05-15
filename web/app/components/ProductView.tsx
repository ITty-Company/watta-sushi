'use client'

import React, { useEffect, useMemo, useRef, startTransition, useState } from 'react'
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
import type { WattaLanguage } from '@/lib/i18n/language'
import { cn, getApiUrl } from '@/lib/utils'
import { clampPromoPercent, effectiveUnitPrice } from '@/lib/productPricing'
import { useProductFavorite } from '@/hooks/useProductFavorite'
import { WattaMenuProductCard } from './WattaMenuProductCard'
import { ProductImageGallery } from './ProductImageGallery'
import { productGalleryFromApi } from '@/lib/productGallery'
import toast from 'react-hot-toast'

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

function parseSpecsFromDescription(
  desc: string,
  weightFallback: string,
  piecesFallback: string
): { weightLine: string; piecesLine: string } {
  const g = desc.match(/(\d+)\s*г\b/i)?.[1]
  const ml = desc.match(/(\d+)\s*мл\b/i)?.[1]
  const pcs =
    desc.match(/(\d+)\s*(шт|pcs|st\.|stuks)/i)?.[1] ||
    desc.match(/(\d+)\s*(pieces|pcs)\b/i)?.[1]

  const weightLine = ml ? `${ml} мл` : g ? `${g} г` : weightFallback
  const piecesLine = pcs ? `${pcs} шт` : piecesFallback
  return { weightLine, piecesLine }
}

export default function ProductView({ productId, onBack }: ProductViewProps) {
  const { t, language } = useLanguage()
  const pd = t.productDetail
  const cs = t.cartSection
  const a = t.siteAria
  const [product, setProduct] = useState<Product | null>(null)
  const [recommendations, setRecommendations] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const { liked: isFavorite, toggle: toggleFavorite } = useProductFavorite(Number(productId))
  const [isAdding, setIsAdding] = useState(false)
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

  useEffect(() => {
    const ac = new AbortController()
    let cancelled = false

    setIsLoading(true)
    setProduct(null)
    setRecommendations([])

    const productUrl = getApiUrl(`/api/products/${productId}`)
    const rawCity = typeof window !== 'undefined' ? localStorage.getItem('selectedCityId') : null
    const cityId = rawCity ? parseInt(rawCity, 10) : NaN
    const recQ = new URLSearchParams({ excludeId: String(productId), limit: '24' })
    if (Number.isFinite(cityId) && cityId > 0) recQ.set('cityId', String(cityId))
    const recUrl = getApiUrl(`/api/products/recommendations?${recQ.toString()}`)

    const productFetch = fetch(productUrl, { signal: ac.signal, headers: { 'Cache-Control': 'max-age=60' } })
    const recFetch = fetch(recUrl, { signal: ac.signal, headers: { 'Cache-Control': 'max-age=60' } })

    void productFetch
      .then(async (res) => {
        if (cancelled) return
        if (res.ok) {
          setProduct((await res.json()) as Product)
        } else {
          setProduct(null)
        }
      })
      .catch((e) => {
        if (cancelled) return
        if (e && typeof e === 'object' && (e as { name?: string }).name === 'AbortError') return
        console.error(e)
        setProduct(null)
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
  }, [productId])

  const addToCart = () => {
    if (!product) return
    setIsAdding(true)
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
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
    for (let i = 0; i < quantity; i++) {
      cart.push(line)
    }
    try {
      localStorage.setItem('cart', JSON.stringify(cart))
      window.dispatchEvent(new CustomEvent('cartUpdated'))
    } catch (e) {
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        toast.error(cs.toastStorageQuota)
        setIsAdding(false)
        return
      }
      throw e
    }
    setTimeout(() => {
      setIsAdding(false)
      setJustAdded(true)
      setTimeout(() => setJustAdded(false), 2200)
    }, 400)
  }

  const addRecToCart = (rec: Product) => {
    if (typeof window === 'undefined' || !window.localStorage) return
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    const n = cart.filter((x: { id?: number }) => x?.id === rec.id).length
    if (n >= 99) return
    const cover =
      (rec.imageUrl && String(rec.imageUrl).trim()) ||
      productGalleryFromApi({ imageUrl: rec.imageUrl, imageUrls: rec.imageUrls })[0]
    const cartItem = {
      id: rec.id,
      name: getName(rec),
      description: getDesc(rec),
      price: rec.price,
      category: getCategoryLabel(rec) || '',
      emoji: rec.category?.emoji || '🍣',
      imageUrl: cover,
      promoDiscountPercent: rec.promoDiscountPercent,
    }
    cart.push(cartItem)
    try {
      localStorage.setItem('cart', JSON.stringify(cart))
      window.dispatchEvent(new CustomEvent('cartUpdated'))
    } catch (e) {
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        toast.error(cs.toastStorageQuota)
        return
      }
      throw e
    }
    toast.success(t.addToCart)
  }

  const scrollRec = (dir: -1 | 1) => {
    const el = recScrollRef.current
    if (!el) return
    el.scrollBy({ left: dir * Math.min(300, el.clientWidth * 0.8), behavior: 'smooth' })
  }

  const galleryImages = useMemo(
    () => (product ? productGalleryFromApi(product) : []),
    [product],
  )

  if (isLoading) {
    return (
      <div className="relative flex min-h-[min(100dvh,56rem)] flex-1 flex-col watta-page-bg pb-24">
        <div className="relative mx-auto w-full max-w-6xl flex-1 px-4 py-4 sm:px-6 sm:py-5">
          <div className="mb-5 flex min-w-0 items-center gap-3 sm:mb-6">
            <div className="h-11 w-11 shrink-0 rounded-2xl border border-[#145142]/10 bg-white/60 animate-pulse" />
            <div className="h-4 min-w-0 flex-1 max-w-sm rounded-md bg-[#145142]/10 animate-pulse" />
          </div>
          <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-12">
            <div className="w-full lg:w-[46%] shrink-0">
              <div className="overflow-hidden rounded-[26px] border border-[#145142]/8 bg-white/50 sm:rounded-[30px]">
                <div className="aspect-square w-full bg-gradient-to-br from-[#e8f0ec] to-[#f4f6f4] animate-pulse" />
              </div>
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-5">
              <div className="h-9 w-4/5 max-w-md rounded-lg bg-[#145142]/12 animate-pulse" />
              <div className="h-9 w-1/2 max-w-xs rounded-lg bg-[#145142]/8 animate-pulse" />
              <div className="h-20 w-full rounded-2xl bg-[#145142]/6 animate-pulse" />
              <p className="text-xs font-semibold text-[#145142]/70">{pd.loading}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }
  if (!product) {
    return (
      <div className="flex min-h-screen flex-1 flex-col items-center justify-center watta-page-bg px-6 text-center">
        <p className="text-lg font-semibold text-[#145142]">{pd.notFound}</p>
      </div>
    )
  }

  const desc = getDesc(product)
  const { weightLine, piecesLine } = parseSpecsFromDescription(desc, pd.weightFallback, pd.piecesFallback)
  const ingredients = product.ingredients && product.ingredients.length > 0 ? product.ingredients : []
  const promoPct = clampPromoPercent(product.promoDiscountPercent)
  const unitEffective = effectiveUnitPrice(product.price, promoPct)
  const lineTotal = Math.round(product.price * quantity * 100) / 100
  const totalEffective = Math.round(unitEffective * quantity * 100) / 100

  /** Від низу viewport — лише safe-area (глобальної нижньої таб-панелі немає) */
  const mobileStickyBarBottom = 'env(safe-area-inset-bottom, 0px)'

  const categoryLabel = getCategoryLabel(product)
  const categoryEmoji = product.category?.emoji || '🍣'

  return (
    <div
      className="relative flex min-h-screen flex-1 flex-col watta-page-bg pb-[calc(9.5rem+env(safe-area-inset-bottom,0px))] md:pb-16"
    >
      <div className="relative mx-auto w-full max-w-6xl flex-1 px-4 pb-6 pt-4 sm:px-6 sm:pb-10 sm:pt-5">
        <div className="mb-5 flex min-w-0 flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#145142]/15 bg-white text-neutral-800 transition hover:border-[#145142]/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#145142]/35"
              aria-label={t.auth.back}
            >
              <ArrowLeft className="h-5 w-5" strokeWidth={2.2} />
            </button>
            <p className="line-clamp-1 min-w-0 flex-1 text-sm font-semibold text-neutral-900 sm:text-base">
              {getName(product)}
            </p>
          </div>
          {categoryLabel ? (
            <span className="inline-flex w-fit items-center gap-2 self-start rounded-full border border-[#145142]/15 bg-white px-3.5 py-1.5 text-xs font-bold text-[#145142] sm:self-center">
              <span className="text-base leading-none" aria-hidden>
                {categoryEmoji}
              </span>
              {categoryLabel}
            </span>
          ) : null}
        </div>
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-12 xl:gap-16">
          {/* Image */}
          <div className="w-full lg:w-[46%] lg:shrink-0">
            <div className="relative">
              <div className="relative overflow-hidden rounded-[26px] border border-[#145142]/12 bg-white sm:rounded-[30px]">
                <ProductImageGallery
                  images={galleryImages}
                  alt={getName(product)}
                  labels={{
                    prev: pd.galleryPrev,
                    next: pd.galleryNext,
                    progress: pd.galleryProgress,
                  }}
                />
                <button
                  type="button"
                  onClick={() => toggleFavorite()}
                  className="absolute right-4 top-4 z-[2] flex h-12 w-12 items-center justify-center rounded-full border border-[#145142]/15 bg-white text-neutral-500 transition hover:scale-105 active:scale-95"
                  aria-pressed={isFavorite}
                >
                  <Heart
                    className={cn(
                      'h-6 w-6 transition-colors',
                      isFavorite ? 'fill-red-500 text-red-500' : 'text-neutral-400',
                    )}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="flex min-w-0 flex-1 flex-col gap-7">
            <div className="space-y-4">
              <div className="flex flex-wrap items-baseline gap-3">
                <h1 className="text-[1.75rem] font-extrabold leading-tight tracking-tight text-[#0a1814] sm:text-4xl lg:text-[2.35rem]">
                  {getName(product)}
                </h1>
                {promoPct > 0 ? (
                  <span className="rounded-full border border-[#f0b090]/60 bg-[#fff4ed] px-3 py-1 text-xs font-extrabold text-[#b54a0a]">
                    −{promoPct}%
                  </span>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-full border border-[#e85d2a]/25 bg-[#fff8f3] px-3.5 py-1.5 text-sm font-bold text-[#c95a1a]">
                  {weightLine}
                </span>
                <span className="inline-flex items-center rounded-full border border-[#145142]/15 bg-[#f0f7f3] px-3.5 py-1.5 text-sm font-bold text-[#145142]">
                  {piecesLine}
                </span>
              </div>
            </div>

            {ingredients.length > 0 && (
              <section className="h-fit min-h-0 w-full max-w-full overflow-hidden rounded-[22px] border border-[#145142]/20 bg-white sm:rounded-[24px]">
                <div className="flex items-center gap-2 border-b border-[#145142]/12 bg-white px-3 py-2.5 sm:px-4 sm:py-2.5">
                  <Sparkles className="h-4 w-4 shrink-0 text-[#e85d2a]" strokeWidth={2.4} aria-hidden />
                  <h2 className="text-sm font-extrabold uppercase tracking-[0.12em] text-[#145142]">
                    {pd.composition}
                  </h2>
                </div>
                <div className="bg-white px-2 pt-1.5 pb-2 sm:px-3 sm:pt-2 sm:pb-2.5">
                  <div className="flex min-h-0 w-full flex-wrap content-start items-start justify-center gap-x-4 gap-y-2.5 sm:gap-x-5 sm:gap-y-3">
                    {ingredients.map((ing) => (
                      <div
                        key={ing.id}
                        className="flex h-fit w-[5.5rem] max-w-full shrink-0 flex-col items-center self-start text-center sm:w-24"
                      >
                        <div className="mb-0.5 flex h-12 w-full max-w-[4.5rem] shrink-0 items-center justify-center sm:h-14 sm:max-w-20">
                          {ing.imageUrl ? (
                            <img
                              src={ing.imageUrl}
                              alt=""
                              className="h-full w-full object-contain"
                              decoding="async"
                              loading="lazy"
                            />
                          ) : (
                            <span className="text-xl">🥢</span>
                          )}
                        </div>
                        <p className="line-clamp-2 w-full text-[11px] font-bold leading-tight text-[#0f241e] sm:text-xs">
                          {getIngName(ing)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {desc ? (
              <div className="rounded-2xl border border-[#145142]/10 border-l-4 border-l-[#145142] bg-white py-4 pl-5 pr-4 sm:pl-6 sm:pr-5">
                <p className="text-[0.95rem] leading-[1.75] text-neutral-700 sm:text-base">{desc}</p>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-2xl border border-[#145142]/10 bg-white px-4 py-2 text-sm font-semibold text-neutral-600">
                <Clock className="h-4 w-4 text-[#145142]" strokeWidth={2.2} aria-hidden />
                {pd.prepTime}
              </span>
            </div>

            {/* Desktop CTA */}
            <div className="mt-1 hidden md:block">
              <div className="rounded-[22px] border border-[#145142]/10 bg-white p-5 sm:p-6">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                  <div className="flex flex-wrap items-baseline gap-3">
                    {promoPct > 0 ? (
                      <span className="text-2xl font-semibold text-neutral-400 line-through">
                        {lineTotal} €
                      </span>
                    ) : null}
                    <p className="text-4xl font-black tabular-nums tracking-tight text-[#0a1814]">
                      {totalEffective}{' '}
                      <span className="text-2xl font-bold text-[#145142]/90">€</span>
                    </p>
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:gap-3 xl:max-w-xl">
                    <div className="flex items-center justify-center rounded-2xl border border-[#145142]/12 bg-white p-1 sm:justify-start">
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f0f5f2] text-[#145142] transition hover:bg-[#e4ede8]"
                      >
                        <Minus className="h-5 w-5" strokeWidth={2.5} />
                      </button>
                      <span className="min-w-[2.75rem] text-center text-lg font-black text-neutral-900">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.min(99, quantity + 1))}
                        className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#145142] text-white transition hover:bg-[#104034]"
                      >
                        <Plus className="h-5 w-5" strokeWidth={2.5} />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleFavorite()}
                      className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl border-2 border-[#145142]/15 bg-white text-[#145142] transition hover:border-[#145142]/35 hover:bg-[#145142]/5"
                    >
                      <Heart className={cn('h-6 w-6', isFavorite && 'fill-red-500 text-red-500')} />
                    </button>
                    <button
                      type="button"
                      onClick={addToCart}
                      disabled={isAdding}
                      className="flex min-h-[52px] flex-1 items-center justify-center gap-2.5 rounded-2xl bg-[#145142] px-6 text-lg font-bold text-white transition hover:bg-[#104034] active:scale-[0.99] disabled:opacity-70"
                    >
                      <ShoppingBag className="h-5 w-5 shrink-0" />
                      {isAdding ? pd.adding : pd.toCart}
                    </button>
                  </div>
                </div>
                {justAdded ? (
                  <p className="mt-4 text-center text-sm font-semibold text-[#145142] xl:text-left">{pd.addedHint}</p>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <section className="relative mt-14 sm:mt-20" aria-labelledby="product-recommendations-heading">
            <div className="relative rounded-[28px] border border-[#145142]/10 bg-white">
              <div className="overflow-hidden rounded-[27px] px-4 py-8 sm:px-8 sm:py-10">
                <div className="mb-8 flex flex-col gap-5 sm:mb-10 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
                  <div className="min-w-0 space-y-2">
                    <p className="inline-flex items-center gap-2 rounded-full border border-[#145142]/15 bg-white px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#145142] sm:text-[11px]">
                      <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#e85d2a]" strokeWidth={2.4} aria-hidden />
                      <span className="truncate">{pd.recommendsTitle.split(/\s+/)[0] ?? t.common.brandShort}</span>
                    </p>
                    <h2
                      id="product-recommendations-heading"
                      className="text-[1.65rem] font-black leading-tight tracking-tight text-[#0f241e] sm:text-4xl sm:leading-[1.1]"
                    >
                      <span className="text-[#0f241e]">{pd.recommendsTitle}</span>
                    </h2>
                    <p className="max-w-lg text-sm leading-relaxed text-neutral-500">
                      {pd.recommendsHint}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => scrollRec(-1)}
                      className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#145142]/18 bg-white text-[#145142] transition hover:scale-[1.05] hover:border-[#145142] hover:bg-[#145142] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#145142]/35"
                      aria-label={a.scrollLeft}
                    >
                      <ChevronLeft className="h-5 w-5" strokeWidth={2.4} />
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollRec(1)}
                      className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#145142]/18 bg-white text-[#145142] transition hover:scale-[1.05] hover:border-[#145142] hover:bg-[#145142] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#145142]/35"
                      aria-label={a.scrollRight}
                    >
                      <ChevronRight className="h-5 w-5" strokeWidth={2.4} />
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
                          className="w-[min(292px,82vw)] shrink-0 rounded-[22px] border-[#145142]/12 transition duration-300 hover:-translate-y-1"
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
                            parseSpecsFromDescription(getDesc(rec), pd.weightFallback, pd.piecesFallback)
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

      {/* Mobile sticky bar — прижата до низу з урахуванням safe-area */}
      <div
        className="fixed inset-x-0 z-[100] box-border border-t border-[#145142]/10 bg-white px-4 py-3 md:hidden"
        style={{ bottom: mobileStickyBarBottom }}
      >
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div className="min-w-0 flex-1">
            {promoPct > 0 ? (
              <p className="text-sm font-medium text-neutral-400 line-through">
                {lineTotal} €
              </p>
            ) : null}
            <p className="text-lg font-black tabular-nums text-[#0a1814]">
              {totalEffective} €
            </p>
            {justAdded ? <p className="text-xs font-semibold text-[#145142]">{pd.addedHint}</p> : null}
          </div>
          <button
            type="button"
            onClick={() => toggleFavorite()}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#145142]/12 bg-[#f6faf8] text-[#145142]"
          >
            <Heart className={cn('h-6 w-6', isFavorite ? 'fill-red-500 text-red-500' : 'text-neutral-400')} />
          </button>
          <button
            type="button"
            onClick={addToCart}
            disabled={isAdding}
            className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#145142] px-4 text-base font-bold text-white hover:bg-[#104034] disabled:opacity-70"
          >
            <ShoppingBag className="h-5 w-5 shrink-0" />
            {isAdding ? pd.adding : pd.toCart}
          </button>
        </div>
        <div className="mx-auto mt-2 flex max-w-lg items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#145142]/10 bg-white text-[#145142]"
          >
            <Minus className="h-4 w-4" strokeWidth={2.5} />
          </button>
          <span className="w-8 text-center text-sm font-black text-neutral-900">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity(Math.min(99, quantity + 1))}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#145142] text-white"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  )
}
