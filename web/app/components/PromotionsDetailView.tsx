'use client'

import React, { useState, useEffect } from 'react'
import { ArrowLeft, Phone, Bell, Heart, ShoppingBag, User, Menu } from 'lucide-react'
// @ts-ignore
import LogoBackground from './LogoBackground'

interface PromotionsDetailViewProps {
  id: number
  onBack: () => void
  onMenuClick: () => void
  onOpenPhone?: () => void
  onOpenNotifications?: () => void
  onOpenFavorites?: () => void
  onOpenProfile?: () => void
}

export default function PromotionsDetailView({
  id,
  onBack,
  onMenuClick,
  onOpenPhone,
  onOpenNotifications,
  onOpenFavorites,
  onOpenProfile
}: PromotionsDetailViewProps) {
  const [promo, setPromo] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/promotions/${id}`)
      .then(res => res.json())
      .then(data => {
        setPromo(data)
        setLoading(false)
      })
      .catch(e => {
        console.error(e)
        setLoading(false)
      })
  }, [id])

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

  if (loading) return <div className="min-h-screen flex items-center justify-center pt-20">Загрузка...</div>
  if (!promo || promo.error) return <div className="min-h-screen flex items-center justify-center pt-20">Новость не найдена</div>

  return (
    <div className="menu-page-web relative min-h-screen pt-[120px] pb-20 px-4"
         style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.5), rgba(255,255,255,0.9)), url('/background.jpg')", backgroundRepeat: 'repeat', backgroundSize: '300px', backgroundAttachment: 'fixed' }}>
      <div className="absolute inset-0 pointer-events-none z-0 opacity-50"><LogoBackground /></div>
      <Header />
      
      <div className="w-full max-w-[1200px] mx-auto mb-6 px-2 flex justify-start relative z-20">
         <button onClick={onBack} className="bg-white px-6 py-3 rounded-[15px] flex items-center gap-2 text-[#145142] font-bold shadow-sm hover:bg-gray-50 transition">
           <ArrowLeft size={20} /> Назад
         </button>
      </div>

      <div className="max-w-[1000px] mx-auto bg-white rounded-[30px] shadow-lg overflow-hidden relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {promo.imageUrl && (
          <div className="w-full h-[300px] md:h-[500px] relative">
            <img src={promo.imageUrl} alt={promo.title} className="w-full h-full object-cover" />
             {promo.isHit && (
                <div className="absolute top-5 right-5 bg-[#155044] text-white px-6 py-2 rounded-xl text-xl font-bold shadow-lg">ХИТ</div>
             )}
          </div>
        )}
        <div className="p-8 md:p-12">
          <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">{promo.title}</h1>
          <div className="prose max-w-none text-gray-700 text-lg md:text-xl whitespace-pre-wrap leading-relaxed">
            {promo.content || promo.description}
          </div>
        </div>
      </div>
    </div>
  )
}