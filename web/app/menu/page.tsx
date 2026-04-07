'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, MapPin, Info, Phone, FileText, Globe } from 'lucide-react'

export default function MenuPage() {
  const router = useRouter()

  const menuItems = [
      { icon: <Info />, label: 'Про нас', link: '/about' },
      { icon: <MapPin />, label: 'Зона доставки', link: '/delivery' },
      { icon: <FileText />, label: 'Публічна оферта', link: '/oferta' },
      { icon: <Globe />, label: 'Змінити мову', action: () => alert('Зміна мови') },
      { icon: <Phone />, label: 'Контакти', link: '/contacts' },
  ]

  return (
    <div className="watta-public-page-shell min-h-screen p-4 pt-8">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-4 mb-8">
            <button onClick={() => router.back()} className="bg-white p-3 rounded-xl shadow-sm hover:bg-gray-50 transition">
                <ArrowLeft />
            </button>
            <h1 className="text-3xl font-bold text-[#194A38]">Меню</h1>
        </div>

        <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
            {menuItems.map((item, idx) => (
                <div 
                    key={idx}
                    onClick={() => item.link ? router.push(item.link) : item.action?.()}
                    className="flex items-center gap-4 p-5 border-b border-gray-100 last:border-0 hover:bg-gray-50 cursor-pointer transition"
                >
                    <div className="text-gray-400">{item.icon}</div>
                    <span className="font-medium text-lg text-gray-700">{item.label}</span>
                </div>
            ))}
        </div>
        
        <div className="mt-8 text-center text-gray-400 text-sm">
            Версія 1.0.0
        </div>
      </div>
    </div>
  )
}