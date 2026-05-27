import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import {
  WATTA_KITCHEN_AMSTERDAM,
  deliveryFeeSteppedEur,
  isValidNlPostcodeFormat,
  minimumOrderEurFromDistanceKm,
  netherlandsDeliveryAllowed,
} from '../lib/amsterdamDelivery.js'
import { geocodedLocationMatchesServiceCity } from '../lib/deliveryCityMatch.js'
import {
  buildNearbyServiceCityPins,
  filterActiveServiceHubCities,
  isNlDrivingDistanceInServiceRange,
} from '../lib/deliveryServiceArea.js'
import { signDeliveryQuote } from '../lib/deliveryQuote.js'

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

/** Маршрут по дорогах через OSRM (fallback, якщо Google Distance Matrix недоступний). */
async function osrmDrivingRouteMetrics(
  origin: { lat: number; lng: number },
  dest: { lat: number; lng: number }
): Promise<{ distanceKm: number; durationMinutes: number | null } | null> {
  const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${dest.lng},${dest.lat}?overview=false`
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return null
    const data = (await res.json()) as {
      code?: string
      routes?: { distance?: number; duration?: number }[]
    }
    if (data.code !== 'Ok' || !data.routes?.[0]) return null
    const route = data.routes[0]
    const meters = route.distance
    if (typeof meters !== 'number' || !Number.isFinite(meters) || meters <= 0) return null
    const distanceKm = meters / 1000
    const durationSec = route.duration
    const durationMinutes =
      typeof durationSec === 'number' && Number.isFinite(durationSec) && durationSec > 0
        ? Math.max(1, Math.round(durationSec / 60))
        : null
    return { distanceKm, durationMinutes }
  } catch {
    return null
  }
}

async function drivingRouteMetrics(
  origin: { lat: number; lng: number },
  dest: { lat: number; lng: number }
): Promise<{ distanceKm: number; durationMinutes: number | null }> {
  const google = await googleDrivingRouteMetrics(origin, dest)
  if (google) return google
  const osrm = await osrmDrivingRouteMetrics(origin, dest)
  if (osrm) return osrm
  return {
    distanceKm: haversineKm(origin.lat, origin.lng, dest.lat, dest.lng),
    durationMinutes: null,
  }
}

function formatNlPostcodeSpaced(raw: string): string {
  const compact = raw.replace(/\s+/g, '').toUpperCase()
  const m = compact.match(/^(\d{4})([A-Z]{2})$/)
  return m ? `${m[1]} ${m[2]}` : raw.trim()
}

function geocodedPostcodeMatches(inputPostcode: string, geo: {
  displayName: string
  address?: Record<string, string>
}): boolean {
  const want = inputPostcode.replace(/\s+/g, '').toUpperCase()
  if (!isValidNlPostcodeFormat(want)) return true
  const fromAddr = geo.address?.postcode?.replace(/\s+/g, '').toUpperCase()
  if (fromAddr) return fromAddr === want
  const fromDisplay = extractNlPostcodeFromAnywhere(geo.displayName)
  if (fromDisplay) {
    return fromDisplay.replace(/\s+/g, '').toUpperCase() === want
  }
  return true
}

function isNlGeocodeHit(geo: {
  lat: number
  lng: number
  displayName: string
  address?: Record<string, string>
}): boolean {
  return netherlandsDeliveryAllowed(geo.lat, geo.lng, geo.address, geo.displayName)
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

type CityGeoFields = {
  name: string
  name_en?: string | null
  name_nl?: string | null
  name_ua?: string | null
  latitude?: number | null
  longitude?: number | null
}

function firstGeocodeInServiceCity(
  hits: unknown[],
  city: CityGeoFields,
  countryCode: string
): { lat: number; lng: number; displayName: string; address?: Record<string, string> } | null {
  for (const row of hits) {
    const parsed = parseNominatimHit(row)
    if (parsed && geocodedLocationMatchesServiceCity(parsed, city, countryCode)) return parsed
  }
  return null
}

async function geocodeGoogleInServiceCity(
  query: string,
  countryCode: string,
  city: CityGeoFields
): Promise<{ lat: number; lng: number; displayName: string; address?: Record<string, string> } | null> {
  const g = await geocodeWithGoogle(query, countryCode)
  if (g && geocodedLocationMatchesServiceCity(g, city, countryCode)) return g
  return null
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
  components: { long_name: string; short_name?: string; types: string[] }[] | undefined
): Record<string, string> | undefined {
  if (!Array.isArray(components)) return undefined
  const out: Record<string, string> = {}
  for (const c of components) {
    const t = c.types || []
    if (t.includes('locality')) out.city = c.long_name
    if (t.includes('administrative_area_level_2')) out.municipality = c.long_name
    if (t.includes('sublocality_level_1') && !out.city_district) out.city_district = c.long_name
    if (t.includes('sublocality') && !out.suburb) out.suburb = c.long_name
    if (t.includes('postal_code')) out.postcode = c.long_name
    if (t.includes('country')) {
      out.country = c.long_name
      if (c.short_name) out.country_code = c.short_name
    }
    if (t.includes('route') && !out.road) out.road = c.long_name
    if (t.includes('street_number') && !out.house_number) out.house_number = c.long_name
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
        address_components?: { long_name: string; short_name?: string; types: string[] }[]
      }[]
    }
    if (data.status !== 'OK' || !data.results?.length) return null
    for (const row of data.results) {
      const loc = row.geometry?.location
      if (!loc) continue
      const lat = Number(loc.lat)
      const lng = Number(loc.lng)
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue
      const hit = {
        lat,
        lng,
        displayName: row.formatted_address || `${lat}, ${lng}`,
        address: googleComponentsToAddress(row.address_components),
      }
      if (regionCc.toUpperCase() === 'NL') {
        if (isNlGeocodeHit(hit)) return hit
        continue
      }
      return hit
    }
    return null
  } catch {
    return null
  }
}

async function geocodeWithGoogleNl(
  query: string,
  expectedPostcode?: string
): Promise<{ lat: number; lng: number; displayName: string; address?: Record<string, string> } | null> {
  const key = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_SERVER_API_KEY
  if (!key || !query.trim()) return null
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&region=nl&key=${encodeURIComponent(key)}`
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const data = (await res.json()) as {
      status?: string
      results?: {
        geometry?: { location?: { lat?: number; lng?: number } }
        formatted_address?: string
        address_components?: { long_name: string; short_name?: string; types: string[] }[]
      }[]
    }
    if (data.status !== 'OK' || !data.results?.length) return null
    let fallback: { lat: number; lng: number; displayName: string; address?: Record<string, string> } | null =
      null
    for (const row of data.results) {
      const loc = row.geometry?.location
      if (!loc) continue
      const lat = Number(loc.lat)
      const lng = Number(loc.lng)
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue
      const hit = {
        lat,
        lng,
        displayName: row.formatted_address || `${lat}, ${lng}`,
        address: googleComponentsToAddress(row.address_components),
      }
      const accepted = acceptNlGeocodeSync(hit, expectedPostcode)
      if (accepted) return accepted
      if (!fallback && isNlGeocodeHit(hit)) fallback = hit
    }
    return expectedPostcode ? null : fallback
  } catch {
    return null
  }
}

async function geocodePostal(
  postal: string,
  countryCode: string,
  city: CityGeoFields
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
    const parsed = firstGeocodeInServiceCity(rows, city, cc)
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
    qParams.set('bounded', '1')
  }
  let rows = await trySearch(qParams)
  let parsed = firstGeocodeInServiceCity(rows, city, cc)
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
      q2.set('bounded', '1')
    }
    rows = await trySearch(q2)
    parsed = firstGeocodeInServiceCity(rows, city, cc)
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
    if (viewbox) {
      q3.set('viewbox', viewbox)
      q3.set('bounded', '1')
    }
    rows = await trySearch(q3)
    parsed = firstGeocodeInServiceCity(rows, city, cc)
    if (parsed) return parsed
  }

  const g1 = await geocodeGoogleInServiceCity(`${pv0} ${primaryCity}`, cc, city)
  if (g1) return g1
  if (countryHint) {
    const g2 = await geocodeGoogleInServiceCity(`${pv0} ${primaryCity}, ${countryHint}`, cc, city)
    if (g2) return g2
  }

  return null
}

function kitchenCoordsFromSettings(
  s:
    | {
        deliveryKitchenLat?: number | null
        deliveryKitchenLng?: number | null
        deliveryKitchenAddress?: string | null
      }
    | null
    | undefined
): { lat: number; lng: number } | null {
  const addr = String(s?.deliveryKitchenAddress ?? '').trim().toLowerCase()
  if (/amstelveenseweg/.test(addr)) return null

  if (s?.deliveryKitchenLat != null && s?.deliveryKitchenLng != null) {
    const lat = Number(s.deliveryKitchenLat)
    const lng = Number(s.deliveryKitchenLng)
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      const nearAmstelveenseweg =
        Math.abs(lat - 52.35685) < 0.015 && Math.abs(lng - 4.85335) < 0.02
      if (nearAmstelveenseweg && !/helicopterstraat/.test(addr)) return null
      return { lat, lng }
    }
  }
  if (/helicopterstraat/.test(addr)) return WATTA_KITCHEN_AMSTERDAM
  return null
}

function resolveKitchenOrigin(
  settings:
    | {
        deliveryKitchenLat?: number | null
        deliveryKitchenLng?: number | null
        deliveryKitchenAddress?: string | null
      }
    | null
    | undefined,
  city: {
    restaurantLatitude: number | null
    restaurantLongitude: number | null
    latitude: number | null
    longitude: number | null
  },
  nlTariffFlow: boolean
): { lat: number; lng: number } {
  return (
    kitchenCoordsFromSettings(settings) ??
    (nlTariffFlow ? WATTA_KITCHEN_AMSTERDAM : null) ??
    kitchenOrigin(city) ??
    WATTA_KITCHEN_AMSTERDAM
  )
}

async function loadNearbyServiceCities(
  countryId: number,
  countryCode: string,
  userLat: number,
  userLng: number,
  kitchenOrigin: { lat: number; lng: number } | null
) {
  const rows = await prisma.city.findMany({
    where: { isActive: true, countryId },
    include: { country: true, deliveryZones: true },
    orderBy: { name: 'asc' },
  })
  const hubs = filterActiveServiceHubCities(rows, countryCode, kitchenOrigin)
  return buildNearbyServiceCityPins(userLat, userLng, hubs)
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
  city: CityGeoFields
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

  if (cc === 'NL') {
    const extractedPc = extractNlPostcodeFromAnywhere(q)
    if (extractedPc) {
      const line = q
        .replace(/\b\d{4}\s*[A-Za-z]{2}\b/gi, '')
        .replace(/[,\s]+/g, ' ')
        .trim()
      const dest = await geocodeNetherlandsDestination(
        extractedPc.replace(/\s+/g, '').toUpperCase(),
        line || undefined,
        city
      )
      if (dest) return dest
    }
    const gNl = await geocodeWithGoogleNl(hint ? `${q}, ${hint}` : `${q}, Netherlands`)
    if (gNl) return gNl
  }

  const gCity = await geocodeGoogleInServiceCity(
    `${q}, ${primaryCity}${hint ? `, ${hint}` : ''}`,
    cc,
    city
  )
  if (gCity) return gCity

  for (const alt of names.slice(1)) {
    const gAlt = await geocodeGoogleInServiceCity(
      `${q}, ${alt}${hint ? `, ${hint}` : ''}`,
      cc,
      city
    )
    if (gAlt) return gAlt
  }

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
    qParams.set('bounded', '1')
  }
  const rows = await trySearch(qParams)
  const parsed = firstGeocodeInServiceCity(rows, city, cc)
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
      q2.set('bounded', '1')
    }
    const rows2 = await trySearch(q2)
    const p2 = firstGeocodeInServiceCity(rows2, city, cc)
    if (p2) return p2
  }

  return null
}

async function acceptNlGeocode(
  geo: { lat: number; lng: number; displayName: string; address?: Record<string, string> } | null,
  expectedPostcode?: string
): Promise<{ lat: number; lng: number; displayName: string; address?: Record<string, string> } | null> {
  return acceptNlGeocodeSync(geo, expectedPostcode)
}

function acceptNlGeocodeSync(
  geo: { lat: number; lng: number; displayName: string; address?: Record<string, string> } | null,
  expectedPostcode?: string
): { lat: number; lng: number; displayName: string; address?: Record<string, string> } | null {
  if (!geo || !isNlGeocodeHit(geo)) return null
  if (expectedPostcode && !geocodedPostcodeMatches(expectedPostcode, geo)) return null
  return geo
}

async function geocodeNlPostcodeOnly(
  postal: string
): Promise<{ lat: number; lng: number; displayName: string; address?: Record<string, string> } | null> {
  const pcNorm = postal.replace(/\s+/g, '').toUpperCase()
  const variants = postalVariantsForCountry(pcNorm, 'NL').slice(0, 3)

  for (const pv of variants) {
    const g = await geocodeWithGoogleNl(`${pv}, Netherlands`, pcNorm)
    if (g) return g
  }

  const headers = {
    Accept: 'application/json',
    'User-Agent': 'WattaSushi/1.0 (delivery check; https://wattasushi.nl)',
  }
  for (const pv of variants) {
    const params = new URLSearchParams({
      format: 'json',
      limit: '5',
      countrycodes: 'nl',
      postalcode: pv,
      addressdetails: '1',
    })
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, { headers })
      if (!res.ok) continue
      const rows = (await res.json()) as unknown[]
      if (!Array.isArray(rows)) continue
      for (const row of rows) {
        const hit = await acceptNlGeocode(parseNominatimHit(row), pcNorm)
        if (hit) return hit
      }
    } catch {
      /* try next variant */
    }
  }
  return null
}

async function geocodeNetherlandsDestination(
  postal: string,
  addressLine: string | undefined,
  _city: CityGeoFields
): Promise<{ lat: number; lng: number; displayName: string; address?: Record<string, string> } | null> {
  const pcNorm = postal.replace(/\s+/g, '').toUpperCase()
  const pcSpaced = formatNlPostcodeSpaced(pcNorm)
  const line = addressLine?.trim()

  if (line) {
    const streetQueries = [
      `${line}, ${pcSpaced}, Netherlands`,
      `${pcSpaced} ${line}, Netherlands`,
      `${line}, ${pcSpaced}`,
    ]
    for (const q of streetQueries) {
      const g = await geocodeWithGoogleNl(q, pcNorm)
      if (g) return g
    }

    const headers = {
      Accept: 'application/json',
      'User-Agent': 'WattaSushi/1.0 (delivery check; https://wattasushi.nl)',
    }
    for (const q of streetQueries) {
      const params = new URLSearchParams({
        format: 'json',
        limit: '8',
        countrycodes: 'nl',
        q,
        addressdetails: '1',
      })
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, { headers })
        if (!res.ok) continue
        const rows = (await res.json()) as unknown[]
        if (!Array.isArray(rows)) continue
        for (const row of rows) {
          const hit = await acceptNlGeocode(parseNominatimHit(row), pcNorm)
          if (hit) return hit
        }
      } catch {
        /* fall through */
      }
    }
  }

  return geocodeNlPostcodeOnly(pcNorm)
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
    const kitchenOriginPoint = resolveKitchenOrigin(settings, city, nlTariffFlow)

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

    if (!geocodedLocationMatchesServiceCity(geo, cityGeoFields, countryCode)) {
      const nearbyServiceCities = await loadNearbyServiceCities(
        city.countryId,
        countryCode,
        geo.lat,
        geo.lng,
        kitchenOriginPoint
      )
      return res.json({
        status: 'not_in_service_city' as const,
        lat: geo.lat,
        lng: geo.lng,
        placeLabel: geo.displayName,
        pricePerKm: nlTariffFlow ? roundMoney(stepEur / Math.max(0.001, stepKm)) : pricePerKm,
        defaultDeliveryFee: nlTariffFlow ? 0 : defaultDeliveryFee,
        freeDeliveryThreshold,
        deliveryTariffStepKm: nlTariffFlow ? stepKm : undefined,
        deliveryTariffStepEur: nlTariffFlow ? stepEur : undefined,
        estimatedDeliveryFee: null as number | null,
        distanceKm: null as number | null,
        nearbyServiceCities,
      })
    }

    /** Уся NL: пряма відстань від кухні (SiteSetting / City) + кроковий тариф з адмінки. */
    if (nlTariffFlow) {
      if (!netherlandsDeliveryAllowed(geo.lat, geo.lng, geo.address, geo.displayName)) {
        const nearbyServiceCities = await loadNearbyServiceCities(
          city.countryId,
          countryCode,
          geo.lat,
          geo.lng,
          kitchenOriginPoint
        )
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
          nearbyServiceCities,
        })
      }
      const origin = kitchenOriginPoint
      const route = await drivingRouteMetrics(origin, { lat: geo.lat, lng: geo.lng })
      const distanceKm = route.distanceKm
      const distRounded = roundMoney(distanceKm)
      if (!isNlDrivingDistanceInServiceRange(distanceKm)) {
        const nearbyServiceCities = await loadNearbyServiceCities(
          city.countryId,
          countryCode,
          geo.lat,
          geo.lng,
          origin
        )
        return res.json({
          status: 'not_in_service_city' as const,
          lat: geo.lat,
          lng: geo.lng,
          placeLabel: geo.displayName,
          pricePerKm: roundMoney(stepEur / Math.max(0.001, stepKm)),
          defaultDeliveryFee: 0,
          freeDeliveryThreshold,
          deliveryTariffStepKm: stepKm,
          deliveryTariffStepEur: stepEur,
          estimatedDeliveryFee: null as number | null,
          distanceKm: distRounded,
          routeDurationMinutes: route.durationMinutes,
          nearbyServiceCities,
        })
      }
      const fee = deliveryFeeSteppedEur(distanceKm, stepKm, stepEur)
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
        routeDurationMinutes: route.durationMinutes,
        minimumOrderEur: minimumOrderEurFromDistanceKm(distanceKm),
        // Подписанный токен для верификации fee при создании заказа
        deliveryQuoteToken: signDeliveryQuote({ fee, cityId, isNlTariff: true }),
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
          // Подписанный токен для верификации fee при создании заказа
          deliveryQuoteToken: signDeliveryQuote({
            fee: est.estimatedDeliveryFee,
            cityId,
            zoneId: zone.id,
            isNlTariff: false,
          }),
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
      nearbyServiceCities: await loadNearbyServiceCities(
        city.countryId,
        countryCode,
        geo.lat,
        geo.lng,
        kitchenOriginPoint
      ),
    })
  } catch (e) {
    console.error('delivery /check', e)
    res.status(500).json({ status: 'server_error' as const })
  }
})

export default router
