'use client'

import React, { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Heart } from 'lucide-react'
import toast from 'react-hot-toast'
import { useLanguage } from '../context/LanguageContext'
import { getApiUrl } from '@/lib/utils'
import { getBearerAuthHeaders } from '@/lib/authHeaders'
import { mergeServerFavoritesIntoLocal, readFavoriteIds } from '@/lib/favoritesStorage'
import { WattaMenuProductCard, type WattaMenuProductCardModel } from '../components/WattaMenuProductCard'

export default function FavoritesPage() {
  const router = useRouter()
  const { t, getLocalized, language } = useLanguage()
  const cp = t.clientProfile
  const [items, setItems] = useState<WattaMenuProductCardModel[]>([])
  const [loading, setLoading] = useState(true)

  const mapRawToCard = useCallback(
    (p: Record<string, unknown>): WattaMenuProductCardModel => {
      return {
        id: Number(p.id),
        name: getLocalized(p as never, 'name'),
        description: getLocalized(p as never, 'description') || '',
        price: Number(p.price),
        emoji: '🍣',
        imageUrl: typeof p.imageUrl === 'string' ? p.imageUrl : undefined,
        isTop: p.isPopular === true,
        promoDiscountPercent:
          typeof p.promoDiscountPercent === 'number'
            ? p.promoDiscountPercent
            : Number(p.promoDiscountPercent) || 0,
      }
    },
    [getLocalized],
  )

  const load = useCallback(async () => {
    setLoading(true)
    try {
      await mergeServerFavoritesIntoLocal()

      const userStr = typeof window !== 'undefined' ? localStorage.getItem('currentUser') : null
      const listAuth = getBearerAuthHeaders()
      if (userStr && Object.keys(listAuth as Record<string, string>).length > 0) {
        try {
          const res = await fetch('/api/favorites/list', {
            headers: listAuth,
          })
          if (res.ok) {
            const data = await res.json()
            const list = (Array.isArray(data) ? data : []).map((p: Record<string, unknown>) =>
              mapRawToCard(p),
            )
            setItems(list)
            return
          }
        } catch {
          /* fall through to guest path */
        }
      }

      const ids = readFavoriteIds()
      if (ids.length === 0) {
        setItems([])
        return
      }

      const idSet = new Set(ids)
      const rawCity = typeof window !== 'undefined' ? localStorage.getItem('selectedCityId') : null
      const cityId = rawCity ? parseInt(rawCity, 10) : NaN
      const url =
        Number.isFinite(cityId) && cityId > 0
          ? getApiUrl(`/api/products?cityId=${cityId}`)
          : getApiUrl('/api/products')
      const res = await fetch(url, { headers: { 'Cache-Control': 'max-age=120' } })
      const data = res.ok ? await res.json() : []
      const filtered = (Array.isArray(data) ? data : []).filter((p: { id: number }) =>
        idSet.has(Number(p.id)),
      )
      setItems(filtered.map((p: Record<string, unknown>) => mapRawToCard(p)))
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [mapRawToCard])

  useEffect(() => {
    void load()
  }, [load, language])

  useEffect(() => {
    const onFav = () => void load()
    window.addEventListener('favoritesUpdated', onFav)
    return () => window.removeEventListener('favoritesUpdated', onFav)
  }, [load])

  const addToCart = (item: WattaMenuProductCardModel) => {
    if (typeof window === 'undefined' || !window.localStorage) return
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    const n = cart.filter((x: { id?: number }) => x?.id === item.id).length
    if (n >= 99) {
      toast.error(t.appToasts.maxCartQty)
      return
    }
    cart.push({
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      category: '',
      emoji: item.emoji ?? '🍣',
      imageUrl: item.imageUrl,
      promoDiscountPercent: item.promoDiscountPercent,
    })
    localStorage.setItem('cart', JSON.stringify(cart))
    window.dispatchEvent(new CustomEvent('cartUpdated'))
    toast.success(t.addToCart)
  }

  return (
    <div className="watta-public-page-shell flex min-h-[100dvh] flex-1 flex-col overflow-x-hidden watta-page-bg pb-12 pt-6 sm:pt-8">
      <div className="mx-auto w-full max-w-[1200px] px-4">
        <div className="mb-8 flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#145142]/15 bg-white text-[#145142] shadow-sm transition hover:bg-[#145142]/5"
            aria-label={t.auth.back}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#0f241e] sm:text-3xl">{cp.favoritesTitle}</h1>
            <p className="mt-1 text-sm text-[#145142]/70">{cp.tabFavorites}</p>
          </div>
        </div>

        {loading ? (
          <p className="py-20 text-center font-semibold text-[#145142]">{cp.loading}</p>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-[#145142]/10 bg-white px-6 py-20 text-center shadow-sm">
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[#145142]/[0.08] text-[#145142]/40">
              <Heart className="h-11 w-11" strokeWidth={1.5} />
            </div>
            <h2 className="text-xl font-bold text-neutral-800">{cp.favEmpty}</h2>
            <Link
              href="/menu"
              className="mt-8 inline-flex items-center justify-center rounded-2xl bg-[#145142] px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#145142]/25 transition hover:bg-[#0f3d32]"
            >
              {cp.favToMenu}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 items-start gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item) => (
              <WattaMenuProductCard
                key={item.id}
                variant="grid"
                product={{
                  id: item.id,
                  name: item.name,
                  description: item.description,
                  price: item.price,
                  emoji: item.emoji,
                  imageUrl: item.imageUrl,
                  isTop: item.isTop,
                  promoDiscountPercent: item.promoDiscountPercent,
                }}
                onAddToCart={() => addToCart(item)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
