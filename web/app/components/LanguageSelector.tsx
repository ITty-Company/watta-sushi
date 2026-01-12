'use client'

import React from 'react'
// Импортируем хук из файла контекста (который мы создали на Шаге 1)
import { useLanguage } from '../context/LanguageContext'

// Экспортируем именно компонент LanguageSelector
export const LanguageSelector = () => {
  const { language, setLanguage } = useLanguage()

  const languages = [
    { code: 'uk', label: 'UA', flag: '🇺🇦' },
    { code: 'ru', label: 'RU', flag: '🇷🇺' },
    { code: 'en', label: 'EN', flag: '🇬🇧' },
    { code: 'nl', label: 'NL', flag: '🇳🇱' },
  ] as const

  return (
    <div className="language-selector-container">
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as any)}
        style={{
          padding: '5px 10px',
          borderRadius: '20px',
          border: '1px solid #ddd',
          backgroundColor: 'white',
          cursor: 'pointer',
          fontSize: '14px',
          outline: 'none'
        }}
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.label}
          </option>
        ))}
      </select>
    </div>
  )
}