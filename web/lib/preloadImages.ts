import { isBrokenUploadUrl, markBrokenUploadUrl } from '@/lib/brokenUploadUrlCache'

const preloadedUrls = new Set<string>()
const PRELOAD_URL_CAP = 256

function rememberPreloaded(url: string): boolean {
  if (preloadedUrls.has(url)) return false
  if (preloadedUrls.size >= PRELOAD_URL_CAP) preloadedUrls.clear()
  preloadedUrls.add(url)
  return true
}

/** Чи вже прогрівали URL у цій вкладці (без повторного Image()/fetch). */
export function wasImageUrlPreloaded(url: string): boolean {
  const u = url?.trim()
  if (!u) return false
  return preloadedUrls.has(u)
}

/** Прогрів кешу браузера для /uploads і зовнішніх URL — картинки зʼявляються без «пустих» плиток. */
export function preloadImageUrls(
  urls: readonly (string | null | undefined)[],
  opts?: { limit?: number; highPriorityCount?: number },
): void {
  if (typeof window === 'undefined') return
  const limit = opts?.limit ?? 32
  const highN = opts?.highPriorityCount ?? 6
  const seen = new Set<string>()
  let n = 0

  for (let i = 0; i < urls.length; i += 1) {
    const raw = urls[i]
    if (seen.size >= limit) break
    const u = raw?.trim()
    if (!u || u.startsWith('data:') || u.startsWith('blob:')) continue
    if (isBrokenUploadUrl(u)) continue
    if (seen.has(u)) continue
    seen.add(u)
    if (!rememberPreloaded(u)) continue
    n += 1
    const img = new Image()
    img.decoding = 'async'
    if ('fetchPriority' in img) {
      ;(img as HTMLImageElement & { fetchPriority?: string }).fetchPriority =
        n <= highN ? 'high' : 'low'
    }
    img.onerror = () => {
      if (u.includes('/uploads/')) markBrokenUploadUrl(u)
    }
    img.src = u
  }
}
