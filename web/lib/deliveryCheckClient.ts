import type { NearbyServiceCityPin } from '@/lib/nearbyServiceCityPin'

export type DeliveryCheckStatus =
  | 'inside'
  | 'outside'
  | 'no_zones'
  | 'geocode_failed'
  | 'bad_request'
  | 'server_error'
  | 'city_not_found'
  | 'amsterdam_ok'
  | 'nl_tariff_ok'
  | 'outside_amsterdam'
  | 'outside_nl'
  | 'not_in_service_city'
  | 'postcode_format_invalid'

export type DeliveryCheckResult = {
  status: DeliveryCheckStatus
  placeLabel?: string
  lat?: number
  lng?: number
  zoneName?: string
  zoneId?: number
  zoneIsFreeDelivery?: boolean
  zoneFlatDeliveryFee?: number | null
  pricePerKm?: number
  defaultDeliveryFee?: number
  freeDeliveryThreshold?: number
  estimatedDeliveryFee?: number | null
  distanceKm?: number | null
  minimumOrderEur?: number | null
  deliveryTariffStepKm?: number
  deliveryTariffStepEur?: number
  routeDurationMinutes?: number | null
  nearbyServiceCities?: NearbyServiceCityPin[]
}

export function isDeliveryFeeAvailable(status: DeliveryCheckStatus | undefined): boolean {
  return status === 'nl_tariff_ok' || status === 'amsterdam_ok' || status === 'inside'
}

export function isDeliveryCityUnavailable(status: DeliveryCheckStatus | undefined): boolean {
  return (
    status === 'not_in_service_city' ||
    status === 'outside_nl' ||
    status === 'outside_amsterdam'
  )
}

export function isDeliveryOutsideArea(status: DeliveryCheckStatus | undefined): boolean {
  return status === 'outside' || isDeliveryCityUnavailable(status)
}

function parseNearbyServiceCities(raw: unknown): NearbyServiceCityPin[] | undefined {
  if (!Array.isArray(raw)) return undefined
  const out: NearbyServiceCityPin[] = []
  for (const row of raw) {
    if (!row || typeof row !== 'object') continue
    const o = row as Record<string, unknown>
    const id = Number(o.id)
    const lat = Number(o.lat)
    const lng = Number(o.lng)
    const distanceKm = Number(o.distanceKm)
    const name = typeof o.name === 'string' ? o.name : ''
    if (!Number.isFinite(id) || !Number.isFinite(lat) || !Number.isFinite(lng) || !name) continue
    out.push({
      id,
      name,
      name_en: typeof o.name_en === 'string' ? o.name_en : null,
      name_nl: typeof o.name_nl === 'string' ? o.name_nl : null,
      name_ua: typeof o.name_ua === 'string' ? o.name_ua : null,
      lat,
      lng,
      distanceKm: Number.isFinite(distanceKm) ? distanceKm : 0,
      countryFlag: typeof o.countryFlag === 'string' ? o.countryFlag : null,
      hasZones: o.hasZones === true,
    })
  }
  return out.length ? out : undefined
}

export async function fetchDeliveryCheck(
  cityId: number,
  locationQuery: string,
  addressLine?: string,
): Promise<DeliveryCheckResult> {
  const body: { cityId: number; locationQuery: string; addressLine?: string } = {
    cityId,
    locationQuery: locationQuery.trim(),
  }
  const extra = addressLine?.trim()
  if (extra) body.addressLine = extra

  const res = await fetch('/api/delivery/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = (await res.json()) as DeliveryCheckResult & { status?: string }
  if (!res.ok) {
    return { status: (data.status as DeliveryCheckStatus) || 'server_error' }
  }
  return {
    status: data.status as DeliveryCheckStatus,
    placeLabel: data.placeLabel,
    lat: data.lat != null ? Number(data.lat) : undefined,
    lng: data.lng != null ? Number(data.lng) : undefined,
    zoneName: data.zoneName,
    zoneId: data.zoneId,
    zoneIsFreeDelivery: data.zoneIsFreeDelivery,
    zoneFlatDeliveryFee: data.zoneFlatDeliveryFee,
    pricePerKm: data.pricePerKm != null ? Number(data.pricePerKm) : undefined,
    defaultDeliveryFee: data.defaultDeliveryFee != null ? Number(data.defaultDeliveryFee) : undefined,
    freeDeliveryThreshold:
      data.freeDeliveryThreshold != null ? Number(data.freeDeliveryThreshold) : undefined,
    estimatedDeliveryFee:
      data.estimatedDeliveryFee != null && !Number.isNaN(Number(data.estimatedDeliveryFee))
        ? Number(data.estimatedDeliveryFee)
        : null,
    distanceKm:
      data.distanceKm != null && !Number.isNaN(Number(data.distanceKm)) ? Number(data.distanceKm) : null,
    minimumOrderEur:
      data.minimumOrderEur != null && !Number.isNaN(Number(data.minimumOrderEur))
        ? Number(data.minimumOrderEur)
        : null,
    deliveryTariffStepKm:
      data.deliveryTariffStepKm != null ? Number(data.deliveryTariffStepKm) : undefined,
    deliveryTariffStepEur:
      data.deliveryTariffStepEur != null ? Number(data.deliveryTariffStepEur) : undefined,
    routeDurationMinutes:
      data.routeDurationMinutes != null ? Number(data.routeDurationMinutes) : null,
    nearbyServiceCities: parseNearbyServiceCities(
      (data as { nearbyServiceCities?: unknown }).nearbyServiceCities,
    ),
  }
}
