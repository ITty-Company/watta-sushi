'use client'

import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react'

export type Language = 'uk' | 'en' | 'ru' | 'nl'

/** Мова інтерфейсу адмін-панелі (окремо від мови сайту). */
export type AdminUiLanguage = 'uk' | 'ru'

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
  locationPicker: {
    title: string
    subtitle: string
    country: string
    city: string
    loading: string
    noCountries: string
    noCountriesAdminHint: string
    noCountriesDevHint: string
    noCitiesInCountry: string
    addCitiesAdmin: string
    noActiveCities: string
    activateInAdmin: string
    chooseLocation: string
    ariaOpen: string
    ariaClose: string
  }
  deliveryPage: {
    kicker: string
    kickerScript: string
    headlineLead: string
    headlineMark: string
    headlineTrail: string
    sub: string
    statFresh: string
    statFast: string
    statCity: string
    citiesLabel: string
    mapAll: string
    mapFocus: string
    loading: string
    zonesTitle: string
    zoneAvailable: string
    conditionsTitle: string
    minOrder: string
    remoteHint: string
    hoursTitle: string
    hoursRange: string
    howTitle: string
    stepWeb: string
    stepApp: string
    stepPhone: string
    stepWebDesc: string
    stepAppDesc: string
    stepPhoneDesc: string
    /** Підпис під картою: наша кухня (адреса з `lib/wattaRestaurantLocation`) */
    kitchenMapCaption: string
    conditionsKicker: string
    conditionsFeature1: string
    conditionsFeature2: string
    conditionsFeature3: string
    deliveryPromiseKicker: string
    deliveryPromiseTitle: string
    deliveryPromiseText: string
    deliveryPromiseFoot: string
    openMaps: string
    title: string
    description: string
    workingHours: string
    payment: string
    postalTitle: string
    postalDesc: string
    postalLabel: string
    postalPlaceholder: string
    postalButton: string
    postalChecking: string
    postalInside: string
    postalOutside: string
    postalNoZones: string
    /** Індекс знайдено на карті, але полігони зон ще не задані в адмінці */
    postalFoundIndexNoZonesTitle: string
    postalGeocodeFail: string
    postalBadRequest: string
    postalZone: string
    postalAddressFound: string
    adminZonesNote: string
    tariffPerKm: string
    tariffBase: string
    tariffFreeFrom: string
    syncCityHint: string
    /** Обране у шапці місто не в каталозі доставки або для нього ще не налаштовані зони */
    cityNoDeliveryYet: string
    mapZonesHint: string
    mapInteractiveAria: string
    zonePopupFree: string
    zonePopupFlat: string
    zonePopupStandardTitle: string
    zonePopupStandardBase: string
    zonePopupStandardPerKm: string
    zonePopupStandardFreeFrom: string
    zoneFeeFree: string
    zoneFeeFlat: string
    zoneFeeStandard: string
    postalZoneTariffFree: string
    postalZoneTariffFlat: string
    postalZoneTariffStandard: string
    /** Орієнтовна сума після перевірки індексу, плейсхолдер {{amount}} */
    estimatedDeliveryApprox: string
    /** Відстань від точки кухні, плейсхолдер {{km}} */
    distanceFromKitchen: string
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
  welcomeHero: {
    title: string
    description: string
  }
  section: {
    title: string
    description: string
  }
  /** Друга секція головної: редакційна типографіка + карусель банерів */
  homeBrandSection: {
    kicker: string
    kickerScript: string
    pillar1Label: string
    pillar1Word: string
    pillar2Label: string
    pillar2Word: string
    pillar3Label: string
    pillar3Word: string
    footerHint: string
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
    favorites: string
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
    /** Розширена сторінка «Про нас» */
    heroKicker: string
    heroWordmark: string
    storyTitle: string
    storyLead: string
    storyP2: string
    storyP3: string
    journeyTitle: string
    journeySub: string
    j1Title: string
    j1Body: string
    j2Title: string
    j2Body: string
    j3Title: string
    j3Body: string
    j4Title: string
    j4Body: string
    bentoTitle: string
    bentoSub: string
    bento1Title: string
    bento1Body: string
    bento2Title: string
    bento2Body: string
    bento3Title: string
    bento3Body: string
    bento4Title: string
    bento4Body: string
    manifesto: string
    manifestoSig: string
    ctaMenu: string
    ctaContacts: string
    ctaDelivery: string
    visitStripTitle: string
    addressLine: string
    hoursLine: string
    phoneLine: string
    teamEmptyTitle: string
    teamEmptyBody: string
    marqueeWords: string
  }
  promotionsPage: {
    title: string
    description: string
    /** Заголовок списку новин/акцій */
    listHeading: string
    detailsCta: string
    /** Плейсхолдер {{count}} */
    morePhotosBadge: string
    /** Плейсхолдер {{count}} */
    offersBadge: string
    noPhoto: string
    loading: string
    notFound: string
    galleryAria: string
    offersTitle: string
    wasPrice: string
    /** Плейсхолдер {{percent}} */
    offPercent: string
    hitBadge: string
  }
  profilePage: {
    title: string
    logout: string
    orderHistory: string
  }
  /** Кабінет клієнта (профіль) */
  clientProfile: {
    loading: string
    redirectLogin: string
    backHome: string
    brandSubtitle: string
    bonuses: string
    tabHistory: string
    tabAddress: string
    tabFavorites: string
    tabData: string
    tabAdmin: string
    logout: string
    emptyOrders: string
    goMenu: string
    orderLabel: string
    total: string
    reorder: string
    journeyHint: string
    stepPending: string
    stepConfirmed: string
    stepCooking: string
    stepDelivering: string
    stepReceived: string
    stepReview: string
    stepReviewDone: string
    orderCancelled: string
    liveUpdating: string
    reviewOpen: string
    reviewModalTitle: string
    reviewText: string
    reviewPhotos: string
    pickPhotos: string
    reviewSend: string
    favoritesTitle: string
    favEmpty: string
    favToMenu: string
    addrTitle: string
    addrSub: string
    addrEmptyTitle: string
    addrEmptySub: string
    dataTitle: string
    dataSub: string
    labelName: string
    labelPhone: string
    labelEmail: string
    notSpecified: string
  }
  /** Публічна сторінка відгуків */
  reviewsPublic: {
    title: string
    subtitle: string
    empty: string
    loginCta: string
    openProfile: string
  }
  /** Блог — обгортка UI */
  blogPublic: {
    title: string
    subtitle: string
    empty: string
    readMore: string
    backToBlog: string
  }
  /** Сторінка контактів */
  contactPage: {
    heroKicker: string
    heroTitle: string
    heroSubtitle: string
    ctaForm: string
    ctaDelivery: string
    stat1Val: string
    stat1Label: string
    stat2Val: string
    stat2Label: string
    stat3Val: string
    stat3Label: string
    channelsTitle: string
    channelsSub: string
    cardCall: string
    cardEmail: string
    cardAddress: string
    cardHours: string
    phoneDisplay: string
    phoneTel: string
    emailDisplay: string
    emailMailto: string
    hoursDetail: string
    openMaps: string
    mapTitle: string
    mapSub: string
    socialTitle: string
    faqTitle: string
    faqSub: string
    faq1Q: string
    faq1A: string
    faq2Q: string
    faq2A: string
    faq3Q: string
    faq3A: string
    faq4Q: string
    faq4A: string
    faq5Q: string
    faq5A: string
    formTitle: string
    formSub: string
    phName: string
    phEmail: string
    phPhone: string
    phMessage: string
    formSubmit: string
    formSending: string
    formSuccess: string
    formError: string
    formNetwork: string
    errName: string
    errEmail: string
    errMessage: string
    honeyLabel: string
    bottomTitle: string
    bottomCta: string
    scrollHint: string
    addressLine: string
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
    header: {
      title: string
      subtitle: string
      siteMenu: string
      backAria: string
      refreshTitle: string
      openMenuTitle: string
      closeDrawerAria: string
      adminLangUk: string
      adminLangRu: string
      adminLangHint: string
    }
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
      statusDelivering: string; statusCompleted: string; statusCancelled: string; promos: string;
      categories: string; users: string; paidOrders: string; statsHint: string;
      banners: string; blog: string; ingredients: string; team: string; countries: string;
      contentSection: string;
      statsFallback: string;
      studioHeadline: string;
      studioSub: string;
      chartRevenue14d: string;
      chartOrders14d: string;
      chartStatusPie: string;
      chartNoData: string;
      avgOrderValue: string;
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
      bannerDragHint: string; bannerOrderSaved: string; bannerOrderSaveError: string;
    }
    orders: {
      orderNum: string; noComment: string; payment: string; cash: string; online: string;
      paid: string; error: string; waiting: string; hintConfirmed: string; hintCooking: string; hintDelivering: string; 
      hintCompleted: string; hintCancel: string;
      fulfillmentDelivery: string; fulfillmentPickup: string; deliveryFeeAdmin: string;
    }
    news: {
      title: string; addBtn: string; editTitle: string; newTitle: string;
      titlePlaceholder: string; descPlaceholder: string; textPlaceholder: string; isHit: string;
      galleryLabel: string
      uploadPhotos: string
      removePhotoAria: string
      dishesBlock: string
      selectProduct: string
      discountShort: string
      addDish: string
      dishDuplicate: string
      pickProductFirst: string
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
      addBtn: string; tabSubtitle: string; editTitle: string; newTitle: string; titleRu: string; titlePlaceholder: string;
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
    footerPromoSeeOffers: string
    footerPromoAriaRegion: string
    /** Aria для бейджа на відео-hero: привітання + бренд */
    welcomeBadgeAria: string
    /** Кнопка-стрілка вниз під привітанням */
    welcomeScrollDownAria: string
    /** Заголовок блоку після банерів */
    gastronomyTitle: string
    /** Заголовок повного каталогу на головній */
    homeCatalogTitle: string
    /** Підзаголовок під каталогом */
    homeCatalogSub: string
    /** Підказка: товари на окремій сторінці */
    catalogOnCategoryPageHint: string
    categoryPageBack: string
    categoryPageEmpty: string
    categoryPageOpenCart: string
  }
  cinematicFooter: {
    readyTitle: string
    ctaBanners: string
    ctaMenu: string
    ctaCatalog: string
    ctaOffers: string
    promoCarouselAria: string
    promoPickHint: string
    promoBadge: string
    prevPromo: string
    nextPromo: string
    aboutTitle: string
    aboutLead: string
    aboutBody: string
    animationSlotAria: string
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
    locationPicker: {
      title: 'Вибір локації',
      subtitle: 'Оберіть країну та місто доставки',
      country: 'Країна',
      city: 'Місто',
      loading: 'Завантаження…',
      noCountries: 'Немає доступних країн',
      noCountriesAdminHint: 'Додайте країни та активні міста в адмін-панелі (розділ «Міста»).',
      noCountriesDevHint: 'Локально: у корені проєкту npm run local:prepare, потім npm run local:backend (порт 5050) та npm run local:web.',
      noCitiesInCountry: 'Немає міст для цієї країни',
      addCitiesAdmin: 'Додайте міста в адмін-панелі.',
      noActiveCities: 'Немає активних міст',
      activateInAdmin: 'Увімкніть міста в адмін-панелі.',
      chooseLocation: 'Оберіть місто',
      ariaOpen: 'Відкрити вибір міста доставки',
      ariaClose: 'Закрити',
    },
    deliveryPage: {
      kicker: 'WATTA',
      kickerScript: 'прямо до дверей',
      headlineLead: 'Доставка',
      headlineMark: 'без компромісів',
      headlineTrail: 'Свіжі роли, чіткі зони на карті й час, який можна планувати.',
      sub: 'Оберіть місто — подивіться карту та умови. Ми їдемо туди, де ви нас чекаєте.',
      statFresh: 'Щоденна свіжість',
      statFast: 'Збираємо швидко',
      statCity: 'Ваше місто на мапі',
      citiesLabel: 'Міста доставки',
      mapAll: 'Усі міста',
      mapFocus: 'Місто',
      loading: 'Завантажуємо маршрути…',
      zonesTitle: 'Зони доставки',
      zoneAvailable: 'Доставка в межах зони',
      conditionsTitle: 'Умови',
      minOrder: 'Мінімальна сума замовлення — 700 € (для вашого міста уточнюйте в оператора).',
      remoteHint: 'До віддалених районів — за попередньою домовленістю.',
      hoursTitle: 'Ми на звʼязку',
      hoursRange: '11:00 — 22:30',
      howTitle: 'Як замовити',
      stepWeb: 'На сайті',
      stepApp: 'У застосунку',
      stepPhone: 'Телефоном',
      stepWebDesc: 'Меню, кошик, оплата й адреса — усе в один клік, без зайвих кроків.',
      stepAppDesc: 'Той самий зручний досвід у застосунку — швидке повторення улюблених замовлень.',
      stepPhoneDesc: 'Зателефонуйте — підкажемо по меню, зонах і часу доставки.',
      kitchenMapCaption: 'Наша кухня на карті',
      conditionsKicker: 'Сервіс',
      conditionsFeature1: 'Мінімум і тарифи для вашого міста — за узгодженням з оператором.',
      conditionsFeature2: 'Зони доставки прозорі: дивіться карту та перевірку за індексом вище.',
      conditionsFeature3: 'До віддалених точок — за попередньою домовленістю.',
      deliveryPromiseKicker: 'Пунктуальність',
      deliveryPromiseTitle: 'Веземо вчасно й акуратно',
      deliveryPromiseText:
        'Плануємо збірку та маршрут так, щоб роли приїхали свіжими й у зручний для вас інтервал. Слідкуємо за навантаженням кухні та дорогою.',
      deliveryPromiseFoot:
        'Якщо затримка з нашої сторони — повідомимо вас одразу. Ваша вечеря для нас у пріоритеті.',
      openMaps: 'Відкрити адресу кухні в Google Maps',
      title: 'Доставка',
      description: 'Суші та роли з доставкою у ваше місто.',
      workingHours: 'Режим роботи',
      payment: 'Оплата',
      postalTitle: 'Перевірка за індексом',
      postalDesc:
        'Оберіть місто зі списку (як у шапці сайту) і введіть поштовий індекс — покажемо, чи потрапляє адреса в зону доставки. Межі зон і тарифи задає лише адміністратор.',
      postalLabel: 'Поштовий індекс',
      postalPlaceholder: 'Напр. 01001 або 1012 AB',
      postalButton: 'Перевірити',
      postalChecking: 'Шукаємо адресу…',
      postalInside: 'Доставка доступна у зоні',
      postalOutside: 'За межами зон доставки для цього міста',
      postalNoZones:
        'Для цього міста ще не накреслені зони на карті — уточнюйте доставку в оператора. Тарифи встановлює адміністратор.',
      postalFoundIndexNoZonesTitle:
        'Поштовий індекс знайдено — координати підтверджені (карта). Зони доставки для цього міста ще не накреслені в адмін-панелі.',
      postalGeocodeFail: 'Не вдалося знайти адресу за цим індексом — перевірте написання та країну міста.',
      postalBadRequest: 'Оберіть місто та введіть індекс.',
      postalZone: 'Зона',
      postalAddressFound: 'Знайдено',
      adminZonesNote:
        'Карта зон і вартість доставки (фікс / за км) налаштовуються тільки в адмін-панелі; на сайті змінити їх неможливо.',
      tariffPerKm: 'Тариф за км у місті',
      tariffBase: 'Базова доставка при замовленні',
      tariffFreeFrom: 'Безкоштовна доставка від суми',
      syncCityHint: 'Місто збігається з обраним у верхній панелі.',
      cityNoDeliveryYet: 'Для цього міста ще немає доставки.',
      mapZonesHint: 'Натисніть на кольорову зону на карті — покажемо умови доставки для неї.',
      mapInteractiveAria: 'Інтерактивна карта зон доставки',
      zonePopupFree: 'Безкоштовна доставка в цій зоні.',
      zonePopupFlat: 'Фіксована доставка: {{amount}} €',
      zonePopupStandardTitle: 'Стандартний тариф для цієї зони',
      zonePopupStandardBase: 'Базова доставка: {{base}} €',
      zonePopupStandardPerKm: 'Додатково: {{perKm}} € / км (за містом)',
      zonePopupStandardFreeFrom: 'Безкоштовна доставка від суми замовлення {{from}} €',
      zoneFeeFree: 'Доставка: безкоштовно',
      zoneFeeFlat: 'Доставка: {{amount}} €',
      zoneFeeStandard: 'Доставка: база + €/км (деталі по кліку на зону)',
      postalZoneTariffFree: 'Тариф зони: безкоштовна доставка',
      postalZoneTariffFlat: 'Тариф зони: {{amount}} €',
      postalZoneTariffStandard: 'Тариф зони: стандарт (база + €/км)',
      estimatedDeliveryApprox: 'Орієнтовна доставка: {{amount}} €',
      distanceFromKitchen: 'Відстань від кухні (орієнтовно): {{km}} км',
    },
    categories: { rolls: 'Роли', sushi: 'Суші', sets: 'Сети', soups: 'Супи', bowls: 'Боули', snacks: 'Закуски', drinks: 'Напої', sauces: 'Соуси' },
    hero: { title: 'Користь азіатських супів' },
    welcomeHero: {
      title: 'Watta Sushi',
      description:
        'Японська кухня з душею: свіжі роли, суші та авторські страви — з доставкою до вашого столу. Смак, який хочеться повторювати.',
    },
    section: { title: 'Доставка суші у Києві', description: 'В асортименті Watta Sushi представлені роли, суші, сети і напої на будь-який смак. Ми рекомендуємо обов\'язково спробувати топ позиції нашого меню!' },
    homeBrandSection: {
      kicker: 'WATTA SUSHI',
      kickerScript: 'японська гастрономія',
      pillar1Label: 'смак',
      pillar1Word: 'СИМФОНІЯ',
      pillar2Label: 'рецептура',
      pillar2Word: 'ТРАДИЦІЇ',
      pillar3Label: 'баланс',
      pillar3Word: 'ГАРМОНІЯ',
      footerHint: 'Нижче — оберіть категорію в меню',
    },
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
      admin: 'Адмін-панель',
      favorites: 'Обране'
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
      },
      heroKicker: "Швидка гастрономія",
      heroWordmark: "SUSHI · ROLLS · ДОСТАВКА",
      storyTitle: "Наша історія — це смак і дисципліна",
      storyLead: "Watta Sushi почалася з простої ідеї: японська кухня може бути одночасно швидкою, охайною та щиро смачною — без компромісів щодо риби, рису й температури.",
      storyP2: "Ми не збираємо роли «на склад»: кожен сет збирається під ваше замовлення. Соуси й рис тримаємо в чітких режимах, а начинку не жаліємо — щоб кожен шматочок відчувався.",
      storyP3: "Команда в залі й на доставці говорить однією мовою — про турботу. Ми підкажемо, що обрати під настрій, подію чи дієту, і чесно скажемо, якщо щось краще спробувати іншим разом.",
      journeyTitle: "Шлях страви до вас",
      journeySub: "Від ідеї до столу — кілька кроків, які ми відпрацьовуємо щодня.",
      j1Title: "Ідея та меню",
      j1Body: "Карта страв оновлюється з урахуванням сезону, постачальників і того, що ви найчастіше замовляєте.",
      j2Title: "Кухня",
      j2Body: "Чисті процеси, контроль часу приготування та сервіровки — щоб смак був передбачувано відмінним.",
      j3Title: "Упаковка",
      j3Body: "Герметичні контейнери, акуратні соуси окремо — їжа доїжджає охайною та охолодженою.",
      j4Title: "Доставка",
      j4Body: "Кур’єри знають маршрути; ми синхронізуємо час, щоб ви отримали роли в найкращому вигляді.",
      bentoTitle: "Те, за що нас обирають",
      bentoSub: "Чотири опори бренду — у візуальній сітці та в реальній кухні.",
      bento1Title: "Дисципліна рису",
      bento1Body: "Правильна кислотність, температура й текстура — база, без якої рол не «сидить» на язиці.",
      bento2Title: "Риба та постачання",
      bento2Body: "Працюємо з перевіреними ланцюгами; свіжість для нас не гасло, а стандарт.",
      bento3Title: "Швидкість без паніки",
      bento3Body: "Темп на кухні високий, але не хаотичний — ви отримуєте страву, а не «щось схоже на суші».",
      bento4Title: "Еко-акцент",
      bento4Body: "Менше зайвого пластику там, де це можливо, і відповідальна утилізація — крок за кроком.",
      manifesto: "Ми не граємо в японську кухню — ми її шанобливо готуємо.",
      manifestoSig: "— Команда Watta Sushi",
      ctaMenu: "Перейти до меню",
      ctaContacts: "Зв’язатися",
      ctaDelivery: "Умови доставки",
      visitStripTitle: "Завітати або написати",
      addressLine: "Amstelveenseweg 192, 1075 XR Amsterdam, Netherlands",
      hoursLine: "Щодня 12:00 — 22:00",
      phoneLine: "+31 6 1234 5678",
      teamEmptyTitle: "Команда на фото з’явиться зовсім скоро",
      teamEmptyBody: "Поки що знайомтесь з нами через страви — кожен рол уже зроблений руками наших шефів.",
      marqueeWords: "Свіжість|Температура|Смак|Команда|Амстердам|Роли|Суші|Доставка|Якість",
    },
    menuView: {
      itemsCount: 'страв',
      emptyCategoryTitle: 'Товарів у цій категорії поки немає',
      emptyCategoryDesc: 'Додайте товари через адмін-панель',
      seeAll: 'Подивитися всі',
      footerPromoSeeOffers: 'Усі акції та банери — нижче',
      footerPromoAriaRegion: 'Акції та спецпропозиції',
      welcomeBadgeAria: 'Вітання різними мовами та назва бренду',
      welcomeScrollDownAria: 'Прокрутити до наступного екрана',
      gastronomyTitle: 'Японська гастрономія',
      homeCatalogTitle: 'Усе меню',
      homeCatalogSub: 'Оберіть категорію в панелі зверху — сторінка прокрутиться до відповідного блоку.',
      catalogOnCategoryPageHint:
        'Страви обраної категорії відкриваються на окремій сторінці — натисніть тип у сітці нижче або в панелі категорій.',
      categoryPageBack: 'На головну',
      categoryPageEmpty: 'У цій категорії поки немає позицій.',
      categoryPageOpenCart: 'Кошик',
    },
    cinematicFooter: {
      readyTitle: 'Готові замовити?',
      ctaBanners: 'До банерів і акцій',
      ctaMenu: 'Відкрити меню',
      ctaCatalog: 'Каталог страв',
      ctaOffers: 'Пропозиції',
      promoCarouselAria: 'Акційні пропозиції — гортайте вліво-вправо',
      promoPickHint: 'Торкніться картки — відкриємо повне меню',
      promoBadge: 'Акція',
      prevPromo: 'Попередня',
      nextPromo: 'Наступна',
      aboutTitle: 'WATTA — смак без зайвого шуму',
      aboutLead:
        'Ми не граємо в «японську кухню з доставкою» — ми про точність рецепту, свіжість і сервіс, яким можна пишатися.',
      aboutBody:
        'Роли збираємо на замовлення, тримаємо дисципліну температури для рису й соусів, а команда чесно підкаже, що обрати під ваш настрій. Це не фастфуд — це швидка гастрономія з характером.',
      animationSlotAria: 'Місце для анімації бренду',
    },
  adminCategory: {
    manageTitle: 'Управління категоріями меню',
    addCategory: '➕ Додати категорію',
    subcategoriesCount: 'підкатегорій',
    enterNewName: 'Введіть нову назву:',
    addSubcategory: '➕ Підкатегорія'
  },
    promotionsPage: {
      title: "Акції",
      description: "Спеціальні пропозиції",
      listHeading: "Новини та акції",
      detailsCta: "Детальніше",
      morePhotosBadge: "+{{count}} фото",
      offersBadge: "{{count}} акцій",
      noPhoto: "Без фото",
      loading: "Завантаження...",
      notFound: "Матеріал не знайдено",
      galleryAria: "Галерея зображень",
      offersTitle: "Страви зі знижкою",
      wasPrice: "Було",
      offPercent: "−{{percent}}%",
      hitBadge: "ХІТ",
    },
    profilePage: { title: "Профіль", logout: "Вийти", orderHistory: "Історія замовлень" },
    clientProfile: {
      loading: 'Завантаження…',
      redirectLogin: 'Перенаправлення на вхід…',
      backHome: 'На головну',
      brandSubtitle: 'WATTA SUSHI',
      bonuses: 'Ваші бонуси',
      tabHistory: 'Історія замовлень',
      tabAddress: 'Адреси доставки',
      tabFavorites: 'Обране',
      tabData: 'Особисті дані',
      tabAdmin: 'Адмін-панель',
      logout: 'Вийти',
      emptyOrders: 'Ви ще нічого не замовляли',
      goMenu: 'Перейти до меню',
      orderLabel: 'Замовлення',
      total: 'Разом',
      reorder: 'Повторити замовлення',
      journeyHint: 'Статус оновлюється автоматично, коли кухня змінює етап у системі.',
      stepPending: 'Очікує підтвердження',
      stepConfirmed: 'Підтверджено',
      stepCooking: 'Готується',
      stepDelivering: 'У доставці',
      stepReceived: 'Отримано',
      stepReview: 'Залишити відгук',
      stepReviewDone: 'Дякуємо за відгук',
      orderCancelled: 'Замовлення скасовано',
      liveUpdating: 'Онлайн-статус',
      reviewOpen: 'Написати відгук',
      reviewModalTitle: 'Ваш відгук про замовлення',
      reviewText: 'Розкажіть, як усе пройшло…',
      reviewPhotos: 'Фото (до 6)',
      pickPhotos: 'Обрати зображення',
      reviewSend: 'Надіслати відгук',
      favoritesTitle: 'Обрані товари',
      favEmpty: 'У вас поки немає обраних товарів',
      favToMenu: 'Перейти до меню',
      addrTitle: 'Мої адреси',
      addrSub: 'Збережені адреси доставки',
      addrEmptyTitle: 'Адреси не збережені',
      addrEmptySub: 'Додайте адресу при оформленні замовлення',
      dataTitle: 'Особисті дані',
      dataSub: 'Ваша контактна інформація',
      labelName: "Ім'я",
      labelPhone: 'Телефон',
      labelEmail: 'Email',
      notSpecified: 'Не вказано',
    },
    reviewsPublic: {
      title: 'Відгуки клієнтів',
      subtitle: 'Щирі враження про доставку, смак і сервіс Watta Sushi.',
      empty: 'Ще немає опублікованих відгуків — станьте першим після замовлення.',
      loginCta: 'Увійдіть, щоб залишити відгук у профілі після отримання замовлення.',
      openProfile: 'На головну — профіль у меню',
    },
    blogPublic: {
      title: 'Блог і рецепти шефа',
      subtitle: 'Секрети приготування, поради та нотатки команди Watta Sushi.',
      empty: 'Скоро тут з’являться нові статті.',
      readMore: 'Читати далі',
      backToBlog: 'Усі статті',
    },
    contactPage: {
      heroKicker: 'Зв’яжіться з нами',
      heroTitle: 'Watta Sushi поруч',
      heroSubtitle: 'Питання по меню, доставці, корпоративам або співпраці — напишіть, і команда відповість якнайшвидше.',
      ctaForm: 'Написати нам',
      ctaDelivery: 'Зони доставки',
      stat1Val: '~15 хв',
      stat1Label: 'Середній час відповіді в чаті',
      stat2Val: 'Amsterdam+',
      stat2Label: 'Регіон доставки та самовивіз',
      stat3Val: '100%',
      stat3Label: 'Свіжі інгредієнти щодня',
      channelsTitle: 'Як з нами зв’язатися',
      channelsSub: 'Оберіть зручний канал — усі лінії ведуть до однієї кухні.',
      cardCall: 'Телефон',
      cardEmail: 'Email',
      cardAddress: 'Адреса кухні',
      cardHours: 'Години',
      phoneDisplay: '+31 6 1234 5678',
      phoneTel: '+31612345678',
      emailDisplay: 'hello@watta-sushi.nl',
      emailMailto: 'hello@watta-sushi.nl',
      hoursDetail: 'Щодня 12:00 — 22:00',
      openMaps: 'Відкрити в Google Maps',
      mapTitle: 'Ми на карті',
      mapSub: 'Самовивіз за попереднім замовленням — уточнюйте час у чаті або телефоном.',
      socialTitle: 'Соцмережі та месенджери',
      faqTitle: 'Часті питання',
      faqSub: 'Коротко про доставку, оплату та замовлення.',
      faq1Q: 'Як швидко привезете замовлення?',
      faq1A: 'Час залежить від завантаженості кухні та маршруту кур’єра. Точний інтервал повідомляємо після підтвердження.',
      faq2Q: 'Чи можна змінити адресу після оформлення?',
      faq2A: 'Так, якщо кур’єр ще не виїхав — напишіть або зателефонуйте, і ми оновимо маршрут.',
      faq3Q: 'Які способи оплати є?',
      faq3A: 'Картка онлайн, готівка або термінал у кур’єра — залежно від міста та налаштувань на сайті.',
      faq4Q: 'Чи є безглютенові або вегетаріанські опції?',
      faq4A: 'У меню є позиції без риби та з овочами; про алергени краще написати в повідомленні — підкажемо по складу.',
      faq5Q: 'Робите корпоративні сети?',
      faq5A: 'Так, збираємо великі замовлення з урахуванням часу подачі. Залиште деталі у формі — менеджер зв’яжеться.',
      formTitle: 'Форма зворотного зв’язку',
      formSub: 'Заповніть поля — отримаємо листа на кухню та відповімо на email.',
      phName: 'Ваше ім’я',
      phEmail: 'you@example.com',
      phPhone: '+31 … (необов’язково)',
      phMessage: 'Розкажіть, чим можемо допомогти…',
      formSubmit: 'Надіслати',
      formSending: 'Надсилаємо…',
      formSuccess: 'Дякуємо! Ми отримали повідомлення.',
      formError: 'Не вдалося надіслати. Спробуйте пізніше.',
      formNetwork: 'Помилка мережі. Перевірте з’єднання.',
      errName: 'Вкажіть ім’я (2–120 символів).',
      errEmail: 'Введіть коректний email.',
      errMessage: 'Повідомлення — від 10 до 4000 символів.',
      honeyLabel: 'Не заповнюйте це поле',
      bottomTitle: 'Готові до смаку Watta?',
      bottomCta: 'Перейти до меню',
      scrollHint: 'Гортайте вниз',
      addressLine: 'Amstelveenseweg 192, 1075 XR Amsterdam, Netherlands',
    },
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
      header: {
        title: "Адмін-панель",
        subtitle: "Статистика замовлень, товарів і доставок у одному місці.",
        siteMenu: "Меню сайту",
        backAria: "Назад",
        refreshTitle: "Оновити дані",
        openMenuTitle: "Відкрити меню",
        closeDrawerAria: "Закрити",
        adminLangUk: "УКР",
        adminLangRu: "РУС",
        adminLangHint: "Мова панелі",
      },
      sidebar: { selectSection: "Оберіть розділ", dashboard: "📊 Дашборд", dashboardDesc: "Статистика та огляд", orders: "📦 Замовлення", ordersDesc: "Управління замовленнями", products: "🍣 Товари", productsDesc: "Меню та позиції", promos: "🏷️ Промокоди", promosDesc: "Знижки", cities: "🏙️ Міста", citiesDesc: "Міста та країни", banners: "🎨 Банери", bannersDesc: "Банери", categories: "📋 Категорії", categoriesDesc: "Категорії меню", users: "👥 Користувачі", usersDesc: "Список клієнтів", team: "👨‍👩‍👧‍👦 Команда", teamDesc: "Співробітники", settings: "⚙️ Налаштування", settingsDesc: "Сайт і банери", ingredients: "🥑 Інгредієнти", newsletter: "📧 Розсилка" },
      dashboard: {
        loading: "Завантаження...",
        revenue: "Виручка (виконані)",
        orders: "Усього замовлень",
        products: "Товарів",
        cities: "Міст",
        statusTitle: "Замовлення за статусами",
        statusPending: "Очікують",
        statusCooking: "Готуються",
        statusDelivering: "У доставці",
        statusCompleted: "Виконані",
        statusCancelled: "Скасовані",
        promos: "Промокодів",
        categories: "Категорій",
        users: "Користувачів",
        paidOrders: "Оплачених замовлень",
        statsHint: "Показники з бази даних сайту (оновлюються при натисканні «Оновити»).",
        banners: "Банерів",
        blog: "Статей блогу",
        ingredients: "Інгредієнтів",
        team: "У команді",
        countries: "Країн",
        contentSection: "Каталог і контент",
        statsFallback: "розрахунок зі списку замовлень",
        studioHeadline: "Пульс Watta Sushi",
        studioSub: "Статистика, графіки та каталог у стилі сайту.",
        chartRevenue14d: "Виручка виконаних (14 днів)",
        chartOrders14d: "Замовлень за день (усі)",
        chartStatusPie: "Розподіл за статусами",
        chartNoData: "Ще немає даних для графіка",
        avgOrderValue: "Середній чек (виконані)",
      },
      actions: { add: "+ Додати", edit: "Редагувати", editShort: "Змінити", delete: "Видалити", save: "Зберегти", saveChanges: "Зберегти зміни", cancel: "Скасувати" },
      common: { menuChangeSection: "Меню / змінити розділ", emptyOrders: "Немає активних замовлень", emptyCities: "Міст поки немає", emptyBanners: "Банерів поки немає", emptyCategories: "Категорій поки немає", emptyUsers: "Користувачів поки немає", emptyTeam: "Членів команди поки немає", emptyPromos: "Промокодів поки немає", clickToUpload: "Натисніть, щоб завантажити фото", changeFile: "Змінити", selectFromList: "Вибрати зі списку", activeLabel: "Активно", inactiveLabel: "Неактивно", yes: "Так", no: "Ні", orderIndex: "Порядок відображення", choose: "Вибрати", notFound: "Нічого не знайдено. Спробуйте інший запит.", searching: "пошук...", bannerDragHint: "Перетягніть картку на іншу, щоб змінити порядок на сайті", bannerOrderSaved: "Порядок банерів збережено", bannerOrderSaveError: "Не вдалося зберегти порядок банерів" },
      orders: { orderNum: "Замовлення №", noComment: "Без коментаря", payment: "Оплата", cash: "Готівка", online: "Онлайн", paid: "ОПЛАЧЕНО", error: "ПОМИЛКА", waiting: "ОЧІКУЄ", hintConfirmed: "Підтверджено", hintCooking: "Готується", hintDelivering: "В доставці", hintCompleted: "Виконано", hintCancel: "Скасувати", fulfillmentDelivery: "Доставка", fulfillmentPickup: "Самовивіз", deliveryFeeAdmin: "Доставка:" },
      news: { title: "Новини", addBtn: "+ Додати", editTitle: "Редагувати", newTitle: "Нова новина", titlePlaceholder: "Заголовок", descPlaceholder: "Короткий опис", textPlaceholder: "Повний текст", isHit: "Хіт продажу", galleryLabel: "Галерея фото", uploadPhotos: "Додати фото (кілька)", removePhotoAria: "Прибрати фото", dishesBlock: "Страви зі знижкою в цій новині", selectProduct: "Оберіть страву", discountShort: "Знижка %", addDish: "Додати страву", dishDuplicate: "Ця страва вже додана", pickProductFirst: "Спочатку оберіть страву" },
      products: { addBtn: "+ Додати товар", hit: "ХІТ", editTitle: "Редагувати страву", newTitle: "Нова страва", nameLabel: "Назва товару", namePlaceholder: "Наприклад: Філадельфія", descLabel: "Опис", descPlaceholder: "Склад, вага, особливості...", priceLabel: "Ціна (€)", categoryLabel: "Категорія", selectCategory: "Оберіть...", deliveryCities: "Міста доставки *", addCitiesFirst: "Спочатку додайте міста у вкладці 'Міста'", descComposition: "Описи (Склад)", ingComposition: "Інгредієнти (Склад)" },
      ingredients: { title: "Бібліотека інгредієнтів", addNew: "Додати новий", nameRu: "Назва", namePlaceholder: "Наприклад: Лосось", addBtn: "Додати" },
      cities: { addCountry: "Додати нову країну", nameRu: "Назва *", sticker: "Стікер країни (прапор)", addCountryBtn: "✨ Додати країну", countriesTitle: "Країни", editCity: "Редагувати місто", addCity: "Додати нове місто", cityNameRu: "Назва міста *", searchMapLabel: "📍 Пошук міста на карті", searchMapDesc: "Шукайте за адресою, індексом або кодом.", searchMapPlaceholder: "Назва, адреса, індекс...", searchMapBtn: "Шукати за назвами", countryLabel: "Країна *", selectCountry: "Оберіть країну", activeCity: "Активне місто", saveChanges: "💾 Зберегти зміни", addCityBtn: "✨ Додати місто", cancelEdit: "Скасувати редагування", citiesTitle: "Міста", deliveryZones: "Зон доставки:" },
      banners: { addBtn: "+ Додати банер", tabSubtitle: "Карусель на головній: фото, кадр і переклади.", editTitle: "Редагувати банер", newTitle: "Новий банер", titleRu: "Заголовок *", titlePlaceholder: "Наприклад: Суші-бургери: ідеальний перекус" },
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
    locationPicker: {
      title: 'Выбор локации',
      subtitle: 'Выберите страну и город доставки',
      country: 'Страна',
      city: 'Город',
      loading: 'Загрузка…',
      noCountries: 'Нет доступных стран',
      noCountriesAdminHint: 'Добавьте страны и активные города в админ-панели (раздел «Города»).',
      noCountriesDevHint: 'Локально: в корне проекта npm run local:prepare, затем npm run local:backend (порт 5050) и npm run local:web.',
      noCitiesInCountry: 'Нет городов для этой страны',
      addCitiesAdmin: 'Добавьте города в админ-панели.',
      noActiveCities: 'Нет активных городов',
      activateInAdmin: 'Включите города в админ-панели.',
      chooseLocation: 'Выберите город',
      ariaOpen: 'Открыть выбор города доставки',
      ariaClose: 'Закрыть',
    },
    deliveryPage: {
      kicker: 'WATTA',
      kickerScript: 'прямо к двери',
      headlineLead: 'Доставка',
      headlineMark: 'без компромиссов',
      headlineTrail: 'Свежие роллы, понятные зоны на карте и время, на которое можно опереться.',
      sub: 'Выберите город — посмотрите карту и условия. Мы едем туда, где нас ждут.',
      statFresh: 'Свежесть каждый день',
      statFast: 'Собираем быстро',
      statCity: 'Ваш город на карте',
      citiesLabel: 'Города доставки',
      mapAll: 'Все города',
      mapFocus: 'Город',
      loading: 'Загружаем маршруты…',
      zonesTitle: 'Зоны доставки',
      zoneAvailable: 'Доставка в пределах зоны',
      conditionsTitle: 'Условия',
      minOrder: 'Минимальная сумма заказа — 700 € (для вашего города уточняйте у оператора).',
      remoteHint: 'В отдалённые районы — по предварительной договорённости.',
      hoursTitle: 'Мы на связи',
      hoursRange: '11:00 — 22:30',
      howTitle: 'Как заказать',
      stepWeb: 'На сайте',
      stepApp: 'В приложении',
      stepPhone: 'По телефону',
      stepWebDesc: 'Меню, корзина, оплата и адрес — всё на сайте без лишних шагов.',
      stepAppDesc: 'Тот же удобный опыт в приложении — быстрый повтор любимых заказов.',
      stepPhoneDesc: 'Позвоните — подскажем по меню, зонам и времени доставки.',
      kitchenMapCaption: 'Наша кухня на карте',
      conditionsKicker: 'Сервис',
      conditionsFeature1: 'Минимум и тарифы для вашего города — уточняйте у оператора.',
      conditionsFeature2: 'Зоны доставки прозрачны: смотрите карту и проверку по индексу выше.',
      conditionsFeature3: 'В отдалённые точки — по предварительной договорённости.',
      deliveryPromiseKicker: 'Пунктуальность',
      deliveryPromiseTitle: 'Привозим вовремя и аккуратно',
      deliveryPromiseText:
        'Планируем сборку и маршрут так, чтобы роллы приехали свежими и в удобный для вас интервал.',
      deliveryPromiseFoot:
        'Если задержка с нашей стороны — сразу предупредим. Ваш ужин для нас в приоритете.',
      openMaps: 'Открыть адрес кухни в Google Maps',
      title: 'Доставка',
      description: 'Суши и роллы с доставкой в ваш город.',
      workingHours: 'Режим работы',
      payment: 'Оплата',
      postalTitle: 'Проверка по индексу',
      postalDesc:
        'Выберите город из списка (как в шапке сайта) и введите почтовый индекс — покажем, попадает ли адрес в зону доставки. Границы зон и тарифы задаёт только администратор.',
      postalLabel: 'Почтовый индекс',
      postalPlaceholder: 'Напр. 01001 или 1012 AB',
      postalButton: 'Проверить',
      postalChecking: 'Ищем адрес…',
      postalInside: 'Доставка доступна в зоне',
      postalOutside: 'Вне зон доставки для этого города',
      postalNoZones:
        'Для этого города ещё не заданы зоны на карте — уточняйте у оператора. Тарифы настраивает администратор.',
      postalFoundIndexNoZonesTitle:
        'Индекс найден — координаты подтверждены (карта). Зоны доставки для этого города ещё не нарисованы в админ-панели.',
      postalGeocodeFail: 'Не удалось найти адрес по индексу — проверьте написание и страну города.',
      postalBadRequest: 'Выберите город и введите индекс.',
      postalZone: 'Зона',
      postalAddressFound: 'Найдено',
      adminZonesNote:
        'Карта зон и стоимость доставки настраиваются только в админ-панели; на сайте изменить их нельзя.',
      tariffPerKm: 'Тариф за км в городе',
      tariffBase: 'Базовая доставка при заказе',
      tariffFreeFrom: 'Бесплатная доставка от суммы',
      syncCityHint: 'Город совпадает с выбранным в верхней панели.',
      cityNoDeliveryYet: 'Для этого города пока нет доставки.',
      mapZonesHint: 'Нажмите на цветную зону на карте — покажем условия доставки.',
      mapInteractiveAria: 'Интерактивная карта зон доставки',
      zonePopupFree: 'Бесплатная доставка в этой зоне.',
      zonePopupFlat: 'Фиксированная доставка: {{amount}} €',
      zonePopupStandardTitle: 'Стандартный тариф для этой зоны',
      zonePopupStandardBase: 'Базовая доставка: {{base}} €',
      zonePopupStandardPerKm: 'Дополнительно: {{perKm}} € / км',
      zonePopupStandardFreeFrom: 'Бесплатная доставка от суммы заказа {{from}} €',
      zoneFeeFree: 'Доставка: бесплатно',
      zoneFeeFlat: 'Доставка: {{amount}} €',
      zoneFeeStandard: 'Доставка: база + €/км (подробности по клику на зону)',
      postalZoneTariffFree: 'Тариф зоны: бесплатная доставка',
      postalZoneTariffFlat: 'Тариф зоны: {{amount}} €',
      postalZoneTariffStandard: 'Тариф зоны: стандарт (база + €/км)',
      estimatedDeliveryApprox: 'Ориентировочная доставка: {{amount}} €',
      distanceFromKitchen: 'Расстояние от кухни (примерно): {{km}} км',
    },
    categories: { rolls: 'Роллы', sushi: 'Суши', sets: 'Сеты', soups: 'Супы', bowls: 'Боулы', snacks: 'Закуски', drinks: 'Напитки', sauces: 'Соусы' },
    hero: { title: 'Польза азиатских супов' },
    welcomeHero: {
      title: 'Watta Sushi',
      description:
        'Японская кухня с душой: свежие роллы, суши и авторские блюда — с доставкой к вашему столу. Вкус, который хочется повторять.',
    },
    section: { title: 'Доставка суши в Киеве', description: 'В ассортименте Watta Sushi представлены роллы, суши, сеты и напитки на любой вкус. Мы рекомендуем обязательно попробовать топ позиции нашего меню!' },
    homeBrandSection: {
      kicker: 'WATTA SUSHI',
      kickerScript: 'японская гастрономия',
      pillar1Label: 'вкус',
      pillar1Word: 'СИМФОНИЯ',
      pillar2Label: 'рецептура',
      pillar2Word: 'ТРАДИЦИИ',
      pillar3Label: 'баланс',
      pillar3Word: 'ГАРМОНИЯ',
      footerHint: 'Ниже выберите категорию в меню',
    },
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
      admin: 'Админ-панель',
      favorites: 'Избранное'
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
      },
      heroKicker: "Быстрая гастрономия",
      heroWordmark: "SUSHI · ROLLS · ДОСТАВКА",
      storyTitle: "Наша история — вкус и дисциплина",
      storyLead: "Watta Sushi началась с простой идеи: японская кухня может быть одновременно быстрой, аккуратной и по-настоящему вкусной — без компромиссов по рыбе, рису и температуре.",
      storyP2: "Мы не катаем роллы «на склад»: каждый сет собирается под ваш заказ. Соусы и рис держим в жёстких режимах, а начинку не жалеем — чтобы каждый кусочек чувствовался.",
      storyP3: "Команда в зале и на доставке говорит на одном языке — заботы. Подскажем, что выбрать под настроение, событие или диету, и честно скажем, если что-то лучше попробовать в другой раз.",
      journeyTitle: "Путь блюда к вам",
      journeySub: "От идеи до стола — шаги, которые мы отрабатываем каждый день.",
      j1Title: "Идея и меню",
      j1Body: "Карта обновляется с учётом сезона, поставщиков и того, что вы заказываете чаще всего.",
      j2Title: "Кухня",
      j2Body: "Чистые процессы, контроль времени приготовления и подачи — чтобы вкус был предсказуемо отличным.",
      j3Title: "Упаковка",
      j3Body: "Герметичные контейнеры, соусы отдельно — еда приезжает аккуратной и холодной.",
      j4Title: "Доставка",
      j4Body: "Курьеры знают маршруты; синхронизируем время, чтобы роллы приехали в лучшем виде.",
      bentoTitle: "За что нас выбирают",
      bentoSub: "Четыре опоры бренда — на экране и на кухне.",
      bento1Title: "Дисциплина риса",
      bento1Body: "Кислотность, температура и текстура — база, без которой ролл не «сидит» на языке.",
      bento2Title: "Рыба и поставки",
      bento2Body: "Работаем с проверенными цепочками; свежесть для нас не лозунг, а стандарт.",
      bento3Title: "Скорость без паники",
      bento3Body: "Темп высокий, но не хаос — вы получаете блюдо, а не «что-то похожее на суши».",
      bento4Title: "Эко-акцент",
      bento4Body: "Меньше лишнего пластика там, где возможно, и ответственная утилизация — шаг за шагом.",
      manifesto: "Мы не играем в японскую кухню — мы готовим её с уважением.",
      manifestoSig: "— Команда Watta Sushi",
      ctaMenu: "Перейти в меню",
      ctaContacts: "Связаться",
      ctaDelivery: "Условия доставки",
      visitStripTitle: "Приехать или написать",
      addressLine: "Amstelveenseweg 192, 1075 XR Amsterdam, Netherlands",
      hoursLine: "Ежедневно 12:00 — 22:00",
      phoneLine: "+31 6 1234 5678",
      teamEmptyTitle: "Скоро здесь появятся фото команды",
      teamEmptyBody: "Пока знакомьтесь с нами через блюда — каждый ролл уже сделан руками наших шефов.",
      marqueeWords: "Свежесть|Температура|Вкус|Команда|Амстердам|Роллы|Суши|Доставка|Качество",
    },
    menuView: {
      itemsCount: 'блюд',
      emptyCategoryTitle: 'Товаров в этой категории пока нет',
      emptyCategoryDesc: 'Добавьте товары через админ-панель',
      seeAll: 'Посмотреть все',
      footerPromoSeeOffers: 'Все акции и баннеры — ниже',
      footerPromoAriaRegion: 'Акции и спецпредложения',
      welcomeBadgeAria: 'Приветствие на языках сайта и название бренда',
      welcomeScrollDownAria: 'Прокрутить к следующему экрану',
      gastronomyTitle: 'Японская гастрономия',
      homeCatalogTitle: 'Всё меню',
      homeCatalogSub: 'Выберите категорию на панели сверху — страница прокрутится к нужному разделу.',
      catalogOnCategoryPageHint:
        'Блюда категории открываются на отдельной странице — выберите тип в сетке ниже или в панели категорий.',
      categoryPageBack: 'На главную',
      categoryPageEmpty: 'В этой категории пока нет позиций.',
      categoryPageOpenCart: 'Корзина',
    },
    cinematicFooter: {
      readyTitle: 'Готовы заказать?',
      ctaBanners: 'К баннерам и акциям',
      ctaMenu: 'Открыть меню',
      ctaCatalog: 'Каталог блюд',
      ctaOffers: 'Предложения',
      promoCarouselAria: 'Акции — листайте влево и вправо',
      promoPickHint: 'Нажмите на карточку — откроем полное меню',
      promoBadge: 'Акция',
      prevPromo: 'Назад',
      nextPromo: 'Вперёд',
      aboutTitle: 'WATTA — вкус без лишнего шума',
      aboutLead:
        'Мы не играем в «японскую кухню с доставкой» — мы про точность рецепта, свежесть и сервис, которым можно гордиться.',
      aboutBody:
        'Роллы собираем под заказ, держим дисциплину температуры для риса и соусов, а команда честно подскажет, что выбрать под ваше настроение. Это не фастфуд — это быстрая гастрономия с характером.',
      animationSlotAria: 'Место для бренд-анимации',
    },
  adminCategory: {
    manageTitle: 'Управление категориями меню',
    addCategory: '➕ Добавить категорию',
    subcategoriesCount: 'подкатегорий',
    enterNewName: 'Введите новое название:',
    addSubcategory: '➕ Подкатегория'
  },
    promotionsPage: {
      title: "Акции",
      description: "Специальные предложения",
      listHeading: "Новости и акции",
      detailsCta: "Подробнее",
      morePhotosBadge: "+{{count}} фото",
      offersBadge: "{{count}} акций",
      noPhoto: "Нет фото",
      loading: "Загрузка...",
      notFound: "Материал не найден",
      galleryAria: "Галерея изображений",
      offersTitle: "Блюда со скидкой",
      wasPrice: "Было",
      offPercent: "−{{percent}}%",
      hitBadge: "ХИТ",
    },
    profilePage: { title: "Профиль", logout: "Выйти", orderHistory: "История заказов" },
    clientProfile: {
      loading: 'Загрузка…',
      redirectLogin: 'Перенаправление на вход…',
      backHome: 'На главную',
      brandSubtitle: 'WATTA SUSHI',
      bonuses: 'Ваши бонусы',
      tabHistory: 'История заказов',
      tabAddress: 'Адреса доставки',
      tabFavorites: 'Избранное',
      tabData: 'Личные данные',
      tabAdmin: 'Админ-панель',
      logout: 'Выйти',
      emptyOrders: 'Вы ещё ничего не заказывали',
      goMenu: 'Перейти в меню',
      orderLabel: 'Заказ',
      total: 'Итого',
      reorder: 'Повторить заказ',
      journeyHint: 'Статус обновляется, когда кухня меняет этап в системе.',
      stepPending: 'Ждёт подтверждения',
      stepConfirmed: 'Подтверждён',
      stepCooking: 'Готовится',
      stepDelivering: 'В доставке',
      stepReceived: 'Получен',
      stepReview: 'Оставить отзыв',
      stepReviewDone: 'Спасибо за отзыв',
      orderCancelled: 'Заказ отменён',
      liveUpdating: 'Онлайн-статус',
      reviewOpen: 'Написать отзыв',
      reviewModalTitle: 'Ваш отзыв о заказе',
      reviewText: 'Расскажите, как всё прошло…',
      reviewPhotos: 'Фото (до 6)',
      pickPhotos: 'Выбрать изображения',
      reviewSend: 'Отправить отзыв',
      favoritesTitle: 'Избранные товары',
      favEmpty: 'У вас пока нет избранных товаров',
      favToMenu: 'Перейти в меню',
      addrTitle: 'Мои адреса',
      addrSub: 'Сохранённые адреса доставки',
      addrEmptyTitle: 'Адреса не сохранены',
      addrEmptySub: 'Добавьте адрес при оформлении заказа',
      dataTitle: 'Личные данные',
      dataSub: 'Ваша контактная информация',
      labelName: 'Имя',
      labelPhone: 'Телефон',
      labelEmail: 'Email',
      notSpecified: 'Не указано',
    },
    reviewsPublic: {
      title: 'Отзывы клиентов',
      subtitle: 'Честные впечатления о доставке, вкусе и сервисе Watta Sushi.',
      empty: 'Пока нет отзывов — оставьте первый после получения заказа.',
      loginCta: 'Войдите, чтобы оставить отзыв в профиле после доставки.',
      openProfile: 'На главную — профиль в меню',
    },
    blogPublic: {
      title: 'Блог и рецепты шефа',
      subtitle: 'Секреты приготовления и заметки команды Watta Sushi.',
      empty: 'Скоро появятся новые статьи.',
      readMore: 'Читать далее',
      backToBlog: 'Все статьи',
    },
    contactPage: {
      heroKicker: 'Свяжитесь с нами',
      heroTitle: 'Watta Sushi рядом',
      heroSubtitle: 'Вопросы по меню, доставке, корпоративам или сотрудничеству — напишите, команда ответит как можно быстрее.',
      ctaForm: 'Написать нам',
      ctaDelivery: 'Зоны доставки',
      stat1Val: '~15 мин',
      stat1Label: 'Среднее время ответа в чате',
      stat2Val: 'Amsterdam+',
      stat2Label: 'Регион доставки и самовывоз',
      stat3Val: '100%',
      stat3Label: 'Свежие ингредиенты каждый день',
      channelsTitle: 'Как с нами связаться',
      channelsSub: 'Выберите удобный канал — все линии ведут на одну кухню.',
      cardCall: 'Телефон',
      cardEmail: 'Email',
      cardAddress: 'Адрес кухни',
      cardHours: 'Часы работы',
      phoneDisplay: '+31 6 1234 5678',
      phoneTel: '+31612345678',
      emailDisplay: 'hello@watta-sushi.nl',
      emailMailto: 'hello@watta-sushi.nl',
      hoursDetail: 'Ежедневно 12:00 — 22:00',
      openMaps: 'Открыть в Google Maps',
      mapTitle: 'Мы на карте',
      mapSub: 'Самовывоз по предзаказу — уточняйте время в чате или по телефону.',
      socialTitle: 'Соцсети и мессенджеры',
      faqTitle: 'Частые вопросы',
      faqSub: 'Кратко о доставке, оплате и заказах.',
      faq1Q: 'Как быстро привезёте заказ?',
      faq1A: 'Время зависит от загрузки кухни и маршрута курьера. Точный интервал сообщим после подтверждения.',
      faq2Q: 'Можно ли изменить адрес после оформления?',
      faq2A: 'Да, если курьер ещё не выехал — напишите или позвоните, обновим маршрут.',
      faq3Q: 'Какие способы оплаты доступны?',
      faq3A: 'Карта онлайн, наличные или терминал у курьера — в зависимости от города и настроек на сайте.',
      faq4Q: 'Есть безглютеновые или вегетарианские позиции?',
      faq4A: 'В меню есть блюда без рыбы и с овощами; по аллергенам лучше написать в сообщении — подскажем по составу.',
      faq5Q: 'Делаете корпоративные сеты?',
      faq5A: 'Да, собираем крупные заказы с учётом времени подачи. Оставьте детали в форме — менеджер свяжется.',
      formTitle: 'Форма обратной связи',
      formSub: 'Заполните поля — письмо попадёт на кухню, ответ придёт на email.',
      phName: 'Ваше имя',
      phEmail: 'you@example.com',
      phPhone: '+31 … (необязательно)',
      phMessage: 'Расскажите, чем можем помочь…',
      formSubmit: 'Отправить',
      formSending: 'Отправляем…',
      formSuccess: 'Спасибо! Мы получили сообщение.',
      formError: 'Не удалось отправить. Попробуйте позже.',
      formNetwork: 'Ошибка сети. Проверьте соединение.',
      errName: 'Укажите имя (2–120 символов).',
      errEmail: 'Введите корректный email.',
      errMessage: 'Сообщение — от 10 до 4000 символов.',
      honeyLabel: 'Не заполняйте это поле',
      bottomTitle: 'Готовы к вкусу Watta?',
      bottomCta: 'Перейти в меню',
      scrollHint: 'Листайте вниз',
      addressLine: 'Amstelveenseweg 192, 1075 XR Amsterdam, Netherlands',
    },
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
      header: {
        title: "Админ-панель",
        subtitle: "Статистика заказов, товаров и доставок в одном месте.",
        siteMenu: "Меню сайта",
        backAria: "Назад",
        refreshTitle: "Обновить данные",
        openMenuTitle: "Открыть меню",
        closeDrawerAria: "Закрыть",
        adminLangUk: "УКР",
        adminLangRu: "РУС",
        adminLangHint: "Язык панели",
      },
      sidebar: { selectSection: "Выберите раздел", dashboard: "📊 Дашборд", dashboardDesc: "Статистика и обзор", orders: "📦 Заказы", ordersDesc: "Управление заказами", products: "🍣 Товары", productsDesc: "Меню и позиции", promos: "🏷️ Промокоды", promosDesc: "Скидки", cities: "🏙️ Города", citiesDesc: "Города и страны", banners: "🎨 Баннеры", bannersDesc: "Баннеры", categories: "📋 Категории", categoriesDesc: "Категории меню", users: "👥 Пользователи", usersDesc: "Список клиентов", team: "👨‍👩‍👧‍👦 Команда", teamDesc: "Сотрудники", settings: "⚙️ Настройки", settingsDesc: "Сайт и баннеры", ingredients: "🥑 Ингредиенты", newsletter: "📧 Рассылка" },
      dashboard: {
        loading: "Загрузка...",
        revenue: "Выручка (выполнены)",
        orders: "Всего заказов",
        products: "Товаров",
        cities: "Городов",
        statusTitle: "Заказы по статусам",
        statusPending: "Ожидают",
        statusCooking: "Готовятся",
        statusDelivering: "В доставке",
        statusCompleted: "Выполнены",
        statusCancelled: "Отменены",
        promos: "Промокодов",
        categories: "Категорий",
        users: "Пользователей",
        paidOrders: "Оплаченных заказов",
        statsHint: "Показатели из базы данных сайта (обновляются по кнопке «Обновить»).",
        banners: "Баннеров",
        blog: "Статей блога",
        ingredients: "Ингредиентов",
        team: "В команде",
        countries: "Стран",
        contentSection: "Каталог и контент",
        statsFallback: "расчёт по списку заказов",
        studioHeadline: "Пульс Watta Sushi",
        studioSub: "Статистика и графики в стиле сайта.",
        chartRevenue14d: "Выручка выполненных (14 дней)",
        chartOrders14d: "Заказов в день (все)",
        chartStatusPie: "Распределение по статусам",
        chartNoData: "Пока недостаточно данных для графика",
        avgOrderValue: "Средний чек (выполнены)",
      },
      actions: { add: "+ Добавить", edit: "Редактировать", editShort: "Изменить", delete: "Удалить", save: "Сохранить", saveChanges: "Сохранить изменения", cancel: "Отмена" },
      common: { menuChangeSection: "Меню / изменить раздел", emptyOrders: "Нет активных заказов", emptyCities: "Городов пока нет", emptyBanners: "Баннеров пока нет", emptyCategories: "Категорий пока нет", emptyUsers: "Пользователей пока нет", emptyTeam: "Членов команды пока нет", emptyPromos: "Промокодов пока нет", clickToUpload: "Нажмите, чтобы загрузить фото", changeFile: "Изменить", selectFromList: "Выбрать из списка", activeLabel: "Активен", inactiveLabel: "Неактивен", yes: "Да", no: "Нет", orderIndex: "Порядок отображения", choose: "Выбрать", notFound: "Ничего не найдено. Попробуйте другой запрос.", searching: "поиск...", bannerDragHint: "Перетащите карточку на другую, чтобы изменить порядок на сайте", bannerOrderSaved: "Порядок баннеров сохранён", bannerOrderSaveError: "Не удалось сохранить порядок баннеров" },
      orders: { orderNum: "Заказ №", noComment: "Без комментария", payment: "Оплата", cash: "Наличные", online: "Онлайн", paid: "ОПЛАЧЕНО", error: "ОШИБКА", waiting: "ОЖИДАЕТ", hintConfirmed: "Подтверждён", hintCooking: "Готовится", hintDelivering: "В доставке", hintCompleted: "Выполнен", hintCancel: "Отменить", fulfillmentDelivery: "Доставка", fulfillmentPickup: "Самовывоз", deliveryFeeAdmin: "Доставка:" },
      news: { title: "Новости", addBtn: "+ Добавить", editTitle: "Редактировать", newTitle: "Новая новость", titlePlaceholder: "Заголовок", descPlaceholder: "Краткое описание", textPlaceholder: "Полный текст", isHit: "Хит продаж", galleryLabel: "Галерея фото", uploadPhotos: "Добавить фото (несколько)", removePhotoAria: "Убрать фото", dishesBlock: "Блюда со скидкой в этой новости", selectProduct: "Выберите блюдо", discountShort: "Скидка %", addDish: "Добавить блюдо", dishDuplicate: "Это блюдо уже добавлено", pickProductFirst: "Сначала выберите блюдо" },
      products: { addBtn: "+ Добавить товар", hit: "ХИТ", editTitle: "Редактировать блюдо", newTitle: "Новое блюдо", nameLabel: "Название товара", namePlaceholder: "Например: Филадельфия", descLabel: "Описание", descPlaceholder: "Состав, вес, особенности...", priceLabel: "Цена (€)", categoryLabel: "Категория", selectCategory: "Выберите...", deliveryCities: "Города доставки *", addCitiesFirst: "Сначала добавьте города во вкладке 'Города'", descComposition: "Описания (Состав)", ingComposition: "Ингредиенты (Состав)" },
      ingredients: { title: "Библиотека ингредиентов", addNew: "Добавить новый", nameRu: "Название", namePlaceholder: "Например: Лосось", addBtn: "Добавить" },
      cities: { addCountry: "Добавить новую страну", nameRu: "Название *", sticker: "Стикер страны (флаг)", addCountryBtn: "✨ Добавить страну", countriesTitle: "Страны", editCity: "Редактировать город", addCity: "Добавить новый город", cityNameRu: "Название города *", searchMapLabel: "📍 Поиск города на карте", searchMapDesc: "Ищите по адресу, индексу или коду.", searchMapPlaceholder: "Название, адрес, индекс...", searchMapBtn: "Искать по названиям", countryLabel: "Страна *", selectCountry: "Выберите страну", activeCity: "Активный город", saveChanges: "💾 Сохранить изменения", addCityBtn: "✨ Добавить город", cancelEdit: "Отменить редактирование", citiesTitle: "Города", deliveryZones: "Зон доставки:" },
      banners: { addBtn: "+ Добавить баннер", tabSubtitle: "Карусель на главной: фото, кадр и переводы.", editTitle: "Редактировать баннер", newTitle: "Новый баннер", titleRu: "Заголовок *", titlePlaceholder: "Например: Суши-бургеры: идеальный перекус" },
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
    locationPicker: {
      title: 'Delivery location',
      subtitle: 'Choose your country and city',
      country: 'Country',
      city: 'City',
      loading: 'Loading…',
      noCountries: 'No countries available',
      noCountriesAdminHint: 'Add countries and active cities in the admin panel (Cities section).',
      noCountriesDevHint: 'Locally: run npm run local:prepare, then npm run local:backend (port 5050) and npm run local:web.',
      noCitiesInCountry: 'No cities for this country',
      addCitiesAdmin: 'Add cities in the admin panel.',
      noActiveCities: 'No active cities',
      activateInAdmin: 'Activate cities in the admin panel.',
      chooseLocation: 'Choose city',
      ariaOpen: 'Open delivery city picker',
      ariaClose: 'Close',
    },
    deliveryPage: {
      kicker: 'WATTA',
      kickerScript: 'straight to your door',
      headlineLead: 'Delivery',
      headlineMark: 'zero compromise',
      headlineTrail: 'Fresh rolls, clear zones on the map, and a time window you can trust.',
      sub: 'Pick a city — explore the map and terms. We ride where you are waiting.',
      statFresh: 'Daily freshness',
      statFast: 'Packed fast',
      statCity: 'Your city on the map',
      citiesLabel: 'Delivery cities',
      mapAll: 'All cities',
      mapFocus: 'City',
      loading: 'Loading routes…',
      zonesTitle: 'Delivery zones',
      zoneAvailable: 'Delivery within zone',
      conditionsTitle: 'Terms',
      minOrder: 'Minimum order — €700 (confirm with the operator for your city).',
      remoteHint: 'Remote areas — on request.',
      hoursTitle: 'We are open',
      hoursRange: '11:00 — 22:30',
      howTitle: 'How to order',
      stepWeb: 'On the website',
      stepApp: 'In the app',
      stepPhone: 'By phone',
      stepWebDesc: 'Menu, cart, payment and address — all in one flow, no extra steps.',
      stepAppDesc: 'The same smooth experience in the app — reorder your favourites in seconds.',
      stepPhoneDesc: 'Call us — we help with the menu, zones and delivery times.',
      kitchenMapCaption: 'Our kitchen on the map',
      conditionsKicker: 'Service',
      conditionsFeature1: 'Minimum order and rates for your city — confirm with the operator.',
      conditionsFeature2: 'Delivery zones are transparent: use the map and postcode check above.',
      conditionsFeature3: 'Further-out addresses — on prior agreement.',
      deliveryPromiseKicker: 'On time',
      deliveryPromiseTitle: 'We deliver punctually and carefully',
      deliveryPromiseText:
        'We plan prep and routing so your rolls arrive fresh, in a window that works for you.',
      deliveryPromiseFoot:
        'If we are delayed on our side, we will let you know right away. Your dinner matters to us.',
      openMaps: 'Open kitchen address in Google Maps',
      title: 'Delivery',
      description: 'Sushi and rolls delivered to your city.',
      workingHours: 'Working hours',
      payment: 'Payment',
      postalTitle: 'Check by postcode',
      postalDesc:
        'Pick your city (same as in the site header) and enter your postcode — we show if the address is inside a delivery zone. Zone shapes and fees are set only by an administrator.',
      postalLabel: 'Postcode',
      postalPlaceholder: 'e.g. 01001 or 1012 AB',
      postalButton: 'Check',
      postalChecking: 'Looking up address…',
      postalInside: 'Delivery available in this zone',
      postalOutside: 'Outside delivery zones for this city',
      postalNoZones:
        'No map zones are configured for this city yet — ask the operator. Pricing is managed in the admin panel.',
      postalFoundIndexNoZonesTitle:
        'Postcode found — coordinates verified (maps). Delivery polygons for this city are not set up in the admin panel yet.',
      postalGeocodeFail: 'We could not resolve this postcode — check spelling and country.',
      postalBadRequest: 'Select a city and enter a postcode.',
      postalZone: 'Zone',
      postalAddressFound: 'Found',
      adminZonesNote:
        'Zone polygons and delivery pricing are edited only in the admin panel; they cannot be changed on this page.',
      tariffPerKm: 'Per-km rate in this city',
      tariffBase: 'Default delivery fee (below free threshold)',
      tariffFreeFrom: 'Free delivery from cart total',
      syncCityHint: 'City matches the one selected in the top bar.',
      cityNoDeliveryYet: 'Delivery is not available for this city yet.',
      mapZonesHint: 'Tap a coloured zone on the map to see delivery terms for that area.',
      mapInteractiveAria: 'Interactive delivery zones map',
      zonePopupFree: 'Free delivery in this zone.',
      zonePopupFlat: 'Flat delivery fee: €{{amount}}',
      zonePopupStandardTitle: 'Standard tariff for this zone',
      zonePopupStandardBase: 'Base delivery: €{{base}}',
      zonePopupStandardPerKm: 'Plus: €{{perKm}} / km',
      zonePopupStandardFreeFrom: 'Free delivery from order total €{{from}}',
      zoneFeeFree: 'Delivery: free',
      zoneFeeFlat: 'Delivery: €{{amount}}',
      zoneFeeStandard: 'Delivery: base + per km (tap zone for details)',
      postalZoneTariffFree: 'Zone tariff: free delivery',
      postalZoneTariffFlat: 'Zone tariff: €{{amount}}',
      postalZoneTariffStandard: 'Zone tariff: standard (base + per km)',
      estimatedDeliveryApprox: 'Estimated delivery: €{{amount}}',
      distanceFromKitchen: 'Approx. distance from kitchen: {{km}} km',
    },
    categories: { rolls: 'Rolls', sushi: 'Sushi', sets: 'Sets', soups: 'Soups', bowls: 'Bowls', snacks: 'Snacks', drinks: 'Drinks', sauces: 'Sauces' },
    hero: { title: 'Benefits of Asian Soups' },
    welcomeHero: {
      title: 'Watta Sushi',
      description:
        'Japanese cuisine with heart: fresh rolls, sushi, and signature dishes — delivered to your table. A taste you will want again.',
    },
    section: { title: 'Sushi Delivery in Kyiv', description: 'Watta Sushi offers rolls, sushi, sets, and drinks for every taste. We highly recommend trying our top menu items!' },
    homeBrandSection: {
      kicker: 'WATTA SUSHI',
      kickerScript: 'Japanese gastronomy',
      pillar1Label: 'flavour',
      pillar1Word: 'SYMPHONY',
      pillar2Label: 'craft',
      pillar2Word: 'TRADITIONS',
      pillar3Label: 'balance',
      pillar3Word: 'HARMONY',
      footerHint: 'Scroll down — pick a category from the menu',
    },
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
      admin: 'Admin Panel',
      favorites: 'Favorites'
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
      },
      heroKicker: "Fast gastronomy",
      heroWordmark: "SUSHI · ROLLS · DELIVERY",
      storyTitle: "Our story is flavour and discipline",
      storyLead: "Watta Sushi started from a simple idea: Japanese food can be fast, neat, and genuinely delicious — with zero compromise on fish, rice, and temperature.",
      storyP2: "We do not pre-stack rolls for a shelf: every set is built for your order. Sauces and rice stay in tight routines, and we do not skimp on filling — you should taste every bite.",
      storyP3: "Front-of-house and couriers speak one language — care. We will steer you toward what fits your mood, event, or diet, and honestly say when something is better saved for next time.",
      journeyTitle: "From kitchen to your table",
      journeySub: "Steps we rehearse every single day.",
      j1Title: "Menu & ideas",
      j1Body: "The map evolves with season, suppliers, and what you order most.",
      j2Title: "Kitchen",
      j2Body: "Clean workflows and tight timing so quality stays predictable.",
      j3Title: "Packaging",
      j3Body: "Sealed boxes, sauces on the side — food travels neat and cool.",
      j4Title: "Delivery",
      j4Body: "Couriers know the routes; we sync timing so rolls arrive looking their best.",
      bentoTitle: "Why guests stay with us",
      bentoSub: "Four pillars — on screen and on the pass.",
      bento1Title: "Rice discipline",
      bento1Body: "Acidity, temperature, texture — the base that makes a roll sit right on the tongue.",
      bento2Title: "Fish & sourcing",
      bento2Body: "Trusted supply lines; freshness is our standard, not a slogan.",
      bento3Title: "Speed without chaos",
      bento3Body: "High tempo, not panic — you get the dish, not “something like sushi”.",
      bento4Title: "Eco focus",
      bento4Body: "Less throwaway plastic where we can, responsible waste — step by step.",
      manifesto: "We do not cosplay Japanese food — we cook it with respect.",
      manifestoSig: "— Team Watta Sushi",
      ctaMenu: "Open the menu",
      ctaContacts: "Contact us",
      ctaDelivery: "Delivery info",
      visitStripTitle: "Visit or message",
      addressLine: "Amstelveenseweg 192, 1075 XR Amsterdam, Netherlands",
      hoursLine: "Daily 12:00 — 22:00",
      phoneLine: "+31 6 1234 5678",
      teamEmptyTitle: "Team portraits are coming soon",
      teamEmptyBody: "For now, meet us through the food — every roll is already shaped by our chefs.",
      marqueeWords: "Freshness|Temperature|Taste|Team|Amsterdam|Rolls|Sushi|Delivery|Quality",
    },
    menuView: {
      itemsCount: 'dishes',
      emptyCategoryTitle: 'No items in this category yet',
      emptyCategoryDesc: 'Add items through the admin panel',
      seeAll: 'See all',
      footerPromoSeeOffers: 'All offers & banners — below',
      footerPromoAriaRegion: 'Promotions and special offers',
      welcomeBadgeAria: 'Welcome in each site language and brand name',
      welcomeScrollDownAria: 'Scroll to the next screen',
      gastronomyTitle: 'Japanese gastronomy',
      homeCatalogTitle: 'Full menu',
      homeCatalogSub: 'Tap a category in the bar above — we scroll straight to that section.',
      catalogOnCategoryPageHint:
        'Dishes open on a separate page — pick a type in the grid below or in the category bar.',
      categoryPageBack: 'Home',
      categoryPageEmpty: 'No dishes in this category yet.',
      categoryPageOpenCart: 'Cart',
    },
    cinematicFooter: {
      readyTitle: 'Ready to order?',
      ctaBanners: 'Banners & offers',
      ctaMenu: 'Open menu',
      ctaCatalog: 'Full catalog',
      ctaOffers: 'Offers',
      promoCarouselAria: 'Swipe or use arrows to browse offers',
      promoPickHint: 'Tap a card — we open the full menu',
      promoBadge: 'Offer',
      prevPromo: 'Previous',
      nextPromo: 'Next',
      aboutTitle: 'WATTA — flavour without the noise',
      aboutLead:
        'We are not playing “Japanese food to your door” — we care about recipe precision, freshness, and service you can brag about.',
      aboutBody:
        'Rolls are built to order; we keep rice and sauces on a tight temperature routine, and the team will honestly steer you to what fits your mood. Not fast food — fast gastronomy with attitude.',
      animationSlotAria: 'Brand animation area',
    },
  adminCategory: {
    manageTitle: 'Menu Categories Management',
    addCategory: '➕ Add category',
    subcategoriesCount: 'subcategories',
    enterNewName: 'Enter new name:',
    addSubcategory: '➕ Subcategory'
  },
    promotionsPage: {
      title: "Promotions",
      description: "Special offers",
      listHeading: "News & promotions",
      detailsCta: "Read more",
      morePhotosBadge: "+{{count}} photos",
      offersBadge: "{{count}} deals",
      noPhoto: "No photo",
      loading: "Loading...",
      notFound: "Content not found",
      galleryAria: "Image gallery",
      offersTitle: "Discounted dishes",
      wasPrice: "Was",
      offPercent: "−{{percent}}%",
      hitBadge: "HOT",
    },
    profilePage: { title: "Profile", logout: "Log out", orderHistory: "Order history" },
    clientProfile: {
      loading: 'Loading…',
      redirectLogin: 'Redirecting to sign in…',
      backHome: 'Home',
      brandSubtitle: 'WATTA SUSHI',
      bonuses: 'Your bonus balance',
      tabHistory: 'Order history',
      tabAddress: 'Delivery addresses',
      tabFavorites: 'Favorites',
      tabData: 'Personal details',
      tabAdmin: 'Admin panel',
      logout: 'Log out',
      emptyOrders: 'You have no orders yet',
      goMenu: 'Browse menu',
      orderLabel: 'Order',
      total: 'Total',
      reorder: 'Order again',
      journeyHint: 'Status updates when the kitchen advances your order in the system.',
      stepPending: 'Awaiting confirmation',
      stepConfirmed: 'Confirmed',
      stepCooking: 'Preparing',
      stepDelivering: 'Out for delivery',
      stepReceived: 'Received',
      stepReview: 'Leave a review',
      stepReviewDone: 'Thanks for your review',
      orderCancelled: 'Order cancelled',
      liveUpdating: 'Live status',
      reviewOpen: 'Write a review',
      reviewModalTitle: 'Your review',
      reviewText: 'Tell us how it went…',
      reviewPhotos: 'Photos (up to 6)',
      pickPhotos: 'Choose images',
      reviewSend: 'Submit review',
      favoritesTitle: 'Saved dishes',
      favEmpty: 'No saved dishes yet',
      favToMenu: 'Go to menu',
      addrTitle: 'My addresses',
      addrSub: 'Saved delivery addresses',
      addrEmptyTitle: 'No saved address',
      addrEmptySub: 'Add one at checkout',
      dataTitle: 'Personal details',
      dataSub: 'Your contact information',
      labelName: 'Name',
      labelPhone: 'Phone',
      labelEmail: 'Email',
      notSpecified: 'Not set',
    },
    reviewsPublic: {
      title: 'Customer reviews',
      subtitle: 'Real feedback on delivery, taste, and service.',
      empty: 'No reviews yet — be the first after your order arrives.',
      loginCta: 'Sign in to leave a review in your profile after delivery.',
      openProfile: 'Home — open Profile from the menu',
    },
    blogPublic: {
      title: 'Chef blog & recipes',
      subtitle: 'Cooking tips and stories from the Watta Sushi team.',
      empty: 'New articles are coming soon.',
      readMore: 'Read more',
      backToBlog: 'All articles',
    },
    contactPage: {
      heroKicker: 'Get in touch',
      heroTitle: 'Watta Sushi, close to you',
      heroSubtitle: 'Menu, delivery, events, or partnerships — send a message and our team will reply as soon as possible.',
      ctaForm: 'Write to us',
      ctaDelivery: 'Delivery areas',
      stat1Val: '~15 min',
      stat1Label: 'Typical chat response time',
      stat2Val: 'Amsterdam+',
      stat2Label: 'Delivery & pickup region',
      stat3Val: '100%',
      stat3Label: 'Fresh ingredients daily',
      channelsTitle: 'Ways to reach us',
      channelsSub: 'Pick a channel you like — it all goes to the same kitchen crew.',
      cardCall: 'Phone',
      cardEmail: 'Email',
      cardAddress: 'Kitchen address',
      cardHours: 'Opening hours',
      phoneDisplay: '+31 6 1234 5678',
      phoneTel: '+31612345678',
      emailDisplay: 'hello@watta-sushi.nl',
      emailMailto: 'hello@watta-sushi.nl',
      hoursDetail: 'Daily 12:00 — 22:00',
      openMaps: 'Open in Google Maps',
      mapTitle: 'Find us on the map',
      mapSub: 'Pickup by appointment — confirm the time via chat or phone.',
      socialTitle: 'Social & messengers',
      faqTitle: 'FAQ',
      faqSub: 'Quick answers about delivery, payment, and orders.',
      faq1Q: 'How fast is delivery?',
      faq1A: 'It depends on kitchen load and the courier route. We share a tighter window right after confirmation.',
      faq2Q: 'Can I change the address after ordering?',
      faq2A: 'Yes, if the courier has not left yet — message or call us and we will update the route.',
      faq3Q: 'Which payment methods do you support?',
      faq3A: 'Card online, cash, or courier terminal — depending on your city and checkout settings.',
      faq4Q: 'Any gluten-free or vegetarian options?',
      faq4A: 'We have fish-free and vegetable-forward rolls; for allergens, drop us a note and we will check ingredients.',
      faq5Q: 'Do you cater corporate sets?',
      faq5A: 'Yes — we plan large orders around your serving time. Leave details in the form and a manager will follow up.',
      formTitle: 'Contact form',
      formSub: 'We receive this on the kitchen side and reply to your email.',
      phName: 'Your name',
      phEmail: 'you@example.com',
      phPhone: '+31 … (optional)',
      phMessage: 'How can we help?',
      formSubmit: 'Send message',
      formSending: 'Sending…',
      formSuccess: 'Thanks! We have received your message.',
      formError: 'Could not send. Please try again later.',
      formNetwork: 'Network error. Check your connection.',
      errName: 'Please enter a name (2–120 characters).',
      errEmail: 'Please enter a valid email.',
      errMessage: 'Message must be 10–4000 characters.',
      honeyLabel: 'Leave this field empty',
      bottomTitle: 'Ready for the Watta taste?',
      bottomCta: 'Browse the menu',
      scrollHint: 'Scroll to explore',
      addressLine: 'Amstelveenseweg 192, 1075 XR Amsterdam, Netherlands',
    },
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
      header: {
        title: "Admin Panel",
        subtitle: "Order statistics, products, and deliveries in one place.",
        siteMenu: "Site menu",
        backAria: "Back",
        refreshTitle: "Refresh data",
        openMenuTitle: "Open menu",
        closeDrawerAria: "Close",
        adminLangUk: "UKR",
        adminLangRu: "RUS",
        adminLangHint: "Panel language",
      },
      sidebar: { selectSection: "Select section", dashboard: "📊 Dashboard", dashboardDesc: "Stats & overview", orders: "📦 Orders", ordersDesc: "Manage orders", products: "🍣 Products", productsDesc: "Menu items", promos: "🏷️ Promo codes", promosDesc: "Discounts", cities: "🏙️ Cities", citiesDesc: "Cities & countries", banners: "🎨 Banners", bannersDesc: "Banners", categories: "📋 Categories", categoriesDesc: "Menu categories", users: "👥 Users", usersDesc: "Client list", team: "👨‍👩‍👧‍👦 Team", teamDesc: "Employees", settings: "⚙️ Settings", settingsDesc: "Site & banners", ingredients: "🥑 Ingredients", newsletter: "📧 Newsletter" },
      dashboard: {
        loading: "Loading...",
        revenue: "Revenue (completed)",
        orders: "Total orders",
        products: "Products",
        cities: "Cities",
        statusTitle: "Orders by status",
        statusPending: "Pending",
        statusCooking: "Cooking",
        statusDelivering: "Out for delivery",
        statusCompleted: "Completed",
        statusCancelled: "Cancelled",
        promos: "Promo codes",
        categories: "Categories",
        users: "Users",
        paidOrders: "Paid orders",
        statsHint: "Figures from the site database (refresh with the reload button).",
        banners: "Banners",
        blog: "Blog posts",
        ingredients: "Ingredients",
        team: "Team members",
        countries: "Countries",
        contentSection: "Catalog & content",
        statsFallback: "computed from order list",
        studioHeadline: "Watta Sushi pulse",
        studioSub: "Stats and charts in the same visual language as the site.",
        chartRevenue14d: "Completed revenue (14 days)",
        chartOrders14d: "Orders per day (all)",
        chartStatusPie: "Status distribution",
        chartNoData: "Not enough data for this chart yet",
        avgOrderValue: "Avg. ticket (completed)",
      },
      actions: { add: "+ Add", edit: "Edit", editShort: "Edit", delete: "Delete", save: "Save", saveChanges: "Save changes", cancel: "Cancel" },
      common: { menuChangeSection: "Menu / change section", emptyOrders: "No active orders", emptyCities: "No cities yet", emptyBanners: "No banners yet", emptyCategories: "No categories yet", emptyUsers: "No users yet", emptyTeam: "No team members yet", emptyPromos: "No promos yet", clickToUpload: "Click to upload photo", changeFile: "Change", selectFromList: "Select from list", activeLabel: "Active", inactiveLabel: "Inactive", yes: "Yes", no: "No", orderIndex: "Display order", choose: "Choose", notFound: "Nothing found. Try another query.", searching: "searching...", bannerDragHint: "Drag a card onto another to change the order on the site", bannerOrderSaved: "Banner order saved", bannerOrderSaveError: "Could not save banner order" },
      orders: { orderNum: "Order #", noComment: "No comment", payment: "Payment", cash: "Cash", online: "Online", paid: "PAID", error: "ERROR", waiting: "WAITING", hintConfirmed: "Confirmed", hintCooking: "Cooking", hintDelivering: "Delivering", hintCompleted: "Completed", hintCancel: "Cancel", fulfillmentDelivery: "Delivery", fulfillmentPickup: "Pickup", deliveryFeeAdmin: "Delivery fee:" },
      news: { title: "News", addBtn: "+ Add", editTitle: "Edit", newTitle: "New news", titlePlaceholder: "Title", descPlaceholder: "Short description", textPlaceholder: "Full text", isHit: "Bestseller", galleryLabel: "Photo gallery", uploadPhotos: "Add photos (multiple)", removePhotoAria: "Remove photo", dishesBlock: "Discounted dishes in this story", selectProduct: "Pick a dish", discountShort: "Discount %", addDish: "Add dish", dishDuplicate: "This dish is already added", pickProductFirst: "Select a dish first" },
      products: { addBtn: "+ Add product", hit: "HOT", editTitle: "Edit dish", newTitle: "New dish", nameLabel: "Product name", namePlaceholder: "e.g.: Philadelphia", descLabel: "Description", descPlaceholder: "Ingredients, weight, features...", priceLabel: "Price (€)", categoryLabel: "Category", selectCategory: "Select...", deliveryCities: "Delivery cities *", addCitiesFirst: "Add cities in the 'Cities' tab first", descComposition: "Descriptions (Composition)", ingComposition: "Ingredients (Composition)" },
      ingredients: { title: "Ingredients Library", addNew: "Add new", nameRu: "Name", namePlaceholder: "e.g.: Salmon", addBtn: "Add" },
      cities: { addCountry: "Add new country", nameRu: "Name *", sticker: "Country sticker (flag)", addCountryBtn: "✨ Add country", countriesTitle: "Countries", editCity: "Edit city", addCity: "Add new city", cityNameRu: "City name *", searchMapLabel: "📍 Search city on map", searchMapDesc: "Search by address, zip code, or name.", searchMapPlaceholder: "Name, address, index...", searchMapBtn: "Search by names", countryLabel: "Country *", selectCountry: "Select country", activeCity: "Active city", saveChanges: "💾 Save changes", addCityBtn: "✨ Add city", cancelEdit: "Cancel edit", citiesTitle: "Cities", deliveryZones: "Delivery zones:" },
      banners: { addBtn: "+ Add banner", tabSubtitle: "Home carousel: photo, crop, and translations.", editTitle: "Edit banner", newTitle: "New banner", titleRu: "Title *", titlePlaceholder: "e.g.: Sushi burgers: perfect snack" },
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
    locationPicker: {
      title: 'Bezorglocatie',
      subtitle: 'Kies land en stad',
      country: 'Land',
      city: 'Stad',
      loading: 'Laden…',
      noCountries: 'Geen landen beschikbaar',
      noCountriesAdminHint: 'Voeg landen en actieve steden toe in het adminpaneel (Steden).',
      noCountriesDevHint: 'Lokaal: npm run local:prepare, daarna npm run local:backend (poort 5050) en npm run local:web.',
      noCitiesInCountry: 'Geen steden voor dit land',
      addCitiesAdmin: 'Voeg steden toe in het adminpaneel.',
      noActiveCities: 'Geen actieve steden',
      activateInAdmin: 'Activeer steden in het adminpaneel.',
      chooseLocation: 'Kies stad',
      ariaOpen: 'Bezorgstad kiezen',
      ariaClose: 'Sluiten',
    },
    deliveryPage: {
      kicker: 'WATTA',
      kickerScript: 'tot aan je deur',
      headlineLead: 'Bezorging',
      headlineMark: 'geen compromissen',
      headlineTrail: 'Verse rolls, duidelijke zones op de kaart en een tijd die klopt.',
      sub: 'Kies een stad — bekijk kaart en voorwaarden. We rijden waar jij bent.',
      statFresh: 'Dagelijkse versheid',
      statFast: 'Snel ingepakt',
      statCity: 'Jouw stad op de kaart',
      citiesLabel: 'Bezorgsteden',
      mapAll: 'Alle steden',
      mapFocus: 'Stad',
      loading: 'Routes laden…',
      zonesTitle: 'Bezorgzones',
      zoneAvailable: 'Bezorging binnen de zone',
      conditionsTitle: 'Voorwaarden',
      minOrder: 'Minimumbestelling — €700 (check bij de operator voor jouw stad).',
      remoteHint: 'Verwijderde wijken — in overleg.',
      hoursTitle: 'We zijn bereikbaar',
      hoursRange: '11:00 — 22:30',
      howTitle: 'Hoe bestellen',
      stepWeb: 'Op de site',
      stepApp: 'In de app',
      stepPhone: 'Per telefoon',
      stepWebDesc: 'Menu, winkelwagen, betaling en adres — alles in één flow.',
      stepAppDesc: 'Dezelfde fijne ervaring in de app — favorieten snel opnieuw bestellen.',
      stepPhoneDesc: 'Bel ons — we helpen met menu, zones en bezorgtijden.',
      kitchenMapCaption: 'Onze keuken op de kaart',
      conditionsKicker: 'Service',
      conditionsFeature1: 'Minimum en tarieven voor jouw stad — check bij de operator.',
      conditionsFeature2: 'Bezorgzones zijn helder: zie de kaart en postcodecheck hierboven.',
      conditionsFeature3: 'Verder weg — in overleg.',
      deliveryPromiseKicker: 'Stiptheid',
      deliveryPromiseTitle: 'Op tijd en netjes bezorgd',
      deliveryPromiseText:
        'We plannen bereiding en route zodat je rolls vers zijn en binnen een handig tijdslot komen.',
      deliveryPromiseFoot:
        'Loopt het bij ons vertraging op, dan hoor je het meteen. Jouw diner telt.',
      openMaps: 'Keukenadres openen in Google Maps',
      title: 'Bezorging',
      description: 'Sushi en rolls bij je thuis in jouw stad.',
      workingHours: 'Openingstijden',
      payment: 'Betaling',
      postalTitle: 'Check via postcode',
      postalDesc:
        'Kies je stad (zoals in de header) en vul je postcode in — we tonen of je binnen een bezorgzone valt. Zones en tarieven stelt alleen de beheerder in.',
      postalLabel: 'Postcode',
      postalPlaceholder: 'bijv. 1012 AB',
      postalButton: 'Controleren',
      postalChecking: 'Adres zoeken…',
      postalInside: 'Bezorging mogelijk in deze zone',
      postalOutside: 'Buiten de bezorgzones voor deze stad',
      postalNoZones:
        'Er zijn nog geen zones op de kaart — vraag de operator. Tarieven staan in het adminpaneel.',
      postalFoundIndexNoZonesTitle:
        'Postcode gevonden — coördinaten bevestigd (kaarten). Bezorgzones voor deze stad zijn nog niet getekend in het adminpaneel.',
      postalGeocodeFail: 'Postcode niet gevonden — controleer spelling en land.',
      postalBadRequest: 'Kies een stad en vul een postcode in.',
      postalZone: 'Zone',
      postalAddressFound: 'Gevonden',
      adminZonesNote:
        'Zones en bezorgprijzen worden alleen in het adminpaneel bewerkt; hier niet aanpasbaar.',
      tariffPerKm: 'Tarief per km in deze stad',
      tariffBase: 'Standaard bezorgkosten',
      tariffFreeFrom: 'Gratis bezorging vanaf bestelbedrag',
      syncCityHint: 'Stad komt overeen met de keuze in de balk bovenaan.',
      cityNoDeliveryYet: 'Voor deze stad is nog geen bezorging beschikbaar.',
      mapZonesHint: 'Tik op een gekleurde zone op de kaart om de bezorgvoorwaarden te zien.',
      mapInteractiveAria: 'Interactieve kaart met bezorgzones',
      zonePopupFree: 'Gratis bezorging in deze zone.',
      zonePopupFlat: 'Vaste bezorgkosten: € {{amount}}',
      zonePopupStandardTitle: 'Standaardtarief voor deze zone',
      zonePopupStandardBase: 'Basisbezorging: € {{base}}',
      zonePopupStandardPerKm: 'Plus: € {{perKm}} / km',
      zonePopupStandardFreeFrom: 'Gratis bezorging vanaf bestelbedrag € {{from}}',
      zoneFeeFree: 'Bezorging: gratis',
      zoneFeeFlat: 'Bezorging: € {{amount}}',
      zoneFeeStandard: 'Bezorging: basis + per km (tik op de zone)',
      postalZoneTariffFree: 'Zonetarief: gratis bezorging',
      postalZoneTariffFlat: 'Zonetarief: € {{amount}}',
      postalZoneTariffStandard: 'Zonetarief: standaard (basis + per km)',
      estimatedDeliveryApprox: 'Geschatte bezorging: € {{amount}}',
      distanceFromKitchen: 'Afstand vanaf de keuken (ongeveer): {{km}} km',
    },
    categories: { rolls: 'Rollen', sushi: 'Sushi', sets: 'Sets', soups: 'Soepen', bowls: 'Bowls', snacks: 'Snacks', drinks: 'Dranken', sauces: 'Sauzen' },
    hero: { title: 'Voordelen van Aziatische soepen' },
    welcomeHero: {
      title: 'Watta Sushi',
      description:
        'Japanse keuken met hart: verse rolls, sushi en signature-gerechten — bij je thuisbezorgd. Een smaak om op terug te komen.',
    },
    section: { title: 'Sushi bezorging in Kiev', description: 'Watta Sushi biedt rollen, sushi, sets en drankjes voor elke smaak. We raden ten zeerste aan om onze topmenu-items te proberen!' },
    homeBrandSection: {
      kicker: 'WATTA SUSHI',
      kickerScript: 'Japanse gastronomie',
      pillar1Label: 'smaak',
      pillar1Word: 'SYMFONIE',
      pillar2Label: 'receptuur',
      pillar2Word: 'TRADITIES',
      pillar3Label: 'balans',
      pillar3Word: 'HARMONIE',
      footerHint: 'Scroll naar beneden — kies een categorie in het menu',
    },
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
      admin: 'Admin Paneel',
      favorites: 'Favorieten'
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
      },
      heroKicker: "Snelle gastronomie",
      heroWordmark: "SUSHI · ROLLS · BEZORGING",
      storyTitle: "Ons verhaal is smaak en discipline",
      storyLead: "Watta Sushi begon met een simpel idee: Japanse keuken kan snel, netjes en echt lekker zijn — zonder compromis op vis, rijst en temperatuur.",
      storyP2: "We stapelen geen rollen voor de plank: elk set wordt voor jouw bestelling gemaakt. Sauzen en rijst houden we strak; vulling geven we ruim — elke hap moet tellen.",
      storyP3: "Zaalmensen en bezorgers spreken één taal: zorg. We adviseren eerlijk wat past bij stemming, gelegenheid of dieet.",
      journeyTitle: "Van keuken tot tafel",
      journeySub: "Stappen die we elke dag oefenen.",
      j1Title: "Menu & ideeën",
      j1Body: "De kaart groeit mee met seizoen, leveranciers en wat jij het meest bestelt.",
      j2Title: "Keuken",
      j2Body: "Schone processen en strakke timing — kwaliteit blijft voorspelbaar.",
      j3Title: "Verpakking",
      j3Body: "Dichte boxen, sauzen apart — eten reist netjes en koel.",
      j4Title: "Bezorging",
      j4Body: "Bezorgers kennen de routes; we timen mee zodat rollen er top uitzien.",
      bentoTitle: "Waarom gasten bij ons blijven",
      bentoSub: "Vier pijlers — op scherm en op de pass.",
      bento1Title: "Rijstdiscipline",
      bento1Body: "Zuurgraad, temperatuur, textuur — de basis die een rol echt laat smaken.",
      bento2Title: "Vis & inkoop",
      bento2Body: "Betrouwbare ketens; versheid is standaard, geen slogan.",
      bento3Title: "Snelheid zonder chaos",
      bento3Body: "Hoog tempo, geen paniek — je krijgt het gerecht, geen ‘iets dat op sushi lijkt’.",
      bento4Title: "Eco-focus",
      bento4Body: "Minder wegwerpplastic waar het kan, verantwoord afval — stap voor stap.",
      manifesto: "We doen niet alsof we Japanse keuken zijn — we koken het met respect.",
      manifestoSig: "— Team Watta Sushi",
      ctaMenu: "Naar het menu",
      ctaContacts: "Contact",
      ctaDelivery: "Bezorginfo",
      visitStripTitle: "Langskomen of mailen",
      addressLine: "Amstelveenseweg 192, 1075 XR Amsterdam, Netherlands",
      hoursLine: "Dagelijks 12:00 — 22:00",
      phoneLine: "+31 6 1234 5678",
      teamEmptyTitle: "Teamfoto’s volgen binnenkort",
      teamEmptyBody: "Ontmoet ons nu via het eten — elke rol is al gevormd door onze chefs.",
      marqueeWords: "Versheid|Temperatuur|Smaak|Team|Amsterdam|Rollen|Sushi|Bezorging|Kwaliteit",
    },
    menuView: {
      itemsCount: 'gerechten',
      emptyCategoryTitle: 'Nog geen items in deze categorie',
      emptyCategoryDesc: 'Voeg items toe via het adminpaneel',
      seeAll: 'Bekijk alles',
      footerPromoSeeOffers: 'Alle acties en banners — hieronder',
      footerPromoAriaRegion: 'Acties en speciale aanbiedingen',
      welcomeBadgeAria: 'Welkom in elke sitetaal en de merknaam',
      welcomeScrollDownAria: 'Naar het volgende scherm scrollen',
      gastronomyTitle: 'Japanse gastronomie',
      homeCatalogTitle: 'Volledig menu',
      homeCatalogSub: 'Kies een categorie in de balk hierboven — we scrollen naar dat deel van het menu.',
      catalogOnCategoryPageHint:
        'Gerechten van de categorie openen op een aparte pagina — kies een type in het raster hieronder of in de categoriebalk.',
      categoryPageBack: 'Naar home',
      categoryPageEmpty: 'Nog geen gerechten in deze categorie.',
      categoryPageOpenCart: 'Winkelwagen',
    },
    cinematicFooter: {
      readyTitle: 'Klaar om te bestellen?',
      ctaBanners: 'Naar banners & acties',
      ctaMenu: 'Menu openen',
      ctaCatalog: 'Volledige catalogus',
      ctaOffers: 'Aanbiedingen',
      promoCarouselAria: 'Veeg of gebruik pijlen voor acties',
      promoPickHint: 'Tik op een kaart — we openen het volledige menu',
      promoBadge: 'Actie',
      prevPromo: 'Vorige',
      nextPromo: 'Volgende',
      aboutTitle: 'WATTA — smaak zonder ruis',
      aboutLead:
        'We doen niet alsof we “Japanse keuken aan huis” zijn — we gaan voor precisie in het recept, versheid en service om trots op te zijn.',
      aboutBody:
        'Rolls worden op bestelling gemaakt; rijst en sauzen houden we strak op temperatuur en het team helpt eerlijk kiezen wat bij je stemming past. Geen fastfood — wel snelle gastronomie met karakter.',
      animationSlotAria: 'Ruimte voor merk-animatie',
    },
  adminCategory: {
    manageTitle: 'Menu Categorieën Beheer',
    addCategory: '➕ Categorie toevoegen',
    subcategoriesCount: 'subcategorieën',
    enterNewName: 'Voer nieuwe naam in:',
    addSubcategory: '➕ Subcategorie'
  },
    promotionsPage: {
      title: "Aanbiedingen",
      description: "Speciale aanbiedingen",
      listHeading: "Nieuws & acties",
      detailsCta: "Meer lezen",
      morePhotosBadge: "+{{count}} foto’s",
      offersBadge: "{{count}} acties",
      noPhoto: "Geen foto",
      loading: "Laden...",
      notFound: "Niet gevonden",
      galleryAria: "Beeldgalerij",
      offersTitle: "Gerechten met korting",
      wasPrice: "Was",
      offPercent: "−{{percent}}%",
      hitBadge: "HIT",
    },
    profilePage: { title: "Profiel", logout: "Uitloggen", orderHistory: "Bestelgeschiedenis" },
    clientProfile: {
      loading: 'Laden…',
      redirectLogin: 'Doorverwijzen naar inloggen…',
      backHome: 'Naar home',
      brandSubtitle: 'WATTA SUSHI',
      bonuses: 'Je bonus',
      tabHistory: 'Bestelgeschiedenis',
      tabAddress: 'Bezorgadressen',
      tabFavorites: 'Favorieten',
      tabData: 'Persoonsgegevens',
      tabAdmin: 'Adminpaneel',
      logout: 'Uitloggen',
      emptyOrders: 'Je hebt nog geen bestellingen',
      goMenu: 'Naar menu',
      orderLabel: 'Bestelling',
      total: 'Totaal',
      reorder: 'Opnieuw bestellen',
      journeyHint: 'Status wordt bijgewerkt wanneer de keuken je bestelling doorzet.',
      stepPending: 'Wacht op bevestiging',
      stepConfirmed: 'Bevestigd',
      stepCooking: 'Wordt bereid',
      stepDelivering: 'Onderweg',
      stepReceived: 'Ontvangen',
      stepReview: 'Review achterlaten',
      stepReviewDone: 'Bedankt voor je review',
      orderCancelled: 'Bestelling geannuleerd',
      liveUpdating: 'Live status',
      reviewOpen: 'Schrijf review',
      reviewModalTitle: 'Jouw review',
      reviewText: 'Vertel hoe het was…',
      reviewPhotos: "Foto's (max 6)",
      pickPhotos: 'Kies afbeeldingen',
      reviewSend: 'Review versturen',
      favoritesTitle: 'Favoriete gerechten',
      favEmpty: 'Nog geen favorieten',
      favToMenu: 'Naar menu',
      addrTitle: 'Mijn adressen',
      addrSub: 'Opgeslagen bezorgadressen',
      addrEmptyTitle: 'Geen adres opgeslagen',
      addrEmptySub: 'Voeg een adres toe bij afrekenen',
      dataTitle: 'Persoonsgegevens',
      dataSub: 'Je contactgegevens',
      labelName: 'Naam',
      labelPhone: 'Telefoon',
      labelEmail: 'E-mail',
      notSpecified: 'Niet ingevuld',
    },
    reviewsPublic: {
      title: 'Klantreviews',
      subtitle: 'Echte reacties over bezorging, smaak en service.',
      empty: 'Nog geen reviews — laat de eerste achter na je bestelling.',
      loginCta: 'Log in om na levering een review in je profiel te plaatsen.',
      openProfile: 'Home — profiel via het menu',
    },
    blogPublic: {
      title: 'Blog & recepten van de chef',
      subtitle: 'Tips en verhalen van team Watta Sushi.',
      empty: 'Binnenkort nieuwe artikelen.',
      readMore: 'Lees verder',
      backToBlog: 'Alle artikelen',
    },
    contactPage: {
      heroKicker: 'Neem contact op',
      heroTitle: 'Watta Sushi dichtbij',
      heroSubtitle: 'Vragen over menu, bezorging, events of samenwerking — stuur een bericht, we reageren zo snel mogelijk.',
      ctaForm: 'Schrijf ons',
      ctaDelivery: 'Bezorggebieden',
      stat1Val: '~15 min',
      stat1Label: 'Gemiddelde reactietijd in chat',
      stat2Val: 'Amsterdam+',
      stat2Label: 'Regio bezorging & afhalen',
      stat3Val: '100%',
      stat3Label: 'Dagvers ingrediënten',
      channelsTitle: 'Hoe bereik je ons',
      channelsSub: 'Kies je kanaal — alles komt bij dezelfde keuken terecht.',
      cardCall: 'Telefoon',
      cardEmail: 'E-mail',
      cardAddress: 'Keukenadres',
      cardHours: 'Openingstijden',
      phoneDisplay: '+31 6 1234 5678',
      phoneTel: '+31612345678',
      emailDisplay: 'hello@watta-sushi.nl',
      emailMailto: 'hello@watta-sushi.nl',
      hoursDetail: 'Dagelijks 12:00 — 22:00',
      openMaps: 'Openen in Google Maps',
      mapTitle: 'Op de kaart',
      mapSub: 'Afhalen op afspraak — bevestig de tijd via chat of telefoon.',
      socialTitle: 'Social & messengers',
      faqTitle: 'Veelgestelde vragen',
      faqSub: 'Kort over bezorging, betaling en bestellen.',
      faq1Q: 'Hoe snel wordt bezorgd?',
      faq1A: 'Dat hangt af van de drukte in de keuken en de route. Na bevestiging geven we een schatting.',
      faq2Q: 'Kan ik het adres nog wijzigen?',
      faq2A: 'Ja, als de bezorger nog niet vertrokken is — mail of bel, dan passen we de route aan.',
      faq3Q: 'Welke betaalmethoden?',
      faq3A: 'Kaart online, contant of pin bij de bezorger — afhankelijk van de stad en checkout.',
      faq4Q: 'Glutenvrij of vegetarisch?',
      faq4A: 'Er zijn opties zonder vis en met groente; voor allergenen: stuur een bericht, we checken de samenstelling.',
      faq5Q: 'Cateren voor bedrijven?',
      faq5A: 'Ja — grote orders plannen we rond jouw tijd. Laat details in het formulier achter.',
      formTitle: 'Contactformulier',
      formSub: 'We ontvangen dit aan de keukenkant en antwoorden op je e-mail.',
      phName: 'Je naam',
      phEmail: 'you@example.com',
      phPhone: '+31 … (optioneel)',
      phMessage: 'Waarmee kunnen we helpen?',
      formSubmit: 'Versturen',
      formSending: 'Verzenden…',
      formSuccess: 'Bedankt! We hebben je bericht ontvangen.',
      formError: 'Verzenden mislukt. Probeer later opnieuw.',
      formNetwork: 'Netwerkfout. Controleer je verbinding.',
      errName: 'Vul een naam in (2–120 tekens).',
      errEmail: 'Vul een geldig e-mailadres in.',
      errMessage: 'Bericht: 10–4000 tekens.',
      honeyLabel: 'Laat dit veld leeg',
      bottomTitle: 'Klaar voor de Watta-smaak?',
      bottomCta: 'Naar het menu',
      scrollHint: 'Scroll verder',
      addressLine: 'Amstelveenseweg 192, 1075 XR Amsterdam, Netherlands',
    },
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
      header: {
        title: "Adminpaneel",
        subtitle: "Bestelstatistieken, producten en leveringen op één plek.",
        siteMenu: "Sitemenu",
        backAria: "Terug",
        refreshTitle: "Gegevens vernieuwen",
        openMenuTitle: "Menu openen",
        closeDrawerAria: "Sluiten",
        adminLangUk: "OEK",
        adminLangRu: "RUS",
        adminLangHint: "Paneeltaal",
      },
      sidebar: { selectSection: "Selecteer sectie", dashboard: "📊 Dashboard", dashboardDesc: "Statistieken & overzicht", orders: "📦 Bestellingen", ordersDesc: "Beheer bestellingen", products: "🍣 Producten", productsDesc: "Menu-items", promos: "🏷️ Promocodes", promosDesc: "Kortingen", cities: "🏙️ Steden", citiesDesc: "Steden & landen", banners: "🎨 Banners", bannersDesc: "Banners", categories: "📋 Categorieën", categoriesDesc: "Menucategorieën", users: "👥 Gebruikers", usersDesc: "Klantenlijst", team: "👨‍👩‍👧‍👦 Team", teamDesc: "Medewerkers", settings: "⚙️ Instellingen", settingsDesc: "Site & banners", ingredients: "🥑 Ingrediënten", newsletter: "📧 Nieuwsbrief" },
      dashboard: {
        loading: "Laden...",
        revenue: "Omzet (voltooid)",
        orders: "Totaal bestellingen",
        products: "Producten",
        cities: "Steden",
        statusTitle: "Bestellingen per status",
        statusPending: "In afwachting",
        statusCooking: "In bereiding",
        statusDelivering: "Onderweg",
        statusCompleted: "Voltooid",
        statusCancelled: "Geannuleerd",
        promos: "Promocodes",
        categories: "Categorieën",
        users: "Gebruikers",
        paidOrders: "Betaalde bestellingen",
        statsHint: "Cijfers uit de database van de site (vernieuwen met de knop).",
        banners: "Banners",
        blog: "Blogposts",
        ingredients: "Ingrediënten",
        team: "Teamleden",
        countries: "Landen",
        contentSection: "Catalogus en content",
        statsFallback: "berekend uit bestellijst",
        studioHeadline: "Watta Sushi-puls",
        studioSub: "Statistieken en grafieken in de stijl van de site.",
        chartRevenue14d: "Omzet voltooide orders (14 dagen)",
        chartOrders14d: "Bestellingen per dag (alle)",
        chartStatusPie: "Verdeling per status",
        chartNoData: "Nog onvoldoende gegevens voor deze grafiek",
        avgOrderValue: "Gem. bestelwaarde (voltooid)",
      },
      actions: { add: "+ Toevoegen", edit: "Bewerken", editShort: "Wijzig", delete: "Verwijderen", save: "Opslaan", saveChanges: "Wijzigingen opslaan", cancel: "Annuleren" },
      common: { menuChangeSection: "Menu / sectie wijzigen", emptyOrders: "Geen actieve bestellingen", emptyCities: "Nog geen steden", emptyBanners: "Nog geen banners", emptyCategories: "Nog geen categorieën", emptyUsers: "Nog geen gebruikers", emptyTeam: "Nog geen teamleden", emptyPromos: "Nog geen promo's", clickToUpload: "Klik om foto te uploaden", changeFile: "Wijzig", selectFromList: "Selecteer uit lijst", activeLabel: "Actief", inactiveLabel: "Inactief", yes: "Ja", no: "Nee", orderIndex: "Weergavevolgorde", choose: "Kiezen", notFound: "Niets gevonden. Probeer een andere zoekopdracht.", searching: "zoeken...", bannerDragHint: "Sleep een kaart op een andere om de volgorde op de site te wijzigen", bannerOrderSaved: "Bannervolgorde opgeslagen", bannerOrderSaveError: "Kon bannervolgorde niet opslaan" },
      orders: { orderNum: "Bestelling #", noComment: "Geen opmerking", payment: "Betaling", cash: "Contant", online: "Online", paid: "BETAALD", error: "FOUT", waiting: "WACHTEN", hintConfirmed: "Bevestigd", hintCooking: "Wordt bereid", hintDelivering: "Onderweg", hintCompleted: "Voltooid", hintCancel: "Annuleren", fulfillmentDelivery: "Bezorging", fulfillmentPickup: "Afhalen", deliveryFeeAdmin: "Bezorgkosten:" },
      news: { title: "Nieuws", addBtn: "+ Toevoegen", editTitle: "Bewerken", newTitle: "Nieuw nieuws", titlePlaceholder: "Titel", descPlaceholder: "Korte beschrijving", textPlaceholder: "Volledige tekst", isHit: "Bestseller", galleryLabel: "Fotogalerij", uploadPhotos: "Foto’s toevoegen (meerdere)", removePhotoAria: "Foto verwijderen", dishesBlock: "Gerechten met korting in dit bericht", selectProduct: "Kies een gerecht", discountShort: "Korting %", addDish: "Gerecht toevoegen", dishDuplicate: "Dit gerecht staat al in de lijst", pickProductFirst: "Kies eerst een gerecht" },
      products: { addBtn: "+ Product toevoegen", hit: "HOT", editTitle: "Gerecht bewerken", newTitle: "Nieuw gerecht", nameLabel: "Productnaam", namePlaceholder: "bijv.: Philadelphia", descLabel: "Beschrijving", descPlaceholder: "Ingrediënten, gewicht, kenmerken...", priceLabel: "Prijs (€)", categoryLabel: "Categorie", selectCategory: "Selecteer...", deliveryCities: "Bezorgsteden *", addCitiesFirst: "Voeg eerst steden toe op het tabblad 'Steden'", descComposition: "Beschrijvingen (Samenstelling)", ingComposition: "Ingrediënten (Samenstelling)" },
      ingredients: { title: "Ingrediëntenbibliotheek", addNew: "Nieuwe toevoegen", nameRu: "Naam", namePlaceholder: "bijv.: Zalm", addBtn: "Toevoegen" },
      cities: { addCountry: "Nieuw land toevoegen", nameRu: "Naam *", sticker: "Landsticker (vlag)", addCountryBtn: "✨ Land toevoegen", countriesTitle: "Landen", editCity: "Stad bewerken", addCity: "Nieuwe stad toevoegen", cityNameRu: "Stadsnaam *", searchMapLabel: "📍 Zoek stad op kaart", searchMapDesc: "Zoek op adres, postcode of naam.", searchMapPlaceholder: "Naam, adres, index...", searchMapBtn: "Zoeken op naam", countryLabel: "Land *", selectCountry: "Selecteer land", activeCity: "Actieve stad", saveChanges: "💾 Wijzigingen opslaan", addCityBtn: "✨ Stad toevoegen", cancelEdit: "Bewerken annuleren", citiesTitle: "Steden", deliveryZones: "Bezorgzones:" },
      banners: { addBtn: "+ Banner toevoegen", tabSubtitle: "Startcarrousel: foto, uitsnede en vertalingen.", editTitle: "Banner bewerken", newTitle: "Nieuwe banner", titleRu: "Titel *", titlePlaceholder: "bijv.: Sushi burgers: perfecte snack" },
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
  adminUiLanguage: AdminUiLanguage
  setAdminUiLanguage: (lang: AdminUiLanguage) => void
  t: Translations
  getLocalized: (obj: any, field: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Всегда начинаем с 'uk' на сервере и клиенте для избежания проблем с гидратацией
  const [language, setLanguageState] = useState<Language>('uk')
  const [adminUiLanguage, setAdminUiLanguageState] = useState<AdminUiLanguage>('uk')

  useEffect(() => {
    // Загружаем язык из localStorage только после монтирования на клиенте
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem('language') as any
      if (saved === 'ua') {
        setLanguageState('uk')
      } else if (saved && ['uk', 'en', 'ru', 'nl'].includes(saved)) {
        setLanguageState(saved as Language)
      }
      const adminSaved = localStorage.getItem('adminUiLang')
      if (adminSaved === 'ru' || adminSaved === 'uk') {
        setAdminUiLanguageState(adminSaved)
      }
    }
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('language', lang)
    }
  }

  const setAdminUiLanguage = (lang: AdminUiLanguage) => {
    setAdminUiLanguageState(lang)
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('adminUiLang', lang)
    }
  }

  const getLocalized = (obj: any, field: string) => {
    if (!obj) return ''
    const suffix = language === 'uk' ? 'ua' : language;
    return obj[`${field}_${suffix}`] || obj[`${field}_${language}`] || obj[`${field}_ru`] || ''
  }

  const mergedT = useMemo((): Translations => {
    const base = translations[language]
    const admin = translations[adminUiLanguage]
    return {
      ...base,
      adminPage: admin.adminPage,
      adminPanel: admin.adminPanel,
    }
  }, [language, adminUiLanguage])

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        adminUiLanguage,
        setAdminUiLanguage,
        t: mergedT,
        getLocalized,
      }}
    >
      {children}
    </LanguageContext.Provider>
  )
}

const defaultContextValue: LanguageContextType = {
  language: 'uk',
  setLanguage: () => {},
  adminUiLanguage: 'uk',
  setAdminUiLanguage: () => {},
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