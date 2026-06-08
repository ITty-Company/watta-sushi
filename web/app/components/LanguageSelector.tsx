'use client'

import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { WattaLanguage } from '@/lib/i18n/language'
import { useLanguage } from '../context/LanguageContext'

type LanguageSelectorProps = {
  /** Компактна кнопка в боковому меню */
  variant?: 'default' | 'drawer'
}

const LANGUAGE_OPTIONS = [
  { code: 'uk', label: 'UA', flag: '🇺🇦', name: 'Українська' },
  { code: 'ru', label: 'RU', flag: '🇷🇺', name: 'Русский' },
  { code: 'en', label: 'EN', flag: '🇬🇧', name: 'English' },
  { code: 'nl', label: 'NL', flag: '🇳🇱', name: 'Nederlands' },
] as const

export const LanguageSelector = ({ variant = 'default' }: LanguageSelectorProps) => {
  const { language, setLanguage } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [position, setPosition] = useState<{ top: number; right: number } | null>(null)

  const currentLang = LANGUAGE_OPTIONS.find((lang) => lang.code === language) || LANGUAGE_OPTIONS[0]

  const pickLanguage = (code: WattaLanguage) => {
    setLanguage(code)
    setIsOpen(false)
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!isOpen) {
      setPosition(null)
      return
    }

    // Дропдаун рендериться через position: fixed, тож координати рахуємо
    // відносно viewport (без scrollY) і перераховуємо на скрол/ресайз,
    // щоб він не «з'їжджав» від кнопки.
    const updatePosition = () => {
      const button = buttonRef.current
      if (!button) return
      const rect = button.getBoundingClientRect()
      setPosition({
        top: rect.bottom + 12,
        right: window.innerWidth - rect.right,
      })
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    updatePosition()
    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [isOpen])

  const isDrawer = variant === 'drawer'

  const languageGrid = (
    <>
      {LANGUAGE_OPTIONS.map((lang, index) => (
        <button
          key={lang.code}
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            pickLanguage(lang.code)
          }}
          style={
            isDrawer
              ? undefined
              : {
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '10px 8px',
                  border:
                    language === lang.code
                      ? '1.5px solid rgba(20,81,66,0.32)'
                      : '1.5px solid rgba(20,81,66,0.15)',
                  background:
                    language === lang.code
                      ? 'color-mix(in srgb, #145142 12%, #ffffff)'
                      : 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
                  cursor: 'pointer',
                  transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  fontSize: '13px',
                  fontWeight: language === lang.code ? '800' : '700',
                  color: '#145142',
                  textAlign: 'center',
                  borderRadius: '12px',
                  position: 'relative',
                  boxShadow:
                    language === lang.code
                      ? 'none'
                      : '0 3px 10px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,1)',
                  overflow: 'hidden',
                  animation: `slideIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 0.08}s both`,
                }
          }
          className={isDrawer ? 'watta-nav-lang-dropdown__opt' : undefined}
          data-active={language === lang.code ? '1' : '0'}
          onMouseEnter={
            isDrawer
              ? undefined
              : (e) => {
                  if (language !== lang.code) {
                    e.currentTarget.style.background =
                      'linear-gradient(135deg, rgba(20,81,66,0.12) 0%, rgba(20,81,66,0.06) 100%)'
                    e.currentTarget.style.borderColor = 'rgba(20,81,66,0.4)'
                    e.currentTarget.style.boxShadow =
                      '0 6px 20px rgba(20,81,66,0.2), inset 0 1px 0 rgba(255,255,255,1)'
                    e.currentTarget.style.transform = 'translateY(-4px) scale(1.05) rotate(2deg)'
                  } else {
                    e.currentTarget.style.boxShadow =
                      '0 8px 25px rgba(20,81,66,0.5), inset 0 1px 0 rgba(255,255,255,0.25), 0 0 0 4px rgba(20,81,66,0.15)'
                    e.currentTarget.style.transform = 'translateY(-4px) scale(1.05) rotate(-2deg)'
                  }
                }
          }
          onMouseLeave={
            isDrawer
              ? undefined
              : (e) => {
                  if (language !== lang.code) {
                    e.currentTarget.style.background =
                      'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)'
                    e.currentTarget.style.borderColor = 'rgba(20,81,66,0.15)'
                    e.currentTarget.style.boxShadow =
                      '0 3px 10px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,1)'
                    e.currentTarget.style.transform = 'translateY(0) scale(1) rotate(0deg)'
                  } else {
                    e.currentTarget.style.boxShadow =
                      '0 6px 20px rgba(20,81,66,0.4), inset 0 1px 0 rgba(255,255,255,0.25), 0 0 0 3px rgba(20,81,66,0.1)'
                    e.currentTarget.style.transform = 'translateY(0) scale(1) rotate(0deg)'
                  }
                }
          }
        >
          {!isDrawer && language === lang.code && (
            <div
              style={{
                position: 'absolute',
                top: '-50%',
                left: '-50%',
                width: '200%',
                height: '200%',
                background:
                  'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.2) 50%, transparent 70%)',
                animation: 'shine 3s infinite',
              }}
            />
          )}
          <span
            style={
              isDrawer
                ? undefined
                : {
                    fontWeight: language === lang.code ? '800' : '700',
                    fontSize: '14px',
                    letterSpacing: '0.5px',
                    position: 'relative',
                    zIndex: 1,
                    textShadow: language === lang.code ? '0 1px 2px rgba(0,0,0,0.2)' : 'none',
                  }
            }
          >
            {lang.label}
          </span>
          {!isDrawer && language === lang.code && (
            <div
              style={{
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
                animation: 'pulse 2s ease-in-out infinite',
              }}
            >
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#ffffff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                }}
              />
            </div>
          )}
        </button>
      ))}
    </>
  )

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
        className={isDrawer ? 'watta-nav-lang-btn' : 'header-lang-btn-web'}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen((open) => !open)
        }}
      >
        <span className={isDrawer ? undefined : 'header-lang-label-web'}>
          {currentLang.label}
        </span>
      </button>

      {isOpen && isDrawer ? (
        <div ref={dropdownRef} className="watta-nav-lang-dropdown" role="listbox" aria-label="Language">
          {languageGrid}
        </div>
      ) : null}

      {isOpen &&
        mounted &&
        !isDrawer &&
        position &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: 'fixed',
              top: `${position.top}px`,
              right: `${position.right}px`,
              background:
                'linear-gradient(135deg, rgba(255,255,255,0.99) 0%, rgba(250,252,251,0.98) 100%)',
              borderRadius: '16px',
              border: '2px solid rgba(20,81,66,0.12)',
              boxShadow:
                '0 20px 50px rgba(0,0,0,0.25), 0 8px 24px rgba(20,81,66,0.2), inset 0 1px 0 rgba(255,255,255,0.95)',
              overflow: 'hidden',
              minWidth: '160px',
              zIndex: 11160,
              animation: 'fadeIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
              padding: '8px',
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '6px',
            }}
          >
            {languageGrid}
          </div>,
          document.body,
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