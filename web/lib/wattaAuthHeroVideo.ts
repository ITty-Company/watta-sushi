/** Постер без брендового «SUSHI» — лише страва в «телефоні». */
export const WATTA_AUTH_HERO_POSTER = '/sushi.webp' as const

export const WATTA_AUTH_HERO_VIDEO_UPDATED_EVENT = 'watta:auth-hero-video-updated' as const

/** Головний ролик з написами — не показуємо на сторінці входу. */
const BRANDED_HOME_HERO_PATH = '/watta-sushi-2-hero.mp4'

function isBrandedDefaultHeroUrl(url: string): boolean {
  return url.split('?')[0].trim() === BRANDED_HOME_HERO_PATH
}

function dedupeAdminUrls(adminUrls?: readonly string[] | null): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of adminUrls ?? []) {
    const u = raw.trim()
    if (!u || seen.has(u) || isBrandedDefaultHeroUrl(u)) continue
    seen.add(u)
    out.push(u)
  }
  return out
}

/** Лише ролики з адмінки (без запасного hero з написом SUSHI). */
export function buildAuthHeroPlaylist(adminUrls?: readonly string[] | null): readonly string[] {
  return dedupeAdminUrls(adminUrls)
}

export function getPrimaryAuthHeroVideoSrc(adminUrls?: readonly string[] | null): string | null {
  const list = buildAuthHeroPlaylist(adminUrls)
  return list[0] ?? null
}

export function buildAuthHeroVideoSources(adminUrls?: readonly string[] | null): readonly string[] {
  return buildAuthHeroPlaylist(adminUrls)
}
