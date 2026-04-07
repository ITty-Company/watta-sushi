import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'

const router = Router()
const prisma = new PrismaClient()

function parsePolygon(raw: string): { lat: number; lng: number }[] {
  try {
    const arr = JSON.parse(raw) as unknown
    if (!Array.isArray(arr)) return []
    const out: { lat: number; lng: number }[] = []
    for (const p of arr) {
      if (!p || typeof p !== 'object') continue
      const o = p as Record<string, unknown>
      const lat = Number(o.lat ?? o.latitude)
      const lng = Number(o.lng ?? o.longitude ?? o.lon)
      if (Number.isFinite(lat) && Number.isFinite(lng)) out.push({ lat, lng })
    }
    return out
  } catch {
    return []
  }
}

/** Ray casting; lng = x, lat = y */
function pointInPolygon(lat: number, lng: number, polygon: { lat: number; lng: number }[]): boolean {
  if (polygon.length < 3) return false
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const yi = polygon[i].lat
    const yj = polygon[j].lat
    if (yi === yj) continue
    const xi = polygon[i].lng
    const xj = polygon[j].lng
    const intersect =
      (yi > lat) !== (yj > lat) && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi
    if (intersect) inside = !inside
  }
  return inside
}

async function geocodePostal(
  postal: string,
  countryCode: string,
  cityName: string
): Promise<{ lat: number; lng: number; displayName: string } | null> {
  const cc = countryCode.replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase() || 'UA'
  const clean = postal.trim().slice(0, 32)
  if (!clean) return null

  const headers = {
    Accept: 'application/json',
    'User-Agent': 'WattaSushi/1.0 (delivery zone check; https://wattasushi.com.ua)',
  }

  const trySearch = async (sp: URLSearchParams): Promise<unknown[]> => {
    const url = `https://nominatim.openstreetmap.org/search?${sp.toString()}`
    const res = await fetch(url, { headers })
    if (!res.ok) return []
    const data = (await res.json()) as unknown
    return Array.isArray(data) ? data : []
  }

  let params = new URLSearchParams({
    format: 'json',
    limit: '5',
    countrycodes: cc.toLowerCase(),
    postalcode: clean,
  })
  let rows = await trySearch(params)
  let hit = rows[0] as Record<string, unknown> | undefined

  if (!hit || typeof hit !== 'object') {
    params = new URLSearchParams({
      format: 'json',
      limit: '5',
      countrycodes: cc.toLowerCase(),
      q: `${clean} ${cityName}`,
    })
    rows = await trySearch(params)
    hit = rows[0] as Record<string, unknown> | undefined
  }

  if (!hit || typeof hit !== 'object') return null

  const lat = parseFloat(String(hit.lat))
  const lon = parseFloat(String(hit.lon))
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null

  return {
    lat,
    lng: lon,
    displayName: typeof hit.display_name === 'string' ? hit.display_name : `${lat}, ${lon}`,
  }
}

router.post('/check', async (req: Request, res: Response) => {
  try {
    const cityId = parseInt(String((req.body as { cityId?: unknown })?.cityId ?? ''), 10)
    const postalCode = String((req.body as { postalCode?: unknown })?.postalCode ?? '').trim()

    if (!cityId || Number.isNaN(cityId) || !postalCode) {
      return res.status(400).json({ status: 'bad_request' as const })
    }

    const city = await prisma.city.findFirst({
      where: { id: cityId, isActive: true },
      include: { country: true, deliveryZones: true },
    })

    if (!city) {
      return res.status(404).json({ status: 'city_not_found' as const })
    }

    const settings = await prisma.siteSetting.findFirst()
    const defaultDeliveryFee = settings?.deliveryFee ?? 50
    const freeDeliveryThreshold = settings?.freeDeliveryThreshold ?? 1000
    const pricePerKm = city.pricePerKm ?? 10

    const zonesWithPoly = city.deliveryZones
      .map((z) => {
        const poly = parsePolygon(z.coordinates)
        return poly.length >= 3 ? { zone: z, poly } : null
      })
      .filter((x): x is NonNullable<typeof x> => x != null)

    if (zonesWithPoly.length === 0) {
      return res.json({
        status: 'no_zones' as const,
        pricePerKm,
        defaultDeliveryFee,
        freeDeliveryThreshold,
      })
    }

    const geo = await geocodePostal(postalCode, city.country?.code || 'UA', city.name)

    if (!geo) {
      return res.json({
        status: 'geocode_failed' as const,
        pricePerKm,
        defaultDeliveryFee,
        freeDeliveryThreshold,
      })
    }

    for (const { zone, poly } of zonesWithPoly) {
      if (pointInPolygon(geo.lat, geo.lng, poly)) {
        return res.json({
          status: 'inside' as const,
          lat: geo.lat,
          lng: geo.lng,
          placeLabel: geo.displayName,
          zoneName: zone.name,
          zoneId: zone.id,
          zoneIsFreeDelivery: zone.isFreeDelivery === true,
          zoneFlatDeliveryFee:
            zone.isFreeDelivery ? null : zone.flatDeliveryFee != null ? zone.flatDeliveryFee : null,
          pricePerKm,
          defaultDeliveryFee,
          freeDeliveryThreshold,
        })
      }
    }

    return res.json({
      status: 'outside' as const,
      lat: geo.lat,
      lng: geo.lng,
      placeLabel: geo.displayName,
      pricePerKm,
      defaultDeliveryFee,
      freeDeliveryThreshold,
    })
  } catch (e) {
    console.error('delivery /check', e)
    res.status(500).json({ status: 'server_error' as const })
  }
})

export default router
