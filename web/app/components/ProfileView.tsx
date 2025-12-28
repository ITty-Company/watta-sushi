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
  role?: string
}

interface OrderItem {
  id: number
  quantity: number
  price: number
  product: { name_ru: string; imageUrl?: string }
}

interface Order {
  id: number
  totalPrice: number
  status: string
  createdAt: string
  items: OrderItem[]
}

interface ProfileViewProps {
  onSwitchTab?: (tab: number) => void
  onBack?: () => void // <--- НОВЫЙ ПРОП
}

export default function ProfileView({ onSwitchTab, onBack }: ProfileViewProps = {}) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [showRegister, setShowRegister] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)

  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  
  const [registerName, setRegisterName] = useState('')
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPhone, setRegisterPhone] = useState('')
  const [registerAddress, setRegisterAddress] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('')
  
  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const token = localStorage.getItem('token')
      const savedUser = localStorage.getItem('currentUser')
      
      if (token && savedUser) {
        try {
          const parsed = JSON.parse(savedUser)
          setUser(parsed)
          setIsLoggedIn(true)
        } catch (e) {
          console.error('Error loading user:', e)
          localStorage.removeItem('token')
        }
      }
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.message || 'Ошибка входа')
        return
      }
      const userData = { ...data.user, isAdmin: data.user.role === 'ADMIN' }
      localStorage.setItem('token', data.token)
      localStorage.setItem('currentUser', JSON.stringify(userData))
      localStorage.setItem('userId', data.user.id)
      setUser(userData)
      setIsLoggedIn(true)
      setShowRegister(false)
      setLoginEmail('')
      setLoginPassword('')
      window.dispatchEvent(new Event('userChanged'))
    } catch (err) {
      console.error(err)
      alert('Ошибка соединения с сервером')
    }
  }
  
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (registerPassword !== registerConfirmPassword) {
      alert('Паролі не співпадають')
      return
    }
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: registerName,
          email: registerEmail,
          password: registerPassword,
        })
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.message || 'Ошибка регистрации')
        return
      }
      const userData = { ...data.user, isAdmin: data.user.role === 'ADMIN', phone: registerPhone, address: registerAddress }
      localStorage.setItem('token', data.token)
      localStorage.setItem('currentUser', JSON.stringify(userData))
      localStorage.setItem('userId', data.user.id)
      setUser(userData)
      setIsLoggedIn(true)
      setShowRegister(false)
      window.dispatchEvent(new Event('userChanged'))
      alert('Реєстрація успішна!')
    } catch (err) {
      console.error(err)
      alert('Ошибка соединения с сервером')
    }
  }
  
  const fetchHistory = async () => {
    if (!user?.id) return
    setIsLoadingHistory(true)
    setShowHistory(true)
    try {
      const res = await fetch(`/api/orders/user/${user.id}`)
      if (res.ok) {
        const data = await res.json()
        setOrders(data)
      } else {
        alert('Не удалось загрузить историю')
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoadingHistory(false)
    }
  }

  const handleLogout = () => {
    setUser(null)
    setIsLoggedIn(false)
    setShowRegister(false)
    setShowHistory(false)
    setOrders([])
    localStorage.removeItem('token')
    localStorage.removeItem('currentUser')
    localStorage.removeItem('userId')
    window.dispatchEvent(new Event('userChanged'))
    setTimeout(() => handleBackToHome(), 100)
  }
  
  const switchToRegister = () => setShowRegister(true)
  const switchToLogin = () => setShowRegister(false)
  
  // --- ИСПРАВЛЕННАЯ ФУНКЦИЯ НАЗАД ---
  const handleBackToHome = (e?: React.MouseEvent) => {
    if (e) { e.preventDefault(); e.stopPropagation() }
    
    // Если нам передали функцию закрытия (из Меню), вызываем её
    if (onBack) {
      onBack()
      return
    }

    // Иначе (если мы на отдельной странице), пробуем переключить вкладку
    if (onSwitchTab) onSwitchTab(0)
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('switchTab', { detail: 0, bubbles: true, cancelable: true })
      window.dispatchEvent(event)
    }
  }

  if (!isLoggedIn) {
    return (
      <>
        <button className="profile-back-to-home-web" onClick={handleBackToHome} style={{ zIndex: 999999, position: 'fixed', top: '20px', left: '20px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
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
          <div className="profile-auth-form-wrapper-web">
            <div className="profile-auth-form-web profile-auth-form-single-web">
              <div className="profile-auth-header-web">
                <div className="profile-auth-logo-web">
                  <Image src="/watta-sushi-logo.png" alt="Logo" width={300} height={100} className="profile-auth-logo-image-web" priority style={{ objectFit: 'contain' }} />
                </div>
                <h2 className="profile-auth-title-web">Вітає Вас!</h2>
                <p className="profile-auth-subtitle-web">Увійдіть до свого акаунту</p>
              </div>
              <form onSubmit={handleLogin} className="profile-form-web">
                <div className="profile-form-group-web">
                  <label className="profile-form-label-web"><span className="profile-form-icon-web">📧</span>Email</label>
                  <input type="email" className="profile-form-input-web" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required />
                </div>
                <div className="profile-form-group-web">
                  <label className="profile-form-label-web"><span className="profile-form-icon-web">🔒</span>Пароль</label>
                  <input type="password" className="profile-form-input-web" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required />
                </div>
                <button type="submit" className="profile-form-button-web profile-form-button-primary-web"><span>Увійти</span></button>
                <button type="button" onClick={switchToRegister} className="profile-form-button-web profile-form-button-link-web">Немає акаунту? <span>Зареєструватися</span></button>
              </form>
            </div>
          </div>
        ) : (
          <div className="profile-auth-form-wrapper-web">
            <div className="profile-auth-form-web profile-auth-form-single-web">
              <div className="profile-auth-header-web">
                <button className="profile-auth-back-btn-web" onClick={switchToLogin}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></button>
                <h2 className="profile-auth-title-web">Реєстрація</h2>
              </div>
              <form onSubmit={handleRegister} className="profile-form-web">
                <div className="profile-form-group-web"><label className="profile-form-label-web">Ім'я</label><input type="text" className="profile-form-input-web" value={registerName} onChange={(e) => setRegisterName(e.target.value)} required /></div>
                <div className="profile-form-group-web"><label className="profile-form-label-web">Email</label><input type="email" className="profile-form-input-web" value={registerEmail} onChange={(e) => setRegisterEmail(e.target.value)} required /></div>
                <div className="profile-form-group-web"><label className="profile-form-label-web">Телефон</label><input type="tel" className="profile-form-input-web" value={registerPhone} onChange={(e) => setRegisterPhone(e.target.value)} required /></div>
                <div className="profile-form-group-web"><label className="profile-form-label-web">Пароль</label><input type="password" className="profile-form-input-web" value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)} required minLength={6} /></div>
                <div className="profile-form-group-web"><label className="profile-form-label-web">Підтвердження</label><input type="password" className="profile-form-input-web" value={registerConfirmPassword} onChange={(e) => setRegisterConfirmPassword(e.target.value)} required minLength={6} /></div>
                <button type="submit" className="profile-form-button-web profile-form-button-primary-web"><span>Зареєструватися</span></button>
              </form>
            </div>
          </div>
        )}
        </div>
      </>
    )
  }
  
  return (
    <div className="profile-container-web">
      <button className="profile-back-to-home-web" onClick={handleBackToHome} style={{ zIndex: 999999, position: 'fixed', top: '20px', left: '20px' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
      </button>
      <div className="profile-hero-web">
        <div className="profile-hero-background-web"></div>
        <div className="profile-hero-content-web">
          <div className="profile-avatar-wrapper-web">
            <div className="profile-avatar-web">{user?.name?.[0]?.toUpperCase() || '👤'}</div>
            {user?.isAdmin && <div className="profile-admin-crown-web">👑</div>}
          </div>
          <div className="profile-info-web">
            <h2 className="profile-name-web">{user?.name || 'Користувач'}</h2>
            {user?.isAdmin && <span className="profile-admin-badge-web">Адміністратор</span>}
            <p className="profile-email-web">{user?.email}</p>
          </div>
        </div>
      </div>
      <div className="profile-actions-web" style={{ marginBottom: '20px' }}>
        <button className="profile-action-button-web profile-action-primary-web" onClick={fetchHistory}><span className="profile-action-icon-web">📋</span><span>Історія замовлень</span></button>
        <button className="profile-action-button-web profile-action-logout-web" onClick={handleLogout}><span className="profile-action-icon-web">🚪</span><span>Вийти</span></button>
      </div>
      {showHistory && (
        <div className="profile-history-web" style={{ padding: '0 20px 40px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '15px' }}>Мої замовлення</h3>
          {isLoadingHistory ? <p>Завантаження...</p> : orders.length === 0 ? <p className="text-gray-500">Замовлень поки немає</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {orders.map(order => (
                <div key={order.id} style={{ background: 'white', padding: '15px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}><span style={{ fontWeight: 'bold' }}>Замовлення #{order.id}</span><span style={{ color: order.status === 'DELIVERED' ? 'green' : 'orange', fontWeight: 'bold', fontSize: '14px' }}>{order.status}</span></div>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>{new Date(order.createdAt).toLocaleDateString()}</div>
                  <div style={{ borderTop: '1px solid #eee', paddingTop: '8px' }}>{order.items.map(item => (<div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '4px' }}><span>{item.product.name_ru} x{item.quantity}</span><span>{item.price * item.quantity} ₴</span></div>))}</div>
                  <div style={{ marginTop: '10px', textAlign: 'right', fontWeight: 'bold', fontSize: '16px', color: '#ec4899' }}>Всього: {order.totalPrice} ₴</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}