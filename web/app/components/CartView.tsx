'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  ArrowLeft, Phone, Bell, Heart, ShoppingBag, User, Menu, MapPin, Truck, Store
} from 'lucide-react'
import LogoBackground from './LogoBackground'
import { useLanguage } from '../context/LanguageContext'
import {
  buildAmsterdamSlots,
  type DeliveryDay,
} from '@/lib/deliverySlotsAmsterdam'

const CHECKOUT_INPUT_CLASS =
  'w-full min-w-0 p-4 bg-[#F3F4F6] rounded-xl text-base text-gray-600 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-[#145142] border border-transparent focus:border-[#ff6b35]/40'
const UA_PHONE_MAX_LEN = 15
/** Під'їзд / поверх / кв.: лише цифри, до 1000 символів кожне */
const DIGIT_ADDR_MAX = 4
const STREET_MAX = 4
const BUILDING_BLOCK_MAX = 4
const COMMENT_MAX = 500

function normalizeUaPhoneInput(value: string) {
  return value.replace(/[\s\-().]/g, '')
}

/** Ukrainian mobile: +380 + 9 digits, or 0 + 9 digits (10 total). */
function isValidUaPhone(value: string): boolean {
  const n = normalizeUaPhoneInput(value)
  if (!n) return false
  return /^\+380\d{9}$/.test(n) || /^0\d{9}$/.test(n)
}

interface CheckoutSiteSettings {
  freeDeliveryThreshold: number
  deliveryFee: number
  restaurantPickupAddress: string
}

const defaultCheckoutSettings: CheckoutSiteSettings = {
  freeDeliveryThreshold: 1000,
  deliveryFee: 50,
  restaurantPickupAddress: '',
}

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

interface CityOption {
  id: number
  name: string
  name_ua?: string | null
  name_en?: string | null
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
  const { t } = useLanguage()

  const [cartItems, setCartItems] = useState<MenuItem[]>([])
  const [recommendations, setRecommendations] = useState<MenuItem[]>([])
  
  // Состояния для оформления
  const [isCheckoutMode, setIsCheckoutMode] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const [formData, setFormData] = useState({ 
    name: '',
    phone: '', 
    address: '', 
    comment: '', 
    needChangeFrom: '',
    entrance: '',
    floor: '',
    apartment: '',
    intercom: '',
    buildingBlock: '',
    persons: 1,
    sticks: 0,
    noCallbackConfirm: false,
    noDoorbellRing: false,
  })

  //---Оплата---
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD'>('CARD');
  const [fulfillment, setFulfillment] = useState<'delivery' | 'pickup'>('delivery')
  const [selectedCity, setSelectedCity] = useState('Киев')
  const [cities, setCities] = useState<string[]>(['Киев'])
  const [deliveryDay, setDeliveryDay] = useState<DeliveryDay>('today')
  const [deliverySlot, setDeliverySlot] = useState('asap')
  // --- ЛОГИКА ПРОМОКОДОВ ---
  // Добавляем эти переменные, чтобы не было ошибок в return
  const [promoCode, setPromoCode] = useState('')
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discount: number } | null>(null)
  const [promoError, setPromoError] = useState<string | null>(null)
  const [checkoutSettings, setCheckoutSettings] = useState<CheckoutSiteSettings>(defaultCheckoutSettings)

  // --- ЗАГРУЗКА ДАННЫХ ---
  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        setCheckoutSettings({
          freeDeliveryThreshold: Number(data.freeDeliveryThreshold) || defaultCheckoutSettings.freeDeliveryThreshold,
          deliveryFee: Number(data.deliveryFee) || defaultCheckoutSettings.deliveryFee,
          restaurantPickupAddress: String(data.restaurantPickupAddress ?? '').trim(),
        })
      })
      .catch(() => {})
  }, [])

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

  useEffect(() => {
    fetch('/api/cities')
      .then((res) => res.json())
      .then((data: CityOption[]) => {
        const loadedCities = Array.isArray(data)
          ? data
              .map((city) => String(city.name_ua || city.name || city.name_en || '').trim())
              .filter(Boolean)
          : []

        if (loadedCities.length > 0) {
          setCities(loadedCities)
          setSelectedCity((prev) => (loadedCities.includes(prev) ? prev : loadedCities[0]))
        }
      })
      .catch(() => {})
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
  const { freeDeliveryThreshold, deliveryFee, restaurantPickupAddress } = checkoutSettings
  const deliveryPrice = useMemo(() => {
    if (fulfillment === 'pickup') return 0
    if (finalPrice >= freeDeliveryThreshold) return 0
    return deliveryFee
  }, [fulfillment, finalPrice, freeDeliveryThreshold, deliveryFee])

  const pickupAddressDisplay = restaurantPickupAddress || '—'

  const amsterdamSlots = useMemo(
    () => buildAmsterdamSlots(deliveryDay),
    [deliveryDay]
  )

  const submitLiqPayCheckout = (data: string, signature: string) => {
    const form = document.createElement('form')
    form.method = 'POST'
    form.action = 'https://www.liqpay.ua/api/3/checkout'
    form.acceptCharset = 'utf-8'

    const dataInput = document.createElement('input')
    dataInput.type = 'hidden'
    dataInput.name = 'data'
    dataInput.value = data
    form.appendChild(dataInput)

    const signatureInput = document.createElement('input')
    signatureInput.type = 'hidden'
    signatureInput.name = 'signature'
    signatureInput.value = signature
    form.appendChild(signatureInput)

    document.body.appendChild(form)
    form.submit()
  }

  useEffect(() => {
    if (amsterdamSlots.some((s) => s.value === deliverySlot)) return
    setDeliverySlot('asap')
  }, [deliveryDay, amsterdamSlots, deliverySlot])

  const phoneInvalidHint =
    formData.phone.trim() !== '' && !isValidUaPhone(formData.phone)
  const phoneValid = isValidUaPhone(formData.phone)
  const canSubmitOrder = phoneValid

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
    if (fulfillment === 'delivery' && !formData.address.trim()) {
      alert('Вкажіть адресу доставки')
      return
    }
    setIsLoading(true)
    try {
      const userId = localStorage.getItem('userId')
      const promoPart = appliedPromo ? `(ПРОМОКОД: ${appliedPromo.code} -${appliedPromo.discount}%)` : ''
      const fulfillmentPart =
        fulfillment === 'pickup' ? `[${t.cartSection.fulfillmentPickup}]` : `[${t.cartSection.fulfillmentDelivery}]`
      const dayLabel =
        deliveryDay === 'today' ? 'Сьогодні (Амстердам)' : 'Завтра (Амстердам)'
      const slotLabel =
        deliverySlot === 'asap'
          ? 'Якнайшвидше'
          : amsterdamSlots.find((s) => s.value === deliverySlot)?.label ?? deliverySlot
      const timePart = `[Час (${dayLabel}): ${slotLabel}]`
      const changePart =
        paymentMethod === 'CASH' && formData.needChangeFrom.trim()
          ? `[Нужна сдача с: ${formData.needChangeFrom.trim()} ₴]`
          : ''
      const fullComment =
        `${changePart} ${fulfillmentPart} ${timePart} ${formData.comment} ${appliedPromo ? promoPart : ''}`.trim()

      const addrDetails: string[] = []
      if (formData.buildingBlock.trim())
        addrDetails.push(`корп./блок: ${formData.buildingBlock.trim()}`)
      if (formData.entrance) addrDetails.push(`під'їзд: ${formData.entrance}`)
      if (formData.floor) addrDetails.push(`поверх: ${formData.floor}`)
      if (formData.apartment) addrDetails.push(`кв.: ${formData.apartment}`)
      if (formData.intercom) addrDetails.push(`домофон: ${formData.intercom}`)

      const orderAddress =
        fulfillment === 'pickup'
          ? `${t.cartSection.fulfillmentPickup}: ${pickupAddressDisplay}`
          : [
              `${selectedCity}, ${formData.address.trim()}`,
              addrDetails.length ? addrDetails.join('; ') : '',
            ]
              .filter(Boolean)
              .join('. ')

      // 1. Создаем заказ
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            items: uniqueItems,
            name: formData.name,
            customerName: formData.name,
            phone: formData.phone,
            address: orderAddress,
            comment: fullComment,
            userId: userId,
            paymentMethod: paymentMethod,
            totalAmount: finalPrice + deliveryPrice,
            merchandiseTotal: finalPrice,
            fulfillmentType: fulfillment === 'pickup' ? 'PICKUP' : 'DELIVERY',
            noCallbackConfirm: formData.noCallbackConfirm,
            noDoorbellRing: formData.noDoorbellRing,
        }),
      })

      if (!response.ok) throw new Error('Ошибка заказа');

      // 2. Получаем данные созданного заказа
      const orderData = await response.json(); // Наша переменная называется orderData

      // 3. LiqPay redirect flow (hosted checkout)
      if (paymentMethod === 'CARD' && orderData.liqpay) {
        // Создаем скрытую форму для отправки клиента на шлюз ПриватБанка
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = 'https://www.liqpay.ua/api/3/checkout';

        const dataInput = document.createElement('input');
        dataInput.type = 'hidden';
        dataInput.name = 'data';
        dataInput.value = orderData.liqpay.data; // Используем orderData!

        const signatureInput = document.createElement('input');
        signatureInput.type = 'hidden';
        signatureInput.name = 'signature';
        signatureInput.value = orderData.liqpay.signature; // Используем orderData!

        form.appendChild(dataInput);
        form.appendChild(signatureInput);
        document.body.appendChild(form);
        
        // Автоматически нажимаем "Отправить"
        form.submit();
        return; // Важно! Останавливаем функцию, ждем переадресации LiqPay
      }

      // === Если Наличные: сразу на страницу успешного заказа ===
      // (Твой родной, рабочий код очистки)
      localStorage.removeItem('cart');
      window.dispatchEvent(new CustomEvent('cartUpdated'));
      window.location.href = `/checkout/success?orderId=${orderData.id}`;
      return;

    } catch (error) { 
        console.error(error); 
        alert('Не удалось оформить заказ.'); 
    } finally { 
        setIsLoading(false);
    }
}
  // --- КОМПОНЕНТЫ UI ---
  const Header = () => (
    <div className="fixed top-3 sm:top-4 left-0 right-0 w-[min(95%,1800px)] min-h-[72px] sm:h-[80px] mx-auto bg-white rounded-[20px] shadow-lg flex flex-wrap items-center justify-between gap-2 px-3 sm:px-6 py-2 sm:py-0 z-50 border border-[#145142]/10">
      <div className="flex items-center gap-2 cursor-pointer min-w-0" onClick={onBack}>
        <img src="/logo.png" alt="Logo" className="h-9 w-9 sm:h-10 sm:w-10 object-contain shrink-0" />
        <img src="/1.jpg" alt="Watta Sushi" className="h-5 sm:h-6 w-auto max-w-[120px] sm:max-w-none object-contain" />
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3 md:gap-6 text-gray-700 shrink-0">
        <button type="button" onClick={onOpenPhone} className="hover:bg-gray-100 p-2 rounded-full transition text-[#145142] hover:ring-2 hover:ring-[#ff6b35]/30"><Phone size={22} className="sm:w-6 sm:h-6" /></button>
        <button type="button" onClick={onOpenNotifications} className="hover:bg-gray-100 p-2 rounded-full transition hover:ring-2 hover:ring-[#ff6b35]/30"><Bell size={22} className="sm:w-6 sm:h-6" /></button>
        <button type="button" onClick={onOpenFavorites} className="hover:bg-gray-100 p-2 rounded-full transition hover:ring-2 hover:ring-[#ff6b35]/30"><Heart size={22} className="sm:w-6 sm:h-6" /></button>
        <button type="button" className="hover:bg-gray-100 p-2 rounded-full text-[#145142] relative ring-2 ring-transparent hover:ring-[#ff6b35]/30">
            <ShoppingBag size={22} className="sm:w-6 sm:h-6" />
            {cartItems.length > 0 && <span className="absolute top-0 right-0 w-3 h-3 bg-[#ff6b35] rounded-full border-2 border-white"></span>}
        </button>
        <button type="button" onClick={onOpenProfile} className="hover:bg-gray-100 p-2 rounded-full transition hover:ring-2 hover:ring-[#ff6b35]/30"><User size={22} className="sm:w-6 sm:h-6" /></button>
        <button type="button" onClick={onMenuClick} className="hover:bg-gray-100 p-2 rounded-full transition hover:ring-2 hover:ring-[#ff6b35]/30"><Menu size={22} className="sm:w-6 sm:h-6" /></button>
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
    <div className="h-screen overflow-y-auto bg-[#F5F5F7] font-sans pb-20 overflow-x-hidden relative">
      <LogoBackground />
      <Header />
      
      {/* ПРОСТРАНСТВО ПОД ФИКСИРОВАННЫЙ ХЕДЕР */}
      <div className="h-[120px] w-full"></div>

      <div className="relative z-10 max-w-[1600px] mx-auto px-3 sm:px-4 min-w-0">
        
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
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-[#194A38] mb-6 sm:mb-8 leading-tight tracking-tight break-words">
              Ваш заказ ({cartItems.length} товара)
            </h1>

            {cartItems.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-[300px] bg-white rounded-[20px]">
                 <span className="text-2xl text-gray-400 font-bold">Корзина пуста</span>
               </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(280px,28rem)] gap-6 lg:gap-8 items-start w-full min-w-0">
                
                {/* ЛЕВАЯ КОЛОНКА (Товары) */}
                <div className="flex-1 flex flex-col gap-6 min-w-0">
                {/* --- СПИСОК ТОВАРОВ  --- */}
                
                <div className="bg-white rounded-[20px] p-4 sm:p-6 flex flex-col gap-4 min-h-[392px] min-w-0 border border-[#145142]/10">
                  {uniqueItems.map((item) => (
                    <div key={item.id} className="w-full min-w-0 bg-[#D9D9D9] rounded-[20px] p-4 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0" style={{ minHeight: '104px' }}>
                      
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
             <div className="w-full min-w-0 flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start z-20">
                <form
                  className="flex flex-col gap-6 min-w-0"
                  onSubmit={handleOrder}
                  noValidate
                >
                {/* 1. Контактные данные */}
                <div className="bg-white rounded-[30px] p-6 sm:p-8 shadow-sm border border-[#145142]/10">
                   <h2 className="text-xl sm:text-[28px] font-bold text-[#194A38] mb-6">Контактные данные</h2>
                   <div className="flex flex-col gap-4">
                      <input 
                        type="text" 
                        placeholder="Ваше имя *" 
                        className={CHECKOUT_INPUT_CLASS}
                        value={formData.name} 
                        onChange={e => setFormData({...formData, name: e.target.value})} 
                        required 
                      />
                      <div className="flex flex-col gap-1 min-w-0">
                        <input 
                          type="tel" 
                          placeholder="+380501234567 або 0501234567"
                          className={CHECKOUT_INPUT_CLASS} 
                          maxLength={UA_PHONE_MAX_LEN}
                          value={formData.phone}
                          aria-invalid={phoneInvalidHint}
                          // className={`${CHECKOUT_INPUT_CLASS} ${
                          //   phoneInvalidHint
                          //     ? 'ring-2 ring-red-500 focus:ring-red-500'
                          //     : ''
                          // }`} 
                          onChange={e =>
                            setFormData({
                              ...formData,
                              phone: e.target.value.slice(0, UA_PHONE_MAX_LEN),
                            })
                          }
                          required 
                        />
                        {phoneInvalidHint ? (
                          <p className="text-sm font-medium text-red-600 pl-1">{t.cartSection.invalidPhone}</p>
                        ) : null}
                      </div>
                   </div>
                </div>
                {/* 2. Доставка / самовивіз */}
                <div className="bg-white rounded-[30px] p-6 sm:p-8 shadow-sm border border-[#145142]/10 relative z-10">
                   <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                      <h2 className="text-xl sm:text-[28px] font-bold text-[#194A38]">{t.delivery}</h2>
                      {fulfillment === 'delivery' && (
                        <span className="text-[#145142] font-semibold text-sm sm:text-base cursor-pointer flex items-center gap-1 shrink-0">
                          Зона доставки ⓘ
                        </span>
                      )}
                   </div>

                   <div
                     className="mb-6 flex w-full min-w-0 rounded-2xl bg-[#F3F4F6] p-1.5 shadow-inner border border-[#145142]/10"
                     role="group"
                     aria-label={`${t.cartSection.fulfillmentDelivery} / ${t.cartSection.fulfillmentPickup}`}
                   >
                     <button
                       type="button"
                       onClick={() => setFulfillment('delivery')}
                       className={`relative z-10 flex flex-1 min-w-0 items-center justify-center gap-2 rounded-xl py-3 px-2 text-sm font-bold transition-all md:text-base cursor-pointer ${
                         fulfillment === 'delivery'
                           ? 'bg-white text-[#145142] shadow-md ring-2 ring-[#ff6b35]/50'
                           : 'text-gray-500 hover:text-[#145142]'
                       }`}
                     >
                       <Truck className="h-5 w-5 shrink-0" />
                       {t.cartSection.fulfillmentDelivery}
                     </button>
                     <button
                       type="button"
                       onClick={() => setFulfillment('pickup')}
                       className={`relative z-10 flex flex-1 min-w-0 items-center justify-center gap-2 rounded-xl py-3 px-2 text-sm font-bold transition-all md:text-base cursor-pointer ${
                         fulfillment === 'pickup'
                           ? 'bg-white text-[#145142] shadow-md ring-2 ring-[#ff6b35]/50'
                           : 'text-gray-500 hover:text-[#145142]'
                       }`}
                     >
                       <Store className="h-5 w-5 shrink-0" />
                       {t.cartSection.fulfillmentPickup}
                     </button>
                   </div>

                   {fulfillment === 'delivery' ? (
                     <>
                       <div className="flex gap-2 mb-4 flex-wrap" role="group" aria-label="Місто">
                          {cities.map(city => (
                             <button 
                               key={city}
                               type="button"
                               onClick={() => setSelectedCity(city)}
                               className={`px-4 sm:px-6 py-2 rounded-xl font-bold transition border cursor-pointer ${
                                 selectedCity === city
                                   ? 'bg-[#145142] text-white shadow-sm border-[#ff6b35]/50 ring-2 ring-[#ff6b35]/40'
                                   : 'bg-[#F3F4F6] text-gray-600 border-transparent hover:bg-[#145142]/10 hover:text-[#145142]'
                               }`}
                             >
                               {city}
                             </button>
                          ))}
                       </div>

                       <input 
                          type="text" 
                          placeholder="Улица и номер дома *" 
                          className={`${CHECKOUT_INPUT_CLASS} mb-4`}
                          maxLength={STREET_MAX}
                          value={formData.address} 
                          onChange={e =>
                            setFormData({
                              ...formData,
                              address: e.target.value.slice(0, STREET_MAX),
                            })
                          }
                          required 
                          autoComplete="street-address"
                       />

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
                        <input
                        type="number"
                        placeholder="Подъезд (лише цифри)"
                        className={CHECKOUT_INPUT_CLASS}
                        value={formData.entrance}
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                          setFormData({ ...formData, entrance: val });
                        }}
                      />
                          <input
                            type="number"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder="Этаж (лише цифри)"
                            className={CHECKOUT_INPUT_CLASS}
                            min={0}
                            max={9999}
                            maxLength={4}
                            value={formData.floor}
                            onChange={e => {
                              const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                              setFormData({ ...formData, floor: val });
                            }}
                          />
                          <input
                            type="number"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder="Квартира (лише цифри)"
                            className={CHECKOUT_INPUT_CLASS}
                            min={0}
                            max={9999}
                            maxLength={4}
                            value={formData.apartment}
                            onChange={e => {
                              const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                              setFormData({ ...formData, apartment: val });
                            }}
                          />
                          <input
                            type="text"
                            placeholder="Корпус / блок"
                            className={CHECKOUT_INPUT_CLASS}
                            value={formData.buildingBlock}
                            onChange={e => {
                              // Здесь оставляем текст, но ограничиваем длину 4 символами
                              const val = e.target.value.slice(0, 4);
                              setFormData({ ...formData, buildingBlock: val });
                            }}
                          />
                        </div>

                       <div className="flex flex-col gap-3">
                          <label className="flex items-start gap-3 cursor-pointer group">
                             <input
                               type="checkbox"
                               className="mt-0.5 w-5 h-5 shrink-0 accent-[#145142] rounded border-[#145142]/40 focus:ring-2 focus:ring-[#ff6b35]/50"
                               checked={formData.noCallbackConfirm}
                               onChange={e =>
                                 setFormData({
                                   ...formData,
                                   noCallbackConfirm: e.target.checked,
                                 })
                               }
                             />
                             <span className="text-gray-600 group-hover:text-[#145142]">Не перезванивать для подтверждения</span>
                          </label>
                          <label className="flex items-start gap-3 cursor-pointer group">
                             <input
                               type="checkbox"
                               className="mt-0.5 w-5 h-5 shrink-0 accent-[#145142] rounded border-[#145142]/40 focus:ring-2 focus:ring-[#ff6b35]/50"
                               checked={formData.noDoorbellRing}
                               onChange={e =>
                                 setFormData({
                                   ...formData,
                                   noDoorbellRing: e.target.checked,
                                 })
                               }
                             />
                             <span className="text-gray-600 group-hover:text-[#145142]">Не звонить в дверь</span>
                          </label>
                       </div>
                     </>
                   ) : (
                     <div className="rounded-2xl border border-[#145142]/15 bg-gradient-to-br from-[#145142]/[0.07] via-white to-[#ff6b35]/10 p-6 shadow-sm">
                       <p className="text-sm font-semibold uppercase tracking-wide text-[#145142]/80 mb-3">
                         {t.cartSection.pickupAtRestaurant}
                       </p>
                       <div className="flex gap-4 items-start">
                         <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#145142] text-white shadow-lg shadow-[#145142]/30">
                           <MapPin className="h-6 w-6" />
                         </div>
                         <div>
                           <p className="text-lg font-bold text-[#194A38] leading-snug">{pickupAddressDisplay}</p>
                           <p className="mt-2 text-sm text-gray-600">{t.cartSection.pickupSubtitle}</p>
                         </div>
                       </div>
                     </div>
                   )}
                </div>

                {/* 3. Время доставки (Europe/Amsterdam) */}
                <div className="bg-white rounded-[30px] p-6 sm:p-8 shadow-sm border border-[#145142]/10">
                   <h2 className="text-xl sm:text-[28px] font-bold text-[#194A38] mb-2">Время доставки</h2>
                   <p className="text-xs text-gray-500 mb-6">Інтервали за часом Амстердама (CET/CEST). Минулий час недоступний.</p>
                   <div className="flex flex-col sm:grid sm:grid-cols-2 gap-4">
                      <div className="min-w-0">
                         <label className="block text-gray-400 text-sm mb-1">День</label>
                         <select
                           className={`${CHECKOUT_INPUT_CLASS} font-semibold cursor-pointer`}
                           value={deliveryDay}
                           onChange={(e) =>
                             setDeliveryDay(e.target.value as DeliveryDay)
                           }
                         >
                            <option value="today">Сьогодні</option>
                            <option value="tomorrow">Завтра</option>
                         </select>
                      </div>
                      <div className="min-w-0">
                         <label className="block text-gray-400 text-sm mb-1">Час</label>
                         <select
                           className={`${CHECKOUT_INPUT_CLASS} font-semibold cursor-pointer`}
                           value={deliverySlot}
                           onChange={(e) => setDeliverySlot(e.target.value)}
                         >
                            {amsterdamSlots.map((s) => (
                              <option key={s.value} value={s.value}>
                                {s.label}
                              </option>
                            ))}
                         </select>
                      </div>
                   </div>
                </div>

                {/* 4. Комментарий и приборы */}
                <div className="bg-white rounded-[30px] p-6 sm:p-8 shadow-sm border border-[#145142]/10">
                   <h2 className="text-xl sm:text-[28px] font-bold text-[#194A38] mb-6">Детали</h2>
                   <div className="flex flex-col gap-4 mb-4">
                      <div>
                         <label className="block text-gray-400 text-sm mb-1">Кол-во людей (1–99)</label>
                         <div className="flex flex-col gap-2">
                           <input
                             type="range"
                             min={1}
                             max={99}
                             value={Math.min(99, Math.max(1, formData.persons))}
                             onChange={(e) =>
                               setFormData({
                                 ...formData,
                                 persons: Number(e.target.value),
                               })
                             }
                             className="w-full accent-[#145142] h-2 rounded-full"
                           />
                           <input
                             type="number"
                             min={1}
                             max={99}
                             className={CHECKOUT_INPUT_CLASS + ' font-semibold'}
                             value={formData.persons}
                             onChange={(e) => {
                               const raw = parseInt(e.target.value, 10)
                               const v = Number.isFinite(raw)
                                 ? Math.min(99, Math.max(1, raw))
                                 : 1
                               setFormData({ ...formData, persons: v })
                             }}
                           />
                         </div>
                      </div>
                      <div>
                         <label className="block text-gray-400 text-sm mb-1">Учебные палочки</label>
                         <select
                           className={`${CHECKOUT_INPUT_CLASS} font-semibold cursor-pointer`}
                           value={formData.sticks}
                           onChange={(e) =>
                             setFormData({
                               ...formData,
                               sticks: Number(e.target.value),
                             })
                           }
                         >
                            {Array.from({ length: 21 }, (_, i) => (
                              <option key={i} value={i}>
                                {i}
                              </option>
                            ))}
                         </select>
                      </div>
                   </div>
                   <textarea 
                      placeholder="Комментарий к заказу" 
                      className={`${CHECKOUT_INPUT_CLASS} h-32 resize-none min-h-[8rem]`}
                      maxLength={COMMENT_MAX}
                      value={formData.comment} 
                      onChange={e =>
                        setFormData({
                          ...formData,
                          comment: e.target.value.slice(0, COMMENT_MAX),
                        })
                      }
                   />
                   <p className="text-xs text-gray-400 mt-1 text-right">
                     {formData.comment.length}/{COMMENT_MAX}
                   </p>
                </div>
                  
                  {/* 5. Блок Оплаты */}
                  <div className="bg-white rounded-[30px] p-6 sm:p-8 shadow-sm border border-[#145142]/10">
                    <h2 className="text-xl sm:text-[28px] font-bold text-[#194A38] mb-6">Способ оплаты</h2>
                    
                    <div className="flex flex-col gap-3">
                      <label
                        className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition ${
                          paymentMethod === 'CASH'
                            ? 'border-[#145142] bg-[#145142]/5 ring-2 ring-[#ff6b35]/35'
                            : 'border-gray-200 hover:bg-gray-50 hover:border-[#145142]/25'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            paymentMethod === 'CASH' ? 'border-[#145142]' : 'border-gray-300'
                          }`}
                        >
                          {paymentMethod === 'CASH' && (
                            <div className="w-2.5 h-2.5 bg-[#145142] rounded-full" />
                          )}
                        </div>
                        <span className="font-bold text-gray-700">Наличными</span>
                        <input
                          type="radio"
                          name="payment"
                          className="hidden"
                          checked={paymentMethod === 'CASH'}
                          onChange={() => setPaymentMethod('CASH')}
                        />
                      </label>
                      {paymentMethod === 'CASH' && (
                        <input
                          type="number"
                          inputMode="numeric"
                          placeholder="Сдача с какой суммы? (например: 1000)"
                          className={CHECKOUT_INPUT_CLASS}
                          value={formData.needChangeFrom}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              needChangeFrom: e.target.value.replace(/\D/g, '').slice(0, 4),
                            })
                          }
                        />
                      )}

                      <label
                        className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition ${
                          paymentMethod === 'CARD'
                            ? 'border-[#145142] bg-[#145142]/5 ring-2 ring-[#ff6b35]/35'
                            : 'border-gray-200 hover:bg-gray-50 hover:border-[#145142]/25'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            paymentMethod === 'CARD' ? 'border-[#145142]' : 'border-gray-300'
                          }`}>
                            {paymentMethod === 'CARD' && (
                              <div className="w-2.5 h-2.5 bg-[#145142] rounded-full" />
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-700">Картой онлайн</span>
                            <span className="text-xs text-gray-500">LiqPay, Apple Pay, Google Pay</span>
                          </div>
                        </label>
                      </div>
                    </div>
                    {/* 6. Блок Итого (Объединенный с Промокодом) */}
                    <div className="bg-white rounded-[30px] p-6 sm:p-8 shadow-sm flex flex-col gap-6 border border-[#145142]/10">
                      <div className="relative overflow-hidden rounded-[20px] p-4">
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
                                type="button"
                                onClick={handleApplyPromo}
                                className="bg-[#145142] text-white px-5 rounded-[15px] font-bold hover:bg-[#0f3d34] transition flex items-center justify-center shrink-0 border border-[#ff6b35]/30 hover:border-[#ff6b35]/60"
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
                          <PromoInputBg />
                      </div>
                      <div className="w-full h-px bg-gray-200"></div>
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
                          <div className="flex justify-between items-center text-gray-500 text-lg gap-3">
                            <span>
                              {fulfillment === 'pickup'
                                ? t.cartSection.fulfillmentPickup
                                : t.delivery}
                            </span>
                            <span
                              className={`text-right font-semibold ${
                                fulfillment === 'delivery' && deliveryPrice === 0
                                  ? 'text-[#145142]'
                                  : 'text-gray-700'
                              }`}
                            >
                              {fulfillment === 'pickup'
                                ? '—'
                                : deliveryPrice === 0
                                  ? t.cartSection.deliveryFree
                                  : `${deliveryPrice} ₴`}
                            </span>
                          </div>
                          {fulfillment === 'delivery' && deliveryPrice > 0 && (
                            <p className="text-xs text-gray-500 -mt-2">
                              {t.cartSection.deliveryUnlockHint.replace(
                                '{{amount}}',
                                String(freeDeliveryThreshold)
                              )}
                            </p>
                          )}
                          <div className="w-full h-px bg-gray-200 my-2"></div>
                          <div className="flex justify-between items-end">
                            <span className="text-[24px] font-bold text-black">К оплате</span>
                            <span className="text-[32px] font-bold text-[#145142]">{finalPrice + deliveryPrice} ₴</span>
                          </div>
                          <button
                            disabled={isLoading || !canSubmitOrder}
                            type="submit"
                            className="w-full h-[60px] rounded-[15px] text-white text-[20px] font-bold transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2 border border-[#ff6b35]/35 bg-gradient-to-r from-[#145142] via-[#1a6b58] to-[#145142] hover:brightness-105 active:scale-[0.99] ring-2 ring-[#ff6b35]/30 focus-visible:outline-none focus-visible:ring-[#ff6b35]/60"
                          >
                            {isLoading ? 'Обработка...' : 'Подтвердить заказ'}
                          </button>
                          <p className="text-center text-xs text-gray-400 px-2 leading-tight">
                            Нажимая кнопку, вы соглашаетесь с условиями обработки персональных данных
                          </p>
                      </div>
                    </div>
                  </form>
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