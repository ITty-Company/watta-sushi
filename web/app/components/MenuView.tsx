// 'use client'

// import { useState, useEffect, useRef } from 'react'
// import Image from 'next/image'
// import { useLanguage } from '../context/LanguageContext'
// import { LanguageSelector } from './LanguageSelector'
// import PhoneView from './PhoneView'
// import { NotificationsView } from './NotificationsView';
// import FavoritesView from './FavoritesView' // Больше не используется как отдельная страница, но импорт можно оставить, если он нужен внутри профиля (хотя мы перенесли логику)
// import ProfileView from './ProfileView'
// import DeliveryView from './DeliveryView'
// import AdminView from './AdminView'
// // --- ВАЖНО: Импорты новых страниц ---
// import PromotionsView from './PromotionsView'
// import AboutView from './AboutView'
// import AuthView from './AuthView'
// import CartView from './CartView'
// import { 
//   Menu,       
//   Phone,      
//   Bell,       
//   Heart,      
//   User,       
//   ShoppingBag,
//   ArrowLeft 
// } from 'lucide-react'

// // --- ТИПЫ ДАННЫХ ---
// interface City {
//   id: string
//   name: string
//   coordinates: { lat: number; lng: number }
//   zoom: number
//   deliveryZones: DeliveryZone[]
// }

// interface DeliveryZone {
//   id: string
//   name: string
//   color: string
//   coordinates: { lat: number; lng: number }[]
// }

// const defaultCities: City[] = [
//   {
//     id: 'kyiv',
//     name: 'Киев',
//     coordinates: { lat: 50.4501, lng: 30.5234 },
//     zoom: 11,
//     deliveryZones: []
//   }
// ]

// interface MenuItem {
//   id: number
//   name: string
//   description: string
//   price: number
//   category: string
//   subcategory?: string
//   emoji: string
//   isTop?: boolean
//   imageUrl?: string;
// }

// interface MenuCategory {
//   id: string
//   key: string
//   name: string
//   emoji: string
//   subcategories: MenuSubcategory[]
// }

// interface MenuSubcategory {
//   id: string
//   name: string
//   items: MenuItem[]
// }

// const defaultCategories: MenuCategory[] = [
//   { id: 'rolls', key: 'rolls', name: 'Роллы', emoji: '🍣', subcategories: [] },
//   { id: 'sushi', key: 'sushi', name: 'Суши', emoji: '🍱', subcategories: [] },
//   { id: 'sets', key: 'sets', name: 'Сеты', emoji: '🍱', subcategories: [] },
//   { id: 'soups', key: 'soups', name: 'Супы', emoji: '🍲', subcategories: [] },
//   { id: 'bowls', key: 'bowls', name: 'Боули', emoji: '🥣', subcategories: [] },
//   { id: 'snacks', key: 'snacks', name: 'Закуски', emoji: '🦐', subcategories: [] },
//   { id: 'drinks', key: 'drinks', name: 'Напитки', emoji: '🥤', subcategories: [] },
//   { id: 'sauces', key: 'sauces', name: 'Соуси', emoji: '🍶', subcategories: [] }
// ]

// interface User {
//   id: string
//   name: string
//   email: string
//   phone: string
//   address: string
//   isAdmin: boolean
//   createdAt: string
// }

// export default function MenuView() {
//   const { t, language } = useLanguage()
//   const scrollContainerRef = useRef<HTMLDivElement>(null)

//   // --- ЗАГРУЗКА МЕНЮ С СЕРВЕРА ---
//   const [menuItems, setMenuItems] = useState<MenuItem[]>([])
//   useEffect(() => {
//     fetch('/api/products')
//       .then(res => res.json())
//       .then(data => {
//         const realItems = data.map((p: any) => ({
//           id: p.id,
//           name: p.name_ru,
//           description: p.description_ru || '',
//           price: p.price,
//           category: p.category?.name_ru || 'Роллы',
//           emoji: '🍣',
//           imageUrl: p.imageUrl,
//           isTop: p.isPopular
//         }));
//         setMenuItems(realItems);
//       })
//       .catch(err => console.error('Ошибка загрузки меню:', err));
//   }, []);

//   // --- КОРЗИНА ---
//   const [cartCount, setCartCount] = useState(0)

//   useEffect(() => {
//     const updateCount = () => {
//       if (typeof window !== 'undefined' && window.localStorage) {
//         const cart = JSON.parse(localStorage.getItem('cart') || '[]')
//         setCartCount(cart.length)
//       }
//     }
//     updateCount()
//     window.addEventListener('cartUpdated', updateCount)
//     return () => window.removeEventListener('cartUpdated', updateCount)
//   }, [])

//   const openCart = () => {
//     handlePageOpen('cart')
//   }
//   const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

//   // --- ПОЛЬЗОВАТЕЛЬ И АДМИН ---
//   const [currentUser, setCurrentUser] = useState<User | null>(null)
//   const [isAdmin, setIsAdmin] = useState(false)
  
//   useEffect(() => {
//     if (typeof window === 'undefined') return
//     const loadUser = () => {
//       if (window.localStorage) {
//         const savedUser = localStorage.getItem('currentUser')
//         if (savedUser) {
//           try {
//             const parsed = JSON.parse(savedUser)
//             setCurrentUser(parsed)
//             setIsAdmin(parsed.isAdmin || false)
//           } catch (e) { console.error(e) }
//         }
//       }
//     }
//     loadUser()
//     window.addEventListener('userChanged', loadUser)
//     return () => window.removeEventListener('userChanged', loadUser)
//   }, [])

//   // --- КАТЕГОРИИ ---
//   const [menuCategories, setMenuCategories] = useState<MenuCategory[]>(defaultCategories)
//   const [selectedCategory, setSelectedCategory] = useState('rolls')
//   const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null)
//   const [showSubmenu, setShowSubmenu] = useState(false)
  
//   // Сохранение категорий
//   useEffect(() => {
//     if (typeof window !== 'undefined' && window.localStorage) {
//       localStorage.setItem('menuCategories', JSON.stringify(menuCategories))
//     }
//   }, [menuCategories])
  
//   const categoryMap: Record<string, string> = {
//     'rolls': 'Роллы', 'sushi': 'Суши', 'sets': 'Сеты', 'soups': 'Супы',
//     'bowls': 'Боули', 'snacks': 'Закуски', 'drinks': 'Напитки', 'sauces': 'Соуси'
//   }
  
//   const currentCategory = menuCategories.find(cat => cat.key === selectedCategory)
  
//   // Фильтрация товаров
//   const filteredItems = selectedSubcategory 
//     ? currentCategory?.subcategories.find(sub => sub.id === selectedSubcategory)?.items || []
//     : menuItems.filter(item => item.category === (categoryMap[selectedCategory] || 'Роллы'))

//   // --- НАВИГАЦИЯ ---
//   const [activePage, setActivePage] = useState<string | null>(null)
//   const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  
//   // НОВЫЙ СТЕЙТ: Какую вкладку открыть в профиле
//   const [profileInitialTab, setProfileInitialTab] = useState<'history' | 'address' | 'favorites'>('history')

//   const handlePageOpen = (page: string) => {
//     setActivePage(page)
//     setIsSidebarOpen(false)
//     setTimeout(() => {
//       window.scrollTo({ top: 0, behavior: 'smooth' })
//     }, 100)
//   }
  
//   const handleClosePage = () => {
//     setActivePage(null)
//     setShowSubmenu(false)
//     setSelectedSubcategory(null)
//   }
  
//   const toggleSidebar = () => {
//     setIsSidebarOpen(!isSidebarOpen)
//     if (activePage) setActivePage(null)
//   }

//   // --- ФУНКЦИЯ ДЛЯ ОТКРЫТИЯ ПРОФИЛЯ С КОНКРЕТНОЙ ВКЛАДКОЙ ---
//   const openProfileTab = (tab: 'history' | 'address' | 'favorites') => {
//     setProfileInitialTab(tab) // 1. Задаем вкладку (например, Избранное)
//     handlePageOpen('profile') // 2. Запускаем открытие профиля (далее сработает проверка Auth)
//   }

//   // --- АДМИНСКИЕ ФУНКЦИИ ---
//   const [showCategoryAdmin, setShowCategoryAdmin] = useState(false)
//   const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null)
//   const [editingSubcategory, setEditingSubcategory] = useState<{ categoryId: string; subcategory: MenuSubcategory | null } | null>(null)

//   const handleAddCategory = () => {
//     const name = prompt('Введіть назву категорії:')
//     if (!name || !name.trim()) return
//     const emoji = prompt('Введіть емодзі для категорії:') || '📦'
//     const key = name.toLowerCase().replace(/\s+/g, '-')
//     const newCategory: MenuCategory = { id: `cat-${Date.now()}`, key, name: name.trim(), emoji, subcategories: [] }
//     setMenuCategories([...menuCategories, newCategory])
//   }
  
//   const handleEditCategory = (category: MenuCategory) => {
//     const name = prompt('Введіть нову назву категорії:', category.name)
//     if (!name || !name.trim()) return
//     const emoji = prompt('Введіть нове емодзі:', category.emoji) || category.emoji
//     setMenuCategories(menuCategories.map(cat => cat.id === category.id ? { ...cat, name: name.trim(), emoji } : cat))
//     setEditingCategory(null)
//   }
  
//   const handleDeleteCategory = (categoryId: string) => {
//     if (confirm('Ви впевнені, що хочете видалити цю категорію?')) {
//       setMenuCategories(menuCategories.filter(cat => cat.id !== categoryId))
//       if (selectedCategory === menuCategories.find(cat => cat.id === categoryId)?.key) setSelectedCategory('soups')
//     }
//   }
  
//   const handleAddSubcategory = (categoryId: string) => {
//     const name = prompt('Введіть назву підкатегорії:')
//     if (!name || !name.trim()) return
//     const newSubcategory: MenuSubcategory = { id: `sub-${Date.now()}`, name: name.trim(), items: [] }
//     setMenuCategories(menuCategories.map(cat => cat.id === categoryId ? { ...cat, subcategories: [...cat.subcategories, newSubcategory] } : cat))
//   }

//   // --- ДОБАВЛЕНИЕ В КОРЗИНУ ---
//   const addToCart = (item: MenuItem) => {
//     if (typeof window !== 'undefined' && window.localStorage) {
//       const cart = JSON.parse(localStorage.getItem('cart') || '[]')
//       cart.push(item)
//       localStorage.setItem('cart', JSON.stringify(cart))
//       const event = new CustomEvent('cartUpdated')
//       window.dispatchEvent(event)
//       alert('Добавлено в корзину!')
//     }
//   }
  
//   // --- АДМИНКА ЗОН ДОСТАВКИ ---
//   const [cities, setCities] = useState<City[]>(defaultCities)
//   const [selectedCity, setSelectedCity] = useState<City>(defaultCities[0])
  
//   useEffect(() => {
//     if (typeof window !== 'undefined' && window.localStorage) {
//       localStorage.setItem('deliveryZones', JSON.stringify(cities))
//     }
//   }, [cities])
  
//   const handleAddZone = () => {
//     const zoneName = prompt('Введіть назву зони доставки:')
//     if (!zoneName || !zoneName.trim()) return
//     const colors = ['#4ade80', '#22c55e', '#10b981', '#059669', '#047857', '#065f46']
//     const newZone: DeliveryZone = { id: `zone-${Date.now()}`, name: zoneName, color: colors[Math.floor(Math.random() * colors.length)], coordinates: [] }
//     const updatedCities = cities.map(city => city.id === selectedCity.id ? { ...city, deliveryZones: [...city.deliveryZones, newZone] } : city)
//     setCities(updatedCities)
//     setSelectedCity(updatedCities.find(c => c.id === selectedCity.id)!)
//   }
  
//   const handleDeleteZone = (zoneId: string) => {
//     if (!confirm('Ви впевнені, що хочете видалити цю зону?')) return
//     const updatedCities = cities.map(city => city.id === selectedCity.id ? { ...city, deliveryZones: city.deliveryZones.filter(z => z.id !== zoneId) } : city)
//     setCities(updatedCities)
//     setSelectedCity(updatedCities.find(c => c.id === selectedCity.id)!)
//   }

//   // --- СКРОЛЛ КАТЕГОРИЙ ---
//   const [canScrollLeft, setCanScrollLeft] = useState(false)
//   const [canScrollRight, setCanScrollRight] = useState(true)

//   const checkScrollButtons = (element: HTMLElement) => {
//     if (element) {
//       setCanScrollLeft(element.scrollLeft > 0)
//       setCanScrollRight(element.scrollLeft < element.scrollWidth - element.clientWidth - 1)
//     }
//   }

//   const CategoriesPanel = () => (
//     <div className="categories-panel-wrapper-web">
//       <button className={`categories-scroll-btn-web categories-scroll-left-web ${!canScrollLeft ? 'categories-scroll-btn-hidden-web' : ''}`} onClick={(e) => { const p = e.currentTarget.closest('.categories-panel-wrapper-web')?.querySelector('.categories-panel-web'); if(p) { p.scrollBy({ left: -200, behavior: 'smooth' }); setTimeout(() => checkScrollButtons(p as HTMLElement), 300) } }}>‹</button>
//       <div className="categories-panel-web" onScroll={(e) => checkScrollButtons(e.currentTarget)}>
//         {menuCategories.map(category => (
//           <button key={category.key} className={`category-button-web ${selectedCategory === category.key ? 'category-button-active-web' : ''}`} onClick={() => { setSelectedCategory(category.key); setShowSubmenu(category.subcategories.length > 0); setSelectedSubcategory(null) }}>
//             <div className="category-button-icon-web">{category.emoji}</div>
//             <span className="category-button-label-web">{category.name}</span>
//           </button>
//         ))}
//       </div>
//       <button className={`categories-scroll-btn-web categories-scroll-right-web ${!canScrollRight ? 'categories-scroll-btn-hidden-web' : ''}`} onClick={(e) => { const p = e.currentTarget.closest('.categories-panel-wrapper-web')?.querySelector('.categories-panel-web'); if(p) { p.scrollBy({ left: 200, behavior: 'smooth' }); setTimeout(() => checkScrollButtons(p as HTMLElement), 300) } }}>›</button>
//     </div>
//   )

//   // ============================================
//   // ОТРИСОВКА СТРАНИЦ (PAGES)
//   // ============================================

//   if (activePage === 'phone') return <div className="full-page-web"><div className="full-page-header-web"><button className="back-button-web" onClick={handleClosePage}><ArrowLeft size={24}/></button><h1 className="full-page-title-web">Контакты</h1></div><div className="full-page-content-web"><PhoneView /></div></div>
//   if (activePage === 'notifications') return <div className="full-page-web"><div className="full-page-header-web"><button className="back-button-web" onClick={handleClosePage}><ArrowLeft size={24}/></button><h1 className="full-page-title-web">Уведомления</h1></div><div className="full-page-content-web"><NotificationsView 
//   isOpen={isNotificationsOpen} 
//   onClose={() => setIsNotificationsOpen(false)} 
// /></div></div>
  
//   // УБРАЛИ ОТДЕЛЬНЫЙ БЛОК favorites - ТЕПЕРЬ ОН ВЕДЕТ В ПРОФИЛЬ

//   // 4. ПРОФИЛЬ (С ЛОГИКОЙ АВТОРИЗАЦИИ И ТАБОВ)
//   if (activePage === 'profile') {
//     const isAuth = typeof window !== 'undefined' && localStorage.getItem('currentUser')
    
//     if (!isAuth) {
//       // ЕСЛИ НЕ ВОШЕЛ -> Окно входа
//       return (
//         <div className="full-page-web">
//           <AuthView 
//             onBack={handleClosePage}
//             onLoginSuccess={() => {
//               setActivePage('profile') 
//               window.dispatchEvent(new Event('userChanged'))
//             }}
//           />
//         </div>
//       )
//     }

//     // ЕСЛИ ВОШЕЛ -> Кабинет
//     return (
//       <div className="full-page-web profile-page-full-web">
//         <ProfileView 
//           onBack={handleClosePage}
//           onMenuClick={toggleSidebar}
//           onOpenPhone={() => handlePageOpen('phone')}
//           onOpenNotifications={() => handlePageOpen('notifications')}
//           onOpenFavorites={() => openProfileTab('favorites')} // Переключаем вкладку внутри
//           onOpenCart={openCart}
//           onSelectCategory={(key) => { handleClosePage(); setSelectedCategory(key) }}
//           onOpenAdmin={() => setActivePage('admin')}
//           initialTab={profileInitialTab} // <-- ПЕРЕДАЕМ ВЫБРАННУЮ ВКЛАДКУ
//         />
        
//       </div>
//     )
//   }

//  if (activePage === 'admin') {
//     return (
//       <div className="full-page-web">
//         <AdminView onBack={handleClosePage} />
//       </div>
//     )
//   }
//   if (activePage === 'delivery') return <div className="full-page-web"><div className="full-page-header-web"><button className="back-button-web" onClick={handleClosePage}><ArrowLeft size={24}/></button><h1 className="full-page-title-web">Доставка</h1></div><div className="full-page-content-web"><DeliveryView /></div></div>
//   if (activePage === 'promotions') return <div className="full-page-web"><PromotionsView onBack={handleClosePage} onMenuClick={toggleSidebar} /></div>
//   if (activePage === 'about') return <div className="full-page-web"><AboutView onBack={handleClosePage} onMenuClick={toggleSidebar} /></div>

//   // СТРАНИЦА КОРЗИНЫ
//   // Обратите внимание: мы передаем функции для навигации
//   if (activePage === 'cart') {
//     return (
//       <div className="full-page-web">
//         <CartView 
//           onBack={handleClosePage}
//           // Связываем кнопки хедеров с функциями навигации
//           onOpenProfile={() => openProfileTab('history')}
//           onOpenFavorites={() => openProfileTab('favorites')} // <-- Вот это важно
//           onOpenPhone={() => handlePageOpen('phone')}
//           onOpenNotifications={() => handlePageOpen('notifications')}
//           onMenuClick={toggleSidebar}
//         />
//       </div>
//     )
//   }

//   // ============================================
//   // ГЛАВНЫЙ ЭКРАН (МЕНЮ)
//   // ============================================
//   return (
//     <div className="menu-page-web">
//       <header className="app-header-web">
//         <div className="header-content-web">
//           <div className="logo-section-web" onClick={handleClosePage} style={{ cursor: 'pointer' }}>
//             <div className="logo-icon-web"><Image src="/logo.png" alt="Logo" width={50} height={50} className="logo-image-web" priority style={{ objectFit: 'contain' }} /></div>
//             <div className="logo-text-images-web"><Image src="/1.jpg" alt="WATTA SUSHI" width={180} height={60} className="logo-text-image-web" priority style={{ objectFit: 'contain' }} /></div>
//           </div>
//           <div className="location-section-web"><LanguageSelector /></div>
          
//           {isAdmin && <button className="header-icon-btn-web" title="Админ" onClick={() => handlePageOpen('admin')} style={{ color: '#ec4899' }}><User size={24}/></button>}
          
//           <div className="header-actions-web">
//             <button className="header-icon-btn-web" onClick={() => handlePageOpen('phone')}><Phone size={24}/></button>
//             <button 
//               className="header-icon-btn-web" 
//               onClick={() => setIsNotificationsOpen(true)} // <--- ВОТ ЗДЕСЬ ИЗМЕНЕНИЕ
//             >
//               <Bell size={24}/>
//             </button>
            
//             {/* ИСПРАВЛЕНИЕ: Сердце ведет в Профиль (Избранное) */}
//             <button className="header-icon-btn-web" onClick={() => openProfileTab('favorites')}>
//               <Heart size={24}/>
//             </button>
            
//             <button className="header-icon-btn-web relative" onClick={openCart}>
//               <div style={{ position: 'relative' }}>
//                 <ShoppingBag size={24} />
//                 {cartCount > 0 && <span style={{ position: 'absolute', top: '-8px', right: '-8px', backgroundColor: '#ec4899', color: 'white', fontSize: '10px', fontWeight: 'bold', borderRadius: '50%', height: '16px', width: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{cartCount}</span>}
//               </div>
//             </button>

//             {/* Профиль ведет в Профиль (История) */}
//             <button className="header-icon-btn-web" onClick={() => openProfileTab('history')}>
//               <User size={24}/>
//             </button>
            
//             <button className="header-icon-btn-web" onClick={toggleSidebar}><Menu size={24}/></button>
//           </div>
//         </div>
//       </header>

//       <CategoriesPanel />

//       {showSubmenu && currentCategory && currentCategory.subcategories.length > 0 && (
//         <div className="submenu-panel-web">
//           <div className="submenu-header-web"><h3>{currentCategory.name}</h3><button className="submenu-close-btn-web" onClick={() => setShowSubmenu(false)}>×</button></div>
//           <div className="submenu-content-web">{currentCategory.subcategories.map(sub => (<button key={sub.id} className={`submenu-item-web ${selectedSubcategory === sub.id ? 'submenu-item-active-web' : ''}`} onClick={() => setSelectedSubcategory(sub.id)}><span className="submenu-item-name-web">{sub.name}</span><span className="submenu-item-count-web">{sub.items.length} страв</span></button>))}</div>
//         </div>
//       )}

//       <div className="hero-banner-web">
//         <div className="hero-content-web">
//           <div className="hero-text-web"><h1 className="hero-title-web">{language === 'uk' ? <>Користь<br/>азіатських<br/>супів</> : language === 'en' ? <>Benefits<br/>of Asian<br/>Soups</> : <>Польза<br/>азиатских<br/>супов</>}</h1></div>
//           <div className="hero-images-web"><div className="hero-image-item-web hero-image-1"><div className="hero-image-placeholder-web">🍜</div></div><div className="hero-image-item-web hero-image-2"><div className="hero-image-placeholder-web">🍲</div></div><div className="hero-image-item-web hero-image-3"><div className="hero-image-placeholder-web">🥘</div></div></div>
//         </div>
//         <div className="hero-dots-web">{[1, 2, 3, 4, 5, 6, 7, 8].map((_, i) => <span key={i} className={`hero-dot-web ${i === 0 ? 'active' : ''}`}></span>)}</div>
//       </div>

//       <div className="section-header-web"><h2 className="section-title-web">{t.section.title}</h2><p className="section-description-web">{t.section.description}</p></div>
      
//       <div className="menu-section-web">
//         <h3 className="category-title-web">{menuCategories.find(c => c.key === selectedCategory)?.name || ''}</h3>
//         <div className="menu-items-grid-web">
//           {filteredItems.map(item => (
//             <div key={item.id} className="menu-item-card-web">
//               {item.isTop && <div className="top-badge-web"><span className="badge-icon-web">⚡</span><span className="badge-text-web">Топ продажів</span></div>}
//               <div className="item-image-web">{item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover rounded-lg" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : item.emoji}</div>
//               <div className="item-info-web"><h4 className="item-name-web">{item.name}</h4><p className="item-description-web">{item.description}</p><div className="item-footer-web"><span className="item-price-web">{item.price} ₴</span><button className="add-btn-web" onClick={() => addToCart(item)}>+</button></div></div>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* Админ-панель категорий */}
//       {showCategoryAdmin && (
//         <div className="admin-category-overlay-web" onClick={() => setShowCategoryAdmin(false)}>
//           <div className="admin-category-panel-web" onClick={(e) => e.stopPropagation()}>
//             <div className="admin-category-header-web"><h3>Управління категоріями меню</h3><button className="admin-category-close-btn-web" onClick={() => setShowCategoryAdmin(false)}>×</button></div>
//             <div className="admin-category-content-web">
//               <button className="add-category-btn-web" onClick={handleAddCategory}>➕ Додати категорію</button>
//               <div className="admin-category-list-web">{menuCategories.map(cat => (<div key={cat.id} className="admin-category-item-web"><div className="admin-category-info-web"><span className="admin-category-emoji-web">{cat.emoji}</span><span className="admin-category-name-web">{cat.name}</span><span className="admin-category-subcount-web">({cat.subcategories.length} підкатегорій)</span></div><div className="admin-category-actions-web"><button className="admin-edit-btn-web" onClick={() => { setEditingCategory(cat); const name = prompt('Введіть нову назву:', cat.name); if (name) handleEditCategory({ ...cat, name }) }}>✏️</button><button className="admin-add-sub-btn-web" onClick={() => handleAddSubcategory(cat.id)}>➕ Підкатегорія</button><button className="admin-delete-btn-web" onClick={() => handleDeleteCategory(cat.id)}>🗑️</button></div></div>))}</div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* --- ГЛОБАЛЬНЫЙ САЙДБАР (СПРАВА) --- */}
//       <div className={`sidebar-overlay-web ${isSidebarOpen ? 'active' : ''}`} onClick={toggleSidebar} style={{ zIndex: 9998, position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)', opacity: isSidebarOpen ? 1 : 0, visibility: isSidebarOpen ? 'visible' : 'hidden', transition: 'opacity 0.3s ease-in-out, visibility 0.3s' }}></div>
//       <div className={`sidebar-web ${isSidebarOpen ? 'open' : ''}`} style={{ zIndex: 9999, position: 'fixed', top: 0, right: 0, height: '100%', width: '300px', backgroundColor: '#fff', boxShadow: '-4px 0 15px rgba(0,0,0,0.1)', transform: isSidebarOpen ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 0.3s ease-in-out' }}>
//         <div className="sidebar-header-web" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderBottom: '1px solid #eee' }}><h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>Меню</h2><button className="sidebar-close-btn-web" onClick={toggleSidebar} style={{ background: 'none', border: 'none', fontSize: '32px', cursor: 'pointer', lineHeight: 1 }}>×</button></div>
//         <div className="sidebar-content-web" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
//           <a href="#" className="sidebar-item-web" onClick={(e) => { e.preventDefault(); toggleSidebar(); handleClosePage() }}>Главная</a>
//           <a href="#" className="sidebar-item-web" onClick={(e) => { e.preventDefault(); toggleSidebar(); handleClosePage() }}>Меню</a>
//           <a href="#" className="sidebar-item-web" onClick={(e) => { e.preventDefault(); toggleSidebar(); handlePageOpen('promotions') }}>Акции</a>
//           <a href="#" className="sidebar-item-web" onClick={(e) => { e.preventDefault(); toggleSidebar(); handlePageOpen('delivery') }}>Доставка</a>
          
//           {isAdmin && <a href="#" className="sidebar-item-web" onClick={(e) => { e.preventDefault(); toggleSidebar(); }}>⚙️ Категории</a>}
          
//           <a href="#" className="sidebar-item-web" onClick={(e) => { e.preventDefault(); toggleSidebar(); handlePageOpen('about') }}>О нас</a>
//           <a href="#" className="sidebar-item-web" onClick={(e) => { e.preventDefault(); toggleSidebar(); handlePageOpen('phone') }}>Контакты</a>
          
//           {/* ИСПРАВЛЕНИЕ: Ссылка "Избранное" в меню тоже должна вести в Профиль */}
//           {/* Можно добавить, если нужно, хотя кнопки в хедере достаточно */}
          
//           {isAdmin && <a href="#" className="sidebar-item-web" onClick={(e) => { e.preventDefault(); toggleSidebar(); handlePageOpen('admin'); }} style={{ color: '#ec4899', fontWeight: 'bold', marginTop: '20px' }}>🚀 Админ-панель</a>}
//         </div>
//       </div>
//       <NotificationsView 
//         isOpen={isNotificationsOpen} 
//         onClose={() => setIsNotificationsOpen(false)} 
//       />
//     </div>
//   )
// }

'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { useLanguage } from '../context/LanguageContext'
import { LanguageSelector } from './LanguageSelector'
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
  Sparkles
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

  // --- ГОРОДА ДОСТАВКИ ---
  const [deliveryCities, setDeliveryCities] = useState<{id: number, name: string, name_nl?: string}[]>([])
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null)
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false)
  const cityDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/cities')
      .then(res => res.json())
      .then(data => {
        setDeliveryCities(data)
        if (data.length > 0 && !selectedCityId) {
          setSelectedCityId(data[0].id)
        }
      })
      .catch(err => console.error('Ошибка загрузки городов:', err))
  }, [])

  // Закрытие dropdown при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(event.target as Node)) {
        setIsCityDropdownOpen(false)
      }
    }

    if (isCityDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isCityDropdownOpen])

  // --- ЗАГРУЗКА МЕНЮ С СЕРВЕРА ---
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  
  useEffect(() => {
    const url = selectedCityId ? `/api/products?cityId=${selectedCityId}` : '/api/products'
    fetch(url)
      .then(res => res.json())
      .then(data => {
        const realItems = data.map((p: any) => ({
          id: p.id,
          // ВАЖНО: Локализуем имя, описание и категорию
          name: getLocalized(p, 'name'), 
          description: getLocalized(p, 'description') || '',
          price: p.price,
          category: getLocalized(p.category, 'name') || 'Роллы', 
          emoji: '🍣',
          imageUrl: p.imageUrl,
          isTop: p.isPopular
        }));
        setMenuItems(realItems);
      })
      .catch(err => console.error('Ошибка загрузки меню:', err));
  }, [language, getLocalized, selectedCityId]); // Перезагружаем при смене языка или города

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
  // Обновляем названия категорий при смене языка
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>(defaultCategories)
  
  useEffect(() => {
    // Обновляем названия категорий из переводов
    const updatedCategories = defaultCategories.map(cat => ({
      ...cat,
      name: t.categories[cat.key as keyof typeof t.categories] || cat.name
    }))
    setMenuCategories(updatedCategories)
  }, [language, t.categories])

  const [selectedCategory, setSelectedCategory] = useState('rolls')
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null)
  const [showSubmenu, setShowSubmenu] = useState(false)
  
  const currentCategory = menuCategories.find(cat => cat.key === selectedCategory)
  
  // Фильтрация товаров
  const filteredItems = selectedSubcategory 
    ? currentCategory?.subcategories.find(sub => sub.id === selectedSubcategory)?.items || []
    : menuItems.filter(item => {
        // Получаем переведенное название текущей выбранной категории
        const currentCategoryName = t.categories[selectedCategory as keyof typeof t.categories];
        // Сравниваем с категорией товара (которая тоже переведена через getLocalized)
        return item.category === currentCategoryName;
      })

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
  if (activePage === 'promotions') return <div className="full-page-web"><PromotionsView onBack={handleClosePage} onMenuClick={toggleSidebar} /></div>
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
    <div className="menu-page-web relative">
      <LogoBackground />
      <header className="app-header-web relative z-10" style={{
        background: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.95) 100%)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)',
        borderBottom: '1px solid rgba(0,0,0,0.06)'
      }}>
        <div className="header-content-web">
          <div className="logo-section-web" onClick={handleClosePage} style={{ cursor: 'pointer' }}>
            <div className="logo-icon-web"><Image src="/logo.png" alt="Logo" width={50} height={50} className="logo-image-web" priority style={{ objectFit: 'contain' }} /></div>
            <div className="logo-text-images-web"><Image src="/1.jpg" alt="WATTA SUSHI" width={180} height={60} className="logo-text-image-web" priority style={{ objectFit: 'contain' }} /></div>
          </div>
          
          {/* Центральная навигация для десктопа */}
          <div className="header-center-nav-web" style={{
            display: 'none',
            alignItems: 'center',
            gap: '24px',
            flex: 1,
            justifyContent: 'center',
            padding: '0 20px'
          }}>
            <div 
              ref={cityDropdownRef}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '6px',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
              onClick={() => setIsCityDropdownOpen(!isCityDropdownOpen)}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(20,81,66,0.05)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <div style={{ 
                width: '24px', 
                height: '16px', 
                background: 'linear-gradient(180deg, #AE1C28 0%, #AE1C28 50%, #FFFFFF 50%, #FFFFFF 100%)', 
                borderRadius: '2px', 
                flexShrink: 0,
                border: '1px solid rgba(0,0,0,0.1)'
              }}></div>
              <span style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>Нидерланды</span>
              {selectedCityId && deliveryCities.find(c => c.id === selectedCityId) && (
                <span style={{ fontSize: '14px', fontWeight: '500', color: '#666' }}>
                  {deliveryCities.find(c => c.id === selectedCityId)?.name_nl || deliveryCities.find(c => c.id === selectedCityId)?.name}
                </span>
              )}
              {isCityDropdownOpen && deliveryCities.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  left: 0,
                  background: 'white',
                  borderRadius: '8px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                  border: '1px solid rgba(0,0,0,0.1)',
                  minWidth: '200px',
                  zIndex: 1000,
                  maxHeight: '300px',
                  overflowY: 'auto'
                }}>
                  {deliveryCities.map(city => (
                    <div
                      key={city.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedCityId(city.id)
                        setIsCityDropdownOpen(false)
                      }}
                      style={{
                        padding: '10px 14px',
                        cursor: 'pointer',
                        borderBottom: '1px solid rgba(0,0,0,0.05)',
                        background: selectedCityId === city.id ? 'rgba(20,81,66,0.08)' : 'transparent',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedCityId !== city.id) {
                          e.currentTarget.style.background = 'rgba(20,81,66,0.05)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedCityId !== city.id) {
                          e.currentTarget.style.background = 'transparent'
                        }
                      }}
                    >
                      <span style={{ fontSize: '14px', fontWeight: selectedCityId === city.id ? '600' : '500', color: '#333' }}>
                        {city.name_nl || city.name}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
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
                borderRadius: '6px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#145142'
                e.currentTarget.style.background = 'rgba(20,81,66,0.05)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#333'
                e.currentTarget.style.background = 'transparent'
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
                borderRadius: '6px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#145142'
                e.currentTarget.style.background = 'rgba(20,81,66,0.05)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#333'
                e.currentTarget.style.background = 'transparent'
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
                borderRadius: '6px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#145142'
                e.currentTarget.style.background = 'rgba(20,81,66,0.05)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#333'
                e.currentTarget.style.background = 'transparent'
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
              className="header-cart-btn-text-web" 
              onClick={openCart} 
              aria-label="Корзина"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '12px',
                border: '1px solid rgba(0,0,0,0.1)',
                background: 'rgba(255,255,255,0.8)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                position: 'relative',
                fontSize: '14px',
                fontWeight: '500',
                color: '#333',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.95)'
                e.currentTarget.style.borderColor = 'rgba(20,81,66,0.2)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'
                e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.8)'
                e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)'
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.04)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <span>{t.cart}</span>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShoppingBag size={20} />
                {cartCount > 0 && (
                  <span 
                    className="cart-badge-web"
                    style={{ 
                      position: 'absolute', 
                      top: '-6px', 
                      right: '-6px', 
                      backgroundColor: '#ec4899', 
                      color: 'white', 
                      fontSize: '10px', 
                      fontWeight: '700', 
                      borderRadius: '10px', 
                      minHeight: '16px', 
                      minWidth: '16px', 
                      padding: cartCount > 9 ? '2px 5px' : '2px',
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      lineHeight: '1',
                      boxShadow: '0 2px 6px rgba(236,72,153,0.4), 0 0 0 2px rgba(255,255,255,0.8)'
                    }}
                  >
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </div>
            </button>
            
            <div className="location-section-web" style={{ marginLeft: '8px' }}>
              <LanguageSelector />
            </div>
            
            <button 
              onClick={toggleSidebar} 
              aria-label="Меню"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                border: '1.5px solid rgba(20,81,66,0.15)',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(250,251,252,0.95) 100%)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(20,81,66,0.12), 0 2px 8px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                flexShrink: 0,
                position: 'relative',
                overflow: 'hidden',
                backdropFilter: 'blur(10px)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(20,81,66,0.1) 0%, rgba(20,81,66,0.05) 100%)'
                e.currentTarget.style.borderColor = 'rgba(20,81,66,0.3)'
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(20,81,66,0.2), 0 4px 12px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.8)'
                e.currentTarget.style.transform = 'translateY(-3px) scale(1.08) rotate(2deg)'
                const icon = e.currentTarget.querySelector('svg')
                if (icon) {
                  icon.style.transform = 'scale(1.1) rotate(5deg)'
                  icon.style.color = '#145142'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(250,251,252,0.95) 100%)'
                e.currentTarget.style.borderColor = 'rgba(20,81,66,0.15)'
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(20,81,66,0.12), 0 2px 8px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)'
                e.currentTarget.style.transform = 'translateY(0) scale(1) rotate(0deg)'
                const icon = e.currentTarget.querySelector('svg')
                if (icon) {
                  icon.style.transform = 'scale(1) rotate(0deg)'
                  icon.style.color = '#333'
                }
              }}
            >
              <Menu 
                size={20} 
                style={{ 
                  color: '#333',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))'
                }} 
              />
            </button>
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
          {/* Используем t.hero.title для перевода заголовка */}
          <div className="hero-text-web"><h1 className="hero-title-web" style={{whiteSpace: 'pre-line'}}>{t.hero.title.replace(/ /g, '\n')}</h1></div>
          <div className="hero-images-web"><div className="hero-image-item-web hero-image-1"><div className="hero-image-placeholder-web">🍜</div></div><div className="hero-image-item-web hero-image-2"><div className="hero-image-placeholder-web">🍲</div></div><div className="hero-image-item-web hero-image-3"><div className="hero-image-placeholder-web">🥘</div></div></div>
        </div>
        <div className="hero-dots-web">{[1, 2, 3, 4, 5, 6, 7, 8].map((_, i) => <span key={i} className={`hero-dot-web ${i === 0 ? 'active' : ''}`}></span>)}</div>
      </div>

      <div className="section-header-web"><h2 className="section-title-web">{t.section.title}</h2><p className="section-description-web">{t.section.description}</p></div>
      
      <div className="menu-section-web">
        <h3 className="category-title-web">{t.categories[selectedCategory as keyof typeof t.categories] || ''}</h3>
        <div className="menu-items-grid-web">
          {filteredItems.map(item => (
            <div key={item.id} className="menu-item-card-web">
              {item.isTop && <div className="top-badge-web"><span className="badge-icon-web">⚡</span><span className="badge-text-web">{t.popular || 'Топ'}</span></div>}
              <div className="item-image-web">{item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover rounded-lg" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : item.emoji}</div>
              <div className="item-info-web"><h4 className="item-name-web">{item.name}</h4><p className="item-description-web">{item.description}</p><div className="item-footer-web"><span className="item-price-web">{item.price} ₴</span><button className="add-btn-web" onClick={() => addToCart(item)}>+</button></div></div>
            </div>
          ))}
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