'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, MapPin, X } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { LocationPickerMascot } from './LocationPickerMascot'
import { cn } from '@/lib/utils'
import {
  getCountriesCatalog,
  getCountriesCatalogIfCached,
  invalidateCountriesCatalogCache,
} from '@/lib/fetchCountriesCatalog'
import { findPreferredDefaultCityInCountries, nlAmsterdamOverridesNonNlSaved } from '@/lib/wattaPreferredDefaultCity'

const COUNTRIES_CATALOG_EVENT = 'countriesCatalogUpdated'

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
}

export const CountryCitySelector: React.FC<CountryCitySelectorProps> = ({ onCityChange }) => {
  const { t, getLocalized } = useLanguage()
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
  const [countries, setCountries] = useState<Country[]>([])
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null)
  const [selectedCity, setSelectedCity] = useState<City | null>(null)
  const [loading, setLoading] = useState(true)
  const [catalogRefreshing, setCatalogRefreshing] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [mounted, setMounted] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const onCityChangeRef = useRef(onCityChange)
  onCityChangeRef.current = onCityChange
  const selectedCityRef = useRef<City | null>(null)
  selectedCityRef.current = selectedCity

  useEffect(() => {
    setMounted(true)
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

    const fromStorage = () => {
      try {
        const raw = typeof window !== 'undefined' ? localStorage.getItem('selectedCityId') : null
        const n = raw ? parseInt(raw, 10) : NaN
        return Number.isFinite(n) ? n : null
      } catch {
        return null
      }
    }

    const wantId = selectedCityRef.current?.id ?? fromStorage()

    if (wantId != null) {
      for (const country of activeList) {
        const city = country.cities?.find((c) => c.id === wantId && c.isActive)
        if (city) {
          const ams = findPreferredDefaultCityInCountries(activeList)
          if (ams && nlAmsterdamOverridesNonNlSaved(country, city, ams)) {
            setSelectedCountry(ams.country)
            setSelectedCity(ams.city as City)
            if (typeof window !== 'undefined' && window.localStorage) {
              localStorage.setItem('selectedCityId', String(ams.city.id))
            }
            notifyCity(ams.city.id)
            return
          }
          setSelectedCountry(country)
          setSelectedCity(city)
          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem('selectedCityId', String(city.id))
          }
          notifyCity(city.id)
          return
        }
      }
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem('selectedCityId')
      }
    }

    const ams = findPreferredDefaultCityInCountries(activeList)
    if (ams) {
      setSelectedCountry(ams.country)
      setSelectedCity(ams.city as City)
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('selectedCityId', String(ams.city.id))
      }
      notifyCity(ams.city.id)
      return
    }

    const firstCountry =
      activeList.find((c) => (c.cities || []).some((city) => city.isActive)) ?? activeList[0]
    setSelectedCountry(firstCountry)
    const firstCity = firstCountry.cities?.find((c) => c.isActive)
    if (firstCity) {
      setSelectedCity(firstCity)
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('selectedCityId', String(firstCity.id))
      }
      notifyCity(firstCity.id)
    } else {
      setSelectedCity(null)
    }
  }, [])

  useEffect(() => {
    let dead = false

    const hydrateFromRows = (rows: Record<string, unknown>[]) => {
      const list = rows.map((row) => normalizeCountry(row))
      applyResolvedList(list)
    }

    const cached = typeof window !== 'undefined' ? getCountriesCatalogIfCached() : null
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
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country)
    if (selectedCity && selectedCity.countryId !== country.id) {
      setSelectedCity(null)
    }
  }

  const filteredCountries = countries.filter((country) => country.isActive)
  const filteredCities = selectedCountry?.cities?.filter((city) => city.isActive) || []

  const handleCitySelect = (city: City) => {
    setSelectedCity(city)
    setIsOpen(false)

    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('selectedCityId', city.id.toString())
    }

    onCityChange?.(city.id)

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cityChanged', { detail: { cityId: city.id } }))
    }
  }

  const handleClose = () => {
    setIsOpen(false)
  }

  /** Перший запит ще без рядків — компактний спінер у тригері, але клік відкриває модалку одразу */
  const triggerAwaitingCatalog = loading && countries.length === 0

  const cityL = selectedCity ? labelCity(selectedCity) : ''
  const countryL = selectedCountry ? labelCountry(selectedCountry) : ''
  const displayText = selectedCity
    ? `${selectedCountry?.flag || '🌍'} ${cityL}`.trim()
    : countryL
      ? `${selectedCountry?.flag || '🌍'} ${countryL}`
      : lp.chooseLocation

  return (
    <div ref={dropdownRef} className="relative z-[1]">
      <button
        type="button"
        data-open={isOpen ? 'true' : 'false'}
        className={cn(
          'location-picker-trigger',
          triggerAwaitingCatalog && 'location-picker-trigger--loading',
          catalogRefreshing && 'location-picker-trigger--pulse'
        )}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setIsOpen(true)
        }}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={lp.ariaOpen}
        aria-busy={triggerAwaitingCatalog}
      >
        {triggerAwaitingCatalog ? (
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
              className="location-picker-modal location-picker-modal--glass location-picker-modal--mobile-compact relative mx-auto my-auto flex w-full max-h-[min(90vh,880px)] max-w-[min(calc(100vw-1.25rem),26rem)] flex-col overflow-visible rounded-[18px] max-sm:max-h-[min(76dvh,28rem)] sm:max-w-[min(720px,100%)] sm:rounded-[clamp(20px,4vw,32px)]"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="location-picker-title"
            >
              <div className="location-picker-modal__ambient" aria-hidden />
              <div className="location-picker-modal__header relative flex items-end justify-between gap-2 overflow-visible rounded-t-[18px] px-3 pb-0.5 pt-2.5 sm:gap-4 sm:rounded-t-[clamp(20px,4vw,32px)] sm:px-8 sm:pb-2 sm:pt-5">
                <div className="location-picker-modal__header-shine pointer-events-none absolute inset-0" aria-hidden />
                <div className="relative z-[1] flex min-w-0 flex-1 items-end gap-2 sm:gap-4">
                  <div
                    className="location-picker-modal__mascot relative z-[1] -mt-7 mb-0 flex h-[84px] w-[72px] shrink-0 translate-y-1 items-end justify-center sm:-mt-14 sm:h-[168px] sm:w-[148px] sm:translate-y-2"
                    aria-hidden
                  >
                    <span
                      className="location-picker-modal__logo-glow location-picker-modal__logo-glow--mascot pointer-events-none absolute bottom-0 left-1/2 z-0 h-[85%] w-[130%] -translate-x-1/2 opacity-80"
                      aria-hidden
                    />
                    <LocationPickerMascot className="relative z-[2] h-full w-full max-w-full" />
                  </div>
                  <div className="min-w-0 pb-0.5">
                    <p className="location-picker-modal__kicker m-0 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#145142]/75 sm:text-[11px]">
                      Watta Sushi
                    </p>
                    <h2 id="location-picker-title" className="location-picker-modal__title m-0 mt-0.5 sm:mt-1">
                      {lp.title}
                    </h2>
                    <p className="location-picker-modal__subtitle m-0 mt-1 max-w-[42ch] sm:mt-2">{lp.subtitle}</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="location-picker-close relative z-[1] h-9 w-9 shrink-0 sm:h-11 sm:w-11"
                  onClick={handleClose}
                  aria-label={lp.ariaClose}
                >
                  <X size={18} strokeWidth={2.25} />
                </button>
              </div>

              <div className="location-picker-modal__body min-h-[120px] flex-1 overflow-y-auto overflow-x-hidden rounded-b-[18px] px-3 pb-3 pt-0.5 sm:min-h-[200px] sm:rounded-b-[clamp(20px,4vw,32px)] sm:px-8 sm:pb-7 sm:pt-2">
                {catalogRefreshing && (
                  <div className="location-picker-modal__refresh mb-4 flex items-center justify-center gap-2 rounded-2xl px-3 py-2.5 text-xs font-semibold">
                    <span
                      className="inline-block h-3.5 w-3.5 rounded-full border-2 border-[#145142]/25 border-t-[#145142]"
                      style={{ animation: 'countryCityModalSpin 0.75s linear infinite' }}
                    />
                    {lp.loading}
                  </div>
                )}

                {triggerAwaitingCatalog ? (
                  <div className="flex flex-col items-center justify-center gap-3 px-4 py-14 text-center">
                    <span
                      className="inline-block h-9 w-9 rounded-full border-2 border-[#145142]/22 border-t-[#145142]"
                      style={{ animation: 'countryCityModalSpin 0.7s linear infinite' }}
                      aria-hidden
                    />
                    <p className="m-0 text-sm font-semibold text-[#145142]">{lp.loading}</p>
                  </div>
                ) : null}

                <section className="location-picker-section" hidden={triggerAwaitingCatalog}>
                  <div className="location-picker-section__head">
                    <span className="location-picker-section__icon" aria-hidden>
                      <MapPin size={17} strokeWidth={2.25} />
                    </span>
                    <span className="location-picker-section__label">{lp.country}</span>
                  </div>
                  {!filteredCountries || filteredCountries.length === 0 ? (
                    <div className="location-picker-empty flex flex-col items-center gap-3 px-4 py-10 text-center">
                      <div className="text-5xl">🌍</div>
                      <div className="location-picker-empty__title">{lp.noCountries}</div>
                      <div className="location-picker-empty__text max-w-md">
                        {loadError ? lp.noCountriesDevHint : lp.noCountriesAdminHint}
                      </div>
                    </div>
                  ) : (
                    <div className="location-picker-grid location-picker-grid--countries grid gap-2 sm:gap-3">
                      {filteredCountries.map((country, i) => {
                        const isSelected = selectedCountry?.id === country.id
                        return (
                          <button
                            key={country.id}
                            type="button"
                            className={cn(
                              'location-picker-chip',
                              isSelected && 'location-picker-chip--selected'
                            )}
                            style={{ '--stagger': i } as React.CSSProperties}
                            onClick={() => handleCountrySelect(country)}
                          >
                            <span className="text-base leading-none">{country.flag || '🌍'}</span>
                            <span className="min-w-0 flex-1 truncate">{labelCountry(country)}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </section>

                {selectedCountry && (
                  <section className="location-picker-section location-picker-section--city">
                    <div className="location-picker-section__head">
                      <span className="location-picker-section__icon" aria-hidden>
                        <MapPin size={17} strokeWidth={2.25} />
                      </span>
                      <span className="location-picker-section__label">{lp.city}</span>
                    </div>
                    {filteredCities.length === 0 ? (
                      <div className="location-picker-empty flex flex-col items-center gap-3 px-4 py-10 text-center">
                        {!selectedCountry.cities || selectedCountry.cities.length === 0 ? (
                          <>
                            <div className="text-5xl">🏙️</div>
                            <div className="location-picker-empty__title">{lp.noCitiesInCountry}</div>
                            <div className="location-picker-empty__text max-w-md">{lp.addCitiesAdmin}</div>
                          </>
                        ) : (
                          <>
                            <div className="text-3xl">⚠️</div>
                            <div className="location-picker-empty__title text-base">{lp.noActiveCities}</div>
                            <div className="location-picker-empty__text text-sm">{lp.activateInAdmin}</div>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="location-picker-grid location-picker-grid--cities grid gap-2 sm:gap-3">
                        {filteredCities.map((city, i) => {
                          const isSelected = selectedCity?.id === city.id
                          return (
                            <button
                              key={city.id}
                              type="button"
                              className={cn(
                                'location-picker-chip',
                                isSelected && 'location-picker-chip--selected'
                              )}
                              style={{ '--stagger': i } as React.CSSProperties}
                              onClick={() => handleCitySelect(city)}
                            >
                              <span className="min-w-0 flex-1 truncate">{labelCity(city)}</span>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </section>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}
