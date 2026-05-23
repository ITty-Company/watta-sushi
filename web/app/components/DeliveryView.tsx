'use client'

import dynamic from 'next/dynamic'
import type { ReactNode, Ref } from 'react'
import { useState, useEffect, useLayoutEffect, useCallback, useMemo, useRef } from 'react'
import { DeliveryExperienceBlocks } from './DeliveryExperienceBlocks'
import DeliveryPageStats from './DeliveryPageStats'
import { DeliveryTrustStrip } from './DeliveryTrustStrip'
import AnimatedHeroIntroBlock from './AnimatedHeroIntroBlock'
import toast from 'react-hot-toast'
import { useLanguage } from '../context/LanguageContext'
import {
  wattaRestaurantEmbedUrl,
  wattaRestaurantExternalMapsUrl,
  WATTA_RESTAURANT,
} from '@/lib/wattaRestaurantLocation'
import {
  clearWattaDeliveryZoneSelection,
  feeModeFromZone,
  writeWattaDeliveryZoneSelection,
} from '@/lib/wattaDeliveryZoneSelection'
import { resolveCityFromSavedId } from '@/lib/wattaPreferredDefaultCity'
import {
  applyDefaultCityToStorage,
  isCityChoiceExplicit,
  persistUserCityChoice,
  readCityIdForProductApi,
} from '@/lib/wattaSiteLocalePrefs'
import { fetchPublicApi, fetchPublicApiFresh } from '@/lib/publicApiFetch'
import { readCitiesCacheRaw, writeCitiesCache } from '@/lib/wattaCitiesCache'
import { readSiteSettingsCache } from '@/lib/publicRouteWarmCache'
import { useHomeHeroVideo } from '@/hooks/useHomeHeroVideo'
import WattaHeroMarqueeBar from './WattaHeroMarqueeBar'
import WelcomeHeroSection from './WelcomeHeroSection'
import { ArrowUpRight, MapPin, AlertCircle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

function DeliveryFlowSection({
  children,
  className,
  ariaLabel,
  ariaLabelledBy,
}: {
  children: ReactNode
  className?: string
  ariaLabel?: string
  ariaLabelledBy?: string
}) {
  return (
    <section
      className={cn(
        'delivery-flow-section bg-white py-14 sm:py-18',
        className,
      )}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">{children}</div>
    </section>
  )
}

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
  /** Точка кухні з адмінки — центр інтерактивної карти зон */
  restaurantLatitude?: number
  restaurantLongitude?: number
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
    coordinates: { lat: WATTA_RESTAURANT.lat, lng: WATTA_RESTAURANT.lng },
    restaurantLatitude: WATTA_RESTAURANT.lat,
    restaurantLongitude: WATTA_RESTAURANT.lng,
    zoom: 14,
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
        : { lat: WATTA_RESTAURANT.lat, lng: WATTA_RESTAURANT.lng },
    restaurantLatitude:
      typeof c.restaurantLatitude === 'number' && !Number.isNaN(c.restaurantLatitude)
        ? c.restaurantLatitude
        : undefined,
    restaurantLongitude:
      typeof c.restaurantLongitude === 'number' && !Number.isNaN(c.restaurantLongitude)
        ? c.restaurantLongitude
        : undefined,
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
  | 'amsterdam_ok'
  | 'nl_tariff_ok'
  | 'outside_amsterdam'
  | 'outside_nl'
  | 'postcode_format_invalid'

type DeliveryCheckResult = {
  status: DeliveryCheckStatus
  placeLabel?: string
  lat?: number
  lng?: number
  zoneName?: string
  zoneId?: number
  zoneIsFreeDelivery?: boolean
  zoneFlatDeliveryFee?: number | null
  pricePerKm?: number
  defaultDeliveryFee?: number
  freeDeliveryThreshold?: number
  /** Орієнтовна сума з бекенду (зона + база + €×км від кухні) */
  estimatedDeliveryFee?: number | null
  distanceKm?: number | null
  /** Мінімальна сума замовлення за правилом відстані (≤20 км / >20 км) */
  minimumOrderEur?: number | null
  deliveryTariffStepKm?: number
  deliveryTariffStepEur?: number
  routeDurationMinutes?: number | null
}

function isKitchenTariffCheck(status: DeliveryCheckStatus | undefined): boolean {
  return status === 'nl_tariff_ok' || status === 'amsterdam_ok'
}

function isOutsideNlArea(status: DeliveryCheckStatus | undefined): boolean {
  return status === 'outside_nl' || status === 'outside_amsterdam'
}

function DeliveryKitchenMapBar({
  caption,
  address,
  mapsHref,
  openMapsLabel,
  variant = 'light',
}: {
  caption: string
  address: string
  mapsHref: string
  openMapsLabel: string
  variant?: 'light' | 'legacy' | 'compact'
}) {
  if (variant === 'compact') {
    return (
      <div className="delivery-designer-hub__kitchen-compact">
        <p className="delivery-designer-hub__kitchen-compact-addr">
          <MapPin className="delivery-designer-hub__kitchen-compact-ico" strokeWidth={2} aria-hidden />
          <span>
            <span className="delivery-designer-hub__kitchen-compact-label">{caption}</span>
            {address}
          </span>
        </p>
        <a
          href={mapsHref}
          target="_blank"
          rel="noopener noreferrer"
          className="delivery-designer-hub__kitchen-compact-link"
        >
          {openMapsLabel}
          <ArrowUpRight strokeWidth={2.25} aria-hidden />
        </a>
      </div>
    )
  }

  if (variant === 'legacy') {
    return (
      <div className="delivery-watta-map-footer">
        <p className="delivery-watta-kitchen-caption">
          <MapPin className="delivery-watta-kitchen-caption-ico" strokeWidth={2.25} aria-hidden />
          <span>
            <span className="delivery-watta-kitchen-caption-label">{caption}</span>
            <span className="delivery-watta-kitchen-caption-addr">{address}</span>
          </span>
        </p>
        <a
          href={mapsHref}
          target="_blank"
          rel="noopener noreferrer"
          className="delivery-watta-maps-link"
        >
          {openMapsLabel} ↗
        </a>
      </div>
    )
  }

  return (
    <div className="delivery-watta-map-footer delivery-designer-hub__kitchen-bar">
      <div className="delivery-designer-hub__kitchen-main">
        <div className="delivery-designer-hub__kitchen-mark" aria-hidden />
        <div className="delivery-designer-hub__kitchen-copy">
          <h3 className="delivery-designer-hub__kitchen-title">{caption}</h3>
          <p className="delivery-designer-hub__kitchen-addr">{address}</p>
        </div>
      </div>
      <a
        href={mapsHref}
        target="_blank"
        rel="noopener noreferrer"
        className="delivery-designer-hub__kitchen-link"
      >
        <span>{openMapsLabel}</span>
        <ArrowUpRight className="delivery-designer-hub__kitchen-link-ico" strokeWidth={2.25} aria-hidden />
      </a>
    </div>
  )
}

/** Перша секція доставки — той самий блок, що welcome на головній; основний ролик з `web/public`. */
type DeliveryViewProps = {
  /** Усередині головного меню: один фон з меню, без другої шапки / «картки» */
  embedInMenu?: boolean
  /** Для MenuView: ref на hero, щоб IntersectionObserver ховав панель категорій на мобільному */
  menuWelcomeHeroRef?: Ref<HTMLElement>
}

export default function DeliveryView({ embedInMenu = false, menuWelcomeHeroRef }: DeliveryViewProps) {
  const { t, getLocalized } = useLanguage()
  const d = t.deliveryPage
  const lp = t.locationPicker
  const a = t.siteAria

  const [selectedCity, setSelectedCity] = useState<City | null>(null)
  const [cities, setCities] = useState<City[]>([])
  const [showAllCities, setShowAllCities] = useState(true)
  const [loading, setLoading] = useState(true)
  const [deliveryAddressQuery, setDeliveryAddressQuery] = useState('')
  const [postalChecking, setPostalChecking] = useState(false)
  const [postalResult, setPostalResult] = useState<DeliveryCheckResult | null>(null)
  const [siteTariff, setSiteTariff] = useState({
    defaultDeliveryFee: 50,
    freeDeliveryThreshold: 1000,
    deliveryTariffStepKm: 3,
    deliveryTariffStepEur: 1.5,
  })

  const {
    heroVideoRef: deliveryHeroVideoRef,
    heroVideoSrc: deliveryHeroVideoSrc,
    heroVideoFailed: deliveryHeroVideoFailed,
    setHeroVideoFailed: setDeliveryHeroVideoFailed,
    setHeroVideoSourceIndex: setDeliveryHeroVideoIndex,
    videoSources: deliveryHeroPlaylist,
    playlistLength: deliveryHeroPlaylistLength,
  } = useHomeHeroVideo()

  const [isNarrowViewport, setIsNarrowViewport] = useState(false)
  /** ≤767px: вступ над відео; з 768px (планшет/ноут/ПК) — відео зверху, текст нижче */
  const [deliveryIntroBeforeHero, setDeliveryIntroBeforeHero] = useState(false)
  const deliveryNarrowStripHero = isNarrowViewport

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return
    const mqNarrow = window.matchMedia('(max-width: 768px)')
    const applyNarrow = () => setIsNarrowViewport(mqNarrow.matches)
    applyNarrow()
    mqNarrow.addEventListener('change', applyNarrow)
    return () => mqNarrow.removeEventListener('change', applyNarrow)
  }, [])

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return
    const mqIntroFirst = window.matchMedia('(max-width: 767px)')
    const apply = () => setDeliveryIntroBeforeHero(mqIntroFirst.matches)
    apply()
    mqIntroFirst.addEventListener('change', apply)
    return () => mqIntroFirst.removeEventListener('change', apply)
  }, [])

  const cityLabel = useCallback((c: City) => getLocalized(c, 'name') || c.name, [getLocalized])

  useLayoutEffect(() => {
    const cachedSettings = readSiteSettingsCache()
    if (cachedSettings) {
      setSiteTariff((prev) => ({
        defaultDeliveryFee:
          typeof cachedSettings.deliveryFee === 'number'
            ? cachedSettings.deliveryFee
            : prev.defaultDeliveryFee,
        freeDeliveryThreshold:
          typeof cachedSettings.freeDeliveryThreshold === 'number'
            ? cachedSettings.freeDeliveryThreshold
            : prev.freeDeliveryThreshold,
        deliveryTariffStepKm:
          typeof cachedSettings.deliveryTariffStepKm === 'number' && cachedSettings.deliveryTariffStepKm > 0
            ? cachedSettings.deliveryTariffStepKm
            : prev.deliveryTariffStepKm,
        deliveryTariffStepEur:
          typeof cachedSettings.deliveryTariffStepEur === 'number' && cachedSettings.deliveryTariffStepEur >= 0
            ? cachedSettings.deliveryTariffStepEur
            : prev.deliveryTariffStepEur,
      }))
    }
    const rawCities = readCitiesCacheRaw()
    if (rawCities) {
      const formattedCities = formatCitiesFromApi(rawCities)
      setCities(formattedCities)
      setSelectedCity(
        resolveCityFromSavedId(
          formattedCities,
          typeof window !== 'undefined' ? readCityIdForProductApi() : null,
        ),
      )
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const applySettings = (data: {
      deliveryFee?: number
      freeDeliveryThreshold?: number
      deliveryTariffStepKm?: number
      deliveryTariffStepEur?: number
    }) => {
      if (
        typeof data.deliveryFee === 'number' ||
        typeof data.freeDeliveryThreshold === 'number' ||
        typeof data.deliveryTariffStepKm === 'number' ||
        typeof data.deliveryTariffStepEur === 'number'
      ) {
        setSiteTariff((prev) => ({
          defaultDeliveryFee: typeof data.deliveryFee === 'number' ? data.deliveryFee : prev.defaultDeliveryFee,
          freeDeliveryThreshold:
            typeof data.freeDeliveryThreshold === 'number'
              ? data.freeDeliveryThreshold
              : prev.freeDeliveryThreshold,
          deliveryTariffStepKm:
            typeof data.deliveryTariffStepKm === 'number' && data.deliveryTariffStepKm > 0
              ? data.deliveryTariffStepKm
              : prev.deliveryTariffStepKm,
          deliveryTariffStepEur:
            typeof data.deliveryTariffStepEur === 'number' && data.deliveryTariffStepEur >= 0
              ? data.deliveryTariffStepEur
              : prev.deliveryTariffStepEur,
        }))
      }
    }
    const fetchSettings = async (fresh = false) => {
      try {
        const res = await (fresh ? fetchPublicApiFresh : fetchPublicApi)('/api/settings')
        if (res.ok) applySettings(await res.json())
      } catch {
        /* ignore */
      }
    }
    void fetchSettings()
    const onSettings = () => void fetchSettings(true)
    window.addEventListener('settingsUpdated', onSettings)
    return () => {
      window.removeEventListener('settingsUpdated', onSettings)
    }
  }, [])

  useEffect(() => {
    const loadData = async () => {
      try {
        const cachedRaw = readCitiesCacheRaw()
        if (cachedRaw) {
          const formattedCities = formatCitiesFromApi(cachedRaw)
          setCities(formattedCities)
          const chosen = resolveCityFromSavedId(
            formattedCities,
            typeof window !== 'undefined' ? readCityIdForProductApi() : null,
          )
          setSelectedCity(chosen)
          if (chosen) {
            if (isCityChoiceExplicit()) persistUserCityChoice(Number(chosen.id))
            else applyDefaultCityToStorage(Number(chosen.id))
          }
          setLoading(false)
        }

        const citiesRes = await fetch('/api/cities')
        if (citiesRes.ok) {
          const citiesData = await citiesRes.json()
          writeCitiesCache(citiesData)
          const formattedCities = formatCitiesFromApi(citiesData)
          setCities(formattedCities)
          const chosen = resolveCityFromSavedId(
            formattedCities,
            typeof window !== 'undefined' ? readCityIdForProductApi() : null,
          )
          setSelectedCity(chosen)
          if (chosen) {
            if (isCityChoiceExplicit()) persistUserCityChoice(Number(chosen.id))
            else applyDefaultCityToStorage(Number(chosen.id))
          }
        } else {
          setCities(defaultCities)
          setSelectedCity(
            resolveCityFromSavedId(
              defaultCities,
              typeof window !== 'undefined' ? readCityIdForProductApi() : null,
            ) ??
              defaultCities[0] ??
              null,
          )
        }
      } catch (error) {
        console.error('Ошибка загрузки данных доставки:', error)
        setCities(defaultCities)
        setSelectedCity(
          resolveCityFromSavedId(
            defaultCities,
            typeof window !== 'undefined' ? readCityIdForProductApi() : null,
          ) ?? defaultCities[0] ?? null,
        )
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const syncCityFromStorage = useCallback(() => {
    if (typeof window === 'undefined' || !window.localStorage || cities.length === 0) return
    const chosen = resolveCityFromSavedId(cities, readCityIdForProductApi())
    setSelectedCity(chosen)
    if (chosen) {
      if (isCityChoiceExplicit()) persistUserCityChoice(Number(chosen.id))
      else applyDefaultCityToStorage(Number(chosen.id))
    }
  }, [cities])

  useEffect(() => {
    syncCityFromStorage()
  }, [syncCityFromStorage])

  useEffect(() => {
    const onCityChanged = (event: Event) => {
      const cityId = (event as CustomEvent<{ cityId?: number }>).detail?.cityId
      if (cityId != null && cities.length > 0) {
        const city = cities.find((c) => String(c.id) === String(cityId))
        if (city) {
          setSelectedCity(city)
          setPostalResult(null)
          return
        }
      }
      syncCityFromStorage()
      setPostalResult(null)
    }
    window.addEventListener('cityChanged', onCityChanged)
    window.addEventListener('storage', onCityChanged)
    return () => {
      window.removeEventListener('cityChanged', onCityChanged)
      window.removeEventListener('storage', onCityChanged)
    }
  }, [syncCityFromStorage, cities])

  const handleCityChange = (cityId: string) => {
    const city = cities.find((c) => c.id === cityId)
    if (city) {
      if (selectedCity?.id !== cityId) {
        clearWattaDeliveryZoneSelection()
      }
      setSelectedCity(city)
      if (city.deliveryZones && city.deliveryZones.length > 0) {
        setShowAllCities(false)
      } else {
        setShowAllCities(true)
      }
      setPostalResult(null)
      if (typeof window !== 'undefined') {
        persistUserCityChoice(Number(cityId))
        window.dispatchEvent(new Event('cityChanged'))
      }
    }
  }

  const runDeliveryAddressCheck = async () => {
    if (!selectedCity) {
      toast.error(d.postalBadRequest)
      return
    }
    const query = deliveryAddressQuery.trim()
    if (query.length < 3) {
      toast.error(d.postalBadRequest)
      return
    }
    setPostalChecking(true)
    setPostalResult(null)
    try {
      const res = await fetch('/api/delivery/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cityId: parseInt(selectedCity.id, 10),
          locationQuery: query,
        }),
      })
      const data = (await res.json()) as DeliveryCheckResult & {
        status?: string
        deliveryTariffStepKm?: number
        deliveryTariffStepEur?: number
        routeDurationMinutes?: number | null
      }
      if (!res.ok) {
        setPostalResult({
          status: (data.status as DeliveryCheckStatus) || 'server_error',
        })
        return
      }
      setPostalResult({
        status: data.status as DeliveryCheckStatus,
        placeLabel: data.placeLabel,
        lat: data.lat != null && Number.isFinite(Number(data.lat)) ? Number(data.lat) : undefined,
        lng: data.lng != null && Number.isFinite(Number(data.lng)) ? Number(data.lng) : undefined,
        zoneName: data.zoneName,
        zoneId: data.zoneId,
        zoneIsFreeDelivery: data.zoneIsFreeDelivery,
        zoneFlatDeliveryFee: data.zoneFlatDeliveryFee,
        pricePerKm: data.pricePerKm,
        defaultDeliveryFee: data.defaultDeliveryFee,
        freeDeliveryThreshold: data.freeDeliveryThreshold,
        estimatedDeliveryFee:
          data.estimatedDeliveryFee != null && !Number.isNaN(Number(data.estimatedDeliveryFee))
            ? Number(data.estimatedDeliveryFee)
            : null,
        distanceKm:
          data.distanceKm != null && !Number.isNaN(Number(data.distanceKm)) ? Number(data.distanceKm) : null,
        minimumOrderEur:
          data.minimumOrderEur != null && !Number.isNaN(Number(data.minimumOrderEur))
            ? Number(data.minimumOrderEur)
            : null,
        deliveryTariffStepKm:
          data.deliveryTariffStepKm != null && !Number.isNaN(Number(data.deliveryTariffStepKm))
            ? Number(data.deliveryTariffStepKm)
            : undefined,
        deliveryTariffStepEur:
          data.deliveryTariffStepEur != null && !Number.isNaN(Number(data.deliveryTariffStepEur))
            ? Number(data.deliveryTariffStepEur)
            : undefined,
        routeDurationMinutes:
          data.routeDurationMinutes != null && !Number.isNaN(Number(data.routeDurationMinutes))
            ? Number(data.routeDurationMinutes)
            : null,
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
      const foot = `<p class="delivery-watta-zone-popup-foot">${escapeHtml(d.zonePopupSaveHint)}</p>`
      if (zone.isFreeDelivery) {
        return `<strong class="delivery-watta-zone-popup-title">${nameSafe}</strong><p class="delivery-watta-zone-popup-lead">${escapeHtml(d.zonePopupFree)}</p><p class="delivery-watta-zone-popup-muted">${escapeHtml(d.zonePopupStandardFreeFrom.replace('{{from}}', String(siteTariff.freeDeliveryThreshold)))}</p>${foot}`
      }
      if (zone.flatDeliveryFee != null && !Number.isNaN(zone.flatDeliveryFee)) {
        const line = d.zonePopupFlat.replace('{{amount}}', String(zone.flatDeliveryFee))
        return `<strong class="delivery-watta-zone-popup-title">${nameSafe}</strong><p class="delivery-watta-zone-popup-lead">${escapeHtml(line)}</p>${foot}`
      }
      const base = siteTariff.defaultDeliveryFee
      const perKm = selectedCity?.pricePerKm ?? 10
      const from = siteTariff.freeDeliveryThreshold
      const ul = `<ul class="delivery-watta-zone-popup-list"><li>${escapeHtml(d.zonePopupStandardBase.replace('{{base}}', String(base)))}</li><li>${escapeHtml(d.zonePopupStandardPerKm.replace('{{perKm}}', String(perKm)))}</li><li>${escapeHtml(d.zonePopupStandardFreeFrom.replace('{{from}}', String(from)))}</li></ul>`
      return `<strong class="delivery-watta-zone-popup-title">${nameSafe}</strong><p class="delivery-watta-zone-popup-muted">${escapeHtml(d.zonePopupStandardTitle)}</p>${ul}${foot}`
    },
    [
      d,
      selectedCity?.pricePerKm,
      siteTariff.defaultDeliveryFee,
      siteTariff.freeDeliveryThreshold,
    ],
  )

  const handleMapZoneSelect = useCallback(
    (zone: DeliveryZone) => {
      if (!selectedCity) return
      const mode = feeModeFromZone(zone)
      const flatAmt =
        zone.flatDeliveryFee != null && !Number.isNaN(Number(zone.flatDeliveryFee))
          ? Number(zone.flatDeliveryFee)
          : null
      writeWattaDeliveryZoneSelection({
        v: 1,
        cityId: selectedCity.id,
        zoneId: zone.id,
        zoneName: zone.name || '',
        feeMode: mode,
        flatAmount: mode === 'flat' ? flatAmt : null,
        updatedAt: Date.now(),
      })
      if (typeof window !== 'undefined') {
        persistUserCityChoice(Number(selectedCity.id))
        window.dispatchEvent(new Event('cityChanged'))
      }
      let feeLabel = d.zoneFeeStandard
      if (mode === 'free') {
        feeLabel = `${d.zoneFeeFree} · ${d.zonePopupStandardFreeFrom.replace('{{from}}', String(siteTariff.freeDeliveryThreshold))}`
      } else if (mode === 'flat' && flatAmt != null) {
        feeLabel = d.zonePopupFlat.replace('{{amount}}', String(flatAmt))
      }
      toast.success(d.zoneSelectedToast.replace('{{zone}}', zone.name || '—').replace('{{fee}}', feeLabel))
    },
    [d, selectedCity, siteTariff.freeDeliveryThreshold],
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

  /** Завжди адреса кухні Watta Sushi (Amsterdam) — embed і зовнішнє посилання збігаються. */
  const mapSrc = useMemo(
    () =>
      wattaRestaurantEmbedUrl(
        showAllCities ? WATTA_RESTAURANT.embedZoomAll : WATTA_RESTAURANT.embedZoomSingle
      ),
    [showAllCities]
  )

  const mapsLinkHref = useMemo(() => wattaRestaurantExternalMapsUrl(), [])

  const deliveryIntroSection = (
    <AnimatedHeroIntroBlock
      sectionId="delivery-before-hero-intro"
      ariaLabel={d.headlineLead}
      titleLines={[d.headlineLead, d.headlineMark]}
      body={d.sub}
      accentLineIndex={1}
    >
      {embedInMenu ? (
        <ul
          className="delivery-hero-copy-home__stats delivery-hero-copy-home__stats--intro mx-auto mt-4 max-w-2xl justify-center"
          aria-label={`${d.statFresh}, ${d.statFast}, ${d.statCity}`}
        >
          <li>{d.statFresh}</li>
          <li>{d.statFast}</li>
          <li>{d.statCity}</li>
        </ul>
      ) : null}
    </AnimatedHeroIntroBlock>
  )

  const deliveryHeroVideoBlock = (
    <WelcomeHeroSection
      sectionClassName={
        embedInMenu ? 'delivery-page-hero-embed-web' : 'delivery-page-hero-standalone-web'
      }
      sectionRef={menuWelcomeHeroRef}
      heroVideoFailed={deliveryHeroVideoFailed}
      setHeroVideoSourceIndex={setDeliveryHeroVideoIndex}
      setHeroVideoFailed={setDeliveryHeroVideoFailed}
      heroVideoRef={deliveryHeroVideoRef}
      heroVideoSrc={deliveryHeroVideoSrc}
      videoSources={deliveryHeroPlaylist}
      playlistLength={deliveryHeroPlaylistLength}
    >
      {embedInMenu ? (
        <div className="home-hero-after-marquee-wrap-web home-hero-marquee-over-video-web pointer-events-none absolute inset-x-0 bottom-0 z-[25] w-full">
          <WattaHeroMarqueeBar />
        </div>
      ) : null}
    </WelcomeHeroSection>
  )

  const deliveryHeroVideoInStrip = deliveryNarrowStripHero ? (
    <div className="menu-home-narrow-strip-hero-web w-full max-w-[100vw] shrink-0">
      {deliveryHeroVideoBlock}
    </div>
  ) : (
    deliveryHeroVideoBlock
  )

  const deliveryEmbedHeroStack = (
    <>
      {deliveryHeroVideoInStrip}
      {deliveryIntroSection}
    </>
  )

  const deliveryPageLeadIntro = (
    <AnimatedHeroIntroBlock
      sectionId="delivery-page-lead-intro"
      ariaLabel={d.headlineLead}
      titleLines={[d.headlineLead, d.headlineMark]}
      body={d.sub}
      accentLineIndex={1}
      headingLevel="h1"
      reserveTopSpace={deliveryIntroBeforeHero}
      innerClassName="home-after-hero-intro-inner-web home-after-hero-intro-inner-web--home-menu delivery-page-intro-inner-web--standalone relative z-[1] mx-auto w-full max-w-6xl px-4 pb-3 text-center sm:px-6 sm:pb-4 md:pb-5"
    />
  )

  const deliveryStandaloneHeroStack = (
    <div
      className={cn(
        'delivery-page-hero-stack w-full shrink-0 bg-transparent',
        deliveryIntroBeforeHero
          ? 'delivery-page-hero-stack--intro-first'
          : 'delivery-page-hero-stack--video-first',
      )}
    >
      {deliveryIntroBeforeHero ? (
        <>
          {deliveryPageLeadIntro}
          {deliveryHeroVideoInStrip}
        </>
      ) : (
        <>
          {deliveryHeroVideoInStrip}
          {deliveryPageLeadIntro}
        </>
      )}
      <DeliveryPageStats labels={d} />
    </div>
  )

  const standaloneShowcase = !embedInMenu

  const deliveryPageBody = (
    <div
      className={`delivery-watta-page relative${embedInMenu ? ' delivery-watta-page--embed' : ' delivery-showcase-flow'}`}
    >
      <div className="relative z-[2]">
        {loading ? (
          <div className="delivery-watta-loading">{d.loading}</div>
        ) : (
          <>
            {standaloneShowcase ? (
              <div className="delivery-page-flow delivery-page-web">
                {cities.length > 1 ? (
                  <DeliveryFlowSection
                    className="delivery-flow-section--city"
                    ariaLabel={d.citiesLabel}
                  >
                    <h2 className="contact-watta-section-title mb-2">{d.citiesLabel}</h2>
                    <div className="flex flex-wrap gap-2.5" role="group" aria-label={d.citiesLabel}>
                      {cities.map((city) => (
                        <button
                          key={city.id}
                          type="button"
                          className={cn(
                            'contact-watta-topic-chip',
                            selectedCity?.id === city.id && 'contact-watta-topic-chip--active',
                          )}
                          onClick={() => handleCityChange(city.id)}
                        >
                          <span className="contact-watta-topic-chip__ico" aria-hidden>
                            <MapPin size={18} strokeWidth={2.1} />
                          </span>
                          <span>{cityLabel(city)}</span>
                        </button>
                      ))}
                    </div>
                  </DeliveryFlowSection>
                ) : null}

                <DeliveryFlowSection
                  className="delivery-flow-section--calc"
                  ariaLabelledBy="postal-heading"
                >
                <h2 id="postal-heading" className="contact-watta-section-title mb-2">
                  {d.postalTitle}
                </h2>
                <p className="delivery-page-section-lead mb-8 max-w-2xl">{d.postalDesc}</p>
                <div className="delivery-designer-hub__calc">
                  <div className="delivery-designer-hub__calc-head" aria-hidden>
                    <h2 className="delivery-designer-hub__calc-title">{d.postalTitle}</h2>
                    <p className="delivery-designer-hub__calc-lead">{d.postalDesc}</p>
                  </div>
                  <div className="delivery-designer-hub__form">
                    <label className="delivery-designer-hub__form-label" htmlFor="delivery-address-input">
                      {d.postalLabel}
                    </label>
                    <div className="delivery-designer-hub__form-row">
                      <textarea
                        id="delivery-address-input"
                        rows={2}
                        inputMode="text"
                        autoComplete="street-address"
                        className="delivery-designer-hub__input"
                        placeholder={d.postalPlaceholder}
                        value={deliveryAddressQuery}
                        disabled={!selectedCity || cities.length === 0}
                        onChange={(e) => setDeliveryAddressQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            void runDeliveryAddressCheck()
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="delivery-designer-hub__submit"
                        disabled={postalChecking || !selectedCity || cities.length === 0}
                        onClick={() => void runDeliveryAddressCheck()}
                      >
                        {postalChecking ? d.postalChecking : d.postalButton}
                      </button>
                    </div>
                  </div>

                  {postalResult && (
                    <div
                      className={`delivery-watta-postal-result delivery-watta-postal-result--${postalResult.status}`}
                    >
                    {isKitchenTariffCheck(postalResult.status) && (
                      <>
                        <CheckCircle2 className="delivery-watta-postal-result-ico" strokeWidth={2} />
                        <div>
                          <p className="delivery-watta-postal-result-title">{d.postalAmsterdamOkTitle}</p>
                          {postalResult.placeLabel && (
                            <p className="delivery-watta-postal-result-meta">
                              {d.postalAddressFound}: {postalResult.placeLabel}
                            </p>
                          )}
                          {postalResult.estimatedDeliveryFee != null && (
                            <p className="delivery-watta-postal-fee-hero" aria-live="polite">
                              <span className="delivery-watta-postal-fee-hero__label">
                                {d.postalDeliveryFeeTitle}
                              </span>
                              <span className="delivery-watta-postal-fee-hero__amount">
                                {postalResult.estimatedDeliveryFee} €
                              </span>
                            </p>
                          )}
                          {postalResult.distanceKm != null && (
                            <p className="delivery-watta-postal-result-meta">
                              {d.distanceFromKitchen.replace('{{km}}', String(postalResult.distanceKm))}
                            </p>
                          )}
                          {postalResult.routeDurationMinutes != null &&
                          postalResult.routeDurationMinutes > 0 ? (
                            <p className="delivery-watta-postal-result-meta">
                              {d.postalRouteDuration.replace(
                                '{{minutes}}',
                                String(postalResult.routeDurationMinutes)
                              )}
                            </p>
                          ) : null}
                          {postalResult.distanceKm != null &&
                            postalResult.estimatedDeliveryFee != null && (
                              <p className="delivery-watta-postal-result-meta delivery-watta-postal-estimate text-sm text-[#145142]/88">
                                {d.postalAmsterdamOkFormula
                                  .replace('{{km}}', String(postalResult.distanceKm))
                                  .replace('{{amount}}', String(postalResult.estimatedDeliveryFee))}
                              </p>
                            )}
                          <p className="delivery-watta-postal-result-meta text-sm text-[#145142]/75">
                            {d.postalTariffExplain
                              .replace(
                                '{stepKm}',
                                String(
                                  postalResult.deliveryTariffStepKm ?? siteTariff.deliveryTariffStepKm
                                )
                              )
                              .replace(
                                '{stepEur}',
                                String(
                                  postalResult.deliveryTariffStepEur ?? siteTariff.deliveryTariffStepEur
                                )
                              )}
                          </p>
                          {postalResult.minimumOrderEur != null && postalResult.distanceKm != null ? (
                            <p className="delivery-watta-postal-result-meta mt-2 rounded-xl border border-[#22c55e]/40 bg-[#f0faf4] px-3 py-2 text-sm font-semibold text-[#0f3d32]">
                              {d.minOrderAfterCheck
                                .replace(/\{\{amount\}\}/g, String(postalResult.minimumOrderEur))
                                .replace(/\{\{km\}\}/g, String(postalResult.distanceKm))}
                            </p>
                          ) : null}
                        </div>
                      </>
                    )}
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
                                '{amount}',
                                String(postalResult.zoneFlatDeliveryFee)
                              )}
                            </p>
                          ) : (
                            <p className="delivery-watta-postal-result-meta delivery-watta-postal-zone-tariff">
                              {d.postalZoneTariffStandard}
                            </p>
                          )}
                          {postalResult.estimatedDeliveryFee != null && (
                            <p className="delivery-watta-postal-result-meta delivery-watta-postal-estimate font-semibold text-[#145142]">
                              {d.estimatedDeliveryApprox.replace(
                                '{amount}',
                                String(postalResult.estimatedDeliveryFee)
                              )}
                            </p>
                          )}
                          {postalResult.distanceKm != null && postalResult.distanceKm > 0 && (
                            <p className="delivery-watta-postal-result-meta text-sm">
                              {d.distanceFromKitchen.replace('{{km}}', String(postalResult.distanceKm))}
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
                          {postalResult.minimumOrderEur != null && postalResult.distanceKm != null ? (
                            <p className="delivery-watta-postal-result-meta mt-2 rounded-xl border border-[#22c55e]/40 bg-[#f0faf4] px-3 py-2 text-sm font-semibold text-[#0f3d32]">
                              {d.minOrderAfterCheck
                                .replace(/\{\{amount\}\}/g, String(postalResult.minimumOrderEur))
                                .replace(/\{\{km\}\}/g, String(postalResult.distanceKm))}
                            </p>
                          ) : null}
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
                          {postalResult.placeLabel ? (
                            <>
                              <p className="delivery-watta-postal-result-title">
                                {d.postalFoundIndexNoZonesTitle}
                              </p>
                              <p className="delivery-watta-postal-result-meta">
                                {d.postalAddressFound}: {postalResult.placeLabel}
                              </p>
                              <p className="delivery-watta-postal-result-meta text-[#145142]/85">
                                {d.postalNoZones}
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="delivery-watta-postal-result-title">{d.cityNoDeliveryYet}</p>
                              <p className="delivery-watta-postal-result-meta">{d.postalNoZones}</p>
                            </>
                          )}
                        </div>
                      </>
                    )}
                    {isOutsideNlArea(postalResult.status) && (
                      <>
                        <AlertCircle className="delivery-watta-postal-result-ico" strokeWidth={2} />
                        <div>
                          <p className="delivery-watta-postal-result-title">{d.postalOutsideAmsterdam}</p>
                          {postalResult.placeLabel && (
                            <p className="delivery-watta-postal-result-meta">{postalResult.placeLabel}</p>
                          )}
                        </div>
                      </>
                    )}
                    {postalResult.status === 'postcode_format_invalid' && (
                      <>
                        <AlertCircle className="delivery-watta-postal-result-ico" strokeWidth={2} />
                        <p className="delivery-watta-postal-result-title">{d.postalInvalidNlFormat}</p>
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
                </DeliveryFlowSection>

                <DeliveryFlowSection className="delivery-flow-section--map" ariaLabel={a.map}>
                <h2 className="contact-watta-section-title mb-2">
                  {showInteractiveZonesMap ? d.zonesMapHeroTitle : d.mapAll}
                </h2>
                {showInteractiveZonesMap ? (
                  <p className="delivery-page-section-lead mb-8 max-w-2xl">{d.mapZonesHint}</p>
                ) : null}
                <div className="delivery-designer-hub__map">
                  <div className="delivery-designer-hub__map-head">
                    <h3 className="delivery-designer-hub__map-title" aria-hidden>
                      {showInteractiveZonesMap ? d.zonesMapHeroTitle : d.mapAll}
                    </h3>
                    <div className="delivery-designer-hub__seg" role="tablist" aria-label={a.map}>
                      <button
                        type="button"
                        role="tab"
                        aria-selected={showAllCities || !selectedCity}
                        className={`delivery-designer-hub__seg-btn ${showAllCities || !selectedCity ? 'is-on' : ''}`}
                        onClick={() => setShowAllCities(true)}
                      >
                        {d.mapAll}
                      </button>
                      {selectedCity ? (
                        <button
                          type="button"
                          role="tab"
                          aria-selected={selectedCity && !showAllCities}
                          className={`delivery-designer-hub__seg-btn ${selectedCity && !showAllCities ? 'is-on' : ''}`}
                          onClick={() => setShowAllCities(false)}
                        >
                          {d.mapFocus}: {cityLabel(selectedCity)}
                        </button>
                      ) : null}
                    </div>
                  </div>
                  <div className="delivery-designer-hub__map-frame">
                    <div className="delivery-watta-map-inner">
                      {cities.length > 0 && showInteractiveZonesMap && selectedCity ? (
                        <DeliveryZonesInteractiveMap
                          zones={selectedCity.deliveryZones}
                          centerLat={selectedCity.restaurantLatitude ?? selectedCity.coordinates.lat}
                          centerLng={selectedCity.restaurantLongitude ?? selectedCity.coordinates.lng}
                          zoom={selectedCity.zoom || 12}
                          buildPopupHtml={buildZonePopupHtml}
                          onZoneSelect={handleMapZoneSelect}
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
                    <DeliveryKitchenMapBar
                      caption={d.kitchenMapCaption}
                      address={WATTA_RESTAURANT.addressLine}
                      mapsHref={mapsLinkHref}
                      openMapsLabel={d.openMaps}
                      variant="compact"
                    />
                  </div>
                </div>
                </DeliveryFlowSection>

                {selectedCity && selectedCity.deliveryZones && selectedCity.deliveryZones.length > 0 ? (
                  <DeliveryFlowSection
                    className="delivery-flow-section--zones"
                    ariaLabelledBy="zones-heading"
                  >
                    <h2 id="zones-heading" className="contact-watta-section-title mb-2">
                      {d.zonesTitle}{' '}
                      <span className="text-[#111827]">{cityLabel(selectedCity)}</span>
                    </h2>
                    <div className="delivery-designer-hub__zones">
                      <h2 className="delivery-designer-hub__zones-title" aria-hidden>
                        {d.zonesTitle} · <em>{cityLabel(selectedCity)}</em>
                      </h2>
                      <ul className="grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
                        {selectedCity.deliveryZones.map((zone, zi) => (
                          <li key={zone.id}>
                            <article className="contact-watta-channel-card h-full">
                              <div
                                className={cn(
                                  'contact-watta-channel-card__ico',
                                  zi % 2 === 1 && 'contact-watta-channel-card__ico--grad',
                                )}
                              >
                                <span
                                  className="delivery-zone-channel-card__dot"
                                  style={{ backgroundColor: zone.color }}
                                  aria-hidden
                                />
                              </div>
                              <span className="contact-watta-channel-card__label">{zone.name}</span>
                              <span className="contact-watta-channel-card__value">{zoneFeeLine(zone)}</span>
                            </article>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </DeliveryFlowSection>
                ) : null}

                <DeliveryFlowSection className="delivery-flow-section--promise">
                  <DeliveryTrustStrip d={d} variant="corporate" />
                </DeliveryFlowSection>

                <DeliveryFlowSection className="delivery-flow-section--how" ariaLabelledBy="how-heading">
                  <DeliveryExperienceBlocks d={d} variant="flow" />
                </DeliveryFlowSection>
              </div>
            ) : (
              <>

            {cities.length === 0 ? (
              <p className="delivery-watta-cities-empty" role="status">
                {lp.noActiveCities} {lp.activateInAdmin}
              </p>
            ) : cities.length > 1 ? (
              <section
                className="delivery-watta-section delivery-flow-section delivery-flow-section--city"
                aria-label={d.citiesLabel}
              >
                <div className="delivery-watta-city-row">
                  {cities.map((city) => (
                    <button
                      key={city.id}
                      type="button"
                      className={`delivery-watta-city-chip ${selectedCity?.id === city.id ? 'delivery-watta-city-chip--on' : ''}`}
                      onClick={() => handleCityChange(city.id)}
                    >
                      <span className="delivery-watta-city-chip-name">{cityLabel(city)}</span>
                      {city.deliveryZones && city.deliveryZones.length > 0 && (
                        <span className="delivery-watta-city-chip-badge">{city.deliveryZones.length}</span>
                      )}
                    </button>
                  ))}
                </div>
              </section>
            ) : null}

            <section
              className="delivery-watta-postal delivery-flow-section delivery-flow-section--calc"
              aria-labelledby="postal-heading"
            >
              <div className="delivery-watta-postal-inner">
                <div className="delivery-watta-postal-grid">
                  <div className="delivery-watta-postal-intro">
                    <p className="delivery-about-section-kicker">{d.postalLabel}</p>
                    <h2 id="postal-heading" className="delivery-about-heading">
                      {d.postalTitle}
                    </h2>
                    <p className="delivery-about-lead delivery-watta-postal-desc">{d.postalDesc}</p>
                  </div>
                  <div className="delivery-watta-postal-form-block">
                    <label className="delivery-watta-postal-label" htmlFor="delivery-address-input">
                      {d.postalLabel}
                    </label>
                    <div className="delivery-watta-postal-controls delivery-watta-postal-controls--address">
                      <textarea
                        id="delivery-address-input"
                        rows={2}
                        inputMode="text"
                        autoComplete="street-address"
                        className="delivery-watta-postal-input delivery-watta-postal-input--address"
                        placeholder={d.postalPlaceholder}
                        value={deliveryAddressQuery}
                        disabled={!selectedCity || cities.length === 0}
                        onChange={(e) => setDeliveryAddressQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            void runDeliveryAddressCheck()
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="delivery-watta-postal-btn"
                        disabled={postalChecking || !selectedCity || cities.length === 0}
                        onClick={() => void runDeliveryAddressCheck()}
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
                    {isKitchenTariffCheck(postalResult.status) && (
                      <>
                        <CheckCircle2 className="delivery-watta-postal-result-ico" strokeWidth={2} />
                        <div>
                          <p className="delivery-watta-postal-result-title">{d.postalAmsterdamOkTitle}</p>
                          {postalResult.placeLabel && (
                            <p className="delivery-watta-postal-result-meta">
                              {d.postalAddressFound}: {postalResult.placeLabel}
                            </p>
                          )}
                          {postalResult.estimatedDeliveryFee != null && (
                            <p className="delivery-watta-postal-fee-hero" aria-live="polite">
                              <span className="delivery-watta-postal-fee-hero__label">
                                {d.postalDeliveryFeeTitle}
                              </span>
                              <span className="delivery-watta-postal-fee-hero__amount">
                                {postalResult.estimatedDeliveryFee} €
                              </span>
                            </p>
                          )}
                          {postalResult.distanceKm != null && (
                            <p className="delivery-watta-postal-result-meta">
                              {d.distanceFromKitchen.replace('{{km}}', String(postalResult.distanceKm))}
                            </p>
                          )}
                          {postalResult.routeDurationMinutes != null &&
                          postalResult.routeDurationMinutes > 0 ? (
                            <p className="delivery-watta-postal-result-meta">
                              {d.postalRouteDuration.replace(
                                '{{minutes}}',
                                String(postalResult.routeDurationMinutes)
                              )}
                            </p>
                          ) : null}
                          {postalResult.distanceKm != null &&
                            postalResult.estimatedDeliveryFee != null && (
                              <p className="delivery-watta-postal-result-meta delivery-watta-postal-estimate text-sm text-[#145142]/88">
                                {d.postalAmsterdamOkFormula
                                  .replace('{{km}}', String(postalResult.distanceKm))
                                  .replace('{{amount}}', String(postalResult.estimatedDeliveryFee))}
                              </p>
                            )}
                          <p className="delivery-watta-postal-result-meta text-sm text-[#145142]/75">
                            {d.postalTariffExplain
                              .replace(
                                '{stepKm}',
                                String(
                                  postalResult.deliveryTariffStepKm ?? siteTariff.deliveryTariffStepKm
                                )
                              )
                              .replace(
                                '{stepEur}',
                                String(
                                  postalResult.deliveryTariffStepEur ?? siteTariff.deliveryTariffStepEur
                                )
                              )}
                          </p>
                          {postalResult.minimumOrderEur != null && postalResult.distanceKm != null ? (
                            <p className="delivery-watta-postal-result-meta mt-2 rounded-xl border border-[#22c55e]/40 bg-[#f0faf4] px-3 py-2 text-sm font-semibold text-[#0f3d32]">
                              {d.minOrderAfterCheck
                                .replace(/\{\{amount\}\}/g, String(postalResult.minimumOrderEur))
                                .replace(/\{\{km\}\}/g, String(postalResult.distanceKm))}
                            </p>
                          ) : null}
                        </div>
                      </>
                    )}
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
                                '{amount}',
                                String(postalResult.zoneFlatDeliveryFee)
                              )}
                            </p>
                          ) : (
                            <p className="delivery-watta-postal-result-meta delivery-watta-postal-zone-tariff">
                              {d.postalZoneTariffStandard}
                            </p>
                          )}
                          {postalResult.estimatedDeliveryFee != null && (
                            <p className="delivery-watta-postal-result-meta delivery-watta-postal-estimate font-semibold text-[#145142]">
                              {d.estimatedDeliveryApprox.replace(
                                '{amount}',
                                String(postalResult.estimatedDeliveryFee)
                              )}
                            </p>
                          )}
                          {postalResult.distanceKm != null && postalResult.distanceKm > 0 && (
                            <p className="delivery-watta-postal-result-meta text-sm">
                              {d.distanceFromKitchen.replace('{{km}}', String(postalResult.distanceKm))}
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
                          {postalResult.minimumOrderEur != null && postalResult.distanceKm != null ? (
                            <p className="delivery-watta-postal-result-meta mt-2 rounded-xl border border-[#22c55e]/40 bg-[#f0faf4] px-3 py-2 text-sm font-semibold text-[#0f3d32]">
                              {d.minOrderAfterCheck
                                .replace(/\{\{amount\}\}/g, String(postalResult.minimumOrderEur))
                                .replace(/\{\{km\}\}/g, String(postalResult.distanceKm))}
                            </p>
                          ) : null}
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
                          {postalResult.placeLabel ? (
                            <>
                              <p className="delivery-watta-postal-result-title">
                                {d.postalFoundIndexNoZonesTitle}
                              </p>
                              <p className="delivery-watta-postal-result-meta">
                                {d.postalAddressFound}: {postalResult.placeLabel}
                              </p>
                              <p className="delivery-watta-postal-result-meta text-[#145142]/85">
                                {d.postalNoZones}
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="delivery-watta-postal-result-title">{d.cityNoDeliveryYet}</p>
                              <p className="delivery-watta-postal-result-meta">{d.postalNoZones}</p>
                            </>
                          )}
                        </div>
                      </>
                    )}
                    {isOutsideNlArea(postalResult.status) && (
                      <>
                        <AlertCircle className="delivery-watta-postal-result-ico" strokeWidth={2} />
                        <div>
                          <p className="delivery-watta-postal-result-title">{d.postalOutsideAmsterdam}</p>
                          {postalResult.placeLabel && (
                            <p className="delivery-watta-postal-result-meta">{postalResult.placeLabel}</p>
                          )}
                        </div>
                      </>
                    )}
                    {postalResult.status === 'postcode_format_invalid' && (
                      <>
                        <AlertCircle className="delivery-watta-postal-result-ico" strokeWidth={2} />
                        <p className="delivery-watta-postal-result-title">{d.postalInvalidNlFormat}</p>
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

            <section className="delivery-watta-map-section" aria-label={a.map}>
              {showInteractiveZonesMap && (
                <>
                  <h2 className="delivery-watta-zones-map-hero-title">{d.zonesMapHeroTitle}</h2>
                  <p className="delivery-watta-map-zones-hint">{d.mapZonesHint}</p>
                </>
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
                      centerLat={
                        selectedCity.restaurantLatitude ?? selectedCity.coordinates.lat
                      }
                      centerLng={
                        selectedCity.restaurantLongitude ?? selectedCity.coordinates.lng
                      }
                      zoom={selectedCity.zoom || 12}
                      buildPopupHtml={buildZonePopupHtml}
                      onZoneSelect={handleMapZoneSelect}
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
                <DeliveryKitchenMapBar
                  caption={d.kitchenMapCaption}
                  address={WATTA_RESTAURANT.addressLine}
                  mapsHref={mapsLinkHref}
                  openMapsLabel={d.openMaps}
                  variant="legacy"
                />
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
              </>
            )}

            {!standaloneShowcase && <DeliveryExperienceBlocks d={d} variant="default" />}
          </>
        )}
      </div>
    </div>
  )

  if (embedInMenu) {
    return (
      <>
        {deliveryEmbedHeroStack}
        {deliveryPageBody}
      </>
    )
  }

  return (
    <div
      id="delivery-page-container"
      className="menu-page-web delivery-page-web contact-page-web watta-delivery-page watta-delivery-page-about watta-site-hero-page-web relative flex w-full max-w-[100vw] min-w-0 flex-1 flex-col overflow-x-hidden bg-white pb-24"
    >
      <div className="delivery-page-home-flow w-full">
        <div className="delivery-page-intro-web delivery-page-intro-web--video w-full shrink-0">
          {deliveryStandaloneHeroStack}
        </div>
        <div className="delivery-page-tools-flow">{deliveryPageBody}</div>
      </div>
    </div>
  )
}
