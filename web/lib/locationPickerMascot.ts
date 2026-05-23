/** Статичний PNG маскота модалки вибору локації. */
export const LOCATION_PICKER_MASCOT_SRC = '/location-picker-mascot.png'

let mascotPreloadStarted = false

/** Прогрів кешу браузера — стикер зʼявляється одразу при відкритті модалки. */
export function preloadLocationPickerMascot(): void {
  if (typeof window === 'undefined' || mascotPreloadStarted) return
  mascotPreloadStarted = true
  const img = new Image()
  img.decoding = 'async'
  if ('fetchPriority' in img) {
    ;(img as HTMLImageElement & { fetchPriority?: string }).fetchPriority = 'high'
  }
  img.src = LOCATION_PICKER_MASCOT_SRC
}
