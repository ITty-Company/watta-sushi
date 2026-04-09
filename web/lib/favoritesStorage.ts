/** Локальне обране: масив id (узгоджено з useProductFavorite та картками меню). */

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

/** Об’єднує id з сервера з локальними (гість + акаунт), щоб бейдж і /favorites збігалися. */
export async function mergeServerFavoritesIntoLocal(): Promise<void> {
  if (typeof window === 'undefined') return
  const userStr = localStorage.getItem('currentUser')
  if (!userStr) return
  try {
    const user = JSON.parse(userStr)
    const uid = Number(user?.id)
    if (!Number.isFinite(uid) || uid <= 0) return
    const res = await fetch('/api/favorites', {
      headers: { 'x-user-id': String(uid) },
    })
    if (!res.ok) return
    const serverIds: unknown = await res.json()
    if (!Array.isArray(serverIds)) return
    const fromServer = serverIds
      .map((x) => Number(x))
      .filter((id) => Number.isFinite(id) && id > 0)
    const local = readFavoriteIds()
    const merged = Array.from(new Set([...fromServer, ...local]))
    const same =
      merged.length === local.length &&
      merged.every((id) => local.includes(id)) &&
      local.every((id) => merged.includes(id))
    if (!same) {
      writeFavoriteIds(merged)
      window.dispatchEvent(new CustomEvent('favoritesUpdated'))
    }
  } catch {
    /* ignore */
  }
}
