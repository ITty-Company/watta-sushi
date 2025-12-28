'use client'

import { useState, useEffect } from 'react'

interface MenuItem {
  id: number
  name: string
  description: string
  price: number
  category: string
  emoji: string
  imageUrl?: string
}

export default function CartView() {
  const [cartItems, setCartItems] = useState<MenuItem[]>([])
  const [isSuccess, setIsSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({ name: '', phone: '', address: '', comment: '', paymentMethod: 'CASH' })

  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]')
      setCartItems(cart)
      const savedUser = localStorage.getItem('currentUser')
      if (savedUser) {
        const user = JSON.parse(savedUser)
        setFormData(prev => ({ ...prev, name: user.name || '', phone: user.phone || '', address: user.address || '' }))
      }
    }
  }, [])

  const totalPrice = cartItems.reduce((sum, item) => sum + item.price, 0)

  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (cartItems.length === 0) return
    if (!formData.phone || !formData.address) { alert('Пожалуйста, заполните телефон и адрес'); return }
    setIsLoading(true)
    try {
      const userId = localStorage.getItem('userId')
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartItems: cartItems.map(item => ({ product: item, quantity: 1 })), totalPrice, customer: formData, userId: userId }),
      })
      if (!response.ok) throw new Error('Ошибка заказа')
      setIsSuccess(true)
      localStorage.removeItem('cart')
      setCartItems([])
      window.dispatchEvent(new CustomEvent('cartUpdated'))
    } catch (error) { console.error(error); alert('Не удалось оформить заказ. Попробуйте снова.') } finally { setIsLoading(false) }
  }

  // Функция для кнопки НАЗАД (возвращает в Меню)
  const handleBack = () => {
    const event = new CustomEvent('switchTab', { detail: 0 }) // 0 = Меню
    window.dispatchEvent(event)
  }

  if (isSuccess) {
    return (
      <div className="full-page-web flex flex-col items-center justify-center text-center p-8">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold mb-2">Спасибо за заказ!</h2>
        <p className="text-gray-500 mb-6">Мы уже начали готовить. Оператор скоро свяжется с вами.</p>
        <button className="order-button bg-pink-500 text-white px-6 py-3 rounded-xl font-bold" onClick={handleBack}>Вернуться в меню</button>
      </div>
    )
  }

  return (
    <div className="full-page-web">
      <div className="full-page-header-web" style={{ display: 'flex', alignItems: 'center', padding: '0 16px' }}>
        {/* --- НОВАЯ КНОПКА НАЗАД --- */}
        <button 
          onClick={handleBack} 
          style={{ 
            background: 'none', 
            border: 'none', 
            marginRight: '15px', 
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '50%',
            backgroundColor: '#f3f4f6'
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
             <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        {/* ------------------------- */}
        <h1 className="full-page-title-web" style={{ margin: 0 }}>Корзина</h1>
      </div>
      
      <div className="full-page-content-web">
        <div className="page-content-inner-web max-w-2xl mx-auto pb-20">
          {cartItems.length === 0 ? (
            <div className="cart-empty flex flex-col items-center justify-center py-20">
              <div className="cart-empty-icon text-6xl mb-4">🛒</div>
              <div className="cart-empty-text text-xl text-gray-500">Корзина пуста</div>
              {/* Кнопка назад для пустой корзины */}
              <button onClick={handleBack} className="mt-4 text-pink-500 font-bold hover:underline">Вернуться в меню</button>
            </div>
          ) : (
            <>
              <div className="cart-items space-y-4 mb-8">
                {cartItems.map((item, index) => (
                  <div key={`${item.id}-${index}`} className="cart-item bg-white p-4 rounded-xl shadow-sm flex items-center gap-4 border border-gray-100">
                    <div className="cart-item-emoji text-3xl">
                      {item.imageUrl ? <img src={item.imageUrl} className="w-12 h-12 object-cover rounded-md" alt="" /> : item.emoji}
                    </div>
                    <div className="cart-item-info flex-1">
                      <div className="cart-item-name font-bold text-gray-800">{item.name}</div>
                      <div className="cart-item-price text-pink-500 font-bold">{item.price} ₴</div>
                    </div>
                    <button onClick={() => {
                        const newCart = cartItems.filter((_, i) => i !== index);
                        setCartItems(newCart);
                        localStorage.setItem('cart', JSON.stringify(newCart));
                        window.dispatchEvent(new CustomEvent('cartUpdated'));
                      }} className="text-red-400 hover:text-red-600 px-2">✕</button>
                  </div>
                ))}
              </div>
              <form onSubmit={handleOrder} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
                <h3 className="text-lg font-bold mb-4">Детали доставки</h3>
                <div className="space-y-3">
                  <input type="text" placeholder="Ваше имя" className="w-full p-3 border rounded-lg bg-gray-50 focus:outline-pink-500" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                  <input type="tel" placeholder="Телефон" className="w-full p-3 border rounded-lg bg-gray-50 focus:outline-pink-500" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required />
                  <input type="text" placeholder="Адрес доставки" className="w-full p-3 border rounded-lg bg-gray-50 focus:outline-pink-500" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} required />
                  <textarea placeholder="Комментарий к заказу (необязательно)" className="w-full p-3 border rounded-lg bg-gray-50 focus:outline-pink-500 h-24 resize-none" value={formData.comment} onChange={e => setFormData({...formData, comment: e.target.value})} />
                  <select className="w-full p-3 border rounded-lg bg-gray-50 focus:outline-pink-500" value={formData.paymentMethod} onChange={e => setFormData({...formData, paymentMethod: e.target.value})}>
                    <option value="CASH">💵 Наличными</option>
                    <option value="CARD">💳 Картой курьеру</option>
                  </select>
                </div>
              </form>
              <div className="cart-summary bg-white p-6 rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.05)] fixed bottom-0 left-0 right-0 md:relative md:shadow-none md:rounded-2xl md:bottom-auto">
                <div className="cart-total flex justify-between items-center mb-4"><span className="cart-total-label text-gray-500">Итого к оплате:</span><span className="cart-total-price text-2xl font-bold text-gray-900">{totalPrice} ₴</span></div>
                <button type="submit" onClick={handleOrder} disabled={isLoading} className="order-button w-full bg-pink-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-pink-600 transition disabled:opacity-70">{isLoading ? 'Оформляем...' : 'Оформить заказ'}</button>
              </div>
              <div className="h-24 md:hidden"></div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}