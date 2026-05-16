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

/** Плейлист головної: лише відео з адмінки; якщо порожньо — запасні mp4. */
export function buildHomeHeroPlaylist(adminUrls?: readonly string[] | null): readonly string[] {
  const admin = dedupeAdminUrls(adminUrls)
  if (admin.length > 0) return admin
  return [...WATTA_HOME_HERO_VIDEO_FALLBACKS]
}

/** Плейлист + запасні URL (лише при помилці завантаження). */
export function buildHomeHeroVideoSources(adminUrls?: readonly string[] | null): readonly string[] {
  const playlist = buildHomeHeroPlaylist(adminUrls)
  const seen = new Set(playlist)
  const chain = [...playlist]
  for (const fb of WATTA_HOME_HERO_VIDEO_FALLBACKS) {
    if (!seen.has(fb)) {
      seen.add(fb)
      chain.push(fb)
    }
  }
  return chain.length > 0 ? chain : [...WATTA_HOME_HERO_VIDEO_FALLBACKS]
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

/** CSS-фон hero до декоду mp4 (немає залежності від відсутнього jpg-постера) */
export const WATTA_HERO_OCEAN_GRADIENT =
  'radial-gradient(120% 90% at 50% 28%, #6ec4dc 0%, #3f94ae 38%, #2a6f82 72%, #1e5566 100%)'
