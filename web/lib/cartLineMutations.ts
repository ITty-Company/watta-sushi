import {
  lineQuantity,
  readCartFromStorage,
  writeCartToStorage,
  type CartStorageLine,
} from '@/lib/cartStorage'

function newCartLineIdLocal(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `line-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

export function decrementCartLine(cartLineId: string): CartStorageLine[] {
  const prev = readCartFromStorage()
  const line = prev.find((i) => i.cartLineId === cartLineId)
  if (!line) return prev
  return decrementCartProduct(line.id)
}

/** Мінус одна штука (як + через incrementCartProduct). При qty=1 рядок прибирається. */
export function decrementCartProduct(productId: number): CartStorageLine[] {
  const prev = readCartFromStorage()
  const line = prev.find((i) => i.id === productId)
  if (!line) return prev
  const qty = lineQuantity(line)
  const next =
    qty <= 1
      ? prev.filter((i) => i.id !== productId)
      : prev.map((i) => (i.id === productId ? { ...i, quantity: qty - 1 } : i))
  writeCartToStorage(next)
  return next
}

export function removeCartProduct(productId: number): CartStorageLine[] {
  const next = readCartFromStorage().filter((i) => i.id !== productId)
  writeCartToStorage(next)
  return next
}

export function incrementCartProduct(item: CartStorageLine): 'ok' | 'max' {
  const prev = readCartFromStorage()
  const existing = prev.find((i) => i.id === item.id)
  const currentQty = existing ? lineQuantity(existing) : 0
  if (currentQty >= 99) return 'max'

  const next = existing
    ? prev.map((i) =>
        i.id === item.id ? { ...i, quantity: currentQty + 1 } : i,
      )
    : [
        ...prev,
        {
          ...item,
          quantity: 1,
          cartLineId:
            typeof item.cartLineId === 'string' && item.cartLineId.length > 0
              ? item.cartLineId
              : newCartLineIdLocal(),
        },
      ]
  writeCartToStorage(next)
  return 'ok'
}
