'use client'

import React, { useState, useEffect } from 'react'
import { ArrowLeft, Mail, Lock, User, Check, Eye, EyeOff, Phone } from 'lucide-react'
// @ts-ignore
import LogoBackground from './LogoBackground'
import { useLanguage } from '../context/LanguageContext'

interface AuthViewProps {
  onBack: () => void
  onLoginSuccess: () => void
}

export default function AuthView({ onBack, onLoginSuccess }: AuthViewProps) {
  // @ts-ignore
  const { t } = useLanguage()
  const [isRegister, setIsRegister] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '', 
    phone: ''
  })

  // --- ЛОГИКА ВЕРИФИКАЦИИ ---
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')
  const [userId, setUserId] = useState<number | null>(null)
  // -------------------------

  // Блокировка скролла
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'hidden'
      document.documentElement.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
        document.documentElement.style.overflow = ''
      }
    }
  }, [])

  // 1. РЕГИСТРАЦИЯ (Этап 1: Отправка данных)
  // 1. РЕГИСТРАЦИЯ
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const { email, password, confirmPassword, name, phone } = formData

    if (password !== confirmPassword) {
      alert('Пароли не совпадают') // Упростили для читаемости
      return
    }
    
    setIsLoading(true)
    setError(null)
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, phone })
      })

      const data = await res.json()

      if (res.ok) {
        // УСПЕХ: Нам не нужен ID, мы будем подтверждать по телефону, который уже в formData
        setIsVerifying(true) 
      } else {
        alert(data.message || 'Ошибка регистрации')
      }
    } catch (err) {
      alert('Ошибка сети')
    } finally {
      setIsLoading(false)
    }
  }

  // 2. ВЕРИФИКАЦИЯ (ИСПРАВЛЕНО: отправляем phone вместо userId)
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.phone) {
        alert('Помилка: Телефон втрачено. Спробуйте ще раз.')
        setIsVerifying(false)
        return
    }

    setIsLoading(true)
    setError(null) // Очищаємо попередні помилки

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            phone: formData.phone,
            code: verificationCode 
        })
      })
      const data = await res.json()
      
      if (res.ok) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', data.token)
          localStorage.setItem('currentUser', JSON.stringify(data.user))
        }
        onLoginSuccess() 
      } else {
        alert(data.message || 'Невірний код')
        setVerificationCode('') // Очищаємо поле, щоб юзер міг ввести знову
      }
    } catch (err) {
      alert('Помилка перевірки коду')
      setVerificationCode('')
    } finally {
      setIsLoading(false) // Гарантовано знімаємо спінер
    }
  }

  // 3. ОБЫЧНЫЙ ВХОД (Email + Пароль)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, password: formData.password })
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.message || 'Ошибка входа')

      if (typeof window !== 'undefined') {
        localStorage.setItem('token', data.token)
        localStorage.setItem('currentUser', JSON.stringify(data.user))
      }
      onLoginSuccess()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    if (isRegister) {
      handleRegister(e)
    } else {
      handleLogin(e)
    }
  }
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Залишаємо тільки цифри
    let val = e.target.value.replace(/\D/g, '')
    
    // Якщо користувач починає вводити, додаємо 380, якщо його немає
    if (val.length > 0 && !val.startsWith('380')) {
        val = '380' + val;
    }
    
    // Обмежуємо довжину (380 + 9 цифр = 12 символів)
    if (val.length > 12) val = val.slice(0, 12)
    
    setFormData({ ...formData, phone: val ? `+${val}` : '' })
  }

  // --- UI: ЭКРАН ВВОДА КОДА ---
  if (isVerifying) {
    return (
      <div className="h-screen font-sans flex flex-col items-center justify-center relative overflow-hidden bg-gray-900">
        <LogoBackground />
        <div className="relative z-10 w-full px-4 flex justify-center">
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-300">
            <h2 className="text-2xl font-bold text-center mb-2 text-[#145142]">Подтверждение номера</h2>
            <p className="text-center text-gray-500 mb-6 text-sm">
                Мы отправили SMS с кодом на ваш номер.<br/>
                <span className="text-xs text-gray-400">(Dev: код в консоли сервера)</span>
            </p>
            <form onSubmit={handleVerify} className="flex flex-col gap-4">
                <input 
                type="text" 
                placeholder="0000" 
                value={verificationCode}
                onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '') // Только цифры
                    if (val.length <= 4) setVerificationCode(val)
                }}
                className="text-center text-4xl tracking-[0.5em] font-bold border-2 border-gray-200 rounded-xl p-4 focus:border-[#145142] focus:ring-4 focus:ring-[#145142]/10 outline-none transition-all text-[#145142]"
                required
                maxLength={4}
                autoFocus
                />
                <button 
                type="submit" 
                className="bg-[#145142] text-white font-bold py-4 rounded-xl hover:bg-[#0f3d32] transition-colors disabled:opacity-50 shadow-lg shadow-[#145142]/30 active:scale-[0.98]"
                disabled={isLoading || verificationCode.length < 4}
                >
                {isLoading ? 'Проверка...' : 'Подтвердить'}
                </button>
                <button 
                type="button" 
                onClick={() => setIsVerifying(false)} 
                className="text-sm text-gray-400 hover:text-gray-600 transition-colors mt-2"
                >
                Вернуться назад
                </button>
            </form>
            </div>
        </div>
      </div>
    )
  }

  // --- UI: ЭКРАН ВХОДА / РЕГИСТРАЦИИ ---
  return (
    <div className="h-screen font-sans flex flex-col items-center justify-center relative overflow-hidden" style={{ maxHeight: '100vh', height: '100vh' }}>
      <LogoBackground />
      <div className="relative z-10 w-full flex flex-col items-center justify-center h-full px-3 sm:px-4 md:px-6" style={{ maxHeight: '100vh', overflow: 'hidden' }}>
        
        {/* Кнопка назад */}
        <div className="absolute top-2 sm:top-4 left-2 sm:left-4 md:left-6 z-40 animate-[buttonSlideIn_0.5s_ease-out]">
          <button 
            onClick={onBack}
            className="bg-gradient-to-r from-[#0f3d32] via-[#145142] to-[#0f3d32] px-3 py-1.5 sm:px-4 sm:py-2 md:px-5 md:py-2.5 rounded-[10px] sm:rounded-[12px] flex items-center gap-1.5 sm:gap-2 text-white font-bold shadow-2xl transition-all duration-300 border border-white/10 backdrop-blur-sm group hover:border-white/30"
          >
            <ArrowLeft size={16} className="sm:w-[18px] sm:h-[18px]" /> 
            <span className="text-xs sm:text-sm">{t.auth.back}</span>
          </button>
        </div>

        <div className="w-full max-w-[90%] sm:max-w-[480px] flex-shrink-0">
          <div className="bg-gradient-to-br from-[#0f3d32] via-[#145142] to-[#1a6b58] rounded-[28px] p-5 sm:p-7 shadow-2xl relative overflow-hidden backdrop-blur-2xl border-2 border-white/30">
            
            <div className="relative z-10 w-full text-center mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                {isRegister ? t.auth.registerTitle : t.auth.loginTitle}
              </h1>
              <p className="text-white/90 text-sm sm:text-base">
                {isRegister ? t.auth.registerDescription : t.auth.loginDescription}
              </p>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-white p-3 rounded-xl mb-4 text-center text-sm font-medium backdrop-blur-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-3 relative z-10">
              
              {isRegister && (
                <>
                  {/* Имя */}
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                      <User size={18} className="text-white" />
                    </div>
                    <input 
                      type="text" 
                      placeholder={t.auth.name}
                      required
                      maxLength={50}
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-white/10 h-[56px] rounded-[30px] pl-16 pr-4 text-white placeholder-white/70 border-2 border-transparent focus:border-white/50 outline-none transition-all"
                    />
                  </div>
                  {/* Телефон (Обязательно для регистрации) */}
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                      <Phone size={18} className="text-white" />
                    </div>
                    <input 
                      type="tel" 
                      placeholder={t.auth.phone || "Телефон (+380...)"}
                      required
                      maxLength={13}
                      value={formData.phone}
                      onChange={handlePhoneChange}
                      className="w-full bg-white/10 h-[56px] rounded-[30px] pl-16 pr-4 text-white placeholder-white/70 border-2 border-transparent focus:border-white/50 outline-none transition-all"
                    />
                  </div>
                </>
              )}

              {/* Email */}
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <Mail size={18} className="text-white" />
                </div>
                <input 
                  type="email" 
                  placeholder={t.auth.email}
                  required
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-white/10 h-[56px] rounded-[30px] pl-16 pr-4 text-white placeholder-white/70 border-2 border-transparent focus:border-white/50 outline-none transition-all"
                />
              </div>

              {/* Пароль */}
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <Lock size={18} className="text-white" />
                </div>
                <input 
                  type={showPassword ? "text" : "password"}
                  placeholder={t.auth.password}
                  required
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  className="w-full bg-white/10 h-[56px] rounded-[30px] pl-16 pr-14 text-white placeholder-white/70 border-2 border-transparent focus:border-white/50 outline-none transition-all"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {/* Подтверждение пароля (Только для регистрации) */}
              {isRegister && (
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                    <Lock size={18} className="text-white" />
                  </div>
                  <input 
                    type="password"
                    placeholder="Подтвердите пароль"
                    required
                    value={formData.confirmPassword}
                    onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                    className="w-full bg-white/10 h-[56px] rounded-[30px] pl-16 pr-4 text-white placeholder-white/70 border-2 border-transparent focus:border-white/50 outline-none transition-all"
                  />
                </div>
              )}

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full h-[54px] bg-white text-[#0f3d32] rounded-[16px] font-bold text-lg mt-3 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-70"
              >
                {isLoading ? 'Загрузка...' : (isRegister ? t.auth.createAccount : t.auth.submit)}
                {!isLoading && <Check size={20} />}
              </button>
            </form>

            <div className="mt-5 text-center relative z-10">
              <button 
                onClick={() => { setIsRegister(!isRegister); setError(null); }}
                className="text-white/90 hover:text-white font-medium text-sm hover:underline transition-all"
              >
                {isRegister ? t.auth.haveAccount : t.auth.noAccount}
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}