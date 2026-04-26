'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { useLanguage } from '../../../context/LanguageContext'
import { getApiUrl } from '@/lib/utils'
import LogoBackground from '../../../components/LogoBackground'
import { WattaMenuProductCard } from '../../../components/WattaMenuProductCard'

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
  isRecommended?: boolean
  recommendOrder?: number
  allowRecommendations?: boolean
  promoDiscountPercent?: number
}

interface MenuCategoryRow {
  slug: string
  name: string
}

function sortCategoryItems(arr: MenuItem[]): MenuItem[] {
  return [...arr].sort((a, b) => {
    const aRec = a.isRecommended === true && a.allowRecommendations !== false
    const bRec = b.isRecommended === true && b.allowRecommendations !== false
    if (aRec !== bRec) return aRec ? -1 : 1
    if (aRec && bRec) return (a.recommendOrder ?? 0) - (b.recommendOrder ?? 0)
    return a.id - b.id
  })
}

export default function CategoryMenuClient({ slug }: { slug: string }) {
  const router = useRouter()
  const { t, language, getLocalized } = useLanguage()
  const [items, setItems] = useState<MenuItem[]>([])
  const [categoryTitle, setCategoryTitle] = useState('')
  const [loading, setLoading] = useState(true)

  const normalizedSlug = useMemo(() => {
    try {
      return decodeURIComponent(slug).trim()
    } catch {
      return slug.trim()
    }
  }, [slug])

  const mapProductsToItems = useCallback(
    (data: any[]) =>
      (data || []).map((p: any) => ({
        id: p.id,
        name: getLocalized(p, 'name'),
        description: getLocalized(p, 'description') || '',
        price: p.price,
        category: getLocalized(p.category, 'name') || 'Роллы',
        categorySlug: p.category?.slug || 'rolls',
        categoryId: p.categoryId,
        emoji: '🍣',
        imageUrl: p.imageUrl,
        isTop: p.isPopular,
        isRecommended: p.isRecommended === true,
        recommendOrder: typeof p.recommendOrder === 'number' ? p.recommendOrder : 0,
        allowRecommendations: p.category?.allowRecommendations !== false,
        promoDiscountPercent:
          typeof p.promoDiscountPercent === 'number' ? p.promoDiscountPercent : Number(p.promoDiscountPercent) || 0,
      })),
    [getLocalized]
  )

  const loadCategoriesTitle = useCallback(async () => {
    try {
      const res = await fetch(getApiUrl('/api/products/categories'))
      if (!res.ok) return
      const data = await res.json()
      const rows: MenuCategoryRow[] = (data || [])
        .filter((cat: any) => cat.isActive !== false)
        .map((cat: any) => {
          const name =
            language === 'uk' && cat.name_ua
              ? cat.name_ua
              : language === 'en' && cat.name_en
                ? cat.name_en
                : language === 'nl' && cat.name_nl
                  ? cat.name_nl
                  : cat.name_ru
          return { slug: cat.slug, name }
        })
      const hit = rows.find((c) => c.slug === normalizedSlug)
      if (hit?.name) setCategoryTitle(hit.name)
    } catch {
      /* ignore */
    }
  }, [language, normalizedSlug])

  const loadProducts = useCallback(async () => {
    setLoading(true)
    try {
      const rawCity =
        typeof window !== 'undefined' ? localStorage.getItem('selectedCityId') : null
      const cityId = rawCity ? parseInt(rawCity, 10) : NaN
      const url =
        Number.isFinite(cityId) && cityId > 0
          ? getApiUrl(`/api/products?cityId=${cityId}`)
          : getApiUrl('/api/products')
      const res = await fetch(url, { headers: { 'Cache-Control': 'max-age=120' } })
      const data = res.ok ? await res.json() : []
      const mapped = mapProductsToItems(Array.isArray(data) ? data : [])
      setItems(sortCategoryItems(mapped.filter((i) => i.categorySlug === normalizedSlug)))
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [mapProductsToItems, normalizedSlug])

  useEffect(() => {
    void loadCategoriesTitle()
  }, [loadCategoriesTitle])

  useEffect(() => {
    void loadProducts()
  }, [loadProducts, language])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const onProducts = () => void loadProducts()
    const onCity = () => void loadProducts()
    window.addEventListener('productsUpdated', onProducts)
    window.addEventListener('cityChanged', onCity)
    return () => {
      window.removeEventListener('productsUpdated', onProducts)
      window.removeEventListener('cityChanged', onCity)
    }
  }, [loadProducts])

  useEffect(() => {
    if (!categoryTitle && items.length > 0) {
      setCategoryTitle(items[0].category)
    }
  }, [categoryTitle, items])

  const addToCart = (item: MenuItem) => {
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
  }

  const displayTitle = categoryTitle || normalizedSlug

  return (
    <div className="watta-public-page-shell relative flex min-h-screen flex-1 flex-col overflow-x-hidden pb-20 pt-3 font-sans text-[#145142] sm:pt-4">
      <LogoBackground />
      <div className="relative z-10 mx-auto max-w-[1200px] px-4 sm:px-6">
        <div className="mb-4 flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 transition hover:bg-gray-200"
            aria-label={t.menuView.categoryPageBack}
          >
            <ArrowLeft size={20} className="text-gray-700" />
          </button>
          <h1 className="min-w-0 truncate text-lg font-bold text-[#145142] sm:text-xl">{displayTitle}</h1>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[40vh] text-[#145142] font-semibold">
            Завантаження…
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center text-gray-600">
            <p className="text-lg">{t.menuView.categoryPageEmpty}</p>
            <button
              type="button"
              onClick={() => router.push('/')}
              className="mt-6 text-[#145142] font-semibold underline"
            >
              {t.menuView.categoryPageBack}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item) => (
              <WattaMenuProductCard
                key={item.id}
                variant="grid"
                product={item}
                onAddToCart={() => addToCart(item)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
