'use client'

import { useState, useEffect } from 'react'
import {
  ArrowLeft, Phone, Bell, Heart, ShoppingBag, User, Menu, X
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
    name: '', phone: '', address: '', comment: '', paymentMethod: 'CASH' 
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
    <div className="fixed top-4 left-0 right-0 w-[95%] max-w-[1800px] h-[80px] mx-auto bg-white rounded-[20px] shadow-lg flex items-center justify-between px-6 z-[1000]">
      <div className="flex items-center gap-2 cursor-pointer" onClick={onBack}>
        <img src="/logo.png" alt="Logo" className="h-10 w-10 object-contain" />
        <img src="/1.jpg" alt="Watta Sushi" className="h-6 w-auto object-contain" />
      </div>

      <div className="flex items-center gap-3 md:gap-6 text-gray-700">
        <button onClick={onOpenPhone} className="hover:bg-gray-100 p-2 rounded-full transition"><Phone size={24} /></button>
        <button onClick={onOpenNotifications} className="hover:bg-gray-100 p-2 rounded-full transition"><Bell size={24} /></button>
        <button onClick={onOpenFavorites} className="hover:bg-gray-100 p-2 rounded-full transition"><Heart size={24} /></button>
        <button className="hover:bg-gray-100 p-2 rounded-full text-[#145142]"><ShoppingBag size={24} /></button>
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
      <div className="min-h-screen bg-[#D9D9D9] flex flex-col items-center justify-center text-center p-8">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold mb-2 text-[#194A38]">Спасибо за заказ!</h2>
        <button className="bg-[#145142] text-white px-6 py-3 rounded-xl font-bold mt-4" onClick={onBack}>Вернуться в меню</button>
      </div>
    )
  }

  // --- ВОТ ТЕПЕРЬ ТВОЙ RETURN НЕ БУДЕТ ВЫДАВАТЬ ОШИБОК ---
  return (
    <div className="min-h-screen bg-[#D9D9D9] font-sans pt-[120px] pb-20 overflow-x-hidden relative">
      <LogoBackground />
      <div className="relative z-10">
        <Header />

        <div className="max-w-[1600px] mx-auto px-4">
        
        <div className="mb-8">
           <button 
              onClick={isCheckoutMode ? () => setIsCheckoutMode(false) : onBack}
              className="bg-white px-6 py-3 rounded-[15px] flex items-center gap-2 text-[#145142] font-bold shadow-sm hover:bg-gray-50 transition w-fit"
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
              <div className="flex flex-col xl:flex-row gap-8 items-start">
                
                {/* ЛЕВАЯ КОЛОНКА */}
                <div className="w-full xl:max-w-[1035px] flex flex-col gap-8">
                  
                  {/* Список товаров */}
                  <div className="bg-white rounded-[20px] p-6 flex flex-col gap-4 min-h-[392px]">
                    {uniqueItems.map((item) => (
                      <div key={item.id} className="w-full bg-[#D9D9D9] rounded-[20px] p-4 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0" style={{ minHeight: '104px' }}>
                         <div className="flex items-center gap-6 w-full md:w-auto">
                            <div className="w-[72px] h-[72px] bg-black rounded-[10px] overflow-hidden shrink-0">
                               {item.imageUrl ? <img src={item.imageUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl">{item.emoji}</div>}
                            </div>
                            <div>
                               <div className="text-[24px] md:text-[36px] font-bold text-[#194A38] leading-none mb-1">{item.name}</div>
                               <div className="text-[18px] md:text-[24px] font-medium text-[#194A38] opacity-70 line-clamp-1">{item.description || 'состав'}</div>
                            </div>
                         </div>

                         <div className="flex items-center gap-6">
                            <div className="flex items-center gap-3">
                               <button onClick={() => removeItem(item.id)}><MinusIcon /></button>
                               <button onClick={() => addItem(item)}><PlusIcon /></button>
                            </div>
                            <button onClick={() => removeAllItem(item.id)}><TrashIcon /></button>
                            <div className="text-[24px] font-normal text-black w-[100px] text-right whitespace-nowrap">
                               {item.price * (item.quantity || 1)} ₴
                            </div>
                         </div>
                      </div>
                    ))}
                  </div>

                  {/* Рекомендации */}
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
                                  {item.imageUrl ? <img src={item.imageUrl} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-2xl">{item.emoji}</div>}
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[18px] font-bold text-[#194A38] leading-tight line-clamp-2">{item.name}</span>
                                  <span className="text-[14px] font-bold text-[#145142] mt-1">{item.price} ₴</span>
                                </div>
                                <div className="ml-auto text-[#145142]">
                                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 5v14M5 12h14"/></svg>
                                </div>
                             </div>
                          ))}
                      </div>
                    </div>
                  )}

                </div>

                {/* ПРАВАЯ КОЛОНКА */}
                <div className="w-full xl:w-[455px] bg-white rounded-[30px] p-8 h-auto xl:h-[415px] flex flex-col justify-between sticky top-[120px]">
                   <div>
                      <h2 className="text-[36px] font-medium text-black mb-6">Итого</h2>
                      
                      <div className="flex justify-between items-center mb-4">
                         <span className="text-[24px] font-medium text-black">стоимость товаров</span>
                         <span className="text-[24px] font-medium text-black">{basePrice} ₴</span>
                      </div>

                      {/* БЛОК СКИДКИ */}
                      {appliedPromo && (
                        <div className="flex justify-between items-center mb-4 text-[#145142]">
                           <span className="text-[20px] font-bold">Знижка ({appliedPromo.code})</span>
                           <span className="text-[20px] font-bold">-{discountAmount} ₴</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center mb-8">
                         <span className="text-[24px] font-medium text-black">доставка</span>
                         <span className="text-[24px] font-medium text-black">{deliveryPrice} ₴</span>
                      </div>

                      {/* ПОЛЕ ВВОДА ПРОМОКОДА */}
                      <div className="flex flex-col mb-2">
                        <div className="flex items-center justify-between">
                           <div className="relative w-[211px] h-[52px] flex items-center justify-center">
                              <PromoInputBg />
                              <input 
                                type="text" 
                                placeholder="промокод"
                                value={promoCode}
                                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                                className="relative z-10 w-full bg-transparent border-none outline-none text-[20px] font-medium text-[#7C7C7C] placeholder-[#7C7C7C] text-center pb-1 uppercase"
                              />
                           </div>
                           <button 
                             type="button"
                             onClick={handleApplyPromo}
                             className="text-[20px] font-medium text-black hover:text-[#145142] transition"
                           >
                             применить
                           </button>
                        </div>
                        {promoError && <span className="text-red-500 text-sm mt-1 text-center">{promoError}</span>}
                      </div>
                   </div>

                   <div>
                      <div className="flex justify-between items-end mb-6">
                         <span className="text-[36px] font-medium text-black leading-none">К оплате</span>
                         <span className="text-[36px] font-medium text-black leading-none">{finalPrice + deliveryPrice} ₴</span>
                      </div>
                      {/* --- PAYMENT WIDGET START --- */}
                      <div className="bg-white border border-gray-200 p-5 rounded-2xl mb-6 shadow-sm">
                        <h3 className="font-bold text-[#145142] mb-4 text-lg">Оплата</h3>
                        
                        <div className="flex flex-col gap-3">
                          
                          {/* Apple Pay & Google Pay Row */}
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              type="button"
                              onClick={() => setPaymentMethod('APPLE_PAY')}
                              className={`relative h-12 rounded-lg flex items-center justify-center gap-2 transition-all ${
                                paymentMethod === 'APPLE_PAY' 
                                  ? 'bg-black text-white ring-2 ring-[#145142] ring-offset-2' 
                                  : 'bg-black text-white hover:opacity-90'
                              }`}
                            >
                              <span className="font-bold tracking-tight"> Pay</span>
                              {paymentMethod === 'APPLE_PAY' && <div className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full"></div>}
                            </button>

                            <button
                              type="button"
                              onClick={() => setPaymentMethod('GOOGLE_PAY')}
                              className={`relative h-12 rounded-lg flex items-center justify-center gap-2 transition-all border ${
                                paymentMethod === 'GOOGLE_PAY' 
                                  ? 'bg-black text-white ring-2 ring-[#145142] ring-offset-2 border-transparent' 
                                  : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              <span className="font-bold tracking-tight flex items-center gap-1">
                                <span className="text-blue-500">G</span> Pay
                              </span>
                              {paymentMethod === 'GOOGLE_PAY' && <div className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full"></div>}
                            </button>
                          </div>

                          {/* Divider */}
                          <div className="relative py-2">
                            <div className="absolute inset-0 flex items-center">
                              <span className="w-full border-t border-gray-200" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                              <span className="bg-white px-2 text-gray-500">или введите данные карты</span>
                            </div>
                          </div>

                          {/* Card Form */}
                          <div 
                            onClick={() => setPaymentMethod('CARD')}
                            className={`border rounded-xl p-4 transition-all ${
                              paymentMethod === 'CARD' ? 'border-[#145142] bg-[#145142]/5' : 'border-gray-200'
                            }`}
                          >
                            <div className="mb-3">
                              <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Номер карты</label>
                              <div className="relative">
                                <input 
                                  type="text" 
                                  placeholder="0000 0000 0000 0000" 
                                  className="w-full bg-white border border-gray-300 rounded-lg p-2.5 pl-10 outline-none focus:border-[#145142] font-mono text-sm"
                                  onFocus={() => setPaymentMethod('CARD')}
                                />
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">💳</div>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Срок (MM/YY)</label>
                                <input 
                                  type="text" 
                                  placeholder="MM / YY" 
                                  className="w-full bg-white border border-gray-300 rounded-lg p-2.5 outline-none focus:border-[#145142] font-mono text-sm"
                                  onFocus={() => setPaymentMethod('CARD')}
                                />
                              </div>
                              <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">CVC / CVV</label>
                                <input 
                                  type="text" 
                                  placeholder="123" 
                                  maxLength={3}
                                  className="w-full bg-white border border-gray-300 rounded-lg p-2.5 outline-none focus:border-[#145142] font-mono text-sm"
                                  onFocus={() => setPaymentMethod('CARD')}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Cash Option (Скрытый или внизу, если нужно) */}
                          <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 mt-2">
                            <input 
                              type="radio" 
                              name="payment_method" 
                              checked={paymentMethod === 'CASH'}
                              onChange={() => setPaymentMethod('CASH')}
                              className="text-[#145142] focus:ring-[#145142]"
                            />
                            <span className="font-medium text-gray-700">💵 Оплата наличными при получении</span>
                          </label>

                        </div>
                      </div>
                      {/* --- PAYMENT WIDGET END --- */}
                      <button 
                        onClick={() => setIsCheckoutMode(true)}
                        className="w-[370px] h-[45px] bg-[#145142] rounded-[15px] text-white text-[24px] font-bold flex items-center justify-center hover:bg-[#0f3d32] transition mx-auto"
                      >
                        Перейти к оформлению
                      </button>
                   </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="max-w-[600px] mx-auto bg-white rounded-[30px] p-8 shadow-xl animate-in fade-in slide-in-from-bottom-4">
             <h2 className="text-[36px] font-bold text-[#194A38] mb-6">Оформление</h2>
             <form onSubmit={handleOrder} className="flex flex-col gap-4">
                <input type="text" placeholder="Ваше имя" className="w-full p-4 bg-[#F3F4F6] rounded-xl text-lg outline-none focus:ring-2 focus:ring-[#145142]" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                <input type="tel" placeholder="Телефон" className="w-full p-4 bg-[#F3F4F6] rounded-xl text-lg outline-none focus:ring-2 focus:ring-[#145142]" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required />
                <input type="text" placeholder="Адрес доставки" className="w-full p-4 bg-[#F3F4F6] rounded-xl text-lg outline-none focus:ring-2 focus:ring-[#145142]" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} required />
                <textarea placeholder="Комментарий" className="w-full p-4 bg-[#F3F4F6] rounded-xl text-lg outline-none focus:ring-2 focus:ring-[#145142] h-24 resize-none" value={formData.comment} onChange={e => setFormData({...formData, comment: e.target.value})} />
                <select className="w-full p-4 bg-[#F3F4F6] rounded-xl text-lg outline-none" value={formData.paymentMethod} onChange={e => setFormData({...formData, paymentMethod: e.target.value})}>
                  <option value="CASH">💵 Наличными</option>
                  <option value="CARD">💳 Картой курьеру</option>
                </select>
                <div className="flex justify-between items-center mt-4">
                  <span className="text-2xl font-bold">Итого: {finalPrice} ₴</span>
                  <button type="submit" disabled={isLoading} className="bg-[#145142] text-white px-8 py-3 rounded-xl font-bold text-xl hover:bg-[#0f3d32] transition disabled:opacity-70">
                    {isLoading ? 'Оформляем...' : 'Заказать'}
                  </button>
                </div>
             </form>
          </div>
        )}
        </div>
      </div>
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
        <rect x="5.69" y="1.7" width="199" height="40" stroke="#155044" strokeWidth="3" fill="none" strokeDasharray="5 2" />
      </g>
    </svg>
  </div>
)