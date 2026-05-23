/** Постер без брендового «SUSHI» — лише страва в «телефоні». */
export const WATTA_AUTH_HERO_POSTER = '/sushi.webp' as const

export const WATTA_AUTH_HERO_VIDEO_UPDATED_EVENT = 'watta:auth-hero-video-updated' as const

export type AuthHeroPhonesUpdatedDetail = {
  urls?: string[]
  url?: string
  phone2Urls?: string[]
  phone1Copy?: Record<string, unknown>
  phone2Copy?: Record<string, unknown>
}

/** Головний ролик з написами — не дублюємо в плейлист, якщо в адмінці ще є інші URL. */
const BRANDED_HOME_HERO_PATH = '/watta-sushi-2-hero.mp4'

/** Запасний ролик для /login і /register, коли в адмінці лише hero з головної. */
export const AUTH_HERO_FALLBACK_VIDEO = BRANDED_HOME_HERO_PATH

function isBrandedDefaultHeroUrl(url: string): boolean {
  return url.split('?')[0].trim() === BRANDED_HOME_HERO_PATH
}

function dedupeAdminUrls(adminUrls?: readonly string[] | null): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of adminUrls ?? []) {
    const u = raw.trim()
    if (!u || seen.has(u)) continue
    seen.add(u)
    out.push(u)
  }
  const custom = out.filter((u) => !isBrandedDefaultHeroUrl(u))
  return custom.length > 0 ? custom : out
}

/** Лише ролики з адмінки (без запасного hero з написом SUSHI). */
export function buildAuthHeroPlaylist(adminUrls?: readonly string[] | null): readonly string[] {
  return dedupeAdminUrls(adminUrls)
}

export function getPrimaryAuthHeroVideoSrc(adminUrls?: readonly string[] | null): string | null {
  const list = buildAuthHeroVideoSources(adminUrls)
  return list[0] ?? AUTH_HERO_FALLBACK_VIDEO
}

export function buildAuthHeroVideoSources(adminUrls?: readonly string[] | null): readonly string[] {
  const playlist = buildAuthHeroPlaylist(adminUrls)
  return playlist.length > 0 ? playlist : [AUTH_HERO_FALLBACK_VIDEO]
}
