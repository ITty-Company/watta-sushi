'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Minus, Plus, ShoppingBag, Edit } from 'lucide-react'
import { Header } from '../../Header'
import { useLanguage } from '../../context/LanguageContext' // Импорт языка

// Расширенный тип продукта с переводами
interface Product {
  id: number
  name_ru: string
  name_ua?: string
  name_en?: string
  name_nl?: string
  description_ru: string
  description_ua?: string
  description_en?: string
  description_nl?: string
  price: number
  imageUrl?: string
  categoryId: number
  category?: { name_ru: string }
}

const AVAILABLE_EXTRAS = [
  { id: 1, name: 'Горіховий соус', price: 20 },
  { id: 2, name: 'Унагі соус', price: 20 },
  { id: 3, name: 'Імбир', price: 10 },
  { id: 4, name: 'Васабі', price: 10 },
]

const REMOVABLE_INGREDIENTS = [
  'Цибуля зелена', 'Кунжут', 'Соус спайсі'
]

export default function ProductPage() {
  const params = useParams()
  const router = useRouter()
  const { language } = useLanguage() // Получаем текущий язык ('ru', 'ua', 'en', 'nl')
  
  const [product, setProduct] = useState<Product | null>(null)
  const [recommendations, setRecommendations] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [cartCount, setCartCount] = useState(0)
  const [isAdmin, setIsAdmin] = useState(false) // Проверка на админа

  const [extras, setExtras] = useState<number[]>([]) 
  const [removed, setRemoved] = useState<string[]>([]) 

  const productId = params.id

  // Хелпер для перевода
  const t = (field: 'name' | 'description', item: Product) => {
    // Формируем ключ, например name_ua
    const key = `${field}_${language}` as keyof Product;
    // Если перевода нет, откатываемся на RU
    return (item[key] as string) || item[`${field}_ru`] || '';
  }

  const updateCartCount = () => {
    try {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]')
      const count = cart.reduce((acc: number, item: any) => acc + (item.quantity || 1), 0)
      setCartCount(count)
    } catch (e) { setCartCount(0) }
  }

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const prodRes = await fetch(`/api/products/${productId}`)
        if (prodRes.ok) setProduct(await prodRes.json())

        const recRes = await fetch('/api/products/recommendations')
        if (recRes.ok) {
            const data = await recRes.json()
            setRecommendations(data.filter((i: Product) => i.id !== Number(productId)))
        }
      } catch (e) { console.error(e) } 
      finally { setLoading(false) }
    }

    if (productId) fetchData()
    setExtras([])
    setRemoved([])
    updateCartCount()
    
    // Проверяем админа
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}')
    setIsAdmin(user.role === 'ADMIN')

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
        name: `${t('name', product)} ${extras.length > 0 ? '(+ допы)' : ''}`,
        description: t('description', product),
        price: product.price + extrasCost,
        category: product.category?.name_ru || '',
        emoji: '🍱',
        imageUrl: product.imageUrl,
        quantity: 1
    }

    const currentCart = JSON.parse(localStorage.getItem('cart') || '[]')
    currentCart.push(cartItem)
    localStorage.setItem('cart', JSON.stringify(currentCart))
    window.dispatchEvent(new CustomEvent('cartUpdated'))
    alert('Додано в кошик!')
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-[#145142]">Loading...</div>
  if (!product) return <div className="min-h-screen flex items-center justify-center">Product not found</div>

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-20">
      <Header cartCount={cartCount} onOpenCart={() => router.push('/')} />
      <div className="h-[100px]"></div>

      <div className="fixed top-24 left-4 z-40 flex gap-2">
        <button 
          onClick={() => router.back()}
          className="bg-white p-3 rounded-xl shadow-md text-[#145142] hover:bg-gray-50 transition-all flex items-center gap-2 font-bold"
        >
          <ArrowLeft size={20} />
        </button>
        
        {/* Кнопка РЕДАКТИРОВАТЬ (для админа) */}
        {isAdmin && (
           <Link 
             href={`/?adminMode=true&editProduct=${product.id}`} // Ссылка на главную с параметрами
             className="bg-[#145142] p-3 rounded-xl shadow-md text-white hover:bg-[#104034] transition-all flex items-center gap-2 font-bold"
           >
             <Edit size={20} /> Ред.
           </Link>
        )}
      </div>

      <div className="max-w-4xl mx-auto bg-white min-h-screen shadow-xl overflow-hidden relative rounded-t-3xl mt-4">
        <div className="w-full h-[300px] sm:h-[450px] relative bg-gray-100">
           {product.imageUrl ? (
             <img src={product.imageUrl} className="w-full h-full object-cover" alt={t('name', product)} />
           ) : (
             <div className="w-full h-full flex items-center justify-center text-6xl">🍣</div>
           )}
        </div>

        <div className="px-5 sm:px-10 py-8 relative z-10">
            <div className="flex justify-between items-start mb-4">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-[#145142]">{t('name', product)}</h1>
                <div className="bg-[#ff6b35] text-white px-4 py-2 rounded-2xl text-xl font-bold shadow-lg shadow-orange-200">
                    {product.price} ₴
                </div>
            </div>

            <p className="text-gray-500 text-lg leading-relaxed mb-8">{t('description', product)}</p>

            {/* Секция: Убрать ингредиенты */}
            <div className="mb-8">
                <h3 className="text-[#145142] font-bold mb-3 flex items-center gap-2">
                    <Minus size={18} className="text-red-500" /> Прибрати
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

            {/* Секция: Добавить */}
            <div className="mb-10">
                <h3 className="text-[#145142] font-bold mb-3 flex items-center gap-2">
                    <Plus size={18} className="text-green-600" /> Додати
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

            <button onClick={addToCart} className="w-full bg-[#145142] text-white py-4 rounded-2xl font-bold text-xl shadow-xl shadow-[#145142]/30 active:scale-[0.98] transition-all flex items-center justify-center gap-3 mb-12">
                <ShoppingBag /> В кошик
            </button>

            <div className="border-t border-gray-100 pt-8 mb-12">
                <h3 className="text-2xl font-bold text-[#145142] mb-6">Спробуйте також</h3>
                <div className="grid grid-cols-2 gap-4">
                    {recommendations.map(rec => (
                        <Link href={`/product/${rec.id}`} key={rec.id} className="block group">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all">
                                <div className="h-32 bg-gray-100 relative overflow-hidden">
                                     {rec.imageUrl ? <img src={rec.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : null}
                                </div>
                                <div className="p-3">
                                    <h4 className="font-bold text-[#145142] text-sm line-clamp-1">{t('name', rec)}</h4>
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