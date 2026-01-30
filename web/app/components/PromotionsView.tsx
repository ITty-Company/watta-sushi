'use client'

import React, { useState, useEffect } from 'react'
import { ArrowLeft, Phone, Bell, Heart, ShoppingBag, User, Menu, ArrowRight } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
// @ts-ignore
import LogoBackground from './LogoBackground'

interface PromotionsViewProps {
  onBack: () => void
  onMenuClick: () => void
  onOpenPhone?: () => void
  onOpenNotifications?: () => void
  onOpenFavorites?: () => void
  onOpenProfile?: () => void
  onOpenDetail: (id: number) => void
}

export default function PromotionsView({
  onBack,
  onMenuClick,
  onOpenPhone,
  onOpenNotifications,
  onOpenFavorites,
  onOpenProfile,
  onOpenDetail
}: PromotionsViewProps) {
  
  // @ts-ignore
  const { t } = useLanguage()
  const [promotions, setPromotions] = useState<any[]>([])

  // Безопасная функция перевода
  const safeT = (key: string, fallback: string) => {
    // @ts-ignore
    if (t && typeof t === 'function') return t(key)
    // @ts-ignore
    if (t && t[key]) return t[key]
    return fallback
  }

  useEffect(() => {
    fetch('/api/promotions')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setPromotions(data)
      })
      .catch(e => console.error(e))
  }, [])

  const Header = () => (
    <div className="absolute top-4 left-0 right-0 w-[95%] max-w-[1800px] h-[80px] mx-auto bg-white rounded-[20px] shadow-lg flex items-center justify-between px-6 z-[1000]">
      <div className="flex items-center gap-2 cursor-pointer" onClick={onBack}>
        <img src="/logo.png" alt="Logo" className="h-10 w-10 object-contain" />
        <img src="/1.jpg" alt="Watta Sushi" className="h-6 w-auto object-contain" />
      </div>
      <div className="flex items-center gap-3 md:gap-6 text-gray-700">
        <button onClick={onOpenPhone} className="hover:bg-gray-100 p-2 rounded-full"><Phone size={24}/></button>
        <button onClick={onOpenNotifications} className="hover:bg-gray-100 p-2 rounded-full"><Bell size={24}/></button>
        <button onClick={onOpenFavorites} className="hover:bg-gray-100 p-2 rounded-full"><Heart size={24}/></button>
        <button className="hover:bg-gray-100 p-2 rounded-full text-[#145142]"><ShoppingBag size={24}/></button>
        <button onClick={onOpenProfile} className="hover:bg-gray-100 p-2 rounded-full"><User size={24}/></button>
        <button onClick={onMenuClick} className="hover:bg-gray-100 p-2 rounded-full"><Menu size={24}/></button>
      </div>
    </div>
  )

  return (
    <div className="menu-page-web relative min-h-screen pt-[120px] pb-20 px-4"
         style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.5), rgba(255,255,255,0.9)), url('/background.jpg')", backgroundRepeat: 'repeat', backgroundSize: '300px', backgroundAttachment: 'fixed' }}>
      <div className="absolute inset-0 pointer-events-none z-0 opacity-50"><LogoBackground /></div>
      <Header />
      <div className="w-full max-w-[1800px] mx-auto mb-6 px-2 flex justify-start relative z-20">
         <button onClick={onBack} className="bg-white px-6 py-3 rounded-[15px] flex items-center gap-2 text-[#145142] font-bold shadow-sm hover:bg-gray-50 transition">
           <ArrowLeft size={20} /> Назад
         </button>
      </div>
      <div className="max-w-[1440px] mx-auto relative z-10 w-full">
        <h1 style={{ color: '#000', fontFamily: 'Inter, sans-serif', fontSize: '64px', fontWeight: 700, letterSpacing: '-1.088px', marginBottom: '40px' }} className="text-4xl md:text-6xl">
          {safeT('news_and_promos', 'Новости и акции')}
        </h1>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 justify-items-center xl:justify-items-start">
          {promotions.map((promo) => (
            <div key={promo.id} className="flex flex-col md:flex-row bg-white shadow-sm overflow-hidden shrink-0 transition hover:shadow-md"
              style={{ width: '100%', maxWidth: '680px', minHeight: '340px', borderRadius: '30px', background: '#FFF' }}>
              
              <div className="shrink-0 relative h-[300px] md:h-auto md:w-[340px]" style={{ overflow: 'hidden' }}>
                {promo.imageUrl ? (
                    <img src={promo.imageUrl} alt={promo.title} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">Нет фото</div>
                )}
                {promo.isHit && (
                  <div className="absolute top-5 right-5 flex items-center justify-center shadow-md" style={{ width: '134px', height: '40px', borderRadius: '15px', background: '#155044', color: '#FFF', fontSize: '20px', fontWeight: 700 }}>
                    {safeT('hit', 'ХИТ')}
                  </div>
                )}
              </div>

              <div className="flex flex-col justify-between p-6 md:p-8 flex-1">
                <div>
                  <h3 className="line-clamp-2" style={{ color: '#000', fontSize: '32px', fontWeight: 700, marginBottom: '16px', lineHeight: '1.1' }}>{promo.title}</h3>
                  <p className="line-clamp-3" style={{ color: '#707070', fontSize: '20px', fontWeight: 700, lineHeight: '1.3' }}>{promo.description}</p>
                </div>
                <div className="flex justify-end mt-6 md:mt-0">
                  <button onClick={() => onOpenDetail(promo.id)}
                    className="flex items-center justify-center gap-2 hover:bg-[#1a6b58] transition-colors"
                    style={{ width: '175px', height: '48px', borderRadius: '15px', background: '#155044', color: '#FFF', fontSize: '24px', fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                    {safeT('details', 'подробнее')} <ArrowRight size={24} strokeWidth={3} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}