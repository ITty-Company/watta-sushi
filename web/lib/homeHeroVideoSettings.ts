export function parseHomeHeroVideoUrlsFromApi(data: {
  homeHeroVideoUrls?: unknown
  homeHeroVideoUrl?: unknown
}): string[] {
  if (Array.isArray(data.homeHeroVideoUrls)) {
    const urls = data.homeHeroVideoUrls
      .filter((x): x is string => typeof x === 'string')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
    if (urls.length > 0) return urls
  }
  if (typeof data.homeHeroVideoUrl === 'string' && data.homeHeroVideoUrl.trim()) {
    return [data.homeHeroVideoUrl.trim()]
  }
  return []
}
