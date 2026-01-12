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
  MapPin, Clock, Settings, LogOut, Package, Shield
} from 'lucide-react'

// --- ТИПЫ ДАННЫХ ---
interface OrderItem {
  id: number
  quantity: number
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

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab)
  }, [initialTab])

  // --- ЗАГРУЗКА ДАННЫХ ---
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('currentUser')
      if (savedUser) {
        try { setUser(JSON.parse(savedUser)) } catch (e) {}
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
    <div className="fixed top-4 left-0 right-0 w-[95%] max-w-[1800px] h-[80px] mx-auto bg-white rounded-[20px] shadow-lg flex items-center justify-between px-6 z-[1000]">
      <div className="flex items-center gap-2 cursor-pointer" onClick={onBack}>
        <img src="/logo.png" alt="Logo" className="h-10 w-10 object-contain" />
        <img src="/1.jpg" alt="Watta Sushi" className="h-6 w-auto object-contain" />
      </div>

      <div className="flex items-center gap-3 md:gap-6 text-gray-700">
        <button onClick={onOpenPhone} className="hover:bg-gray-100 p-2 rounded-full transition"><Phone size={24} /></button>
        <button onClick={onOpenNotifications} className="hover:bg-gray-100 p-2 rounded-full transition"><Bell size={24} /></button>
        <button onClick={() => setActiveTab('favorites')} className={`hover:bg-gray-100 p-2 rounded-full transition ${activeTab === 'favorites' ? 'text-[#ec4899]' : ''}`}><Heart size={24} /></button>
        <button onClick={onOpenCart} className="hover:bg-gray-100 p-2 rounded-full transition"><ShoppingBag size={24} /></button>
        <button className="hover:bg-gray-100 p-2 rounded-full text-[#145142]"><User size={24} /></button>
        <button onClick={onMenuClick} className="hover:bg-gray-100 p-2 rounded-full transition"><Menu size={24} /></button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#D9D9D9] font-sans pt-[120px] pb-20 overflow-x-hidden">
      <Header />

      <div className="max-w-[1600px] mx-auto px-4 flex flex-col lg:flex-row gap-8">
        
        {/* ЛЕВАЯ КОЛОНКА - МЕНЮ */}
        <div className="w-full lg:w-[350px] shrink-0">
          <div className="bg-white rounded-[30px] p-6 shadow-sm sticky top-[120px]">
            <div className="flex flex-col items-center mb-8">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
                <User size={48} />
              </div>
              <h2 className="text-2xl font-bold text-[#194A38]">{user?.name || 'Гість'}</h2>
              <p className="text-gray-500">{user?.phone || ''}</p>
            </div>

            <nav className="flex flex-col gap-2">
              <button onClick={() => setActiveTab('history')} className={`flex items-center gap-4 p-4 rounded-[15px] font-bold text-lg transition ${activeTab === 'history' ? 'bg-[#145142] text-white' : 'hover:bg-gray-50 text-gray-700'}`}>
                <Clock size={24} /> Історія замовлень
              </button>
              <button onClick={() => setActiveTab('address')} className={`flex items-center gap-4 p-4 rounded-[15px] font-bold text-lg transition ${activeTab === 'address' ? 'bg-[#145142] text-white' : 'hover:bg-gray-50 text-gray-700'}`}>
                <MapPin size={24} /> Адреси доставки
              </button>
              <button onClick={() => setActiveTab('favorites')} className={`flex items-center gap-4 p-4 rounded-[15px] font-bold text-lg transition ${activeTab === 'favorites' ? 'bg-[#145142] text-white' : 'hover:bg-gray-50 text-gray-700'}`}>
                <Heart size={24} /> Обране
              </button>
              <button onClick={() => setActiveTab('data')} className={`flex items-center gap-4 p-4 rounded-[15px] font-bold text-lg transition ${activeTab === 'data' ? 'bg-[#145142] text-white' : 'hover:bg-gray-50 text-gray-700'}`}>
                <Settings size={24} /> Особисті дані
              </button>
              
              <div className="h-px bg-gray-200 my-2"></div>
              
              <button 
                onClick={onOpenAdmin}
                className="flex items-center gap-4 p-4 rounded-[15px] font-bold text-lg text-pink-500 hover:bg-pink-50 transition"
              >
                <Shield size={24} /> Адмін-панель
              </button>

              <button onClick={handleLogout} className="flex items-center gap-4 p-4 rounded-[15px] font-bold text-lg text-red-500 hover:bg-red-50 transition">
                <LogOut size={24} /> Вийти
              </button>
            </nav>
          </div>
        </div>

        {/* ПРАВАЯ КОЛОНКА - КОНТЕНТ */}
        <div className="flex-1">
          <div className="bg-white rounded-[30px] p-8 shadow-sm min-h-[500px]">
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
                    {orders.map(order => (
                      <div key={order.id} className="border border-gray-100 rounded-[20px] p-6 hover:shadow-md transition bg-gray-50">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <div className="text-lg font-bold text-[#194A38]">Замовлення #{order.id}</div>
                            <div className="text-gray-500 text-sm">{new Date(order.createdAt).toLocaleString('uk-UA')}</div>
                          </div>
                          <span className={`px-4 py-1 rounded-full text-sm font-bold ${getStatusColor(order.status)}`}>{getStatusText(order.status)}</span>
                        </div>
                        <div className="space-y-2 mb-4">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-gray-700">
                              <span>{item.product.name_ru} <span className="text-gray-400">x{item.quantity}</span></span>
                            </div>
                          ))}
                        </div>
                        <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
                          <span className="font-medium text-gray-500">Сума:</span>
                          <span className="text-2xl font-bold text-[#194A38]">{order.totalPrice} ₴</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {activeTab === 'favorites' && (
              <div className="animate-in fade-in">
                <h2 className="text-3xl font-bold text-[#194A38] mb-6">Обране</h2>
                {favorites.length === 0 ? <div className="text-center py-20 text-gray-400 font-medium">Список порожній</div> : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {favorites.map((item: any) => (
                      <div key={item.id} className="flex gap-4 p-4 bg-gray-50 rounded-[20px] items-center">
                        <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center text-2xl">{item.emoji || '🍱'}</div>
                        <div>
                          <div className="font-bold text-[#194A38]">{item.name}</div>
                          <div className="text-[#145142] font-bold">{item.price} ₴</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {activeTab === 'address' && (
              <div className="animate-in fade-in">
                <h2 className="text-3xl font-bold text-[#194A38] mb-6">Мої адреси</h2>
                {user?.address ? <div className="p-4 bg-gray-50 rounded-[20px] flex items-center gap-4"><MapPin className="text-[#145142]" /><span className="text-lg font-medium">{user.address}</span></div> : <div className="text-center py-20 text-gray-400 font-medium">Адреси не збережені</div>}
              </div>
            )}
            {activeTab === 'data' && (
              <div className="animate-in fade-in">
                <h2 className="text-3xl font-bold text-[#194A38] mb-6">Особисті дані</h2>
                <div className="space-y-4 max-w-md">
                  <div><label className="text-gray-500 text-sm ml-2">Ім'я</label><div className="w-full p-4 bg-gray-50 rounded-[15px] font-medium">{user?.name}</div></div>
                  <div><label className="text-gray-500 text-sm ml-2">Телефон</label><div className="w-full p-4 bg-gray-50 rounded-[15px] font-medium">{user?.phone}</div></div>
                  <div><label className="text-gray-500 text-sm ml-2">Email</label><div className="w-full p-4 bg-gray-50 rounded-[15px] font-medium">{user?.email}</div></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}