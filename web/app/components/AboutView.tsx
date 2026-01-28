'use client'

import { useState, useEffect, useMemo, memo, useRef } from 'react'
import { ArrowLeft, MapPin, Clock, Phone, Star, Menu, Heart, Award, Users, Zap } from 'lucide-react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { useLanguage } from '../context/LanguageContext'

// Ленивая загрузка LogoBackground
const LogoBackground = dynamic(() => import('./LogoBackground'), {
  ssr: false,
  loading: () => null
})

interface TeamMember {
  id: number
  name_ru: string
  name_ua?: string
  name_en?: string
  name_nl?: string
  position_ru: string
  position_ua?: string
  position_en?: string
  position_nl?: string
  imageUrl?: string
  bio_ru?: string
  bio_ua?: string
  bio_en?: string
  bio_nl?: string
}

// Мемоизированные компоненты для статистики (оптимизированы для производительности)
const StatCard = memo(({ icon: Icon, value, label, delay }: { icon: any, value: string, label: string, delay: number }) => (
  <div 
    className="bg-white rounded-2xl p-6 text-center border-2 border-[#145142]/10 shadow-lg shadow-[#145142]/5 hover:shadow-xl hover:shadow-[#145142]/10 transition-all duration-500 hover:-translate-y-3 hover:scale-105" 
    style={{
      background: 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
      animation: `fadeInUp 0.6s ease-out ${delay}s both`,
      willChange: 'transform, opacity'
    }}
  >
    <Icon size={32} className="mx-auto mb-3 text-[#145142]" style={{ 
      filter: 'drop-shadow(0 2px 4px rgba(20,81,66,0.2))',
      animation: `float 3s ease-in-out infinite ${delay}s`,
      willChange: 'transform'
    }} />
    <div className="text-3xl font-black text-[#145142] mb-1" style={{
      animation: `countUp 1s ease-out ${delay + 0.3}s both`,
      willChange: 'transform, opacity'
    }}>{value}</div>
    <div className="text-sm font-semibold text-gray-600">{label}</div>
  </div>
))
StatCard.displayName = 'StatCard'

// Мемоизированный компонент для особенностей (оптимизирован)
const FeatureCard = memo(({ icon: Icon, title, text, delay }: { icon: any, title: string, text: string, delay: number }) => (
  <div 
    className="bg-white rounded-2xl p-6 border-2 border-[#145142]/10 shadow-lg shadow-[#145142]/5 hover:shadow-xl hover:shadow-[#145142]/15 transition-all duration-500 hover:-translate-y-2 hover:scale-105 hover:rotate-1" 
    style={{
      background: 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
      animation: `slideInLeft 0.7s ease-out ${delay}s both`,
      willChange: 'transform, opacity'
    }}
  >
    <div 
      className="w-14 h-14 rounded-xl mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300" 
      style={{
        background: 'linear-gradient(135deg, #145142 0%, #1a6b58 100%)',
        boxShadow: '0 4px 12px rgba(20,81,66,0.3)',
        animation: `pulse 2s ease-in-out infinite ${delay}s`,
        willChange: 'transform'
      }}
    >
      <Icon size={28} className="text-white" fill="white" />
    </div>
    <h4 className="text-xl font-bold text-gray-900 mb-2">{title}</h4>
    <p className="text-gray-600">{text}</p>
  </div>
))
FeatureCard.displayName = 'FeatureCard'

// Мемоизированный компонент для контактов (оптимизирован)
const ContactCard = memo(({ icon: Icon, title, text, delay }: { icon: any, title: string, text: string, delay: number }) => (
  <div 
    className="bg-white rounded-2xl p-6 border-2 border-[#145142]/10 shadow-lg shadow-[#145142]/5 hover:shadow-xl hover:shadow-[#145142]/15 transition-all duration-500 hover:-translate-y-3 hover:scale-105 hover:rotate-1" 
    style={{
      background: 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
      animation: `slideInRight 0.7s ease-out ${delay}s both`,
      willChange: 'transform, opacity'
    }}
  >
    <div 
      className="w-14 h-14 rounded-xl mb-4 flex items-center justify-center" 
      style={{
        background: 'linear-gradient(135deg, #145142 0%, #1a6b58 100%)',
        boxShadow: '0 4px 12px rgba(20,81,66,0.3)',
        animation: `rotateIn 0.8s ease-out ${delay + 0.2}s both`,
        willChange: 'transform'
      }}
    >
      <Icon size={28} className="text-white" />
    </div>
    <h3 className="font-black text-gray-900 mb-2 text-lg">{title}</h3>
    <p className="text-gray-600 font-medium">{text}</p>
  </div>
))
ContactCard.displayName = 'ContactCard'

function AboutView({ onBack, onMenuClick }: { onBack: () => void, onMenuClick: () => void}) {
  const { getLocalized } = useLanguage()
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Оптимизированный эффект для обновления высоты контейнера с debounce
  useEffect(() => {
    let updateTimeout: ReturnType<typeof setTimeout> | null = null
    
    const updateContainerHeight = () => {
      if (!containerRef.current) return
      const container = containerRef.current
      const contentHeight = Math.max(
        container.scrollHeight,
        container.offsetHeight,
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
        window.innerHeight
      )
      container.style.minHeight = `${contentHeight}px`
    }
    
    const debouncedUpdate = () => {
      if (updateTimeout) clearTimeout(updateTimeout)
      updateTimeout = setTimeout(updateContainerHeight, 100)
    }
    
    // Обновляем сразу
    updateContainerHeight()
    
    // Обновляем после загрузки контента
    const timeoutId = setTimeout(updateContainerHeight, 300)
    
    // Обновляем при изменении команды
    if (teamMembers.length > 0) {
      setTimeout(updateContainerHeight, 200)
    }
    
    window.addEventListener('resize', debouncedUpdate, { passive: true })
    
    // Используем ResizeObserver вместо MutationObserver для лучшей производительности
    let resizeObserver: ResizeObserver | null = null
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      resizeObserver = new ResizeObserver(debouncedUpdate)
      resizeObserver.observe(containerRef.current)
    }
    
    return () => {
      if (updateTimeout) clearTimeout(updateTimeout)
      clearTimeout(timeoutId)
      window.removeEventListener('resize', debouncedUpdate)
      if (resizeObserver) {
        resizeObserver.disconnect()
      }
    }
  }, [teamMembers.length])

  // Оптимизированная загрузка данных с кэшированием и отложенной загрузкой
  useEffect(() => {
    let cancelled = false
    
    // Откладываем загрузку команды до полной загрузки страницы
    const loadTeam = () => {
      // Проверяем кэш
      const cacheKey = 'team_members_cache'
      const cached = sessionStorage.getItem(cacheKey)
      const cacheTime = sessionStorage.getItem(`${cacheKey}_time`)
      const now = Date.now()
      
      if (cached && cacheTime && (now - parseInt(cacheTime)) < 5 * 60 * 1000) {
        // Используем кэш если он свежий (менее 5 минут)
        try {
          const data = JSON.parse(cached)
          if (!cancelled) {
            setTeamMembers(data || [])
          }
          return
        } catch (e) {
          // Если кэш поврежден, загружаем заново
        }
      }
      
      // Загружаем данные с низким приоритетом
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          if (cancelled) return
          fetch('/api/team', {
            headers: {
              'Cache-Control': 'max-age=300'
            }
          })
            .then(res => res.json())
            .then(data => {
              if (!cancelled) {
                setTeamMembers(data || [])
                sessionStorage.setItem(cacheKey, JSON.stringify(data))
                sessionStorage.setItem(`${cacheKey}_time`, now.toString())
              }
            })
            .catch(err => {
              if (!cancelled) {
                console.error('Ошибка загрузки команды:', err)
              }
            })
        }, { timeout: 2000 })
      } else {
        // Fallback для браузеров без requestIdleCallback
        setTimeout(() => {
          if (cancelled) return
          fetch('/api/team', {
            headers: {
              'Cache-Control': 'max-age=300'
            }
          })
            .then(res => res.json())
            .then(data => {
              if (!cancelled) {
                setTeamMembers(data || [])
                sessionStorage.setItem(cacheKey, JSON.stringify(data))
                sessionStorage.setItem(`${cacheKey}_time`, now.toString())
              }
            })
            .catch(err => {
              if (!cancelled) {
                console.error('Ошибка загрузки команды:', err)
              }
            })
        }, 1000)
      }
    }
    
    // Загружаем после полной загрузки страницы
    if (document.readyState === 'complete') {
      loadTeam()
    } else {
      window.addEventListener('load', loadTeam, { once: true })
    }
    
    return () => {
      cancelled = true
      window.removeEventListener('load', loadTeam)
    }
  }, [])
  
  // Мемоизированные данные для статистики
  const stats = useMemo(() => [
    { icon: Users, value: '10K+', label: 'Довольних клієнтів', delay: 0 },
    { icon: Award, value: '5+', label: 'Років досвіду', delay: 0.1 },
    { icon: Zap, value: '30', label: 'Хвилин доставка', delay: 0.2 },
    { icon: Heart, value: '100%', label: 'Якість', delay: 0.3 }
  ], [])
  
  // Мемоизированные данные для особенностей
  const features = useMemo(() => [
    { icon: Star, title: 'Свіжі інгредієнти', text: 'Використовуємо тільки найсвіжішу рибу та найкращі продукти для наших страв', delay: 0 },
    { icon: Zap, title: 'Швидка доставка', text: 'Доставляємо ваші улюблені страви в найкоротші терміни', delay: 0.15 },
    { icon: Award, title: 'Висока якість', text: 'Кожна страва готується з любов\'ю та увагою до деталей', delay: 0.3 },
    { icon: Heart, title: 'Наша місія', text: 'Зробити смачну їжу доступною та швидкою для кожного', delay: 0.45 }
  ], [])
  
  // Мемоизированные данные для контактов
  const contacts = useMemo(() => [
    { icon: MapPin, title: 'Адреса', text: 'м. Амстердам, Нидерланды', delay: 0 },
    { icon: Clock, title: 'Режим роботи', text: 'Пн-Нд: 14:00 - 21:00', delay: 0.2 },
    { icon: Phone, title: 'Контакти', text: '+38 (067) 436 61 27', delay: 0.4 }
  ], [])

  return (
    <div 
      ref={containerRef}
      className="relative pb-10" 
      id="about-page-container"
      style={{
        minHeight: '100vh',
        position: 'relative',
        width: '100%',
        height: 'auto',
        overflow: 'visible'
      }}
    >
      <LogoBackground />
      <div className="relative z-10" style={{ width: '100%', minHeight: '100vh' }}>
        {/* Обновленная шапка */}
        <div className="bg-gradient-to-r from-white via-gray-50/80 to-white backdrop-blur-xl p-4 sticky top-0 z-20 shadow-lg shadow-[#145142]/5 border-b border-[#145142]/10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack} 
              className="p-2.5 hover:bg-[#145142]/10 rounded-xl transition-all duration-300 group"
              style={{
                background: 'linear-gradient(135deg, rgba(20,81,66,0.05) 0%, rgba(20,81,66,0.02) 100%)',
                border: '1.5px solid rgba(20,81,66,0.1)'
              }}
            >
              <ArrowLeft size={22} className="text-[#145142] group-hover:scale-110 transition-transform" />
            </button>
            <h1 
              className="text-2xl font-black"
              style={{
                background: 'linear-gradient(135deg, #145142 0%, #1a6b58 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                letterSpacing: '-0.5px'
              }}
            >
              Про нас
            </h1>
          </div>
          
          <button 
            onClick={onMenuClick} 
            className="p-2.5 hover:bg-[#145142]/10 rounded-xl transition-all duration-300 group"
            style={{
              background: 'linear-gradient(135deg, rgba(20,81,66,0.05) 0%, rgba(20,81,66,0.02) 100%)',
              border: '1.5px solid rgba(20,81,66,0.1)'
            }}
          >
            <Menu size={22} className="text-[#145142] group-hover:scale-110 transition-transform" />
          </button>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-8">
          {/* Hero секция */}
          <div className="text-center mb-12 mt-8" style={{
            animation: 'fadeInDown 1s ease-out',
            contentVisibility: 'auto'
          }}>
            <div 
              className="inline-block mb-6 p-4 rounded-2xl" 
              style={{
                background: 'linear-gradient(135deg, rgba(20,81,66,0.1) 0%, rgba(20,81,66,0.05) 100%)',
                border: '2px solid rgba(20,81,66,0.15)',
                boxShadow: '0 8px 24px rgba(20,81,66,0.15)',
                animation: 'zoomIn 0.8s ease-out 0.3s both, float 3s ease-in-out infinite 1.5s'
              }}
            >
              <Image 
                src="/logo.png" 
                alt="Watta Sushi Logo" 
                width={80} 
                height={80} 
                className="object-contain" 
                style={{
                  animation: 'rotateIn 1s ease-out 0.5s both'
                }}
                priority
                quality={90}
              />
            </div>
            <h2 
              className="text-4xl sm:text-5xl font-black mb-4"
              style={{
                background: 'linear-gradient(135deg, #145142 0%, #1a6b58 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                letterSpacing: '-1px',
                animation: 'slideInLeft 0.8s ease-out 0.6s both'
              }}
            >
              Watta Sushi
            </h2>
            <p className="text-xl font-bold text-gray-700 mb-2" style={{
              animation: 'slideInRight 0.8s ease-out 0.8s both'
            }}>Доставка японской кухни нового поколения</p>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto" style={{
              animation: 'fadeInUp 0.8s ease-out 1s both'
            }}>
              Ми готуємо суші та роли тільки зі свіжішої риби, використовуємо справжній рис та не шкодуємо начинки.
            </p>
          </div>

          {/* Статистика */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12" style={{ contentVisibility: 'auto' }}>
            {stats.map((stat, index) => (
              <StatCard key={index} {...stat} />
            ))}
          </div>

          {/* Особливості */}
          <div className="mb-12" style={{ contentVisibility: 'auto' }}>
            <h3 
              className="text-2xl font-black text-[#145142] mb-6 text-center"
              style={{
                animation: 'fadeInDown 0.8s ease-out'
              }}
            >
              Чому обирають нас?
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <FeatureCard key={index} {...feature} />
              ))}
            </div>
          </div>

          {/* Команда */}
          {teamMembers.length > 0 && (
            <div className="mb-12" style={{ contentVisibility: 'auto' }}>
              <h3 
                className="text-2xl font-black text-[#145142] mb-6 text-center"
                style={{
                  animation: 'fadeInDown 0.8s ease-out 0.5s both'
                }}
              >
                Наша команда
              </h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {teamMembers.map((member, index) => (
                  <div
                    key={member.id}
                    className="bg-white rounded-2xl p-6 border-2 border-[#145142]/10 shadow-lg shadow-[#145142]/5 hover:shadow-xl hover:shadow-[#145142]/15 transition-all duration-500 hover:-translate-y-3 hover:scale-105 group"
                    style={{
                      background: 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
                      animation: `fadeInUp 0.7s ease-out ${0.6 + index * 0.15}s both`,
                      willChange: 'transform, opacity'
                    }}
                  >
                    <div className="relative mb-4 overflow-hidden rounded-xl" style={{
                      width: '100%',
                      paddingTop: '100%',
                      background: 'linear-gradient(135deg, rgba(20,81,66,0.1) 0%, rgba(20,81,66,0.05) 100%)'
                    }}>
                      {member.imageUrl ? (
                        <Image
                          src={member.imageUrl}
                          alt={getLocalized(member, 'name') || member.name_ru}
                          fill
                          className="object-cover rounded-xl group-hover:scale-110 transition-transform duration-500"
                          style={{
                            animation: `zoomIn 0.8s ease-out ${0.7 + index * 0.15}s both`
                          }}
                          loading="lazy"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          quality={85}
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#145142] to-[#1a6b58] rounded-xl">
                          <Users size={48} className="text-white opacity-50" />
                        </div>
                      )}
                    </div>
                    <h4 className="text-xl font-black text-gray-900 mb-1 text-center">
                      {getLocalized(member, 'name') || member.name_ru}
                    </h4>
                    <p className="text-[#145142] font-semibold text-center mb-3">
                      {getLocalized(member, 'position') || member.position_ru}
                    </p>
                    {getLocalized(member, 'bio') && (
                      <p className="text-gray-600 text-sm text-center">
                        {getLocalized(member, 'bio')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Контактна інформація */}
          <div className="grid sm:grid-cols-3 gap-4" style={{ contentVisibility: 'auto' }}>
            {contacts.map((contact, index) => (
              <ContactCard key={index} {...contact} />
            ))}
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translate3d(0, 30px, 0);
          }
          to {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }
        }
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translate3d(0, -30px, 0);
          }
          to {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }
        }
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translate3d(-50px, 0, 0);
          }
          to {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }
        }
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translate3d(50px, 0, 0);
          }
          to {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }
        }
        @keyframes zoomIn {
          from {
            opacity: 0;
            transform: scale3d(0.8, 0.8, 1);
          }
          to {
            opacity: 1;
            transform: scale3d(1, 1, 1);
          }
        }
        @keyframes rotateIn {
          from {
            opacity: 0;
            transform: rotate3d(0, 0, 1, -180deg) scale3d(0.5, 0.5, 1);
          }
          to {
            opacity: 1;
            transform: rotate3d(0, 0, 1, 0deg) scale3d(1, 1, 1);
          }
        }
        @keyframes float {
          0%, 100% {
            transform: translate3d(0, 0, 0);
          }
          50% {
            transform: translate3d(0, -10px, 0);
          }
        }
        @keyframes pulse {
          0%, 100% {
            transform: scale3d(1, 1, 1);
            box-shadow: 0 4px 12px rgba(20,81,66,0.3);
          }
          50% {
            transform: scale3d(1.05, 1.05, 1);
            box-shadow: 0 6px 20px rgba(20,81,66,0.4);
          }
        }
        @keyframes countUp {
          from {
            opacity: 0;
            transform: scale3d(0.5, 0.5, 1);
          }
          to {
            opacity: 1;
            transform: scale3d(1, 1, 1);
          }
        }
        @keyframes bounceIn {
          0% {
            opacity: 0;
            transform: scale3d(0.3, 0.3, 1);
          }
          50% {
            opacity: 1;
            transform: scale3d(1.05, 1.05, 1);
          }
          70% {
            transform: scale3d(0.9, 0.9, 1);
          }
          100% {
            transform: scale3d(1, 1, 1);
          }
        }
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translate3d(0, 50px, 0);
          }
          to {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale3d(0.8, 0.8, 1);
          }
          to {
            opacity: 1;
            transform: scale3d(1, 1, 1);
          }
        }
      `}</style>
    </div>
  )
}

export default memo(AboutView)