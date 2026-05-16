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
