import { serverApiBaseUrl } from '@/lib/serverApiBaseUrl'
import type { CatalogIngredient } from '@/lib/wattaIngredientsCatalog'
import { attachIngredientsFromCatalog, enrichProductRow } from '@/lib/wattaIngredientsCatalog'

function isProductRow(row: unknown): row is Record<string, unknown> {
  if (!row || typeof row !== 'object') return false
  const id = Number((row as { id?: unknown }).id)
  return Number.isFinite(id) && id > 0
}

function isIngredientRow(row: unknown): row is CatalogIngredient {
  if (!row || typeof row !== 'object') return false
  const id = Number((row as { id?: unknown }).id)
  return Number.isFinite(id) && id > 0
}

/** SSR для /product/:id — товар + довідник інгредієнтів паралельно. */
export async function fetchProductDetailForPage(productId: number): Promise<{
  product: Record<string, unknown> | null
  ingredientsCatalog: CatalogIngredient[]
}> {
  if (!Number.isFinite(productId) || productId <= 0) {
    return { product: null, ingredientsCatalog: [] }
  }

  const base = serverApiBaseUrl()
  const opts: RequestInit = { next: { revalidate: 45 } }

  try {
    const [productRes, ingredientsRes] = await Promise.all([
      fetch(`${base}/api/products/${productId}`, opts),
      fetch(`${base}/api/ingredients`, opts),
    ])

    let ingredientsCatalog: CatalogIngredient[] = []
    if (ingredientsRes.ok) {
      const ingBody = (await ingredientsRes.json()) as unknown
      if (Array.isArray(ingBody)) {
        ingredientsCatalog = ingBody.filter(isIngredientRow)
      }
    }

    if (!productRes.ok) {
      return { product: null, ingredientsCatalog }
    }

    const body = (await productRes.json()) as unknown
    if (!isProductRow(body)) {
      return { product: null, ingredientsCatalog }
    }

    let row = body as Record<string, unknown>
    if (ingredientsCatalog.length > 0) {
      const catalogMap = new Map(ingredientsCatalog.map((i) => [i.id, i]))
      const ing = row.ingredients
      if (!Array.isArray(ing) || ing.length === 0) {
        const ids = Array.isArray(row.ingredientIds)
          ? (row.ingredientIds as unknown[])
              .map((x) => Number(x))
              .filter((n) => Number.isFinite(n) && n > 0)
          : []
        if (ids.length > 0) {
          const merged = ids
            .map((id) => catalogMap.get(id))
            .filter((x): x is CatalogIngredient => Boolean(x))
          if (merged.length > 0) row = { ...row, ingredients: merged }
        }
      }
    }

    const enriched = enrichProductRow(row) ?? attachIngredientsFromCatalog(row) ?? row
    return { product: enriched, ingredientsCatalog }
  } catch {
    return { product: null, ingredientsCatalog: [] }
  }
}
