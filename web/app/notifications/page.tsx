'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Bell } from 'lucide-react'

export default function NotificationsPage() {
  const router = useRouter()

  return (
    <div className="watta-public-page-shell min-h-screen p-4 pt-8">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-4 mb-8">
            <button onClick={() => router.back()} className="bg-white p-3 rounded-xl shadow-sm hover:bg-gray-50 transition">
                <ArrowLeft />
            </button>
            <h1 className="text-2xl font-bold text-[#194A38]">Повідомлення</h1>
        </div>

        <div className="space-y-4">
            {/* Пример уведомления */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex gap-4">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-[#145142] shrink-0">
                    <Bell size={20} />
                </div>
                <div>
                    <h3 className="font-bold text-gray-800">Ласкаво просимо!</h3>
                    <p className="text-sm text-gray-500 mt-1">Раді бачити вас у Watta Sushi. Спробуйте наші новинки.</p>
                    <span className="text-xs text-gray-400 mt-2 block">Сьогодні, 12:00</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  )
}