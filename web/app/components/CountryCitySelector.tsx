'use client'

import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, MapPin, X } from 'lucide-react'
import type { WattaLanguage } from '@/lib/i18n/language'
import { useLanguage } from '../context/LanguageContext'
import { cn } from '@/lib/utils'
import {
  ensureCountriesCatalog,
  getCountriesCatalog,
  getCountriesCatalogIfCached,
  invalidateCountriesCatalogCache,
} from '@/lib/fetchCountriesCatalog'
import { findPreferredDefaultCityInCountries } from '@/lib/wattaPreferredDefaultCity'
import {
  applyDefaultCityToStorage,
  getExplicitSavedCityId,
  isCityChoiceExplicit,
  persistUserCityChoice,
} from '@/lib/wattaSiteLocalePrefs'
import { preloadLocationPickerMascot } from '@/lib/locationPickerMascot'

const COUNTRIES_CATALOG_EVENT = 'countriesCatalogUpdated'

const LANGUAGE_OPTIONS = [
  { code: 'uk' as const, name: 'Українська' },
  { code: 'ru' as const, name: 'Русский' },
  { code: 'en' as const, name: 'English' },
  { code: 'nl' as const, name: 'Nederlands' },
] as const

interface Country {
  id: number
  name: string
  name_ua?: string
  name_en?: string
  name_nl?: string
  flag?: string
  code: string
  isActive: boolean
  cities?: City[]
}

interface City {
  id: number
  name: string
  name_ua?: string
  name_nl?: string
  name_en?: string
  countryId: number
  latitude?: number
  longitude?: number
  zoom?: number
  isActive: boolean
}

function normalizeCity(raw: Record<string, unknown>): City {
  return {
    id: Number(raw.id),
    name: String(raw.name ?? ''),
    name_ua: typeof raw.name_ua === 'string' ? raw.name_ua : undefined,
    name_en: typeof raw.name_en === 'string' ? raw.name_en : undefined,
    name_nl: typeof raw.name_nl === 'string' ? raw.name_nl : undefined,
    countryId: Number(raw.countryId),
    latitude: raw.latitude != null ? Number(raw.latitude) : undefined,
    longitude: raw.longitude != null ? Number(raw.longitude) : undefined,
    zoom: raw.zoom != null ? Number(raw.zoom) : undefined,
    isActive: raw.isActive !== false,
  }
}

function normalizeCountry(raw: Record<string, unknown>): Country {
  const citiesRaw = Array.isArray(raw.cities) ? raw.cities : []
  return {
    id: Number(raw.id),
    name: String(raw.name ?? ''),
    name_ua: typeof raw.name_ua === 'string' ? raw.name_ua : undefined,
    name_en: typeof raw.name_en === 'string' ? raw.name_en : undefined,
    name_nl: typeof raw.name_nl === 'string' ? raw.name_nl : undefined,
    flag: typeof raw.flag === 'string' ? raw.flag : undefined,
    code: String(raw.code ?? ''),
    isActive: raw.isActive !== false,
    cities: citiesRaw.map((c) => normalizeCity(c as Record<string, unknown>)),
  }
}

interface CountryCitySelectorProps {
  onCityChange?: (cityId: number) => void
  /** Компактна кнопка в боковому меню (без подвійної рамки) */
  appearance?: 'default' | 'drawer'
}

export const CountryCitySelector: React.FC<CountryCitySelectorProps> = ({
  onCityChange,
  appearance = 'default',
}) => {
  const { t, getLocalized, language, setLanguage } = useLanguage()
  const lp = t.locationPicker
  const labelCountry = useCallback(
    (c: Country) => getLocalized(c, 'name') || c.name,
    [getLocalized]
  )
  const labelCity = useCallback(
    (c: City) => getLocalized(c, 'name') || c.name,
    [getLocalized]
  )

  const [isOpen, setIsOpen] = useState(false)
  /** Початковий стан однаковий на SSR і клієнті — кеш підвантажується в useLayoutEffect. */
  const [countries, setCountries] = useState<Country[]>([])
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null)
  const [selectedCity, setSelectedCity] = useState<City | null>(null)
  const [loading, setLoading] = useState(true)
  const [catalogRefreshing, setCatalogRefreshing] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [chipPopKey, setChipPopKey] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const chipPopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onCityChangeRef = useRef(onCityChange)
  onCityChangeRef.current = onCityChange
  const selectedCityRef = useRef<City | null>(null)
  selectedCityRef.current = selectedCity

  useLayoutEffect(() => {
    setMounted(true)
    preloadLocationPickerMascot()
  }, [])

  useEffect(() => {
    return () => {
      if (chipPopTimerRef.current) clearTimeout(chipPopTimerRef.current)
    }
  }, [])

  const flashChip = useCallback((key: string) => {
    setChipPopKey(key)
    if (chipPopTimerRef.current) clearTimeout(chipPopTimerRef.current)
    chipPopTimerRef.current = setTimeout(() => setChipPopKey(null), 320)
  }, [])

  const warmupCatalog = useCallback(() => {
    preloadLocationPickerMascot()
    void ensureCountriesCatalog()
  }, [])

  const applyResolvedList = useCallback((list: Country[]) => {
    const notifyCity = (cityId: number) => {
      onCityChangeRef.current?.(cityId)
    }
    const activeList = list.filter((c) => c.isActive)
    setCountries(activeList)
    if (activeList.length === 0) {
      setLoadError(true)
      setSelectedCountry(null)
      setSelectedCity(null)
      return
    }

    const wantId = isCityChoiceExplicit()
      ? selectedCityRef.current?.id ?? getExplicitSavedCityId()
      : null

    if (wantId != null) {
      for (const country of activeList) {
        const city = country.cities?.find((c) => c.id === wantId && c.isActive)
        if (city) {
          setSelectedCountry(country)
          setSelectedCity(city)
          persistUserCityChoice(city.id)
          notifyCity(city.id)
          return
        }
      }
    }

    const ams = findPreferredDefaultCityInCountries(activeList)
    if (ams) {
      setSelectedCountry(ams.country)
      setSelectedCity(ams.city as City)
      applyDefaultCityToStorage(ams.city.id)
      notifyCity(ams.city.id)
      return
    }

    const firstCountry =
      activeList.find((c) => (c.cities || []).some((city) => city.isActive)) ?? activeList[0]
    setSelectedCountry(firstCountry)
    const firstCity = firstCountry.cities?.find((c) => c.isActive)
    if (firstCity) {
      setSelectedCity(firstCity)
      applyDefaultCityToStorage(firstCity.id)
      notifyCity(firstCity.id)
    } else {
      setSelectedCity(null)
    }
  }, [])

  useLayoutEffect(() => {
    let dead = false

    const hydrateFromRows = (rows: Record<string, unknown>[]) => {
      const list = rows.map((row) => normalizeCountry(row))
      applyResolvedList(list)
    }

    const cached = getCountriesCatalogIfCached()
    if (cached && cached.length > 0) {
      hydrateFromRows(cached)
      setLoadError(false)
      setLoading(false)
    }

    ;(async () => {
      if (!cached || cached.length === 0) {
        setLoading(true)
      }
      setLoadError(false)
      try {
        const rows = await getCountriesCatalog()
        if (dead) return
        hydrateFromRows(rows)
        if (!Array.isArray(rows) || rows.length === 0) {
          setCountries([])
          setLoadError(true)
        } else {
          setLoadError(false)
        }
      } catch (error) {
        if (dead) return
        console.error('Ошибка загрузки стран и городов:', error)
        setCountries([])
        setLoadError(true)
      } finally {
        if (!dead) setLoading(false)
      }
    })()

    return () => {
      dead = true
    }
  }, [applyResolvedList])

  const refreshCatalogAfterAdmin = useCallback(() => {
    ;(async () => {
      setCatalogRefreshing(true)
      try {
        invalidateCountriesCatalogCache()
        const rows = await getCountriesCatalog()
        const list = rows.map((row) => normalizeCountry(row))
        applyResolvedList(list)
        setLoadError(list.length === 0)
      } catch (e) {
        console.error('Catalog refresh failed', e)
      } finally {
        setCatalogRefreshing(false)
      }
    })()
  }, [applyResolvedList])

  useEffect(() => {
    const onCatalog = () => refreshCatalogAfterAdmin()
    window.addEventListener(COUNTRIES_CATALOG_EVENT, onCatalog)
    return () => window.removeEventListener(COUNTRIES_CATALOG_EVENT, onCatalog)
  }, [refreshCatalogAfterAdmin])

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState !== 'visible') return
      void getCountriesCatalog()
        .then((rows) => {
          const list = rows.map((row) => normalizeCountry(row))
          applyResolvedList(list)
        })
        .catch(() => {})
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [applyResolvedList])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      const clickedOutsideButton = dropdownRef.current && !dropdownRef.current.contains(target)
      const clickedOutsideModal = modalRef.current && !modalRef.current.contains(target)

      if (isOpen && clickedOutsideButton && clickedOutsideModal) {
        setIsOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
      const html = document.documentElement
      const prevHtml = html.style.overflow
      const prevBody = document.body.style.overflow
      html.style.overflow = 'hidden'
      document.body.style.overflow = 'hidden'
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
        document.removeEventListener('keydown', handleEscape)
        html.style.overflow = prevHtml
        document.body.style.overflow = prevBody
      }
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const handleCountrySelect = (country: Country) => {
    flashChip(`country-${country.id}`)
    setSelectedCountry(country)
    if (selectedCity && selectedCity.countryId !== country.id) {
      setSelectedCity(null)
    }
  }

  const filteredCountries = countries.filter((country) => country.isActive)
  const filteredCities = selectedCountry?.cities?.filter((city) => city.isActive) || []

  const handleCitySelect = (city: City) => {
    flashChip(`city-${city.id}`)
    setSelectedCity(city)
    setIsOpen(false)

    persistUserCityChoice(city.id)

    onCityChange?.(city.id)

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cityChanged', { detail: { cityId: city.id } }))
    }
  }

  const handleClose = () => {
    setIsOpen(false)
  }

  const pickLanguage = (code: WattaLanguage) => {
    flashChip(`lang-${code}`)
    setLanguage(code)
  }

  /** Каталог ще не підвантажився — у модалці скелетон, не порожній екран */
  const catalogPending = loading && countries.length === 0

  const cityL = selectedCity ? labelCity(selectedCity) : ''
  const countryL = selectedCountry ? labelCountry(selectedCountry) : ''
  const displayText = selectedCity
    ? `${selectedCountry?.flag || '🌍'} ${cityL}`.trim()
    : countryL
      ? `${selectedCountry?.flag || '🌍'} ${countryL}`
      : lp.chooseLocation

  return (
    <div
      ref={dropdownRef}
      className={cn('relative z-[1]', appearance === 'drawer' && 'block w-full min-w-0')}
    >
      <button
        type="button"
        data-open={isOpen ? 'true' : 'false'}
        className={cn(
          'location-picker-trigger',
          appearance === 'drawer' && 'location-picker-trigger--drawer',
          catalogPending && 'location-picker-trigger--loading',
          catalogRefreshing && 'location-picker-trigger--pulse'
        )}
        onMouseEnter={warmupCatalog}
        onFocus={warmupCatalog}
        onTouchStart={warmupCatalog}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          warmupCatalog()
          setIsOpen(true)
        }}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={lp.ariaOpen}
        aria-busy={catalogPending}
      >
        {catalogPending ? (
          <>
            <span
              className="location-picker-trigger__spin h-3.5 w-3.5 shrink-0 rounded-full border-2 border-[#145142]/30 border-t-[#145142]"
              style={{ animation: 'countryCityModalSpin 0.75s linear infinite' }}
              aria-hidden
            />
            <span className="location-picker-trigger__label min-w-0 truncate">{lp.loading}</span>
          </>
        ) : (
          <>
            <MapPin size={17} className="location-picker-trigger__pin shrink-0 text-[#145142]" strokeWidth={2.25} />
            <span className="location-picker-trigger__label">{displayText}</span>
            <ChevronDown size={15} className="location-picker-trigger__chev" strokeWidth={2.5} />
          </>
        )}
      </button>

      {isOpen &&
        mounted &&
        createPortal(
          <div
            className="location-picker-backdrop location-picker-backdrop--mobile-tight fixed inset-0 z-[999999] flex items-center justify-center overflow-auto p-2.5 sm:p-5"
            style={{ isolation: 'isolate' }}
            onClick={handleClose}
            role="presentation"
          >
            <div
              ref={modalRef}
              className="location-picker-modal location-picker-modal--compact relative mx-auto my-auto flex w-full max-h-[min(90vh,640px)] max-w-[min(calc(100vw-1.5rem),26rem)] flex-col overflow-hidden rounded-[20px] max-sm:max-h-[min(82dvh,32rem)]"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label={lp.title}
            >
              <button
                type="button"
                className="location-picker-close"
                onClick={handleClose}
                aria-label={lp.ariaClose}
              >
                <X size={20} strokeWidth={2} />
              </button>

              <div className="location-picker-modal__body min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-5 pb-5 sm:px-6 sm:pb-6">
                {catalogRefreshing && (
                  <div className="location-picker-modal__refresh mb-4 flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold">
                    <span
                      className="inline-block h-3.5 w-3.5 rounded-full border-2 border-[#145142]/25 border-t-[#145142]"
                      style={{ animation: 'countryCityModalSpin 0.75s linear infinite' }}
                    />
                    {lp.loading}
                  </div>
                )}

                <section className="location-picker-field location-picker-field--stagger-0">
                  <p className="location-picker-field__label">{lp.country}</p>
                  {catalogPending ? (
                    <div className="location-picker-options" aria-busy>
                      {[0, 1].map((i) => (
                        <div
                          key={i}
                          className="location-picker-chip location-picker-chip--skeleton h-10 w-28 animate-pulse rounded-[10px]"
                          aria-hidden
                        />
                      ))}
                    </div>
                  ) : !filteredCountries || filteredCountries.length === 0 ? (
                    <div className="location-picker-empty">
                      <div className="location-picker-empty__title">{lp.noCountries}</div>
                      <div className="location-picker-empty__text">
                        {loadError ? lp.noCountriesDevHint : lp.noCountriesAdminHint}
                      </div>
                    </div>
                  ) : (
                    <div className="location-picker-options">
                      {filteredCountries.map((country) => {
                        const isSelected = selectedCountry?.id === country.id
                        return (
                          <button
                            key={country.id}
                            type="button"
                            className={cn(
                              'location-picker-chip location-picker-chip--country',
                              isSelected && 'location-picker-chip--selected',
                              chipPopKey === `country-${country.id}` && 'location-picker-chip--just-selected'
                            )}
                            onClick={() => handleCountrySelect(country)}
                          >
                            <span className="location-picker-chip__flag" aria-hidden>
                              {country.flag || '🌍'}
                            </span>
                            <span className="truncate">{labelCountry(country)}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </section>

                {(selectedCountry || catalogPending) && (
                  <section
                    key={selectedCountry?.id ?? 'catalog-pending'}
                    className="location-picker-field location-picker-field--stagger-1"
                  >
                    <p className="location-picker-field__label">{lp.city}</p>
                    {catalogPending ? (
                      <div className="location-picker-options" aria-busy>
                        <div
                          className="location-picker-chip location-picker-chip--skeleton h-10 w-24 animate-pulse rounded-[10px]"
                          aria-hidden
                        />
                      </div>
                    ) : filteredCities.length === 0 ? (
                      <div className="location-picker-empty">
                        {!selectedCountry?.cities || selectedCountry.cities.length === 0 ? (
                          <>
                            <div className="location-picker-empty__title">{lp.noCitiesInCountry}</div>
                            <div className="location-picker-empty__text">{lp.addCitiesAdmin}</div>
                          </>
                        ) : (
                          <>
                            <div className="location-picker-empty__title">{lp.noActiveCities}</div>
                            <div className="location-picker-empty__text">{lp.activateInAdmin}</div>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="location-picker-options">
                        {filteredCities.map((city) => {
                          const isSelected = selectedCity?.id === city.id
                          return (
                            <button
                              key={city.id}
                              type="button"
                              className={cn(
                                'location-picker-chip',
                                isSelected && 'location-picker-chip--selected',
                                chipPopKey === `city-${city.id}` && 'location-picker-chip--just-selected'
                              )}
                              onClick={() => handleCitySelect(city)}
                            >
                              <span className="truncate">{labelCity(city)}</span>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </section>
                )}

                <section className="location-picker-field location-picker-field--stagger-2 location-picker-field--language">
                  <p className="location-picker-field__label">{lp.language}</p>
                  <div className="location-picker-options">
                    {LANGUAGE_OPTIONS.map((lang) => {
                      const isSelected = language === lang.code
                      return (
                        <button
                          key={lang.code}
                          type="button"
                          className={cn(
                            'location-picker-chip',
                            isSelected && 'location-picker-chip--selected',
                            chipPopKey === `lang-${lang.code}` && 'location-picker-chip--just-selected'
                          )}
                          onClick={() => pickLanguage(lang.code)}
                        >
                          <span className="truncate">{lang.name}</span>
                        </button>
                      )
                    })}
                  </div>
                </section>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}
