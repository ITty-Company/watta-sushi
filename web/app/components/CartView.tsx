'use client'

import { useState, useEffect } from 'react'
import {
  ArrowLeft, Phone, Bell, Heart, ShoppingBag, User, Menu, X, MapPin, MessageSquare, Users
} from 'lucide-react'
import LogoBackground from './LogoBackground'

// --- ТИПЫ ДАННЫХ ---
interface MenuItem {
  id: number
  name: string
  description: string
  price: number
  category: string
  emoji: string
  imageUrl?: string
  quantity?: number
  isTop?: boolean
}

// Пропсы для навигации
interface CartViewProps {
  onBack: () => void
  onOpenProfile: () => void
  onOpenFavorites: () => void
  onOpenPhone: () => void
  onOpenNotifications: () => void
  onMenuClick: () => void
}

export default function CartView({ 
  onBack, 
  onOpenProfile, 
  onOpenFavorites, 
  onOpenPhone, 
  onOpenNotifications, 
  onMenuClick 
}: CartViewProps) {
  
  const [cartItems, setCartItems] = useState<MenuItem[]>([])
  const [recommendations, setRecommendations] = useState<MenuItem[]>([])
  
  // Состояния для оформления
  const [isCheckoutMode, setIsCheckoutMode] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const [formData, setFormData] = useState({ 
    name: '',
    phone: '', 
    address: '', 
    comment: '', 
    entrance: '',    // Подъезд
    floor: '',       // Этаж
    apartment: '',   // Квартира
    intercom: '',    // Домофон
    persons: 1,      // Кол-во персон
    sticks: 0,       // Кол-во палочек
    paymentMethod: 'CASH' 
  })

  //---Оплата---
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'APPLE_PAY' | 'GOOGLE_PAY'>('CARD');
  // --- ЛОГИКА ПРОМОКОДОВ ---
  // Добавляем эти переменные, чтобы не было ошибок в return
  const [promoCode, setPromoCode] = useState('')
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discount: number } | null>(null)
  const [promoError, setPromoError] = useState<string | null>(null)

  // --- ЗАГРУЗКА ДАННЫХ ---
  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]')
      setCartItems(cart)

      const savedUser = localStorage.getItem('currentUser')
      if (savedUser) {
        try {
          const user = JSON.parse(savedUser)
          setFormData(prev => ({ 
            ...prev, 
            name: user.name || '', 
            phone: user.phone || '', 
            address: user.address || '' 
          }))
        } catch (e) {}
      }
    }

    // Загрузка рекомендаций
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        const allProducts: MenuItem[] = data.map((p: any) => ({
          id: p.id,
          name: p.name_ru,
          description: p.description_ru || '',
          price: p.price,
          category: p.category?.name_ru || '',
          emoji: '🍱',
          imageUrl: p.imageUrl,
          isTop: p.isPopular
        }))
        setRecommendations(allProducts)
      })
      .catch(err => console.error('Ошибка загрузки рекомендаций:', err))
  }, [])

  // --- ВЫЧИСЛЕНИЯ ---
  const uniqueItems = Array.from(new Set(cartItems.map(i => i.id)))
    .map(id => {
      const item = cartItems.find(i => i.id === id)!
      const count = cartItems.filter(i => i.id === id).length
      return { ...item, quantity: count }
    })

  const filteredRecommendations = recommendations
    .filter(rec => !cartItems.some(cartItem => cartItem.id === rec.id))
    .slice(0, 10)

  // --- РАСЧЕТ ЦЕНЫ (ВОТ ЭТО ВАЖНО ДЛЯ ОШИБОК) ---
  const basePrice = cartItems.reduce((sum, item) => sum + item.price, 0)
  const discountAmount = appliedPromo ? Math.round((basePrice * appliedPromo.discount) / 100) : 0
  const finalPrice = basePrice - discountAmount
  const deliveryPrice = 0 

  // --- ФУНКЦИИ КОРЗИНЫ ---
  const updateCart = (newCart: MenuItem[]) => {
    setCartItems(newCart)
    localStorage.setItem('cart', JSON.stringify(newCart))
    window.dispatchEvent(new CustomEvent('cartUpdated'))
  }

  const addItem = (item: MenuItem) => {
    const currentQty = cartItems.filter(i => i.id === item.id).length;
    if (currentQty >= 99) {
        alert("Максимальна кількість товару - 99 шт.");
        return;
    }
    
    const newItem = { ...item } 
    updateCart([...cartItems, newItem])
  }

  const removeItem = (itemId: number) => {
    const index = cartItems.findIndex(i => i.id === itemId)
    if (index > -1) {
      const newCart = [...cartItems]
      newCart.splice(index, 1)
      updateCart(newCart)
    }
  }

  const removeAllItem = (itemId: number) => {
    const newCart = cartItems.filter(i => i.id !== itemId)
    updateCart(newCart)
  }

  const handleAddRecommendation = (item: MenuItem) => {
    addItem(item)
  }

  // --- ФУНКЦИЯ ПРОВЕРКИ ПРОМОКОДА ---
  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return
    setPromoError(null)

    try {
      const res = await fetch('/api/promo/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode })
      })
      const data = await res.json()

      if (res.ok && data.success) {
        setAppliedPromo({ code: data.code, discount: data.discount })
        setPromoCode('') 
        alert(`Промокод ${data.code} успешно применен!`)
      } else {
        setPromoError(data.message || 'Неверный код')
        setAppliedPromo(null)
      }
    } catch (e) {
      console.error(e)
      setPromoError('Ошибка соединения')
    }
  }

  // --- ОФОРМЛЕНИЕ ЗАКАЗА ---
 const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const userId = localStorage.getItem('userId')
      const fullComment = `${formData.comment} ${appliedPromo ? `(ПРОМОКОД: ${appliedPromo.code} -${appliedPromo.discount}%)` : ''}`.trim()

      // 1. Создаем заказ
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            items: cartItems, // Убедитесь, что тут правильное название переменной (cart или cartItems)
            customerName: formData.name,
            phone: formData.phone,
            address: formData.address,
            comment: fullComment,
            userId: userId,
            paymentMethod: paymentMethod, // <-- ВАЖНО: передаем метод оплаты на сервер
            totalPrice: finalPrice
        }),
      })

      if (!response.ok) throw new Error('Ошибка заказа')

      // 2. Получаем данные созданного заказа (ID и т.д.)
      const orderData = await response.json() // <-- ВОТ ЧЕГО НЕ ХВАТАЛО

      // 3. Логика оплаты
      if (['CARD', 'APPLE_PAY', 'GOOGLE_PAY', 'IDEAL'].includes(paymentMethod)) {
            
            // Запрашиваем ссылку на оплату
            const payRes = await fetch('/api/payment/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId: orderData.id }) // Теперь orderData существует
            });
            const payData = await payRes.json();
            
            if (payData.paymentUrl) {
                // Чистим корзину перед уходом
                localStorage.removeItem('cart');
                window.dispatchEvent(new CustomEvent('cartUpdated'));
                
                // Переходим на "Банк"
                window.location.href = payData.paymentUrl;
                return; // Прерываем функцию, так как уходим со страницы
            }
      }

      // Если дошли сюда — значит это Наличные (или ошибка получения ссылки)
      
      // Очистка для наличных
      setIsSuccess(true)
      localStorage.removeItem('cart')
      setCartItems([])
      setAppliedPromo(null)
      window.dispatchEvent(new CustomEvent('cartUpdated'))
      
      alert('Заказ принят! Оплата наличными.')

    } catch (error) { 
        console.error(error); 
        alert('Не удалось оформить заказ.') 
    } finally { 
        setIsLoading(false) 
    }
  }
  // --- КОМПОНЕНТЫ UI ---
  const Header = () => (
    <div className="fixed top-4 left-0 right-0 w-[95%] max-w-[1800px] h-[80px] mx-auto bg-white rounded-[20px] shadow-lg flex items-center justify-between px-6 z-50">
      <div className="flex items-center gap-2 cursor-pointer" onClick={onBack}>
        <img src="/logo.png" alt="Logo" className="h-10 w-10 object-contain" />
        <img src="/1.jpg" alt="Watta Sushi" className="h-6 w-auto object-contain" />
      </div>

      <div className="flex items-center gap-3 md:gap-6 text-gray-700">
        <button onClick={onOpenPhone} className="hover:bg-gray-100 p-2 rounded-full transition"><Phone size={24} /></button>
        <button onClick={onOpenNotifications} className="hover:bg-gray-100 p-2 rounded-full transition"><Bell size={24} /></button>
        <button onClick={onOpenFavorites} className="hover:bg-gray-100 p-2 rounded-full transition"><Heart size={24} /></button>
        <button className="hover:bg-gray-100 p-2 rounded-full text-[#145142] relative">
            <ShoppingBag size={24} />
            {cartItems.length > 0 && <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>}
        </button>
        <button onClick={onOpenProfile} className="hover:bg-gray-100 p-2 rounded-full transition"><User size={24} /></button>
        <button onClick={onMenuClick} className="hover:bg-gray-100 p-2 rounded-full transition"><Menu size={24} /></button>
      </div>
    </div>
  )

  const MinusIcon = () => (

    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">

      <rect width="36" height="36" rx="5" fill="#194A38"/>

      <path d="M12 18H24M33 18C33 26.2843 26.2843 33 18 33C9.71573 33 3 26.2843 3 18C3 9.71573 9.71573 3 18 3C26.2843 3 33 9.71573 33 18Z" stroke="#D9D9D9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>

    </svg>

  )

  const PlusIcon = () => (

    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">

      <rect width="36" height="36" rx="5" fill="#145142"/>

      <path d="M12 18H24M18 12V24M33 18C33 26.2843 26.2843 33 18 33C9.71573 33 3 26.2843 3 18C3 9.71573 9.71573 3 18 3C26.2843 3 33 9.71573 33 18Z" stroke="#C4C4C4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>

    </svg>

  )

  const TrashIcon = () => (

    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">

      <rect width="24" height="24" rx="5" fill="#194A38"/>

      <path d="M10 11V17M14 11V17M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6M3 6H21M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6" stroke="#D9D9D9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>

    </svg>

  )



  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex flex-col items-center justify-center text-center p-8 font-sans">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-3xl font-bold mb-2 text-[#194A38]">Дякуємо за замовлення!</h2>
        <p className="text-gray-500 mb-6">Менеджер зв'яжеться з вами найближчим часом.</p>
        <button className="bg-[#145142] text-white px-8 py-4 rounded-[20px] font-bold text-lg shadow-xl hover:bg-[#103d34] transition" onClick={onBack}>
            Повернутися в меню
        </button>
      </div>
    )
  }

    const PromoInputBg = () => (
    <div className="absolute inset-0 pointer-events-none">
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 211 52" fill="none" preserveAspectRatio="none">
        <defs>
          <filter id="filter0_d_5331_178" x="0" y="0" width="210.399" height="51.4036" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feFlood floodOpacity="0" result="BackgroundImageFix"/>
            <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
            <feOffset dy="4"/>
            <feGaussianBlur stdDeviation="2"/>
            <feComposite in2="hardAlpha" operator="out"/>
            <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0"/>
            <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_5331_178"/>
            <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_5331_178" result="shape"/>
          </filter>
          <g id="stroke0_5331_178">
            <path d="M215.495 344.52C216.451 344.52 217.233 345.303 217.233 346.26C217.233 347.217 216.451 348 215.495 348C214.539 348 213.757 347.217 213.757 346.26C213.757 345.303 214.539 344.52 215.495 344.52ZM106.01 341.04C106.01 339.765 106.531 339.243 107.169 339.88C107.805 340.518 107.805 341.562 107.169 342.2C106.531 342.837 106.01 342.315 106.01 341.04Z" fill="#155044"/>
            <rect width="2" height="2" fill="#155044" /> 
          </g>
        </defs>
        <g filter="url(#filter0_d_5331_178)">
          <path d="M5.69336 1.70386H204.693V41.7039H5.69336V1.70386Z" fill="white"/>
        </g>
      </svg>
    </div>
  )
  return (
    <div className="min-h-screen bg-[#F5F5F7] font-sans pb-20 overflow-x-hidden relative">
      <LogoBackground />
      <Header />
      
      {/* ПРОСТРАНСТВО ПОД ФИКСИРОВАННЫЙ ХЕДЕР */}
      <div className="h-[120px] w-full"></div>

      <div className="relative z-10 max-w-[1600px] mx-auto px-4">
        
        {/* КНОПКА НАЗАД */}
        <div className="mb-8">
           <button 
             onClick={isCheckoutMode ? () => setIsCheckoutMode(false) : onBack}
             className="bg-white px-6 py-3 rounded-[15px] flex items-center gap-2 text-[#145142] font-bold shadow-sm hover:bg-white/80 transition w-fit"
           >
             <ArrowLeft size={20} /> Назад
           </button>
        </div>

        {!isCheckoutMode ? (
          <>
            <h1 className="text-[48px] font-bold text-[#194A38] mb-8 leading-tight tracking-tight">
              Ваш заказ ({cartItems.length} товара)
            </h1>

            {cartItems.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-[300px] bg-white rounded-[20px]">
                 <span className="text-2xl text-gray-400 font-bold">Корзина пуста</span>
               </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_455px] gap-8 items-start">
                
                {/* ЛЕВАЯ КОЛОНКА (Товары) */}
                <div className="flex-1 flex flex-col gap-6">
                {/* --- СПИСОК ТОВАРОВ  --- */}
                
                <div className="bg-white rounded-[20px] p-6 flex flex-col gap-4 min-h-[392px]">
                  {uniqueItems.map((item) => (
                    <div key={item.id} className="w-full bg-[#D9D9D9] rounded-[20px] p-4 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0" style={{ minHeight: '104px' }}>
                      
                      {/* Фото и Название */}
                      <div className="flex items-center gap-6 w-full md:w-auto">
                        <div className="w-[72px] h-[72px] bg-black rounded-[10px] overflow-hidden shrink-0">
                          {item.imageUrl ? (
                              <img src={item.imageUrl} className="w-full h-full object-cover" alt={item.name} />
                          ) : (
                              <div className="w-full h-full flex items-center justify-center text-2xl">{item.emoji}</div>
                          )}
                        </div>
                        <div>
                          <div className="text-[24px] md:text-[36px] font-bold text-[#194A38] leading-none mb-1">
                              {/* Исправлено: item.name */}
                              {item.name}
                          </div>
                          <div className="text-[18px] md:text-[24px] font-medium text-[#194A38] opacity-70 line-clamp-1">
                              {/* Исправлено: item.description */}
                              {item.description || 'состав'}
                          </div>
                        </div>
                      </div>

                      {/* Кнопки управления */}
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                          <button onClick={() => removeItem(item.id)} className="hover:opacity-70 transition"><MinusIcon /></button>
                          <button onClick={() => addItem(item)} className="hover:opacity-70 transition"><PlusIcon /></button>
                        </div>
                        <button onClick={() => removeAllItem(item.id)} className="hover:opacity-70 transition"><TrashIcon /></button>
                        <div className="text-[24px] font-normal text-black w-[100px] text-right whitespace-nowrap">
                          {item.price * (item.quantity || 1)} ₴
                        </div>
                      </div>

                    </div>
                  ))}
                </div>

                {/* 1. БЛОК РЕКОМЕНДАЦИЙ (Добавлен) */}
                {filteredRecommendations.length > 0 && (
                  <div>
                    <h2 className="text-[40px] font-bold text-[#145142] mb-6">Добавьте к заказу</h2>
                    <div className="bg-white rounded-[20px] p-6 flex gap-4 overflow-x-auto scrollbar-hide items-stretch">
                      {filteredRecommendations.map(item => (
                        <div 
                          key={item.id} 
                          onClick={() => handleAddRecommendation(item)}
                          className="flex items-center gap-4 shrink-0 min-w-[220px] bg-gray-50 hover:bg-gray-100 p-3 rounded-[15px] cursor-pointer transition border border-transparent hover:border-[#145142]/20"
                        >
                          <div className="w-[72px] h-[61px] bg-black rounded-[10px] overflow-hidden shrink-0">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} className="w-full h-full object-cover" alt={item.name}/>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-2xl">{item.emoji}</div>
                            )}
                          </div>
                          <div className="flex flex-col">
                            {/* Исправлено: item.name вместо safeLocalized */}
                            <span className="text-[18px] font-bold text-[#194A38] leading-tight line-clamp-2">{item.name}</span>
                            <span className="text-[14px] font-bold text-[#145142] mt-1">{item.price} ₴</span>
                          </div>
                          <div className="ml-auto text-[#145142]">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <path d="M12 5v14M5 12h14"/>
                            </svg>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                </div>

                {/* ПРАВАЯ КОЛОНКА (Оплата и Сумма) */}
             <div className="lg:w-[455px] flex flex-col gap-6 sticky top-[120px]">
                {/* 1. Контактные данные */}
                <div className="bg-white rounded-[30px] p-8 shadow-sm">
                   <h2 className="text-[28px] font-bold text-[#194A38] mb-6">Контактные данные</h2>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input 
                        type="text" 
                        placeholder="Ваше имя *" 
                        className="w-full p-4 bg-[#F3F4F6] rounded-xl text-lg outline-none focus:ring-2 focus:ring-[#145142]" 
                        value={formData.name} 
                        onChange={e => setFormData({...formData, name: e.target.value})} 
                        required 
                      />
                      <input 
                        type="tel" 
                        placeholder="Телефон *" 
                        className="w-full p-4 bg-[#F3F4F6] rounded-xl text-lg outline-none focus:ring-2 focus:ring-[#145142]" 
                        value={formData.phone} 
                        onChange={e => setFormData({...formData, phone: e.target.value})} 
                        required 
                      />
                   </div>
                </div>
                {/* 2. Доставка */}
                <div className="bg-white rounded-[30px] p-8 shadow-sm">
                   <div className="flex justify-between items-center mb-6">
                      <h2 className="text-[28px] font-bold text-[#194A38]">Доставка</h2>
                      <span className="text-[#145142] font-medium cursor-pointer flex items-center gap-1">Зона доставки ⓘ</span>
                   </div>
                   
                   {/* Выбор города */}
                   <div className="flex gap-2 mb-4">
                      {['Киев', 'Днепр', 'Львов'].map(city => (
                         <button 
                           key={city}
                           type="button"
                           className={`px-6 py-2 rounded-xl font-bold transition ${city === 'Киев' ? 'bg-[#145142] text-white' : 'bg-[#F3F4F6] text-gray-500'}`}
                         >
                           {city}
                         </button>
                      ))}
                   </div>

                   <input 
                      type="text" 
                      placeholder="Улица и номер дома *" 
                      className="w-full p-4 bg-[#F3F4F6] rounded-xl text-lg outline-none focus:ring-2 focus:ring-[#145142] mb-4" 
                      value={formData.address} 
                      onChange={e => setFormData({...formData, address: e.target.value})} 
                      required 
                   />

                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <input type="text" placeholder="Подъезд" className="p-4 bg-[#F3F4F6] rounded-xl outline-none" />
                      <input type="text" placeholder="Этаж" className="p-4 bg-[#F3F4F6] rounded-xl outline-none" />
                      <input type="text" placeholder="Квартира" className="p-4 bg-[#F3F4F6] rounded-xl outline-none" />
                      <input type="text" placeholder="Корпус" className="p-4 bg-[#F3F4F6] rounded-xl outline-none" />
                   </div>

                   <div className="flex flex-col gap-2">
                      <label className="flex items-center gap-3 cursor-pointer">
                         <input type="checkbox" className="w-5 h-5 accent-[#145142]" />
                         <span className="text-gray-600">Не перезванивать для подтверждения</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                         <input type="checkbox" className="w-5 h-5 accent-[#145142]" />
                         <span className="text-gray-600">Не звонить в дверь</span>
                      </label>
                   </div>
                </div>

                {/* 3. Время доставки */}
                <div className="bg-white rounded-[30px] p-8 shadow-sm">
                   <h2 className="text-[28px] font-bold text-[#194A38] mb-6">Время доставки</h2>
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                         <label className="block text-gray-400 text-sm mb-1">День</label>
                         <select className="w-full p-4 bg-[#F3F4F6] rounded-xl outline-none font-bold">
                            <option>Сегодня</option>
                            <option>Завтра</option>
                         </select>
                      </div>
                      <div>
                         <label className="block text-gray-400 text-sm mb-1">Время</label>
                         <select className="w-full p-4 bg-[#F3F4F6] rounded-xl outline-none font-bold">
                            <option>Как можно скорее</option>
                            <option>18:00 - 18:30</option>
                            <option>19:00 - 19:30</option>
                         </select>
                      </div>
                   </div>
                </div>

                {/* 4. Комментарий и приборы */}
                <div className="bg-white rounded-[30px] p-8 shadow-sm">
                   <h2 className="text-[28px] font-bold text-[#194A38] mb-6">Детали</h2>
                   <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                         <label className="block text-gray-400 text-sm mb-1">Кол-во людей</label>
                         <input type="number" defaultValue={1} className="w-full p-4 bg-[#F3F4F6] rounded-xl outline-none font-bold" />
                      </div>
                      <div>
                         <label className="block text-gray-400 text-sm mb-1">Учебные палочки</label>
                         <select className="w-full p-4 bg-[#F3F4F6] rounded-xl outline-none font-bold">
                            <option>0</option>
                            <option>1</option>
                            <option>2</option>
                         </select>
                      </div>
                   </div>
                   <textarea 
                      placeholder="Комментарий к заказу" 
                      className="w-full p-4 bg-[#F3F4F6] rounded-xl text-lg outline-none h-32 resize-none" 
                      value={formData.comment} 
                      onChange={e => setFormData({...formData, comment: e.target.value})} 
                   />
                </div>
                  
                  {/* 5. Блок Оплаты */}
                  <div className="bg-white rounded-[30px] p-8 shadow-sm">
                    <h2 className="text-[28px] font-bold text-[#194A38] mb-6">Способ оплаты</h2>
                    
                    <div className="flex flex-col gap-3">
                      {/* Кнопки Apple/Google Pay */}
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('APPLE_PAY')}
                          className={`relative h-12 rounded-lg flex items-center justify-center gap-2 transition-all ${
                            paymentMethod === 'APPLE_PAY' ? 'bg-black text-white ring-2 ring-[#145142]' : 'bg-black text-white opacity-90'
                          }`}
                        >
                          <span className="font-bold"> Pay</span>
                          {paymentMethod === 'APPLE_PAY' && <div className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full"></div>}
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('GOOGLE_PAY')}
                          className={`relative h-12 rounded-lg flex items-center justify-center gap-2 transition-all border ${
                            paymentMethod === 'GOOGLE_PAY' ? 'bg-black text-white ring-2 ring-[#145142]' : 'bg-white text-gray-800 border-gray-300'
                          }`}
                        >
                          <span className="font-bold"><span className="text-blue-500">G</span> Pay</span>
                          {paymentMethod === 'GOOGLE_PAY' && <div className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full"></div>}
                        </button>
                      </div>

                      <div className="relative py-2 flex items-center">
                        <span className="w-full border-t border-gray-200"></span>
                        <span className="px-2 text-xs text-gray-400 bg-white uppercase">или</span>
                        <span className="w-full border-t border-gray-200"></span>
                      </div>

                      {/* Наличные */}
                      <label className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition ${paymentMethod === 'CASH' ? 'border-[#145142] bg-[#145142]/5' : 'border-gray-200 hover:bg-gray-50'}`}>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'CASH' ? 'border-[#145142]' : 'border-gray-300'}`}>
                          {paymentMethod === 'CASH' && <div className="w-2.5 h-2.5 bg-[#145142] rounded-full"></div>}
                        </div>
                        <span className="font-bold text-gray-700">Наличными</span>
                        <input type="radio" name="payment" className="hidden" checked={paymentMethod === 'CASH'} onChange={() => setPaymentMethod('CASH')} />
                      </label>

                      {/* Картой онлайн */}
                      <label className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition ${paymentMethod === 'CARD' ? 'border-[#145142] bg-[#145142]/5' : 'border-gray-200 hover:bg-gray-50'}`}>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'CARD' ? 'border-[#145142]' : 'border-gray-300'}`}>
                          {paymentMethod === 'CARD' && <div className="w-2.5 h-2.5 bg-[#145142] rounded-full"></div>}
                        </div>
                        <span className="font-bold text-gray-700">Картой онлайн</span>
                        <input type="radio" name="payment" className="hidden" checked={paymentMethod === 'CARD'} onChange={() => setPaymentMethod('CARD')} />
                      </label>
                      
                      {paymentMethod === 'CARD' && (
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 animate-in fade-in slide-in-from-top-2">
                            <input type="text" placeholder="0000 0000 0000 0000" className="w-full p-3 border rounded-lg mb-3 outline-none focus:border-[#145142]" />
                            <div className="flex gap-3">
                              <input type="text" placeholder="MM/YY" className="w-1/2 p-3 border rounded-lg outline-none focus:border-[#145142]" />
                              <input type="text" placeholder="CVC" className="w-1/2 p-3 border rounded-lg outline-none focus:border-[#145142]" />
                            </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* 6. Блок Итого (Объединенный с Промокодом) */}
                  <div className="bg-white rounded-[30px] p-8 shadow-sm flex flex-col gap-6">
                    
                    {/* --- СЕКЦИЯ ПРОМОКОДА (ПЕРЕНЕСЕНА СЮДА) --- */}
                    <div className="relative overflow-hidden rounded-[20px] p-4"> {/* Контейнер для "плашки" */}
                        <div className="relative z-10">
                          <h3 className="font-bold text-[#194A38] mb-3 text-lg">Промокод</h3>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Введіть код"
                              className="flex-1 bg-[#F5F5F7] rounded-[15px] px-4 py-3 outline-none focus:ring-2 focus:ring-[#145142] font-bold text-[#194A38] uppercase placeholder:font-normal placeholder:normal-case"
                              value={promoCode}
                              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                            />
                            <button
                              onClick={handleApplyPromo}
                              className="bg-[#145142] text-white px-5 rounded-[15px] font-bold hover:bg-[#0f3d34] transition flex items-center justify-center"
                            >
                              OK
                            </button>
                          </div>
                          
                          {promoError && (
                            <p className="text-red-500 text-sm mt-2 font-medium bg-red-50 p-2 rounded-lg text-center">
                              {promoError}
                            </p>
                          )}
                          {appliedPromo && (
                            <div className="mt-3 flex items-center gap-2 text-[#145142] font-bold bg-[#145142]/10 p-2 rounded-lg justify-center">
                              <span>🎉 Код {appliedPromo.code} застосовано!</span>
                            </div>
                          )}
                        </div>
                        <PromoInputBg /> {/* Фон-билетик */}
                    </div>

                    <div className="w-full h-px bg-gray-200"></div>

                    {/* --- РАСЧЕТ ЦЕНЫ --- */}
                    <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-center text-gray-500 text-lg">
                          <span>Сумма заказа</span>
                          <span>{basePrice} ₴</span>
                        </div>
                        
                        {appliedPromo && (
                          <div className="flex justify-between items-center text-[#145142] text-lg font-bold">
                            <span>Скидка ({appliedPromo.code})</span>
                            <span>-{discountAmount} ₴</span>
                          </div>
                        )}

                        <div className="flex justify-between items-center text-gray-500 text-lg">
                          <span>Доставка</span>
                          <span>{deliveryPrice} ₴</span>
                        </div>
                        
                        <div className="w-full h-px bg-gray-200 my-2"></div>

                        <div className="flex justify-between items-end">
                          <span className="text-[24px] font-bold text-black">К оплате</span>
                          <span className="text-[32px] font-bold text-[#145142]">{finalPrice + deliveryPrice} ₴</span>
                        </div>
                        
                        <button 
                          onClick={handleOrder}
                          disabled={isLoading}
                          className="w-full h-[60px] bg-[#145142] rounded-[15px] text-white text-[20px] font-bold hover:bg-[#0f3d32] transition shadow-lg disabled:opacity-70 flex items-center justify-center gap-2 mt-2"
                        >
                          {isLoading ? 'Обработка...' : 'Подтвердить заказ'}
                        </button>
                        
                        <p className="text-center text-xs text-gray-400 px-2 leading-tight">
                          Нажимая кнопку, вы соглашаетесь с условиями обработки персональных данных
                        </p>
                    </div>
                  </div>
                  
                </div>
                
              </div>
            )}
          </>
        ) : (
          null
        )}
      </div>
    </div>
  )
}