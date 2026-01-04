'use client'

import { ArrowLeft, MapPin, Clock, Phone, Star, Menu } from 'lucide-react'

export default function AboutView({ onBack, onMenuClick }: { onBack: () => void, onMenuClick: () => void}) {
  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Обновленная шапка */}
      <div className="bg-white p-4 sticky top-0 z-10 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold">Акции</h1>
        </div>
        
        {/* КНОПКА БУРГЕРА */}
        <button onClick={onMenuClick} className="p-2 hover:bg-gray-100 rounded-full">
          <Menu size={24} />
        </button>
      </div>

      <div className="p-6">
        <div className="flex justify-center mb-8">
           {/* Логотип */}
           <img src="/watta.png" alt="Watta Sushi" className="h-12 object-contain" />
        </div>

        <div className="prose prose-sm mx-auto text-gray-600 space-y-4">
          <p className="text-lg font-medium text-gray-900">
            Watta Sushi — это доставка японской кухни нового поколения.
          </p>
          <p>
            Мы готовим суши и роллы только из свежайшей рыбы, используем настоящий рис Calrose и не жалеем начинки. Наша миссия — сделать вкусную еду доступной и быстрой.
          </p>
          
          <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex gap-3 items-start my-6">
             <Star className="text-orange-500 shrink-0" fill="currentColor" size={20} />
             <p className="text-sm text-orange-800 m-0">
               Более 10 000 довольных клиентов уже выбрали нас!
             </p>
          </div>
        </div>

        <div className="mt-8 space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 shrink-0">
              <MapPin size={20} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Адрес</h3>
              <p className="text-gray-500">г. Киев, ул. Крещатик 1</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 shrink-0">
              <Clock size={20} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Режим работы</h3>
              <p className="text-gray-500">Пн-Вс: 10:00 - 22:00</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
             <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 shrink-0">
               <Phone size={20} />
             </div>
             <div>
               <h3 className="font-bold text-gray-900">Контакты</h3>
               <p className="text-gray-500">+38 (099) 999-99-99</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}