'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect, useCallback, useMemo } from 'react'
import LogoBackground from './LogoBackground'
import { DeliveryExperienceBlocks } from './DeliveryExperienceBlocks'
import toast from 'react-hot-toast'
import { useLanguage } from '../context/LanguageContext'
import {
  MapPin,
  Sparkles,
  Timer,
  Navigation,
  Search,
  Shield,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const DeliveryZonesInteractiveMap = dynamic(() => import('./DeliveryZonesInteractiveMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[320px] items-center justify-center rounded-[12px] bg-[#e8f0ed] text-sm font-semibold text-[#145142]/70">
      Завантаження карти…
    </div>
  ),
})

interface City {
  id: string
  name: string
  name_ua?: string
  name_en?: string
  name_nl?: string
  coordinates: { lat: number; lng: number }
  zoom: number
  deliveryZones: DeliveryZone[]
  country?: { code: string; name: string }
  pricePerKm?: number
}

interface DeliveryZone {
  id: string
  name: string
  color: string
  coordinates: { lat: number; lng: number }[]
  isFreeDelivery?: boolean
  flatDeliveryFee?: number | null
}

const defaultCities: City[] = [
  {
    id: 'amsterdam',
    name: 'Амстердам',
    coordinates: { lat: 52.3676, lng: 4.9041 },
    zoom: 11,
    deliveryZones: [
      {
        id: 'amsterdam-center',
        name: 'Центр',
        color: '#145142',
        isFreeDelivery: false,
        flatDeliveryFee: null,
        coordinates: [
          { lat: 52.36, lng: 4.88 },
          { lat: 52.38, lng: 4.88 },
          { lat: 52.38, lng: 4.92 },
          { lat: 52.36, lng: 4.92 },
        ],
      },
    ],
  },
]

function formatCitiesFromApi(citiesData: any[]): City[] {
  return citiesData.map((c: any) => ({
    id: c.id.toString(),
    name: c.name,
    name_ua: c.name_ua,
    name_en: c.name_en,
    name_nl: c.name_nl,
    coordinates:
      c.latitude && c.longitude
        ? { lat: c.latitude, lng: c.longitude }
        : { lat: 52.3676, lng: 4.9041 },
    zoom: c.zoom || 12,
    country: c.country
      ? { code: String(c.country.code || '').slice(0, 4), name: String(c.country.name || '') }
      : undefined,
    pricePerKm: typeof c.pricePerKm === 'number' && !Number.isNaN(c.pricePerKm) ? c.pricePerKm : 10,
    deliveryZones: c.deliveryZones
      ? c.deliveryZones.map((z: any) => {
          let coords: { lat: number; lng: number }[] = []
          try {
            const raw = typeof z.coordinates === 'string' ? JSON.parse(z.coordinates) : z.coordinates
            coords = Array.isArray(raw) ? raw : []
          } catch {
            coords = []
          }
          return {
            id: z.id.toString(),
            name: z.name,
            color: z.color || '#145142',
            coordinates: coords,
            isFreeDelivery: z.isFreeDelivery === true,
            flatDeliveryFee:
              z.flatDeliveryFee != null && !Number.isNaN(Number(z.flatDeliveryFee))
                ? Number(z.flatDeliveryFee)
                : null,
          }
        })
      : [],
  }))
}

type DeliveryCheckStatus =
  | 'inside'
  | 'outside'
  | 'no_zones'
  | 'geocode_failed'
  | 'bad_request'
  | 'server_error'
  | 'city_not_found'

type DeliveryCheckResult = {
  status: DeliveryCheckStatus
  placeLabel?: string
  zoneName?: string
  zoneId?: number
  zoneIsFreeDelivery?: boolean
  zoneFlatDeliveryFee?: number | null
  pricePerKm?: number
  defaultDeliveryFee?: number
  freeDeliveryThreshold?: number
}

function getAllCitiesMapUrl(cities: City[]) {
  if (cities.length === 0) {
    return 'https://www.google.com/maps?q=Europe&output=embed&z=4'
  }
  const valid = cities.filter(
    (c) =>
      c.coordinates &&
      typeof c.coordinates.lat === 'number' &&
      typeof c.coordinates.lng === 'number' &&
      !Number.isNaN(c.coordinates.lat) &&
      !Number.isNaN(c.coordinates.lng)
  )
  if (valid.length === 0) {
    return 'https://www.google.com/maps?q=Europe&output=embed&z=4'
  }
  const markers = valid
    .map((city, index) => {
      const { lat, lng } = city.coordinates
      const label = String.fromCharCode(65 + (index % 26))
      return `color:green|label:${label}|${lat},${lng}`
    })
    .join('|')
  const avgLat = valid.reduce((s, c) => s + c.coordinates.lat, 0) / valid.length
  const avgLng = valid.reduce((s, c) => s + c.coordinates.lng, 0) / valid.length
  const z = valid.length === 1 ? 11 : valid.length <= 3 ? 8 : valid.length <= 8 ? 7 : 6
  return `https://www.google.com/maps?q=${avgLat},${avgLng}&output=embed&z=${z}&markers=${encodeURIComponent(markers)}`
}

function getCityMapUrl(city: City) {
  const { lat, lng } = city.coordinates
  const z = city.zoom || 12
  if (typeof lat === 'number' && typeof lng === 'number' && !Number.isNaN(lat) && !Number.isNaN(lng)) {
    return `https://www.google.com/maps?q=${lat},${lng}&output=embed&z=${z}`
  }
  const cityName = encodeURIComponent(city.name)
  return `https://www.google.com/maps?q=${cityName}&output=embed&z=${z}`
}

type DeliveryViewProps = {
  /** Усередині головного меню: один фон з меню, без другої шапки / «картки» */
  embedInMenu?: boolean
}

export default function DeliveryView({ embedInMenu = false }: DeliveryViewProps) {
  const { t, getLocalized } = useLanguage()
  const d = t.deliveryPage
  const lp = t.locationPicker

  const [selectedCity, setSelectedCity] = useState<City | null>(null)
  const [cities, setCities] = useState<City[]>([])
  const [showAllCities, setShowAllCities] = useState(true)
  const [loading, setLoading] = useState(true)
  const [postalCode, setPostalCode] = useState('')
  const [postalChecking, setPostalChecking] = useState(false)
  const [postalResult, setPostalResult] = useState<DeliveryCheckResult | null>(null)
  const [siteTariff, setSiteTariff] = useState({ defaultDeliveryFee: 50, freeDeliveryThreshold: 1000 })

  const cityLabel = useCallback((c: City) => getLocalized(c, 'name') || c.name, [getLocalized])

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => (r.ok ? r.json() : {}))
      .then((data: { deliveryFee?: number; freeDeliveryThreshold?: number }) => {
        setSiteTariff({
          defaultDeliveryFee: typeof data.deliveryFee === 'number' ? data.deliveryFee : 50,
          freeDeliveryThreshold:
            typeof data.freeDeliveryThreshold === 'number' ? data.freeDeliveryThreshold : 1000,
        })
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const loadData = async () => {
      try {
        const citiesRes = await fetch('/api/cities')
        if (citiesRes.ok) {
          const citiesData = await citiesRes.json()
          const formattedCities = formatCitiesFromApi(citiesData)
          setCities(formattedCities)
          const saved =
            typeof window !== 'undefined' && window.localStorage
              ? localStorage.getItem('selectedCityId')
              : null
          const matched = saved ? formattedCities.find((c) => c.id === saved) : null
          if (matched) {
            setSelectedCity(matched)
          } else if (formattedCities.length > 0) {
            setSelectedCity(formattedCities[0])
          } else {
            setSelectedCity(null)
          }
        } else {
          setCities(defaultCities)
          const saved =
            typeof window !== 'undefined' && window.localStorage
              ? localStorage.getItem('selectedCityId')
              : null
          const matched = saved ? defaultCities.find((c) => c.id === saved) : null
          setSelectedCity(matched ?? defaultCities[0] ?? null)
        }
      } catch (error) {
        console.error('Ошибка загрузки данных доставки:', error)
        setCities(defaultCities)
        const saved =
          typeof window !== 'undefined' && window.localStorage
            ? localStorage.getItem('selectedCityId')
            : null
        const matched = saved ? defaultCities.find((c) => c.id === saved) : null
        if (matched) {
          setSelectedCity(matched)
        } else {
          setSelectedCity(defaultCities[0] ?? null)
        }
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const syncCityFromStorage = useCallback(() => {
    if (typeof window === 'undefined' || !window.localStorage || cities.length === 0) return
    const savedCityId = localStorage.getItem('selectedCityId')
    if (!savedCityId) {
      setSelectedCity(cities[0] ?? null)
      return
    }
    const city = cities.find((c) => c.id === savedCityId)
    setSelectedCity(city ?? null)
  }, [cities])

  useEffect(() => {
    syncCityFromStorage()
  }, [syncCityFromStorage])

  useEffect(() => {
    const onCityChanged = () => {
      syncCityFromStorage()
      setPostalResult(null)
    }
    window.addEventListener('cityChanged', onCityChanged)
    window.addEventListener('storage', onCityChanged)
    return () => {
      window.removeEventListener('cityChanged', onCityChanged)
      window.removeEventListener('storage', onCityChanged)
    }
  }, [syncCityFromStorage])

  const handleCityChange = (cityId: string) => {
    const city = cities.find((c) => c.id === cityId)
    if (city) {
      setSelectedCity(city)
      setShowAllCities(false)
      setPostalResult(null)
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('selectedCityId', cityId)
        window.dispatchEvent(new Event('cityChanged'))
      }
    }
  }

  const runPostalCheck = async () => {
    if (!selectedCity) {
      toast.error(d.postalBadRequest)
      return
    }
    const pc = postalCode.trim()
    if (!pc) {
      toast.error(d.postalBadRequest)
      return
    }
    setPostalChecking(true)
    setPostalResult(null)
    try {
      const res = await fetch('/api/delivery/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cityId: parseInt(selectedCity.id, 10), postalCode: pc }),
      })
      const data = (await res.json()) as DeliveryCheckResult & { status?: string }
      if (!res.ok) {
        setPostalResult({
          status: (data.status as DeliveryCheckStatus) || 'server_error',
        })
        return
      }
      setPostalResult({
        status: data.status as DeliveryCheckStatus,
        placeLabel: data.placeLabel,
        zoneName: data.zoneName,
        zoneId: data.zoneId,
        zoneIsFreeDelivery: data.zoneIsFreeDelivery,
        zoneFlatDeliveryFee: data.zoneFlatDeliveryFee,
        pricePerKm: data.pricePerKm,
        defaultDeliveryFee: data.defaultDeliveryFee,
        freeDeliveryThreshold: data.freeDeliveryThreshold,
      })
    } catch {
      setPostalResult({ status: 'server_error' })
    } finally {
      setPostalChecking(false)
    }
  }

  const buildZonePopupHtml = useCallback(
    (zone: DeliveryZone) => {
      const nameSafe = escapeHtml(zone.name || '')
      if (zone.isFreeDelivery) {
        return `<strong class="delivery-watta-zone-popup-title">${nameSafe}</strong><p class="delivery-watta-zone-popup-lead">${escapeHtml(d.zonePopupFree)}</p>`
      }
      if (zone.flatDeliveryFee != null && !Number.isNaN(zone.flatDeliveryFee)) {
        const line = d.zonePopupFlat.replace('{{amount}}', String(zone.flatDeliveryFee))
        return `<strong class="delivery-watta-zone-popup-title">${nameSafe}</strong><p class="delivery-watta-zone-popup-lead">${escapeHtml(line)}</p>`
      }
      const base = siteTariff.defaultDeliveryFee
      const perKm = selectedCity?.pricePerKm ?? 10
      const from = siteTariff.freeDeliveryThreshold
      const ul = `<ul class="delivery-watta-zone-popup-list"><li>${escapeHtml(d.zonePopupStandardBase.replace('{{base}}', String(base)))}</li><li>${escapeHtml(d.zonePopupStandardPerKm.replace('{{perKm}}', String(perKm)))}</li><li>${escapeHtml(d.zonePopupStandardFreeFrom.replace('{{from}}', String(from)))}</li></ul>`
      return `<strong class="delivery-watta-zone-popup-title">${nameSafe}</strong><p class="delivery-watta-zone-popup-muted">${escapeHtml(d.zonePopupStandardTitle)}</p>${ul}`
    },
    [d, selectedCity?.pricePerKm, siteTariff.defaultDeliveryFee, siteTariff.freeDeliveryThreshold]
  )

  const zoneFeeLine = useCallback(
    (zone: DeliveryZone) => {
      if (zone.isFreeDelivery) return d.zoneFeeFree
      if (zone.flatDeliveryFee != null && !Number.isNaN(zone.flatDeliveryFee)) {
        return d.zoneFeeFlat.replace('{{amount}}', String(zone.flatDeliveryFee))
      }
      return d.zoneFeeStandard
    },
    [d]
  )

  const showInteractiveZonesMap = Boolean(
    selectedCity && !showAllCities && (selectedCity.deliveryZones?.length ?? 0) > 0
  )

  const mapSrc = useMemo(() => {
    if (cities.length === 0) {
      return getAllCitiesMapUrl([])
    }
    if (!selectedCity) {
      return getAllCitiesMapUrl(cities)
    }
    return showAllCities ? getAllCitiesMapUrl(cities) : getCityMapUrl(selectedCity)
  }, [selectedCity, showAllCities, cities])

  const mapsLinkHref = useMemo(() => {
    const hrefAllCities = () => {
      const valid = cities.filter((c) => c.coordinates && !Number.isNaN(c.coordinates.lat))
      if (valid.length === 0) return 'https://www.google.com/maps'
      const avgLat = valid.reduce((s, c) => s + c.coordinates.lat, 0) / valid.length
      const avgLng = valid.reduce((s, c) => s + c.coordinates.lng, 0) / valid.length
      return `https://www.google.com/maps?q=${avgLat},${avgLng}`
    }
    if (!selectedCity) {
      return cities.length > 0 ? hrefAllCities() : 'https://www.google.com/maps'
    }
    if (showAllCities) {
      return hrefAllCities()
    }
    const { lat, lng } = selectedCity.coordinates
    if (typeof lat === 'number' && typeof lng === 'number' && !Number.isNaN(lat) && !Number.isNaN(lng)) {
      return `https://www.google.com/maps?q=${lat},${lng}`
    }
    return `https://www.google.com/maps/search/${encodeURIComponent(selectedCity.name)}`
  }, [selectedCity, showAllCities, cities])

  return (
    <div className={`delivery-watta-page relative${embedInMenu ? ' delivery-watta-page--embed' : ''}`}>
      {!embedInMenu && <div className="delivery-watta-noise" aria-hidden />}
      {!embedInMenu && <LogoBackground />}
      <div className="relative z-[2]">
        <header className="delivery-watta-hero">
          <div className="delivery-watta-hero-top">
            <span className="delivery-watta-kicker">{d.kicker}</span>
            <span className="delivery-watta-kicker-script" style={{ fontFamily: 'var(--font-brand-marck), cursive' }}>
              {d.kickerScript}
            </span>
          </div>
          <h1 className="delivery-watta-display">
            <span className="delivery-watta-display-line">{d.headlineLead}</span>{' '}
            <span className="delivery-watta-mark">{d.headlineMark}</span>
          </h1>
          <p className="delivery-watta-trail" style={{ fontFamily: 'var(--font-brand-cormorant), serif' }}>
            {d.headlineTrail}
          </p>
          <p className="delivery-watta-sub">{d.sub}</p>
          <div className="delivery-watta-stats">
            <div className="delivery-watta-stat">
              <span className="delivery-watta-stat-ico-wrap" aria-hidden>
                <Sparkles className="delivery-watta-stat-ico" strokeWidth={2} />
              </span>
              <span className="delivery-watta-stat-label">{d.statFresh}</span>
            </div>
            <div className="delivery-watta-stat">
              <span className="delivery-watta-stat-ico-wrap" aria-hidden>
                <Timer className="delivery-watta-stat-ico" strokeWidth={2} />
              </span>
              <span className="delivery-watta-stat-label">{d.statFast}</span>
            </div>
            <div className="delivery-watta-stat">
              <span className="delivery-watta-stat-ico-wrap" aria-hidden>
                <Navigation className="delivery-watta-stat-ico" strokeWidth={2} />
              </span>
              <span className="delivery-watta-stat-label">{d.statCity}</span>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="delivery-watta-loading">{d.loading}</div>
        ) : (
          <>
            <section className="delivery-watta-section" aria-labelledby="delivery-cities-label">
              <div className="delivery-watta-section-head">
                <MapPin className="delivery-watta-section-ico" strokeWidth={2.25} />
                <h2 id="delivery-cities-label" className="delivery-watta-section-title">
                  {d.citiesLabel}
                </h2>
              </div>
              <div className="delivery-watta-city-row">
                {cities.length === 0 ? (
                  <p className="delivery-watta-cities-empty" role="status">
                    {lp.noActiveCities} {lp.activateInAdmin}
                  </p>
                ) : (
                  cities.map((city) => (
                    <button
                      key={city.id}
                      type="button"
                      className={`delivery-watta-city-chip ${selectedCity?.id === city.id ? 'delivery-watta-city-chip--on' : ''}`}
                      onClick={() => handleCityChange(city.id)}
                    >
                      <span className="delivery-watta-city-chip-pin" aria-hidden>
                        📍
                      </span>
                      <span className="delivery-watta-city-chip-name">{cityLabel(city)}</span>
                      {city.deliveryZones && city.deliveryZones.length > 0 && (
                        <span className="delivery-watta-city-chip-badge">{city.deliveryZones.length}</span>
                      )}
                    </button>
                  ))
                )}
              </div>
              <p className="delivery-watta-sync-hint">{d.syncCityHint}</p>
            </section>

            <div className="delivery-watta-policy-strip" role="note">
              <Shield className="delivery-watta-policy-ico" strokeWidth={2} aria-hidden />
              <p>{d.adminZonesNote}</p>
            </div>

            <section className="delivery-watta-postal" aria-labelledby="postal-heading">
              <div className="delivery-watta-postal-inner">
                <div className="delivery-watta-postal-grid">
                  <div className="delivery-watta-postal-intro">
                    <div className="delivery-watta-postal-intro-head">
                      <Search className="delivery-watta-postal-head-ico" strokeWidth={2.25} aria-hidden />
                      <h2 id="postal-heading" className="delivery-watta-postal-title">
                        {d.postalTitle}
                      </h2>
                    </div>
                    <p className="delivery-watta-postal-desc">{d.postalDesc}</p>
                  </div>
                  <div className="delivery-watta-postal-form-block">
                    <label className="delivery-watta-postal-label" htmlFor="delivery-postal-input">
                      {d.postalLabel}
                    </label>
                    <div className="delivery-watta-postal-controls">
                      <input
                        id="delivery-postal-input"
                        type="text"
                        inputMode="text"
                        autoComplete="postal-code"
                        className="delivery-watta-postal-input"
                        placeholder={d.postalPlaceholder}
                        value={postalCode}
                        disabled={!selectedCity || cities.length === 0}
                        onChange={(e) => setPostalCode(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') void runPostalCheck()
                        }}
                      />
                      <button
                        type="button"
                        className="delivery-watta-postal-btn"
                        disabled={postalChecking || !selectedCity || cities.length === 0}
                        onClick={() => void runPostalCheck()}
                      >
                        {postalChecking ? d.postalChecking : d.postalButton}
                      </button>
                    </div>
                  </div>
                </div>
                {postalResult && (
                  <div
                    className={`delivery-watta-postal-result delivery-watta-postal-result--${postalResult.status}`}
                  >
                    {postalResult.status === 'inside' && (
                      <>
                        <CheckCircle2 className="delivery-watta-postal-result-ico" strokeWidth={2} />
                        <div>
                          <p className="delivery-watta-postal-result-title">{d.postalInside}</p>
                          {postalResult.zoneName && (
                            <p className="delivery-watta-postal-result-meta">
                              {d.postalZone}: <strong>{postalResult.zoneName}</strong>
                            </p>
                          )}
                          {postalResult.placeLabel && (
                            <p className="delivery-watta-postal-result-meta">
                              {d.postalAddressFound}: {postalResult.placeLabel}
                            </p>
                          )}
                          {postalResult.zoneIsFreeDelivery ? (
                            <p className="delivery-watta-postal-result-meta delivery-watta-postal-zone-tariff">
                              {d.postalZoneTariffFree}
                            </p>
                          ) : postalResult.zoneFlatDeliveryFee != null &&
                            !Number.isNaN(postalResult.zoneFlatDeliveryFee) ? (
                            <p className="delivery-watta-postal-result-meta delivery-watta-postal-zone-tariff">
                              {d.postalZoneTariffFlat.replace(
                                '{{amount}}',
                                String(postalResult.zoneFlatDeliveryFee)
                              )}
                            </p>
                          ) : (
                            <p className="delivery-watta-postal-result-meta delivery-watta-postal-zone-tariff">
                              {d.postalZoneTariffStandard}
                            </p>
                          )}
                          <ul className="delivery-watta-tariff-list">
                            <li>
                              {d.tariffPerKm}: <strong>{postalResult.pricePerKm ?? selectedCity?.pricePerKm ?? 10} €</strong>
                            </li>
                            <li>
                              {d.tariffBase}:{' '}
                              <strong>
                                {postalResult.defaultDeliveryFee ?? siteTariff.defaultDeliveryFee} €
                              </strong>
                            </li>
                            <li>
                              {d.tariffFreeFrom}:{' '}
                              <strong>
                                {postalResult.freeDeliveryThreshold ?? siteTariff.freeDeliveryThreshold} €
                              </strong>
                            </li>
                          </ul>
                        </div>
                      </>
                    )}
                    {postalResult.status === 'outside' && (
                      <>
                        <AlertCircle className="delivery-watta-postal-result-ico" strokeWidth={2} />
                        <div>
                          <p className="delivery-watta-postal-result-title">{d.postalOutside}</p>
                          {postalResult.placeLabel && (
                            <p className="delivery-watta-postal-result-meta">{postalResult.placeLabel}</p>
                          )}
                        </div>
                      </>
                    )}
                    {(postalResult.status === 'no_zones' || postalResult.status === 'city_not_found') && (
                      <>
                        <AlertCircle className="delivery-watta-postal-result-ico" strokeWidth={2} />
                        <div>
                          <p className="delivery-watta-postal-result-title">{d.cityNoDeliveryYet}</p>
                          <p className="delivery-watta-postal-result-meta">{d.postalNoZones}</p>
                        </div>
                      </>
                    )}
                    {(postalResult.status === 'geocode_failed' || postalResult.status === 'bad_request') && (
                      <>
                        <AlertCircle className="delivery-watta-postal-result-ico" strokeWidth={2} />
                        <p className="delivery-watta-postal-result-title">{d.postalGeocodeFail}</p>
                      </>
                    )}
                    {postalResult.status === 'server_error' && (
                      <>
                        <AlertCircle className="delivery-watta-postal-result-ico" strokeWidth={2} />
                        <p className="delivery-watta-postal-result-title">{d.postalGeocodeFail}</p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </section>

            <section className="delivery-watta-map-section" aria-label="Map">
              {showInteractiveZonesMap && (
                <p className="delivery-watta-map-zones-hint">{d.mapZonesHint}</p>
              )}
              <div className="delivery-watta-map-toolbar">
                <button
                  type="button"
                  className={`delivery-watta-map-tab ${showAllCities || !selectedCity ? 'delivery-watta-map-tab--on' : ''}`}
                  onClick={() => setShowAllCities(true)}
                >
                  {d.mapAll}
                </button>
                {selectedCity && (
                  <button
                    type="button"
                    className={`delivery-watta-map-tab ${selectedCity && !showAllCities ? 'delivery-watta-map-tab--on' : ''}`}
                    onClick={() => setShowAllCities(false)}
                  >
                    {d.mapFocus}: {cityLabel(selectedCity)}
                  </button>
                )}
              </div>
              <div className="delivery-watta-map-frame">
                <div className="delivery-watta-map-inner">
                  {cities.length > 0 && showInteractiveZonesMap && selectedCity ? (
                    <DeliveryZonesInteractiveMap
                      zones={selectedCity.deliveryZones}
                      centerLat={selectedCity.coordinates.lat}
                      centerLng={selectedCity.coordinates.lng}
                      zoom={selectedCity.zoom || 12}
                      buildPopupHtml={buildZonePopupHtml}
                      ariaLabel={d.mapInteractiveAria}
                    />
                  ) : mapSrc ? (
                    <iframe
                      key={!selectedCity || showAllCities ? 'all-cities' : selectedCity!.id}
                      src={mapSrc}
                      width="100%"
                      height="100%"
                      className="delivery-watta-iframe"
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title={
                        cities.length === 0
                          ? d.mapAll
                          : !selectedCity || showAllCities
                            ? d.mapAll
                            : cityLabel(selectedCity!)
                      }
                    />
                  ) : null}
                </div>
                <a
                  href={mapsLinkHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="delivery-watta-maps-link"
                >
                  {d.openMaps} ↗
                </a>
              </div>
            </section>

            {selectedCity && selectedCity.deliveryZones && selectedCity.deliveryZones.length > 0 && (
              <section className="delivery-watta-zones" aria-labelledby="zones-heading">
                <h2 id="zones-heading" className="delivery-watta-zones-heading">
                  {d.zonesTitle} · <em>{cityLabel(selectedCity)}</em>
                </h2>
                <div className="delivery-watta-zones-grid">
                  {selectedCity.deliveryZones.map((zone) => (
                    <article
                      key={zone.id}
                      className="delivery-watta-zone-card"
                      style={{ borderLeftColor: zone.color }}
                    >
                      <div className="delivery-watta-zone-card-top">
                        <span
                          className="delivery-watta-zone-dot"
                          style={{ backgroundColor: zone.color }}
                        />
                        <h3 className="delivery-watta-zone-name">{zone.name}</h3>
                      </div>
                      <p className="delivery-watta-zone-ok">{d.zoneAvailable}</p>
                      <p className="delivery-watta-zone-fee">{zoneFeeLine(zone)}</p>
                    </article>
                  ))}
                </div>
              </section>
            )}

            <DeliveryExperienceBlocks d={d} />
          </>
        )}
      </div>
    </div>
  )
}
