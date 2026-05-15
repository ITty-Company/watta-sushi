'use client'

/**
 * Глобальний дебансер запитів `/api/favorites/counts-by-product?ids=…`.
 *
 * Проблема, яку вирішує цей модуль:
 * - Кожен `<ProductCard>` через `useProductFavorite` запитував лічильник вподобайок
 *   окремим HTTP-запитом. На головній сторінці це давало 50+ паралельних запитів,
 *   які створювали черги в дев-сервері і пригальмовували навіть статичні ассети
 *   (включно з hero-відео).
 *
 * Як це працює:
 * - Будь-який код викликає `requestFavoriteCount(productId)` і отримує `Promise<number>`.
 * - Запити збираються у вікно ~30 мс і відправляються одним batch-запитом з
 *   унікальними id (`?ids=1,4,6,15,…`).
 * - Результат розкидається назад по індивідуальних Promise.
 * - Відповіді кешуються на ~5 хв, тому повторні монтування компонентів
 *   не б’ють по API.
 *
 * Кеш можна примусово оновити викликом `invalidateFavoriteCount(productId)` —
 * наприклад, у `useProductFavorite.toggle()` після успішного POST, якщо ми
 * хочемо синхронізувати число з сервером (зараз воно лежить локально).
 */

const BATCH_WINDOW_MS = 30
const CACHE_TTL_MS = 5 * 60 * 1000

type CountCacheEntry = {
  value: number
  expiresAt: number
}

type PendingResolver = {
  resolve: (value: number) => void
  reject: (reason?: unknown) => void
}

const countCache = new Map<number, CountCacheEntry>()
const pendingQueue = new Map<number, PendingResolver[]>()
let flushTimer: ReturnType<typeof setTimeout> | null = null

function scheduleFlush() {
  if (flushTimer !== null) return
  flushTimer = setTimeout(() => {
    flushTimer = null
    void flushNow()
  }, BATCH_WINDOW_MS)
}

async function flushNow() {
  if (pendingQueue.size === 0) return
  const ids = Array.from(pendingQueue.keys()).filter((id) => Number.isFinite(id) && id > 0)
  if (ids.length === 0) {
    pendingQueue.clear()
    return
  }

  const resolvers = new Map<number, PendingResolver[]>()
  for (const id of ids) {
    const list = pendingQueue.get(id)
    if (list && list.length) resolvers.set(id, list)
  }
  pendingQueue.clear()

  try {
    const res = await fetch(`/api/favorites/counts-by-product?ids=${ids.join(',')}`, {
      cache: 'no-store',
    })
    if (!res.ok) throw new Error(`Bad status: ${res.status}`)
    const data = (await res.json()) as Record<string, number>
    const now = Date.now()
    for (const id of ids) {
      const raw = data[String(id)] ?? (data as Record<number, number>)[id]
      const value = typeof raw === 'number' && Number.isFinite(raw) ? Math.max(0, raw) : 0
      countCache.set(id, { value, expiresAt: now + CACHE_TTL_MS })
      const subs = resolvers.get(id)
      if (subs) for (const s of subs) s.resolve(value)
    }
  } catch (err) {
    resolvers.forEach((subs) => {
      for (const s of subs) s.reject(err)
    })
  }
}

/**
 * Повертає лічильник вподобайок для конкретного товару. Виклики, зроблені в межах
 * 30 мс одне від одного, відправляються єдиним batch-запитом.
 */
export function requestFavoriteCount(productId: number): Promise<number> {
  if (!Number.isFinite(productId) || productId <= 0) return Promise.resolve(0)

  const cached = countCache.get(productId)
  if (cached && cached.expiresAt > Date.now()) {
    return Promise.resolve(cached.value)
  }

  return new Promise<number>((resolve, reject) => {
    const list = pendingQueue.get(productId) ?? []
    list.push({ resolve, reject })
    pendingQueue.set(productId, list)
    scheduleFlush()
  })
}

/** Скинути кеш для конкретного товару — використовуй після toggle. */
export function invalidateFavoriteCount(productId: number): void {
  if (Number.isFinite(productId) && productId > 0) countCache.delete(productId)
}

/** Записати у кеш свіже значення (наприклад, з відповіді toggle). */
export function setFavoriteCountInCache(productId: number, value: number): void {
  if (!Number.isFinite(productId) || productId <= 0) return
  const safe = typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : 0
  countCache.set(productId, { value: safe, expiresAt: Date.now() + CACHE_TTL_MS })
}
