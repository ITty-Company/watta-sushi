/**
 * Фактична адреса кухні / точки Watta Sushi (Amsterdam).
 * Використовується для embed Google Maps і зовнішнього посилання «Відкрити в Maps».
 */
export const WATTA_RESTAURANT = {
  /** Повний рядок для пошуку в Google Maps */
  query: 'Amstelveenseweg 192, 1075 XR Amsterdam, Netherlands',
  /** Для коротких підписів на сторінці */
  addressLine: 'Amstelveenseweg 192, 1075 XR Amsterdam',
  lat: 52.35685,
  lng: 4.85335,
  embedZoomSingle: 17,
  embedZoomAll: 12,
} as const

export function wattaRestaurantEmbedUrl(zoom: number = WATTA_RESTAURANT.embedZoomSingle): string {
  const q = encodeURIComponent(WATTA_RESTAURANT.query)
  return `https://www.google.com/maps?q=${q}&output=embed&z=${zoom}`
}

export function wattaRestaurantExternalMapsUrl(): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(WATTA_RESTAURANT.query)}`
}

export function wattaMapsUrlForAddress(address: string): string {
  const q = address.trim()
  if (!q) return wattaRestaurantExternalMapsUrl()
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`
}

/** Адреса самовивозу: з адмінки → fallback на фактичну адресу кафе. */
export function resolveRestaurantPickupAddress(fromSettings?: string | null): string {
  const trimmed = String(fromSettings ?? '').trim()
  return trimmed || WATTA_RESTAURANT.addressLine
}
