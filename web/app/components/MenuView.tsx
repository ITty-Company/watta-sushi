'use client'

import React, { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { useLanguage } from '../context/LanguageContext'
import WattaHeroMarqueeBar from './WattaHeroMarqueeBar'
import WattaStickyChromeLayout from './WattaStickyChromeLayout'
import WattaGlobalSiteHeader from './WattaGlobalSiteHeader'
import { WattaMenuCategoryStrip } from './WattaMenuCategoryStrip'
import PhoneView from './PhoneView'
import { NotificationsView } from './NotificationsView'
import Footer from './Footer'
import NavigationSidebar from './NavigationSidebar'
import { HomeCategoryProductRail } from './HomeCategoryProductRail'
import { CinematicFooter, type CinematicFooterAdminProduct } from '@/components/ui/motion-footer'
import {
  MENU_BROWSE_RETURN_KEY,
  parseMenuBrowseReturn,
  shouldRestoreMenuBrowse,
  writeMenuBrowseReturn,
} from '@/lib/menuBrowseRestore'
import { WATTA_HOME_REQUEST_SCROLL_TO_CAT } from '@/lib/fullMenuCategoryNav'
import { createRafScrollListener, publishMenuCategoryHighlight } from '@/lib/scrollSync'
import { filterNonAggregateMenuCategories } from '@/lib/menuCategoryFilters'
import { bindHeroVideoAutoplay } from '@/lib/bindHeroVideoAutoplay'
import { buildMenuCategoriesFromApi, parseCategoriesCacheJson } from '@/lib/buildMenuCategoriesFromApi'
import { getMenuCategoryDisplayName } from '@/lib/i18n/getMenuCategoryDisplayName'
import { menuCategoriesSessionKey, menuItemsSessionKey } from '@/lib/i18n/menuDataCacheBust'
import type { WattaLanguage } from '@/lib/i18n/language'
import { MENU_CATEGORY_EMOJI, MENU_CATEGORY_FALLBACK_SLUGS } from '@/lib/menuCategoryFallback'
import { parseHomeHeroVideoUrlsFromApi } from '@/lib/homeHeroVideoSettings'
import { formatProductWeightSubtitle } from '@/lib/i18n/parseProductSpecsFromDescription'
import {
  buildHomeHeroPlaylist,
  buildHomeHeroVideoSources,
  WATTA_HOME_HERO_VIDEO_UPDATED_EVENT,
} from '@/lib/wattaHeroVideo'
import { cityIdPreferAmsterdam, resolveCityFromSavedId } from '@/lib/wattaPreferredDefaultCity'

/**
 * Усе, що показується тільки при `activePage !== null` — тягнемо `next/dynamic` без SSR.
 * Раніше всі ці екрани сиділи в основному бандлі головної (десятки КБ JS, recharts тощо).
 * Тепер при першому заході на `/` користувач отримує лише `MenuView` + видимі чанки.
 */
const ProfileView = dynamic(() => import('./ProfileView'), { ssr: false })
const DeliveryView = dynamic(() => import('./DeliveryView'), { ssr: false })
const AdminView = dynamic(() => import('./AdminView'), { ssr: false })
const PromotionsView = dynamic(() => import('./PromotionsView'), { ssr: false })
const CartView = dynamic(() => import('./CartView'), { ssr: false })
const PromotionsDetailView = dynamic(() => import('./PromotionsDetailView'), { ssr: false })

/** Скільки карток показувати в горизонтальній стрічці на головній; решта — через «Подивитися всі» на /menu */
const HOME_CATEGORY_RAIL_PREVIEW_MAX = 12

function readCinematicRailScrolls(): { rec: number; promo: number } {
  if (typeof document === 'undefined') return { rec: 0, promo: 0 }
  const root = document.getElementById('menu-cinematic-block')
  if (!root) return { rec: 0, promo: 0 }
  const rec = root.querySelector<HTMLElement>('[data-cinematic-rail="recommended"]')
  const promo = root.querySelector<HTMLElement>('[data-cinematic-rail="promo"]')
  return { rec: rec?.scrollLeft ?? 0, promo: promo?.scrollLeft ?? 0 }
}

function queryGlobalCategoriesPanel(): HTMLDivElement | null {
  if (typeof document === 'undefined') return null
  return document.querySelector<HTMLDivElement>('.watta-full-menu-sticky-chrome .categories-panel-web')
}

function cinematicWeightSubtitle(
  desc: string,
  weightFallback: string,
  piecesFallback: string,
  lang: WattaLanguage,
): string {
  return formatProductWeightSubtitle(desc, weightFallback, piecesFallback, lang)
}

import { 
  Menu,       
  Heart,      
  User,       
  ArrowLeft,
  ChevronLeft, 
  ChevronRight,
} from 'lucide-react'
// --- ТИПЫ ДАННЫХ ---
interface City {
  id: string
  name: string
  coordinates: { lat: number; lng: number }
  zoom: number
  deliveryZones: DeliveryZone[]
}

interface DeliveryZone {
  id: string
  name: string
  color: string
  coordinates: { lat: number; lng: number }[]
}

const defaultCities: City[] = [
  {
    id: 'amsterdam',
    name: 'Amsterdam',
    coordinates: { lat: 52.3676, lng: 4.9041 },
    zoom: 12,
    deliveryZones: [],
  },
]

interface MenuItem {
  id: number
  name: string
  description: string
  price: number
  category: string
  categorySlug?: string // Slug категории для фильтрации
  categoryId?: number // ID категории
  subcategory?: string
  emoji: string
  isTop?: boolean
  imageUrl?: string
  /** З адмінки: знижка % */
  promoDiscountPercent?: number
  /** З адмінки: блок «рекомендовані» */
  isHomeHit?: boolean
  /** Блок «Новинки» на /menu */
  isMenuNew?: boolean
  recommendOrder?: number
  /** category.allowRecommendations !== false */
  allowRecommendations?: boolean
}

interface MenuCategory {
  id: string
  key: string
  slug?: string // Добавляем slug для более точной фильтрации
  name: string
  emoji: string
  subcategories: MenuSubcategory[]
}

interface MenuSubcategory {
  id: string
  name: string
  items: MenuItem[]
}

interface User {
  id: number | string
  name?: string
  email: string
  phone?: string
  address?: string
  role?: string
  createdAt?: string
}

/** Фонові банери з `web/public` — якщо API повернув [] (часто прод без рядків у таблиці Banner). */
const DEFAULT_HOME_BANNERS: Array<{
  id: number
  title_ru: string
  title_ua?: string
  title_en?: string
  title_nl?: string
  imageUrl: string
  order: number
  isActive: boolean
  focalX?: number
  focalY?: number
}> = [
  {
    id: -1,
    title_ru: 'Watta Sushi',
    title_ua: 'Watta Sushi',
    title_en: 'Watta Sushi',
    title_nl: 'Watta Sushi',
    imageUrl: '/watta-sushi.jpg',
    focalX: 50,
    focalY: 36,
    order: 0,
    isActive: true,
  },
  {
    id: -2,
    title_ru: 'Свежие роллы и суши',
    title_ua: 'Свіжі роли та суші',
    title_en: 'Fresh rolls & sushi',
    title_nl: 'Verse rolls en sushi',
    imageUrl: '/sushi.png',
    focalX: 50,
    focalY: 48,
    order: 1,
    isActive: true,
  },
  {
    id: -3,
    title_ru: 'Качество и доставка',
    title_ua: 'Якість і доставка',
    title_en: 'Quality & delivery',
    title_nl: 'Kwaliteit & bezorging',
    imageUrl: '/profile-background.jpg',
    focalX: 50,
    focalY: 42,
    order: 2,
    isActive: true,
  },
]

/** Головна: ocean hero + запасні (`wattaHeroVideo` — окремо від сторінки `/menu`). */

function WelcomeHeroSection({
  sectionRef,
  heroVideoFailed,
  setHeroVideoSourceIndex,
  setHeroVideoFailed,
  heroVideoRef,
  heroVideoCanvasRef,
  heroVideoSrc,
  videoSources,
  playlistLength,
  children,
}: {
  sectionRef: React.Ref<HTMLElement>
  heroVideoFailed: boolean
  setHeroVideoSourceIndex: React.Dispatch<React.SetStateAction<number>>
  setHeroVideoFailed: React.Dispatch<React.SetStateAction<boolean>>
  heroVideoRef: React.Ref<HTMLVideoElement>
  heroVideoCanvasRef: React.RefObject<HTMLCanvasElement>
  heroVideoSrc: string
  videoSources: readonly string[]
  playlistLength: number
  children?: React.ReactNode
}) {
  const heroVideoLoop = playlistLength <= 1
  const { t } = useLanguage()
  return (
    <section
      ref={sectionRef}
      className="watta-home-hero-as-card-web welcome-hero-section-web menu-snap-section-welcome-web menu-welcome-hero-tight-web shrink-0"
      aria-label={t.siteAria.heroVideo}
    >
      <div className="welcome-hero-video-fill-web">
        {heroVideoFailed ? (
          <div className="welcome-hero-video-fail-wrap-web relative w-full shrink-0">
            <div
              className="welcome-video-native-web welcome-hero-fallback-image-web"
              style={{ backgroundColor: 'var(--watta-page-fill, #ffffff)' }}
              role="img"
              aria-hidden
            />
            {children}
          </div>
        ) : (
          <div className="welcome-hero-video-stack-web">
            <video
              key={heroVideoSrc}
              ref={heroVideoRef}
              className="welcome-video-native-web watta-home-hero-native-video"
              width={1920}
              height={1080}
              poster="/watta-sushi.jpg"
              src={heroVideoSrc}
              autoPlay
              muted
              loop={heroVideoLoop}
              playsInline
              controls={false}
              disablePictureInPicture
              disableRemotePlayback
              preload="auto"
              // @ts-expect-error fetchPriority для Chromium (працює, але типи React 18.2 не знають)
              fetchPriority="high"
              tabIndex={-1}
              aria-hidden
              onContextMenu={(e) => e.preventDefault()}
              onError={() => {
                setHeroVideoSourceIndex((prev) => {
                  if (prev < videoSources.length - 1) return prev + 1
                  setHeroVideoFailed(true)
                  return prev
                })
              }}
              onEnded={() => {
                if (playlistLength <= 1) return
                setHeroVideoSourceIndex((prev) => (prev + 1) % playlistLength)
              }}
            />
            <canvas
              ref={heroVideoCanvasRef}
              className="welcome-hero-video-canvas-mirror-web"
              aria-hidden
            />
            {/* Поверх canvas: жодні кліки/жести не доходять до прихованого <video> */}
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
            {children}
          </div>
        )}
      </div>
    </section>
  )
}

export default function MenuView() {
  const router = useRouter()
  const pathname = usePathname()
  const navigateToCategoryPage = useCallback(
    (categoryKey: string) => {
      router.push(`/menu/category/${encodeURIComponent(categoryKey)}`)
    },
    [router]
  )
  // ИСПОЛЬЗУЕМ getLocalized из контекста
  const { t, language, getLocalized } = useLanguage()
  const a = t.siteAria
  const welcomeHeroSectionRef = useRef<HTMLElement | null>(null)
  const marqueeBarRef = useRef<HTMLDivElement | null>(null)
  const [activePage, setActivePage] = useState<string | null>(null)
  /** ≤768px: головне меню без оверлею — категорії + hero в одному блоці під шапкою (відео одразу після білої панелі). */
  const [isNarrowViewport, setIsNarrowViewport] = useState(false)
  /** ≤767px: «Наші хіти» вертикальним стеком; з 768 — горизонтальна стрічка (3+½ на планшеті) */
  const [isPhoneViewport, setIsPhoneViewport] = useState(false)
  /** ≤1024px: вступ «Доставка суші…» над відео; на десктопі — під відео */
  const [homeIntroBeforeHero, setHomeIntroBeforeHero] = useState(false)

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(max-width: 768px)')
    const apply = () => setIsNarrowViewport(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(max-width: 767px)')
    const apply = () => setIsPhoneViewport(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(max-width: 1024px)')
    const apply = () => setHomeIntroBeforeHero(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.dispatchEvent(
      new CustomEvent('wattaHomeDeliveryEmbed', { detail: { active: activePage === 'delivery' } }),
    )
  }, [activePage])

  const scrollMainContentToTop = useCallback(() => {
    if (typeof document === 'undefined') return
    document.querySelector<HTMLElement>('.content-web--watta-craft')?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const scrollToHomeCatalogCategory = useCallback((categoryKey: string) => {
    if (typeof document === 'undefined') return
    const root = document.querySelector<HTMLElement>('.content-web--watta-craft')
    const el = document.getElementById(`home-menu-cat-${categoryKey}`)
    if (!root || !el) return
    const w = typeof window !== 'undefined' ? window.innerWidth : 1200
    /* Збіг зі scroll-padding: ≤768 — шапка+категорії в fixed-chrome (148), планшет 118, широкий 168 */
    const headerOffset = w <= 768 ? 148 : w <= 1024 ? 118 : 168
    const top = el.getBoundingClientRect().top + root.scrollTop - headerOffset
    root.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
  }, [])

  /** Смуга шапка + категорії на вузьких екранах: завжди та сама, що на ноуті (без «фази відео» без категорій) */
  useEffect(() => {
    const el = document.querySelector<HTMLElement>('.content-web--watta-craft')
    if (!el) return
    const mqNarrow = window.matchMedia('(max-width: 768px)')

    const apply = () => {
      if (!mqNarrow.matches) {
        el.style.removeProperty('scroll-padding-top')
        return
      }
      /* Шапка + категорії завжди в fixed-chrome — той самий резерв, що й без «вузької смуги» */
      el.style.scrollPaddingTop = 'calc(148px + env(safe-area-inset-top, 0px))'
    }

    apply()
    mqNarrow.addEventListener('change', apply)
    return () => {
      mqNarrow.removeEventListener('change', apply)
      el.style.removeProperty('scroll-padding-top')
    }
  }, [isNarrowViewport, activePage])

  const [selectedPromoId, setSelectedPromoId] = useState<number | null>(null)
  // --- ГОРОДА ДОСТАВКИ ---
  const [deliveryCities, setDeliveryCities] = useState<
    { id: number; name: string; name_ua?: string; name_en?: string; name_nl?: string }[]
  >([])
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null)

  const [bannerInterval, setBannerInterval] = useState(5000)
  const [homeHeroVideoUrls, setHomeHeroVideoUrls] = useState<string[]>([])
  const homeHeroPlaylist = useMemo(
    () => buildHomeHeroPlaylist(homeHeroVideoUrls),
    [homeHeroVideoUrls],
  )
  const heroVideoSources = useMemo(
    () => buildHomeHeroVideoSources(homeHeroVideoUrls),
    [homeHeroVideoUrls],
  )

  /** Якщо mp4 немає на сервері — показуємо постер-зображення */
  const [heroVideoFailed, setHeroVideoFailed] = useState(false)
  const [heroVideoSourceIndex, setHeroVideoSourceIndex] = useState(0)
  const heroVideoRef = useRef<HTMLVideoElement | null>(null)
  const heroVideoCanvasRef = useRef<HTMLCanvasElement>(null)

  const heroVideoSrc =
    homeHeroPlaylist[heroVideoSourceIndex] ??
    heroVideoSources[heroVideoSourceIndex] ??
    heroVideoSources[0]
  const heroVideoShouldLoop = homeHeroPlaylist.length <= 1

  const homeNarrowStripHero = isNarrowViewport && activePage === null

  const homeAfterHeroCityDisplay = useMemo(() => {
    const list = deliveryCities
    if (!list.length) return t.menuView.homeAfterHeroIntroCityPlaceholder
    const id = selectedCityId ?? cityIdPreferAmsterdam(list) ?? list[0].id
    const city = list.find((c) => c.id === id) ?? list[0]
    return getLocalized(city, 'name') || city.name
  }, [deliveryCities, selectedCityId, getLocalized, t.menuView.homeAfterHeroIntroCityPlaceholder, language])

  const fillHomeAfterHeroCity = useCallback(
    (template: string) => template.replace(/\{\{city\}\}/g, homeAfterHeroCityDisplay),
    [homeAfterHeroCityDisplay],
  )

  useEffect(() => {
    setHeroVideoSourceIndex(0)
    setHeroVideoFailed(false)
  }, [activePage, homeHeroVideoUrls])

  useLayoutEffect(() => {
    if (heroVideoFailed) return
    const video = heroVideoRef.current
    if (!video) return
    const kick = () => {
      try {
        video.defaultMuted = true
        video.muted = true
        video.volume = 0
        video.playsInline = true
        video.preload = 'auto'
        void video.play().catch(() => {})
      } catch {
        /* ignore */
      }
    }
    /* Серія nudge: SPA-back / bfcache часто лишає video у paused — одного play() мало.
       Тримаємо короткі retry до 2s, далі підхопить watchdog у bindHeroVideoAutoplay. */
    kick()
    const delays = [16, 60, 150, 400, 900, 1800]
    const ids = delays.map((ms) => window.setTimeout(kick, ms))
    return () => ids.forEach((id) => window.clearTimeout(id))
  }, [heroVideoSrc, heroVideoFailed, activePage])

  useEffect(() => {
    if (heroVideoFailed) return
    const video = heroVideoRef.current
    if (!video) return
    const stack = video.closest('.welcome-hero-video-stack-web')

    /*
     * Головна (MenuView): завжди нативне <video> без canvas-mirror.
     * На широкому десктопі mirror + opacity 0.001 на <video> іноді лишав лише
     * постер / один кадр — виглядає як «немає відео», хоча `play()` ок.
     * Ken Burns тут вимикаємо на користь стабільного руху кадрів.
     */
    const offMirror = () => {}
    const offAutoplay = bindHeroVideoAutoplay(video, {
      extendedRetries: true,
      blockInteractionRoot: stack instanceof HTMLElement ? stack : null,
      loop: heroVideoShouldLoop,
    })
    return () => {
      offMirror()
      offAutoplay()
    }
  }, [heroVideoSrc, heroVideoFailed, activePage, heroVideoShouldLoop])

  useEffect(() => {
    if (typeof window === 'undefined' || !window.localStorage) return

    let savedCityId: number | null = null
    const savedRaw = localStorage.getItem('selectedCityId')
    if (savedRaw) {
      const parsed = parseInt(savedRaw, 10)
      if (Number.isFinite(parsed) && parsed > 0) {
        savedCityId = parsed
        setSelectedCityId(parsed)
      }
    }

    const pickCityForList = (
      list: {
        id: number
        name?: string
        name_en?: string
        name_nl?: string
        name_ua?: string
        country?: { code?: string }
      }[],
    ) => {
      if (!list.length) return
      const resolved = resolveCityFromSavedId(list, savedCityId)
      const pick = resolved?.id ?? cityIdPreferAmsterdam(list) ?? list[0].id
      setSelectedCityId(pick)
      localStorage.setItem('selectedCityId', String(pick))
    }

    // Кэш городов: session + localStorage — переживает перезагрузку вкладки и перезапуск браузера (тот же origin)
    const cacheKey = 'cities_cache'
    const persistKey = 'watta_cities_cache'
    const persistTimeKey = 'watta_cities_cache_time'
    const cached = sessionStorage.getItem(cacheKey) || localStorage.getItem(persistKey)
    const cacheTimeRaw = sessionStorage.getItem(`${cacheKey}_time`) || localStorage.getItem(persistTimeKey)
    const now = Date.now()

    if (cached && cacheTimeRaw && now - parseInt(cacheTimeRaw, 10) < 10 * 60 * 1000) {
      try {
        const data = JSON.parse(cached)
        setDeliveryCities(data || [])
        pickCityForList(data || [])
        return
      } catch {
        /* кэш повреждён — грузим с сервера */
      }
    }

    fetch('/api/cities', {
      headers: {
        'Cache-Control': 'max-age=600' // 10 минут кэша
      }
    })
      .then((res) => {
        if (!res.ok) {
          console.error('Ошибка загрузки городов:', res.status, res.statusText)
          return []
        }
        return res.json()
      })
      .then((data) => {
        const t = Date.now().toString()
        sessionStorage.setItem(cacheKey, JSON.stringify(data))
        sessionStorage.setItem(`${cacheKey}_time`, t)
        try {
          localStorage.setItem(persistKey, JSON.stringify(data))
          localStorage.setItem(persistTimeKey, t)
        } catch {
          /* quota */
        }

        setDeliveryCities(data || [])
        pickCityForList(data || [])
      })
      .catch((err) => {
        console.error('Ошибка загрузки городов:', err)
        const fallback = localStorage.getItem(persistKey) || sessionStorage.getItem(cacheKey)
        if (fallback) {
          try {
            const data = JSON.parse(fallback)
            setDeliveryCities(data || [])
            pickCityForList(data || [])
            return
          } catch {
            /* ignore */
          }
        }
        setDeliveryCities([])
      })
  }, [])

  useEffect(() => {
    const applySettings = (data: {
      bannerInterval?: number
      homeHeroVideoUrl?: string
      homeHeroVideoUrls?: string[]
    }) => {
      if (data.bannerInterval) setBannerInterval(data.bannerInterval)
      setHomeHeroVideoUrls(parseHomeHeroVideoUrlsFromApi(data))
    }
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings', { cache: 'no-store' })
        if (res.ok) applySettings(await res.json())
      } catch (e) {
        console.error('Error loading settings', e)
      }
    }
    const onHeroUpdated = (ev: Event) => {
      const detail = (ev as CustomEvent<{ url?: string; urls?: string[] }>).detail
      const fromEvent = parseHomeHeroVideoUrlsFromApi({
        homeHeroVideoUrls: detail?.urls,
        homeHeroVideoUrl: detail?.url,
      })
      if (fromEvent.length > 0) setHomeHeroVideoUrls(fromEvent)
      else void fetchSettings()
    }
    void fetchSettings()
    window.addEventListener(WATTA_HOME_HERO_VIDEO_UPDATED_EVENT, onHeroUpdated)
    return () => window.removeEventListener(WATTA_HOME_HERO_VIDEO_UPDATED_EVENT, onHeroUpdated)
  }, [])

  // --- ЗАГРУЗКА БАННЕРОВ ---
  interface Banner {
    id: number
    title_ru: string
    title_ua?: string
    title_en?: string
    title_nl?: string
    imageUrl: string
    order: number
    isActive: boolean
    focalX?: number
    focalY?: number
  }
  
  const [banners, setBanners] = useState<Banner[]>([])
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0)

  const displayBanners = useMemo(
    () => (banners.length > 0 ? banners : DEFAULT_HOME_BANNERS),
    [banners]
  )

  useEffect(() => {
    setCurrentBannerIndex((idx) => {
      if (displayBanners.length === 0) return 0
      return idx >= displayBanners.length ? 0 : idx
    })
  }, [displayBanners.length])

  // Функции переключения (НОВОЕ)
  const nextBanner = () => {
    if (displayBanners.length <= 1) return
    setCurrentBannerIndex((prev) => (prev + 1) % displayBanners.length)
  }

  const prevBanner = () => {
    if (displayBanners.length <= 1) return
    setCurrentBannerIndex((prev) => (prev - 1 + displayBanners.length) % displayBanners.length)
  }

  // Функция загрузки данных
  const loadBanners = useCallback(() => {
    const sessionKey = 'banners'
    const persistKey = 'watta_banners_v1'
    const persistTimeKey = 'watta_banners_v1_time'
    const CACHE_TTL = 5 * 60 * 1000

    const readPersisted = (): { data: Banner[]; time: number } | null => {
      if (typeof window === 'undefined') return null
      try {
        const raw =
          localStorage.getItem(persistKey) ||
          sessionStorage.getItem(sessionKey) ||
          ''
        if (!raw) return null
        const data = JSON.parse(raw) as Banner[]
        if (!Array.isArray(data)) return null
        const timeRaw =
          localStorage.getItem(persistTimeKey) ||
          sessionStorage.getItem(`${sessionKey}_time`) ||
          '0'
        const time = parseInt(timeRaw, 10) || 0
        return { data, time }
      } catch {
        return null
      }
    }

    const writePersisted = (data: Banner[]) => {
      if (typeof window === 'undefined') return
      const t = Date.now().toString()
      try {
        localStorage.setItem(persistKey, JSON.stringify(data))
        localStorage.setItem(persistTimeKey, t)
        sessionStorage.setItem(sessionKey, JSON.stringify(data))
        sessionStorage.setItem(`${sessionKey}_time`, t)
      } catch (_) {
        /* quota / private mode */
      }
    }

    const now = Date.now()
    const persisted = readPersisted()

    if (persisted && persisted.data.length > 0) {
      setBanners(persisted.data)
      if (now - persisted.time < CACHE_TTL) {
        fetch('/api/banners')
          .then(async (res) => {
            if (!res.ok) {
              const hint = await res.text().catch(() => '')
              throw new Error(`Баннери: ${res.status} ${hint.slice(0, 120)}`)
            }
            return res.json()
          })
          .then((data) => {
            if (!Array.isArray(data)) return
            setBanners(data)
            writePersisted(data)
          })
          .catch(() => {
            /* залишаємо останній успішний кеш у state та localStorage */
          })
        return
      }
    }

    fetch('/api/banners')
      .then(async (res) => {
        if (!res.ok) {
          const hint = await res.text().catch(() => '')
          throw new Error(`Баннери: ${res.status} ${hint.slice(0, 120)}`)
        }
        return res.json()
      })
      .then((data) => {
        if (!Array.isArray(data)) {
          console.warn('Баннери: очікувався масив, отримано', data)
          if (!persisted?.data.length) setBanners([])
          return
        }
        setBanners(data)
        writePersisted(data)
      })
      .catch((err) => {
        console.error('Помилка завантаження банерів:', err)
        if (persisted?.data.length) {
          setBanners(persisted.data)
        }
      })
  }, [])

  // Эффект загрузки
  useEffect(() => {
    loadBanners()
  }, [loadBanners])
  
  // Слушатель обновлений
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleBannersUpdate = () => loadBanners()
      window.addEventListener('bannersUpdated', handleBannersUpdate)
      return () => window.removeEventListener('bannersUpdated', handleBannersUpdate)
    }
  }, [loadBanners])

  // Авто-перемикання + скидання інтервалу після ручного свайпу
  useEffect(() => {
    if (displayBanners.length <= 1) return

    const interval = setInterval(() => {
      nextBanner()
    }, bannerInterval)

    return () => clearInterval(interval)
  }, [displayBanners.length, bannerInterval, currentBannerIndex, nextBanner])

  /** Свайп по банеру: touch + миша/тачпад (pointer), ігнор переважно вертикального скролу */
  const bannerSwipeRef = useRef<{ x: number; y: number } | null>(null)
  const BANNER_SWIPE_MIN_PX = 48
  const BANNER_SWIPE_VERTICAL_RATIO = 1.15

  const bannerSwipeIgnoreTarget = (target: EventTarget | null) => {
    const el = target as HTMLElement | null
    if (!el) return true
    return Boolean(el.closest('.hero-dots-web') || el.closest('button'))
  }

  const bannerSwipeStart = (clientX: number, clientY: number, target: EventTarget | null) => {
    if (bannerSwipeIgnoreTarget(target)) return
    bannerSwipeRef.current = { x: clientX, y: clientY }
  }

  const bannerSwipeEnd = (clientX: number, clientY: number) => {
    const start = bannerSwipeRef.current
    bannerSwipeRef.current = null
    if (!start || displayBanners.length <= 1) return
    const dx = start.x - clientX
    const dy = start.y - clientY
    if (Math.abs(dx) < BANNER_SWIPE_MIN_PX) return
    if (Math.abs(dy) * BANNER_SWIPE_VERTICAL_RATIO >= Math.abs(dx)) return
    if (dx > 0) nextBanner()
    else prevBanner()
  }

  const onBannerTouchStart = (e: React.TouchEvent) => {
    const t = e.targetTouches[0]
    if (!t) return
    bannerSwipeStart(t.clientX, t.clientY, e.target)
  }

  const onBannerTouchEnd = (e: React.TouchEvent) => {
    const t = e.changedTouches[0]
    if (!t) return
    bannerSwipeEnd(t.clientX, t.clientY)
  }

  const onBannerTouchCancel = () => {
    bannerSwipeRef.current = null
  }

  const onBannerPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return
    if (e.pointerType === 'mouse' && e.button !== 0) return
    if (bannerSwipeIgnoreTarget(e.target)) return
    bannerSwipeStart(e.clientX, e.clientY, e.target)
    try {
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
  }

  const onBannerPointerUp = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return
    bannerSwipeEnd(e.clientX, e.clientY)
    try {
      ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
  }

  const onBannerPointerCancel = () => {
    bannerSwipeRef.current = null
  }
  // --- ЗАГРУЗКА МЕНЮ С СЕРВЕРА ---
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  /** Мережа / 5xx / проксі без бекенда — на головній показуємо підказку замість порожнього блоку */
  const [homeMenuProductsLoadFailed, setHomeMenuProductsLoadFailed] = useState(false)
  const mapProductsToItems = useCallback(
    (data: any[]) => {
      return (data || [])
        .map((p: any) => {
          const promoPct =
            typeof p.promoDiscountPercent === 'number' ? p.promoDiscountPercent : Number(p.promoDiscountPercent) || 0
          const slugRaw = String(p.category?.slug ?? p.categorySlug ?? 'rolls')
            .trim()
            .toLowerCase()
          const id = Number(p.id)
          return {
            id,
            name: getLocalized(p, 'name'),
            description: getLocalized(p, 'description') || '',
            price: p.price,
            category: p.category
              ? getMenuCategoryDisplayName(p.category as Record<string, unknown>, language, t.categories)
              : t.categories.rolls,
            categorySlug: slugRaw.length > 0 ? slugRaw : 'rolls',
            categoryId: p.categoryId,
            emoji: '🍣',
            imageUrl: p.imageUrl,
            isTop: p.isPopular,
            promoDiscountPercent: promoPct,
            isHomeHit: p.isHomeHit === true,
            isMenuNew: p.isMenuNew === true,
            recommendOrder: typeof p.recommendOrder === 'number' ? p.recommendOrder : 0,
            allowRecommendations: p.category?.allowRecommendations !== false,
          }
        })
        .filter((row: { id: number }) => Number.isFinite(row.id) && row.id > 0)
    },
    [getLocalized, t.categories, language],
  )

  const loadMenuItems = useCallback(() => {
    setHomeMenuProductsLoadFailed(false)
    const cityIdToUse = selectedCityId || cityIdPreferAmsterdam(deliveryCities) || (deliveryCities.length > 0 ? deliveryCities[0].id : null)
    const url = cityIdToUse ? `/api/products?cityId=${cityIdToUse}` : '/api/products'
    const cacheKey = menuItemsSessionKey(cityIdToUse)
    const CACHE_TTL = 5 * 60 * 1000 // 5 минут
    const cached = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(cacheKey) : null
    const cacheTime = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(`${cacheKey}_time`) : null
    const now = Date.now()

    // Сразу показываем кэш (даже устаревший) — быстрая отрисовка. Порожній масив не кешували раніше — ігноруємо, щоб «оживити» меню.
    if (cached && cacheTime) {
      try {
        const data = JSON.parse(cached)
        if (Array.isArray(data) && data.length > 0) {
          setMenuItems(mapProductsToItems(data))
          // Если кэш свежий — только фоновое обновление
          if ((now - parseInt(cacheTime, 10)) < CACHE_TTL) {
            fetch(url, {
              cache: 'no-store',
              headers: { 'Cache-Control': 'no-cache' },
            })
              .then((res) => (res.ok ? res.json() : []))
              .then((data) => {
                const list = Array.isArray(data) ? data : []
                if (cityIdToUse && list.length === 0) {
                  fetch('/api/products', {
                    cache: 'no-store',
                    headers: { 'Cache-Control': 'no-cache' },
                  })
                    .then((r) => {
                      if (!r.ok) {
                        setHomeMenuProductsLoadFailed(true)
                        return Promise.resolve([] as unknown[])
                      }
                      return r.json() as Promise<unknown[]>
                    })
                    .then((all) => {
                      const allList = Array.isArray(all) ? all : []
                      if (typeof sessionStorage !== 'undefined' && allList.length > 0) {
                        sessionStorage.setItem(cacheKey, JSON.stringify(allList))
                        sessionStorage.setItem(`${cacheKey}_time`, Date.now().toString())
                      }
                      setMenuItems(mapProductsToItems(allList))
                    })
                    .catch(() => {
                      setHomeMenuProductsLoadFailed(true)
                      setMenuItems([])
                    })
                  return
                }
                if (typeof sessionStorage !== 'undefined' && list.length > 0) {
                  sessionStorage.setItem(cacheKey, JSON.stringify(list))
                  sessionStorage.setItem(`${cacheKey}_time`, Date.now().toString())
                }
                setMenuItems(mapProductsToItems(list))
              })
              .catch(() => {})
            return
          }
        }
      } catch (_) { /* кэш повреждён */ }
    }

    fetch(url, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' },
    })
      .then(res => {
        if (!res.ok) {
          console.error('Ошибка загрузки товаров:', res.status, res.statusText)
          setHomeMenuProductsLoadFailed(true)
          return []
        }
        return res.json()
      })
      .then((data) => {
        const list = Array.isArray(data) ? data : []
        if (cityIdToUse && list.length === 0) {
          fetch('/api/products', {
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache' },
          })
            .then((r) => {
              if (!r.ok) {
                setHomeMenuProductsLoadFailed(true)
                return Promise.resolve([] as unknown[])
              }
              return r.json() as Promise<unknown[]>
            })
            .then((all) => {
              const allList = Array.isArray(all) ? all : []
              if (typeof sessionStorage !== 'undefined' && allList.length > 0) {
                sessionStorage.setItem(cacheKey, JSON.stringify(allList))
                sessionStorage.setItem(`${cacheKey}_time`, Date.now().toString())
              }
              setMenuItems(mapProductsToItems(allList))
            })
            .catch((err) => {
              console.error('Ошибка fallback загрузки меню:', err)
              setHomeMenuProductsLoadFailed(true)
              setMenuItems([])
            })
          return
        }
        if (typeof sessionStorage !== 'undefined' && list.length > 0) {
          sessionStorage.setItem(cacheKey, JSON.stringify(list))
          sessionStorage.setItem(`${cacheKey}_time`, Date.now().toString())
        }
        setMenuItems(mapProductsToItems(list))
      })
      .catch(err => {
        console.error('Ошибка загрузки меню:', err)
        setHomeMenuProductsLoadFailed(true)
        setMenuItems([])
      })
  }, [selectedCityId, deliveryCities, language, getLocalized, mapProductsToItems])
  
  useEffect(() => {
    loadMenuItems()
  }, [loadMenuItems]); // Используем мемоизированную функцию

  useEffect(() => {
    if (menuItems.length > 0) setHomeMenuProductsLoadFailed(false)
  }, [menuItems.length])
  
  // Слушаем событие обновления товаров из админ-панели
  useEffect(() => {
    if (typeof window === 'undefined') return
    const handleProductsUpdate = () => {
      if (typeof sessionStorage !== 'undefined') {
        for (let i = sessionStorage.length - 1; i >= 0; i--) {
          const k = sessionStorage.key(i)
          if (k?.startsWith('menu_items_') || k?.startsWith('menu_categories_')) {
            sessionStorage.removeItem(k)
          }
        }
      }
      void loadMenuItems()
    }
    window.addEventListener('productsUpdated', handleProductsUpdate)
    return () => window.removeEventListener('productsUpdated', handleProductsUpdate)
  }, [loadMenuItems])

  const openCart = () => {
    router.push('/cart')
  }
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // --- ПОЛЬЗОВАТЕЛЬ И АДМИН ---
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  
  useEffect(() => {
    if (typeof window === 'undefined') return
    const loadUser = () => {
      if (window.localStorage) {
        const savedUser = localStorage.getItem('currentUser')
        if (savedUser) {
          try {
            const parsed = JSON.parse(savedUser)
            setCurrentUser(parsed)
          } catch (e) {
            console.error(e)
            setCurrentUser(null)
          }
        } else {
          setCurrentUser(null)
        }
      }
    }
    loadUser()
    window.addEventListener('userChanged', loadUser)
    return () => window.removeEventListener('userChanged', loadUser)
  }, [])

  // --- КАТЕГОРИИ ---
  // Загружаем категории из базы данных
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([])
  
  const loadCategories = useCallback(() => {
    const cacheKey = menuCategoriesSessionKey()
    const cached = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(cacheKey) : null
    const cacheTime = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(`${cacheKey}_time`) : null
    const now = Date.now()
    const CACHE_TTL = 5 * 60 * 1000 // 5 минут

    const mapApi = (data: Record<string, unknown>[]) =>
      buildMenuCategoriesFromApi(data, language, t.categories as Record<string, string>)

    const applyCategories = (categories: MenuCategory[]) => {
      const usable = filterNonAggregateMenuCategories(categories)
      const list = usable.length > 0 ? usable : categories
      setMenuCategories(list)
      setSelectedCategory((prev) => {
        if (list.length > 0) {
          const currentCategoryExists = list.find((c: MenuCategory) => c.key === prev)
          if (!currentCategoryExists || !prev) return list[0].key
        }
        return prev || (list.length > 0 ? list[0].key : '')
      })
    }

    // Сирі дані + локалізація — одна сесія: перемикання мови не чекає мережі
    if (cached && cacheTime && (now - parseInt(cacheTime, 10)) < CACHE_TTL) {
      const raw = parseCategoriesCacheJson(cached)
      if (raw) {
        applyCategories(mapApi(raw))
        fetch('/api/products/categories', { cache: 'no-store' })
          .then((res) => {
            if (!res.ok) throw new Error(String(res.status))
            return res.json()
          })
          .then((data) => {
            const list = Array.isArray(data) ? (data as Record<string, unknown>[]) : []
            if (typeof sessionStorage !== 'undefined' && list.length > 0) {
              sessionStorage.setItem(cacheKey, JSON.stringify(list))
              sessionStorage.setItem(`${cacheKey}_time`, Date.now().toString())
            }
            if (list.length > 0) applyCategories(mapApi(list))
          })
          .catch(() => {})
        return
      }
    }

    const applyFallback = () => {
      const updatedCategories: MenuCategory[] = MENU_CATEGORY_FALLBACK_SLUGS.map((key) => ({
        id: key,
        key,
        name: t.categories[key as keyof typeof t.categories] ?? key,
        emoji: MENU_CATEGORY_EMOJI[key],
        subcategories: [],
      }))
      applyCategories(updatedCategories)
    }

    fetch('/api/products/categories', { cache: 'no-store' })
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status))
        return res.json()
      })
      .then((data) => {
        const list = Array.isArray(data) ? (data as Record<string, unknown>[]) : []
        if (typeof sessionStorage !== 'undefined' && list.length > 0) {
          sessionStorage.setItem(cacheKey, JSON.stringify(list))
          sessionStorage.setItem(`${cacheKey}_time`, Date.now().toString())
        }
        if (list.length > 0) {
          applyCategories(mapApi(list))
          return
        }
        applyFallback()
      })
      .catch((err) => {
        console.error('Ошибка загрузки категорий:', err)
        applyFallback()
      })
  }, [language, t.categories])
  
  useEffect(() => {
    loadCategories()
  }, [language, t.categories])
  
  // Слушаем событие обновления категорий из админ-панели
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleCategoriesUpdate = () => {
        console.log('Получено событие categoriesUpdated, перезагружаем категории...')
        if (typeof sessionStorage !== 'undefined') {
          const key = menuCategoriesSessionKey()
          sessionStorage.removeItem(key)
          sessionStorage.removeItem(`${key}_time`)
        }
        loadCategories()
      }
      window.addEventListener('categoriesUpdated', handleCategoriesUpdate)
      return () => window.removeEventListener('categoriesUpdated', handleCategoriesUpdate)
    }
  }, [loadCategories]) // Используем loadCategories как зависимость

  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null)
  const [showSubmenu, setShowSubmenu] = useState(false)

  const browseStateRef = useRef({
    selectedCategory: '',
    activePage: null as string | null,
    pathname: '/',
  })
  useEffect(() => {
    browseStateRef.current = { selectedCategory, activePage, pathname }
  }, [selectedCategory, activePage, pathname])

  const homeStripScrollLockRef = useRef(false)

  const currentCategory = menuCategories.find(cat => cat.key === selectedCategory)
  
  // Фильтрация товаров - улучшенная логика
  const filteredItems = React.useMemo(() => {
    // Если выбрана подкатегория, возвращаем товары из подкатегории
    if (selectedSubcategory && currentCategory) {
      return currentCategory.subcategories.find(sub => sub.id === selectedSubcategory)?.items || []
    }
    
    // Если категория не выбрана или категории не загружены, показываем все товары
    if (!selectedCategory || menuCategories.length === 0 || menuItems.length === 0) {
      return menuItems
    }
    
    const selectedCat = menuCategories.find(cat => cat.key === selectedCategory)
    if (!selectedCat) {
      console.warn('Категория не найдена:', selectedCategory, 'Доступные категории:', menuCategories.map(c => c.key))
      return menuItems
    }
    
    const slugEq = (a: string | undefined, b: string | undefined) =>
      a != null &&
      b != null &&
      String(a).trim().toLowerCase() === String(b).trim().toLowerCase()

    const filtered = menuItems.filter(item => {
      // Приоритет 1: Используем slug категории для фильтрации (более надежно)
      if (item.categorySlug) {
        // Проверяем по key (slug) категории
        const matchesSlug =
          slugEq(item.categorySlug, selectedCategory) ||
          slugEq(item.categorySlug, selectedCat.key) ||
          (selectedCat.slug && slugEq(item.categorySlug, selectedCat.slug))
        if (matchesSlug) {
          return true
        }
      }
      
      // Приоритет 2: Сравниваем по categoryId, если есть
      if (item.categoryId && selectedCat.id) {
        // Проверяем как строку и как число
        const itemCategoryId = item.categoryId.toString()
        const selectedCatId = selectedCat.id.toString()
        const matches = itemCategoryId === selectedCatId
        if (matches) {
          return true
        }
      }
      
      // Приоритет 3: Сравниваем по названию категории (менее надежно, но как fallback)
      if (item.category) {
        const itemCategoryName = item.category.toLowerCase().trim()
        const selectedCatName = selectedCat.name.toLowerCase().trim()
        const matches = itemCategoryName === selectedCatName
        if (matches) {
          return true
        }
      }
      
      return false
    })
    
    console.log('Фильтрация товаров:', {
      selectedCategory,
      selectedCatName: selectedCat.name,
      selectedCatId: selectedCat.id,
      totalItems: menuItems.length,
      filteredCount: filtered.length,
      sampleItems: menuItems.slice(0, 3).map(item => ({ 
        id: item.id,
        name: item.name,
        categorySlug: item.categorySlug, 
        category: item.category, 
        categoryId: item.categoryId 
      }))
    })
    
    return filtered
  }, [menuItems, selectedCategory, selectedSubcategory, currentCategory, menuCategories])

  const itemsByCategory = useMemo(() => {
    const map = new Map<string, MenuItem[]>()
    for (const cat of menuCategories) {
      map.set(cat.key, [])
    }
    /** Спочатку categoryId (з Prisma) — надійно навіть при кривому/порожньому slug у адмінці. */
    const slugEq = (a: string | undefined, b: string | undefined) =>
      a != null &&
      b != null &&
      String(a).trim().toLowerCase() === String(b).trim().toLowerCase()

    const resolveItemCategory = (item: MenuItem): MenuCategory | undefined => {
      if (item.categoryId != null) {
        const byId = menuCategories.find((c) => String(c.id) === String(item.categoryId))
        if (byId) return byId
      }
      for (const c of menuCategories) {
        if (item.categorySlug) {
          if (slugEq(item.categorySlug, c.key)) return c
          if (c.slug && slugEq(item.categorySlug, c.slug)) return c
        }
        if (item.category && c.name) {
          if (item.category.toLowerCase().trim() === c.name.toLowerCase().trim()) return c
        }
      }
      return undefined
    }
    for (const item of menuItems) {
      const cat = resolveItemCategory(item)
      if (cat) {
        const list = map.get(cat.key) ?? []
        list.push(item)
        map.set(cat.key, list)
      }
    }
    const sortInCategory = (arr: MenuItem[]) =>
      [...arr].sort((a, b) => {
        const aRec = a.isHomeHit === true && a.allowRecommendations !== false
        const bRec = b.isHomeHit === true && b.allowRecommendations !== false
        if (aRec !== bRec) return aRec ? -1 : 1
        if (aRec && bRec) return (a.recommendOrder ?? 0) - (b.recommendOrder ?? 0)
        return a.id - b.id
      })
    for (const cat of menuCategories) {
      const k = cat.key
      const arr = map.get(k)
      if (arr?.length) map.set(k, sortInCategory(arr))
    }
    return map
  }, [menuItems, menuCategories])

  /** Категорії, у яких є хоча б один товар (порожні з адмінки не показуємо на головній) */
  const menuCategoriesWithItems = useMemo(
    () => menuCategories.filter((cat) => (itemsByCategory.get(cat.key) ?? []).length > 0),
    [menuCategories, itemsByCategory],
  )

  /** Усі категорії з адмінки/АПІ в стрічці (крім slug-ів «усе/все») — клік веде на сторінку категорії навіть без товарів */
  const categoriesForTopStrip = useMemo(
    () => filterNonAggregateMenuCategories(menuCategories),
    [menuCategories],
  )

  /** Секцію з товарами: або по категоріях, або один блок «усе», якщо кластер не збігся */
  const showHomeMenuCatalog = menuCategoriesWithItems.length > 0 || menuItems.length > 0
  const homeCatalogAsSingleList = menuItems.length > 0 && menuCategoriesWithItems.length === 0

  useEffect(() => {
    if (categoriesForTopStrip.length === 0) return
    const validKeys = new Set(categoriesForTopStrip.map((c) => c.key))
    if (!selectedCategory || !validKeys.has(selectedCategory)) {
      setSelectedCategory(categoriesForTopStrip[0].key)
    }
  }, [categoriesForTopStrip, selectedCategory])

  useEffect(() => {
    const onCity = (ev: Event) => {
      const id = (ev as CustomEvent<{ cityId?: number }>).detail?.cityId
      if (typeof id !== 'number' || !Number.isFinite(id) || id <= 0) return
      setSelectedCityId(id)
    }
    window.addEventListener('cityChanged', onCity as EventListener)
    return () => window.removeEventListener('cityChanged', onCity as EventListener)
  }, [])

  useEffect(() => {
    const onHomeCat = (ev: Event) => {
      let slug = (ev as CustomEvent<{ slug?: string }>).detail?.slug?.trim()
      if (!slug) return
      try {
        slug = decodeURIComponent(slug).trim()
      } catch {
        /* keep slug */
      }
      if (!slug) return

      const inStrip = categoriesForTopStrip.some((c) => c.key === slug)
      const inCatalog = menuCategoriesWithItems.some((c) => c.key === slug)
      if (!inStrip && !inCatalog) return

      homeStripScrollLockRef.current = true
      if (inStrip || inCatalog) {
        setSelectedCategory(slug)
      }
      /* Одразу підсвітити ту саму категорію в панелі (підказка скролу під час lock не оновлюється) */
      window.dispatchEvent(new CustomEvent('wattaMenuCategoryHighlight', { detail: { slug } }))
      setActivePage((p) => (p === 'delivery' ? null : p))
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          scrollToHomeCatalogCategory(slug)
          window.setTimeout(() => {
            homeStripScrollLockRef.current = false
          }, 700)
        })
      })
    }
    window.addEventListener(WATTA_HOME_REQUEST_SCROLL_TO_CAT, onHomeCat as EventListener)
    return () => window.removeEventListener(WATTA_HOME_REQUEST_SCROLL_TO_CAT, onHomeCat as EventListener)
  }, [scrollToHomeCatalogCategory, categoriesForTopStrip, menuCategoriesWithItems])

  useEffect(() => {
    if (pathname !== '/') return
    if (homeCatalogAsSingleList) return
    if (menuCategoriesWithItems.length === 0) return

    const root = document.querySelector<HTMLElement>('.content-web--watta-craft')
    if (!root) return

    const scrollPad = () => {
      const w = window.innerWidth
      return w <= 768 ? 148 : w <= 1024 ? 118 : 168
    }

    const lastHighlightSlugRef = { current: '' }
    const publish = (slug: string) => publishMenuCategoryHighlight(slug, lastHighlightSlugRef)

    const sync = () => {
      if (homeStripScrollLockRef.current) return
      const pad = scrollPad()
      const first = menuCategoriesWithItems[0]
      if (!first) return
      const firstEl = document.getElementById(`home-menu-cat-${first.key}`)
      if (!firstEl) return
      if (firstEl.getBoundingClientRect().top > pad - 8) {
        if (selectedCategory && menuCategoriesWithItems.some((c) => c.key === selectedCategory)) {
          publish(selectedCategory)
        } else {
          publish(first.key)
        }
        return
      }
      let bestSlug: string | null = null
      let bestScore = -1
      const vh = window.innerHeight
      for (const c of menuCategoriesWithItems) {
        const el = document.getElementById(`home-menu-cat-${c.key}`)
        if (!el) continue
        const r = el.getBoundingClientRect()
        const bandTop = Math.max(vh * 0.08, pad * 0.32)
        const bandBot = vh * 0.58
        const vis = Math.max(0, Math.min(r.bottom, bandBot) - Math.max(r.top, bandTop))
        if (vis <= 0) continue
        const score = vis + (r.top >= pad * 0.18 && r.top < vh * 0.42 ? 50 : 0)
        if (score > bestScore) {
          bestScore = score
          bestSlug = c.key
        }
      }
      if (bestSlug) publish(bestSlug)
    }

    const { onScroll, cancel } = createRafScrollListener(sync)
    root.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    const id = window.requestAnimationFrame(sync)
    return () => {
      window.cancelAnimationFrame(id)
      cancel()
      root.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [pathname, homeCatalogAsSingleList, menuCategoriesWithItems, selectedCategory])

  // --- НАВИГАЦИЯ ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [sidebarStaggerKey, setSidebarStaggerKey] = useState(0)

  // НОВЫЙ СТЕЙТ: Какую вкладку открыть в профиле
  const [profileInitialTab, setProfileInitialTab] = useState<'history' | 'address' | 'favorites'>('history')

  const [profileGateReady, setProfileGateReady] = useState(false)
  const [profileHasUser, setProfileHasUser] = useState(false)

  useEffect(() => {
    if (activePage !== 'profile') {
      setProfileGateReady(false)
      return
    }
    const u = typeof window !== 'undefined' && !!localStorage.getItem('currentUser')
    setProfileHasUser(u)
    setProfileGateReady(true)
    if (!u) {
      router.replace('/login?return=' + encodeURIComponent('/'))
    }
  }, [activePage, router])

  const handlePageOpen = (page: string) => {
    if (page === 'promotions') {
      setSelectedPromoId(null)
    }
    if (page === 'about') {
      router.push('/about')
      setIsSidebarOpen(false)
      return
    }
    if (page === 'contacts') {
      router.push('/contacts')
      setIsSidebarOpen(false)
      return
    }
    if (page === 'reviews') {
      router.push('/reviews')
      setIsSidebarOpen(false)
      return
    }
    if (page === 'blog') {
      router.push('/blog')
      setIsSidebarOpen(false)
      return
    }
    if (page === 'catalogMenu') {
      router.push('/menu')
      setIsSidebarOpen(false)
      return
    }
    if (page === 'delivery' || page === 'deliveryPublic') {
      router.push('/delivery')
      setIsSidebarOpen(false)
      return
    }
    if (page === 'cartPublic') {
      router.push('/cart')
      setIsSidebarOpen(false)
      return
    }
    if (page === 'favoritesPublic') {
      router.push('/favorites')
      setIsSidebarOpen(false)
      return
    }
    if (page === 'profilePublic') {
      router.push('/profile')
      setIsSidebarOpen(false)
      return
    }
    if (page === 'notifications') {
      setIsNotificationsOpen(true)
      setIsSidebarOpen(false)
      return
    }
    if (page === 'login') {
      router.push('/login')
      setIsSidebarOpen(false)
      return
    }
    if (page === 'register') {
      router.push('/register')
      setIsSidebarOpen(false)
      return
    }
    if (page === 'privacy') {
      router.push('/privacy')
      setIsSidebarOpen(false)
      return
    }
    setActivePage(page)
    setIsSidebarOpen(false)
    window.scrollTo({ top: 0, behavior: 'instant' in window ? ('instant' as ScrollBehavior) : 'auto' })
  }
  
  const handleClosePage = () => {
    setActivePage(null)
    setShowSubmenu(false)
    setSelectedSubcategory(null)
    setSelectedPromoId(null)
  }
  
  const toggleSidebar = () => {
    const opening = !isSidebarOpen
    if (opening && activePage && activePage !== 'admin') {
      setActivePage(null)
    }
    if (opening) {
      setSidebarStaggerKey((k) => k + 1)
    }
    setIsSidebarOpen(opening)
  }

  const navDrawerCategories = useMemo(
    () =>
      menuCategories.map((c) => ({
        key: c.key,
        name: c.name,
        emoji: c.emoji || '🍣',
      })),
    [menuCategories],
  )

  const handleNavCategorySelect = useCallback((key: string) => {
    setSelectedCategory(key)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent(WATTA_HOME_REQUEST_SCROLL_TO_CAT, { detail: { slug: key } }),
      )
    }
  }, [])

  const handleSidebarCityChange = useCallback(
    (cityId: number) => {
      setSelectedCityId(cityId)
      loadMenuItems()
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('cityChanged', { detail: { cityId } }))
      }
    },
    [loadMenuItems],
  )

  const cinematicAdminRecommendedProducts = useMemo((): CinematicFooterAdminProduct[] => {
    const maxItems = 24
    const wf = t.productDetail.weightFallback
    return menuItems
      .filter((i) => i.isHomeHit && i.allowRecommendations !== false)
      .sort((a, b) => (a.recommendOrder ?? 0) - (b.recommendOrder ?? 0))
      .slice(0, maxItems)
      .map((item) => ({
        id: item.id,
        label: (item.name || '').trim(),
        categoryLabel: (item.category || '').trim(),
        imageUrl: item.imageUrl || undefined,
        description: item.description,
        price: item.price,
        isPopular: item.isTop === true,
        isHomeHit: true,
        isMenuNew: item.isMenuNew === true,
        emoji: item.emoji,
        discountPercent: (item.promoDiscountPercent ?? 0) > 0 ? item.promoDiscountPercent : undefined,
        subtitleLine: cinematicWeightSubtitle(item.description, wf, t.productDetail.piecesFallback, language),
      }))
      .filter((p) => p.label.length > 0)
  }, [menuItems, t.productDetail.weightFallback, t.productDetail.piecesFallback, language])

  // --- ФУНКЦИЯ ДЛЯ ОТКРЫТИЯ ПРОФИЛЯ С КОНКРЕТНОЙ ВКЛАДКОЙ ---
  const openProfileTab = (tab: 'history' | 'address' | 'favorites') => {
    if (tab === 'favorites') {
      router.push('/favorites')
      setIsSidebarOpen(false)
      return
    }
    setProfileInitialTab(tab)
    handlePageOpen('profile')
  }

  // --- АДМИНСКИЕ ФУНКЦИИ ---
  const [showCategoryAdmin, setShowCategoryAdmin] = useState(false)
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null)
  const [editingSubcategory, setEditingSubcategory] = useState<{ categoryId: string; subcategory: MenuSubcategory | null } | null>(null)

  const handleAddCategory = () => {
    const name = prompt('Введіть назву категорії:')
    if (!name || !name.trim()) return
    const emoji = prompt('Введіть емодзі для категорії:') || '📦'
    const key = name.toLowerCase().replace(/\s+/g, '-')
    const newCategory: MenuCategory = { id: `cat-${Date.now()}`, key, name: name.trim(), emoji, subcategories: [] }
    setMenuCategories([...menuCategories, newCategory])
  }
  
  const handleEditCategory = (category: MenuCategory) => {
    const name = prompt('Введіть нову назву категорії:', category.name)
    if (!name || !name.trim()) return
    const emoji = prompt('Введіть нове емодзі:', category.emoji) || category.emoji
    setMenuCategories(menuCategories.map(cat => cat.id === category.id ? { ...cat, name: name.trim(), emoji } : cat))
    setEditingCategory(null)
  }
  
  const handleDeleteCategory = (categoryId: string) => {
    if (confirm('Ви впевнені, що хочете видалити цю категорію?')) {
      setMenuCategories(menuCategories.filter(cat => cat.id !== categoryId))
      if (selectedCategory === menuCategories.find(cat => cat.id === categoryId)?.key) setSelectedCategory('soups')
    }
  }
  
  const handleAddSubcategory = (categoryId: string) => {
    const name = prompt('Введіть назву підкатегорії:')
    if (!name || !name.trim()) return
    const newSubcategory: MenuSubcategory = { id: `sub-${Date.now()}`, name: name.trim(), items: [] }
    setMenuCategories(menuCategories.map(cat => cat.id === categoryId ? { ...cat, subcategories: [...cat.subcategories, newSubcategory] } : cat))
  }

  // --- ДОБАВЛЕНИЕ В КОРЗИНУ ---
  const addToCart = (item: MenuItem) => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]')
      cart.push(item)
      localStorage.setItem('cart', JSON.stringify(cart))
      const event = new CustomEvent('cartUpdated')
      window.dispatchEvent(event)
      toast.success(t.addToCart)
    }
  }
  
  // --- АДМИНКА ЗОН ДОСТАВКИ ---
  const [cities, setCities] = useState<City[]>(defaultCities)
  const [selectedCity, setSelectedCity] = useState<City>(defaultCities[0])
  
  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('deliveryZones', JSON.stringify(cities))
    }
  }, [cities])
  
  const handleAddZone = () => {
    const zoneName = prompt('Введіть назву зони доставки:')
    if (!zoneName || !zoneName.trim()) return
    const colors = ['#4ade80', '#22c55e', '#10b981', '#059669', '#047857', '#065f46']
    const newZone: DeliveryZone = { id: `zone-${Date.now()}`, name: zoneName, color: colors[Math.floor(Math.random() * colors.length)], coordinates: [] }
    const updatedCities = cities.map(city => city.id === selectedCity.id ? { ...city, deliveryZones: [...city.deliveryZones, newZone] } : city)
    setCities(updatedCities)
    setSelectedCity(updatedCities.find(c => c.id === selectedCity.id)!)
  }
  
  const handleDeleteZone = (zoneId: string) => {
    if (!confirm('Ви впевнені, що хочете видалити цю зону?')) return
    const updatedCities = cities.map(city => city.id === selectedCity.id ? { ...city, deliveryZones: city.deliveryZones.filter(z => z.id !== zoneId) } : city)
    setCities(updatedCities)
    setSelectedCity(updatedCities.find(c => c.id === selectedCity.id)!)
  }

  const persistMenuBrowseReturnState = useCallback(() => {
    if (typeof document === 'undefined') return
    const { selectedCategory: cat, activePage: page, pathname: path } = browseStateRef.current
    if (path !== '/') return
    const root = document.querySelector<HTMLElement>('.content-web--watta-craft')
    if (!root) return
    const panel = queryGlobalCategoriesPanel()
    const { rec, promo } = readCinematicRailScrolls()
    writeMenuBrowseReturn({
      v: 2,
      pathname: '/',
      scrollY: root.scrollTop,
      categoryKey: cat || '',
      categoriesPanelScrollLeft: panel?.scrollLeft ?? 0,
      activePage: page,
      cinematicRecScrollLeft: rec,
      cinematicPromoScrollLeft: promo,
    })
  }, [])

  useEffect(() => {
    if (pathname !== '/') return
    if (menuCategories.length === 0) return

    const raw = sessionStorage.getItem(MENU_BROWSE_RETURN_KEY)
    const payload = parseMenuBrowseReturn(raw)
    if (!payload) return
    if (!shouldRestoreMenuBrowse(payload)) {
      sessionStorage.removeItem(MENU_BROWSE_RETURN_KEY)
      return
    }
    if (payload.categoryKey && !menuCategories.some((c) => c.key === payload.categoryKey)) {
      sessionStorage.removeItem(MENU_BROWSE_RETURN_KEY)
      return
    }

    sessionStorage.removeItem(MENU_BROWSE_RETURN_KEY)

    if (payload.categoryKey) {
      setSelectedCategory(payload.categoryKey)
    }
    if (payload.activePage === null || payload.activePage === 'delivery') {
      setActivePage(payload.activePage)
    }

    const scrollY = payload.scrollY
    const panelLeft = payload.categoriesPanelScrollLeft

    const apply = () => {
      const root = document.querySelector<HTMLElement>('.content-web--watta-craft')
      if (!root) return
      root.scrollTop = scrollY
      const panel = queryGlobalCategoriesPanel()
      if (panel) {
        panel.scrollLeft = panelLeft
      }
      if (payload.v === 2) {
        const block = document.getElementById('menu-cinematic-block')
        if (block) {
          const recEl = block.querySelector<HTMLElement>('[data-cinematic-rail="recommended"]')
          const promoEl = block.querySelector<HTMLElement>('[data-cinematic-rail="promo"]')
          if (recEl && payload.cinematicRecScrollLeft != null) {
            recEl.scrollLeft = payload.cinematicRecScrollLeft
          }
          if (promoEl && payload.cinematicPromoScrollLeft != null) {
            promoEl.scrollLeft = payload.cinematicPromoScrollLeft
          }
        }
      }
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(apply)
    })
    const t0 = window.setTimeout(apply, 0)
    const t1 = window.setTimeout(apply, 120)
    const t2 = window.setTimeout(apply, 380)
    const t3 = window.setTimeout(apply, 650)
    return () => {
      window.clearTimeout(t0)
      window.clearTimeout(t1)
      window.clearTimeout(t2)
      window.clearTimeout(t3)
    }
  }, [pathname, menuCategories])

  // const CategoriesPanel = () => (
  //   <div className="categories-panel-wrapper-web">
  //     <button className={`categories-scroll-btn-web categories-scroll-left-web ${!canScrollLeft ? 'categories-scroll-btn-hidden-web' : ''}`} onClick={() => scrollPanelBy('left')}>‹</button>
  //     <div 
  //       ref={categoriesPanelRef}
  //       className="categories-panel-web" 
  //       onScroll={handleScroll}
  //     >
  //       {menuCategories.map(category => (
  //         <button 
  //           key={category.key} 
  //           className={`category-button-web ${selectedCategory === category.key ? 'category-button-active-web' : ''}`} 
  //           onClick={(e) => { 
  //             e.preventDefault();
  //             e.stopPropagation();
              
  //             // Сохраняем текущую позицию прокрутки перед изменением состояния
  //             if (categoriesPanelRef.current) {
  //               scrollPositionRef.current = categoriesPanelRef.current.scrollLeft
  //             }
              
  //             // Устанавливаем выбранную категорию
  //             const newCategoryKey = category.key
  //             console.log('Выбрана категория:', newCategoryKey, 'Категория:', category.name, 'Slug:', category.slug || category.key)
              
  //             // Убеждаемся, что категория устанавливается
  //             setSelectedCategory(newCategoryKey); 
  //             setShowSubmenu(category.subcategories.length > 0); 
  //             setSelectedSubcategory(null);
              
  //             // Прокручиваем к началу списка товаров при смене категории
  //             if (scrollContainerRef.current) {
  //               scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' })
  //             }
              
  //             // Немедленно восстанавливаем позицию прокрутки несколькими способами для надёжности
  //             const savedPosition = scrollPositionRef.current
  //             if (categoriesPanelRef.current) {
  //               requestAnimationFrame(() => {
  //                 if (categoriesPanelRef.current) {
  //                   categoriesPanelRef.current.scrollLeft = savedPosition
  //                 }
  //               })
  //               setTimeout(() => {
  //                 if (categoriesPanelRef.current) {
  //                   categoriesPanelRef.current.scrollLeft = savedPosition
  //                 }
  //               }, 0)
  //               setTimeout(() => {
  //                 if (categoriesPanelRef.current) {
  //                   categoriesPanelRef.current.scrollLeft = savedPosition
  //                 }
  //               }, 10)
  //             }
  //           }}
  //           onMouseDown={(e) => {
  //             // Предотвращаем случайное выделение текста при клике
  //             e.preventDefault()
  //             // Сохраняем позицию прокрутки перед любыми действиями
  //             if (categoriesPanelRef.current) {
  //               scrollPositionRef.current = categoriesPanelRef.current.scrollLeft
  //             }
  //           }}
  //           onFocus={(e) => {
  //             // Предотвращаем автоматическую прокрутку при фокусе
  //             e.preventDefault();
  //             e.currentTarget.blur();
  //           }}
  //           tabIndex={-1}
  //           style={{ scrollMargin: 0, scrollPadding: 0, outline: 'none' }}
  //         >
  //           <div className="category-button-icon-web">{category.emoji}</div>
  //           <span className="category-button-label-web">{category.name}</span>
  //         </button>
  //       ))}
  //     </div>
  //     <button className={`categories-scroll-btn-web categories-scroll-right-web ${!canScrollRight ? 'categories-scroll-btn-hidden-web' : ''}`} onClick={() => scrollPanelBy('right')}>›</button>
  //   </div>
  // )

  // ============================================
  // ОТРИСОВКА СТРАНИЦ (PAGES)
  // ============================================

  if (activePage === 'phone') return <div className="full-page-web full-page-web--craft"><div className="full-page-header-web"><button className="back-button-web" onClick={handleClosePage}><ArrowLeft size={24}/></button><h1 className="full-page-title-web">{t.phone}</h1></div><div className="full-page-content-web"><PhoneView /></div></div>
  
  if (activePage === 'profile') {
    if (!profileGateReady) {
      return (
        <div className="full-page-web full-page-web--craft flex min-h-[50vh] items-center justify-center">
          <p className="text-[#145142] font-medium">{t.auth.loginDescription}</p>
        </div>
      )
    }
    if (!profileHasUser) {
      return (
        <div className="full-page-web full-page-web--craft flex min-h-[50vh] items-center justify-center px-6 text-center">
          <p className="text-[#145142] font-medium">{t.clientProfile.redirectLogin}</p>
        </div>
      )
    }

    return (
      <>
        <div className="full-page-web full-page-web--craft profile-page-full-web">
          <ProfileView
            onBack={handleClosePage}
            onMenuClick={toggleSidebar}
            onOpenPhone={() => handlePageOpen('phone')}
            onOpenNotifications={() => handlePageOpen('notifications')}
            onOpenFavorites={() => openProfileTab('favorites')}
            onOpenCart={openCart}
            onSelectCategory={(key) => {
              handleClosePage()
              setSelectedCategory(key)
            }}
            onOpenAdmin={() => setActivePage('admin')}
            initialTab={profileInitialTab}
          />
        </div>
        <NotificationsView isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />
      </>
    )
  }

  if (activePage === 'admin') {
    return (
      <>
        <div className="full-page-web full-page-web--craft">
          <AdminView onBack={handleClosePage} onSiteMenuClick={toggleSidebar} />
        </div>
        <NavigationSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          staggerKey={sidebarStaggerKey}
          categories={navDrawerCategories}
          onCategorySelect={handleNavCategorySelect}
          onCityChange={handleSidebarCityChange}
          onOpenProfileTab={openProfileTab}
          onPageOpen={handlePageOpen}
          onGoHome={handleClosePage}
          onOpenNotifications={() => {
            setIsSidebarOpen(false)
            setIsNotificationsOpen(true)
          }}
        />
        <NotificationsView
          isOpen={isNotificationsOpen}
          onClose={() => setIsNotificationsOpen(false)}
        />
      </>
    )
  }
  if (activePage === 'cart') {
    return (
      <>
        <div className="full-page-web full-page-web--craft">
          <CartView
            onBack={handleClosePage}
            onOpenProfile={() => openProfileTab('history')}
            onOpenFavorites={() => openProfileTab('favorites')}
            onOpenPhone={() => handlePageOpen('phone')}
            onOpenNotifications={() => handlePageOpen('notifications')}
            onMenuClick={toggleSidebar}
          />
        </div>
        <NotificationsView isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />
      </>
    )
  }

  // ============================================
  // ГЛАВНЫЙ ЭКРАН (МЕНЮ)
  // ============================================
  /** Текст «доставка суші…»: лише вузка головна (смуга з відео); на картці ноутбука — прибрано. */
  const homeAfterHeroIntroTitleLines = fillHomeAfterHeroCity(t.menuView.homeAfterHeroIntroTitle)
    .split(/\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)

  const homeAfterHeroIntroSection =
    pathname === '/' && homeNarrowStripHero ? (
      <section
        id="home-after-hero-intro"
        className="home-after-hero-intro-web menu-after-welcome-web relative z-[2] w-full max-w-[100vw] shrink-0"
        aria-label={fillHomeAfterHeroCity(t.menuView.homeAfterHeroIntroAria)}
      >
        <div className="home-after-hero-intro-inner-web home-after-hero-intro-inner-web--home-menu relative z-[1] mx-auto max-w-7xl px-6 pb-4 sm:px-9 sm:pb-5 md:px-12 md:pb-6">
          <h2
            id="home-after-hero-intro-title"
            className="home-after-hero-intro-title-web mx-auto max-w-3xl text-center text-[clamp(1.35rem,3.8vw,2.35rem)] font-semibold leading-[1.18] tracking-[-0.02em] text-[#0f2a22]"
          >
            {homeAfterHeroIntroTitleLines.map((line, i) => (
              <span key={i} className="block">
                {line}
              </span>
            ))}
          </h2>
          <p className="home-after-hero-intro-body-web mx-auto mt-4 max-w-2xl whitespace-pre-line text-center text-[13px] leading-snug text-[#145142]/88 sm:mt-5 sm:text-[14px] max-xl:max-w-[min(52rem,96vw)] xl:max-w-2xl xl:whitespace-normal xl:leading-relaxed xl:text-balance">
            {t.menuView.homeAfterHeroIntroBody}
          </p>
        </div>
      </section>
    ) : null

  return (
    <div
      className="menu-page-web relative flex min-h-full w-full max-w-[100vw] flex-col bg-transparent"
      data-watta-home-narrow-strip-hero={homeNarrowStripHero ? '1' : undefined}
    >
      <WattaStickyChromeLayout
        chromeClassName="watta-full-menu-sticky-chrome"
        flowHeightFudgePx={0}
        flowHeightMaxPx={360}
      >
        <WattaGlobalSiteHeader
          disableSticky
          onCityChange={(cityId: number) => {
            setSelectedCityId(cityId)
            loadMenuItems()
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('cityChanged', { detail: { cityId } }))
            }
          }}
          deliveryEmbeddedActive={activePage === 'delivery'}
          onPromotionsClick={() => handlePageOpen('promotions')}
          onCartClick={openCart}
          onMenuClick={toggleSidebar}
          onProfileClick={() => openProfileTab('history')}
          onFavoritesClick={() => router.push('/favorites')}
          onLogoClick={handleClosePage}
        />
        <WattaMenuCategoryStrip />
      </WattaStickyChromeLayout>

      {activePage === 'delivery' ? (
        <>
          <div className="menu-content-top-gap-web w-full bg-transparent shrink-0" aria-hidden="true" />
          <div className="menu-delivery-embed-web relative z-[1] w-full max-w-[100vw] pb-6 sm:pb-8">
            <DeliveryView embedInMenu menuWelcomeHeroRef={welcomeHeroSectionRef} />
          </div>
        </>
      ) : activePage === 'promotions' && selectedPromoId != null ? (
        <>
          <div className="menu-content-top-gap-web w-full bg-transparent shrink-0" aria-hidden="true" />
          <div className="menu-delivery-embed-web relative z-[1] w-full max-w-[100vw] pb-6 sm:pb-8">
            <PromotionsDetailView
              embedded
              id={selectedPromoId}
              onBack={() => setSelectedPromoId(null)}
              onMenuClick={toggleSidebar}
              onOpenPhone={() => handlePageOpen('phone')}
              onOpenNotifications={() => handlePageOpen('notifications')}
              onOpenFavorites={() => openProfileTab('favorites')}
              onOpenProfile={() => openProfileTab('history')}
            />
          </div>
        </>
      ) : activePage === 'promotions' ? (
        <>
          <div className="menu-content-top-gap-web w-full bg-transparent shrink-0" aria-hidden="true" />
          <div className="menu-delivery-embed-web relative z-[1] w-full max-w-[100vw] pb-6 sm:pb-8">
            <PromotionsView
              embedded
              onBack={handleClosePage}
              onMenuClick={toggleSidebar}
              onOpenDetail={(id) => setSelectedPromoId(id)}
              onOpenPhone={() => handlePageOpen('phone')}
              onOpenNotifications={() => handlePageOpen('notifications')}
              onOpenFavorites={() => openProfileTab('favorites')}
              onOpenProfile={() => openProfileTab('history')}
            />
          </div>
        </>
      ) : (
      <>
      {homeNarrowStripHero ? null : (
        <div className="menu-content-top-gap-web w-full bg-transparent shrink-0" aria-hidden="true" />
      )}

      {homeIntroBeforeHero ? homeAfterHeroIntroSection : null}

      {homeNarrowStripHero ? (
        <div className="menu-home-narrow-strip-hero-web w-full max-w-[100vw] shrink-0">
          <WelcomeHeroSection
            sectionRef={welcomeHeroSectionRef}
            heroVideoFailed={heroVideoFailed}
            setHeroVideoSourceIndex={setHeroVideoSourceIndex}
            setHeroVideoFailed={setHeroVideoFailed}
            heroVideoRef={heroVideoRef}
            heroVideoCanvasRef={heroVideoCanvasRef}
            heroVideoSrc={heroVideoSrc}
            videoSources={heroVideoSources}
            playlistLength={homeHeroPlaylist.length}
          >
            <div
              ref={marqueeBarRef}
              className="home-hero-after-marquee-wrap-web home-hero-marquee-over-video-web pointer-events-none absolute inset-x-0 bottom-0 z-[25] w-full"
            >
              <WattaHeroMarqueeBar />
            </div>
          </WelcomeHeroSection>
        </div>
      ) : (
        <WelcomeHeroSection
          sectionRef={welcomeHeroSectionRef}
          heroVideoFailed={heroVideoFailed}
          setHeroVideoSourceIndex={setHeroVideoSourceIndex}
          setHeroVideoFailed={setHeroVideoFailed}
          heroVideoRef={heroVideoRef}
          heroVideoCanvasRef={heroVideoCanvasRef}
          heroVideoSrc={heroVideoSrc}
          videoSources={heroVideoSources}
          playlistLength={homeHeroPlaylist.length}
        />
      )}

      {!homeIntroBeforeHero ? homeAfterHeroIntroSection : null}

      {cinematicAdminRecommendedProducts.length > 0 ? (
        <div
          id="menu-cinematic-block"
          className="menu-snap-section-cinematic-web menu-cinematic-block--ribbon w-full shrink-0"
        >
          <CinematicFooter
            layout="compact"
            homeRecommendedStack={
              isPhoneViewport
                ? {
                    maxItems: 4,
                    seeAllHref: '/menu',
                    seeAllLabel: t.cinematicFooter.seeFullMenu,
                  }
                : undefined
            }
            adminPromoProducts={[]}
            adminRecommendedProducts={cinematicAdminRecommendedProducts}
            onAdminProductAddToCart={(productId) => {
              const item = menuItems.find((i) => i.id === productId)
              if (item) addToCart(item)
            }}
            onBeforeNavigateToProduct={persistMenuBrowseReturnState}
          />
        </div>
      ) : null}

      {showSubmenu && currentCategory && currentCategory.subcategories.length > 0 && (
        <div className="submenu-panel-web">
          <div className="submenu-header-web"><h3>{currentCategory.name}</h3><button className="submenu-close-btn-web" onClick={() => setShowSubmenu(false)}>×</button></div>
          <div className="submenu-content-web">{currentCategory.subcategories.map(sub => (<button key={sub.id} className={`submenu-item-web ${selectedSubcategory === sub.id ? 'submenu-item-active-web' : ''}`} onClick={() => setSelectedSubcategory(sub.id)}><span className="submenu-item-name-web">{sub.name}</span><span className="submenu-item-count-web">{sub.items.length}{t.menuView.itemsCount}</span></button>))}</div>
        </div>
      )}

      <section
        id="hero-banners"
        className="home-brand-story-section-web home-brand-banner-stage-soft-web menu-after-welcome-web menu-snap-section-brand-web relative z-[2] w-full max-w-[100vw]"
        aria-labelledby="hero-banners-heading"
      >
        <h2 id="hero-banners-heading" className="sr-only">
          {t.menuView.heroBannersSectionAria}
        </h2>
        <div className="home-brand-story-bg-web" aria-hidden />
        <div className="home-brand-story-grain-web" aria-hidden />
        <div className="home-brand-inner-web relative z-[1] mx-auto max-w-7xl px-4 pb-10 pt-10 sm:px-6 sm:pb-14 sm:pt-12 md:px-8 md:pb-16 md:pt-14">
          <div className="home-brand-banner-shell-web home-brand-banner-shell-web--section-lead">
      {displayBanners.length > 0 ? (
        <div 
          className="hero-banner-web hero-banner-image-bg-web hero-banner-swipe-web max-w-7xl mx-auto rounded-none sm:rounded-2xl overflow-hidden relative group"
          onTouchStart={onBannerTouchStart}
          onTouchEnd={onBannerTouchEnd}
          onTouchCancel={onBannerTouchCancel}
          onPointerDown={onBannerPointerDown}
          onPointerUp={onBannerPointerUp}
          onPointerCancel={onBannerPointerCancel}
          style={{ 
            backgroundImage: `url(${displayBanners[currentBannerIndex].imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: (() => {
              const b = displayBanners[currentBannerIndex]
              const fx =
                typeof b.focalX === 'number'
                  ? Math.max(0, Math.min(100, b.focalX))
                  : 50
              const fy =
                typeof b.focalY === 'number'
                  ? Math.max(0, Math.min(100, b.focalY))
                  : 50
              return `${fx}% ${fy}%`
            })(),
            backgroundRepeat: 'no-repeat',
            position: 'relative'
          }}
        >
          {/* Затемнение для читаемості; на планшеті слабше — фото яскравіше */}
          <div className="hero-banner-dim-web pointer-events-none absolute inset-0" />

          {/* Контент баннера */}
          <div 
            className="hero-content-web"
            style={{ pointerEvents: 'none', position: 'relative', zIndex: 2, minHeight: '100%' }}
          />

          {/* --- ЛЕВАЯ СТРЕЛКА (Только ПК) --- */}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              prevBanner();
            }}
            className="hidden md:flex absolute top-0 left-0 bottom-0 w-16 items-center justify-center text-white/50 hover:text-white hover:bg-black/10 transition-all z-10 opacity-0 group-hover:opacity-100"
            aria-label={a.previousSlide}
          >
            <ChevronLeft size={48} strokeWidth={1.5} />
          </button>

          {/* --- ПРАВАЯ СТРЕЛКА (Только ПК) --- */}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              nextBanner();
            }}
            className="hidden md:flex absolute top-0 right-0 bottom-0 w-16 items-center justify-center text-white/50 hover:text-white hover:bg-black/10 transition-all z-10 opacity-0 group-hover:opacity-100"
            aria-label={a.nextSlide}
          >
            <ChevronRight size={48} strokeWidth={1.5} />
          </button>

          {/* Точки (Dots) */}
          <div
              className="hero-dots-web hero-dots-banner-image-web absolute bottom-3 left-0 right-0 z-[3] flex justify-center gap-2 md:bottom-4 min-[1025px]:!bottom-[-20px]"
            >
            {displayBanners.map((_, i) => (
              <span 
                key={i} 
                className={`hero-dot-web ${i === currentBannerIndex ? 'active' : ''}`}
                onClick={() => setCurrentBannerIndex(i)}
                style={{ cursor: 'pointer' }}
              />
            ))}
          </div>
        </div>
      ) : (
        // Блок else (заглушка) оставляем без изменений
        <div className="hero-banner-web max-w-7xl mx-auto rounded-none sm:rounded-2xl">
          <div className="hero-content-web">
            <div className="hero-text-web"><h1 className="hero-title-web" style={{whiteSpace: 'pre-line'}}>{t.hero.title.replace(/ /g, '\n')}</h1></div>
            <div className="hero-images-web">
                <div className="hero-image-item-web hero-image-1"><div className="hero-image-placeholder-web">🍜</div></div>
                <div className="hero-image-item-web hero-image-2"><div className="hero-image-placeholder-web">🍲</div></div>
                <div className="hero-image-item-web hero-image-3"><div className="hero-image-placeholder-web">🥘</div></div>
            </div>
          </div>
          <div className="hero-dots-web">{[1, 2, 3].map((_, i) => <span key={i} className={`hero-dot-web ${i === 0 ? 'active' : ''}`}></span>)}</div>
        </div>
      )}
          </div>
        </div>
      </section>

      {pathname === '/' && homeMenuProductsLoadFailed && !showHomeMenuCatalog ? (
        <section
          className="home-menu-api-unavailable-web menu-after-welcome-web relative z-[2] mx-auto w-full max-w-7xl shrink-0 px-4 pb-6 pt-2 sm:px-6 md:px-8"
          aria-live="polite"
        >
          <div className="rounded-xl border border-amber-200/90 bg-amber-50/95 px-4 py-3 text-sm text-amber-950 shadow-sm dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100">
            <p className="font-semibold">{t.menuView.homeMenuApiUnavailableTitle}</p>
            <p className="mt-1 text-[13px] leading-relaxed opacity-95">{t.menuView.homeMenuApiUnavailableHint}</p>
          </div>
        </section>
      ) : null}

      {showHomeMenuCatalog ? (
      <section
        id="home-menu-catalog"
        className="home-menu-catalog-section-web home-full-menu-catalog-web home-full-menu-catalog-after-banners-web menu-after-welcome-web relative z-[2] w-full max-w-[100vw] shrink-0 px-5 sm:px-7 md:px-8 pt-3 pb-6 sm:pt-5 sm:pb-8 md:pt-6 md:pb-10"
        aria-labelledby="home-menu-catalog-title"
      >
        <div className="home-menu-catalog-stack-web relative z-[1]">
          <header
            className="home-full-menu-catalog-head-web mx-auto w-full max-w-7xl"
            aria-labelledby="home-menu-catalog-title"
          >
            <h2 id="home-menu-catalog-title" className="home-full-menu-catalog-title-web">
              {t.menuView.homeCatalogTitle}
            </h2>
          </header>

          <div className="home-menu-cat-list-web w-full max-w-none">
            {homeCatalogAsSingleList ? (
              <div
                className="home-menu-cat-block-web"
                id="home-menu-cat--all"
              >
                <div className="home-menu-cat-band-web">
                  <div className="home-menu-cat-heading-web">
                    <span className="home-menu-cat-emoji-bare-web" aria-hidden>🍣</span>
                    <div className="home-menu-cat-heading-text-web min-w-0">
                      <h3 className="home-menu-cat-title-web">{t.menuView.homeCatalogTitle}</h3>
                      <p className="home-menu-cat-meta-line-web">
                        {menuItems.length} {t.menuView.itemsCount}
                      </p>
                    </div>
                  </div>
                  <div className="home-menu-cat-rail-inset-web">
                    <HomeCategoryProductRail
                      categoryLabel={t.menuView.homeCatalogTitle}
                      items={menuItems.slice(0, HOME_CATEGORY_RAIL_PREVIEW_MAX * 2)}
                      addToCart={(item) => addToCart(item as MenuItem)}
                      onBeforeNavigateToProduct={persistMenuBrowseReturnState}
                    />
                  </div>
                  <div className="home-menu-cat-view-all-wrap-web">
                    <Link href="/menu" className="home-menu-cat-view-all-btn-web">
                      {t.cinematicFooter.seeFullMenu}
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
            menuCategoriesWithItems.map((cat) => {
              const catItems = itemsByCategory.get(cat.key) ?? []
              return (
                <div
                  key={cat.id}
                  id={`home-menu-cat-${cat.key}`}
                  className="home-menu-cat-block-web"
                >
                  <div className="home-menu-cat-band-web">
                    <div
                      className="home-menu-cat-heading-web cursor-pointer select-none rounded-xl outline-none transition hover:opacity-95 focus-visible:ring-2 focus-visible:ring-[#145142]/35 focus-visible:ring-offset-2"
                      role="button"
                      tabIndex={0}
                      aria-label={cat.name}
                      onClick={() => {
                        window.dispatchEvent(
                          new CustomEvent(WATTA_HOME_REQUEST_SCROLL_TO_CAT, { detail: { slug: cat.key } }),
                        )
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          window.dispatchEvent(
                            new CustomEvent(WATTA_HOME_REQUEST_SCROLL_TO_CAT, { detail: { slug: cat.key } }),
                          )
                        }
                      }}
                    >
                      <span className="home-menu-cat-emoji-bare-web" aria-hidden>
                        {cat.emoji}
                      </span>
                      <div className="home-menu-cat-heading-text-web min-w-0">
                        <h3 className="home-menu-cat-title-web">{cat.name}</h3>
                        <p className="home-menu-cat-meta-line-web">
                          {catItems.length} {t.menuView.itemsCount}
                        </p>
                      </div>
                    </div>
                    <div className="home-menu-cat-rail-inset-web">
                      <HomeCategoryProductRail
                        categoryLabel={cat.name}
                        items={catItems.slice(0, HOME_CATEGORY_RAIL_PREVIEW_MAX)}
                        addToCart={(item) => addToCart(item as MenuItem)}
                        onBeforeNavigateToProduct={persistMenuBrowseReturnState}
                      />
                    </div>
                    <div className="home-menu-cat-view-all-wrap-web">
                      <Link
                        href={`/menu?cat=${encodeURIComponent(cat.key)}`}
                        className="home-menu-cat-view-all-btn-web"
                      >
                        {t.cinematicFooter.seeFullMenu}
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })
            )}
          </div>
        </div>
      </section>
      ) : null}
      </>
      )}
      {showCategoryAdmin && (
        <div className="admin-category-overlay-web" onClick={() => setShowCategoryAdmin(false)}>
          <div className="admin-category-panel-web" onClick={(e) => e.stopPropagation()}>
            <div className="admin-category-header-web"><h3>{t.adminCategory.manageTitle}</h3><button className="admin-category-close-btn-web" onClick={() => setShowCategoryAdmin(false)}>×</button></div>
            <div className="admin-category-content-web">
              <button className="add-category-btn-web" onClick={handleAddCategory}>{t.adminCategory.addCategory}</button>
              <div className="admin-category-list-web">{menuCategories.map(cat => (<div key={cat.id} className="admin-category-item-web"><div className="admin-category-info-web"><span className="admin-category-emoji-web">{cat.emoji}</span><span className="admin-category-name-web">{cat.name}</span><span className="admin-category-subcount-web">({cat.subcategories.length} {t.adminCategory.subcategoriesCount})</span></div><div className="admin-category-actions-web"><button className="admin-edit-btn-web" onClick={() => { setEditingCategory(cat); const name = prompt(t.adminCategory.enterNewName, cat.name); if (name) handleEditCategory({ ...cat, name }) }}>✏️</button><button className="admin-add-sub-btn-web" onClick={() => handleAddSubcategory(cat.id)}>{t.adminCategory.addSubcategory}</button><button className="admin-delete-btn-web" onClick={() => handleDeleteCategory(cat.id)}>🗑️</button></div></div>))}</div>
            </div>
          </div>
        </div>
      )}

      <NavigationSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        staggerKey={sidebarStaggerKey}
        categories={navDrawerCategories}
        onCategorySelect={handleNavCategorySelect}
        onCityChange={handleSidebarCityChange}
        onOpenProfileTab={openProfileTab}
        onPageOpen={handlePageOpen}
        onGoHome={handleClosePage}
        onOpenNotifications={() => {
          setIsSidebarOpen(false)
          setIsNotificationsOpen(true)
        }}
      />
      <NotificationsView
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />
      <Footer />
    </div>
  )
}