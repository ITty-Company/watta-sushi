import { buildDeliveryHeroVideoSources } from '@/lib/wattaDeliveryHeroVideo'

export { buildDeliveryHeroVideoSources, buildDeliveryHeroPlaylist } from '@/lib/wattaDeliveryHeroVideo'

/** Плейлист hero доставки: спочатку URL з адмінки, далі запасні mp4. */
export function getDeliveryHeroVideoSources(adminUrls?: readonly string[] | null): readonly string[] {
  return buildDeliveryHeroVideoSources(adminUrls)
}
