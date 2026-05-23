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
}

export function isDeliveryFeeAvailable(status: DeliveryCheckStatus | undefined): boolean {
  return status === 'nl_tariff_ok' || status === 'amsterdam_ok' || status === 'inside'
}

export function isDeliveryOutsideArea(status: DeliveryCheckStatus | undefined): boolean {
  return status === 'outside_nl' || status === 'outside_amsterdam' || status === 'outside'
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
  }
}
