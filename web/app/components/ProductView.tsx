// 'use client'

// import React, { useState, useEffect } from 'react'
// import Link from 'next/link'
// import { 
//   ArrowLeft, Phone, Bell, Heart, ShoppingBag, User, Menu, Edit, 
//   Minus, Plus 
// } from 'lucide-react'
// import LogoBackground from './LogoBackground' // Убедитесь, что путь правильный

// // 1. ОПИСЫВАЕМ ПРОПСЫ (Модель как в корзине)
// interface ProductViewProps {
//   productId: string // ID товара, чтобы загрузить его
//   isAdmin: boolean
  
//   // Навигация
//   onBack: () => void
//   onOpenProfile: () => void
//   onOpenFavorites: () => void
//   onOpenPhone: () => void
//   onOpenNotifications: () => void
//   onMenuClick: () => void
//   onCartClick: () => void
// }

// export default function ProductView({
//   productId,
//   isAdmin,
//   onBack,
//   onOpenProfile,
//   onOpenFavorites,
//   onOpenPhone,
//   onOpenNotifications,
//   onMenuClick,
//   onCartClick
// }: ProductViewProps) {

//   // --- ЛОГИКА ТОВАРА (State, Fetch и т.д.) ---
//   const [product, setProduct] = useState<any>(null)
//   const [isLoading, setIsLoading] = useState(true)
//   const [cartCount, setCartCount] = useState(0) // Заглушка или из контекста

//   // Загрузка товара
//   useEffect(() => {
//     const fetchProduct = async () => {
//       try {
//         const res = await fetch(`/api/products/${productId}`)
//         if (res.ok) {
//           const data = await res.json()
//           setProduct(data)
//         }
//       } catch (e) {
//         console.error(e)
//       } finally {
//         setIsLoading(false)
//       }
//     }
//     if (productId) fetchProduct()
//   }, [productId])

//   // --- ХЕДЕР, КОТОРЫЙ ИСПОЛЬЗУЕТ ПРОПСЫ ---
//   const Header = () => (
//     <div className="fixed top-4 left-0 right-0 w-[95%] max-w-[1800px] h-[80px] mx-auto bg-white rounded-[20px] shadow-lg flex items-center justify-between px-6 z-50">
//       <div className="flex items-center gap-2 cursor-pointer" onClick={onBack}>
//         <img src="/logo.png" alt="Logo" className="h-10 w-10 object-contain" />
//         <img src="/1.jpg" alt="Watta Sushi" className="h-6 w-auto object-contain" />
//       </div>

//       <div className="flex items-center gap-3 md:gap-6 text-gray-700">
//         <button onClick={onOpenPhone} className="hover:bg-gray-100 p-2 rounded-full transition"><Phone size={24} /></button>
//         <button onClick={onOpenNotifications} className="hover:bg-gray-100 p-2 rounded-full transition relative">
//             <Bell size={24} />
//             {/* Точка уведомлений */}
//             <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
//         </button>
//         <button onClick={onOpenFavorites} className="hover:bg-gray-100 p-2 rounded-full transition"><Heart size={24} /></button>
        
//         {/* Корзина */}
//         <button onClick={onCartClick} className="hover:bg-gray-100 p-2 rounded-full text-[#145142] relative transition">
//             <ShoppingBag size={24} />
//             {cartCount > 0 && <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>}
//         </button>
        
//         <button onClick={onOpenProfile} className="hover:bg-gray-100 p-2 rounded-full transition"><User size={24} /></button>
//         <button onClick={onMenuClick} className="hover:bg-gray-100 p-2 rounded-full transition"><Menu size={24} /></button>
//       </div>
//     </div>
//   )

//   if (isLoading) return <div className="min-h-screen flex items-center justify-center">Загрузка...</div>
//   if (!product) return <div className="min-h-screen flex items-center justify-center">Товар не найден</div>

//   // --- ОСНОВНОЙ РЕНДЕР ---
//   return (
//     <div className="min-h-screen bg-[#F9FAFB] pb-20 font-sans">
//       <LogoBackground />
//       <Header />
      
//       <div className="h-[120px] w-full"></div>

//       <div className="relative z-10 max-w-4xl mx-auto px-4">
          
//           {/* Кнопки Назад / Редактировать */}
//           <div className="mb-8 flex items-center gap-3">
//              <button 
//                 onClick={onBack}
//                 className="bg-white px-6 py-3 rounded-[15px] flex items-center gap-2 text-[#145142] font-bold shadow-sm hover:bg-white/80 transition w-fit"
//               >
//                 <ArrowLeft size={20} /> Назад
//               </button>

//               {isAdmin && (
//                 <Link 
//                   href={`/?adminMode=true&editProduct=${product.id}`}
//                   className="bg-[#145142] px-6 py-3 rounded-[15px] flex items-center gap-2 text-white font-bold shadow-sm hover:bg-[#104034] transition"
//                 >
//                   <Edit size={20} /> Ред.
//                 </Link>
//               )}
//           </div>

//           {/* Карточка товара */}
//           <div className="bg-white min-h-screen shadow-xl overflow-hidden relative rounded-t-3xl">
//              <div className="w-full h-[300px] sm:h-[450px] relative bg-gray-100">
//                 {product.imageUrl ? (
//                   <img src={product.imageUrl} className="w-full h-full object-cover" />
//                 ) : (
//                   <div className="w-full h-full flex items-center justify-center text-6xl">🍣</div>
//                 )}
//              </div>

//              <div className="px-5 sm:px-10 py-8 relative z-10">
//                  <div className="flex justify-between items-start mb-4">
//                      <h1 className="text-3xl sm:text-4xl font-extrabold text-[#145142]">{product.name_ru}</h1>
//                      <div className="bg-[#ff6b35] text-white px-4 py-2 rounded-2xl text-xl font-bold shadow-lg shadow-orange-200">
//                          {product.price} ₴
//                      </div>
//                  </div>

//                  <p className="text-gray-500 text-lg leading-relaxed mb-8">{product.description_ru}</p>

//                  {/* Ингредиенты */}
//                  {product.ingredients && product.ingredients.length > 0 && (
//                    <div className="mb-8">
//                      <h3 className="text-[#145142] font-bold mb-3 text-lg">Склад:</h3>
//                      <div className="flex gap-2 overflow-x-auto pb-4 snap-x scrollbar-hide">
//                        {product.ingredients.map((ing: any) => (
//                          <div key={ing.id} className="flex-shrink-0 w-24 bg-white rounded-xl p-3 flex flex-col items-center border border-gray-100">
//                            <img src={ing.imageUrl} className="w-12 h-12 object-contain mb-2" />
//                            <span className="text-xs font-medium text-center">{ing.name_ru}</span>
//                          </div>
//                        ))}
//                      </div>
//                    </div>
//                  )}

//                  {/* Кнопка В корзину (Заглушка логики) */}
//                  <button className="w-full bg-[#145142] text-white py-4 rounded-2xl font-bold text-xl shadow-xl flex items-center justify-center gap-3 mb-12 hover:bg-[#103d34] transition">
//                      <ShoppingBag /> В кошик
//                  </button>
//              </div>
//           </div>
//       </div>
//     </div>
//   )
// }

'use client'

import React, { useState, useEffect } from 'react'
import { 
  ArrowLeft, Heart, Minus, Plus, ShoppingBag, Truck, Info 
} from 'lucide-react'
import LogoBackground from './LogoBackground'
import { useLanguage } from '../context/LanguageContext'
import { getApiUrl } from '@/lib/utils'

interface ProductViewProps {
  productId: string
  isAdmin?: boolean
  onBack: () => void
  onOpenProfile: () => void
  onOpenFavorites: () => void
  onOpenNotifications: () => void
  onMenuClick: () => void
  onCartClick: () => void
  onOpenPhone: () => void
}

interface Product {
  id: number
  name_ru: string
  name_ua?: string
  name_en?: string
  name_nl?: string
  description_ru?: string
  description_ua?: string
  description_en?: string
  description_nl?: string
  price: number
  imageUrl?: string
  categoryId: number
  weight?: number // Если есть вес
  ingredients?: any[]
}

export default function ProductView({
  productId,
  onBack,
  onCartClick
}: ProductViewProps) {
  // @ts-ignore
  const { t, language } = useLanguage()
  const [product, setProduct] = useState<Product | null>(null)
  const [recommendations, setRecommendations] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [isFavorite, setIsFavorite] = useState(false)
  
  // Анимация добавления
  const [isAdding, setIsAdding] = useState(false)

  // Получаем правильное название/описание в зависимости от языка
  const getName = (p: Product) => (p as any)[`name_${language}`] || p.name_ru
  const getDesc = (p: Product) => (p as any)[`description_${language}`] || p.description_ru || ''

  useEffect(() => {
    fetchProductData()
    checkIfFavorite()
    fetchRecommendations()
  }, [productId])

  const fetchProductData = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(getApiUrl(`/api/products/${productId}`))
      if (res.ok) {
        const data = await res.json()
        setProduct(data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchRecommendations = async () => {
    try {
      // Загружаем все товары и берем случайные 4 (или по категории)
      const res = await fetch(getApiUrl('/api/products'))
      if (res.ok) {
        const all = await res.json()
        // Фильтруем текущий товар
        const others = all.filter((p: Product) => p.id !== Number(productId))
        // Перемешиваем и берем 4
        setRecommendations(others.sort(() => 0.5 - Math.random()).slice(0, 4))
      }
    } catch (e) { console.error(e) }
  }

  const checkIfFavorite = () => {
    if (typeof window === 'undefined') return
    const favs = JSON.parse(localStorage.getItem('favorites') || '[]')
    setIsFavorite(favs.includes(Number(productId)))
  }

  const toggleFavorite = () => {
    if (!product) return
    const favs = JSON.parse(localStorage.getItem('favorites') || '[]')
    let newFavs
    if (favs.includes(product.id)) {
      newFavs = favs.filter((id: number) => id !== product.id)
      setIsFavorite(false)
    } else {
      newFavs = [...favs, product.id]
      setIsFavorite(true)
    }
    localStorage.setItem('favorites', JSON.stringify(newFavs))
    // Отправляем событие для обновления счетчиков
    window.dispatchEvent(new CustomEvent('favoritesUpdated'))
  }

  const addToCart = () => {
    if (!product) return
    
    setIsAdding(true)
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    
    // Ищем, есть ли уже такой товар
    const existingItemIndex = cart.findIndex((item: any) => item.id === product.id)
    
    if (existingItemIndex > -1) {
       // Если есть, просто добавляем количество, но не больше 99
       // Можно добавить логику увеличения
       for(let i=0; i<quantity; i++) {
         cart.push({ ...product, quantity: 1 }) 
       }
    } else {
       // Добавляем N раз (в вашей логике корзины элементы дублируются или имеют поле quantity?)
       // Исходя из вашего CartView, вы используете массив дубликатов.
       for(let i=0; i<quantity; i++) {
         cart.push(product)
       }
    }
    
    localStorage.setItem('cart', JSON.stringify(cart))
    window.dispatchEvent(new CustomEvent('cartUpdated'))
    
    setTimeout(() => {
        setIsAdding(false)
        onBack() // Или остаться на странице? Обычно возвращаются в меню или показывают уведомление.
        // onCartClick() // Можно перекинуть в корзину
    }, 500)
  }

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-[#F5F5F7] text-[#145142]">Завантаження...</div>
  if (!product) return <div className="min-h-screen flex items-center justify-center bg-[#F5F5F7]">Товар не знайдено</div>

  return (
    <div className="min-h-screen bg-[#F5F5F7] font-sans pb-32 relative">
      <LogoBackground />

      {/* --- HEADER (Как в корзине/профиле) --- */}
      <div className="fixed top-0 left-0 right-0 z-50 px-4 py-4 sm:py-6">
         <div className="max-w-[1600px] mx-auto flex items-center justify-between">
            <button 
                onClick={onBack} 
                className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-[14px] flex items-center justify-center text-[#145142] shadow-sm hover:scale-105 transition active:scale-95"
            >
                <ArrowLeft size={20} strokeWidth={2.5} />
            </button>
            
            <h1 className="text-lg font-bold text-[#145142] bg-white/80 backdrop-blur-md px-6 py-2 rounded-full shadow-sm opacity-0 sm:opacity-100 transition">
                {getName(product)}
            </h1>

            <button 
                onClick={onCartClick} 
                className="w-10 h-10 sm:w-12 sm:h-12 bg-[#145142] rounded-[14px] flex items-center justify-center text-white shadow-lg hover:bg-[#0f3d32] transition active:scale-95 relative"
            >
                <ShoppingBag size={20} />
                {/* Здесь можно добавить бейдж количества, если нужно */}
            </button>
         </div>
      </div>

      <div className="pt-24 sm:pt-32 px-4 max-w-[1200px] mx-auto">
         
         <div className="flex flex-col md:flex-row gap-6 md:gap-12">
            
            {/* --- ЛЕВАЯ КОЛОНКА: ФОТО --- */}
            <div className="w-full md:w-1/2">
                <div className="relative aspect-square rounded-[30px] overflow-hidden bg-white shadow-lg border border-white/50">
                    {product.imageUrl ? (
                        <img src={product.imageUrl} alt={getName(product)} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100 text-4xl">🍱</div>
                    )}
                    
                    {/* Кнопка Избранное на фото */}
                    <button 
                        onClick={toggleFavorite}
                        className="absolute top-4 right-4 w-12 h-12 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg active:scale-90 transition z-10"
                    >
                        <Heart 
                            size={24} 
                            className={`transition-colors ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} 
                        />
                    </button>
                </div>
            </div>

            {/* --- ПРАВАЯ КОЛОНКА: ИНФО --- */}
            <div className="w-full md:w-1/2 flex flex-col">
                <div className="bg-white rounded-[30px] p-6 sm:p-8 shadow-sm h-full flex flex-col relative overflow-hidden">
                    {/* Декор */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#145142]/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                    <div className="flex justify-between items-start mb-4">
                        <h1 className="text-2xl sm:text-4xl font-black text-[#194A38] leading-tight">
                            {getName(product)}
                        </h1>
                        <div className="text-2xl sm:text-3xl font-bold text-[#145142] whitespace-nowrap">
                            {product.price} ₴
                        </div>
                    </div>

                    <p className="text-gray-500 text-lg mb-6 leading-relaxed">
                        {getDesc(product)}
                    </p>

                    {/* Доп инфо (вес, время) */}
                    <div className="flex gap-4 mb-8">
                        <div className="px-4 py-2 bg-[#F5F5F7] rounded-xl text-[#145142] font-bold text-sm flex items-center gap-2">
                             <span>⚖️</span> {product.weight ? `${product.weight} г` : '250 г'}
                        </div>
                        <div className="px-4 py-2 bg-[#F5F5F7] rounded-xl text-[#145142] font-bold text-sm flex items-center gap-2">
                             <span>⏱️</span> 30-40 хв
                        </div>
                    </div>

                    {/* Ингредиенты (если есть в базе) */}
                    {product.ingredients && product.ingredients.length > 0 && (
                        <div className="mb-8">
                            <h3 className="font-bold text-[#194A38] mb-3">Інгредієнти:</h3>
                            <div className="flex flex-wrap gap-3">
                                {product.ingredients.map((ing: any) => (
                                    <div key={ing.id} className="flex flex-col items-center gap-1">
                                        <div className="w-12 h-12 bg-[#F5F5F7] rounded-xl p-2 flex items-center justify-center">
                                            <img src={ing.imageUrl} className="w-full h-full object-contain" />
                                        </div>
                                        <span className="text-[10px] text-gray-500 font-bold">{ing.name_ru}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="mt-auto">
                        <div className="flex items-center gap-4">
                            {/* СЧЕТЧИК */}
                            <div className="flex items-center bg-[#F5F5F7] rounded-[20px] p-1.5">
                                <button 
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    className="w-12 h-12 bg-white rounded-[16px] flex items-center justify-center text-[#145142] shadow-sm hover:scale-105 active:scale-95 transition"
                                >
                                    <Minus size={20} strokeWidth={3} />
                                </button>
                                <span className="w-12 text-center text-xl font-black text-[#194A38]">
                                    {quantity}
                                </span>
                                <button 
                                    onClick={() => setQuantity(Math.min(99, quantity + 1))}
                                    className="w-12 h-12 bg-[#145142] rounded-[16px] flex items-center justify-center text-white shadow-lg hover:scale-105 active:scale-95 transition"
                                >
                                    <Plus size={20} strokeWidth={3} />
                                </button>
                            </div>

                            {/* КНОПКА КУПИТЬ */}
                            <button 
                                onClick={addToCart}
                                disabled={isAdding}
                                className="flex-1 h-[60px] bg-[#145142] text-white rounded-[20px] font-bold text-xl shadow-xl shadow-[#145142]/20 hover:bg-[#0f3d32] active:scale-[0.98] transition flex items-center justify-center gap-3"
                            >
                                {isAdding ? (
                                    <span>Додаємо...</span>
                                ) : (
                                    <>
                                        <span>У кошик</span>
                                        <span className="bg-white/20 px-2 py-0.5 rounded-lg text-sm">
                                            {product.price * quantity} ₴
                                        </span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                </div>
            </div>
         </div>

         {/* --- РЕКОМЕНДАЦИИ (Внизу) --- */}
         {recommendations.length > 0 && (
             <div className="mt-16 mb-8 animate-in fade-in slide-in-from-bottom-10 duration-500">
                 <h2 className="text-2xl font-bold text-[#194A38] mb-6 px-2">Вам також може сподобатися</h2>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     {recommendations.map(rec => (
                         <div 
                            key={rec.id} 
                            onClick={() => window.location.href = `/product/${rec.id}`}
                            className="bg-white p-4 rounded-[25px] cursor-pointer hover:shadow-lg transition-all border border-transparent hover:border-[#145142]/10 group"
                         >
                             <div className="aspect-square bg-[#F5F5F7] rounded-[18px] mb-3 overflow-hidden">
                                {rec.imageUrl ? (
                                    <img src={rec.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-2xl">🍣</div>
                                )}
                             </div>
                             <h3 className="font-bold text-[#194A38] truncate">{getName(rec)}</h3>
                             <p className="text-gray-400 text-xs line-clamp-1 mb-2">{getDesc(rec)}</p>
                             <div className="font-bold text-black">{rec.price} ₴</div>
                         </div>
                     ))}
                 </div>
             </div>
         )}

      </div>
    </div>
  )
}