import { redirectToAuth, isUserLoggedIn, getCurrentReturnPath } from '@/lib/authGate'
import { fetchPublicApiFresh } from '@/lib/publicApiFetch'
import { getApiUrl } from '@/lib/utils'
import { readCityIdForProductApi } from '@/lib/wattaSiteLocalePrefs'
import { applyCatalogProductRows } from '@/lib/wattaCatalogSnapshot'

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
let cartRevision = 0
const cartQtyById = new Map<number, number>()

function rebuildCartQtyIndex(lines: CartStorageLine[]): void {
  cartQtyById.clear()
  for (const line of lines) {
    cartQtyById.set(line.id, lineQuantity(line))
  }
}

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
    cartQtyById.clear()
    return []
  }
  try {
    const raw = JSON.parse(window.localStorage.getItem('cart') || '[]')
    if (!Array.isArray(raw)) {
      memoryCart = []
      memoryCartHydrated = true
      cartQtyById.clear()
      return []
    }
    const normalized = normalizeCartLines(raw)
    if (cartNeedsMigration(raw)) {
      window.localStorage.setItem('cart', JSON.stringify(normalized))
    }
    memoryCart = normalized
    memoryCartHydrated = true
    rebuildCartQtyIndex(normalized)
    return normalized
  } catch {
    memoryCart = []
    memoryCartHydrated = true
    cartQtyById.clear()
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
  cartQtyById.clear()
  cartRevision += 1
}

/** Лічильник змін кошика — для useSyncExternalStore (не покладатися на ref масиву). */
export function getCartRevision(): number {
  if (!memoryCartHydrated) hydrateCartFromLocalStorage()
  return cartRevision
}

/** Швидкий quantity для картки меню — без linear scan по всьому кошику. */
export function getCartLineQuantity(productId: number): number {
  if (!Number.isFinite(productId) || productId <= 0) return 0
  if (!memoryCartHydrated) hydrateCartFromLocalStorage()
  return cartQtyById.get(productId) ?? 0
}

/** Підписка для лічильника кошика в шапці — миттєво після «Замовити». */
export function subscribeCartStorage(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const onStorage = (e: StorageEvent) => {
    if (e.key === 'cart') {
      invalidateCartMemoryCache()
      onStoreChange()
    }
  }
  window.addEventListener('cartUpdated', onStoreChange)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener('cartUpdated', onStoreChange)
    window.removeEventListener('storage', onStorage)
  }
}

export function writeCartToStorage(lines: CartStorageLine[]): void {
  if (typeof window === 'undefined' || !window.localStorage) return
  const normalized = normalizeCartLines(lines)
  memoryCart = normalized
  memoryCartHydrated = true
  rebuildCartQtyIndex(memoryCart)
  cartRevision += 1
  try {
    window.localStorage.setItem('cart', JSON.stringify(memoryCart))
  } catch {
    /* quota / private mode */
  }
  window.dispatchEvent(new CustomEvent('cartUpdated'))
}

/** Порожній кошик: localStorage, in-memory кеш і лічильник у шапці. */
export function clearCartStorage(): void {
  writeCartToStorage([])
}

export type MenuCartProductInput = {
  id: number
  name: string
  description?: string
  price: number
  emoji?: string
  imageUrl?: string
  promoDiscountPercent?: number
  category?: string
}

/** Додати товар з картки меню в localStorage-кошик (без очікування API). */
export function addMenuProductToCart(
  product: MenuCartProductInput,
  quantity = 1,
): 'ok' | 'max' {
  return appendCartLines(
    {
      id: product.id,
      name: product.name,
      description: product.description ?? '',
      price: product.price,
      category: product.category ?? '',
      emoji: product.emoji ?? '🍣',
      imageUrl: product.imageUrl,
      promoDiscountPercent: product.promoDiscountPercent,
    },
    quantity,
  )
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

    let next: CartStorageLine[]
    if (existing) {
      next = cart.map((x) =>
        x.id === item.id
          ? {
              ...x,
              quantity: currentQty + quantity,
              name: item.name,
              description: item.description ?? x.description,
              price: item.price,
              category: item.category ?? x.category,
              emoji: item.emoji ?? x.emoji,
              imageUrl: item.imageUrl ?? x.imageUrl,
              promoDiscountPercent: item.promoDiscountPercent ?? x.promoDiscountPercent,
              cartUpsellDiscountEur:
                item.cartUpsellDiscountEur != null && item.cartUpsellDiscountEur > 0
                  ? item.cartUpsellDiscountEur
                  : undefined,
            }
          : x,
      )
    } else {
      next = [
        ...cart,
        {
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
        },
      ]
    }

    writeCartToStorage(next)
    return 'ok'
  } catch {
    return 'max'
  }
}

type RouterPush = { push: (href: string) => void }

/**
 * Додає товар у localStorage-кошик без входу.
 * `requireLogin: true` — лише якщо явно потрібен редирект (за замовчуванням кошик доступний гостю).
 * Оформлення замовлення та профіль — окремо через `requireAuth` / `openCartAuth` на /cart.
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

/** Після зміни товарів в адмінці — синхронізувати кошик, меню-кеш і detail-кеш з API. */
export async function refreshCartProductMediaFromCatalog(): Promise<void> {
  if (typeof window === 'undefined') return

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

    const rows = data.filter(
      (row): row is Record<string, unknown> => Boolean(row && typeof row === 'object'),
    )
    applyCatalogProductRows(rows, { replaceMenuCache: true })
  } catch {
    /* ignore */
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === 'cart') invalidateCartMemoryCache()
  })
}
