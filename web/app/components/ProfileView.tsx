'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

interface User {
  id: string
  name: string
  email: string
  phone: string
  address: string
  isAdmin: boolean
  createdAt: string
}

interface ProfileViewProps {
  onSwitchTab?: (tab: number) => void
}

export default function ProfileView({ onSwitchTab }: ProfileViewProps = {}) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [showRegister, setShowRegister] = useState(false) // Переключение между входом и регистрацией
  
  // Форма входа
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  
  // Форма регистрации
  const [registerName, setRegisterName] = useState('')
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPhone, setRegisterPhone] = useState('')
  const [registerAddress, setRegisterAddress] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('')
  
  // Загрузка пользователя при монтировании
  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedUser = localStorage.getItem('currentUser')
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser)
          setUser(parsed)
          setIsLoggedIn(true)
        } catch (e) {
          console.error('Error loading user:', e)
        }
      }
    }
  }, [])
  
  // Сохранение пользователя в localStorage при изменении
  useEffect(() => {
    if (user && typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('currentUser', JSON.stringify(user))
      // Обновляем событие для других компонентов
      window.dispatchEvent(new Event('userChanged'))
    }
  }, [user])
  
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (typeof window === 'undefined' || !window.localStorage) return
    
    // Получаем всех пользователей из localStorage
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]')
    
    // Ищем пользователя по email и паролю
    const foundUser = allUsers.find((u: User & { password: string }) => 
      u.email === loginEmail && u.password === loginPassword
    )
    
    if (foundUser) {
      const { password, ...userWithoutPassword } = foundUser
      setUser(userWithoutPassword)
      setIsLoggedIn(true)
      setShowRegister(false)
      setLoginEmail('')
      setLoginPassword('')
    } else {
      alert('Невірний email або пароль. Якщо у вас немає акаунту, натисніть "Зареєструватися"')
    }
  }
  
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (registerPassword !== registerConfirmPassword) {
      alert('Паролі не співпадають')
      return
    }
    
    if (registerPassword.length < 6) {
      alert('Пароль повинен містити мінімум 6 символів')
      return
    }
    
    if (typeof window === 'undefined' || !window.localStorage) return
    
    // Получаем всех пользователей
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]')
    
    // Проверяем, существует ли пользователь с таким email
    if (allUsers.some((u: User & { password: string }) => u.email === registerEmail)) {
      alert('Користувач з таким email вже існує')
      return
    }
    
    // Проверяем, является ли email админским (можно настроить)
    const adminEmails = ['admin@wattasushi.com', 'admin@watta.com']
    const isAdminUser = adminEmails.includes(registerEmail.toLowerCase())
    
    // Создаем нового пользователя
    const newUser: User & { password: string } = {
      id: Date.now().toString(),
      name: registerName,
      email: registerEmail,
      phone: registerPhone,
      address: registerAddress,
      password: registerPassword,
      isAdmin: isAdminUser, // Админ, если email в списке админов
      createdAt: new Date().toISOString()
    }
    
    // Сохраняем пользователя
    allUsers.push(newUser)
    localStorage.setItem('users', JSON.stringify(allUsers))
    
    // Автоматически входим
    const { password, ...userWithoutPassword } = newUser
    setUser(userWithoutPassword)
    setIsLoggedIn(true)
    setShowRegister(false)
    
    // Очищаем форму
    setRegisterName('')
    setRegisterEmail('')
    setRegisterPhone('')
    setRegisterAddress('')
    setRegisterPassword('')
    setRegisterConfirmPassword('')
    
    alert('Реєстрація успішна!')
  }
  
  const handleLogout = () => {
    setUser(null)
    setIsLoggedIn(false)
    setShowRegister(false)
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('currentUser')
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('userChanged'))
    }
    // Возвращаем пользователя на главную страницу после выхода
    // Используем небольшую задержку, чтобы состояние успело обновиться
    setTimeout(() => {
    handleBackToHome()
    }, 100)
  }
  
  const switchToRegister = () => {
    setShowRegister(true)
  }
  
  const switchToLogin = () => {
    setShowRegister(false)
  }
  
  const handleBackToHome = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    
    // Используем прямую функцию переключения, если доступна
    if (onSwitchTab && typeof onSwitchTab === 'function') {
      onSwitchTab(0)
    }
    
    // Устанавливаем в localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('switchToTab', '0')
    }
    
    // Отправляем событие
    if (typeof window !== 'undefined') {
    try {
      const event = new CustomEvent('switchTab', { 
        detail: 0,
        bubbles: true,
        cancelable: true
      })
      window.dispatchEvent(event)
    } catch (error) {
        console.error('Error dispatching event:', error)
      }
    }
  }
  
  // Если пользователь не залогинен, показываем одну форму (вход или регистрация)
  if (!isLoggedIn) {
  return (
      <>
        <button 
          className="profile-back-to-home-web"
          onClick={handleBackToHome}
          type="button"
          aria-label="Назад на главную"
          style={{ zIndex: 999999, position: 'fixed', top: '20px', left: '20px' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
      <div className="profile-auth-container-web">
        <div className="profile-auth-background-web">
          <div className="profile-auth-shapes-web">
            <div className="profile-shape-web profile-shape-1-web"></div>
            <div className="profile-shape-web profile-shape-2-web"></div>
            <div className="profile-shape-web profile-shape-3-web"></div>
          </div>
        </div>
        
        {!showRegister ? (
          // Форма входа
          <div className="profile-auth-form-wrapper-web">
            <div className="profile-auth-form-web profile-auth-form-single-web">
              <div className="profile-auth-header-web">
                <div className="profile-auth-logo-web">
                  <Image 
                    src="/watta-sushi-logo.png" 
                    alt="WATTA SUSHI" 
                    width={300} 
                    height={100}
                    className="profile-auth-logo-image-web"
                    priority
                    style={{ objectFit: 'contain' }}
                  />
                </div>
                <h2 className="profile-auth-title-web">Вітає Вас!</h2>
                <p className="profile-auth-subtitle-web">Увійдіть до свого акаунту</p>
              </div>
              <form onSubmit={handleLogin} className="profile-form-web">
                <div className="profile-form-group-web">
                  <label className="profile-form-label-web">
                    <span className="profile-form-icon-web">📧</span>
                    Email
                  </label>
                  <input
                    type="email"
                    className="profile-form-input-web"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                  />
                </div>
                <div className="profile-form-group-web">
                  <label className="profile-form-label-web">
                    <span className="profile-form-icon-web">🔒</span>
                    Пароль
                  </label>
                  <input
                    type="password"
                    className="profile-form-input-web"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
                <button type="submit" className="profile-form-button-web profile-form-button-primary-web">
                  <span>Увійти</span>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={switchToRegister}
                  className="profile-form-button-web profile-form-button-link-web"
                >
                  Немає акаунту? <span>Зареєструватися</span>
                </button>
              </form>
            </div>
          </div>
        ) : (
          // Форма регистрации
          <div className="profile-auth-form-wrapper-web">
            <div className="profile-auth-form-web profile-auth-form-single-web">
              <div className="profile-auth-header-web">
                <button 
                  className="profile-auth-back-btn-web"
                  onClick={switchToLogin}
                  type="button"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                  </svg>
                </button>
                <div className="profile-auth-logo-web">
                  <Image 
                    src="/watta-sushi-logo.png" 
                    alt="WATTA SUSHI" 
                    width={300} 
                    height={100}
                    className="profile-auth-logo-image-web"
                    priority
                    style={{ objectFit: 'contain' }}
                  />
                </div>
                <h2 className="profile-auth-title-web">Реєстрація</h2>
                <p className="profile-auth-subtitle-web">Створіть новий акаунт</p>
              </div>
              <form onSubmit={handleRegister} className="profile-form-web">
                <div className="profile-form-row-web">
                  <div className="profile-form-group-web">
                    <label className="profile-form-label-web">
                      <span className="profile-form-icon-web">👤</span>
                      Ім'я
                    </label>
                    <input
                      type="text"
                      className="profile-form-input-web"
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      placeholder="Ваше ім'я"
                      required
                    />
                  </div>
                  <div className="profile-form-group-web">
                    <label className="profile-form-label-web">
                      <span className="profile-form-icon-web">📧</span>
                      Email
                    </label>
                    <input
                      type="email"
                      className="profile-form-input-web"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                </div>
                <div className="profile-form-row-web">
                  <div className="profile-form-group-web">
                    <label className="profile-form-label-web">
                      <span className="profile-form-icon-web">📱</span>
                      Телефон
                    </label>
                    <input
                      type="tel"
                      className="profile-form-input-web"
                      value={registerPhone}
                      onChange={(e) => setRegisterPhone(e.target.value)}
                      placeholder="+380 (50) 123-45-67"
                      required
                    />
                  </div>
                  <div className="profile-form-group-web">
                    <label className="profile-form-label-web">
                      <span className="profile-form-icon-web">📍</span>
                      Адреса
                    </label>
                    <input
                      type="text"
                      className="profile-form-input-web"
                      value={registerAddress}
                      onChange={(e) => setRegisterAddress(e.target.value)}
                      placeholder="Адреса доставки"
                      required
                    />
                  </div>
                </div>
                <div className="profile-form-row-web">
                  <div className="profile-form-group-web">
                    <label className="profile-form-label-web">
                      <span className="profile-form-icon-web">🔒</span>
                      Пароль
                    </label>
                    <input
                      type="password"
                      className="profile-form-input-web"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      placeholder="Мінімум 6 символів"
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="profile-form-group-web">
                    <label className="profile-form-label-web">
                      <span className="profile-form-icon-web">🔐</span>
                      Підтвердження
                    </label>
                    <input
                      type="password"
                      className="profile-form-input-web"
                      value={registerConfirmPassword}
                      onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                      placeholder="Повторіть пароль"
                      required
                      minLength={6}
                    />
                  </div>
                </div>
                <button type="submit" className="profile-form-button-web profile-form-button-primary-web">
                  <span>Зареєструватися</span>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
      </>
    )
  }
  
  // Если пользователь залогинен, показываем профиль
  return (
    <div className="profile-container-web">
      <button 
        className="profile-back-to-home-web"
        onClick={handleBackToHome}
        type="button"
        aria-label="Назад на главную"
        style={{ zIndex: 999999, position: 'fixed', top: '20px', left: '20px' }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
      </button>
      <div className="profile-hero-web">
        <div className="profile-hero-background-web"></div>
        <div className="profile-hero-content-web">
          <div className="profile-avatar-wrapper-web">
            <div className="profile-avatar-web">{user?.name?.[0]?.toUpperCase() || '👤'}</div>
            <div className="profile-avatar-ring-web"></div>
            {user?.isAdmin && (
              <div className="profile-admin-crown-web">👑</div>
            )}
          </div>
          <div className="profile-info-web">
            <h2 className="profile-name-web">{user?.name || 'Користувач'}</h2>
            {user?.isAdmin && (
              <span className="profile-admin-badge-web">
                <span className="profile-admin-icon-web">⭐</span>
                Адміністратор
              </span>
            )}
            <p className="profile-email-web">{user?.email || '-'}</p>
          </div>
        </div>
      </div>
      
      <div className="profile-cards-grid-web">
        <div className="profile-card-web profile-card-primary-web">
          <div className="profile-card-icon-web">📧</div>
          <div className="profile-card-content-web">
            <span className="profile-card-label-web">Email</span>
            <span className="profile-card-value-web">{user?.email || '-'}</span>
          </div>
        </div>
        
        <div className="profile-card-web profile-card-primary-web">
          <div className="profile-card-icon-web">📱</div>
          <div className="profile-card-content-web">
            <span className="profile-card-label-web">Телефон</span>
            <span className="profile-card-value-web">{user?.phone || '-'}</span>
          </div>
        </div>
        
        <div className="profile-card-web profile-card-primary-web">
          <div className="profile-card-icon-web">📍</div>
          <div className="profile-card-content-web">
            <span className="profile-card-label-web">Адреса</span>
            <span className="profile-card-value-web">{user?.address || '-'}</span>
          </div>
        </div>
      </div>
      
      <div className="profile-actions-web">
        <button className="profile-action-button-web profile-action-primary-web">
          <span className="profile-action-icon-web">📋</span>
          <span>Історія замовлень</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>
        <button className="profile-action-button-web profile-action-secondary-web">
          <span className="profile-action-icon-web">✏️</span>
          <span>Змінити дані</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>
        <button 
          className="profile-action-button-web profile-action-logout-web"
          onClick={handleLogout}
        >
          <span className="profile-action-icon-web">🚪</span>
          <span>Вийти</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
