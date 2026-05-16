import { redirectToAuth, isUserLoggedIn, getCurrentReturnPath } from '@/lib/authGate'

export type CartStorageLine = {
  id: number
  name: string
  description?: string
  price: number
  category?: string
  emoji?: string
  imageUrl?: string
  promoDiscountPercent?: number
}

function newCartLineId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `line-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

/** Додає рядки в localStorage без редиректу. */
export function appendCartLines(item: CartStorageLine, quantity = 1): 'ok' | 'max' {
  if (typeof window === 'undefined' || !window.localStorage) return 'max'
  try {
    const raw = JSON.parse(window.localStorage.getItem('cart') || '[]')
    const cart = Array.isArray(raw) ? raw : []
    const currentQty = cart.filter((x: { id?: number }) => x?.id === item.id).length
    if (currentQty + quantity > 99) return 'max'
    const line = {
      id: item.id,
      name: item.name,
      description: item.description ?? '',
      price: item.price,
      category: item.category ?? '',
      emoji: item.emoji ?? '🍣',
      imageUrl: item.imageUrl,
      promoDiscountPercent: item.promoDiscountPercent,
      cartLineId: newCartLineId(),
    }
    for (let i = 0; i < quantity; i++) {
      cart.push({ ...line, cartLineId: newCartLineId() })
    }
    window.localStorage.setItem('cart', JSON.stringify(cart))
    window.dispatchEvent(new CustomEvent('cartUpdated'))
    return 'ok'
  } catch {
    return 'max'
  }
}

type RouterPush = { push: (href: string) => void }

/**
 * Додає в кошик (localStorage). Для гостя після додавання — на /login з return.
 * Повертає 'auth_redirect' якщо відправили на вхід (toast викликає викликач).
 */
export function addToCartWithAuthGate(
  router: RouterPush,
  item: CartStorageLine,
  options?: { quantity?: number; returnPath?: string },
): 'added' | 'max' | 'auth_redirect' {
  const qty = options?.quantity ?? 1
  const result = appendCartLines(item, qty)
  if (result === 'max') return 'max'
  if (!isUserLoggedIn()) {
    redirectToAuth(router, options?.returnPath ?? getCurrentReturnPath())
    return 'auth_redirect'
  }
  return 'added'
}
