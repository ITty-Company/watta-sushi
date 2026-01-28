// 'use client'

// import { useState } from 'react'
// import { ArrowLeft, Mail, Lock, User, Check, Eye, EyeOff } from 'lucide-react'

// interface AuthViewProps {
//   onBack: () => void
//   onLoginSuccess: () => void
// }

// export default function AuthView({ onBack, onLoginSuccess }: AuthViewProps) {
//   const [isRegister, setIsRegister] = useState(false)
//   const [showPassword, setShowPassword] = useState(false)
  
//   // Данные формы
//   const [formData, setFormData] = useState({
//     name: '', // Имя нужно только при регистрации
//     email: '',
//     password: ''
//   })

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault()

//     // Имитация входа
//     // В реальном проекте тут был бы запрос к API для проверки пароля
    
//     // Создаем объект пользователя
//     const user = {
//       id: Date.now().toString(),
//       name: isRegister ? formData.name : (formData.email.split('@')[0]), // Если вход - берем имя из почты
//       email: formData.email,
//       isAdmin: formData.email.includes('admin'), // Хак для админа
//       createdAt: new Date().toISOString()
//     }

//     // Сохраняем в LocalStorage
//     localStorage.setItem('currentUser', JSON.stringify(user))

//     // Сообщаем приложению, что юзер изменился
//     window.dispatchEvent(new Event('userChanged'))

//     // Переходим в профиль
//     onLoginSuccess()
//   }

//   const Header = () => (
//     <div className="fixed top-4 left-0 right-0 mx-auto w-[95%] max-w-[1800px] h-[80px] bg-white rounded-[20px] shadow-lg flex items-center justify-between px-6 z-50">
//       <div className="flex items-center gap-2 cursor-pointer" onClick={onBack}>
//         <img src="/logo.png" alt="Logo" className="h-10 w-10 object-contain" />
//         <img src="/1.jpg" alt="Watta Sushi" className="h-6 w-auto object-contain" />
//       </div>
//     </div>
//   )

//   return (
//     <div className="min-h-screen bg-[#D9D9D9] font-sans flex flex-col items-center justify-center relative pt-20 pb-10">
//       <Header />

//       <div className="absolute top-28 left-4 md:left-10 z-40">
//         <button 
//           onClick={onBack}
//           className="bg-white px-6 py-3 rounded-[15px] flex items-center gap-2 text-[#145142] font-bold shadow-sm hover:bg-gray-50 transition"
//         >
//           <ArrowLeft size={20} /> Назад
//         </button>
//       </div>

//       <div className="w-full max-w-[500px] px-4">
//         <div className="bg-white rounded-[30px] p-8 md:p-12 shadow-xl relative overflow-hidden">
//           {/* Декор */}
//           <div className="absolute top-0 left-0 w-full h-2 bg-[#145142]"></div>

//           <h1 className="text-3xl font-bold text-black mb-2 text-center">
//             {isRegister ? 'Регистрация' : 'Вход'}
//           </h1>
//           <p className="text-gray-400 text-center mb-8">
//             {isRegister ? 'Создайте аккаунт для заказов' : 'Войдите с помощью почты и пароля'}
//           </p>

//           <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            
//             {/* Поле ИМЯ (Только при регистрации) */}
//             {isRegister && (
//               <div className="relative animate-in fade-in slide-in-from-top-2">
//                 <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
//                   <User size={20} />
//                 </div>
//                 <input 
//                   type="text" 
//                   placeholder="Ваше имя"
//                   required={isRegister}
//                   value={formData.name}
//                   onChange={e => setFormData({...formData, name: e.target.value})}
//                   className="w-full bg-[#F3F4F6] h-[60px] rounded-[15px] pl-12 pr-4 outline-none focus:ring-2 focus:ring-[#145142] transition text-lg"
//                 />
//               </div>
//             )}

//             {/* Поле EMAIL */}
//             <div className="relative">
//               <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
//                 <Mail size={20} />
//               </div>
//               <input 
//                 type="email" 
//                 placeholder="Email"
//                 required
//                 value={formData.email}
//                 onChange={e => setFormData({...formData, email: e.target.value})}
//                 className="w-full bg-[#F3F4F6] h-[60px] rounded-[15px] pl-12 pr-4 outline-none focus:ring-2 focus:ring-[#145142] transition text-lg"
//               />
//             </div>

//             {/* Поле ПАРОЛЬ */}
//             <div className="relative">
//               <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
//                 <Lock size={20} />
//               </div>
//               <input 
//                 type={showPassword ? "text" : "password"}
//                 placeholder="Пароль"
//                 required
//                 value={formData.password}
//                 onChange={e => setFormData({...formData, password: e.target.value})}
//                 className="w-full bg-[#F3F4F6] h-[60px] rounded-[15px] pl-12 pr-12 outline-none focus:ring-2 focus:ring-[#145142] transition text-lg"
//               />
//               <button 
//                 type="button"
//                 onClick={() => setShowPassword(!showPassword)}
//                 className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#145142]"
//               >
//                 {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
//               </button>
//             </div>

//             <button 
//               type="submit" 
//               className="w-full h-[70px] bg-[#145142] text-white rounded-[20px] font-bold text-xl mt-4 hover:bg-[#0f3d32] active:scale-[0.98] transition flex items-center justify-center gap-3 shadow-lg shadow-green-900/20"
//             >
//               {isRegister ? 'Создать аккаунт' : 'Войти'} <Check size={24} />
//             </button>
//           </form>

//           {/* Переключатель */}
//           <div className="mt-8 text-center">
//             <button 
//               onClick={() => setIsRegister(!isRegister)}
//               className="text-gray-500 hover:text-[#145142] font-medium transition"
//             >
//               {isRegister ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
//             </button>
//           </div>

//         </div>
//       </div>
//     </div>
//   )
// }


'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Mail, Lock, User, Check, Eye, EyeOff, Phone } from 'lucide-react'
import LogoBackground from './LogoBackground'
import { useLanguage } from '../context/LanguageContext'
import { getApiUrl } from '../../lib/utils'

interface AuthViewProps {
  onBack: () => void
  onLoginSuccess: () => void
}

export default function AuthView({ onBack, onLoginSuccess }: AuthViewProps) {
  const { t } = useLanguage()
  const [isRegister, setIsRegister] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Блокируем прокрутку страницы
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
    }
  }, [])
  
  // Данные формы
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '' // Добавил телефон, так как он нужен для регистрации
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // 1. Выбираем URL: Вход или Регистрация
      const url = getApiUrl(isRegister ? '/api/auth/register' : '/api/auth/login')
      
      // 2. Готовим данные для отправки
      const body = isRegister 
        ? { email: formData.email, password: formData.password, name: formData.name, phone: formData.phone }
        : { email: formData.email, password: formData.password }

      // 3. Минимальное время загрузки 2 секунды
      const minLoadingTime = new Promise(resolve => setTimeout(resolve, 2000))

      // 4. Отправляем запрос на сервер с таймаутом
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // Максимум 15 секунд

      let response: Response | undefined
      let data: any

      try {
        const fetchPromise = fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: controller.signal,
        })

        // Ждем завершения обоих промисов (минимум 2 секунды + запрос)
        const results = await Promise.all([fetchPromise, minLoadingTime])
        response = results[0]
        clearTimeout(timeoutId)
        
        if (!response) {
          throw new Error(t.auth.errors.timeout)
        }
        
        // Пытаемся распарсить JSON, даже если статус не OK
        try {
          data = await response.json()
        } catch (parseError) {
          // Если не удалось распарсить JSON, создаем объект с сообщением об ошибке
          data = { message: response.statusText || t.auth.errors.generic }
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId)
        
        // Если произошла ошибка сети или таймаут
        if (fetchError.name === 'AbortError' || fetchError.message.includes('fetch') || fetchError.message.includes('network') || !response) {
          throw new Error(t.auth.errors.timeout)
        }
        throw fetchError
      }

      // 5. Если ошибка - показываем её
      if (!response || !response.ok) {
        // Преобразуем технические ошибки в понятные сообщения
        let errorMessage = data?.message || response.statusText || t.auth.errors.generic
        
        // Обработка различных типов ошибок с переводами
        if (errorMessage.includes('pattern') || errorMessage.includes('validation') || errorMessage.includes('format')) {
          errorMessage = t.auth.errors.pattern
        } else if (errorMessage.includes('email') || errorMessage.includes('Email') || errorMessage.includes('email')) {
          if (errorMessage.includes('уже') || errorMessage.includes('занят') || errorMessage.includes('already') || errorMessage.includes('exists')) {
            errorMessage = t.auth.errors.userExists
          } else {
            errorMessage = t.auth.errors.emailInvalid
          }
        } else if (errorMessage.includes('password') || errorMessage.includes('Password') || errorMessage.includes('пароль') || errorMessage.includes('Пароль')) {
          errorMessage = t.auth.errors.passwordMin
        } else if (errorMessage.includes('phone') || errorMessage.includes('Phone') || errorMessage.includes('телефон') || errorMessage.includes('Телефон')) {
          errorMessage = t.auth.errors.phoneInvalid
        } else if (errorMessage.includes('exists') || errorMessage.includes('уже') || errorMessage.includes('already') || errorMessage.includes('занят')) {
          errorMessage = t.auth.errors.userExists
        } else if (errorMessage.includes('not found') || errorMessage.includes('не найден') || errorMessage.includes('niet gevonden')) {
          errorMessage = t.auth.errors.userNotFound
        } else if (errorMessage.includes('invalid') || errorMessage.includes('неверный') || errorMessage.includes('ongeldig') || errorMessage.includes('Неверный')) {
          errorMessage = t.auth.errors.invalidCredentials
        } else if (errorMessage.includes('required') || errorMessage.includes('обязательно') || errorMessage.includes('обязательны') || errorMessage.includes('verplicht')) {
          errorMessage = t.auth.errors.required
        } else if (errorMessage.includes('регистрации') || errorMessage.includes('registration')) {
          // Если это общая ошибка регистрации, оставляем как есть или показываем общую ошибку
          errorMessage = t.auth.errors.generic
        }
        
        throw new Error(errorMessage)
      }

      // 5. УСПЕХ: Сохраняем токен и пользователя
      // Сервер возвращает { token: "...", user: { ... } }
      localStorage.setItem('token', data.token) // Сохраняем пропуск
      localStorage.setItem('currentUser', JSON.stringify(data.user)) // Сохраняем инфо
      localStorage.setItem('userId', data.user.id) // ID для заказов

      // 6. Сообщаем приложению
      window.dispatchEvent(new Event('userChanged'))
      onLoginSuccess()

    } catch (err: any) {
      // Все ошибки уже обработаны выше, просто показываем сообщение
      setError(err.message || t.auth.errors.generic)
    } finally {
      setIsLoading(false)
    }
  }


  return (
    <div className="h-screen font-sans flex flex-col items-center justify-center relative overflow-hidden" style={{ maxHeight: '100vh', height: '100vh' }}>
      <LogoBackground />
      <div className="relative z-10 w-full flex flex-col items-center justify-center h-full px-3 sm:px-4 md:px-6" style={{ maxHeight: '100vh', overflow: 'hidden' }}>
        <div className="absolute top-2 sm:top-4 left-2 sm:left-4 md:left-6 z-40 animate-[buttonSlideIn_0.5s_ease-out]">
        <button 
          onClick={onBack}
          className="bg-gradient-to-r from-[#0f3d32] via-[#145142] to-[#0f3d32] px-3 py-1.5 sm:px-4 sm:py-2 md:px-5 md:py-2.5 rounded-[10px] sm:rounded-[12px] flex items-center gap-1.5 sm:gap-2 text-white font-bold shadow-2xl shadow-[#0f3d32]/50 hover:shadow-[#0f3d32]/70 hover:scale-110 active:scale-95 transition-all duration-300 border border-white/10 backdrop-blur-sm relative overflow-hidden group hover:border-white/30"
        >
          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
          <ArrowLeft size={16} className="sm:w-[18px] sm:h-[18px] relative z-10 drop-shadow-lg group-hover:translate-x-[-2px] transition-transform duration-300" /> 
          <span className="relative z-10 text-xs sm:text-sm group-hover:tracking-wider transition-all duration-300">{t.auth.back}</span>
        </button>
      </div>

      <div className="w-full max-w-[90%] sm:max-w-[480px] md:max-w-[500px] lg:max-w-[520px] flex-shrink-0">
        <div className="bg-gradient-to-br from-[#0f3d32] via-[#145142] to-[#1a6b58] rounded-[28px] sm:rounded-[32px] p-5 sm:p-7 md:p-9 shadow-[0_25px_80px_-10px_rgba(15,61,50,0.9),0_0_0_1px_rgba(255,255,255,0.1)] relative overflow-hidden backdrop-blur-2xl border-2 border-white/30" style={{ maxHeight: 'calc(100vh - 40px)' }}>
          {/* Декор - градиентная полоса */}
          <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
          
          {/* Декоративные элементы */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-white/10 via-white/5 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-56 h-56 bg-gradient-to-tr from-white/8 via-white/3 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-gradient-to-r from-white/3 to-transparent rounded-full blur-3xl"></div>
          
          {/* Дополнительные световые эффекты */}
          <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
          <div className="absolute bottom-1/4 left-1/4 w-28 h-28 bg-white/4 rounded-full blur-2xl"></div>
          
          {/* Блики на границах */}
          <div className="absolute inset-0 rounded-[28px] sm:rounded-[32px] bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none"></div>

          <div className="relative z-10 w-full">
            <h1 className="text-2xl sm:text-3xl md:text-3.5xl font-bold text-white mb-1 sm:mb-1.5 text-center drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)] tracking-tight animate-[titleSlideIn_0.8s_ease-out,titleGlow_3s_ease-in-out_infinite] hover:scale-110 transition-all duration-300 cursor-default mx-auto" style={{ width: 'fit-content', marginLeft: 'auto', marginRight: 'auto' }}>
              {isRegister ? t.auth.registerTitle : t.auth.loginTitle}
            </h1>
            <p className="text-white/95 text-center mb-4 sm:mb-5 md:mb-6 font-medium text-sm sm:text-base drop-shadow-[0_2px_10px_rgba(0,0,0,0.3)] px-2 animate-[textFadeIn_1s_ease-out] hover:text-white hover:scale-105 transition-all duration-300">
              {isRegister ? t.auth.registerDescription : t.auth.loginDescription}
            </p>
          </div>

          {/* Сообщение об ошибке */}
          {error && (
            <div className="bg-gradient-to-r from-red-900/95 via-red-800/95 to-red-900/95 border-2 border-red-500/80 text-white p-4 sm:p-5 rounded-xl sm:rounded-2xl mb-3 sm:mb-4 text-center text-sm sm:text-base font-bold shadow-[0_10px_40px_rgba(220,38,38,0.6),0_0_20px_rgba(220,38,38,0.4),inset_0_1px_0_rgba(255,255,255,0.2)] animate-[errorSlideIn_0.5s_ease-out,errorPulse_2s_ease-in-out_infinite] backdrop-blur-md relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 via-transparent to-red-600/20 animate-[shimmer_2s_ease-in-out_infinite]"></div>
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
              <div className="relative z-10 flex items-center justify-center gap-2">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 animate-[iconBounce_0.6s_ease-out]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:gap-4 relative z-10" style={{ overflow: 'visible' }}>
            
            {/* Поля только для РЕГИСТРАЦИИ */}
            {isRegister && (
              <>
                <div className="relative animate-in fade-in slide-in-from-top-2 group">
                  <div className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-10">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gray-200/90 flex items-center justify-center border-2 border-white/90 shadow-[inset_0_1px_2px_rgba(0,0,0,0.1),0_1px_2px_rgba(255,255,255,0.5),0_0_15px_rgba(255,255,255,0.6),0_0_30px_rgba(255,255,255,0.4)] group-hover:border-white group-hover:shadow-[inset_0_1px_2px_rgba(0,0,0,0.1),0_1px_2px_rgba(255,255,255,0.7),0_0_20px_rgba(255,255,255,0.8),0_0_40px_rgba(255,255,255,0.5)] transition-all duration-300">
                      <User size={18} className="sm:w-[20px] sm:h-[20px] text-[#145142]" />
                    </div>
                  </div>
                  <input 
                    type="text" 
                    placeholder={t.auth.name}
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-[#2D5C57] h-[56px] sm:h-[58px] md:h-[60px] rounded-[30px] pl-14 sm:pl-16 pr-4 outline-none focus:outline-none transition-all duration-300 text-sm sm:text-base border-2 border-white/90 hover:border-white focus:border-white focus:shadow-[0_0_20px_rgba(255,255,255,0.8),0_0_40px_rgba(255,255,255,0.5),inset_0_0_0_1px_rgba(255,255,255,0.3)] text-white placeholder-white/90 font-medium shadow-[inset_0_1px_2px_rgba(0,0,0,0.2),0_0_10px_rgba(255,255,255,0.3)]"
                  />
                </div>
                <div className="relative animate-in fade-in slide-in-from-top-2 group">
                  <div className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-10">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gray-200/90 flex items-center justify-center border-2 border-white/90 shadow-[inset_0_1px_2px_rgba(0,0,0,0.1),0_1px_2px_rgba(255,255,255,0.5),0_0_15px_rgba(255,255,255,0.6),0_0_30px_rgba(255,255,255,0.4)] group-hover:border-white group-hover:shadow-[inset_0_1px_2px_rgba(0,0,0,0.1),0_1px_2px_rgba(255,255,255,0.7),0_0_20px_rgba(255,255,255,0.8),0_0_40px_rgba(255,255,255,0.5)] transition-all duration-300">
                      <Phone size={18} className="sm:w-[20px] sm:h-[20px] text-[#145142]" />
                    </div>
                  </div>
                  <input 
                    type="tel" 
                    placeholder={t.auth.phone}
                    required
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="w-full bg-[#2D5C57] h-[56px] sm:h-[58px] md:h-[60px] rounded-[30px] pl-14 sm:pl-16 pr-4 outline-none focus:outline-none transition-all duration-300 text-sm sm:text-base border-2 border-white/90 hover:border-white focus:border-white focus:shadow-[0_0_20px_rgba(255,255,255,0.8),0_0_40px_rgba(255,255,255,0.5),inset_0_0_0_1px_rgba(255,255,255,0.3)] text-white placeholder-white/90 font-medium shadow-[inset_0_1px_2px_rgba(0,0,0,0.2),0_0_10px_rgba(255,255,255,0.3)]"
                  />
                </div>
              </>
            )}

            {/* EMAIL */}
            <div className="relative group">
              <div className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-10">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gray-200/90 flex items-center justify-center border-2 border-white/90 shadow-[inset_0_1px_2px_rgba(0,0,0,0.1),0_1px_2px_rgba(255,255,255,0.5),0_0_15px_rgba(255,255,255,0.6),0_0_30px_rgba(255,255,255,0.4)] group-hover:border-white group-hover:shadow-[inset_0_1px_2px_rgba(0,0,0,0.1),0_1px_2px_rgba(255,255,255,0.7),0_0_20px_rgba(255,255,255,0.8),0_0_40px_rgba(255,255,255,0.5)] transition-all duration-300">
                  <Mail size={18} className="sm:w-[20px] sm:h-[20px] text-[#145142]" />
                </div>
              </div>
              <input 
                type="email" 
                placeholder={t.auth.email}
                required
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full bg-[#2D5C57] h-[56px] sm:h-[58px] md:h-[60px] rounded-[30px] pl-14 sm:pl-16 pr-4 outline-none focus:outline-none transition-all duration-300 text-sm sm:text-base border-2 border-white/90 hover:border-white focus:border-white focus:shadow-[0_0_20px_rgba(255,255,255,0.8),0_0_40px_rgba(255,255,255,0.5),inset_0_0_0_1px_rgba(255,255,255,0.3)] text-white placeholder-white/90 font-medium shadow-[inset_0_1px_2px_rgba(0,0,0,0.2),0_0_10px_rgba(255,255,255,0.3)]"
              />
            </div>

            {/* ПАРОЛЬ */}
            <div className="relative group">
              <div className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-10">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gray-200/90 flex items-center justify-center border-2 border-white/90 shadow-[inset_0_1px_2px_rgba(0,0,0,0.1),0_1px_2px_rgba(255,255,255,0.5),0_0_15px_rgba(255,255,255,0.6),0_0_30px_rgba(255,255,255,0.4)] group-hover:border-white group-hover:shadow-[inset_0_1px_2px_rgba(0,0,0,0.1),0_1px_2px_rgba(255,255,255,0.7),0_0_20px_rgba(255,255,255,0.8),0_0_40px_rgba(255,255,255,0.5)] transition-all duration-300">
                  <Lock size={18} className="sm:w-[20px] sm:h-[20px] text-[#145142]" />
                </div>
              </div>
              <input 
                type={showPassword ? "text" : "password"}
                placeholder={t.auth.password}
                required
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                className="w-full bg-[#2D5C57] h-[56px] sm:h-[58px] md:h-[60px] rounded-[30px] pl-14 sm:pl-16 pr-14 sm:pr-16 outline-none focus:outline-none transition-all duration-300 text-sm sm:text-base border-2 border-white/90 hover:border-white focus:border-white focus:shadow-[0_0_20px_rgba(255,255,255,0.8),0_0_40px_rgba(255,255,255,0.5),inset_0_0_0_1px_rgba(255,255,255,0.3)] text-white placeholder-white/90 font-medium shadow-[inset_0_1px_2px_rgba(0,0,0,0.2),0_0_10px_rgba(255,255,255,0.3)]"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-10 text-gray-300 hover:text-white transition-colors duration-300"
              >
                {showPassword ? <EyeOff size={18} className="sm:w-[20px] sm:h-[20px]" /> : <Eye size={18} className="sm:w-[20px] sm:h-[20px]" />}
              </button>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full h-[50px] sm:h-[54px] md:h-[58px] bg-white text-[#0f3d32] rounded-[14px] sm:rounded-[16px] font-bold text-base sm:text-lg mt-2 sm:mt-3 active:scale-[0.96] transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.4)] hover:shadow-[0_20px_60px_-10px_rgba(0,0,0,0.6)] hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed relative overflow-visible group border-2 border-white/50 hover:border-white/80 animate-[buttonPulse_2s_ease-in-out_infinite]"
              style={{ zIndex: 10001 }}
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-[#0f3d32]/15 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
              <span className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              <span className="relative z-[10002] flex items-center justify-center gap-2 sm:gap-3 w-full">
                {isLoading ? (
                  <div className="relative flex flex-col items-center justify-center w-full" style={{ zIndex: 9999, position: 'relative', marginTop: '36px', marginLeft: '36px' }}>
                    <div className="running-hamster-container" aria-label="Hamster running back and forth" role="img" style={{ fontSize: '10px', width: '100px', height: '50px', zIndex: 9999, position: 'relative' }}>
                      {/* Следы от лапок */}
                      <div className="footprint footprint-1"></div>
                      <div className="footprint footprint-2"></div>
                      <div className="footprint footprint-3"></div>
                      <div className="footprint footprint-4"></div>
                      
                      <div className="hamster-running hamster-running-enhanced">
                        <div className="hamster-running__body hamster-running__body-enhanced">
                          <div className="hamster-running__head hamster-running__head-enhanced">
                            <div className="hamster-running__ear hamster-running__ear-enhanced"></div>
                            <div className="hamster-running__eye hamster-running__eye-enhanced"></div>
                            <div className="hamster-running__nose hamster-running__nose-enhanced"></div>
                          </div>
                          <div className="hamster-running__limb hamster-running__limb--fr hamster-running__limb-enhanced"></div>
                          <div className="hamster-running__limb hamster-running__limb--fl hamster-running__limb-enhanced"></div>
                          <div className="hamster-running__limb hamster-running__limb--br hamster-running__limb-enhanced"></div>
                          <div className="hamster-running__limb hamster-running__limb--bl hamster-running__limb-enhanced"></div>
                          <div className="hamster-running__tail hamster-running__tail-enhanced"></div>
                        </div>
                      </div>
                    </div>
                    <div className="loading-text-enhanced" style={{ marginTop: '10px', fontSize: '14px' }}>
                      <span className="loading-dot" style={{ fontSize: '20px' }}>.</span>
                      <span className="loading-dot" style={{ fontSize: '20px' }}>.</span>
                      <span className="loading-dot" style={{ fontSize: '20px' }}>.</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <span className="text-sm sm:text-base md:text-lg group-hover:tracking-wide transition-all duration-300">{isRegister ? t.auth.createAccount : t.auth.submit}</span>
                    <Check size={20} className="sm:w-6 sm:h-6 drop-shadow-lg group-hover:scale-125 group-hover:rotate-12 transition-all duration-300" />
                  </>
                )}
              </span>
            </button>
          </form>

          {/* Переключатель */}
          <div className="mt-4 sm:mt-5 text-center relative z-10 px-2 animate-[textFadeIn_1s_ease-out]">
            <button 
              onClick={() => { setIsRegister(!isRegister); setError(null); }}
              className="text-white/90 hover:text-white font-semibold transition-all duration-300 hover:scale-110 active:scale-95 px-3 py-1.5 sm:px-4 sm:py-2 md:px-5 md:py-2 rounded-md sm:rounded-lg hover:bg-white/20 border border-white/20 hover:border-white/50 backdrop-blur-sm shadow-lg hover:shadow-2xl text-xs sm:text-sm w-full sm:w-auto hover:tracking-wide group relative overflow-hidden"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500"></span>
              <span className="relative z-10">{isRegister ? t.auth.haveAccount : t.auth.noAccount}</span>
            </button>
          </div>

        </div>
        </div>
      </div>
    </div>
  )
}