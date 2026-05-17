import { getLocalizedField } from '@/lib/i18n/getLocalizedField'
import type { WattaLanguage } from '@/lib/i18n/language'
import { getExplicitSavedCityId, readCityIdForProductApi } from '@/lib/wattaSiteLocalePrefs'
import { cityIdPreferAmsterdam, resolveCityFromSavedId } from '@/lib/wattaPreferredDefaultCity'

export type AuthHeroCity = {
  id: number | string
  name: string
  name_ua?: string | null
  name_en?: string | null
  name_nl?: string | null
  name_ru?: string | null
  latitude?: number | null
  longitude?: number | null
  isActive?: boolean
}

export function localizedAuthHeroCityName(city: AuthHeroCity, language: WattaLanguage): string {
  return getLocalizedField(city as Record<string, unknown>, 'name', language) || city.name || ''
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const r = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return r * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function nearestCityByCoords(
  cities: readonly AuthHeroCity[],
  lat: number,
  lng: number,
): AuthHeroCity | null {
  let best: AuthHeroCity | null = null
  let bestD = Infinity
  for (const c of cities) {
    if (c.isActive === false) continue
    const clat = Number(c.latitude)
    const clng = Number(c.longitude)
    if (!Number.isFinite(clat) || !Number.isFinite(clng)) continue
    const d = haversineKm(lat, lng, clat, clng)
    if (d < bestD) {
      bestD = d
      best = c
    }
  }
  return best
}

function normGeo(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function cityMatchesLocality(city: AuthHeroCity, locality: string): boolean {
  const n = normGeo(locality)
  const fields = [city.name, city.name_ua, city.name_en, city.name_nl, city.name_ru]
  return fields.some((f) => {
    const x = normGeo(f || '')
    return Boolean(x && (x === n || n.includes(x) || x.includes(n)))
  })
}

async function reverseGeocodeLocality(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(String(lng))}&zoom=10&addressdetails=1`,
      {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'WattaSushi/1.0 (auth hero; https://wattasushi.com.ua)',
        },
      },
    )
    if (!res.ok) return null
    const data = (await res.json()) as { address?: Record<string, string> }
    const a = data.address
    if (!a) return null
    return a.city || a.town || a.municipality || a.village || a.county || null
  } catch {
    return null
  }
}

export async function detectAuthHeroCityFromGeolocation(
  cities: readonly AuthHeroCity[],
): Promise<AuthHeroCity | null> {
  if (typeof window === 'undefined' || !navigator.geolocation || cities.length === 0) return null

  const pos = await new Promise<GeolocationPosition | null>((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (p) => resolve(p),
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300_000 },
    )
  })
  if (!pos) return null

  const { latitude: lat, longitude: lng } = pos.coords
  const locality = await reverseGeocodeLocality(lat, lng)
  if (locality) {
    const byName = cities.find((c) => c.isActive !== false && cityMatchesLocality(c, locality))
    if (byName) return byName
  }
  return nearestCityByCoords(cities, lat, lng)
}

/** Пріоритет: явний вибір у шапці → геолокація → збережене місто → Амстердам. */
export function resolveAuthHeroDisplayCity(
  cities: readonly AuthHeroCity[],
  geoCity: AuthHeroCity | null,
): AuthHeroCity | null {
  if (!cities.length) return null

  const explicitId = getExplicitSavedCityId()
  if (explicitId != null) {
    const hit = cities.find((c) => String(c.id) === String(explicitId))
    if (hit) return hit
  }

  if (geoCity) return geoCity

  const savedId = readCityIdForProductApi()
  const fromSaved = resolveCityFromSavedId(cities, savedId)
  if (fromSaved) return fromSaved

  const amsId = cityIdPreferAmsterdam(
    cities.map((c) => ({ ...c, id: Number(c.id) })).filter((c) => Number.isFinite(c.id)),
  )
  if (amsId != null) {
    const ams = cities.find((c) => String(c.id) === String(amsId))
    if (ams) return ams
  }

  return cities[0] ?? null
}

export const AUTH_HERO_DEFAULT_CITY_LABEL: Record<WattaLanguage, string> = {
  uk: 'Амстердам',
  ru: 'Амстердам',
  en: 'Amsterdam',
  nl: 'Amsterdam',
}
