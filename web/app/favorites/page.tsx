'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Heart } from 'lucide-react'

export default function FavoritesPage() {
  const router = useRouter()

  return (
    <div className="watta-public-page-shell min-h-screen p-4 pt-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
            <button onClick={() => router.back()} className="bg-white p-3 rounded-xl shadow-sm hover:bg-gray-50 transition">
                <ArrowLeft />
            </button>
            <h1 className="text-3xl font-bold text-[#194A38]">Обране</h1>
        </div>

        {/* Заглушка, если пусто */}
        <div className="flex flex-col items-center justify-center h-[400px] bg-white rounded-3xl shadow-sm text-center p-8">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-4">
                <Heart size={40} />
            </div>
            <h2 className="text-xl font-bold text-gray-700 mb-2">Поки що тут пусто</h2>
            <p className="text-gray-400 max-w-xs">Додавайте улюблені суші та роли, щоб швидко їх знаходити</p>
            <button onClick={() => router.push('/')} className="mt-6 bg-[#145142] text-white px-6 py-3 rounded-xl font-bold">
                Перейти в меню
            </button>
        </div>
      </div>
    </div>
  )
}