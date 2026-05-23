/** Локальне обране: масив id (узгоджено з useProductFavorite та картками меню). */

import { getBearerAuthHeaders } from '@/lib/authHeaders'
import { isUserLoggedIn } from '@/lib/authGate'
import { fetchPublicApiFresh } from '@/lib/publicApiFetch'
import { getApiUrl } from '@/lib/utils'

export function readFavoriteIds(): number[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = JSON.parse(window.localStorage.getItem('favorites') || '[]')
    if (!Array.isArray(raw)) return []
    return raw
      .map((x: unknown) =>
        typeof x === 'number' ? x : (x as { id?: number })?.id,
      )
      .filter((id): id is number => typeof id === 'number' && id > 0)
  } catch {
    return []
  }
}

export function writeFavoriteIds(ids: number[]) {
  window.localStorage.setItem('favorites', JSON.stringify(ids))
}

function favoriteIdsEqual(a: number[], b: number[]) {
  if (a.length !== b.length) return false
  const setB = new Set(b)
  return a.every((id) => setB.has(id))
}

/** Підписка для useSyncExternalStore — усі сердечка й бейдж оновлюються в один кадр. */
export function subscribeFavoriteIds(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const onStorage = (e: StorageEvent) => {
    if (e.key === 'favorites') onStoreChange()
  }
  window.addEventListener('favoritesUpdated', onStoreChange)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener('favoritesUpdated', onStoreChange)
    window.removeEventListener('storage', onStorage)
  }
}

export function isProductFavorite(productId: number): boolean {
  if (!Number.isFinite(productId) || productId <= 0) return false
  return readFavoriteIds().includes(productId)
}

/** Записує id і сповіщає підписників лише якщо набір змінився. */
export function syncFavoriteIdsToStorage(ids: number[]) {
  if (typeof window === 'undefined') return
  const unique = Array.from(new Set(ids.filter((id) => id > 0)))
  const prev = readFavoriteIds()
  if (favoriteIdsEqual(unique, prev)) return
  writeFavoriteIds(unique)
  window.dispatchEvent(new CustomEvent('favoritesUpdated'))
}

export function notifyFavoritesUpdated() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('favoritesUpdated'))
}

function isAuthedForFavorites(): boolean {
  return isUserLoggedIn()
}

/** Після входу: локальні id (гість) додаються на сервер, потім зливаються назад у localStorage. */
export async function syncLocalFavoritesToServer(): Promise<void> {
  if (typeof window === 'undefined') return
  if (!isAuthedForFavorites()) return

  const local = readFavoriteIds()
  if (local.length === 0) return

  const authHeaders = getBearerAuthHeaders()
  try {
    const res = await fetch('/api/favorites', { headers: authHeaders })
    if (!res.ok) return
    const serverIds: unknown = await res.json()
    if (!Array.isArray(serverIds)) return
    const serverSet = new Set(
      serverIds.map((x) => Number(x)).filter((id) => Number.isFinite(id) && id > 0),
    )
    const toAdd = local.filter((id) => !serverSet.has(id))
    for (const productId of toAdd) {
      await fetch('/api/favorites/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({ productId }),
      })
    }
  } catch {
    /* ignore */
  }
}

export async function syncFavoritesAfterAuth(): Promise<void> {
  await syncLocalFavoritesToServer()
  await mergeServerFavoritesIntoLocal()
}

/** Для залогіненого: id з сервера — єдине джерело правди в localStorage. */
export async function mergeServerFavoritesIntoLocal(): Promise<void> {
  if (typeof window === 'undefined') return
  if (!isAuthedForFavorites()) return
  try {
    const authHeaders = getBearerAuthHeaders()
    const res = await fetch('/api/favorites', {
      headers: authHeaders,
    })
    if (!res.ok) return
    const serverIds: unknown = await res.json()
    if (!Array.isArray(serverIds)) return
    const fromServer = serverIds
      .map((x) => Number(x))
      .filter((id) => Number.isFinite(id) && id > 0)
    syncFavoriteIdsToStorage(fromServer)
  } catch {
    /* ignore */
  }
}

type ProductWithId = { id: number }

function isArchivedProduct(raw: Record<string, unknown>): boolean {
  return raw.isArchived === true
}

/** Каталог без cityId — обране може містити позиції з інших міст. */
async function resolveFavoriteProductsByIds<T extends ProductWithId>(
  ids: number[],
  mapProduct: (raw: Record<string, unknown>) => T | null,
  fresh: boolean,
): Promise<T[]> {
  if (ids.length === 0) return []

  const url = getApiUrl('/api/products')
  const res = fresh
    ? await fetchPublicApiFresh(url)
    : await fetch(url, { headers: { 'Cache-Control': 'max-age=120' } })
  const data = res.ok ? await res.json() : []
  const idSet = new Set(ids)
  const byId = new Map<number, T>()
  for (const raw of Array.isArray(data) ? data : []) {
    const rec = raw as Record<string, unknown>
    const id = Number(rec.id)
    if (!idSet.has(id) || isArchivedProduct(rec)) continue
    const mapped = mapProduct(rec)
    if (mapped) byId.set(id, mapped)
  }
  return ids.map((id) => byId.get(id)).filter((x): x is T => x != null)
}

/**
 * Єдине завантаження списку обраного: сервер (якщо є акаунт) або каталог за id з localStorage.
 * Після успішного завантаження оновлює localStorage, щоб бейдж і сердечка збігалися з /favorites.
 */
export async function loadFavoriteProducts<T extends ProductWithId>(
  mapProduct: (raw: Record<string, unknown>) => T | null,
  options?: { fresh?: boolean },
): Promise<T[]> {
  const fresh = options?.fresh === true
  if (typeof window === 'undefined') return []

  if (isAuthedForFavorites()) {
    await syncLocalFavoritesToServer()
    await mergeServerFavoritesIntoLocal()
  }

  const ids = readFavoriteIds()
  if (ids.length === 0) return []

  if (isAuthedForFavorites()) {
    try {
      const authHeaders = getBearerAuthHeaders()
      const res = await fetch('/api/favorites/list', {
        headers: authHeaders,
        ...(fresh ? { cache: 'no-store' as RequestCache } : {}),
      })
      if (res.ok) {
        const data = await res.json()
        const list: T[] = []
        const foundIds: number[] = []
        for (const raw of Array.isArray(data) ? data : []) {
          if (!raw || typeof raw !== 'object') continue
          const rec = raw as Record<string, unknown>
          if (isArchivedProduct(rec)) continue
          const mapped = mapProduct(rec)
          if (mapped && mapped.id > 0) {
            list.push(mapped)
            foundIds.push(mapped.id)
          }
        }
        if (list.length > 0) {
          syncFavoriteIdsToStorage(foundIds)
          return list
        }
      }
    } catch {
      /* catalog fallback */
    }
  }

  const resolved = await resolveFavoriteProductsByIds(ids, mapProduct, fresh)
  syncFavoriteIdsToStorage(resolved.map((p) => p.id))
  return resolved
}
