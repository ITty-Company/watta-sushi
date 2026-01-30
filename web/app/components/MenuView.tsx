'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import { useLanguage } from '../context/LanguageContext'
import { LanguageSelector } from './LanguageSelector'
import { CountryCitySelector } from './CountryCitySelector'
import LogoBackground from './LogoBackground'
import PhoneView from './PhoneView'
import { NotificationsView } from './NotificationsView';
import FavoritesView from './FavoritesView'
import ProfileView from './ProfileView'
import DeliveryView from './DeliveryView'
import AdminView from './AdminView'
// --- ВАЖНО: Импорты новых страниц ---
import PromotionsView from './PromotionsView'
import AboutView from './AboutView'
import AuthView from './AuthView'
import CartView from './CartView'
import PromotionsDetailView from './PromotionsDetailView'
import { 
  Menu,       
  Phone,      
  Bell,       
  Heart,      
  User,       
  ShoppingBag,
  ArrowLeft,
  Home,
  Tag,
  Truck,
  Info,
  X,
  Sparkles,
  ChevronLeft, 
  ChevronRight
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
    id: 'kyiv',
    name: 'Киев',
    coordinates: { lat: 50.4501, lng: 30.5234 },
    zoom: 11,
    deliveryZones: []
  }
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
  imageUrl?: string;
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

export default function MenuView() {
  // ИСПОЛЬЗУЕМ getLocalized из контекста
  const { t, language, getLocalized } = useLanguage()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(typeof window !== 'undefined' && window.innerWidth <= 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])
  const [selectedPromoId, setSelectedPromoId] = useState<number | null>(null)
  // --- ГОРОДА ДОСТАВКИ ---
  const [deliveryCities, setDeliveryCities] = useState<{id: number, name: string, name_nl?: string}[]>([])
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null)

  const [bannerInterval, setBannerInterval] = useState(5000)

  useEffect(() => {
    // Проверяем сохранённый город из localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedCityId = localStorage.getItem('selectedCityId')
      if (savedCityId) {
        const cityId = parseInt(savedCityId)
        setSelectedCityId(cityId)
      }
    }
    


    // Проверяем кэш для городов
    const cacheKey = 'cities_cache'
    const cached = sessionStorage.getItem(cacheKey)
    const cacheTime = sessionStorage.getItem(`${cacheKey}_time`)
    const now = Date.now()
    
    if (cached && cacheTime && (now - parseInt(cacheTime)) < 10 * 60 * 1000) {
      // Используем кэш если он свежий (менее 10 минут)
      try {
        const data = JSON.parse(cached)
        setDeliveryCities(data || [])
        if ((data || []).length > 0 && !selectedCityId) {
          const firstCityId = data[0].id
          setSelectedCityId(firstCityId)
          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem('selectedCityId', firstCityId.toString())
          }
        }
        return
      } catch (e) {
        // Если кэш поврежден, загружаем заново
      }
    }
    
    fetch('/api/cities', {
      headers: {
        'Cache-Control': 'max-age=600' // 10 минут кэша
      }
    })
      .then(res => {
        if (!res.ok) {
          console.error('Ошибка загрузки городов:', res.status, res.statusText)
          return []
        }
        return res.json()
      })
      .then(data => {
        // Сохраняем в кэш
        sessionStorage.setItem(cacheKey, JSON.stringify(data))
        sessionStorage.setItem(`${cacheKey}_time`, now.toString())
        
        setDeliveryCities(data || [])
        // Если город не выбран и есть города, выбираем первый
        if ((data || []).length > 0 && !selectedCityId) {
          const firstCityId = data[0].id
          setSelectedCityId(firstCityId)
          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem('selectedCityId', firstCityId.toString())
          }
        }
      })
      .catch(err => {
        console.error('Ошибка загрузки городов:', err)
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
  }
  
  const [banners, setBanners] = useState<Banner[]>([])
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0)
  
  // Функции переключения (НОВОЕ)
  const nextBanner = useCallback(() => {
    setBanners(currentBanners => {
      if (currentBanners.length === 0) return currentBanners
      setCurrentBannerIndex(prev => (prev + 1) % currentBanners.length)
      return currentBanners
    })
  }, [])

  const prevBanner = useCallback(() => {
    setBanners(currentBanners => {
      if (currentBanners.length === 0) return currentBanners
      setCurrentBannerIndex(prev => (prev - 1 + currentBanners.length) % currentBanners.length)
      return currentBanners
    })
  }, [])

  // Функция загрузки данных
  const loadBanners = useCallback(() => {
    const cacheKey = 'banners'
    const CACHE_TTL = 5 * 60 * 1000
    
    // Проверка кэша
    if (typeof sessionStorage !== 'undefined') {
      const cached = sessionStorage.getItem(cacheKey)
      const cacheTime = sessionStorage.getItem(`${cacheKey}_time`)
      const now = Date.now()
      if (cached && cacheTime && (now - parseInt(cacheTime, 10)) < CACHE_TTL) {
        try {
          const data = JSON.parse(cached) as Banner[]
          if (Array.isArray(data)) {
            setBanners(data)
            return
          }
        } catch (_) { }
      }
    }

    // Запрос к API
    fetch('/api/banners')
      .then(res => res.json())
      .then(data => {
        setBanners(data)
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem(cacheKey, JSON.stringify(data))
          sessionStorage.setItem(`${cacheKey}_time`, Date.now().toString())
        }
      })
      .catch(err => console.error('Ошибка загрузки баннеров:', err))
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
  }, [])

  // Таймер авто-переключения (С УЧЕТОМ РУЧНОГО ЛИСТАНИЯ)
  useEffect(() => {
    if (banners.length <= 1) return

    const interval = setInterval(() => {
        nextBanner()
    }, bannerInterval)

    return () => clearInterval(interval)
  }, [banners.length, bannerInterval, currentBannerIndex, nextBanner])

  // --- ЛОГИКА СВАЙПОВ (Touch) ---
  const touchStartRef = useRef<number | null>(null)
  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.targetTouches[0].clientX
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return
    
    const touchEnd = e.changedTouches[0].clientX
    const distance = touchStartRef.current - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe) {
      nextBanner()
    } else if (isRightSwipe) {
      prevBanner()
    }
    
    touchStartRef.current = null
  }
  
  // Мы убрали onMouseDown/Move/Up, так как на ПК теперь есть стрелки
  const onMouseDown = (e: React.MouseEvent) => {} 
  const onMouseMove = (e: React.MouseEvent) => {}
  const onMouseUp = () => {}
  // --- ЗАГРУЗКА МЕНЮ С СЕРВЕРА ---
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  
  const mapProductsToItems = useCallback((data: any[]) => {
    return (data || []).map((p: any) => ({
      id: p.id,
      name: getLocalized(p, 'name'),
      description: getLocalized(p, 'description') || '',
      price: p.price,
      category: getLocalized(p.category, 'name') || 'Роллы',
      categorySlug: p.category?.slug || 'rolls',
      categoryId: p.categoryId,
      emoji: '🍣',
      imageUrl: p.imageUrl,
      isTop: p.isPopular
    }))
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
    if (typeof window !== 'undefined') {
      const handleProductsUpdate = () => {
        // Перезагружаем товары с актуальными значениями
        const url = selectedCityId ? `/api/products?cityId=${selectedCityId}` : '/api/products'
        fetch(url)
          .then(res => res.json())
          .then(data => {
            const realItems = data.map((p: any) => ({
              id: p.id,
              name: getLocalized(p, 'name'), 
              description: getLocalized(p, 'description') || '',
              price: p.price,
              category: getLocalized(p.category, 'name') || 'Роллы',
              categorySlug: p.category?.slug || 'rolls',
              categoryId: p.categoryId,
              emoji: '🍣',
              imageUrl: p.imageUrl,
              isTop: p.isPopular
            }));
            setMenuItems(realItems);
          })
          .catch(err => console.error('Ошибка загрузки меню:', err));
      }
      window.addEventListener('productsUpdated', handleProductsUpdate)
      return () => window.removeEventListener('productsUpdated', handleProductsUpdate)
    }
  }, [language, getLocalized, selectedCityId])

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
      setMenuCategories(categories)
      setSelectedCategory((prev) => {
        if (categories.length > 0) {
          const currentCategoryExists = categories.find((c: MenuCategory) => c.key === prev)
          if (!currentCategoryExists || !prev) return categories[0].key
        }
        return prev || (categories.length > 0 ? categories[0].key : '')
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
        setMenuCategories(updatedCategories)
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
  const [activePage, setActivePage] = useState<string | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  
  // НОВЫЙ СТЕЙТ: Какую вкладку открыть в профиле
  const [profileInitialTab, setProfileInitialTab] = useState<'history' | 'address' | 'favorites'>('history')

  const handlePageOpen = (page: string) => {
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
  }
  
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
    if (activePage) setActivePage(null)
  }


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

  // --- ДОБАВЛЕНИЕ В КОРЗИНУ ---
  const addToCart = (item: MenuItem) => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]')
      cart.push(item)
      localStorage.setItem('cart', JSON.stringify(cart))
      const event = new CustomEvent('cartUpdated')
      window.dispatchEvent(event)
      alert(t.addToCart || 'Добавлено!')
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
  }, [menuCategories.length, selectedCategory, checkScrollButtons])

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

  if (activePage === 'phone') return <div className="full-page-web"><div className="full-page-header-web"><button className="back-button-web" onClick={handleClosePage}><ArrowLeft size={24}/></button><h1 className="full-page-title-web">{t.phone}</h1></div><div className="full-page-content-web"><PhoneView /></div></div>
  if (activePage === 'notifications') return <div className="full-page-web"><div className="full-page-header-web"><button className="back-button-web" onClick={handleClosePage}><ArrowLeft size={24}/></button><h1 className="full-page-title-web">Уведомления</h1></div><div className="full-page-content-web"><NotificationsView 
  isOpen={isNotificationsOpen} 
  onClose={() => setIsNotificationsOpen(false)} 
/></div></div>
  
  if (activePage === 'profile') {
    const isAuth = typeof window !== 'undefined' && localStorage.getItem('currentUser')
    
    if (!isAuth) {
      return (
        <div className="full-page-web">
          <AuthView 
            // @ts-ignore
            onBack={handleClosePage}
            onLoginSuccess={() => {
              setActivePage('profile') 
              window.dispatchEvent(new Event('userChanged'))
            }}
          />
        </div>
      )
    }

    return (
      <div className="full-page-web profile-page-full-web">
        <ProfileView 
          onBack={handleClosePage}
          onMenuClick={toggleSidebar}
          onOpenPhone={() => handlePageOpen('phone')}
          onOpenNotifications={() => handlePageOpen('notifications')}
          onOpenFavorites={() => openProfileTab('favorites')} 
          onOpenCart={openCart}
          onSelectCategory={(key) => { handleClosePage(); setSelectedCategory(key) }}
          onOpenAdmin={() => setActivePage('admin')}
          initialTab={profileInitialTab} 
        />
        
      </div>
    )
  }

 if (activePage === 'admin') {
    return (
      <div className="full-page-web">
        <AdminView onBack={handleClosePage} />
      </div>
    )
  }
  if (activePage === 'delivery') return <div className="full-page-web"><div className="full-page-header-web"><button className="back-button-web" onClick={handleClosePage}><ArrowLeft size={24}/></button><h1 className="full-page-title-web">{t.delivery}</h1></div><div className="full-page-content-web"><DeliveryView /></div></div>
  if (activePage === 'promotions') {
  if (selectedPromoId) {
    return (
      <div className="full-page-web">
        <PromotionsDetailView 
          id={selectedPromoId}
          onBack={() => setSelectedPromoId(null)}
          onMenuClick={toggleSidebar}
          onOpenPhone={() => handlePageOpen('phone')}
          onOpenNotifications={() => handlePageOpen('notifications')}
          onOpenFavorites={() => openProfileTab('favorites')}
          onOpenProfile={() => openProfileTab('history')}
        />
      </div>
    )
  }
  return (
    <div className="full-page-web">
      <PromotionsView 
        onBack={handleClosePage} 
        onMenuClick={toggleSidebar}
        // Передаем функцию открытия детальной страницы
        onOpenDetail={(id) => setSelectedPromoId(id)}
        onOpenPhone={() => handlePageOpen('phone')}
        onOpenNotifications={() => handlePageOpen('notifications')}
        onOpenFavorites={() => openProfileTab('favorites')}
        onOpenProfile={() => openProfileTab('history')}
      />
    </div>
  )
}
  if (activePage === 'about') return <div className="full-page-web"><AboutView onBack={handleClosePage} onMenuClick={toggleSidebar} /></div>

  if (activePage === 'cart') {
    return (
      <div className="full-page-web">
        <CartView 
          onBack={handleClosePage}
          onOpenProfile={() => openProfileTab('history')}
          onOpenFavorites={() => openProfileTab('favorites')}
          onOpenPhone={() => handlePageOpen('phone')}
          onOpenNotifications={() => handlePageOpen('notifications')}
          onMenuClick={toggleSidebar}
        />
      </div>
    )
  }

  // ============================================
  // ГЛАВНЫЙ ЭКРАН (МЕНЮ)
  // ============================================
  return (
    <div className="menu-page-web relative min-h-screen bg-[#F3F4F6]">
      <LogoBackground />

      <div className="fixed top-0 left-0 right-0 z-50 bg-[#F3F4F6] shadow-sm transition-transform duration-300">

      <header className="app-header-web relative z-10">
        <div className="header-content-web">
          <div className="logo-section-web" onClick={handleClosePage} style={{ cursor: 'pointer' }}>
            <div className="logo-icon-web"><Image src="/logo.png" alt="Logo" width={50} height={50} className="logo-image-web" priority style={{ objectFit: 'contain' }} /></div>
            <div className="logo-text-images-web"><Image src="/1.jpg" alt="WATTA SUSHI" width={180} height={60} className="logo-text-image-web" priority style={{ objectFit: 'contain' }} /></div>
          </div>
          
          {/* Центральная навигация для десктопа */}
          <div className="header-center-nav-web" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            flex: 1,
            justifyContent: 'center',
            padding: '0 20px'
          }}>
            <CountryCitySelector 
              onCityChange={(cityId: number) => {
                setSelectedCityId(cityId)
                // Перезагружаем меню для выбранного города
                loadMenuItems()
                // Отправляем событие для обновления других компонентов
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('cityChanged', { detail: { cityId } }))
                }
              }}
            />
            
            <button 
              onClick={() => handlePageOpen('delivery')}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '14px',
                fontWeight: '500',
                color: '#333',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '6px'
              }}
            >
              {t.navigation.delivery}
            </button>
            
            <button 
              onClick={() => handlePageOpen('about')}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '14px',
                fontWeight: '500',
                color: '#333',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '6px'
              }}
            >
              {t.navigation.about}
            </button>
            
            <button 
              onClick={() => handlePageOpen('promotions')}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '14px',
                fontWeight: '500',
                color: '#333',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '6px'
              }}
            >
              Новини
            </button>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => handlePageOpen('phone')}>
              <Phone size={18} style={{ color: '#ff6b35' }} />
              <span style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>+38 (067) 436 61 27</span>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ marginLeft: '4px' }}>
                <path d="M3 4.5L6 7.5L9 4.5" stroke="#333" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
          
          <div className="header-actions-web">
            <button 
              className="header-profile-btn-web"
              onClick={() => openProfileTab('history')}
              aria-label="Профіль"
              style={{
                width: '44px',
                height: '44px',
                minWidth: '44px',
                borderRadius: '12px',
                border: '2px solid #145142',
                background: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(20,81,66,0.15), inset 0 1px 0 rgba(255,255,255,1)',
                flexShrink: 0,
                backdropFilter: 'blur(10px)'
              }}
            >
              <User size={20} className="header-profile-icon-web" style={{ color: '#145142', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))', strokeWidth: 2.5 }} />
            </button>
            <div className="location-section-web header-lang-wrap-web" style={{ display: 'flex', alignItems: 'center' }}>
              <LanguageSelector />
            </div>
            
            <button 
              className="header-menu-btn-web"
              onClick={toggleSidebar} 
              aria-label="Меню"
              style={{
                width: '44px',
                height: '44px',
                minWidth: '44px',
                borderRadius: '12px',
                border: '2px solid #145142',
                background: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(20,81,66,0.15), inset 0 1px 0 rgba(255,255,255,1)',
                flexShrink: 0,
                position: 'relative',
                overflow: 'hidden',
                backdropFilter: 'blur(10px)'
              }}
            >
              <Menu 
                size={20} 
                className="header-menu-icon-web"
                style={{ 
                  color: '#145142',
                  filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))',
                  strokeWidth: 2.5
                }} 
              />
            </button>
            
            <button 
              className="header-cart-btn-text-web" 
              onClick={openCart} 
              aria-label="Корзина"
              style={{
                display: 'flex',
                alignItems: 'center',
                borderRadius: '12px',
                border: '2px solid #145142',
                background: '#ffffff',
                cursor: 'pointer',
                position: 'relative',
                fontWeight: '600',
                color: '#145142',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 3px 10px rgba(20,81,66,0.12), inset 0 1px 0 rgba(255,255,255,1)',
                overflow: 'hidden'
              }}
            >
              <span className="header-cart-label-web">{t.cart}</span>
              <div className="header-cart-icon-wrap-web" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShoppingBag size={18} className="header-cart-icon-web" />
                {cartCount > 0 && (
                  <span 
                    className="cart-badge-web"
                    style={{ 
                      position: 'absolute', 
                      top: '-8px', 
                      right: '-8px', 
                      background: 'linear-gradient(135deg, #ff6b35 0%, #ff8c5a 100%)',
                      color: 'white', 
                      fontSize: '11px', 
                      fontWeight: '800', 
                      borderRadius: '12px', 
                      minHeight: '20px', 
                      minWidth: '20px', 
                      padding: cartCount > 9 ? '3px 6px' : '3px',
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      lineHeight: '1',
                      boxShadow: '0 4px 12px rgba(255,107,53,0.5), 0 0 0 3px rgba(255,255,255,0.9), inset 0 1px 0 rgba(255,255,255,0.3)',
                      border: '2px solid #ffffff',
                      letterSpacing: '-0.3px'
                    }}
                  >
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </div>
            </button>
          </div>
        </div>
      </header>
      <div className="app-header-spacer-web" aria-hidden />

      <div className="categories-panel-wrapper-web relative py-2">
            <button 
              className={`categories-scroll-btn-web categories-scroll-left-web ${!canScrollLeft ? 'categories-scroll-btn-hidden-web' : ''}`} 
              onClick={(e) => { e.preventDefault(); scrollPanelBy('left'); }}
            >
              ‹
            </button>
            
            <div 
              ref={categoriesPanelRef}
              className="categories-panel-web" 
              onScroll={handleScroll}
            >
              {menuCategories.map(category => (
                <button 
                  key={category.key} 
                  className={`category-button-web ${selectedCategory === category.key ? 'category-button-active-web' : ''}`} 
                  onClick={(e) => { 
                    e.preventDefault();
                    e.stopPropagation();
                    
                    if (categoriesPanelRef.current) {
                      scrollPositionRef.current = categoriesPanelRef.current.scrollLeft
                    }
                    
                    const newCategoryKey = category.key
                    setSelectedCategory(newCategoryKey); 
                    setShowSubmenu(category.subcategories.length > 0); 
                    setSelectedSubcategory(null);
                    
                    if (scrollContainerRef.current) {
                      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' })
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
                    e.preventDefault();
                    e.currentTarget.blur();
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
              className={`categories-scroll-btn-web categories-scroll-right-web ${!canScrollRight ? 'categories-scroll-btn-hidden-web' : ''}`} 
              onClick={(e) => { e.preventDefault(); scrollPanelBy('right'); }}
            >
              ›
            </button>
          </div>
      </div>

      <div className="h-[140px] md:h-[160px] w-full bg-transparent" aria-hidden="true" />


      <div className="categories-panel-spacer-web" aria-hidden />

      {showSubmenu && currentCategory && currentCategory.subcategories.length > 0 && (
        <div className="submenu-panel-web">
          <div className="submenu-header-web"><h3>{currentCategory.name}</h3><button className="submenu-close-btn-web" onClick={() => setShowSubmenu(false)}>×</button></div>
          <div className="submenu-content-web">{currentCategory.subcategories.map(sub => (<button key={sub.id} className={`submenu-item-web ${selectedSubcategory === sub.id ? 'submenu-item-active-web' : ''}`} onClick={() => setSelectedSubcategory(sub.id)}><span className="submenu-item-name-web">{sub.name}</span><span className="submenu-item-count-web">{sub.items.length} страв</span></button>))}</div>
        </div>
      )}

      {banners.length > 0 ? (
        <div 
          className="hero-banner-web max-w-7xl mx-auto rounded-none sm:rounded-2xl overflow-hidden relative group"
          // Добавляем обработчики свайпа для мобильных
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          style={{ 
            backgroundImage: `url(${banners[currentBannerIndex].imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            position: 'relative'
          }}
        >
          {/* Затемнение для читаемости (опционально, если нужно) */}
          <div className="absolute inset-0 bg-black/10 transition-colors group-hover:bg-black/5 pointer-events-none" />

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
            className="hero-dots-web absolute bottom-3 left-0 right-0 flex justify-center gap-2" 
            style={{ zIndex: 3 }}
          >
            {banners.map((_, i) => (
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

      <div className="menu-section-web max-w-7xl mx-auto px-2 sm:px-4 md:px-6">
        <h3 className="category-title-web pl-2 sm:pl-0 mt-6 mb-4">{t.categories[selectedCategory as keyof typeof t.categories] || menuCategories.find(c => c.key === selectedCategory)?.name || ''}</h3>
        <div className="menu-items-grid-web bg-transparent">
          {filteredItems.length > 0 ? (
            filteredItems.map(item => (
              <div key={item.id} className="menu-item-card-web bg-white rounded-xl shadow-sm">
                {item.isTop && <div className="top-badge-web"><span className="badge-icon-web">⚡</span><span className="badge-text-web">{t.popular || 'Топ'}</span></div>}
                <div className="item-image-web">{item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover rounded-lg" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : item.emoji}</div>
                <div className="item-info-web"><h4 className="item-name-web">{item.name}</h4><p className="item-description-web">{item.description}</p><div className="item-footer-web"><span className="item-price-web">{item.price} ₴</span><button className="add-btn-web" onClick={() => addToCart(item)}>+</button></div></div>
              </div>
            ))
          ) : (
            <div style={{ 
              gridColumn: '1 / -1', 
              textAlign: 'center', 
              padding: '60px 20px',
              color: '#666',
              fontSize: '16px'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🍣</div>
              <p style={{ margin: 0, fontWeight: '500' }}>
                {language === 'uk' ? 'Товарів у цій категорії поки немає' : 
                 language === 'en' ? 'No items in this category yet' :
                 language === 'nl' ? 'Nog geen items in deze categorie' :
                 'Товаров в этой категории пока нет'}
              </p>
              <p style={{ margin: '8px 0 0 0', fontSize: '14px', opacity: 0.7 }}>
                {language === 'uk' ? 'Додайте товари через адмін-панель' :
                 language === 'en' ? 'Add items through the admin panel' :
                 language === 'nl' ? 'Voeg items toe via het adminpaneel' :
                 'Добавьте товары через админ-панель'}
              </p>
            </div>
          )}
        </div>
      </div>

      {showCategoryAdmin && (
        <div className="admin-category-overlay-web" onClick={() => setShowCategoryAdmin(false)}>
          <div className="admin-category-panel-web" onClick={(e) => e.stopPropagation()}>
            <div className="admin-category-header-web"><h3>Управління категоріями меню</h3><button className="admin-category-close-btn-web" onClick={() => setShowCategoryAdmin(false)}>×</button></div>
            <div className="admin-category-content-web">
              <button className="add-category-btn-web" onClick={handleAddCategory}>➕ Додати категорію</button>
              <div className="admin-category-list-web">{menuCategories.map(cat => (<div key={cat.id} className="admin-category-item-web"><div className="admin-category-info-web"><span className="admin-category-emoji-web">{cat.emoji}</span><span className="admin-category-name-web">{cat.name}</span><span className="admin-category-subcount-web">({cat.subcategories.length} підкатегорій)</span></div><div className="admin-category-actions-web"><button className="admin-edit-btn-web" onClick={() => { setEditingCategory(cat); const name = prompt('Введіть нову назву:', cat.name); if (name) handleEditCategory({ ...cat, name }) }}>✏️</button><button className="admin-add-sub-btn-web" onClick={() => handleAddSubcategory(cat.id)}>➕ Підкатегорія</button><button className="admin-delete-btn-web" onClick={() => handleDeleteCategory(cat.id)}>🗑️</button></div></div>))}</div>
            </div>
          </div>
        </div>
      )}

      {/* Overlay */}
      <div 
        className={`sidebar-overlay-web ${isSidebarOpen ? 'active' : ''}`} 
        onClick={toggleSidebar}
        style={{ 
          zIndex: 9998, 
          position: 'fixed', 
          inset: 0, 
          background: 'rgba(0,0,0,0.6)', 
          backdropFilter: 'blur(8px)', 
          opacity: isSidebarOpen ? 1 : 0, 
          visibility: isSidebarOpen ? 'visible' : 'hidden', 
          transition: 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.4s' 
        }}
      />
      
      {/* Sidebar */}
      <div 
        className={`sidebar-web ${isSidebarOpen ? 'open' : ''}`}
        style={{ 
          zIndex: 9999, 
          position: 'fixed', 
          top: 0, 
          right: 0, 
          height: '100%', 
          width: 'min(260px, 80vw)', 
          background: 'linear-gradient(180deg, rgba(255,255,255,0.99) 0%, rgba(250,251,252,0.97) 50%, rgba(255,255,255,0.99) 100%)',
          boxShadow: '-8px 0 32px rgba(0,0,0,0.12), -4px 0 16px rgba(0,0,0,0.08), inset 1px 0 0 rgba(255,255,255,0.9)',
          backdropFilter: 'blur(24px)', 
          borderLeft: '1px solid rgba(0,0,0,0.08)',
          transform: isSidebarOpen ? 'translateX(0)' : 'translateX(100%)', 
          transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        }}
      >
        <style jsx>{`
          @keyframes blink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0; }
          }
          @keyframes pulse {
            0%, 100% { opacity: 0.6; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.1); }
          }
          .menu-title {
            font-family: 'Bebas Neue', 'Montserrat', 'Poppins', sans-serif;
            font-weight: 700;
            letter-spacing: 2px;
            text-transform: uppercase;
            color: white !important;
            text-shadow: 
              0 2px 6px rgba(0,0,0,0.25),
              0 4px 12px rgba(0,0,0,0.15);
            font-size: 22px;
            line-height: 1.3;
            display: block;
            visibility: visible;
            opacity: 1;
          }
          .sidebar-web button span {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            font-weight: 600;
            letter-spacing: 0.3px;
            position: relative;
          }
          .sidebar-content-web::-webkit-scrollbar {
            width: 8px;
          }
          .sidebar-content-web::-webkit-scrollbar-track {
            background: rgba(0,0,0,0.02);
            border-radius: 10px;
          }
          .sidebar-content-web::-webkit-scrollbar-thumb {
            background: linear-gradient(180deg, rgba(20,81,66,0.3), rgba(20,81,66,0.2));
            border-radius: 10px;
            border: 2px solid transparent;
            background-clip: padding-box;
          }
          .sidebar-content-web::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(180deg, rgba(20,81,66,0.5), rgba(20,81,66,0.4));
            background-clip: padding-box;
          }
        `}</style>
        {/* Header */}
        <div 
          className="sidebar-header-web"
          style={{ 
            background: 'linear-gradient(180deg, rgba(255,255,255,0.99) 0%, rgba(250,251,252,0.97) 100%)',
            padding: '20px 18px',
            borderBottom: '1px solid rgba(0,0,0,0.08)',
            position: 'relative',
            backdropFilter: 'blur(24px)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.06), inset 0 -1px 0 rgba(0,0,0,0.04)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', position: 'relative', zIndex: 1, width: '100%' }}>
            <button 
              className="sidebar-close-btn-web" 
              onClick={toggleSidebar}
              style={{ 
                background: 'linear-gradient(135deg, rgba(255,255,255,0.99) 0%, rgba(250,251,252,0.97) 100%)', 
                border: '1.5px solid rgba(0,0,0,0.08)', 
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                backdropFilter: 'blur(24px)',
                flexShrink: 0,
                boxShadow: '0 3px 10px rgba(0,0,0,0.1), 0 1px 4px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(20,81,66,0.12) 0%, rgba(20,81,66,0.08) 100%)'
                e.currentTarget.style.borderColor = 'rgba(20,81,66,0.25)'
                e.currentTarget.style.transform = 'rotate(90deg) scale(1.12)'
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(20,81,66,0.2), 0 3px 10px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.8)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.99) 0%, rgba(250,251,252,0.97) 100%)'
                e.currentTarget.style.borderColor = 'rgba(0,0,0,0.08)'
                e.currentTarget.style.transform = 'rotate(0deg) scale(1)'
                e.currentTarget.style.boxShadow = '0 3px 10px rgba(0,0,0,0.1), 0 1px 4px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)'
              }}
            >
              <X size={18} style={{ color: '#333' }} />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div 
          className="sidebar-content-web"
          style={{ 
            padding: '20px 16px', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '12px',
            overflowY: 'auto',
            height: 'calc(100% - 85px)',
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            scrollbarWidth: 'thin',
            scrollbarColor: '#145142 transparent',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.99) 0%, rgba(250,251,252,0.97) 50%, rgba(255,255,255,0.99) 100%)'
          }}
        >
          {/* Иконки вверху меню */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '8px',
            marginBottom: '20px',
            paddingBottom: '20px',
            borderBottom: '1px solid rgba(0,0,0,0.08)'
          }}>
            <button 
              className="sidebar-icon-btn-web"
              onClick={(e) => { e.preventDefault(); toggleSidebar(); openProfileTab('history') }}
              style={{
                width: '100%',
                aspectRatio: '1',
                borderRadius: '10px',
                border: '1px solid rgba(236,72,153,0.2)',
                background: 'rgba(236,72,153,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                color: '#ec4899',
                boxShadow: '0 1px 4px rgba(236,72,153,0.15)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(236,72,153,0.15)'
                e.currentTarget.style.transform = 'scale(1.05)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(236,72,153,0.25)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(236,72,153,0.1)'
                e.currentTarget.style.transform = 'scale(1)'
                e.currentTarget.style.boxShadow = '0 1px 4px rgba(236,72,153,0.15)'
              }}
            >
              <User size={18} />
            </button>
            
            <button 
              className="sidebar-icon-btn-web"
              onClick={(e) => { e.preventDefault(); toggleSidebar(); handlePageOpen('phone') }}
              style={{
                width: '100%',
                aspectRatio: '1',
                borderRadius: '10px',
                border: '1px solid rgba(0,0,0,0.08)',
                background: 'rgba(255,255,255,0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                color: '#333',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(20,81,66,0.08)'
                e.currentTarget.style.transform = 'scale(1.05)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(20,81,66,0.15)'
                e.currentTarget.style.color = '#145142'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.6)'
                e.currentTarget.style.transform = 'scale(1)'
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'
                e.currentTarget.style.color = '#333'
              }}
            >
              <Phone size={18} />
            </button>
            
            <button 
              className="sidebar-icon-btn-web"
              onClick={(e) => { e.preventDefault(); toggleSidebar(); setIsNotificationsOpen(true) }}
              style={{
                width: '100%',
                aspectRatio: '1',
                borderRadius: '14px',
                border: '1px solid rgba(0,0,0,0.08)',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.6) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                color: '#333',
                boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(20,81,66,0.1) 0%, rgba(20,81,66,0.05) 100%)'
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)'
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(20,81,66,0.15)'
                e.currentTarget.style.borderColor = 'rgba(20,81,66,0.2)'
                e.currentTarget.style.color = '#145142'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.6) 100%)'
                e.currentTarget.style.transform = 'translateY(0) scale(1)'
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.04)'
                e.currentTarget.style.borderColor = 'rgba(0,0,0,0.08)'
                e.currentTarget.style.color = '#333'
              }}
            >
              <Bell size={18} />
            </button>
            
            <button 
              className="sidebar-icon-btn-web"
              onClick={(e) => { e.preventDefault(); toggleSidebar(); openProfileTab('favorites') }}
              style={{
                width: '100%',
                aspectRatio: '1',
                borderRadius: '14px',
                border: '1px solid rgba(0,0,0,0.08)',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.6) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                color: '#333',
                boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(20,81,66,0.1) 0%, rgba(20,81,66,0.05) 100%)'
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)'
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(20,81,66,0.15)'
                e.currentTarget.style.borderColor = 'rgba(20,81,66,0.2)'
                e.currentTarget.style.color = '#145142'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.6) 100%)'
                e.currentTarget.style.transform = 'translateY(0) scale(1)'
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.04)'
                e.currentTarget.style.borderColor = 'rgba(0,0,0,0.08)'
                e.currentTarget.style.color = '#333'
              }}
            >
              <Heart size={18} />
            </button>
          </div>
          
          {/* Menu Items */}
          <button 
            className="sidebar-item-web"
            onClick={(e) => { e.preventDefault(); toggleSidebar(); handleClosePage() }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 14px',
              borderRadius: '12px',
              border: '1px solid rgba(0,0,0,0.04)',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(250,251,252,0.8) 100%)',
              cursor: 'pointer',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              textAlign: 'left',
              width: '100%',
              fontSize: '14px',
              fontWeight: '600',
              color: '#1f2937',
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              boxShadow: '0 2px 6px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.8)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(20,81,66,0.08) 0%, rgba(20,81,66,0.05) 100%)'
              e.currentTarget.style.borderColor = 'rgba(20,81,66,0.15)'
              e.currentTarget.style.transform = 'translateX(4px) scale(1.02)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(20,81,66,0.12), 0 2px 6px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(250,251,252,0.8) 100%)'
              e.currentTarget.style.borderColor = 'rgba(0,0,0,0.04)'
              e.currentTarget.style.transform = 'translateX(0) scale(1)'
              e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.8)'
            }}
          >
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: '#145142',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 2px 6px rgba(20,81,66,0.2)'
            }}>
              <Home size={18} style={{ color: 'white' }} />
            </div>
            <span>{t.navigation.home}</span>
          </button>

          <button 
            className="sidebar-item-web"
            onClick={(e) => { e.preventDefault(); toggleSidebar(); handleClosePage() }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 14px',
              borderRadius: '12px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              transition: 'all 0.25s ease',
              textAlign: 'left',
              width: '100%',
              fontSize: '15px',
              fontWeight: '500',
              color: '#1f2937',
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(236,72,153,0.05)'
              e.currentTarget.style.transform = 'translateX(4px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.transform = 'translateX(0)'
            }}
          >
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: '#ec4899',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 2px 6px rgba(236,72,153,0.2)'
            }}>
              <Menu size={18} style={{ color: 'white' }} />
            </div>
            <span>{t.menu}</span>
          </button>

          <button 
            className="sidebar-item-web"
            onClick={(e) => { e.preventDefault(); toggleSidebar(); handlePageOpen('promotions') }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 14px',
              borderRadius: '12px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              transition: 'all 0.25s ease',
              textAlign: 'left',
              width: '100%',
              fontSize: '15px',
              fontWeight: '500',
              color: '#1f2937',
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(245,158,11,0.05)'
              e.currentTarget.style.transform = 'translateX(4px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.transform = 'translateX(0)'
            }}
          >
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 2px 6px rgba(245,158,11,0.2)'
            }}>
              <Tag size={18} style={{ color: 'white' }} />
            </div>
            <span>{t.navigation.promotions}</span>
          </button>

          <button 
            className="sidebar-item-web"
            onClick={(e) => { e.preventDefault(); toggleSidebar(); handlePageOpen('delivery') }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 14px',
              borderRadius: '12px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              transition: 'all 0.25s ease',
              textAlign: 'left',
              width: '100%',
              fontSize: '15px',
              fontWeight: '500',
              color: '#1f2937',
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(59,130,246,0.05)'
              e.currentTarget.style.transform = 'translateX(4px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.transform = 'translateX(0)'
            }}
          >
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 2px 6px rgba(59,130,246,0.2)'
            }}>
              <Truck size={18} style={{ color: 'white' }} />
            </div>
            <span>{t.navigation.delivery}</span>
          </button>
          
          <button 
            className="sidebar-item-web"
            onClick={(e) => { e.preventDefault(); toggleSidebar(); handlePageOpen('about') }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 14px',
              borderRadius: '12px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              transition: 'all 0.25s ease',
              textAlign: 'left',
              width: '100%',
              fontSize: '15px',
              fontWeight: '500',
              color: '#1f2937',
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(16,185,129,0.05)'
              e.currentTarget.style.transform = 'translateX(4px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.transform = 'translateX(0)'
            }}
          >
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 2px 6px rgba(16,185,129,0.2)'
            }}>
              <Info size={18} style={{ color: 'white' }} />
            </div>
            <span>{t.navigation.about}</span>
          </button>

          <button 
            className="sidebar-item-web"
            onClick={(e) => { e.preventDefault(); toggleSidebar(); handlePageOpen('phone') }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 14px',
              borderRadius: '12px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              transition: 'all 0.25s ease',
              textAlign: 'left',
              width: '100%',
              fontSize: '15px',
              fontWeight: '500',
              color: '#1f2937',
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(6,182,212,0.05)'
              e.currentTarget.style.transform = 'translateX(4px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.transform = 'translateX(0)'
            }}
          >
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: '#06b6d4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 2px 6px rgba(6,182,212,0.2)'
            }}>
              <Phone size={18} style={{ color: 'white' }} />
            </div>
            <span>{t.navigation.contacts}</span>
          </button>
          
          {isAdmin && (
            <div style={{ 
              marginTop: '20px', 
              paddingTop: '20px', 
              borderTop: '1px solid rgba(229,231,235,0.6)',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: '40px',
                height: '2px',
                background: 'linear-gradient(90deg, transparent, rgba(236,72,153,0.3), transparent)'
              }} />
              <button 
                className="sidebar-item-web"
                onClick={(e) => { e.preventDefault(); toggleSidebar(); handlePageOpen('admin'); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '16px 18px',
                  borderRadius: '14px',
                  border: '1.5px solid rgba(236,72,153,0.3)',
                  background: 'linear-gradient(135deg, rgba(236,72,153,0.08) 0%, rgba(236,72,153,0.04) 100%)',
                  cursor: 'pointer',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  textAlign: 'left',
                  width: '100%',
                  fontSize: '15px',
                  fontWeight: '700',
                  color: '#ec4899',
                  boxShadow: '0 2px 8px rgba(236,72,153,0.1)',
                  backdropFilter: 'blur(10px)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)'
                  e.currentTarget.style.color = 'white'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(236,72,153,0.35)'
                  e.currentTarget.style.borderColor = '#ec4899'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(236,72,153,0.08) 0%, rgba(236,72,153,0.04) 100%)'
                  e.currentTarget.style.color = '#ec4899'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(236,72,153,0.1)'
                  e.currentTarget.style.borderColor = 'rgba(236,72,153,0.3)'
                }}
              >
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 4px 12px rgba(236,72,153,0.3)',
                  transition: 'all 0.25s ease'
                }}>
                  <Sparkles size={20} style={{ color: 'white' }} />
                </div>
                <span>{t.admin}</span>
              </button>
            </div>
          )}
        </div>
      </div>
      <NotificationsView 
        isOpen={isNotificationsOpen} 
        onClose={() => setIsNotificationsOpen(false)} 
      />
    </div>
  )
}