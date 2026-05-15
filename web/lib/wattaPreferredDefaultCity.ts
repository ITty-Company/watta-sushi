const AMSTERDAM = 'amsterdam'

function normName(s: string | undefined): string {
  return (s ?? '').trim().toLowerCase()
}

export function nameFieldsMatchAmsterdam(c: {
  name?: string
  name_en?: string
  name_nl?: string
  name_ua?: string
}): boolean {
  return (
    normName(c.name) === AMSTERDAM ||
    normName(c.name_en) === AMSTERDAM ||
    normName(c.name_nl) === AMSTERDAM ||
    normName(c.name_ua) === AMSTERDAM
  )
}

/** Плоский список міст (як у `/api/cities`): за замовчуванням — Амстердам, інакше перший у списку. */
export function cityIdPreferAmsterdam<
  T extends { id: number; name?: string; name_en?: string; name_nl?: string; name_ua?: string },
>(list: readonly T[]): number | null {
  if (!list.length) return null
  const hit = list.find((c) => nameFieldsMatchAmsterdam(c))
  return hit?.id ?? list[0].id
}

/** Каталог країн/міст: перша активна Амстердам, інакше — як раніше (перша активна країна + місто). */
export function findPreferredDefaultCityInCountries<
  TCountry extends { cities?: readonly TCity[] },
  TCity extends {
    id: number
    countryId: number
    name?: string
    name_en?: string
    name_nl?: string
    name_ua?: string
    isActive?: boolean
  },
>(countries: readonly TCountry[]): { country: TCountry; city: TCity } | null {
  for (const country of countries) {
    for (const city of country.cities || []) {
      if (city.isActive === false) continue
      if (nameFieldsMatchAmsterdam(city)) {
        return { country, city }
      }
    }
  }
  return null
}

/**
 * Вибір міста з плоского списку (GET /api/cities): збережений id, інакше Амстердам, інакше перший.
 * Якщо в каталозі є Амстердам (NL), а збережене місто з іншої країни — підставляємо Амстердам (міграція з UA тощо).
 */
export function resolveCityFromSavedId<
  T extends {
    id: string | number
    name?: string
    name_en?: string
    name_nl?: string
    name_ua?: string
    country?: { code?: string } | null
  },
>(list: readonly T[], savedId: string | number | null | undefined): T | null {
  if (!list.length) return null
  const ams = list.find((c) => nameFieldsMatchAmsterdam(c)) ?? null

  if (savedId == null || (typeof savedId === 'string' && savedId.trim() === '')) {
    return ams ?? list[0] ?? null
  }

  const sid = String(savedId)
  const matched = list.find((c) => String(c.id) === sid) ?? null
  if (matched) {
    const mCc = String(matched.country?.code || '').toUpperCase()
    const aCc = String(ams?.country?.code || '').toUpperCase()
    if (ams && aCc === 'NL' && mCc && mCc !== 'NL') return ams
    return matched
  }

  return ams ?? list[0] ?? null
}

/** Каталог країн/міст: чи замінити збережене не-NL місто на Амстердам (NL), якщо він є в каталозі. */
export function nlAmsterdamOverridesNonNlSaved<
  TCity extends { name?: string; name_en?: string; name_nl?: string; name_ua?: string },
  TCountry extends { code?: string },
>(savedCountry: TCountry, savedCity: TCity, ams: { country: TCountry; city: TCity } | null): boolean {
  if (!ams || !nameFieldsMatchAmsterdam(ams.city)) return false
  const s = String(savedCountry.code || '').toUpperCase()
  const a = String(ams.country?.code || '').toUpperCase()
  return a === 'NL' && s !== 'NL'
}
