/**
 * Точка відправлення за замовчуванням (Helicopterstraat 20, 1059 CG — орієнтовно).
 * У проді координати краще тримати в SiteSetting після геокодування адреси кухні в адмінці.
 */
export const WATTA_KITCHEN_AMSTERDAM = {
  lat: 52.3389,
  lng: 4.8512,
} as const

/** € за 1 км (legacy UA/зони; для NL використовується кроковий тариф з SiteSetting). */
export const AMSTERDAM_EUR_PER_KM = 2

/** Округлення вгору: ceil(km / stepKm) * stepEur */
export function deliveryFeeSteppedEur(distanceKm: number, stepKm: number, stepEur: number): number {
  const km = Number(distanceKm)
  const sk = Number(stepKm)
  const se = Number(stepEur)
  if (!Number.isFinite(km) || km <= 0) return 0
  if (!Number.isFinite(sk) || sk <= 0 || !Number.isFinite(se) || se < 0) return 0
  return Math.round(Math.ceil(km / sk) * se * 100) / 100
}

/** Грубий bbox Нідерландів (якщо геокодер не дав country_code). */
export function inNetherlandsRoughBbox(lat: number, lng: number): boolean {
  return lat >= 50.65 && lat <= 53.75 && lng >= 3.2 && lng <= 7.35
}

export function netherlandsDeliveryAllowed(
  lat: number,
  lng: number,
  address: Record<string, string> | undefined,
  displayName: string
): boolean {
  const cc = address?.country_code?.toLowerCase()
  if (cc === 'nl') return true
  const country = address?.country?.toLowerCase()
  if (country && /netherlands|nederland|the netherlands/.test(country)) return true
  if (/\b(netherlands|nederland)\b/i.test(displayName)) return true
  return inNetherlandsRoughBbox(lat, lng)
}

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
