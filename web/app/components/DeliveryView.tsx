'use client'

import dynamic from 'next/dynamic'
import type { Ref } from 'react'
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { DeliveryExperienceBlocks } from './DeliveryExperienceBlocks'
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
  getExplicitSavedCityId,
  isCityChoiceExplicit,
  persistUserCityChoice,
} from '@/lib/wattaSiteLocalePrefs'
import { DELIVERY_HERO_VIDEO_SOURCES } from '@/lib/deliveryHeroVideoSources'
import { bindHeroVideoAutoplay } from '@/lib/bindHeroVideoAutoplay'
import { bindHeroVideoMirrorToCanvas } from '@/lib/heroVideoMirrorToCanvas'
import { getHeroVideoTouchLikeViewport, subscribeHeroVideoNativeOnDesktop } from '@/lib/heroVideoNativeDesktop'
import WattaHeroMarqueeBar from './WattaHeroMarqueeBar'
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
  | 'outside_amsterdam'
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
  const [postalCode, setPostalCode] = useState('')
  const [postalChecking, setPostalChecking] = useState(false)
  const [postalResult, setPostalResult] = useState<DeliveryCheckResult | null>(null)
  const [siteTariff, setSiteTariff] = useState({ defaultDeliveryFee: 50, freeDeliveryThreshold: 1000 })

  const [deliveryHeroVideoFailed, setDeliveryHeroVideoFailed] = useState(false)
  const [deliveryHeroVideoIndex, setDeliveryHeroVideoIndex] = useState(0)
  const deliveryHeroVideoRef = useRef<HTMLVideoElement | null>(null)
  const deliveryHeroVideoCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const deliveryHeroVideoSrc =
    DELIVERY_HERO_VIDEO_SOURCES[deliveryHeroVideoIndex] ?? DELIVERY_HERO_VIDEO_SOURCES[0]

  useEffect(() => {
    if (deliveryHeroVideoFailed) return
    const video = deliveryHeroVideoRef.current
    const canvas = deliveryHeroVideoCanvasRef.current
    if (!video || !canvas) return
    const stack = video.closest('.welcome-hero-video-stack-web')
    let offMirror: () => void = () => {}
    const armMirror = (preferNative: boolean) => {
      offMirror()
      offMirror = () => {}
      if (!preferNative) {
        offMirror = bindHeroVideoMirrorToCanvas(video, canvas)
      }
    }
    const unsubNative = subscribeHeroVideoNativeOnDesktop(armMirror)
    const offAutoplay = bindHeroVideoAutoplay(video, {
      extendedRetries: true,
      blockInteractionRoot:
        !getHeroVideoTouchLikeViewport() && stack instanceof HTMLElement ? stack : null,
    })
    return () => {
      unsubNative()
      offMirror()
      offAutoplay()
    }
  }, [deliveryHeroVideoSrc, deliveryHeroVideoFailed])

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
          const chosen = resolveCityFromSavedId(formattedCities, getExplicitSavedCityId())
          setSelectedCity(chosen)
          if (chosen) {
            if (isCityChoiceExplicit()) persistUserCityChoice(Number(chosen.id))
            else applyDefaultCityToStorage(Number(chosen.id))
          }
        } else {
          setCities(defaultCities)
          setSelectedCity(
            resolveCityFromSavedId(defaultCities, getExplicitSavedCityId()) ??
              defaultCities[0] ??
              null,
          )
        }
      } catch (error) {
        console.error('Ошибка загрузки данных доставки:', error)
        setCities(defaultCities)
        setSelectedCity(
          resolveCityFromSavedId(defaultCities, getExplicitSavedCityId()) ?? defaultCities[0] ?? null,
        )
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const syncCityFromStorage = useCallback(() => {
    if (typeof window === 'undefined' || !window.localStorage || cities.length === 0) return
    const chosen = resolveCityFromSavedId(cities, getExplicitSavedCityId())
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

  const conditionsCheckSummary = useMemo(() => {
    if (!postalResult) return null
    const ok =
      (postalResult.status === 'amsterdam_ok' || postalResult.status === 'inside') &&
      postalResult.minimumOrderEur != null &&
      postalResult.distanceKm != null
    if (!ok) return null
    return d.minOrderAfterCheck
      .replace(/\{\{amount\}\}/g, String(postalResult.minimumOrderEur))
      .replace(/\{\{km\}\}/g, String(postalResult.distanceKm))
  }, [postalResult, d.minOrderAfterCheck])

  const deliveryHeroHeader = (
    <header className={`delivery-watta-hero${embedInMenu ? '' : ' delivery-watta-hero--split'}`}>
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
  )

  const deliveryHeroVideoBlock = (
    <section
      ref={menuWelcomeHeroRef}
      className={`welcome-hero-section-web menu-snap-section-welcome-web${embedInMenu ? ' delivery-page-hero-embed-web' : ' delivery-page-hero-standalone-web delivery-page-hero-split-panel-web'}`}
      aria-label={a.heroVideo}
    >
      <div className="welcome-hero-video-fill-web">
        {deliveryHeroVideoFailed ? (
          <div
            className="welcome-video-native-web welcome-hero-fallback-image-web"
            style={{ backgroundImage: "url('/watta-sushi.jpg')" }}
            role="img"
            aria-hidden
          />
        ) : (
          <div className="welcome-hero-video-stack-web">
            <video
              key={deliveryHeroVideoSrc}
              ref={deliveryHeroVideoRef}
              className="welcome-video-native-web welcome-hero-video-source-for-canvas-web"
              src={deliveryHeroVideoSrc}
              autoPlay
              muted
              loop
              playsInline
              controls={false}
              disablePictureInPicture
              preload="auto"
              tabIndex={-1}
              aria-hidden
              onContextMenu={(e) => e.preventDefault()}
              onError={() => {
                setDeliveryHeroVideoIndex((prev) => {
                  if (prev < DELIVERY_HERO_VIDEO_SOURCES.length - 1) return prev + 1
                  setDeliveryHeroVideoFailed(true)
                  return prev
                })
              }}
              onEnded={(e) => {
                const el = e.currentTarget
                el.currentTime = 0
                void el.play()
              }}
            />
            <canvas
              ref={deliveryHeroVideoCanvasRef}
              className="welcome-hero-video-canvas-mirror-web"
              aria-hidden
            />
            <div
              className="welcome-hero-video-input-shield-web"
              aria-hidden
              role="presentation"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
              }}
              onAuxClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
              }}
              onContextMenu={(e) => {
                e.preventDefault()
                e.stopPropagation()
              }}
              onDoubleClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
              }}
            />
          </div>
        )}
      </div>
    </section>
  )

  return (
    <>
      {embedInMenu ? (
        deliveryHeroVideoBlock
      ) : (
        <div className="delivery-page-hero-adaptive-shell menu-page-web">
          <div className="delivery-page-hero-adaptive-grid">
            <div className="delivery-page-hero-ad-cell delivery-page-hero-ad-cell--video">
              <p className="delivery-page-hero-split-rail" aria-hidden>
                {d.splitHeroVideoRail}
              </p>
              {deliveryHeroVideoBlock}
            </div>
            <div className="delivery-page-hero-ad-cell delivery-page-hero-ad-cell--marquee">
              <div className="home-hero-after-marquee-wrap-web w-full shrink-0">
                <WattaHeroMarqueeBar />
              </div>
            </div>
            <div className="delivery-page-hero-ad-cell delivery-page-hero-ad-cell--copy">
              {deliveryHeroHeader}
            </div>
          </div>
        </div>
      )}

    <div className={`delivery-watta-page relative${embedInMenu ? ' delivery-watta-page--embed' : ''}`}>
      <div className="relative z-[2]">
        {embedInMenu && deliveryHeroHeader}

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
                    {postalResult.status === 'amsterdam_ok' && (
                      <>
                        <CheckCircle2 className="delivery-watta-postal-result-ico" strokeWidth={2} />
                        <div>
                          <p className="delivery-watta-postal-result-title">{d.postalAmsterdamOkTitle}</p>
                          {postalResult.placeLabel && (
                            <p className="delivery-watta-postal-result-meta">
                              {d.postalAddressFound}: {postalResult.placeLabel}
                            </p>
                          )}
                          {postalResult.distanceKm != null &&
                            postalResult.estimatedDeliveryFee != null && (
                              <p className="delivery-watta-postal-result-meta delivery-watta-postal-estimate font-semibold text-[#145142]">
                                {d.postalAmsterdamOkFormula
                                  .replace('{{km}}', String(postalResult.distanceKm))
                                  .replace('{{amount}}', String(postalResult.estimatedDeliveryFee))}
                              </p>
                            )}
                          <p className="delivery-watta-postal-result-meta text-sm text-[#145142]/80">
                            {d.tariffPerKm}: <strong>2 €</strong> · {d.tariffBase}: <strong>0 €</strong>
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
                                '{{amount}}',
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
                                '{{amount}}',
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
                    {postalResult.status === 'outside_amsterdam' && (
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
                <div className="delivery-watta-map-footer">
                  <p className="delivery-watta-kitchen-caption">
                    <MapPin className="delivery-watta-kitchen-caption-ico" strokeWidth={2.25} aria-hidden />
                    <span>
                      <span className="delivery-watta-kitchen-caption-label">{d.kitchenMapCaption}</span>
                      <span className="delivery-watta-kitchen-caption-addr">{WATTA_RESTAURANT.addressLine}</span>
                    </span>
                  </p>
                  <a
                    href={mapsLinkHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="delivery-watta-maps-link"
                  >
                    {d.openMaps} ↗
                  </a>
                </div>
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

            <DeliveryExperienceBlocks
              d={d}
              kitchenAddressLine={WATTA_RESTAURANT.addressLine}
              conditionsCheckSummary={conditionsCheckSummary}
            />
          </>
        )}
      </div>
    </div>
    </>
  )
}
