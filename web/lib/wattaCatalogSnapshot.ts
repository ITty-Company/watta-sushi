import { writeCartToStorage, readCartFromStorage, type CartStorageLine } from '@/lib/cartStorage'
import {
  writeProductDetailCache,
  WATTA_PRODUCT_DETAIL_CACHED_EVENT,
} from '@/lib/fetchProductById'
import { getLocalizedField } from '@/lib/i18n/getLocalizedField'
import { menuItemsSessionKey } from '@/lib/i18n/menuDataCacheBust'
import {
  resolveWattaSiteLanguageFromDocumentCookie,
  type WattaLanguage,
} from '@/lib/i18n/language'
import { productGalleryFromApi } from '@/lib/productGallery'
import { readCityIdForProductApi } from '@/lib/wattaSiteLocalePrefs'
import { enrichProductRow } from '@/lib/wattaIngredientsCatalog'

function readSiteLanguage(): WattaLanguage {
  if (typeof document === 'undefined') return 'nl'
  return resolveWattaSiteLanguageFromDocumentCookie(document.cookie || '')
}

function isProductRow(row: unknown): row is Record<string, unknown> {
  if (!row || typeof row !== 'object') return false
  const id = Number((row as { id?: unknown }).id)
  return Number.isFinite(id) && id > 0
}

function rowCategoryEmoji(row: Record<string, unknown>): string | undefined {
  const cat = row.category
  if (!cat || typeof cat !== 'object') return undefined
  const emoji = (cat as { emoji?: unknown }).emoji
  return typeof emoji === 'string' && emoji.trim() ? emoji : undefined
}

function cartFieldsFromRow(
  row: Record<string, unknown>,
  lang: WattaLanguage,
): Pick<CartStorageLine, 'name' | 'description' | 'price' | 'imageUrl' | 'promoDiscountPercent' | 'emoji'> {
  const name = getLocalizedField(row, 'name', lang) || String(row.name_ru ?? row.name ?? '').trim()
  const description = getLocalizedField(row, 'description', lang)
  const price = Number(row.price)
  const promo = Number(row.promoDiscountPercent)
  const cover = productGalleryFromApi(row)[0] ?? ''
  return {
    name: name || '—',
    description,
    price: Number.isFinite(price) && price >= 0 ? price : 0,
    imageUrl: cover || undefined,
    promoDiscountPercent: Number.isFinite(promo) && promo > 0 ? promo : undefined,
    emoji: rowCategoryEmoji(row) ?? '🍣',
  }
}

function mergeMenuSessionRows(
  existing: Record<string, unknown>[],
  incoming: Record<string, unknown>[],
  replace: boolean,
): Record<string, unknown>[] {
  if (replace) return incoming
  const byId = new Map<number, Record<string, unknown>>()
  for (const row of existing) {
    if (!isProductRow(row)) continue
    byId.set(Number(row.id), row)
  }
  for (const row of incoming) {
    if (!isProductRow(row)) continue
    const id = Number(row.id)
    const prev = byId.get(id)
    byId.set(id, prev ? { ...prev, ...row } : row)
  }
  return Array.from(byId.values())
}

/**
 * Миттєво розкладає свіжі рядки каталогу по sessionStorage, detail-кешу, кошику.
 * Викликається після збереження в адмінці (1 товар) або після GET /api/products (весь список).
 */
export function applyCatalogProductRows(
  rows: Record<string, unknown>[],
  options?: { replaceMenuCache?: boolean },
): void {
  if (typeof window === 'undefined' || rows.length === 0) return

  const valid = rows.filter(isProductRow)
  if (valid.length === 0) return

  const lang = readSiteLanguage()
  const cityId = readCityIdForProductApi()
  const replaceMenu = Boolean(options?.replaceMenuCache)

  if (typeof sessionStorage !== 'undefined') {
    try {
      const key = menuItemsSessionKey(cityId)
      let existing: Record<string, unknown>[] = []
      if (!replaceMenu) {
        const raw = sessionStorage.getItem(key)
        if (raw) {
          const parsed = JSON.parse(raw) as unknown
          if (Array.isArray(parsed)) {
            existing = parsed.filter(isProductRow) as Record<string, unknown>[]
          }
        }
      }
      const merged = mergeMenuSessionRows(existing, valid, replaceMenu)
      sessionStorage.setItem(key, JSON.stringify(merged))
      sessionStorage.setItem(`${key}_time`, String(Date.now()))
    } catch {
      /* quota */
    }
  }

  const touchedIds = new Set<number>()
  for (const raw of valid) {
    const enriched = enrichProductRow(raw) ?? raw
    writeProductDetailCache(enriched)
    touchedIds.add(Number(enriched.id))
  }

  const cart = readCartFromStorage()
  if (cart.length > 0) {
    const byId = new Map<number, Record<string, unknown>>()
    for (const row of valid) byId.set(Number(row.id), row)

    let changed = false
    for (const line of cart) {
      const row = byId.get(line.id)
      if (!row) continue
      const next = cartFieldsFromRow(row, lang)
      if (line.name !== next.name) {
        line.name = next.name
        changed = true
      }
      if ((line.description ?? '') !== (next.description ?? '')) {
        line.description = next.description
        changed = true
      }
      if (line.price !== next.price) {
        line.price = next.price
        changed = true
      }
      if (line.promoDiscountPercent !== next.promoDiscountPercent) {
        line.promoDiscountPercent = next.promoDiscountPercent
        changed = true
      }
      if (next.imageUrl && line.imageUrl !== next.imageUrl) {
        line.imageUrl = next.imageUrl
        changed = true
      }
      if (next.emoji && line.emoji !== next.emoji) {
        line.emoji = next.emoji
        changed = true
      }
    }
    if (changed) writeCartToStorage(cart)
  }

  for (const id of touchedIds) {
    window.dispatchEvent(new CustomEvent(WATTA_PRODUCT_DETAIL_CACHED_EVENT, { detail: { id } }))
  }
}
