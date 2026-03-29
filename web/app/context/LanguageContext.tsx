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
    proceedCheckout: string
    fulfillmentDelivery: string
    fulfillmentPickup: string
    pickupAtRestaurant: string
    pickupSubtitle: string
    deliveryFree: string
    deliveryUnlockHint: string
    invalidPhone: string
    checkoutSuccessTitle: string
    checkoutSuccessSubtitle: string
    checkoutOrderNumber: string
    checkoutBackToMenu: string
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
  adminPanel: {
    header: { title: string; subtitle: string; }
    sidebar: {
      selectSection: string; dashboard: string; dashboardDesc: string;
      orders: string; ordersDesc: string; products: string; productsDesc: string;
      promos: string; promosDesc: string; cities: string; citiesDesc: string;
      banners: string; bannersDesc: string; categories: string; categoriesDesc: string;
      users: string; usersDesc: string; team: string; teamDesc: string;
      settings: string; settingsDesc: string; ingredients: string; newsletter: string;
    }
    dashboard: {
      loading: string; revenue: string; orders: string; products: string; cities: string;
      statusTitle: string; statusPending: string; statusCooking: string;
      statusDelivering: string; statusCompleted: string; promos: string;
      categories: string; users: string;
    }
    actions: {
      add: string; edit: string; editShort: string; delete: string; save: string; saveChanges: string; cancel: string;
    }
    common: {
      menuChangeSection: string; emptyOrders: string; emptyCities: string; emptyBanners: string;
      emptyCategories: string; emptyUsers: string; emptyTeam: string; emptyPromos: string;
      clickToUpload: string; changeFile: string; selectFromList: string;
      activeLabel: string; inactiveLabel: string; yes: string; no: string;
      orderIndex: string; choose: string; notFound: string; searching: string;
    }
    orders: {
      orderNum: string; noComment: string; payment: string; cash: string; online: string;
      paid: string; error: string; waiting: string; hintCooking: string; hintDelivering: string; 
      hintCompleted: string; hintCancel: string;
      fulfillmentDelivery: string; fulfillmentPickup: string; deliveryFeeAdmin: string;
    }
    news: {
      title: string; addBtn: string; editTitle: string; newTitle: string;
      titlePlaceholder: string; descPlaceholder: string; textPlaceholder: string; isHit: string;
    }
    products: {
      addBtn: string; hit: string; editTitle: string; newTitle: string;
      nameLabel: string; namePlaceholder: string; descLabel: string; descPlaceholder: string;
      priceLabel: string; categoryLabel: string; selectCategory: string;
      deliveryCities: string; addCitiesFirst: string; descComposition: string; ingComposition: string;
    }
    ingredients: {
      title: string; addNew: string; nameRu: string; namePlaceholder: string; addBtn: string;
    }
    cities: {
      addCountry: string; nameRu: string;  sticker: string; addCountryBtn: string; countriesTitle: string;
      editCity: string; addCity: string; cityNameRu: string; searchMapLabel: string;
      searchMapDesc: string; searchMapPlaceholder: string; searchMapBtn: string;
      countryLabel: string; selectCountry: string; activeCity: string; saveChanges: string;
      addCityBtn: string; cancelEdit: string; citiesTitle: string; deliveryZones: string;
    }
    banners: {
      addBtn: string; editTitle: string; newTitle: string; titleRu: string; titlePlaceholder: string;
    }
    categories: {
      addBtn: string; slug: string; editTitle: string; newTitle: string;
      emojiLabel: string; nameRu: string; namePlaceholder: string; slugLabel: string; slugAuto: string;
    }
    users: {
      title: string; noName: string; admin: string; user: string; ordersCount: string; registration: string;
    }
    newsletter: {
      title: string; desc: string; confirmSend: string; subject: string; subjectPlaceholder: string;
      message: string; messagePlaceholder: string; promoOptional: string; promoPlaceholder: string;
      promoHint: string; sendBtn: string; successSend: string; errorPrefix: string; errorNetwork: string;
    }
    team: {
      title: string; addBtn: string; editTitle: string; newTitle: string;
      nameRu: string; posRu: string; bioRu: string;
    }
    promos: {
      createTitle: string; codePlaceholder: string; discountPlaceholder: string; createBtn: string; discountText: string;
    }
    settings: {
      title: string; intervalLabel: string; sec: string; intervalDesc: string; saving: string; saveBtn: string;
    }
  }
  notifications: {
    title: string
    empty: string
  }
  // Додайте це до інтерфейсу Translations:
  menuView: {
    itemsCount: string
    emptyCategoryTitle: string
    emptyCategoryDesc: string
    seeAll: string
  }
  adminCategory: {
    manageTitle: string
    addCategory: string
    subcategoriesCount: string
    enterNewName: string
    addSubcategory: string
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
    cartSection: {
      empty: 'Корзина пуста',
      total: 'Всього',
      order: 'Оформити замовлення',
      proceedCheckout: 'Перейти до оформлення',
      fulfillmentDelivery: 'Доставка',
      fulfillmentPickup: 'Самовивіз',
      pickupAtRestaurant: 'Заберіть замовлення за адресою:',
      pickupSubtitle: 'Заберіть замовлення у зазначений час.',
      deliveryFree: 'Безкоштовно',
      deliveryUnlockHint: 'Безкоштовна доставка від {{amount}} €',
      invalidPhone: 'Невірний формат телефону',
      checkoutSuccessTitle: 'Дякуємо за замовлення!',
      checkoutSuccessSubtitle: 'Ми отримали ваше замовлення. Менеджер зв\'яжеться з вами найближчим часом.',
      checkoutOrderNumber: 'Замовлення №',
      checkoutBackToMenu: 'Повернутися в меню'
    },
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
    menuView: {
    itemsCount: 'страв',
    emptyCategoryTitle: 'Товарів у цій категорії поки немає',
    emptyCategoryDesc: 'Додайте товари через адмін-панель',
    seeAll: 'Подивитися всі'
  },
  adminCategory: {
    manageTitle: 'Управління категоріями меню',
    addCategory: '➕ Додати категорію',
    subcategoriesCount: 'підкатегорій',
    enterNewName: 'Введіть нову назву:',
    addSubcategory: '➕ Підкатегорія'
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
    },
    adminPanel: {
      header: { title: "Адмін-панель", subtitle: "Статистика замовлень, товарів і доставок у одному місці." },
      sidebar: { selectSection: "Оберіть розділ", dashboard: "📊 Дашборд", dashboardDesc: "Статистика та огляд", orders: "📦 Замовлення", ordersDesc: "Управління замовленнями", products: "🍣 Товари", productsDesc: "Меню та позиції", promos: "🏷️ Промокоди", promosDesc: "Знижки", cities: "🏙️ Міста", citiesDesc: "Міста та країни", banners: "🎨 Банери", bannersDesc: "Банери", categories: "📋 Категорії", categoriesDesc: "Категорії меню", users: "👥 Користувачі", usersDesc: "Список клієнтів", team: "👨‍👩‍👧‍👦 Команда", teamDesc: "Співробітники", settings: "⚙️ Налаштування", settingsDesc: "Сайт і банери", ingredients: "🥑 Інгредієнти", newsletter: "📧 Розсилка" },
      dashboard: { loading: "Завантаження...", revenue: "Виручка (виконані)", orders: "Замовлень", products: "Товарів", cities: "Міст", statusTitle: "Замовлення за статусами", statusPending: "Очікують", statusCooking: "Готуються", statusDelivering: "В доставці", statusCompleted: "Виконані", promos: "Промокодів", categories: "Категорій", users: "Користувачів" },
      actions: { add: "+ Додати", edit: "Редагувати", editShort: "Змінити", delete: "Видалити", save: "Зберегти", saveChanges: "Зберегти зміни", cancel: "Скасувати" },
      common: { menuChangeSection: "Меню / змінити розділ", emptyOrders: "Немає активних замовлень", emptyCities: "Міст поки немає", emptyBanners: "Банерів поки немає", emptyCategories: "Категорій поки немає", emptyUsers: "Користувачів поки немає", emptyTeam: "Членів команди поки немає", emptyPromos: "Промокодів поки немає", clickToUpload: "Натисніть, щоб завантажити фото", changeFile: "Змінити", selectFromList: "Вибрати зі списку", activeLabel: "Активно", inactiveLabel: "Неактивно", yes: "Так", no: "Ні", orderIndex: "Порядок відображення", choose: "Вибрати", notFound: "Нічого не знайдено. Спробуйте інший запит.", searching: "пошук..." },
      orders: { orderNum: "Замовлення №", noComment: "Без коментаря", payment: "Оплата", cash: "Готівка", online: "Онлайн", paid: "ОПЛАЧЕНО", error: "ПОМИЛКА", waiting: "ОЧІКУЄ", hintCooking: "Готується", hintDelivering: "В доставці", hintCompleted: "Виконано", hintCancel: "Скасувати", fulfillmentDelivery: "Доставка", fulfillmentPickup: "Самовивіз", deliveryFeeAdmin: "Доставка:" },
      news: { title: "Новини", addBtn: "+ Додати", editTitle: "Редагувати", newTitle: "Нова новина", titlePlaceholder: "Заголовок", descPlaceholder: "Короткий опис", textPlaceholder: "Повний текст", isHit: "Хіт продажу" },
      products: { addBtn: "+ Додати товар", hit: "ХІТ", editTitle: "Редагувати страву", newTitle: "Нова страва", nameLabel: "Назва товару", namePlaceholder: "Наприклад: Філадельфія", descLabel: "Опис", descPlaceholder: "Склад, вага, особливості...", priceLabel: "Ціна (€)", categoryLabel: "Категорія", selectCategory: "Оберіть...", deliveryCities: "Міста доставки *", addCitiesFirst: "Спочатку додайте міста у вкладці 'Міста'", descComposition: "Описи (Склад)", ingComposition: "Інгредієнти (Склад)" },
      ingredients: { title: "Бібліотека інгредієнтів", addNew: "Додати новий", nameRu: "Назва", namePlaceholder: "Наприклад: Лосось", addBtn: "Додати" },
      cities: { addCountry: "Додати нову країну", nameRu: "Назва *", sticker: "Стікер країни (прапор)", addCountryBtn: "✨ Додати країну", countriesTitle: "Країни", editCity: "Редагувати місто", addCity: "Додати нове місто", cityNameRu: "Назва міста *", searchMapLabel: "📍 Пошук міста на карті", searchMapDesc: "Шукайте за адресою, індексом або кодом.", searchMapPlaceholder: "Назва, адреса, індекс...", searchMapBtn: "Шукати за назвами", countryLabel: "Країна *", selectCountry: "Оберіть країну", activeCity: "Активне місто", saveChanges: "💾 Зберегти зміни", addCityBtn: "✨ Додати місто", cancelEdit: "Скасувати редагування", citiesTitle: "Міста", deliveryZones: "Зон доставки:" },
      banners: { addBtn: "+ Додати банер", editTitle: "Редагувати банер", newTitle: "Новий банер", titleRu: "Заголовок *", titlePlaceholder: "Наприклад: Суші-бургери: ідеальний перекус" },
      categories: { addBtn: "+ Додати категорію", slug: "Slug:", editTitle: "Редагувати категорію", newTitle: "Нова категорія", emojiLabel: "Емодзі (стікер) *", nameRu: "Назва *", namePlaceholder: "Наприклад: Десерти", slugLabel: "Slug (URL)", slugAuto: "Автоматично" },
      users: { title: "👥 Зареєстровані користувачі", noName: "Без імені", admin: "👑 Адмін", user: "👤 Користувач", ordersCount: "Замовлень:", registration: "Реєстрація:" },
      newsletter: { title: "Email Розсилка", desc: "Відправка листів усім зареєстрованим користувачам", confirmSend: "Відправити цей лист усім користувачам?", subject: "Тема листа", subjectPlaceholder: "Наприклад: Знижки на роли!", message: "Текст повідомлення", messagePlaceholder: "Введіть текст розсилки...", promoOptional: "🎁 Промокод (опціонально)", promoPlaceholder: "Наприклад: PROMO2025", promoHint: "Буде виділений у листі великим шрифтом", sendBtn: "Відправити розсилку", successSend: "Успішно відправлено", errorPrefix: "Помилка: ", errorNetwork: "Помилка мережі" },
      team: { title: "👨‍👩‍👧‍👦 Команда", addBtn: "+ Додати члена команди", editTitle: "Редагувати члена команди", newTitle: "Новий член команди", nameRu: "Ім'я *", posRu: "Посада *", bioRu: "Біографія" },
      promos: { createTitle: "Створити новий промокод", codePlaceholder: "Код (наприклад, NEW2025)", discountPlaceholder: "Знижка %", createBtn: "Створити", discountText: "знижка" },
      settings: { title: "Налаштування сайту", intervalLabel: "Інтервал зміни банерів (секунди)", sec: "сек.", intervalDesc: "Вкажіть час, через який слайди будуть автоматично перемикатися.", saving: "Збереження...", saveBtn: "Зберегти налаштування" }
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
    cartSection: {
      empty: 'Корзина пуста',
      total: 'Итого',
      order: 'Оформить заказ',
      proceedCheckout: 'Перейти к оформлению',
      fulfillmentDelivery: 'Доставка',
      fulfillmentPickup: 'Самовывоз',
      pickupAtRestaurant: 'Заберите заказ по адресу:',
      pickupSubtitle: 'Заберите заказ в указанное время.',
      deliveryFree: 'Бесплатно',
      deliveryUnlockHint: 'Бесплатная доставка от {{amount}} €',
      invalidPhone: 'Неверный формат телефона',
      checkoutSuccessTitle: 'Спасибо за заказ!',
      checkoutSuccessSubtitle: 'Мы получили ваш заказ. Менеджер свяжется с вами в ближайшее время.',
      checkoutOrderNumber: 'Заказ №',
      checkoutBackToMenu: 'Вернуться в меню'
    },
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
    menuView: {
    itemsCount: 'блюд',
    emptyCategoryTitle: 'Товаров в этой категории пока нет',
    emptyCategoryDesc: 'Добавьте товары через админ-панель',
    seeAll: 'Посмотреть все'
  },
  adminCategory: {
    manageTitle: 'Управление категориями меню',
    addCategory: '➕ Добавить категорию',
    subcategoriesCount: 'подкатегорий',
    enterNewName: 'Введите новое название:',
    addSubcategory: '➕ Подкатегория'
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
    },
    adminPanel: {
      header: { title: "Админ-панель", subtitle: "Статистика заказов, товаров и доставок в одном месте." },
      sidebar: { selectSection: "Выберите раздел", dashboard: "📊 Дашборд", dashboardDesc: "Статистика и обзор", orders: "📦 Заказы", ordersDesc: "Управление заказами", products: "🍣 Товары", productsDesc: "Меню и позиции", promos: "🏷️ Промокоды", promosDesc: "Скидки", cities: "🏙️ Города", citiesDesc: "Города и страны", banners: "🎨 Баннеры", bannersDesc: "Баннеры", categories: "📋 Категории", categoriesDesc: "Категории меню", users: "👥 Пользователи", usersDesc: "Список клиентов", team: "👨‍👩‍👧‍👦 Команда", teamDesc: "Сотрудники", settings: "⚙️ Настройки", settingsDesc: "Сайт и баннеры", ingredients: "🥑 Ингредиенты", newsletter: "📧 Рассылка" },
      dashboard: { loading: "Загрузка...", revenue: "Выручка (выполнены)", orders: "Заказов", products: "Товаров", cities: "Городов", statusTitle: "Заказы по статусам", statusPending: "Ожидают", statusCooking: "Готовятся", statusDelivering: "В доставке", statusCompleted: "Выполнены", promos: "Промокодов", categories: "Категорий", users: "Пользователей" },
      actions: { add: "+ Добавить", edit: "Редактировать", editShort: "Изменить", delete: "Удалить", save: "Сохранить", saveChanges: "Сохранить изменения", cancel: "Отмена" },
      common: { menuChangeSection: "Меню / изменить раздел", emptyOrders: "Нет активных заказов", emptyCities: "Городов пока нет", emptyBanners: "Баннеров пока нет", emptyCategories: "Категорий пока нет", emptyUsers: "Пользователей пока нет", emptyTeam: "Членов команды пока нет", emptyPromos: "Промокодов пока нет", clickToUpload: "Нажмите, чтобы загрузить фото", changeFile: "Изменить", selectFromList: "Выбрать из списка", activeLabel: "Активен", inactiveLabel: "Неактивен", yes: "Да", no: "Нет", orderIndex: "Порядок отображения", choose: "Выбрать", notFound: "Ничего не найдено. Попробуйте другой запрос.", searching: "поиск..." },
      orders: { orderNum: "Заказ №", noComment: "Без комментария", payment: "Оплата", cash: "Наличные", online: "Онлайн", paid: "ОПЛАЧЕНО", error: "ОШИБКА", waiting: "ОЖИДАЕТ", hintCooking: "Готовится", hintDelivering: "В доставке", hintCompleted: "Выполнен", hintCancel: "Отменить", fulfillmentDelivery: "Доставка", fulfillmentPickup: "Самовывоз", deliveryFeeAdmin: "Доставка:" },
      news: { title: "Новости", addBtn: "+ Добавить", editTitle: "Редактировать", newTitle: "Новая новость", titlePlaceholder: "Заголовок", descPlaceholder: "Краткое описание", textPlaceholder: "Полный текст", isHit: "Хит продаж" },
      products: { addBtn: "+ Добавить товар", hit: "ХИТ", editTitle: "Редактировать блюдо", newTitle: "Новое блюдо", nameLabel: "Название товара", namePlaceholder: "Например: Филадельфия", descLabel: "Описание", descPlaceholder: "Состав, вес, особенности...", priceLabel: "Цена (€)", categoryLabel: "Категория", selectCategory: "Выберите...", deliveryCities: "Города доставки *", addCitiesFirst: "Сначала добавьте города во вкладке 'Города'", descComposition: "Описания (Состав)", ingComposition: "Ингредиенты (Состав)" },
      ingredients: { title: "Библиотека ингредиентов", addNew: "Добавить новый", nameRu: "Название", namePlaceholder: "Например: Лосось", addBtn: "Добавить" },
      cities: { addCountry: "Добавить новую страну", nameRu: "Название *", sticker: "Стикер страны (флаг)", addCountryBtn: "✨ Добавить страну", countriesTitle: "Страны", editCity: "Редактировать город", addCity: "Добавить новый город", cityNameRu: "Название города *", searchMapLabel: "📍 Поиск города на карте", searchMapDesc: "Ищите по адресу, индексу или коду.", searchMapPlaceholder: "Название, адрес, индекс...", searchMapBtn: "Искать по названиям", countryLabel: "Страна *", selectCountry: "Выберите страну", activeCity: "Активный город", saveChanges: "💾 Сохранить изменения", addCityBtn: "✨ Добавить город", cancelEdit: "Отменить редактирование", citiesTitle: "Города", deliveryZones: "Зон доставки:" },
      banners: { addBtn: "+ Добавить баннер", editTitle: "Редактировать баннер", newTitle: "Новый баннер", titleRu: "Заголовок *", titlePlaceholder: "Например: Суши-бургеры: идеальный перекус" },
      categories: { addBtn: "+ Добавить категорию", slug: "Slug:", editTitle: "Редактировать категорию", newTitle: "Новая категория", emojiLabel: "Эмодзи (стикер) *", nameRu: "Название *", namePlaceholder: "Например: Десерты", slugLabel: "Slug (URL)", slugAuto: "Автоматически" },
      users: { title: "👥 Зарегистрированные пользователи", noName: "Без имени", admin: "👑 Админ", user: "👤 Пользователь", ordersCount: "Заказов:", registration: "Регистрация:" },
      newsletter: { title: "Email Рассылка", desc: "Отправка писем всем зарегистрированным пользователям", confirmSend: "Отправить это письмо всем пользователям?", subject: "Тема письма", subjectPlaceholder: "Например: Скидки на роллы!", message: "Текст сообщения", messagePlaceholder: "Введите текст рассылки...", promoOptional: "🎁 Промокод (опционально)", promoPlaceholder: "Например: PROMO2025", promoHint: "Будет выделен в письме крупным шрифтом", sendBtn: "Отправить рассылку", successSend: "Успешно отправлено", errorPrefix: "Ошибка: ", errorNetwork: "Ошибка сети" },
      team: { title: "👨‍👩‍👧‍👦 Команда", addBtn: "+ Добавить члена команды", editTitle: "Редактировать члена команды", newTitle: "Новый член команды", nameRu: "Имя *", posRu: "Должность *", bioRu: "Биография" },
      promos: { createTitle: "Создать новый промокод", codePlaceholder: "Код (например, NEW2025)", discountPlaceholder: "Скидка %", createBtn: "Создать", discountText: "скидка" },
      settings: { title: "Настройки сайта", intervalLabel: "Интервал смены баннеров (секунды)", sec: "сек.", intervalDesc: "Укажите время, через которое слайды будут автоматически переключаться.", saving: "Сохранение...", saveBtn: "Сохранить настройки" }
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
    cartSection: {
      empty: 'Cart is empty',
      total: 'Total',
      order: 'Place order',
      proceedCheckout: 'Proceed to checkout',
      fulfillmentDelivery: 'Delivery',
      fulfillmentPickup: 'Pickup',
      pickupAtRestaurant: 'Pick up your order at:',
      pickupSubtitle: 'Pick up your order at the chosen time.',
      deliveryFree: 'Free',
      deliveryUnlockHint: 'Free delivery on orders over {{amount}} €',
      invalidPhone: 'Invalid phone format',
      checkoutSuccessTitle: 'Thank you for your order!',
      checkoutSuccessSubtitle: 'We have received your order. A manager will contact you shortly.',
      checkoutOrderNumber: 'Order #',
      checkoutBackToMenu: 'Back to Menu'
    },
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
    menuView: {
    itemsCount: 'dishes',
    emptyCategoryTitle: 'No items in this category yet',
    emptyCategoryDesc: 'Add items through the admin panel',
    seeAll: 'See all'
  },
  adminCategory: {
    manageTitle: 'Menu Categories Management',
    addCategory: '➕ Add category',
    subcategoriesCount: 'subcategories',
    enterNewName: 'Enter new name:',
    addSubcategory: '➕ Subcategory'
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
    },
    adminPanel: {
      header: { title: "Admin Panel", subtitle: "Order statistics, products, and deliveries in one place." },
      sidebar: { selectSection: "Select section", dashboard: "📊 Dashboard", dashboardDesc: "Stats & overview", orders: "📦 Orders", ordersDesc: "Manage orders", products: "🍣 Products", productsDesc: "Menu items", promos: "🏷️ Promo codes", promosDesc: "Discounts", cities: "🏙️ Cities", citiesDesc: "Cities & countries", banners: "🎨 Banners", bannersDesc: "Banners", categories: "📋 Categories", categoriesDesc: "Menu categories", users: "👥 Users", usersDesc: "Client list", team: "👨‍👩‍👧‍👦 Team", teamDesc: "Employees", settings: "⚙️ Settings", settingsDesc: "Site & banners", ingredients: "🥑 Ingredients", newsletter: "📧 Newsletter" },
      dashboard: { loading: "Loading...", revenue: "Revenue (completed)", orders: "Orders", products: "Products", cities: "Cities", statusTitle: "Orders by status", statusPending: "Pending", statusCooking: "Cooking", statusDelivering: "Delivering", statusCompleted: "Completed", promos: "Promo codes", categories: "Categories", users: "Users" },
      actions: { add: "+ Add", edit: "Edit", editShort: "Edit", delete: "Delete", save: "Save", saveChanges: "Save changes", cancel: "Cancel" },
      common: { menuChangeSection: "Menu / change section", emptyOrders: "No active orders", emptyCities: "No cities yet", emptyBanners: "No banners yet", emptyCategories: "No categories yet", emptyUsers: "No users yet", emptyTeam: "No team members yet", emptyPromos: "No promos yet", clickToUpload: "Click to upload photo", changeFile: "Change", selectFromList: "Select from list", activeLabel: "Active", inactiveLabel: "Inactive", yes: "Yes", no: "No", orderIndex: "Display order", choose: "Choose", notFound: "Nothing found. Try another query.", searching: "searching..." },
      orders: { orderNum: "Order #", noComment: "No comment", payment: "Payment", cash: "Cash", online: "Online", paid: "PAID", error: "ERROR", waiting: "WAITING", hintCooking: "Cooking", hintDelivering: "Delivering", hintCompleted: "Completed", hintCancel: "Cancel", fulfillmentDelivery: "Delivery", fulfillmentPickup: "Pickup", deliveryFeeAdmin: "Delivery fee:" },
      news: { title: "News", addBtn: "+ Add", editTitle: "Edit", newTitle: "New news", titlePlaceholder: "Title", descPlaceholder: "Short description", textPlaceholder: "Full text", isHit: "Bestseller" },
      products: { addBtn: "+ Add product", hit: "HOT", editTitle: "Edit dish", newTitle: "New dish", nameLabel: "Product name", namePlaceholder: "e.g.: Philadelphia", descLabel: "Description", descPlaceholder: "Ingredients, weight, features...", priceLabel: "Price (€)", categoryLabel: "Category", selectCategory: "Select...", deliveryCities: "Delivery cities *", addCitiesFirst: "Add cities in the 'Cities' tab first", descComposition: "Descriptions (Composition)", ingComposition: "Ingredients (Composition)" },
      ingredients: { title: "Ingredients Library", addNew: "Add new", nameRu: "Name", namePlaceholder: "e.g.: Salmon", addBtn: "Add" },
      cities: { addCountry: "Add new country", nameRu: "Name *", sticker: "Country sticker (flag)", addCountryBtn: "✨ Add country", countriesTitle: "Countries", editCity: "Edit city", addCity: "Add new city", cityNameRu: "City name *", searchMapLabel: "📍 Search city on map", searchMapDesc: "Search by address, zip code, or name.", searchMapPlaceholder: "Name, address, index...", searchMapBtn: "Search by names", countryLabel: "Country *", selectCountry: "Select country", activeCity: "Active city", saveChanges: "💾 Save changes", addCityBtn: "✨ Add city", cancelEdit: "Cancel edit", citiesTitle: "Cities", deliveryZones: "Delivery zones:" },
      banners: { addBtn: "+ Add banner", editTitle: "Edit banner", newTitle: "New banner", titleRu: "Title *", titlePlaceholder: "e.g.: Sushi burgers: perfect snack" },
      categories: { addBtn: "+ Add category", slug: "Slug:", editTitle: "Edit category", newTitle: "New category", emojiLabel: "Emoji (sticker) *", nameRu: "Name *", namePlaceholder: "e.g.: Desserts", slugLabel: "Slug (URL)", slugAuto: "Automatically" },
      users: { title: "👥 Registered users", noName: "No name", admin: "👑 Admin", user: "👤 User", ordersCount: "Orders:", registration: "Registered:" },
      newsletter: { title: "Email Newsletter", desc: "Send emails to all registered users", confirmSend: "Send this email to all users?", subject: "Email subject", subjectPlaceholder: "e.g.: Discounts on rolls!", message: "Message text", messagePlaceholder: "Enter newsletter text...", promoOptional: "🎁 Promo code (optional)", promoPlaceholder: "e.g.: PROMO2025", promoHint: "Will be highlighted in large font in the email", sendBtn: "Send newsletter", successSend: "Successfully sent", errorPrefix: "Error: ", errorNetwork: "Network error" },
      team: { title: "👨‍👩‍👧‍👦 Team", addBtn: "+ Add team member", editTitle: "Edit team member", newTitle: "New team member", nameRu: "Name *", posRu: "Position *", bioRu: "Biography" },
      promos: { createTitle: "Create new promo code", codePlaceholder: "Code (e.g. NEW2025)", discountPlaceholder: "Discount %", createBtn: "Create", discountText: "discount" },
      settings: { title: "Site Settings", intervalLabel: "Banner change interval (seconds)", sec: "sec.", intervalDesc: "Specify the time after which the slides will automatically switch.", saving: "Saving...", saveBtn: "Save settings" }
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
    cartSection: {
      empty: 'Winkelwagen is leeg',
      total: 'Totaal',
      order: 'Bestelling plaatsen',
      proceedCheckout: 'Naar afrekenen',
      fulfillmentDelivery: 'Bezorging',
      fulfillmentPickup: 'Afhalen',
      pickupAtRestaurant: 'Haal je bestelling op bij:',
      pickupSubtitle: 'Haal je bestelling op op het gekozen tijdstip.',
      deliveryFree: 'Gratis',
      deliveryUnlockHint: 'Gratis bezorging vanaf {{amount}} €',
      invalidPhone: 'Ongeldig telefoonnummer',
      checkoutSuccessTitle: 'Bedankt voor je bestelling!',
      checkoutSuccessSubtitle: 'We hebben je bestelling ontvangen. Een medewerker neemt snel contact met je op.',
      checkoutOrderNumber: 'Bestelling #',
      checkoutBackToMenu: 'Terug naar menu'
    },
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
    menuView: {
    itemsCount: 'gerechten',
    emptyCategoryTitle: 'Nog geen items in deze categorie',
    emptyCategoryDesc: 'Voeg items toe via het adminpaneel',
    seeAll: 'Bekijk alles'
  },
  adminCategory: {
    manageTitle: 'Menu Categorieën Beheer',
    addCategory: '➕ Categorie toevoegen',
    subcategoriesCount: 'subcategorieën',
    enterNewName: 'Voer nieuwe naam in:',
    addSubcategory: '➕ Subcategorie'
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
    },
    adminPanel: {
      header: { title: "Adminpaneel", subtitle: "Bestelstatistieken, producten en leveringen op één plek." },
      sidebar: { selectSection: "Selecteer sectie", dashboard: "📊 Dashboard", dashboardDesc: "Statistieken & overzicht", orders: "📦 Bestellingen", ordersDesc: "Beheer bestellingen", products: "🍣 Producten", productsDesc: "Menu-items", promos: "🏷️ Promocodes", promosDesc: "Kortingen", cities: "🏙️ Steden", citiesDesc: "Steden & landen", banners: "🎨 Banners", bannersDesc: "Banners", categories: "📋 Categorieën", categoriesDesc: "Menucategorieën", users: "👥 Gebruikers", usersDesc: "Klantenlijst", team: "👨‍👩‍👧‍👦 Team", teamDesc: "Medewerkers", settings: "⚙️ Instellingen", settingsDesc: "Site & banners", ingredients: "🥑 Ingrediënten", newsletter: "📧 Nieuwsbrief" },
      dashboard: { loading: "Laden...", revenue: "Omzet (voltooid)", orders: "Bestellingen", products: "Producten", cities: "Steden", statusTitle: "Bestellingen per status", statusPending: "In afwachting", statusCooking: "Wordt bereid", statusDelivering: "Onderweg", statusCompleted: "Voltooid", promos: "Promocodes", categories: "Categorieën", users: "Gebruikers" },
      actions: { add: "+ Toevoegen", edit: "Bewerken", editShort: "Wijzig", delete: "Verwijderen", save: "Opslaan", saveChanges: "Wijzigingen opslaan", cancel: "Annuleren" },
      common: { menuChangeSection: "Menu / sectie wijzigen", emptyOrders: "Geen actieve bestellingen", emptyCities: "Nog geen steden", emptyBanners: "Nog geen banners", emptyCategories: "Nog geen categorieën", emptyUsers: "Nog geen gebruikers", emptyTeam: "Nog geen teamleden", emptyPromos: "Nog geen promo's", clickToUpload: "Klik om foto te uploaden", changeFile: "Wijzig", selectFromList: "Selecteer uit lijst", activeLabel: "Actief", inactiveLabel: "Inactief", yes: "Ja", no: "Nee", orderIndex: "Weergavevolgorde", choose: "Kiezen", notFound: "Niets gevonden. Probeer een andere zoekopdracht.", searching: "zoeken..." },
      orders: { orderNum: "Bestelling #", noComment: "Geen opmerking", payment: "Betaling", cash: "Contant", online: "Online", paid: "BETAALD", error: "FOUT", waiting: "WACHTEN", hintCooking: "Wordt bereid", hintDelivering: "Onderweg", hintCompleted: "Voltooid", hintCancel: "Annuleren", fulfillmentDelivery: "Bezorging", fulfillmentPickup: "Afhalen", deliveryFeeAdmin: "Bezorgkosten:" },
      news: { title: "Nieuws", addBtn: "+ Toevoegen", editTitle: "Bewerken", newTitle: "Nieuw nieuws", titlePlaceholder: "Titel", descPlaceholder: "Korte beschrijving", textPlaceholder: "Volledige tekst", isHit: "Bestseller" },
      products: { addBtn: "+ Product toevoegen", hit: "HOT", editTitle: "Gerecht bewerken", newTitle: "Nieuw gerecht", nameLabel: "Productnaam", namePlaceholder: "bijv.: Philadelphia", descLabel: "Beschrijving", descPlaceholder: "Ingrediënten, gewicht, kenmerken...", priceLabel: "Prijs (€)", categoryLabel: "Categorie", selectCategory: "Selecteer...", deliveryCities: "Bezorgsteden *", addCitiesFirst: "Voeg eerst steden toe op het tabblad 'Steden'", descComposition: "Beschrijvingen (Samenstelling)", ingComposition: "Ingrediënten (Samenstelling)" },
      ingredients: { title: "Ingrediëntenbibliotheek", addNew: "Nieuwe toevoegen", nameRu: "Naam", namePlaceholder: "bijv.: Zalm", addBtn: "Toevoegen" },
      cities: { addCountry: "Nieuw land toevoegen", nameRu: "Naam *", sticker: "Landsticker (vlag)", addCountryBtn: "✨ Land toevoegen", countriesTitle: "Landen", editCity: "Stad bewerken", addCity: "Nieuwe stad toevoegen", cityNameRu: "Stadsnaam *", searchMapLabel: "📍 Zoek stad op kaart", searchMapDesc: "Zoek op adres, postcode of naam.", searchMapPlaceholder: "Naam, adres, index...", searchMapBtn: "Zoeken op naam", countryLabel: "Land *", selectCountry: "Selecteer land", activeCity: "Actieve stad", saveChanges: "💾 Wijzigingen opslaan", addCityBtn: "✨ Stad toevoegen", cancelEdit: "Bewerken annuleren", citiesTitle: "Steden", deliveryZones: "Bezorgzones:" },
      banners: { addBtn: "+ Banner toevoegen", editTitle: "Banner bewerken", newTitle: "Nieuwe banner", titleRu: "Titel *", titlePlaceholder: "bijv.: Sushi burgers: perfecte snack" },
      categories: { addBtn: "+ Categorie toevoegen", slug: "Slug:", editTitle: "Categorie bewerken", newTitle: "Nieuwe categorie", emojiLabel: "Emoji (sticker) *", nameRu: "Naam *", namePlaceholder: "bijv.: Desserts", slugLabel: "Slug (URL)", slugAuto: "Automatisch" },
      users: { title: "👥 Geregistreerde gebruikers", noName: "Geen naam", admin: "👑 Admin", user: "👤 Gebruiker", ordersCount: "Bestellingen:", registration: "Geregistreerd:" },
      newsletter: { title: "E-mail Nieuwsbrief", desc: "Stuur e-mails naar alle geregistreerde gebruikers", confirmSend: "Deze e-mail naar alle gebruikers sturen?", subject: "Onderwerp e-mail", subjectPlaceholder: "bijv.: Korting op rollen!", message: "Berichttekst", messagePlaceholder: "Voer nieuwsbrieftekst in...", promoOptional: "🎁 Promocode (optioneel)", promoPlaceholder: "bijv.: PROMO2025", promoHint: "Wordt in groot lettertype in de e-mail gemarkeerd", sendBtn: "Nieuwsbrief versturen", successSend: "Succesvol verzonden", errorPrefix: "Fout: ", errorNetwork: "Netwerkfout" },
      team: { title: "👨‍👩‍👧‍👦 Team", addBtn: "+ Teamlid toevoegen", editTitle: "Teamlid bewerken", newTitle: "Nieuw teamlid", nameRu: "Naam *", posRu: "Positie *", bioRu: "Biografie" },
      promos: { createTitle: "Nieuwe promocode aanmaken", codePlaceholder: "Code (bijv. NEW2025)", discountPlaceholder: "Korting %", createBtn: "Aanmaken", discountText: "korting" },
      settings: { title: "Site-instellingen", intervalLabel: "Interval bannerwissel (seconden)", sec: "sec.", intervalDesc: "Geef de tijd op waarna de dia's automatisch wisselen.", saving: "Opslaan...", saveBtn: "Instellingen opslaan" }
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
  try {
    const context = useContext(LanguageContext)
    return context ?? defaultContextValue
  } catch {
    return defaultContextValue
  }
}