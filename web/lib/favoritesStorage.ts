/** Локальне обране: масив id (узгоджено з useProductFavorite та картками меню). */

import { getBearerAuthHeaders } from '@/lib/authHeaders'
import { getApiUrl } from '@/lib/utils'
import { readCityIdForProductApi } from '@/lib/wattaSiteLocalePrefs'

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
  if (typeof window === 'undefined') return false
  const userStr = localStorage.getItem('currentUser')
  if (!userStr) return false
  const authHeaders = getBearerAuthHeaders()
  return Object.keys(authHeaders as Record<string, string>).length > 0
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

/**
 * Єдине завантаження списку обраного: сервер (якщо є акаунт) або каталог за id з localStorage.
 * Після успішного /list оновлює localStorage, щоб бейдж і сердечка збігалися з /favorites.
 */
export async function loadFavoriteProducts<T extends ProductWithId>(
  mapProduct: (raw: Record<string, unknown>) => T | null,
): Promise<T[]> {
  if (typeof window === 'undefined') return []

  await mergeServerFavoritesIntoLocal()

  if (isAuthedForFavorites()) {
    try {
      const authHeaders = getBearerAuthHeaders()
      const res = await fetch('/api/favorites/list', { headers: authHeaders })
      if (res.ok) {
        const data = await res.json()
        const list: T[] = []
        const ids: number[] = []
        for (const raw of Array.isArray(data) ? data : []) {
          const mapped = mapProduct(raw as Record<string, unknown>)
          if (mapped && mapped.id > 0) {
            list.push(mapped)
            ids.push(mapped.id)
          }
        }
        syncFavoriteIdsToStorage(ids)
        return list
      }
    } catch {
      /* guest path */
    }
  }

  const ids = readFavoriteIds()
  if (ids.length === 0) return []

  const cityId = readCityIdForProductApi()
  const url =
    cityId != null && cityId > 0
      ? getApiUrl(`/api/products?cityId=${cityId}`)
      : getApiUrl('/api/products')
  const res = await fetch(url, { headers: { 'Cache-Control': 'max-age=120' } })
  const data = res.ok ? await res.json() : []
  const idSet = new Set(ids)
  const byId = new Map<number, T>()
  for (const raw of Array.isArray(data) ? data : []) {
    const id = Number((raw as { id?: number }).id)
    if (!idSet.has(id)) continue
    const mapped = mapProduct(raw as Record<string, unknown>)
    if (mapped) byId.set(id, mapped)
  }
  return ids.map((id) => byId.get(id)).filter((x): x is T => x != null)
}
