import { buildAuthHeroVideoSources } from '@/lib/wattaAuthHeroVideo'

export { buildAuthHeroPlaylist, buildAuthHeroVideoSources } from '@/lib/wattaAuthHeroVideo'

/** Плейлист для симулятора телефона на /login та /register. */
export function getAuthHeroVideoSources(adminUrls?: readonly string[] | null): readonly string[] {
  return buildAuthHeroVideoSources(adminUrls)
}
