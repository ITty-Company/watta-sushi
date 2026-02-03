'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Minus, Plus, ShoppingBag } from 'lucide-react'
import { Header } from '../../Header' // Убедитесь, что импорт правильный (с фигурными скобками)

// Типы
interface Product {
  id: number
  name_ru: string
  description_ru: string
  price: number
  imageUrl?: string
  categoryId: number
  category?: { name_ru: string }
}

// Моковые ингредиенты
const AVAILABLE_EXTRAS = [
  { id: 1, name: 'Ореховый соус', price: 20 },
  { id: 2, name: 'Унаги соус', price: 20 },
  { id: 3, name: 'Имбирь', price: 10 },
  { id: 4, name: 'Васаби', price: 10 },
]

const REMOVABLE_INGREDIENTS = [
  'Зеленый лук', 'Кунжут', 'Соус спайси'
]

export default function ProductPage() {
  const params = useParams()
  const router = useRouter()
  
  const [product, setProduct] = useState<Product | null>(null)
  const [recommendations, setRecommendations] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  
  // Состояние корзины для Header
  const [cartCount, setCartCount] = useState(0)

  // Состояние модификаторов
  const [extras, setExtras] = useState<number[]>([]) 
  const [removed, setRemoved] = useState<string[]>([]) 

  const productId = params.id

  // Функция обновления счетчика корзины
  const updateCartCount = () => {
    try {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]')
      const count = cart.reduce((acc: number, item: any) => acc + (item.quantity || 1), 0)
      setCartCount(count)
    } catch (e) {
      setCartCount(0)
    }
  }

  // Загрузка данных
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const prodRes = await fetch(`/api/products/${productId}`)
        if (prodRes.ok) {
            const data = await prodRes.json()
            setProduct(data)
        }

        const recRes = await fetch('/api/products/recommendations')
        if (recRes.ok) {
            const data = await recRes.json()
            setRecommendations(data.filter((i: Product) => i.id !== Number(productId)))
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }

    if (productId) fetchData()
    
    setExtras([])
    setRemoved([])
    
    // Инициализация корзины
    updateCartCount()
    
    // Слушаем событие обновления корзины (если добавили товар)
    window.addEventListener('cartUpdated', updateCartCount)
    return () => window.removeEventListener('cartUpdated', updateCartCount)
  }, [productId])

  const toggleExtra = (id: number) => {
    setExtras(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const toggleRemove = (name: string) => {
    setRemoved(prev => prev.includes(name) ? prev.filter(i => i !== name) : [...prev, name])
  }

  const addToCart = () => {
    if (!product) return

    const extrasCost = extras.reduce((sum, id) => {
        const extra = AVAILABLE_EXTRAS.find(e => e.id === id)
        return sum + (extra ? extra.price : 0)
    }, 0)
    
    const cartItem = {
        id: product.id,
        name: `${product.name_ru} ${extras.length > 0 ? '(+ допы)' : ''}`,
        description: product.description_ru,
        price: product.price + extrasCost,
        category: product.category?.name_ru || '',
        emoji: '🍱',
        imageUrl: product.imageUrl,
        quantity: 1
    }

    const currentCart = JSON.parse(localStorage.getItem('cart') || '[]')
    currentCart.push(cartItem)
    localStorage.setItem('cart', JSON.stringify(currentCart))
    
    // Генерируем событие, чтобы обновить счетчик здесь же
    window.dispatchEvent(new CustomEvent('cartUpdated'))
    
    alert('Добавлено в корзину!')
  }

  const handleOpenCart = () => {
    // Т.к. мы на отдельной странице, просто возвращаем на главную (где откроется корзина, если нужно)
    // Либо просто переходим в меню
    router.push('/')
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-[#145142]">Загрузка...</div>
  if (!product) return <div className="min-h-screen flex items-center justify-center">Товар не найден</div>

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-20">
      {/* ПЕРЕДАЕМ ПРОПСЫ В HEADER */}
      <Header cartCount={cartCount} onOpenCart={handleOpenCart} />
      
      <div className="h-[100px]"></div>

      <div className="fixed top-24 left-4 z-40">
        <button 
          onClick={() => router.back()}
          className="bg-white p-3 rounded-xl shadow-md text-[#145142] hover:bg-gray-50 transition-all flex items-center gap-2 font-bold"
        >
          <ArrowLeft size={20} /> Назад
        </button>
      </div>

      <div className="max-w-4xl mx-auto bg-white min-h-screen shadow-xl overflow-hidden relative rounded-t-3xl mt-4">
        
        <div className="w-full h-[300px] sm:h-[450px] relative bg-gray-100">
           {product.imageUrl ? (
             <img src={product.imageUrl} className="w-full h-full object-cover" alt={product.name_ru} />
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

            <div className="mb-8">
                <h3 className="text-[#145142] font-bold mb-3 flex items-center gap-2">
                    <Minus size={18} className="text-red-500" /> Убрать ингредиенты
                </h3>
                <div className="flex flex-wrap gap-2">
                    {REMOVABLE_INGREDIENTS.map(ing => (
                        <button
                            key={ing}
                            onClick={() => toggleRemove(ing)}
                            className={`px-3 py-1.5 rounded-lg border transition-all text-sm font-medium ${
                                removed.includes(ing) 
                                ? 'bg-red-50 border-red-200 text-red-500 line-through decoration-red-500' 
                                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                            }`}
                        >
                            {ing}
                        </button>
                    ))}
                </div>
            </div>

            <div className="mb-10">
                <h3 className="text-[#145142] font-bold mb-3 flex items-center gap-2">
                    <Plus size={18} className="text-green-600" /> Добавить
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {AVAILABLE_EXTRAS.map(extra => (
                        <button
                            key={extra.id}
                            onClick={() => toggleExtra(extra.id)}
                            className={`flex justify-between items-center p-3 rounded-xl border transition-all ${
                                extras.includes(extra.id)
                                ? 'border-[#145142] bg-[#145142]/5 ring-1 ring-[#145142]'
                                : 'border-gray-100 bg-gray-50 hover:bg-gray-100'
                            }`}
                        >
                            <span className="text-[#145142] font-medium">{extra.name}</span>
                            <span className="text-[#ff6b35] font-bold">+{extra.price} ₴</span>
                        </button>
                    ))}
                </div>
            </div>

            <button 
                onClick={addToCart}
                className="w-full bg-[#145142] text-white py-4 rounded-2xl font-bold text-xl shadow-xl shadow-[#145142]/30 active:scale-[0.98] transition-all flex items-center justify-center gap-3 mb-12"
            >
                <ShoppingBag /> Добавить в корзину
            </button>

            <div className="border-t border-gray-100 pt-8 mb-12">
                <h3 className="text-2xl font-bold text-[#145142] mb-6">Попробуйте также</h3>
                <div className="grid grid-cols-2 gap-4">
                    {recommendations.map(rec => (
                        <Link href={`/product/${rec.id}`} key={rec.id} className="block group">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all">
                                <div className="h-32 bg-gray-100 relative overflow-hidden">
                                     {rec.imageUrl ? <img src={rec.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : null}
                                </div>
                                <div className="p-3">
                                    <h4 className="font-bold text-[#145142] text-sm line-clamp-1">{rec.name_ru}</h4>
                                    <p className="text-[#ff6b35] font-bold text-sm mt-1">{rec.price} ₴</p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

        </div>
      </div>
    </div>
  )
}