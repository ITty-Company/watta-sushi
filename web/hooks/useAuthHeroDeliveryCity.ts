'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Language } from '@/app/context/LanguageContext'
import {
  AUTH_HERO_DEFAULT_CITY_LABEL,
  detectAuthHeroCityFromGeolocation,
  localizedAuthHeroCityName,
  resolveAuthHeroDisplayCity,
  type AuthHeroCity,
} from '@/lib/authHeroDeliveryCity'
import { fetchPublicApi } from '@/lib/publicApiFetch'

async function fetchActiveCities(): Promise<AuthHeroCity[]> {
  try {
    const res = await fetchPublicApi('/api/cities')
    if (!res.ok) return []
    const data = (await res.json()) as AuthHeroCity[]
    return Array.isArray(data) ? data.filter((c) => c.isActive !== false) : []
  } catch {
    return []
  }
}

export function useAuthHeroDeliveryCity(language: Language, enabled: boolean): string {
  const [cityName, setCityName] = useState(() => AUTH_HERO_DEFAULT_CITY_LABEL[language])

  const refresh = useCallback(async () => {
    const cities = await fetchActiveCities()
    const geoCity = await detectAuthHeroCityFromGeolocation(cities)
    const city = resolveAuthHeroDisplayCity(cities, geoCity)
    if (city) {
      setCityName(localizedAuthHeroCityName(city, language))
    } else {
      setCityName(AUTH_HERO_DEFAULT_CITY_LABEL[language])
    }
  }, [language])

  useEffect(() => {
    if (!enabled) return
    void refresh()
    const onCityChanged = () => {
      void refresh()
    }
    window.addEventListener('cityChanged', onCityChanged)
    return () => window.removeEventListener('cityChanged', onCityChanged)
  }, [enabled, refresh])

  return cityName
}
