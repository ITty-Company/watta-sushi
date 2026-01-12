'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type Language = 'ru' | 'ua' | 'en' | 'nl'

// Словарь
const translations = {
  ru: {
    menu: "Меню",
    cart: "Корзина",
    profile: "Профиль",
    addToCart: "Добавлено",
    popular: "ХИТ",
    phone: "Контакты",
    delivery: "Доставка",
    admin: "Админ-панель"
  },
  ua: {
    menu: "Меню",
    cart: "Кошик",
    profile: "Профіль",
    addToCart: "Додано",
    popular: "ХІТ",
    phone: "Контакти",
    delivery: "Доставка",
    admin: "Адмін-панель"
  },
  en: {
    menu: "Menu",
    cart: "Cart",
    profile: "Profile",
    addToCart: "Added",
    popular: "HOT",
    phone: "Contacts",
    delivery: "Delivery",
    admin: "Admin Panel"
  },
  nl: {
    menu: "Menu",
    cart: "Winkelwagen",
    profile: "Profiel",
    addToCart: "Toegevoegd",
    popular: "POPULAIR",
    phone: "Contacten",
    delivery: "Bezorging",
    admin: "Admin Paneel"
  }
}

// ВАЖНО: t - это функция, возвращающая string
interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: keyof typeof translations['ru']) => string 
  getLocalized: (obj: any, field: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('ru')

  useEffect(() => {
    const savedLang = localStorage.getItem('appLanguage') as Language
    if (savedLang) setLanguage(savedLang)
  }, [])

  const changeLanguage = (lang: Language) => {
    setLanguage(lang)
    localStorage.setItem('appLanguage', lang)
  }

  // Функция перевода
  const t = (key: keyof typeof translations['ru']) => {
    // Безопасное получение перевода
    const langPack = translations[language] || translations['ru']
    return langPack[key] || translations['ru'][key]
  }

  // Функция локализации объектов из БД
  const getLocalized = (obj: any, field: string) => {
    if (!obj) return ''
    const key = `${field}_${language}`
    return obj[key] || obj[`${field}_ru`] || ''
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage: changeLanguage, t, getLocalized }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider')
  return context
}