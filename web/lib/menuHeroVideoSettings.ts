export const WATTA_MENU_HERO_VIDEO_UPDATED_EVENT = 'watta:menu-hero-video-updated' as const

export function parseMenuHeroVideoUrlsFromApi(data: {
  menuHeroVideoUrls?: unknown
  menuHeroVideoUrl?: unknown
}): string[] {
  if (Array.isArray(data.menuHeroVideoUrls)) {
    const urls = data.menuHeroVideoUrls
      .filter((x): x is string => typeof x === 'string')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
    if (urls.length > 0) return urls
  }
  if (typeof data.menuHeroVideoUrl === 'string' && data.menuHeroVideoUrl.trim()) {
    return [data.menuHeroVideoUrl.trim()]
  }
  return []
}
