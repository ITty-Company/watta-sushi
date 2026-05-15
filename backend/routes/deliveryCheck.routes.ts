import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import {
  WATTA_KITCHEN_AMSTERDAM,
  deliveryFeeSteppedEur,
  isValidNlPostcodeFormat,
  minimumOrderEurFromDistanceKm,
  netherlandsDeliveryAllowed,
} from '../lib/amsterdamDelivery.js'

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

/**
 * Відстань по дорозі + час у дорозі (за можливості з урахуванням руху зараз).
 * Потрібні Distance Matrix API + білінг у Google Cloud; той самий ключ, що для Geocoding.
 */
async function googleDrivingRouteMetrics(
  origin: { lat: number; lng: number },
  dest: { lat: number; lng: number }
): Promise<{ distanceKm: number; durationMinutes: number | null } | null> {
  const key = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_SERVER_API_KEY
  if (!key) return null

  const origins = `${origin.lat},${origin.lng}`
  const destinations = `${dest.lat},${dest.lng}`

  const fetchOnce = async (withTraffic: boolean) => {
    const params = new URLSearchParams({
      origins,
      destinations,
      mode: 'driving',
      units: 'metric',
      key,
    })
    if (withTraffic) {
      params.set('departure_time', 'now')
      params.set('traffic_model', 'best_guess')
    }
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?${params.toString()}`
    try {
      const res = await fetch(url)
      if (!res.ok) return null
      const data = (await res.json()) as {
        status?: string
        rows?: {
          elements?: {
            status?: string
            distance?: { value?: number }
            duration?: { value?: number }
            duration_in_traffic?: { value?: number }
          }[]
        }[]
      }
      if (data.status !== 'OK' || !data.rows?.[0]?.elements?.[0]) return null
      const el = data.rows[0].elements[0]
      if (el.status !== 'OK') return null
      const meters = el.distance?.value
      if (typeof meters !== 'number' || !Number.isFinite(meters) || meters <= 0) return null
      const distanceKm = meters / 1000
      const trafficSec = el.duration_in_traffic?.value
      const durationSec = el.duration?.value
      const sec =
        typeof trafficSec === 'number' && Number.isFinite(trafficSec) && trafficSec > 0
          ? trafficSec
          : typeof durationSec === 'number' && Number.isFinite(durationSec) && durationSec > 0
            ? durationSec
            : null
      const durationMinutes = sec != null ? Math.max(1, Math.round(sec / 60)) : null
      return { distanceKm, durationMinutes }
    } catch {
      return null
    }
  }

  return (await fetchOnce(true)) ?? (await fetchOnce(false))
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

function nominatimAddress(hit: Record<string, unknown>): Record<string, string> | undefined {
  const raw = hit.address
  if (!raw || typeof raw !== 'object') return undefined
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof v === 'string' && v.trim()) out[k] = v
  }
  return Object.keys(out).length ? out : undefined
}

function parseNominatimHit(
  hit: unknown
): { lat: number; lng: number; displayName: string; address?: Record<string, string> } | null {
  if (!hit || typeof hit !== 'object') return null
  const h = hit as Record<string, unknown>
  const lat = parseFloat(String(h.lat))
  const lon = parseFloat(String(h.lon))
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
  return {
    lat,
    lng: lon,
    displayName: typeof h.display_name === 'string' ? h.display_name : `${lat}, ${lon}`,
    address: nominatimAddress(h),
  }
}

/** Опційно: той самий ключ, що й NEXT_PUBLIC_GOOGLE_MAPS_API_KEY на фронті (Geocoding API має бути увімкнено). */
function googleComponentsToAddress(
  components: { long_name: string; types: string[] }[] | undefined
): Record<string, string> | undefined {
  if (!Array.isArray(components)) return undefined
  const out: Record<string, string> = {}
  for (const c of components) {
    const t = c.types || []
    if (t.includes('locality')) out.city = c.long_name
    if (t.includes('administrative_area_level_2')) out.municipality = c.long_name
    if (t.includes('sublocality_level_1') && !out.city_district) out.city_district = c.long_name
    if (t.includes('sublocality') && !out.suburb) out.suburb = c.long_name
  }
  return Object.keys(out).length ? out : undefined
}

async function geocodeWithGoogle(
  query: string,
  regionCc: string
): Promise<{ lat: number; lng: number; displayName: string; address?: Record<string, string> } | null> {
  const key = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_SERVER_API_KEY
  if (!key || !query.trim()) return null
  const region = regionCc.replace(/[^A-Za-z]/g, '').slice(0, 2).toLowerCase()
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}${region ? `&region=${region}` : ''}&key=${encodeURIComponent(key)}`
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const data = (await res.json()) as {
      status?: string
      results?: {
        geometry?: { location?: { lat?: number; lng?: number } }
        formatted_address?: string
        address_components?: { long_name: string; types: string[] }[]
      }[]
    }
    if (data.status !== 'OK' || !data.results?.[0]?.geometry?.location) return null
    const r0 = data.results[0]
    const loc = r0.geometry!.location!
    const lat = Number(loc.lat)
    const lng = Number(loc.lng)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
    return {
      lat,
      lng,
      displayName: r0.formatted_address || `${lat}, ${lng}`,
      address: googleComponentsToAddress(r0.address_components),
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
): Promise<{ lat: number; lng: number; displayName: string; address?: Record<string, string> } | null> {
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
      addressdetails: '1',
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
    addressdetails: '1',
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
      addressdetails: '1',
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
      addressdetails: '1',
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

function kitchenCoordsFromSettings(
  s: { deliveryKitchenLat?: number | null; deliveryKitchenLng?: number | null } | null | undefined
): { lat: number; lng: number } | null {
  if (!s) return null
  // Number(null) === 0 — не трактуємо відсутні координати як (0,0)
  if (s.deliveryKitchenLat == null || s.deliveryKitchenLng == null) return null
  const lat = Number(s.deliveryKitchenLat)
  const lng = Number(s.deliveryKitchenLng)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return { lat, lng }
}

/** Витягти NL postcode з довільного рядка (напр. «Damrak 1, 1012 JS Amsterdam»). */
function extractNlPostcodeFromAnywhere(raw: string): string | null {
  const m = raw.match(/\b(\d{4})\s*([A-Za-z]{2})\b/)
  if (!m) return null
  const compact = `${m[1]}${m[2]}`.toUpperCase()
  return isValidNlPostcodeFormat(compact) ? `${m[1]} ${m[2].toUpperCase()}` : null
}

/**
 * Вільний текст: місто, вулиця, «куди їхати» — Google Geocoding (якщо є ключ), інакше Nominatim.
 */
async function geocodeFreeText(
  query: string,
  countryCode: string,
  city: {
    name: string
    name_en?: string | null
    name_nl?: string | null
    name_ua?: string | null
    latitude?: number | null
    longitude?: number | null
  }
): Promise<{ lat: number; lng: number; displayName: string; address?: Record<string, string> } | null> {
  const q = query.trim()
  if (q.length < 3) return null
  const cc = countryCode.replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase()
  const names = citySearchNames(city)
  const primaryCity = names[0] || city.name
  const countryNames: Record<string, string> = {
    NL: 'Netherlands',
    UA: 'Ukraine',
    DE: 'Germany',
    PL: 'Poland',
    BE: 'Belgium',
  }
  const hint = countryNames[cc] || ''

  const gWide = await geocodeWithGoogle(hint ? `${q}, ${hint}` : q, cc)
  if (gWide) return gWide
  const gCity = await geocodeWithGoogle(`${q}, ${primaryCity}${hint ? `, ${hint}` : ''}`, cc)
  if (gCity) return gCity

  const headers = {
    Accept: 'application/json',
    'User-Agent': 'WattaSushi/1.0 (delivery zone check; https://wattasushi.com.ua)',
  }

  let viewbox = ''
  if (city.latitude != null && city.longitude != null) {
    const lat = Number(city.latitude)
    const lng = Number(city.longitude)
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      const d = 0.55
      viewbox = `${lng - d},${lat - d},${lng + d},${lat + d}`
    }
  }

  const trySearch = async (sp: URLSearchParams): Promise<unknown[]> => {
    const url = `https://nominatim.openstreetmap.org/search?${sp.toString()}`
    const res = await fetch(url, { headers })
    if (!res.ok) return []
    const data = (await res.json()) as unknown
    return Array.isArray(data) ? data : []
  }

  const qParams = new URLSearchParams({
    format: 'json',
    limit: '10',
    countrycodes: cc.toLowerCase(),
    q: hint ? `${q}, ${primaryCity}, ${hint}` : `${q}, ${primaryCity}`,
    addressdetails: '1',
  })
  if (viewbox) {
    qParams.set('viewbox', viewbox)
    qParams.set('bounded', '0')
  }
  const rows = await trySearch(qParams)
  const parsed = parseNominatimHit(rows[0])
  if (parsed) return parsed

  if (names[1]) {
    const q2 = new URLSearchParams({
      format: 'json',
      limit: '10',
      countrycodes: cc.toLowerCase(),
      q: hint ? `${q}, ${names[1]}, ${hint}` : `${q}, ${names[1]}`,
      addressdetails: '1',
    })
    if (viewbox) {
      q2.set('viewbox', viewbox)
      q2.set('bounded', '0')
    }
    const rows2 = await trySearch(q2)
    const p2 = parseNominatimHit(rows2[0])
    if (p2) return p2
  }

  return null
}

async function geocodeNetherlandsDestination(
  postal: string,
  addressLine: string | undefined,
  city: {
    name: string
    name_en?: string | null
    name_nl?: string | null
    name_ua?: string | null
    latitude?: number | null
    longitude?: number | null
  }
): Promise<{ lat: number; lng: number; displayName: string; address?: Record<string, string> } | null> {
  const line = addressLine?.trim()
  if (line) {
    const g1 = await geocodeWithGoogle(`${line}, ${postal}, Netherlands`, 'NL')
    if (g1) return g1
    const g2 = await geocodeWithGoogle(`${postal} ${line}, Netherlands`, 'NL')
    if (g2) return g2
    const headers = {
      Accept: 'application/json',
      'User-Agent': 'WattaSushi/1.0 (delivery check; https://wattasushi.nl)',
    }
    const q = new URLSearchParams({
      format: 'json',
      limit: '8',
      countrycodes: 'nl',
      q: `${line}, ${postal}, Netherlands`,
      addressdetails: '1',
    })
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?${q}`, { headers })
      if (res.ok) {
        const data = (await res.json()) as unknown[]
        const parsed = parseNominatimHit(data[0])
        if (parsed) return parsed
      }
    } catch {
      /* fall through */
    }
  }
  return geocodePostal(postal, 'NL', city)
}

router.post('/check', async (req: Request, res: Response) => {
  try {
    const body = (req.body || {}) as {
      cityId?: unknown
      /** Вільний запит: місто, вулиця, індекс тощо (пріоритет над postalCode). */
      locationQuery?: unknown
      postalCode?: unknown
      addressLine?: unknown
    }
    const cityId = parseInt(String(body.cityId ?? ''), 10)
    const locationQuery = String(body.locationQuery ?? '').trim()
    const postalCodeLegacy = String(body.postalCode ?? '').trim()
    const rawInput = (locationQuery || postalCodeLegacy).trim()
    const addressLineRaw = String(body.addressLine ?? '').trim()
    const addressLineExtra = addressLineRaw.length > 0 ? addressLineRaw : undefined

    if (!cityId || Number.isNaN(cityId) || rawInput.length < 3) {
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
    const stepKm = settings?.deliveryTariffStepKm ?? 3
    const stepEur = settings?.deliveryTariffStepEur ?? 1.5

    const countryCode = (city.country?.code || 'UA').toUpperCase()
    const nlTariffFlow = countryCode === 'NL'

    const zonesWithPoly = city.deliveryZones
      .map((z) => {
        const poly = parsePolygon(z.coordinates)
        return poly.length >= 3 ? { zone: z, poly } : null
      })
      .filter((x): x is NonNullable<typeof x> => x != null)

    const cityGeoFields = {
      name: city.name,
      name_en: city.name_en,
      name_nl: city.name_nl,
      name_ua: city.name_ua,
      latitude: city.latitude,
      longitude: city.longitude,
    }

    const extractedNlPc = nlTariffFlow ? extractNlPostcodeFromAnywhere(rawInput) : null
    const lineWithoutExtractedPc =
      extractedNlPc != null
        ? rawInput.replace(/\b\d{4}\s*[A-Za-z]{2}\b/gi, '').replace(/[,\s]+/g, ' ').trim()
        : ''

    let geo: Awaited<ReturnType<typeof geocodePostal>> = null

    if (nlTariffFlow && extractedNlPc) {
      const pcNorm = extractedNlPc.replace(/\s+/g, '').toUpperCase()
      const addrLine =
        [lineWithoutExtractedPc, addressLineExtra].filter(Boolean).join(', ').trim() || undefined
      geo = await geocodeNetherlandsDestination(pcNorm, addrLine, cityGeoFields)
    } else if (nlTariffFlow && isValidNlPostcodeFormat(rawInput.replace(/\s+/g, ''))) {
      const pcNorm = rawInput.replace(/\s+/g, '').toUpperCase()
      geo = await geocodeNetherlandsDestination(pcNorm, addressLineExtra, cityGeoFields)
    } else if (nlTariffFlow) {
      geo = await geocodeFreeText(rawInput, 'NL', cityGeoFields)
    } else {
      geo =
        (await geocodeFreeText(rawInput, countryCode, cityGeoFields)) ??
        (await geocodePostal(rawInput, city.country?.code || 'UA', cityGeoFields))
    }

    if (!geo) {
      return res.json({
        status: 'geocode_failed' as const,
        pricePerKm: nlTariffFlow ? roundMoney(stepEur / Math.max(0.001, stepKm)) : pricePerKm,
        defaultDeliveryFee: nlTariffFlow ? 0 : defaultDeliveryFee,
        freeDeliveryThreshold,
        deliveryTariffStepKm: nlTariffFlow ? stepKm : undefined,
        deliveryTariffStepEur: nlTariffFlow ? stepEur : undefined,
        estimatedDeliveryFee: null as number | null,
        distanceKm: null as number | null,
      })
    }

    /** Уся NL: пряма відстань від кухні (SiteSetting / City) + кроковий тариф з адмінки. */
    if (nlTariffFlow) {
      if (!netherlandsDeliveryAllowed(geo.lat, geo.lng, geo.address, geo.displayName)) {
        return res.json({
          status: 'outside_nl' as const,
          lat: geo.lat,
          lng: geo.lng,
          placeLabel: geo.displayName,
          pricePerKm: roundMoney(stepEur / Math.max(0.001, stepKm)),
          defaultDeliveryFee: 0,
          freeDeliveryThreshold,
          deliveryTariffStepKm: stepKm,
          deliveryTariffStepEur: stepEur,
          estimatedDeliveryFee: null as number | null,
          distanceKm: null as number | null,
        })
      }
      const origin =
        kitchenCoordsFromSettings(settings) ?? kitchenOrigin(city) ?? WATTA_KITCHEN_AMSTERDAM
      const route = await googleDrivingRouteMetrics(origin, { lat: geo.lat, lng: geo.lng })
      const distanceKm = route?.distanceKm ?? haversineKm(origin.lat, origin.lng, geo.lat, geo.lng)
      const fee = deliveryFeeSteppedEur(distanceKm, stepKm, stepEur)
      const distRounded = roundMoney(distanceKm)
      return res.json({
        status: 'nl_tariff_ok' as const,
        lat: geo.lat,
        lng: geo.lng,
        placeLabel: geo.displayName,
        pricePerKm: roundMoney(stepEur / Math.max(0.001, stepKm)),
        defaultDeliveryFee: 0,
        freeDeliveryThreshold,
        deliveryTariffStepKm: stepKm,
        deliveryTariffStepEur: stepEur,
        estimatedDeliveryFee: fee,
        distanceKm: distRounded,
        routeDurationMinutes:
          route?.durationMinutes != null && Number.isFinite(route.durationMinutes)
            ? route.durationMinutes
            : null,
        minimumOrderEur: minimumOrderEurFromDistanceKm(distanceKm),
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
        const dKm = est.distanceKm != null ? roundMoney(est.distanceKm) : null
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
          distanceKm: dKm,
          minimumOrderEur:
            est.distanceKm != null ? minimumOrderEurFromDistanceKm(est.distanceKm) : null,
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
