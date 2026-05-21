/** Прогрів кешу браузера для /uploads і зовнішніх URL — картинки зʼявляються без «пустих» плиток. */
export function preloadImageUrls(
  urls: Iterable<string | null | undefined>,
  opts?: { limit?: number; highPriorityCount?: number },
): void {
  if (typeof window === 'undefined') return
  const limit = opts?.limit ?? 32
  const highN = opts?.highPriorityCount ?? 6
  const seen = new Set<string>()
  let n = 0

  for (const raw of urls) {
    if (seen.size >= limit) break
    const u = raw?.trim()
    if (!u || u.startsWith('data:') || u.startsWith('blob:')) continue
    if (seen.has(u)) continue
    seen.add(u)
    n += 1
    const img = new Image()
    img.decoding = 'async'
    if ('fetchPriority' in img) {
      ;(img as HTMLImageElement & { fetchPriority?: string }).fetchPriority =
        n <= highN ? 'high' : 'low'
    }
    img.src = u
  }
}
