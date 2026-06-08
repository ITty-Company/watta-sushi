/** Після заміни mp4 у `public/` — змініть bust, щоб не тримати старий кеш. */
export const WATTA_MENU_HERO_FALLBACK_CACHE_BUST = 'menu-keeping-safe-1080p30-20260606'

const withMenuHeroFallbackCacheBust = (path: string) =>
  `${path}?${WATTA_MENU_HERO_FALLBACK_CACHE_BUST}`

/** Stellar-style фон /menu — ролик з промпту (sushi bar / kitchen). */
export const WATTA_MENU_HERO_VIDEO_PATH = '/menu-hero-keeping-safe-road-ready.mp4' as const

export const WATTA_MENU_HERO_VIDEO_FALLBACKS = [
  withMenuHeroFallbackCacheBust(WATTA_MENU_HERO_VIDEO_PATH),
] as const

export const WATTA_MENU_HERO_PRIMARY_MP4 = WATTA_MENU_HERO_VIDEO_FALLBACKS[0]

export const WATTA_MENU_HERO_POSTER = '/watta-menu-hero-poster.jpg' as const

/** Stellar-style фон /menu — зелений ландшафт (статичне фото замість відео). */
export const WATTA_MENU_HERO_LANDSCAPE = '/menu-stellar-hero-landscape.jpg' as const

/** Stellar-style фон /delivery — зелені пагорби з квітами (legacy / embed). */
export const WATTA_DELIVERY_HERO_LANDSCAPE = '/delivery-stellar-hero-hills.png' as const

/** /delivery — курʼєр на скутері (photo-first hero). */
export const WATTA_DELIVERY_PAGE_HERO_LANDSCAPE = '/watta-delivery-stellar-hero-scooter.jpg' as const

/** /delivery — hi-res для Retina / великих екранів. */
export const WATTA_DELIVERY_PAGE_HERO_LANDSCAPE_HQ = '/watta-delivery-stellar-hero-scooter-hq.jpg' as const

/** /delivery — вертикальне фото для телефону. */
export const WATTA_DELIVERY_PAGE_HERO_PORTRAIT = '/watta-delivery-stellar-hero-scooter-mobile.jpg' as const

/** /delivery — portrait hi-res для Retina на телефоні. */
export const WATTA_DELIVERY_PAGE_HERO_PORTRAIT_HQ = '/watta-delivery-stellar-hero-scooter-mobile-hq.jpg' as const

/** Головна `/` — hi-res для Retina / великих екранів. */
export const WATTA_HOME_HERO_LANDSCAPE_HQ = '/delivery-stellar-hero-hills-hq.jpg' as const

/** /menu (повне меню) — ландшафт з небом і хмарами. */
export const WATTA_FULL_MENU_HERO_LANDSCAPE = '/watta-home-stellar-hero-landscape.jpg' as const

/** /menu — hi-res для Retina / великих екранів. */
export const WATTA_FULL_MENU_HERO_LANDSCAPE_HQ = '/watta-home-stellar-hero-landscape-hq.jpg' as const

/** Застарілий placeholder — підміняємо на ролик з промпту Stellar / menu hero. */
export const LEGACY_MENU_HERO_VIDEO_PATH = '/watta-sushi-2-hero.mp4' as const

function remapLegacyMenuHeroUrl(url: string): string {
  const base = url.trim().split('?')[0]
  if (base === LEGACY_MENU_HERO_VIDEO_PATH) {
    return WATTA_MENU_HERO_VIDEO_PATH
  }
  return url.trim()
}

function normalizeMenuPublicHeroMp4Url(url: string): string {
  const remapped = remapLegacyMenuHeroUrl(url)
  const base = remapped.split('?')[0]
  if (base === WATTA_MENU_HERO_VIDEO_PATH) {
    return withMenuHeroFallbackCacheBust(WATTA_MENU_HERO_VIDEO_PATH)
  }
  return remapped
}

function dedupeAdminUrls(adminUrls?: readonly string[] | null): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of adminUrls ?? []) {
    const u = normalizeMenuPublicHeroMp4Url(raw.trim())
    if (!u || seen.has(u)) continue
    seen.add(u)
    out.push(u)
  }
  return out
}

export function buildMenuHeroPlaylist(adminUrls?: readonly string[] | null): readonly string[] {
  const admin = dedupeAdminUrls(adminUrls)
  const seen = new Set<string>()
  const out: string[] = []

  for (const u of admin) {
    if (seen.has(u)) continue
    seen.add(u)
    out.push(u)
  }

  for (const fb of WATTA_MENU_HERO_VIDEO_FALLBACKS) {
    if (seen.has(fb)) continue
    seen.add(fb)
    out.push(fb)
  }

  return out.length > 0 ? out : [...WATTA_MENU_HERO_VIDEO_FALLBACKS]
}

export function getPrimaryMenuHeroVideoSrc(adminUrls?: readonly string[] | null): string {
  return buildMenuHeroPlaylist(adminUrls)[0] ?? WATTA_MENU_HERO_PRIMARY_MP4
}

export function buildMenuHeroVideoSources(adminUrls?: readonly string[] | null): readonly string[] {
  return buildMenuHeroPlaylist(adminUrls)
}
