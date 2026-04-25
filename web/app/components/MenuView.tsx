'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import Image from 'next/image'
import { useLanguage } from '../context/LanguageContext'
import WattaGlobalSiteHeader from './WattaGlobalSiteHeader'
import WattaStickyChromeLayout from './WattaStickyChromeLayout'
import WattaHeroMarqueeBar from './WattaHeroMarqueeBar'
import LogoBackground from './LogoBackground'
import PhoneView from './PhoneView'
import { NotificationsView } from './NotificationsView';
import FavoritesView from './FavoritesView'
import ProfileView from './ProfileView'
import DeliveryView from './DeliveryView'
import AdminView from './AdminView'
// --- ВАЖНО: Импорты новых страниц ---
import PromotionsView from './PromotionsView'
import CartView from './CartView'
import PromotionsDetailView from './PromotionsDetailView'
import Footer from './Footer'
import NavigationSidebar from './NavigationSidebar'
import { CinematicFooter, type CinematicFooterAdminProduct } from '@/components/ui/motion-footer'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  MENU_BROWSE_RETURN_KEY,
  parseMenuBrowseReturn,
  shouldRestoreMenuBrowse,
  writeMenuBrowseReturn,
} from '@/lib/menuBrowseRestore'
import { HomeCategoryProductRail } from './HomeCategoryProductRail'
import { filterNonAggregateMenuCategories } from '@/lib/menuCategoryFilters'
import { getBearerAuthHeaders } from '@/lib/authHeaders'

/** Скільки карток показувати в горизонтальній стрічці на головній; решта — через «Подивитися всі» на /menu */
const HOME_CATEGORY_RAIL_PREVIEW_MAX = 6

function readCinematicRailScrolls(): { rec: number; promo: number } {
  if (typeof document === 'undefined') return { rec: 0, promo: 0 }
  const root = document.getElementById('menu-cinematic-block')
  if (!root) return { rec: 0, promo: 0 }
  const rec = root.querySelector<HTMLElement>('[data-cinematic-rail="recommended"]')
  const promo = root.querySelector<HTMLElement>('[data-cinematic-rail="promo"]')
  return { rec: rec?.scrollLeft ?? 0, promo: promo?.scrollLeft ?? 0 }
}

function cinematicWeightSubtitle(desc: string, weightFallback: string): string {
  const g = desc.match(/(\d+)\s*г\b/i)?.[1]
  const ml = desc.match(/(\d+)\s*мл\b/i)?.[1]
  return ml ? `${ml} мл` : g ? `${g} г` : weightFallback
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
  isRecommended?: boolean
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

const defaultCategories: MenuCategory[] = [
  { id: 'rolls', key: 'rolls', name: 'Роллы', emoji: '🍣', subcategories: [] },
  { id: 'sushi', key: 'sushi', name: 'Суши', emoji: '🍙', subcategories: [] },
  { id: 'sets', key: 'sets', name: 'Сеты', emoji: '🍱', subcategories: [] },
  { id: 'soups', key: 'soups', name: 'Супы', emoji: '🍜', subcategories: [] },
  { id: 'bowls', key: 'bowls', name: 'Боули', emoji: '🥗', subcategories: [] },
  { id: 'snacks', key: 'snacks', name: 'Закуски', emoji: '🍤', subcategories: [] },
  { id: 'drinks', key: 'drinks', name: 'Напитки', emoji: '🧃', subcategories: [] },
  { id: 'sauces', key: 'sauces', name: 'Соуси', emoji: '🌶️', subcategories: [] }
]

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
    title_ru: 'Свіжі роли та суші',
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
    title_ru: 'Якість і доставка',
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

/** Головна: як раніше (океан + лого). Відео доставки — у `DeliveryView`. */
const HERO_VIDEO_SOURCES_MENU = ['/watta-sushi-2-hero.mp4', '/welcome.mp4'] as const

function WelcomeHeroSection({
  sectionRef,
  heroVideoFailed,
  setHeroVideoSourceIndex,
  setHeroVideoFailed,
  heroVideoRef,
  heroVideoSrc,
  videoSources,
}: {
  sectionRef: React.Ref<HTMLElement>
  heroVideoFailed: boolean
  setHeroVideoSourceIndex: React.Dispatch<React.SetStateAction<number>>
  setHeroVideoFailed: React.Dispatch<React.SetStateAction<boolean>>
  heroVideoRef: React.Ref<HTMLVideoElement>
  heroVideoSrc: string
  videoSources: readonly string[]
}) {
  return (
    <section
      ref={sectionRef}
      className="welcome-hero-section-web menu-snap-section-welcome-web"
      aria-label="Hero video"
    >
      <div className="welcome-hero-video-fill-web">
        {heroVideoFailed ? (
          <div
            className="welcome-video-native-web welcome-hero-fallback-image-web"
            style={{ backgroundImage: "url('/watta-sushi.jpg')" }}
            role="img"
            aria-hidden
          />
        ) : (
          <video
            key={heroVideoSrc}
            ref={heroVideoRef}
            className="welcome-video-native-web"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            tabIndex={-1}
            aria-hidden
            onError={() => {
              setHeroVideoSourceIndex((prev) => {
                if (prev < videoSources.length - 1) return prev + 1
                setHeroVideoFailed(true)
                return prev
              })
            }}
            onEnded={(e) => {
              const el = e.currentTarget
              el.currentTime = 0
              void el.play()
            }}
          >
            <source src={heroVideoSrc} type="video/mp4" />
          </video>
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
  const welcomeHeroSectionRef = useRef<HTMLElement | null>(null)
  const marqueeBarRef = useRef<HTMLDivElement | null>(null)
  const [activePage, setActivePage] = useState<string | null>(null)

  const scrollMainContentToTop = useCallback(() => {
    if (typeof document === 'undefined') return
    document.querySelector<HTMLElement>('.content-web--watta-craft')?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const scrollToHomeCatalogCategory = useCallback((categoryKey: string) => {
    if (typeof document === 'undefined') return
    const root = document.querySelector<HTMLElement>('.content-web--watta-craft')
    const el = document.getElementById(`home-menu-cat-${categoryKey}`)
    if (!root || !el) return
    const narrow = typeof window !== 'undefined' && window.innerWidth <= 768
    const headerOffset = narrow ? 148 : 168
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
      el.style.scrollPaddingTop = 'calc(148px + env(safe-area-inset-top, 0px))'
    }

    apply()
    mqNarrow.addEventListener('change', apply)
    return () => {
      mqNarrow.removeEventListener('change', apply)
      el.style.removeProperty('scroll-padding-top')
    }
  }, [])

  const [selectedPromoId, setSelectedPromoId] = useState<number | null>(null)
  // --- ГОРОДА ДОСТАВКИ ---
  const [deliveryCities, setDeliveryCities] = useState<{id: number, name: string, name_nl?: string}[]>([])
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null)

  const [bannerInterval, setBannerInterval] = useState(5000)

  /** Якщо mp4 немає на сервері — показуємо постер-зображення */
  const [heroVideoFailed, setHeroVideoFailed] = useState(false)
  const [heroVideoSourceIndex, setHeroVideoSourceIndex] = useState(0)
  const heroVideoRef = useRef<HTMLVideoElement | null>(null)

  const heroVideoSrc =
    HERO_VIDEO_SOURCES_MENU[heroVideoSourceIndex] ?? HERO_VIDEO_SOURCES_MENU[0]

  useEffect(() => {
    setHeroVideoSourceIndex(0)
    setHeroVideoFailed(false)
  }, [activePage])

  useEffect(() => {
    if (heroVideoFailed) return
    const video = heroVideoRef.current
    if (!video) return

    const safePlay = () => {
      video.defaultMuted = true
      video.muted = true
      video.playsInline = true
      video.autoplay = true
      video.loop = true
      video.setAttribute('playsinline', 'true')
      video.setAttribute('webkit-playsinline', 'true')
      video.setAttribute('muted', 'true')
      video.setAttribute('autoplay', 'true')
      video.disablePictureInPicture = true
      const p = video.play()
      if (p && typeof p.catch === 'function') {
        p.catch(() => {
          // Safari/iOS може тимчасово блокувати autoplay до canplay/pageshow.
        })
      }
    }

    if (video.readyState >= 2) safePlay()
    const t = window.setTimeout(safePlay, 120)
    const t2 = window.setTimeout(safePlay, 420)
    const t3 = window.setTimeout(safePlay, 900)
    const onCanPlay = () => safePlay()
    const onLoadedData = () => safePlay()
    const onPageShow = () => safePlay()
    const onVisibility = () => {
      if (document.visibilityState === 'visible') safePlay()
    }

    video.addEventListener('canplay', onCanPlay)
    video.addEventListener('loadeddata', onLoadedData)
    window.addEventListener('pageshow', onPageShow)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      window.clearTimeout(t)
      window.clearTimeout(t2)
      window.clearTimeout(t3)
      video.removeEventListener('canplay', onCanPlay)
      video.removeEventListener('loadeddata', onLoadedData)
      window.removeEventListener('pageshow', onPageShow)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [heroVideoSrc, heroVideoFailed])

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

    const pickCityForList = (list: { id: number }[]) => {
      if (!list.length) return
      const ids = new Set(list.map((c) => c.id))
      const pick = savedCityId != null && ids.has(savedCityId) ? savedCityId : list[0].id
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
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings')
        if (res.ok) {
          const data = await res.json()
          if (data.bannerInterval) setBannerInterval(data.bannerInterval)
        }
      } catch (e) { console.error('Error loading settings', e) }
    }
    fetchSettings()
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
  const [favorites, setFavorites] = useState<number[]>([]) // Храним ID лайкнутых товаров
  
  const mapProductsToItems = useCallback((data: any[]) => {
    return (data || []).map((p: any) => {
      const promoPct =
        typeof p.promoDiscountPercent === 'number' ? p.promoDiscountPercent : Number(p.promoDiscountPercent) || 0
      return {
        id: p.id,
        name: getLocalized(p, 'name'),
        description: getLocalized(p, 'description') || '',
        price: p.price,
        category: getLocalized(p.category, 'name') || 'Роллы',
        categorySlug: p.category?.slug || 'rolls',
        categoryId: p.categoryId,
        emoji: '🍣',
        imageUrl: p.imageUrl,
        isTop: p.isPopular,
        promoDiscountPercent: promoPct,
        isRecommended: p.isRecommended === true,
        recommendOrder: typeof p.recommendOrder === 'number' ? p.recommendOrder : 0,
        allowRecommendations: p.category?.allowRecommendations !== false,
      }
    })
  }, [getLocalized])

  const loadMenuItems = useCallback(() => {
    const cityIdToUse = selectedCityId || (deliveryCities.length > 0 ? deliveryCities[0].id : null)
    const url = cityIdToUse ? `/api/products?cityId=${cityIdToUse}` : '/api/products'
    const cacheKey = `menu_items_${cityIdToUse}_${language}`
    const CACHE_TTL = 5 * 60 * 1000 // 5 минут
    const cached = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(cacheKey) : null
    const cacheTime = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(`${cacheKey}_time`) : null
    const now = Date.now()

    // Сразу показываем кэш (даже устаревший) — быстрая отрисовка
    if (cached && cacheTime) {
      try {
        const data = JSON.parse(cached)
        if (Array.isArray(data)) {
          setMenuItems(mapProductsToItems(data))
          // Если кэш свежий — только фоновое обновление
          if ((now - parseInt(cacheTime, 10)) < CACHE_TTL) {
            fetch(url, { headers: { 'Cache-Control': 'max-age=120' } })
              .then(res => (res.ok ? res.json() : []))
              .then(data => {
                if (typeof sessionStorage !== 'undefined') {
                  sessionStorage.setItem(cacheKey, JSON.stringify(data))
                  sessionStorage.setItem(`${cacheKey}_time`, Date.now().toString())
                }
                setMenuItems(mapProductsToItems(data))
              })
              .catch(() => {})
            return
          }
        }
      } catch (_) { /* кэш повреждён */ }
    }

    fetch(url, { headers: { 'Cache-Control': 'max-age=120' } })
      .then(res => {
        if (!res.ok) {
          console.error('Ошибка загрузки товаров:', res.status, res.statusText)
          return []
        }
        return res.json()
      })
      .then(data => {
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem(cacheKey, JSON.stringify(data))
          sessionStorage.setItem(`${cacheKey}_time`, Date.now().toString())
        }
        setMenuItems(mapProductsToItems(data))
      })
      .catch(err => {
        console.error('Ошибка загрузки меню:', err)
        setMenuItems([])
      })
  }, [selectedCityId, deliveryCities, language, getLocalized, mapProductsToItems])
  
  useEffect(() => {
    loadMenuItems()
  }, [loadMenuItems]); // Используем мемоизированную функцию
  
  // Слушаем событие обновления товаров из админ-панели
  useEffect(() => {
    if (typeof window === 'undefined') return
    const handleProductsUpdate = () => {
      void loadMenuItems()
    }
    window.addEventListener('productsUpdated', handleProductsUpdate)
    return () => window.removeEventListener('productsUpdated', handleProductsUpdate)
  }, [loadMenuItems])

  // --- КОРЗИНА ---
  const [cartCount, setCartCount] = useState(0)

  useEffect(() => {
    const updateCount = () => {
      if (typeof window !== 'undefined' && window.localStorage) {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]')
        setCartCount(cart.length)
      }
    }
    updateCount()
    window.addEventListener('cartUpdated', updateCount)
    return () => window.removeEventListener('cartUpdated', updateCount)
  }, [])

  const openCart = () => {
    handlePageOpen('cart')
  }
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // --- ПОЛЬЗОВАТЕЛЬ И АДМИН ---
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  
  useEffect(() => {
    if (typeof window === 'undefined') return
    const loadUser = () => {
      if (window.localStorage) {
        const savedUser = localStorage.getItem('currentUser')
        if (savedUser) {
          try {
            const parsed = JSON.parse(savedUser)
            setCurrentUser(parsed)
            setIsAdmin(parsed.role === 'ADMIN' || false)
          } catch (e) { console.error(e) }
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
    const cacheKey = `menu_categories_${language}`
    const cached = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(cacheKey) : null
    const cacheTime = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(`${cacheKey}_time`) : null
    const now = Date.now()
    const CACHE_TTL = 5 * 60 * 1000 // 5 минут

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

    // Сразу показываем кэш, если есть — быстрая отрисовка
    if (cached && cacheTime && (now - parseInt(cacheTime, 10)) < CACHE_TTL) {
      try {
        const categories = JSON.parse(cached) as MenuCategory[]
        if (Array.isArray(categories) && categories.length > 0) {
          applyCategories(categories)
          // Фоновое обновление (revalidate)
          fetch('/api/products/categories')
            .then(res => res.json())
            .then(data => {
              const next = data
                .filter((cat: any) => cat.isActive !== false)
                .map((cat: any) => ({
                  id: cat.id.toString(),
                  key: cat.slug,
                  slug: cat.slug,
                  name: language === 'uk' && cat.name_ua ? cat.name_ua : language === 'en' && cat.name_en ? cat.name_en : language === 'nl' && cat.name_nl ? cat.name_nl : cat.name_ru,
                  emoji: cat.emoji || '🍣',
                  subcategories: []
                }))
                .sort((a: any, b: any) => {
                  const catA = data.find((c: any) => c.slug === a.key)
                  const catB = data.find((c: any) => c.slug === b.key)
                  return (catA?.order || 0) - (catB?.order || 0)
                })
              sessionStorage.setItem(cacheKey, JSON.stringify(next))
              sessionStorage.setItem(`${cacheKey}_time`, Date.now().toString())
              applyCategories(next)
            })
            .catch(() => {})
          return
        }
      } catch (_) { /* кэш повреждён — грузим ниже */ }
    }

    // Нет кэша или устарел — загружаем
    fetch('/api/products/categories')
      .then(res => res.json())
      .then(data => {
        const categories = data
          .filter((cat: any) => cat.isActive !== false)
          .map((cat: any) => ({
            id: cat.id.toString(),
            key: cat.slug,
            slug: cat.slug,
            name: language === 'uk' && cat.name_ua ? cat.name_ua : language === 'en' && cat.name_en ? cat.name_en : language === 'nl' && cat.name_nl ? cat.name_nl : cat.name_ru,
            emoji: cat.emoji || '🍣',
            subcategories: []
          }))
          .sort((a: any, b: any) => {
            const catA = data.find((c: any) => c.slug === a.key)
            const catB = data.find((c: any) => c.slug === b.key)
            return (catA?.order || 0) - (catB?.order || 0)
          })
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem(cacheKey, JSON.stringify(categories))
          sessionStorage.setItem(`${cacheKey}_time`, Date.now().toString())
        }
        applyCategories(categories)
      })
      .catch(err => {
        console.error('Ошибка загрузки категорий:', err)
        const updatedCategories = defaultCategories.map(cat => ({
          ...cat,
          name: t.categories[cat.key as keyof typeof t.categories] || cat.name
        }))
        applyCategories(updatedCategories)
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
        // Используем loadCategories для перезагрузки
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
    
    const filtered = menuItems.filter(item => {
      // Приоритет 1: Используем slug категории для фильтрации (более надежно)
      if (item.categorySlug) {
        // Проверяем по key (slug) категории
        const matchesSlug = item.categorySlug === selectedCategory || 
                           item.categorySlug === selectedCat.key ||
                           (selectedCat.slug && item.categorySlug === selectedCat.slug)
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
    const matchesCat = (item: MenuItem, selectedCat: MenuCategory) => {
      if (item.categorySlug) {
        if (item.categorySlug === selectedCat.key) return true
        if (selectedCat.slug && item.categorySlug === selectedCat.slug) return true
      }
      if (item.categoryId != null && selectedCat.id) {
        if (String(item.categoryId) === String(selectedCat.id)) return true
      }
      if (item.category && selectedCat.name) {
        if (item.category.toLowerCase().trim() === selectedCat.name.toLowerCase().trim()) return true
      }
      return false
    }
    for (const item of menuItems) {
      for (const cat of menuCategories) {
        if (matchesCat(item, cat)) {
          map.get(cat.key)!.push(item)
          break
        }
      }
    }
    return map
  }, [menuItems, menuCategories])

  // Отладочный эффект для отслеживания изменений
  useEffect(() => {
    console.log('Состояние фильтрации обновлено:', {
      selectedCategory,
      filteredItemsCount: filteredItems.length,
      menuItemsCount: menuItems.length,
      categoriesCount: menuCategories.length
    })
  }, [selectedCategory, filteredItems.length, menuItems.length, menuCategories.length])

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
    setActivePage(page)
    setIsSidebarOpen(false)
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 100)
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


  const cinematicAdminPromoProducts = useMemo((): CinematicFooterAdminProduct[] => {
    const maxItems = 24
    const wf = t.productDetail.weightFallback
    return menuItems
      .filter((i) => (i.promoDiscountPercent ?? 0) > 0)
      .sort((a, b) => (b.promoDiscountPercent ?? 0) - (a.promoDiscountPercent ?? 0))
      .slice(0, maxItems)
      .map((item) => ({
        id: item.id,
        label: (item.name || '').trim(),
        categoryLabel: (item.category || '').trim(),
        imageUrl: item.imageUrl || undefined,
        discountPercent: item.promoDiscountPercent,
        description: item.description,
        price: item.price,
        isPopular: item.isTop === true,
        emoji: item.emoji,
        subtitleLine: cinematicWeightSubtitle(item.description, wf),
      }))
      .filter((p) => p.label.length > 0)
  }, [menuItems, t.productDetail.weightFallback])

  const cinematicAdminRecommendedProducts = useMemo((): CinematicFooterAdminProduct[] => {
    const maxItems = 24
    const wf = t.productDetail.weightFallback
    return menuItems
      .filter((i) => i.isRecommended && i.allowRecommendations !== false)
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
        emoji: item.emoji,
        discountPercent: (item.promoDiscountPercent ?? 0) > 0 ? item.promoDiscountPercent : undefined,
        subtitleLine: cinematicWeightSubtitle(item.description, wf),
      }))
      .filter((p) => p.label.length > 0)
  }, [menuItems, t.productDetail.weightFallback])

  // --- ФУНКЦИЯ ДЛЯ ОТКРЫТИЯ ПРОФИЛЯ С КОНКРЕТНОЙ ВКЛАДКОЙ ---
  const openProfileTab = (tab: 'history' | 'address' | 'favorites') => {
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

  useEffect(() => {
  const loadFavorites = async () => {
    if (typeof window === 'undefined') return
    const userStr = localStorage.getItem('currentUser')
    if (!userStr) return

    try {
      const auth = getBearerAuthHeaders()
      if (Object.keys(auth as Record<string, string>).length === 0) return
      const res = await fetch('/api/favorites', {
        headers: auth,
      })
      if (res.ok) {
        const ids = await res.json()
        setFavorites(ids)
      }
    } catch (e) { console.error(e) }
  }
  loadFavorites()
}, [])
  const toggleFavorite = async (e: React.MouseEvent, productId: number) => {
  e.stopPropagation() // Чтобы не открывалась карточка товара (если будет клик по ней)
  e.preventDefault()

  if (typeof window === 'undefined') return
  const userStr = localStorage.getItem('currentUser')

  if (!userStr) {
    toast.error('Увійдіть, щоб додавати в обране') // Или t.auth.required
    return
  }

  const auth = getBearerAuthHeaders()
  if (Object.keys(auth as Record<string, string>).length === 0) {
    toast.error('Увійдіть, щоб додавати в обране')
    return
  }

  // Оптимистичное обновление интерфейса (сразу меняем цвет, не ждем сервер)
  const isLiked = favorites.includes(productId)
  if (isLiked) {
    setFavorites(prev => prev.filter(id => id !== productId))
  } else {
    setFavorites(prev => [...prev, productId])
  }

  try {
    await fetch('/api/favorites/toggle', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...auth,
      },
      body: JSON.stringify({ productId })
    })
  } catch (err) {
    // Если ошибка - откатываем (можно добавить логику)
    console.error('Ошибка лайка')
  }
}
  // --- ДОБАВЛЕНИЕ В КОРЗИНУ ---
  const addToCart = (item: MenuItem) => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]')
      cart.push(item)
      localStorage.setItem('cart', JSON.stringify(cart))
      const event = new CustomEvent('cartUpdated')
      window.dispatchEvent(event)
      toast.success(t.addToCart || 'Добавлено!')
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

  // --- СКРОЛЛ КАТЕГОРИЙ ---
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const categoriesPanelRef = useRef<HTMLDivElement | null>(null)
  const scrollPositionRef = useRef<number>(0)
  const isUserScrollingRef = useRef<boolean>(false)
  const restorePositionTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const persistMenuBrowseReturnState = useCallback(() => {
    if (typeof document === 'undefined') return
    const { selectedCategory: cat, activePage: page, pathname: path } = browseStateRef.current
    if (path !== '/') return
    const root = document.querySelector<HTMLElement>('.content-web--watta-craft')
    if (!root) return
    const panel = categoriesPanelRef.current
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
      const panel = categoriesPanelRef.current
      if (panel) {
        panel.scrollLeft = panelLeft
        scrollPositionRef.current = panelLeft
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

  const checkScrollButtons = useCallback((element: HTMLElement) => {
    if (element) {
      const scrollLeft = element.scrollLeft
      const scrollWidth = element.scrollWidth
      const clientWidth = element.clientWidth
      const threshold = 5 // Небольшой порог для предотвращения дёргания
      
      setCanScrollLeft(scrollLeft > threshold)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - threshold)
    }
  }, [])

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    // Помечаем, что пользователь прокручивает
    isUserScrollingRef.current = true
    
    // Сохраняем позицию прокрутки постоянно
    const currentScroll = e.currentTarget.scrollLeft
    scrollPositionRef.current = currentScroll
    
    // Отменяем предыдущий таймаут
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current)
    }
    
    // Проверяем кнопки с небольшой задержкой для плавности
    scrollTimeoutRef.current = setTimeout(() => {
      checkScrollButtons(e.currentTarget)
      // Сбрасываем флаг после завершения прокрутки
      setTimeout(() => {
        isUserScrollingRef.current = false
      }, 150)
    }, 50)
  }, [checkScrollButtons])
  
  // Восстанавливаем позицию горизонтального скролла только после смены категории/меню (не мешаем ручному листанию)
  useEffect(() => {
    const panel = categoriesPanelRef.current
    if (!panel) return

    const savedPosition = scrollPositionRef.current

    const restorePosition = () => {
      if (!panel) return
      if (isUserScrollingRef.current) return
      const currentScroll = panel.scrollLeft
      if (savedPosition > 0 && Math.abs(currentScroll - savedPosition) > 5) {
        panel.scrollLeft = savedPosition
      }
    }

    if (restorePositionTimeoutRef.current) {
      clearTimeout(restorePositionTimeoutRef.current)
    }
    restorePositionTimeoutRef.current = setTimeout(restorePosition, 50)
    const t1 = setTimeout(restorePosition, 100)
    const t2 = setTimeout(restorePosition, 250)
    const t3 = setTimeout(restorePosition, 500)

    return () => {
      if (restorePositionTimeoutRef.current) {
        clearTimeout(restorePositionTimeoutRef.current)
      }
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [selectedCategory, menuCategories])

  // Очистка таймаута при размонтировании
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [])

  // Начальная проверка стрелок и при изменении размера панели
  useEffect(() => {
    const panel = categoriesPanelRef.current
    if (!panel) return
    checkScrollButtons(panel)
    const t1 = setTimeout(() => checkScrollButtons(panel), 100)
    const t2 = setTimeout(() => checkScrollButtons(panel), 400)
    const ro = new ResizeObserver(() => checkScrollButtons(panel))
    ro.observe(panel)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      ro.disconnect()
    }
  }, [menuCategories.length, selectedCategory, checkScrollButtons, activePage])

  const scrollPanelBy = (direction: 'left' | 'right') => {
    const panel = categoriesPanelRef.current
    if (!panel) return
    const amount = panel.clientWidth * 0.7
    const scrollAmount = direction === 'left' ? -amount : amount
    panel.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    ;[150, 350, 550].forEach((ms) => setTimeout(() => checkScrollButtons(panel), ms))
  }

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
          <p className="text-[#145142] font-medium">
            {language === 'uk'
              ? 'Перенаправлення на вхід…'
              : language === 'en'
                ? 'Redirecting to sign in…'
                : 'Перенаправление на вход…'}
          </p>
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
          isAdmin={isAdmin}
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
  const getTranslated = (item: any, field: 'name' | 'description') => {
  // Пытаемся найти поле с нужным языком, например name_ua
  const val = item[`${field}_${language}`];
  // Если пусто, берем русский (фоллбэк)
  return val || item[`${field}_ru`] || '';
};

  // ============================================
  // ГЛАВНЫЙ ЭКРАН (МЕНЮ)
  // ============================================
  return (
    <div className="menu-page-web relative min-h-screen w-full max-w-[100vw] bg-transparent">
      <LogoBackground />

      {/* Фіксована верхня зона: шапка + категорії (WattaStickyChromeLayout — липне до вікна при скролі .content-web) */}
      <WattaStickyChromeLayout chromeClassName="watta-full-menu-sticky-chrome">
        <WattaGlobalSiteHeader
          disableSticky
          cartCount={cartCount}
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
          onLogoClick={handleClosePage}
        />

          <div className="categories-panel-wrapper-web">
            <button
              type="button"
              className={`categories-scroll-btn-web categories-scroll-left-web ${!canScrollLeft ? 'categories-scroll-btn-hidden-web' : ''}`}
              onClick={(e) => {
                e.preventDefault()
                scrollPanelBy('left')
              }}
            >
              ‹
            </button>

            <div ref={categoriesPanelRef} className="categories-panel-web" onScroll={handleScroll}>
              {menuCategories.map((category) => (
                <button
                  key={category.key}
                  type="button"
                  className={`category-button-web ${selectedCategory === category.key && activePage === null ? 'category-button-active-web' : ''}`}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()

                    if (categoriesPanelRef.current) {
                      scrollPositionRef.current = categoriesPanelRef.current.scrollLeft
                    }

                    if (activePage === 'delivery') setActivePage(null)

                    setSelectedCategory(category.key)
                    const scrollCatalog =
                      pathname === '/' && (activePage === null || activePage === 'delivery')
                    if (scrollCatalog) {
                      requestAnimationFrame(() => {
                        requestAnimationFrame(() => scrollToHomeCatalogCategory(category.key))
                      })
                    } else {
                      navigateToCategoryPage(category.key)
                    }

                    const savedPosition = scrollPositionRef.current
                    requestAnimationFrame(() => {
                      if (categoriesPanelRef.current) categoriesPanelRef.current.scrollLeft = savedPosition
                    })
                    setTimeout(() => {
                      if (categoriesPanelRef.current) categoriesPanelRef.current.scrollLeft = savedPosition
                    }, 10)
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    if (categoriesPanelRef.current) scrollPositionRef.current = categoriesPanelRef.current.scrollLeft
                  }}
                  onFocus={(e) => {
                    e.preventDefault()
                    e.currentTarget.blur()
                  }}
                  tabIndex={-1}
                  style={{ scrollMargin: 0, scrollPadding: 0, outline: 'none' }}
                >
                  <div className="category-button-icon-web">{category.emoji}</div>
                  <span className="category-button-label-web">{category.name}</span>
                </button>
              ))}
            </div>

            <button
              type="button"
              className={`categories-scroll-btn-web categories-scroll-right-web ${!canScrollRight ? 'categories-scroll-btn-hidden-web' : ''}`}
              onClick={(e) => {
                e.preventDefault()
                scrollPanelBy('right')
              }}
            >
              ›
            </button>
          </div>
      </WattaStickyChromeLayout>

          <div className="categories-panel-spacer-web" aria-hidden />

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
      <div className="menu-content-top-gap-web w-full bg-transparent shrink-0" aria-hidden="true" />

      <WelcomeHeroSection
        sectionRef={welcomeHeroSectionRef}
        heroVideoFailed={heroVideoFailed}
        setHeroVideoSourceIndex={setHeroVideoSourceIndex}
        setHeroVideoFailed={setHeroVideoFailed}
        heroVideoRef={heroVideoRef}
        heroVideoSrc={heroVideoSrc}
        videoSources={HERO_VIDEO_SOURCES_MENU}
      />

      <div ref={marqueeBarRef} className="w-full shrink-0">
        <WattaHeroMarqueeBar />
      </div>

      <div
        id="menu-cinematic-block"
        className="menu-snap-section-cinematic-web menu-cinematic-block--ribbon w-full shrink-0"
      >
        <CinematicFooter
          layout="compact"
          adminPromoProducts={cinematicAdminPromoProducts}
          adminRecommendedProducts={cinematicAdminRecommendedProducts}
          onAdminProductAddToCart={(productId) => {
            const item = menuItems.find((i) => i.id === productId)
            if (item) addToCart(item)
          }}
          onBeforeNavigateToProduct={persistMenuBrowseReturnState}
        />
      </div>

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
        <div className="home-brand-story-bg-web" aria-hidden />
        <div className="home-brand-story-grain-web" aria-hidden />
        <div className="home-brand-inner-web relative z-[1] mx-auto max-w-7xl px-4 pb-10 pt-10 sm:px-6 sm:pb-14 sm:pt-12 md:px-8 md:pb-16 md:pt-14">
          <header className="home-menu-hero-banners-head-web home-full-menu-catalog-head-web">
            <div className="home-full-menu-catalog-ornament-web" aria-hidden>
              <span className="home-full-menu-catalog-ornament-cap-web" />
              <span className="home-full-menu-catalog-ornament-line-web" />
              <span className="home-full-menu-catalog-ornament-cap-web" />
            </div>
            <div className="home-hero-banner-title-rail-web">
              <h2
                id="hero-banners-heading"
                className="home-full-menu-catalog-title-web home-hero-banner-overlay-title-web"
              >
                {t.menuView.heroBannerOverlayTitle}
              </h2>
            </div>
            <div
              className="home-hero-banner-sms-web"
              role="figure"
              aria-label={`${t.menuView.heroBannerSmsSender}. ${t.menuView.heroBannerOverlaySub}`}
            >
              <div className="home-hero-banner-sms-web__body">
                <div className="home-hero-banner-sms-web__avatar-wrap" aria-hidden>
                  <Image
                    src="/logo.png"
                    alt=""
                    width={128}
                    height={128}
                    className="home-hero-banner-sms-web__avatar-img"
                    sizes="(max-width: 640px) 44px, 56px"
                  />
                </div>
                <div className="home-hero-banner-sms-web__stack">
                  <div className="home-hero-banner-sms-web__meta" aria-hidden>
                    <span className="home-hero-banner-sms-web__badge">{t.menuView.heroBannerSmsBadge}</span>
                    <span className="home-hero-banner-sms-web__sender">{t.menuView.heroBannerSmsSender}</span>
                  </div>
                  <div className="home-hero-banner-sms-web__bubble">
                    <p className="home-hero-banner-sms-web__text">{t.menuView.heroBannerOverlaySub}</p>
                    <div className="home-hero-banner-sms-web__bubble-foot">
                      <span className="home-hero-banner-sms-web__time">{t.menuView.heroBannerSmsTime}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </header>
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
            aria-label="Previous slide"
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
            aria-label="Next slide"
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

      <section
        id="home-menu-catalog"
        className="home-menu-catalog-section-web home-full-menu-catalog-web home-full-menu-catalog-after-banners-web menu-after-welcome-web relative z-[2] w-full max-w-[100vw] px-4 sm:px-6 md:px-8 pt-5 pb-12 sm:pt-7 sm:pb-16 md:pt-8"
        aria-labelledby="home-menu-catalog-title"
      >
        <div className="home-menu-catalog-stack-web relative z-[1]">
          <header className="home-full-menu-catalog-head-web">
            <div className="home-full-menu-catalog-ornament-web" aria-hidden>
              <span className="home-full-menu-catalog-ornament-cap-web" />
              <span className="home-full-menu-catalog-ornament-line-web" />
              <span className="home-full-menu-catalog-ornament-cap-web" />
            </div>
            <h2 id="home-menu-catalog-title" className="home-full-menu-catalog-title-web">
              {t.menuView.homeCatalogTitle}
            </h2>
          </header>

          <div className="mx-auto max-w-7xl space-y-12 sm:space-y-16 md:space-y-[4.5rem]">
            {menuCategories.map((cat) => {
              const catItems = itemsByCategory.get(cat.key) ?? []
              return (
                <div
                  key={cat.id}
                  id={`home-menu-cat-${cat.key}`}
                  className="home-menu-cat-block-web"
                >
                  <div className="home-menu-cat-heading-web">
                    <span className="home-menu-cat-emoji-ring-web" aria-hidden>
                      <span className="home-menu-cat-emoji-web">{cat.emoji}</span>
                    </span>
                    <div className="home-menu-cat-heading-main-web">
                      <h3 className="home-menu-cat-title-web">{cat.name}</h3>
                      {catItems.length > 0 ? (
                        <span className="home-menu-cat-meta-web">
                          {catItems.length} {t.menuView.itemsCount}
                        </span>
                      ) : null}
                    </div>
                    <span className="home-menu-cat-accent-bar-web" aria-hidden />
                  </div>
                  {catItems.length === 0 ? (
                    <p className="home-menu-cat-empty-web">{t.menuView.emptyCategoryTitle}</p>
                  ) : (
                    <>
                      <HomeCategoryProductRail
                        categoryLabel={cat.name}
                        items={catItems.slice(0, HOME_CATEGORY_RAIL_PREVIEW_MAX)}
                        addToCart={(item) => addToCart(item as MenuItem)}
                        onBeforeNavigateToProduct={persistMenuBrowseReturnState}
                      />
                      <div className="home-menu-cat-view-all-wrap-web">
                        <Link
                          href={`/menu?cat=${encodeURIComponent(cat.key)}`}
                          className="home-menu-cat-view-all-btn-web"
                        >
                          {t.menuView.seeAll}
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>
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
        isAdmin={isAdmin}
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