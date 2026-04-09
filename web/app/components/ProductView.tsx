'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Heart,
  Minus,
  Plus,
  ShoppingBag,
  Sparkles,
} from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { cn, getApiUrl } from '@/lib/utils'
import { clampPromoPercent, effectiveUnitPrice } from '@/lib/productPricing'
import { useProductFavorite } from '@/hooks/useProductFavorite'
import { WattaMenuProductCard } from './WattaMenuProductCard'
import toast from 'react-hot-toast'

interface ProductViewProps {
  productId: string
  isAdmin?: boolean
  onBack: () => void
  onOpenProfile: () => void
  onOpenFavorites: () => void
  onOpenNotifications: () => void
  onMenuClick: () => void
  onCartClick: () => void
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
  categoryId: number
  isPopular?: boolean
  promoDiscountPercent?: number
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

export default function ProductView({ productId, onBack, onCartClick }: ProductViewProps) {
  const { t, language } = useLanguage()
  const pd = t.productDetail
  const [product, setProduct] = useState<Product | null>(null)
  const [recommendations, setRecommendations] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const { liked: isFavorite, toggle: toggleFavorite } = useProductFavorite(Number(productId))
  const [isAdding, setIsAdding] = useState(false)
  const [justAdded, setJustAdded] = useState(false)
  const compScrollRef = useRef<HTMLDivElement>(null)
  const recScrollRef = useRef<HTMLDivElement>(null)

  const pickLoc = (row: Record<string, unknown>, key: string, fallback: string) => {
    const v = row[key]
    return typeof v === 'string' && v.trim() ? v : fallback
  }

  const getName = (p: Product) => pickLoc(p as unknown as Record<string, unknown>, `name_${language}`, p.name_ru)
  const getDesc = (p: Product) =>
    pickLoc(p as unknown as Record<string, unknown>, `description_${language}`, p.description_ru || '')
  const getIngName = (ing: IngredientRow) =>
    pickLoc(ing as unknown as Record<string, unknown>, `name_${language}`, ing.name_ru)

  const fetchProductData = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch(getApiUrl(`/api/products/${productId}`))
      if (res.ok) {
        const data = await res.json()
        setProduct(data)
      } else {
        setProduct(null)
      }
    } catch (e) {
      console.error(e)
      setProduct(null)
    } finally {
      setIsLoading(false)
    }
  }, [productId])

  const fetchRecommendations = useCallback(async () => {
    try {
      const rawCity = typeof window !== 'undefined' ? localStorage.getItem('selectedCityId') : null
      const cityId = rawCity ? parseInt(rawCity, 10) : NaN
      const q = new URLSearchParams({ excludeId: String(productId), limit: '24' })
      if (Number.isFinite(cityId) && cityId > 0) q.set('cityId', String(cityId))
      const res = await fetch(getApiUrl(`/api/products/recommendations?${q.toString()}`))
      if (!res.ok) return
      const data = (await res.json()) as Product[]
      setRecommendations(Array.isArray(data) ? data.slice(0, 12) : [])
    } catch (e) {
      console.error(e)
    }
  }, [productId])

  useEffect(() => {
    fetchProductData()
  }, [productId, fetchProductData])

  useEffect(() => {
    void fetchRecommendations()
  }, [fetchRecommendations])

  const addToCart = () => {
    if (!product) return
    setIsAdding(true)
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    for (let i = 0; i < quantity; i++) {
      cart.push(product)
    }
    localStorage.setItem('cart', JSON.stringify(cart))
    window.dispatchEvent(new CustomEvent('cartUpdated'))
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
    const cartItem = {
      id: rec.id,
      name: getName(rec),
      description: getDesc(rec),
      price: rec.price,
      category: '',
      emoji: '🍣',
      imageUrl: rec.imageUrl,
      promoDiscountPercent: rec.promoDiscountPercent,
    }
    cart.push(cartItem)
    localStorage.setItem('cart', JSON.stringify(cart))
    window.dispatchEvent(new CustomEvent('cartUpdated'))
    toast.success(t.addToCart)
  }

  const scrollComp = (dir: -1 | 1) => {
    const el = compScrollRef.current
    if (!el) return
    el.scrollBy({ left: dir * Math.min(280, el.clientWidth * 0.85), behavior: 'smooth' })
  }

  const scrollRec = (dir: -1 | 1) => {
    const el = recScrollRef.current
    if (!el) return
    el.scrollBy({ left: dir * Math.min(300, el.clientWidth * 0.8), behavior: 'smooth' })
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-1 flex-col items-center justify-center bg-white font-semibold text-[#145142]">
        {pd.loading}
      </div>
    )
  }
  if (!product) {
    return (
      <div className="flex min-h-screen flex-1 flex-col items-center justify-center bg-white text-[#145142]">
        {pd.notFound}
      </div>
    )
  }

  const desc = getDesc(product)
  const { weightLine, piecesLine } = parseSpecsFromDescription(desc, pd.weightFallback, pd.piecesFallback)
  const ingredients = product.ingredients && product.ingredients.length > 0 ? product.ingredients : []
  const promoPct = clampPromoPercent(product.promoDiscountPercent)
  const unitEffective = effectiveUnitPrice(product.price, promoPct)

  const mobileBarBottom = 'max(1rem, env(safe-area-inset-bottom, 0px))'

  return (
    <div className="relative flex min-h-screen flex-1 flex-col bg-white pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))] md:pb-16">
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b border-black/[0.04] bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={onBack}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-black/[0.06] bg-white text-neutral-800 shadow-sm transition hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#145142]/30"
            aria-label={t.auth.back}
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2.2} />
          </button>
          <p className="line-clamp-1 min-w-0 flex-1 text-center text-sm font-semibold text-neutral-900 sm:text-base">
            {getName(product)}
          </p>
          <button
            type="button"
            onClick={onCartClick}
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#145142] text-white shadow-md shadow-[#145142]/25 transition hover:bg-[#104034] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#145142]/40"
            aria-label={t.cart}
          >
            <ShoppingBag className="h-5 w-5" strokeWidth={2.2} />
          </button>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:gap-14">
          {/* Image */}
          <div className="w-full lg:w-[48%] lg:shrink-0">
            <div className="relative overflow-hidden rounded-[24px] bg-[#f4f6f5] shadow-[0_20px_60px_rgba(15,40,32,0.08)] sm:rounded-[28px]">
              <div className="aspect-square w-full">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={getName(product)}
                    className="h-full w-full object-contain p-4 sm:p-8"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-7xl">🍱</div>
                )}
              </div>
              <button
                type="button"
                onClick={() => toggleFavorite()}
                className="absolute right-4 top-4 flex h-12 w-12 items-center justify-center rounded-full border border-black/[0.06] bg-white shadow-md transition active:scale-95"
                aria-pressed={isFavorite}
              >
                <Heart
                  className={cn('h-6 w-6 transition-colors', isFavorite ? 'fill-red-500 text-red-500' : 'text-neutral-400')}
                />
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="flex min-w-0 flex-1 flex-col gap-6">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
                  {getName(product)}
                </h1>
                {promoPct > 0 ? (
                  <span className="rounded-full bg-[#fff0e8] px-2.5 py-0.5 text-xs font-extrabold text-[#c45a12] ring-1 ring-[#f5c4a8]">
                    −{promoPct}%
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-base font-bold text-[#e85d2a] sm:text-lg">
                {weightLine} / {piecesLine}
              </p>
            </div>

            {ingredients.length > 0 && (
              <section className="rounded-[20px] border border-black/[0.05] bg-[#fafbfb] p-4 sm:p-5">
                <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-neutral-500">
                  {pd.composition}
                </h2>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => scrollComp(-1)}
                    className="absolute -left-1 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-black/[0.08] bg-white shadow-md sm:flex"
                    aria-label="Scroll left"
                  >
                    <ChevronLeft className="h-5 w-5 text-neutral-600" />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollComp(1)}
                    className="absolute -right-1 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-black/[0.08] bg-white shadow-md sm:flex"
                    aria-label="Scroll right"
                  >
                    <ChevronRight className="h-5 w-5 text-neutral-600" />
                  </button>
                  <div
                    ref={compScrollRef}
                    className="flex gap-3 overflow-x-auto pb-1 pt-0.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:px-10 [&::-webkit-scrollbar]:hidden"
                  >
                    {ingredients.map((ing) => (
                      <div
                        key={ing.id}
                        className="w-[132px] shrink-0 rounded-2xl border border-white bg-white p-3 text-center shadow-sm"
                      >
                        <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-xl bg-[#f4f6f5]">
                          {ing.imageUrl ? (
                            <img src={ing.imageUrl} alt="" className="max-h-14 max-w-14 object-contain" />
                          ) : (
                            <span className="text-2xl">🥢</span>
                          )}
                        </div>
                        <p className="line-clamp-2 text-xs font-semibold leading-snug text-neutral-800">
                          {getIngName(ing)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {desc ? (
              <p className="text-base leading-relaxed text-neutral-600">{desc}</p>
            ) : null}

            <div className="hidden items-center gap-2 text-sm font-semibold text-neutral-500 md:flex">
              <span className="rounded-xl bg-[#f4f6f5] px-3 py-1.5">⏱ {pd.prepTime}</span>
            </div>

            {/* Desktop CTA */}
            <div className="mt-2 hidden md:block">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex flex-wrap items-baseline gap-2">
                  {promoPct > 0 ? (
                    <span className="text-xl font-semibold text-neutral-400 line-through">{product.price} €</span>
                  ) : null}
                  <p className="text-3xl font-bold text-neutral-900">{unitEffective} €</p>
                </div>
                <div className="flex flex-1 items-center gap-3 min-w-[280px]">
                  <div className="flex items-center rounded-[18px] border border-black/[0.06] bg-[#f4f6f5] p-1">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-white text-[#145142] shadow-sm transition hover:bg-neutral-50"
                    >
                      <Minus className="h-5 w-5" strokeWidth={2.5} />
                    </button>
                    <span className="min-w-[2.5rem] text-center text-lg font-bold text-neutral-900">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.min(99, quantity + 1))}
                      className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#145142] text-white shadow-md transition hover:bg-[#104034]"
                    >
                      <Plus className="h-5 w-5" strokeWidth={2.5} />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleFavorite()}
                    className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[18px] border-2 border-[#145142]/20 bg-white text-[#145142] transition hover:bg-[#145142]/5"
                  >
                    <Heart className={cn('h-6 w-6', isFavorite && 'fill-red-500 text-red-500')} />
                  </button>
                  <button
                    type="button"
                    onClick={addToCart}
                    disabled={isAdding}
                    className="flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-[18px] bg-[#145142] px-6 text-lg font-bold text-white shadow-lg shadow-[#145142]/25 transition hover:bg-[#104034] disabled:opacity-70"
                  >
                    <ShoppingBag className="h-5 w-5" />
                    {isAdding ? pd.adding : pd.toCart}
                  </button>
                </div>
              </div>
              {justAdded ? (
                <p className="mt-3 text-sm font-semibold text-[#145142]">{pd.addedHint}</p>
              ) : null}
            </div>
          </div>
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <section className="relative mt-14 sm:mt-20" aria-labelledby="product-recommendations-heading">
            <div className="pointer-events-none absolute -inset-x-4 -top-6 bottom-0 sm:-inset-x-8">
              <div className="absolute left-0 top-0 h-72 w-72 -translate-x-1/3 rounded-full bg-[#145142]/[0.07] blur-3xl" />
              <div className="absolute bottom-0 right-0 h-64 w-64 translate-x-1/4 rounded-full bg-[#e85d2a]/[0.08] blur-3xl" />
            </div>

            <div className="relative rounded-[28px] bg-gradient-to-br from-[#145142]/18 via-[#e85d2a]/10 to-[#145142]/12 p-[1px] shadow-[0_24px_80px_rgba(20,81,66,0.08)]">
              <div className="overflow-hidden rounded-[27px] bg-gradient-to-br from-[#f6fbf9] via-white to-[#fffaf7] px-4 py-8 sm:px-8 sm:py-10">
                <div className="mb-8 flex flex-col gap-5 sm:mb-10 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
                  <div className="min-w-0 space-y-2">
                    <p className="inline-flex items-center gap-2 rounded-full border border-[#145142]/15 bg-white/80 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#145142] shadow-sm backdrop-blur-sm sm:text-[11px]">
                      <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#e85d2a]" strokeWidth={2.4} aria-hidden />
                      <span className="truncate">{pd.recommendsTitle.split(/\s+/)[0] ?? 'Watta'}</span>
                    </p>
                    <h2
                      id="product-recommendations-heading"
                      className="text-[1.65rem] font-black leading-tight tracking-tight text-[#0f241e] sm:text-4xl sm:leading-[1.1]"
                    >
                      <span className="bg-gradient-to-r from-[#0f241e] via-[#145142] to-[#0d3d32] bg-clip-text text-transparent">
                        {pd.recommendsTitle}
                      </span>
                    </h2>
                    <p className="max-w-lg text-sm leading-relaxed text-neutral-500">
                      {pd.recommendsHint}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => scrollRec(-1)}
                      className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#145142]/18 bg-white text-[#145142] shadow-md shadow-[#145142]/10 transition hover:scale-[1.05] hover:border-[#145142] hover:bg-[#145142] hover:text-white hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#145142]/35"
                      aria-label="Scroll left"
                    >
                      <ChevronLeft className="h-5 w-5" strokeWidth={2.4} />
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollRec(1)}
                      className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#145142]/18 bg-white text-[#145142] shadow-md shadow-[#145142]/10 transition hover:scale-[1.05] hover:border-[#145142] hover:bg-[#145142] hover:text-white hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#145142]/35"
                      aria-label="Scroll right"
                    >
                      <ChevronRight className="h-5 w-5" strokeWidth={2.4} />
                    </button>
                  </div>
                </div>

                <div className="relative -mx-1">
                  <div
                    className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-6 bg-gradient-to-r from-[#f6fbf9] to-transparent sm:w-10"
                    aria-hidden
                  />
                  <div
                    className="pointer-events-none absolute inset-y-0 right-0 z-[1] w-6 bg-gradient-to-l from-[#fffaf7] to-transparent sm:w-10"
                    aria-hidden
                  />
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
                          className="w-[min(292px,82vw)] shrink-0 rounded-[22px] border-[#145142]/12 shadow-[0_14px_44px_rgba(20,81,66,0.11)] ring-1 ring-black/[0.03] transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_56px_rgba(20,81,66,0.15)]"
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

      {/* Mobile sticky bar — над safe area */}
      <div
        className="fixed inset-x-0 z-[60] border-t border-black/[0.06] bg-white/95 px-4 py-3 shadow-[0_-12px_40px_rgba(0,0,0,0.08)] backdrop-blur-md md:hidden"
        style={{ bottom: mobileBarBottom }}
      >
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div className="min-w-0 flex-1">
            {promoPct > 0 ? (
              <p className="text-sm font-medium text-neutral-400 line-through">
                {Math.round(product.price * quantity * 100) / 100} €
              </p>
            ) : null}
            <p className="text-lg font-bold text-neutral-900">
              {Math.round(unitEffective * quantity * 100) / 100} €
            </p>
            {justAdded ? <p className="text-xs font-semibold text-[#145142]">{pd.addedHint}</p> : null}
          </div>
          <button
            type="button"
            onClick={() => toggleFavorite()}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-black/[0.08] bg-white"
          >
            <Heart className={cn('h-6 w-6', isFavorite ? 'fill-red-500 text-red-500' : 'text-neutral-400')} />
          </button>
          <button
            type="button"
            onClick={addToCart}
            disabled={isAdding}
            className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#145142] px-4 text-base font-bold text-white shadow-md disabled:opacity-70"
          >
            <ShoppingBag className="h-5 w-5 shrink-0" />
            {isAdding ? pd.adding : pd.toCart}
          </button>
        </div>
        <div className="mx-auto mt-2 flex max-w-lg items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f4f6f5] text-[#145142]"
          >
            <Minus className="h-4 w-4" strokeWidth={2.5} />
          </button>
          <span className="w-8 text-center text-sm font-bold">{quantity}</span>
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
