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

function countryCodeNorm(c: { code?: string }): string {
  return String(c.code ?? '')
    .trim()
    .toUpperCase()
}

/** Каталог країн/міст: NL + Амстердам, інакше будь-який Амстердам, інакше перше місто NL. */
export function findPreferredDefaultCityInCountries<
  TCountry extends { cities?: readonly TCity[]; code?: string },
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
  const pickAmsterdamIn = (country: TCountry): { country: TCountry; city: TCity } | null => {
    for (const city of country.cities || []) {
      if (city.isActive === false) continue
      if (nameFieldsMatchAmsterdam(city)) return { country, city }
    }
    return null
  }

  for (const country of countries) {
    if (countryCodeNorm(country) !== 'NL') continue
    const hit = pickAmsterdamIn(country)
    if (hit) return hit
  }

  for (const country of countries) {
    const hit = pickAmsterdamIn(country)
    if (hit) return hit
  }

  for (const country of countries) {
    if (countryCodeNorm(country) !== 'NL') continue
    const first = country.cities?.find((c) => c.isActive !== false)
    if (first) return { country, city: first }
  }

  return null
}

/**
 * Вибір міста з плоского списку (GET /api/cities).
 * `savedId` — лише після явного вибору (`getExplicitSavedCityId`); інакше Амстердам (NL).
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
  const ams =
    list.find(
      (c) => nameFieldsMatchAmsterdam(c) && String(c.country?.code || '').toUpperCase() === 'NL',
    ) ??
    list.find((c) => nameFieldsMatchAmsterdam(c)) ??
    null

  if (savedId == null || (typeof savedId === 'string' && savedId.trim() === '')) {
    return ams ?? list[0] ?? null
  }

  const sid = String(savedId)
  const matched = list.find((c) => String(c.id) === sid) ?? null
  if (matched) return matched

  return ams ?? list[0] ?? null
}
