/** Максимальна відстань по дорозі від кухні для NL (км). */
export const NL_MAX_DELIVERY_RADIUS_KM = 45

export type DeliveryServiceCityPin = {
  id: number
  name: string
  name_en?: string | null
  name_nl?: string | null
  name_ua?: string | null
  lat: number
  lng: number
  /** Відстань від адреси клієнта до центру міста (км, орієнтовно). */
  distanceKm: number
  countryFlag?: string | null
  hasZones: boolean
}

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
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

export function roundDeliveryKm(n: number): number {
  return Math.round(n * 10) / 10
}

type CityRow = {
  id: number
  name: string
  name_en?: string | null
  name_nl?: string | null
  name_ua?: string | null
  latitude?: number | null
  longitude?: number | null
  restaurantLatitude?: number | null
  restaurantLongitude?: number | null
  deliveryZones?: { coordinates: string }[]
  country?: { flag?: string | null } | null
}

export function cityHubCoords(city: CityRow): { lat: number; lng: number } | null {
  const rLat = city.restaurantLatitude ?? city.latitude
  const rLng = city.restaurantLongitude ?? city.longitude
  if (rLat == null || rLng == null) return null
  const lat = Number(rLat)
  const lng = Number(rLng)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return { lat, lng }
}

export function cityHasDeliveryZones(city: CityRow): boolean {
  if (!city.deliveryZones?.length) return false
  for (const z of city.deliveryZones) {
    try {
      const raw = typeof z.coordinates === 'string' ? JSON.parse(z.coordinates) : z.coordinates
      if (Array.isArray(raw) && raw.length >= 3) return true
    } catch {
      /* ignore */
    }
  }
  return false
}

/** Міста, куди реально возимо (зони в адмінці або в радіусі кухні NL). */
export function filterActiveServiceHubCities(
  cities: CityRow[],
  countryCode: string,
  kitchenOrigin: { lat: number; lng: number } | null
): CityRow[] {
  const cc = countryCode.toUpperCase()
  return cities.filter((city) => {
    if (cityHasDeliveryZones(city)) return true
    if (cc !== 'NL' || !kitchenOrigin) return false
    const hub = cityHubCoords(city)
    if (!hub) return false
    return (
      haversineKm(kitchenOrigin.lat, kitchenOrigin.lng, hub.lat, hub.lng) <=
      NL_MAX_DELIVERY_RADIUS_KM + 8
    )
  })
}

export function buildNearbyServiceCityPins(
  userLat: number,
  userLng: number,
  serviceCities: CityRow[],
  limit = 6
): DeliveryServiceCityPin[] {
  const pins: DeliveryServiceCityPin[] = []
  for (const city of serviceCities) {
    const hub = cityHubCoords(city)
    if (!hub) continue
    pins.push({
      id: city.id,
      name: city.name,
      name_en: city.name_en,
      name_nl: city.name_nl,
      name_ua: city.name_ua,
      lat: hub.lat,
      lng: hub.lng,
      distanceKm: roundDeliveryKm(haversineKm(userLat, userLng, hub.lat, hub.lng)),
      countryFlag: city.country?.flag ?? null,
      hasZones: cityHasDeliveryZones(city),
    })
  }
  pins.sort((a, b) => a.distanceKm - b.distanceKm)
  return pins.slice(0, limit)
}

export function isNlDrivingDistanceInServiceRange(drivingDistanceKm: number): boolean {
  return Number.isFinite(drivingDistanceKm) && drivingDistanceKm > 0 && drivingDistanceKm <= NL_MAX_DELIVERY_RADIUS_KM
}
