/** Після заміни mp4 у `public/` — змініть bust, щоб не тримати старий кеш. */
export const WATTA_DELIVERY_HERO_FALLBACK_CACHE_BUST = 'hq-1080p60-20260521'

const withDeliveryHeroFallbackCacheBust = (path: string) =>
  `${path}?${WATTA_DELIVERY_HERO_FALLBACK_CACHE_BUST}`

/** Запасний ролік доставки (окремий від головної лише в адмінці; fallback може збігатися). */
export const WATTA_DELIVERY_HERO_VIDEO_PATH = '/watta-sushi-2-hero.mp4' as const

export const WATTA_DELIVERY_HERO_VIDEO_FALLBACKS = [
  withDeliveryHeroFallbackCacheBust(WATTA_DELIVERY_HERO_VIDEO_PATH),
] as const

export const WATTA_DELIVERY_HERO_PRIMARY_MP4 = WATTA_DELIVERY_HERO_VIDEO_FALLBACKS[0]

export const WATTA_DELIVERY_HERO_POSTER = '/watta-home-hero-poster.jpg' as const

export const WATTA_DELIVERY_HERO_VIDEO_UPDATED_EVENT = 'watta:delivery-hero-video-updated' as const

function normalizeDeliveryPublicHeroMp4Url(url: string): string {
  const trimmed = url.trim()
  const base = trimmed.split('?')[0]
  if (base === WATTA_DELIVERY_HERO_VIDEO_PATH) {
    return withDeliveryHeroFallbackCacheBust(WATTA_DELIVERY_HERO_VIDEO_PATH)
  }
  return trimmed
}

function dedupeAdminUrls(adminUrls?: readonly string[] | null): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of adminUrls ?? []) {
    const u = normalizeDeliveryPublicHeroMp4Url(raw.trim())
    if (!u || seen.has(u)) continue
    seen.add(u)
    out.push(u)
  }
  return out
}

export function buildDeliveryHeroPlaylist(adminUrls?: readonly string[] | null): readonly string[] {
  const admin = dedupeAdminUrls(adminUrls)
  const seen = new Set<string>()
  const out: string[] = []

  for (const u of admin) {
    if (seen.has(u)) continue
    seen.add(u)
    out.push(u)
  }

  for (const fb of WATTA_DELIVERY_HERO_VIDEO_FALLBACKS) {
    if (seen.has(fb)) continue
    seen.add(fb)
    out.push(fb)
  }

  return out.length > 0 ? out : [...WATTA_DELIVERY_HERO_VIDEO_FALLBACKS]
}

export function getPrimaryDeliveryHeroVideoSrc(adminUrls?: readonly string[] | null): string {
  return buildDeliveryHeroPlaylist(adminUrls)[0] ?? WATTA_DELIVERY_HERO_PRIMARY_MP4
}

export function buildDeliveryHeroVideoSources(adminUrls?: readonly string[] | null): readonly string[] {
  return buildDeliveryHeroPlaylist(adminUrls)
}

export { WATTA_HERO_OCEAN_GRADIENT } from '@/lib/wattaHeroVideo'
