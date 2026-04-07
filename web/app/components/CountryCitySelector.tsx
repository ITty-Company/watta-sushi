'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, MapPin, X } from 'lucide-react'
import Image from 'next/image'
import { useLanguage } from '../context/LanguageContext'
import { cn } from '@/lib/utils'

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
    const ac = new AbortController()
    const timeoutMs = 45000
    const timeoutId = window.setTimeout(() => ac.abort(), timeoutMs)

    ;(async () => {
      setLoadError(false)
      setLoading(true)
      try {
        const res = await fetch('/api/countries', { signal: ac.signal })
        window.clearTimeout(timeoutId)
        if (dead) return
        if (res.ok) {
          const data = await res.json()
          if (dead) return
          const list = (Array.isArray(data) ? data : []).map((row: Record<string, unknown>) =>
            normalizeCountry(row)
          )
          applyResolvedList(list)
        } else {
          console.error('Ошибка загрузки стран:', res.status, res.statusText)
          setCountries([])
          setLoadError(true)
        }
      } catch (error) {
        window.clearTimeout(timeoutId)
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
      window.clearTimeout(timeoutId)
      ac.abort()
    }
  }, [applyResolvedList])

  const refreshCatalog = useCallback(() => {
    ;(async () => {
      setCatalogRefreshing(true)
      try {
        const res = await fetch('/api/countries')
        if (res.ok) {
          const data = await res.json()
          const list = (Array.isArray(data) ? data : []).map((row: Record<string, unknown>) =>
            normalizeCountry(row)
          )
          applyResolvedList(list)
          setLoadError(false)
        }
      } catch (e) {
        console.error('Catalog refresh failed', e)
      } finally {
        setCatalogRefreshing(false)
      }
    })()
  }, [applyResolvedList])

  useEffect(() => {
    const onCatalog = () => refreshCatalog()
    window.addEventListener(COUNTRIES_CATALOG_EVENT, onCatalog)
    return () => window.removeEventListener(COUNTRIES_CATALOG_EVENT, onCatalog)
  }, [refreshCatalog])

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible') refreshCatalog()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [refreshCatalog])

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

  if (loading) {
    return (
      <div
        className={cn(
          'location-picker-trigger location-picker-trigger--loading',
          'flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-bold text-[#145142]'
        )}
        style={{
          background: 'linear-gradient(135deg, rgba(20,81,66,0.15) 0%, rgba(20,81,66,0.1) 100%)',
          boxShadow: '0 2px 6px rgba(20,81,66,0.2), inset 0 1px 0 rgba(255,255,255,0.4)',
          backdropFilter: 'blur(8px)',
          minWidth: '120px',
        }}
        aria-busy="true"
      >
        <div
          className="h-3 w-3 shrink-0 rounded-full border-2 border-[#145142]/30 border-t-[#145142]"
          style={{ animation: 'countryCityModalSpin 0.8s linear infinite' }}
        />
        {lp.loading}
      </div>
    )
  }

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
      >
        <MapPin size={17} className="shrink-0 text-[#145142]" strokeWidth={2.25} />
        <span className="location-picker-trigger__label">{displayText}</span>
        <ChevronDown size={15} className="location-picker-trigger__chev" strokeWidth={2.5} />
      </button>

      {isOpen &&
        mounted &&
        createPortal(
          <div
            className="location-picker-backdrop fixed inset-0 z-[999999] flex items-center justify-center overflow-auto bg-black/55 p-5 backdrop-blur-[6px]"
            style={{ isolation: 'isolate' }}
            onClick={handleClose}
            role="presentation"
          >
            <div
              ref={modalRef}
              className="location-picker-modal relative mx-auto my-auto flex w-full max-w-[680px] flex-col overflow-hidden rounded-[28px] border-2 border-[#145142]/10 bg-gradient-to-br from-white/[0.99] via-[#fafcfb] to-[#f4f9f7] shadow-[0_30px_80px_rgba(0,0,0,0.28),0_15px_40px_rgba(20,81,66,0.22),inset_0_1px_0_rgba(255,255,255,0.95)] backdrop-blur-[40px]"
              style={{ maxHeight: '90vh' }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="location-picker-title"
            >
              <div className="relative flex items-center justify-between border-b-2 border-[#145142]/[0.08] bg-gradient-to-br from-[#145142]/[0.08] to-[#145142]/[0.02] px-6 py-6 sm:px-8 sm:py-7">
                <div
                  className="pointer-events-none absolute inset-0 opacity-60"
                  style={{
                    background:
                      'linear-gradient(90deg, transparent 0%, rgba(20,81,66,0.05) 50%, transparent 100%)',
                    animation: 'shimmer 3s infinite',
                  }}
                />
                <div className="relative z-[1] flex items-center gap-3.5 sm:gap-3.5">
                  <div className="relative flex h-[52px] w-[52px] shrink-0 items-center justify-center overflow-hidden rounded-[14px] border-2 border-[#145142] bg-gradient-to-br from-white to-[#fafafa] shadow-[0_4px_12px_rgba(20,81,66,0.15),inset_0_1px_0_white,0_0_0_2px_rgba(20,81,66,0.08)]">
                    <Image src="/logo.png" alt="" width={36} height={36} className="object-contain" />
                  </div>
                  <div>
                    <h2
                      id="location-picker-title"
                      className="m-0 bg-gradient-to-br from-[#145142] to-[#1a6b58] bg-clip-text text-xl font-black tracking-tight text-transparent sm:text-2xl"
                    >
                      {lp.title}
                    </h2>
                    <p className="m-0 mt-1.5 text-[13px] font-semibold text-[#666]">
                      {lp.subtitle}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="location-picker-close relative z-[1] h-11 w-11 shrink-0"
                  onClick={handleClose}
                  aria-label={lp.ariaClose}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="min-h-[200px] flex-1 overflow-y-auto bg-gradient-to-b from-white to-[#fafcfb] px-6 py-6 sm:px-7 sm:py-7">
                {catalogRefreshing && (
                  <div className="mb-4 flex items-center justify-center gap-2 rounded-xl border border-dashed border-[#145142]/25 bg-[#145142]/[0.04] px-3 py-2 text-xs font-semibold text-[#145142]">
                    <span
                      className="inline-block h-3.5 w-3.5 rounded-full border-2 border-[#145142]/25 border-t-[#145142]"
                      style={{ animation: 'countryCityModalSpin 0.75s linear infinite' }}
                    />
                    {lp.loading}
                  </div>
                )}

                <div className="mb-8 sm:mb-9">
                  <div className="mb-4 flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#145142]/10 to-[#145142]/5">
                      <MapPin size={16} className="text-[#145142]" />
                    </div>
                    <div className="text-lg font-extrabold tracking-tight text-[#145142]">
                      {lp.country}
                    </div>
                  </div>
                  {!filteredCountries || filteredCountries.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-[#145142]/20 bg-[#145142]/[0.03] px-5 py-10 text-center text-[#666]">
                      <div className="text-5xl">🌍</div>
                      <div className="text-lg font-bold text-[#145142]">{lp.noCountries}</div>
                      <div className="max-w-md text-sm leading-relaxed opacity-90">
                        {loadError ? lp.noCountriesDevHint : lp.noCountriesAdminHint}
                      </div>
                    </div>
                  ) : (
                    <div
                      className="grid gap-2.5"
                      style={{
                        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                      }}
                    >
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
                </div>

                {selectedCountry && (
                  <div className="mb-2">
                    <div className="mb-4 flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#145142]/10 to-[#145142]/5">
                        <MapPin size={16} className="text-[#145142]" />
                      </div>
                      <div className="text-lg font-extrabold tracking-tight text-[#145142]">
                        {lp.city}
                      </div>
                    </div>
                    {filteredCities.length === 0 ? (
                      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-[#145142]/20 bg-[#145142]/[0.03] px-5 py-10 text-center text-[#666]">
                        {!selectedCountry.cities || selectedCountry.cities.length === 0 ? (
                          <>
                            <div className="text-5xl">🏙️</div>
                            <div className="text-lg font-bold text-[#145142]">
                              {lp.noCitiesInCountry}
                            </div>
                            <div className="max-w-md text-sm opacity-80">{lp.addCitiesAdmin}</div>
                          </>
                        ) : (
                          <>
                            <div className="text-3xl">⚠️</div>
                            <div className="text-base font-semibold">{lp.noActiveCities}</div>
                            <div className="text-sm opacity-70">{lp.activateInAdmin}</div>
                          </>
                        )}
                      </div>
                    ) : (
                      <div
                        className="grid gap-2.5"
                        style={{
                          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                        }}
                      >
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
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}
