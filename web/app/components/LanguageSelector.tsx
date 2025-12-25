'use client'

import { useState, useRef, useEffect } from 'react'
import { useLanguage } from '../context/LanguageContext'

const languages = [
  { code: 'uk' as const, name: 'Українська', flag: '🇺🇦', countryCode: 'UA' },
  { code: 'en' as const, name: 'English', flag: '🇬🇧', countryCode: 'GB' },
  { code: 'ru' as const, name: 'Русский', flag: '🇷🇺', countryCode: 'RU' },
  { code: 'nl' as const, name: 'Nederlands', flag: '🇳🇱', countryCode: 'NL' }
]

export default function LanguageSelector() {
  const { language, setLanguage } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const currentLanguage = languages.find(lang => lang.code === language) || languages[0]

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

  const handleLanguageChange = (langCode: typeof language) => {
    setLanguage(langCode)
    setIsOpen(false)
  }

  return (
    <div className="language-selector-web" ref={dropdownRef}>
      <button 
        className="language-selector-button-web"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select language"
      >
        <span className="language-flag-web">{currentLanguage.flag}</span>
        <span className="language-code-web">{currentLanguage.countryCode}</span>
        <span className="language-name-web">{currentLanguage.name}</span>
        <svg 
          className={`language-arrow-web ${isOpen ? 'open' : ''}`}
          width="12" 
          height="12" 
          viewBox="0 0 12 12" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
        >
          <path d="M3 4.5L6 7.5L9 4.5"/>
        </svg>
      </button>
      
      {isOpen && (
        <div className="language-dropdown-web">
          {languages.map((lang) => (
            <button
              key={lang.code}
              className={`language-option-web ${language === lang.code ? 'active' : ''}`}
              onClick={() => handleLanguageChange(lang.code)}
            >
              <span className="language-option-flag-web">{lang.flag}</span>
              <span className="language-option-name-web">{lang.name}</span>
              {language === lang.code && (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M13 4L6 11L3 8"/>
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

