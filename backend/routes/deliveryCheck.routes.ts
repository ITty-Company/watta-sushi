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

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100
}

function kitchenOrigin(city: {
  restaurantLatitude: number | null
  restaurantLongitude: number | null
  latitude: number | null
  longitude: number | null
}): { lat: number; lng: number } | null {
  const rLat = city.restaurantLatitude ?? city.latitude
  const rLng = city.restaurantLongitude ?? city.longitude
  if (rLat == null || rLng == null) return null
  const lat = Number(rLat)
  const lng = Number(rLng)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return { lat, lng }
}

function estimateInsideZone(
  zone: { isFreeDelivery: boolean; flatDeliveryFee: number | null },
  defaultDeliveryFee: number,
  pricePerKm: number,
  origin: { lat: number; lng: number } | null,
  dest: { lat: number; lng: number }
): { estimatedDeliveryFee: number; distanceKm: number | null } {
  const distanceKm = origin ? haversineKm(origin.lat, origin.lng, dest.lat, dest.lng) : null
  if (zone.isFreeDelivery) {
    return { estimatedDeliveryFee: 0, distanceKm }
  }
  if (zone.flatDeliveryFee != null && !Number.isNaN(Number(zone.flatDeliveryFee))) {
    return { estimatedDeliveryFee: roundMoney(Number(zone.flatDeliveryFee)), distanceKm }
  }
  const kmPart = distanceKm != null ? distanceKm * pricePerKm : 0
  return {
    estimatedDeliveryFee: roundMoney(defaultDeliveryFee + kmPart),
    distanceKm,
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

/** Варіанти написання індексу для геокодера (NL: 1016GV → 1016 GV тощо). */
function postalVariantsForCountry(raw: string, countryCode: string): string[] {
  const cc = countryCode.replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase()
  const s = raw.trim().slice(0, 32)
  if (!s) return []
  const noSpace = s.replace(/\s+/g, '').toUpperCase()
  const out = new Set<string>()
  out.add(s)
  out.add(noSpace)
  out.add(s.replace(/\s+/g, ' ').trim())

  if (cc === 'NL') {
    const m = noSpace.match(/^(\d{4})([A-Z]{2})$/)
    if (m) {
      const spaced = `${m[1]} ${m[2]}`
      out.add(spaced)
      out.add(`${m[1]}${m[2]}`)
      out.add(spaced.toLowerCase())
    }
  }

  return [...out].filter(Boolean)
}

function citySearchNames(city: {
  name: string
  name_en?: string | null
  name_nl?: string | null
  name_ua?: string | null
}): string[] {
  const names = [city.name, city.name_en, city.name_nl, city.name_ua].filter(
    (x): x is string => typeof x === 'string' && x.trim().length > 0
  )
  return [...new Set(names.map((n) => n.trim()))]
}

function parseNominatimHit(hit: unknown): { lat: number; lng: number; displayName: string } | null {
  if (!hit || typeof hit !== 'object') return null
  const h = hit as Record<string, unknown>
  const lat = parseFloat(String(h.lat))
  const lon = parseFloat(String(h.lon))
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
  return {
    lat,
    lng: lon,
    displayName: typeof h.display_name === 'string' ? h.display_name : `${lat}, ${lon}`,
  }
}

/** Опційно: той самий ключ, що й NEXT_PUBLIC_GOOGLE_MAPS_API_KEY на фронті (Geocoding API має бути увімкнено). */
async function geocodeWithGoogle(
  query: string,
  regionCc: string
): Promise<{ lat: number; lng: number; displayName: string } | null> {
  const key = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_SERVER_API_KEY
  if (!key || !query.trim()) return null
  const region = regionCc.replace(/[^A-Za-z]/g, '').slice(0, 2).toLowerCase()
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}${region ? `&region=${region}` : ''}&key=${encodeURIComponent(key)}`
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const data = (await res.json()) as { status?: string; results?: { geometry?: { location?: { lat?: number; lng?: number } }; formatted_address?: string }[] }
    if (data.status !== 'OK' || !data.results?.[0]?.geometry?.location) return null
    const loc = data.results[0].geometry.location
    const lat = Number(loc.lat)
    const lng = Number(loc.lng)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
    return {
      lat,
      lng,
      displayName: data.results[0].formatted_address || `${lat}, ${lng}`,
    }
  } catch {
    return null
  }
}

async function geocodePostal(
  postal: string,
  countryCode: string,
  city: {
    name: string
    name_en?: string | null
    name_nl?: string | null
    name_ua?: string | null
    latitude?: number | null
    longitude?: number | null
  }
): Promise<{ lat: number; lng: number; displayName: string } | null> {
  const cc = countryCode.replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase() || 'UA'
  const variants = postalVariantsForCountry(postal, cc)
  if (variants.length === 0) return null

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

  let viewbox = ''
  if (city.latitude != null && city.longitude != null) {
    const lat = Number(city.latitude)
    const lng = Number(city.longitude)
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      const d = 0.45
      viewbox = `${lng - d},${lat - d},${lng + d},${lat + d}`
    }
  }

  const countryNames: Record<string, string> = {
    NL: 'Netherlands',
    UA: 'Ukraine',
    DE: 'Germany',
    PL: 'Poland',
    BE: 'Belgium',
  }
  const countryHint = countryNames[cc] || ''
  const names = citySearchNames(city)
  const primaryCity = names[0] || city.name

  /** Для NL спочатку «1234 AB», інакше — найкоротший варіант без зайвих пробілів. */
  const ranked = [...variants].sort((a, b) => {
    if (cc === 'NL') {
      const aSp = /^\d{4} [A-Z]{2}$/i.test(a)
      const bSp = /^\d{4} [A-Z]{2}$/i.test(b)
      if (aSp && !bSp) return -1
      if (!aSp && bSp) return 1
    }
    return a.length - b.length
  })
  const tryPostal = ranked.slice(0, 3)

  for (const pv of tryPostal) {
    const params = new URLSearchParams({
      format: 'json',
      limit: '8',
      countrycodes: cc.toLowerCase(),
      postalcode: pv,
    })
    const rows = await trySearch(params)
    const parsed = parseNominatimHit(rows[0])
    if (parsed) return parsed
  }

  const pv0 = tryPostal[0] || variants[0]
  const qParams = new URLSearchParams({
    format: 'json',
    limit: '8',
    countrycodes: cc.toLowerCase(),
    q: `${pv0} ${primaryCity}`,
  })
  if (viewbox) {
    qParams.set('viewbox', viewbox)
    qParams.set('bounded', '0')
  }
  let rows = await trySearch(qParams)
  let parsed = parseNominatimHit(rows[0])
  if (parsed) return parsed

  if (names[1]) {
    const q2 = new URLSearchParams({
      format: 'json',
      limit: '8',
      countrycodes: cc.toLowerCase(),
      q: `${pv0} ${names[1]}`,
    })
    if (viewbox) {
      q2.set('viewbox', viewbox)
      q2.set('bounded', '0')
    }
    rows = await trySearch(q2)
    parsed = parseNominatimHit(rows[0])
    if (parsed) return parsed
  }

  if (countryHint) {
    const q3 = new URLSearchParams({
      format: 'json',
      limit: '8',
      countrycodes: cc.toLowerCase(),
      q: `${pv0} ${primaryCity} ${countryHint}`,
    })
    rows = await trySearch(q3)
    parsed = parseNominatimHit(rows[0])
    if (parsed) return parsed
  }

  const g1 = await geocodeWithGoogle(`${pv0} ${primaryCity}`, cc)
  if (g1) return g1
  if (countryHint) {
    const g2 = await geocodeWithGoogle(`${pv0} ${primaryCity}, ${countryHint}`, cc)
    if (g2) return g2
  }

  return null
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

    const geo = await geocodePostal(postalCode, city.country?.code || 'UA', {
      name: city.name,
      name_en: city.name_en,
      name_nl: city.name_nl,
      name_ua: city.name_ua,
      latitude: city.latitude,
      longitude: city.longitude,
    })

    if (!geo) {
      return res.json({
        status: 'geocode_failed' as const,
        pricePerKm,
        defaultDeliveryFee,
        freeDeliveryThreshold,
        estimatedDeliveryFee: null as number | null,
        distanceKm: null as number | null,
      })
    }

    if (zonesWithPoly.length === 0) {
      return res.json({
        status: 'no_zones' as const,
        lat: geo.lat,
        lng: geo.lng,
        placeLabel: geo.displayName,
        pricePerKm,
        defaultDeliveryFee,
        freeDeliveryThreshold,
        estimatedDeliveryFee: null as number | null,
        distanceKm: null as number | null,
      })
    }

    const origin = kitchenOrigin(city)

    for (const { zone, poly } of zonesWithPoly) {
      if (pointInPolygon(geo.lat, geo.lng, poly)) {
        const est = estimateInsideZone(zone, defaultDeliveryFee, pricePerKm, origin, {
          lat: geo.lat,
          lng: geo.lng,
        })
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
          estimatedDeliveryFee: est.estimatedDeliveryFee,
          distanceKm: est.distanceKm != null ? roundMoney(est.distanceKm) : null,
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
      estimatedDeliveryFee: null as number | null,
      distanceKm: null as number | null,
    })
  } catch (e) {
    console.error('delivery /check', e)
    res.status(500).json({ status: 'server_error' as const })
  }
})

export default router
