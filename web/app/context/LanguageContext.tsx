'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type Language = 'uk' | 'en' | 'ru' | 'nl'

interface Translations {
  // Простые ключи
  menu: string
  cart: string
  profile: string
  addToCart: string
  popular: string
  phone: string
  delivery: string
  admin: string
  
  // Секции
  location: {
    kyiv: string
  }
  categories: {
    rolls: string
    sushi: string
    sets: string
    soups: string
    bowls: string
    snacks: string
    drinks: string
    sauces: string
  }
  hero: {
    title: string
  }
  section: {
    title: string
    description: string
  }
  cartSection: { 
    empty: string
    total: string
    order: string
  }
}

const translations: Record<Language, Translations> = {
  uk: {
    menu: "Меню",
    cart: "Кошик",
    profile: "Профіль",
    addToCart: "Додано",
    popular: "ХІТ",
    phone: "Контакти",
    delivery: "Доставка",
    admin: "Адмін-панель",
    location: { kyiv: 'Київ' },
    categories: { rolls: 'Роли', sushi: 'Суші', sets: 'Сети', soups: 'Супи', bowls: 'Боули', snacks: 'Закуски', drinks: 'Напої', sauces: 'Соуси' },
    hero: { title: 'Користь азіатських супів' },
    section: { title: 'Доставка суші у Києві', description: 'В асортименті Watta Sushi представлені роли, суші, сети і напої на будь-який смак. Ми рекомендуємо обов\'язково спробувати топ позиції нашого меню!' },
    cartSection: { empty: 'Корзина пуста', total: 'Всього', order: 'Оформити замовлення' }
  },
  ru: {
    menu: "Меню",
    cart: "Корзина",
    profile: "Профиль",
    addToCart: "Добавлено",
    popular: "ХИТ",
    phone: "Контакты",
    delivery: "Доставка",
    admin: "Админ-панель",
    location: { kyiv: 'Киев' },
    categories: { rolls: 'Роллы', sushi: 'Суши', sets: 'Сеты', soups: 'Супы', bowls: 'Боулы', snacks: 'Закуски', drinks: 'Напитки', sauces: 'Соусы' },
    hero: { title: 'Польза азиатских супов' },
    section: { title: 'Доставка суши в Киеве', description: 'В ассортименте Watta Sushi представлены роллы, суши, сеты и напитки на любой вкус. Мы рекомендуем обязательно попробовать топ позиции нашего меню!' },
    cartSection: { empty: 'Корзина пуста', total: 'Итого', order: 'Оформить заказ' }
  },
  en: {
    menu: "Menu",
    cart: "Cart",
    profile: "Profile",
    addToCart: "Added",
    popular: "HOT",
    phone: "Contacts",
    delivery: "Delivery",
    admin: "Admin Panel",
    location: { kyiv: 'Kyiv' },
    categories: { rolls: 'Rolls', sushi: 'Sushi', sets: 'Sets', soups: 'Soups', bowls: 'Bowls', snacks: 'Snacks', drinks: 'Drinks', sauces: 'Sauces' },
    hero: { title: 'Benefits of Asian Soups' },
    section: { title: 'Sushi Delivery in Kyiv', description: 'Watta Sushi offers rolls, sushi, sets, and drinks for every taste. We highly recommend trying our top menu items!' },
    cartSection: { empty: 'Cart is empty', total: 'Total', order: 'Place order' }
  },
  nl: {
    menu: "Menu",
    cart: "Winkelwagen",
    profile: "Profiel",
    addToCart: "Toegevoegd",
    popular: "POPULAIR",
    phone: "Contacten",
    delivery: "Bezorging",
    admin: "Admin Paneel",
    location: { kyiv: 'Kiev' },
    categories: { rolls: 'Rollen', sushi: 'Sushi', sets: 'Sets', soups: 'Soepen', bowls: 'Bowls', snacks: 'Snacks', drinks: 'Dranken', sauces: 'Sauzen' },
    hero: { title: 'Voordelen van Aziatische soepen' },
    section: { title: 'Sushi bezorging in Kiev', description: 'Watta Sushi biedt rollen, sushi, sets en drankjes voor elke smaak. We raden ten zeerste aan om onze topmenu-items te proberen!' },
    cartSection: { empty: 'Winkelwagen is leeg', total: 'Totaal', order: 'Bestelling plaatsen' }
  }
}

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: Translations
  getLocalized: (obj: any, field: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('uk')

  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem('language') as any
      if (saved === 'ua') {
        setLanguageState('uk')
      } else if (saved && ['uk', 'en', 'ru', 'nl'].includes(saved)) {
        setLanguageState(saved)
      }
    }
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('language', lang)
    }
  }

  const getLocalized = (obj: any, field: string) => {
    if (!obj) return ''
    const suffix = language === 'uk' ? 'ua' : language;
    return obj[`${field}_${suffix}`] || obj[`${field}_${language}`] || obj[`${field}_ru`] || ''
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: translations[language], getLocalized }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return context
}