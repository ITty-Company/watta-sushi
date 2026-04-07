'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, User, LogOut } from 'lucide-react'

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<{ name?: string; email?: string; phone?: string } | null>(null)

  useEffect(() => {
    const savedUser = typeof window !== 'undefined' ? localStorage.getItem('currentUser') : null
    if (!savedUser) {
      router.replace('/login?return=' + encodeURIComponent('/profile'))
      return
    }
    try {
      setUser(JSON.parse(savedUser))
    } catch {
      router.replace('/login?return=' + encodeURIComponent('/profile'))
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('currentUser')
    window.dispatchEvent(new Event('userChanged'))
    router.push('/')
  }

  if (!user) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[#f6f8f7] text-[#145142]">
        Завантаження…
      </div>
    )
  }

  return (
    <div className="watta-public-page-shell min-h-screen p-4 pt-8">
      <div className="max-w-md mx-auto bg-white rounded-3xl p-6 shadow-xl min-h-[500px]">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-gray-500 hover:text-black transition"
        >
          <ArrowLeft /> Назад
        </button>

        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 bg-[#145142] rounded-full flex items-center justify-center text-white mb-4">
            <User size={48} />
          </div>
          <h1 className="text-2xl font-bold text-[#194A38]">{user?.name || 'Гість'}</h1>
          <p className="text-gray-400">{user?.email || user?.phone}</p>
        </div>

        <div className="space-y-3">
          <div className="p-4 bg-gray-50 rounded-xl font-medium">📜 Мої замовлення</div>
          <div className="p-4 bg-gray-50 rounded-xl font-medium">📍 Мої адреси</div>
          <div className="p-4 bg-gray-50 rounded-xl font-medium">💳 Способи оплати</div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full mt-8 p-4 bg-red-50 text-red-500 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-100 transition"
        >
          <LogOut size={20} /> Вийти
        </button>
      </div>
    </div>
  )
}
