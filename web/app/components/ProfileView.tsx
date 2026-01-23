// 'use client'

// import { useState, useEffect } from 'react'
// import {
//   ArrowLeft, Phone, Bell, Heart, ShoppingBag, User, Menu,
//   MapPin, Clock, Settings, LogOut, Package, Shield
// } from 'lucide-react'

// // --- ТИПЫ ДАННЫХ ---
// interface OrderItem {
//   id: number
//   quantity: number
//   product: {
//     name_ru: string
//     imageUrl?: string
//   }
// }

// interface Order {
//   id: number
//   createdAt: string
//   totalPrice: number
//   status: string
//   items: OrderItem[]
// }

// interface UserData {
//   name: string
//   email: string
//   phone: string
//   address: string
// }

// interface ProfileViewProps {
//   onBack: () => void
//   onMenuClick: () => void
//   onOpenPhone: () => void
//   onOpenNotifications: () => void
//   onOpenFavorites: () => void
//   onOpenCart: () => void
//   onSelectCategory: (key: string) => void
//   onOpenAdmin: () => void
//   initialTab?: 'history' | 'address' | 'favorites' // Проп для выбора вкладки при открытии
// }

// export default function ProfileView({
//   onBack,
//   onMenuClick,
//   onOpenPhone,
//   onOpenNotifications,
//   onOpenFavorites,
//   onOpenCart,
//   onOpenAdmin,
//   initialTab = 'history'
// }: ProfileViewProps) {

//   const [activeTab, setActiveTab] = useState<'history' | 'address' | 'favorites' | 'data'>('history')
//   const [orders, setOrders] = useState<Order[]>([])
//   const [favorites, setFavorites] = useState<any[]>([])
//   const [user, setUser] = useState<UserData | null>(null)
//   const [loading, setLoading] = useState(true)

//   // Установка начальной вкладки
//   useEffect(() => {
//     if (initialTab) setActiveTab(initialTab)
//   }, [initialTab])

//   // --- ЗАГРУЗКА ДАННЫХ ---
//   useEffect(() => {
//     if (typeof window !== 'undefined') {
//       // 1. Загрузка пользователя (из LocalStorage, так быстрее)
//       const savedUser = localStorage.getItem('currentUser')
//       if (savedUser) {
//         try { setUser(JSON.parse(savedUser)) } catch (e) {}
//       }

//       // 2. Загрузка Избранного (пока из LocalStorage)
//       const savedFav = localStorage.getItem('favorites')
//       if (savedFav) {
//         try { setFavorites(JSON.parse(savedFav)) } catch (e) {}
//       }

//       // 3. ЗАГРУЗКА ИСТОРИИ ЗАКАЗОВ С СЕРВЕРА (БЕКЕНД)
//       const fetchOrders = async () => {
//         setLoading(true)
//         const token = localStorage.getItem('token')
        
//         if (!token) {
//           setLoading(false)
//           return
//         }

//         try {
//           const res = await fetch('/api/orders/my', {
//             headers: {
//               'Authorization': `Bearer ${token}` // Отправляем токен
//             }
//           })
          
//           if (res.ok) {
//             const data = await res.json()
//             setOrders(data)
//           } else {
//             console.error('Не удалось загрузить заказы')
//           }
//         } catch (error) {
//           console.error('Ошибка сети:', error)
//         } finally {
//           setLoading(false)
//         }
//       }

//       fetchOrders()
//     }
//   }, [])

//   // --- ВЫХОД ИЗ АККАУНТА ---
//   const handleLogout = () => {
//     localStorage.removeItem('token')
//     localStorage.removeItem('currentUser')
//     localStorage.removeItem('userId')
//     localStorage.removeItem('userOrders') // Удаляем старый кэш, если был
//     window.dispatchEvent(new Event('userChanged'))
//     onBack() // Возвращаемся на главную
//   }

//   // Перевод статусов
//   const getStatusText = (status: string) => {
//     switch (status) {
//       case 'PENDING': return 'Обробляється'
//       case 'CONFIRMED': return 'Підтверджено'
//       case 'COOKING': return 'Готується'
//       case 'DELIVERING': return 'Доставляється'
//       case 'COMPLETED': return 'Виконано'
//       case 'CANCELLED': return 'Скасовано'
//       default: return status
//     }
//   }

//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case 'PENDING': return 'text-yellow-600 bg-yellow-50'
//       case 'COMPLETED': return 'text-green-600 bg-green-50'
//       case 'CANCELLED': return 'text-red-600 bg-red-50'
//       default: return 'text-blue-600 bg-blue-50'
//     }
//   }

//   // --- UI ---

//   const Header = () => (
//     <div className="fixed top-4 left-0 right-0 w-[95%] max-w-[1800px] h-[80px] mx-auto bg-white rounded-[20px] shadow-lg flex items-center justify-between px-6 z-[1000]">
//       <div className="flex items-center gap-2 cursor-pointer" onClick={onBack}>
//         <img src="/logo.png" alt="Logo" className="h-10 w-10 object-contain" />
//         <img src="/1.jpg" alt="Watta Sushi" className="h-6 w-auto object-contain" />
//       </div>

//       <div className="flex items-center gap-3 md:gap-6 text-gray-700">
//         <button onClick={onOpenPhone} className="hover:bg-gray-100 p-2 rounded-full transition"><Phone size={24} /></button>
//         <button onClick={onOpenNotifications} className="hover:bg-gray-100 p-2 rounded-full transition"><Bell size={24} /></button>
//         <button onClick={() => setActiveTab('favorites')} className={`hover:bg-gray-100 p-2 rounded-full transition ${activeTab === 'favorites' ? 'text-[#ec4899]' : ''}`}><Heart size={24} /></button>
//         <button onClick={onOpenCart} className="hover:bg-gray-100 p-2 rounded-full transition"><ShoppingBag size={24} /></button>
//         <button className="hover:bg-gray-100 p-2 rounded-full text-[#145142]"><User size={24} /></button>
//         <button onClick={onMenuClick} className="hover:bg-gray-100 p-2 rounded-full transition"><Menu size={24} /></button>
//       </div>
//     </div>
//   )

//   return (
//     <div className="min-h-screen bg-[#D9D9D9] font-sans pt-[120px] pb-20 overflow-x-hidden">
//       <Header />

//       <div className="max-w-[1600px] mx-auto px-4 flex flex-col lg:flex-row gap-8">
        
//         {/* ЛЕВАЯ КОЛОНКА - МЕНЮ ПРОФИЛЯ */}
//         <div className="w-full lg:w-[350px] shrink-0">
//           <div className="bg-white rounded-[30px] p-6 shadow-sm sticky top-[120px]">
//             <div className="flex flex-col items-center mb-8">
//               <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
//                 <User size={48} />
//               </div>
//               <h2 className="text-2xl font-bold text-[#194A38]">{user?.name || 'Гість'}</h2>
//               <p className="text-gray-500">{user?.phone || ''}</p>
//             </div>

//             <nav className="flex flex-col gap-2">
//               <button 
//                 onClick={() => setActiveTab('history')}
//                 className={`flex items-center gap-4 p-4 rounded-[15px] font-bold text-lg transition ${activeTab === 'history' ? 'bg-[#145142] text-white' : 'hover:bg-gray-50 text-gray-700'}`}
//               >
//                 <Clock size={24} /> Історія замовлень
//               </button>
//               <button 
//                 onClick={() => setActiveTab('address')}
//                 className={`flex items-center gap-4 p-4 rounded-[15px] font-bold text-lg transition ${activeTab === 'address' ? 'bg-[#145142] text-white' : 'hover:bg-gray-50 text-gray-700'}`}
//               >
//                 <MapPin size={24} /> Адреси доставки
//               </button>
//               <button 
//                 onClick={() => setActiveTab('favorites')}
//                 className={`flex items-center gap-4 p-4 rounded-[15px] font-bold text-lg transition ${activeTab === 'favorites' ? 'bg-[#145142] text-white' : 'hover:bg-gray-50 text-gray-700'}`}
//               >
//                 <Heart size={24} /> Обране
//               </button>
//               <button 
//                 onClick={() => setActiveTab('data')}
//                 className={`flex items-center gap-4 p-4 rounded-[15px] font-bold text-lg transition ${activeTab === 'data' ? 'bg-[#145142] text-white' : 'hover:bg-gray-50 text-gray-700'}`}
//               >
//                 <Settings size={24} /> Особисті дані
//               </button>
              
//               <div className="h-px bg-gray-200 my-2"></div>
              
//               <button 
//                 onClick={handleLogout}
//                 className="flex items-center gap-4 p-4 rounded-[15px] font-bold text-lg text-red-500 hover:bg-red-50 transition"
//               >
//                 <LogOut size={24} /> Вийти
//               </button>
//             </nav>
//           </div>
//         </div>

//         {/* ПРАВАЯ КОЛОНКА - КОНТЕНТ */}
//         <div className="flex-1">
//           <div className="bg-white rounded-[30px] p-8 shadow-sm min-h-[500px]">
            
//             {/* --- ВКЛАДКА: ИСТОРИЯ --- */}
//             {activeTab === 'history' && (
//               <div className="animate-in fade-in">
//                 <h2 className="text-3xl font-bold text-[#194A38] mb-6">Історія замовлень</h2>
                
//                 {loading ? (
//                   <div className="text-center py-20 text-gray-400">Завантаження історії...</div>
//                 ) : orders.length === 0 ? (
//                   <div className="text-center py-20">
//                     <Package size={64} className="mx-auto text-gray-300 mb-4" />
//                     <p className="text-xl text-gray-400 font-medium">Ви ще нічого не замовляли</p>
//                     <button onClick={onBack} className="mt-4 text-[#145142] font-bold hover:underline">Перейти до меню</button>
//                   </div>
//                 ) : (
//                   <div className="flex flex-col gap-6">
//                     {orders.map(order => (
//                       <div key={order.id} className="border border-gray-100 rounded-[20px] p-6 hover:shadow-md transition bg-gray-50">
//                         <div className="flex justify-between items-start mb-4">
//                           <div>
//                             <div className="text-lg font-bold text-[#194A38]">Замовлення #{order.id}</div>
//                             <div className="text-gray-500 text-sm">{new Date(order.createdAt).toLocaleString('uk-UA')}</div>
//                           </div>
//                           <span className={`px-4 py-1 rounded-full text-sm font-bold ${getStatusColor(order.status)}`}>
//                             {getStatusText(order.status)}
//                           </span>
//                         </div>
                        
//                         <div className="space-y-2 mb-4">
//                           {order.items.map((item, idx) => (
//                             <div key={idx} className="flex justify-between text-gray-700">
//                               <span>{item.product.name_ru} <span className="text-gray-400">x{item.quantity}</span></span>
//                             </div>
//                           ))}
//                         </div>
                        
//                         <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
//                           <span className="font-medium text-gray-500">Сума:</span>
//                           <span className="text-2xl font-bold text-[#194A38]">{order.totalPrice} ₴</span>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 )}
//               </div>
//             )}

//             {/* --- ВКЛАДКА: ИЗБРАННОЕ --- */}
//             {activeTab === 'favorites' && (
//               <div className="animate-in fade-in">
//                 <h2 className="text-3xl font-bold text-[#194A38] mb-6">Обране</h2>
//                 {favorites.length === 0 ? (
//                   <div className="text-center py-20 text-gray-400 font-medium">
//                     Список порожній
//                   </div>
//                 ) : (
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                     {favorites.map((item: any) => (
//                       <div key={item.id} className="flex gap-4 p-4 bg-gray-50 rounded-[20px] items-center">
//                         <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center text-2xl">
//                           {item.emoji || '🍱'}
//                         </div>
//                         <div>
//                           <div className="font-bold text-[#194A38]">{item.name}</div>
//                           <div className="text-[#145142] font-bold">{item.price} ₴</div>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 )}
//               </div>
//             )}

//             {/* --- ВКЛАДКА: АДРЕСА --- */}
//             {activeTab === 'address' && (
//               <div className="animate-in fade-in">
//                 <h2 className="text-3xl font-bold text-[#194A38] mb-6">Мої адреси</h2>
//                 {user?.address ? (
//                    <div className="p-4 bg-gray-50 rounded-[20px] flex items-center gap-4">
//                       <MapPin className="text-[#145142]" />
//                       <span className="text-lg font-medium">{user.address}</span>
//                    </div>
//                 ) : (
//                   <div className="text-center py-20 text-gray-400 font-medium">
//                     Адреси не збережені
//                   </div>
//                 )}
//               </div>
//             )}

//             {/* --- ВКЛАДКА: ДАННЫЕ --- */}
//             {activeTab === 'data' && (
//               <div className="animate-in fade-in">
//                 <h2 className="text-3xl font-bold text-[#194A38] mb-6">Особисті дані</h2>
//                 <div className="space-y-4 max-w-md">
//                   <div>
//                     <label className="text-gray-500 text-sm ml-2">Ім'я</label>
//                     <div className="w-full p-4 bg-gray-50 rounded-[15px] font-medium">{user?.name}</div>
//                   </div>
//                   <div>
//                     <label className="text-gray-500 text-sm ml-2">Телефон</label>
//                     <div className="w-full p-4 bg-gray-50 rounded-[15px] font-medium">{user?.phone}</div>
//                   </div>
//                   <div>
//                     <label className="text-gray-500 text-sm ml-2">Email</label>
//                     <div className="w-full p-4 bg-gray-50 rounded-[15px] font-medium">{user?.email}</div>
//                   </div>
//                 </div>
//               </div>
//             )}

//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }

// 'use client'

// import { useState, useEffect } from 'react'
// import {
//   ArrowLeft, Phone, Bell, Heart, ShoppingBag, User, Menu,
//   MapPin, Clock, Settings, LogOut, Package, Shield // <--- Добавил Shield
// } from 'lucide-react'

// // --- ТИПЫ ДАННЫХ ---
// interface OrderItem {
//   id: number
//   quantity: number
//   product: {
//     name_ru: string
//     imageUrl?: string
//   }
// }

// interface Order {
//   id: number
//   createdAt: string
//   totalPrice: number
//   status: string
//   items: OrderItem[]
// }

// interface UserData {
//   name: string
//   email: string
//   phone: string
//   address: string
// }

// interface ProfileViewProps {
//   onBack: () => void
//   onMenuClick: () => void
//   onOpenPhone: () => void
//   onOpenNotifications: () => void
//   onOpenFavorites: () => void
//   onOpenCart: () => void
//   onOpenAdmin: () => void // <--- НОВЫЙ ПРОП ДЛЯ АДМИНКИ
//   initialTab?: 'history' | 'address' | 'favorites'
// }

// export default function ProfileView({
//   onBack,
//   onMenuClick,
//   onOpenPhone,
//   onOpenNotifications,
//   onOpenFavorites,
//   onOpenCart,
//   onOpenAdmin, // <--- Принимаем функцию
//   initialTab = 'history'
// }: ProfileViewProps) {

//   const [activeTab, setActiveTab] = useState<'history' | 'address' | 'favorites' | 'data'>('history')
//   const [orders, setOrders] = useState<Order[]>([])
//   const [favorites, setFavorites] = useState<any[]>([])
//   const [user, setUser] = useState<UserData | null>(null)
//   const [loading, setLoading] = useState(true)

//   useEffect(() => {
//     if (initialTab) setActiveTab(initialTab)
//   }, [initialTab])

//   // --- ЗАГРУЗКА ДАННЫХ ---
//   useEffect(() => {
//     if (typeof window !== 'undefined') {
//       const savedUser = localStorage.getItem('currentUser')
//       if (savedUser) {
//         try { setUser(JSON.parse(savedUser)) } catch (e) {}
//       }

//       const savedFav = localStorage.getItem('favorites')
//       if (savedFav) {
//         try { setFavorites(JSON.parse(savedFav)) } catch (e) {}
//       }

//       // Загрузка истории
//       const fetchOrders = async () => {
//         setLoading(true)
//         const token = localStorage.getItem('token')
        
//         if (!token) {
//           setLoading(false)
//           return
//         }

//         try {
//           const res = await fetch('/api/orders/my', {
//             headers: { 'Authorization': `Bearer ${token}` }
//           })
          
//           if (res.ok) {
//             const data = await res.json()
//             setOrders(data)
//           }
//         } catch (error) {
//           console.error(error)
//         } finally {
//           setLoading(false)
//         }
//       }

//       fetchOrders()
//     }
//   }, [])

//   const handleLogout = () => {
//     localStorage.removeItem('token')
//     localStorage.removeItem('currentUser')
//     localStorage.removeItem('userId')
//     localStorage.removeItem('userOrders')
//     window.dispatchEvent(new Event('userChanged'))
//     onBack()
//   }

//   // Перевод статусов
//   const getStatusText = (status: string) => {
//     switch (status) {
//       case 'PENDING': return 'Обробляється'
//       case 'CONFIRMED': return 'Підтверджено'
//       case 'COOKING': return 'Готується'
//       case 'DELIVERING': return 'Доставляється'
//       case 'COMPLETED': return 'Виконано'
//       case 'CANCELLED': return 'Скасовано'
//       default: return status
//     }
//   }

//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case 'PENDING': return 'text-yellow-600 bg-yellow-50'
//       case 'COMPLETED': return 'text-green-600 bg-green-50'
//       case 'CANCELLED': return 'text-red-600 bg-red-50'
//       default: return 'text-blue-600 bg-blue-50'
//     }
//   }

//   const Header = () => (
//     <div className="fixed top-4 left-0 right-0 w-[95%] max-w-[1800px] h-[80px] mx-auto bg-white rounded-[20px] shadow-lg flex items-center justify-between px-6 z-[1000]">
//       <div className="flex items-center gap-2 cursor-pointer" onClick={onBack}>
//         <img src="/logo.png" alt="Logo" className="h-10 w-10 object-contain" />
//         <img src="/1.jpg" alt="Watta Sushi" className="h-6 w-auto object-contain" />
//       </div>

//       <div className="flex items-center gap-3 md:gap-6 text-gray-700">
//         <button onClick={onOpenPhone} className="hover:bg-gray-100 p-2 rounded-full transition"><Phone size={24} /></button>
//         <button onClick={onOpenNotifications} className="hover:bg-gray-100 p-2 rounded-full transition"><Bell size={24} /></button>
//         <button onClick={() => setActiveTab('favorites')} className={`hover:bg-gray-100 p-2 rounded-full transition ${activeTab === 'favorites' ? 'text-[#ec4899]' : ''}`}><Heart size={24} /></button>
//         <button onClick={onOpenCart} className="hover:bg-gray-100 p-2 rounded-full transition"><ShoppingBag size={24} /></button>
//         <button className="hover:bg-gray-100 p-2 rounded-full text-[#145142]"><User size={24} /></button>
//         <button onClick={onMenuClick} className="hover:bg-gray-100 p-2 rounded-full transition"><Menu size={24} /></button>
//       </div>
//     </div>
//   )

//   return (
//     <div className="min-h-screen bg-[#D9D9D9] font-sans pt-[120px] pb-20 overflow-x-hidden">
//       <Header />

//       <div className="max-w-[1600px] mx-auto px-4 flex flex-col lg:flex-row gap-8">
        
//         {/* ЛЕВАЯ КОЛОНКА - МЕНЮ */}
//         <div className="w-full lg:w-[350px] shrink-0">
//           <div className="bg-white rounded-[30px] p-6 shadow-sm sticky top-[120px]">
//             <div className="flex flex-col items-center mb-8">
//               <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
//                 <User size={48} />
//               </div>
//               <h2 className="text-2xl font-bold text-[#194A38]">{user?.name || 'Гість'}</h2>
//               <p className="text-gray-500">{user?.phone || ''}</p>
//             </div>

//             <nav className="flex flex-col gap-2">
//               <button onClick={() => setActiveTab('history')} className={`flex items-center gap-4 p-4 rounded-[15px] font-bold text-lg transition ${activeTab === 'history' ? 'bg-[#145142] text-white' : 'hover:bg-gray-50 text-gray-700'}`}>
//                 <Clock size={24} /> Історія замовлень
//               </button>
//               <button onClick={() => setActiveTab('address')} className={`flex items-center gap-4 p-4 rounded-[15px] font-bold text-lg transition ${activeTab === 'address' ? 'bg-[#145142] text-white' : 'hover:bg-gray-50 text-gray-700'}`}>
//                 <MapPin size={24} /> Адреси доставки
//               </button>
//               <button onClick={() => setActiveTab('favorites')} className={`flex items-center gap-4 p-4 rounded-[15px] font-bold text-lg transition ${activeTab === 'favorites' ? 'bg-[#145142] text-white' : 'hover:bg-gray-50 text-gray-700'}`}>
//                 <Heart size={24} /> Обране
//               </button>
//               <button onClick={() => setActiveTab('data')} className={`flex items-center gap-4 p-4 rounded-[15px] font-bold text-lg transition ${activeTab === 'data' ? 'bg-[#145142] text-white' : 'hover:bg-gray-50 text-gray-700'}`}>
//                 <Settings size={24} /> Особисті дані
//               </button>
              
//               <div className="h-px bg-gray-200 my-2"></div>
              
//               {/* --- ВОТ ТВОЙ РОЗОВЫЙ ЩИТ --- */}
//               <button 
//                 onClick={onOpenAdmin}
//                 className="flex items-center gap-4 p-4 rounded-[15px] font-bold text-lg text-pink-500 hover:bg-pink-50 transition"
//               >
//                 <Shield size={24} /> Адмін-панель
//               </button>

//               <button onClick={handleLogout} className="flex items-center gap-4 p-4 rounded-[15px] font-bold text-lg text-red-500 hover:bg-red-50 transition">
//                 <LogOut size={24} /> Вийти
//               </button>
//             </nav>
//           </div>
//         </div>

//         {/* ПРАВАЯ КОЛОНКА - КОНТЕНТ (БЕЗ ИЗМЕНЕНИЙ) */}
//         <div className="flex-1">
//           <div className="bg-white rounded-[30px] p-8 shadow-sm min-h-[500px]">
//             {activeTab === 'history' && (
//               <div className="animate-in fade-in">
//                 <h2 className="text-3xl font-bold text-[#194A38] mb-6">Історія замовлень</h2>
//                 {loading ? <div className="text-center py-20 text-gray-400">Завантаження...</div> : 
//                  orders.length === 0 ? (
//                   <div className="text-center py-20">
//                     <Package size={64} className="mx-auto text-gray-300 mb-4" />
//                     <p className="text-xl text-gray-400 font-medium">Ви ще нічого не замовляли</p>
//                     <button onClick={onBack} className="mt-4 text-[#145142] font-bold hover:underline">Перейти до меню</button>
//                   </div>
//                 ) : (
//                   <div className="flex flex-col gap-6">
//                     {orders.map(order => (
//                       <div key={order.id} className="border border-gray-100 rounded-[20px] p-6 hover:shadow-md transition bg-gray-50">
//                         <div className="flex justify-between items-start mb-4">
//                           <div>
//                             <div className="text-lg font-bold text-[#194A38]">Замовлення #{order.id}</div>
//                             <div className="text-gray-500 text-sm">{new Date(order.createdAt).toLocaleString('uk-UA')}</div>
//                           </div>
//                           <span className={`px-4 py-1 rounded-full text-sm font-bold ${getStatusColor(order.status)}`}>{getStatusText(order.status)}</span>
//                         </div>
//                         <div className="space-y-2 mb-4">
//                           {order.items.map((item, idx) => (
//                             <div key={idx} className="flex justify-between text-gray-700">
//                               <span>{item.product.name_ru} <span className="text-gray-400">x{item.quantity}</span></span>
//                             </div>
//                           ))}
//                         </div>
//                         <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
//                           <span className="font-medium text-gray-500">Сума:</span>
//                           <span className="text-2xl font-bold text-[#194A38]">{order.totalPrice} ₴</span>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 )}
//               </div>
//             )}
//             {activeTab === 'favorites' && (
//               <div className="animate-in fade-in">
//                 <h2 className="text-3xl font-bold text-[#194A38] mb-6">Обране</h2>
//                 {favorites.length === 0 ? <div className="text-center py-20 text-gray-400 font-medium">Список порожній</div> : (
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                     {favorites.map((item: any) => (
//                       <div key={item.id} className="flex gap-4 p-4 bg-gray-50 rounded-[20px] items-center">
//                         <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center text-2xl">{item.emoji || '🍱'}</div>
//                         <div>
//                           <div className="font-bold text-[#194A38]">{item.name}</div>
//                           <div className="text-[#145142] font-bold">{item.price} ₴</div>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 )}
//               </div>
//             )}
//             {activeTab === 'address' && (
//               <div className="animate-in fade-in">
//                 <h2 className="text-3xl font-bold text-[#194A38] mb-6">Мої адреси</h2>
//                 {user?.address ? <div className="p-4 bg-gray-50 rounded-[20px] flex items-center gap-4"><MapPin className="text-[#145142]" /><span className="text-lg font-medium">{user.address}</span></div> : <div className="text-center py-20 text-gray-400 font-medium">Адреси не збережені</div>}
//               </div>
//             )}
//             {activeTab === 'data' && (
//               <div className="animate-in fade-in">
//                 <h2 className="text-3xl font-bold text-[#194A38] mb-6">Особисті дані</h2>
//                 <div className="space-y-4 max-w-md">
//                   <div><label className="text-gray-500 text-sm ml-2">Ім'я</label><div className="w-full p-4 bg-gray-50 rounded-[15px] font-medium">{user?.name}</div></div>
//                   <div><label className="text-gray-500 text-sm ml-2">Телефон</label><div className="w-full p-4 bg-gray-50 rounded-[15px] font-medium">{user?.phone}</div></div>
//                   <div><label className="text-gray-500 text-sm ml-2">Email</label><div className="w-full p-4 bg-gray-50 rounded-[15px] font-medium">{user?.email}</div></div>
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }

'use client'

import { useState, useEffect } from 'react'
import {
  ArrowLeft, Phone, Bell, Heart, ShoppingBag, User, Menu,
  MapPin, Clock, Settings, LogOut, Package, Shield, Mail
} from 'lucide-react'
import LogoBackground from './LogoBackground'

// --- ТИПЫ ДАННЫХ ---
interface OrderItem {
  id: number
  quantity: number
  price: number
  product: {
    name_ru: string
    imageUrl?: string
  }
}

interface Order {
  id: number
  createdAt: string
  totalPrice: number
  status: string
  items: OrderItem[]
}

interface UserData {
  name: string
  email: string
  phone: string
  address: string
}

// ИСПРАВЛЕННЫЙ ИНТЕРФЕЙС
interface ProfileViewProps {
  onBack: () => void
  onMenuClick: () => void
  onOpenPhone: () => void
  onOpenNotifications: () => void
  onOpenFavorites: () => void
  onOpenCart: () => void
  onOpenAdmin: () => void
  onSelectCategory: (key: string) => void // <--- ДОБАВИЛИ ЭТО ПОЛЕ
  initialTab?: 'history' | 'address' | 'favorites'
}

export default function ProfileView({
  onBack,
  onMenuClick,
  onOpenPhone,
  onOpenNotifications,
  onOpenFavorites,
  onOpenCart,
  onOpenAdmin,
  onSelectCategory, // <--- ДОБАВИЛИ В ПАРАМЕТРЫ
  initialTab = 'history'
}: ProfileViewProps) {

  const [activeTab, setActiveTab] = useState<'history' | 'address' | 'favorites' | 'data'>('history')
  const [orders, setOrders] = useState<Order[]>([])
  const [favorites, setFavorites] = useState<any[]>([])
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab)
  }, [initialTab])

  // --- ЗАГРУЗКА ДАННЫХ ---
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('currentUser')
      if (savedUser) {
        try { 
          const parsed = JSON.parse(savedUser)
          setUser(parsed)
          setIsAdmin(parsed.role === 'ADMIN' || false)
        } catch (e) {}
      }

      const savedFav = localStorage.getItem('favorites')
      if (savedFav) {
        try { setFavorites(JSON.parse(savedFav)) } catch (e) {}
      }

      // Загрузка истории
      const fetchOrders = async () => {
        setLoading(true)
        const token = localStorage.getItem('token')
        
        if (!token) {
          setLoading(false)
          return
        }

        try {
          const res = await fetch('/api/orders/my', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          
          if (res.ok) {
            const data = await res.json()
            setOrders(data)
          }
        } catch (error) {
          console.error(error)
        } finally {
          setLoading(false)
        }
      }

      fetchOrders()
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('currentUser')
    localStorage.removeItem('userId')
    localStorage.removeItem('userOrders')
    window.dispatchEvent(new Event('userChanged'))
    onBack()
  }

  // Перевод статусов
  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Обробляється'
      case 'CONFIRMED': return 'Підтверджено'
      case 'COOKING': return 'Готується'
      case 'DELIVERING': return 'Доставляється'
      case 'COMPLETED': return 'Виконано'
      case 'CANCELLED': return 'Скасовано'
      default: return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'text-yellow-600 bg-yellow-50'
      case 'COMPLETED': return 'text-green-600 bg-green-50'
      case 'CANCELLED': return 'text-red-600 bg-red-50'
      default: return 'text-blue-600 bg-blue-50'
    }
  }

  const Header = () => (
    <div className="fixed top-4 left-0 right-0 w-[95%] max-w-[1800px] h-[100px] mx-auto bg-gradient-to-r from-white via-white to-[#f8faf9] rounded-[28px] shadow-2xl shadow-[#145142]/15 border-2 border-white/90 backdrop-blur-2xl flex items-center justify-between px-8 z-[1000] overflow-hidden">
      {/* Декоративные элементы */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#145142]/8 via-transparent to-transparent opacity-60"></div>
      <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-[#145142]/15 via-[#1a6b58]/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-[#1a6b58]/8 to-transparent rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>
      
      {/* Логотип с кнопкой перехода на главную */}
      <div 
        className="flex items-center gap-4 cursor-pointer relative z-10 group"
        onClick={onBack}
      >
        <div className="relative">
          {/* Анимированное свечение вокруг логотипа */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#145142]/30 via-[#1a6b58]/20 to-[#145142]/30 rounded-2xl blur-xl group-hover:blur-2xl group-hover:scale-110 transition-all duration-500"></div>
          <div className="relative p-3 rounded-2xl bg-gradient-to-br from-[#145142]/10 via-[#1a6b58]/10 to-[#145142]/10 backdrop-blur-sm border-2 border-[#145142]/20 group-hover:border-[#145142]/40 transition-all duration-300 shadow-xl group-hover:shadow-2xl group-hover:scale-105">
            <img 
              src="/logo.png" 
              alt="Watta Sushi Logo" 
              className="h-14 w-14 object-contain drop-shadow-lg group-hover:drop-shadow-2xl transition-all duration-300"
            />
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-gray-500 font-medium group-hover:text-[#145142] transition-colors">На головну</span>
          <span className="text-sm font-bold bg-gradient-to-r from-[#194A38] via-[#145142] to-[#1a6b58] bg-clip-text text-transparent group-hover:scale-105 transition-transform inline-block">
            WATTA SUSHI
          </span>
        </div>
      </div>

      {/* Правая часть с кнопками */}
      <div className="flex items-center gap-3 md:gap-4 relative z-10">
        <button 
          onClick={onOpenPhone} 
          className="relative p-3.5 rounded-xl bg-gradient-to-br from-white to-gray-50 hover:from-[#145142]/10 hover:to-[#145142]/5 transition-all duration-300 hover:scale-110 shadow-md hover:shadow-lg border-2 border-gray-100/50 hover:border-[#145142]/30 group overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#145142]/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
          <Phone size={22} className="text-gray-700 group-hover:text-[#145142] transition-colors relative z-10" />
        </button>
        <button 
          onClick={onOpenNotifications} 
          className="relative p-3.5 rounded-xl bg-gradient-to-br from-white to-gray-50 hover:from-[#145142]/10 hover:to-[#145142]/5 transition-all duration-300 hover:scale-110 shadow-md hover:shadow-lg border-2 border-gray-100/50 hover:border-[#145142]/30 group overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#145142]/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
          <Bell size={22} className="text-gray-700 group-hover:text-[#145142] transition-colors relative z-10" />
        </button>
        <button 
          onClick={() => setActiveTab('favorites')} 
          className={`relative p-3.5 rounded-xl transition-all duration-300 hover:scale-110 shadow-md hover:shadow-lg border-2 overflow-hidden group ${
            activeTab === 'favorites' 
              ? 'bg-gradient-to-br from-pink-500 via-rose-500 to-pink-600 border-pink-300 shadow-xl' 
              : 'bg-gradient-to-br from-white to-gray-50 hover:from-pink-50 hover:to-rose-50 border-gray-100/50 hover:border-pink-200/50'
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
          <Heart 
            size={22} 
            className={activeTab === 'favorites' ? 'text-white fill-white drop-shadow-md' : 'text-gray-700 group-hover:text-pink-500 group-hover:fill-pink-500 transition-colors relative z-10'} 
          />
        </button>
        <button 
          onClick={onOpenCart} 
          className="relative p-3.5 rounded-xl bg-gradient-to-br from-white to-gray-50 hover:from-[#145142]/10 hover:to-[#145142]/5 transition-all duration-300 hover:scale-110 shadow-md hover:shadow-lg border-2 border-gray-100/50 hover:border-[#145142]/30 group overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#145142]/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
          <ShoppingBag size={22} className="text-gray-700 group-hover:text-[#145142] transition-colors relative z-10" />
        </button>
        <button 
          className="relative p-3.5 rounded-xl bg-gradient-to-br from-[#145142] via-[#1a6b58] to-[#145142] shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 border-2 border-[#145142]/30 overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
          <User size={22} className="text-white drop-shadow-md relative z-10" />
        </button>
        <button 
          onClick={onMenuClick} 
          className="relative p-3.5 rounded-xl bg-gradient-to-br from-white to-gray-50 hover:from-[#145142]/10 hover:to-[#145142]/5 transition-all duration-300 hover:scale-110 shadow-md hover:shadow-lg border-2 border-gray-100/50 hover:border-[#145142]/30 group overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#145142]/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
          <Menu size={22} className="text-gray-700 group-hover:text-[#145142] transition-colors relative z-10" />
        </button>
      </div>
    </div>
  )

  return (
    <div className="menu-page-web relative min-h-screen font-sans pt-[140px] pb-20 overflow-x-hidden">
      <LogoBackground />
      <div className="relative z-10">
        <Header />

      <div className="max-w-[1600px] mx-auto px-4 flex flex-col lg:flex-row gap-8">
        
        {/* ЛЕВАЯ КОЛОНКА - МЕНЮ */}
        <div className="w-full lg:w-[420px] shrink-0">
          <div className="bg-gradient-to-br from-white via-white to-[#f0f9f7] rounded-[36px] p-10 shadow-2xl shadow-[#145142]/15 border-2 border-white/90 sticky top-[150px] backdrop-blur-2xl overflow-hidden relative">
            {/* Декоративные элементы */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-[#145142]/12 via-transparent to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-pulse-slow"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-[#1a6b58]/8 via-transparent to-transparent rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-[#145142]/8 via-transparent to-transparent rounded-[36px] pointer-events-none"></div>
            {/* Световые полосы */}
            <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-[#145142]/20 to-transparent"></div>
            <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-[#1a6b58]/15 to-transparent"></div>
            
            <div className="flex flex-col items-center mb-10 relative z-10">
              <div className="relative mb-8 group">
                {/* Множественные анимированные кольца */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#145142] via-[#1a6b58] to-[#145142] animate-spin-slow opacity-25 blur-xl"></div>
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#1a6b58] via-[#145142] to-[#1a6b58] animate-spin-slow opacity-15 blur-2xl" style={{ animationDirection: 'reverse', animationDuration: '12s' }}></div>
                
                {/* Внешнее свечение */}
                <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-[#145142]/20 via-[#1a6b58]/20 to-[#145142]/20 blur-2xl group-hover:blur-3xl group-hover:scale-110 transition-all duration-700"></div>
                
                <div className="relative w-36 h-36 bg-gradient-to-br from-[#145142] via-[#1a6b58] to-[#0f3d32] rounded-full flex items-center justify-center shadow-2xl shadow-[#145142]/50 ring-4 ring-white/90 group-hover:ring-[#145142]/40 transition-all duration-500 group-hover:scale-110 overflow-hidden">
                  {/* Внутренние градиенты */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/30 via-transparent to-[#145142]/20"></div>
                  <div className="absolute inset-0 rounded-full bg-gradient-to-t from-[#0f3d32]/50 to-transparent"></div>
                  
                  {/* Блик */}
                  <div className="absolute top-4 left-4 w-16 h-16 bg-white/20 rounded-full blur-xl"></div>
                  
                  <User size={64} className="text-white relative z-10 drop-shadow-2xl filter" />
                </div>
                
                {isAdmin && (
                  <div className="absolute -bottom-3 -right-3 bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 rounded-full p-3 shadow-2xl ring-4 ring-white animate-pulse-slow group-hover:scale-110 transition-transform duration-300">
                    <Shield size={24} className="text-white drop-shadow-lg" />
                  </div>
                )}
                
                {/* Декоративные точки с анимацией */}
                <div className="absolute -top-3 -left-3 w-4 h-4 bg-[#145142] rounded-full opacity-70 animate-ping shadow-lg shadow-[#145142]/50"></div>
                <div className="absolute -bottom-3 -left-3 w-3 h-3 bg-[#1a6b58] rounded-full opacity-50 animate-pulse"></div>
                <div className="absolute -top-3 -right-3 w-2.5 h-2.5 bg-[#145142] rounded-full opacity-40"></div>
              </div>
              
              <div className="text-center">
                <h2 className="text-4xl font-extrabold bg-gradient-to-r from-[#194A38] via-[#145142] to-[#1a6b58] bg-clip-text text-transparent mb-3 drop-shadow-md">
                  {user?.name || 'Гість'}
                </h2>
                <div className="flex items-center justify-center gap-2.5 text-gray-700 mb-2">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-gray-100 to-gray-50 shadow-md border border-gray-200/50">
                    <Phone size={16} className="text-[#145142]" />
                  </div>
                  <span className="text-base font-semibold">{user?.phone || 'Не вказано'}</span>
                </div>
                {user?.email && (
                  <div className="flex items-center justify-center gap-2.5 text-gray-600 mt-3">
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-gray-100 to-gray-50 shadow-sm border border-gray-200/50">
                      <Mail size={14} className="text-[#145142]" />
                    </div>
                    <span className="text-sm font-medium">{user.email}</span>
                  </div>
                )}
              </div>
            </div>

            <nav className="flex flex-col gap-3 relative z-10">
              <button 
                onClick={() => setActiveTab('history')} 
                className={`group relative flex items-center gap-4 p-5 rounded-[20px] font-bold text-base transition-all duration-300 overflow-hidden ${
                  activeTab === 'history' 
                    ? 'bg-gradient-to-r from-[#145142] via-[#1a6b58] to-[#145142] text-white shadow-2xl shadow-[#145142]/40 scale-[1.02]' 
                    : 'hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 text-gray-700 hover:shadow-lg hover:scale-[1.01] border-2 border-transparent hover:border-gray-200/50'
                }`}
              >
                {activeTab === 'history' && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                    <div className="absolute top-0 left-0 w-1 h-full bg-white/30"></div>
                  </>
                )}
                <div className={`p-2.5 rounded-xl shadow-md transition-all duration-300 ${
                  activeTab === 'history' 
                    ? 'bg-white/25 ring-2 ring-white/30' 
                    : 'bg-gray-100 group-hover:bg-gradient-to-br group-hover:from-[#145142]/10 group-hover:to-[#1a6b58]/10'
                }`}>
                  <Clock size={22} className={activeTab === 'history' ? 'text-white drop-shadow-md' : 'text-[#145142]'} />
                </div>
                <span className="font-bold">{activeTab === 'history' ? 'Історія замовлень' : 'Історія замовлень'}</span>
              </button>
              
              <button 
                onClick={() => setActiveTab('address')} 
                className={`group relative flex items-center gap-4 p-5 rounded-[20px] font-bold text-base transition-all duration-300 overflow-hidden ${
                  activeTab === 'address' 
                    ? 'bg-gradient-to-r from-[#145142] via-[#1a6b58] to-[#145142] text-white shadow-2xl shadow-[#145142]/40 scale-[1.02]' 
                    : 'hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 text-gray-700 hover:shadow-lg hover:scale-[1.01] border-2 border-transparent hover:border-gray-200/50'
                }`}
              >
                {activeTab === 'address' && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                    <div className="absolute top-0 left-0 w-1 h-full bg-white/30"></div>
                  </>
                )}
                <div className={`p-2.5 rounded-xl shadow-md transition-all duration-300 ${
                  activeTab === 'address' 
                    ? 'bg-white/25 ring-2 ring-white/30' 
                    : 'bg-gray-100 group-hover:bg-gradient-to-br group-hover:from-[#145142]/10 group-hover:to-[#1a6b58]/10'
                }`}>
                  <MapPin size={22} className={activeTab === 'address' ? 'text-white drop-shadow-md' : 'text-[#145142]'} />
                </div>
                <span className="font-bold">Адреси доставки</span>
              </button>
              
              <button 
                onClick={() => setActiveTab('favorites')} 
                className={`group relative flex items-center gap-4 p-5 rounded-[20px] font-bold text-base transition-all duration-300 overflow-hidden ${
                  activeTab === 'favorites' 
                    ? 'bg-gradient-to-r from-[#145142] via-[#1a6b58] to-[#145142] text-white shadow-2xl shadow-[#145142]/40 scale-[1.02]' 
                    : 'hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 text-gray-700 hover:shadow-lg hover:scale-[1.01] border-2 border-transparent hover:border-gray-200/50'
                }`}
              >
                {activeTab === 'favorites' && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                    <div className="absolute top-0 left-0 w-1 h-full bg-white/30"></div>
                  </>
                )}
                <div className={`p-2.5 rounded-xl shadow-md transition-all duration-300 ${
                  activeTab === 'favorites' 
                    ? 'bg-white/25 ring-2 ring-white/30' 
                    : 'bg-gray-100 group-hover:bg-gradient-to-br group-hover:from-pink-500/10 group-hover:to-rose-500/10'
                }`}>
                  <Heart size={22} className={activeTab === 'favorites' ? 'text-white fill-white drop-shadow-md' : 'text-[#145142] group-hover:text-pink-500 group-hover:fill-pink-500'} />
                </div>
                <span className="font-bold">Обране</span>
              </button>
              
              <button 
                onClick={() => setActiveTab('data')} 
                className={`group relative flex items-center gap-4 p-5 rounded-[20px] font-bold text-base transition-all duration-300 overflow-hidden ${
                  activeTab === 'data' 
                    ? 'bg-gradient-to-r from-[#145142] via-[#1a6b58] to-[#145142] text-white shadow-2xl shadow-[#145142]/40 scale-[1.02]' 
                    : 'hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 text-gray-700 hover:shadow-lg hover:scale-[1.01] border-2 border-transparent hover:border-gray-200/50'
                }`}
              >
                {activeTab === 'data' && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                    <div className="absolute top-0 left-0 w-1 h-full bg-white/30"></div>
                  </>
                )}
                <div className={`p-2.5 rounded-xl shadow-md transition-all duration-300 ${
                  activeTab === 'data' 
                    ? 'bg-white/25 ring-2 ring-white/30' 
                    : 'bg-gray-100 group-hover:bg-gradient-to-br group-hover:from-[#145142]/10 group-hover:to-[#1a6b58]/10'
                }`}>
                  <Settings size={22} className={activeTab === 'data' ? 'text-white drop-shadow-md' : 'text-[#145142]'} />
                </div>
                <span className="font-bold">Особисті дані</span>
              </button>
              
              {isAdmin && (
                <>
                  <div className="h-px bg-gradient-to-r from-transparent via-gray-300/50 to-transparent my-4"></div>
                  
                  <button 
                    onClick={onOpenAdmin}
                    className="group relative flex items-center gap-4 p-5 rounded-[20px] font-bold text-base bg-gradient-to-r from-pink-500/10 via-rose-500/10 to-pink-500/10 text-pink-600 hover:from-pink-500/20 hover:via-rose-500/20 hover:to-pink-500/20 transition-all duration-300 hover:shadow-xl hover:shadow-pink-500/20 hover:scale-[1.02] border-2 border-pink-200/50 hover:border-pink-300/70 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-pink-500/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-pink-500 via-rose-500 to-pink-600 shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Shield size={22} className="text-white drop-shadow-md" />
                    </div>
                    <span className="font-bold">Адмін-панель</span>
                  </button>
                </>
              )}

              <div className="h-px bg-gradient-to-r from-transparent via-gray-300/50 to-transparent my-4"></div>

              <button 
                onClick={handleLogout} 
                className="group relative flex items-center gap-4 p-5 rounded-[20px] font-bold text-base bg-gradient-to-r from-red-50 via-rose-50 to-red-50 text-red-600 hover:from-red-100 hover:via-rose-100 hover:to-red-100 transition-all duration-300 hover:shadow-xl hover:shadow-red-500/20 hover:scale-[1.02] border-2 border-red-200/50 hover:border-red-300/70 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-red-500 via-rose-500 to-red-600 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <LogOut size={22} className="text-white drop-shadow-md" />
                </div>
                <span className="font-bold">Вийти</span>
              </button>
            </nav>
          </div>
        </div>

        {/* ПРАВАЯ КОЛОНКА - КОНТЕНТ */}
        <div className="flex-1">
          <div className="bg-gradient-to-br from-white via-white to-[#f8faf9] rounded-[36px] p-8 md:p-12 shadow-2xl shadow-[#145142]/10 border-2 border-white/90 backdrop-blur-2xl min-h-[600px] relative overflow-hidden">
            {/* Декоративные элементы */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-[#145142]/8 via-[#1a6b58]/5 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-pulse-slow"></div>
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-[#1a6b58]/8 via-transparent to-transparent rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>
            {/* Световые акценты */}
            <div className="absolute top-20 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#145142]/10 to-transparent"></div>
            <div className="absolute top-0 left-20 w-px h-full bg-gradient-to-b from-transparent via-[#145142]/10 to-transparent"></div>
            <div className="relative z-10">
            {activeTab === 'history' && (
              <div className="animate-in fade-in">
                <h2 className="text-3xl font-bold text-[#194A38] mb-6">Історія замовлень</h2>
                {loading ? <div className="text-center py-20 text-gray-400">Завантаження...</div> : 
                 orders.length === 0 ? (
                  <div className="text-center py-20">
                    <Package size={64} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-xl text-gray-400 font-medium">Ви ще нічого не замовляли</p>
                    <button onClick={onBack} className="mt-4 text-[#145142] font-bold hover:underline">Перейти до меню</button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-6">
                    {orders.map((order, idx) => (
                      <div 
                        key={order.id} 
                        className="group relative bg-gradient-to-br from-white via-white to-gray-50/50 rounded-[28px] p-7 hover:shadow-2xl hover:shadow-[#145142]/10 transition-all duration-500 border-2 border-gray-100/50 hover:border-[#145142]/30 overflow-hidden transform hover:-translate-y-1"
                        style={{ animationDelay: `${idx * 100}ms` }}
                      >
                        {/* Декоративные градиенты */}
                        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-[#145142]/8 via-[#1a6b58]/5 to-transparent rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-[#1a6b58]/5 to-transparent rounded-full blur-2xl"></div>
                        <div className="absolute inset-0 bg-gradient-to-br from-[#145142]/0 via-transparent to-[#145142]/0 group-hover:from-[#145142]/5 group-hover:to-[#145142]/0 transition-all duration-500"></div>
                        
                        <div className="relative z-10">
                          <div className="flex justify-between items-start mb-6">
                            <div className="flex-1">
                              <div className="flex items-center gap-4 mb-3">
                                <div className="relative">
                                  <div className="w-14 h-14 bg-gradient-to-br from-[#145142] via-[#1a6b58] to-[#0f3d32] rounded-2xl flex items-center justify-center shadow-xl shadow-[#145142]/30 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                                    <Package size={24} className="text-white drop-shadow-md" />
                                  </div>
                                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-md animate-pulse"></div>
                                </div>
                                <div>
                                  <div className="text-2xl font-extrabold bg-gradient-to-r from-[#194A38] via-[#145142] to-[#1a6b58] bg-clip-text text-transparent mb-1">
                                    Замовлення #{order.id}
                                  </div>
                                  <div className="text-gray-600 text-sm flex items-center gap-2 font-medium">
                                    <Clock size={16} className="text-[#145142]" />
                                    {new Date(order.createdAt).toLocaleString('uk-UA')}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <span className={`px-5 py-2.5 rounded-full text-xs font-bold shadow-lg border-2 border-white/50 ${getStatusColor(order.status)} backdrop-blur-sm`}>
                              {getStatusText(order.status)}
                            </span>
                          </div>
                          
                          <div className="space-y-3 mb-6 bg-gradient-to-br from-white/80 to-gray-50/50 rounded-2xl p-5 border-2 border-gray-100/50 backdrop-blur-sm shadow-inner">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between items-center py-3 px-2 border-b border-gray-100/50 last:border-0 hover:bg-white/50 rounded-lg transition-colors group/item">
                                <span className="text-gray-800 font-semibold text-base group-hover/item:text-[#145142] transition-colors">
                                  {item.product.name_ru}
                                </span>
                                <div className="flex items-center gap-4">
                                  <span className="text-gray-500 text-sm font-medium bg-gray-100 px-2 py-1 rounded-md">x{item.quantity}</span>
                                  <span className="text-[#145142] font-bold text-lg min-w-[80px] text-right">
                                    {item.price * item.quantity} ₴
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          <div className="pt-5 border-t-2 border-gradient-to-r from-[#145142]/30 via-[#1a6b58]/20 to-transparent flex justify-between items-center bg-gradient-to-r from-[#145142]/5 to-transparent -mx-7 px-7 py-4 rounded-b-[28px]">
                            <span className="font-bold text-gray-700 text-lg flex items-center gap-2">
                              <span className="w-2 h-2 bg-[#145142] rounded-full"></span>
                              Загальна сума:
                            </span>
                            <span className="text-4xl font-extrabold bg-gradient-to-r from-[#194A38] via-[#145142] to-[#1a6b58] bg-clip-text text-transparent drop-shadow-sm">
                              {order.totalPrice} ₴
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {activeTab === 'favorites' && (
              <div className="animate-in fade-in">
                <div className="mb-10 relative">
                  <div className="absolute -left-4 top-0 w-1 h-full bg-gradient-to-b from-pink-500 via-rose-500 to-transparent rounded-full"></div>
                  <h2 className="text-5xl font-extrabold bg-gradient-to-r from-pink-600 via-rose-500 to-pink-600 bg-clip-text text-transparent mb-3 drop-shadow-sm">
                    Обране
                  </h2>
                  <p className="text-gray-600 font-medium flex items-center gap-2">
                    <Heart size={18} className="text-pink-500 fill-pink-500" />
                    Ваші улюблені страви
                  </p>
                </div>
                {favorites.length === 0 ? (
                  <div className="text-center py-24 px-4 relative">
                    <div className="relative inline-block mb-8">
                      <div className="absolute inset-0 bg-gradient-to-r from-pink-500/30 to-rose-500/30 rounded-full blur-3xl animate-pulse-slow"></div>
                      <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 to-rose-500/20 rounded-full blur-2xl -translate-x-4 -translate-y-4"></div>
                      <div className="relative bg-gradient-to-br from-pink-50 via-rose-50 to-pink-50 p-12 rounded-full shadow-2xl border-4 border-pink-200/50">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-pink-500/10 to-transparent"></div>
                        <Heart size={100} className="text-pink-300 fill-pink-300 relative z-10 drop-shadow-lg animate-pulse" />
                      </div>
                    </div>
                    <h3 className="text-3xl font-extrabold bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent mb-3">
                      Список порожній
                    </h3>
                    <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg">Додайте страви до обраного, натиснувши на сердечко</p>
                    <button 
                      onClick={onBack} 
                      className="group inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 text-white font-bold rounded-[24px] shadow-2xl shadow-pink-500/40 hover:shadow-pink-500/50 hover:scale-105 transition-all duration-300 relative overflow-hidden"
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
                      <Heart size={22} className="relative z-10 fill-white" />
                      <span className="relative z-10">Перейти до меню</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {favorites.map((item: any, idx: number) => (
                      <div 
                        key={item.id} 
                        className="group relative flex gap-5 p-6 bg-gradient-to-br from-white via-white to-pink-50/30 rounded-[28px] items-center hover:shadow-2xl hover:shadow-pink-500/10 transition-all duration-500 border-2 border-gray-100/50 hover:border-pink-200/50 overflow-hidden transform hover:-translate-y-1"
                        style={{ animationDelay: `${idx * 50}ms` }}
                      >
                        {/* Декоративные элементы */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-pink-500/10 to-rose-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-pink-400/5 to-transparent rounded-full blur-xl"></div>
                        
                        <div className="relative w-24 h-24 bg-gradient-to-br from-pink-100 via-rose-100 to-pink-200 rounded-2xl flex items-center justify-center text-4xl shadow-xl shadow-pink-500/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 border-2 border-pink-200/50">
                          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/50 to-transparent"></div>
                          <span className="relative z-10 drop-shadow-md">{item.emoji || '🍱'}</span>
                        </div>
                        <div className="flex-1 relative">
                          <div className="font-extrabold text-xl text-[#194A38] mb-2 group-hover:text-pink-600 transition-colors">
                            {item.name}
                          </div>
                          <div className="text-3xl font-extrabold bg-gradient-to-r from-pink-600 via-rose-500 to-pink-600 bg-clip-text text-transparent">
                            {item.price} ₴
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {activeTab === 'address' && (
              <div className="animate-in fade-in">
                <div className="mb-10 relative">
                  <div className="absolute -left-4 top-0 w-1 h-full bg-gradient-to-b from-blue-500 via-[#145142] to-transparent rounded-full"></div>
                  <h2 className="text-5xl font-extrabold bg-gradient-to-r from-[#194A38] via-[#145142] to-[#1a6b58] bg-clip-text text-transparent mb-3 drop-shadow-sm">
                    Мої адреси
                  </h2>
                  <p className="text-gray-600 font-medium flex items-center gap-2">
                    <MapPin size={18} className="text-[#145142]" />
                    Збережені адреси доставки
                  </p>
                </div>
                {user?.address ? (
                  <div className="relative p-8 bg-gradient-to-br from-white via-white to-blue-50/30 rounded-[28px] flex items-center gap-6 shadow-2xl shadow-[#145142]/10 border-2 border-gray-100/50 hover:border-[#145142]/30 transition-all duration-300 overflow-hidden group">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-[#145142]/10 to-transparent rounded-full blur-2xl"></div>
                    <div className="relative w-16 h-16 bg-gradient-to-br from-[#145142] via-[#1a6b58] to-[#0f3d32] rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                      <MapPin className="text-white" size={28} />
                    </div>
                    <span className="text-xl font-bold text-gray-800 relative z-10">{user.address}</span>
                  </div>
                ) : (
                  <div className="text-center py-24 px-4 relative">
                    <div className="relative inline-block mb-8">
                      <div className="absolute inset-0 bg-gradient-to-r from-[#145142]/30 to-[#1a6b58]/30 rounded-full blur-3xl animate-pulse-slow"></div>
                      <div className="absolute inset-0 bg-gradient-to-r from-[#145142]/20 to-[#1a6b58]/20 rounded-full blur-2xl -translate-x-4 -translate-y-4"></div>
                      <div className="relative bg-gradient-to-br from-gray-50 via-white to-gray-50 p-12 rounded-full shadow-2xl border-4 border-[#145142]/10">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#145142]/5 to-transparent"></div>
                        <MapPin size={100} className="text-gray-300 relative z-10 drop-shadow-lg" />
                      </div>
                    </div>
                    <h3 className="text-3xl font-extrabold bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent mb-3">
                      Адреси не збережені
                    </h3>
                    <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg">Додайте адресу доставки для швидкого замовлення</p>
                  </div>
                )}
              </div>
            )}
            {activeTab === 'data' && (
              <div className="animate-in fade-in">
                <div className="mb-10 relative">
                  <div className="absolute -left-4 top-0 w-1 h-full bg-gradient-to-b from-purple-500 via-[#145142] to-transparent rounded-full"></div>
                  <h2 className="text-5xl font-extrabold bg-gradient-to-r from-[#194A38] via-[#145142] to-[#1a6b58] bg-clip-text text-transparent mb-3 drop-shadow-sm">
                    Особисті дані
                  </h2>
                  <p className="text-gray-600 font-medium flex items-center gap-2">
                    <Settings size={18} className="text-[#145142]" />
                    Ваша контактна інформація
                  </p>
                </div>
                <div className="space-y-6 max-w-2xl">
                  <div className="group relative">
                    <label className="text-gray-700 text-sm font-bold ml-4 mb-3 block flex items-center gap-2">
                      <User size={16} className="text-[#145142]" />
                      Ім'я
                    </label>
                    <div className="relative w-full p-6 bg-gradient-to-br from-white via-white to-gray-50/50 rounded-[24px] font-bold text-lg text-gray-800 border-2 border-gray-100/50 shadow-lg group-hover:shadow-xl group-hover:border-[#145142]/30 transition-all duration-300 overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#145142]/5 to-transparent rounded-full blur-2xl"></div>
                      <span className="relative z-10">{user?.name || 'Не вказано'}</span>
                    </div>
                  </div>
                  <div className="group relative">
                    <label className="text-gray-700 text-sm font-bold ml-4 mb-3 block flex items-center gap-2">
                      <Phone size={16} className="text-[#145142]" />
                      Телефон
                    </label>
                    <div className="relative w-full p-6 bg-gradient-to-br from-white via-white to-gray-50/50 rounded-[24px] font-bold text-lg text-gray-800 border-2 border-gray-100/50 shadow-lg group-hover:shadow-xl group-hover:border-[#145142]/30 transition-all duration-300 overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#145142]/5 to-transparent rounded-full blur-2xl"></div>
                      <span className="relative z-10">{user?.phone || 'Не вказано'}</span>
                    </div>
                  </div>
                  <div className="group relative">
                    <label className="text-gray-700 text-sm font-bold ml-4 mb-3 block flex items-center gap-2">
                      <Mail size={16} className="text-[#145142]" />
                      Email
                    </label>
                    <div className="relative w-full p-6 bg-gradient-to-br from-white via-white to-gray-50/50 rounded-[24px] font-bold text-lg text-gray-800 border-2 border-gray-100/50 shadow-lg group-hover:shadow-xl group-hover:border-[#145142]/30 transition-all duration-300 overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#145142]/5 to-transparent rounded-full blur-2xl"></div>
                      <span className="relative z-10">{user?.email || 'Не вказано'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}