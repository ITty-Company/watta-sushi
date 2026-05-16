/** Після заміни mp4 у `public/` — змініть, щоб браузер не тримав старий 480p у кеші. */
export const WATTA_HOME_HERO_FALLBACK_CACHE_BUST = '1080p-20260516'

const withHeroFallbackCacheBust = (path: string) =>
  `${path}?${WATTA_HOME_HERO_FALLBACK_CACHE_BUST}`

/** Єдиний запасний ролик — 1920×1080 у `public/watta-sushi-2-hero.mp4`. */
export const WATTA_HOME_HERO_VIDEO_PATH = '/watta-sushi-2-hero.mp4' as const

/**
 * Головна сторінка (`MenuView`): ocean hero + один HD-запасний mp4.
 */
export const WATTA_HOME_HERO_VIDEO_FALLBACKS = [
  withHeroFallbackCacheBust(WATTA_HOME_HERO_VIDEO_PATH),
] as const

/** @deprecated use buildHomeHeroVideoSources */
export const WATTA_HOME_HERO_VIDEO_SOURCES = WATTA_HOME_HERO_VIDEO_FALLBACKS

/**
 * Повний каталог `/menu` (`FullMenuPageClient`): окремий банерний ролик, далі той самий ланцюг запасних.
 */
export const WATTA_FULL_MENU_PAGE_HERO_VIDEO_SOURCES = WATTA_HOME_HERO_VIDEO_FALLBACKS

/** Preload на головній — перший кадр головного hero (не сторінка `/menu`). */
export const WATTA_HERO_PRIMARY_MP4 = WATTA_HOME_HERO_VIDEO_FALLBACKS[0]

/** Постер hero — миттєвий кадр до decode mp4 (телефон / планшет / reload). */
export const WATTA_HOME_HERO_POSTER = '/watta-sushi.jpg' as const

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
 * Плейлист головної:
 * 1) URL з адмінки (файл 1:1 через multipart, без перекодування)
 * 2) запасні mp4 з `public/` — лише якщо адмінського немає або onError
 */
export function buildHomeHeroPlaylist(adminUrls?: readonly string[] | null): readonly string[] {
  const admin = dedupeAdminUrls(adminUrls)
  const seen = new Set<string>()
  const out: string[] = []

  for (const u of admin) {
    if (seen.has(u)) continue
    seen.add(u)
    out.push(u)
  }

  for (const fb of WATTA_HOME_HERO_VIDEO_FALLBACKS) {
    if (seen.has(fb)) continue
    seen.add(fb)
    out.push(fb)
  }

  return out.length > 0 ? out : [...WATTA_HOME_HERO_VIDEO_FALLBACKS]
}

/** Перший src для <video> / preload — завжди оригінал з адмінки, якщо є. */
export function getPrimaryHomeHeroVideoSrc(adminUrls?: readonly string[] | null): string {
  return buildHomeHeroPlaylist(adminUrls)[0] ?? WATTA_HERO_PRIMARY_MP4
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
