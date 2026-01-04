'use client'

import { useState, useEffect } from 'react'
import { 
  ArrowLeft, User, MapPin, Heart, History, Edit2, LogOut, Phone, Bell, ShoppingBag, Menu
} from 'lucide-react'

// --- ТИПЫ ДАННЫХ ---
interface ProfileViewProps {
  onBack: () => void
  onMenuClick?: () => void
  onOpenPhone?: () => void
  onOpenNotifications?: () => void
  onOpenFavorites?: () => void // Эта функция теперь будет переключать вкладку внутри
  onOpenCart?: () => void
  onSelectCategory?: (key: string) => void
  // НОВЫЙ ПРОП: Начальная вкладка
  initialTab?: 'history' | 'address' | 'favorites'
}

interface Order {
  id: number
  createdAt: string
  totalPrice: number
  status: string
  items: { product: { name_ru: string }; quantity: number }[]
}

interface Product {
  id: number
  name_ru: string
  price: number
  description?: string
  imageUrl?: string
}

const categoriesData = [
  { key: 'rolls', name: 'Роллы', emoji: '🍣' },
  { key: 'sushi', name: 'Суши', emoji: '🍱' },
  { key: 'sets', name: 'Сеты', emoji: '🍱' },
  { key: 'soups', name: 'Супы', emoji: '🍲' },
  { key: 'bowls', name: 'Боулы', emoji: '🥣' },
  { key: 'snacks', name: 'Закуски', emoji: '🦐' },
  { key: 'drinks', name: 'Напитки', emoji: '🥤' },
  { key: 'sauces', name: 'Соусы', emoji: '🍶' }
]

export default function ProfileView({ 
  onBack, 
  onMenuClick, 
  onOpenPhone, 
  onOpenNotifications, 
  onOpenFavorites, 
  onOpenCart, 
  onSelectCategory,
  initialTab = 'history' // По умолчанию История
}: ProfileViewProps) {
  
  // Инициализируем стейт из пропса
  const [activeTab, setActiveTab] = useState<'history' | 'address' | 'favorites'>('history')
  
  // Эффект, чтобы переключать вкладку, если проп изменился
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab)
    }
  }, [initialTab])

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [user, setUser] = useState({ name: 'Гость', email: '', phone: '' })
  const [orders, setOrders] = useState<Order[]>([])
  const [favorites, setFavorites] = useState<Product[]>([])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('currentUser')
      if (savedUser) try { setUser(JSON.parse(savedUser)) } catch (e) {}

      const savedOrders = localStorage.getItem('userOrders')
      if (savedOrders) try { setOrders(JSON.parse(savedOrders).reverse()) } catch (e) {}

      const savedFavorites = localStorage.getItem('favorites')
      if (savedFavorites) try { setFavorites(JSON.parse(savedFavorites)) } catch (e) {}
    }
  }, [])

  const handleLogout = () => {
    if (confirm('Вы уверены, что хотите выйти?')) {
      localStorage.removeItem('currentUser')
      window.dispatchEvent(new Event('userChanged'))
      onBack()
    }
  }

  // --- SVG ФОНЫ ---
  const GreenButtonBg = () => (
    <div className="absolute inset-0 z-0 rounded-[20px] overflow-hidden">
      <svg width="100%" height="100%" preserveAspectRatio="none">
        <filter id="noiseGreen" x="0%" y="0%" width="100%" height="100%">
           <feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves="3" stitchTiles="stitch" />
           <feColorMatrix type="matrix" values="0 0 0 0 0.08 0 0 0 0 0.32 0 0 0 0 0.26 0 0 0 1 0" />
        </filter>
        <rect width="100%" height="100%" fill="#145142"/>
        <rect width="100%" height="100%" filter="url(#noiseGreen)" opacity="0.4"/>
      </svg>
      <div className="absolute inset-0 border-2 border-[#145142]/50 rounded-[20px] pointer-events-none"></div>
    </div>
  )

  const GrayButtonBg = () => (
    <div className="absolute inset-0 z-0 rounded-[20px] overflow-hidden">
      <svg width="100%" height="100%" preserveAspectRatio="none"><rect width="100%" height="100%" fill="#F3F4F6"/></svg>
    </div>
  )

  const UserCardBg = () => (
    <div className="absolute inset-0 z-0 rounded-[20px] bg-white border border-black/80 shadow-sm"></div>
  )

  // --- ХЕДЕР ---
  const Header = () => (
    <div className="absolute top-4 left-0 right-0 w-[95%] max-w-[1800px] h-[80px] mx-auto bg-white rounded-[20px] shadow-lg flex items-center justify-between px-6 z-[500]">
      <div className="flex items-center gap-2 cursor-pointer" onClick={onBack}>
        <img src="/logo.png" alt="Logo" className="h-10 w-10 object-contain" />
        <img src="/1.jpg" alt="Watta Sushi" className="h-6 w-auto object-contain" />
      </div>

      <div className="flex items-center gap-3 md:gap-6 text-gray-700">
        <button onClick={onOpenPhone} className="hover:bg-gray-100 p-2 rounded-full transition"><Phone size={24} /></button>
        <button onClick={onOpenNotifications} className="hover:bg-gray-100 p-2 rounded-full transition"><Bell size={24} /></button>
        
        {/* Кнопка Сердца внутри профиля просто переключает таб */}
        <button onClick={() => setActiveTab('favorites')} className={`hover:bg-gray-100 p-2 rounded-full transition ${activeTab === 'favorites' ? 'text-[#145142]' : ''}`}><Heart size={24} /></button>
        
        <button onClick={onOpenCart} className="hover:bg-gray-100 p-2 rounded-full transition"><ShoppingBag size={24} /></button>
        <button className="hover:bg-gray-100 p-2 rounded-full text-[#145142]"><User size={24} /></button>
        <button onClick={onMenuClick} className="hover:bg-gray-100 p-2 rounded-full transition"><Menu size={24} /></button>
      </div>
    </div>
  )

  const CategoryBar = () => (
    <div className="flex justify-center w-full">
      <div className="bg-white/80 backdrop-blur-md rounded-[30px] px-6 py-3 flex gap-4 shadow-sm overflow-x-auto scrollbar-hide max-w-full">
        {categoriesData.map((cat) => (
          <button 
            key={cat.key}
            onClick={() => { setSelectedCategory(cat.key); if (onSelectCategory) onSelectCategory(cat.key) }}
            className={`flex flex-col items-center justify-center w-[70px] h-[70px] shrink-0 rounded-[18px] transition-all duration-200 ${selectedCategory === cat.key ? 'bg-[#145142] text-white shadow-lg scale-110 translate-y-[-5px]' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
          >
            <span className="text-2xl mb-1 filter drop-shadow-sm">{cat.emoji}</span>
            <span className="text-[10px] font-bold leading-none">{cat.name}</span>
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F3F4F6] font-sans text-[#145142] pt-[130px] pb-20 overflow-x-hidden">
      <Header />

      <div className="max-w-[1600px] mx-auto px-4">
        
        <div className="relative mb-12 flex flex-col md:flex-row items-center justify-center md:justify-between gap-6">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 hidden md:block">
            <button onClick={onBack} className="bg-white px-6 py-3 rounded-[15px] flex items-center gap-2 text-[#145142] font-bold shadow-sm hover:bg-gray-50 transition">
              <ArrowLeft size={20} /> Назад
            </button>
          </div>
          <div className="w-full flex justify-center"><CategoryBar /></div>
        </div>

        <div className="flex flex-col lg:flex-row gap-16 items-start">
          <div className="w-full lg:w-[380px] shrink-0 flex flex-col gap-6">
            <div className="flex flex-col gap-5">
              <button onClick={() => setActiveTab('history')} className="relative w-full h-[75px] group">
                {activeTab === 'history' ? <GreenButtonBg /> : <GrayButtonBg />}
                <div className={`relative z-10 flex items-center px-8 gap-4 h-full font-bold text-xl transition-colors ${activeTab === 'history' ? 'text-white' : 'text-black/70'}`}><History size={28} /> История заказов</div>
              </button>
              <button onClick={() => setActiveTab('address')} className="relative w-full h-[75px] group">
                {activeTab === 'address' ? <GreenButtonBg /> : <GrayButtonBg />}
                <div className={`relative z-10 flex items-center px-8 gap-4 h-full font-bold text-xl transition-colors ${activeTab === 'address' ? 'text-white' : 'text-black/70'}`}><MapPin size={28} /> Адрес доставки</div>
              </button>
              <button onClick={() => setActiveTab('favorites')} className="relative w-full h-[75px] group">
                {activeTab === 'favorites' ? <GreenButtonBg /> : <GrayButtonBg />}
                <div className={`relative z-10 flex items-center px-8 gap-4 h-full font-bold text-xl transition-colors ${activeTab === 'favorites' ? 'text-white' : 'text-black/70'}`}><Heart size={28} /> Избранное</div>
              </button>
            </div>

            <div className="relative w-full h-[213px] mt-4">
              <UserCardBg />
              <div className="relative z-10 p-8 flex flex-col justify-between h-full">
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <div className="w-16 h-16 rounded-full border-[1.5px] border-black flex items-center justify-center text-gray-600 bg-gray-50"><User size={32} /></div>
                    <div className="mt-1">
                      <h3 className="font-bold text-black text-lg leading-tight">{user.name || 'Гость'}</h3>
                      <p className="text-sm text-gray-500 max-w-[150px] truncate">{user.email || 'Нет почты'}</p>
                    </div>
                  </div>
                  <button className="text-gray-400 hover:text-black transition"><Edit2 size={20} /></button>
                </div>
                <div>
                  <button onClick={handleLogout} className="w-full bg-[#F3F4F6]/50 py-3 rounded-xl text-[#145142] font-bold text-base flex items-center justify-center gap-2 hover:bg-[#F3F4F6] transition"><LogOut size={18} /> Выйти</button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 w-full pt-2">
            <h1 className="text-5xl font-bold text-black mb-8 tracking-tight">
              {activeTab === 'history' && 'История заказов'}
              {activeTab === 'address' && 'Адрес доставки'}
              {activeTab === 'favorites' && 'Избранное'}
            </h1>

            {activeTab === 'history' && (
              <div className="space-y-4">
                {orders.length === 0 ? (
                   <div className="w-full h-[300px] bg-[#F3F4F6] rounded-[30px] flex items-center justify-center shadow-inner"><span className="text-3xl text-black font-medium opacity-80">Пока что пусто</span></div>
                ) : (
                  orders.map((order, index) => (
                    <div key={`${order.id}-${index}`} className="bg-white p-6 rounded-[25px] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <h3 className="text-2xl font-bold text-black">Заказ №{order.id}</h3>
                        <p className="text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                        <p className="text-gray-500 text-sm mt-1 max-w-md">{order.items.map(i => `${i.product.name_ru} x${i.quantity}`).join(', ')}</p>
                      </div>
                      <div className="text-right">
                         <div className="text-2xl font-bold text-[#145142]">{order.totalPrice} ₴</div>
                         <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-bold mt-2">{order.status}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'favorites' && (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {favorites.length === 0 ? (
                    <div className="col-span-full w-full h-[300px] bg-[#FFFFFF] rounded-[30px] flex items-center justify-center shadow-inner"><span className="text-3xl text-black font-medium opacity-80">В избранном пусто</span></div>
                  ) : (
                    favorites.map(product => (
                      <div key={product.id} className="bg-white p-4 rounded-[25px] shadow-sm flex items-center gap-4">
                         <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden shrink-0">{product.imageUrl ? <img src={product.imageUrl} className="w-full h-full object-cover"/> : <span className="text-2xl">🍣</span>}</div>
                         <div><h4 className="font-bold text-lg leading-tight">{product.name_ru}</h4><p className="text-[#145142] font-bold">{product.price} ₴</p></div>
                      </div>
                    ))
                  )}
               </div>
            )}

            {activeTab === 'address' && <div className="w-full h-[300px] bg-[#FFFFFF] rounded-[30px] flex items-center justify-center shadow-inner"><span className="text-3xl text-black font-medium opacity-80">Адреса не сохранены</span></div>}
          </div>
        </div>
      </div>
    </div>
  )
}