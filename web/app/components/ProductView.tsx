'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, Phone, Bell, Heart, ShoppingBag, User, Menu, Edit, 
  Minus, Plus 
} from 'lucide-react'
import LogoBackground from './LogoBackground' // Убедитесь, что путь правильный

// 1. ОПИСЫВАЕМ ПРОПСЫ (Модель как в корзине)
interface ProductViewProps {
  productId: string // ID товара, чтобы загрузить его
  isAdmin: boolean
  
  // Навигация
  onBack: () => void
  onOpenProfile: () => void
  onOpenFavorites: () => void
  onOpenPhone: () => void
  onOpenNotifications: () => void
  onMenuClick: () => void
  onCartClick: () => void
}

export default function ProductView({
  productId,
  isAdmin,
  onBack,
  onOpenProfile,
  onOpenFavorites,
  onOpenPhone,
  onOpenNotifications,
  onMenuClick,
  onCartClick
}: ProductViewProps) {

  // --- ЛОГИКА ТОВАРА (State, Fetch и т.д.) ---
  const [product, setProduct] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [cartCount, setCartCount] = useState(0) // Заглушка или из контекста

  // Загрузка товара
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/${productId}`)
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
    if (productId) fetchProduct()
  }, [productId])

  // --- ХЕДЕР, КОТОРЫЙ ИСПОЛЬЗУЕТ ПРОПСЫ ---
  const Header = () => (
    <div className="fixed top-4 left-0 right-0 w-[95%] max-w-[1800px] h-[80px] mx-auto bg-white rounded-[20px] shadow-lg flex items-center justify-between px-6 z-50">
      <div className="flex items-center gap-2 cursor-pointer" onClick={onBack}>
        <img src="/logo.png" alt="Logo" className="h-10 w-10 object-contain" />
        <img src="/1.jpg" alt="Watta Sushi" className="h-6 w-auto object-contain" />
      </div>

      <div className="flex items-center gap-3 md:gap-6 text-gray-700">
        <button onClick={onOpenPhone} className="hover:bg-gray-100 p-2 rounded-full transition"><Phone size={24} /></button>
        <button onClick={onOpenNotifications} className="hover:bg-gray-100 p-2 rounded-full transition relative">
            <Bell size={24} />
            {/* Точка уведомлений */}
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        <button onClick={onOpenFavorites} className="hover:bg-gray-100 p-2 rounded-full transition"><Heart size={24} /></button>
        
        {/* Корзина */}
        <button onClick={onCartClick} className="hover:bg-gray-100 p-2 rounded-full text-[#145142] relative transition">
            <ShoppingBag size={24} />
            {cartCount > 0 && <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>}
        </button>
        
        <button onClick={onOpenProfile} className="hover:bg-gray-100 p-2 rounded-full transition"><User size={24} /></button>
        <button onClick={onMenuClick} className="hover:bg-gray-100 p-2 rounded-full transition"><Menu size={24} /></button>
      </div>
    </div>
  )

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Загрузка...</div>
  if (!product) return <div className="min-h-screen flex items-center justify-center">Товар не найден</div>

  // --- ОСНОВНОЙ РЕНДЕР ---
  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-20 font-sans">
      <LogoBackground />
      <Header />
      
      <div className="h-[120px] w-full"></div>

      <div className="relative z-10 max-w-4xl mx-auto px-4">
          
          {/* Кнопки Назад / Редактировать */}
          <div className="mb-8 flex items-center gap-3">
             <button 
                onClick={onBack}
                className="bg-white px-6 py-3 rounded-[15px] flex items-center gap-2 text-[#145142] font-bold shadow-sm hover:bg-white/80 transition w-fit"
              >
                <ArrowLeft size={20} /> Назад
              </button>

              {isAdmin && (
                <Link 
                  href={`/?adminMode=true&editProduct=${product.id}`}
                  className="bg-[#145142] px-6 py-3 rounded-[15px] flex items-center gap-2 text-white font-bold shadow-sm hover:bg-[#104034] transition"
                >
                  <Edit size={20} /> Ред.
                </Link>
              )}
          </div>

          {/* Карточка товара */}
          <div className="bg-white min-h-screen shadow-xl overflow-hidden relative rounded-t-3xl">
             <div className="w-full h-[300px] sm:h-[450px] relative bg-gray-100">
                {product.imageUrl ? (
                  <img src={product.imageUrl} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-6xl">🍣</div>
                )}
             </div>

             <div className="px-5 sm:px-10 py-8 relative z-10">
                 <div className="flex justify-between items-start mb-4">
                     <h1 className="text-3xl sm:text-4xl font-extrabold text-[#145142]">{product.name_ru}</h1>
                     <div className="bg-[#ff6b35] text-white px-4 py-2 rounded-2xl text-xl font-bold shadow-lg shadow-orange-200">
                         {product.price} ₴
                     </div>
                 </div>

                 <p className="text-gray-500 text-lg leading-relaxed mb-8">{product.description_ru}</p>

                 {/* Ингредиенты */}
                 {product.ingredients && product.ingredients.length > 0 && (
                   <div className="mb-8">
                     <h3 className="text-[#145142] font-bold mb-3 text-lg">Склад:</h3>
                     <div className="flex gap-2 overflow-x-auto pb-4 snap-x scrollbar-hide">
                       {product.ingredients.map((ing: any) => (
                         <div key={ing.id} className="flex-shrink-0 w-24 bg-white rounded-xl p-3 flex flex-col items-center border border-gray-100">
                           <img src={ing.imageUrl} className="w-12 h-12 object-contain mb-2" />
                           <span className="text-xs font-medium text-center">{ing.name_ru}</span>
                         </div>
                       ))}
                     </div>
                   </div>
                 )}

                 {/* Кнопка В корзину (Заглушка логики) */}
                 <button className="w-full bg-[#145142] text-white py-4 rounded-2xl font-bold text-xl shadow-xl flex items-center justify-center gap-3 mb-12 hover:bg-[#103d34] transition">
                     <ShoppingBag /> В кошик
                 </button>
             </div>
          </div>
      </div>
    </div>
  )
}