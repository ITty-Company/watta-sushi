'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
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
  Mail
} from 'lucide-react'
import LogoBackground from './LogoBackground'
import CityMapPicker from './CityMapPicker'

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

  paymentMethod: 'CASH' | 'CARD' | 'APPLE_PAY' | 'GOOGLE_PAY' | 'IDEAL'
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED'
}

interface PromoCode {
  id: number
  code: string
  discount: number
  isActive: boolean
}

interface AdminViewProps {
  onBack: () => void
}

interface City {
  id: number
  name: string
  name_ua?: string
  name_nl?: string
  name_en?: string
  countryId?: number
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
}

export default function AdminView({ onBack }: AdminViewProps) {
  // Добавили вкладку 'promos', 'cities', 'banners', 'menuCategories' и 'users'
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'products' | 'promos' | 'cities' | 'banners' | 'menuCategories' | 'users' | 'team'| 'settings'| 'newsletter'| 'ingredients'>('dashboard')
  
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [promos, setPromos] = useState<PromoCode[]>([]) // Промокоды
  const [cities, setCities] = useState<City[]>([]) // Города
  const [countries, setCountries] = useState<any[]>([]) // Страны
  const [banners, setBanners] = useState<Banner[]>([]) // Баннеры
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]) // Категории меню
  const [users, setUsers] = useState<User[]>([]) // Пользователи
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]) // Команда
  
  const [isLoading, setIsLoading] = useState(false)

  // Состояния для модального окна ТОВАРОВ
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  
  const [settings, setSettings] = useState<SiteSettings>({ bannerInterval: 5000 })
  const [settingsLoading, setSettingsLoading] = useState(false)

  // Состояния для модального окна БАННЕРОВ
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false)
  const [editingBannerId, setEditingBannerId] = useState<number | null>(null)
  const [bannerFormData, setBannerFormData] = useState({
    title_ru: '', title_ua: '', title_en: '', title_nl: '',
    imageUrl: '',
    order: 0,
    isActive: true
  })
  
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
  const [newCityIsActive, setNewCityIsActive] = useState(true)
  const [editingCityId, setEditingCityId] = useState<number | null>(null)
  const [cityMapSearchQuery, setCityMapSearchQuery] = useState('')
  const cityFormRef = useRef<HTMLDivElement>(null)
  const [cityMapSearchResults, setCityMapSearchResults] = useState<{ lat: string; lon: string; display_name: string; address?: { city?: string; town?: string; village?: string; country?: string; state?: string } }[]>([])
  const [cityMapSearchLoading, setCityMapSearchLoading] = useState(false)
  const [cityMapSearchOpen, setCityMapSearchOpen] = useState(false)
  const cityMapSearchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const skipSearchOnceRef = useRef(false)
  
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

  // --- ЗАГРУЗКА ДАННЫХ ---
  const fetchAll = async () => {
    setIsLoading(true)
    
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        alert('Вы не авторизованы. Пожалуйста, войдите в систему.')
        onBack()
        return

        
      }
      
      const headers = { 'Authorization': `Bearer ${token}` }
      const [ordersRes, prodRes, catRes, citiesRes, countriesRes, promosRes, bannersRes, usersRes, teamRes] = await Promise.all([
        fetch('/api/ingredients', { headers }),
        fetch('/api/orders', { headers }),
        fetch('/api/products', { headers }),
        fetch('/api/products/categories', { headers }),
        fetch('/api/cities/all', { headers }),
        fetch('/api/countries/all', { headers }),
        fetch('/api/promo', { headers }),
        fetch('/api/banners/all', { headers }),
        fetch('/api/auth/users', { headers }),
        fetch('/api/team/all', { headers }),
        fetch('/api/promotions').then(r => r.json()).then(setNewsItems)
      ])
      if (ordersRes.ok) setOrders(await ordersRes.json())
      if (prodRes.ok) setProducts(await prodRes.json())
      if (catRes.ok) { const c = await catRes.json(); setMenuCategories(c); }
      if (citiesRes.ok) setCities(await citiesRes.json())
      if (countriesRes.ok) setCountries(await countriesRes.json())
      if (promosRes.ok) setPromos(await promosRes.json())
      if (bannersRes.ok) setBanners(await bannersRes.json())
      if (usersRes.ok) setUsers(await usersRes.json())
      if (teamRes.ok) setTeamMembers(await teamRes.json())
      if ([ordersRes, prodRes, countriesRes].some(r => r.status === 401 || r.status === 403)) {
        alert('Доступ запрещен. Пожалуйста, войдите как администратор.')
        onBack()
      }
      const settingsRes = await fetch('/api/settings', { headers })
        if (settingsRes.ok) {
            setSettings(await settingsRes.json())
        }
    } catch (e) {
      console.error(e)
      alert('Ошибка при загрузке данных')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchData = fetchAll

  // Проверка роли при монтировании компонента
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('currentUser')
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser)
          if (parsed.role !== 'ADMIN') {
            alert('Доступ запрещен. Только администраторы могут использовать админ панель.')
            onBack()
            return
          }
        } catch (e) {
          alert('Ошибка проверки прав доступа')
          onBack()
          return
        }
      } else {
        alert('Вы не авторизованы. Пожалуйста, войдите в систему.')
        onBack()
        return
      }
    }
  }, [])

  useEffect(() => {
    fetchAll()
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
      alert('Введіть назву міста хоча б в одній мові (RU, UA, EN або NL).')
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
        alert('Сохранено'); setIsNewsModalOpen(false); setEditingNews(null);
        fetch('/api/promotions').then(r => r.json()).then(setNewsItems)
      } else alert('Ошибка')
    } catch (e) { alert('Ошибка сети') }
  }

  const handleDeleteNews = async (id: number) => {
    if (!confirm('Удалить?')) return
    try {
      const token = localStorage.getItem('token')
      await fetch(`/api/promotions/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } })
      setNewsItems(newsItems.filter(p => p.id !== id))
    } catch { alert('Ошибка') }
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
    if (!confirm('Вы уверены, что хотите удалить этот товар?')) return
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        alert('Вы не авторизованы')
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
        alert('Товар успешно удален!')
      } else {
        let errorMessage = 'Ошибка удаления'
        try {
          const error = await res.json()
          errorMessage = error.message || error.error || `Ошибка ${res.status}: ${res.statusText}`
        } catch {
          errorMessage = `Ошибка ${res.status}: ${res.statusText}`
        }
        alert(errorMessage)
      }
    } catch (error: any) { 
      console.error('Ошибка удаления товара:', error)
      const errorMessage = error.message || 'Не удалось подключиться к серверу. Проверьте, запущен ли backend сервер.'
      alert(`Ошибка соединения: ${errorMessage}`)
    }
  }

  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        alert('Вы не авторизованы')
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
        alert('Товар успешно сохранен!')
      } else {
        let errorMessage = 'Ошибка при сохранении'
        try {
          const error = await res.json()
          errorMessage = error.message || error.error || `Ошибка ${res.status}: ${res.statusText}`
        } catch {
          errorMessage = `Ошибка ${res.status}: ${res.statusText}`
        }
        alert(errorMessage)
      }
    } catch (error: any) { 
      console.error('Ошибка сохранения товара:', error)
      const errorMessage = error.message || 'Не удалось подключиться к серверу. Проверьте, запущен ли backend сервер.'
      alert(`Ошибка соединения: ${errorMessage}`)
    }
  }

  // --- ЛОГИКА ЗАКАЗОВ (СТАТУСЫ) ---
  const updateStatus = async (orderId: number, newStatus: string) => {
    if (!confirm(`Сменить статус на "${newStatus}"?`)) return
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        alert('Вы не авторизованы')
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
        alert('Статус успешно обновлен!')
      } else {
        let errorMessage = 'Ошибка обновления'
        try {
          const error = await res.json()
          errorMessage = error.message || error.error || `Ошибка ${res.status}: ${res.statusText}`
        } catch {
          errorMessage = `Ошибка ${res.status}: ${res.statusText}`
        }
        alert(errorMessage)
      }
    } catch (error: any) { 
      console.error('Ошибка обновления статуса:', error)
      const errorMessage = error.message || 'Не удалось подключиться к серверу. Проверьте, запущен ли backend сервер.'
      alert(`Ошибка соединения: ${errorMessage}`)
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
      alert('Название города и страна обязательны')
      return
    }
    if (!newCityLatitude || !newCityLongitude) {
      alert('Спочатку оберіть місто з пошуку на карті (введіть назву й натисніть «Вибрати»)')
      return
    }
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        alert('Вы не авторизованы')
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
          zoom: newCityZoom ? parseInt(newCityZoom) : 12
        })
      })
      if (res.ok) {
        resetCityForm()
        fetchData()
        alert('Город успешно создан!')
      } else {
        let errorMessage = 'Ошибка создания города'
        try {
          const error = await res.json()
          errorMessage = error.message || error.error || `Ошибка ${res.status}: ${res.statusText}`
        } catch {
          errorMessage = `Ошибка ${res.status}: ${res.statusText}`
        }
        alert(errorMessage)
      }
    } catch (error: any) {
      console.error('Ошибка создания города:', error)
      const errorMessage = error.message || 'Не удалось подключиться к серверу. Проверьте, запущен ли backend сервер.'
      alert(`Ошибка соединения: ${errorMessage}`)
    }
  }
  
  const handleCreateCountry = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCountryName) {
      alert('Название страны обязательно')
      return
    }
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        alert('Вы не авторизованы')
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
        alert('Страна успешно создана!')
      } else {
        let errorMessage = 'Ошибка создания страны'
        try {
          const error = await res.json()
          errorMessage = error.message || error.error || `Ошибка ${res.status}: ${res.statusText}`
        } catch {
          errorMessage = `Ошибка ${res.status}: ${res.statusText}`
        }
        alert(errorMessage)
      }
    } catch (error: any) {
      console.error('Ошибка создания страны:', error)
      const errorMessage = error.message || 'Не удалось подключиться к серверу. Проверьте, запущен ли backend сервер.'
      alert(`Ошибка соединения: ${errorMessage}`)
    }
  }

  const handleUpdateCityFromForm = async () => {
    if (!editingCityId) return
    if (!newCityName || !newCityCountryId) {
      alert('Назва міста та країна обовʼязкові')
      return
    }
    if (!newCityLatitude || !newCityLongitude) {
      alert('Спочатку оберіть локацію на карті (пошук → Вибрати або клік по маркеру)')
      return
    }
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        alert('Ви не авторизовані')
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
          isActive: newCityIsActive
        })
      })
      if (res.ok) {
        setEditingCityId(null)
        resetCityForm()
        fetchData()
        alert('Місто успішно оновлено!')
      } else {
        let errorMessage = 'Помилка оновлення міста'
        try {
          const err = await res.json()
          errorMessage = err.message || err.error || `Помилка ${res.status}: ${res.statusText}`
        } catch {
          errorMessage = `Помилка ${res.status}: ${res.statusText}`
        }
        alert(errorMessage)
      }
    } catch (error: any) {
      console.error('Ошибка обновления города:', error)
      alert(error?.message || 'Не вдалося підключитися до сервера. Перевірте, чи запущений backend.')
    }
  }

  const handleDeleteCity = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот город? Это также удалит все связи с товарами.')) return
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        alert('Вы не авторизованы')
        return
      }
      const res = await fetch(`/api/cities/${id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        fetchData()
        alert('Город успешно удален!')
      } else {
        let errorMessage = 'Ошибка удаления'
        try {
          const error = await res.json()
          errorMessage = error.message || error.error || `Ошибка ${res.status}: ${res.statusText}`
        } catch {
          errorMessage = `Ошибка ${res.status}: ${res.statusText}`
        }
        alert(errorMessage)
      }
    } catch (error: any) {
      console.error('Ошибка удаления города:', error)
      const errorMessage = error.message || 'Не удалось подключиться к серверу. Проверьте, запущен ли backend сервер.'
      alert(`Ошибка соединения: ${errorMessage}`)
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
        alert('Вы не авторизованы')
        return
      }
      if (!name.trim()) {
        alert('Название страны обязательно')
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
        alert('Страна успешно обновлена!')
      } else {
        let errorMessage = 'Ошибка обновления страны'
        try {
          const err = await res.json()
          errorMessage = err.message || err.error || `Ошибка ${res.status}: ${res.statusText}`
        } catch {
          errorMessage = `Ошибка ${res.status}: ${res.statusText}`
        }
        alert(errorMessage)
      }
    } catch (error: any) {
      console.error('Ошибка обновления страны:', error)
      alert(`Ошибка соединения: ${error?.message || 'Проверьте, запущен ли backend.'}`)
    }
  }

  const handleDeleteCountry = async (id: number) => {
    if (!confirm('Удалить эту страну? Будут удалены и все её города с зонами доставки.')) return
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        alert('Вы не авторизованы')
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
        alert('Страна успешно удалена!')
      } else {
        let errorMessage = 'Ошибка удаления'
        try {
          const err = await res.json()
          errorMessage = err.message || err.error || `Ошибка ${res.status}: ${res.statusText}`
        } catch {
          errorMessage = `Ошибка ${res.status}: ${res.statusText}`
        }
        alert(errorMessage)
      }
    } catch (error: any) {
      console.error('Ошибка удаления страны:', error)
      alert(`Ошибка соединения: ${error?.message || 'Проверьте, запущен ли backend.'}`)
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
        alert('Вы не авторизованы')
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
        alert('Промокод успешно создан!')
      } else {
        let errorMessage = 'Ошибка создания промокода'
        try {
          const error = await res.json()
          errorMessage = error.message || error.error || 'Возможно код уже существует'
        } catch {
          errorMessage = `Ошибка ${res.status}: ${res.statusText}`
        }
        alert(errorMessage)
      }
    } catch (error: any) { 
      console.error('Ошибка создания промокода:', error)
      const errorMessage = error.message || 'Не удалось подключиться к серверу. Проверьте, запущен ли backend сервер.'
      alert(`Ошибка соединения: ${errorMessage}`)
    }
  }

  const handleDeletePromo = async (id: number) => {
    if (!confirm('Удалить этот код?')) return
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        alert('Вы не авторизованы')
        return
      }
      const res = await fetch(`/api/promo/${id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        fetchData()
        alert('Промокод успешно удален!')
      } else {
        let errorMessage = 'Ошибка удаления'
        try {
          const error = await res.json()
          errorMessage = error.message || error.error || `Ошибка ${res.status}: ${res.statusText}`
        } catch {
          errorMessage = `Ошибка ${res.status}: ${res.statusText}`
        }
        alert(errorMessage)
      }
    } catch (error: any) { 
      console.error('Ошибка удаления промокода:', error)
      const errorMessage = error.message || 'Не удалось подключиться к серверу. Проверьте, запущен ли backend сервер.'
      alert(`Ошибка соединения: ${errorMessage}`)
    }
  }

  // --- ЛОГИКА БАННЕРОВ ---
  const openCreateBannerModal = () => {
    setEditingBannerId(null)
    setBannerFormData({
      title_ru: '', title_ua: '', title_en: '', title_nl: '',
      imageUrl: '',
      order: banners.length,
      isActive: true
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
      isActive: banner.isActive
    })
    setIsBannerModalOpen(true)
  }

  const handleBannerImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setBannerFormData(prev => ({ ...prev, imageUrl: reader.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmitBanner = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        alert('Вы не авторизованы')
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
        alert('Баннер успешно сохранен!')
      } else {
        let errorMessage = 'Ошибка при сохранении'
        try {
          const error = await res.json()
          errorMessage = error.message || error.error || `Ошибка ${res.status}: ${res.statusText}`
        } catch {
          errorMessage = `Ошибка ${res.status}: ${res.statusText}`
        }
        alert(errorMessage)
      }
    } catch (error: any) { 
      console.error('Ошибка сохранения баннера:', error)
      const errorMessage = error.message || 'Не удалось подключиться к серверу. Проверьте, запущен ли backend сервер.'
      alert(`Ошибка соединения: ${errorMessage}`)
    }
  }

  const handleDeleteBanner = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот баннер?')) return
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        alert('Вы не авторизованы')
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
        alert('Баннер успешно удален!')
      } else {
        let errorMessage = 'Ошибка удаления'
        try {
          const error = await res.json()
          errorMessage = error.error || error.message || `Ошибка ${res.status}: ${res.statusText}`
        } catch {
          errorMessage = `Ошибка ${res.status}: ${res.statusText}`
        }
        alert(errorMessage)
      }
    } catch (error: any) { 
      console.error('Ошибка удаления баннера:', error)
      const errorMessage = error.message || 'Не удалось подключиться к серверу. Проверьте, запущен ли backend сервер.'
      alert(`Ошибка соединения: ${errorMessage}`)
    }
  }

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
        alert('Вы не авторизованы')
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
        alert('Член команды успешно сохранен!')
      } else {
        let errorMessage = 'Ошибка при сохранении'
        try {
          const error = await res.json()
          errorMessage = error.message || error.error || `Ошибка ${res.status}: ${res.statusText}`
        } catch {
          errorMessage = `Ошибка ${res.status}: ${res.statusText}`
        }
        alert(errorMessage)
      }
    } catch (error: any) { 
      console.error('Ошибка сохранения члена команды:', error)
      alert('Ошибка соединения')
    }
  }

  const handleDeleteTeam = async (id: number) => {
    if (!confirm('Удалить этого члена команды?')) return
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        alert('Вы не авторизованы')
        return
      }
      const res = await fetch(`/api/team/${id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        fetchData()
        alert('Член команды успешно удален!')
      } else {
        let errorMessage = 'Ошибка удаления'
        try {
          const error = await res.json()
          errorMessage = error.message || error.error || `Ошибка ${res.status}: ${res.statusText}`
        } catch {
          errorMessage = `Ошибка ${res.status}: ${res.statusText}`
        }
        alert(errorMessage)
      }
    } catch (error: any) { 
      console.error('Ошибка удаления члена команды:', error)
      alert('Ошибка соединения')
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
    if (!newIngName || !newIngImage) return alert('Нужно название и фото')
    
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
        alert('Ингредиент добавлен!')
      } else {
        alert('Ошибка создания')
      }
    } catch (e) {
      alert('Ошибка')
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
      } catch (e) { alert('Ошибка') }
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
        alert('Вы не авторизованы')
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
        alert('Категория успешно сохранена!')
      } else {
        let errorMessage = 'Ошибка при сохранении'
        try {
          const error = await res.json()
          errorMessage = error.message || error.error || `Ошибка ${res.status}: ${res.statusText}`
        } catch {
          errorMessage = `Ошибка ${res.status}: ${res.statusText}`
        }
        alert(errorMessage)
      }
    } catch (error: any) { 
      console.error('Ошибка сохранения категории:', error)
      const errorMessage = error.message || 'Не удалось подключиться к серверу. Проверьте, запущен ли backend сервер.'
      alert(`Ошибка соединения: ${errorMessage}`)
    }
  }
  
  const handleDeleteCategory = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить эту категорию? Если в ней есть товары, удаление будет невозможно.')) return
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        alert('Вы не авторизованы')
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
        alert('Категория успешно удалена!')
      } else {
        let errorMessage = 'Ошибка удаления'
        try {
          const error = await res.json()
          errorMessage = error.error || error.message || `Ошибка ${res.status}: ${res.statusText}`
        } catch {
          errorMessage = `Ошибка ${res.status}: ${res.statusText}`
        }
        alert(errorMessage)
      }
    } catch (error: any) { 
      console.error('Ошибка удаления категории:', error)
      const errorMessage = error.message || 'Не удалось подключиться к серверу. Проверьте, запущен ли backend сервер.'
      alert(`Ошибка соединения: ${errorMessage}`)
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
        alert('Настройки сохранены!')
        // Отправляем событие, чтобы MenuView обновился без перезагрузки (если открыт в другой вкладке)
        if (typeof window !== 'undefined') {
             window.localStorage.setItem('bannerInterval', settings.bannerInterval.toString())
        }
      } else {
        alert('Ошибка сохранения настроек')
      }
    } catch (e) {
      console.error(e)
      alert('Ошибка соединения')
    } finally {
      setSettingsLoading(false)
    }
  }
  // --- ХЕДЕР ---
  const Header = () => {
    return (
      <header className="w-full sticky top-0 z-40">
        <div className="w-full relative bg-gradient-to-r from-white/95 via-white/90 to-[#145142]/5 backdrop-blur-2xl border-b border-[#145142]/10 shadow-[0_4px_30px_rgba(20,81,66,0.08)]">
          <div className="absolute inset-0 bg-[linear-gradient(105deg,transparent_0%,rgba(20,81,66,0.03)_50%,transparent_100%)] pointer-events-none" />
          <div className="relative w-full max-w-[1920px] mx-auto px-3 sm:px-5 md:px-6 h-16 sm:h-20 md:h-24 flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-5">
              <button 
                onClick={onBack}
                className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-2xl bg-[#145142]/5 hover:bg-[#145142]/15 text-[#145142] transition-all duration-300 hover:scale-105 active:scale-95"
                aria-label="Назад"
              >
                <ArrowLeft size={22} className="sm:w-6 sm:h-6" strokeWidth={2.5} />
              </button>
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#145142] to-[#1a6b58] flex items-center justify-center shadow-lg shadow-[#145142]/25">
                    <BarChart2 size={18} className="sm:w-5 sm:h-5 text-white" strokeWidth={2.5} />
                  </div>
                  <h1 className="text-lg sm:text-2xl md:text-3xl font-black bg-gradient-to-r from-[#145142] via-[#1a6b58] to-[#0d3d34] bg-clip-text text-transparent tracking-tight">
                    Адмін-панель
                  </h1>
                </div>
                <p className="text-xs sm:text-sm text-[#145142]/60 font-medium pl-11 sm:pl-12">
                  Статистика замовлень, товарів і доставок у одному місці.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <button 
                onClick={fetchAll}
                className="group w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-2xl bg-[#145142]/5 hover:bg-[#145142] text-[#145142] hover:text-white transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-[#145142]/30 active:scale-95"
                title="Оновити дані"
              >
                <RefreshCw size={20} className="sm:w-5 sm:h-5 group-hover:rotate-180 transition-transform duration-500" />
              </button>
              <button 
                onClick={() => setIsRightPanelOpen(true)}
                className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-2xl bg-gradient-to-br from-[#145142] to-[#1a6b58] text-white shadow-lg shadow-[#145142]/25 hover:shadow-xl hover:shadow-[#145142]/35 hover:scale-105 active:scale-95 transition-all duration-300"
                title="Відкрити меню"
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
    <div className="min-h-screen font-sans relative overflow-x-hidden">
      <LogoBackground />
      <div className="relative z-10 min-h-screen">
        <Header />

        {/* ОСНОВНОЙ КОНТЕНТ — дашборд на главній, панель справа з вкладками */}
        <div className="w-full min-h-[calc(100vh-80px)] sm:min-h-[calc(100vh-96px)] md:min-h-[calc(100vh-128px)] pb-8 sm:pb-12 md:pb-20">
          <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 pt-4 sm:pt-6 md:pt-8">

          {/* Головна: преміум-дашборд */}
          {!isRightPanelOpen && activeTab === 'dashboard' && (
            <div className="flex flex-col gap-8 sm:gap-10 md:gap-12">
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="flex flex-col items-center gap-3">
                    <RefreshCw size={32} className="text-[#145142]/50 animate-spin" />
                    <p className="text-[#145142]/60 font-medium">Загрузка...</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className="group relative bg-white/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-white/80 shadow-xl shadow-[#145142]/10 hover:shadow-2xl hover:shadow-[#145142]/20 hover:scale-[1.02] transition-all duration-300 overflow-hidden">
                      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#145142]/20 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
                      <div className="relative flex items-center gap-3">
                        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-[#145142] to-[#1a6b58] flex items-center justify-center shadow-lg shadow-[#145142]/20">
                          <TrendingUp size={20} className="text-white" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-[#145142]/60 uppercase tracking-wide">Виручка (виконані)</p>
                          <p className="text-xl sm:text-2xl font-black text-[#145142]">
                            {orders.filter(o => o.status === 'COMPLETED').reduce((s, o) => s + (o.totalPrice || 0), 0)} ₴
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="group relative bg-white/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-white/80 shadow-xl shadow-[#145142]/10 hover:shadow-2xl hover:shadow-[#145142]/20 hover:scale-[1.02] transition-all duration-300 overflow-hidden">
                      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#145142]/20 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
                      <div className="relative flex items-center gap-3">
                        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#145142]/10 flex items-center justify-center">
                          <Package size={20} className="text-[#145142]" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-[#145142]/60 uppercase tracking-wide">Замовлень</p>
                          <p className="text-xl sm:text-2xl font-black text-[#145142]">{orders.length}</p>
                        </div>
                      </div>
                    </div>
                    <div className="group relative bg-white/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-white/80 shadow-xl shadow-[#145142]/10 hover:shadow-2xl hover:shadow-[#145142]/20 hover:scale-[1.02] transition-all duration-300 overflow-hidden">
                      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#145142]/20 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
                      <div className="relative flex items-center gap-3">
                        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#145142]/10 flex items-center justify-center">
                          <ShoppingBag size={20} className="text-[#145142]" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-[#145142]/60 uppercase tracking-wide">Товарів</p>
                          <p className="text-xl sm:text-2xl font-black text-[#145142]">{products.length}</p>
                        </div>
                      </div>
                    </div>
                    <div className="group relative bg-white/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-white/80 shadow-xl shadow-[#145142]/10 hover:shadow-2xl hover:shadow-[#145142]/20 hover:scale-[1.02] transition-all duration-300 overflow-hidden col-span-2 lg:col-span-1">
                      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#145142]/20 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
                      <div className="relative flex items-center gap-3">
                        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#145142]/10 flex items-center justify-center">
                          <MapPin size={20} className="text-[#145142]" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-[#145142]/60 uppercase tracking-wide">Міст</p>
                          <p className="text-xl sm:text-2xl font-black text-[#145142]">{cities.length}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-[#145142]/70 uppercase tracking-widest mb-3 sm:mb-4">Замовлення по статусах</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                      {[
                        { status: 'PENDING', label: 'Очікують', color: 'yellow', count: orders.filter(o => o.status === 'PENDING').length },
                        { status: 'COOKING', label: 'Готуються', color: 'orange', count: orders.filter(o => o.status === 'COOKING').length },
                        { status: 'DELIVERING', label: 'В доставці', color: 'blue', count: orders.filter(o => o.status === 'DELIVERING').length },
                        { status: 'COMPLETED', label: 'Виконані', color: 'green', count: orders.filter(o => o.status === 'COMPLETED').length },
                      ].map(({ label, color, count }) => (
                        <div
                          key={label}
                          className={`group rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-white/80 backdrop-blur-xl shadow-xl hover:scale-[1.02] transition-all duration-300
                            ${color === 'yellow' ? 'bg-amber-50/90 shadow-amber-200/20 hover:shadow-amber-200/30' : ''}
                            ${color === 'orange' ? 'bg-orange-50/90 shadow-orange-200/20 hover:shadow-orange-200/30' : ''}
                            ${color === 'blue' ? 'bg-blue-50/90 shadow-blue-200/20 hover:shadow-blue-200/30' : ''}
                            ${color === 'green' ? 'bg-emerald-50/90 shadow-emerald-200/20 hover:shadow-emerald-200/30' : ''}
                          `}
                        >
                          <p className={`text-xs font-bold uppercase tracking-wide ${
                            color === 'yellow' ? 'text-amber-700' : color === 'orange' ? 'text-orange-700' : color === 'blue' ? 'text-blue-700' : 'text-emerald-700'
                          }`}>{label}</p>
                          <p className={`text-2xl sm:text-3xl font-black mt-1 ${
                            color === 'yellow' ? 'text-amber-700' : color === 'orange' ? 'text-orange-700' : color === 'blue' ? 'text-blue-700' : 'text-emerald-700'
                          }`}>{count}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    <div className="rounded-2xl sm:rounded-3xl p-4 sm:p-5 bg-white/80 backdrop-blur-xl border border-white/80 shadow-lg shadow-[#145142]/10 hover:shadow-xl transition-all duration-300 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#145142]/10 flex items-center justify-center">
                        <Tag size={18} className="text-[#145142]" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[#145142]/60 uppercase tracking-wide">Промокодів</p>
                        <p className="text-xl font-black text-[#145142]">{promos.length}</p>
                      </div>
                    </div>
                    <div className="rounded-2xl sm:rounded-3xl p-4 sm:p-5 bg-white/80 backdrop-blur-xl border border-white/80 shadow-lg shadow-[#145142]/10 hover:shadow-xl transition-all duration-300 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#145142]/10 flex items-center justify-center">
                        <Layers size={18} className="text-[#145142]" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[#145142]/60 uppercase tracking-wide">Категорій</p>
                        <p className="text-xl font-black text-[#145142]">{menuCategories.length}</p>
                      </div>
                    </div>
                    <div className="rounded-2xl sm:rounded-3xl p-4 sm:p-5 bg-white/80 backdrop-blur-xl border border-white/80 shadow-lg shadow-[#145142]/10 hover:shadow-xl transition-all duration-300 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#145142]/10 flex items-center justify-center">
                        <User size={18} className="text-[#145142]" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[#145142]/60 uppercase tracking-wide">Користувачів</p>
                        <p className="text-xl font-black text-[#145142]">{users.length}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Оверлей + права панель */}
          {isRightPanelOpen && (
            <>
              <div 
                className="fixed inset-0 bg-black/50 backdrop-blur-md z-40 animate-in fade-in duration-200"
                onClick={() => setIsRightPanelOpen(false)}
                aria-hidden="true"
              />
              <div className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-gradient-to-b from-white via-white to-[#f0f9f7] backdrop-blur-2xl shadow-[-8px_0_40px_rgba(20,81,66,0.15)] border-l border-[#145142]/10 z-50 overflow-y-auto flex flex-col animate-in slide-in-from-right duration-300">
                <div className="sticky top-0 z-10 bg-gradient-to-r from-[#145142] to-[#1a6b58] px-4 sm:px-5 py-4 flex items-center justify-between shadow-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                      <Menu size={18} className="text-white" />
                    </div>
                    <span className="text-lg font-bold text-white">Оберіть розділ</span>
                  </div>
                  <button 
                    onClick={() => setIsRightPanelOpen(false)} 
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/20 hover:bg-white/30 text-white transition-all duration-200 hover:scale-105 active:scale-95"
                    aria-label="Закрити"
                  >
                    <X size={20} strokeWidth={2.5} />
                  </button>
                </div>
                <div className="flex-1 p-4 sm:p-5 flex flex-col gap-2">
                  {[
                    { id: 'dashboard' as const, label: '📊 Дашборд', desc: 'Статистика та огляди' },
                    { id: 'orders' as const, label: '📦 Заказы', desc: 'Замовлення' },
                    { id: 'products' as const, label: '🍣 Товары', desc: 'Меню та позиції' },
                    { id: 'promos' as const, label: '🏷️ Промокоды', desc: 'Знижки' },
                    { id: 'cities' as const, label: '🏙️ Города', desc: 'Міста та країни' },
                    { id: 'banners' as const, label: '🎨 Баннеры', desc: 'Баннери' },
                    { id: 'menuCategories' as const, label: '📋 Категории', desc: 'Категорії меню' },
                    { id: 'users' as const, label: '👥 Пользователи', desc: 'Користувачі' },
                    { id: 'team' as const, label: '👨‍👩‍👧‍👦 Команда', desc: 'Команда' },
                    { id: 'settings' as const, label: '⚙️ Настройки', desc: 'Сайт и баннеры' },
                    { id: 'ingredients' as const, label: '🥑 Ингредиенты' },
                  ].map(({ id, label, desc }) => (
                    <button
                      key={id}
                      onClick={() => {
                        setActiveTab(id)
                        setIsRightPanelOpen(false)
                      }}
                      className={`w-full text-left px-4 py-3 sm:py-4 rounded-2xl font-bold transition-all duration-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 ${
                        activeTab === id
                          ? 'bg-gradient-to-r from-[#145142] to-[#1a6b58] text-white shadow-lg shadow-[#145142]/30'
                          : 'bg-white/80 hover:bg-[#145142]/10 text-[#145142] border border-[#145142]/10 hover:border-[#145142]/20'
                      }`}
                    >
                      <span className="text-base sm:text-lg">{label}</span>
                      <span className={`text-xs sm:text-sm ${activeTab === id ? 'text-white/80' : 'text-[#145142]/50'}`}>{desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Контент розділів — на всю ширину, коли обрано не дашборд */}
          {!isRightPanelOpen && activeTab !== 'dashboard' && (
            <div className="w-full">
              <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6">
                <button
                  onClick={() => setIsRightPanelOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#145142]/10 hover:bg-[#145142]/20 text-[#145142] font-semibold transition-all"
                >
                  <Menu size={18} />
                  <span>Меню / змінити розділ</span>
                </button>
              </div>
          {activeTab === 'orders' && (
            <div className="flex flex-col gap-4 sm:gap-6 md:gap-8 items-center">
              {isLoading && orders.length === 0 ? (
                 <div className="text-lg sm:text-xl md:text-2xl text-gray-400 mt-6 sm:mt-8 md:mt-10">Загрузка...</div>
              ) : orders.length === 0 ? (
                 <div className="text-lg sm:text-xl md:text-2xl text-gray-400 mt-6 sm:mt-8 md:mt-10">Нет активных заказов</div>
              ) : (
                orders.map((order) => (
                  <div 
                    key={order.id} 
                    className="w-full bg-white/85 backdrop-blur-xl rounded-[16px] sm:rounded-[20px] md:rounded-[25px] p-4 sm:p-6 md:p-8 shadow-xl shadow-[#145142]/10 border border-white/60 flex flex-col gap-4 sm:gap-5 md:gap-6 relative"
                  >
                    {/* Хедер заказа */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 sm:gap-4">
                      <div className="text-lg sm:text-xl md:text-[24px] font-bold text-black">
                        Заказ №{order.id}
                        <span className="text-gray-400 text-xs sm:text-sm font-normal ml-2 sm:ml-3 block sm:inline">
                          {new Date(order.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <span className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold uppercase ${
                        order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'COOKING' ? 'bg-orange-100 text-orange-800' :
                        order.status === 'DELIVERING' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
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
                            <div className="text-gray-400 text-sm italic">Без комментария</div>
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
                          <span className="text-xs font-bold text-gray-500 uppercase">Оплата</span>
                          <span className="text-xs font-bold text-[#145142]">
                              {order.paymentMethod === 'CASH' ? 'Наличные' : 'Онлайн'}
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
                          {order.paymentStatus === 'PAID' ? 'ОПЛАЧЕНО' : 
                          order.paymentStatus === 'FAILED' ? 'ОШИБКА' : 'ОЖИДАЕТ'}
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
                         <button onClick={() => updateStatus(order.id, 'COOKING')} className="p-2 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100" title="Готовится"><ChefHat/></button>
                         <button onClick={() => updateStatus(order.id, 'DELIVERING')} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100" title="В доставке"><Truck/></button>
                         <button onClick={() => updateStatus(order.id, 'COMPLETED')} className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100" title="Выполнен"><Check/></button>
                         <div className="w-px bg-[#145142]/20 mx-2"></div>
                         <button onClick={() => updateStatus(order.id, 'CANCELLED')} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100" title="Отменить"><XCircle/></button>
                      </div>

                      <div className="text-[#194A38] text-[28px] font-bold">
                        {order.totalPrice} ₴
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
              <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow">
                <h2 className="text-2xl font-bold">Новости</h2>
                <button onClick={() => { setEditingNews(null); setIsNewsModalOpen(true) }} className="bg-[#155044] text-white px-4 py-2 rounded-lg">
                  + Добавить
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {newsItems.map(item => (
                    <div key={item.id} className="bg-white rounded-xl shadow overflow-hidden">
                      <div className="h-40 bg-gray-200 relative">
                        {item.imageUrl && <img src={item.imageUrl} className="w-full h-full object-cover"/>}
                      </div>
                      <div className="p-4">
                          <h3 className="font-bold">{item.title}</h3>
                          <div className="flex gap-2 mt-4">
                            <button onClick={() => { setEditingNews(item); setIsNewsModalOpen(true) }} className="flex-1 bg-blue-50 text-blue-600 py-2 rounded">Ред.</button>
                            <button onClick={() => handleDeleteNews(item.id)} className="px-4 bg-red-50 text-red-600 rounded">Уд.</button>
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
                  + Добавить товар
                </button>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {products.map(product => (
                    <div key={product.id} className="bg-white/85 backdrop-blur-xl rounded-[16px] sm:rounded-[20px] md:rounded-[25px] p-4 sm:p-5 shadow-xl shadow-[#145142]/10 border border-white/60 flex flex-col gap-3 sm:gap-4 hover:shadow-2xl hover:border-[#145142]/20 transition">
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
                           <span className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full">ХИТ</span>
                         )}
                       </div>
                       
                       {/* Инфо */}
                       <div className="flex flex-col flex-1">
                         <div className="flex justify-between items-start mb-2 gap-2">
                           <h3 className="text-base sm:text-lg md:text-[20px] font-bold text-black leading-tight flex-1">{product.name_ru}</h3>
                           <span className="text-base sm:text-lg md:text-[20px] font-bold text-[#194A38] whitespace-nowrap">{product.price} ₴</span>
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
                                title="Редактировать"
                              >
                                <Pencil size={18} />
                              </button>
                              <button 
                                onClick={() => handleDeleteProduct(product.id)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                title="Удалить"
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
          )}
          {/* === Вкладка: ИНГРЕДИЕНТЫ === */}
            {activeTab === 'ingredients' && (
              <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl font-bold text-[#145142] mb-6">Библиотека ингредиентов</h2>
                
                {/* Форма добавления */}
                <div className="bg-white p-6 rounded-2xl shadow-lg mb-8 border border-gray-100">
                  <h3 className="font-bold mb-4">Добавить новый</h3>
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
                        <label className="block text-xs font-bold text-gray-500 mb-1">Название (RU)</label>
                        <input 
                          type="text" 
                          value={newIngName}
                          onChange={e => setNewIngName(e.target.value)}
                          className="w-full p-3 border rounded-xl outline-none focus:border-[#145142]"
                          placeholder="Например: Лосось"
                        />
                    </div>

                    <button 
                      type="submit" 
                      disabled={ingLoading}
                      className="h-[50px] px-6 bg-[#145142] text-white rounded-xl font-bold hover:bg-[#103d34] transition"
                    >
                      {ingLoading ? '...' : 'Добавить'}
                    </button>
                  </form>
                </div>

                {/* Список существующих */}
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                  {ingredients.map(ing => (
                    <div key={ing.id} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center relative group">
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
                    <span>Додати нову країну</span>
                  </h2>
                  <form onSubmit={handleCreateCountry} className="space-y-4 sm:space-y-6">
                    {/* Названия на разных языках */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                      <div className="relative">
                        <label className="block text-xs font-semibold text-[#145142] mb-2 uppercase tracking-wide">
                          Назва (RU) *
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
                          Стикер країни (прапор)
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
                      ✨ Додати країну
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
                        📍 Пошук міста на карті
                      </label>
                      <p className="text-xs text-gray-500 mb-2">
                        Шукайте будь-якою мовою (RU/UA/EN/NL), за адресою, індексом або кодом. Нижче — карта: введіть пошук, зʼявляться маркери. Оберіть у списку (Вибрати) або клікніть по маркеру на карті — координати підставляться. {editingCityId ? 'При редагуванні: можна залишити поточну локацію або обрати нову через пошук.' : 'Обовʼязково для додавання міста.'}
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-2">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            placeholder="Назва RU/UA/EN/NL, адреса, індекс, поштовий код… Напр.: Київ, 02000, вул. Хрещатик 1..."
                            value={cityMapSearchQuery}
                            onChange={e => setCityMapSearchQuery(e.target.value)}
                            onFocus={() => cityMapSearchResults.length > 0 && setCityMapSearchOpen(true)}
                            className="w-full p-4 bg-white/80 backdrop-blur-sm rounded-[16px] outline-none border-2 border-[#145142]/20 font-semibold text-sm sm:text-base transition-all focus:border-[#145142] focus:bg-white/90 focus:shadow-lg focus:shadow-[#145142]/10"
                          />
                          {cityMapSearchLoading && (
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400">пошук…</span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={handleSearchCityByNames}
                          className="shrink-0 px-4 py-3 bg-[#145142]/15 text-[#145142] font-semibold rounded-[16px] border-2 border-[#145142]/30 hover:bg-[#145142]/25 transition"
                        >
                          Шукати за назвами (RU/UA/EN/NL)
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
                              <span className="text-xs text-[#145142] font-semibold shrink-0">Вибрати</span>
                            </button>
                          ))}
                        </div>
                      )}
                      {cityMapSearchOpen && !cityMapSearchLoading && cityMapSearchResults.length === 0 && (
                        <div className="mt-2 bg-white/90 backdrop-blur-xl rounded-[14px] border-2 border-[#145142]/20 shadow-xl px-4 py-3 z-[200] text-sm text-[#145142]/60">
                          Нічого не знайдено. Спробуйте інший запит, кнопку «Шукати за назвами» або іншу мову (RU/UA/EN/NL).
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
                          Країна *
                        </label>
                        <select
                          value={newCityCountryId || ''}
                          onChange={e => setNewCityCountryId(e.target.value ? parseInt(e.target.value) : null)}
                          className="w-full p-4 bg-white/80 backdrop-blur-sm rounded-[16px] outline-none border-2 border-[#145142]/20 font-semibold text-sm sm:text-base transition-all focus:border-[#145142] focus:bg-white/90 focus:shadow-lg focus:shadow-[#145142]/10"
                          required
                        >
                          <option value="">Оберіть країну</option>
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
                            <span className="text-sm font-semibold text-[#145142]">Активне місто</span>
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
                          Скасувати редагування
                        </button>
                      )}
                    </div>
                  </form>
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
                      <span>Країни</span>
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      {countries.map(country => (
                        <div key={country.id} className="bg-white/80 backdrop-blur-sm rounded-[14px] sm:rounded-[16px] p-3 sm:p-4 border-2 border-[#145142]/10 hover:border-[#145142]/30 transition-all hover:shadow-lg hover:shadow-[#145142]/10">
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
                                <label className="block text-xs font-semibold text-[#145142] mb-1 uppercase">Стикер</label>
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
                                <span>Активна</span>
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
                                      alert('Название страны обязательно')
                                      return
                                    }
                                    handleUpdateCountry(country.id, name, name_ua, name_en, name_nl, editCountryFlag, code, isActive)
                                  }}
                                  className="flex-1 px-3 py-2 bg-[#155044] text-white rounded-[10px] hover:bg-[#103d34] transition text-sm font-medium"
                                >
                                  Зберегти
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingCountryId(null)
                                    setIsEditFlagPickerOpen(false)
                                  }}
                                  className="px-3 py-2 bg-white/80 backdrop-blur-sm rounded-[10px] border border-[#145142]/20 hover:bg-[#145142]/10 transition text-sm text-[#145142] font-medium"
                                >
                                  Скасувати
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
                                <p className="text-xs text-gray-500 mt-2">Міст: {country.cities.length}</p>
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
                                  <span className="hidden sm:inline">Редактировать</span>
                                  <span className="sm:hidden">Изменить</span>
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
                    <span>Міста</span>
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                  {cities.map(city => (
                    <div key={city.id} className={`bg-white/80 backdrop-blur-sm rounded-[14px] sm:rounded-[16px] md:rounded-[20px] p-3 sm:p-4 md:p-6 shadow-sm flex flex-col gap-3 sm:gap-4 border-2 transition-all hover:shadow-lg hover:shadow-[#145142]/10 ${editingCityId === city.id ? 'border-[#145142] ring-2 ring-[#145142]/30' : 'border-[#145142]/10 hover:border-[#145142]/30'}`}>
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
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-bold flex-shrink-0 ${
                              city.isActive ? 'bg-green-100 text-green-700' : 'bg-[#145142]/10 text-[#145142]/70'
                            }`}>
                              {city.isActive ? 'Активен' : 'Неактивен'}
                            </span>
                          </div>
                          {city.deliveryZones && city.deliveryZones.length > 0 && (
                            <div className="text-xs text-gray-500">
                              Зон доставки: {city.deliveryZones.length}
                            </div>
                          )}
                          <div className="flex gap-2 pt-2 border-t border-[#145142]/10">
                            <button
                              type="button"
                              onClick={() => handleStartEditCity(city)}
                              className="flex-1 px-3 sm:px-4 py-2 bg-blue-50 text-blue-600 rounded-[8px] sm:rounded-[10px] hover:bg-blue-100 transition flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm"
                            >
                              <Pencil size={14} className="sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Редагувати</span><span className="sm:hidden">Змінити</span>
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
                  {cities.length === 0 && <div className="text-gray-400 col-span-full text-center py-8">Городов пока нет</div>}
                </div>
              </div>
            </div>
            </div>
          )}

          {/* === Вкладка: БАННЕРЫ === */}
          {activeTab === 'banners' && (
            <div className="flex flex-col gap-8">
              <button 
                onClick={openCreateBannerModal}
                className="w-full h-[77px] bg-[#155044] rounded-[15px] flex items-center justify-center text-white text-[24px] font-bold hover:bg-[#103d34] transition shadow-md"
              >
                + Добавить баннер
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {banners.map(banner => (
                  <div key={banner.id} className="bg-white/85 backdrop-blur-xl rounded-[20px] p-6 shadow-xl shadow-[#145142]/10 flex flex-col gap-4 border border-white/60">
                    <div className="w-full h-48 bg-[#145142]/5 rounded-[15px] overflow-hidden relative border border-[#145142]/10">
                      {banner.imageUrl ? (
                        <img 
                          src={banner.imageUrl} 
                          alt={banner.title_ru} 
                          className="w-full h-full object-contain"
                          style={{ objectFit: 'contain' }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <ImageIcon size={48} />
                        </div>
                      )}
                      {!banner.isActive && (
                        <div className="absolute top-2 right-2 bg-[#145142]/80 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                          Неактивен
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <h3 className="font-bold text-lg">{banner.title_ru}</h3>
                      <p className="text-sm text-gray-500">Порядок: {banner.order}</p>
                    </div>
                    <div className="flex gap-2 pt-2 border-t border-[#145142]/10">
                      <button
                        onClick={() => openEditBannerModal(banner)}
                        className="flex-1 px-4 py-2 bg-blue-50 text-blue-600 rounded-[10px] hover:bg-blue-100 transition flex items-center justify-center gap-2"
                      >
                        <Pencil size={16} /> Редактировать
                      </button>
                      <button
                        onClick={() => handleDeleteBanner(banner.id)}
                        className="px-4 py-2 bg-red-50 text-red-600 rounded-[10px] hover:bg-red-100 transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
                {banners.length === 0 && <div className="text-gray-400 col-span-3 text-center">Баннеров пока нет</div>}
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
                + Добавить категорию
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {menuCategories.map(category => (
                  <div key={category.id} className="bg-white/85 backdrop-blur-xl rounded-[16px] sm:rounded-[20px] p-4 sm:p-6 shadow-xl shadow-[#145142]/10 flex flex-col gap-3 sm:gap-4 border border-white/60">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#145142]/10 rounded-[10px] sm:rounded-[12px] flex items-center justify-center text-2xl sm:text-3xl flex-shrink-0">
                        {category.emoji || '🍣'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-base sm:text-lg truncate">{category.name_ru}</h3>
                        <p className="text-xs sm:text-sm text-gray-500 truncate">Slug: {category.slug}</p>
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
                {menuCategories.length === 0 && <div className="text-gray-400 col-span-full text-center py-8">Категорий пока нет</div>}
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
                    <div key={user.id} className="bg-gradient-to-br from-white via-white to-[#f8faf9] rounded-[16px] sm:rounded-[20px] p-4 sm:p-6 shadow-lg shadow-[#145142]/10 flex flex-col gap-3 sm:gap-4 border border-[#145142]/10 hover:border-[#145142]/30 transition-all hover:shadow-xl hover:shadow-[#145142]/20">
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
              <div className="bg-white p-8 rounded-[24px] shadow-lg">
                <h2 className="text-3xl font-bold text-[#145142] mb-2">Email Рассылка</h2>
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
                      alert(`Успешно отправлено ${json.count} пользователям!`);
                      form.reset();
                    } else {
                      alert('Ошибка: ' + json.message);
                    }
                  } catch(err) {
                    alert('Ошибка сети');
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
                  <div key={member.id} className="bg-white/80 backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-lg shadow-[#145142]/10 border-2 border-white/70 hover:shadow-xl hover:shadow-[#145142]/20 transition-all duration-300 relative overflow-hidden">
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
                   <div key={promo.id} className="bg-white/80 backdrop-blur-sm rounded-[16px] sm:rounded-[20px] p-4 sm:p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 border-2 border-[#145142]/10 hover:border-[#145142]/30 transition-all hover:shadow-lg hover:shadow-[#145142]/10">
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

                     <button 
                       type="submit" 
                       disabled={settingsLoading}
                       className="w-full py-4 bg-[#155044] text-white font-bold rounded-[16px] hover:bg-[#103d34] transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-2 sm:p-4">
          <div className="bg-white/80 backdrop-blur-2xl rounded-[20px] sm:rounded-[25px] w-full max-w-2xl p-4 sm:p-6 md:p-8 shadow-2xl shadow-[#145142]/20 border-2 border-white/70 relative animate-in fade-in zoom-in duration-200 h-auto max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-2 right-2 sm:top-4 sm:right-4 p-2 text-[#145142]/60 hover:text-red-500 transition"
            >
              <X size={20} className="sm:w-6 sm:h-6" />
            </button>
            
            <h2 className="text-xl sm:text-2xl font-bold text-[#155044] mb-4 sm:mb-6 text-center">
              {editingId ? 'Редактировать блюдо' : 'Новое блюдо'}
            </h2>
            
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
                  <label className="block text-xs sm:text-sm font-medium text-[#145142]/80 mb-1">Цена (₴)</label>
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
                className="w-full py-3 sm:py-4 bg-[#155044] text-white font-bold rounded-[12px] sm:rounded-[15px] hover:bg-[#103d34] transition shadow-lg mt-2 text-sm sm:text-base"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-2 sm:p-4">
          <div className="bg-white/80 backdrop-blur-2xl rounded-[20px] sm:rounded-[25px] w-full max-w-2xl p-4 sm:p-8 shadow-2xl shadow-[#145142]/20 border-2 border-white/70 relative animate-in fade-in zoom-in duration-200 h-auto max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            {/* Продолжение тени и фона при прокрутке */}
            <div className="sticky bottom-0 left-0 right-0 h-8 -mb-8 bg-gradient-to-b from-white/80 via-white/80 to-transparent pointer-events-none z-10"></div>
            <button 
              onClick={() => setIsCategoryModalOpen(false)}
              className="absolute top-2 right-2 sm:top-4 sm:right-4 p-2 text-[#145142]/60 hover:text-red-500 transition"
            >
              <X size={20} className="sm:w-6 sm:h-6" />
            </button>
            
            <h2 className="text-xl sm:text-2xl font-bold text-[#155044] mb-4 sm:mb-6 text-center">
              {editingCategoryId ? 'Редактировать категорию' : 'Новая категория'}
            </h2>
            
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
                className="w-full py-3 sm:py-4 bg-[#155044] text-white font-bold rounded-[12px] sm:rounded-[15px] hover:bg-[#103d34] transition shadow-lg mt-2 text-sm sm:text-base"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-2 sm:p-4">
          <div className="bg-white/80 backdrop-blur-2xl rounded-[20px] sm:rounded-[25px] w-full max-w-2xl p-4 sm:p-6 md:p-8 shadow-2xl shadow-[#145142]/20 border-2 border-white/70 relative animate-in fade-in zoom-in duration-200 h-auto max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setIsBannerModalOpen(false)}
              className="absolute top-2 right-2 sm:top-4 sm:right-4 p-2 text-[#145142]/60 hover:text-red-500 transition"
            >
              <X size={20} className="sm:w-6 sm:h-6" />
            </button>
            
            <h2 className="text-xl sm:text-2xl font-bold text-[#155044] mb-4 sm:mb-6 text-center">
              {editingBannerId ? 'Редактировать баннер' : 'Новый баннер'}
            </h2>
            
            <form onSubmit={handleSubmitBanner} className="space-y-3 sm:space-y-4">
              {/* Загрузка изображения */}
              <div className="flex justify-center mb-3 sm:mb-4">
                <label className="cursor-pointer w-full h-48 sm:h-56 md:h-64 border-2 border-dashed border-[#145142]/30 rounded-[12px] sm:rounded-[15px] flex flex-col items-center justify-center hover:bg-[#145142]/5 transition relative overflow-hidden group p-2 bg-white/40 backdrop-blur-sm">
                  {bannerFormData.imageUrl ? (
                    <img 
                      src={bannerFormData.imageUrl} 
                      alt="Preview" 
                      className="w-full h-full object-contain rounded-lg"
                      style={{ objectFit: 'contain' }}
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
                    onChange={handleBannerImageUpload} 
                  />
                  {bannerFormData.imageUrl && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition rounded-lg">
                      <span className="text-white font-medium text-sm sm:text-base">Изменить</span>
                    </div>
                  )}
                </label>
              </div>

              {/* Заголовки на разных языках */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-[#145142]/80 mb-1">Заголовок (RU) *</label>
                <input 
                  name="title_ru" 
                  required 
                  value={bannerFormData.title_ru} 
                  onChange={(e) => setBannerFormData(prev => ({ ...prev, title_ru: e.target.value }))}
                  className="w-full p-2 sm:p-3 bg-white/80 backdrop-blur-sm border border-[#145142]/20 rounded-[8px] sm:rounded-[10px] outline-none focus:ring-2 focus:ring-[#145142] focus:border-[#145142] text-sm sm:text-base"
                  placeholder="Например: Суші-бургери: ідеальний перекус" 
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[#145142]/80 mb-1">Заголовок (UA)</label>
                  <input 
                    name="title_ua" 
                    value={bannerFormData.title_ua} 
                    onChange={(e) => setBannerFormData(prev => ({ ...prev, title_ua: e.target.value }))}
                    className="w-full p-2 bg-white/80 backdrop-blur-sm border border-[#145142]/20 rounded-[8px] sm:rounded-[10px] outline-none focus:ring-2 focus:ring-[#145142] focus:border-[#145142] text-xs sm:text-sm"
                    placeholder="UA" 
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[#145142]/80 mb-1">Заголовок (EN)</label>
                  <input 
                    name="title_en" 
                    value={bannerFormData.title_en} 
                    onChange={(e) => setBannerFormData(prev => ({ ...prev, title_en: e.target.value }))}
                    className="w-full p-2 bg-white/80 backdrop-blur-sm border border-[#145142]/20 rounded-[8px] sm:rounded-[10px] outline-none focus:ring-2 focus:ring-[#145142] focus:border-[#145142] text-xs sm:text-sm"
                    placeholder="EN" 
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[#145142]/80 mb-1">Заголовок (NL)</label>
                  <input 
                    name="title_nl" 
                    value={bannerFormData.title_nl} 
                    onChange={(e) => setBannerFormData(prev => ({ ...prev, title_nl: e.target.value }))}
                    className="w-full p-2 bg-white/80 backdrop-blur-sm border border-[#145142]/20 rounded-[8px] sm:rounded-[10px] outline-none focus:ring-2 focus:ring-[#145142] focus:border-[#145142] text-xs sm:text-sm"
                    placeholder="NL" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[#145142]/80 mb-1">Порядок отображения</label>
                  <input 
                    name="order" 
                    type="number" 
                    value={bannerFormData.order} 
                    onChange={(e) => setBannerFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
                    className="w-full p-2 sm:p-3 bg-white/80 backdrop-blur-sm border border-[#145142]/20 rounded-[8px] sm:rounded-[10px] outline-none focus:ring-2 focus:ring-[#145142] focus:border-[#145142] text-sm"
                    placeholder="0" 
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[#145142]/80 mb-1">Активен</label>
                  <select 
                    name="isActive" 
                    value={bannerFormData.isActive ? 'true' : 'false'} 
                    onChange={(e) => setBannerFormData(prev => ({ ...prev, isActive: e.target.value === 'true' }))}
                    className="w-full p-2 sm:p-3 bg-white/80 backdrop-blur-sm border border-[#145142]/20 rounded-[8px] sm:rounded-[10px] outline-none focus:ring-2 focus:ring-[#145142] focus:border-[#145142] text-sm"
                  >
                    <option value="true">Да</option>
                    <option value="false">Нет</option>
                  </select>
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full py-3 sm:py-4 bg-[#155044] text-white font-bold rounded-[12px] sm:rounded-[15px] hover:bg-[#103d34] transition shadow-lg mt-2 text-sm sm:text-base"
              >
                {editingBannerId ? 'Сохранить изменения' : 'Сохранить'}
              </button>
            </form>
            {/* Продолжение тени и фона при прокрутке вниз */}
            <div className="sticky bottom-0 left-0 right-0 h-12 -mb-12 bg-gradient-to-b from-transparent via-white/80 to-white/80 pointer-events-none z-10 rounded-b-[20px] sm:rounded-b-[25px]"></div>
          </div>
        </div>
        )}
      
      {/* МОДАЛЬНОЕ ОКНО ДЛЯ КОМАНДЫ */}
      {isTeamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-2 sm:p-4">
          <div className="bg-white/80 backdrop-blur-2xl rounded-[20px] sm:rounded-[25px] w-full max-w-2xl p-4 sm:p-6 md:p-8 shadow-2xl shadow-[#145142]/20 border-2 border-white/70 relative animate-in fade-in zoom-in duration-200 h-auto max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setIsTeamModalOpen(false)}
              className="absolute top-2 right-2 sm:top-4 sm:right-4 p-2 text-[#145142]/60 hover:text-red-500 transition"
            >
              <X size={20} className="sm:w-6 sm:h-6" />
            </button>
            
            <h2 className="text-xl sm:text-2xl font-bold text-[#155044] mb-4 sm:mb-6 text-center">
              {editingTeamId ? 'Редактировать члена команды' : 'Новый член команды'}
            </h2>
            
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
                className="w-full py-3 sm:py-4 bg-[#155044] text-white font-bold rounded-[12px] sm:rounded-[15px] hover:bg-[#103d34] transition shadow-lg mt-2 text-sm sm:text-base"
              >
                {editingTeamId ? 'Сохранить изменения' : 'Сохранить'}
              </button>
            </form>
            <div className="sticky bottom-0 left-0 right-0 h-12 -mb-12 bg-gradient-to-b from-transparent via-white/80 to-white/80 pointer-events-none z-10 rounded-b-[20px] sm:rounded-b-[25px]"></div>
          </div>
        </div>
      )}
      {/* Модальное окно КОМАНДЫ */}
      {isTeamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-2 sm:p-4">
          <div className="bg-white/80 backdrop-blur-2xl rounded-[20px] sm:rounded-[25px] w-full max-w-2xl p-4 sm:p-6 md:p-8 shadow-2xl shadow-[#145142]/20 border-2 border-white/70 relative animate-in fade-in zoom-in duration-200 h-auto max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setIsTeamModalOpen(false)}
              className="absolute top-2 right-2 sm:top-4 sm:right-4 p-2 text-[#145142]/60 hover:text-red-500 transition"
            >
              <X size={20} className="sm:w-6 sm:h-6" />
            </button>
            
            <h2 className="text-xl sm:text-2xl font-bold text-[#155044] mb-4 sm:mb-6 text-center">
              {editingTeamId ? 'Редактировать члена команды' : 'Новый член команды'}
            </h2>
            
            <form onSubmit={handleSubmitTeam} className="space-y-3 sm:space-y-4">
               {/* ... (Ваши поля формы команды) ... */}
               {/* Для краткости, если поля уже есть, оставьте их, главное - закрывающие теги ниже */}
               
               {/* Пример кнопки сохранения для формы команды */}
               <button 
                type="submit" 
                className="w-full py-3 sm:py-4 bg-[#155044] text-white font-bold rounded-[12px] sm:rounded-[15px] hover:bg-[#103d34] transition shadow-lg mt-2 text-sm sm:text-base"
              >
                {editingTeamId ? 'Сохранить изменения' : 'Сохранить'}
              </button>
            </form>
          </div>
        </div>
      )}
      {/* МОДАЛКА НОВОСТЕЙ */}
      {isNewsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{editingNews ? 'Редактировать' : 'Новая новость'}</h2>
            <form onSubmit={handleSaveNews} className="space-y-4">
              <input name="title" defaultValue={editingNews?.title} placeholder="Заголовок" required className="w-full p-3 border rounded-lg"/>
              <textarea name="description" defaultValue={editingNews?.description} placeholder="Краткое описание" required className="w-full p-3 border rounded-lg"/>
              <textarea name="content" defaultValue={editingNews?.content} placeholder="Полный текст" rows={5} className="w-full p-3 border rounded-lg"/>
              <input type="file" name="image" accept="image/*" />
              <label className="flex items-center gap-2"><input type="checkbox" name="isHit" defaultChecked={editingNews?.isHit}/> Хит продаж</label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setIsNewsModalOpen(false)} className="flex-1 py-3 bg-gray-100 rounded-lg">Отмена</button>
                <button type="submit" className="flex-1 py-3 bg-[#155044] text-white rounded-lg">Сохранить</button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}