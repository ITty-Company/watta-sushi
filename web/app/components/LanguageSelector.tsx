'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { ChevronDown } from 'lucide-react'

export const LanguageSelector = () => {
  const { language, setLanguage } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const languages = [
    { code: 'uk', label: 'UA', flag: '🇺🇦', name: 'Українська' },
    { code: 'ru', label: 'RU', flag: '🇷🇺', name: 'Русский' },
    { code: 'en', label: 'EN', flag: '🇬🇧', name: 'English' },
    { code: 'nl', label: 'NL', flag: '🇳🇱', name: 'Nederlands' },
  ] as const

  const currentLang = languages.find(lang => lang.code === language) || languages[0]

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div 
      ref={dropdownRef}
      style={{ 
        position: 'relative',
        zIndex: 1000
      }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '5px',
          padding: '6px 12px',
          borderRadius: '20px',
          border: 'none',
          background: 'linear-gradient(135deg, rgba(20,81,66,0.15) 0%, rgba(20,81,66,0.1) 100%)',
          cursor: 'pointer',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          fontSize: '12px',
          fontWeight: '800',
          color: '#145142',
          boxShadow: '0 2px 6px rgba(20,81,66,0.2), inset 0 1px 0 rgba(255,255,255,0.4)',
          backdropFilter: 'blur(8px)',
          minWidth: '68px',
          position: 'relative',
          overflow: 'hidden'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(20,81,66,0.25) 0%, rgba(20,81,66,0.18) 100%)'
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(20,81,66,0.3), inset 0 1px 0 rgba(255,255,255,0.5)'
          e.currentTarget.style.transform = 'scale(1.08)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(20,81,66,0.15) 0%, rgba(20,81,66,0.1) 100%)'
          e.currentTarget.style.boxShadow = '0 2px 6px rgba(20,81,66,0.2), inset 0 1px 0 rgba(255,255,255,0.4)'
          e.currentTarget.style.transform = 'scale(1)'
        }}
      >
        <span style={{ 
          fontSize: '18px',
          lineHeight: '1',
          filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.2))'
        }}>{currentLang.flag}</span>
        <span style={{
          letterSpacing: '0.3px',
          textShadow: '0 1px 1px rgba(255,255,255,0.6)'
        }}>{currentLang.label}</span>
        <ChevronDown 
          size={11} 
          style={{ 
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            opacity: 0.85,
            marginLeft: '2px'
          }} 
        />
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 10px)',
            right: 0,
            background: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(250,251,252,0.96) 50%, rgba(245,247,250,0.98) 100%)',
            borderRadius: '14px',
            border: '1.5px solid rgba(20,81,66,0.12)',
            boxShadow: '0 12px 32px rgba(0,0,0,0.15), 0 4px 16px rgba(20,81,66,0.1), inset 0 1px 0 rgba(255,255,255,0.9)',
            backdropFilter: 'blur(24px)',
            overflow: 'hidden',
            minWidth: '150px',
            zIndex: 1001,
            animation: 'fadeIn 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                setLanguage(lang.code as any)
                setIsOpen(false)
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 16px',
                border: 'none',
                background: language === lang.code 
                  ? 'linear-gradient(135deg, rgba(20,81,66,0.12) 0%, rgba(20,81,66,0.08) 100%)' 
                  : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                fontSize: '13px',
                fontWeight: language === lang.code ? '700' : '500',
                color: language === lang.code ? '#145142' : '#333',
                textAlign: 'left',
                borderLeft: language === lang.code ? '3px solid #145142' : '3px solid transparent',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                if (language !== lang.code) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(20,81,66,0.08) 0%, rgba(20,81,66,0.04) 100%)'
                  e.currentTarget.style.color = '#145142'
                  e.currentTarget.style.transform = 'translateX(2px)'
                }
              }}
              onMouseLeave={(e) => {
                if (language !== lang.code) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = '#333'
                  e.currentTarget.style.transform = 'translateX(0)'
                }
              }}
            >
              <span style={{ 
                fontSize: '20px',
                filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))'
              }}>{lang.flag}</span>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px', flex: 1 }}>
                <span style={{ fontWeight: language === lang.code ? '700' : '600' }}>{lang.label}</span>
                <span style={{ fontSize: '11px', opacity: 0.65, fontWeight: '400' }}>{lang.name}</span>
              </div>
              {language === lang.code && (
                <div style={{ 
                  marginLeft: 'auto', 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  background: 'linear-gradient(135deg, #145142 0%, #1a6b58 100%)',
                  boxShadow: '0 2px 4px rgba(20,81,66,0.4)'
                }} />
              )}
            </button>
          ))}
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}