'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useInstantRouter } from '@/hooks/useInstantRouter'
import { ArrowLeft } from 'lucide-react'
import { useLanguage } from '../../../context/LanguageContext'
import { getApiUrl } from '@/lib/utils'
import { fetchPublicApi, fetchPublicApiFresh } from '@/lib/publicApiFetch'
import { useWattaCatalogSync } from '@/hooks/useWattaCatalogSync'
import LogoBackground from '../../../components/LogoBackground'
import { WattaMenuProductCard } from '../../../components/WattaMenuProductCard'
import { getMenuCategoryDisplayName } from '@/lib/i18n/getMenuCategoryDisplayName'
import { readCityIdForProductApi } from '@/lib/wattaSiteLocalePrefs'
import { useMenuAddToCart } from '@/hooks/useMenuAddToCart'
import { productGalleryFromApi } from '@/lib/productGallery'

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
}

interface MenuCategoryRow {
  id: number
  slug: string
  name: string
}

function sortCategoryItems(arr: MenuItem[]): MenuItem[] {
  return [...arr].sort((a, b) => {
    const aRec = a.isHomeHit === true && a.allowRecommendations !== false
    const bRec = b.isHomeHit === true && b.allowRecommendations !== false
    if (aRec !== bRec) return aRec ? -1 : 1
    if (aRec && bRec) return (a.recommendOrder ?? 0) - (b.recommendOrder ?? 0)
    return a.id - b.id
  })
}

export default function CategoryMenuClient({ slug }: { slug: string }) {
  const router = useInstantRouter()
  const { t, language, getLocalized } = useLanguage()
  const [items, setItems] = useState<MenuItem[]>([])
  const [categoryTitle, setCategoryTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const categoryRowsRef = useRef<MenuCategoryRow[]>([])

  const normalizedSlug = useMemo(() => {
    try {
      return decodeURIComponent(slug).trim().toLowerCase()
    } catch {
      return slug.trim().toLowerCase()
    }
  }, [slug])

  const mapProductsToItems = useCallback(
    (data: any[]): MenuItem[] =>
      (data || [])
        .map((p: any): MenuItem | null => {
          const id = Number(p.id)
          if (!Number.isFinite(id) || id <= 0) return null
          return {
            id,
            name: getLocalized(p, 'name'),
            description: getLocalized(p, 'description') || '',
            price: p.price,
            category: p.category
              ? getMenuCategoryDisplayName(p.category as Record<string, unknown>, language, t.categories)
              : t.categories.rolls,
            categorySlug: String(p.category?.slug ?? 'rolls')
              .trim()
              .toLowerCase(),
            categoryId: p.categoryId,
            emoji: '🍣',
            imageUrl: productGalleryFromApi(p)[0] || (typeof p.imageUrl === 'string' ? p.imageUrl : undefined),
            isTop: p.isPopular,
            isHomeHit: p.isHomeHit === true,
            isMenuNew: p.isMenuNew === true,
            recommendOrder: typeof p.recommendOrder === 'number' ? p.recommendOrder : 0,
            allowRecommendations: p.category?.allowRecommendations !== false,
            promoDiscountPercent:
              typeof p.promoDiscountPercent === 'number'
                ? p.promoDiscountPercent
                : Number(p.promoDiscountPercent) || 0,
          }
        })
        .filter((row): row is MenuItem => row != null),
    [getLocalized, t.categories, language]
  )

  const loadCategoriesTitle = useCallback(async () => {
    try {
      const res = await fetchPublicApi(getApiUrl('/api/products/categories'))
      if (!res.ok) return
      const data = await res.json()
      const rows: MenuCategoryRow[] = (data || [])
        .filter((cat: any) => cat.isActive !== false)
        .map((cat: any) => {
          const name = getMenuCategoryDisplayName(cat, language, t.categories) || String(cat.name_ru ?? '')
          return { id: Number(cat.id) || 0, slug: String(cat.slug ?? '').trim().toLowerCase(), name }
        })
      categoryRowsRef.current = rows
      const hit = rows.find((c) => c.slug === normalizedSlug)
      if (hit?.name) setCategoryTitle(hit.name)
    } catch {
      /* ignore */
    }
  }, [language, t.categories, normalizedSlug])

  const loadProducts = useCallback(async (fresh = false) => {
    setLoading(true)
    try {
      const cityId = typeof window !== 'undefined' ? readCityIdForProductApi() : null
      const hasCity = cityId != null && cityId > 0
      const scopedUrl = hasCity ? getApiUrl(`/api/products?cityId=${cityId}`) : getApiUrl('/api/products')
      const fetchFn = fresh ? fetchPublicApiFresh : fetchPublicApi
      const scopedRes = await fetchFn(scopedUrl)
      const scopedData = scopedRes.ok ? await scopedRes.json() : []
      const scopedList = Array.isArray(scopedData) ? scopedData : []
      const rawProducts =
        hasCity && scopedList.length === 0
          ? await (async () => {
              const fallbackRes = await fetchFn(getApiUrl('/api/products'))
              const fallbackData = fallbackRes.ok ? await fallbackRes.json() : []
              return Array.isArray(fallbackData) ? fallbackData : []
            })()
          : scopedList
      const mapped = mapProductsToItems(rawProducts)
      const byId = new Map<number, string>()
      const byName = new Map<string, string>()
      for (const c of categoryRowsRef.current) {
        if (c.id > 0) byId.set(c.id, c.slug)
        if (c.name) byName.set(c.name.trim().toLowerCase(), c.slug)
      }
      const filtered = mapped.filter((i) => {
        if (i.categorySlug === normalizedSlug) return true
        if (i.categoryId && byId.get(i.categoryId) === normalizedSlug) return true
        if (i.category && byName.get(i.category.trim().toLowerCase()) === normalizedSlug) return true
        return false
      })
      if (process.env.NODE_ENV !== 'production' && mapped.length > 0 && filtered.length === 0) {
        console.warn('[CategoryMenuClient] no products matched category slug', {
          slug: normalizedSlug,
          totalMapped: mapped.length,
          categoryRows: categoryRowsRef.current.slice(0, 20),
          sampleProducts: mapped.slice(0, 10).map((p) => ({
            id: p.id,
            name: p.name,
            categorySlug: p.categorySlug,
            categoryId: p.categoryId,
            category: p.category,
          })),
        })
      }
      setItems(sortCategoryItems(filtered.length > 0 ? filtered : mapped))
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

  useWattaCatalogSync(() => void loadProducts(true), 'products')

  useEffect(() => {
    if (typeof window === 'undefined') return
    const onCity = () => void loadProducts(true)
    window.addEventListener('cityChanged', onCity)
    return () => window.removeEventListener('cityChanged', onCity)
  }, [loadProducts])

  useEffect(() => {
    if (!categoryTitle && items.length > 0) {
      setCategoryTitle(items[0].category)
    }
  }, [categoryTitle, items])

  const addToCart = useMenuAddToCart()

  const displayTitle = categoryTitle || normalizedSlug

  return (
    <div className="watta-public-page-shell watta-page-bg relative flex min-h-screen flex-1 flex-col overflow-x-hidden pb-20 pt-3 font-sans text-[#145142] sm:pt-4">
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
          <div className="grid grid-cols-1 items-start gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item) => (
              <WattaMenuProductCard
                key={item.id}
                variant="grid"
                product={item}
                onAddToCart={(product) =>
                  addToCart({
                    id: product.id,
                    name: product.name,
                    description: product.description,
                    price: product.price,
                    category: item.category,
                    emoji: product.emoji,
                    imageUrl: product.imageUrl,
                    promoDiscountPercent: product.promoDiscountPercent,
                  })
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
