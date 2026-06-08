'use client'

import { useLayoutEffect } from 'react'
import { useParams } from 'next/navigation'
import ProductPageClient from './ProductPageClient'
import { ProductViewLoadingFallback } from '../../components/ProductView'
import {
  normalizeProductRouteId,
  readProductFromClientCache,
} from '@/lib/fetchProductById'
import { primeProductPageChrome } from '@/lib/wattaProductChrome'

function cacheHasDisplayableProduct(row: Record<string, unknown> | null): boolean {
  if (!row) return false
  const id = Number(row.id)
  if (!Number.isFinite(id) || id <= 0) return false
  const price = Number(row.price)
  const name = String(row.name_ru ?? row.name_ua ?? row.name_en ?? '').trim()
  return name.length > 0 && Number.isFinite(price)
}

/** Миттєвий кадр з клієнтського кешу, поки Next.js підвантажує RSC. */
export default function ProductLoading() {
  const params = useParams()
  const id = normalizeProductRouteId(params?.id)

  useLayoutEffect(() => {
    primeProductPageChrome()
  }, [])

  if (id != null) {
    const cached = readProductFromClientCache(id)
    if (cached && cacheHasDisplayableProduct(cached)) {
      return (
        <ProductPageClient
          productId={String(id)}
          initialProduct={cached}
          initialIngredientsCatalog={[]}
        />
      )
    }
  }

  return <ProductViewLoadingFallback />
}
