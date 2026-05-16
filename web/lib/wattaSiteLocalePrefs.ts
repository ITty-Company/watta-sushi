/**
 * Мова: `watta_lang` + `watta_lang_explicit` (див. `lib/i18n/language.ts`).
 * Місто: `selectedCityId` + `watta_city_explicit` — без explicit завжди Амстердам (NL).
 */

export const WATTA_CITY_EXPLICIT_KEY = 'watta_city_explicit'
export const WATTA_SELECTED_CITY_KEY = 'selectedCityId'

export function isCityChoiceExplicit(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(WATTA_CITY_EXPLICIT_KEY) === '1'
  } catch {
    return false
  }
}

/** Id міста лише якщо користувач сам обрав у селекторі; інакше `null` → дефолт Амстердам. */
export function getExplicitSavedCityId(): number | null {
  if (!isCityChoiceExplicit()) return null
  try {
    const raw = window.localStorage.getItem(WATTA_SELECTED_CITY_KEY)
    const n = raw ? parseInt(raw, 10) : NaN
    return Number.isFinite(n) && n > 0 ? n : null
  } catch {
    return null
  }
}

/** Записати місто для API (меню, кошик) без «явного» вибору користувача. */
export function applyDefaultCityToStorage(cityId: number): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(WATTA_SELECTED_CITY_KEY, String(cityId))
  } catch {
    /* ignore */
  }
}

/** Користувач обрав місто в CountryCitySelector — запам’ятати до наступної зміни. */
export function persistUserCityChoice(cityId: number): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(WATTA_CITY_EXPLICIT_KEY, '1')
    window.localStorage.setItem(WATTA_SELECTED_CITY_KEY, String(cityId))
  } catch {
    /* ignore */
  }
}

/** Для запитів товарів: explicit id або поточний selectedCityId (після дефолту — Амстердам). */
export function readCityIdForProductApi(): number | null {
  if (typeof window === 'undefined') return null
  const explicit = getExplicitSavedCityId()
  if (explicit != null) return explicit
  try {
    const raw = window.localStorage.getItem(WATTA_SELECTED_CITY_KEY)
    const n = raw ? parseInt(raw, 10) : NaN
    return Number.isFinite(n) && n > 0 ? n : null
  } catch {
    return null
  }
}
