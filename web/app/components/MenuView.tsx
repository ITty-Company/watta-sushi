'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useLanguage } from '../context/LanguageContext'
import LanguageSelector from './LanguageSelector'
import PhoneView from './PhoneView'
import NotificationsView from './NotificationsView'
import FavoritesView from './FavoritesView'
import ProfileView from './ProfileView'
import DeliveryView from './DeliveryView'
import AdminView from './AdminView'

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
    name: 'Амстердам',
    coordinates: { lat: 52.3676, lng: 4.9041 },
    zoom: 11,
    deliveryZones: [
      {
        id: 'amsterdam-center',
        name: 'Центр',
        color: '#4ade80',
        coordinates: [
          { lat: 52.36, lng: 4.88 },
          { lat: 52.38, lng: 4.88 },
          { lat: 52.38, lng: 4.92 },
          { lat: 52.36, lng: 4.92 }
        ]
      }
    ]
  },
  {
    id: 'rotterdam',
    name: 'Роттердам',
    coordinates: { lat: 51.9244, lng: 4.4777 },
    zoom: 12,
    deliveryZones: []
  },
  {
    id: 'den-haag',
    name: 'Гаага',
    coordinates: { lat: 52.0705, lng: 4.3007 },
    zoom: 12,
    deliveryZones: []
  },
  {
    id: 'utrecht',
    name: 'Утрехт',
    coordinates: { lat: 52.0907, lng: 5.1214 },
    zoom: 12,
    deliveryZones: []
  },
  {
    id: 'eindhoven',
    name: 'Эйндховен',
    coordinates: { lat: 51.4416, lng: 5.4697 },
    zoom: 12,
    deliveryZones: []
  }
]

interface MenuItem {
  id: number
  name: string
  description: string
  price: number
  category: string
  subcategory?: string
  emoji: string
  isTop?: boolean
  imageUrl?: string;
}

interface MenuCategory {
  id: string
  key: string
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
  { id: 'rolls', key: 'rolls', name: 'Роли', emoji: '🍣', subcategories: [] },
  { id: 'sushi', key: 'sushi', name: 'Суші', emoji: '🍱', subcategories: [] },
  { id: 'sets', key: 'sets', name: 'Сети', emoji: '🍱', subcategories: [] },
  { id: 'soups', key: 'soups', name: 'Супи', emoji: '🍲', subcategories: [] },
  { id: 'bowls', key: 'bowls', name: 'Боули', emoji: '🥣', subcategories: [] },
  { id: 'snacks', key: 'snacks', name: 'Закуски', emoji: '🦐', subcategories: [] },
  { id: 'drinks', key: 'drinks', name: 'Напої', emoji: '🥤', subcategories: [] },
  { id: 'sauces', key: 'sauces', name: 'Соуси', emoji: '🍶', subcategories: [] }
]

interface User {
  id: string
  name: string
  email: string
  phone: string
  address: string
  isAdmin: boolean
  createdAt: string
}

export default function MenuView() {
  const { t, language } = useLanguage()
  
  // --- ЗАГРУЗКА МЕНЮ С СЕРВЕРА ---
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        const realItems = data.map((p: any) => ({
          id: p.id,
          name: p.name_ru,
          description: p.description || '',
          price: p.price,
          category: p.category?.name_ru || 'Роли',
          emoji: '🍣',
          imageUrl: p.imageUrl,
          isTop: p.isPopular
        }));
        setMenuItems(realItems);
      })
      .catch(err => console.error('Ошибка загрузки меню:', err));
  }, []);
  // ------------------------------

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
    const event = new CustomEvent('switchTab', { detail: 1 }) // 1 = Вкладка Корзины
    window.dispatchEvent(event)
  }
  // ---------------

  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>(defaultCategories)
  const [selectedCategory, setSelectedCategory] = useState('soups')
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null)
  const [showSubmenu, setShowSubmenu] = useState(false)
  const [showCategoryAdmin, setShowCategoryAdmin] = useState(false)
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null)
  const [editingSubcategory, setEditingSubcategory] = useState<{ categoryId: string; subcategory: MenuSubcategory | null } | null>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  
  // Загрузка пользователя
  useEffect(() => {
    if (typeof window === 'undefined') return
    const loadUser = () => {
      if (window.localStorage) {
        const savedUser = localStorage.getItem('currentUser')
        if (savedUser) {
          try {
            const parsed = JSON.parse(savedUser)
            setCurrentUser(parsed)
            setIsAdmin(parsed.isAdmin || false)
          } catch (e) { console.error(e) }
        }
      }
    }
    loadUser()
    window.addEventListener('userChanged', loadUser)
    return () => window.removeEventListener('userChanged', loadUser)
  }, [])
  
  // Загрузка категорий из localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedCategories = localStorage.getItem('menuCategories')
      if (savedCategories) {
        try {
          setMenuCategories(JSON.parse(savedCategories))
        } catch (e) { console.error(e) }
      }
    }
  }, [])
  
  // Сохранение категорий
  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('menuCategories', JSON.stringify(menuCategories))
    }
  }, [menuCategories])
  
  const categories = menuCategories.map(cat => ({
    key: cat.key,
    name: cat.name,
    emoji: cat.emoji
  }))
  
  const checkScrollButtons = (element: HTMLElement) => {
    if (element) {
      setCanScrollLeft(element.scrollLeft > 0)
      setCanScrollRight(element.scrollLeft < element.scrollWidth - element.clientWidth - 1)
    }
  }
  
  const categoryMap: Record<string, string> = {
    'rolls': 'Роллы',
    'sushi': 'Суши',
    'sets': 'Сеты',
    'soups': 'Супы',
    'bowls': 'Боули',
    'snacks': 'Закуски',
    'drinks': 'Напої',
    'sauces': 'Соуси'
  }
  
  const currentCategory = menuCategories.find(cat => cat.key === selectedCategory)
  
  // --- ФИЛЬТРАЦИЯ (ИСПРАВЛЕНА) ---
  const filteredItems = selectedSubcategory 
    ? currentCategory?.subcategories.find(sub => sub.id === selectedSubcategory)?.items || []
    : menuItems.filter(item => item.category === (categoryMap[selectedCategory] || 'Супи'))
  // -------------------------------

  const [activePage, setActivePage] = useState<string | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  
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
  
  const handleCategoryClick = (categoryKey: string) => {
    const category = menuCategories.find(cat => cat.key === categoryKey)
    if (category && category.subcategories.length > 0) {
      setSelectedCategory(categoryKey)
      setShowSubmenu(true)
      setSelectedSubcategory(null)
    } else {
      setSelectedCategory(categoryKey)
      setShowSubmenu(false)
      setSelectedSubcategory(null)
      handleClosePage()
    }
  }
  
  const handleSubcategoryClick = (subcategoryId: string) => {
    setSelectedSubcategory(subcategoryId)
    setShowSubmenu(false)
    handleClosePage()
  }
  
  // Функции админки (оставил как есть)
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
  
  const handleEditSubcategory = (categoryId: string, subcategory: MenuSubcategory) => {
    const name = prompt('Введіть нову назву підкатегорії:', subcategory.name)
    if (!name || !name.trim()) return
    setMenuCategories(menuCategories.map(cat => cat.id === categoryId ? { ...cat, subcategories: cat.subcategories.map(sub => sub.id === subcategory.id ? { ...sub, name: name.trim() } : sub) } : cat))
    setEditingSubcategory(null)
  }
  
  const handleDeleteSubcategory = (categoryId: string, subcategoryId: string) => {
    if (confirm('Ви впевнені, що хочете видалити цю підкатегорію?')) {
      setMenuCategories(menuCategories.map(cat => cat.id === categoryId ? { ...cat, subcategories: cat.subcategories.filter(sub => sub.id !== subcategoryId) } : cat))
    }
  }
  
  const handleAddItemToSubcategory = (categoryId: string, subcategoryId: string) => {
    const name = prompt('Введіть назву страви:')
    if (!name || !name.trim()) return
    const description = prompt('Введіть опис:') || ''
    const priceStr = prompt('Введіть ціну:')
    const price = priceStr ? parseFloat(priceStr) : 0
    const emoji = prompt('Введіть емодзі:') || '🍽️'
    const newItem: MenuItem = {
      id: Date.now(), name: name.trim(), description: description.trim(), price,
      category: categoryMap[menuCategories.find(cat => cat.id === categoryId)?.key || 'soups'],
      subcategory: menuCategories.find(cat => cat.id === categoryId)?.subcategories.find(sub => sub.id === subcategoryId)?.name,
      emoji
    }
    setMenuCategories(menuCategories.map(cat => cat.id === categoryId ? { ...cat, subcategories: cat.subcategories.map(sub => sub.id === subcategoryId ? { ...sub, items: [...sub.items, newItem] } : sub) } : cat))
  }
  
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
    if (activePage) setActivePage(null)
  }
  
  const addToCart = (item: MenuItem) => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]')
      cart.push(item)
      localStorage.setItem('cart', JSON.stringify(cart))
      const event = new CustomEvent('cartUpdated')
      window.dispatchEvent(event)
    }
  }
  
  // Админка зон доставки
  const [cities, setCities] = useState<City[]>(defaultCities)
  const [selectedCity, setSelectedCity] = useState<City>(defaultCities[0])
  
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.localStorage) {
      const savedZones = localStorage.getItem('deliveryZones')
      if (savedZones) {
        try {
          const parsed = JSON.parse(savedZones)
          setCities(parsed)
          const currentCity = parsed.find((c: City) => c.id === selectedCity.id)
          if (currentCity) setSelectedCity(currentCity)
        } catch (e) { console.error(e) }
      }
    }
  }, [])
  
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

  const CategoriesPanel = () => (
    <div className="categories-panel-wrapper-web">
      <button 
        className={`categories-scroll-btn-web categories-scroll-left-web ${!canScrollLeft ? 'categories-scroll-btn-hidden-web' : ''}`}
        onClick={(e) => {
          const wrapper = e.currentTarget.closest('.categories-panel-wrapper-web')
          const panel = wrapper?.querySelector('.categories-panel-web') as HTMLElement
          if (panel) {
            panel.scrollBy({ left: -200, behavior: 'smooth' })
            setTimeout(() => checkScrollButtons(panel), 300)
          }
        }}
      >
        ‹
      </button>
      <div className="categories-panel-web">
        {categories.map(category => (
          <button
            key={category.key}
            className={`category-button-web ${selectedCategory === category.key ? 'category-button-active-web' : ''}`}
            onClick={() => handleCategoryClick(category.key)}
          >
            <div className="category-button-icon-web">
              {menuCategories.find(cat => cat.key === category.key)?.emoji || '📦'}
            </div>
            <span className="category-button-label-web">{category.name}</span>
          </button>
        ))}
      </div>
      <button 
        className={`categories-scroll-btn-web categories-scroll-right-web ${!canScrollRight ? 'categories-scroll-btn-hidden-web' : ''}`}
        onClick={(e) => {
          const wrapper = e.currentTarget.closest('.categories-panel-wrapper-web')
          const panel = wrapper?.querySelector('.categories-panel-web') as HTMLElement
          if (panel) {
            panel.scrollBy({ left: 200, behavior: 'smooth' })
            setTimeout(() => checkScrollButtons(panel), 300)
          }
        }}
      >
        ›
      </button>
    </div>
  )

  if (activePage === 'phone') {
    return (
      <div className="full-page-web">
        <div className="full-page-header-web">
          <button className="back-button-web" onClick={handleClosePage}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>
          <h1 className="full-page-title-web">Контакты</h1>
        </div>
        <div className="full-page-content-web"><PhoneView /></div>
      </div>
    )
  }
  
  if (activePage === 'notifications') {
    return (
      <div className="full-page-web">
        <div className="full-page-header-web">
          <button className="back-button-web" onClick={handleClosePage}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>
          <h1 className="full-page-title-web">Уведомления</h1>
        </div>
        <div className="full-page-content-web"><NotificationsView /></div>
      </div>
    )
  }
  
  if (activePage === 'favorites') {
    return (
      <div className="full-page-web">
        <div className="full-page-header-web">
          <button className="back-button-web" onClick={handleClosePage}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>
          <h1 className="full-page-title-web">Избранное</h1>
        </div>
        <CategoriesPanel />
        <div className="full-page-content-web"><FavoritesView /></div>
      </div>
    )
  }
  
  if (activePage === 'profile') {
    return (
      <div className="full-page-web profile-page-full-web">
        {/* Передаем функцию закрытия (onBack) */}
        <ProfileView onBack={handleClosePage} />
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

  if (activePage === 'delivery') {
    return (
      <div className="menu-page-web">
        <header className="app-header-web">
          <div className="header-content-web">
            <div className="logo-section-web" onClick={handleClosePage} style={{ cursor: 'pointer' }}>
              <div className="logo-icon-web">
                <Image src="/logo.png" alt="Logo" width={50} height={50} className="logo-image-web" priority style={{ objectFit: 'contain' }} />
              </div>
              <div className="logo-text-images-web">
                <Image src="/1.jpg" alt="WATTA SUSHI" width={180} height={60} className="logo-text-image-web" priority style={{ objectFit: 'contain' }} />
              </div>
            </div>
            <div className="location-section-web"><LanguageSelector /></div>
            
            {/* КНОПКИ В ШАПКЕ */}
            <div className="header-actions-web">
              <button className="header-icon-btn-web phone-icon-web" onClick={() => handlePageOpen('phone')}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              </button>
              <button className="header-icon-btn-web" onClick={() => handlePageOpen('notifications')}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              </button>
              <button className="header-icon-btn-web" onClick={() => handlePageOpen('favorites')}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              </button>
              
              {/* --- КНОПКА КОРЗИНЫ --- */}
              <button className="header-icon-btn-web relative" onClick={openCart}>
                <div style={{ position: 'relative' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 20a1 1 0 1 0 0 2 1 1 0 0 0 0-2z" />
                    <path d="M20 20a1 1 0 1 0 0 2 1 1 0 0 0 0-2z" />
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                  </svg>
                  {cartCount > 0 && (
                    <span style={{ position: 'absolute', top: '-8px', right: '-8px', backgroundColor: '#ec4899', color: 'white', fontSize: '10px', fontWeight: 'bold', borderRadius: '50%', height: '16px', width: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {cartCount}
                    </span>
                  )}
                </div>
              </button>
              {/* ---------------------- */}

              <button className="header-icon-btn-web" onClick={() => handlePageOpen('profile')}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </button>
              <button className="header-icon-btn-web" onClick={toggleSidebar}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
              </button>
            </div>
          </div>
        </header>
        <CategoriesPanel />
        <DeliveryView />
      </div>
    )
  }

  return (
    <div className="menu-page-web">
      <header className="app-header-web">
        <div className="header-content-web">
          <div className="logo-section-web" onClick={handleClosePage} style={{ cursor: 'pointer' }}>
            <div className="logo-icon-web">
              <Image src="/logo.png" alt="Watta Sushi Logo" width={50} height={50} className="logo-image-web" priority style={{ objectFit: 'contain' }} />
            </div>
            <div className="logo-text-images-web">
              <Image src="/1.jpg" alt="WATTA SUSHI" width={180} height={60} className="logo-text-image-web" priority style={{ objectFit: 'contain' }} />
            </div>
          </div>
          <div className="location-section-web"><LanguageSelector /></div>
              <button 
                className="header-icon-btn-web" 
                title="Админ-панель"
                onClick={() => handlePageOpen('admin')}
                style={{ color: '#ec4899' }} // Розовый цвет, чтобы выделялась
              >
                {/* Иконка Щита (Shield) */}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </button>
          
          <div className="header-actions-web">
            <button className="header-icon-btn-web phone-icon-web" onClick={() => handlePageOpen('phone')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            </button>
            <button className="header-icon-btn-web" onClick={() => handlePageOpen('notifications')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            </button>
            <button className="header-icon-btn-web" onClick={() => handlePageOpen('favorites')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            </button>
            
            {/* --- КНОПКА КОРЗИНЫ --- */}
            <button className="header-icon-btn-web relative" onClick={openCart}>
              <div style={{ position: 'relative' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 20a1 1 0 1 0 0 2 1 1 0 0 0 0-2z" />
                  <path d="M20 20a1 1 0 1 0 0 2 1 1 0 0 0 0-2z" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
                {cartCount > 0 && (
                  <span style={{ position: 'absolute', top: '-8px', right: '-8px', backgroundColor: '#ec4899', color: 'white', fontSize: '10px', fontWeight: 'bold', borderRadius: '50%', height: '16px', width: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {cartCount}
                  </span>
                )}
              </div>
            </button>
            {/* ---------------------- */}

            <button className="header-icon-btn-web" onClick={() => handlePageOpen('profile')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </button>
            <button className="header-icon-btn-web" onClick={toggleSidebar}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
          </div>
        </div>
      </header>

      <CategoriesPanel />

      {showSubmenu && currentCategory && currentCategory.subcategories.length > 0 && (
        <div className="submenu-panel-web">
          <div className="submenu-header-web">
            <h3>{currentCategory.name}</h3>
            <button className="submenu-close-btn-web" onClick={() => setShowSubmenu(false)}>×</button>
          </div>
          <div className="submenu-content-web">
            {currentCategory.subcategories.map(subcategory => (
              <button key={subcategory.id} className={`submenu-item-web ${selectedSubcategory === subcategory.id ? 'submenu-item-active-web' : ''}`} onClick={() => handleSubcategoryClick(subcategory.id)}>
                <span className="submenu-item-name-web">{subcategory.name}</span>
                <span className="submenu-item-count-web">{subcategory.items.length} страв</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="hero-banner-web">
        <div className="hero-content-web">
          <div className="hero-text-web">
            <h1 className="hero-title-web">
              {language === 'uk' ? <>Користь<br/>азіатських<br/>супів</> : 
               language === 'en' ? <>Benefits<br/>of Asian<br/>Soups</> :
               language === 'ru' ? <>Польза<br/>азиатских<br/>супов</> : 
               <>Voordelen<br/>van Aziatische<br/>soepen</>}
            </h1>
          </div>
          <div className="hero-images-web">
            <div className="hero-image-item-web hero-image-1"><div className="hero-image-placeholder-web">🍜</div></div>
            <div className="hero-image-item-web hero-image-2"><div className="hero-image-placeholder-web">🍲</div></div>
            <div className="hero-image-item-web hero-image-3"><div className="hero-image-placeholder-web">🥘</div></div>
          </div>
        </div>
        <div className="hero-dots-web">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((_, i) => <span key={i} className={`hero-dot-web ${i === 0 ? 'active' : ''}`}></span>)}
        </div>
      </div>

      <div className="section-header-web">
        <h2 className="section-title-web">{t.section.title}</h2>
        <p className="section-description-web">{t.section.description}</p>
      </div>

      {selectedCategory === 'soups' && (
        <div className="soups-hero-section-web">
          <div className="soups-hero-images-web">
            <div className="soups-hero-image-item-web">
              <Image src="/A2FA8CCD-FB00-4849-BD71-14709C86DA7A.jpeg" alt="Рамен" width={600} height={600} className="soups-hero-image-web" style={{ objectFit: 'cover' }} />
            </div>
            <div className="soups-hero-image-item-web">
              <Image src="/A2FA8CCD-FB00-4849-BD71-14709C86DA7A.jpeg" alt="Рамен" width={600} height={600} className="soups-hero-image-web" style={{ objectFit: 'cover' }} />
            </div>
          </div>
        </div>
      )}

      <div className="menu-section-web">
        <h3 className="category-title-web">{categories.find(c => c.key === selectedCategory)?.name || ''}</h3>
        <div className="menu-items-grid-web">
          {filteredItems.map(item => (
            <div key={item.id} className="menu-item-card-web">
              {item.isTop && (
                <div className="top-badge-web"><span className="badge-icon-web">⚡</span><span className="badge-text-web">Топ продажів</span></div>
              )}
              <div className="item-image-web">
                {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover rounded-lg" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : item.emoji}
              </div>
              <div className="item-info-web">
                <h4 className="item-name-web">{item.name}</h4>
                <p className="item-description-web">{item.description}</p>
                <div className="item-footer-web">
                  <span className="item-price-web">{item.price} ₴</span>
                  <button className="add-btn-web" onClick={() => addToCart(item)}>+</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedCity && cities.length > 0 && isAdmin && (
        <div className="admin-panel-overlay-web">
          <div className="admin-panel-web">
            <div className="admin-panel-header-web"><h3>Управління зонами доставки</h3></div>
            <div className="admin-panel-content-web">
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#333' }}>Місто:</label>
                <select value={selectedCity.id} onChange={(e) => { const city = cities.find(c => c.id === e.target.value); if (city) setSelectedCity(city) }} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '2px solid #e5e7eb', fontSize: '14px', cursor: 'pointer' }}>
                  {cities.map(city => <option key={city.id} value={city.id}>{city.name}</option>)}
                </select>
              </div>
              <p>Зон доставки: <strong>{selectedCity.deliveryZones.length}</strong></p>
              <button className="add-zone-btn-web" onClick={handleAddZone}>➕ Додати зону доставки</button>
              {selectedCity.deliveryZones.length > 0 && (
                <div className="admin-zone-list-web">
                  {selectedCity.deliveryZones.map(zone => (
                    <div key={zone.id} className="admin-zone-item-web">
                      <div className="zone-color-box-web" style={{ backgroundColor: zone.color }}></div>
                      <span>{zone.name}</span>
                      <button className="delete-zone-btn-web" onClick={() => handleDeleteZone(zone.id)}>🗑️</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showCategoryAdmin && (
        <div className="admin-category-overlay-web" onClick={() => setShowCategoryAdmin(false)}>
          <div className="admin-category-panel-web" onClick={(e) => e.stopPropagation()}>
            <div className="admin-category-header-web">
              <h3>Управління категоріями меню</h3>
              <button className="admin-category-close-btn-web" onClick={() => setShowCategoryAdmin(false)}>×</button>
            </div>
            <div className="admin-category-content-web">
              <button className="add-category-btn-web" onClick={handleAddCategory}>➕ Додати категорію</button>
              <div className="admin-category-list-web">
                {menuCategories.map(category => (
                  <div key={category.id} className="admin-category-item-web">
                    <div className="admin-category-info-web">
                      <span className="admin-category-emoji-web">{category.emoji}</span>
                      <span className="admin-category-name-web">{category.name}</span>
                      <span className="admin-category-subcount-web">({category.subcategories.length} підкатегорій)</span>
                    </div>
                    <div className="admin-category-actions-web">
                      <button className="admin-edit-btn-web" onClick={() => { setEditingCategory(category); const name = prompt('Введіть нову назву:', category.name); if (name) handleEditCategory({ ...category, name }) }}>✏️</button>
                      <button className="admin-add-sub-btn-web" onClick={() => handleAddSubcategory(category.id)}>➕ Підкатегорія</button>
                      <button className="admin-delete-btn-web" onClick={() => handleDeleteCategory(category.id)}>🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={`sidebar-overlay-web ${isSidebarOpen ? 'active' : ''}`} onClick={toggleSidebar}></div>
      <div className={`sidebar-web ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header-web"><h2>Меню</h2><button className="sidebar-close-btn-web" onClick={toggleSidebar}>×</button></div>
        <div className="sidebar-content-web">
          <a href="#" className="sidebar-item-web">Главная</a>
          <a href="#" className="sidebar-item-web">Меню</a>
          <a href="#" className="sidebar-item-web">Акции</a>
          <a href="#" className="sidebar-item-web" onClick={(e) => { e.preventDefault(); handlePageOpen('delivery') }}>Доставка</a>
          {isAdmin && <a href="#" className="sidebar-item-web" onClick={(e) => { e.preventDefault(); setShowCategoryAdmin(true); toggleSidebar() }}>⚙️ Управління категоріями</a>}
          <a href="#" className="sidebar-item-web">О нас</a>
          <a href="#" className="sidebar-item-web">Контакты</a>
          {isAdmin && (
          <a 
            href="#" 
            className="sidebar-item-web" 
            onClick={(e) => { 
              e.preventDefault(); 
              handlePageOpen('admin'); 
              toggleSidebar(); // Закрываем меню после клика
            }}
            style={{ color: '#ec4899', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            🚀 Админ-панель
          </a>
        )}
        </div>
      </div>
    </div>
  )
}