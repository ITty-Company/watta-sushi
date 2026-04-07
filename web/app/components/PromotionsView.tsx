'use client'

import React, { useState, useEffect } from 'react'
import { ArrowLeft, Phone, Bell, Heart, ShoppingBag, User, Menu, ArrowRight } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { promoCoverUrl, promoGalleryUrls, promoProductOffersCount, promoTpl } from '@/app/lib/promoDisplay'
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
  
  const { t } = useLanguage()
  const [promotions, setPromotions] = useState<any[]>([])
  const p = t.promotionsPage

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
           <ArrowLeft size={20} /> {t.auth.back}
         </button>
      </div>
      <div className="max-w-[1440px] mx-auto relative z-10 w-full">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-black tracking-tight mb-8 md:mb-10" style={{ fontFamily: 'Inter, sans-serif' }}>
          {p.listHeading}
        </h1>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8 justify-items-center xl:justify-items-start w-full">
          {promotions.map((promo) => {
            const cover = promoCoverUrl(promo)
            const galleryCount = promoGalleryUrls(promo).length
            const offers = promoProductOffersCount(promo.productOffers)
            return (
            <div key={promo.id} className="flex flex-col md:flex-row bg-white shadow-sm overflow-hidden shrink-0 transition hover:shadow-md w-full max-w-[680px] min-h-[280px] sm:min-h-[340px] rounded-[24px] sm:rounded-[30px]"
              style={{ background: '#FFF' }}>
              
              <div className="shrink-0 relative h-[220px] sm:h-[300px] md:h-auto md:w-[340px] overflow-hidden">
                {cover ? (
                    <img src={cover} alt={promo.title} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-sm">{p.noPhoto}</div>
                )}
                {galleryCount > 1 && (
                  <span className="absolute bottom-3 left-3 px-2 py-1 rounded-lg bg-black/55 text-white text-xs font-bold">
                    {promoTpl(p.morePhotosBadge, { count: galleryCount - 1 })}
                  </span>
                )}
                {offers > 0 && (
                  <span className="absolute bottom-3 right-3 px-2 py-1 rounded-lg bg-[#155044] text-white text-xs font-bold">
                    {promoTpl(p.offersBadge, { count: offers })}
                  </span>
                )}
                {promo.isHit && (
                  <div className="absolute top-5 right-5 flex items-center justify-center shadow-md" style={{ width: '134px', height: '40px', borderRadius: '15px', background: '#155044', color: '#FFF', fontSize: '20px', fontWeight: 700 }}>
                    {p.hitBadge}
                  </div>
                )}
              </div>

              <div className="flex flex-col justify-between p-5 sm:p-6 md:p-8 flex-1 min-w-0">
                <div>
                  <h3 className="line-clamp-2 text-2xl sm:text-[28px] md:text-[32px] font-bold text-black mb-3 sm:mb-4 leading-tight">{promo.title}</h3>
                  <p className="line-clamp-3 text-base sm:text-lg md:text-xl font-bold text-[#707070] leading-snug">{promo.description}</p>
                </div>
                <div className="flex justify-end mt-6 md:mt-0">
                  <button onClick={() => onOpenDetail(promo.id)}
                    className="flex items-center justify-center gap-2 hover:bg-[#1a6b58] transition-colors"
                    style={{ width: '175px', height: '48px', borderRadius: '15px', background: '#155044', color: '#FFF', fontSize: '24px', fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                    {p.detailsCta} <ArrowRight size={24} strokeWidth={3} />
                  </button>
                </div>
              </div>
            </div>
          )})}
        </div>
      </div>
    </div>
  )
}