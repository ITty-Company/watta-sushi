/** Кеш історії замовлень у localStorage (показ одразу, оновлення з API). */

const STORAGE_KEY = 'userOrders'

export function readUserOrdersCache<T>(): T[] | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? (parsed as T[]) : null
  } catch {
    return null
  }
}

export function writeUserOrdersCache(orders: unknown[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders))
  } catch {
    /* ignore quota */
  }
}

export function clearUserOrdersCache(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}
