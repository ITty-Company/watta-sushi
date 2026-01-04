'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { useLanguage } from '../context/LanguageContext'
import LanguageSelector from './LanguageSelector'
import PhoneView from './PhoneView'
import { NotificationsView } from './NotificationsView';
import FavoritesView from './FavoritesView' // Больше не используется как отдельная страница, но импорт можно оставить, если он нужен внутри профиля (хотя мы перенесли логику)
import ProfileView from './ProfileView'
import DeliveryView from './DeliveryView'
import AdminView from './AdminView'
// --- ВАЖНО: Импорты новых страниц ---
import PromotionsView from './PromotionsView'
import AboutView from './AboutView'
import AuthView from './AuthView'
import CartView from './CartView'
import { 
  Menu,       
  Phone,      
  Bell,       
  Heart,      
  User,       
  ShoppingBag,
  ArrowLeft 
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
  { id: 'rolls', key: 'rolls', name: 'Роллы', emoji: '🍣', subcategories: [] },
  { id: 'sushi', key: 'sushi', name: 'Суши', emoji: '🍱', subcategories: [] },
  { id: 'sets', key: 'sets', name: 'Сеты', emoji: '🍱', subcategories: [] },
  { id: 'soups', key: 'soups', name: 'Супы', emoji: '🍲', subcategories: [] },
  { id: 'bowls', key: 'bowls', name: 'Боули', emoji: '🥣', subcategories: [] },
  { id: 'snacks', key: 'snacks', name: 'Закуски', emoji: '🦐', subcategories: [] },
  { id: 'drinks', key: 'drinks', name: 'Напитки', emoji: '🥤', subcategories: [] },
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
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // --- ЗАГРУЗКА МЕНЮ С СЕРВЕРА ---
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        const realItems = data.map((p: any) => ({
          id: p.id,
          name: p.name_ru,
          description: p.description_ru || '',
          price: p.price,
          category: p.category?.name_ru || 'Роллы',
          emoji: '🍣',
          imageUrl: p.imageUrl,
          isTop: p.isPopular
        }));
        setMenuItems(realItems);
      })
      .catch(err => console.error('Ошибка загрузки меню:', err));
  }, []);

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
            setIsAdmin(parsed.isAdmin || false)
          } catch (e) { console.error(e) }
        }
      }
    }
    loadUser()
    window.addEventListener('userChanged', loadUser)
    return () => window.removeEventListener('userChanged', loadUser)
  }, [])

  // --- КАТЕГОРИИ ---
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>(defaultCategories)
  const [selectedCategory, setSelectedCategory] = useState('rolls')
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null)
  const [showSubmenu, setShowSubmenu] = useState(false)
  
  // Сохранение категорий
  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('menuCategories', JSON.stringify(menuCategories))
    }
  }, [menuCategories])
  
  const categoryMap: Record<string, string> = {
    'rolls': 'Роллы', 'sushi': 'Суши', 'sets': 'Сеты', 'soups': 'Супы',
    'bowls': 'Боули', 'snacks': 'Закуски', 'drinks': 'Напитки', 'sauces': 'Соуси'
  }
  
  const currentCategory = menuCategories.find(cat => cat.key === selectedCategory)
  
  // Фильтрация товаров
  const filteredItems = selectedSubcategory 
    ? currentCategory?.subcategories.find(sub => sub.id === selectedSubcategory)?.items || []
    : menuItems.filter(item => item.category === (categoryMap[selectedCategory] || 'Роллы'))

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
    setProfileInitialTab(tab) // 1. Задаем вкладку (например, Избранное)
    handlePageOpen('profile') // 2. Запускаем открытие профиля (далее сработает проверка Auth)
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
      alert('Добавлено в корзину!')
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

  const checkScrollButtons = (element: HTMLElement) => {
    if (element) {
      setCanScrollLeft(element.scrollLeft > 0)
      setCanScrollRight(element.scrollLeft < element.scrollWidth - element.clientWidth - 1)
    }
  }

  const CategoriesPanel = () => (
    <div className="categories-panel-wrapper-web">
      <button className={`categories-scroll-btn-web categories-scroll-left-web ${!canScrollLeft ? 'categories-scroll-btn-hidden-web' : ''}`} onClick={(e) => { const p = e.currentTarget.closest('.categories-panel-wrapper-web')?.querySelector('.categories-panel-web'); if(p) { p.scrollBy({ left: -200, behavior: 'smooth' }); setTimeout(() => checkScrollButtons(p as HTMLElement), 300) } }}>‹</button>
      <div className="categories-panel-web" onScroll={(e) => checkScrollButtons(e.currentTarget)}>
        {menuCategories.map(category => (
          <button key={category.key} className={`category-button-web ${selectedCategory === category.key ? 'category-button-active-web' : ''}`} onClick={() => { setSelectedCategory(category.key); setShowSubmenu(category.subcategories.length > 0); setSelectedSubcategory(null) }}>
            <div className="category-button-icon-web">{category.emoji}</div>
            <span className="category-button-label-web">{category.name}</span>
          </button>
        ))}
      </div>
      <button className={`categories-scroll-btn-web categories-scroll-right-web ${!canScrollRight ? 'categories-scroll-btn-hidden-web' : ''}`} onClick={(e) => { const p = e.currentTarget.closest('.categories-panel-wrapper-web')?.querySelector('.categories-panel-web'); if(p) { p.scrollBy({ left: 200, behavior: 'smooth' }); setTimeout(() => checkScrollButtons(p as HTMLElement), 300) } }}>›</button>
    </div>
  )

  // ============================================
  // ОТРИСОВКА СТРАНИЦ (PAGES)
  // ============================================

  if (activePage === 'phone') return <div className="full-page-web"><div className="full-page-header-web"><button className="back-button-web" onClick={handleClosePage}><ArrowLeft size={24}/></button><h1 className="full-page-title-web">Контакты</h1></div><div className="full-page-content-web"><PhoneView /></div></div>
  if (activePage === 'notifications') return <div className="full-page-web"><div className="full-page-header-web"><button className="back-button-web" onClick={handleClosePage}><ArrowLeft size={24}/></button><h1 className="full-page-title-web">Уведомления</h1></div><div className="full-page-content-web"><NotificationsView 
  isOpen={isNotificationsOpen} 
  onClose={() => setIsNotificationsOpen(false)} 
/></div></div>
  
  // УБРАЛИ ОТДЕЛЬНЫЙ БЛОК favorites - ТЕПЕРЬ ОН ВЕДЕТ В ПРОФИЛЬ

  // 4. ПРОФИЛЬ (С ЛОГИКОЙ АВТОРИЗАЦИИ И ТАБОВ)
  if (activePage === 'profile') {
    const isAuth = typeof window !== 'undefined' && localStorage.getItem('currentUser')
    
    if (!isAuth) {
      // ЕСЛИ НЕ ВОШЕЛ -> Окно входа
      return (
        <div className="full-page-web">
          <AuthView 
            onBack={handleClosePage}
            onLoginSuccess={() => {
              setActivePage('profile') 
              window.dispatchEvent(new Event('userChanged'))
            }}
          />
        </div>
      )
    }

    // ЕСЛИ ВОШЕЛ -> Кабинет
    return (
      <div className="full-page-web profile-page-full-web">
        <ProfileView 
          onBack={handleClosePage}
          onMenuClick={toggleSidebar}
          onOpenPhone={() => handlePageOpen('phone')}
          onOpenNotifications={() => handlePageOpen('notifications')}
          onOpenFavorites={() => openProfileTab('favorites')} // Переключаем вкладку внутри
          onOpenCart={openCart}
          onSelectCategory={(key) => { handleClosePage(); setSelectedCategory(key) }}
          initialTab={profileInitialTab} // <-- ПЕРЕДАЕМ ВЫБРАННУЮ ВКЛАДКУ
        />
      </div>
    )
  }

  if (activePage === 'admin') return <div className="full-page-web"><AdminView onBack={handleClosePage} /></div>
  if (activePage === 'delivery') return <div className="full-page-web"><div className="full-page-header-web"><button className="back-button-web" onClick={handleClosePage}><ArrowLeft size={24}/></button><h1 className="full-page-title-web">Доставка</h1></div><div className="full-page-content-web"><DeliveryView /></div></div>
  if (activePage === 'promotions') return <div className="full-page-web"><PromotionsView onBack={handleClosePage} onMenuClick={toggleSidebar} /></div>
  if (activePage === 'about') return <div className="full-page-web"><AboutView onBack={handleClosePage} onMenuClick={toggleSidebar} /></div>

  // СТРАНИЦА КОРЗИНЫ
  // Обратите внимание: мы передаем функции для навигации
  if (activePage === 'cart') { // Вам нужно убедиться, что activePage становится 'cart' при нажатии на сумку
    return (
      <div className="full-page-web">
        <CartView 
          onBack={handleClosePage}
          onOpenProfile={() => openProfileTab('history')}
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
    <div className="menu-page-web">
      <header className="app-header-web">
        <div className="header-content-web">
          <div className="logo-section-web" onClick={handleClosePage} style={{ cursor: 'pointer' }}>
            <div className="logo-icon-web"><Image src="/logo.png" alt="Logo" width={50} height={50} className="logo-image-web" priority style={{ objectFit: 'contain' }} /></div>
            <div className="logo-text-images-web"><Image src="/1.jpg" alt="WATTA SUSHI" width={180} height={60} className="logo-text-image-web" priority style={{ objectFit: 'contain' }} /></div>
          </div>
          <div className="location-section-web"><LanguageSelector /></div>
          
          {isAdmin && <button className="header-icon-btn-web" title="Админ" onClick={() => handlePageOpen('admin')} style={{ color: '#ec4899' }}><User size={24}/></button>}
          
          <div className="header-actions-web">
            <button className="header-icon-btn-web" onClick={() => handlePageOpen('phone')}><Phone size={24}/></button>
            <button 
              className="header-icon-btn-web" 
              onClick={() => setIsNotificationsOpen(true)} // <--- ВОТ ЗДЕСЬ ИЗМЕНЕНИЕ
            >
              <Bell size={24}/>
            </button>
            
            {/* ИСПРАВЛЕНИЕ: Сердце ведет в Профиль (Избранное) */}
            <button className="header-icon-btn-web" onClick={() => openProfileTab('favorites')}>
              <Heart size={24}/>
            </button>
            
            <button className="header-icon-btn-web relative" onClick={openCart}>
              <div style={{ position: 'relative' }}>
                <ShoppingBag size={24} />
                {cartCount > 0 && <span style={{ position: 'absolute', top: '-8px', right: '-8px', backgroundColor: '#ec4899', color: 'white', fontSize: '10px', fontWeight: 'bold', borderRadius: '50%', height: '16px', width: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{cartCount}</span>}
              </div>
            </button>

            {/* Профиль ведет в Профиль (История) */}
            <button className="header-icon-btn-web" onClick={() => openProfileTab('history')}>
              <User size={24}/>
            </button>
            
            <button className="header-icon-btn-web" onClick={toggleSidebar}><Menu size={24}/></button>
          </div>
        </div>
      </header>

      <CategoriesPanel />

      {showSubmenu && currentCategory && currentCategory.subcategories.length > 0 && (
        <div className="submenu-panel-web">
          <div className="submenu-header-web"><h3>{currentCategory.name}</h3><button className="submenu-close-btn-web" onClick={() => setShowSubmenu(false)}>×</button></div>
          <div className="submenu-content-web">{currentCategory.subcategories.map(sub => (<button key={sub.id} className={`submenu-item-web ${selectedSubcategory === sub.id ? 'submenu-item-active-web' : ''}`} onClick={() => setSelectedSubcategory(sub.id)}><span className="submenu-item-name-web">{sub.name}</span><span className="submenu-item-count-web">{sub.items.length} страв</span></button>))}</div>
        </div>
      )}

      <div className="hero-banner-web">
        <div className="hero-content-web">
          <div className="hero-text-web"><h1 className="hero-title-web">{language === 'uk' ? <>Користь<br/>азіатських<br/>супів</> : language === 'en' ? <>Benefits<br/>of Asian<br/>Soups</> : <>Польза<br/>азиатских<br/>супов</>}</h1></div>
          <div className="hero-images-web"><div className="hero-image-item-web hero-image-1"><div className="hero-image-placeholder-web">🍜</div></div><div className="hero-image-item-web hero-image-2"><div className="hero-image-placeholder-web">🍲</div></div><div className="hero-image-item-web hero-image-3"><div className="hero-image-placeholder-web">🥘</div></div></div>
        </div>
        <div className="hero-dots-web">{[1, 2, 3, 4, 5, 6, 7, 8].map((_, i) => <span key={i} className={`hero-dot-web ${i === 0 ? 'active' : ''}`}></span>)}</div>
      </div>

      <div className="section-header-web"><h2 className="section-title-web">{t.section.title}</h2><p className="section-description-web">{t.section.description}</p></div>
      
      <div className="menu-section-web">
        <h3 className="category-title-web">{menuCategories.find(c => c.key === selectedCategory)?.name || ''}</h3>
        <div className="menu-items-grid-web">
          {filteredItems.map(item => (
            <div key={item.id} className="menu-item-card-web">
              {item.isTop && <div className="top-badge-web"><span className="badge-icon-web">⚡</span><span className="badge-text-web">Топ продажів</span></div>}
              <div className="item-image-web">{item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover rounded-lg" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : item.emoji}</div>
              <div className="item-info-web"><h4 className="item-name-web">{item.name}</h4><p className="item-description-web">{item.description}</p><div className="item-footer-web"><span className="item-price-web">{item.price} ₴</span><button className="add-btn-web" onClick={() => addToCart(item)}>+</button></div></div>
            </div>
          ))}
        </div>
      </div>

      {/* Админ-панель категорий */}
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

      {/* --- ГЛОБАЛЬНЫЙ САЙДБАР (СПРАВА) --- */}
      <div className={`sidebar-overlay-web ${isSidebarOpen ? 'active' : ''}`} onClick={toggleSidebar} style={{ zIndex: 9998, position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)', opacity: isSidebarOpen ? 1 : 0, visibility: isSidebarOpen ? 'visible' : 'hidden', transition: 'opacity 0.3s ease-in-out, visibility 0.3s' }}></div>
      <div className={`sidebar-web ${isSidebarOpen ? 'open' : ''}`} style={{ zIndex: 9999, position: 'fixed', top: 0, right: 0, height: '100%', width: '300px', backgroundColor: '#fff', boxShadow: '-4px 0 15px rgba(0,0,0,0.1)', transform: isSidebarOpen ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 0.3s ease-in-out' }}>
        <div className="sidebar-header-web" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderBottom: '1px solid #eee' }}><h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>Меню</h2><button className="sidebar-close-btn-web" onClick={toggleSidebar} style={{ background: 'none', border: 'none', fontSize: '32px', cursor: 'pointer', lineHeight: 1 }}>×</button></div>
        <div className="sidebar-content-web" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <a href="#" className="sidebar-item-web" onClick={(e) => { e.preventDefault(); toggleSidebar(); handleClosePage() }}>Главная</a>
          <a href="#" className="sidebar-item-web" onClick={(e) => { e.preventDefault(); toggleSidebar(); handleClosePage() }}>Меню</a>
          <a href="#" className="sidebar-item-web" onClick={(e) => { e.preventDefault(); toggleSidebar(); handlePageOpen('promotions') }}>Акции</a>
          <a href="#" className="sidebar-item-web" onClick={(e) => { e.preventDefault(); toggleSidebar(); handlePageOpen('delivery') }}>Доставка</a>
          
          {isAdmin && <a href="#" className="sidebar-item-web" onClick={(e) => { e.preventDefault(); toggleSidebar(); }}>⚙️ Категории</a>}
          
          <a href="#" className="sidebar-item-web" onClick={(e) => { e.preventDefault(); toggleSidebar(); handlePageOpen('about') }}>О нас</a>
          <a href="#" className="sidebar-item-web" onClick={(e) => { e.preventDefault(); toggleSidebar(); handlePageOpen('phone') }}>Контакты</a>
          
          {/* ИСПРАВЛЕНИЕ: Ссылка "Избранное" в меню тоже должна вести в Профиль */}
          {/* Можно добавить, если нужно, хотя кнопки в хедере достаточно */}
          
          {isAdmin && <a href="#" className="sidebar-item-web" onClick={(e) => { e.preventDefault(); toggleSidebar(); handlePageOpen('admin'); }} style={{ color: '#ec4899', fontWeight: 'bold', marginTop: '20px' }}>🚀 Админ-панель</a>}
        </div>
      </div>
      <NotificationsView 
        isOpen={isNotificationsOpen} 
        onClose={() => setIsNotificationsOpen(false)} 
      />
    </div>
  )
}