'use client'

import { useState, useEffect } from 'react'

interface AdminViewProps {
  onBack?: () => void
}

interface Order {
  id: number
  totalPrice: number
  status: string
  createdAt: string
  customerName: string
  phone: string
  address: string
  comment: string
  paymentMethod: string
  items: Array<{
    id: number
    quantity: number
    price: number
    product: { name_ru: string }
  }>
}

interface Product {
  id: number
  name_ru: string
  price: number
  description?: string
  imageUrl?: string
  category: { id: number; name_ru: string }
}

interface Category {
  id: number
  name_ru: string
}

export default function AdminView({ onBack }: AdminViewProps) {
  const [activeTab, setActiveTab] = useState<'orders' | 'products'>('orders')
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([]) // Для выпадающего списка
  const [isLoading, setIsLoading] = useState(false)

  // Состояние для формы добавления товара
  const [showAddModal, setShowAddModal] = useState(false)
  const [newProduct, setNewProduct] = useState({
    name_ru: '',
    price: '',
    description: '',
    imageUrl: '',
    categoryId: ''
  })

  useEffect(() => {
    loadData()
  }, [activeTab])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('token')
      const headers = { 'Authorization': `Bearer ${token}` }

      if (activeTab === 'orders') {
        const res = await fetch('/api/orders', { headers })
        if (res.status === 403) { alert('Нет доступа'); if(onBack) onBack(); return }
        if (res.ok) setOrders(await res.json())
      } else {
        // Загружаем товары
        const resP = await fetch('/api/products')
        if (resP.ok) setProducts(await resP.json())
        
        // Загружаем категории для формы
        const resC = await fetch('/api/categories') 
        if (resC.ok) setCategories(await resC.json())
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  const updateStatus = async (orderId: number, newStatus: string) => {
    const token = localStorage.getItem('token')
    try {
      await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      })
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
    } catch (e) { alert('Ошибка') }
  }

  const deleteProduct = async (id: number) => {
    const token = localStorage.getItem('token')
    if (!confirm('Удалить товар?')) return
    try {
      const res = await fetch(`/api/products/${id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) setProducts(products.filter(p => p.id !== id))
    } catch (e) { console.error(e) }
  }

  // --- ДОБАВЛЕНИЕ ТОВАРА ---
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          name_ru: newProduct.name_ru,
          price: parseFloat(newProduct.price),
          description: newProduct.description,
          imageUrl: newProduct.imageUrl,
          categoryId: parseInt(newProduct.categoryId)
        })
      })

      if (res.ok) {
        alert('Товар создан!')
        setShowAddModal(false)
        setNewProduct({ name_ru: '', price: '', description: '', imageUrl: '', categoryId: '' })
        loadData() // Обновляем список
      } else {
        alert('Ошибка при создании')
      }
    } catch (e) {
      console.error(e)
      alert('Ошибка сети')
    }
  }

  return (
    <div className="full-page-web">
      <div className="full-page-header-web" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={onBack ? onBack : undefined} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '5px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>
          <h1 className="full-page-title-web" style={{ margin: 0 }}>Админ-центр</h1>
        </div>
        <button onClick={loadData} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px' }}>🔄</button>
      </div>

      <div style={{ padding: '0 16px', borderBottom: '1px solid #eee', display: 'flex', gap: '20px', background: 'white' }}>
        <button onClick={() => setActiveTab('orders')} style={{ padding: '15px 0', borderBottom: activeTab === 'orders' ? '3px solid #ec4899' : 'none', color: activeTab === 'orders' ? '#ec4899' : '#666', fontWeight: 'bold', background: 'none', cursor: 'pointer' }}>📦 Заказы</button>
        <button onClick={() => setActiveTab('products')} style={{ padding: '15px 0', borderBottom: activeTab === 'products' ? '3px solid #ec4899' : 'none', color: activeTab === 'products' ? '#ec4899' : '#666', fontWeight: 'bold', background: 'none', cursor: 'pointer' }}>🍣 Товары</button>
      </div>

      <div className="full-page-content-web" style={{ background: '#f9fafb', minHeight: '100vh', padding: '16px' }}>
        {isLoading && <div style={{ textAlign: 'center', padding: '20px' }}>Загрузка...</div>}

        {!isLoading && activeTab === 'orders' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', paddingBottom: '100px' }}>
            {orders.map(order => (
              <div key={order.id} style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontWeight: 'bold' }}>#{order.id} {order.customerName}</span>
                  <select value={order.status} onChange={(e) => updateStatus(order.id, e.target.value)} style={{ border: '1px solid #ddd', borderRadius: '5px' }}>
                    <option value="PENDING">🕒 Новый</option>
                    <option value="COOKING">👨‍🍳 Готовится</option>
                    <option value="DELIVERED">✅ Доставлен</option>
                    <option value="CANCELLED">❌ Отменен</option>
                  </select>
                </div>
                <div style={{ color: '#666', fontSize: '14px', marginBottom: '10px' }}>
                   {order.address}, {order.phone} <br/> {order.comment}
                </div>
                <div style={{ background: '#f3f4f6', padding: '10px', borderRadius: '8px' }}>
                  {order.items.map(item => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                      <span>{item.product?.name_ru} x{item.quantity}</span>
                      <b>{item.price * item.quantity} ₴</b>
                    </div>
                  ))}
                </div>
                <div style={{ textAlign: 'right', marginTop: '10px', fontWeight: 'bold', fontSize: '18px', color: '#ec4899' }}>Total: {order.totalPrice} ₴</div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && activeTab === 'products' && (
          <div style={{ paddingBottom: '100px' }}>
             <button 
               onClick={() => setShowAddModal(true)}
               style={{ width: '100%', background: '#ec4899', color: 'white', padding: '14px', borderRadius: '12px', border: 'none', fontWeight: 'bold', marginBottom: '20px', fontSize: '16px', boxShadow: '0 4px 10px rgba(236, 72, 153, 0.3)' }}
             >
               + Добавить товар
             </button>

             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '15px' }}>
               {products.map(product => (
                 <div key={product.id} style={{ background: 'white', padding: '10px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                   <div style={{ height: '100px', background: '#eee', borderRadius: '8px', marginBottom: '10px', overflow: 'hidden' }}>
                      {product.imageUrl ? <img src={product.imageUrl} style={{width:'100%', height:'100%', objectFit:'cover'}} /> : <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%'}}>📷</div>}
                   </div>
                   <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{product.name_ru}</div>
                   <div style={{ fontSize: '12px', color: '#888' }}>{product.category?.name_ru}</div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                     <span style={{ fontWeight: 'bold', color: '#ec4899' }}>{product.price} ₴</span>
                     <button onClick={() => deleteProduct(product.id)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>🗑️</button>
                   </div>
                 </div>
               ))}
             </div>
          </div>
        )}
      </div>

      {/* МОДАЛКА ДОБАВЛЕНИЯ ТОВАРА */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: 'white', padding: '20px', borderRadius: '16px', width: '90%', maxWidth: '400px' }}>
            <h2 style={{ marginTop: 0 }}>Новый товар</h2>
            <form onSubmit={handleCreateProduct} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input placeholder="Название (напр. Филадельфия)" value={newProduct.name_ru} onChange={e => setNewProduct({...newProduct, name_ru: e.target.value})} required style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }} />
              <input type="number" placeholder="Цена (грн)" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} required style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }} />
              <select value={newProduct.categoryId} onChange={e => setNewProduct({...newProduct, categoryId: e.target.value})} required style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}>
                <option value="">Выберите категорию</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name_ru}</option>)}
              </select>
              <input placeholder="Ссылка на фото (https://...)" value={newProduct.imageUrl} onChange={e => setNewProduct({...newProduct, imageUrl: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }} />
              <textarea placeholder="Описание (состав, вес)" value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd', height: '80px' }} />
              
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #ddd', background: 'white' }}>Отмена</button>
                <button type="submit" style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#ec4899', color: 'white', fontWeight: 'bold' }}>Создать</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}