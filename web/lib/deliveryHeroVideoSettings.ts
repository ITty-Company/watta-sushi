export function parseDeliveryHeroVideoUrlsFromApi(data: {
  deliveryHeroVideoUrls?: unknown
  deliveryHeroVideoUrl?: unknown
}): string[] {
  if (Array.isArray(data.deliveryHeroVideoUrls)) {
    const urls = data.deliveryHeroVideoUrls
      .filter((x): x is string => typeof x === 'string')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
    if (urls.length > 0) return urls
  }
  if (typeof data.deliveryHeroVideoUrl === 'string' && data.deliveryHeroVideoUrl.trim()) {
    return [data.deliveryHeroVideoUrl.trim()]
  }
  return []
}
