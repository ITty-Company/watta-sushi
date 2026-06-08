import { normalizeSameOriginMediaPath } from '@/lib/resolveUploadMediaUrl'
import { normalizePublicHeroMp4Url } from '@/lib/wattaHeroVideo'

function normalizeHeroApiUrl(raw: string): string {
  return normalizePublicHeroMp4Url(normalizeSameOriginMediaPath(raw.trim()))
}

export function parseHomeHeroVideoUrlsFromApi(data: {
  homeHeroVideoUrls?: unknown
  homeHeroVideoUrl?: unknown
}): string[] {
  if (Array.isArray(data.homeHeroVideoUrls)) {
    const urls = data.homeHeroVideoUrls
      .filter((x): x is string => typeof x === 'string')
      .map((s) => normalizeHeroApiUrl(s))
      .filter((s) => s.length > 0)
    if (urls.length > 0) return urls
  }
  if (typeof data.homeHeroVideoUrl === 'string' && data.homeHeroVideoUrl.trim()) {
    return [normalizeHeroApiUrl(data.homeHeroVideoUrl)]
  }
  return []
}
