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
  navigation: {
    home: string
    menu: string
    promotions: string
    delivery: string
    about: string
    contacts: string
    admin: string
  }
  auth: {
    login: string
    register: string
    loginTitle: string
    registerTitle: string
    loginDescription: string
    registerDescription: string
    name: string
    phone: string
    email: string
    password: string
    back: string
    submit: string
    createAccount: string
    noAccount: string
    haveAccount: string
    errors: {
      pattern: string
      emailInvalid: string
      passwordMin: string
      phoneInvalid: string
      userExists: string
      userNotFound: string
      invalidCredentials: string
      required: string
      timeout: string
      generic: string
    }
  }
  aboutPage: {
    title: string
    subtitle: string
    description: string
    whyUs: string
    team: string
    stats: {
      clients: string
      experience: string
      delivery: string
      quality: string
    }
    features: {
      freshTitle: string
      freshText: string
      fastTitle: string
      fastText: string
      qualityTitle: string
      qualityText: string
      missionTitle: string
      missionText: string
    }
    contacts: {
      address: string
      workTime: string
      contact: string
    }
  }
  deliveryPage: {
    title: string
    description: string
    workingHours: string
    payment: string
  }
  promotionsPage: {
    title: string
    description: string
  }
  profilePage: {
    title: string
    logout: string
    orderHistory: string
  }
  adminPage: {
    auth: {
      notAuthorized: string
      accessDenied: string
      adminOnly: string
      accessCheckError: string
    }
    common: {
      error: string
      networkError: string
      connectionError: string
      deleteConfirm: string
      saveSuccess: string
      deleteSuccess: string
      statusUpdated: string
      updateError: string
    }
    products: {
      deleteConfirm: string
      deleted: string
      saved: string
      saveError: string
    }
    orders: {
      changeStatusConfirm: string
    }
    cities: {
      required: string
      chooseFromMap: string
      created: string
      createError: string
    }
    countries: {
      required: string
      created: string
      createError: string
    }
    news: {
      saved: string
      deleteConfirm: string
    }
  }
  notifications: {
    title: string
    empty: string
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
    cartSection: { empty: 'Корзина пуста', total: 'Всього', order: 'Оформити замовлення' },
    navigation: {
      home: 'Головна',
      menu: 'Меню',
      promotions: 'Акції',
      delivery: 'Доставка',
      about: 'Про нас',
      contacts: 'Контакти',
      admin: 'Адмін-панель'
    },
    auth: {
      login: 'Вхід',
      register: 'Реєстрація',
      loginTitle: 'Вхід',
      registerTitle: 'Реєстрація',
      loginDescription: 'Увійдіть, щоб бачити історію замовлень',
      registerDescription: 'Заповніть дані для створення акаунта',
      name: 'Ваше ім\'я',
      phone: 'Телефон',
      email: 'Email',
      password: 'Пароль',
      back: 'Назад',
      submit: 'Увійти',
      createAccount: 'Створити акаунт',
      noAccount: 'Немає акаунта? Зареєструватися',
      haveAccount: 'Є акаунт? Увійти',
      errors: {
        pattern: 'Перевірте правильність введених даних',
        emailInvalid: 'Введіть коректну email адресу',
        passwordMin: 'Пароль повинен містити мінімум 6 символів',
        phoneInvalid: 'Введіть коректний номер телефону',
        userExists: 'Користувач з таким email вже існує',
        userNotFound: 'Користувач не знайдений. Перевірте email та пароль',
        invalidCredentials: 'Невірний email або пароль',
        required: 'Заповніть всі обов\'язкові поля',
        timeout: 'Перевищено час очікування. Перевірте підключення до інтернету',
        generic: 'Сталася помилка'
      }
    },
    aboutPage: {
      title: "Про нас",
      subtitle: "Доставка японської кухні нового покоління",
      description: "Ми готуємо суші та роли тільки зі свіжішої риби, використовуємо справжній рис та не шкодуємо начинки.",
      whyUs: "Чому обирають нас?",
      team: "Наша команда",
      stats: {
        clients: "Задоволених клієнтів",
        experience: "Років досвіду",
        delivery: "Хвилин доставка",
        quality: "Якість"
      },
      features: {
        freshTitle: "Свіжі інгредієнти",
        freshText: "Використовуємо тільки найсвіжішу рибу та найкращі продукти для наших страв",
        fastTitle: "Швидка доставка",
        fastText: "Доставляємо ваші улюблені страви в найкоротші терміни",
        qualityTitle: "Висока якість",
        qualityText: "Кожна страва готується з любов'ю та увагою до деталей",
        missionTitle: "Наша місія",
        missionText: "Зробити смачну їжу доступною та швидкою для кожного"
      },
      contacts: {
        address: "Адреса",
        workTime: "Режим роботи",
        contact: "Контакти"
      }
    },
    deliveryPage: { title: "Доставка", description: "Доставка суші у Києві", workingHours: "Режим роботи", payment: "Оплата" },
    promotionsPage: { title: "Акції", description: "Спеціальні пропозиції" },
    profilePage: { title: "Профіль", logout: "Вийти", orderHistory: "Історія замовлень" },
    notifications: { title: "Сповіщення", empty: "Немає сповіщень" },
    adminPage: {
      auth: {
        notAuthorized: "Ви не авторизовані",
        accessDenied: "Доступ заборонено",
        adminOnly: "Доступ заборонено. Тільки адміністратори можуть використовувати адмін-панель.",
        accessCheckError: "Помилка перевірки прав доступу"
      },
      common: {
        error: "Помилка",
        networkError: "Помилка мережі",
        connectionError: "Не вдалося підключитися до сервера. Перевірте, чи запущено backend сервер.",
        deleteConfirm: "Видалити?",
        saveSuccess: "Збережено",
        deleteSuccess: "Успішно видалено",
        statusUpdated: "Статус успішно оновлено!",
        updateError: "Помилка оновлення"
      },
      products: {
        deleteConfirm: "Ви впевнені, що хочете видалити цей товар?",
        deleted: "Товар успішно видалено!",
        saved: "Товар успішно збережено!",
        saveError: "Помилка при збереженні"
      },
      orders: {
        changeStatusConfirm: "Змінити статус на"
      },
      cities: {
        required: "Назва міста та країна є обов'язковими",
        chooseFromMap: "Спочатку виберіть місто на мапі",
        created: "Місто успішно створено!",
        createError: "Помилка створення міста"
      },
      countries: {
        required: "Назва країни є обов'язковою",
        created: "Країна успішно створена!",
        createError: "Помилка створення країни"
      },
      news: {
        saved: "Збережено",
        deleteConfirm: "Видалити?"
      }
    }
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
    cartSection: { empty: 'Корзина пуста', total: 'Итого', order: 'Оформить заказ' },
    navigation: {
      home: 'Главная',
      menu: 'Меню',
      promotions: 'Акции',
      delivery: 'Доставка',
      about: 'О нас',
      contacts: 'Контакты',
      admin: 'Админ-панель'
    },
    auth: {
      login: 'Вход',
      register: 'Регистрация',
      loginTitle: 'Вход',
      registerTitle: 'Регистрация',
      loginDescription: 'Войдите, чтобы видеть историю заказов',
      registerDescription: 'Заполните данные для создания аккаунта',
      name: 'Ваше имя',
      phone: 'Телефон',
      email: 'Email',
      password: 'Пароль',
      back: 'Назад',
      submit: 'Войти',
      createAccount: 'Создать аккаунт',
      noAccount: 'Нет аккаунта? Зарегистрироваться',
      haveAccount: 'Есть аккаунт? Войти',
      errors: {
        pattern: 'Проверьте правильность введенных данных',
        emailInvalid: 'Введите корректный email адрес',
        passwordMin: 'Пароль должен содержать минимум 6 символов',
        phoneInvalid: 'Введите корректный номер телефона',
        userExists: 'Пользователь с таким email уже существует',
        userNotFound: 'Пользователь не найден. Проверьте email и пароль',
        invalidCredentials: 'Неверный email или пароль',
        required: 'Заполните все обязательные поля',
        timeout: 'Превышено время ожидания. Проверьте подключение к интернету',
        generic: 'Произошла ошибка'
      }
    },
    aboutPage: {
      title: "О нас",
      subtitle: "Доставка японской кухни нового поколения",
      description: "Мы готовим суши и роллы только из свежей рыбы, используем настоящий рис и не экономим на начинке.",
      whyUs: "Почему выбирают нас?",
      team: "Наша команда",
      stats: {
        clients: "Довольных клиентов",
        experience: "Лет опыта",
        delivery: "Минут доставка",
        quality: "Качество"
      },
      features: {
        freshTitle: "Свежие ингредиенты",
        freshText: "Используем только свежайшую рыбу и лучшие продукты для наших блюд",
        fastTitle: "Быстрая доставка",
        fastText: "Доставляем ваши любимые блюда в кратчайшие сроки",
        qualityTitle: "Высокое качество",
        qualityText: "Каждое блюдо готовится с любовью и вниманием к деталям",
        missionTitle: "Наша миссия",
        missionText: "Сделать вкусную еду доступной и быстрой для каждого"
      },
      contacts: {
        address: "Адрес",
        workTime: "Режим работы",
        contact: "Контакты"
      }
    },
    deliveryPage: { title: "Доставка", description: "Доставка суши в Киеве", workingHours: "Режим работы", payment: "Оплата" },
    promotionsPage: { title: "Акции", description: "Специальные предложения" },
    profilePage: { title: "Профиль", logout: "Выйти", orderHistory: "История заказов" },
    notifications: { title: "Уведомления", empty: "Нет уведомлений" },
    adminPage: {
      auth: {
        notAuthorized: "Вы не авторизованы",
        accessDenied: "Доступ запрещен",
        adminOnly: "Доступ запрещен. Только администраторы могут использовать админ панель.",
        accessCheckError: "Ошибка проверки прав доступа"
      },
      common: {
        error: "Ошибка",
        networkError: "Ошибка сети",
        connectionError: "Не удалось подключиться к серверу. Проверьте, запущен ли backend сервер.",
        deleteConfirm: "Удалить?",
        saveSuccess: "Сохранено",
        deleteSuccess: "Успешно удалено",
        statusUpdated: "Статус успешно обновлен!",
        updateError: "Ошибка обновления"
      },
      products: {
        deleteConfirm: "Вы уверены, что хотите удалить этот товар?",
        deleted: "Товар успешно удален!",
        saved: "Товар успешно сохранен!",
        saveError: "Ошибка при сохранении"
      },
      orders: {
        changeStatusConfirm: "Сменить статус на"
      },
      cities: {
        required: "Название города и страна обязательны",
        chooseFromMap: "Сначала выберите город на карте",
        created: "Город успешно создан!",
        createError: "Ошибка создания города"
      },
      countries: {
        required: "Название страны обязательно",
        created: "Страна успешно создана!",
        createError: "Ошибка создания страны"
      },
      news: {
        saved: "Сохранено",
        deleteConfirm: "Удалить?"
      }
    }
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
    cartSection: { empty: 'Cart is empty', total: 'Total', order: 'Place order' },
    navigation: {
      home: 'Home',
      menu: 'Menu',
      promotions: 'Promotions',
      delivery: 'Delivery',
      about: 'About',
      contacts: 'Contacts',
      admin: 'Admin Panel'
    },
    auth: {
      login: 'Login',
      register: 'Register',
      loginTitle: 'Login',
      registerTitle: 'Register',
      loginDescription: 'Log in to see order history',
      registerDescription: 'Fill in the data to create an account',
      name: 'Your name',
      phone: 'Phone',
      email: 'Email',
      password: 'Password',
      back: 'Back',
      submit: 'Login',
      createAccount: 'Create account',
      noAccount: 'No account? Register',
      haveAccount: 'Have an account? Login',
      errors: {
        pattern: 'Please check the entered data',
        emailInvalid: 'Enter a valid email address',
        passwordMin: 'Password must contain at least 6 characters',
        phoneInvalid: 'Enter a valid phone number',
        userExists: 'User with this email already exists',
        userNotFound: 'User not found. Check your email and password',
        invalidCredentials: 'Invalid email or password',
        required: 'Fill in all required fields',
        timeout: 'Request timeout. Check your internet connection',
        generic: 'An error occurred'
      }
    },
    aboutPage: {
      title: "About Us",
      subtitle: "Next generation Japanese food delivery",
      description: "We prepare sushi and rolls only from fresh fish, use authentic rice and never save on fillings.",
      whyUs: "Why choose us?",
      team: "Our Team",
      stats: {
        clients: "Happy clients",
        experience: "Years of experience",
        delivery: "Minutes delivery",
        quality: "Quality"
      },
      features: {
        freshTitle: "Fresh ingredients",
        freshText: "We use only the freshest fish and best products for our dishes",
        fastTitle: "Fast delivery",
        fastText: "We deliver your favorite dishes as quickly as possible",
        qualityTitle: "High quality",
        qualityText: "Each dish is prepared with love and attention to detail",
        missionTitle: "Our mission",
        missionText: "To make delicious food accessible and fast for everyone"
      },
      contacts: {
        address: "Address",
        workTime: "Working hours",
        contact: "Contacts"
      }
    },
    deliveryPage: { title: "Delivery", description: "Sushi delivery in Kyiv", workingHours: "Working hours", payment: "Payment" },
    promotionsPage: { title: "Promotions", description: "Special offers" },
    profilePage: { title: "Profile", logout: "Log out", orderHistory: "Order history" },
    notifications: { title: "Notifications", empty: "No notifications" },
    adminPage: {
      auth: {
        notAuthorized: "You are not authorized",
        accessDenied: "Access denied",
        adminOnly: "Access denied. Only administrators can use the admin panel.",
        accessCheckError: "Access rights check error"
      },
      common: {
        error: "Error",
        networkError: "Network error",
        connectionError: "Failed to connect to the server. Check if the backend server is running.",
        deleteConfirm: "Delete?",
        saveSuccess: "Saved",
        deleteSuccess: "Successfully deleted",
        statusUpdated: "Status successfully updated!",
        updateError: "Update error"
      },
      products: {
        deleteConfirm: "Are you sure you want to delete this product?",
        deleted: "Product successfully deleted!",
        saved: "Product successfully saved!",
        saveError: "Error while saving"
      },
      orders: {
        changeStatusConfirm: "Change status to"
      },
      cities: {
        required: "City name and country are required",
        chooseFromMap: "Select a city on the map first",
        created: "City successfully created!",
        createError: "Error creating city"
      },
      countries: {
        required: "Country name is required",
        created: "Country successfully created!",
        createError: "Error creating country"
      },
      news: {
        saved: "Saved",
        deleteConfirm: "Delete?"
      }
    }
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
    cartSection: { empty: 'Winkelwagen is leeg', total: 'Totaal', order: 'Bestelling plaatsen' },
    navigation: {
      home: 'Home',
      menu: 'Menu',
      promotions: 'Aanbiedingen',
      delivery: 'Bezorging',
      about: 'Over ons',
      contacts: 'Contacten',
      admin: 'Admin Paneel'
    },
    auth: {
      login: 'Inloggen',
      register: 'Registreren',
      loginTitle: 'Inloggen',
      registerTitle: 'Registreren',
      loginDescription: 'Log in om bestelgeschiedenis te zien',
      registerDescription: 'Vul de gegevens in om een account aan te maken',
      name: 'Uw naam',
      phone: 'Telefoon',
      email: 'Email',
      password: 'Wachtwoord',
      back: 'Terug',
      submit: 'Inloggen',
      createAccount: 'Account aanmaken',
      noAccount: 'Geen account? Registreren',
      haveAccount: 'Heeft u een account? Inloggen',
      errors: {
        pattern: 'Controleer de ingevoerde gegevens',
        emailInvalid: 'Voer een geldig e-mailadres in',
        passwordMin: 'Wachtwoord moet minimaal 6 tekens bevatten',
        phoneInvalid: 'Voer een geldig telefoonnummer in',
        userExists: 'Gebruiker met dit e-mailadres bestaat al',
        userNotFound: 'Gebruiker niet gevonden. Controleer uw e-mail en wachtwoord',
        invalidCredentials: 'Ongeldig e-mailadres of wachtwoord',
        required: 'Vul alle verplichte velden in',
        timeout: 'Verzoek time-out. Controleer uw internetverbinding',
        generic: 'Er is een fout opgetreden'
      }
    },
    aboutPage: {
      title: "Over ons",
      subtitle: "Japanse bezorging van de nieuwe generatie",
      description: "Wij bereiden sushi en rollen alleen van verse vis, gebruiken authentieke rijst en besparen niet op vulling.",
      whyUs: "Waarom kiezen voor ons?",
      team: "Ons team",
      stats: {
        clients: "Tevreden klanten",
        experience: "Jaar ervaring",
        delivery: "Minuten bezorging",
        quality: "Kwaliteit"
      },
      features: {
        freshTitle: "Verse ingrediënten",
        freshText: "Wij gebruiken alleen de meest verse vis en beste producten voor onze gerechten",
        fastTitle: "Snelle bezorging",
        fastText: "Wij bezorgen uw favoriete gerechten zo snel mogelijk",
        qualityTitle: "Hoge kwaliteit",
        qualityText: "Elk gerecht wordt met liefde en aandacht bereid",
        missionTitle: "Onze missie",
        missionText: "Heerlijk eten toegankelijk en snel maken voor iedereen"
      },
      contacts: {
        address: "Adres",
        workTime: "Openingstijden",
        contact: "Contact"
      }
    },
    deliveryPage: { title: "Bezorging", description: "Sushi bezorging in Kiev", workingHours: "Openingstijden", payment: "Betaling" },
    promotionsPage: { title: "Aanbiedingen", description: "Speciale aanbiedingen" },
    profilePage: { title: "Profiel", logout: "Uitloggen", orderHistory: "Bestelgeschiedenis" },
    notifications: { title: "Meldingen", empty: "Geen meldingen" },
    adminPage: {
      auth: {
        notAuthorized: "U bent niet ingelogd",
        accessDenied: "Toegang geweigerd",
        adminOnly: "Toegang geweigerd. Alleen beheerders kunnen het adminpaneel gebruiken.",
        accessCheckError: "Fout bij controleren toegangsrechten"
      },
      common: {
        error: "Fout",
        networkError: "Netwerkfout",
        connectionError: "Kan geen verbinding maken met de server. Controleer of de backend server draait.",
        deleteConfirm: "Verwijderen?",
        saveSuccess: "Opgeslagen",
        deleteSuccess: "Succesvol verwijderd",
        statusUpdated: "Status succesvol bijgewerkt!",
        updateError: "Updatefout"
      },
      products: {
        deleteConfirm: "Weet u zeker dat u dit product wilt verwijderen?",
        deleted: "Product succesvol verwijderd!",
        saved: "Product succesvol opgeslagen!",
        saveError: "Fout bij opslaan"
      },
      orders: {
        changeStatusConfirm: "Status wijzigen naar"
      },
      cities: {
        required: "Stadsnaam en land zijn verplicht",
        chooseFromMap: "Selecteer eerst een stad op de kaart",
        created: "Stad succesvol aangemaakt!",
        createError: "Fout bij aanmaken stad"
      },
      countries: {
        required: "Landsnaam is verplicht",
        created: "Land succesvol aangemaakt!",
        createError: "Fout bij aanmaken land"
      },
      news: {
        saved: "Opgeslagen",
        deleteConfirm: "Verwijderen?"
      }
    }
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
  // Всегда начинаем с 'uk' на сервере и клиенте для избежания проблем с гидратацией
  const [language, setLanguageState] = useState<Language>('uk')

  useEffect(() => {
    // Загружаем язык из localStorage только после монтирования на клиенте
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem('language') as any
      if (saved === 'ua') {
        setLanguageState('uk')
      } else if (saved && ['uk', 'en', 'ru', 'nl'].includes(saved)) {
        setLanguageState(saved as Language)
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

const defaultContextValue: LanguageContextType = {
  language: 'uk',
  setLanguage: () => {},
  t: translations.uk,
  getLocalized: (obj: any, field: string) => (obj ? (obj[`${field}_ua`] || obj[`${field}_uk`] || obj[`${field}_ru`] || '') : ''),
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  return context ?? defaultContextValue
}