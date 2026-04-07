'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, User, LogOut } from 'lucide-react'
import AuthView from '../components/AuthView' 

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [showAuth, setShowAuth] = useState(false)

  useEffect(() => {
    // Проверяем, есть ли пользователь в localStorage
    const savedUser = localStorage.getItem('currentUser')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    } else {
      setShowAuth(true)
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('currentUser')
    router.push('/')
  }

  if (showAuth) {
    return (
      <AuthView 
        onBack={() => router.back()} 
        onLoginSuccess={() => {
           setShowAuth(false)
           const savedUser = localStorage.getItem('currentUser')
           if (savedUser) setUser(JSON.parse(savedUser))
        }} 
      />
    )
  }

  return (
    <div className="watta-public-page-shell min-h-screen p-4 pt-8">
      <div className="max-w-md mx-auto bg-white rounded-3xl p-6 shadow-xl min-h-[500px]">
        <button onClick={() => router.back()} className="mb-6 flex items-center gap-2 text-gray-500 hover:text-black transition">
          <ArrowLeft /> Назад
        </button>

        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 bg-[#145142] rounded-full flex items-center justify-center text-white mb-4">
            <User size={48} />
          </div>
          <h1 className="text-2xl font-bold text-[#194A38]">{user?.name || 'Гость'}</h1>
          <p className="text-gray-400">{user?.email || user?.phone}</p>
        </div>

        <div className="space-y-3">
           <div className="p-4 bg-gray-50 rounded-xl font-medium">📜 Мои заказы</div>
           <div className="p-4 bg-gray-50 rounded-xl font-medium">📍 Мои адреса</div>
           <div className="p-4 bg-gray-50 rounded-xl font-medium">💳 Способы оплаты</div>
        </div>

        <button 
          onClick={handleLogout}
          className="w-full mt-8 p-4 bg-red-50 text-red-500 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-100 transition"
        >
          <LogOut size={20} /> Выйти
        </button>
      </div>
    </div>
  )
}