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
    /** Після успішної перевірки індексу: {{amount}}, {{km}} */
    minOrderAfterCheck: string
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
    /** Великий заголовок над картою зон (як на референсі) */
    zonesMapHeroTitle: string
    /** Підказка в попапі полігона: зберегти тариф для кошика */
    zonePopupSaveHint: string
    /** Тост після кліку по зоні: {{zone}}, {{fee}} */
    zoneSelectedToast: string
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
    /** Амстердам: успішна перевірка індексу, км × 2 € */
    postalAmsterdamOkTitle: string
    postalAmsterdamOkFormula: string
    /** Індекс не в Амстердамі / інше гементе */
    postalOutsideAmsterdam: string
    /** Невірний формат NL (1234 AB) */
    postalInvalidNlFormat: string
    /** Вертикальний підпис біля відео в спліт-гері (сторінка /delivery) */
    splitHeroVideoRail: string
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
    /** Малий акцент над заголовком порожнього кошика */
    emptyCartKicker: string
    /** Підказка під порожнім кошиком */
    emptyCartHint: string
    total: string
    order: string
    /** Кнопка під час відправки */
    processing: string
    proceedCheckout: string
    fulfillmentDelivery: string
    fulfillmentPickup: string
    pickupAtRestaurant: string
    pickupSubtitle: string
    deliveryFree: string
    deliveryUnlockHint: string
    invalidPhone: string
    /** Підзаголовок кошика: підставити {{lines}} та {{pieces}} */
    cartMeta: string
    /** Підпис «за штуку» біля ціни позиції */
    perPiece: string
    contactDetails: string
    deliveryTimeTitle: string
    /** Підказка під заголовком часу доставки (часовий пояс Амстердама) */
    deliveryTimeHint: string
    orderDetailsTitle: string
    paymentMethodTitle: string
    promoCodeTitle: string
    promoPlaceholder: string
    /** {{code}} — промокод */
    promoApplied: string
    subtotalLabel: string
    discountPrefix: string
    bonusAvailableLabel: string
    bonusDeductLine: string
    bonusSpentLabel: string
    calculatingDistance: string
    distanceBreakdown: string
    enterAddressForDeliveryFee: string
    privacyConsent: string
    phonePlaceholder: string
    deliveryZoneLabel: string
    /** Рядок у підсумку: обрана зона з карти, {{zone}} */
    deliveryFromMap: string
    /** Зона «стандарт» — потрібна адреса для розрахунку км */
    deliveryZoneStandardHint: string
    citiesGroupAria: string
    streetPlaceholder: string
    entrancePlaceholder: string
    floorPlaceholder: string
    apartmentPlaceholder: string
    buildingPlaceholder: string
    optNoCallback: string
    optNoDoorbell: string
    slotDayLabel: string
    slotTimeLabel: string
    dayToday: string
    dayTomorrow: string
    partySizeLabel: string
    chopsticksLabel: string
    commentPlaceholder: string
    payCash: string
    payCard: string
    payCardHint: string
    changeFromPlaceholder: string
    distanceMatrixError: string
    promoInvalidFallback: string
    toastMaxQty: string
    /** {{code}} */
    toastPromoOk: string
    toastPromoNetwork: string
    /** {{name}}, {{percent}} */
    toastUpsellAdded: string
    toastAddressRequired: string
    toastOrderFailed: string
    /** {{threshold}} — сума для upsell */
    upsellTitle: string
    upsellLead: string
    upsellOfferFallback: string
    upsellAddToCart: string
    upsellContinue: string
    recScrollPrev: string
    recScrollNext: string
    addToOrder: string
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
    /** Повна сторінка /delivery (окремо від вбудованої доставки в меню) */
    deliveryPage: string
    about: string
    contacts: string
    admin: string
    favorites: string
    /** Підзаголовок у бічній панелі: кошик, обране, профіль */
    sidebarMore: string
    /** © {{year}} … — підвал сайту та низ бічної панелі */
    footerLegal: string
    /** aria-label для фіксованої нижньої панелі навігації */
    bottomNavAria: string
    /** aria-label кнопки закриття правого drawer навігації */
    closeNavDrawerAria: string
    /** Заголовок блока посилань на сторінки сайту в правому drawer */
    drawerExploreTitle: string
    /** Короткий підзаголовок бренду в шапці drawer */
    drawerBrandLine: string
  }
  /** Розширений підвал (білий фон, колонки) */
  siteFooter: {
    navAria: string
    colNav: string
    colOrder: string
    colHours: string
    colLocations: string
    colSocial: string
    blog: string
    reviews: string
    news: string
    phone1: string
    phone2: string
    phone3: string
    hoursLine: string
    /** Якщо з API ще немає міст */
    locationsEmpty: string
    appStore: string
    googlePlay: string
    support: string
    privacy: string
    paymentsAria: string
    /** Підпис під бейджами Visa / Mastercard / iDEAL */
    paymentsMethodsNote: string
    instagramAria: string
    facebookAria: string
    tiktokAria: string
  }
  /** Сторінка товару /product/[id] */
  productDetail: {
    loading: string
    notFound: string
    composition: string
    recommendsTitle: string
    recommendsHint: string
    badgeTopSales: string
    badgeNew: string
    adding: string
    prepTime: string
    weightFallback: string
    piecesFallback: string
    toCart: string
    addedHint: string
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
    /** Кінематографічний тёмний герой + слайди в стилі преміум-доставки */
    darkHeroSubtitle: string
    darkFoundedLabel: string
    darkFoundedYearCity: string
    darkMilestoneLine1: string
    darkMilestoneLine2: string
    philosophyTitlePart1: string
    philosophyTitlePart2: string
    slide1Title: string
    slide1Body: string
    slide2Title: string
    slide2Body: string
    slide3Title: string
    slide3Body: string
    slide4Title: string
    slide4Body: string
    slide5Title: string
    slide5Body: string
    slide6Title: string
    slide6Body: string
    artHeadlineLine1: string
    artHeadlineLine2: string
    artHeadlineAccent: string
    insideSectionTitle: string
    inside1Title: string
    inside1Body: string
    inside2Title: string
    inside2Body: string
    inside3Title: string
    inside3Body: string
    inside4Title: string
    inside4Body: string
    inside5Title: string
    inside5Body: string
    inside6Title: string
    inside6Body: string
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
    /** Зелене посилання як у референсі «Читати» */
    readCta: string
    /** Тег категорії, якщо з API не прийшла мітка */
    defaultCategoryTag: string
    /** Підказка, коли показуємо демо-новини без бекенду */
    fallbackHint: string
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
    fallbackHint: string
    /** Тег на картці, коли з API немає категорії */
    cardCategoryFallback: string
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
  /** Сторінка політики конфіденційності */
  privacyPage: {
    title: string
    back: string
    updated: string
    intro: string
    blocks: ReadonlyArray<{ title: string; body: string }>
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
    emptySubtext: string
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
    /** Підказка: товари на окремій сторінці */
    catalogOnCategoryPageHint: string
    categoryPageBack: string
    categoryPageEmpty: string
    categoryPageOpenCart: string
    /** Сторінка /menu — повний каталог */
    fullMenuTitle: string
    fullMenuSub: string
    fullMenuWant: string
    fullMenuCategoriesAria: string
    fullMenuLoading: string
    fullMenuEmpty: string
    /** Таб «усі категорії» у стрічці на /menu */
    fullMenuAllTab: string
    /** Aria для горизонтальної стрічки страв у категорії на головній */
    categoryRailAria: string
    /** Заголовок поверх фото-банера на головній */
    heroBannerOverlayTitle: string
    /** Підзаголовок / коротка «цитата» під заголовком на банері */
    heroBannerOverlaySub: string
    /** Під банером — стилізація як SMS від бренду */
    heroBannerSmsSender: string
    heroBannerSmsBadge: string
    heroBannerSmsTime: string
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
    /** Блок товарів зі знижкою з адмінки */
    sectionPromoTitle: string
    sectionRecommendedTitle: string
    /** Популярні / хіти з адмінки (isPopular) */
    sectionPopularTitle: string
    /** Горизонтальний ряд чипів категорій під підказкою */
    sectionCategoriesTitle: string
    recommendedBadge: string
    popularBadge: string
    promoStripAria: string
    recommendedStripAria: string
    popularStripAria: string
    categoriesStripAria: string
    aboutTitle: string
    aboutLead: string
    aboutBody: string
    animationSlotAria: string
    /** Фрази бігучого рядка під hero-відео, через | */
    heroMarquee: string
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
      minOrder:
        'Доставляємо лише в міста зі списку на цій сторінці та в шапці сайту. Чи є доставка саме на вашу адресу і яка вартість — перевірте блоком вище за поштовим індексом. Мінімальна сума замовлення залежить від відстані від нашої кухні: до 20 км — від 25 €, понад 20 км — від 100 €.',
      minOrderAfterCheck:
        'За вашою перевіркою: мінімальне замовлення для цієї адреси — {{amount}} € (відстань від кухні ≈ {{km}} км).',
      remoteHint: 'Дуже віддалені або нетипові адреси — за попередньою домовленістю з оператором.',
      hoursTitle: 'Ми на звʼязку',
      hoursRange: '14:00 — 21:00',
      howTitle: 'Як замовити',
      stepWeb: 'На сайті',
      stepApp: 'У застосунку',
      stepPhone: 'Телефоном',
      stepWebDesc: 'Меню, кошик, оплата й адреса — усе в один клік, без зайвих кроків.',
      stepAppDesc: 'Той самий зручний досвід у застосунку — швидке повторення улюблених замовлень.',
      stepPhoneDesc: 'Зателефонуйте — підкажемо по меню, зонах і часу доставки.',
      kitchenMapCaption: 'Наша кухня на карті',
      conditionsKicker: 'Сервіс',
      conditionsFeature1:
        'Працюємо лише з містами з нашого списку — оберіть своє на сторінці або в шапці сайту.',
      conditionsFeature2:
        'Вище за індексом можна перевірити, чи входить ваша адреса в зону та скільки коштуватиме доставка.',
      conditionsFeature3:
        'Відстань і мінімальне замовлення рахуються автоматично від координат кухні до точки вашого поштового індексу.',
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
        'Оберіть місто зі списку (як у шапці сайту) і введіть поштовий індекс. Для Амстердама (NL) рахуємо відстань від нашої кухні до точки індексу автоматично: 2 € за кілометр. В інших містах — зони й тарифи задає адміністратор.',
      postalLabel: 'Поштовий індекс',
      postalPlaceholder: 'Напр. 1075 VV (Амстердам, NL)',
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
      zonesMapHeroTitle: 'Зона доставки Watta Sushi',
      zonePopupSaveHint: 'Натисніть на зону — тариф збережеться для кошика.',
      zoneSelectedToast: 'Зона «{{zone}}»: {{fee}}. Застосовано в кошику.',
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
      postalAmsterdamOkTitle: 'Доставка в Амстердамі доступна за цим індексом',
      postalAmsterdamOkFormula: 'Відстань від кухні: {{km}} км × 2 €/км = орієнтовно {{amount}} € за доставку.',
      postalOutsideAmsterdam:
        'За цим індексом адреса не в Амстердамі (або в іншому гементе поруч). Перевірте індекс або оберіть інше місто.',
      postalInvalidNlFormat:
        'Формат індексу Нідерландів: чотири цифри та дві літери, наприклад 1075 VV.',
      splitHeroVideoRail: 'З кухні — до вас',
    },
    categories: { rolls: 'Роли', sushi: 'Суші', sets: 'Сети', soups: 'Супи', bowls: 'Боули', snacks: 'Закуски', drinks: 'Напої', sauces: 'Соуси' },
    hero: { title: 'Користь азіатських супів' },
    welcomeHero: {
      title: 'Watta Sushi',
      description:
        'Японська кухня з душею: свіжі роли, суші та авторські страви — з доставкою до вашого столу. Смак, який хочеться повторювати.',
    },
    section: { title: 'Доставка суші до вашого столу', description: 'В асортименті Watta Sushi представлені роли, суші, сети і напої на будь-який смак. Ми рекомендуємо обов\'язково спробувати топ позиції нашого меню!' },
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
      empty: 'Кошик порожній',
      emptyCartKicker: 'Ще трохи голодно?',
      emptyCartHint:
        'Заглянь у меню — обери роли чи суші, натисни «Замовити» на картці або додай страву на її сторінці. Ми вже готуємо соєвий соус.',
      total: 'Всього',
      order: 'Оформити замовлення',
      processing: 'Обробка…',
      proceedCheckout: 'Перейти до оформлення',
      fulfillmentDelivery: 'Доставка',
      fulfillmentPickup: 'Самовивіз',
      pickupAtRestaurant: 'Заберіть замовлення за адресою:',
      pickupSubtitle: 'Заберіть замовлення у зазначений час.',
      deliveryFree: 'Безкоштовно',
      deliveryUnlockHint: 'Безкоштовна доставка від {{amount}} €',
      invalidPhone: 'Невірний формат телефону',
      cartMeta: '{{lines}} поз. · {{pieces}} шт',
      perPiece: 'шт.',
      contactDetails: 'Контактні дані',
      deliveryTimeTitle: 'Час доставки',
      deliveryTimeHint: 'Інтервали за часом Амстердама (CET/CEST). Минулий слот недоступний.',
      orderDetailsTitle: 'Деталі',
      paymentMethodTitle: 'Спосіб оплати',
      promoCodeTitle: 'Промокод',
      promoPlaceholder: 'Введіть код',
      promoApplied: 'Промокод {{code}} застосовано',
      subtotalLabel: 'Сума замовлення',
      discountPrefix: 'Знижка',
      bonusAvailableLabel: 'Списати бонуси (доступно: {{amount}} €)',
      bonusDeductLine: 'Буде списано: {{amount}} €',
      bonusSpentLabel: 'Списано бонусами',
      calculatingDistance: 'Розраховуємо відстань доставки…',
      distanceBreakdown: 'Відстань: {{km}} км × {{rate}} = {{sum}} €',
      enterAddressForDeliveryFee: 'Вкажіть адресу доставки для розрахунку вартості',
      privacyConsent:
        'Натискаючи кнопку, ви погоджуєтесь з обробкою персональних даних відповідно до політики конфіденційності.',
      phonePlaceholder: '+380…, +31… або 10–15 цифр',
      deliveryZoneLabel: 'Зона доставки',
      deliveryFromMap: 'Зона на карті: {{zone}}',
      deliveryZoneStandardHint:
        'Для цієї зони доставка за км — вкажіть адресу нижче або перевірте індекс на сторінці доставки.',
      citiesGroupAria: 'Місто доставки',
      streetPlaceholder: 'Вулиця та номер будинку *',
      entrancePlaceholder: "Під'їзд (лише цифри)",
      floorPlaceholder: 'Поверх (лише цифри)',
      apartmentPlaceholder: 'Квартира (лише цифри)',
      buildingPlaceholder: 'Корпус / блок',
      optNoCallback: 'Не передзвонювати для підтвердження',
      optNoDoorbell: 'Не дзвонити у двері',
      slotDayLabel: 'День',
      slotTimeLabel: 'Час',
      dayToday: 'Сьогодні',
      dayTomorrow: 'Завтра',
      partySizeLabel: 'Кількість осіб (1–99)',
      chopsticksLabel: 'Палички',
      commentPlaceholder: 'Коментар до замовлення',
      payCash: 'Готівкою',
      payCard: 'Карткою онлайн',
      payCardHint: 'LiqPay, Apple Pay, Google Pay',
      changeFromPlaceholder: 'Решта з якої суми? (наприклад: 50)',
      distanceMatrixError: 'Не вдалося розрахувати відстань',
      promoInvalidFallback: 'Невірний код',
      toastMaxQty: 'Максимум 99 шт. одного товару',
      toastPromoOk: 'Промокод {{code}} застосовано',
      toastPromoNetwork: 'Помилка з’єднання',
      toastUpsellAdded: '{{name}} додано зі знижкою {{percent}}%',
      toastAddressRequired: 'Вкажіть адресу доставки',
      toastOrderFailed: 'Не вдалося оформити замовлення.',
      upsellTitle: 'Додайте до замовлення зі знижкою',
      upsellLead: 'Сума вже від {{threshold}} € — оберіть спецпропозицію перед оплатою.',
      upsellOfferFallback: 'Спеціальна пропозиція',
      upsellAddToCart: 'У кошик',
      upsellContinue: 'Продовжити оформлення',
      recScrollPrev: 'Прокрутити рекомендації вліво',
      recScrollNext: 'Прокрутити рекомендації вправо',
      addToOrder: 'Додайте до замовлення',
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
      deliveryPage: 'Сторінка доставки',
      about: 'Про нас',
      contacts: 'Контакти',
      admin: 'Адмін-панель',
      favorites: 'Обране',
      sidebarMore: 'Ще',
      footerLegal: '© {{year}} Watta Sushi. Всі права захищені.',
      bottomNavAria: 'Основна навігація сайту',
      closeNavDrawerAria: 'Закрити меню навігації',
      drawerExploreTitle: 'Сторінки сайту',
      drawerBrandLine: 'Доставка найсмачніших суші',
    },
    siteFooter: {
      navAria: 'Навігація в підвалі сайту',
      colNav: 'Навігація',
      colOrder: 'Оформити замовлення',
      colHours: 'Час роботи',
      colLocations: 'Наші міста',
      colSocial: 'Ми в соцмережах',
      blog: 'Блог',
      reviews: 'Відгуки',
      news: 'Новини',
      phone1: '+38 (067) 000 00 01',
      phone2: '+38 (066) 000 00 02',
      phone3: '+38 (093) 000 00 03',
      hoursLine: 'щодня 14:00 — 21:00',
      locationsEmpty: 'Міста з’являться після додавання в адмін-панелі.',
      appStore: 'App Store',
      googlePlay: 'Google Play',
      support: 'Підтримка',
      privacy: 'Політика конфіденційності',
      paymentsAria: 'Способи оплати',
      paymentsMethodsNote:
        'Оплата банківською карткою та через iDEAL у Нідерландах.',
      instagramAria: 'Instagram',
      facebookAria: 'Facebook',
      tiktokAria: 'TikTok',
    },
    productDetail: {
      loading: 'Завантаження…',
      notFound: 'Товар не знайдено',
      composition: 'Склад',
      recommendsTitle: 'Watta рекомендує',
      recommendsHint: 'Обрані позиції, які гармонійно доповнять ваше замовлення.',
      badgeTopSales: 'Топ продажів',
      badgeNew: 'Новинка',
      adding: 'Додаємо…',
      prepTime: '30–40 хв',
      weightFallback: '250 г',
      piecesFallback: '8 шт',
      toCart: 'У кошик',
      addedHint: 'Додано в кошик',
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
      hoursLine: "Щодня 14:00 — 21:00",
      phoneLine: "+31 6 1234 5678",
      teamEmptyTitle: "Команда на фото з’явиться зовсім скоро",
      teamEmptyBody: "Поки що знайомтесь з нами через страви — кожен рол уже зроблений руками наших шефів.",
      marqueeWords: "Свіжість|Температура|Смак|Команда|Амстердам|Роли|Суші|Доставка|Якість",
      darkHeroSubtitle: "Преміальний сервіс доставки страв японської кухні",
      darkFoundedLabel: "Засновані в",
      darkFoundedYearCity: "2025 в Амстердамі",
      darkMilestoneLine1: "Сьогодні",
      darkMilestoneLine2: "розвиваємо сервіс на території Нідерландів",
      philosophyTitlePart1: "Watta",
      philosophyTitlePart2: "філософія",
      slide1Title: "Дійсно великі порції",
      slide1Body: "Наші роли — щедра начинка в кожному шматочку, контроль ваги на кухні.",
      slide2Title: "Завжди свіжі інгредієнти",
      slide2Body: "Постачання щодня, перевірка якості та холодний ланцюг до вашого столу.",
      slide3Title: "Широке меню",
      slide3Body: "Класичні, веганські та авторські рецепти — знайдеться на кожен настрій.",
      slide4Title: "Зручний застосунок",
      slide4Body: "iOS та Android — замовлення в кілька торкань, історія та статус доставки.",
      slide5Title: "Лайфстайл #wattafam",
      slide5Body: "Новинки меню, колаборації та історії з кухні — у соцмережах і в застосунку.",
      slide6Title: "Швидка доставка",
      slide6Body: "Кур'єри знають маршрути — їжа приїжджає теплою та охайно упакованою.",
      artHeadlineLine1: "Watta створює не просто роли,",
      artHeadlineLine2: "а витвори",
      artHeadlineAccent: "МИСТЕЦТВА",
      insideSectionTitle: "Що всередині ролу?",
      inside1Title: "Свіжі морепродукти",
      inside1Body: "Лосось, тунець та інші позиції з перевірених постачальників.",
      inside2Title: "Рис преміум-класу",
      inside2Body: "Правильне приготування та баланс оцту — основа смаку кожного ролу.",
      inside3Title: "Авокадо та овочі",
      inside3Body: "Стиглі овочі, кремова текстура та свіжий хруст у фірмових рецептах.",
      inside4Title: "Норі та соуси",
      inside4Body: "Якісні водорості та соуси власного приготування — без зайвої солі.",
      inside5Title: "Сир і крем-сир",
      inside5Body: "Філадельфія та інші молочні нотки для класичних і авторських комбінацій.",
      inside6Title: "Кунжут і прикраси",
      inside6Body: "Тостований кунжут, мікрозелень та делікатні штрихи перед відправкою.",
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
      catalogOnCategoryPageHint:
        'Страви обраної категорії відкриваються на окремій сторінці — натисніть тип у сітці нижче або в панелі категорій.',
      categoryPageBack: 'На головну',
      categoryPageEmpty: 'У цій категорії поки немає позицій.',
      categoryPageOpenCart: 'Кошик',
      fullMenuTitle: 'Повне меню',
      fullMenuSub: 'Усі категорії та страви на одній сторінці. Оберіть категорію зверху — список прокрутиться до потрібного блоку.',
      fullMenuWant: 'Замовити',
      fullMenuCategoriesAria: 'Категорії меню',
      fullMenuLoading: 'Завантаження меню…',
      fullMenuEmpty: 'Поки що немає страв у каталозі.',
      fullMenuAllTab: 'Усі',
      categoryRailAria: 'горизонтальна стрічка страв — гортайте вліво та вправо; натисніть картку, щоб відкрити страву',
      heroBannerOverlayTitle: 'Проводьте час разом із\u00A0нами',
      heroBannerOverlaySub: 'Свіжі роли, тепла зустріч і смак, яким хочеться ділитися.',
      heroBannerSmsSender: 'Watta Sushi',
      heroBannerSmsBadge: 'SMS',
      heroBannerSmsTime: 'щойно',
    },
    cinematicFooter: {
      readyTitle: 'Готові замовити?',
      ctaBanners: 'До банерів і акцій',
      ctaMenu: 'Відкрити меню',
      ctaCatalog: 'Каталог страв',
      ctaOffers: 'Пропозиції',
      promoCarouselAria: 'Акційні пропозиції — гортайте вліво-вправо',
      promoPickHint:
        'Нижче — рекомендовані страви та акційні пропозиції з меню. Гортайте стрічки вліво-вправо; торкніться картки, щоб відкрити страву.',
      promoBadge: 'Акція',
      prevPromo: 'Попередня',
      nextPromo: 'Наступна',
      sectionPromoTitle: 'Акції',
      sectionRecommendedTitle: 'Рекомендовані',
      sectionPopularTitle: 'Хіти та топ',
      sectionCategoriesTitle: 'Категорії',
      recommendedBadge: 'Топ',
      popularBadge: 'ХІТ',
      promoStripAria: 'Страви зі знижкою зараз',
      recommendedStripAria: 'Рекомендовані страви',
      popularStripAria: 'Популярні страви — гортайте вліво та вправо',
      categoriesStripAria: 'Категорії меню — натисніть, щоб перейти до розділу в каталозі',
      aboutTitle: 'WATTA — СМАК БЕЗ ЗАЙВОГО ШУМУ',
      aboutLead:
        'Ми не граємо в «японську кухню з доставкою» — ми про точність рецепту, свіжість і сервіс, яким можна пишатися.',
      aboutBody:
        'Роли збираємо на замовлення, тримаємо дисципліну температури для рису й соусів, а команда чесно підкаже, що обрати під ваш настрій. Це не фастфуд — це швидка гастрономія з характером.',
      animationSlotAria: 'Місце для анімації бренду',
      heroMarquee:
        "З любов'ю до смаку|Watta Sushi|Свіжі роли|Швидка доставка|Преміум інгредієнти",
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
      readCta: "Читати",
      defaultCategoryTag: "Новини Watta",
      fallbackHint: "Поки з сервера немає записів — нижче приклади оформлення. Ваші новини з’являться тут після додавання в адмін-панелі.",
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
      readMore: 'Читати',
      backToBlog: 'Усі статті',
      fallbackHint: 'Поки з API немає статей — показуємо приклади нотаток шефа. Публікації з адмін-панелі замінять цей блок.',
      cardCategoryFallback: 'Блог шефа',
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
      hoursDetail: 'Щодня 14:00 — 21:00',
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
      faq3A:
        'Банківська картка (Visa, Mastercard) та iDEAL для Нідерландів; також готівка або термінал у кур’єра — залежно від міста та налаштувань оформлення.',
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
    privacyPage: {
      title: 'Політика конфіденційності',
      back: 'Назад',
      updated: 'Останнє оновлення: квітень 2026',
      intro:
        'Ця сторінка пояснює, як Watta Sushi збирає, використовує та захищає ваші персональні дані під час відвідування сайту, оформлення замовлень і користування сервісом. Ми діємо відповідно до застосовного законодавства, зокрема GDPR (ЄС).',
      blocks: [
        {
          title: 'Володілець даних',
          body: 'Відповідальним за обробку персональних даних є Watta Sushi (оператор сервісу доставки). Контактні дані для питань щодо приватності — через розділ «Контакти» на сайті або електронну пошту, вказану там.',
        },
        {
          title: 'Які дані ми обробляємо',
          body: 'Ім’я, телефон, email (за потреби), адреса доставки або самовивозу, історія замовлень, технічні дані (IP, тип браузера, файли cookie), а також повідомлення, які ви надсилаєте через форми зворотного зв’язку.',
        },
        {
          title: 'Мета та правові підстави',
          body: 'Дані використовуються для прийому й виконання замовлень, зв’язку з вами, покращення сервісу, дотримання юридичних зобов’язань і, за вашою згодою, для маркетингових повідомлень (які можна вимкнути).',
        },
        {
          title: 'Передача третім особам',
          body: 'Ми можемо передавати обмежений обсяг даних платіжним провайдерам, службам доставки та хостингу лише в обсязі, необхідному для надання послуги, на підставі договорів та вимог безпеки.',
        },
        {
          title: 'Зберігання та безпека',
          body: 'Дані зберігаються лише стільки, скільки потрібно для цілей обробки або вимог закону. Застосовуємо технічні та організаційні заходи для захисту від несанкціонованого доступу та втрати.',
        },
        {
          title: 'Ваші права',
          body: 'Ви можете запитати доступ, виправлення, видалення даних, обмеження обробки, перенесення даних або заперечити проти певних видів обробки. Для скарг — до наглядового органу у вашій країні перебування.',
        },
        {
          title: 'Файли cookie',
          body: 'Сайт може використовувати cookie для роботи кошика, мови інтерфейсу та аналітики. Ви можете керувати cookie в налаштуваннях браузера.',
        },
        {
          title: 'Зміни до політики',
          body: 'Ми можемо оновлювати цю сторінку; актуальна версія завжди опублікована тут. Продовжуючи користуватися сервісом після змін, ви підтверджуєте ознайомлення з оновленою політикою.',
        },
      ],
    },
    notifications: {
      title: "Повідомлення",
      empty: "Повідомлень немає",
      emptySubtext: "Ми повідомимо, коли з'явиться щось цікаве",
    },
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
      minOrder:
        'Доставляем только в города из списка на этой странице и в шапке сайта. Есть ли доставка на ваш адрес и какая стоимость — проверьте блоком выше по почтовому индексу. Минимальная сумма заказа зависит от расстояния от нашей кухни: до 20 км — от 25 €, свыше 20 км — от 100 €.',
      minOrderAfterCheck:
        'По вашей проверке: минимальный заказ для этого адреса — {{amount}} € (расстояние от кухни ≈ {{km}} км).',
      remoteHint: 'Очень отдалённые или нетипичные адреса — по договорённости с оператором.',
      hoursTitle: 'Мы на связи',
      hoursRange: '14:00 — 21:00',
      howTitle: 'Как заказать',
      stepWeb: 'На сайте',
      stepApp: 'В приложении',
      stepPhone: 'По телефону',
      stepWebDesc: 'Меню, корзина, оплата и адрес — всё на сайте без лишних шагов.',
      stepAppDesc: 'Тот же удобный опыт в приложении — быстрый повтор любимых заказов.',
      stepPhoneDesc: 'Позвоните — подскажем по меню, зонам и времени доставки.',
      kitchenMapCaption: 'Наша кухня на карте',
      conditionsKicker: 'Сервис',
      conditionsFeature1:
        'Работаем только с городами из нашего списка — выберите свой на странице или в шапке сайта.',
      conditionsFeature2:
        'Выше по индексу можно проверить, входит ли адрес в зону и сколько будет стоить доставка.',
      conditionsFeature3:
        'Расстояние и минимальный заказ считаются автоматически от координат кухни до точки почтового индекса.',
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
        'Выберите город из списка (как в шапке сайта) и введите индекс. Для Амстердама (NL) расстояние от нашей кухни до точки индекса считается автоматически: 2 € за километр. В других городах зоны и тарифы задаёт администратор.',
      postalLabel: 'Почтовый индекс',
      postalPlaceholder: 'Напр. 1075 VV (Амстердам, NL)',
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
      zonesMapHeroTitle: 'Зона доставки Watta Sushi',
      zonePopupSaveHint: 'Нажмите на зону — тариф сохранится для корзины.',
      zoneSelectedToast: 'Зона «{{zone}}»: {{fee}}. Применено в корзине.',
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
      postalAmsterdamOkTitle: 'Доставка в Амстердаме по этому индексу доступна',
      postalAmsterdamOkFormula: 'Расстояние от кухни: {{km}} км × 2 €/км ≈ {{amount}} € за доставку.',
      postalOutsideAmsterdam:
        'По этому индексу адрес не в Амстердаме (или в другом гементе рядом). Проверьте индекс или выберите другой город.',
      postalInvalidNlFormat: 'Формат индекса Нидерландов: четыре цифры и две буквы, например 1075 VV.',
      splitHeroVideoRail: 'С кухни — к вам',
    },
    categories: { rolls: 'Роллы', sushi: 'Суши', sets: 'Сеты', soups: 'Супы', bowls: 'Боулы', snacks: 'Закуски', drinks: 'Напитки', sauces: 'Соусы' },
    hero: { title: 'Польза азиатских супов' },
    welcomeHero: {
      title: 'Watta Sushi',
      description:
        'Японская кухня с душой: свежие роллы, суши и авторские блюда — с доставкой к вашему столу. Вкус, который хочется повторять.',
    },
    section: { title: 'Доставка суши к вашему столу', description: 'В ассортименте Watta Sushi представлены роллы, суши, сеты и напитки на любой вкус. Мы рекомендуем обязательно попробовать топ позиции нашего меню!' },
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
      emptyCartKicker: 'Аппетит уже проснулся?',
      emptyCartHint:
        'Загляни в меню — выбери роллы или суши, нажми «Заказать» на карточке или добавь блюдо на странице позиции. Соевый соус мы подготовим.',
      total: 'Итого',
      order: 'Оформить заказ',
      processing: 'Обработка…',
      proceedCheckout: 'Перейти к оформлению',
      fulfillmentDelivery: 'Доставка',
      fulfillmentPickup: 'Самовывоз',
      pickupAtRestaurant: 'Заберите заказ по адресу:',
      pickupSubtitle: 'Заберите заказ в указанное время.',
      deliveryFree: 'Бесплатно',
      deliveryUnlockHint: 'Бесплатная доставка от {{amount}} €',
      invalidPhone: 'Неверный формат телефона',
      cartMeta: '{{lines}} поз. · {{pieces}} шт',
      perPiece: 'шт.',
      contactDetails: 'Контактные данные',
      deliveryTimeTitle: 'Время доставки',
      deliveryTimeHint: 'Интервалы по времени Амстердама (CET/CEST). Прошедшие слоты недоступны.',
      orderDetailsTitle: 'Детали',
      paymentMethodTitle: 'Способ оплаты',
      promoCodeTitle: 'Промокод',
      promoPlaceholder: 'Введите код',
      promoApplied: 'Промокод {{code}} применён',
      subtotalLabel: 'Сумма заказа',
      discountPrefix: 'Скидка',
      bonusAvailableLabel: 'Списать бонусы (доступно: {{amount}} €)',
      bonusDeductLine: 'Будет списано: {{amount}} €',
      bonusSpentLabel: 'Списано бонусами',
      calculatingDistance: 'Считаем расстояние доставки…',
      distanceBreakdown: 'Расстояние: {{km}} км × {{rate}} = {{sum}} €',
      enterAddressForDeliveryFee: 'Введите адрес доставки для расчёта стоимости',
      privacyConsent:
        'Нажимая кнопку, вы соглашаетесь с обработкой персональных данных в соответствии с политикой конфиденциальности.',
      phonePlaceholder: '+380…, +31… или 10–15 цифр',
      deliveryZoneLabel: 'Зона доставки',
      deliveryFromMap: 'Зона на карте: {{zone}}',
      deliveryZoneStandardHint:
        'Для этой зоны доставка по км — укажите адрес ниже или проверьте индекс на странице доставки.',
      citiesGroupAria: 'Город доставки',
      streetPlaceholder: 'Улица и номер дома *',
      entrancePlaceholder: 'Подъезд (только цифры)',
      floorPlaceholder: 'Этаж (только цифры)',
      apartmentPlaceholder: 'Квартира (только цифры)',
      buildingPlaceholder: 'Корпус / блок',
      optNoCallback: 'Не перезванивать для подтверждения',
      optNoDoorbell: 'Не звонить в дверь',
      slotDayLabel: 'День',
      slotTimeLabel: 'Время',
      dayToday: 'Сегодня',
      dayTomorrow: 'Завтра',
      partySizeLabel: 'Количество персон (1–99)',
      chopsticksLabel: 'Палочки',
      commentPlaceholder: 'Комментарий к заказу',
      payCash: 'Наличными',
      payCard: 'Картой онлайн',
      payCardHint: 'LiqPay, Apple Pay, Google Pay',
      changeFromPlaceholder: 'Сдача с какой суммы? (например: 50)',
      distanceMatrixError: 'Не удалось рассчитать расстояние',
      promoInvalidFallback: 'Неверный код',
      toastMaxQty: 'Максимум 99 шт. одного товара',
      toastPromoOk: 'Промокод {{code}} применён',
      toastPromoNetwork: 'Ошибка соединения',
      toastUpsellAdded: '{{name}} добавлено со скидкой {{percent}}%',
      toastAddressRequired: 'Укажите адрес доставки',
      toastOrderFailed: 'Не удалось оформить заказ.',
      upsellTitle: 'Добавьте к заказу со скидкой',
      upsellLead: 'Сумма уже от {{threshold}} € — выберите спецпредложение перед оплатой.',
      upsellOfferFallback: 'Специальное предложение',
      upsellAddToCart: 'В корзину',
      upsellContinue: 'Продолжить оформление',
      recScrollPrev: 'Прокрутить рекомендации влево',
      recScrollNext: 'Прокрутить рекомендации вправо',
      addToOrder: 'Добавьте к заказу',
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
      deliveryPage: 'Страница доставки',
      about: 'О нас',
      contacts: 'Контакты',
      admin: 'Админ-панель',
      favorites: 'Избранное',
      sidebarMore: 'Ещё',
      footerLegal: '© {{year}} Watta Sushi. Все права защищены.',
      bottomNavAria: 'Основная навигация сайта',
      closeNavDrawerAria: 'Закрыть меню навигации',
      drawerExploreTitle: 'Страницы сайта',
      drawerBrandLine: 'Доставка самых вкусных суши',
    },
    siteFooter: {
      navAria: 'Навигация в подвале сайта',
      colNav: 'Навигация',
      colOrder: 'Оформить заказ',
      colHours: 'Часы работы',
      colLocations: 'Наши города',
      colSocial: 'Мы в соцсетях',
      blog: 'Блог',
      reviews: 'Отзывы',
      news: 'Новости',
      phone1: '+38 (067) 000 00 01',
      phone2: '+38 (066) 000 00 02',
      phone3: '+38 (093) 000 00 03',
      hoursLine: 'ежедневно 14:00 — 21:00',
      locationsEmpty: 'Города появятся после добавления в админ-панели.',
      appStore: 'App Store',
      googlePlay: 'Google Play',
      support: 'Поддержка',
      privacy: 'Политика конфиденциальности',
      paymentsAria: 'Способы оплаты',
      paymentsMethodsNote:
        'Оплата банковской картой и через iDEAL в Нидерландах.',
      instagramAria: 'Instagram',
      facebookAria: 'Facebook',
      tiktokAria: 'TikTok',
    },
    productDetail: {
      loading: 'Загрузка…',
      notFound: 'Товар не найден',
      composition: 'Состав',
      recommendsTitle: 'Watta рекомендует',
      recommendsHint: 'Подборка блюд, которые гармонично дополнят ваш заказ.',
      badgeTopSales: 'Топ продаж',
      badgeNew: 'Новинка',
      adding: 'Добавляем…',
      prepTime: '30–40 мин',
      weightFallback: '250 г',
      piecesFallback: '8 шт',
      toCart: 'В корзину',
      addedHint: 'Добавлено в корзину',
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
      hoursLine: "Ежедневно 14:00 — 21:00",
      phoneLine: "+31 6 1234 5678",
      teamEmptyTitle: "Скоро здесь появятся фото команды",
      teamEmptyBody: "Пока знакомьтесь с нами через блюда — каждый ролл уже сделан руками наших шефов.",
      marqueeWords: "Свежесть|Температура|Вкус|Команда|Амстердам|Роллы|Суши|Доставка|Качество",
      darkHeroSubtitle: "Премиальный сервис доставки блюд японской кухни",
      darkFoundedLabel: "Основаны в",
      darkFoundedYearCity: "2025 в Амстердаме",
      darkMilestoneLine1: "Сегодня",
      darkMilestoneLine2: "развиваем сервис на территории Нидерландов",
      philosophyTitlePart1: "Watta",
      philosophyTitlePart2: "философия",
      slide1Title: "По-настоящему большие порции",
      slide1Body: "Наши роллы — щедрая начинка в каждом куске, контроль веса на кухне.",
      slide2Title: "Всегда свежие ингредиенты",
      slide2Body: "Поставки ежедневно, проверка качества и холодная цепь до вашего стола.",
      slide3Title: "Широкое меню",
      slide3Body: "Классические, веганские и авторские рецепты — на любой вкус.",
      slide4Title: "Удобное приложение",
      slide4Body: "iOS и Android — заказ в несколько касаний, история и статус доставки.",
      slide5Title: "Лайфстайл #wattafam",
      slide5Body: "Новинки меню, коллаборации и истории с кухни — в соцсетях и в приложении.",
      slide6Title: "Быстрая доставка",
      slide6Body: "Курьеры знают маршруты — еда приезжает тёплой и аккуратно упакованной.",
      artHeadlineLine1: "Watta создаёт не просто роллы,",
      artHeadlineLine2: "а произведения",
      artHeadlineAccent: "ИСКУССТВА",
      insideSectionTitle: "Что внутри ролла?",
      inside1Title: "Свежие морепродукты",
      inside1Body: "Лосось, тунец и другие позиции от проверенных поставщиков.",
      inside2Title: "Рис премиум-класса",
      inside2Body: "Правильная варка и баланс уксуса — основа вкуса каждого ролла.",
      inside3Title: "Авокадо и овощи",
      inside3Body: "Спелые овощи, кремовая текстура и свежий хруст в фирменных рецептах.",
      inside4Title: "Нори и соусы",
      inside4Body: "Качественные водоросли и соусы собственного приготовления — без лишней соли.",
      inside5Title: "Сыр и крем-сыр",
      inside5Body: "Филадельфия и другие молочные ноты для классических и авторских сочетаний.",
      inside6Title: "Кунжут и украшения",
      inside6Body: "Поджаренный кунжут, микрозелень и деликатные штрихи перед отправкой.",
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
      catalogOnCategoryPageHint:
        'Блюда категории открываются на отдельной странице — выберите тип в сетке ниже или в панели категорий.',
      categoryPageBack: 'На главную',
      categoryPageEmpty: 'В этой категории пока нет позиций.',
      categoryPageOpenCart: 'Корзина',
      fullMenuTitle: 'Полное меню',
      fullMenuSub: 'Все категории и блюда на одной странице. Выберите категорию сверху — список прокрутится к нужному блоку.',
      fullMenuWant: 'Заказать',
      fullMenuCategoriesAria: 'Категории меню',
      fullMenuLoading: 'Загрузка меню…',
      fullMenuEmpty: 'Пока нет блюд в каталоге.',
      fullMenuAllTab: 'Все',
      categoryRailAria: 'горизонтальная лента блюд — листайте влево и вправо; нажмите карточку, чтобы открыть блюдо',
      heroBannerOverlayTitle: 'Проводите время вместе с\u00A0нами',
      heroBannerOverlaySub: 'Свежие роллы, тёплая встреча и вкус, которым хочется делиться.',
      heroBannerSmsSender: 'Watta Sushi',
      heroBannerSmsBadge: 'SMS',
      heroBannerSmsTime: 'сейчас',
    },
    cinematicFooter: {
      readyTitle: 'Готовы заказать?',
      ctaBanners: 'К баннерам и акциям',
      ctaMenu: 'Открыть меню',
      ctaCatalog: 'Каталог блюд',
      ctaOffers: 'Предложения',
      promoCarouselAria: 'Акции — листайте влево и вправо',
      promoPickHint:
        'Ниже — рекомендуемые блюда и акционные предложения из меню. Листайте ленты влево-вправо; нажмите на карточку, чтобы открыть блюдо.',
      promoBadge: 'Акция',
      prevPromo: 'Назад',
      nextPromo: 'Вперёд',
      sectionPromoTitle: 'Акции',
      sectionRecommendedTitle: 'Рекомендуем',
      sectionPopularTitle: 'Хиты и топ',
      sectionCategoriesTitle: 'Категории',
      recommendedBadge: 'Топ',
      popularBadge: 'ХИТ',
      promoStripAria: 'Блюда со скидкой',
      recommendedStripAria: 'Рекомендуемые блюда',
      popularStripAria: 'Популярные блюда — листайте влево и вправо',
      categoriesStripAria: 'Категории меню — нажмите, чтобы перейти к разделу в каталоге',
      aboutTitle: 'WATTA — ВКУС БЕЗ ЛИШНЕГО ШУМА',
      aboutLead:
        'Мы не играем в «японскую кухню с доставкой» — мы про точность рецепта, свежесть и сервис, которым можно гордиться.',
      aboutBody:
        'Роллы собираем под заказ, держим дисциплину температуры для риса и соусов, а команда честно подскажет, что выбрать под ваше настроение. Это не фастфуд — это быстрая гастрономия с характером.',
      animationSlotAria: 'Место для бренд-анимации',
      heroMarquee:
        'С любовью к вкусу|Watta Sushi|Свежие роллы|Быстрая доставка|Премиум ингредиенты',
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
      readCta: "Читать",
      defaultCategoryTag: "Новости Watta",
      fallbackHint: "Пока с сервера нет записей — ниже примеры оформления. Ваши новости появятся после добавления в админ-панели.",
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
      readMore: 'Читать',
      backToBlog: 'Все статьи',
      fallbackHint: 'Пока с API нет статей — ниже примеры заметок шефа. Публикации из админ-панели заменят этот блок.',
      cardCategoryFallback: 'Блог шефа',
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
      hoursDetail: 'Ежедневно 14:00 — 21:00',
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
      faq3A:
        'Банковская карта (Visa, Mastercard) и iDEAL для Нидерландов; также наличные или терминал у курьера — в зависимости от города и настроек оформления.',
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
    privacyPage: {
      title: 'Политика конфиденциальности',
      back: 'Назад',
      updated: 'Последнее обновление: апрель 2026',
      intro:
        'Здесь описано, как Watta Sushi собирает, использует и защищает ваши персональные данные при посещении сайта, оформлении заказов и пользовании сервисом. Мы действуем в соответствии с применимым правом, включая GDPR (ЕС).',
      blocks: [
        {
          title: 'Контролёр данных',
          body: 'Ответственным за обработку персональных данных является Watta Sushi (оператор сервиса доставки). Для вопросов о конфиденциальности — раздел «Контакты» на сайте или email, указанный там.',
        },
        {
          title: 'Какие данные мы обрабатываем',
          body: 'Имя, телефон, email (при необходимости), адрес доставки или самовывоза, история заказов, технические данные (IP, тип браузера, cookie), а также сообщения через формы обратной связи.',
        },
        {
          title: 'Цели и правовые основания',
          body: 'Данные используются для приёма и выполнения заказов, связи с вами, улучшения сервиса, соблюдения юридических обязательств и, с вашего согласия, для маркетинговых сообщений (их можно отключить).',
        },
        {
          title: 'Передача третьим лицам',
          body: 'Мы можем передавать ограниченный объём данных платёжным провайдерам, службам доставки и хостинга только в объёме, необходимом для оказания услуги, на основании договоров и требований безопасности.',
        },
        {
          title: 'Хранение и безопасность',
          body: 'Данные хранятся столько, сколько нужно для целей обработки или требований закона. Применяются технические и организационные меры против несанкционированного доступа и потери.',
        },
        {
          title: 'Ваши права',
          body: 'Вы можете запросить доступ, исправление, удаление данных, ограничение обработки, перенос данных или возразить против отдельных видов обработки. Жалобы — в надзорный орган в вашей стране.',
        },
        {
          title: 'Файлы cookie',
          body: 'Сайт может использовать cookie для корзины, языка интерфейса и аналитики. Управлять cookie можно в настройках браузера.',
        },
        {
          title: 'Изменения политики',
          body: 'Мы можем обновлять эту страницу; актуальная версия всегда опубликована здесь. Продолжая пользоваться сервисом после изменений, вы подтверждаете ознакомление с обновлённой политикой.',
        },
      ],
    },
    notifications: {
      title: "Уведомления",
      empty: "Уведомлений нет",
      emptySubtext: "Мы сообщим, когда появится что-то интересное",
    },
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
      minOrder:
        'We deliver only to cities shown in the list on this page and in the header. To see if we deliver to your address and the fee, use the postcode check above. Minimum order depends on distance from our kitchen: up to 20 km — from €25; over 20 km — from €100.',
      minOrderAfterCheck:
        'After your check: minimum order for this address is €{{amount}} (distance from kitchen ≈ {{km}} km).',
      remoteHint: 'Very remote or unusual addresses — please confirm with the operator.',
      hoursTitle: 'We are open',
      hoursRange: '14:00 — 21:00',
      howTitle: 'How to order',
      stepWeb: 'On the website',
      stepApp: 'In the app',
      stepPhone: 'By phone',
      stepWebDesc: 'Menu, cart, payment and address — all in one flow, no extra steps.',
      stepAppDesc: 'The same smooth experience in the app — reorder your favourites in seconds.',
      stepPhoneDesc: 'Call us — we help with the menu, zones and delivery times.',
      kitchenMapCaption: 'Our kitchen on the map',
      conditionsKicker: 'Service',
      conditionsFeature1:
        'We only deliver to cities in our list — pick yours on this page or in the site header.',
      conditionsFeature2:
        'Use the postcode check above to see if your address is served and what delivery roughly costs.',
      conditionsFeature3:
        'Distance and minimum order are calculated automatically from our kitchen to your postcode coordinates.',
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
        'Pick your city (same as in the site header) and enter your postcode. For Amsterdam (NL) we automatically measure distance from our kitchen to that postcode: €2 per km. In other cities zones and fees are set by an administrator.',
      postalLabel: 'Postcode',
      postalPlaceholder: 'e.g. 1075 VV (Amsterdam, NL)',
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
      zonesMapHeroTitle: 'Watta Sushi delivery zone',
      zonePopupSaveHint: 'Tap a zone — the rate is saved for your cart.',
      zoneSelectedToast: 'Zone "{{zone}}": {{fee}}. Applied in cart.',
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
      postalAmsterdamOkTitle: 'Amsterdam delivery is available for this postcode',
      postalAmsterdamOkFormula: 'Distance from kitchen: {{km}} km × €2/km ≈ €{{amount}} delivery.',
      postalOutsideAmsterdam:
        'This postcode is not in Amsterdam (or is in a neighbouring municipality). Check the code or pick another city.',
      postalInvalidNlFormat: 'Dutch postcode format: four digits and two letters, e.g. 1075 VV.',
      splitHeroVideoRail: 'From our kitchen to you',
    },
    categories: { rolls: 'Rolls', sushi: 'Sushi', sets: 'Sets', soups: 'Soups', bowls: 'Bowls', snacks: 'Snacks', drinks: 'Drinks', sauces: 'Sauces' },
    hero: { title: 'Benefits of Asian Soups' },
    welcomeHero: {
      title: 'Watta Sushi',
      description:
        'Japanese cuisine with heart: fresh rolls, sushi, and signature dishes — delivered to your table. A taste you will want again.',
    },
    section: { title: 'Sushi delivered to your table', description: 'Watta Sushi offers rolls, sushi, sets, and drinks for every taste. We highly recommend trying our top menu items!' },
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
      empty: 'Your cart is empty',
      emptyCartKicker: 'Room for something delicious?',
      emptyCartHint:
        'Browse the menu, pick rolls or sushi, tap Order on a card, or open a dish page. We will have the soy sauce ready.',
      total: 'Total',
      order: 'Place order',
      processing: 'Processing…',
      proceedCheckout: 'Proceed to checkout',
      fulfillmentDelivery: 'Delivery',
      fulfillmentPickup: 'Pickup',
      pickupAtRestaurant: 'Pick up your order at:',
      pickupSubtitle: 'Pick up your order at the chosen time.',
      deliveryFree: 'Free',
      deliveryUnlockHint: 'Free delivery on orders over {{amount}} €',
      invalidPhone: 'Invalid phone format',
      cartMeta: '{{lines}} items · {{pieces}} pcs',
      perPiece: 'pc.',
      contactDetails: 'Contact details',
      deliveryTimeTitle: 'Delivery time',
      deliveryTimeHint: 'Slots are in Amsterdam time (CET/CEST). Past times are not available.',
      orderDetailsTitle: 'Extras',
      paymentMethodTitle: 'Payment method',
      promoCodeTitle: 'Promo code',
      promoPlaceholder: 'Enter code',
      promoApplied: 'Promo {{code}} applied',
      subtotalLabel: 'Subtotal',
      discountPrefix: 'Discount',
      bonusAvailableLabel: 'Use bonuses (available: {{amount}} €)',
      bonusDeductLine: 'Will deduct: {{amount}} €',
      bonusSpentLabel: 'Bonuses applied',
      calculatingDistance: 'Calculating delivery distance…',
      distanceBreakdown: 'Distance: {{km}} km × {{rate}} = {{sum}} €',
      enterAddressForDeliveryFee: 'Enter your address to calculate the delivery fee',
      privacyConsent:
        'By placing the order you agree to the processing of personal data as described in our privacy policy.',
      phonePlaceholder: '+380…, +31… or 10–15 digits',
      deliveryZoneLabel: 'Delivery zone',
      deliveryFromMap: 'Map zone: {{zone}}',
      deliveryZoneStandardHint:
        'This zone uses per-km pricing — enter your address below or check your postcode on the delivery page.',
      citiesGroupAria: 'Delivery city',
      streetPlaceholder: 'Street and house number *',
      entrancePlaceholder: 'Entrance (digits only)',
      floorPlaceholder: 'Floor (digits only)',
      apartmentPlaceholder: 'Apartment (digits only)',
      buildingPlaceholder: 'Building / block',
      optNoCallback: 'Do not call to confirm',
      optNoDoorbell: 'Do not ring the doorbell',
      slotDayLabel: 'Day',
      slotTimeLabel: 'Time',
      dayToday: 'Today',
      dayTomorrow: 'Tomorrow',
      partySizeLabel: 'Party size (1–99)',
      chopsticksLabel: 'Chopsticks',
      commentPlaceholder: 'Order notes',
      payCash: 'Cash',
      payCard: 'Card online',
      payCardHint: 'LiqPay, Apple Pay, Google Pay',
      changeFromPlaceholder: 'Change needed from (e.g. 50)',
      distanceMatrixError: 'Could not calculate distance',
      promoInvalidFallback: 'Invalid code',
      toastMaxQty: 'Maximum 99 of the same item',
      toastPromoOk: 'Promo {{code}} applied',
      toastPromoNetwork: 'Connection error',
      toastUpsellAdded: '{{name}} added with {{percent}}% off',
      toastAddressRequired: 'Please enter a delivery address',
      toastOrderFailed: 'Could not place the order.',
      upsellTitle: 'Add to your order with a discount',
      upsellLead: 'Your total is already {{threshold}} €+ — pick an offer before paying.',
      upsellOfferFallback: 'Special offer',
      upsellAddToCart: 'Add to cart',
      upsellContinue: 'Continue checkout',
      recScrollPrev: 'Scroll recommendations left',
      recScrollNext: 'Scroll recommendations right',
      addToOrder: 'Add to your order',
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
      deliveryPage: 'Delivery page',
      about: 'About',
      contacts: 'Contacts',
      admin: 'Admin Panel',
      favorites: 'Favorites',
      sidebarMore: 'More',
      footerLegal: '© {{year}} Watta Sushi. All rights reserved.',
      bottomNavAria: 'Main site navigation',
      closeNavDrawerAria: 'Close navigation menu',
      drawerExploreTitle: 'Site pages',
      drawerBrandLine: 'Delivery of the tastiest sushi',
    },
    siteFooter: {
      navAria: 'Site footer navigation',
      colNav: 'Navigation',
      colOrder: 'Place an order',
      colHours: 'Opening hours',
      colLocations: 'Our cities',
      colSocial: 'Social media',
      blog: 'Blog',
      reviews: 'Reviews',
      news: 'News',
      phone1: '+38 (067) 000 00 01',
      phone2: '+38 (066) 000 00 02',
      phone3: '+38 (093) 000 00 03',
      hoursLine: 'daily 14:00 — 21:00',
      locationsEmpty: 'Cities will appear here after you add them in the admin panel.',
      appStore: 'App Store',
      googlePlay: 'Google Play',
      support: 'Support',
      privacy: 'Privacy policy',
      paymentsAria: 'Payment methods',
      paymentsMethodsNote: 'Pay by bank card and with iDEAL in the Netherlands.',
      instagramAria: 'Instagram',
      facebookAria: 'Facebook',
      tiktokAria: 'TikTok',
    },
    productDetail: {
      loading: 'Loading…',
      notFound: 'Product not found',
      composition: 'Ingredients',
      recommendsTitle: 'Watta recommends',
      recommendsHint: 'Hand-picked dishes that pair beautifully with your order.',
      badgeTopSales: 'Top sales',
      badgeNew: 'New',
      adding: 'Adding…',
      prepTime: '30–40 min',
      weightFallback: '250 g',
      piecesFallback: '8 pcs',
      toCart: 'Add to cart',
      addedHint: 'Added to cart',
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
      hoursLine: "Daily 14:00 — 21:00",
      phoneLine: "+31 6 1234 5678",
      teamEmptyTitle: "Team portraits are coming soon",
      teamEmptyBody: "For now, meet us through the food — every roll is already shaped by our chefs.",
      marqueeWords: "Freshness|Temperature|Taste|Team|Amsterdam|Rolls|Sushi|Delivery|Quality",
      darkHeroSubtitle: "Premium delivery of Japanese cuisine",
      darkFoundedLabel: "Founded in",
      darkFoundedYearCity: "2025 in Amsterdam",
      darkMilestoneLine1: "Today",
      darkMilestoneLine2: "we grow our service across the Netherlands",
      philosophyTitlePart1: "Watta",
      philosophyTitlePart2: "philosophy",
      slide1Title: "Truly generous portions",
      slide1Body: "Our rolls pack filling into every bite — we weigh and balance on the line.",
      slide2Title: "Always fresh ingredients",
      slide2Body: "Daily supply, quality checks, and a cold chain to your door.",
      slide3Title: "A wide menu",
      slide3Body: "Classic, vegan, and signature recipes — something for every mood.",
      slide4Title: "A handy app",
      slide4Body: "iOS and Android — order in a few taps, history and live delivery status.",
      slide5Title: "Lifestyle #wattafam",
      slide5Body: "Menu drops, collabs, and kitchen stories — on social and in the app.",
      slide6Title: "Fast delivery",
      slide6Body: "Couriers know the routes — food arrives warm and neatly packed.",
      artHeadlineLine1: "Watta doesn’t just make rolls,",
      artHeadlineLine2: "we craft",
      artHeadlineAccent: "ART",
      insideSectionTitle: "What’s inside a roll?",
      inside1Title: "Fresh seafood",
      inside1Body: "Salmon, tuna, and more from trusted suppliers.",
      inside2Title: "Premium rice",
      inside2Body: "Proper cook and vinegar balance — the backbone of every roll.",
      inside3Title: "Avocado & veg",
      inside3Body: "Ripe produce, creamy texture, and crunch in our house recipes.",
      inside4Title: "Nori & sauces",
      inside4Body: "Quality seaweed and house-made sauces — never overly salty.",
      inside5Title: "Cheese & cream cheese",
      inside5Body: "Philadelphia-style notes for classic and signature combos.",
      inside6Title: "Sesame & garnish",
      inside6Body: "Toasted sesame, microgreens, and finishing touches before dispatch.",
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
      catalogOnCategoryPageHint:
        'Dishes open on a separate page — pick a type in the grid below or in the category bar.',
      categoryPageBack: 'Home',
      categoryPageEmpty: 'No dishes in this category yet.',
      categoryPageOpenCart: 'Cart',
      fullMenuTitle: 'Full menu',
      fullMenuSub: 'All categories and dishes on one page. Pick a category in the bar above — we scroll to that section.',
      fullMenuWant: 'Order',
      fullMenuCategoriesAria: 'Menu categories',
      fullMenuLoading: 'Loading menu…',
      fullMenuEmpty: 'No dishes in the catalog yet.',
      fullMenuAllTab: 'All',
      categoryRailAria: 'horizontal dish row — swipe left or right; tap a card to open the dish',
      heroBannerOverlayTitle: 'Spend time with us',
      heroBannerOverlaySub: 'Fresh rolls, good company, and flavours worth sharing.',
      heroBannerSmsSender: 'Watta Sushi',
      heroBannerSmsBadge: 'SMS',
      heroBannerSmsTime: 'now',
    },
    cinematicFooter: {
      readyTitle: 'Ready to order?',
      ctaBanners: 'Banners & offers',
      ctaMenu: 'Open menu',
      ctaCatalog: 'Full catalog',
      ctaOffers: 'Offers',
      promoCarouselAria: 'Swipe or use arrows to browse offers',
      promoPickHint:
        'Below — recommended dishes and special offers from the menu. Swipe the rows left and right; tap a card to open the dish.',
      promoBadge: 'Offer',
      prevPromo: 'Previous',
      nextPromo: 'Next',
      sectionPromoTitle: 'On offer',
      sectionRecommendedTitle: 'Recommended',
      sectionPopularTitle: 'Hits & top picks',
      sectionCategoriesTitle: 'Categories',
      recommendedBadge: 'Top pick',
      popularBadge: 'HIT',
      promoStripAria: 'Discounted dishes',
      recommendedStripAria: 'Recommended dishes',
      popularStripAria: 'Popular dishes — swipe left and right',
      categoriesStripAria: 'Menu categories — tap to jump to that section in the catalog',
      aboutTitle: 'WATTA — FLAVOUR WITHOUT THE NOISE',
      aboutLead:
        'We are not playing “Japanese food to your door” — we care about recipe precision, freshness, and service you can brag about.',
      aboutBody:
        'Rolls are built to order; we keep rice and sauces on a tight temperature routine, and the team will honestly steer you to what fits your mood. Not fast food — fast gastronomy with attitude.',
      animationSlotAria: 'Brand animation area',
      heroMarquee:
        'With love for taste|Watta Sushi|Fresh rolls|Fast delivery|Premium ingredients',
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
      readCta: "Read",
      defaultCategoryTag: "Watta news",
      fallbackHint: "No items from the server yet — below is sample layout. Your stories will show here once added in the admin panel.",
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
      readMore: 'Read',
      backToBlog: 'All articles',
      fallbackHint: 'No articles from the API yet — sample chef notes below. Admin posts will replace this block.',
      cardCategoryFallback: "Chef's notes",
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
      hoursDetail: 'Daily 14:00 — 21:00',
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
      faq3A:
        'Bank card (Visa, Mastercard) and iDEAL in the Netherlands; cash or courier card terminal may also be available depending on your city and checkout.',
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
    privacyPage: {
      title: 'Privacy policy',
      back: 'Back',
      updated: 'Last updated: April 2026',
      intro:
        'This page explains how Watta Sushi collects, uses, and protects your personal data when you visit our website, place orders, and use our services. We follow applicable law, including the GDPR (EU).',
      blocks: [
        {
          title: 'Data controller',
          body: 'Watta Sushi (delivery service operator) is responsible for processing your personal data. For privacy questions, use the Contacts section on the website or the email listed there.',
        },
        {
          title: 'Data we process',
          body: 'Name, phone, email (where needed), delivery or pickup address, order history, technical data (IP, browser type, cookies), and messages you send via contact forms.',
        },
        {
          title: 'Purposes and legal bases',
          body: 'We use data to take and fulfil orders, communicate with you, improve our service, meet legal obligations, and—with your consent—for marketing (which you can opt out of).',
        },
        {
          title: 'Sharing with third parties',
          body: 'We may share limited data with payment providers, delivery partners, and hosting services only as needed to provide the service, under contracts and security requirements.',
        },
        {
          title: 'Retention and security',
          body: 'We keep data only as long as needed for the purposes above or as required by law. We apply technical and organisational measures to protect against unauthorised access and loss.',
        },
        {
          title: 'Your rights',
          body: 'You may request access, correction, erasure, restriction of processing, data portability, or object to certain processing. You may lodge a complaint with a supervisory authority in your country.',
        },
        {
          title: 'Cookies',
          body: 'The site may use cookies for the cart, interface language, and analytics. You can manage cookies in your browser settings.',
        },
        {
          title: 'Changes',
          body: 'We may update this page; the current version is always published here. Continued use of the service after changes means you acknowledge the updated policy.',
        },
      ],
    },
    notifications: {
      title: "Notifications",
      empty: "No notifications yet",
      emptySubtext: "We’ll let you know when something interesting shows up",
    },
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
      minOrder:
        'We leveren alleen naar steden in de lijst op deze pagina en in de header. Of we bij jou bezorgen en wat het kost, zie je via de postcodecheck hierboven. Het minimumbedrag hangt af van de afstand tot onze keuken: tot 20 km — vanaf €25; boven 20 km — vanaf €100.',
      minOrderAfterCheck:
        'Na jouw check: minimumbestelling voor dit adres is €{{amount}} (afstand vanaf keuken ≈ {{km}} km).',
      remoteHint: 'Zeer ver of bijzondere adressen — graag even overleg met de operator.',
      hoursTitle: 'We zijn bereikbaar',
      hoursRange: '14:00 — 21:00',
      howTitle: 'Hoe bestellen',
      stepWeb: 'Op de site',
      stepApp: 'In de app',
      stepPhone: 'Per telefoon',
      stepWebDesc: 'Menu, winkelwagen, betaling en adres — alles in één flow.',
      stepAppDesc: 'Dezelfde fijne ervaring in de app — favorieten snel opnieuw bestellen.',
      stepPhoneDesc: 'Bel ons — we helpen met menu, zones en bezorgtijden.',
      kitchenMapCaption: 'Onze keuken op de kaart',
      conditionsKicker: 'Service',
      conditionsFeature1:
        'We bezorgen alleen naar steden in onze lijst — kies je stad op deze pagina of in de header.',
      conditionsFeature2:
        'Met de postcodecheck hierboven zie je of je adres binnen de zone valt en wat de bezorging ongeveer kost.',
      conditionsFeature3:
        'Afstand en minimumbedrag worden automatisch berekend vanaf onze keuken tot de coördinaten van je postcode.',
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
        'Kies je stad (zoals in de header) en vul je postcode in. Voor Amsterdam (NL) berekenen we automatisch de afstand vanaf onze keuken: €2 per km. In andere steden stelt de beheerder zones en tarieven in.',
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
      zonesMapHeroTitle: 'Bezorgzone Watta Sushi',
      zonePopupSaveHint: 'Tik op een zone — het tarief wordt opgeslagen voor je winkelwagen.',
      zoneSelectedToast: 'Zone «{{zone}}»: {{fee}}. Toegepast in winkelwagen.',
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
      postalAmsterdamOkTitle: 'Bezorging in Amsterdam is mogelijk voor deze postcode',
      postalAmsterdamOkFormula: 'Afstand vanaf de keuken: {{km}} km × €2/km ≈ €{{amount}} bezorgkosten.',
      postalOutsideAmsterdam:
        'Deze postcode hoort niet bij Amsterdam (of staat in een andere gemeente). Controleer de postcode of kies een andere stad.',
      postalInvalidNlFormat: 'Nederlands postcodeformaat: vier cijfers en twee letters, bijv. 1075 VV.',
      splitHeroVideoRail: 'Van onze keuken tot bij u',
    },
    categories: { rolls: 'Rollen', sushi: 'Sushi', sets: 'Sets', soups: 'Soepen', bowls: 'Bowls', snacks: 'Snacks', drinks: 'Dranken', sauces: 'Sauzen' },
    hero: { title: 'Voordelen van Aziatische soepen' },
    welcomeHero: {
      title: 'Watta Sushi',
      description:
        'Japanse keuken met hart: verse rolls, sushi en signature-gerechten — bij je thuisbezorgd. Een smaak om op terug te komen.',
    },
    section: { title: 'Sushibezorging aan huis', description: 'Watta Sushi biedt rollen, sushi, sets en drankjes voor elke smaak. We raden ten zeerste aan om onze topmenu-items te proberen!' },
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
      empty: 'Je winkelwagen is leeg',
      emptyCartKicker: 'Zin in iets lekkers?',
      emptyCartHint:
        'Ga naar het menu, kies rolls of sushi, tik op Bestellen op een kaart of voeg een gerecht toe op de productpagina. Sojasaus staat klaar.',
      total: 'Totaal',
      order: 'Bestelling plaatsen',
      processing: 'Bezig…',
      proceedCheckout: 'Naar afrekenen',
      fulfillmentDelivery: 'Bezorging',
      fulfillmentPickup: 'Afhalen',
      pickupAtRestaurant: 'Haal je bestelling op bij:',
      pickupSubtitle: 'Haal je bestelling op op het gekozen tijdstip.',
      deliveryFree: 'Gratis',
      deliveryUnlockHint: 'Gratis bezorging vanaf {{amount}} €',
      invalidPhone: 'Ongeldig telefoonnummer',
      cartMeta: '{{lines}} pos. · {{pieces}} st.',
      perPiece: 'st.',
      contactDetails: 'Contactgegevens',
      deliveryTimeTitle: 'Bezorgtijd',
      deliveryTimeHint: 'Tijdsloten volgens Amsterdam (CET/CEST). Verstreken tijden zijn niet beschikbaar.',
      orderDetailsTitle: 'Details',
      paymentMethodTitle: 'Betaalwijze',
      promoCodeTitle: 'Promocode',
      promoPlaceholder: 'Code invoeren',
      promoApplied: 'Promocode {{code}} toegepast',
      subtotalLabel: 'Subtotaal',
      discountPrefix: 'Korting',
      bonusAvailableLabel: 'Bonussen gebruiken (beschikbaar: {{amount}} €)',
      bonusDeductLine: 'Wordt afgetrokken: {{amount}} €',
      bonusSpentLabel: 'Bonussen verrekend',
      calculatingDistance: 'Bezorgafstand berekenen…',
      distanceBreakdown: 'Afstand: {{km}} km × {{rate}} = {{sum}} €',
      enterAddressForDeliveryFee: 'Vul je adres in om de bezorgkosten te berekenen',
      privacyConsent:
        'Door te bestellen ga je akkoord met de verwerking van persoonsgegevens zoals in ons privacybeleid.',
      phonePlaceholder: '+380…, +31… of 10–15 cijfers',
      deliveryZoneLabel: 'Bezorgzone',
      deliveryFromMap: 'Zone op kaart: {{zone}}',
      deliveryZoneStandardHint:
        'Voor deze zone geldt tarief per km — vul je adres in of controleer je postcode op de bezorgpagina.',
      citiesGroupAria: 'Bezorgstad',
      streetPlaceholder: 'Straat en huisnummer *',
      entrancePlaceholder: 'Ingang (alleen cijfers)',
      floorPlaceholder: 'Verdieping (alleen cijfers)',
      apartmentPlaceholder: 'Appartement (alleen cijfers)',
      buildingPlaceholder: 'Gebouw / blok',
      optNoCallback: 'Niet terugbellen ter bevestiging',
      optNoDoorbell: 'Niet aanbellen',
      slotDayLabel: 'Dag',
      slotTimeLabel: 'Tijd',
      dayToday: 'Vandaag',
      dayTomorrow: 'Morgen',
      partySizeLabel: 'Aantal personen (1–99)',
      chopsticksLabel: 'Eetstokjes',
      commentPlaceholder: 'Opmerking bij bestelling',
      payCash: 'Contant',
      payCard: 'Online kaart',
      payCardHint: 'LiqPay, Apple Pay, Google Pay',
      changeFromPlaceholder: 'Wisselgeld van welk bedrag? (bijv. 50)',
      distanceMatrixError: 'Kon de afstand niet berekenen',
      promoInvalidFallback: 'Ongeldige code',
      toastMaxQty: 'Maximaal 99 stuks van hetzelfde product',
      toastPromoOk: 'Promocode {{code}} toegepast',
      toastPromoNetwork: 'Verbindingsfout',
      toastUpsellAdded: '{{name}} toegevoegd met {{percent}}% korting',
      toastAddressRequired: 'Vul je bezorgadres in',
      toastOrderFailed: 'Bestelling plaatsen mislukt.',
      upsellTitle: 'Voeg met korting toe aan je bestelling',
      upsellLead: 'Je bedrag is al vanaf {{threshold}} € — kies een aanbieding vóór betaling.',
      upsellOfferFallback: 'Speciale aanbieding',
      upsellAddToCart: 'In winkelwagen',
      upsellContinue: 'Verder met afrekenen',
      recScrollPrev: 'Aanbevelingen naar links scrollen',
      recScrollNext: 'Aanbevelingen naar rechts scrollen',
      addToOrder: 'Voeg toe aan je bestelling',
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
      deliveryPage: 'Bezorgpagina',
      about: 'Over ons',
      contacts: 'Contacten',
      admin: 'Admin Paneel',
      favorites: 'Favorieten',
      sidebarMore: 'Meer',
      footerLegal: '© {{year}} Watta Sushi. Alle rechten voorbehouden.',
      bottomNavAria: 'Hoofdnavigatie',
      closeNavDrawerAria: 'Navigatiemenu sluiten',
      drawerExploreTitle: 'Pagina’s',
      drawerBrandLine: 'Bezorging van de lekkerste sushi',
    },
    siteFooter: {
      navAria: 'Voeternavigatie',
      colNav: 'Navigatie',
      colOrder: 'Bestellen',
      colHours: 'Openingstijden',
      colLocations: 'Onze steden',
      colSocial: 'Social media',
      blog: 'Blog',
      reviews: 'Reviews',
      news: 'Nieuws',
      phone1: '+38 (067) 000 00 01',
      phone2: '+38 (066) 000 00 02',
      phone3: '+38 (093) 000 00 03',
      hoursLine: 'dagelijks 14:00 — 21:00',
      locationsEmpty: 'Steden verschijnen hier na toevoegen in het beheerpaneel.',
      appStore: 'App Store',
      googlePlay: 'Google Play',
      support: 'Support',
      privacy: 'Privacybeleid',
      paymentsAria: 'Betaalmethoden',
      paymentsMethodsNote: 'Betalen met pinpas/bankkaart en iDEAL (Nederland).',
      instagramAria: 'Instagram',
      facebookAria: 'Facebook',
      tiktokAria: 'TikTok',
    },
    productDetail: {
      loading: 'Laden…',
      notFound: 'Product niet gevonden',
      composition: 'Samenstelling',
      recommendsTitle: 'Watta raadt aan',
      recommendsHint: 'Onze favorieten die perfect bij je bestelling passen.',
      badgeTopSales: 'Topverkoop',
      badgeNew: 'Nieuw',
      adding: 'Toevoegen…',
      prepTime: '30–40 min',
      weightFallback: '250 g',
      piecesFallback: '8 st.',
      toCart: 'In winkelwagen',
      addedHint: 'Toegevoegd',
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
      hoursLine: "Dagelijks 14:00 — 21:00",
      phoneLine: "+31 6 1234 5678",
      teamEmptyTitle: "Teamfoto’s volgen binnenkort",
      teamEmptyBody: "Ontmoet ons nu via het eten — elke rol is al gevormd door onze chefs.",
      marqueeWords: "Versheid|Temperatuur|Smaak|Team|Amsterdam|Rollen|Sushi|Bezorging|Kwaliteit",
      darkHeroSubtitle: "Premium bezorging van Japanse gerechten",
      darkFoundedLabel: "Opgericht in",
      darkFoundedYearCity: "2025 in Amsterdam",
      darkMilestoneLine1: "Vandaag",
      darkMilestoneLine2: "breiden we onze service in heel Nederland uit",
      philosophyTitlePart1: "Watta",
      philosophyTitlePart2: "filosofie",
      slide1Title: "Echt royale porties",
      slide1Body: "Onze rollen zitten vol vulling — we wegen en balanceren op de lijn.",
      slide2Title: "Altijd verse ingrediënten",
      slide2Body: "Dagelijkse levering, kwaliteitscontroles en een koude keten tot aan je deur.",
      slide3Title: "Een breed menu",
      slide3Body: "Klassiek, vegan en signature — voor elke stemming iets lekkers.",
      slide4Title: "Handige app",
      slide4Body: "iOS en Android — bestellen in een paar tikken, historie en live bezorgstatus.",
      slide5Title: "Lifestyle #wattafam",
      slide5Body: "Menulanceringen, collabs en keukenverhalen — op social en in de app.",
      slide6Title: "Snelle bezorging",
      slide6Body: "Bezorgers kennen de routes — eten komt warm en netjes verpakt aan.",
      artHeadlineLine1: "Watta maakt niet alleen rollen,",
      artHeadlineLine2: "we creëren",
      artHeadlineAccent: "KUNST",
      insideSectionTitle: "Wat zit er in een rol?",
      inside1Title: "Verse zeevruchten",
      inside1Body: "Zalm, tonijn en meer van betrouwbare leveranciers.",
      inside2Title: "Premium rijst",
      inside2Body: "Juiste gaarheid en azijnbalans — de basis van elke rol.",
      inside3Title: "Avocado & groente",
      inside3Body: "Rijpe groente, romige textuur en bite in onze huisrecepten.",
      inside4Title: "Nori & sauzen",
      inside4Body: "Kwaliteitszeewier en huisgemaakte sauzen — nooit te zout.",
      inside5Title: "Kaas & roomkaas",
      inside5Body: "Philadelphia-achtige noten voor klassieke en signature combinaties.",
      inside6Title: "Sesam & garnering",
      inside6Body: "Geroosterde sesam, microgroen en finishing touches voor verzending.",
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
      catalogOnCategoryPageHint:
        'Gerechten van de categorie openen op een aparte pagina — kies een type in het raster hieronder of in de categoriebalk.',
      categoryPageBack: 'Naar home',
      categoryPageEmpty: 'Nog geen gerechten in deze categorie.',
      categoryPageOpenCart: 'Winkelwagen',
      fullMenuTitle: 'Volledig menu',
      fullMenuSub: 'Alle categorieën en gerechten op één pagina. Kies een categorie in de balk hierboven — we scrollen naar dat blok.',
      fullMenuWant: 'Bestellen',
      fullMenuCategoriesAria: 'Menucategorieën',
      fullMenuLoading: 'Menu laden…',
      fullMenuEmpty: 'Nog geen gerechten in de catalogus.',
      fullMenuAllTab: 'Alles',
      categoryRailAria: 'horizontale rij met gerechten — veeg links en rechts; tik op een kaart om het gerecht te openen',
      heroBannerOverlayTitle: 'Breng tijd met ons door',
      heroBannerOverlaySub: 'Verse rolls, gezelschap en smaken om te delen.',
      heroBannerSmsSender: 'Watta Sushi',
      heroBannerSmsBadge: 'SMS',
      heroBannerSmsTime: 'zojuist',
    },
    cinematicFooter: {
      readyTitle: 'Klaar om te bestellen?',
      ctaBanners: 'Naar banners & acties',
      ctaMenu: 'Menu openen',
      ctaCatalog: 'Volledige catalogus',
      ctaOffers: 'Aanbiedingen',
      promoCarouselAria: 'Veeg of gebruik pijlen voor acties',
      promoPickHint:
        'Hieronder — aanbevolen gerechten en acties uit het menu. Veeg de rijen naar links en rechts; tik op een kaart om het gerecht te openen.',
      promoBadge: 'Actie',
      prevPromo: 'Vorige',
      nextPromo: 'Volgende',
      sectionPromoTitle: 'Acties',
      sectionRecommendedTitle: 'Aanbevolen',
      sectionPopularTitle: 'Hits & topkeuzes',
      sectionCategoriesTitle: 'Categorieën',
      recommendedBadge: 'Top',
      popularBadge: 'HIT',
      promoStripAria: 'Gerechten met korting',
      recommendedStripAria: 'Aanbevolen gerechten',
      popularStripAria: 'Populaire gerechten — veeg links en rechts',
      categoriesStripAria: 'Menucategorieën — tik om naar dat deel van de catalogus te gaan',
      aboutTitle: 'WATTA — SMAAK ZONDER RUIS',
      aboutLead:
        'We doen niet alsof we “Japanse keuken aan huis” zijn — we gaan voor precisie in het recept, versheid en service om trots op te zijn.',
      aboutBody:
        'Rolls worden op bestelling gemaakt; rijst en sauzen houden we strak op temperatuur en het team helpt eerlijk kiezen wat bij je stemming past. Geen fastfood — wel snelle gastronomie met karakter.',
      animationSlotAria: 'Ruimte voor merk-animatie',
      heroMarquee:
        'Met liefde voor smaak|Watta Sushi|Verse rolls|Snelle bezorging|Premium ingrediënten',
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
      readCta: "Lezen",
      defaultCategoryTag: "Watta-nieuws",
      fallbackHint: "Nog geen items van de server — hieronder voorbeelden. Jouw berichten verschijnen hier na toevoegen in het adminpaneel.",
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
      readMore: 'Lezen',
      backToBlog: 'Alle artikelen',
      fallbackHint: 'Nog geen artikelen van de API — hieronder voorbeelden. Berichten uit het adminpaneel vervangen dit blok.',
      cardCategoryFallback: 'Blog van de chef',
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
      hoursDetail: 'Dagelijks 14:00 — 21:00',
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
      faq3A:
        'Bankpas/bankkaart (Visa, Mastercard) en iDEAL; eventueel contant of pin bij de bezorger — afhankelijk van stad en checkout.',
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
    privacyPage: {
      title: 'Privacybeleid',
      back: 'Terug',
      updated: 'Laatst bijgewerkt: april 2026',
      intro:
        'Deze pagina legt uit hoe Watta Sushi uw persoonsgegevens verzamelt, gebruikt en beschermt wanneer u de website bezoekt, bestelt en onze diensten gebruikt. Wij handelen in overeenstemming met toepasselijk recht, waaronder de AVG (EU).',
      blocks: [
        {
          title: 'Verwerkingsverantwoordelijke',
          body: 'Watta Sushi (exploitant van de bezorgdienst) is verantwoordelijk voor de verwerking van persoonsgegevens. Voor privacyvragen: het contactgedeelte op de site of het daar vermelde e-mailadres.',
        },
        {
          title: 'Welke gegevens verwerken we',
          body: 'Naam, telefoon, e-mail (indien nodig), bezorg- of afhaaladres, bestelgeschiedenis, technische gegevens (IP, browsertype, cookies) en berichten via contactformulieren.',
        },
        {
          title: 'Doelen en grondslagen',
          body: 'Gegevens worden gebruikt om bestellingen aan te nemen en uit te voeren, met u te communiceren, de dienst te verbeteren, wettelijke verplichtingen na te komen en, met uw toestemming, voor marketing (afmeldbaar).',
        },
        {
          title: 'Delen met derden',
          body: 'Beperkte gegevens kunnen worden gedeeld met betaalproviders, bezorgpartners en hosting alleen voor zover nodig voor de dienstverlening, op basis van contracten en beveiligingseisen.',
        },
        {
          title: 'Bewaring en beveiliging',
          body: 'Gegevens worden bewaard zolang nodig voor de doeleinden of wettelijk verplicht. We passen technische en organisatorische maatregelen toe tegen ongeoorloofde toegang en verlies.',
        },
        {
          title: 'Uw rechten',
          body: 'U kunt inzage, correctie, verwijdering, beperking van verwerking, gegevensoverdraagbaarheid of bezwaar vragen. Klachten kunnen bij de toezichthouder in uw land.',
        },
        {
          title: 'Cookies',
          body: 'De site kan cookies gebruiken voor winkelwagen, taal en analytics. Beheer via uw browserinstellingen.',
        },
        {
          title: 'Wijzigingen',
          body: 'We kunnen deze pagina bijwerken; de actuele versie staat hier. Blijft u de dienst gebruiken na wijzigingen, dan erkent u het bijgewerkte beleid.',
        },
      ],
    },
    notifications: {
      title: "Meldingen",
      empty: "Nog geen meldingen",
      emptySubtext: "We laten het weten zodra er iets interessants is",
    },
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