/** Об'єднання плейлистів (порядок: перший телефон, потім другий) без дублікатів. */
export function mergeAuthHeroVideoUrls(...lists: readonly (readonly string[])[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const list of lists) {
    for (const raw of list) {
      const u = raw.trim()
      if (!u || seen.has(u)) continue
      seen.add(u)
      out.push(u)
    }
  }
  return out
}

export function parseAuthHeroVideoUrlsFromApi(data: {
  authHeroVideoUrls?: unknown
  authHeroVideoUrl?: unknown
}): string[] {
  if (Array.isArray(data.authHeroVideoUrls)) {
    const urls = data.authHeroVideoUrls
      .filter((x): x is string => typeof x === 'string')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
    if (urls.length > 0) return urls
  }
  if (typeof data.authHeroVideoUrl === 'string' && data.authHeroVideoUrl.trim()) {
    return [data.authHeroVideoUrl.trim()]
  }
  return []
}
