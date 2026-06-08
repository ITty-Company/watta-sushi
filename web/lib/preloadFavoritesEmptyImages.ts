import { preloadImageUrls } from '@/lib/preloadImages'

/** Усі webp порожнього /favorites — прогрів до першого paint. */
export const FAVORITES_EMPTY_IMAGE_URLS: readonly string[] = [
  '/favorites-empty/watta-wordmark.webp',
  '/favorites-empty/inside-roll-nigiri.webp',
  '/favorites-empty/inside-roll-left.webp',
  '/favorites-empty/inside-roll-rear.webp',
  '/favorites-empty/inside-roll.webp',
  '/favorites-empty/inside-roll-front.webp',
  '/favorites-empty/inside-roll-bottom.webp',
  '/favorites-empty/inside-roll-mussel.webp',
  '/favorites-empty/inside-accent-roll.webp',
  '/favorites-empty/inside-gunkan-ikura.webp',
  '/favorites-empty/inside-gunkan-baked.webp',
]

let inflight: Promise<void> | null = null

export function preloadFavoritesEmptyImages(): void {
  if (typeof window === 'undefined') return
  if (inflight) return
  inflight = Promise.resolve().then(() => {
    preloadImageUrls(FAVORITES_EMPTY_IMAGE_URLS, {
      limit: FAVORITES_EMPTY_IMAGE_URLS.length,
      highPriorityCount: FAVORITES_EMPTY_IMAGE_URLS.length,
    })
  })
}
