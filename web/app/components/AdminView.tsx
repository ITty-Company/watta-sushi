// 'use client'

// import { useState, useEffect } from 'react'
// import { 
//   ArrowLeft, 
//   RefreshCw, 
//   MapPin, 
//   Phone, 
//   User, 
//   X, 
//   Upload,
//   Image as ImageIcon,
//   Pencil,
//   Trash2,
//   Tag,      // Для промокодов
//   ChefHat,  // Для статусов
//   Truck,
//   Check,
//   XCircle
// } from 'lucide-react'

// // --- ТИПЫ ДАННЫХ ---
// interface Product {
//   id: number
//   name_ru: string
//   price: number
//   description?: string
//   categoryId: number
//   imageUrl?: string
//   isPopular: boolean
// }

// interface OrderItem {
//   id: number
//   product: Product
//   quantity: number
//   price: number
// }

// interface Order {
//   id: number
//   createdAt: string
//   status: string 
//   totalPrice: number
//   customerName: string
//   phone: string
//   address: string
//   comment?: string
//   items: OrderItem[]
// }

// interface PromoCode {
//   id: number
//   code: string
//   discount: number
//   isActive: boolean
// }

// interface AdminViewProps {
//   onBack: () => void
// }

// export default function AdminView({ onBack }: AdminViewProps) {
//   // Добавили вкладку 'promos'
//   const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'promos'>('orders')
  
//   const [orders, setOrders] = useState<Order[]>([])
//   const [products, setProducts] = useState<Product[]>([])
//   const [categories, setCategories] = useState<{id: number, name_ru: string}[]>([])
//   const [promos, setPromos] = useState<PromoCode[]>([]) // Промокоды
  
//   const [isLoading, setIsLoading] = useState(false)

//   // Состояния для модального окна ТОВАРОВ
//   const [isModalOpen, setIsModalOpen] = useState(false)
//   const [editingId, setEditingId] = useState<number | null>(null)
  
//   // Состояния для создания ПРОМОКОДА
//   const [newPromoCode, setNewPromoCode] = useState('')
//   const [newPromoDiscount, setNewPromoDiscount] = useState('')

//   // Единое состояние формы товара
//   const [formData, setFormData] = useState({
//     name_ru: '', name_ua: '', name_en: '', name_nl: '',
//     price: '',
//     description_ru: '', description_ua: '', description_en: '', description_nl: '',
//     categoryId: '',
//     imageUrl: ''
//   })

//   // --- ЗАГРУЗКА ДАННЫХ ---
//   const fetchData = async () => {
//     setIsLoading(true)
//     try {
//       if (activeTab === 'orders') {
//         const res = await fetch('/api/orders')
//         if (res.ok) setOrders(await res.json())
//       } else if (activeTab === 'products') {
//         const [prodRes, catRes] = await Promise.all([
//           fetch('/api/products'),
//           fetch('/api/products/categories')
//         ])
//         if (prodRes.ok) setProducts(await prodRes.json())
//         if (catRes.ok) setCategories(await catRes.json())
//       } else if (activeTab === 'promos') {
//         // Загрузка промокодов
//         const res = await fetch('/api/promo')
//         if (res.ok) setPromos(await res.json())
//       }
//     } catch (e) {
//       console.error(e)
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   useEffect(() => {
//     fetchData()
//   }, [activeTab])


//   // --- ЛОГИКА ТОВАРОВ (ФОРМА) ---
//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
//     const { name, value } = e.target
//     setFormData(prev => ({ ...prev, [name]: value }))
//   }

//   const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0]
//     if (file) {
//       const reader = new FileReader()
//       reader.onloadend = () => {
//         setFormData(prev => ({ ...prev, imageUrl: reader.result as string }))
//       }
//       reader.readAsDataURL(file)
//     }
//   }

//   const openCreateModal = () => {
//     setEditingId(null)
//     setFormData({ name_ru: '', price: '', description: '', categoryId: '', imageUrl: '' })
//     setIsModalOpen(true)
//   }

//   const openEditModal = (product: Product) => {
//     setEditingId(product.id)
//     setFormData({
//       name_ru: product.name_ru,
//       name_ua: product.name_ua || '',
//       name_en: product.name_en || '',
//       name_nl: product.name_nl || '',
      
//       price: product.price.toString(),
      
//       description_ru: product.description_ru || '',
//       description_ua: product.description_ua || '',
//       description_en: product.description_en || '',
//       description_nl: product.description_nl || '',
      
//       categoryId: product.categoryId.toString(),
//       imageUrl: product.imageUrl || ''
//     })
//     setIsModalOpen(true)
//   }

//   const handleDeleteProduct = async (id: number) => {
//     if (!confirm('Вы уверены, что хотите удалить этот товар?')) return
//     try {
//       const token = localStorage.getItem('adminToken')
//       const res = await fetch(`/api/products/${id}`, {
//         method: 'DELETE',
//         headers: { 'Authorization': `Bearer ${token}` }
//       })
//       if (res.ok) fetchData()
//       else alert('Ошибка удаления')
//     } catch (e) { alert('Ошибка сети') }
//   }

//   const handleSubmitProduct = async (e: React.FormEvent) => {
//     e.preventDefault()
//     try {
//       const token = localStorage.getItem('adminToken')
//       const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
      
//       let res
//       if (editingId) {
//         res = await fetch(`/api/products/${editingId}`, {
//           method: 'PUT',
//           headers,
//           body: JSON.stringify(formData)
//         })
//       } else {
//         res = await fetch('/api/products', {
//           method: 'POST',
//           headers,
//           body: JSON.stringify(formData)
//         })
//       }
      
//       if (res.ok) {
//         setIsModalOpen(false)
//         fetchData()
//       } else {
//         alert('Ошибка при сохранении')
//       }
//     } catch (error) { console.error(error); alert('Ошибка соединения') }
//   }

//   // --- ЛОГИКА ЗАКАЗОВ (СТАТУСЫ) ---
//   const updateStatus = async (orderId: number, newStatus: string) => {
//     if (!confirm(`Сменить статус на "${newStatus}"?`)) return
//     try {
//       const res = await fetch(`/api/orders/${orderId}/status`, {
//         method: 'PATCH',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ status: newStatus })
//       })
//       if (res.ok) fetchData() // Обновляем список
//     } catch (e) { alert('Ошибка обновления') }
//   }

//   // --- ЛОГИКА ПРОМОКОДОВ ---
//   const handleCreatePromo = async (e: React.FormEvent) => {
//     e.preventDefault()
//     if (!newPromoCode || !newPromoDiscount) return

//     try {
//       const res = await fetch('/api/promo/create', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ code: newPromoCode, discount: newPromoDiscount })
//       })
//       if (res.ok) {
//         setNewPromoCode('')
//         setNewPromoDiscount('')
//         fetchData()
//         alert('Промокод создан!')
//       } else {
//         alert('Ошибка: возможно код уже есть')
//       }
//     } catch (e) { console.error(e) }
//   }

//   const handleDeletePromo = async (id: number) => {
//     if (!confirm('Удалить этот код?')) return
//     try {
//       await fetch(`/api/promo/${id}`, { method: 'DELETE' })
//       fetchData()
//     } catch (e) { console.error(e) }
//   }


//   // --- ХЕДЕР ---
//   const Header = () => (
//     <div className="w-full sticky top-0 z-40 flex flex-col">
//       <div className="bg-white w-full z-20 relative shadow-sm">
//         <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 h-24 flex items-center justify-between">
        
//           <div className="flex items-center gap-6">
//             <button 
//               onClick={onBack}
//               className="hover:opacity-60 transition-opacity"
//               style={{ background: 'none', border: 'none', padding: 0 }}
//             >
//                <ArrowLeft size={35} color="black" />
//             </button>
//             <h1 className="text-3xl md:text-[36px] font-bold text-black tracking-tighter leading-none hidden sm:block">
//               Admin Panel
//             </h1>
//           </div>

//           <div className="flex items-center gap-6">
//              <img src="/logo2.png" alt="Watta Sushi" className="h-20 md:h-40 w-auto object-contain" />
//              <button 
//               onClick={fetchData}
//               className="w-12 h-12 flex items-center justify-center hover:rotate-180 transition duration-500 rounded-full hover:bg-gray-100"
//              >
//               <RefreshCw size={32} color="black" />
//              </button>
//           </div>
//         </div>
//       </div>
      
//       <div className="relative w-full h-0 z-10">
//         <div className="absolute top-0 w-full h-[32px] bg-[rgba(217,217,217,0.75)] blur-[25px] opacity-75 pointer-events-none" style={{ transform: 'scale(1.1)' }} />
//         <div className="absolute top-0 w-full h-[60px] bg-gradient-to-b from-black/10 to-transparent pointer-events-none" />
//       </div>
//     </div>
//   )

//   return (
//     <div className="min-h-screen bg-white font-sans relative overflow-x-hidden">
//       <Header />

//       {/* ОСНОВНОЙ КОНТЕНТ */}
//       <div className="w-full bg-[#F3F4F6] min-h-[calc(100vh-128px)] pb-20">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8">
          
//           {/* ТАБЫ */}
//           <div className="flex gap-6 md:gap-10 mb-8 ml-4 overflow-x-auto pb-2">
//             <button 
//               onClick={() => setActiveTab('orders')}
//               className={`text-[20px] md:text-[24px] font-bold tracking-tight transition-colors whitespace-nowrap ${
//                 activeTab === 'orders' ? 'text-[#165044]' : 'text-[#7C7C7C]'
//               }`}
//             >
//               📦 Заказы
//             </button>
//             <button 
//               onClick={() => setActiveTab('products')}
//               className={`text-[20px] md:text-[24px] font-bold tracking-tight transition-colors whitespace-nowrap ${
//                 activeTab === 'products' ? 'text-[#165044]' : 'text-[#7C7C7C]'
//               }`}
//             >
//               🍣 Товары
//             </button>
//             <button 
//               onClick={() => setActiveTab('promos')}
//               className={`text-[20px] md:text-[24px] font-bold tracking-tight transition-colors whitespace-nowrap ${
//                 activeTab === 'promos' ? 'text-[#165044]' : 'text-[#7C7C7C]'
//               }`}
//             >
//               🏷️ Промокоды
//             </button>
//           </div>

//           {/* === Вкладка: ЗАКАЗЫ === */}
//           {activeTab === 'orders' && (
//             <div className="flex flex-col gap-8 items-center">
//               {isLoading && orders.length === 0 ? (
//                  <div className="text-2xl text-gray-400 mt-10">Загрузка...</div>
//               ) : orders.length === 0 ? (
//                  <div className="text-2xl text-gray-400 mt-10">Нет активных заказов</div>
//               ) : (
//                 orders.map((order) => (
//                   <div 
//                     key={order.id} 
//                     className="w-full bg-white rounded-[25px] p-8 shadow-sm flex flex-col gap-6 relative"
//                   >
//                     {/* Хедер заказа */}
//                     <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
//                       <div className="text-[24px] font-bold text-black">
//                         Заказ №{order.id}
//                         <span className="text-gray-400 text-sm font-normal ml-3">
//                           {new Date(order.createdAt).toLocaleString()}
//                         </span>
//                       </div>
//                       <span className={`px-4 py-2 rounded-full text-sm font-bold uppercase ${
//                         order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
//                         order.status === 'COOKING' ? 'bg-orange-100 text-orange-800' :
//                         order.status === 'DELIVERING' ? 'bg-blue-100 text-blue-800' :
//                         order.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
//                         'bg-red-100 text-red-800'
//                       }`}>
//                         {order.status}
//                       </span>
//                     </div>

//                     {/* Данные клиента */}
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-[15px]">
//                       <div className="flex flex-col gap-2 text-[16px] text-[#555]">
//                         <div className="flex items-center gap-2 font-bold text-black"><User size={18}/> {order.customerName}</div>
//                         <div className="flex items-center gap-2"><Phone size={18}/> {order.phone}</div>
//                         <div className="flex items-center gap-2"><MapPin size={18}/> {order.address}</div>
//                       </div>
//                       <div className="flex flex-col gap-2">
//                          {order.comment ? (
//                             <div className="text-orange-600 bg-orange-50 p-2 rounded-lg border border-orange-100 text-sm">
//                               📝 {order.comment}
//                             </div>
//                          ) : (
//                             <div className="text-gray-400 text-sm italic">Без комментария</div>
//                          )}
//                       </div>
//                     </div>

//                     {/* Товары */}
//                     <div className="flex flex-col gap-3">
//                       {order.items.map((item, idx) => (
//                         <div key={idx} className="w-full bg-[#F3F4F6] rounded-[15px] p-4 flex justify-between items-center h-[57px]">
//                           <span className="text-black text-[16px] font-medium">{item.product.name_ru}</span>
//                           <span className="font-bold text-black text-lg">x{item.quantity}</span>
//                         </div>
//                       ))}
//                     </div>

//                     {/* Статусы и Итого */}
//                     <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
                      
//                       {/* Кнопки смены статуса */}
//                       <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto">
//                          <button onClick={() => updateStatus(order.id, 'COOKING')} className="p-2 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100" title="Готовится"><ChefHat/></button>
//                          <button onClick={() => updateStatus(order.id, 'DELIVERING')} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100" title="В доставке"><Truck/></button>
//                          <button onClick={() => updateStatus(order.id, 'COMPLETED')} className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100" title="Выполнен"><Check/></button>
//                          <div className="w-px bg-gray-300 mx-2"></div>
//                          <button onClick={() => updateStatus(order.id, 'CANCELLED')} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100" title="Отменить"><XCircle/></button>
//                       </div>

//                       <div className="text-[#194A38] text-[28px] font-bold">
//                         {order.totalPrice} ₴
//                       </div>
//                     </div>
//                   </div>
//                 ))
//               )}
//             </div>
//           )}
          
//           {/* === Вкладка: ТОВАРЫ === */}
//           {activeTab === 'products' && (
//              <div className="flex flex-col gap-8">
//                 <button 
//                   onClick={openCreateModal}
//                   className="w-full h-[77px] bg-[#155044] rounded-[15px] flex items-center justify-center text-white text-[24px] font-bold hover:bg-[#103d34] transition shadow-md"
//                 >
//                   + Добавить товар
//                 </button>

//                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//                   {products.map(product => (
//                     <div key={product.id} className="bg-white rounded-[25px] p-5 shadow-sm flex flex-col gap-4 hover:shadow-md transition">
//                        {/* Картинка */}
//                        <div className="w-full h-[200px] bg-gray-100 rounded-[15px] overflow-hidden relative">
//                          {product.imageUrl ? (
//                            <img src={product.imageUrl} alt={product.name_ru} className="w-full h-full object-cover" />
//                          ) : (
//                            <div className="w-full h-full flex items-center justify-center text-gray-300">
//                              <ImageIcon size={48} />
//                            </div>
//                          )}
//                          {product.isPopular && (
//                            <span className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full">ХИТ</span>
//                          )}
//                        </div>
                       
//                        {/* Инфо */}
//                        <div className="flex flex-col flex-1">
//                          <div className="flex justify-between items-start mb-2">
//                            <h3 className="text-[20px] font-bold text-black leading-tight">{product.name_ru}</h3>
//                            <span className="text-[20px] font-bold text-[#194A38] whitespace-nowrap">{product.price} ₴</span>
//                          </div>
//                          <p className="text-[14px] text-[#7C7C7C] line-clamp-2 mb-4 h-[42px]">{product.description}</p>
                         
//                          {/* Футер карточки с кнопками */}
//                          <div className="mt-auto pt-2 border-t border-gray-100 flex justify-between items-center text-xs text-gray-400">
//                             <div className="flex gap-2">
//                               <span>ID: {product.id}</span>
//                               <span className="hidden sm:inline">| {categories.find(c => c.id === product.categoryId)?.name_ru}</span>
//                             </div>

//                             {/* КНОПКИ ДЕЙСТВИЙ */}
//                             <div className="flex gap-2">
//                               <button 
//                                 onClick={() => openEditModal(product)}
//                                 className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
//                                 title="Редактировать"
//                               >
//                                 <Pencil size={18} />
//                               </button>
//                               <button 
//                                 onClick={() => handleDeleteProduct(product.id)}
//                                 className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
//                                 title="Удалить"
//                               >
//                                 <Trash2 size={18} />
//                               </button>
//                             </div>
//                          </div>
//                        </div>
//                     </div>
//                   ))}
//                 </div>
//              </div>
//           )}

//           {/* === Вкладка: ПРОМОКОДЫ === */}
//           {activeTab === 'promos' && (
//             <div className="flex flex-col gap-8">
//               {/* Форма создания */}
//               <div className="bg-white rounded-[25px] p-8 shadow-sm">
//                 <h2 className="text-xl font-bold text-[#155044] mb-4 flex items-center gap-2">
//                   <Tag /> Создать новый промокод
//                 </h2>
//                 <form onSubmit={handleCreatePromo} className="flex flex-col md:flex-row gap-4">
//                   <input 
//                     type="text" 
//                     placeholder="Код (например, NEW2025)"
//                     value={newPromoCode}
//                     onChange={e => setNewPromoCode(e.target.value.toUpperCase())}
//                     className="flex-1 p-4 bg-[#F3F4F6] rounded-[15px] outline-none font-bold uppercase"
//                     required
//                   />
//                   <input 
//                     type="number" 
//                     placeholder="Скидка %"
//                     value={newPromoDiscount}
//                     onChange={e => setNewPromoDiscount(e.target.value)}
//                     className="w-full md:w-[150px] p-4 bg-[#F3F4F6] rounded-[15px] outline-none font-bold"
//                     required
//                   />
//                   <button className="px-8 py-4 bg-[#155044] text-white font-bold rounded-[15px] hover:bg-[#103d34] transition">
//                     Создать
//                   </button>
//                 </form>
//               </div>

//               {/* Список */}
//               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//                  {promos.map(promo => (
//                    <div key={promo.id} className="bg-white rounded-[20px] p-6 shadow-sm flex items-center justify-between border border-gray-100">
//                      <div className="flex items-center gap-4">
//                        <div className="w-12 h-12 bg-[#F3F4F6] rounded-full flex items-center justify-center text-[#155044]">
//                          <Tag size={24} />
//                        </div>
//                        <div>
//                          <div className="text-xl font-bold text-[#194A38]">{promo.code}</div>
//                          <div className="text-green-600 font-bold">-{promo.discount}% скидка</div>
//                        </div>
//                      </div>
//                      <button 
//                        onClick={() => handleDeletePromo(promo.id)}
//                        className="p-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
//                      >
//                        <Trash2 size={24} />
//                      </button>
//                    </div>
//                  ))}
//                  {promos.length === 0 && <div className="text-gray-400 col-span-3 text-center">Промокодов пока нет</div>}
//               </div>
//             </div>
//           )}

//         </div>
//       </div>

//       {/* МОДАЛЬНОЕ ОКНО (ОСТАЛОСЬ БЕЗ ИЗМЕНЕНИЙ) */}
//       {isModalOpen && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
//           <div className="bg-white rounded-[25px] w-full max-w-lg p-8 shadow-2xl relative animate-in fade-in zoom-in duration-200 h-auto max-h-[90vh] overflow-y-auto">
//             <button 
//               onClick={() => setIsModalOpen(false)}
//               className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500 transition"
//             >
//               <X size={24} />
//             </button>
            
//             <h2 className="text-2xl font-bold text-[#155044] mb-6 text-center">
//               {editingId ? 'Редактировать блюдо' : 'Новое блюдо'}
//             </h2>
            
//             <form onSubmit={handleSubmitProduct} className="space-y-4">
//               <div className="flex justify-center mb-4">
//                 <label className="cursor-pointer w-full h-40 border-2 border-dashed border-gray-300 rounded-[15px] flex flex-col items-center justify-center hover:bg-gray-50 transition relative overflow-hidden group">
//                   {formData.imageUrl ? (
//                     <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
//                   ) : (
//                     <>
//                       <Upload size={32} className="text-gray-400 mb-2" />
//                       <span className="text-sm text-gray-500">Нажмите, чтобы загрузить фото</span>
//                     </>
//                   )}
//                   <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
//                   {formData.imageUrl && (
//                     <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
//                       <span className="text-white font-medium">Изменить</span>
//                     </div>
//                   )}
//                 </label>
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
//                 <input 
//                   name="name_ru" 
//                   required 
//                   value={formData.name_ru} 
//                   onChange={handleInputChange}
//                   className="w-full p-3 bg-[#F3F4F6] rounded-[10px] outline-none focus:ring-2 focus:ring-[#155044]"
//                   placeholder="Например: Филадельфия" 
//                 />
//               </div>

//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Цена (₴)</label>
//                   <input 
//                     name="price" 
//                     type="number" 
//                     required 
//                     value={formData.price} 
//                     onChange={handleInputChange}
//                     className="w-full p-3 bg-[#F3F4F6] rounded-[10px] outline-none focus:ring-2 focus:ring-[#155044]"
//                     placeholder="0" 
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Категория</label>
//                   <select 
//                     name="categoryId" 
//                     required 
//                     value={formData.categoryId} 
//                     onChange={handleInputChange}
//                     className="w-full p-3 bg-[#F3F4F6] rounded-[10px] outline-none focus:ring-2 focus:ring-[#155044]"
//                   >
//                     <option value="">Выберите...</option>
//                     {categories.map(cat => (
//                       <option key={cat.id} value={cat.id}>{cat.name_ru}</option>
//                     ))}
//                   </select>
//                 </div>
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
//                 <textarea 
//                   name="description" 
//                   value={formData.description} 
//                   onChange={handleInputChange}
//                   className="w-full p-3 bg-[#F3F4F6] rounded-[10px] outline-none focus:ring-2 focus:ring-[#155044] h-24 resize-none"
//                   placeholder="Состав блюда..." 
//                 />
//               </div>

//               <button 
//                 type="submit" 
//                 className="w-full py-4 bg-[#155044] text-white font-bold rounded-[15px] hover:bg-[#103d34] transition shadow-lg mt-2"
//               >
//                 {editingId ? 'Сохранить изменения' : 'Сохранить'}
//               </button>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }

'use client'

import { useState, useEffect } from 'react'
import { 
  ArrowLeft, 
  RefreshCw, 
  MapPin, 
  Phone, 
  User, 
  X, 
  Upload,
  Image as ImageIcon,
  Pencil,
  Trash2,
  Tag,      // Для промокодов
  ChefHat,  // Для статусов
  Truck,
  Check,
  XCircle
} from 'lucide-react'

// --- ТИПЫ ДАННЫХ (ИСПРАВЛЕНО ПОД 4 ЯЗЫКА) ---
interface Product {
  id: number
  // Названия
  name_ru: string
  name_ua?: string
  name_en?: string
  name_nl?: string
  
  price: number
  
  // Описания
  description_ru?: string
  description_ua?: string
  description_en?: string
  description_nl?: string

  categoryId: number
  imageUrl?: string
  isPopular: boolean
}

interface OrderItem {
  id: number
  product: Product
  quantity: number
  price: number
}

interface Order {
  id: number
  createdAt: string
  status: string 
  totalPrice: number
  customerName: string
  phone: string
  address: string
  comment?: string
  items: OrderItem[]
}

interface PromoCode {
  id: number
  code: string
  discount: number
  isActive: boolean
}

interface AdminViewProps {
  onBack: () => void
}

export default function AdminView({ onBack }: AdminViewProps) {
  // Добавили вкладку 'promos'
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'promos'>('orders')
  
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<{id: number, name_ru: string}[]>([])
  const [promos, setPromos] = useState<PromoCode[]>([]) // Промокоды
  
  const [isLoading, setIsLoading] = useState(false)

  // Состояния для модального окна ТОВАРОВ
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  
  // Состояния для создания ПРОМОКОДА
  const [newPromoCode, setNewPromoCode] = useState('')
  const [newPromoDiscount, setNewPromoDiscount] = useState('')

  // Единое состояние формы товара (ОБНОВЛЕНО)
  const [formData, setFormData] = useState({
    name_ru: '', name_ua: '', name_en: '', name_nl: '',
    price: '',
    description_ru: '', description_ua: '', description_en: '', description_nl: '',
    categoryId: '',
    imageUrl: ''
  })

  // --- ЗАГРУЗКА ДАННЫХ ---
  const fetchData = async () => {
    setIsLoading(true)
    try {
      if (activeTab === 'orders') {
        const res = await fetch('/api/orders')
        if (res.ok) setOrders(await res.json())
      } else if (activeTab === 'products') {
        const [prodRes, catRes] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/products/categories')
        ])
        if (prodRes.ok) setProducts(await prodRes.json())
        if (catRes.ok) setCategories(await catRes.json())
      } else if (activeTab === 'promos') {
        // Загрузка промокодов
        const res = await fetch('/api/promo')
        if (res.ok) setPromos(await res.json())
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [activeTab])


  // --- ЛОГИКА ТОВАРОВ (ФОРМА) ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, imageUrl: reader.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  const openCreateModal = () => {
    setEditingId(null)
    setFormData({ 
      name_ru: '', name_ua: '', name_en: '', name_nl: '',
      price: '', 
      description_ru: '', description_ua: '', description_en: '', description_nl: '',
      categoryId: '', imageUrl: '' 
    })
    setIsModalOpen(true)
  }

  const openEditModal = (product: Product) => {
    setEditingId(product.id)
    setFormData({
      name_ru: product.name_ru,
      name_ua: product.name_ua || '',
      name_en: product.name_en || '',
      name_nl: product.name_nl || '',
      
      price: product.price.toString(),
      
      // Исправлено: берем соответствующие поля
      description_ru: product.description_ru || '',
      description_ua: product.description_ua || '',
      description_en: product.description_en || '',
      description_nl: product.description_nl || '',
      
      categoryId: product.categoryId.toString(),
      imageUrl: product.imageUrl || ''
    })
    setIsModalOpen(true)
  }

  const handleDeleteProduct = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот товар?')) return
    try {
      const token = localStorage.getItem('adminToken')
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) fetchData()
      else alert('Ошибка удаления')
    } catch (e) { alert('Ошибка сети') }
  }

  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('adminToken')
      const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
      
      let res
      if (editingId) {
        res = await fetch(`/api/products/${editingId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(formData)
        })
      } else {
        res = await fetch('/api/products', {
          method: 'POST',
          headers,
          body: JSON.stringify(formData)
        })
      }
      
      if (res.ok) {
        setIsModalOpen(false)
        fetchData()
      } else {
        alert('Ошибка при сохранении')
      }
    } catch (error) { console.error(error); alert('Ошибка соединения') }
  }

  // --- ЛОГИКА ЗАКАЗОВ (СТАТУСЫ) ---
  const updateStatus = async (orderId: number, newStatus: string) => {
    if (!confirm(`Сменить статус на "${newStatus}"?`)) return
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      if (res.ok) fetchData() // Обновляем список
    } catch (e) { alert('Ошибка обновления') }
  }

  // --- ЛОГИКА ПРОМОКОДОВ ---
  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPromoCode || !newPromoDiscount) return

    try {
      const res = await fetch('/api/promo/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: newPromoCode, discount: newPromoDiscount })
      })
      if (res.ok) {
        setNewPromoCode('')
        setNewPromoDiscount('')
        fetchData()
        alert('Промокод создан!')
      } else {
        alert('Ошибка: возможно код уже есть')
      }
    } catch (e) { console.error(e) }
  }

  const handleDeletePromo = async (id: number) => {
    if (!confirm('Удалить этот код?')) return
    try {
      await fetch(`/api/promo/${id}`, { method: 'DELETE' })
      fetchData()
    } catch (e) { console.error(e) }
  }


  // --- ХЕДЕР ---
  const Header = () => (
    <div className="w-full sticky top-0 z-40 flex flex-col">
      <div className="bg-white w-full z-20 relative shadow-sm">
        <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 h-24 flex items-center justify-between">
        
          <div className="flex items-center gap-6">
            <button 
              onClick={onBack}
              className="hover:opacity-60 transition-opacity"
              style={{ background: 'none', border: 'none', padding: 0 }}
            >
               <ArrowLeft size={35} color="black" />
            </button>
            <h1 className="text-3xl md:text-[36px] font-bold text-black tracking-tighter leading-none hidden sm:block">
              Admin Panel
            </h1>
          </div>

          <div className="flex items-center gap-6">
             <img src="/logo2.png" alt="Watta Sushi" className="h-20 md:h-40 w-auto object-contain" />
             <button 
              onClick={fetchData}
              className="w-12 h-12 flex items-center justify-center hover:rotate-180 transition duration-500 rounded-full hover:bg-gray-100"
             >
              <RefreshCw size={32} color="black" />
             </button>
          </div>
        </div>
      </div>
      
      <div className="relative w-full h-0 z-10">
        <div className="absolute top-0 w-full h-[32px] bg-[rgba(217,217,217,0.75)] blur-[25px] opacity-75 pointer-events-none" style={{ transform: 'scale(1.1)' }} />
        <div className="absolute top-0 w-full h-[60px] bg-gradient-to-b from-black/10 to-transparent pointer-events-none" />
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-white font-sans relative overflow-x-hidden">
      <Header />

      {/* ОСНОВНОЙ КОНТЕНТ */}
      <div className="w-full bg-[#F3F4F6] min-h-[calc(100vh-128px)] pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8">
          
          {/* ТАБЫ */}
          <div className="flex gap-6 md:gap-10 mb-8 ml-4 overflow-x-auto pb-2">
            <button 
              onClick={() => setActiveTab('orders')}
              className={`text-[20px] md:text-[24px] font-bold tracking-tight transition-colors whitespace-nowrap ${
                activeTab === 'orders' ? 'text-[#165044]' : 'text-[#7C7C7C]'
              }`}
            >
              📦 Заказы
            </button>
            <button 
              onClick={() => setActiveTab('products')}
              className={`text-[20px] md:text-[24px] font-bold tracking-tight transition-colors whitespace-nowrap ${
                activeTab === 'products' ? 'text-[#165044]' : 'text-[#7C7C7C]'
              }`}
            >
              🍣 Товары
            </button>
            <button 
              onClick={() => setActiveTab('promos')}
              className={`text-[20px] md:text-[24px] font-bold tracking-tight transition-colors whitespace-nowrap ${
                activeTab === 'promos' ? 'text-[#165044]' : 'text-[#7C7C7C]'
              }`}
            >
              🏷️ Промокоды
            </button>
          </div>

          {/* === Вкладка: ЗАКАЗЫ === */}
          {activeTab === 'orders' && (
            <div className="flex flex-col gap-8 items-center">
              {isLoading && orders.length === 0 ? (
                 <div className="text-2xl text-gray-400 mt-10">Загрузка...</div>
              ) : orders.length === 0 ? (
                 <div className="text-2xl text-gray-400 mt-10">Нет активных заказов</div>
              ) : (
                orders.map((order) => (
                  <div 
                    key={order.id} 
                    className="w-full bg-white rounded-[25px] p-8 shadow-sm flex flex-col gap-6 relative"
                  >
                    {/* Хедер заказа */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="text-[24px] font-bold text-black">
                        Заказ №{order.id}
                        <span className="text-gray-400 text-sm font-normal ml-3">
                          {new Date(order.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <span className={`px-4 py-2 rounded-full text-sm font-bold uppercase ${
                        order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'COOKING' ? 'bg-orange-100 text-orange-800' :
                        order.status === 'DELIVERING' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {order.status}
                      </span>
                    </div>

                    {/* Данные клиента */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-[15px]">
                      <div className="flex flex-col gap-2 text-[16px] text-[#555]">
                        <div className="flex items-center gap-2 font-bold text-black"><User size={18}/> {order.customerName}</div>
                        <div className="flex items-center gap-2"><Phone size={18}/> {order.phone}</div>
                        <div className="flex items-center gap-2"><MapPin size={18}/> {order.address}</div>
                      </div>
                      <div className="flex flex-col gap-2">
                         {order.comment ? (
                            <div className="text-orange-600 bg-orange-50 p-2 rounded-lg border border-orange-100 text-sm">
                              📝 {order.comment}
                            </div>
                         ) : (
                            <div className="text-gray-400 text-sm italic">Без комментария</div>
                         )}
                      </div>
                    </div>

                    {/* Товары */}
                    <div className="flex flex-col gap-3">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="w-full bg-[#F3F4F6] rounded-[15px] p-4 flex justify-between items-center h-[57px]">
                          <span className="text-black text-[16px] font-medium">{item.product.name_ru}</span>
                          <span className="font-bold text-black text-lg">x{item.quantity}</span>
                        </div>
                      ))}
                    </div>

                    {/* Статусы и Итого */}
                    <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
                      
                      {/* Кнопки смены статуса */}
                      <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto">
                         <button onClick={() => updateStatus(order.id, 'COOKING')} className="p-2 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100" title="Готовится"><ChefHat/></button>
                         <button onClick={() => updateStatus(order.id, 'DELIVERING')} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100" title="В доставке"><Truck/></button>
                         <button onClick={() => updateStatus(order.id, 'COMPLETED')} className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100" title="Выполнен"><Check/></button>
                         <div className="w-px bg-gray-300 mx-2"></div>
                         <button onClick={() => updateStatus(order.id, 'CANCELLED')} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100" title="Отменить"><XCircle/></button>
                      </div>

                      <div className="text-[#194A38] text-[28px] font-bold">
                        {order.totalPrice} ₴
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
          
          {/* === Вкладка: ТОВАРЫ === */}
          {activeTab === 'products' && (
             <div className="flex flex-col gap-8">
                <button 
                  onClick={openCreateModal}
                  className="w-full h-[77px] bg-[#155044] rounded-[15px] flex items-center justify-center text-white text-[24px] font-bold hover:bg-[#103d34] transition shadow-md"
                >
                  + Добавить товар
                </button>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map(product => (
                    <div key={product.id} className="bg-white rounded-[25px] p-5 shadow-sm flex flex-col gap-4 hover:shadow-md transition">
                       {/* Картинка */}
                       <div className="w-full h-[200px] bg-gray-100 rounded-[15px] overflow-hidden relative">
                         {product.imageUrl ? (
                           <img src={product.imageUrl} alt={product.name_ru} className="w-full h-full object-cover" />
                         ) : (
                           <div className="w-full h-full flex items-center justify-center text-gray-300">
                             <ImageIcon size={48} />
                           </div>
                         )}
                         {product.isPopular && (
                           <span className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full">ХИТ</span>
                         )}
                       </div>
                       
                       {/* Инфо */}
                       <div className="flex flex-col flex-1">
                         <div className="flex justify-between items-start mb-2">
                           <h3 className="text-[20px] font-bold text-black leading-tight">{product.name_ru}</h3>
                           <span className="text-[20px] font-bold text-[#194A38] whitespace-nowrap">{product.price} ₴</span>
                         </div>
                         <p className="text-[14px] text-[#7C7C7C] line-clamp-2 mb-4 h-[42px]">{product.description_ru}</p>
                         
                         {/* Футер карточки с кнопками */}
                         <div className="mt-auto pt-2 border-t border-gray-100 flex justify-between items-center text-xs text-gray-400">
                            <div className="flex gap-2">
                              <span>ID: {product.id}</span>
                              <span className="hidden sm:inline">| {categories.find(c => c.id === product.categoryId)?.name_ru}</span>
                            </div>

                            {/* КНОПКИ ДЕЙСТВИЙ */}
                            <div className="flex gap-2">
                              <button 
                                onClick={() => openEditModal(product)}
                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                title="Редактировать"
                              >
                                <Pencil size={18} />
                              </button>
                              <button 
                                onClick={() => handleDeleteProduct(product.id)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                title="Удалить"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                         </div>
                       </div>
                    </div>
                  ))}
                </div>
             </div>
          )}

          {/* === Вкладка: ПРОМОКОДЫ === */}
          {activeTab === 'promos' && (
            <div className="flex flex-col gap-8">
              {/* Форма создания */}
              <div className="bg-white rounded-[25px] p-8 shadow-sm">
                <h2 className="text-xl font-bold text-[#155044] mb-4 flex items-center gap-2">
                  <Tag /> Создать новый промокод
                </h2>
                <form onSubmit={handleCreatePromo} className="flex flex-col md:flex-row gap-4">
                  <input 
                    type="text" 
                    placeholder="Код (например, NEW2025)"
                    value={newPromoCode}
                    onChange={e => setNewPromoCode(e.target.value.toUpperCase())}
                    className="flex-1 p-4 bg-[#F3F4F6] rounded-[15px] outline-none font-bold uppercase"
                    required
                  />
                  <input 
                    type="number" 
                    placeholder="Скидка %"
                    value={newPromoDiscount}
                    onChange={e => setNewPromoDiscount(e.target.value)}
                    className="w-full md:w-[150px] p-4 bg-[#F3F4F6] rounded-[15px] outline-none font-bold"
                    required
                  />
                  <button className="px-8 py-4 bg-[#155044] text-white font-bold rounded-[15px] hover:bg-[#103d34] transition">
                    Создать
                  </button>
                </form>
              </div>

              {/* Список */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {promos.map(promo => (
                   <div key={promo.id} className="bg-white rounded-[20px] p-6 shadow-sm flex items-center justify-between border border-gray-100">
                     <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-[#F3F4F6] rounded-full flex items-center justify-center text-[#155044]">
                         <Tag size={24} />
                       </div>
                       <div>
                         <div className="text-xl font-bold text-[#194A38]">{promo.code}</div>
                         <div className="text-green-600 font-bold">-{promo.discount}% скидка</div>
                       </div>
                     </div>
                     <button 
                       onClick={() => handleDeletePromo(promo.id)}
                       className="p-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                     >
                       <Trash2 size={24} />
                     </button>
                   </div>
                 ))}
                 {promos.length === 0 && <div className="text-gray-400 col-span-3 text-center">Промокодов пока нет</div>}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* МОДАЛЬНОЕ ОКНО (С ИСПРАВЛЕННЫМИ ПОЛЯМИ ПОД 4 ЯЗЫКА) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[25px] w-full max-w-2xl p-8 shadow-2xl relative animate-in fade-in zoom-in duration-200 h-auto max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500 transition"
            >
              <X size={24} />
            </button>
            
            <h2 className="text-2xl font-bold text-[#155044] mb-6 text-center">
              {editingId ? 'Редактировать блюдо' : 'Новое блюдо'}
            </h2>
            
            <form onSubmit={handleSubmitProduct} className="space-y-4">
              <div className="flex justify-center mb-4">
                <label className="cursor-pointer w-full h-40 border-2 border-dashed border-gray-300 rounded-[15px] flex flex-col items-center justify-center hover:bg-gray-50 transition relative overflow-hidden group">
                  {formData.imageUrl ? (
                    <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <Upload size={32} className="text-gray-400 mb-2" />
                      <span className="text-sm text-gray-500">Нажмите, чтобы загрузить фото</span>
                    </>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  {formData.imageUrl && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                      <span className="text-white font-medium">Изменить</span>
                    </div>
                  )}
                </label>
              </div>

              {/* НАЗВАНИЯ (Сетка 2x2) */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl">
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">Название (RU)</label>
                  <input name="name_ru" value={formData.name_ru} onChange={handleInputChange} className="w-full p-2 bg-white border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-[#155044]" placeholder="Лосось" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">Назва (UA)</label>
                  <input name="name_ua" value={formData.name_ua} onChange={handleInputChange} className="w-full p-2 bg-white border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-[#155044]" placeholder="Лосось" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">Name (EN)</label>
                  <input name="name_en" value={formData.name_en} onChange={handleInputChange} className="w-full p-2 bg-white border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-[#155044]" placeholder="Salmon" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">Naam (NL)</label>
                  <input name="name_nl" value={formData.name_nl} onChange={handleInputChange} className="w-full p-2 bg-white border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-[#155044]" placeholder="Zalm" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Цена (₴)</label>
                  <input 
                    name="price" 
                    type="number" 
                    required 
                    value={formData.price} 
                    onChange={handleInputChange}
                    className="w-full p-3 bg-[#F3F4F6] rounded-[10px] outline-none focus:ring-2 focus:ring-[#155044]"
                    placeholder="0" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Категория</label>
                  <select 
                    name="categoryId" 
                    required 
                    value={formData.categoryId} 
                    onChange={handleInputChange}
                    className="w-full p-3 bg-[#F3F4F6] rounded-[10px] outline-none focus:ring-2 focus:ring-[#155044]"
                  >
                    <option value="">Выберите...</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name_ru}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* ОПИСАНИЯ */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Описания (Состав)</label>
                <textarea name="description_ru" value={formData.description_ru} onChange={handleInputChange} className="w-full p-2 bg-[#F3F4F6] rounded-lg h-16 text-sm outline-none focus:ring-1 focus:ring-[#155044]" placeholder="RU: Рис, нори..." />
                <textarea name="description_ua" value={formData.description_ua} onChange={handleInputChange} className="w-full p-2 bg-[#F3F4F6] rounded-lg h-16 text-sm outline-none focus:ring-1 focus:ring-[#155044]" placeholder="UA: Рис, норі..." />
                <div className="grid grid-cols-2 gap-2">
                   <textarea name="description_en" value={formData.description_en} onChange={handleInputChange} className="w-full p-2 bg-[#F3F4F6] rounded-lg h-16 text-sm outline-none focus:ring-1 focus:ring-[#155044]" placeholder="EN: Rice..." />
                   <textarea name="description_nl" value={formData.description_nl} onChange={handleInputChange} className="w-full p-2 bg-[#F3F4F6] rounded-lg h-16 text-sm outline-none focus:ring-1 focus:ring-[#155044]" placeholder="NL: Rijst..." />
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full py-4 bg-[#155044] text-white font-bold rounded-[15px] hover:bg-[#103d34] transition shadow-lg mt-2"
              >
                {editingId ? 'Сохранить изменения' : 'Сохранить'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}