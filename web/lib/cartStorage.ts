import { redirectToAuth, isUserLoggedIn, getCurrentReturnPath } from '@/lib/authGate'
import { fetchPublicApiFresh } from '@/lib/publicApiFetch'
import { productGalleryFromApi } from '@/lib/productGallery'
import { getApiUrl } from '@/lib/utils'
import { readCityIdForProductApi } from '@/lib/wattaSiteLocalePrefs'

export type CartStorageLine = {
  id: number
  name: string
  description?: string
  price: number
  category?: string
  emoji?: string
  imageUrl?: string
  promoDiscountPercent?: number
  /** Знижка € з порогу кошика — тільки для рядків, доданих з upsell-блоку */
  cartUpsellDiscountEur?: number
  quantity?: number
  cartLineId?: string
}

/** In-memory кеш — миттєве читання після першого parse localStorage. */
let memoryCart: CartStorageLine[] | null = null
let memoryCartHydrated = false

function newCartLineId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `line-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

export function lineQuantity(line: { quantity?: number }): number {
  const q = Number(line.quantity)
  return Number.isFinite(q) && q >= 1 ? Math.floor(q) : 1
}

/** Один рядок на товар; старий формат (дублікати за id) зливається в quantity. */
export function normalizeCartLines(raw: unknown): CartStorageLine[] {
  if (!Array.isArray(raw)) return []
  const byId = new Map<number, CartStorageLine>()

  for (const entry of raw) {
    const item = entry as CartStorageLine
    if (typeof item?.id !== 'number' || !Number.isFinite(item.id)) continue

    const qty = lineQuantity(item)
    const existing = byId.get(item.id)
    if (existing) {
      existing.quantity = Math.min(99, lineQuantity(existing) + qty)
      if (item.promoDiscountPercent != null) {
        existing.promoDiscountPercent = item.promoDiscountPercent
      }
      if (item.cartUpsellDiscountEur != null && item.cartUpsellDiscountEur > 0) {
        existing.cartUpsellDiscountEur = item.cartUpsellDiscountEur
      } else {
        delete existing.cartUpsellDiscountEur
      }
      if (item.imageUrl) existing.imageUrl = item.imageUrl
    } else {
      byId.set(item.id, {
        id: item.id,
        name: item.name,
        description: item.description ?? '',
        price: item.price,
        category: item.category ?? '',
        emoji: item.emoji ?? '🍣',
        imageUrl: item.imageUrl,
        promoDiscountPercent: item.promoDiscountPercent,
        cartUpsellDiscountEur:
          item.cartUpsellDiscountEur != null && item.cartUpsellDiscountEur > 0
            ? item.cartUpsellDiscountEur
            : undefined,
        cartLineId:
          typeof item.cartLineId === 'string' && item.cartLineId.length > 0
            ? item.cartLineId
            : newCartLineId(),
        quantity: qty,
      })
    }
  }

  return Array.from(byId.values())
}

function cartNeedsMigration(raw: unknown[]): boolean {
  const ids = raw.map((e) => (e as { id?: number })?.id).filter((id) => typeof id === 'number')
  return ids.length !== new Set(ids).size
}

function hydrateCartFromLocalStorage(): CartStorageLine[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    memoryCart = []
    memoryCartHydrated = true
    return []
  }
  try {
    const raw = JSON.parse(window.localStorage.getItem('cart') || '[]')
    if (!Array.isArray(raw)) {
      memoryCart = []
      memoryCartHydrated = true
      return []
    }
    const normalized = normalizeCartLines(raw)
    if (cartNeedsMigration(raw)) {
      window.localStorage.setItem('cart', JSON.stringify(normalized))
    }
    memoryCart = normalized
    memoryCartHydrated = true
    return normalized
  } catch {
    memoryCart = []
    memoryCartHydrated = true
    return []
  }
}

export function readCartFromStorage(): CartStorageLine[] {
  if (memoryCartHydrated && memoryCart) return memoryCart
  return hydrateCartFromLocalStorage()
}

/** Скидає in-memory кеш (інша вкладка змінила localStorage). */
export function invalidateCartMemoryCache(): void {
  memoryCart = null
  memoryCartHydrated = false
}

export function writeCartToStorage(lines: CartStorageLine[]): void {
  if (typeof window === 'undefined' || !window.localStorage) return
  memoryCart = lines
  memoryCartHydrated = true
  try {
    window.localStorage.setItem('cart', JSON.stringify(lines))
  } catch {
    /* quota / private mode */
  }
  window.dispatchEvent(new CustomEvent('cartUpdated'))
}

export function getCartTotalPieceCount(lines: CartStorageLine[]): number {
  return lines.reduce((sum, line) => sum + lineQuantity(line), 0)
}

/** Швидкий лічильник для шапки — без повторного parse. */
export function getLiveCartPieceCount(): number {
  return getCartTotalPieceCount(readCartFromStorage())
}

/** Додає в localStorage; той самий id збільшує quantity існуючого рядка. */
export function appendCartLines(item: CartStorageLine, quantity = 1): 'ok' | 'max' {
  if (typeof window === 'undefined' || !window.localStorage) return 'max'
  try {
    const cart = readCartFromStorage()
    const existing = cart.find((x) => x.id === item.id)
    const currentQty = existing ? lineQuantity(existing) : 0
    if (currentQty + quantity > 99) return 'max'

    if (existing) {
      existing.quantity = currentQty + quantity
      existing.name = item.name
      existing.description = item.description ?? existing.description
      existing.price = item.price
      existing.category = item.category ?? existing.category
      existing.emoji = item.emoji ?? existing.emoji
      if (item.imageUrl) existing.imageUrl = item.imageUrl
      if (item.promoDiscountPercent != null) {
        existing.promoDiscountPercent = item.promoDiscountPercent
      }
      if (item.cartUpsellDiscountEur != null && item.cartUpsellDiscountEur > 0) {
        existing.cartUpsellDiscountEur = item.cartUpsellDiscountEur
      } else {
        delete existing.cartUpsellDiscountEur
      }
    } else {
      cart.push({
        id: item.id,
        name: item.name,
        description: item.description ?? '',
        price: item.price,
        category: item.category ?? '',
        emoji: item.emoji ?? '🍣',
        imageUrl: item.imageUrl,
        promoDiscountPercent: item.promoDiscountPercent,
        cartUpsellDiscountEur:
          item.cartUpsellDiscountEur != null && item.cartUpsellDiscountEur > 0
            ? item.cartUpsellDiscountEur
            : undefined,
        cartLineId: newCartLineId(),
        quantity,
      })
    }

    writeCartToStorage(cart)
    return 'ok'
  } catch {
    return 'max'
  }
}

type RouterPush = { push: (href: string) => void }

/**
 * Миттєво додає в кошик (гість і залогінений). Вхід — лише на checkout через requireAuth.
 */
export function addToCartWithAuthGate(
  _router: RouterPush,
  item: CartStorageLine,
  options?: { quantity?: number; returnPath?: string; requireLogin?: boolean },
): 'added' | 'max' | 'auth_redirect' {
  const qty = options?.quantity ?? 1
  const result = appendCartLines(item, qty)
  if (result === 'max') return 'max'
  if (options?.requireLogin === true && !isUserLoggedIn()) {
    redirectToAuth(_router, options?.returnPath ?? getCurrentReturnPath())
    return 'auth_redirect'
  }
  return 'added'
}

/** Після зміни фото/товарів в адмінці — оновити imageUrl у рядках кошика з каталогу. */
export async function refreshCartProductMediaFromCatalog(): Promise<void> {
  if (typeof window === 'undefined') return
  const cart = readCartFromStorage()
  if (cart.length === 0) return

  const cityId = readCityIdForProductApi()
  const url =
    cityId != null && cityId > 0
      ? getApiUrl(`/api/products?cityId=${cityId}`)
      : getApiUrl('/api/products')

  try {
    const res = await fetchPublicApiFresh(url)
    if (!res.ok) return
    const data: unknown = await res.json()
    if (!Array.isArray(data)) return

    const coverById = new Map<number, string>()
    const catalogById = new Map<
      number,
      { price: number; promoDiscountPercent?: number }
    >()
    for (const raw of data) {
      const row = raw as {
        id?: number
        imageUrl?: string
        imageUrls?: unknown
        price?: number
        promoDiscountPercent?: number
      }
      const id = Number(row.id)
      if (!Number.isFinite(id) || id <= 0) continue
      const cover = productGalleryFromApi(row)[0]
      if (cover) coverById.set(id, cover)
      const price = Number(row.price)
      if (Number.isFinite(price) && price > 0) {
        const promo = Number(row.promoDiscountPercent)
        catalogById.set(id, {
          price,
          promoDiscountPercent:
            Number.isFinite(promo) && promo > 0 ? promo : undefined,
        })
      }
    }

    let changed = false
    for (const line of cart) {
      const next = coverById.get(line.id)
      if (next && next !== line.imageUrl) {
        line.imageUrl = next
        changed = true
      }
      if (line.cartUpsellDiscountEur != null && line.cartUpsellDiscountEur > 0) continue
      const catalog = catalogById.get(line.id)
      if (!catalog) continue
      if (line.price !== catalog.price) {
        line.price = catalog.price
        changed = true
      }
      if (line.promoDiscountPercent !== catalog.promoDiscountPercent) {
        line.promoDiscountPercent = catalog.promoDiscountPercent
        changed = true
      }
    }
    if (changed) writeCartToStorage(cart)
  } catch {
    /* ignore */
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === 'cart') invalidateCartMemoryCache()
  })
}
