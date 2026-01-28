'use client'

import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, MapPin, X } from 'lucide-react'
import Image from 'next/image'

interface Country {
  id: number
  name: string
  name_en?: string
  name_nl?: string
  flag?: string
  code: string
  isActive: boolean
  cities?: City[]
}

interface City {
  id: number
  name: string
  name_nl?: string
  name_en?: string
  countryId: number
  latitude?: number
  longitude?: number
  zoom?: number
  isActive: boolean
}

interface CountryCitySelectorProps {
  onCityChange?: (cityId: number) => void
}

export const CountryCitySelector: React.FC<CountryCitySelectorProps> = ({ onCityChange }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [countries, setCountries] = useState<Country[]>([])
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null)
  const [selectedCity, setSelectedCity] = useState<City | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  // Проверка монтирования компонента для Portal
  useEffect(() => {
    setMounted(true)
  }, [])

  // Загрузка стран и городов
  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch('/api/countries')
        if (res.ok) {
          const data = await res.json()
          console.log('Загружены страны:', data)
          setCountries(data || [])
          
          // Проверяем, есть ли сохранённый город
          if (typeof window !== 'undefined' && window.localStorage) {
            const savedCityId = localStorage.getItem('selectedCityId')
            if (savedCityId) {
              const cityId = parseInt(savedCityId)
              // Ищем город в загруженных данных
              for (const country of data) {
                if (country.cities) {
                  const city = country.cities.find((c: City) => c.id === cityId)
                  if (city) {
                    setSelectedCountry(country)
                    setSelectedCity(city)
                    onCityChange?.(city.id)
                    setLoading(false)
                    return
                  }
                }
              }
            }
          }
          
          // Если сохранённого города нет, выбираем первую страну и первый город по умолчанию
          if (data.length > 0) {
            const firstCountry = data[0]
            setSelectedCountry(firstCountry)
            if (firstCountry.cities && firstCountry.cities.length > 0) {
              const firstCity = firstCountry.cities[0]
              setSelectedCity(firstCity)
              // Сохраняем выбранный город в localStorage
              if (typeof window !== 'undefined' && window.localStorage) {
                localStorage.setItem('selectedCityId', firstCity.id.toString())
              }
              onCityChange?.(firstCity.id)
            }
          }
        } else {
          console.error('Ошибка загрузки стран:', res.status, res.statusText)
          setCountries([])
        }
      } catch (error) {
        console.error('Ошибка загрузки стран и городов:', error)
        setCountries([])
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [onCityChange])


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      const clickedOutsideButton = dropdownRef.current && !dropdownRef.current.contains(target)
      const clickedOutsideModal = modalRef.current && !modalRef.current.contains(target)
      
      // Закрываем модальное окно, если клик был вне кнопки и модального окна
      if (isOpen && clickedOutsideButton && clickedOutsideModal) {
        setIsOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
      // Блокируем скролл body при открытом модальном окне
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country)
    // При выборе страны сбрасываем выбранный город, если он не из этой страны
    if (selectedCity && selectedCity.countryId !== country.id) {
      setSelectedCity(null)
    }
  }
  
  // Фильтрация стран и городов (без поиска, показываем все активные)
  const filteredCountries = countries.filter((country) => country.isActive)
  
  const filteredCities = selectedCountry?.cities?.filter((city) => city.isActive) || []

  const handleCitySelect = (city: City) => {
    setSelectedCity(city)
    setIsOpen(false)
    
    // Сохраняем выбранный город
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('selectedCityId', city.id.toString())
    }
    
    onCityChange?.(city.id)
    
    // Отправляем событие для обновления меню
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cityChanged', { detail: { cityId: city.id } }))
    }
  }

  const handleClose = () => {
    setIsOpen(false)
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '8px 14px',
        borderRadius: '20px',
        background: 'linear-gradient(135deg, rgba(20,81,66,0.15) 0%, rgba(20,81,66,0.1) 100%)',
        fontSize: '12px',
        fontWeight: '700',
        color: '#145142',
        boxShadow: '0 2px 6px rgba(20,81,66,0.2), inset 0 1px 0 rgba(255,255,255,0.4)',
        backdropFilter: 'blur(8px)',
        minWidth: '120px'
      }}>
        <div style={{
          width: '12px',
          height: '12px',
          border: '2px solid rgba(20,81,66,0.3)',
          borderTop: '2px solid #145142',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        Загрузка...
      </div>
    )
  }

  const displayText = selectedCity 
    ? `${selectedCountry?.flag || '🌍'}`
    : selectedCountry 
    ? `${selectedCountry.flag || '🌍'}`
    : '🌍'

  return (
    <div 
      ref={dropdownRef}
      style={{ 
        position: 'relative',
        zIndex: 1
      }}
    >
      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setIsOpen(true)
        }}
        type="button"
        style={{
          background: 'transparent',
          border: 'none',
          fontSize: '14px',
          fontWeight: '500',
          color: '#333',
          cursor: 'pointer',
          padding: '4px 8px',
          borderRadius: '6px',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#145142'
          e.currentTarget.style.background = 'rgba(20,81,66,0.05)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = '#333'
          e.currentTarget.style.background = 'transparent'
        }}
      >
        <MapPin size={16} style={{ 
          color: '#145142',
          flexShrink: 0
        }} />
        <span style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>{displayText}</span>
        <ChevronDown 
          size={14} 
          style={{ 
            transition: 'transform 0.2s ease',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            flexShrink: 0
          }} 
        />
      </button>

      {isOpen && mounted && createPortal(
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999999,
            overflow: 'auto',
            padding: '20px',
            animation: 'countryCityModalFadeIn 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            isolation: 'isolate'
          }}
          onClick={handleClose}
        >
          <div
            ref={modalRef}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.99) 0%, rgba(250,252,251,0.98) 100%)',
              borderRadius: '28px',
              border: '2px solid rgba(20,81,66,0.1)',
              boxShadow: '0 30px 80px rgba(0,0,0,0.3), 0 15px 40px rgba(20,81,66,0.25), inset 0 1px 0 rgba(255,255,255,0.95), 0 0 0 1px rgba(20,81,66,0.05)',
              overflow: 'hidden',
              width: '100%',
              maxWidth: '680px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              margin: 'auto',
              position: 'relative',
              animation: 'countryCityModalSlideUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
              backdropFilter: 'blur(40px)'
            }}
          >
            {/* Заголовок модального окна */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '28px 32px',
              borderBottom: '2px solid rgba(20,81,66,0.08)',
              background: 'linear-gradient(135deg, rgba(20,81,66,0.08) 0%, rgba(20,81,66,0.03) 100%)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(90deg, transparent 0%, rgba(20,81,66,0.03) 50%, transparent 100%)',
                animation: 'shimmer 3s infinite'
              }} />
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                position: 'relative',
                zIndex: 1
              }}>
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(20,81,66,0.15), inset 0 1px 0 rgba(255,255,255,1), 0 0 0 2px rgba(20,81,66,0.1)',
                  position: 'relative',
                  overflow: 'hidden',
                  border: '2px solid #145142'
                }}>
                  <Image 
                    src="/logo.png" 
                    alt="Watta Sushi Logo" 
                    width={36} 
                    height={36} 
                    style={{ 
                      objectFit: 'contain',
                      position: 'relative',
                      zIndex: 1
                    }}
                  />
                </div>
                <div>
                  <h2 style={{
                    margin: 0,
                    fontSize: '24px',
                    fontWeight: '900',
                    background: 'linear-gradient(135deg, #145142 0%, #1a6b58 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    letterSpacing: '-0.8px',
                    textShadow: '0 2px 4px rgba(20,81,66,0.1)'
                  }}>
                    Вибір локації
                  </h2>
                  <p style={{
                    margin: '6px 0 0 0',
                    fontSize: '13px',
                    color: '#666',
                    fontWeight: '600',
                    letterSpacing: '-0.2px'
                  }}>
                    Оберіть країну та місто
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                style={{
                  padding: '12px',
                  border: '2px solid rgba(20,81,66,0.1)',
                  background: '#ffffff',
                  cursor: 'pointer',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                  color: '#666',
                  fontSize: '20px',
                  lineHeight: '1',
                  width: '44px',
                  height: '44px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  position: 'relative',
                  zIndex: 1
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(20,81,66,0.1) 0%, rgba(20,81,66,0.05) 100%)'
                  e.currentTarget.style.borderColor = '#145142'
                  e.currentTarget.style.color = '#145142'
                  e.currentTarget.style.transform = 'rotate(90deg) scale(1.15)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(20,81,66,0.2)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#ffffff'
                  e.currentTarget.style.borderColor = 'rgba(20,81,66,0.1)'
                  e.currentTarget.style.color = '#666'
                  e.currentTarget.style.transform = 'rotate(0deg) scale(1)'
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Контент модального окна */}
            <div style={{
              padding: '28px',
              overflowY: 'auto',
              flex: 1,
              minHeight: '200px',
              background: 'linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(250,252,251,1) 100%)'
            }}>
              {/* Секция выбора страны */}
              <div style={{ marginBottom: '36px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '18px'
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, rgba(20,81,66,0.1) 0%, rgba(20,81,66,0.05) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <MapPin size={16} color="#145142" />
                  </div>
                  <div style={{
                    fontSize: '18px',
                    fontWeight: '800',
                    color: '#145142',
                    letterSpacing: '-0.3px'
                  }}>
                    Країна
                  </div>
                </div>
                {loading ? (
                  <div style={{ 
                    padding: '40px', 
                    textAlign: 'center', 
                    color: '#666',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      border: '3px solid rgba(20,81,66,0.2)',
                      borderTop: '3px solid #145142',
                      borderRadius: '50%',
                      animation: 'countryCityModalSpin 0.8s linear infinite'
                    }} />
                    <span>Загрузка...</span>
                  </div>
                ) : !filteredCountries || filteredCountries.length === 0 ? (
                  <div style={{ 
                    padding: '40px', 
                    textAlign: 'center', 
                    color: '#666',
                    background: 'rgba(20,81,66,0.03)',
                    borderRadius: '12px',
                    border: '1px dashed rgba(20,81,66,0.15)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <div style={{ fontSize: '48px' }}>🌍</div>
                    <div style={{ fontSize: '18px', fontWeight: '700', color: '#145142', marginBottom: '8px' }}>
                      Немає доступних країн
                    </div>
                    <div style={{ fontSize: '14px', opacity: 0.8, maxWidth: '400px', lineHeight: '1.5' }}>
                      Будь ласка, додайте країни та міста через адмін-панель. 
                      Адміністратор може додати нові країни та міста в розділі "Страны и города".
                    </div>
                  </div>
                ) : (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                    gap: '10px'
                  }}>
                    {filteredCountries.map((country) => {
                      const isSelected = selectedCountry?.id === country.id
                      return (
                        <button
                          key={country.id}
                          onClick={() => handleCountrySelect(country)}
                          type="button"
                          style={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            padding: '14px 12px',
                            border: isSelected ? '2.5px solid #145142' : '2px solid #145142',
                            background: isSelected 
                              ? 'linear-gradient(135deg, #145142 0%, #1a6b58 100%)' 
                              : '#ffffff',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                            fontSize: '13px',
                            fontWeight: isSelected ? '700' : '600',
                            color: isSelected ? '#ffffff' : '#145142',
                            boxShadow: isSelected 
                              ? '0 6px 20px rgba(20,81,66,0.4), inset 0 1px 0 rgba(255,255,255,0.25), 0 0 0 3px rgba(20,81,66,0.1)' 
                              : '0 3px 10px rgba(20,81,66,0.12), inset 0 1px 0 rgba(255,255,255,1)',
                            textAlign: 'center',
                            width: '100%',
                            minHeight: '52px',
                            position: 'relative',
                            overflow: 'hidden'
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(20,81,66,0.05) 0%, rgba(20,81,66,0.02) 100%)'
                              e.currentTarget.style.borderColor = '#145142'
                              e.currentTarget.style.boxShadow = '0 5px 15px rgba(20,81,66,0.2), inset 0 1px 0 rgba(255,255,255,1)'
                              e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)'
                            } else {
                              e.currentTarget.style.boxShadow = '0 8px 25px rgba(20,81,66,0.45), inset 0 1px 0 rgba(255,255,255,0.25), 0 0 0 4px rgba(20,81,66,0.15)'
                              e.currentTarget.style.transform = 'translateY(-2px) scale(1.01)'
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.background = '#ffffff'
                              e.currentTarget.style.borderColor = '#145142'
                              e.currentTarget.style.boxShadow = '0 3px 10px rgba(20,81,66,0.12), inset 0 1px 0 rgba(255,255,255,1)'
                              e.currentTarget.style.transform = 'translateY(0) scale(1)'
                            } else {
                              e.currentTarget.style.boxShadow = '0 6px 20px rgba(20,81,66,0.4), inset 0 1px 0 rgba(255,255,255,0.25), 0 0 0 3px rgba(20,81,66,0.1)'
                              e.currentTarget.style.transform = 'translateY(0) scale(1)'
                            }
                          }}
                        >
                          <span style={{ 
                            fontSize: '16px',
                            flexShrink: 0
                          }}>
                            {country.flag || '🌍'}
                          </span>
                          <span style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            flex: 1
                          }}>
                            {country.name}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Секция выбора города */}
              {selectedCountry && (
                <div style={{ marginBottom: '36px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '18px'
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, rgba(20,81,66,0.1) 0%, rgba(20,81,66,0.05) 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <MapPin size={16} color="#145142" />
                    </div>
                    <div style={{
                      fontSize: '18px',
                      fontWeight: '800',
                      color: '#145142',
                      letterSpacing: '-0.3px'
                    }}>
                      Місто
                    </div>
                  </div>
                  {filteredCities.length === 0 ? (
                    <div style={{ 
                      padding: '40px', 
                      textAlign: 'center', 
                      color: '#666',
                      background: 'rgba(20,81,66,0.03)',
                      borderRadius: '12px',
                      border: '1px dashed rgba(20,81,66,0.15)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      {!selectedCountry.cities || selectedCountry.cities.length === 0 ? (
                        <>
                          <div style={{ fontSize: '48px' }}>🏙️</div>
                          <div style={{ fontSize: '18px', fontWeight: '700', color: '#145142', marginBottom: '8px' }}>
                            Немає доступних міст для {selectedCountry.flag || ''} {selectedCountry.name}
                          </div>
                          <div style={{ fontSize: '14px', opacity: 0.8, maxWidth: '400px', lineHeight: '1.5' }}>
                            Будь ласка, додайте міста для цієї країни через адмін-панель в розділі "Страны и города".
                          </div>
                        </>
                      ) : (
                        <>
                          <div style={{ fontSize: '32px' }}>⚠️</div>
                          <div style={{ fontSize: '16px', fontWeight: '600' }}>Немає активних міст</div>
                          <div style={{ fontSize: '14px', opacity: 0.7 }}>Активуйте міста через адмін-панель</div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                      gap: '10px'
                    }}>
                      {filteredCities.map((city) => {
                        const isSelected = selectedCity?.id === city.id
                        return (
                          <button
                            key={city.id}
                            onClick={() => handleCitySelect(city)}
                            type="button"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '14px 12px',
                              border: isSelected ? '2.5px solid #145142' : '2px solid #145142',
                              background: isSelected 
                                ? 'linear-gradient(135deg, #145142 0%, #1a6b58 100%)' 
                                : '#ffffff',
                              borderRadius: '12px',
                              cursor: 'pointer',
                              transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                              fontSize: '13px',
                              fontWeight: isSelected ? '700' : '600',
                              color: isSelected ? '#ffffff' : '#145142',
                              boxShadow: isSelected 
                                ? '0 6px 20px rgba(20,81,66,0.4), inset 0 1px 0 rgba(255,255,255,0.25), 0 0 0 3px rgba(20,81,66,0.1)' 
                                : '0 3px 10px rgba(20,81,66,0.12), inset 0 1px 0 rgba(255,255,255,1)',
                              textAlign: 'center',
                              width: '100%',
                              minHeight: '52px',
                              position: 'relative',
                              overflow: 'hidden'
                            }}
                            onMouseEnter={(e) => {
                              if (!isSelected) {
                                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(20,81,66,0.05) 0%, rgba(20,81,66,0.02) 100%)'
                                e.currentTarget.style.borderColor = '#145142'
                                e.currentTarget.style.boxShadow = '0 5px 15px rgba(20,81,66,0.2), inset 0 1px 0 rgba(255,255,255,1)'
                                e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)'
                              } else {
                                e.currentTarget.style.boxShadow = '0 8px 25px rgba(20,81,66,0.45), inset 0 1px 0 rgba(255,255,255,0.25), 0 0 0 4px rgba(20,81,66,0.15)'
                                e.currentTarget.style.transform = 'translateY(-2px) scale(1.01)'
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isSelected) {
                                e.currentTarget.style.background = '#ffffff'
                                e.currentTarget.style.borderColor = '#145142'
                                e.currentTarget.style.boxShadow = '0 3px 10px rgba(20,81,66,0.12), inset 0 1px 0 rgba(255,255,255,1)'
                                e.currentTarget.style.transform = 'translateY(0) scale(1)'
                              } else {
                                e.currentTarget.style.boxShadow = '0 6px 20px rgba(20,81,66,0.4), inset 0 1px 0 rgba(255,255,255,0.25), 0 0 0 3px rgba(20,81,66,0.1)'
                                e.currentTarget.style.transform = 'translateY(0) scale(1)'
                              }
                            }}
                          >
                            <span style={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              flex: 1
                            }}>
                              {city.name}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  )
}
