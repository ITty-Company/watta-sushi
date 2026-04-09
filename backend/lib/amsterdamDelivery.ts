/**
 * Доставка для Амстердама (NL): відстань від кухні Watta + тариф €/км.
 * Координати збігаються з web/lib/wattaRestaurantLocation.ts
 */
export const WATTA_KITCHEN_AMSTERDAM = {
  lat: 52.35685,
  lng: 4.85335,
} as const

/** € за 1 км (пряма відстань від кухні до геоточки індексу). */
export const AMSTERDAM_EUR_PER_KM = 2

/** Мінімальна сума замовлення залежно від відстані від кухні (спільне правило для відповіді /check). */
export const DELIVERY_MIN_ORDER_DISTANCE_KM = 20
export const DELIVERY_MIN_ORDER_ABOVE_KM_EUR = 100
export const DELIVERY_MIN_ORDER_UP_TO_KM_EUR = 25

export function minimumOrderEurFromDistanceKm(distanceKm: number): number {
  if (!Number.isFinite(distanceKm) || distanceKm < 0) return DELIVERY_MIN_ORDER_UP_TO_KM_EUR
  if (distanceKm > DELIVERY_MIN_ORDER_DISTANCE_KM) return DELIVERY_MIN_ORDER_ABOVE_KM_EUR
  return DELIVERY_MIN_ORDER_UP_TO_KM_EUR
}

/** Інші гементе в агломерації — не «Амстердам» для цієї перевірки. */
const OTHER_GEMEENTE = /\b(amstelveen|diemen|haarlemmermeer|zaanstad|haarlem|alkmaar|hoofddorp|aalten)\b/i

export function isAmsterdamCity(city: {
  name: string
  name_en?: string | null
  name_nl?: string | null
  name_ua?: string | null
}): boolean {
  const blob = [city.name, city.name_en, city.name_nl, city.name_ua].filter(Boolean).join(' ').toLowerCase()
  return /\bamsterdam\b/.test(blob)
}

/** Формат індексу NL: 1234AB або 1234 AB. */
export function isValidNlPostcodeFormat(raw: string): boolean {
  const s = raw.trim().replace(/\s+/g, '').toUpperCase()
  return /^\d{4}[A-Z]{2}$/.test(s)
}

/** Bbox гементе Amsterdam (орієнтовно), якщо адреса з геокодера неповна. */
export function inAmsterdamRoughBbox(lat: number, lng: number): boolean {
  return lat >= 52.255 && lat <= 52.445 && lng >= 4.728 && lng <= 5.095
}

function fieldIsAmsterdam(v: string | undefined): boolean {
  return Boolean(v && v.trim().toLowerCase() === 'amsterdam')
}

/**
 * Чи точка вважається доставкою по Амстердаму (індекс NL у межах міста).
 */
export function amsterdamDeliveryAllowed(
  lat: number,
  lng: number,
  address: Record<string, string> | undefined,
  displayName: string
): boolean {
  const disp = displayName
  const muni = address?.municipality
  const city = address?.city
  const town = address?.town

  for (const v of [muni, city, town]) {
    if (v && OTHER_GEMEENTE.test(v)) return false
  }

  if (fieldIsAmsterdam(muni) || fieldIsAmsterdam(city) || fieldIsAmsterdam(town)) return true

  if (/\bamsterdam\b/i.test(disp)) {
    if (OTHER_GEMEENTE.test(disp)) return false
    return true
  }

  const hasAddr = address && Object.keys(address).length > 0
  if (!hasAddr) return inAmsterdamRoughBbox(lat, lng)

  return false
}
