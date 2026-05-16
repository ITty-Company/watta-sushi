'use client'

import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useLanguage } from '../context/LanguageContext'

type LanguageSelectorProps = {
  /** Компактна кнопка в боковому меню */
  variant?: 'default' | 'drawer'
}

export const LanguageSelector = ({ variant = 'default' }: LanguageSelectorProps) => {
  const { language, setLanguage } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [position, setPosition] = useState({ top: 0, right: 0 })

  const languages = [
    { code: 'uk', label: 'UA', flag: '🇺🇦', name: 'Українська' },
    { code: 'ru', label: 'RU', flag: '🇷🇺', name: 'Русский' },
    { code: 'en', label: 'EN', flag: '🇬🇧', name: 'English' },
    { code: 'nl', label: 'NL', flag: '🇳🇱', name: 'Nederlands' },
  ] as const

  const currentLang = languages.find(lang => lang.code === language) || languages[0]

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setPosition({
        top: rect.bottom + window.scrollY + 12,
        right: window.innerWidth - rect.right
      })
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const isDrawer = variant === 'drawer'

  return (
    <div
      className={isDrawer ? 'relative z-[1] block h-full w-full' : undefined}
      style={
        isDrawer
          ? undefined
          : {
              position: 'relative',
              zIndex: 9999,
            }
      }
    >
      <button
        ref={buttonRef}
        type="button"
        className={isDrawer ? 'watta-nav-lang-btn' : undefined}
        onClick={() => setIsOpen(!isOpen)}
        style={
          isDrawer
            ? undefined
            : {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '10px 16px',
                borderRadius: '14px',
                border: '2px solid #145142',
                background: '#ffffff',
                cursor: 'pointer',
                transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                fontSize: '14px',
                fontWeight: '600',
                color: '#145142',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 3px 10px rgba(20,81,66,0.12), inset 0 1px 0 rgba(255,255,255,1)',
                overflow: 'hidden',
              }
        }
        onMouseEnter={
          isDrawer
            ? undefined
            : (e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #145142 0%, #1a6b58 100%)'
                e.currentTarget.style.color = '#ffffff'
                e.currentTarget.style.borderColor = '#145142'
                e.currentTarget.style.boxShadow =
                  '0 6px 20px rgba(20,81,66,0.35), inset 0 1px 0 rgba(255,255,255,0.2), 0 0 0 3px rgba(20,81,66,0.1)'
                e.currentTarget.style.transform = 'translateY(-3px) scale(1.05)'
              }
        }
        onMouseLeave={
          isDrawer
            ? undefined
            : (e) => {
                e.currentTarget.style.background = '#ffffff'
                e.currentTarget.style.color = '#145142'
                e.currentTarget.style.borderColor = '#145142'
                e.currentTarget.style.boxShadow =
                  '0 3px 10px rgba(20,81,66,0.12), inset 0 1px 0 rgba(255,255,255,1)'
                e.currentTarget.style.transform = 'translateY(0) scale(1)'
              }
        }
      >
        <span
          style={
            isDrawer
              ? undefined
              : {
                  letterSpacing: '0.3px',
                  fontWeight: '600',
                }
          }
        >
          {currentLang.label}
        </span>
      </button>

      {isOpen && mounted && createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: 'fixed',
            top: `${position.top}px`,
            right: `${position.right}px`,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.99) 0%, rgba(250,252,251,0.98) 100%)',
            borderRadius: '16px',
            border: '2px solid rgba(20,81,66,0.12)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.25), 0 8px 24px rgba(20,81,66,0.2), inset 0 1px 0 rgba(255,255,255,0.95)',
            backdropFilter: 'blur(40px)',
            overflow: 'hidden',
            minWidth: '160px',
            zIndex: 10000,
            animation: 'fadeIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
            padding: '8px',
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '6px'
          }}
        >
          {languages.map((lang, index) => (
            <button
              key={lang.code}
              onClick={() => {
                setLanguage(lang.code as any)
                setIsOpen(false)
              }}
              style={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '10px 8px',
                border: language === lang.code 
                  ? '2px solid #145142' 
                  : '1.5px solid rgba(20,81,66,0.15)',
                background: language === lang.code 
                  ? 'linear-gradient(135deg, #145142 0%, #1a6b58 100%)' 
                  : 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
                cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                fontSize: '13px',
                fontWeight: language === lang.code ? '800' : '700',
                color: language === lang.code ? '#ffffff' : '#145142',
                textAlign: 'center',
                borderRadius: '12px',
                position: 'relative',
                boxShadow: language === lang.code 
                  ? '0 6px 20px rgba(20,81,66,0.4), inset 0 1px 0 rgba(255,255,255,0.25), 0 0 0 3px rgba(20,81,66,0.1)' 
                  : '0 3px 10px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,1)',
                overflow: 'hidden',
                animation: `slideIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 0.08}s both`
              }}
              onMouseEnter={(e) => {
                if (language !== lang.code) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(20,81,66,0.12) 0%, rgba(20,81,66,0.06) 100%)'
                  e.currentTarget.style.borderColor = 'rgba(20,81,66,0.4)'
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(20,81,66,0.2), inset 0 1px 0 rgba(255,255,255,1)'
                  e.currentTarget.style.transform = 'translateY(-4px) scale(1.05) rotate(2deg)'
                } else {
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(20,81,66,0.5), inset 0 1px 0 rgba(255,255,255,0.25), 0 0 0 4px rgba(20,81,66,0.15)'
                  e.currentTarget.style.transform = 'translateY(-4px) scale(1.05) rotate(-2deg)'
                }
              }}
              onMouseLeave={(e) => {
                if (language !== lang.code) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)'
                  e.currentTarget.style.borderColor = 'rgba(20,81,66,0.15)'
                  e.currentTarget.style.boxShadow = '0 3px 10px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,1)'
                  e.currentTarget.style.transform = 'translateY(0) scale(1) rotate(0deg)'
                } else {
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(20,81,66,0.4), inset 0 1px 0 rgba(255,255,255,0.25), 0 0 0 3px rgba(20,81,66,0.1)'
                  e.currentTarget.style.transform = 'translateY(0) scale(1) rotate(0deg)'
                }
              }}
            >
              {/* Декоративный градиент на фоне */}
              {language === lang.code && (
                <div style={{
                  position: 'absolute',
                  top: '-50%',
                  left: '-50%',
                  width: '200%',
                  height: '200%',
                  background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.2) 50%, transparent 70%)',
                  animation: 'shine 3s infinite'
                }} />
              )}
              <span style={{ 
                fontWeight: language === lang.code ? '800' : '700',
                fontSize: '14px',
                letterSpacing: '0.5px',
                position: 'relative',
                zIndex: 1,
                textShadow: language === lang.code ? '0 1px 2px rgba(0,0,0,0.2)' : 'none'
              }}>{lang.label}</span>
              {language === lang.code && (
                <div style={{ 
                  position: 'relative',
                  zIndex: 1,
                  width: '16px', 
                  height: '16px', 
                  borderRadius: '50%', 
                  background: 'rgba(255,255,255,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.5), 0 1px 2px rgba(0,0,0,0.2)',
                  animation: 'pulse 2s ease-in-out infinite'
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#ffffff',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                  }} />
                </div>
              )}
            </button>
          ))}
        </div>,
        document.body
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-12px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.8) rotate(-5deg);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1) rotate(0deg);
          }
        }
        @keyframes shine {
          0% {
            transform: translateX(-100%) translateY(-100%) rotate(45deg);
          }
          100% {
            transform: translateX(100%) translateY(100%) rotate(45deg);
          }
        }
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  )
}