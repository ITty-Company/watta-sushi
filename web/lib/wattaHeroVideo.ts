/**
 * Головна сторінка (`MenuView`): основний ocean hero + запасні mp4.
 */
export const WATTA_HOME_HERO_VIDEO_FALLBACKS = [
  '/watta-sushi-2-hero.mp4',
  '/hero-untitled-design.mp4',
  '/welcome.mp4',
] as const

/** @deprecated use buildHomeHeroVideoSources */
export const WATTA_HOME_HERO_VIDEO_SOURCES = WATTA_HOME_HERO_VIDEO_FALLBACKS

/**
 * Повний каталог `/menu` (`FullMenuPageClient`): окремий банерний ролик, далі той самий ланцюг запасних.
 */
export const WATTA_FULL_MENU_PAGE_HERO_VIDEO_SOURCES = [
  '/watta-sushi-2-hero.mp4',
  '/hero-untitled-design.mp4',
  '/welcome.mp4',
] as const

/** Preload на головній — перший кадр головного hero (не сторінка `/menu`). */
export const WATTA_HERO_PRIMARY_MP4 = WATTA_HOME_HERO_VIDEO_FALLBACKS[0]

/** Після збереження hero-відео в адмінці — оновити MenuView без reload */
export const WATTA_HOME_HERO_VIDEO_UPDATED_EVENT = 'watta:home-hero-video-updated' as const

function dedupeAdminUrls(adminUrls?: readonly string[] | null): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of adminUrls ?? []) {
    const u = raw.trim()
    if (!u || seen.has(u)) continue
    seen.add(u)
    out.push(u)
  }
  return out
}

/**
 * Плейлист головної: спочатку mp4 з `public/` (завжди на Render), потім URL з адмінки.
 * Інакше перший `/uploads/…` без диска дає синю заглушку, поки не спрацює onError.
 */
export function buildHomeHeroPlaylist(adminUrls?: readonly string[] | null): readonly string[] {
  const admin = dedupeAdminUrls(adminUrls)
  const seen = new Set<string>()
  const out: string[] = []
  for (const fb of WATTA_HOME_HERO_VIDEO_FALLBACKS) {
    if (seen.has(fb)) continue
    seen.add(fb)
    out.push(fb)
  }
  for (const u of admin) {
    if (seen.has(u)) continue
    seen.add(u)
    out.push(u)
  }
  return out.length > 0 ? out : [...WATTA_HOME_HERO_VIDEO_FALLBACKS]
}

/** Той самий ланцюг, що й плейлист (запасні вже на початку). */
export function buildHomeHeroVideoSources(adminUrls?: readonly string[] | null): readonly string[] {
  return buildHomeHeroPlaylist(adminUrls)
}

/** @deprecated — один URL; використовуйте buildHomeHeroVideoSources */
export function buildHomeHeroVideoSourcesFromSingle(adminUrl?: string | null): readonly string[] {
  const one = (adminUrl || '').trim()
  return buildHomeHeroVideoSources(one ? [one] : null)
}

/** Подія після зняття сплешу: MenuView / hero resume play одразу */
export const WATTA_BOOT_SPLASH_ENDED_EVENT = 'watta:boot-splash-ended' as const

/** Перший кадр hero готовий (loadeddata / playing) — сплеш можна прибрати */
export const WATTA_HERO_VIDEO_READY_EVENT = 'watta:hero-video-ready' as const

/** Фон hero до першого кадру mp4 (темний, без «синьої» заглушки) */
export const WATTA_HERO_OCEAN_GRADIENT = '#0a1210'

/** @deprecated синій градієнт — лишено для рідких fallback-екранів */
export const WATTA_HERO_OCEAN_GRADIENT_LEGACY =
  'radial-gradient(120% 90% at 50% 28%, #6ec4dc 0%, #3f94ae 38%, #2a6f82 72%, #1e5566 100%)'
