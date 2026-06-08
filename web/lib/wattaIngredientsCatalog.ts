import { getApiUrl } from '@/lib/utils'
import { fetchPublicApi } from '@/lib/publicApiFetch'

export type CatalogIngredient = {
  id: number
  name_ru: string
  name_ua?: string
  name_en?: string
  name_nl?: string
  imageUrl: string
}

/** v2 — скидає застарілі imageUrl з session/localStorage (напр. видалені /uploads/*). */
const CACHE_KEY = 'watta_ingredients_catalog_v2'
const LS_CACHE_KEY = 'watta_ingredients_catalog_v2'
const LEGACY_CACHE_KEYS = ['watta_ingredients_catalog_v1'] as const
const memoryById = new Map<number, CatalogIngredient>()
let inflight: Promise<Map<number, CatalogIngredient> | null> | null = null

function isIngredientRow(row: unknown): row is CatalogIngredient {
  if (!row || typeof row !== 'object') return false
  const id = Number((row as { id?: unknown }).id)
  return Number.isFinite(id) && id > 0
}

function hydrateMemory(list: CatalogIngredient[]): Map<number, CatalogIngredient> {
  memoryById.clear()
  for (const row of list) memoryById.set(row.id, row)
  return memoryById
}

function dropLegacyIngredientCaches(): void {
  if (typeof window === 'undefined') return
  for (const store of [sessionStorage, localStorage] as const) {
    for (const key of LEGACY_CACHE_KEYS) {
      try {
        store.removeItem(key)
      } catch {
        /* ignore */
      }
    }
  }
}

function readStoredCatalog(): CatalogIngredient[] | null {
  if (typeof window === 'undefined') return null
  dropLegacyIngredientCaches()
  for (const store of [sessionStorage, localStorage] as const) {
    try {
      const raw = store.getItem(CACHE_KEY) ?? (store === localStorage ? store.getItem(LS_CACHE_KEY) : null)
      if (!raw) continue
      const parsed = JSON.parse(raw) as unknown
      if (!Array.isArray(parsed)) continue
      const list = parsed.filter(isIngredientRow)
      if (list.length > 0) return list
    } catch {
      /* ignore */
    }
  }
  return null
}

function writeSessionCatalog(list: CatalogIngredient[]): void {
  if (typeof window === 'undefined') return
  const payload = JSON.stringify(list)
  try {
    sessionStorage.setItem(CACHE_KEY, payload)
    localStorage.setItem(LS_CACHE_KEY, payload)
  } catch {
    /* quota */
  }
}

/** Після SSR / prefetch — одразу доступний «Склад» на клієнті. */
export function seedIngredientsCatalog(list: CatalogIngredient[]): void {
  if (!list.length) return
  writeSessionCatalog(list)
  hydrateMemory(list)
}

/** Синхронно: памʼять або sessionStorage (для миттєвого «Складу» на /product). */
export function readIngredientsCatalogSync(): Map<number, CatalogIngredient> | null {
  if (memoryById.size > 0) return memoryById
  const stored = readStoredCatalog()
  if (!stored?.length) return null
  return hydrateMemory(stored)
}

export function parseIngredientIds(row: Record<string, unknown>): number[] {
  const raw = row.ingredientIds
  if (!Array.isArray(raw)) return []
  return raw.map((x) => Number(x)).filter((n) => Number.isFinite(n) && n > 0)
}

export function attachIngredientsFromCatalog(row: Record<string, unknown>): Record<string, unknown> | null {
  const ing = row.ingredients
  if (Array.isArray(ing) && ing.length > 0) return row

  const ids = parseIngredientIds(row)
  if (ids.length === 0) return null

  const catalog = readIngredientsCatalogSync()
  if (!catalog) return null

  const ingredients = ids.map((id) => catalog.get(id)).filter((x): x is CatalogIngredient => Boolean(x))
  if (ingredients.length === 0) return null

  return { ...row, ingredients }
}

export function enrichProductRow(row: Record<string, unknown> | null): Record<string, unknown> | null {
  if (!row) return null
  return attachIngredientsFromCatalog(row) ?? row
}

/** Завантажити довідник інгредієнтів (невеликий JSON) — один раз на сесію. */
export async function ensureIngredientsCatalog(): Promise<Map<number, CatalogIngredient> | null> {
  const sync = readIngredientsCatalogSync()
  if (sync && sync.size > 0) return sync

  if (inflight) return inflight

  inflight = (async () => {
    try {
      const res = await fetchPublicApi(getApiUrl('/api/ingredients'))
      if (!res.ok) return null
      const data = (await res.json()) as unknown
      if (!Array.isArray(data)) return null
      const list = data.filter(isIngredientRow)
      if (list.length === 0) return null
      writeSessionCatalog(list)
      return hydrateMemory(list)
    } catch {
      return null
    } finally {
      inflight = null
    }
  })()

  return inflight
}
