import { netherlandsDeliveryAllowed } from './amsterdamDelivery.js'

export type GeocodedPoint = {
  lat: number
  lng: number
  displayName: string
  address?: Record<string, string>
}

export type ServiceCity = {
  name: string
  name_en?: string | null
  name_nl?: string | null
  name_ua?: string | null
  latitude?: number | null
  longitude?: number | null
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function normalizeToken(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9а-яіїєґ]+/gi, ' ')
    .trim()
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function serviceCityNameTokens(city: ServiceCity): string[] {
  const raw = [city.name, city.name_en, city.name_nl, city.name_ua].filter(
    (x): x is string => typeof x === 'string' && x.trim().length > 0,
  )
  const out = new Set<string>()
  for (const n of raw) {
    const norm = normalizeToken(n)
    if (norm.length >= 2) out.add(norm)
    const base = norm.replace(/\s+(city|oblast|region|municipality|gemeente)$/i, '').trim()
    if (base.length >= 2) out.add(base)
  }
  return [...out]
}

function countryMatches(geo: GeocodedPoint, countryCode: string): boolean {
  const cc = countryCode.toUpperCase()
  const addrCc = geo.address?.country_code?.toUpperCase()
  if (addrCc && addrCc.length === 2) return addrCc === cc
  return true
}

function addressHaystack(geo: GeocodedPoint): string {
  const parts = [
    geo.displayName,
    geo.address?.city,
    geo.address?.town,
    geo.address?.village,
    geo.address?.municipality,
    geo.address?.city_district,
    geo.address?.suburb,
    geo.address?.state,
    geo.address?.county,
  ].filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
  return normalizeToken(parts.join(' '))
}

function nameMatchesCity(geo: GeocodedPoint, city: ServiceCity): boolean {
  const hay = addressHaystack(geo)
  if (!hay) return false
  for (const token of serviceCityNameTokens(city)) {
    if (token.length >= 4 && hay.includes(token)) return true
    if (token.length >= 3 && new RegExp(`\\b${escapeRegex(token)}\\b`, 'i').test(hay)) return true
  }
  return false
}

function withinCityRadius(geo: GeocodedPoint, city: ServiceCity, countryCode: string): boolean {
  const lat = city.latitude != null ? Number(city.latitude) : NaN
  const lng = city.longitude != null ? Number(city.longitude) : NaN
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false
  const cc = countryCode.toUpperCase()
  const maxKm = cc === 'NL' ? 28 : 55
  return haversineKm(lat, lng, geo.lat, geo.lng) <= maxKm
}

/** Чи геокодована точка належить обраному в адмінці місту доставки. */
export function geocodedLocationMatchesServiceCity(
  geo: GeocodedPoint,
  city: ServiceCity,
  countryCode: string,
): boolean {
  const cc = countryCode.toUpperCase()
  if (!countryMatches(geo, cc)) return false

  /** NL: доставка по всій країні — не обмежуємо гементе Amsterdam при геокодуванні. */
  if (cc === 'NL') {
    return netherlandsDeliveryAllowed(geo.lat, geo.lng, geo.address, geo.displayName)
  }

  if (nameMatchesCity(geo, city)) return true
  return withinCityRadius(geo, city, cc)
}
