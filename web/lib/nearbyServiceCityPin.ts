export type NearbyServiceCityPin = {
  id: number
  name: string
  name_en?: string | null
  name_nl?: string | null
  name_ua?: string | null
  lat: number
  lng: number
  distanceKm: number
  countryFlag?: string | null
  hasZones: boolean
}

export function localizedServiceCityName(
  city: Pick<NearbyServiceCityPin, 'name' | 'name_en' | 'name_nl' | 'name_ua'>,
  language: string
): string {
  const lang = language.slice(0, 2).toLowerCase()
  if (lang === 'uk' && city.name_ua?.trim()) return city.name_ua.trim()
  if (lang === 'nl' && city.name_nl?.trim()) return city.name_nl.trim()
  if (lang === 'en' && city.name_en?.trim()) return city.name_en.trim()
  if (lang === 'ru' && city.name?.trim()) return city.name.trim()
  return city.name_en?.trim() || city.name_nl?.trim() || city.name_ua?.trim() || city.name
}
