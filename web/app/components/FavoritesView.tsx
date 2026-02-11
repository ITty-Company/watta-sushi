'use client'

import { useState, useEffect } from 'react'
import { 
  ArrowLeft, Heart, ShoppingBag, Plus, Trash2
} from 'lucide-react'
import LogoBackground from './LogoBackground'

interface FavoritesViewProps {
  onBack: () => void
  onMenuClick?: () => void
}

interface MenuItem {
  id: number
  name: string // В API может приходить name_ru, но сохраняем мы часто как name
  name_ru?: string
  description: string
  price: number
  imageUrl?: string
  emoji: string
}

export default function FavoritesView({ onBack, onMenuClick }: FavoritesViewProps) {
  const [favorites, setFavorites] = useState<MenuItem[]>([])

  // Загрузка избранного
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('favorites')
      if (saved) {
        try {
          setFavorites(JSON.parse(saved))
        } catch (e) {
          console.error(e)
        }
      }
    }
  }, [])

  // Удаление из избранного
  const removeFavorite = (id: number) => {
    const newFavs = favorites.filter(item => item.id !== id)
    setFavorites(newFavs)
    localStorage.setItem('favorites', JSON.stringify(newFavs))
    // Отправляем событие, чтобы обновить счетчики в других местах, если нужно
    window.dispatchEvent(new Event('favoritesUpdated'))
  }

  // Добавление в корзину
  const addToCart = (item: MenuItem) => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    // Нормализуем имя для корзины (если есть name_ru, используем его)
    const cartItem = { ...item, name: item.name_ru || item.name }
    cart.push(cartItem)
    localStorage.setItem('cart', JSON.stringify(cart))
    window.dispatchEvent(new CustomEvent('cartUpdated'))
    alert('Добавлено в корзину!')
  }

  // --- ХЕДЕР (Как в Профиле) ---
  const Header = () => (
    <div className="fixed top-4 left-0 right-0 w-[95%] max-w-[1800px] h-[80px] mx-auto bg-white rounded-[20px] shadow-lg flex items-center justify-between px-6 z-[500]">
      {/* Левая часть: Стрелка и Лого */}
      <div className="flex items-center gap-4">
        <button 
          onClick={onBack}
          className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition"
        >
          <ArrowLeft size={20} className="text-gray-700" />
        </button>
        
        <div className="flex items-center gap-2 select-none">
          <img src="/logo.png" alt="Logo" className="h-10 w-10 object-contain" />
          <img src="/1.jpg" alt="Watta Sushi" className="h-6 w-auto object-contain hidden md:block" />
        </div>
      </div>

      {/* Правая часть: Заголовок */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 text-xl font-bold text-black">
        Избранное
      </div>

      {/* Пустое место справа для баланса или доп иконок */}
      <div className="w-10"></div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F3F4F6] font-sans text-[#145142] pt-[120px] pb-20 overflow-x-hidden relative">
      <LogoBackground />
      <div className="relative z-10">
        <Header />

      <div className="max-w-[1200px] mx-auto px-4">
        {favorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm">
              <Heart size={40} className="text-gray-300" />
            </div>
            <h2 className="text-3xl font-bold text-black mb-2">В избранном пусто</h2>
            <p className="text-gray-500 mb-8">Добавляйте любимые блюда, чтобы не потерять их</p>
            <button 
              onClick={onBack}
              className="bg-[#145142] text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-[#0f3d32] transition shadow-lg"
            >
              Перейти в меню
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map(item => (
              <div key={item.id} className="bg-white p-5 rounded-[25px] shadow-sm hover:shadow-md transition relative group">
                
                {/* Кнопка удалить */}
                <button 
                  onClick={() => removeFavorite(item.id)}
                  className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition p-2"
                >
                  <Trash2 size={20} />
                </button>

                <div className="flex flex-col h-full">
                  {/* Изображение */}
                  <div className="w-full h-[200px] bg-gray-100 rounded-[20px] overflow-hidden mb-4 relative">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-6xl">
                        {item.emoji}
                      </div>
                    )}
                  </div>

                  {/* Инфо */}
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-black mb-2 leading-tight">
                      {item.name_ru || item.name}
                    </h3>
                    <p className="text-gray-500 text-sm line-clamp-2 mb-4">
                      {item.description}
                    </p>
                  </div>

                  {/* Цена и кнопка */}
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-2xl font-bold text-black">{item.price} ₴</span>
                    <button 
                      onClick={() => addToCart(item)}
                      className="bg-[#145142] text-white w-12 h-12 rounded-full flex items-center justify-center hover:bg-[#0f3d32] transition shadow-lg shadow-green-900/20 active:scale-95"
                    >
                      <Plus size={24} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  )
}