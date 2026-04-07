'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import toast from 'react-hot-toast'
import { 
  ArrowLeft, 
  RefreshCw, 
  MapPin, 
  Phone, 
  User, 
  X, 
  Upload,
  Image as ImageIcon,
  Pencil,
  Trash2,
  Tag,
  ChefHat,
  Truck,
  Check,
  XCircle,
  Menu,
  Package,
  ShoppingBag,
  Layers,
  BarChart2,
  TrendingUp,
  Sparkles,
  Users,
  Settings, 
  Save,
  Mail,
  GripVertical,
  Globe,
  ListOrdered,
  Eye,
  LayoutTemplate,
  ChevronDown,
  Move,
  Store,
  BookOpen,
  Receipt,
} from 'lucide-react'
import LogoBackground from './LogoBackground'
import CityMapPicker from './CityMapPicker'
import { useLanguage } from '../context/LanguageContext'

function notifyCountriesCatalogUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('countriesCatalogUpdated'))
  }
}

// --- ТИПЫ ДАННЫХ (ИСПРАВЛЕНО ПОД 4 ЯЗЫКА) ---
interface Product {
  id: number
  // Названия
  name_ru: string
  name_ua?: string
  name_en?: string
  name_nl?: string
  
  price: number
  
  // Описания
  description_ru?: string
  description_ua?: string
  description_en?: string
  description_nl?: string

  categoryId: number
  imageUrl?: string
  isPopular: boolean
}

interface OrderItem {
  id: number
  product: Product
  quantity: number
  price: number
}

interface AdminOrderStats {
  totalOrders: number
  revenueCompleted: number
  paymentPaidCount: number
  byStatus: {
    PENDING: number
    COOKING: number
    DELIVERING: number
    COMPLETED: number
    CANCELLED: number
  }
  rawStatusCounts?: Record<string, number>
}

interface Order {
  id: number
  createdAt: string
  status: string 
  totalPrice: number
  customerName: string
  phone: string
  address: string
  comment?: string
  items: OrderItem[]
  fulfillmentType?: string
  deliveryFee?: number

  paymentMethod: 'CASH' | 'CARD' | 'APPLE_PAY' | 'GOOGLE_PAY' | 'IDEAL'
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED'
}

interface PromoCode {
  id: number
  code: string
  discount: number
  isActive: boolean
}

interface BlogPost {
  id: number
  title: string
  slug: string
  content: string
  imageUrl?: string | null
  videoUrl?: string | null
  author: string
  isPublished: boolean
  createdAt: string
  updatedAt: string
}

interface AdminViewProps {
  onBack: () => void
  /** Відкрити бокове меню головного сайту (доставка, меню, тощо) */
  onSiteMenuClick?: () => void
}

interface City {
  id: number
  name: string
  name_ua?: string
  name_nl?: string
  name_en?: string
  countryId?: number
  pricePerKm?: number
  latitude?: number
  longitude?: number
  zoom?: number
  isActive: boolean
  country?: {
    id: number
    name: string
    flag?: string
  }
  deliveryZones?: DeliveryZone[]
}

interface DeliveryZone {
  id: number
  name: string
  color: string
  cityId: number
  coordinates: string // JSON string
  isFreeDelivery?: boolean
  flatDeliveryFee?: number | null
}

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

interface MenuCategory {
  id: number
  name_ru: string
  name_ua?: string
  name_en?: string
  name_nl?: string
  slug: string
  emoji?: string
  order: number
  isActive: boolean
}

interface User {
  id: number
  email: string
  name: string | null
  phone: string | null
  role: string
  createdAt: string
  updatedAt: string
  _count: {
    orders: number
  }
}

interface CrmUser {
  id: number
  name: string | null
  email: string
  phone: string | null
  role?: string
  bonusBalance: number
  createdAt: string
  updatedAt?: string
  _count?: {
    orders: number
  }
}

interface TeamMember {
  id: number
  name_ru: string
  name_ua?: string
  name_en?: string
  name_nl?: string
  position_ru: string
  position_ua?: string
  position_en?: string
  position_nl?: string
  imageUrl?: string
  bio_ru?: string
  bio_ua?: string
  bio_en?: string
  bio_nl?: string
  order: number
  isActive: boolean
}
interface SiteSettings {
  bannerInterval: number
  telegramUrl: string
  whatsappUrl: string
  instagramUrl: string
  restaurantPickupAddress: string
  freeDeliveryThreshold: number
  deliveryFee: number
}

const defaultSiteSettings: SiteSettings = {
  bannerInterval: 5000,
  telegramUrl: '',
  whatsappUrl: '',
  instagramUrl: '',
  restaurantPickupAddress: '',
  freeDeliveryThreshold: 1000,
  deliveryFee: 50,
}

export default function AdminView({ onBack, onSiteMenuClick }: AdminViewProps) {
  const { t, adminUiLanguage, setAdminUiLanguage } = useLanguage()
  // Добавили вкладку 'promos', 'cities', 'banners', 'menuCategories' и 'users'
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'products' | 'promos' | 'blog' | 'crm' | 'cities' | 'banners' | 'menuCategories' | 'users' | 'team'| 'settings'| 'newsletter'| 'ingredients'>('dashboard')
  
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [promos, setPromos] = useState<PromoCode[]>([]) // Промокоды
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([])
  const [cities, setCities] = useState<City[]>([]) // Города
  const [countries, setCountries] = useState<any[]>([]) // Страны
  const [banners, setBanners] = useState<Banner[]>([]) // Баннеры
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]) // Категории меню
  const [users, setUsers] = useState<User[]>([]) // Пользователи
  const [crmUsers, setCrmUsers] = useState<CrmUser[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]) // Команда
  const [orderStats, setOrderStats] = useState<AdminOrderStats | null>(null)

  const [isLoading, setIsLoading] = useState(false)

  // Состояния для модального окна ТОВАРОВ
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  
  const [settings, setSettings] = useState<SiteSettings>(defaultSiteSettings)
  const [settingsLoading, setSettingsLoading] = useState(false)

  // Состояния для модального окна БАННЕРОВ
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false)
  const [editingBannerId, setEditingBannerId] = useState<number | null>(null)
  const [bannerFormData, setBannerFormData] = useState({
    title_ru: '', title_ua: '', title_en: '', title_nl: '',
    imageUrl: '',
    order: 0,
    isActive: true,
    focalX: 50,
    focalY: 50,
  })
  const [draggedBannerId, setDraggedBannerId] = useState<number | null>(null)
  const [bannerReorderBusy, setBannerReorderBusy] = useState(false)
  const [bannerImageDropActive, setBannerImageDropActive] = useState(false)
  const bannerUploadDragDepthRef = useRef(0)
  const [bannerPreviewLocale, setBannerPreviewLocale] = useState<'ru' | 'ua' | 'en' | 'nl'>('ru')
  
  // Состояния для модального окна КАТЕГОРИЙ МЕНЮ
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null)
  const [categoryFormData, setCategoryFormData] = useState({
    name_ru: '', name_ua: '', name_en: '', name_nl: '',
    slug: '',
    emoji: '🍣',
    order: 0,
    isActive: true
  })
  
  // Состояния для модального окна КОМАНДЫ
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false)
  const [editingTeamId, setEditingTeamId] = useState<number | null>(null)
  const [teamFormData, setTeamFormData] = useState({
    name_ru: '', name_ua: '', name_en: '', name_nl: '',
    position_ru: '', position_ua: '', position_en: '', position_nl: '',
    bio_ru: '', bio_ua: '', bio_en: '', bio_nl: '',
    imageUrl: '',
    order: 0,
    isActive: true
  })
  //Состояния для создания ингредиентов
  const [ingredients, setIngredients] = useState<any[]>([]);
  // Состояния для создания ПРОМОКОДА
  const [newPromoCode, setNewPromoCode] = useState('')
  const [newPromoDiscount, setNewPromoDiscount] = useState('')
  const [blogForm, setBlogForm] = useState({
    id: null as number | null,
    title: '',
    slug: '',
    imageUrl: '',
    videoUrl: '',
    content: '',
    author: 'Шеф Watta Sushi',
    isPublished: true,
  })
  const [crmMailing, setCrmMailing] = useState({
    channel: 'email' as 'email' | 'sms',
    subject: '',
    message: '',
  })

  // Единое состояние формы товара (ОБНОВЛЕНО)
  const [formData, setFormData] = useState({
    name_ru: '', name_ua: '', name_en: '', name_nl: '',
    price: '',
    description_ru: '', description_ua: '', description_en: '', description_nl: '',
    categoryId: '',
    imageUrl: '',
    cityIds: [] as number[],
    ingredientIds: [] as number[] // Города для товара
  })

  // Состояния для управления городами
  const [newCityName, setNewCityName] = useState('')
  const [newCityNameUa, setNewCityNameUa] = useState('')
  const [newCityNameEn, setNewCityNameEn] = useState('')
  const [newCityNameNl, setNewCityNameNl] = useState('')
  const [newCityCountryId, setNewCityCountryId] = useState<number | null>(null)
  const [newCityLatitude, setNewCityLatitude] = useState('')
  const [newCityLongitude, setNewCityLongitude] = useState('')
  const [newCityZoom, setNewCityZoom] = useState('12')
  const [newCityPricePerKm, setNewCityPricePerKm] = useState('10')
  const [newCityIsActive, setNewCityIsActive] = useState(true)
  const [editingCityId, setEditingCityId] = useState<number | null>(null)
  const [cityMapSearchQuery, setCityMapSearchQuery] = useState('')
  const cityFormRef = useRef<HTMLDivElement>(null)
  const [cityMapSearchResults, setCityMapSearchResults] = useState<{ lat: string; lon: string; display_name: string; address?: { city?: string; town?: string; village?: string; country?: string; state?: string } }[]>([])
  const [cityMapSearchLoading, setCityMapSearchLoading] = useState(false)
  const [cityMapSearchOpen, setCityMapSearchOpen] = useState(false)
  const cityMapSearchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const skipSearchOnceRef = useRef(false)
  const [editorDeliveryZones, setEditorDeliveryZones] = useState<
    { id: number; name: string; isFreeDelivery: boolean; flatDeliveryFee: number | null }[]
  >([])
  const [editorZonesLoading, setEditorZonesLoading] = useState(false)
  const bannerFocalPreviewRef = useRef<HTMLDivElement>(null)
  const bannerFocalDragRef = useRef<{
    active: boolean
    pointerId: number
    startX: number
    startY: number
    startFx: number
    startFy: number
  } | null>(null)
  /** Один раз ініціалізувати адмінку (уникаємо подвійного fetch/toast у React Strict Mode). */
  const adminBootstrapOnceRef = useRef(false)

  /** При вході в адмінку — завжди зверху (скрол основного контейнера додатку) */
  useEffect(() => {
    if (typeof window === 'undefined') return
    const scrollAppToTop = () => {
      const content = document.querySelector('.content-web')
      if (content instanceof HTMLElement) {
        content.scrollTop = 0
        content.scrollLeft = 0
      }
      window.scrollTo(0, 0)
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
    }
    scrollAppToTop()
    requestAnimationFrame(scrollAppToTop)
    const t = window.setTimeout(scrollAppToTop, 0)
    return () => window.clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!isBannerModalOpen) {
      setBannerImageDropActive(false)
      bannerUploadDragDepthRef.current = 0
    }
  }, [isBannerModalOpen])
  
  // Состояния для управления странами
  const [newCountryName, setNewCountryName] = useState('')
  const [newCountryNameUa, setNewCountryNameUa] = useState('')
  const [newCountryNameEn, setNewCountryNameEn] = useState('')
  const [newCountryNameNl, setNewCountryNameNl] = useState('')
  const [newCountryCode, setNewCountryCode] = useState('')
  const [newCountryFlag, setNewCountryFlag] = useState('🌍')
  const [isFlagPickerOpen, setIsFlagPickerOpen] = useState(false)
  const [editingCountryId, setEditingCountryId] = useState<number | null>(null)
  const [editCountryFlag, setEditCountryFlag] = useState('🌍')
  const [isEditFlagPickerOpen, setIsEditFlagPickerOpen] = useState(false)
  
  // Список популярных флагов стран
  const countryFlags = [
    '🇺🇦', '🇳🇱', '🇷🇺', '🇬🇧', '🇺🇸', '🇩🇪', '🇫🇷', '🇮🇹', '🇪🇸', '🇵🇱',
    '🇨🇿', '🇭🇺', '🇷🇴', '🇧🇬', '🇬🇷', '🇵🇹', '🇧🇪', '🇦🇹', '🇨🇭', '🇸🇪',
    '🇳🇴', '🇩🇰', '🇫🇮', '🇮🇪', '🇮🇸', '🇱🇺', '🇲🇹', '🇨🇾', '🇪🇪', '🇱🇻',
    '🇱🇹', '🇸🇰', '🇸🇮', '🇭🇷', '🇲🇰', '🇦🇱', '🇲🇪', '🇧🇦', '🇷🇸', '🇽🇰',
    '🇯🇵', '🇰🇷', '🇨🇳', '🇮🇳', '🇹🇭', '🇻🇳', '🇸🇬', '🇲🇾', '🇮🇩', '🇵🇭',
    '🇦🇺', '🇳🇿', '🇨🇦', '🇲🇽', '🇧🇷', '🇦🇷', '🇨🇱', '🇨🇴', '🇵🇪', '🇿🇦',
    '🇪🇬', '🇹🇷', '🇸🇦', '🇦🇪', '🇮🇱', '🇯🇴', '🇱🇧', '🇮🇶', '🇮🇷', '🌍'
  ]
  
  // Состояния для управления зонами доставки
  const [selectedCityForZones, setSelectedCityForZones] = useState<number | null>(null)
  const [newZoneName, setNewZoneName] = useState('')
  const [newZoneColor, setNewZoneColor] = useState('#4ade80')
  const [newZoneCoordinates, setNewZoneCoordinates] = useState('')
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false)
  const toastStyle = { borderRadius: '0.75rem' }
  const notifySuccess = (message: string) =>
    toast.success(message, {
      style: toastStyle,
      iconTheme: { primary: '#145142', secondary: '#ffffff' },
    })
  const notifyError = (message: string) => toast.error(message, { style: toastStyle })
  // const alert = (message: string) => notifyError(String(message))

  // --- ЗАГРУЗКА ДАННЫХ ---
  const fetchAll = async () => {
    setIsLoading(true)
    
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        toast.error('Вы не авторизованы. Пожалуйста, войдите в систему.', { id: 'admin-panel-auth' })
        onBack()
        return
      }
      
      const headers = { 'Authorization': `Bearer ${token}` }
      const [
        ingredientsRes,
        ordersRes,
        ordersStatsRes,
        prodRes,
        catRes,
        citiesRes,
        countriesRes,
        promosRes,
        blogRes,
        crmUsersRes,
        bannersRes,
        teamRes,
      ] = await Promise.all([
        fetch('/api/ingredients', { headers }),
        fetch('/api/orders', { headers }),
        fetch('/api/orders/stats', { headers }),
        fetch('/api/products', { headers }),
        fetch('/api/products/categories', { headers }),
        fetch('/api/cities/all', { headers }),
        fetch('/api/countries/all', { headers }),
        fetch('/api/promo', { headers }),
        fetch('/api/blog/all', { headers }),
        fetch('/api/crm/users', { headers }),
        fetch('/api/banners/all', { headers }),
        fetch('/api/team/all', { headers }),
      ])
      fetch('/api/promotions')
        .then((r) => r.json())
        .then(setNewsItems)
        .catch(() => {})
      if (ingredientsRes.ok) setIngredients(await ingredientsRes.json())
      if (ordersStatsRes.ok) {
        try {
          setOrderStats(await ordersStatsRes.json())
        } catch {
          setOrderStats(null)
        }
      } else {
        setOrderStats(null)
      }
      if (ordersRes.ok) setOrders(await ordersRes.json())
      if (prodRes.ok) {
        const productsData = await prodRes.json()
        setProducts(Array.isArray(productsData) ? productsData : [])
      } else {
        setProducts([])
      }
      if (catRes.ok) { const c = await catRes.json(); setMenuCategories(c); }
      if (citiesRes.ok) setCities(await citiesRes.json())
      if (countriesRes.ok) setCountries(await countriesRes.json())
      if (promosRes.ok) setPromos(await promosRes.json())
      if (blogRes.ok) setBlogPosts(await blogRes.json())
      if (crmUsersRes.ok) {
        const list = await crmUsersRes.json()
        const arr = Array.isArray(list) ? list : []
        setCrmUsers(arr)
        setUsers(arr)
      } else {
        setCrmUsers([])
        setUsers([])
      }
      if (bannersRes.ok) setBanners(await bannersRes.json())
      if (teamRes.ok) setTeamMembers(await teamRes.json())
      if (
        [ingredientsRes, ordersRes, ordersStatsRes, prodRes, countriesRes, crmUsersRes].some(
          (r) => r.status === 401 || r.status === 403
        )
      ) {
        toast.error(
          'Сервер отклонил доступ (401/403). Войдите снова как администратор или проверьте, что backend запущен и NEXT_PUBLIC_API_URL указывает на него.',
          { id: 'admin-panel-auth' }
        )
        onBack()
      }
      const settingsRes = await fetch('/api/settings', { headers })
      if (settingsRes.ok) {
        const raw = await settingsRes.json()
        setSettings({ ...defaultSiteSettings, ...raw })
      }
    } catch (e) {
      console.error(e)
      toast.error('Ошибка при загрузке данных')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchData = fetchAll

  useEffect(() => {
    if (!editingCityId) {
      setEditorDeliveryZones([])
      return
    }
    let cancelled = false
    setEditorZonesLoading(true)
    fetch(`/api/delivery-zones/city/${editingCityId}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((rows) => {
        if (cancelled) return
        if (!Array.isArray(rows)) {
          setEditorDeliveryZones([])
          return
        }
        setEditorDeliveryZones(
          rows.map((z: { id: number; name: string; isFreeDelivery?: boolean; flatDeliveryFee?: unknown }) => ({
            id: z.id,
            name: z.name,
            isFreeDelivery: z.isFreeDelivery === true,
            flatDeliveryFee:
              z.flatDeliveryFee != null && !Number.isNaN(Number(z.flatDeliveryFee))
                ? Number(z.flatDeliveryFee)
                : null,
          }))
        )
      })
      .catch(() => {
        if (!cancelled) setEditorDeliveryZones([])
      })
      .finally(() => {
        if (!cancelled) setEditorZonesLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [editingCityId])

  const saveEditorZoneTariff = useCallback(
    async (zoneId: number, body: { isFreeDelivery: boolean; flatDeliveryFee: number | null }) => {
      const token = localStorage.getItem('token')
      if (!token) {
        toast.error('Ви не авторизовані')
        return
      }
      try {
        const res = await fetch(`/api/delivery-zones/${zoneId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            isFreeDelivery: body.isFreeDelivery,
            flatDeliveryFee: body.isFreeDelivery ? null : body.flatDeliveryFee,
          }),
        })
        if (res.ok) {
          toast.success('Тариф зони збережено')
          notifyCountriesCatalogUpdated()
          fetchData()
        } else {
          const e = (await res.json().catch(() => ({}))) as { message?: string }
          toast.error(e.message || 'Помилка збереження')
        }
      } catch {
        toast.error('Помилка мережі')
      }
    },
    [fetchData]
  )

  // Одна ініціалізація: роль у localStorage + лише тоді завантаження даних (без дубля тостів / fetch).
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (adminBootstrapOnceRef.current) return
    adminBootstrapOnceRef.current = true

    const token = localStorage.getItem('token')
    const savedUser = localStorage.getItem('currentUser')

    if (!token || !savedUser) {
      toast.error('Вы не авторизованы. Пожалуйста, войдите в систему.', { id: 'admin-panel-auth' })
      onBack()
      return
    }

    try {
      const parsed = JSON.parse(savedUser) as { role?: string }
      if (parsed.role !== 'ADMIN') {
        toast.error(t.adminPage.auth.adminOnly, { id: 'admin-panel-auth' })
        onBack()
        return
      }
    } catch {
      toast.error('Ошибка проверки прав доступа', { id: 'admin-panel-auth' })
      onBack()
      return
    }

    void fetchAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- старт адмінки один раз при відкритті
  }, [])

  // Закрытие селектора флагов и поиска города при клике вне
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (isFlagPickerOpen && !target.closest('.flag-picker-container')) {
        setIsFlagPickerOpen(false)
      }
      if (isEditFlagPickerOpen && !target.closest('.edit-flag-picker-container')) {
        setIsEditFlagPickerOpen(false)
      }
      if (cityMapSearchOpen && !target.closest('.city-map-search-container')) {
        setCityMapSearchOpen(false)
      }
    }

    if (isFlagPickerOpen || isEditFlagPickerOpen || cityMapSearchOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isFlagPickerOpen, isEditFlagPickerOpen, cityMapSearchOpen])

  // Поиск города на карте (Nominatim) — дебаунс, кілька варіантів запиту, індекси всіх країн
  useEffect(() => {
    if (skipSearchOnceRef.current) {
      skipSearchOnceRef.current = false
      return
    }
    const raw = cityMapSearchQuery.trim()
    const minLen = /^[\dA-Za-z]/.test(raw) ? 1 : 2
    if (!raw || raw.length < minLen) {
      setCityMapSearchResults([])
      setCityMapSearchLoading(false)
      if (cityMapSearchDebounceRef.current) {
        clearTimeout(cityMapSearchDebounceRef.current)
        cityMapSearchDebounceRef.current = null
      }
      return
    }
    if (cityMapSearchDebounceRef.current) clearTimeout(cityMapSearchDebounceRef.current)
    const sel = countries.find((c: { id: number; code?: string; name?: string }) => c.id === newCityCountryId)
    const countryCodes = sel?.code ? `&countrycodes=${String(sel.code).toLowerCase()}` : ''
    const countryName = sel?.name ?? ''
    const headers = { 'Accept-Language': 'uk,en,ru,nl', 'User-Agent': 'WattaSushiAdmin/1.0' }
    const noSpaces = raw.replace(/\s/g, '').replace(/-/g, '')
    const hasDigits = /\d{2,}/.test(raw)
    const onlyPostcodeChars = /^[\dA-Za-z\s\-]{2,14}$/.test(raw)
    const postcodeLike = hasDigits && onlyPostcodeChars
    const numericPostcode = raw.replace(/\D/g, '').slice(0, 10) || raw
    const t = setTimeout(async () => {
      setCityMapSearchLoading(true)
      const seen = new Set<string>()
      const merged: { lat: string; lon: string; display_name: string; address?: { city?: string; town?: string; village?: string; country?: string } }[] = []
      const add = (list: unknown[]) => {
        const arr = Array.isArray(list) ? list : []
        arr.forEach((r) => {
          const x = r as { lat?: string; lon?: string }
          const key = `${x.lat},${x.lon}`
          if (key !== 'undefined,undefined' && !seen.has(key)) {
            seen.add(key)
            merged.push(r as (typeof merged)[0])
          }
        })
      }
      try {
        let data: unknown[] = []
        const qUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(raw)}&format=json&limit=8&addressdetails=1${countryCodes}`
        const qRes = await fetch(qUrl, { headers })
        data = await qRes.json().catch(() => [])
        add(data)
        if (merged.length === 0 && countryName) {
          const q2 = `${raw}, ${countryName}`
          const r2 = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q2)}&format=json&limit=8&addressdetails=1${countryCodes}`, { headers })
          const d2 = await r2.json().catch(() => [])
          add(d2)
        }
        if (merged.length === 0 && postcodeLike && countryName) {
          const struct = `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(numericPostcode)}&country=${encodeURIComponent(countryName)}&format=json&limit=8&addressdetails=1`
          const r3 = await fetch(struct, { headers })
          const d3 = await r3.json().catch(() => [])
          add(d3)
        }
        if (merged.length === 0 && postcodeLike && !countryName && numericPostcode.length >= 3) {
          const struct = `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(numericPostcode)}&format=json&limit=8&addressdetails=1`
          const r3b = await fetch(struct, { headers })
          const d3b = await r3b.json().catch(() => [])
          add(d3b)
        }
        if (merged.length === 0 && postcodeLike && /[A-Za-z]/.test(noSpaces)) {
          const withSpace = raw.replace(/(\d{4})([A-Za-z]{2})/i, '$1 $2').replace(/(\d{5})([A-Za-z]{2})/i, '$1 $2').trim()
          const qPlus = countryName ? `${withSpace}, ${countryName}` : withSpace
          const r4 = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(qPlus)}&format=json&limit=8&addressdetails=1${countryCodes}`, { headers })
          const d4 = await r4.json().catch(() => [])
          add(d4)
        }
        if (merged.length === 0) {
          const photonRes = await fetch(
            `https://photon.komoot.io/api/?q=${encodeURIComponent(raw + (countryName ? ' ' + countryName : ''))}&limit=8&lang=uk`,
            { headers: { 'Accept': 'application/json', 'User-Agent': 'WattaSushiAdmin/1.0' } }
          ).catch(() => null)
          const photonJson = photonRes?.ok ? await photonRes.json().catch(() => null) : null
          const features = photonJson?.features ?? []
          features.forEach((f: { geometry?: { coordinates?: [number, number] }; properties?: { name?: string; city?: string; town?: string; locality?: string; municipality?: string; postcode?: string; country?: string } }) => {
            const coords = f.geometry?.coordinates
            if (!coords || coords.length < 2) return
            const lng = String(coords[0])
            const lat = String(coords[1])
            const key = `${lat},${lng}`
            if (seen.has(key)) return
            seen.add(key)
            const p = f.properties ?? {}
            const cityLike = p.city || p.town || p.locality || p.municipality
            const parts = [p.name, p.city, p.town, p.locality, p.municipality, p.postcode, p.country].filter(Boolean)
            const uniq = Array.from(new Set(parts))
            merged.push({
              lat,
              lon: lng,
              display_name: uniq.join(', ') || `${lat}, ${lng}`,
              address: cityLike ? { city: cityLike, town: p.town, village: p.locality, country: p.country } : undefined,
            })
          })
        }
        setCityMapSearchResults(merged)
        setCityMapSearchOpen(true)
      } catch {
        setCityMapSearchResults([])
        setCityMapSearchOpen(true)
      } finally {
        setCityMapSearchLoading(false)
      }
    }, 400)
    cityMapSearchDebounceRef.current = t
    return () => {
      clearTimeout(t)
      cityMapSearchDebounceRef.current = null
    }
  }, [cityMapSearchQuery, newCityCountryId, countries])

  const handleChooseCityFromMap = useCallback((r: { lat: string; lon: string; display_name: string; address?: { city?: string; town?: string; village?: string; municipality?: string; locality?: string; country?: string } }) => {
    setNewCityLatitude(r.lat)
    setNewCityLongitude(r.lon)
    setNewCityZoom('12')
    const addr = r.address as { city?: string; town?: string; village?: string; municipality?: string; locality?: string } | undefined
    const namePart = (addr?.city || addr?.town || addr?.village || addr?.municipality || addr?.locality || r.display_name.split(',')[0]?.trim() || r.display_name) || ''
    setNewCityName(namePart)
    setNewCityNameEn(namePart)
    setNewCityNameUa(namePart)
    setNewCityNameNl(namePart)
    skipSearchOnceRef.current = true
    setCityMapSearchQuery(r.display_name)
    setCityMapSearchResults([])
    setCityMapSearchOpen(false)
  }, [])

  const handleSearchCityByNames = useCallback(async () => {
    const parts = [newCityName, newCityNameUa, newCityNameEn, newCityNameNl].filter(Boolean).map((s) => s.trim())
    const names = Array.from(new Set(parts))
    if (!names.length) {
      toast.error('Введіть назву міста хоча б в одній мові (RU, UA, EN або NL).')
      return
    }
    const sel = countries.find((c: { id: number; name?: string; code?: string }) => c.id === newCityCountryId)
    const countryName = sel?.name ?? ''
    const countryCodes = sel?.code ? `&countrycodes=${String(sel.code).toLowerCase()}` : ''
    setCityMapSearchLoading(true)
    setCityMapSearchOpen(true)
    const seen = new Set<string>()
    const merged: { lat: string; lon: string; display_name: string; address?: { city?: string; town?: string; village?: string; country?: string } }[] = []
    try {
      for (const namePart of names) {
        const q = countryName ? `${namePart}, ${countryName}` : namePart
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&addressdetails=1${countryCodes}`,
          { headers: { 'Accept-Language': 'uk,en,ru,nl', 'User-Agent': 'WattaSushiAdmin/1.0' } }
        )
        const data = await res.json()
        const list = Array.isArray(data) ? data : []
        for (const r of list) {
          const key = `${r.lat},${r.lon}`
          if (!seen.has(key)) {
            seen.add(key)
            merged.push(r)
          }
        }
      }
      setCityMapSearchResults(merged)
    } catch {
      setCityMapSearchResults([])
    } finally {
      setCityMapSearchLoading(false)
    }
  }, [newCityName, newCityNameUa, newCityNameEn, newCityNameNl, newCityCountryId, countries])

  // --- БЛОК НОВОСТЕЙ (NEWS SYSTEM) ---
  interface NewsItem {
    id: number; title: string; description: string; content: string; imageUrl: string; isHit: boolean;
  }
  const [newsItems, setNewsItems] = useState<NewsItem[]>([])
  const [isNewsModalOpen, setIsNewsModalOpen] = useState(false)
  const [editingNews, setEditingNews] = useState<NewsItem | null>(null)

  const handleSaveNews = async (e: React.FormEvent) => {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const formData = new FormData(form)
    const isHitInput = form.querySelector('[name="isHit"]') as HTMLInputElement
    formData.set('isHit', String(isHitInput?.checked || false))
    
    const url = editingNews ? `/api/promotions/${editingNews.id}` : '/api/promotions'
    const method = editingNews ? 'PUT' : 'POST'
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(url, { method, headers: { 'Authorization': `Bearer ${token}` }, body: formData })
      if (res.ok) {
        toast.success(t.adminPage.common.saveSuccess); setIsNewsModalOpen(false); setEditingNews(null);
        fetch('/api/promotions').then(r => r.json()).then(setNewsItems)
      } else toast.error(t.adminPage.common.updateError)
    } catch (e) { toast.error(t.adminPage.common.networkError) }
  }

  const handleDeleteNews = async (id: number) => {
    if (!confirm('Удалить?')) return
    try {
      const token = localStorage.getItem('token')
      await fetch(`/api/promotions/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } })
      setNewsItems(newsItems.filter(p => p.id !== id))
    } catch { toast.error('Ошибка') }
  }
  const [editorLang, setEditorLang] = useState<'ru' | 'ua' | 'en' | 'nl'>('ru');

  // --- ЛОГИКА ТОВАРОВ (ФОРМА) ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, imageUrl: reader.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  const openCreateModal = async () => {
    setEditingId(null)
    // Загружаем города при открытии модального окна
    const citiesRes = await fetch('/api/cities/all')
    if (citiesRes.ok) {
      const citiesData = await citiesRes.json()
      setCities(citiesData)
    }
    setFormData({ 
      name_ru: '', name_ua: '', name_en: '', name_nl: '',
      price: '', 
      description_ru: '', description_ua: '', description_en: '', description_nl: '',
      categoryId: '', imageUrl: '',
      cityIds: [],
      ingredientIds: []   
    })
    setIsModalOpen(true)
  }

  const openEditModal = async (product: Product) => {
    setEditingId(product.id)
    // Загружаем города и связи товара с городами
    const [citiesRes, productRes] = await Promise.all([
      fetch('/api/cities/all'),
      fetch(`/api/products/${product.id}`)
    ])
    if (citiesRes.ok) {
      const citiesData = await citiesRes.json()
      setCities(citiesData)
    }
    if (productRes.ok) {
      const productData = await productRes.json()
      setFormData({
        name_ru: product.name_ru,
        name_ua: product.name_ua || '',
        name_en: product.name_en || '',
        name_nl: product.name_nl || '',
        
        price: product.price.toString(),
        
        description_ru: product.description_ru || '',
        description_ua: product.description_ua || '',
        description_en: product.description_en || '',
        description_nl: product.description_nl || '',
        
        categoryId: product.categoryId.toString(),
        imageUrl: product.imageUrl || '',
        cityIds: productData.cities?.map((pc: any) => pc.cityId) || [],
        ingredientIds: []
      })
    } else {
      setFormData({
        name_ru: product.name_ru,
        name_ua: product.name_ua || '',
        name_en: product.name_en || '',
        name_nl: product.name_nl || '',
        
        price: product.price.toString(),
        
        description_ru: product.description_ru || '',
        description_ua: product.description_ua || '',
        description_en: product.description_en || '',
        description_nl: product.description_nl || '',
        
        categoryId: product.categoryId.toString(),
        imageUrl: product.imageUrl || '',
        cityIds: [],
        ingredientIds: []
      })
    }
    setIsModalOpen(true)
  }

  const handleDeleteProduct = async (id: number) => {
    if (!confirm(t.adminPage.products.deleteConfirm)) return
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        toast.error(t.adminPage.auth.notAuthorized)
        return
      }
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        fetchData()
        // Отправляем событие для обновления товаров в MenuView
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('productsUpdated'))
        }
        toast.success(t.adminPage.products.deleted)
      } else {
        let errorMessage = 'Ошибка удаления'
        try {
          const error = await res.json()
          errorMessage = error.message || error.error || `Ошибка ${res.status}: ${res.statusText}`
        } catch {
          errorMessage = `Ошибка ${res.status}: ${res.statusText}`
        }
        toast.error(errorMessage)
      }
    } catch (error: any) { 
      console.error('Ошибка удаления товара:', error)
      const errorMessage = error.message || 'Не удалось подключиться к серверу. Проверьте, запущен ли backend сервер.'
      toast.error(`Ошибка соединения: ${errorMessage}`)
    }
  }

  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        toast.error(t.adminPage.auth.notAuthorized)
        return
      }
      const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
      
      let res
      if (editingId) {
        res = await fetch(`/api/products/${editingId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(formData)
        })
      } else {
        res = await fetch('/api/products', {
          method: 'POST',
          headers,
          body: JSON.stringify(formData)
        })
      }
      
      if (res.ok) {
        setIsModalOpen(false)
        fetchData()
        // Отправляем событие для обновления товаров в MenuView (если нужно)
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('productsUpdated'))
        }
        toast.success(t.adminPage.products.saved)
      } else {
        let errorMessage = 'Ошибка при сохранении'
        try {
          const error = await res.json()
          errorMessage = error.message || error.error || `Ошибка ${res.status}: ${res.statusText}`
        } catch {
          errorMessage = `Ошибка ${res.status}: ${res.statusText}`
        }
        toast.error(errorMessage)
      }
    } catch (error: any) { 
      console.error('Ошибка сохранения товара:', error)
      const errorMessage = error.message || 'Не удалось подключиться к серверу. Проверьте, запущен ли backend сервер.'
      toast.error(`Ошибка соединения: ${errorMessage}`)
    }
  }

  // --- ЛОГИКА ЗАКАЗОВ (СТАТУСЫ) ---
  const updateStatus = async (orderId: number, newStatus: string) => {
    if (!confirm(`${t.adminPage.orders.changeStatusConfirm} "${newStatus}"?`)) return
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        notifyError(t.adminPage.auth.notAuthorized)
        return
      }
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      })
      if (res.ok) {
        fetchData() // Обновляем список
        toast.success(t.adminPage.common.statusUpdated)
      } else {
        let errorMessage = t.adminPage.common.updateError
        try {
          const error = await res.json()
          errorMessage = error.message || error.error || `Ошибка ${res.status}: ${res.statusText}`
        } catch {
          errorMessage = `Ошибка ${res.status}: ${res.statusText}`
        }
        toast.error(errorMessage)
      }
    } catch (error: any) { 
      console.error('Ошибка обновления статуса:', error)
      const errorMessage = error.message || 'Не удалось подключиться к серверу. Проверьте, запущен ли backend сервер.'
      toast.error(`Ошибка соединения: ${errorMessage}`)
    }
  }

  // --- ЛОГИКА ГОРОДОВ ---
  const resetCityForm = useCallback(() => {
    setNewCityName('')
    setNewCityNameUa('')
    setNewCityNameNl('')
    setNewCityNameEn('')
    setNewCityCountryId(null)
    setNewCityLatitude('')
    setNewCityLongitude('')
    setNewCityZoom('12')
    setNewCityPricePerKm('10')
    setNewCityIsActive(true)
    setCityMapSearchQuery('')
    setCityMapSearchResults([])
    setCityMapSearchOpen(false)
  }, [])

  const handleStartEditCity = useCallback((city: City) => {
    setEditingCityId(city.id)
    setNewCityName(city.name)
    setNewCityNameUa(city.name_ua || city.name)
    setNewCityNameEn(city.name_en || city.name)
    setNewCityNameNl(city.name_nl || city.name)   
    setNewCityCountryId(city.countryId ?? null)
    setNewCityLatitude(city.latitude != null ? String(city.latitude) : '')
    setNewCityLongitude(city.longitude != null ? String(city.longitude) : '')
    setNewCityZoom(city.zoom != null ? String(city.zoom) : '12')
    setNewCityPricePerKm(
      city.pricePerKm != null && Number.isFinite(city.pricePerKm) ? String(city.pricePerKm) : '10'
    )
    setNewCityIsActive(city.isActive)
    const currentOnMap = [city.name, city.country?.name].filter(Boolean).join(', ') || '📍 поточна локація'
    setCityMapSearchQuery(currentOnMap)
    setCityMapSearchResults([])
    setCityMapSearchOpen(false)
    skipSearchOnceRef.current = true
    setTimeout(() => cityFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
  }, [])

  const handleCancelEditCity = useCallback(() => {
    setEditingCityId(null)
    resetCityForm()
  }, [resetCityForm])

  const handleCreateCity = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCityName || !newCityCountryId) {
      toast.error(t.adminPage.cities.required)
      return
    }
    if (!newCityLatitude || !newCityLongitude) {
      toast.error('Спочатку оберіть місто з пошуку на карті (введіть назву й натисніть «Вибрати»)')
      return
    }
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        toast.error('Вы не авторизованы')
        return
      }
      const res = await fetch('/api/cities', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          name: newCityName, 
          name_ua: newCityNameUa || newCityName,
          name_nl: newCityNameNl || newCityName,
          name_en: newCityNameEn || newCityName,
          countryId: newCityCountryId,
          latitude: newCityLatitude ? parseFloat(newCityLatitude) : null,
          longitude: newCityLongitude ? parseFloat(newCityLongitude) : null,
          zoom: newCityZoom ? parseInt(newCityZoom) : 12,
          pricePerKm: newCityPricePerKm ? parseFloat(newCityPricePerKm) : 10,
        })
      })
      if (res.ok) {
        resetCityForm()
        fetchData()
        notifyCountriesCatalogUpdated()
        toast.success(t.adminPage.cities.created)
      } else {
        let errorMessage = 'Ошибка создания города'
        try {
          const error = await res.json()
          errorMessage = error.message || error.error || `Ошибка ${res.status}: ${res.statusText}`
        } catch {
          errorMessage = `Ошибка ${res.status}: ${res.statusText}`
        }
        toast.error(errorMessage)
      }
    } catch (error: any) {
      console.error('Ошибка создания города:', error)
      const errorMessage = error.message || 'Не удалось подключиться к серверу. Проверьте, запущен ли backend сервер.'
      toast.error(`Ошибка соединения: ${errorMessage}`)
    }
  }
  
  const handleCreateCountry = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCountryName) {
      toast.error(t.adminPage.countries.required)
      return
    }
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        toast.error(t.adminPage.auth.notAuthorized)
        return
      }
      
      // Генерируем код страны автоматически на основе названия, если не указан
      let countryCode = newCountryCode.toUpperCase()
      if (!countryCode) {
        // Простая генерация кода на основе первых букв названия
        const codeMap: { [key: string]: string } = {
          'Украина': 'UA',
          'Україна': 'UA',
          'Нидерланды': 'NL',
          'Nederland': 'NL',
          'Россия': 'RU',
          'Russia': 'RU',
          'United States': 'US',
          'США': 'US',
          'United Kingdom': 'GB',
          'Великобритания': 'GB',
          'Germany': 'DE',
          'Германия': 'DE',
          'France': 'FR',
          'Франция': 'FR',
          'Italy': 'IT',
          'Италия': 'IT',
          'Spain': 'ES',
          'Испания': 'ES',
          'Poland': 'PL',
          'Польша': 'PL'
        }
        
        // Проверяем карту соответствий
        countryCode = codeMap[newCountryName] || codeMap[newCountryNameEn] || codeMap[newCountryNameUa] || 
                     newCountryName.substring(0, 2).toUpperCase() || 'XX'
      }
      
      const res = await fetch('/api/countries', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          name: newCountryName,
          name_ua: newCountryNameUa || newCountryName,
          name_en: newCountryNameEn || newCountryName,
          name_nl: newCountryNameNl || newCountryName,
          code: countryCode,
          flag: newCountryFlag
        })
      })
      if (res.ok) {
        setNewCountryName('')
        setNewCountryNameUa('')
        setNewCountryNameEn('')
        setNewCountryNameNl('')
        setNewCountryCode('')
        setNewCountryFlag('🌍')
        fetchData()
        notifyCountriesCatalogUpdated()
        toast.success(t.adminPage.countries.created)
      } else {
        let errorMessage = t.adminPage.common.error
        try {
          const error = await res.json()
          errorMessage = error.message || error.error || `Ошибка ${res.status}: ${res.statusText}`
        } catch {
          errorMessage = `Ошибка ${res.status}: ${res.statusText}`
        }
        toast.error(errorMessage)
      }
    } catch (error: any) {
      console.error('Ошибка создания страны:', error)
      const errorMessage = error.message || 'Не удалось подключиться к серверу. Проверьте, запущен ли backend сервер.'
      toast.error(`Ошибка соединения: ${errorMessage}`)
    }
  }

  const handleUpdateCityFromForm = async () => {
    if (!editingCityId) return
    if (!newCityName || !newCityCountryId) {
      toast.error('Назва міста та країна обовʼязкові')
      return
    }
    if (!newCityLatitude || !newCityLongitude) {
      toast.error('Спочатку оберіть локацію на карті (пошук → Вибрати або клік по маркеру)')
      return
    }
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        toast.error('Ви не авторизовані')
        return
      }
      const res = await fetch(`/api/cities/${editingCityId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          name: newCityName, 
          name_ua: newCityNameUa || newCityName,
          name_nl: newCityNameNl || newCityName,
          name_en: newCityNameEn || newCityName,
          countryId: newCityCountryId,
          latitude: newCityLatitude ? parseFloat(newCityLatitude) : null,
          longitude: newCityLongitude ? parseFloat(newCityLongitude) : null,
          zoom: newCityZoom ? parseInt(newCityZoom) : 12,
          pricePerKm: newCityPricePerKm ? parseFloat(newCityPricePerKm) : 10,
          isActive: newCityIsActive
        })
      })
      if (res.ok) {
        setEditingCityId(null)
        resetCityForm()
        fetchData()
        notifyCountriesCatalogUpdated()
        toast.success('Місто успішно оновлено!')
      } else {
        let errorMessage = 'Помилка оновлення міста'
        try {
          const err = await res.json()
          errorMessage = err.message || err.error || `Помилка ${res.status}: ${res.statusText}`
        } catch {
          errorMessage = `Помилка ${res.status}: ${res.statusText}`
        }
        toast.error(errorMessage)
      }
    } catch (error: any) {
      console.error('Ошибка обновления города:', error)
      toast.error(error?.message || 'Не вдалося підключитися до сервера. Перевірте, чи запущений backend.')
    }
  }

  const handleDeleteCity = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот город? Это также удалит все связи с товарами.')) return
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        toast.error('Вы не авторизованы')
        return
      }
      const res = await fetch(`/api/cities/${id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        fetchData()
        notifyCountriesCatalogUpdated()
        toast.success('Город успешно удален!')
      } else {
        let errorMessage = 'Ошибка удаления'
        try {
          const error = await res.json()
          errorMessage = error.message || error.error || `Ошибка ${res.status}: ${res.statusText}`
        } catch {
          errorMessage = `Ошибка ${res.status}: ${res.statusText}`
        }
        toast.error(errorMessage)
      }
    } catch (error: any) {
      console.error('Ошибка удаления города:', error)
      const errorMessage = error.message || 'Не удалось подключиться к серверу. Проверьте, запущен ли backend сервер.'
      toast.error(`Ошибка соединения: ${errorMessage}`)
    }
  }

  const handleUpdateCountry = async (
    id: number,
    name: string,
    name_ua: string,
    name_en: string,
    name_nl: string,
    flag: string,
    code: string,
    isActive: boolean
  ) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        toast.error('Вы не авторизованы')
        return
      }
      if (!name.trim()) {
        toast.error('Название страны обязательно')
        return
      }
      const res = await fetch(`/api/countries/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          name_ua: name_ua.trim() || name.trim(),
          name_en: name_en.trim() || name.trim(),
          name_nl: name_nl.trim() || name.trim(),
          flag: flag || '🌍',
          code: (code || 'XX').trim().toUpperCase().slice(0, 10),
          isActive,
        }),
      })
      if (res.ok) {
        setEditingCountryId(null)
        setIsEditFlagPickerOpen(false)
        fetchData()
        notifyCountriesCatalogUpdated()
        toast.success('Страна успешно обновлена!')
      } else {
        let errorMessage = 'Ошибка обновления страны'
        try {
          const err = await res.json()
          errorMessage = err.message || err.error || `Ошибка ${res.status}: ${res.statusText}`
        } catch {
          errorMessage = `Ошибка ${res.status}: ${res.statusText}`
        }
        toast.error(errorMessage)
      }
    } catch (error: any) {
      console.error('Ошибка обновления страны:', error)
      toast.error(`Ошибка соединения: ${error?.message || 'Проверьте, запущен ли backend.'}`)
    }
  }

  const handleDeleteCountry = async (id: number) => {
    if (!confirm('Удалить эту страну? Будут удалены и все её города с зонами доставки.')) return
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        toast.error('Вы не авторизованы')
        return
      }
      const res = await fetch(`/api/countries/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      })
      if (res.ok) {
        setEditingCountryId(null)
        setIsEditFlagPickerOpen(false)
        fetchData()
        notifyCountriesCatalogUpdated()
        toast.success('Страна успешно удалена!')
      } else {
        let errorMessage = 'Ошибка удаления'
        try {
          const err = await res.json()
          errorMessage = err.message || err.error || `Ошибка ${res.status}: ${res.statusText}`
        } catch {
          errorMessage = `Ошибка ${res.status}: ${res.statusText}`
        }
        toast.error(errorMessage)
      }
    } catch (error: any) {
      console.error('Ошибка удаления страны:', error)
      toast.error(`Ошибка соединения: ${error?.message || 'Проверьте, запущен ли backend.'}`)
    }
  }

  const toggleCitySelection = (cityId: number) => {
    setFormData(prev => ({
      ...prev,
      cityIds: prev.cityIds.includes(cityId)
        ? prev.cityIds.filter(id => id !== cityId)
        : [...prev.cityIds, cityId]
    }))
  }

  // --- ЛОГИКА ПРОМОКОДОВ ---
  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPromoCode || !newPromoDiscount) return

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        toast.error('Вы не авторизованы')
        return
      }
      const res = await fetch('/api/promo/create', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ code: newPromoCode, discount: newPromoDiscount })
      })
      if (res.ok) {
        setNewPromoCode('')
        setNewPromoDiscount('')
        fetchData()
        toast.success('Промокод успешно создан!')
      } else {
        let errorMessage = 'Ошибка создания промокода'
        try {
          const error = await res.json()
          errorMessage = error.message || error.error || 'Возможно код уже существует'
        } catch {
          errorMessage = `Ошибка ${res.status}: ${res.statusText}`
        }
        toast.error(errorMessage)
      }
    } catch (error: any) { 
      console.error('Ошибка создания промокода:', error)
      const errorMessage = error.message || 'Не удалось подключиться к серверу. Проверьте, запущен ли backend сервер.'
      toast.error(`Ошибка соединения: ${errorMessage}`)
    }
  }

  const handleDeletePromo = async (id: number) => {
    if (!confirm('Удалить этот код?')) return
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        toast.error('Вы не авторизованы')
        return
      }
      const res = await fetch(`/api/promo/${id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        fetchData()
        toast.success('Промокод успешно удален!')
      } else {
        let errorMessage = 'Ошибка удаления'
        try {
          const error = await res.json()
          errorMessage = error.message || error.error || `Ошибка ${res.status}: ${res.statusText}`
        } catch {
          errorMessage = `Ошибка ${res.status}: ${res.statusText}`
        }
        toast.error(errorMessage)
      }
    } catch (error: any) { 
      console.error('Ошибка удаления промокода:', error)
      const errorMessage = error.message || 'Не удалось подключиться к серверу. Проверьте, запущен ли backend сервер.'
      toast.error(`Ошибка соединения: ${errorMessage}`)
    }
  }

  const resetBlogForm = () => {
    setBlogForm({
      id: null,
      title: '',
      slug: '',
      imageUrl: '',
      videoUrl: '',
      content: '',
      author: 'Шеф Watta Sushi',
      isPublished: true,
    })
  }

  const handleEditBlogPost = (post: BlogPost) => {
    setBlogForm({
      id: post.id,
      title: post.title,
      slug: post.slug,
      imageUrl: post.imageUrl || '',
      videoUrl: post.videoUrl || '',
      content: post.content,
      author: post.author || 'Шеф Watta Sushi',
      isPublished: post.isPublished,
    })
  }

  const handleSaveBlogPost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!blogForm.title.trim() || !blogForm.slug.trim() || !blogForm.content.trim()) {
      toast.error('Заполните title, slug и content')
      return
    }
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        toast.error('Вы не авторизованы')
        return
      }
      const method = blogForm.id ? 'PUT' : 'POST'
      const url = blogForm.id ? `/api/blog/${blogForm.id}` : '/api/blog'
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: blogForm.title,
          slug: blogForm.slug,
          imageUrl: blogForm.imageUrl || null,
          videoUrl: blogForm.videoUrl || null,
          content: blogForm.content,
          author: blogForm.author || 'Шеф Watta Sushi',
          isPublished: blogForm.isPublished,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.message || 'Ошибка сохранения статьи')
      }
      toast.success(blogForm.id ? 'Статья обновлена' : 'Статья создана')
      resetBlogForm()
      fetchData()
    } catch (error: any) {
      toast.error(error?.message || 'Ошибка сохранения статьи')
    }
  }

  const handleDeleteBlogPost = async (id: number) => {
    if (!confirm('Удалить эту статью?')) return
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        toast.error('Вы не авторизованы')
        return
      }
      const res = await fetch(`/api/blog/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.message || 'Ошибка удаления статьи')
      }
      toast.success('Статья удалена')
      if (blogForm.id === id) resetBlogForm()
      fetchData()
    } catch (error: any) {
      toast.error(error?.message || 'Ошибка удаления статьи')
    }
  }

  const handleSendCrmPromo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!crmMailing.message.trim()) {
      toast.error('Введите текст сообщения')
      return
    }
    if (crmMailing.channel === 'email' && !crmMailing.subject.trim()) {
      toast.error('Введите тему письма')
      return
    }

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        toast.error('Вы не авторизованы')
        return
      }
      const res = await fetch('/api/crm/send-promo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          channel: crmMailing.channel,
          subject: crmMailing.subject,
          message: crmMailing.message,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.message || 'Ошибка запуска рассылки')
      }
      toast.success('Рассылка успешно запущена!')
      setCrmMailing((prev) => ({ ...prev, subject: '', message: '' }))
    } catch (error: any) {
      toast.error(error?.message || 'Ошибка запуска рассылки')
    }
  }

  // --- ЛОГИКА БАННЕРОВ ---
  const onBannerFocalPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!bannerFormData.imageUrl || e.button !== 0) return
      e.preventDefault()
      e.currentTarget.setPointerCapture(e.pointerId)
      bannerFocalDragRef.current = {
        active: true,
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        startFx: bannerFormData.focalX,
        startFy: bannerFormData.focalY,
      }
    },
    [bannerFormData.imageUrl, bannerFormData.focalX, bannerFormData.focalY]
  )

  const onBannerFocalPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const d = bannerFocalDragRef.current
    if (!d?.active || d.pointerId !== e.pointerId) return
    const el = bannerFocalPreviewRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const dx = e.clientX - d.startX
    const dy = e.clientY - d.startY
    // 1:1 — зміщення на всю ширину/висоту прев’ю ≈ повний діапазон 0–100% (передбачуваний кадр як на сайті)
    const kx = 100 / Math.max(rect.width, 1)
    const ky = 100 / Math.max(rect.height, 1)
    const nx = Math.max(0, Math.min(100, d.startFx - dx * kx))
    const ny = Math.max(0, Math.min(100, d.startFy - dy * ky))
    setBannerFormData((prev) => ({ ...prev, focalX: nx, focalY: ny }))
  }, [])

  const endBannerFocalDrag = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const d = bannerFocalDragRef.current
    if (!d || d.pointerId !== e.pointerId) return
    bannerFocalDragRef.current = null
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
  }, [])

  const openCreateBannerModal = () => {
    setEditingBannerId(null)
    setBannerFormData({
      title_ru: '', title_ua: '', title_en: '', title_nl: '',
      imageUrl: '',
      order: banners.length,
      isActive: true,
      focalX: 50,
      focalY: 50,
    })
    setIsBannerModalOpen(true)
  }

  const openEditBannerModal = (banner: Banner) => {
    setEditingBannerId(banner.id)
    setBannerFormData({
      title_ru: banner.title_ru,
      title_ua: banner.title_ua || '',
      title_en: banner.title_en || '',
      title_nl: banner.title_nl || '',
      imageUrl: banner.imageUrl,
      order: banner.order,
      isActive: banner.isActive,
      focalX:
        typeof banner.focalX === 'number'
          ? Math.max(0, Math.min(100, banner.focalX))
          : 50,
      focalY:
        typeof banner.focalY === 'number'
          ? Math.max(0, Math.min(100, banner.focalY))
          : 50,
    })
    setIsBannerModalOpen(true)
  }

  const applyBannerImageFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Нужен файл изображения (JPG, PNG, WebP…)')
      return
    }
    const reader = new FileReader()
    reader.onloadend = () => {
      setBannerFormData((prev) => ({
        ...prev,
        imageUrl: reader.result as string,
        focalX: 50,
        focalY: 50,
      }))
    }
    reader.readAsDataURL(file)
  }, [])

  const handleBannerImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) applyBannerImageFile(file)
    e.target.value = ''
  }

  const onBannerUploadDragEnter = (ev: React.DragEvent) => {
    ev.preventDefault()
    ev.stopPropagation()
    bannerUploadDragDepthRef.current += 1
    setBannerImageDropActive(true)
  }

  const onBannerUploadDragLeave = (ev: React.DragEvent) => {
    ev.preventDefault()
    ev.stopPropagation()
    bannerUploadDragDepthRef.current -= 1
    if (bannerUploadDragDepthRef.current <= 0) {
      bannerUploadDragDepthRef.current = 0
      setBannerImageDropActive(false)
    }
  }

  const onBannerUploadDragOver = (ev: React.DragEvent) => {
    ev.preventDefault()
    ev.stopPropagation()
    ev.dataTransfer.dropEffect = 'copy'
  }

  const onBannerUploadDrop = (ev: React.DragEvent) => {
    ev.preventDefault()
    ev.stopPropagation()
    bannerUploadDragDepthRef.current = 0
    setBannerImageDropActive(false)
    const file = ev.dataTransfer.files?.[0]
    if (file) applyBannerImageFile(file)
  }

  const handleSubmitBanner = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        toast.error('Вы не авторизованы')
        return
      }
      const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
      
      let res
      if (editingBannerId) {
        res = await fetch(`/api/banners/${editingBannerId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(bannerFormData)
        })
      } else {
        res = await fetch('/api/banners', {
          method: 'POST',
          headers,
          body: JSON.stringify(bannerFormData)
        })
      }
      
      if (res.ok) {
        setIsBannerModalOpen(false)
        fetchData()
        // Отправляем событие для обновления баннеров в MenuView
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('bannersUpdated'))
        }
        toast.success('Баннер успешно сохранен!')
      } else {
        let errorMessage = 'Ошибка при сохранении'
        try {
          const error = await res.json()
          errorMessage = error.message || error.error || `Ошибка ${res.status}: ${res.statusText}`
        } catch {
          errorMessage = `Ошибка ${res.status}: ${res.statusText}`
        }
        toast.error(errorMessage)
      }
    } catch (error: any) { 
      console.error('Ошибка сохранения баннера:', error)
      const errorMessage = error.message || 'Не удалось подключиться к серверу. Проверьте, запущен ли backend сервер.'
      toast.error(`Ошибка соединения: ${errorMessage}`)
    }
  }

  const handleDeleteBanner = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот баннер?')) return
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        toast.error('Вы не авторизованы')
        return
      }
      const res = await fetch(`/api/banners/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        fetchData()
        // Отправляем событие для обновления баннеров в MenuView
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('bannersUpdated'))
        }
        toast.success('Баннер успешно удален!')
      } else {
        let errorMessage = 'Ошибка удаления'
        try {
          const error = await res.json()
          errorMessage = error.error || error.message || `Ошибка ${res.status}: ${res.statusText}`
        } catch {
          errorMessage = `Ошибка ${res.status}: ${res.statusText}`
        }
        toast.error(errorMessage)
      }
    } catch (error: any) { 
      console.error('Ошибка удаления баннера:', error)
      const errorMessage = error.message || 'Не удалось подключиться к серверу. Проверьте, запущен ли backend сервер.'
      toast.error(`Ошибка соединения: ${errorMessage}`)
    }
  }

  const sortedBanners = useMemo(
    () => [...banners].sort((a, b) => (a.order !== b.order ? a.order - b.order : a.id - b.id)),
    [banners],
  )

  const handleBannerDragStart = useCallback(
    (e: React.DragEvent, id: number) => {
      if (bannerReorderBusy) return
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', String(id))
      setDraggedBannerId(id)
    },
    [bannerReorderBusy],
  )

  const handleBannerDragEnd = useCallback(() => {
    setDraggedBannerId(null)
  }, [])

  const handleBannerDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const handleBannerDrop = useCallback(
    async (e: React.DragEvent, targetId: number) => {
      e.preventDefault()
      setDraggedBannerId(null)
      if (bannerReorderBusy) return
      const sourceId = parseInt(e.dataTransfer.getData('text/plain'), 10)
      if (!Number.isFinite(sourceId) || sourceId === targetId) return

      const sorted = [...banners].sort((a, b) => a.order - b.order || a.id - b.id)
      const fromIdx = sorted.findIndex((b) => b.id === sourceId)
      const toIdx = sorted.findIndex((b) => b.id === targetId)
      if (fromIdx < 0 || toIdx < 0) return

      const next = [...sorted]
      const [removed] = next.splice(fromIdx, 1)
      next.splice(toIdx, 0, removed)
      const withNewOrder = next.map((b, i) => ({ ...b, order: i }))
      setBanners(withNewOrder)

      const token = localStorage.getItem('token')
      if (!token) {
        toast.error('Вы не авторизованы')
        fetchData()
        return
      }

      setBannerReorderBusy(true)
      try {
        const results = await Promise.all(
          withNewOrder.map((b) =>
            fetch(`/api/banners/${b.id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                title_ru: b.title_ru,
                title_ua: b.title_ua ?? b.title_ru,
                title_en: b.title_en ?? b.title_ru,
                title_nl: b.title_nl ?? b.title_ru,
                imageUrl: b.imageUrl,
                order: b.order,
                isActive: b.isActive,
                focalX:
                  typeof b.focalX === 'number'
                    ? Math.max(0, Math.min(100, b.focalX))
                    : 50,
                focalY:
                  typeof b.focalY === 'number'
                    ? Math.max(0, Math.min(100, b.focalY))
                    : 50,
              }),
            }),
          ),
        )
        if (results.every((r) => r.ok)) {
          toast.success(t.adminPanel.common.bannerOrderSaved)
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('bannersUpdated'))
          }
          fetchData()
        } else {
          toast.error(t.adminPanel.common.bannerOrderSaveError)
          fetchData()
        }
      } catch {
        toast.error(t.adminPanel.common.bannerOrderSaveError)
        fetchData()
      } finally {
        setBannerReorderBusy(false)
      }
    },
    [banners, bannerReorderBusy, fetchData, t],
  )

  // --- ЛОГИКА КОМАНДЫ ---
  const openCreateTeamModal = () => {
    setEditingTeamId(null)
    setTeamFormData({
      name_ru: '', name_ua: '', name_en: '', name_nl: '',
      position_ru: '', position_ua: '', position_en: '', position_nl: '',
      bio_ru: '', bio_ua: '', bio_en: '', bio_nl: '',
      imageUrl: '',
      order: teamMembers.length,
      isActive: true
    })
    setIsTeamModalOpen(true)
  }

  const openEditTeamModal = (member: TeamMember) => {
    setEditingTeamId(member.id)
    setTeamFormData({
      name_ru: member.name_ru,
      name_ua: member.name_ua || '',
      name_en: member.name_en || '',
      name_nl: member.name_nl || '',
      position_ru: member.position_ru,
      position_ua: member.position_ua || '',
      position_en: member.position_en || '',
      position_nl: member.position_nl || '',
      bio_ru: member.bio_ru || '',
      bio_ua: member.bio_ua || '',
      bio_en: member.bio_en || '',
      bio_nl: member.bio_nl || '',
      imageUrl: member.imageUrl || '',
      order: member.order,
      isActive: member.isActive
    })
    setIsTeamModalOpen(true)
  }

  const handleTeamImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setTeamFormData(prev => ({ ...prev, imageUrl: reader.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmitTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        toast.error('Вы не авторизованы')
        return
      }
      const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
      
      let res
      if (editingTeamId) {
        res = await fetch(`/api/team/${editingTeamId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(teamFormData)
        })
      } else {
        res = await fetch('/api/team', {
          method: 'POST',
          headers,
          body: JSON.stringify(teamFormData)
        })
      }
      
      if (res.ok) {
        setIsTeamModalOpen(false)
        fetchData()
        toast.success('Член команды успешно сохранен!')
      } else {
        let errorMessage = 'Ошибка при сохранении'
        try {
          const error = await res.json()
          errorMessage = error.message || error.error || `Ошибка ${res.status}: ${res.statusText}`
        } catch {
          errorMessage = `Ошибка ${res.status}: ${res.statusText}`
        }
        toast.error(errorMessage)
      }
    } catch (error: any) { 
      console.error('Ошибка сохранения члена команды:', error)
      toast.error('Ошибка соединения')
    }
  }

  const handleDeleteTeam = async (id: number) => {
    if (!confirm('Удалить этого члена команды?')) return
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        toast.error('Вы не авторизованы')
        return
      }
      const res = await fetch(`/api/team/${id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        fetchData()
        toast.success('Член команды успешно удален!')
      } else {
        let errorMessage = 'Ошибка удаления'
        try {
          const error = await res.json()
          errorMessage = error.message || error.error || `Ошибка ${res.status}: ${res.statusText}`
        } catch {
          errorMessage = `Ошибка ${res.status}: ${res.statusText}`
        }
        toast.error(errorMessage)
      }
    } catch (error: any) { 
      console.error('Ошибка удаления члена команды:', error)
      toast.error('Ошибка соединения')
    }
  }

  const [newIngName, setNewIngName] = useState('')
  const [newIngImage, setNewIngImage] = useState('')
  const [ingLoading, setIngLoading] = useState(false)

  const handleIngImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setNewIngImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCreateIngredient = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newIngName || !newIngImage) return toast.error('Нужно название и фото')
    
    setIngLoading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/ingredients', {
        method: 'POST',
        headers: { 
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
            name_ru: newIngName, 
            imageUrl: newIngImage 
        })
      })
      if (res.ok) {
        setNewIngName('')
        setNewIngImage('')
        // Обновляем список (вызывайте fetchAll или отдельный запрос)
        const newIng = await res.json()
        setIngredients(prev => [...prev, newIng])
        toast.success('Ингредиент добавлен!')
      } else {
        toast.error('Ошибка создания')
      }
    } catch (e) {
      toast.error('Ошибка')
    } finally {
      setIngLoading(false)
    }
  }

  const handleDeleteIngredient = async (id: number) => {
      if(!confirm('Удалить этот ингредиент?')) return;
      // Логика удаления (fetch DELETE /api/ingredients/id)
      // ... допишите если нужно, или просто скройте
      try {
          const token = localStorage.getItem('token')
          await fetch(`/api/ingredients/${id}`, { 
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
          })
          setIngredients(prev => prev.filter(i => i.id !== id))
      } catch (e) { toast.error('Ошибка') }
  }

  // --- ЛОГИКА КАТЕГОРИЙ МЕНЮ ---
  const openCreateCategoryModal = () => {
    setEditingCategoryId(null)
    setCategoryFormData({
      name_ru: '', name_ua: '', name_en: '', name_nl: '',
      slug: '',
      emoji: '🍣',
      order: menuCategories.length,
      isActive: true
    })
    setIsCategoryModalOpen(true)
  }

  const openEditCategoryModal = (category: MenuCategory) => {
    // Преобразуем id в число, если это строка
    const categoryId = typeof category.id === 'string' ? parseInt(category.id) : category.id
    setEditingCategoryId(categoryId)
    setCategoryFormData({
      name_ru: category.name_ru,
      name_ua: category.name_ua || '',
      name_en: category.name_en || '',
      name_nl: category.name_nl || '',
      slug: category.slug,
      emoji: category.emoji || '🍣',
      order: category.order,
      isActive: category.isActive
    })
    setIsCategoryModalOpen(true)
  }

  const handleSubmitCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        toast.error('Вы не авторизованы')
        return
      }
      const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
      
      // Генерируем slug если не указан
      const slug = categoryFormData.slug || categoryFormData.name_ru.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      
      let res
      if (editingCategoryId) {
        res = await fetch(`/api/products/categories/${editingCategoryId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ ...categoryFormData, slug })
        })
      } else {
        res = await fetch('/api/products/categories', {
          method: 'POST',
          headers,
          body: JSON.stringify({ ...categoryFormData, slug })
        })
      }
      
      if (res.ok) {
        const savedCategory = await res.json()
        console.log('Категория сохранена в БД:', savedCategory)
        setIsCategoryModalOpen(false)
        // Сначала обновляем данные в админ-панели
        await fetchData()
        // Затем отправляем событие для обновления категорий в MenuView
        if (typeof window !== 'undefined') {
          // Небольшая задержка, чтобы убедиться, что данные сохранены в БД
          setTimeout(() => {
            console.log('Отправляем событие categoriesUpdated')
            window.dispatchEvent(new CustomEvent('categoriesUpdated'))
          }, 200)
        }
        toast.success('Категория успешно сохранена!')
      } else {
        let errorMessage = 'Ошибка при сохранении'
        try {
          const error = await res.json()
          errorMessage = error.message || error.error || `Ошибка ${res.status}: ${res.statusText}`
        } catch {
          errorMessage = `Ошибка ${res.status}: ${res.statusText}`
        }
        toast.error(errorMessage)
      }
    } catch (error: any) { 
      console.error('Ошибка сохранения категории:', error)
      const errorMessage = error.message || 'Не удалось подключиться к серверу. Проверьте, запущен ли backend сервер.'
        toast.error(`Ошибка соединения: ${errorMessage}`)
    }
  }
  
  const handleDeleteCategory = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить эту категорию? Если в ней есть товары, удаление будет невозможно.')) return
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        toast.error('Вы не авторизованы')
        return
      }
      const res = await fetch(`/api/products/categories/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        await fetchData()
        // Отправляем событие для обновления категорий в MenuView
        if (typeof window !== 'undefined') {
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('categoriesUpdated'))
          }, 100)
        }
        toast.success('Категория успешно удалена!')
      } else {
        let errorMessage = 'Ошибка удаления'
        try {
          const error = await res.json()
          errorMessage = error.error || error.message || `Ошибка ${res.status}: ${res.statusText}`
        } catch {
          errorMessage = `Ошибка ${res.status}: ${res.statusText}`
        }
        toast.error(errorMessage)
      }
    } catch (error: any) { 
      console.error('Ошибка удаления категории:', error)
      const errorMessage = error.message || 'Не удалось подключиться к серверу. Проверьте, запущен ли backend сервер.'
      toast.error(`Ошибка соединения: ${errorMessage}`)
    }
  }

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setSettingsLoading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/settings', {
        method: 'POST', // Или PUT, в зависимости от API
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      })
      
      if (res.ok) {
        toast.success('Настройки сохранены!')
        // Отправляем событие, чтобы MenuView обновился без перезагрузки (если открыт в другой вкладке)
        if (typeof window !== 'undefined') {
             window.localStorage.setItem('bannerInterval', settings.bannerInterval.toString())
        }
      } else {
        toast.error('Ошибка сохранения настроек')
      }
    } catch (e) {
      console.error(e)
        toast.error('Ошибка соединения')  
    } finally {
      setSettingsLoading(false)
    }
  }
  const dashboardMetrics = useMemo(() => {
    const sumCompletedLocal = orders
      .filter((o) => o.status === 'COMPLETED' || o.status === 'DELIVERED')
      .reduce((s, o) => s + (Number(o.totalPrice) || 0), 0)
    const cnt = (s: string) => orders.filter((o) => o.status === s).length
    const paidLocal = orders.filter((o) => o.paymentStatus === 'PAID').length

    if (orderStats) {
      return {
        revenue: orderStats.revenueCompleted,
        totalOrders: orderStats.totalOrders,
        paidOrders: orderStats.paymentPaidCount,
        pending: orderStats.byStatus.PENDING,
        cooking: orderStats.byStatus.COOKING,
        delivering: orderStats.byStatus.DELIVERING,
        completed: orderStats.byStatus.COMPLETED,
        cancelled: orderStats.byStatus.CANCELLED,
        fromDb: true as const,
      }
    }
    return {
      revenue: sumCompletedLocal,
      totalOrders: orders.length,
      paidOrders: paidLocal,
      pending: cnt('PENDING'),
      cooking: cnt('COOKING'),
      delivering: cnt('DELIVERING'),
      completed: cnt('COMPLETED') + cnt('DELIVERED'),
      cancelled: cnt('CANCELLED'),
      fromDb: false as const,
    }
  }, [orderStats, orders])

  // --- ХЕДЕР ---
  const Header = () => {
    return (
      <header className="admin-watta-header w-full sticky top-0 z-40">
        <div className="w-full relative bg-gradient-to-r from-white/95 via-white/90 to-[#145142]/5 backdrop-blur-2xl border-b border-[#145142]/10 shadow-[0_4px_30px_rgba(20,81,66,0.08)]">
          <div className="absolute inset-0 bg-[linear-gradient(105deg,transparent_0%,rgba(20,81,66,0.03)_50%,transparent_100%)] pointer-events-none" />
          <div className="relative w-full max-w-[1920px] mx-auto px-3 sm:px-5 md:px-6 h-16 sm:h-20 md:h-24 flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-5">
              <button 
                onClick={onBack}
                className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-2xl bg-[#145142]/5 hover:bg-[#145142]/15 text-[#145142] transition-all duration-300 hover:scale-105 active:scale-95"
                aria-label={t.adminPanel.header.backAria}
              >
                <ArrowLeft size={22} className="sm:w-6 sm:h-6" strokeWidth={2.5} />
              </button>
              {onSiteMenuClick && (
                <button
                  type="button"
                  onClick={onSiteMenuClick}
                  className="group w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-2xl border-2 border-[#145142]/20 bg-white/90 text-[#145142] shadow-sm transition-all duration-300 hover:border-[#ff6b35]/45 hover:bg-gradient-to-br hover:from-[#fff7ed] hover:to-white hover:shadow-md hover:shadow-[#ff6b35]/15 hover:scale-105 active:scale-95"
                  title={t.adminPanel.header.siteMenu}
                  aria-label={t.adminPanel.header.siteMenu}
                >
                  <Store
                    size={20}
                    className="sm:w-[22px] sm:h-[22px] transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110"
                    strokeWidth={2.35}
                  />
                </button>
              )}
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#145142] to-[#1a6b58] flex items-center justify-center shadow-lg shadow-[#145142]/25">
                    <BarChart2 size={18} className="sm:w-5 sm:h-5 text-white" strokeWidth={2.5} />
                  </div>
                  <h1 className="text-lg sm:text-2xl md:text-3xl font-black bg-gradient-to-r from-[#145142] via-[#1a6b58] to-[#0d3d34] bg-clip-text text-transparent tracking-tight">
                    {t.adminPanel.header.title}
                  </h1>
                </div>
                <p className="text-xs sm:text-sm text-[#145142]/60 font-medium pl-11 sm:pl-12">
                  {t.adminPanel.header.subtitle}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div
                className="flex items-center rounded-2xl border border-[#145142]/18 bg-white/90 p-1 gap-0.5 shadow-sm shrink-0"
                title={t.adminPanel.header.adminLangHint}
                role="group"
                aria-label={t.adminPanel.header.adminLangHint}
              >
                <button
                  type="button"
                  onClick={() => setAdminUiLanguage('uk')}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-extrabold tracking-wide transition-all ${
                    adminUiLanguage === 'uk'
                      ? 'bg-[#145142] text-white shadow-md shadow-[#145142]/25'
                      : 'text-[#145142]/70 hover:bg-[#145142]/10 hover:text-[#145142]'
                  }`}
                >
                  {t.adminPanel.header.adminLangUk}
                </button>
                <button
                  type="button"
                  onClick={() => setAdminUiLanguage('ru')}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-extrabold tracking-wide transition-all ${
                    adminUiLanguage === 'ru'
                      ? 'bg-[#145142] text-white shadow-md shadow-[#145142]/25'
                      : 'text-[#145142]/70 hover:bg-[#145142]/10 hover:text-[#145142]'
                  }`}
                >
                  {t.adminPanel.header.adminLangRu}
                </button>
              </div>
              <button 
                onClick={fetchAll}
                className="group w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-2xl bg-[#145142]/5 hover:bg-[#145142] text-[#145142] hover:text-white transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-[#145142]/30 active:scale-95"
                title={t.adminPanel.header.refreshTitle}
              >
                <RefreshCw size={20} className="sm:w-5 sm:h-5 group-hover:rotate-180 transition-transform duration-500" />
              </button>
              <button 
                onClick={() => setIsRightPanelOpen(true)}
                className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-2xl bg-gradient-to-br from-[#145142] to-[#1a6b58] text-white shadow-lg shadow-[#145142]/25 hover:shadow-xl hover:shadow-[#145142]/35 hover:scale-105 active:scale-95 transition-all duration-300"
                title={t.adminPanel.header.openMenuTitle}
              >
                <Menu size={22} className="sm:w-6 sm:h-6" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      </header>
    )
  }

  return (
    <div className="admin-shell-watta-web min-h-screen w-full max-w-[100vw] font-sans relative overflow-x-hidden">
      <LogoBackground />
      <div className="admin-watta-stack relative z-10 min-h-screen">
        <Header />

        {/* Поза admin-watta-page-inner: інакше transform на батькові ламає position:fixed → панель «зрізається» */}
        {isRightPanelOpen && (
          <>
            <div
              className="admin-watta-overlay-backdrop fixed inset-0 z-[90] bg-[#0a1f1a]/55 backdrop-blur-[10px]"
              onClick={() => setIsRightPanelOpen(false)}
              aria-hidden="true"
            />
            <aside
              className="admin-watta-drawer-shell admin-watta-drawer-enter fixed z-[100] flex flex-col overflow-hidden"
              role="dialog"
              aria-modal="true"
              aria-labelledby="admin-watta-drawer-title"
            >
              <div className="admin-watta-drawer-header shrink-0 bg-gradient-to-r from-[#145142] via-[#176b57] to-[#1a6b58] px-4 py-4 shadow-[0_12px_40px_-12px_rgba(20,81,66,0.45)] sm:px-5 sm:py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/18 ring-1 ring-white/25 shadow-inner">
                      <Menu size={20} className="text-white" strokeWidth={2.25} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/75">
                        Watta Admin
                      </p>
                      <h2
                        id="admin-watta-drawer-title"
                        className="truncate text-lg font-extrabold tracking-tight text-white sm:text-xl"
                      >
                        {t.adminPanel.sidebar.selectSection}
                      </h2>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsRightPanelOpen(false)}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white ring-1 ring-white/25 transition hover:bg-white/25 active:scale-95"
                    aria-label={t.adminPanel.header.closeDrawerAria}
                  >
                    <X size={22} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
              <nav
                className="admin-watta-drawer-scroll flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-y-contain px-3 py-4 sm:px-4 sm:py-5"
                aria-label={t.adminPanel.sidebar.selectSection}
              >
                {[
                  { id: 'dashboard' as const, label: t.adminPanel.sidebar.dashboard, desc: t.adminPanel.sidebar.dashboardDesc },
                  { id: 'orders' as const, label: t.adminPanel.sidebar.orders, desc: t.adminPanel.sidebar.ordersDesc },
                  { id: 'products' as const, label: t.adminPanel.sidebar.products, desc: t.adminPanel.sidebar.productsDesc },
                  { id: 'promos' as const, label: t.adminPanel.sidebar.promos, desc: t.adminPanel.sidebar.promosDesc },
                  { id: 'blog' as const, label: 'Блог / Рецепты', desc: 'SEO статьи и рецепты шефа' },
                  { id: 'crm' as const, label: 'CRM / Рассылки', desc: 'Пользователи и массовые рассылки' },
                  { id: 'cities' as const, label: t.adminPanel.sidebar.cities, desc: t.adminPanel.sidebar.citiesDesc },
                  { id: 'banners' as const, label: t.adminPanel.sidebar.banners, desc: t.adminPanel.sidebar.bannersDesc },
                  { id: 'menuCategories' as const, label: t.adminPanel.sidebar.categories, desc: t.adminPanel.sidebar.categoriesDesc },
                  { id: 'users' as const, label: t.adminPanel.sidebar.users, desc: t.adminPanel.sidebar.usersDesc },
                  { id: 'team' as const, label: t.adminPanel.sidebar.team, desc: t.adminPanel.sidebar.teamDesc },
                  { id: 'settings' as const, label: t.adminPanel.sidebar.settings, desc: t.adminPanel.sidebar.settingsDesc },
                  { id: 'ingredients' as const, label: t.adminPanel.sidebar.ingredients, desc: '' },
                ].map(({ id, label, desc }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setActiveTab(id)
                      setIsRightPanelOpen(false)
                    }}
                    className={`admin-watta-drawer-item group w-full rounded-2xl border px-4 py-3.5 text-left transition duration-200 sm:py-4 ${
                      activeTab === id
                        ? 'border-[#145142]/25 bg-gradient-to-r from-[#145142] to-[#1a6b58] text-white shadow-lg shadow-[#145142]/25 ring-1 ring-white/15'
                        : 'border-[#145142]/10 bg-white/90 shadow-sm shadow-[#145142]/[0.07] hover:border-[#145142]/22 hover:bg-white hover:shadow-md hover:shadow-[#145142]/12'
                    }`}
                  >
                    <span
                      className={`block text-[15px] font-bold leading-snug sm:text-base ${
                        activeTab === id ? 'text-white' : 'text-[#145142]'
                      }`}
                    >
                      {label}
                    </span>
                    {desc ? (
                      <span
                        className={`mt-0.5 block text-xs leading-relaxed sm:text-[13px] ${
                          activeTab === id ? 'text-white/85' : 'text-[#145142]/55 group-hover:text-[#145142]/70'
                        }`}
                      >
                        {desc}
                      </span>
                    ) : null}
                  </button>
                ))}
              </nav>
            </aside>
          </>
        )}

        {/* ОСНОВНОЙ КОНТЕНТ — дашборд на главній, панель справа з вкладками */}
        <div className="w-full min-h-[calc(100vh-80px)] sm:min-h-[calc(100vh-96px)] md:min-h-[calc(100vh-128px)] pb-8 sm:pb-12 md:pb-20">
          <div className="admin-watta-page-inner max-w-7xl mx-auto px-2 sm:px-4 md:px-6 pt-4 sm:pt-6 md:pt-8">

          {/* Головна: преміум-дашборд */}
          {!isRightPanelOpen && activeTab === 'dashboard' && (
            <div className="flex flex-col gap-8 sm:gap-10 md:gap-12">
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="flex flex-col items-center gap-3">
                    <RefreshCw size={32} className="text-zinc-400 animate-spin" />
                    <p className="text-zinc-500 font-medium">{t.adminPanel.dashboard.loading}</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="rounded-lg border border-zinc-200 bg-zinc-100/80 px-3 py-2.5 sm:px-4 sm:py-3">
                    <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                      {t.adminPanel.dashboard.statsHint}
                      {dashboardMetrics.fromDb ? (
                        <span className="ml-1.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                          · orders/stats
                        </span>
                      ) : (
                        <span className="ml-1.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800/90">
                          · {t.adminPanel.dashboard.statsFallback}
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
                    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 sm:p-4 shadow-sm">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-200/90 text-zinc-700">
                          <TrendingUp size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{t.adminPanel.dashboard.revenue}</p>
                          <p className="text-base sm:text-lg font-black tabular-nums text-zinc-900">
                            {dashboardMetrics.revenue.toFixed(2)} €
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 sm:p-4 shadow-sm">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-200/90 text-zinc-700">
                          <Package size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{t.adminPanel.dashboard.orders}</p>
                          <p className="text-base sm:text-lg font-black tabular-nums text-zinc-900">{dashboardMetrics.totalOrders}</p>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 sm:p-4 shadow-sm">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-200/90 text-zinc-700">
                          <Receipt size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{t.adminPanel.dashboard.paidOrders}</p>
                          <p className="text-base sm:text-lg font-black tabular-nums text-zinc-900">{dashboardMetrics.paidOrders}</p>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 sm:p-4 shadow-sm">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-200/90 text-zinc-700">
                          <ShoppingBag size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{t.adminPanel.dashboard.products}</p>
                          <p className="text-base sm:text-lg font-black tabular-nums text-zinc-900">{products.length}</p>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 sm:p-4 shadow-sm">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-200/90 text-zinc-700">
                          <MapPin size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{t.adminPanel.dashboard.cities}</p>
                          <p className="text-base sm:text-lg font-black tabular-nums text-zinc-900">{cities.length}</p>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 sm:p-4 shadow-sm">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-200/90 text-zinc-700">
                          <Globe size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{t.adminPanel.dashboard.countries}</p>
                          <p className="text-base sm:text-lg font-black tabular-nums text-zinc-900">{countries.length}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 sm:mb-3">
                      {t.adminPanel.dashboard.statusTitle}
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
                      {[
                        { label: t.adminPanel.dashboard.statusPending, count: dashboardMetrics.pending, accent: 'border-l-amber-400' },
                        { label: t.adminPanel.dashboard.statusCooking, count: dashboardMetrics.cooking, accent: 'border-l-orange-400' },
                        { label: t.adminPanel.dashboard.statusDelivering, count: dashboardMetrics.delivering, accent: 'border-l-sky-400' },
                        { label: t.adminPanel.dashboard.statusCompleted, count: dashboardMetrics.completed, accent: 'border-l-emerald-500' },
                        { label: t.adminPanel.dashboard.statusCancelled, count: dashboardMetrics.cancelled, accent: 'border-l-red-400' },
                      ].map(({ label, count, accent }) => (
                        <div
                          key={label}
                          className={`rounded-xl border border-zinc-200 bg-zinc-100/90 p-3 sm:p-4 shadow-sm border-l-4 ${accent}`}
                        >
                          <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">{label}</p>
                          <p className="text-2xl sm:text-3xl font-black tabular-nums text-zinc-900 mt-0.5">{count}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 sm:mb-3">
                      {t.adminPanel.dashboard.contentSection}
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2 sm:gap-3">
                      {[
                        { icon: Tag, label: t.adminPanel.dashboard.promos, value: promos.length },
                        { icon: Layers, label: t.adminPanel.dashboard.categories, value: menuCategories.length },
                        { icon: User, label: t.adminPanel.dashboard.users, value: users.length },
                        { icon: ImageIcon, label: t.adminPanel.dashboard.banners, value: banners.length },
                        { icon: BookOpen, label: t.adminPanel.dashboard.blog, value: blogPosts.length },
                        { icon: ListOrdered, label: t.adminPanel.dashboard.ingredients, value: ingredients.length },
                        { icon: Users, label: t.adminPanel.dashboard.team, value: teamMembers.length },
                      ].map(({ icon: Icon, label, value }) => (
                        <div
                          key={label}
                          className="flex items-center gap-2.5 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600">
                            <Icon size={16} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500 truncate">{label}</p>
                            <p className="text-lg font-black tabular-nums text-zinc-900">{value}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Контент розділів — на всю ширину, коли обрано не дашборд */}
          {!isRightPanelOpen && activeTab !== 'dashboard' && (
            <div className="w-full">
              <div className="admin-watta-tab-toolbar">
                <button
                  type="button"
                  onClick={() => setIsRightPanelOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#145142]/12 to-[#1a6b58]/10 px-4 py-2.5 font-semibold text-[#145142] ring-1 ring-[#145142]/15 transition-all hover:from-[#145142]/18 hover:to-[#1a6b58]/14 hover:ring-[#145142]/25"
                >
                  <Menu size={18} />
                  <span>{t.adminPanel.common.menuChangeSection}</span>
                </button>
              </div>
          {activeTab === 'orders' && (
            <div className="flex flex-col gap-4 sm:gap-6 md:gap-8 items-center">
              {isLoading && orders.length === 0 ? (
                 <div className="text-lg sm:text-xl md:text-2xl text-gray-400 mt-6 sm:mt-8 md:mt-10">{t.adminPanel.dashboard.loading}</div>
              ) : orders.length === 0 ? (
                 <div className="text-lg sm:text-xl md:text-2xl text-gray-400 mt-6 sm:mt-8 md:mt-10 text-center">
                   {t.adminPanel.common.emptyOrders}
                   <div className="text-sm mt-2">No orders found</div>
                 </div>
              ) : (
                orders.map((order) => (
                  <div 
                    key={order.id} 
                    className="admin-watta-hover-lift relative flex w-full flex-col gap-4 border border-white/60 bg-white/85 p-4 shadow-xl shadow-[#145142]/10 backdrop-blur-xl sm:gap-5 sm:rounded-[20px] sm:p-6 md:gap-6 md:rounded-[25px] md:p-8 rounded-[16px]"
                  >
                    {/* Хедер заказа */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 sm:gap-4">
                      <div className="flex flex-col gap-2">
                        <div className="text-lg sm:text-xl md:text-[24px] font-bold text-black">
                          Заказ №{order.id}
                          <span className="text-gray-400 text-xs sm:text-sm font-normal ml-2 sm:ml-3 block sm:inline">
                            {new Date(order.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                              order.fulfillmentType === 'PICKUP'
                                ? 'bg-violet-100 text-violet-800 border border-violet-200'
                                : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                            }`}
                          >
                            {order.fulfillmentType === 'PICKUP'
                              ? t.adminPanel.orders.fulfillmentPickup
                              : t.adminPanel.orders.fulfillmentDelivery}
                          </span>
                          {order.fulfillmentType !== 'PICKUP' && typeof order.deliveryFee === 'number' && (
                            <span className="text-xs font-semibold text-gray-600">
                              {t.adminPanel.orders.deliveryFeeAdmin}{' '}
                              {order.deliveryFee > 0 ? `${order.deliveryFee} €` : '0 €'}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold uppercase ${
                        order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'COOKING' ? 'bg-orange-100 text-orange-800' :
                        order.status === 'DELIVERING' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'COMPLETED' || order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                        order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                        'bg-zinc-200 text-zinc-800'
                      }`}>
                        {order.status}
                      </span>
                    </div>

                    {/* Данные клиента */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 bg-[#145142]/5 p-3 sm:p-4 rounded-[12px] sm:rounded-[15px] border border-[#145142]/10">
                      <div className="flex flex-col gap-2 text-sm sm:text-base md:text-[16px] text-[#555]">
                        <div className="flex items-center gap-2 font-bold text-black"><User size={16} className="sm:w-5 sm:h-5"/> {order.customerName}</div>
                        <div className="flex items-center gap-2"><Phone size={16} className="sm:w-5 sm:h-5"/> {order.phone}</div>
                        <div className="flex items-center gap-2"><MapPin size={16} className="sm:w-5 sm:h-5"/> {order.address}</div>
                      </div>
                      <div className="flex flex-col gap-2">
                         {order.comment ? (
                            <div className="text-orange-600 bg-orange-50 p-2 rounded-lg border border-orange-100 text-sm">
                              📝 {order.comment}
                            </div>
                         ) : (
                            <div className="text-gray-400 text-sm italic">{t.adminPanel.orders.noComment}</div>
                         )}
                      </div>
                    </div>
                    {/* --- БЛОК ОПЛАТЫ (НОВЫЙ) --- */}
                    <div className="flex items-center justify-between bg-gray-50 p-2 rounded-lg border border-gray-100">
                      <div className="flex items-center gap-2">
                        {/* Иконка метода */}
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-lg">
                          {order.paymentMethod === 'CASH' ? '💵' : 
                          order.paymentMethod === 'CARD' ? '💳' : 
                          order.paymentMethod === 'APPLE_PAY' ? '' : 
                          order.paymentMethod === 'GOOGLE_PAY' ? 'G' : '🏦'}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-gray-500 uppercase">{t.adminPanel.orders.payment}</span>
                          <span className="text-xs font-bold text-[#145142]">
                              {order.paymentMethod === 'CASH' ? t.adminPanel.orders.cash : t.adminPanel.orders.online}
                          </span>
                        </div>
                      </div>

                      {/* Статус оплаты */}
                      <div className={`px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1 ${
                          order.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' : 
                          order.paymentStatus === 'FAILED' ? 'bg-red-100 text-red-700' : 
                          'bg-yellow-100 text-yellow-700'
                      }`}>
                          {order.paymentStatus === 'PAID' ? <Check size={12}/> : null}
                          {order.paymentStatus === 'PAID' ? t.adminPanel.orders.paid : 
                          order.paymentStatus === 'FAILED' ? t.adminPanel.orders.error : t.adminPanel.orders.waiting}
                      </div>
                    </div>
                    {/* --------------------------- */}
                    {/* Товары */}
                    <div className="flex flex-col gap-3">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="w-full bg-white/70 backdrop-blur-sm rounded-[15px] p-4 flex justify-between items-center h-[57px] border border-[#145142]/10">
                          <span className="text-black text-[16px] font-medium">{item.product.name_ru}</span>
                          <span className="font-bold text-black text-lg">x{item.quantity}</span>
                        </div>
                      ))}
                    </div>

                    {/* Статусы и Итого */}
                    <div className="mt-4 pt-4 border-t border-[#145142]/10 flex flex-col md:flex-row justify-between items-center gap-6">
                      
                      {/* Кнопки смены статуса */}
                      <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto">
                         <button onClick={() => updateStatus(order.id, 'COOKING')} className="p-2 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100" title={t.adminPanel.orders.hintCooking}><ChefHat/></button>
                         <button onClick={() => updateStatus(order.id, 'DELIVERING')} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100" title={t.adminPanel.orders.hintDelivering}><Truck/></button>
                         <button onClick={() => updateStatus(order.id, 'COMPLETED')} className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100" title={t.adminPanel.orders.hintCompleted}><Check/></button>
                         <div className="w-px bg-[#145142]/20 mx-2"></div>
                         <button onClick={() => updateStatus(order.id, 'CANCELLED')} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100" title={t.adminPanel.orders.hintCancel}><XCircle/></button>
                      </div>

                      <div className="text-[#194A38] text-[28px] font-bold">
                        {order.totalPrice} €
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
          {/* ВКЛАДКА НОВОСТИ */}
          {!isRightPanelOpen && activeTab === 'promos' && (
            <div className="space-y-6">
              <div className="admin-watta-news-toolbar">
                <h2 className="text-xl sm:text-2xl">{t.adminPanel.news.title}</h2>
                <button type="button" className="admin-watta-add-btn" onClick={() => { setEditingNews(null); setIsNewsModalOpen(true) }}>
                  {t.adminPanel.news.addBtn}
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {newsItems.map(item => (
                    <div key={item.id} className="admin-watta-news-card">
                      <div className="h-40 bg-gray-200 relative">
                        {item.imageUrl && <img src={item.imageUrl} className="w-full h-full object-cover"/>}
                      </div>
                      <div className="p-4">
                          <h3 className="font-bold">{item.title}</h3>
                          <div className="flex gap-2 mt-4">
                            <button onClick={() => { setEditingNews(item); setIsNewsModalOpen(true) }} className="flex-1 bg-blue-50 text-blue-600 py-2 rounded">{t.adminPanel.actions.editShort}</button>
                            <button onClick={() => handleDeleteNews(item.id)} className="px-4 bg-red-50 text-red-600 rounded"><Trash2 size={16}/></button>
                          </div>
                      </div>
                    </div>
                ))}
              </div>
            </div>
          )}
          {/* === Вкладка: ТОВАРЫ === */}
          {activeTab === 'products' && (
             <div className="flex flex-col gap-4 sm:gap-6 md:gap-8">
                <button 
                  onClick={openCreateModal}
                  className="w-full h-14 sm:h-16 md:h-[77px] bg-[#155044] rounded-[12px] sm:rounded-[15px] flex items-center justify-center text-white text-base sm:text-xl md:text-[24px] font-bold hover:bg-[#103d34] transition shadow-md px-4"
                >
                  {t.adminPanel.products.addBtn}
                </button>

                <div className="overflow-x-auto w-full overflow-y-hidden">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 min-w-[900px]">
                  {products.map(product => (
                    <div key={product.id} className="admin-watta-hover-lift flex flex-col gap-3 border border-white/60 bg-white/85 p-4 shadow-xl shadow-[#145142]/10 backdrop-blur-xl sm:gap-4 sm:rounded-[20px] sm:p-5 md:rounded-[25px] rounded-[16px] hover:border-[#145142]/20 hover:shadow-2xl">
                       {/* Картинка */}
                       <div className="w-full h-[150px] sm:h-[180px] md:h-[200px] bg-[#145142]/5 rounded-[12px] sm:rounded-[15px] overflow-hidden relative border border-[#145142]/10">
                         {product.imageUrl ? (
                           <img src={product.imageUrl} alt={product.name_ru} className="w-full h-full object-cover" />
                         ) : (
                           <div className="w-full h-full flex items-center justify-center text-gray-300">
                             <ImageIcon size={32} className="sm:w-12 sm:h-12" />
                           </div>
                         )}
                         {product.isPopular && (
                           <span className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full">{t.adminPanel.products.hit}</span>
                         )}
                       </div>
                       
                       {/* Инфо */}
                       <div className="flex flex-col flex-1">
                         <div className="flex justify-between items-start mb-2 gap-2">
                           <h3 className="text-base sm:text-lg md:text-[20px] font-bold text-black leading-tight flex-1">{product.name_ru}</h3>
                           <span className="text-base sm:text-lg md:text-[20px] font-bold text-[#194A38] whitespace-nowrap">{product.price} €</span>
                         </div>
                         <p className="text-xs sm:text-sm md:text-[14px] text-[#7C7C7C] line-clamp-2 mb-3 sm:mb-4 min-h-[32px] sm:min-h-[42px]">{product.description_ru}</p>
                         
                         {/* Футер карточки с кнопками */}
                         <div className="mt-auto pt-2 border-t border-[#145142]/10 flex justify-between items-center text-xs text-gray-400">
                            <div className="flex gap-2">
                              <span>ID: {product.id}</span>
                              <span className="hidden sm:inline">| {menuCategories.find(c => c.id === product.categoryId)?.name_ru}</span>
                            </div>

                            {/* КНОПКИ ДЕЙСТВИЙ */}
                            <div className="flex gap-2">
                              <button 
                                onClick={() => openEditModal(product)}
                                className="p-1.5 text-[#145142]/50 hover:text-[#145142] hover:bg-[#145142]/10 rounded-lg transition"
                                title={t.adminPanel.actions.edit}
                              >
                                <Pencil size={18} />
                              </button>
                              <button 
                                onClick={() => handleDeleteProduct(product.id)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                title={t.adminPanel.actions.delete}
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                         </div>
                       </div>
                    </div>
                  ))}
                </div>
                </div>
                {products.length === 0 && (
                  <div className="rounded-xl border border-dashed border-gray-300 bg-white/70 p-6 text-center text-gray-500">
                    No products found
                  </div>
                )}
             </div>
          )}
          {/* === Вкладка: ИНГРЕДИЕНТЫ === */}
            {activeTab === 'ingredients' && (
              <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl font-bold text-[#145142] mb-6">{t.adminPanel.ingredients.title}</h2>
                
                {/* Форма добавления */}
                <div className="mb-8 rounded-2xl border border-white/60 bg-white/85 p-6 shadow-xl shadow-[#145142]/10 backdrop-blur-xl">
                  <h3 className="mb-4 font-bold text-[#145142]">{t.adminPanel.ingredients.addNew}</h3>
                  <form onSubmit={handleCreateIngredient} className="flex flex-col sm:flex-row gap-4 items-end">
                    
                    {/* Загрузка фото */}
                    <div className="w-24 h-24 flex-shrink-0 relative border-2 border-dashed border-gray-300 rounded-xl overflow-hidden hover:border-[#145142] transition cursor-pointer group">
                      <input type="file" onChange={handleIngImageUpload} className="absolute inset-0 opacity-0 z-10 cursor-pointer" accept="image/*" />
                      {newIngImage ? (
                        <img src={newIngImage} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Upload size={24} />
                        </div>
                      )}
                    </div>

                    {/* Название */}
                    <div className="flex-1 w-full">
                        <label className="block text-xs font-bold text-gray-500 mb-1">{t.adminPanel.ingredients.nameRu}</label>
                        <input 
                          type="text" 
                          value={newIngName}
                          onChange={e => setNewIngName(e.target.value)}
                          className="w-full p-3 border rounded-xl outline-none focus:border-[#145142]"
                          placeholder={t.adminPanel.ingredients.namePlaceholder}
                        />
                    </div>

                    <button   
                      type="submit" 
                      disabled={ingLoading}
                      className="h-[50px] px-6 bg-[#145142] text-white rounded-xl font-bold hover:bg-[#103d34] transition"
                    >
                      {ingLoading ? '...' : t.adminPanel.ingredients.addBtn}
                    </button>
                  </form>
                </div>

                {/* Список существующих */}
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                  {ingredients.map(ing => (
                    <div key={ing.id} className="admin-watta-hover-lift relative flex flex-col items-center rounded-xl border border-white/60 bg-white/85 p-3 shadow-md shadow-[#145142]/8 backdrop-blur-sm group">
                        <button 
                          onClick={() => handleDeleteIngredient(ing.id)}
                          className="absolute top-1 right-1 p-1 bg-red-100 text-red-500 rounded-md opacity-0 group-hover:opacity-100 transition"
                        >
                          <Trash2 size={14} />
                        </button>
                        <img src={ing.imageUrl} className="w-12 h-12 object-contain mb-2" />
                        <span className="text-xs font-bold text-center">{ing.name_ru}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          {/* === Вкладка: СТРАНЫ И ГОРОДА === */}
          {activeTab === 'cities' && (
            <div className="flex flex-col gap-4 sm:gap-6 md:gap-8">
              {/* Форма создания страны */}
              <div className="bg-white/80 backdrop-blur-2xl rounded-[20px] sm:rounded-[24px] md:rounded-[28px] p-4 sm:p-6 md:p-8 lg:p-10 shadow-2xl shadow-[#145142]/15 border-2 border-white/70 relative overflow-hidden">
                {/* Декоративные элементы */}
                <div className="absolute top-0 right-0 w-60 h-60 sm:w-80 sm:h-80 bg-gradient-to-br from-[#145142]/8 via-[#1a6b58]/5 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 sm:w-64 sm:h-64 bg-gradient-to-tr from-[#1a6b58]/8 to-transparent rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>
                
                <div className="relative z-10">
                  <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-[#145142] mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
                    <span className="text-2xl sm:text-3xl md:text-4xl">🌍</span>
                    <span>{t.adminPanel.cities.addCountry}</span>
                  </h2>
                  <form onSubmit={handleCreateCountry} className="space-y-4 sm:space-y-6">
                    {/* Названия на разных языках */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                      <div className="relative">
                        <label className="block text-xs font-semibold text-[#145142] mb-2 uppercase tracking-wide">
                          Название (RU) *
                        </label>
                        <input 
                          type="text" 
                          placeholder="Украина"
                          value={newCountryName}
                          onChange={e => setNewCountryName(e.target.value)}
                          className="w-full p-4 bg-white/80 backdrop-blur-sm rounded-[16px] outline-none border-2 border-[#145142]/20 font-semibold text-sm sm:text-base transition-all focus:border-[#145142] focus:bg-white/90 focus:shadow-lg focus:shadow-[#145142]/10"
                          required
                        />
                      </div>
                      <div className="relative">
                        <label className="block text-xs font-semibold text-[#145142] mb-2 uppercase tracking-wide">
                          Назва (UA) *
                        </label>
                        <input 
                          type="text" 
                          placeholder="Україна"
                          value={newCountryNameUa}
                          onChange={e => setNewCountryNameUa(e.target.value)}
                          className="w-full p-4 bg-white/80 backdrop-blur-sm rounded-[16px] outline-none border-2 border-[#145142]/20 font-semibold text-sm sm:text-base transition-all focus:border-[#145142] focus:bg-white/90 focus:shadow-lg focus:shadow-[#145142]/10"
                          required
                        />
                      </div>
                      <div className="relative">
                        <label className="block text-xs font-semibold text-[#145142] mb-2 uppercase tracking-wide">
                          Назва (EN)
                        </label>
                        <input 
                          type="text" 
                          placeholder="Ukraine"
                          value={newCountryNameEn}
                          onChange={e => setNewCountryNameEn(e.target.value)}
                          className="w-full p-4 bg-white/80 backdrop-blur-sm rounded-[16px] outline-none border-2 border-[#145142]/20 font-semibold text-sm sm:text-base transition-all focus:border-[#145142] focus:bg-white/90 focus:shadow-lg focus:shadow-[#145142]/10"
                        />
                      </div>
                      <div className="relative">
                        <label className="block text-xs font-semibold text-[#145142] mb-2 uppercase tracking-wide">
                          Назва (NL)
                        </label>
                        <input 
                          type="text" 
                          placeholder="Oekraïne"
                          value={newCountryNameNl}
                          onChange={e => setNewCountryNameNl(e.target.value)}
                          className="w-full p-4 bg-white/80 backdrop-blur-sm rounded-[16px] outline-none border-2 border-[#145142]/20 font-semibold text-sm sm:text-base transition-all focus:border-[#145142] focus:bg-white/90 focus:shadow-lg focus:shadow-[#145142]/10"
                        />
                      </div>
                    </div>

                    {/* Выбор флага */}
                    <div className="grid grid-cols-1 gap-3 sm:gap-4">
                      <div className="relative flag-picker-container">
                        <label className="block text-xs sm:text-sm font-semibold text-[#145142] mb-2 uppercase tracking-wide">
                          {t.adminPanel.cities.sticker}
                        </label>
                        <div className="relative inline-block">
                          <button
                            type="button"
                            onClick={() => setIsFlagPickerOpen(!isFlagPickerOpen)}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/80 backdrop-blur-sm rounded-[12px] outline-none border-2 border-[#145142]/20 font-semibold text-xl transition-all hover:border-[#145142] hover:bg-white/90 hover:shadow-md hover:shadow-[#145142]/10 cursor-pointer"
                          >
                            <span>{newCountryFlag}</span>
                            <span className={`text-xs text-gray-400 transition-transform duration-200 ${isFlagPickerOpen ? 'rotate-180' : ''}`}>▼</span>
                          </button>
                          {isFlagPickerOpen && (
                            <div className="absolute bottom-full left-0 mb-2 w-64 sm:w-72 bg-white/90 backdrop-blur-xl rounded-[14px] border-2 border-[#145142]/20 shadow-xl shadow-[#145142]/15 p-3 z-[200] max-h-52 overflow-y-auto">
                              <div className="grid grid-cols-6 gap-1.5">
                                {countryFlags.map((flag, index) => (
                                  <button
                                    key={index}
                                    type="button"
                                    onClick={() => {
                                      setNewCountryFlag(flag)
                                      setIsFlagPickerOpen(false)
                                    }}
                                    className={`p-2 rounded-[10px] text-lg transition-all duration-200 ${
                                      newCountryFlag === flag 
                                        ? 'bg-[#145142]/15 ring-2 ring-[#145142]/50' 
                                        : 'bg-[#145142]/5 hover:bg-[#145142]/10'
                                    }`}
                                  >
                                    {flag}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <button 
                      type="submit"
                      className="w-full px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-[#145142] to-[#1a6b58] text-white font-bold rounded-[14px] sm:rounded-[16px] hover:from-[#103d34] hover:to-[#145142] transition-all shadow-lg shadow-[#145142]/30 hover:shadow-xl hover:shadow-[#145142]/40 transform hover:scale-[1.02] text-sm sm:text-base md:text-lg"
                    >
                      {t.adminPanel.cities.addCountryBtn}
                    </button>
                  </form>
                </div>
              </div>

              {/* Форма создания / редактирования города */}
              <div ref={cityFormRef} className="bg-white/80 backdrop-blur-2xl rounded-[20px] sm:rounded-[24px] md:rounded-[28px] p-4 sm:p-6 md:p-8 lg:p-10 shadow-2xl shadow-[#145142]/15 border-2 border-white/70 relative overflow-hidden">
                {/* Декоративные элементы */}
                <div className="absolute top-0 right-0 w-60 h-60 sm:w-80 sm:h-80 bg-gradient-to-br from-[#145142]/8 via-[#1a6b58]/5 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 sm:w-64 sm:h-64 bg-gradient-to-tr from-[#1a6b58]/8 to-transparent rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>
                
                <div className="relative z-10">
                  <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-[#145142] mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
                    <MapPin className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" />
                    <span>{editingCityId ? 'Редагувати місто' : 'Додати нове місто'}</span>
                  </h2>
                  <form onSubmit={async (e) => { e.preventDefault(); if (editingCityId) await handleUpdateCityFromForm(); else await handleCreateCity(e); }} className="space-y-4 sm:space-y-6">
                    {/* Названия на 4 языках: RU, UA, EN, NL */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                      <div className="relative">
                        <label className="block text-xs font-semibold text-[#145142] mb-2 uppercase tracking-wide">
                          Назва міста (RU) *
                        </label>
                        <input 
                          type="text" 
                          placeholder="Киев"
                          value={newCityName}
                          onChange={e => setNewCityName(e.target.value)}
                          className="w-full p-4 bg-white/80 backdrop-blur-sm rounded-[16px] outline-none border-2 border-[#145142]/20 font-semibold text-sm sm:text-base transition-all focus:border-[#145142] focus:bg-white/90 focus:shadow-lg focus:shadow-[#145142]/10"
                          required
                        />
                      </div>
                      <div className="relative">
                        <label className="block text-xs font-semibold text-[#145142] mb-2 uppercase tracking-wide">
                          Назва міста (UA)
                        </label>
                        <input 
                          type="text" 
                          placeholder="Київ"
                          value={newCityNameUa}
                          onChange={e => setNewCityNameUa(e.target.value)}
                          className="w-full p-4 bg-white/80 backdrop-blur-sm rounded-[16px] outline-none border-2 border-[#145142]/20 font-semibold text-sm sm:text-base transition-all focus:border-[#145142] focus:bg-white/90 focus:shadow-lg focus:shadow-[#145142]/10"
                        />
                      </div>
                      <div className="relative">
                        <label className="block text-xs font-semibold text-[#145142] mb-2 uppercase tracking-wide">
                          Назва міста (EN)
                        </label>
                        <input 
                          type="text" 
                          placeholder="Kyiv"
                          value={newCityNameEn}
                          onChange={e => setNewCityNameEn(e.target.value)}
                          className="w-full p-4 bg-white/80 backdrop-blur-sm rounded-[16px] outline-none border-2 border-[#145142]/20 font-semibold text-sm sm:text-base transition-all focus:border-[#145142] focus:bg-white/90 focus:shadow-lg focus:shadow-[#145142]/10"
                        />
                      </div>
                      <div className="relative">
                        <label className="block text-xs font-semibold text-[#145142] mb-2 uppercase tracking-wide">
                          Назва міста (NL)
                        </label>
                        <input 
                          type="text" 
                          placeholder="Kiev"
                          value={newCityNameNl}
                          onChange={e => setNewCityNameNl(e.target.value)}
                          className="w-full p-4 bg-white/80 backdrop-blur-sm rounded-[16px] outline-none border-2 border-[#145142]/20 font-semibold text-sm sm:text-base transition-all focus:border-[#145142] focus:bg-white/90 focus:shadow-lg focus:shadow-[#145142]/10"
                        />
                      </div>
                    </div>

                    {/* Поиск города на карте — RU/UA/EN/NL, адрес, индекс, код */}
                    <div className="relative city-map-search-container">
                      <label className="block text-xs font-semibold text-[#145142] mb-2 uppercase tracking-wide">
                        {t.adminPanel.cities.searchMapLabel}
                      </label>
                      <p className="text-xs text-gray-500 mb-2">
                        {t.adminPanel.cities.searchMapDesc} {editingCityId ? 'При редагуванні: можна залишити поточну локацію або обрати нову через пошук.' : 'Обовʼязково для додавання міста.'}
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-2">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            placeholder={t.adminPanel.cities.searchMapPlaceholder}
                            value={cityMapSearchQuery}
                            onChange={e => setCityMapSearchQuery(e.target.value)}
                            onFocus={() => cityMapSearchResults.length > 0 && setCityMapSearchOpen(true)}
                            className="w-full p-4 bg-white/80 backdrop-blur-sm rounded-[16px] outline-none border-2 border-[#145142]/20 font-semibold text-sm sm:text-base transition-all focus:border-[#145142] focus:bg-white/90 focus:shadow-lg focus:shadow-[#145142]/10"
                          />
                          {cityMapSearchLoading && (
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400">{t.adminPanel.common.searching}</span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={handleSearchCityByNames}
                          className="shrink-0 px-4 py-3 bg-[#145142]/15 text-[#145142] font-semibold rounded-[16px] border-2 border-[#145142]/30 hover:bg-[#145142]/25 transition"
                        >
                          {t.adminPanel.cities.searchMapBtn}
                        </button>
                      </div>
                      {cityMapSearchOpen && cityMapSearchResults.length > 0 && (
                        <div className="mt-2 bg-white/90 backdrop-blur-xl rounded-[14px] border-2 border-[#145142]/20 shadow-xl shadow-[#145142]/15 overflow-hidden z-[200] max-h-64 overflow-y-auto">
                          {cityMapSearchResults.map((r, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => handleChooseCityFromMap(r)}
                              className="w-full px-4 py-3 text-left hover:bg-[#145142]/10 transition flex items-center justify-between gap-2 border-b border-[#145142]/10 last:border-b-0"
                            >
                              <span className="text-sm font-medium text-gray-800 truncate flex-1">{r.display_name}</span>
                              <span className="text-xs text-[#145142] font-semibold shrink-0">{t.adminPanel.common.choose}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      {cityMapSearchOpen && !cityMapSearchLoading && cityMapSearchResults.length === 0 && (
                        <div className="mt-2 bg-white/90 backdrop-blur-xl rounded-[14px] border-2 border-[#145142]/20 shadow-xl px-4 py-3 z-[200] text-sm text-[#145142]/60">
                          {t.adminPanel.common.notFound}
                        </div>
                      )}

                      {/* Інтерактивна карта */}
                      <CityMapPicker
                        results={cityMapSearchResults}
                        selected={newCityLatitude && newCityLongitude ? { lat: newCityLatitude, lon: newCityLongitude } : null}
                        onSelect={handleChooseCityFromMap}
                        className="w-full border-2 border-[#145142]/20 rounded-[16px]"
                      />
                    </div>

                    {/* Страна */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      <div className="relative">
                        <label className="block text-xs font-semibold text-[#145142] mb-2 uppercase tracking-wide">
                          Цена за 1 км (€)
                        </label>
                        <input
                          type="number"
                          min={0}
                          step="0.1"
                          value={newCityPricePerKm}
                          onChange={(e) => setNewCityPricePerKm(e.target.value)}
                          className="w-full p-4 bg-white/80 backdrop-blur-sm rounded-[16px] outline-none border-2 border-[#145142]/20 font-semibold text-sm sm:text-base transition-all focus:border-[#145142] focus:bg-white/90 focus:shadow-lg focus:shadow-[#145142]/10"
                        />
                      </div>
                      <div className="relative">
                        <label className="block text-xs font-semibold text-[#145142] mb-2 uppercase tracking-wide">
                          {t.adminPanel.cities.countryLabel}
                        </label>
                        <select
                          value={newCityCountryId || ''}
                          onChange={e => setNewCityCountryId(e.target.value ? parseInt(e.target.value) : null)}
                          className="w-full p-4 bg-white/80 backdrop-blur-sm rounded-[16px] outline-none border-2 border-[#145142]/20 font-semibold text-sm sm:text-base transition-all focus:border-[#145142] focus:bg-white/90 focus:shadow-lg focus:shadow-[#145142]/10"
                          required
                        >
                          <option value="">{t.adminPanel.cities.selectCountry}</option>
                          {countries.map(country => (
                            <option key={country.id} value={country.id}>
                              {country.flag || '🌍'} {country.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      {editingCityId !== null && (
                        <div className="relative flex items-center gap-3">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={newCityIsActive}
                              onChange={e => setNewCityIsActive(e.target.checked)}
                              className="w-4 h-4 rounded border-[#145142]/30 text-[#145142] focus:ring-[#145142]"
                            />
                            <span className="text-sm font-semibold text-[#145142]">{t.adminPanel.cities.activeCity}</span>
                          </label>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <button 
                        type="submit"
                        className="flex-1 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-[#145142] to-[#1a6b58] text-white font-bold rounded-[14px] sm:rounded-[16px] hover:from-[#103d34] hover:to-[#145142] transition-all shadow-lg shadow-[#145142]/30 hover:shadow-xl hover:shadow-[#145142]/40 transform hover:scale-[1.02] text-sm sm:text-base md:text-lg"
                      >
                        {editingCityId ? '💾 Зберегти зміни' : '✨ Додати місто'}
                      </button>
                      {editingCityId !== null && (
                        <button
                          type="button"
                          onClick={handleCancelEditCity}
                          className="px-6 sm:px-8 py-3 sm:py-4 bg-white/80 backdrop-blur-sm text-[#145142] font-semibold rounded-[14px] sm:rounded-[16px] border-2 border-[#145142]/20 hover:bg-[#145142]/10 hover:border-[#145142]/30 transition text-sm sm:text-base"
                        >
                         {t.adminPanel.cities.cancelEdit}
                        </button>
                      )}
                    </div>
                  </form>

                  {editingCityId !== null && (
                    <div className="mt-8 rounded-[16px] border-2 border-[#145142]/20 bg-[#f7fbf9] p-4 sm:p-5">
                      <h3 className="text-base font-bold text-[#145142]">Тарифи зон доставки</h3>
                      <p className="mt-1 text-xs text-gray-600">
                        Полігони зберігаються в базі; тут можна задати <strong>безкоштовно</strong> або{' '}
                        <strong>фікс €</strong> для кожної зони. Якщо обидва вимкнені — на сайті показується
                        стандарт (база + €/км міста).
                      </p>
                      {editorZonesLoading ? (
                        <p className="mt-3 text-sm text-gray-500">Завантаження зон…</p>
                      ) : editorDeliveryZones.length === 0 ? (
                        <p className="mt-3 text-sm text-gray-500">
                          Для цього міста ще немає зон. Створіть зону через API{' '}
                          <code className="rounded bg-white/80 px-1">POST /api/delivery-zones</code> (координати
                          полігона JSON).
                        </p>
                      ) : (
                        <ul className="mt-4 flex flex-col gap-3">
                          {editorDeliveryZones.map((z) => (
                            <li
                              key={z.id}
                              className="rounded-[14px] border border-[#145142]/15 bg-white/95 p-3 sm:p-4"
                            >
                              <div className="font-semibold text-[#155044]">{z.name}</div>
                              <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm">
                                <input
                                  type="checkbox"
                                  checked={z.isFreeDelivery}
                                  onChange={(e) => {
                                    const checked = e.target.checked
                                    setEditorDeliveryZones((prev) =>
                                      prev.map((x) =>
                                        x.id === z.id
                                          ? {
                                              ...x,
                                              isFreeDelivery: checked,
                                              flatDeliveryFee: checked ? null : x.flatDeliveryFee,
                                            }
                                          : x
                                      )
                                    )
                                  }}
                                  className="rounded border-[#145142]/40 text-[#145142]"
                                />
                                Безкоштовна доставка в зоні
                              </label>
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <span className="text-xs text-gray-500">Фіксована доставка (€)</span>
                                <input
                                  type="number"
                                  min={0}
                                  step={0.5}
                                  disabled={z.isFreeDelivery}
                                  value={z.flatDeliveryFee ?? ''}
                                  onChange={(e) => {
                                    const v = e.target.value
                                    setEditorDeliveryZones((prev) =>
                                      prev.map((x) => {
                                        if (x.id !== z.id) return x
                                        if (v === '') return { ...x, flatDeliveryFee: null }
                                        const n = parseFloat(v)
                                        return { ...x, flatDeliveryFee: Number.isNaN(n) ? null : n }
                                      })
                                    )
                                  }}
                                  className="w-28 rounded-[10px] border border-[#145142]/25 p-2 text-sm disabled:opacity-50"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    void saveEditorZoneTariff(z.id, {
                                      isFreeDelivery: z.isFreeDelivery,
                                      flatDeliveryFee: z.flatDeliveryFee,
                                    })
                                  }
                                  className="rounded-[10px] bg-[#145142] px-3 py-2 text-xs font-bold text-white hover:bg-[#103d34]"
                                >
                                  Зберегти тариф
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Список стран */}
              {countries.length > 0 && (
                <div className="bg-white/80 backdrop-blur-2xl rounded-[20px] sm:rounded-[24px] md:rounded-[28px] p-4 sm:p-6 md:p-8 shadow-2xl shadow-[#145142]/15 border-2 border-white/70 relative overflow-hidden">
                  {/* Декоративные элементы */}
                  <div className="absolute top-0 right-0 w-60 h-60 sm:w-80 sm:h-80 bg-gradient-to-br from-[#145142]/8 via-[#1a6b58]/5 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                  <div className="absolute bottom-0 left-0 w-48 h-48 sm:w-64 sm:h-64 bg-gradient-to-tr from-[#1a6b58]/8 to-transparent rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>
                  
                  <div className="relative z-10">
                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-[#145142] mb-4 sm:mb-6 flex items-center gap-2">
                      <span className="text-2xl sm:text-3xl">🌍</span>
                      <span>{t.adminPanel.cities.countriesTitle}</span>
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      {countries.map(country => (
                        <div key={country.id} className="admin-watta-hover-lift rounded-[14px] border-2 border-[#145142]/10 bg-white/80 p-3 backdrop-blur-sm sm:rounded-[16px] sm:p-4 hover:border-[#145142]/30 hover:shadow-lg hover:shadow-[#145142]/10">
                          {editingCountryId === country.id ? (
                            <div className="flex flex-col gap-2 sm:gap-3">
                              <input
                                placeholder="Назва (RU) *"
                                defaultValue={country.name}
                                className="p-2 sm:p-3 bg-white/80 backdrop-blur-sm rounded-[8px] sm:rounded-[10px] outline-none border border-[#145142]/20 text-sm focus:ring-2 focus:ring-[#145142] focus:border-[#145142]"
                                id={`country-edit-name-${country.id}`}
                              />
                              <input
                                placeholder="Назва (UA)"
                                defaultValue={country.name_ua ?? ''}
                                className="p-2 sm:p-3 bg-white/80 backdrop-blur-sm rounded-[8px] sm:rounded-[10px] outline-none border border-[#145142]/20 text-sm focus:ring-2 focus:ring-[#145142] focus:border-[#145142]"
                                id={`country-edit-name_ua-${country.id}`}
                              />
                              <input
                                placeholder="Назва (EN)"
                                defaultValue={country.name_en ?? ''}
                                className="p-2 sm:p-3 bg-white/80 backdrop-blur-sm rounded-[8px] sm:rounded-[10px] outline-none border border-[#145142]/20 text-sm focus:ring-2 focus:ring-[#145142] focus:border-[#145142]"
                                id={`country-edit-name_en-${country.id}`}
                              />
                              <input
                                placeholder="Назва (NL)"
                                defaultValue={country.name_nl ?? ''}
                                className="p-2 sm:p-3 bg-white/80 backdrop-blur-sm rounded-[8px] sm:rounded-[10px] outline-none border border-[#145142]/20 text-sm focus:ring-2 focus:ring-[#145142] focus:border-[#145142]"
                                id={`country-edit-name_nl-${country.id}`}
                              />
                              <input
                                placeholder="Код (напр. UA, NL)"
                                defaultValue={country.code ?? ''}
                                className="p-2 sm:p-3 bg-white/80 backdrop-blur-sm rounded-[8px] sm:rounded-[10px] outline-none border border-[#145142]/20 text-sm uppercase focus:ring-2 focus:ring-[#145142] focus:border-[#145142]"
                                id={`country-edit-code-${country.id}`}
                              />
                              <div className="relative edit-flag-picker-container">
                                <label className="block text-xs font-semibold text-[#145142] mb-1 uppercase">{t.adminPanel.cities.sticker}</label>
                                <button
                                  type="button"
                                  onClick={() => setIsEditFlagPickerOpen(!isEditFlagPickerOpen)}
                                  className="inline-flex items-center gap-2 px-3 py-2 bg-white/80 backdrop-blur-sm rounded-[10px] border border-[#145142]/20 text-lg hover:border-[#145142]/30 hover:bg-white/90 transition"
                                >
                                  <span>{editCountryFlag}</span>
                                  <span className={`text-xs text-gray-400 ${isEditFlagPickerOpen ? 'rotate-180' : ''}`}>▼</span>
                                </button>
                                {isEditFlagPickerOpen && (
                                  <div className="absolute bottom-full left-0 mb-2 w-56 bg-white/90 backdrop-blur-xl rounded-[12px] border-2 border-[#145142]/20 shadow-xl p-2 z-[200] max-h-40 overflow-y-auto">
                                    <div className="grid grid-cols-6 gap-1">
                                      {countryFlags.map((f, i) => (
                                        <button
                                          key={i}
                                          type="button"
                                          onClick={() => {
                                            setEditCountryFlag(f)
                                            setIsEditFlagPickerOpen(false)
                                          }}
                                          className={`p-1.5 rounded-[8px] text-base transition ${editCountryFlag === f ? 'bg-[#145142]/15 ring-1 ring-[#145142]/50' : 'bg-[#145142]/5 hover:bg-[#145142]/10'}`}
                                        >
                                          {f}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                              <label className="flex items-center gap-2 text-sm">
                                <input
                                  type="checkbox"
                                  defaultChecked={country.isActive}
                                  id={`country-edit-active-${country.id}`}
                                  className="rounded border-[#145142]/30 text-[#145142] focus:ring-[#145142]"
                                />
                                <span>{t.adminPanel.common.activeLabel}</span>
                              </label>
                              <div className="flex gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const name = (document.getElementById(`country-edit-name-${country.id}`) as HTMLInputElement)?.value?.trim()
                                    const name_ua = (document.getElementById(`country-edit-name_ua-${country.id}`) as HTMLInputElement)?.value?.trim() ?? ''
                                    const name_en = (document.getElementById(`country-edit-name_en-${country.id}`) as HTMLInputElement)?.value?.trim() ?? ''
                                    const name_nl = (document.getElementById(`country-edit-name_nl-${country.id}`) as HTMLInputElement)?.value?.trim() ?? ''
                                    const code = (document.getElementById(`country-edit-code-${country.id}`) as HTMLInputElement)?.value?.trim() ?? ''
                                    const isActive = (document.getElementById(`country-edit-active-${country.id}`) as HTMLInputElement)?.checked ?? true
                                    if (!name) {
                                      toast.error('Название страны обязательно')
                                      return
                                    }
                                    handleUpdateCountry(country.id, name, name_ua, name_en, name_nl, editCountryFlag, code, isActive)
                                  }}
                                  className="flex-1 px-3 py-2 bg-[#155044] text-white rounded-[10px] hover:bg-[#103d34] transition text-sm font-medium"
                                >
                                  {t.adminPanel.actions.save}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingCountryId(null)
                                    setIsEditFlagPickerOpen(false)
                                  }}
                                  className="px-3 py-2 bg-white/80 backdrop-blur-sm rounded-[10px] border border-[#145142]/20 hover:bg-[#145142]/10 transition text-sm text-[#145142] font-medium"
                                >
                                  {t.adminPanel.actions.cancel}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                  <span className="text-xl sm:text-2xl flex-shrink-0">{country.flag || '🌍'}</span>
                                  <div className="min-w-0 flex-1">
                                    <h3 className="font-bold text-sm sm:text-base truncate">{country.name}</h3>
                                    <p className="text-xs text-gray-500">{country.code}</p>
                                  </div>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-bold flex-shrink-0 ${
                                  country.isActive ? 'bg-green-100 text-green-700' : 'bg-[#145142]/10 text-[#145142]/70'
                                }`}>
                                  {country.isActive ? '✓' : '○'}
                                </span>
                              </div>
                              {country.cities && country.cities.length > 0 && (
                                <p className="text-xs text-gray-500 mt-2">{t.adminPanel.cities.citiesTitle} {country.cities.length}</p>
                              )}
                              <div className="flex gap-2 mt-2 pt-2 border-t border-[#145142]/10">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingCountryId(country.id)
                                    setEditCountryFlag(country.flag || '🌍')
                                    setIsEditFlagPickerOpen(false)
                                  }}
                                  className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-[8px] sm:rounded-[10px] hover:bg-blue-100 transition flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm"
                                >
                                  <Pencil size={14} className="sm:w-4 sm:h-4" />
                                    <span className="hidden sm:inline">{t.adminPanel.actions.edit}</span>
                                  <span className="sm:hidden">{t.adminPanel.actions.editShort}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCountry(country.id)}
                                  className="px-3 py-2 bg-red-50 text-red-600 rounded-[8px] sm:rounded-[10px] hover:bg-red-100 transition"
                                >
                                  <Trash2 size={14} className="sm:w-4 sm:h-4" />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Список городов */}
              <div className="bg-white/80 backdrop-blur-2xl rounded-[20px] sm:rounded-[24px] md:rounded-[28px] p-4 sm:p-6 md:p-8 shadow-2xl shadow-[#145142]/15 border-2 border-white/70 relative overflow-hidden">
                {/* Декоративные элементы */}
                <div className="absolute top-0 right-0 w-60 h-60 sm:w-80 sm:h-80 bg-gradient-to-br from-[#145142]/8 via-[#1a6b58]/5 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 sm:w-64 sm:h-64 bg-gradient-to-tr from-[#1a6b58]/8 to-transparent rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>
                
                <div className="relative z-10">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-[#145142] mb-4 sm:mb-6 flex items-center gap-2">
                    <MapPin className="w-5 h-5 sm:w-6 sm:h-6" />
                    <span>{t.adminPanel.cities.citiesTitle}</span>
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                  {cities.map(city => (
                    <div key={city.id} className={`admin-watta-hover-lift flex flex-col gap-3 rounded-[14px] border-2 bg-white/80 p-3 shadow-sm backdrop-blur-sm sm:gap-4 sm:rounded-[16px] sm:p-4 md:rounded-[20px] md:p-6 hover:shadow-lg hover:shadow-[#145142]/10 ${editingCityId === city.id ? 'border-[#145142] ring-2 ring-[#145142]/30' : 'border-[#145142]/10 hover:border-[#145142]/30'}`}>
                        <>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#145142]/10 rounded-full flex items-center justify-center text-[#155044] flex-shrink-0">
                              <MapPin size={18} className="sm:w-5 sm:h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-base sm:text-lg truncate">{city.name}</h3>
                              {city.country && (
                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                  <span>{city.country.flag || '🌍'}</span>
                                  <span>{city.country.name}</span>
                                </p>
                              )}
                              {city.latitude && city.longitude && (
                                <p className="text-xs text-gray-400 mt-1">
                                  📍 {city.latitude.toFixed(4)}, {city.longitude.toFixed(4)}
                                </p>
                              )}
                              <p className="text-xs text-[#145142] mt-1 font-semibold">
                                Цена за 1 км: {Number(city.pricePerKm ?? 10).toFixed(2)}
                              </p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-bold flex-shrink-0 ${
                              city.isActive ? 'bg-green-100 text-green-700' : 'bg-[#145142]/10 text-[#145142]/70'
                            }`}>
                              {city.isActive ? 'Активен' : 'Неактивен'}
                            </span>
                          </div>
                          {city.deliveryZones && city.deliveryZones.length > 0 && (
                            <div className="text-xs text-gray-500">
                              {t.adminPanel.cities.deliveryZones} {city.deliveryZones.length}
                            </div>
                          )}
                          <div className="flex gap-2 pt-2 border-t border-[#145142]/10">
                            <button
                              type="button"
                              onClick={() => handleStartEditCity(city)}
                              className="flex-1 px-3 sm:px-4 py-2 bg-blue-50 text-blue-600 rounded-[8px] sm:rounded-[10px] hover:bg-blue-100 transition flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm"
                            >
                              <Pencil size={14} className="sm:w-4 sm:h-4" /> <span className="hidden sm:inline">{t.adminPanel.actions.edit}</span><span className="sm:hidden">{t.adminPanel.actions.editShort}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCity(city.id)}
                              className="px-3 sm:px-4 py-2 bg-red-50 text-red-600 rounded-[8px] sm:rounded-[10px] hover:bg-red-100 transition"
                            >
                              <Trash2 size={14} className="sm:w-4 sm:h-4" />
                            </button>
                          </div>
                        </>
                    </div>
                  ))}
                  {cities.length === 0 && <div className="text-gray-400 col-span-full text-center py-8">{t.adminPanel.common.emptyCities}</div>}
                </div>
              </div>
            </div>
            </div>
          )}

          {/* === Вкладка: БАННЕРЫ === */}
          {activeTab === 'banners' && (
            <div className="admin-banners-tab-shell flex flex-col gap-6 sm:gap-8">
              <div className="admin-banners-tab-hero rounded-[20px] border border-[#145142]/14 bg-gradient-to-br from-white via-[#f7fbf9] to-[#eaf4f0] p-5 shadow-lg shadow-[#145142]/10 sm:rounded-[24px] sm:p-7">
                <div
                  className="admin-banners-tab-hero-orb absolute -right-10 -top-12 h-40 w-40 rounded-full bg-[#145142]/12 blur-3xl"
                  aria-hidden
                />
                <div
                  className="admin-banners-tab-hero-orb admin-banners-tab-hero-orb--2 absolute -bottom-8 -left-6 h-36 w-52 rounded-full bg-[#1a6b56]/10 blur-3xl"
                  aria-hidden
                />
                <div className="relative min-w-0">
                  <div className="inline-flex items-center gap-2 rounded-full bg-[#145142]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#145142]/85 ring-1 ring-[#145142]/15">
                    <LayoutTemplate className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
                    {t.adminPanel.sidebar.bannersDesc}
                  </div>
                  <h2 className="mt-3 text-xl font-bold tracking-tight text-[#155044] sm:text-2xl">
                    {t.adminPanel.sidebar.banners}
                  </h2>
                  <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-[#145142]/75">
                    {t.adminPanel.banners.tabSubtitle}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={openCreateBannerModal}
                className="admin-banners-tab-cta relative flex h-[72px] w-full items-center justify-center rounded-[16px] border border-white/20 bg-[#155044] text-[18px] font-bold text-white sm:h-[77px] sm:rounded-[18px] sm:text-[22px] md:text-[24px]"
              >
                <span className="relative z-[1] flex items-center justify-center gap-2">
                  <Sparkles className="h-5 w-5 shrink-0 opacity-95 sm:h-6 sm:w-6" strokeWidth={2} aria-hidden />
                  {t.adminPanel.banners.addBtn}
                </span>
              </button>

              {sortedBanners.length > 0 && (
                <p className="-mt-1 px-1 text-sm leading-snug text-[#145142]/70">{t.adminPanel.common.bannerDragHint}</p>
              )}

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6 lg:grid-cols-3 lg:gap-6">
                {sortedBanners.map((banner, bannerIndex) => (
                  <div
                    key={banner.id}
                    draggable={!bannerReorderBusy}
                    onDragStart={(e) => handleBannerDragStart(e, banner.id)}
                    onDragEnd={handleBannerDragEnd}
                    onDragOver={handleBannerDragOver}
                    onDrop={(e) => handleBannerDrop(e, banner.id)}
                    style={{ animationDelay: `${Math.min(bannerIndex, 12) * 55}ms` }}
                    className={`admin-banner-card-web admin-banner-card-enter flex select-none flex-col gap-4 rounded-[20px] border border-white/70 bg-white/90 p-6 shadow-xl shadow-[#145142]/10 backdrop-blur-xl transition-opacity ${
                      draggedBannerId === banner.id
                        ? 'opacity-50 ring-2 ring-[#145142]/45 ring-offset-2'
                        : ''
                    } ${bannerReorderBusy ? 'pointer-events-none opacity-70' : 'cursor-grab active:cursor-grabbing'}`}
                  >
                    <div className="-mb-1 -mt-1 flex items-center gap-2 text-[#145142]/70">
                      <GripVertical size={22} className="shrink-0" aria-hidden />
                      <span className="text-xs font-medium uppercase tracking-wide">
                        {t.adminPanel.common.orderIndex}: {banner.order}
                      </span>
                    </div>
                    <div className="pointer-events-none relative h-48 w-full overflow-hidden rounded-[15px] border border-[#145142]/12 bg-[#0d2a22]/5 shadow-inner shadow-[#145142]/5">
                      {banner.imageUrl ? (
                        <div
                          className="h-full w-full bg-no-repeat"
                          style={{
                            backgroundImage: `url(${banner.imageUrl})`,
                            backgroundSize: 'cover',
                            backgroundPosition: `${typeof banner.focalX === 'number' ? banner.focalX : 50}% ${typeof banner.focalY === 'number' ? banner.focalY : 50}%`,
                          }}
                          role="img"
                          aria-label={banner.title_ru}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-gray-300">
                          <ImageIcon size={48} />
                        </div>
                      )}
                      {!banner.isActive && (
                        <div className="absolute right-2 top-2 rounded-full bg-[#145142]/88 px-2 py-1 text-xs text-white backdrop-blur-sm">
                          {t.adminPanel.common.inactiveLabel}
                        </div>
                      )}
                    </div>
                    <div className="pointer-events-none flex flex-col gap-2">
                      <h3 className="text-lg font-bold leading-snug text-[#155044]">{banner.title_ru}</h3>
                    </div>
                    <div className="flex gap-2 border-t border-[#145142]/10 pt-2">
                      <button
                        type="button"
                        draggable={false}
                        onClick={(ev) => {
                          ev.stopPropagation()
                          openEditBannerModal(banner)
                        }}
                        className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-[10px] bg-[#145142]/10 px-4 py-2 text-[#145142] ring-1 ring-[#145142]/18 transition hover:bg-[#145142]/18 active:scale-[0.98]"
                      >
                        <Pencil size={16} /> {t.adminPanel.actions.edit}
                      </button>
                      <button
                        type="button"
                        draggable={false}
                        onClick={(ev) => {
                          ev.stopPropagation()
                          handleDeleteBanner(banner.id)
                        }}
                        className="cursor-pointer rounded-[10px] bg-red-50 px-4 py-2 text-red-600 transition hover:bg-red-100 active:scale-[0.98]"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
                {sortedBanners.length === 0 && (
                  <div className="admin-banner-card-enter col-span-full rounded-[18px] border border-dashed border-[#145142]/25 bg-[#145142]/[0.04] py-14 text-center text-[#145142]/55">
                    {t.adminPanel.common.emptyBanners}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* === Вкладка: КАТЕГОРИИ МЕНЮ === */}
          {activeTab === 'menuCategories' && (
            <div className="flex flex-col gap-4 sm:gap-6 md:gap-8">
              <button 
                onClick={openCreateCategoryModal}
                className="w-full h-14 sm:h-16 md:h-[77px] bg-[#155044] rounded-[12px] sm:rounded-[15px] flex items-center justify-center text-white text-base sm:text-xl md:text-[24px] font-bold hover:bg-[#103d34] transition shadow-md px-4"
              >
                {t.adminPanel.categories.addBtn}
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {menuCategories.map(category => (
                  <div key={category.id} className="admin-watta-hover-lift flex flex-col gap-3 rounded-[16px] border border-white/60 bg-white/85 p-4 shadow-xl shadow-[#145142]/10 backdrop-blur-xl sm:gap-4 sm:rounded-[20px] sm:p-6">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#145142]/10 rounded-[10px] sm:rounded-[12px] flex items-center justify-center text-2xl sm:text-3xl flex-shrink-0">
                        {category.emoji || '🍣'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-base sm:text-lg truncate">{category.name_ru}</h3>
                        <p className="text-xs sm:text-sm text-gray-500 truncate">{t.adminPanel.categories.slug}: {category.slug}</p>
                        <p className="text-xs sm:text-sm text-gray-500">Порядок: {category.order}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-bold flex-shrink-0 ${
                        category.isActive ? 'bg-green-100 text-green-700' : 'bg-[#145142]/10 text-[#145142]/70'
                      }`}>
                        {category.isActive ? 'Активна' : 'Неактивна'}
                      </span>
                    </div>
                    <div className="flex gap-2 pt-2 border-t border-[#145142]/10">
                      <button
                        onClick={() => openEditCategoryModal(category)}
                        className="flex-1 px-3 sm:px-4 py-2 bg-blue-50 text-blue-600 rounded-[8px] sm:rounded-[10px] hover:bg-blue-100 transition flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm"
                      >
                        <Pencil size={14} className="sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Редактировать</span><span className="sm:hidden">Изменить</span>
                      </button>
                      <button
                        onClick={() => {
                          const categoryId = typeof category.id === 'string' ? parseInt(category.id) : category.id
                          handleDeleteCategory(categoryId)
                        }}
                        className="px-3 sm:px-4 py-2 bg-red-50 text-red-600 rounded-[8px] sm:rounded-[10px] hover:bg-red-100 transition flex-shrink-0"
                      >
                        <Trash2 size={14} className="sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {menuCategories.length === 0 && (
                  <div className="text-gray-400 col-span-full text-center py-8">
                    Категорий пока нет
                    <div className="text-sm mt-2">No categories found</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* === Вкладка: ПОЛЬЗОВАТЕЛИ === */}
          {activeTab === 'users' && (
            <div className="flex flex-col gap-4 sm:gap-6 md:gap-8">
              <div className="bg-white/80 backdrop-blur-2xl rounded-[20px] sm:rounded-[24px] md:rounded-[28px] p-4 sm:p-6 md:p-8 shadow-2xl shadow-[#145142]/15 border-2 border-white/70 relative overflow-hidden">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#145142] mb-4 sm:mb-6 flex items-center gap-2">
                  <span>👥</span>
                  <span>Зарегистрированные пользователи</span>
                </h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {users.map(user => (
                    <div key={user.id} className="admin-watta-hover-lift flex flex-col gap-3 rounded-[16px] border border-[#145142]/10 bg-gradient-to-br from-white via-white to-[#f8faf9] p-4 shadow-lg shadow-[#145142]/10 sm:gap-4 sm:rounded-[20px] sm:p-6 hover:border-[#145142]/30 hover:shadow-xl hover:shadow-[#145142]/20">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#145142] to-[#1a6b58] rounded-full flex items-center justify-center text-white font-bold text-lg sm:text-xl flex-shrink-0">
                              {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-base sm:text-lg text-[#145142] truncate">
                                {user.name || 'Без имени'}
                              </h3>
                              <p className="text-xs sm:text-sm text-gray-500 truncate">{user.email}</p>
                            </div>
                          </div>
                          
                          {user.phone && (
                            <p className="text-xs sm:text-sm text-gray-600 mb-1 flex items-center gap-1">
                              <span>📞</span>
                              <span>{user.phone}</span>
                            </p>
                          )}
                          
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-bold ${
                              user.role === 'ADMIN' 
                                ? 'bg-red-100 text-red-700' 
                                : 'bg-green-100 text-green-700'
                            }`}>
                              {user.role === 'ADMIN' ? '👑 Админ' : '👤 Пользователь'}
                            </span>
                            <span className="text-xs text-gray-500">
                              Заказов: {user._count.orders}
                            </span>
                          </div>
                          
                          <p className="text-xs text-gray-400 mt-2">
                            Регистрация: {new Date(user.createdAt).toLocaleDateString('ru-RU', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {users.length === 0 && (
                    <div className="text-gray-400 col-span-full text-center py-8 text-sm sm:text-base">
                      Пользователей пока нет
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          {/* Вкладка РАССЫЛКА */}
          {!isRightPanelOpen && activeTab === 'newsletter' && (
            <div className="max-w-4xl mx-auto">
              <div className="rounded-[24px] border-2 border-white/70 bg-white/85 p-8 shadow-2xl shadow-[#145142]/15 backdrop-blur-2xl">
                <h2 className="mb-2 text-3xl font-bold text-[#145142]">Email Рассылка</h2>
                <p className="text-gray-500 mb-8">Отправка писем всем зарегистрированным пользователям</p>

                <form onSubmit={async (e) => {
                  e.preventDefault();
                  if(!confirm('Отправить это письмо всем пользователям?')) return;
                  
                  const form = e.target as HTMLFormElement;
                  const data = {
                    subject: (form.elements.namedItem('subject') as HTMLInputElement).value,
                    message: (form.elements.namedItem('message') as HTMLTextAreaElement).value,
                    promoCode: (form.elements.namedItem('promoCode') as HTMLInputElement).value,
                  };

                  try {
                    const token = localStorage.getItem('token');
                    const res = await fetch('/api/newsletter/send', {
                      method: 'POST',
                      headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}` 
                      },
                      body: JSON.stringify(data)
                    });
                    const json = await res.json();
                    if(res.ok) {
                      notifySuccess(`Успешно отправлено ${json.count} пользователям!`);
                      form.reset();
                    } else {
                      notifyError('Ошибка: ' + json.message);
                    }
                  } catch(err) {
                    notifyError('Ошибка сети');
                  }
                }} className="space-y-6">
                  
                  <div>
                    <label className="block font-bold text-gray-700 mb-2">Тема письма</label>
                    <input name="subject" required className="w-full p-4 border rounded-xl focus:border-[#155044] outline-none" placeholder="Например: Скидки на роллы!"/>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-2">Текст сообщения</label>
                    <textarea name="message" required rows={6} className="w-full p-4 border rounded-xl focus:border-[#155044] outline-none" placeholder="Введите текст рассылки..."/>
                  </div>

                  <div className="bg-orange-50 p-6 rounded-xl border border-orange-100">
                    <label className="block font-bold text-orange-800 mb-2">🎁 Промокод (опционально)</label>
                    <input name="promoCode" className="w-full p-4 border border-orange-200 rounded-xl focus:border-orange-500 outline-none" placeholder="Например: PROMO2025"/>
                    <p className="text-xs text-orange-600 mt-2">Будет выделен в письме крупным шрифтом</p>
                  </div>

                  <button type="submit" className="w-full py-4 bg-[#155044] text-white font-bold rounded-xl hover:bg-[#103d34] transition flex items-center justify-center gap-2 text-lg">
                    <Mail size={24} />
                    Отправить рассылку
                  </button>

                </form>
              </div>
            </div>
          )}
          {/* === Вкладка: КОМАНДА === */}
          {activeTab === 'team' && (
            <div className="flex flex-col gap-4 sm:gap-6 md:gap-8">
              <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#145142] flex items-center gap-2">
                  <span>👨‍👩‍👧‍👦</span>
                  <span>Команда</span>
                </h2>
                <button
                  onClick={openCreateTeamModal}
                  className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-[#145142] to-[#1a6b58] text-white font-bold rounded-xl hover:from-[#103d34] hover:to-[#145142] transition-all shadow-lg shadow-[#145142]/30 hover:shadow-xl hover:shadow-[#145142]/40 transform hover:scale-[1.02] text-sm sm:text-base"
                >
                  + Додати члена команди
                </button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {teamMembers.map(member => (
                  <div key={member.id} className="admin-watta-hover-lift relative overflow-hidden rounded-2xl border-2 border-white/70 bg-white/80 p-4 shadow-lg shadow-[#145142]/10 backdrop-blur-2xl sm:rounded-3xl sm:p-6 hover:shadow-xl hover:shadow-[#145142]/20">
                    <div className="relative mb-4" style={{ width: '100%', paddingTop: '75%', background: 'linear-gradient(135deg, rgba(20,81,66,0.1) 0%, rgba(20,81,66,0.05) 100%)', borderRadius: '16px', overflow: 'hidden' }}>
                      {member.imageUrl ? (
                        <img src={member.imageUrl} alt={member.name_ru} className="absolute inset-0 w-full h-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#145142] to-[#1a6b58]">
                          <Users size={48} className="text-white opacity-50" />
                        </div>
                      )}
                      {!member.isActive && (
                        <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg">
                          Неактивен
                        </div>
                      )}
                    </div>
                    <h3 className="text-lg sm:text-xl font-black text-[#145142] mb-1">{member.name_ru}</h3>
                    <p className="text-[#145142] font-semibold mb-2">{member.position_ru}</p>
                    {member.bio_ru && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{member.bio_ru}</p>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditTeamModal(member)}
                        className="flex-1 px-3 py-2 bg-[#145142]/10 hover:bg-[#145142]/20 text-[#145142] font-semibold rounded-lg transition-all text-sm"
                      >
                        Редагувати
                      </button>
                      <button
                        onClick={() => handleDeleteTeam(member.id)}
                        className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-600 font-semibold rounded-lg transition-all text-sm"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
                {teamMembers.length === 0 && (
                  <div className="text-gray-400 col-span-full text-center py-12 text-sm sm:text-base">
                    Членів команди поки немає
                  </div>
                )}
              </div>
            </div>
          )}

          {/* === Вкладка: ПРОМОКОДЫ === */}
          {activeTab === 'blog' && (
            <div className="flex flex-col gap-6">
              <div className="rounded-[24px] border-2 border-white/70 bg-white/80 p-6 shadow-2xl shadow-[#145142]/15 backdrop-blur-2xl md:p-8">
                <h2 className="mb-5 text-2xl font-bold text-[#145142]">Блог / Рецепты</h2>
                <form onSubmit={handleSaveBlogPost} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Title"
                    value={blogForm.title}
                    onChange={(e) => setBlogForm((prev) => ({ ...prev, title: e.target.value }))}
                    className="p-4 rounded-xl border-2 border-[#145142]/20 outline-none focus:border-[#145142]"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Slug (e.g. sushi-secrets)"
                    value={blogForm.slug}
                    onChange={(e) => setBlogForm((prev) => ({ ...prev, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                    className="p-4 rounded-xl border-2 border-[#145142]/20 outline-none focus:border-[#145142]"
                    required
                  />
                  <input
                    type="url"
                    placeholder="Image URL"
                    value={blogForm.imageUrl}
                    onChange={(e) => setBlogForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
                    className="p-4 rounded-xl border-2 border-[#145142]/20 outline-none focus:border-[#145142]"
                  />
                  <input
                    type="url"
                    placeholder="Video URL (optional)"
                    value={blogForm.videoUrl}
                    onChange={(e) => setBlogForm((prev) => ({ ...prev, videoUrl: e.target.value }))}
                    className="p-4 rounded-xl border-2 border-[#145142]/20 outline-none focus:border-[#145142]"
                  />
                  <input
                    type="text"
                    placeholder="Author"
                    value={blogForm.author}
                    onChange={(e) => setBlogForm((prev) => ({ ...prev, author: e.target.value }))}
                    className="p-4 rounded-xl border-2 border-[#145142]/20 outline-none focus:border-[#145142] md:col-span-2"
                  />
                  <textarea
                    placeholder="Content"
                    value={blogForm.content}
                    onChange={(e) => setBlogForm((prev) => ({ ...prev, content: e.target.value }))}
                    className="p-4 rounded-xl border-2 border-[#145142]/20 outline-none focus:border-[#145142] md:col-span-2 min-h-[180px]"
                    required
                  />
                  <label className="md:col-span-2 flex items-center gap-3 text-[#145142] font-semibold">
                    <input
                      type="checkbox"
                      checked={blogForm.isPublished}
                      onChange={(e) => setBlogForm((prev) => ({ ...prev, isPublished: e.target.checked }))}
                      className="w-5 h-5 accent-[#145142]"
                    />
                    Is Published
                  </label>
                  <div className="md:col-span-2 flex gap-3">
                    <button className="px-6 py-3 rounded-xl bg-[#145142] text-white font-bold hover:bg-[#0f3d34] transition">
                      {blogForm.id ? 'Обновить' : 'Создать'}
                    </button>
                    {blogForm.id && (
                      <button type="button" onClick={resetBlogForm} className="px-6 py-3 rounded-xl border border-[#145142]/30 text-[#145142] font-semibold">
                        Отмена
                      </button>
                    )}
                  </div>
                </form>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {blogPosts.map((post) => (
                  <div key={post.id} className="admin-watta-hover-lift rounded-2xl border border-[#145142]/15 bg-white/80 p-5 shadow-md shadow-[#145142]/8 backdrop-blur-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-bold text-[#145142]">{post.title}</h3>
                        <p className="text-sm text-gray-500">/{post.slug}</p>
                        <p className="text-xs mt-1 text-gray-500">{post.isPublished ? 'Опубликовано' : 'Черновик'}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleEditBlogPost(post)} className="p-2 rounded-lg bg-[#145142]/10 text-[#145142]"><Pencil size={16} /></button>
                        <button onClick={() => handleDeleteBlogPost(post.id)} className="p-2 rounded-lg bg-red-50 text-red-600"><Trash2 size={16} /></button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-3 line-clamp-3">{post.content}</p>
                  </div>
                ))}
                {blogPosts.length === 0 && (
                  <div className="col-span-full text-center text-gray-400 py-10">Постов пока нет</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'crm' && (
            <div className="flex flex-col gap-6">
              <div className="rounded-[24px] border-2 border-white/70 bg-white/80 p-6 shadow-2xl shadow-[#145142]/15 backdrop-blur-2xl md:p-8">
                <h2 className="mb-4 text-2xl font-bold text-[#145142]">Создать рассылку</h2>
                <form onSubmit={handleSendCrmPromo} className="grid grid-cols-1 gap-4">
                  <div className="inline-flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setCrmMailing((prev) => ({ ...prev, channel: 'email' }))}
                      className={`px-4 py-2 rounded-xl font-semibold transition ${
                        crmMailing.channel === 'email'
                          ? 'bg-[#145142] text-white'
                          : 'bg-[#145142]/10 text-[#145142]'
                      }`}
                    >
                      Email
                    </button>
                    <button
                      type="button"
                      onClick={() => setCrmMailing((prev) => ({ ...prev, channel: 'sms' }))}
                      className={`px-4 py-2 rounded-xl font-semibold transition ${
                        crmMailing.channel === 'sms'
                          ? 'bg-[#145142] text-white'
                          : 'bg-[#145142]/10 text-[#145142]'
                      }`}
                    >
                      SMS
                    </button>
                  </div>

                  <input
                    type="text"
                    placeholder="Тема письма"
                    value={crmMailing.subject}
                    onChange={(e) => setCrmMailing((prev) => ({ ...prev, subject: e.target.value }))}
                    className="p-4 rounded-xl border-2 border-[#145142]/20 outline-none focus:border-[#145142]"
                    disabled={crmMailing.channel === 'sms'}
                  />
                  <textarea
                    placeholder="Текст сообщения / HTML"
                    value={crmMailing.message}
                    onChange={(e) => setCrmMailing((prev) => ({ ...prev, message: e.target.value }))}
                    className="p-4 rounded-xl border-2 border-[#145142]/20 outline-none focus:border-[#145142] min-h-[150px]"
                    required
                  />
                  <button className="w-fit px-6 py-3 rounded-xl bg-[#145142] text-white font-bold hover:bg-[#0f3d34] transition">
                    Отправить всем
                  </button>
                </form>
              </div>

              <div className="overflow-x-auto rounded-[24px] border-2 border-white/70 bg-white/80 p-6 shadow-2xl shadow-[#145142]/15 backdrop-blur-2xl md:p-8">
                <h3 className="mb-4 text-xl font-bold text-[#145142]">Пользователи CRM</h3>
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-[#145142]/80 border-b border-[#145142]/15">
                      <th className="py-3 pr-4">Имя</th>
                      <th className="py-3 pr-4">Email</th>
                      <th className="py-3 pr-4">Телефон</th>
                      <th className="py-3 pr-4">Заказы</th>
                      <th className="py-3 pr-4">Бонусы</th>
                    </tr>
                  </thead>
                  <tbody>
                    {crmUsers.map((u) => (
                      <tr key={u.id} className="border-b border-[#145142]/10 text-gray-700">
                        <td className="py-3 pr-4 font-semibold">{u.name || '—'}</td>
                        <td className="py-3 pr-4">{u.email || '—'}</td>
                        <td className="py-3 pr-4">{u.phone || '—'}</td>
                        <td className="py-3 pr-4">{u._count?.orders ?? 0}</td>
                        <td className="py-3 pr-4 text-[#145142] font-bold">{Number(u.bonusBalance || 0).toFixed(2)} €</td>
                      </tr>
                    ))}
                    {crmUsers.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-gray-400">
                          Пользователей пока нет
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* === Вкладка: ПРОМОКОДЫ === */}
          {activeTab === 'promos' && (
            <div className="flex flex-col gap-4 sm:gap-6 md:gap-8">
              {/* Форма создания */}
              <div className="bg-white/80 backdrop-blur-2xl rounded-[20px] sm:rounded-[24px] md:rounded-[28px] p-4 sm:p-6 md:p-8 shadow-2xl shadow-[#145142]/15 border-2 border-white/70 relative overflow-hidden">
                {/* Декоративные элементы */}
                <div className="absolute top-0 right-0 w-60 h-60 sm:w-80 sm:h-80 bg-gradient-to-br from-[#145142]/8 via-[#1a6b58]/5 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 sm:w-64 sm:h-64 bg-gradient-to-tr from-[#1a6b58]/8 to-transparent rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>
                
                <div className="relative z-10">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-[#145142] mb-4 sm:mb-6 flex items-center gap-2">
                    <Tag className="w-5 h-5 sm:w-6 sm:h-6" /> 
                    <span>Створити новий промокод</span>
                  </h2>
                  <form onSubmit={handleCreatePromo} className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <input 
                      type="text" 
                      placeholder="Код (наприклад, NEW2025)"
                      value={newPromoCode}
                      onChange={e => setNewPromoCode(e.target.value.toUpperCase())}
                      className="flex-1 p-3 sm:p-4 bg-white/80 backdrop-blur-sm rounded-[14px] sm:rounded-[16px] outline-none border-2 border-[#145142]/20 font-bold text-sm sm:text-base uppercase transition-all focus:border-[#145142] focus:bg-white/90 focus:shadow-lg focus:shadow-[#145142]/10"
                    required
                  />
                  <input 
                    type="number" 
                    placeholder="Знижка %"
                    value={newPromoDiscount}
                    onChange={e => setNewPromoDiscount(e.target.value)}
                    className="w-full sm:w-32 p-3 sm:p-4 bg-white/80 backdrop-blur-sm rounded-[14px] sm:rounded-[16px] outline-none border-2 border-[#145142]/20 font-bold text-sm sm:text-base transition-all focus:border-[#145142] focus:bg-white/90 focus:shadow-lg focus:shadow-[#145142]/10"
                    required
                  />
                  <button className="px-4 sm:px-6 md:px-8 py-3 sm:py-4 bg-gradient-to-r from-[#145142] to-[#1a6b58] text-white font-bold rounded-[14px] sm:rounded-[16px] hover:from-[#103d34] hover:to-[#145142] transition-all shadow-lg shadow-[#145142]/30 hover:shadow-xl hover:shadow-[#145142]/40 transform hover:scale-[1.02] text-sm sm:text-base">
                    Створити
                  </button>
                </form>
                </div>
              </div>

              {/* Список */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                 {promos.map(promo => (
                   <div key={promo.id} className="admin-watta-hover-lift flex flex-col items-start justify-between gap-3 rounded-[16px] border-2 border-[#145142]/10 bg-white/80 p-4 shadow-sm backdrop-blur-sm sm:flex-row sm:items-center sm:gap-4 sm:rounded-[20px] sm:p-6 hover:border-[#145142]/30 hover:shadow-lg hover:shadow-[#145142]/10">
                     <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                       <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#145142]/10 to-[#1a6b58]/10 rounded-full flex items-center justify-center text-[#145142] flex-shrink-0">
                         <Tag size={20} className="sm:w-6 sm:h-6" />
                       </div>
                       <div className="min-w-0 flex-1">
                         <div className="text-base sm:text-xl font-bold text-[#145142] truncate">{promo.code}</div>
                         <div className="text-green-600 font-bold text-sm sm:text-base">-{promo.discount}% знижка</div>
                       </div>
                     </div>
                     <button 
                       onClick={() => handleDeletePromo(promo.id)}
                       className="p-2 sm:p-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition flex-shrink-0 self-end sm:self-auto"
                     >
                       <Trash2 size={18} className="sm:w-6 sm:h-6" />
                     </button>
                   </div>
                 ))}
                 {promos.length === 0 && <div className="text-gray-400 col-span-full text-center py-8 text-sm sm:text-base">Промокодів поки немає</div>}
              </div>
            </div>
          )}

            </div>
          )}
          {!isRightPanelOpen && activeTab === 'settings' && (
             <div className="flex flex-col gap-4 sm:gap-6 md:gap-8 max-w-2xl mx-auto w-full">
               <div className="bg-white/80 backdrop-blur-2xl rounded-[20px] sm:rounded-[24px] md:rounded-[28px] p-4 sm:p-6 md:p-8 shadow-2xl shadow-[#145142]/15 border-2 border-white/70">
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#145142] mb-6 flex items-center gap-2">
                     <Settings className="w-6 h-6 sm:w-8 sm:h-8" />
                     <span>Налаштування сайту</span>
                  </h2>

                  <form onSubmit={handleSaveSettings} className="space-y-6">
                     <div>
                        <label className="block text-sm font-bold text-[#145142] mb-2">
                           Інтервал зміни банерів (секунди)
                        </label>
                        <div className="flex items-center gap-3">
                           <input 
                             type="number" 
                             min="1"
                             value={settings.bannerInterval / 1000}
                             onChange={(e) => setSettings({...settings, bannerInterval: parseInt(e.target.value) * 1000})}
                             className="flex-1 p-4 bg-white/80 backdrop-blur-sm rounded-[16px] outline-none border-2 border-[#145142]/20 font-bold text-lg transition-all focus:border-[#145142]"
                           />
                           <span className="text-gray-500 font-medium">сек.</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                           Вкажіть час, через який слайди на головній сторінці будуть автоматично перемикатися.
                        </p>
                     </div>

                     <div className="border-t border-gray-200 pt-6 space-y-4">
                        <h3 className="text-sm font-bold text-[#145142] uppercase tracking-wide">Соцмережі та адреса</h3>
                        <div>
                          <label className="block text-sm font-bold text-[#145142] mb-2">Telegram (повне посилання)</label>
                          <input
                            type="url"
                            value={settings.telegramUrl}
                            onChange={(e) => setSettings({ ...settings, telegramUrl: e.target.value })}
                            placeholder="https://t.me/..."
                            className="w-full p-4 bg-white/80 rounded-[16px] outline-none border-2 border-[#145142]/20 font-medium focus:border-[#145142]"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-[#145142] mb-2">WhatsApp (повне посилання)</label>
                          <input
                            type="url"
                            value={settings.whatsappUrl}
                            onChange={(e) => setSettings({ ...settings, whatsappUrl: e.target.value })}
                            placeholder="https://wa.me/380..."
                            className="w-full p-4 bg-white/80 rounded-[16px] outline-none border-2 border-[#145142]/20 font-medium focus:border-[#145142]"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-[#145142] mb-2">Instagram (повне посилання)</label>
                          <input
                            type="url"
                            value={settings.instagramUrl}
                            onChange={(e) => setSettings({ ...settings, instagramUrl: e.target.value })}
                            placeholder="https://instagram.com/..."
                            className="w-full p-4 bg-white/80 rounded-[16px] outline-none border-2 border-[#145142]/20 font-medium focus:border-[#145142]"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-[#145142] mb-2">Адреса самовивозу</label>
                          <textarea
                            value={settings.restaurantPickupAddress}
                            onChange={(e) => setSettings({ ...settings, restaurantPickupAddress: e.target.value })}
                            rows={3}
                            placeholder="Показується клієнтам при виборі самовивозу"
                            className="w-full p-4 bg-white/80 rounded-[16px] outline-none border-2 border-[#145142]/20 font-medium focus:border-[#145142] resize-y min-h-[88px]"
                          />
                        </div>
                     </div>

                     <div className="border-t border-gray-200 pt-6 space-y-4">
                        <h3 className="text-sm font-bold text-[#145142] uppercase tracking-wide">Доставка (фіксована)</h3>
                        <div>
                          <label className="block text-sm font-bold text-[#145142] mb-2">Безкоштовна доставка від (€)</label>
                          <input
                            type="number"
                            min={0}
                            step={1}
                            value={settings.freeDeliveryThreshold}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                freeDeliveryThreshold: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-full p-4 bg-white/80 rounded-[16px] outline-none border-2 border-[#145142]/20 font-bold text-lg focus:border-[#145142]"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-[#145142] mb-2">Фіксована вартість доставки (€)</label>
                          <input
                            type="number"
                            min={0}
                            step={1}
                            value={settings.deliveryFee}
                            onChange={(e) =>
                              setSettings({ ...settings, deliveryFee: parseFloat(e.target.value) || 0 })
                            }
                            className="w-full p-4 bg-white/80 rounded-[16px] outline-none border-2 border-[#145142]/20 font-bold text-lg focus:border-[#145142]"
                          />
                        </div>
                        <p className="text-xs text-gray-400">
                          Якщо сума товарів (з урахуванням знижки) нижче порогу — додається ця сума. Самовивіз без доставки.
                        </p>
                     </div>

                     <button 
                       type="submit" 
                       disabled={settingsLoading}
                       className="w-full py-4 bg-[#155044] text-white font-bold rounded-[16px] hover:bg-[#103d34] transition shadow-none flex items-center justify-center gap-2 disabled:opacity-50"
                     >
                        <Save size={20} />
                        {settingsLoading ? 'Збереження...' : 'Зберегти налаштування'}
                     </button>
                  </form>
               </div>
             </div>
            )}

          </div>
        </div>

        {/* МОДАЛЬНОЕ ОКНО (С ИСПРАВЛЕННЫМИ ПОЛЯМИ ПОД 4 ЯЗЫКА) */}
        {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <div className="relative bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between gap-2 mb-4 sm:mb-6">
              <div className="h-10 w-10 shrink-0" aria-hidden />
              <h2 className="flex-1 text-center text-xl sm:text-2xl font-bold text-[#155044] px-1">
                {editingId ? 'Редактировать блюдо' : 'Новое блюдо'}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500 text-white shadow-none hover:bg-red-600 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                aria-label="Закрыть"
              >
                <X size={22} strokeWidth={2.5} />
              </button>
            </div>
            
            <form onSubmit={handleSubmitProduct} className="space-y-3 sm:space-y-4">
              <div className="flex justify-center mb-3 sm:mb-4">
                <label className="cursor-pointer w-full h-32 sm:h-40 border-2 border-dashed border-[#145142]/30 rounded-[12px] sm:rounded-[15px] flex flex-col items-center justify-center hover:bg-[#145142]/5 transition relative overflow-hidden group p-2 bg-white/40 backdrop-blur-sm">
                  {formData.imageUrl ? (
                    <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <>
                      <Upload size={24} className="sm:w-8 sm:h-8 text-gray-400 mb-1 sm:mb-2" />
                      <span className="text-xs sm:text-sm text-gray-500 text-center px-2">Нажмите, чтобы загрузить фото</span>
                    </>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  {formData.imageUrl && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition rounded-lg">
                      <span className="text-white font-medium text-sm sm:text-base">Изменить</span>
                    </div>
                  )}
                </label>
              </div>

              {/* --- ПЕРЕКЛЮЧАТЕЛЬ ЯЗЫКОВ --- */}
              <div className="flex p-1 bg-gray-100 rounded-lg mb-4">
                {['ru', 'ua', 'en', 'nl'].map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setEditorLang(lang as any)}
                    className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${
                      editorLang === lang 
                        ? 'bg-white text-[#145142] shadow-sm' 
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {lang.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* --- ПОЛЕ НАЗВАНИЯ (Меняется в зависимости от вкладки) --- */}
              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Название товара ({editorLang.toUpperCase()})
                </label>
                <input
                  type="text"
                  value={(formData as any)[`name_${editorLang}`] || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, [`name_${editorLang}`]: e.target.value }))}
                  className="w-full p-3 bg-white/80 backdrop-blur-sm border border-[#145142]/20 rounded-xl outline-none focus:ring-2 focus:ring-[#145142] focus:border-[#145142]"
                  placeholder={`Например: Филадельфия (${editorLang})`}
                />
              </div>

              {/* --- ПОЛЕ ОПИСАНИЯ (Меняется в зависимости от вкладки) --- */}
              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Описание ({editorLang.toUpperCase()})
                </label>
                <textarea
                  value={(formData as any)[`description_${editorLang}`] || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, [`description_${editorLang}`]: e.target.value }))}
                  className="w-full p-3 bg-white/80 backdrop-blur-sm border border-[#145142]/20 rounded-xl outline-none focus:ring-2 focus:ring-[#145142] focus:border-[#145142] h-24 resize-none"
                  placeholder={`Состав, вес, особенности... (${editorLang})`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[#145142]/80 mb-1">Цена (€)</label>
                  <input 
                    name="price" 
                    type="number" 
                    required 
                    value={formData.price} 
                    onChange={handleInputChange}
                    className="w-full p-2 sm:p-3 bg-white/80 backdrop-blur-sm border border-[#145142]/20 rounded-[8px] sm:rounded-[10px] outline-none focus:ring-2 focus:ring-[#145142] focus:border-[#145142] text-sm"
                    placeholder="0" 
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[#145142]/80 mb-1">Категория</label>
                  <select 
                    name="categoryId" 
                    required 
                    value={formData.categoryId} 
                    onChange={handleInputChange}
                    className="w-full p-2 sm:p-3 bg-white/80 backdrop-blur-sm border border-[#145142]/20 rounded-[8px] sm:rounded-[10px] outline-none focus:ring-2 focus:ring-[#145142] focus:border-[#145142] text-sm"
                  >
                    <option value="">Выберите...</option>
                    {menuCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name_ru}</option>
                    ))}
                  </select>
                </div>

                {/* Выбор городов */}
                <div className="sm:col-span-2">
                  <label className="block text-xs sm:text-sm font-medium text-[#145142]/80 mb-2">
                    Города доставки *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 max-h-40 sm:max-h-48 overflow-y-auto p-2 sm:p-3 bg-[#145142]/5 rounded-[8px] sm:rounded-[10px] border border-[#145142]/10">
                    {cities.map(city => (
                      <label
                        key={city.id}
                        className={`flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-lg cursor-pointer transition text-xs sm:text-sm ${
                          formData.cityIds.includes(city.id)
                            ? 'bg-[#155044] text-white'
                            : 'bg-white/80 hover:bg-[#145142]/10 backdrop-blur-sm border border-[#145142]/10'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.cityIds.includes(city.id)}
                          onChange={() => toggleCitySelection(city.id)}
                          className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0"
                        />
                        <span className="font-medium truncate">
                          {city.name_nl || city.name}
                        </span>
                      </label>
                    ))}
                  </div>
                  {cities.length === 0 && (
                    <p className="text-xs sm:text-sm text-[#145142]/60 mt-2">
                      Сначала добавьте города во вкладке "Города"
                    </p>
                  )}
                </div>
              </div>

              {/* ОПИСАНИЯ */}
              <div className="space-y-2">
                <label className="block text-xs sm:text-sm font-medium text-[#145142]/80">Описания (Состав)</label>
                <textarea name="description_ru" value={formData.description_ru} onChange={handleInputChange} className="w-full p-2 bg-white/80 backdrop-blur-sm border border-[#145142]/20 rounded-lg h-14 sm:h-16 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-[#145142] focus:border-[#145142]" placeholder="RU: Рис, нори..." />
                <textarea name="description_ua" value={formData.description_ua} onChange={handleInputChange} className="w-full p-2 bg-white/80 backdrop-blur-sm border border-[#145142]/20 rounded-lg h-14 sm:h-16 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-[#145142] focus:border-[#145142]" placeholder="UA: Рис, норі..." />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                   <textarea name="description_en" value={formData.description_en} onChange={handleInputChange} className="w-full p-2 bg-white/80 backdrop-blur-sm border border-[#145142]/20 rounded-lg h-14 sm:h-16 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-[#145142] focus:border-[#145142]" placeholder="EN: Rice..." />
                   <textarea name="description_nl" value={formData.description_nl} onChange={handleInputChange} className="w-full p-2 bg-white/80 backdrop-blur-sm border border-[#145142]/20 rounded-lg h-14 sm:h-16 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-[#145142] focus:border-[#145142]" placeholder="NL: Rijst..." />
                </div>
              </div>
              {/* --- ВЫБОР ИНГРЕДИЕНТОВ --- */}
              <div className="mb-4">
                <label className="block text-sm font-bold text-[#145142]/70 mb-2">
                  Ингредиенты (Состав)
                </label>
                
                {/* Сетка ингредиентов */}
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-40 overflow-y-auto p-2 border rounded-xl bg-gray-50">
                  {ingredients.map(ing => {
                    // Проверяем, выбран ли ингредиент
                    const isSelected = (formData as any).ingredientIds?.includes(ing.id);
                    
                    return (
                      <div 
                        key={ing.id}
                        onClick={() => {
                          const currentIds = (formData as any).ingredientIds || [];
                          const newIds = isSelected 
                            ? currentIds.filter((id: number) => id !== ing.id) // Убрать
                            : [...currentIds, ing.id]; // Добавить
                          setFormData(prev => ({ ...prev, ingredientIds: newIds }));
                        }}
                        className={`cursor-pointer rounded-lg p-2 flex flex-col items-center gap-1 border-2 transition-all ${
                          isSelected ? 'border-[#145142] bg-[#145142]/10' : 'border-transparent bg-white hover:shadow-md'
                        }`}
                      >
                        <img src={ing.imageUrl} className="w-8 h-8 object-contain" alt={ing.name_ru} />
                        <span className="text-[10px] text-center font-bold leading-tight">{ing.name_ru}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
              <button 
                type="submit" 
                className="w-full py-3 sm:py-4 bg-[#155044] text-white font-bold rounded-[12px] sm:rounded-[15px] hover:bg-[#103d34] transition shadow-none mt-2 text-sm sm:text-base"
              >
                {editingId ? 'Сохранить изменения' : 'Сохранить'}
              </button>
            </form>
            {/* Продолжение тени и фона при прокрутке вниз */}
            <div className="sticky bottom-0 left-0 right-0 h-12 -mb-12 bg-gradient-to-b from-transparent via-white/80 to-white/80 pointer-events-none z-10 rounded-b-[20px] sm:rounded-b-[25px]"></div>
          </div>
        </div>
      )}

      {/* МОДАЛЬНОЕ ОКНО ДЛЯ КАТЕГОРИЙ МЕНЮ */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <div className="relative bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            {/* Продолжение тени и фона при прокрутке */}
            <div className="sticky bottom-0 left-0 right-0 h-8 -mb-8 bg-gradient-to-b from-white/80 via-white/80 to-transparent pointer-events-none z-10"></div>
            <div className="flex items-center justify-between gap-2 mb-4 sm:mb-6">
              <div className="h-10 w-10 shrink-0" aria-hidden />
              <h2 className="flex-1 text-center text-xl sm:text-2xl font-bold text-[#155044] px-1">
                {editingCategoryId ? 'Редактировать категорию' : 'Новая категория'}
              </h2>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500 text-white shadow-none hover:bg-red-600 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                aria-label="Закрыть"
              >
                <X size={22} strokeWidth={2.5} />
              </button>
            </div>
            
            <form onSubmit={handleSubmitCategory} className="space-y-3 sm:space-y-4">
              {/* Эмодзи с выбором */}
              <div>
                <label className="block text-sm font-medium text-[#145142]/80 mb-2">Эмодзи (стикер) *</label>
                <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#145142]/10 rounded-[12px] flex items-center justify-center text-3xl sm:text-4xl border-2 border-[#145142]/20 flex-shrink-0">
                    {categoryFormData.emoji || '🍣'}
                  </div>
                  <div className="flex-1 w-full">
                    <input 
                      name="emoji" 
                      required 
                      value={categoryFormData.emoji} 
                      onChange={(e) => setCategoryFormData(prev => ({ ...prev, emoji: e.target.value }))}
                      className="w-full p-2 sm:p-3 bg-white/80 backdrop-blur-sm border border-[#145142]/20 rounded-[10px] outline-none focus:ring-2 focus:ring-[#145142] focus:border-[#145142] text-xl sm:text-2xl text-center"
                      placeholder="🍣" 
                      maxLength={2}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const emojiPicker = document.getElementById('emoji-picker-category')
                        if (emojiPicker) {
                          emojiPicker.style.display = emojiPicker.style.display === 'none' ? 'block' : 'none'
                        }
                      }}
                      className="w-full mt-2 px-3 py-2 bg-[#145142]/10 text-[#145142] rounded-lg hover:bg-[#145142]/20 transition text-xs sm:text-sm font-medium border border-[#145142]/20"
                    >
                      Выбрать из списка
                    </button>
                  </div>
                </div>
                
                {/* Палитра эмодзи */}
                <div id="emoji-picker-category" className="hidden mt-4 p-3 sm:p-4 bg-white/80 backdrop-blur-sm rounded-lg border border-[#145142]/20">
                  <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-48 overflow-y-auto">
                    {[
                      '🍣', '🍙', '🍱', '🍜', '🍲', '🥘', '🍛', '🍝',
                      '🥗', '🍤', '🦐', '🦞', '🦀', '🐟', '🐠', '🐡',
                      '🧃', '🥤', '🍶', '🍵', '☕', '🍺', '🍻', '🥂',
                      '🌶️', '🧄', '🧅', '🥑', '🥒', '🥕', '🌽', '🍅',
                      '🍰', '🎂', '🧁', '🍪', '🍩', '🍫', '🍬', '🍭',
                      '🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈',
                      '🥐', '🥖', '🍞', '🥨', '🥯', '🥞', '🧇', '🍳',
                      '🥓', '🥩', '🍗', '🍖', '🌭', '🍔', '🍟', '🍕'
                    ].map((emoji, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setCategoryFormData(prev => ({ ...prev, emoji }))
                          const emojiPicker = document.getElementById('emoji-picker-category')
                          if (emojiPicker) emojiPicker.style.display = 'none'
                        }}
                        className="w-10 h-10 sm:w-12 sm:h-12 text-2xl sm:text-3xl hover:bg-[#145142]/10 hover:scale-110 transition rounded-lg flex items-center justify-center"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Названия на разных языках */}
              <div>
                <label className="block text-sm font-medium text-[#145142]/80 mb-1">Название (RU) *</label>
                <input 
                  name="name_ru" 
                  required 
                  value={categoryFormData.name_ru} 
                  onChange={(e) => setCategoryFormData(prev => ({ ...prev, name_ru: e.target.value }))}
                  className="w-full p-3 bg-white/80 backdrop-blur-sm border border-[#145142]/20 rounded-[10px] outline-none focus:ring-2 focus:ring-[#145142] focus:border-[#145142]"
                  placeholder="Например: Десерты" 
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-sm font-medium text-[#145142]/80 mb-1">Название (UA)</label>
                  <input 
                    name="name_ua" 
                    value={categoryFormData.name_ua} 
                    onChange={(e) => setCategoryFormData(prev => ({ ...prev, name_ua: e.target.value }))}
                    className="w-full p-2 bg-white/80 backdrop-blur-sm border border-[#145142]/20 rounded-[10px] outline-none focus:ring-2 focus:ring-[#145142] focus:border-[#145142] text-sm"
                    placeholder="UA" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#145142]/80 mb-1">Название (EN)</label>
                  <input 
                    name="name_en" 
                    value={categoryFormData.name_en} 
                    onChange={(e) => setCategoryFormData(prev => ({ ...prev, name_en: e.target.value }))}
                    className="w-full p-2 bg-white/80 backdrop-blur-sm border border-[#145142]/20 rounded-[10px] outline-none focus:ring-2 focus:ring-[#145142] focus:border-[#145142] text-sm"
                    placeholder="EN" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#145142]/80 mb-1">Название (NL)</label>
                  <input 
                    name="name_nl" 
                    value={categoryFormData.name_nl} 
                    onChange={(e) => setCategoryFormData(prev => ({ ...prev, name_nl: e.target.value }))}
                    className="w-full p-2 bg-white/80 backdrop-blur-sm border border-[#145142]/20 rounded-[10px] outline-none focus:ring-2 focus:ring-[#145142] focus:border-[#145142] text-sm"
                    placeholder="NL" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[#145142]/80 mb-1">Slug (URL)</label>
                  <input 
                    name="slug" 
                    value={categoryFormData.slug} 
                    onChange={(e) => setCategoryFormData(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                    className="w-full p-2 sm:p-3 bg-white/80 backdrop-blur-sm border border-[#145142]/20 rounded-[10px] outline-none focus:ring-2 focus:ring-[#145142] focus:border-[#145142] text-sm"
                    placeholder="Автоматически" 
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[#145142]/80 mb-1">Порядок отображения</label>
                  <input 
                    name="order" 
                    type="number" 
                    value={categoryFormData.order} 
                    onChange={(e) => setCategoryFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
                    className="w-full p-2 sm:p-3 bg-white/80 backdrop-blur-sm border border-[#145142]/20 rounded-[10px] outline-none focus:ring-2 focus:ring-[#145142] focus:border-[#145142] text-sm"
                    placeholder="0" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-[#145142]/80 mb-1">Активна</label>
                <select 
                  name="isActive" 
                  value={categoryFormData.isActive ? 'true' : 'false'} 
                  onChange={(e) => setCategoryFormData(prev => ({ ...prev, isActive: e.target.value === 'true' }))}
                  className="w-full p-2 sm:p-3 bg-white/80 backdrop-blur-sm border border-[#145142]/20 rounded-[10px] outline-none focus:ring-2 focus:ring-[#145142] focus:border-[#145142] text-sm"
                >
                  <option value="true">Да</option>
                  <option value="false">Нет</option>
                </select>
              </div>

              <button 
                type="submit" 
                className="w-full py-3 sm:py-4 bg-[#155044] text-white font-bold rounded-[12px] sm:rounded-[15px] hover:bg-[#103d34] transition shadow-none mt-2 text-sm sm:text-base"
              >
                {editingCategoryId ? 'Сохранить изменения' : 'Сохранить'}
              </button>
            </form>
            {/* Продолжение тени и фона при прокрутке вниз */}
            <div className="sticky bottom-0 left-0 right-0 h-12 -mb-12 bg-gradient-to-b from-transparent via-white/80 to-white/80 pointer-events-none z-10 rounded-b-[20px] sm:rounded-b-[25px]"></div>
          </div>
        </div>
      )}

      {/* МОДАЛЬНОЕ ОКНО ДЛЯ БАННЕРОВ */}
      {isBannerModalOpen && (
        <div
          className="admin-banner-modal-backdrop-animate fixed inset-0 z-[60] flex items-center justify-center bg-black/55 p-3 backdrop-blur-[3px] sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="banner-modal-title"
        >
          <div className="admin-banner-modal-panel-animate relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-[22px] bg-white shadow-[0_24px_64px_-12px_rgba(20,81,66,0.28)] ring-1 ring-[#145142]/12 sm:rounded-[26px]">
            <div
              className="h-1.5 w-full shrink-0 bg-gradient-to-r from-[#0f3d32] via-[#145142] to-[#1a6b56]"
              aria-hidden
            />
            <div className="relative max-h-[calc(92vh-6px)] overflow-y-auto overflow-x-hidden px-5 pb-6 pt-5 sm:px-6 sm:pb-7 sm:pt-6">
              <div className="mb-5 flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <div className="admin-banner-modal-icon-pop flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#145142]/14 to-[#145142]/5 text-[#145142] ring-1 ring-[#145142]/18 shadow-[0_8px_24px_-6px_rgba(20,81,66,0.35)]">
                    <LayoutTemplate className="h-6 w-6" strokeWidth={1.75} aria-hidden />
                  </div>
                  <div className="min-w-0 pt-0.5">
                    <h2
                      id="banner-modal-title"
                      className="text-lg font-bold leading-tight text-[#155044] sm:text-xl"
                    >
                      {editingBannerId ? 'Редактировать баннер' : 'Новый баннер'}
                    </h2>
                    <p className="mt-1 text-xs leading-snug text-[#145142]/65 sm:text-sm">
                      Слайд на главной: фото и подписи на четырёх языках
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsBannerModalOpen(false)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500 text-white transition hover:scale-105 hover:bg-red-600 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                  aria-label="Закрыть"
                >
                  <X size={22} strokeWidth={2.5} />
                </button>
              </div>

              <form onSubmit={handleSubmitBanner} className="space-y-5">
                <section className="rounded-2xl border border-[#145142]/12 bg-gradient-to-b from-white to-[#f6faf8]/90 p-4 shadow-sm transition-shadow duration-300 hover:shadow-md hover:shadow-[#145142]/10 sm:p-5">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-[#145142]" strokeWidth={2} aria-hidden />
                      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#145142]/75">
                        Обложка слайда
                      </span>
                    </div>
                    <span className="hidden text-[10px] text-[#145142]/50 sm:inline">JPG, PNG · до 50 МБ</span>
                  </div>
                  <label
                    onDragEnter={onBannerUploadDragEnter}
                    onDragLeave={onBannerUploadDragLeave}
                    onDragOver={onBannerUploadDragOver}
                    onDrop={onBannerUploadDrop}
                    className={`group relative flex h-48 w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed p-3 transition-all duration-300 sm:h-56 md:h-64 sm:rounded-2xl sm:p-4 ${
                      bannerImageDropActive
                        ? 'scale-[1.01] border-[#145142] border-solid bg-[#145142]/12 ring-2 ring-[#145142]/40 ring-offset-2'
                        : `border-[#145142]/28 bg-white/60 hover:border-[#145142]/50 hover:bg-[#145142]/[0.05] ${
                            !bannerFormData.imageUrl ? 'admin-banner-dropzone-idle' : ''
                          }`
                    }`}
                  >
                    {bannerFormData.imageUrl ? (
                      <img
                        src={bannerFormData.imageUrl}
                        alt=""
                        className="h-full w-full rounded-lg object-contain pointer-events-none"
                      />
                    ) : (
                      <div className="flex flex-col items-center text-center px-2">
                        <div
                          className={`mb-3 flex h-14 w-14 items-center justify-center rounded-2xl text-[#145142] ring-1 transition ${
                            bannerImageDropActive
                              ? 'scale-110 bg-[#145142]/20 ring-[#145142]/40'
                              : 'bg-[#145142]/10 ring-[#145142]/15'
                          }`}
                        >
                          <Upload className="h-7 w-7" strokeWidth={1.75} />
                        </div>
                        <span className="text-sm font-semibold text-[#155044]">
                          {bannerImageDropActive ? 'Отпустите, чтобы загрузить' : 'Перетащите фото сюда'}
                        </span>
                        <span className="mt-1 text-xs font-medium text-[#145142]/70">или нажмите и выберите файл</span>
                        <span className="mt-2 max-w-[260px] text-[11px] text-gray-500">
                          Горизонтальное фото лучше для карусели · JPG, PNG, WebP
                        </span>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleBannerImageUpload}
                    />
                    {bannerFormData.imageUrl && bannerImageDropActive && (
                      <div className="absolute inset-0 z-[6] flex items-center justify-center rounded-lg bg-[#145142]/35 ring-2 ring-inset ring-[#145142]/60">
                        <span className="rounded-full bg-white px-4 py-2 text-sm font-bold text-[#155044] shadow-lg">
                          Отпустите, чтобы заменить фото
                        </span>
                      </div>
                    )}
                    {bannerFormData.imageUrl && !bannerImageDropActive && (
                      <div className="absolute inset-0 z-[5] flex items-center justify-center rounded-lg bg-black/45 opacity-0 transition group-hover:opacity-100">
                        <span className="flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-sm font-semibold text-[#155044] shadow-md">
                          <Pencil className="h-4 w-4" />
                          Заменить фото
                        </span>
                      </div>
                    )}
                  </label>
                </section>

                {bannerFormData.imageUrl ? (
                  <section className="rounded-2xl border border-[#145142]/12 bg-[#f4f9f7] p-4 shadow-sm transition-shadow duration-300 hover:shadow-md hover:shadow-[#145142]/8 sm:p-5">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-2">
                        <div className="flex items-center gap-2">
                          <Move className="h-4 w-4 text-[#145142]" strokeWidth={2} aria-hidden />
                          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#145142]/75">
                            Как на сайте
                          </span>
                        </div>
                        <span className="rounded-full bg-[#145142]/12 px-2 py-0.5 text-[10px] font-semibold text-[#145142]/80">
                          16∶9 · cover · все экраны
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setBannerFormData((p) => ({ ...p, focalX: 50, focalY: 50 }))
                        }
                        className="text-xs font-semibold text-[#145142] underline decoration-[#145142]/35 underline-offset-2 hover:text-[#103d34]"
                      >
                        Сбросить в центр
                      </button>
                    </div>
                    <p className="mb-3 text-xs leading-snug text-[#145142]/65">
                      На сайте баннер всегда <span className="font-semibold">16∶9</span> и режим{' '}
                      <span className="font-semibold">cover</span>, как в этом превью. Перетащите кадр или
                      подстройте ползунки — на телефоне и на ПК обрезка будет такой же.
                    </p>
                    <div
                      ref={bannerFocalPreviewRef}
                      role="application"
                      aria-label="Сдвиг кадра баннера, как на главной странице"
                      className="admin-banner-site-preview-frame-web relative w-full cursor-grab touch-none select-none overflow-hidden bg-[#0d2a22] shadow-[0_8px_28px_rgba(20,81,66,0.18)] ring-2 ring-[#145142]/20 transition-shadow duration-300 hover:shadow-[0_12px_36px_rgba(20,81,66,0.28)] hover:ring-[#145142]/35 active:cursor-grabbing [touch-action:none]"
                      onPointerDown={onBannerFocalPointerDown}
                      onPointerMove={onBannerFocalPointerMove}
                      onPointerUp={endBannerFocalDrag}
                      onPointerCancel={endBannerFocalDrag}
                    >
                      <div
                        className="absolute inset-0 bg-center"
                        style={{
                          backgroundImage: `url(${bannerFormData.imageUrl})`,
                          backgroundSize: 'cover',
                          backgroundPosition: `${bannerFormData.focalX}% ${bannerFormData.focalY}%`,
                          backgroundRepeat: 'no-repeat',
                        }}
                        aria-hidden
                      />
                      <div
                        className="pointer-events-none absolute inset-0 bg-black/10"
                        aria-hidden
                      />
                      <div
                        className="pointer-events-none absolute bottom-2.5 left-0 right-0 flex justify-center gap-2"
                        aria-hidden
                      >
                        {[0, 1, 2].map((i) => (
                          <span
                            key={i}
                            className={`h-1.5 w-1.5 rounded-full shadow-sm ${
                              i === 0 ? 'bg-white' : 'bg-white/40'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#145142]/60">
                          Заголовок (превью перевода)
                        </span>
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {(['ru', 'ua', 'en', 'nl'] as const).map((code) => (
                            <button
                              key={code}
                              type="button"
                              onClick={() => setBannerPreviewLocale(code)}
                              className={`rounded-lg px-2 py-1 text-[10px] font-bold uppercase transition-all duration-200 active:scale-95 ${
                                bannerPreviewLocale === code
                                  ? 'bg-[#145142] text-white shadow-md shadow-[#145142]/25 ring-2 ring-[#145142]/30'
                                  : 'bg-white text-[#145142] ring-1 ring-[#145142]/20 hover:bg-[#145142]/10 hover:ring-[#145142]/35'
                              }`}
                            >
                              {code}
                            </button>
                          ))}
                        </div>
                        <p className="mt-2 line-clamp-3 text-sm font-semibold leading-snug text-[#155044]">
                          {(() => {
                            const d = bannerFormData
                            const line =
                              bannerPreviewLocale === 'ru'
                                ? d.title_ru
                                : bannerPreviewLocale === 'ua'
                                  ? d.title_ua || d.title_ru
                                  : bannerPreviewLocale === 'en'
                                    ? d.title_en || d.title_ru
                                    : d.title_nl || d.title_ru
                            const s = (line || '').trim()
                            return s || '—'
                          })()}
                        </p>
                        <p className="mt-1 text-[10px] leading-tight text-gray-500">
                          На главной в карусели сейчас отображается фото; блок текста помогает сверить формулировки при переводе.
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-[11px] font-semibold text-[#145142]/75">
                          Горизонталь · {Math.round(bannerFormData.focalX)}%
                        </label>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={0.5}
                          value={bannerFormData.focalX}
                          onChange={(e) =>
                            setBannerFormData((p) => ({
                              ...p,
                              focalX: Number(e.target.value),
                            }))
                          }
                          className="h-2 w-full cursor-pointer accent-[#145142]"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-semibold text-[#145142]/75">
                          Вертикаль · {Math.round(bannerFormData.focalY)}%
                        </label>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={0.5}
                          value={bannerFormData.focalY}
                          onChange={(e) =>
                            setBannerFormData((p) => ({
                              ...p,
                              focalY: Number(e.target.value),
                            }))
                          }
                          className="h-2 w-full cursor-pointer accent-[#145142]"
                        />
                      </div>
                    </div>
                  </section>
                ) : null}

                <section className="space-y-4 rounded-2xl border border-[#145142]/10 bg-[#145142]/[0.04] p-4 transition-shadow duration-300 hover:shadow-sm hover:shadow-[#145142]/6 sm:p-5">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-[#145142]" strokeWidth={2} aria-hidden />
                    <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#145142]/75">
                      Заголовки
                    </span>
                  </div>
                  <div>
                    <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-[#145142]/85 sm:text-sm">
                      <span className="rounded-md bg-[#145142] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                        RU
                      </span>
                      Основной текст <span className="font-normal text-red-500">*</span>
                    </label>
                    <input
                      name="title_ru"
                      required
                      value={bannerFormData.title_ru}
                      onChange={(e) =>
                        setBannerFormData((prev) => ({ ...prev, title_ru: e.target.value }))
                      }
                      className="w-full rounded-xl border border-[#145142]/20 bg-white p-3 text-sm outline-none ring-[#145142]/20 transition placeholder:text-gray-400 focus:border-[#145142] focus:ring-2 sm:text-base"
                      placeholder="Например: Суші-бургери: ідеальний перекус"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {(
                      [
                        ['title_ua', 'UA', bannerFormData.title_ua, 'title_ua'] as const,
                        ['title_en', 'EN', bannerFormData.title_en, 'title_en'] as const,
                        ['title_nl', 'NL', bannerFormData.title_nl, 'title_nl'] as const,
                      ] as const
                    ).map(([name, code, value, key]) => (
                      <div key={key}>
                        <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-[#145142]/80">
                          <span className="rounded-md bg-white px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#145142] ring-1 ring-[#145142]/20">
                            {code}
                          </span>
                        </label>
                        <input
                          name={name}
                          value={value}
                          onChange={(e) =>
                            setBannerFormData((prev) => ({ ...prev, [key]: e.target.value }))
                          }
                          className="w-full rounded-xl border border-[#145142]/18 bg-white p-2.5 text-xs outline-none transition focus:border-[#145142] focus:ring-2 focus:ring-[#145142]/25 sm:text-sm"
                          placeholder={code}
                        />
                      </div>
                    ))}
                  </div>
                </section>

                <section className="grid grid-cols-1 gap-3 rounded-2xl border border-[#145142]/10 bg-[#f4f9f7] p-4 transition-shadow duration-300 hover:shadow-md hover:shadow-[#145142]/8 sm:grid-cols-2 sm:gap-4 sm:p-5">
                  <div>
                    <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-[#145142]/85 sm:text-sm">
                      <ListOrdered className="h-4 w-4 text-[#145142]" aria-hidden />
                      Порядок в карусели
                    </label>
                    <input
                      name="order"
                      type="number"
                      value={bannerFormData.order}
                      onChange={(e) =>
                        setBannerFormData((prev) => ({
                          ...prev,
                          order: parseInt(e.target.value, 10) || 0,
                        }))
                      }
                      className="w-full rounded-xl border border-[#145142]/20 bg-white p-3 text-sm outline-none transition focus:border-[#145142] focus:ring-2 focus:ring-[#145142]/25"
                      placeholder="0"
                      min={0}
                    />
                    <p className="mt-1.5 text-[11px] text-[#145142]/55">Меньше число — раньше в списке</p>
                  </div>
                  <div>
                    <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-[#145142]/85 sm:text-sm">
                      <Eye className="h-4 w-4 text-[#145142]" aria-hidden />
                      Показ на сайте
                    </label>
                    <div className="relative">
                      <select
                        name="isActive"
                        value={bannerFormData.isActive ? 'true' : 'false'}
                        onChange={(e) =>
                          setBannerFormData((prev) => ({
                            ...prev,
                            isActive: e.target.value === 'true',
                          }))
                        }
                        className="w-full cursor-pointer appearance-none rounded-xl border border-[#145142]/20 bg-white p-3 pr-10 text-sm outline-none transition focus:border-[#145142] focus:ring-2 focus:ring-[#145142]/25"
                      >
                        <option value="true">Виден посетителям</option>
                        <option value="false">Скрыт (черновик)</option>
                      </select>
                      <ChevronDown
                        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#145142]/45"
                        aria-hidden
                      />
                    </div>
                  </div>
                </section>

                <button
                  type="submit"
                  className="admin-banner-submit-btn relative z-20 flex w-full appearance-none items-center justify-center gap-2 rounded-2xl border-0 bg-[#155044] py-3.5 text-sm font-bold text-white hover:bg-[#103d34] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#145142] focus-visible:ring-offset-2 sm:py-4 sm:text-base"
                >
                  <Save className="h-5 w-5 shrink-0 opacity-95" strokeWidth={2} />
                  {editingBannerId ? 'Сохранить изменения' : 'Сохранить баннер'}
                </button>
              </form>

              <div
                className="pointer-events-none sticky bottom-0 left-0 right-0 z-[5] -mb-12 h-12 rounded-b-[22px] bg-gradient-to-b from-transparent via-white/85 to-white sm:rounded-b-[26px]"
                aria-hidden
              />
            </div>
          </div>
        </div>
      )}
      
      {/* МОДАЛЬНОЕ ОКНО ДЛЯ КОМАНДЫ */}
      {isTeamModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <div className="relative bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between gap-2 mb-4 sm:mb-6">
              <div className="h-10 w-10 shrink-0" aria-hidden />
              <h2 className="flex-1 text-center text-xl sm:text-2xl font-bold text-[#155044] px-1">
                {editingTeamId ? 'Редактировать члена команды' : 'Новый член команды'}
              </h2>
              <button
                type="button"
                onClick={() => setIsTeamModalOpen(false)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500 text-white shadow-none hover:bg-red-600 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                aria-label="Закрыть"
              >
                <X size={22} strokeWidth={2.5} />
              </button>
            </div>
            
            <form onSubmit={handleSubmitTeam} className="space-y-3 sm:space-y-4">
              {/* Загрузка фото */}
              <div className="flex justify-center mb-3 sm:mb-4">
                <label className="cursor-pointer w-full h-48 sm:h-56 md:h-64 border-2 border-dashed border-[#145142]/30 rounded-[12px] sm:rounded-[15px] flex flex-col items-center justify-center hover:bg-[#145142]/5 transition relative overflow-hidden group p-2 bg-white/40 backdrop-blur-sm">
                  {teamFormData.imageUrl ? (
                    <img 
                      src={teamFormData.imageUrl} 
                      alt="Preview" 
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <>
                      <Upload size={24} className="sm:w-8 sm:h-8 text-gray-400 mb-1 sm:mb-2" />
                      <span className="text-xs sm:text-sm text-gray-500 text-center px-2">Нажмите, чтобы загрузить фото</span>
                    </>
                  )}
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleTeamImageUpload} 
                  />
                  {teamFormData.imageUrl && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition rounded-lg">
                      <span className="text-white font-medium text-sm sm:text-base">Изменить</span>
                    </div>
                  )}
                </label>
              </div>

              {/* Имена на разных языках */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 bg-[#145142]/5 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-[#145142]/10">
                <div>
                  <label className="text-xs font-bold text-[#145142]/70 mb-1 block">Имя (RU) *</label>
                  <input name="name_ru" value={teamFormData.name_ru} onChange={(e) => setTeamFormData(prev => ({ ...prev, name_ru: e.target.value }))} className="w-full p-2 bg-white/80 backdrop-blur-sm border border-[#145142]/20 rounded-lg outline-none focus:ring-2 focus:ring-[#145142] focus:border-[#145142] text-sm" placeholder="Иван" required />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#145142]/70 mb-1 block">Ім'я (UA)</label>
                  <input name="name_ua" value={teamFormData.name_ua} onChange={(e) => setTeamFormData(prev => ({ ...prev, name_ua: e.target.value }))} className="w-full p-2 bg-white/80 backdrop-blur-sm border border-[#145142]/20 rounded-lg outline-none focus:ring-2 focus:ring-[#145142] focus:border-[#145142] text-sm" placeholder="Іван" />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#145142]/70 mb-1 block">Name (EN)</label>
                  <input name="name_en" value={teamFormData.name_en} onChange={(e) => setTeamFormData(prev => ({ ...prev, name_en: e.target.value }))} className="w-full p-2 bg-white/80 backdrop-blur-sm border border-[#145142]/20 rounded-lg outline-none focus:ring-2 focus:ring-[#145142] focus:border-[#145142] text-sm" placeholder="Ivan" />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#145142]/70 mb-1 block">Naam (NL)</label>
                  <input name="name_nl" value={teamFormData.name_nl} onChange={(e) => setTeamFormData(prev => ({ ...prev, name_nl: e.target.value }))} className="w-full p-2 bg-white/80 backdrop-blur-sm border border-[#145142]/20 rounded-lg outline-none focus:ring-2 focus:ring-[#145142] focus:border-[#145142] text-sm" placeholder="Ivan" />
                </div>
              </div>

              {/* Должности на разных языках */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 bg-[#145142]/5 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-[#145142]/10">
                <div>
                  <label className="text-xs font-bold text-[#145142]/70 mb-1 block">Должность (RU) *</label>
                  <input name="position_ru" value={teamFormData.position_ru} onChange={(e) => setTeamFormData(prev => ({ ...prev, position_ru: e.target.value }))} className="w-full p-2 bg-white/80 backdrop-blur-sm border border-[#145142]/20 rounded-lg outline-none focus:ring-2 focus:ring-[#145142] focus:border-[#145142] text-sm" placeholder="Шеф-повар" required />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#145142]/70 mb-1 block">Посада (UA)</label>
                  <input name="position_ua" value={teamFormData.position_ua} onChange={(e) => setTeamFormData(prev => ({ ...prev, position_ua: e.target.value }))} className="w-full p-2 bg-white/80 backdrop-blur-sm border border-[#145142]/20 rounded-lg outline-none focus:ring-2 focus:ring-[#145142] focus:border-[#145142] text-sm" placeholder="Шеф-кухар" />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#145142]/70 mb-1 block">Position (EN)</label>
                  <input name="position_en" value={teamFormData.position_en} onChange={(e) => setTeamFormData(prev => ({ ...prev, position_en: e.target.value }))} className="w-full p-2 bg-white/80 backdrop-blur-sm border border-[#145142]/20 rounded-lg outline-none focus:ring-2 focus:ring-[#145142] focus:border-[#145142] text-sm" placeholder="Chef" />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#145142]/70 mb-1 block">Positie (NL)</label>
                  <input name="position_nl" value={teamFormData.position_nl} onChange={(e) => setTeamFormData(prev => ({ ...prev, position_nl: e.target.value }))} className="w-full p-2 bg-white/80 backdrop-blur-sm border border-[#145142]/20 rounded-lg outline-none focus:ring-2 focus:ring-[#145142] focus:border-[#145142] text-sm" placeholder="Chef" />
                </div>
              </div>

              {/* Биографии на разных языках */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="text-xs font-bold text-[#145142]/70 mb-1 block">Биография (RU)</label>
                  <textarea name="bio_ru" value={teamFormData.bio_ru} onChange={(e) => setTeamFormData(prev => ({ ...prev, bio_ru: e.target.value }))} className="w-full p-2 bg-white/80 backdrop-blur-sm border border-[#145142]/20 rounded-lg outline-none focus:ring-2 focus:ring-[#145142] focus:border-[#145142] text-sm" rows={3} placeholder="Опытный повар..." />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#145142]/70 mb-1 block">Біографія (UA)</label>
                  <textarea name="bio_ua" value={teamFormData.bio_ua} onChange={(e) => setTeamFormData(prev => ({ ...prev, bio_ua: e.target.value }))} className="w-full p-2 bg-white/80 backdrop-blur-sm border border-[#145142]/20 rounded-lg outline-none focus:ring-2 focus:ring-[#145142] focus:border-[#145142] text-sm" rows={3} placeholder="Досвідчений кухар..." />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#145142]/70 mb-1 block">Bio (EN)</label>
                  <textarea name="bio_en" value={teamFormData.bio_en} onChange={(e) => setTeamFormData(prev => ({ ...prev, bio_en: e.target.value }))} className="w-full p-2 bg-white/80 backdrop-blur-sm border border-[#145142]/20 rounded-lg outline-none focus:ring-2 focus:ring-[#145142] focus:border-[#145142] text-sm" rows={3} placeholder="Experienced chef..." />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#145142]/70 mb-1 block">Bio (NL)</label>
                  <textarea name="bio_nl" value={teamFormData.bio_nl} onChange={(e) => setTeamFormData(prev => ({ ...prev, bio_nl: e.target.value }))} className="w-full p-2 bg-white/80 backdrop-blur-sm border border-[#145142]/20 rounded-lg outline-none focus:ring-2 focus:ring-[#145142] focus:border-[#145142] text-sm" rows={3} placeholder="Ervaren chef..." />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[#145142]/80 mb-1">Порядок отображения</label>
                  <input 
                    name="order" 
                    type="number" 
                    value={teamFormData.order} 
                    onChange={(e) => setTeamFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
                    className="w-full p-2 sm:p-3 bg-white/80 backdrop-blur-sm border border-[#145142]/20 rounded-[8px] sm:rounded-[10px] outline-none focus:ring-2 focus:ring-[#145142] focus:border-[#145142] text-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={teamFormData.isActive}
                    onChange={(e) => setTeamFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="w-4 h-4"
                  />
                  <label className="text-xs sm:text-sm font-medium text-[#145142]/80">Активен</label>
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full py-3 sm:py-4 bg-[#155044] text-white font-bold rounded-[12px] sm:rounded-[15px] hover:bg-[#103d34] transition shadow-none mt-2 text-sm sm:text-base"
              >
                {editingTeamId ? 'Сохранить изменения' : 'Сохранить'}
              </button>
            </form>
            <div className="sticky bottom-0 left-0 right-0 h-12 -mb-12 bg-gradient-to-b from-transparent via-white/80 to-white/80 pointer-events-none z-10 rounded-b-[20px] sm:rounded-b-[25px]"></div>
          </div>
        </div>
      )}
      {/* МОДАЛКА НОВОСТЕЙ */}
      {isNewsModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <div className="relative bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="h-10 w-10 shrink-0" aria-hidden />
              <h2 className="flex-1 text-center text-xl font-bold px-1">{editingNews ? 'Редактировать' : 'Новая новость'}</h2>
              <button
                type="button"
                onClick={() => setIsNewsModalOpen(false)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500 text-white shadow-none hover:bg-red-600 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                aria-label="Закрыть"
              >
                <X size={22} strokeWidth={2.5} />
              </button>
            </div>
            <form onSubmit={handleSaveNews} className="space-y-4">
              <input name="title" defaultValue={editingNews?.title} placeholder="Заголовок" required className="w-full p-3 border rounded-lg"/>
              <textarea name="description" defaultValue={editingNews?.description} placeholder="Краткое описание" required className="w-full p-3 border rounded-lg"/>
              <textarea name="content" defaultValue={editingNews?.content} placeholder="Полный текст" rows={5} className="w-full p-3 border rounded-lg"/>
              <input type="file" name="image" accept="image/*" />
              <label className="flex items-center gap-2"><input type="checkbox" name="isHit" defaultChecked={editingNews?.isHit}/> Хит продаж</label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setIsNewsModalOpen(false)} className="flex-1 py-3 bg-gray-100 rounded-lg">Отмена</button>
                <button type="submit" className="flex-1 py-3 bg-[#155044] text-white rounded-lg shadow-none hover:bg-[#103d34] transition">Сохранить</button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}