'use client'

import { ArrowLeft, Menu } from 'lucide-react'
import LogoBackground from './LogoBackground'

export default function PromotionsView({ onBack, onMenuClick}: { onBack: () => void, onMenuClick: () => void }) {
  const promotions = [
    {
      id: 1,
      title: 'Сет "Дракон" -20%',
      description: 'Легендарный сет по супер цене до конца недели!',
      color: 'from-orange-400 to-red-500'
    },
    {
      id: 2,
      title: 'Кола в подарок',
      description: 'При заказе от 800 ₴ — Coca-Cola 0.5л бесплатно.',
      color: 'from-green-400 to-emerald-600'
    },
    {
      id: 3,
      title: '1+1 на Мисо суп',
      description: 'Закажи один, получи второй в подарок.',
      color: 'from-blue-400 to-indigo-600'
    },
    {
      id: 4,
      title: 'Скидка на самовывоз',
      description: 'Забери заказ сам и получи скидку 10%.',
      color: 'from-purple-400 to-pink-600'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 pb-10 relative">
      <LogoBackground />
      <div className="relative z-10">
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
    
      {/* Список акций */}
      <div className="p-4 space-y-4">
        {promotions.map(promo => (
          <div key={promo.id} className={`rounded-2xl p-6 text-white bg-gradient-to-r ${promo.color} shadow-lg relative overflow-hidden min-h-[160px] flex flex-col justify-center transform transition hover:scale-[1.02]`}>
             <div className="relative z-10 max-w-[90%]">
               <span className="bg-white/20 text-xs font-bold px-2 py-1 rounded-md mb-2 inline-block backdrop-blur-sm">
                 Active
               </span>
               <h3 className="text-2xl font-bold mb-2 leading-tight">{promo.title}</h3>
               <p className="opacity-95 text-sm">{promo.description}</p>
             </div>
             {/* Декор */}
             <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/20 rounded-full blur-2xl pointer-events-none"></div>
          </div>
        ))}
      </div>
      </div>
    </div>
  )
}