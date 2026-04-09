export const WATTA_DELIVERY_ZONE_STORAGE_KEY = 'wattaDeliveryZoneSelection'

export type WattaZoneFeeMode = 'free' | 'flat' | 'standard'

export type WattaDeliveryZoneSelection = {
  v: 1
  cityId: string
  zoneId: string
  zoneName: string
  feeMode: WattaZoneFeeMode
  /** Для flat — фіксована сума в € */
  flatAmount: number | null
  updatedAt: number
}

export function parseWattaDeliveryZoneSelection(raw: string | null): WattaDeliveryZoneSelection | null {
  if (!raw) return null
  try {
    const o = JSON.parse(raw) as Partial<WattaDeliveryZoneSelection>
    if (o.v !== 1 || typeof o.cityId !== 'string' || typeof o.zoneId !== 'string') return null
    if (o.feeMode !== 'free' && o.feeMode !== 'flat' && o.feeMode !== 'standard') return null
    return {
      v: 1,
      cityId: o.cityId,
      zoneId: o.zoneId,
      zoneName: typeof o.zoneName === 'string' ? o.zoneName : '',
      feeMode: o.feeMode,
      flatAmount:
        o.flatAmount != null && Number.isFinite(Number(o.flatAmount)) ? Number(o.flatAmount) : null,
      updatedAt: typeof o.updatedAt === 'number' ? o.updatedAt : Date.now(),
    }
  } catch {
    return null
  }
}

export function readWattaDeliveryZoneSelection(): WattaDeliveryZoneSelection | null {
  if (typeof window === 'undefined' || !window.localStorage) return null
  return parseWattaDeliveryZoneSelection(localStorage.getItem(WATTA_DELIVERY_ZONE_STORAGE_KEY))
}

export function writeWattaDeliveryZoneSelection(data: WattaDeliveryZoneSelection) {
  if (typeof window === 'undefined' || !window.localStorage) return
  localStorage.setItem(WATTA_DELIVERY_ZONE_STORAGE_KEY, JSON.stringify(data))
  window.dispatchEvent(new CustomEvent('wattaDeliveryZoneUpdated'))
}

export function clearWattaDeliveryZoneSelection() {
  if (typeof window === 'undefined' || !window.localStorage) return
  localStorage.removeItem(WATTA_DELIVERY_ZONE_STORAGE_KEY)
  window.dispatchEvent(new CustomEvent('wattaDeliveryZoneUpdated'))
}

/** Режим тарифу зони для збереження */
export function feeModeFromZone(zone: {
  isFreeDelivery?: boolean
  flatDeliveryFee?: number | null
}): WattaZoneFeeMode {
  if (zone.isFreeDelivery) return 'free'
  if (zone.flatDeliveryFee != null && !Number.isNaN(Number(zone.flatDeliveryFee))) return 'flat'
  return 'standard'
}
