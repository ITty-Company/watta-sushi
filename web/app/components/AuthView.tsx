'use client'

import { useState } from 'react'
import { ArrowLeft, Mail, Lock, User, Check, Eye, EyeOff } from 'lucide-react'

interface AuthViewProps {
  onBack: () => void
  onLoginSuccess: () => void
}

export default function AuthView({ onBack, onLoginSuccess }: AuthViewProps) {
  const [isRegister, setIsRegister] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  // Данные формы
  const [formData, setFormData] = useState({
    name: '', // Имя нужно только при регистрации
    email: '',
    password: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Имитация входа
    // В реальном проекте тут был бы запрос к API для проверки пароля
    
    // Создаем объект пользователя
    const user = {
      id: Date.now().toString(),
      name: isRegister ? formData.name : (formData.email.split('@')[0]), // Если вход - берем имя из почты
      email: formData.email,
      isAdmin: formData.email.includes('admin'), // Хак для админа
      createdAt: new Date().toISOString()
    }

    // Сохраняем в LocalStorage
    localStorage.setItem('currentUser', JSON.stringify(user))

    // Сообщаем приложению, что юзер изменился
    window.dispatchEvent(new Event('userChanged'))

    // Переходим в профиль
    onLoginSuccess()
  }

  const Header = () => (
    <div className="fixed top-4 left-0 right-0 mx-auto w-[95%] max-w-[1800px] h-[80px] bg-white rounded-[20px] shadow-lg flex items-center justify-between px-6 z-50">
      <div className="flex items-center gap-2 cursor-pointer" onClick={onBack}>
        <img src="/logo.png" alt="Logo" className="h-10 w-10 object-contain" />
        <img src="/1.jpg" alt="Watta Sushi" className="h-6 w-auto object-contain" />
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#D9D9D9] font-sans flex flex-col items-center justify-center relative pt-20 pb-10">
      <Header />

      <div className="absolute top-28 left-4 md:left-10 z-40">
        <button 
          onClick={onBack}
          className="bg-white px-6 py-3 rounded-[15px] flex items-center gap-2 text-[#145142] font-bold shadow-sm hover:bg-gray-50 transition"
        >
          <ArrowLeft size={20} /> Назад
        </button>
      </div>

      <div className="w-full max-w-[500px] px-4">
        <div className="bg-white rounded-[30px] p-8 md:p-12 shadow-xl relative overflow-hidden">
          {/* Декор */}
          <div className="absolute top-0 left-0 w-full h-2 bg-[#145142]"></div>

          <h1 className="text-3xl font-bold text-black mb-2 text-center">
            {isRegister ? 'Регистрация' : 'Вход'}
          </h1>
          <p className="text-gray-400 text-center mb-8">
            {isRegister ? 'Создайте аккаунт для заказов' : 'Войдите с помощью почты и пароля'}
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            
            {/* Поле ИМЯ (Только при регистрации) */}
            {isRegister && (
              <div className="relative animate-in fade-in slide-in-from-top-2">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <User size={20} />
                </div>
                <input 
                  type="text" 
                  placeholder="Ваше имя"
                  required={isRegister}
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-[#F3F4F6] h-[60px] rounded-[15px] pl-12 pr-4 outline-none focus:ring-2 focus:ring-[#145142] transition text-lg"
                />
              </div>
            )}

            {/* Поле EMAIL */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Mail size={20} />
              </div>
              <input 
                type="email" 
                placeholder="Email"
                required
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full bg-[#F3F4F6] h-[60px] rounded-[15px] pl-12 pr-4 outline-none focus:ring-2 focus:ring-[#145142] transition text-lg"
              />
            </div>

            {/* Поле ПАРОЛЬ */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Lock size={20} />
              </div>
              <input 
                type={showPassword ? "text" : "password"}
                placeholder="Пароль"
                required
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                className="w-full bg-[#F3F4F6] h-[60px] rounded-[15px] pl-12 pr-12 outline-none focus:ring-2 focus:ring-[#145142] transition text-lg"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#145142]"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <button 
              type="submit" 
              className="w-full h-[70px] bg-[#145142] text-white rounded-[20px] font-bold text-xl mt-4 hover:bg-[#0f3d32] active:scale-[0.98] transition flex items-center justify-center gap-3 shadow-lg shadow-green-900/20"
            >
              {isRegister ? 'Создать аккаунт' : 'Войти'} <Check size={24} />
            </button>
          </form>

          {/* Переключатель */}
          <div className="mt-8 text-center">
            <button 
              onClick={() => setIsRegister(!isRegister)}
              className="text-gray-500 hover:text-[#145142] font-medium transition"
            >
              {isRegister ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}