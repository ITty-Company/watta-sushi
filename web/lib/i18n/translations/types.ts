/** Generated types for site translations — edit LanguageContext or re-run extract script. */
export interface SiteTranslations {
  common: {
    brandName: string
    brandShort: string
  }
  /** Доступність: кнопки, карусель, медіа (не плутати з брендом) */
  siteAria: {
    phone: string
    favorites: string
    cart: string
    profile: string
    menu: string
    close: string
    scrollLeft: string
    scrollRight: string
    heroVideo: string
    map: string
    previousSlide: string
    nextSlide: string
    remove: string
    removeLine: string
    loading: string
    profileNav: string
  }
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
    language: string
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
    statCardColdValue: string
    statCardColdLabel: string
    statCardOrderValue: string
    statCardOrderLabel: string
    statCardPriceValue: string
    statCardPriceLabel: string
    statCardChannelsValue: string
    statCardChannelsLabel: string
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
    /** NL / кроковий тариф: успішна перевірка адреси */
    postalAmsterdamOkTitle: string
    postalAmsterdamOkFormula: string
    /** Великий акцент: сума доставки, плейсхолдер {{amount}} */
    postalDeliveryFeeTitle: string
    /** Час у дорозі, плейсхолдер {{minutes}} */
    postalRouteDuration: string
    /** Пояснення крокового тарифу: {{stepKm}}, {{stepEur}} */
    postalTariffExplain: string
    /** Адреса не в Амстердамі */
    postalOutsideAmsterdam: string
    /** Адреса поза Нідерландами */
    postalOutsideNetherlands: string
    /** Доставка недоступна в обраному місті — заголовок */
    deliveryUnavailableTitle: string
    /** Доставка недоступна — пояснення + Instagram */
    deliveryUnavailableBody: string
    deliveryUnavailableInstagram: string
    /** Заголовок блоку міст, куди возимо */
    deliveryNearbyCitiesTitle: string
    /** Підказка: натисніть місто на карті */
    deliveryNearbyCitiesHint: string
    /** Підпис маркера адреси клієнта на карті */
    deliveryYourAddressPin: string
    /** aria-label карти міст доставки */
    deliveryNearbyMapAria: string
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
    /** Заголовок бічної панелі кошика */
    drawerTitle: string
    /** aria-label кнопки закриття панелі кошика */
    closeDrawerAria: string
    empty: string
    /** Малий акцент над заголовком порожнього кошика */
    emptyCartKicker: string
    /** Підказка під порожнім кошиком */
    emptyCartHint: string
    total: string
    /** Підпис суми в футері бічного кошика (як «Разом») */
    totalTogether: string
    /** Попередження про мінімальну суму в кошику ({{amount}}) */
    drawerMinOrderWarning: string
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
    /** Плаваюча кнопка кошика внизу ({{pieces}}, {{total}}) */
    mobileBarSummary: string
    /** Ліва частина смуги: кількість ({{pieces}}) */
    mobileBarSummaryLead: string
    /** Ліва частина смуги: сума жирним ({{total}}) */
    mobileBarSummaryAmount: string
    /** Короткий CTA на плаваючій кнопці кошика */
    mobileCheckoutShort: string
    /** CTA при оплаті готівкою — оплата при отриманні */
    checkoutSubmitCash: string
    /** Підказка над нижньою кнопкою при готівці */
    payCashStickyNote: string
    /** Підпис «за штуку» біля ціни позиції */
    perPiece: string
    contactDetails: string
    deliveryTimeTitle: string
    /** Підказка під заголовком часу доставки (часовий пояс Амстердама) */
    deliveryTimeHint: string
    /** Заголовок слота для самовивозу (коментар і UI) */
    pickupTimeTitle: string
    slotDayLabelPickup: string
    slotTimeLabelPickup: string
    orderDetailsTitle: string
    paymentMethodTitle: string
    promoCodeTitle: string
    /** «необов'язково» біля промокоду */
    promoCodeOptionalHint: string
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
    dataProcessingConsentPrefix: string
    privacyPolicyLink: string
    dataProcessingConsentAnd: string
    publicOfferLink: string
    dataProcessingConsentRequired: string
    namePlaceholder: string
    phonePlaceholder: string
    phoneHint: string
    deliveryZoneLabel: string
    /** Рядок у підсумку: обрана зона з карти, {{zone}} */
    deliveryFromMap: string
    /** Зона «стандарт» — потрібна адреса для розрахунку км */
    deliveryZoneStandardHint: string
    citiesGroupAria: string
    streetPlaceholder: string
    postalCodePlaceholder: string
    savedAddressesLabel: string
    newAddressLabel: string
    savedAddressesAria: string
    enterStreetAndPostalForDeliveryFee: string
    toastPostalCodeRequired: string
    toastDeliveryFeeRequired: string
    toastDeliveryOutsideArea: string
    deliveryFeeFromKitchen: string
    /** Заголовок необов'язкових полів під'їзд / поверх / квартира */
    addressDetailsOptionalLabel: string
    addressDetailsOptionalHint: string
    entrancePlaceholder: string
    floorPlaceholder: string
    apartmentPlaceholder: string
    buildingPlaceholder: string
    intercomPlaceholder: string
    /** Мітки в рядку адреси замовлення ({{value}}) */
    addrDetailBuilding: string
    addrDetailEntrance: string
    addrDetailFloor: string
    addrDetailApartment: string
    addrDetailIntercom: string
    /** Фрагменти коментаря до замовлення для кухні */
    orderCommentChangeFrom: string
    /** Готівка — вся сума при отриманні */
    orderCommentCashFull: string
    orderCommentSticks: string
    orderCommentNoCallback: string
    orderCommentNoDoorbell: string
    /** {{code}}, {{discount}} — у коментарі замовлення для кухні */
    orderCommentPromo: string
    optNoCallback: string
    optNoDoorbell: string
    slotDayLabel: string
    slotTimeLabel: string
    slotAsap: string
    slotNoTimes: string
    slotPickDateHint: string
    /** Кнопка вибору дати в календарі */
    pickDeliveryDateLabel: string
    dayToday: string
    dayTomorrow: string
    partySizeLabel: string
    chopsticksLabel: string
    /** Набори соус + wasabi + імбир */
    condimentSetsLabel: string
    /** {{free}}, {{price}} */
    condimentSetsHint: string
    /** {{count}}, {{fee}} — рядок у підсумку */
    condimentSetsExtraLine: string
    orderCommentCondimentSets: string
    commentPlaceholder: string
    payCash: string
    /** Підпис під «Готівкою» */
    payCashHint: string
    /** Пояснення: вся сума готівкою при отриманні */
    payCashFullHint: string
    /** Заголовок поля решти */
    cashChangeLabel: string
    /** Не часткова оплата — лише купюра для решти */
    cashChangeHint: string
    /** {{change}} — сума решти */
    cashChangePreview: string
    payCard: string
    payCardHint: string
    payCardUnavailable: string
    /** Увімкнено в адмінці, але немає STRIPE_SECRET_KEY на сервері */
    payCardSetupRequired: string
    /** Кнопка внизу checkout (мобілка) */
    mobileCheckoutSubmit: string
    changeFromPlaceholder: string
    toastCashChangeTooLow: string
    distanceMatrixError: string
    promoInvalidFallback: string
    toastMaxQty: string
    /** Пам’ять браузера для кошика вичерпана */
    toastStorageQuota: string
    /** {{code}} */
    toastPromoOk: string
    toastPromoNetwork: string
    /** {{name}}, {{percent}} */
    toastUpsellAdded: string
    /** {{name}}, {{discount}} */
    toastUpsellAddedEur: string
    /** {{range}}, {{discount}} */
    cartUpsellOffersHint: string
    cartUpsellOffersTitle: string
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
    checkoutTitle: string
    checkoutProfileHint: string
    checkoutLoginHint: string
    /** Гість: кошик локально, вхід лише для замовлення */
    checkoutGuestHint: string
    /** Кнопка оформлення для гостя */
    checkoutOrderLogin: string
    checkoutLoginLink: string
    checkoutTrustDelivery: string
    checkoutTrustTiming: string
    checkoutTrustPayment: string
    yourOrderTitle: string
    kitchenClosed: {
      title: string
      /** {{hours}} — діапазон роботи кухні, напр. 14:00 – 21:00 */
      body: string
      preorderCta: string
      closeAria: string
      preorderToast: string
    }
    checkoutSuccessTitle: string
    checkoutSuccessSubtitle: string
    checkoutSuccessFirstTitle: string
    checkoutSuccessFirstSubtitle: string
    checkoutSuccessNotifyHint: string
    checkoutSuccessSmsAccepted: string
    checkoutSuccessNotifyCta: string
    checkoutSubmitShort: string
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
    /** Заголовок блоку вибору міста в правому drawer (мобільна навігація) */
    drawerLocationTitle: string
    /** Заголовок блоку мови інтерфейсу в drawer / бічному меню */
    drawerLanguageTitle: string
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
    hoursLine: string
    /** Якщо з API ще немає міст */
    locationsEmpty: string
    appStore: string
    googlePlay: string
    support: string
    privacy: string
    publicOffer: string
    paymentsAria: string
    /** Підпис під бейджами Visa / Mastercard / iDEAL */
    paymentsMethodsNote: string
    instagramAria: string
    tiktokAria: string
    telegramAria: string
    emailAria: string
  }
  /** Сторінка товару /product/[id] */
  productDetail: {
    loading: string
    notFound: string
    composition: string
    recommendsTitle: string
    recommendsHint: string
    /** Кнопка в кінці стрічки рекомендацій — перехід у меню */
    recommendsMenuCta: string
    badgeTopSales: string
    badgeNew: string
    breadcrumbAria: string
    breadcrumbHome: string
    adding: string
    prepTime: string
    weightFallback: string
    piecesFallback: string
    toCart: string
    addedHint: string
    /** Галерея фото на сторінці товару */
    galleryPrev: string
    galleryNext: string
    /** Підпис «{n} з {m}» для крапок / лічильника */
    galleryProgress: string
    galleryOpen: string
    galleryClose: string
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
    /** Мобільна стрічка / note над формою */
    promoStrip: string
    /** Десктоп: заголовок у лівій колонці */
    desktopHeroTitle: string
    /** Десктоп: підзаголовок */
    desktopHeroSub: string
    /** Другий телефон на вході */
    desktopHero2Title: string
    desktopHero2Sub: string
    /** Орбітальні чипи на cinema-панелі */
    benefitHistory: string
    benefitBonuses: string
    benefitFast: string
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
    /** Toasts / одноразові повідомлення входу */
    passwordMismatch: string
    phoneLost: string
    welcomeAfterVerify: string
    wrongVerificationCode: string
    signedInToast: string
    forgotPassword: string
    forgotPasswordTitle: string
    forgotPasswordEmailHint: string
    forgotPasswordCodeHint: string
    forgotPasswordNewHint: string
    forgotPasswordSendCode: string
    forgotPasswordContinue: string
    forgotPasswordSave: string
    forgotPasswordSuccess: string
    forgotPasswordResend: string
    forgotCodeSent: string
    forgotCodeResent: string
    verifyTitle: string
    verifyHint: string
    confirmPhone: string
    confirmPasswordLabel: string
    /** Збережені на пристрої акаунти (лише email + пароль) */
    savedAccountsLabel: string
    removeSavedAccount: string
    phoneAccountsLimit: string
    ninjaLoginTitle: string
    ninjaLoginPhoneHint: string
    ninjaLoginByPhone: string
    ninjaLoginContextCart: string
    ninjaLoginContextProfile: string
    ninjaLoginContextFavorites: string
    ninjaLoginContextNotifications: string
    ninjaContinue: string
    ninjaTermsPrefix: string
    ninjaTermsAnd: string
    ninjaTermsRequired: string
    ninjaCloseAria: string
    ninjaCodeSent: string
    ninjaOrDivider: string
    ninjaGoogleSignIn: string
    ninjaGoogleSignUp: string
    ninjaGoogleContinue: string
    ninjaGoogleNotConfigured: string
  }
  /** global-error.tsx (без LanguageProvider) — дублюємо по мовах через cookie */
  errorPage: {
    title: string
    body: string
    retry: string
  }
  /** Клієнтські спливаючі повідомлення (кошик, відгуки, тощо) */
  appToasts: {
    maxCartQty: string
    fileTooBig: string
    loginAgain: string
    reviewNeedText: string
    reviewSaveError: string
    reviewDuplicate: string
    reviewImageRejected: string
    reviewThanks: string
    reviewThanksModeration: string
    networkError: string
    removeFavoriteError: string
    reviewGuestName: string
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
    teamCarouselHint: string
    teamCarouselAria: string
    teamGalleryCta: string
    teamGalleryPageTitle: string
    teamGalleryPageLead: string
    teamGalleryBack: string
    teamGalleryEmpty: string
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
    /** Коли список акцій порожній */
    emptyList: string
    /** Додатковий текст у hero при порожньому списку */
    emptyInvite: string
    /** CTA на меню з порожнього стану */
    menuCta: string
    /** Підпис над сіткою акцій */
    feedTitle: string
    /** Бейдж головної картки */
    featuredBadge: string
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
    /** Підказка під заголовком порожньої історії замовлень */
    emptyOrdersHint: string
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
    /** Підзаголовок публічної /favorites */
    favSubtitle: string
    /** «{{count}} страв» на бейджі */
    favSavedCount: string
    favEmpty: string
    /** Підказка в порожньому стані */
    favEmptyHint: string
    favToMenu: string
    /** Тост, якщо натиснули «обране» без сесії */
    loginToAddFavorites: string
    addrTitle: string
    addrSub: string
    addrEmptyTitle: string
    addrEmptySub: string
    addrInputLabel: string
    addrInputPlaceholder: string
    addrCheckHint: string
    addrSave: string
    addrSaving: string
    addrSaved: string
    addrSaveError: string
    addrAddNew: string
    addrDraftPreview: string
    addrSavedList: string
    addrDelete: string
    addrDeleted: string
    addrDeleteError: string
    dataTitle: string
    dataSub: string
    dataSave: string
    dataSaving: string
    dataSaved: string
    dataSaveError: string
    dataNameRequired: string
    phoneChangeHint: string
    phoneCodeSent: string
    phoneCodeHint: string
    phoneCodeLabel: string
    phoneCodeConfirm: string
    phoneCodeResend: string
    phoneCodeWrong: string
    phoneChangeSuccess: string
    phoneUnverifiedNotice: string
    phoneConfirmSendCode: string
    phoneVerifyCancel: string
    emailReadonlyHint: string
    labelName: string
    labelPhone: string
    labelEmail: string
    notSpecified: string
    /** Публічна /profile — герой і блок швидких дій */
    publicHeroLead: string
    publicHubTitle: string
    publicOrdersCta: string
    /** Підказка в боковій колонці вкладеного профілю (не плутати з publicOrdersCta) */
    inAppNavHint: string
    /** Час після підтвердження; плейсхолдер {{time}} */
    readyAtPickup: string
    readyAtDelivery: string
    showDetails: string
    hideDetails: string
    timelineTitle: string
    labelAddress: string
    labelPayment: string
    labelFulfillment: string
    labelPhoneShort: string
    fulfillmentPickup: string
    fulfillmentDelivery: string
    stepCurrentBadge: string
    paymentCard: string
    paymentCash: string
    paymentStatusPaid: string
    paymentStatusWaiting: string
    paymentStatusError: string
    activeOrderTitle: string
    viewReceipt: string
    receiptTitle: string
    receiptBackProfile: string
    receiptPaidAt: string
    receiptAwaitingPayment: string
    receiptItemsTitle: string
    receiptMerchandise: string
    receiptDeliveryFee: string
    receiptBonusesUsed: string
    receiptNotFound: string
    receiptUnauthorized: string
  }
  /** Публічна сторінка відгуків */
  reviewsPublic: {
    heroKicker: string
    title: string
    subtitle: string
    statsLine: string
    feedTitlePart1: string
    feedTitlePart2: string
    statReviews: string
    statAverage: string
    statFiveStar: string
    statRecommend: string
    distributionTitle: string
    loginBlockTitle: string
    loginCta: string
    loginButton: string
    writeBlockTitle: string
    writeBlockDesc: string
    writeBlockNoOrders: string
    orderPickLabel: string
    orderPickAction: string
    ordersLoading: string
    emptyMenuCta: string
    featuredBadge: string
    feedTitle: string
    empty: string
    emptyInvite: string
    writeCta: string
    openProfile: string
    reviewThanksTitle: string
    reviewThanksBody: string
    reviewThanksClose: string
  }
  /** Блог — обгортка UI */
  blogPublic: {
    heroKicker: string
    title: string
    subtitle: string
    empty: string
    readMore: string
    backToBlog: string
    featuredBadge: string
    /** Тег на картці, коли з API немає категорії */
    cardCategoryFallback: string
    linksTitle: string
    linksProducts: string
    linksCategories: string
    linksIngredients: string
    linksOrder: string
  }
  /** Сторінка контактів */
  contactPage: {
    heroKicker: string
    heroTitle: string
    heroTitleLead: string
    heroTitleMark: string
    heroSubtitle: string
    ctaForm: string
    ctaDelivery: string
    stat1Val: string
    stat1Label: string
    stat2Val: string
    stat2Label: string
    stat3Val: string
    stat3Label: string
    stat4Val: string
    stat4Label: string
    topicsTitle: string
    topicsSub: string
    topicMenu: string
    topicDelivery: string
    topicCorporate: string
    topicPartners: string
    topicFeedback: string
    flowTitle: string
    flowSub: string
    flowStep1Title: string
    flowStep1Body: string
    flowStep2Title: string
    flowStep2Body: string
    flowStep3Title: string
    flowStep3Body: string
    messengerSub: string
    tgCardTitle: string
    tgCardSub: string
    waCardTitle: string
    waCardSub: string
    igCardTitle: string
    igCardSub: string
    corporateTitle: string
    corporateSub: string
    corporateCta: string
    quickLinksTitle: string
    quickMenu: string
    quickDelivery: string
    quickPromo: string
    quickAbout: string
    mapBadgePickup: string
    mapBadgeOpen: string
    formTopicLabel: string
    formTopicMenu: string
    formTopicDelivery: string
    formTopicCorporate: string
    formTopicOther: string
    formAsideTitle: string
    formAside1: string
    formAside2: string
    formAside3: string
    faq6Q: string
    faq6A: string
    ctaMenu: string
    trustLine: string
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
    ariaTelegram: string
    ariaWhatsapp: string
    ariaInstagram: string
  }
  /** Сторінка політики конфіденційності */
  /** Сторінка публічного договору (оферти) */
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
      users: string; usersDesc: string; adminPhones: string; adminPhonesDesc: string;
      team: string; teamDesc: string;
      settings: string; settingsDesc: string; ingredients: string; newsletter: string;
      cartUpsell: string; cartUpsellDesc: string;
      blog: string; blogDesc: string;
      reviews: string; reviewsDesc: string;
      crm: string; crmDesc: string;
    }
    dashboard: {
      loading: string; revenue: string; orders: string; products: string; cities: string;
      statusTitle: string; statusPending: string; statusConfirmed: string; statusCooking: string;
      statusDelivering: string; statusCompleted: string; statusCancelled: string; promos: string;
      categories: string; users: string; paidOrders: string; statsHint: string;
      todayRevenue: string; todayOrders: string;
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
      studioBadge: string;
    }
    actions: {
      add: string; edit: string; editShort: string; delete: string; save: string; saveChanges: string; cancel: string;
      closeAria: string;
    }
    common: {
      menuChangeSection: string; emptyOrders: string; emptyCities: string; emptyBanners: string;
      emptyCategories: string; emptyUsers: string; emptyTeam: string; emptyPromos: string;
      clickToUpload: string; changeFile: string; selectFromList: string;
      activeLabel: string; inactiveLabel: string; yes: string; no: string;
      orderIndex: string; choose: string; notFound: string; searching: string;
      bannerDragHint: string; bannerOrderSaved: string; bannerOrderSaveError: string;
      loading: string; savingEllipsis: string; guest: string; noRecord: string;
    }
    orders: {
      orderNum: string; noComment: string; payment: string; cash: string; online: string;
      paid: string; error: string; waiting: string; hintConfirmed: string; hintCooking: string; hintDelivering: string; 
      hintCompleted: string; hintCancel: string;
      btnConfirmed: string; btnCooking: string; btnDelivering: string; btnCompleted: string; btnCancel: string;
      readyTimeTitleAccept: string; readyTimeTitleCooking: string; readyTimePickupHint: string; readyTimeDeliveryHint: string;
      readyTimeNotifyHint: string; readyTimeLabel: string; readyTimeMinutes: string; readyTimeRequired: string;
      readyTimeSubmitAccept: string; readyTimeSubmitCooking: string; readyAtPickup: string; readyAtDelivery: string;
      fulfillmentDelivery: string; fulfillmentPickup: string; deliveryFeeAdmin: string;
      ordersByDayTitle: string; ordersByDayToday: string; ordersByDayPrev: string; ordersByDayNext: string;
      ordersByDayEmpty: string; ordersByDayCount: string; ordersByDayRevenue: string;
      scheduledForLabel: string; scheduledSlotLabel: string; daysWithOrders: string;
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
      empty: string;
    }
    ingredients: {
      title: string; addNew: string; editTitle: string; nameRu: string; namePlaceholder: string;
      addBtn: string; saveBtn: string; cancelEdit: string; deleteConfirm: string;
      saved: string; updated: string; deleted: string; photoLabel: string; langsHint: string;
      namesTitle: string; previewOnSite: string; langRu: string; langUa: string; langEn: string; langNl: string;
      productPickerTitle: string; productPickerHint: string; selectedCount: string; emptyLibrary: string;
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
      heroVideoTitle: string; heroVideoSubtitle: string;
      deliveryHeroVideoTitle: string; deliveryHeroVideoSubtitle: string;
      menuHeroVideoTitle: string; menuHeroVideoSubtitle: string;
      authHeroVideoTitle: string; authHeroVideoSubtitle: string; authHeroPlaylistHint: string;
      authHeroPhone1Title: string; authHeroPhone2Title: string;
      authHeroCopyTitle: string; authHeroCopySubtitle: string; authHeroCopyBenefits: string; authHeroCopyCityHint: string;
      authHeroCopyLangUk: string; authHeroCopyLangRu: string; authHeroCopyLangEn: string; authHeroCopyLangNl: string;
      authHeroSavePhones: string; authHeroPhonesSaved: string;
      heroVideoSlotLabel: string; heroVideoUpload: string;
      heroVideoSave: string; heroVideoSaving: string; heroVideoSaved: string; heroVideoError: string;
      heroVideoErrorAuth: string; heroVideoErrorMock: string; heroVideoErrorUpload: string;
      heroVideoTooLarge: string;       heroVideoCurrent: string; heroVideoRemove: string; heroVideoAddBtn: string;
      heroVideoUnavailableTitle: string; heroVideoUnavailableHint: string;
    }
    categories: {
      addBtn: string; slug: string; editTitle: string; newTitle: string;
      emojiLabel: string; nameRu: string; namePlaceholder: string; slugLabel: string; slugAuto: string;
    }
    users: {
      title: string; noName: string; admin: string; user: string; ordersCount: string; registration: string;
      bonusesLabel: string; cashbackLabel: string; configureBonuses: string;
    }
    newsletter: {
      title: string; desc: string; confirmSend: string; subject: string; subjectPlaceholder: string;
      message: string; messagePlaceholder: string; promoOptional: string; promoPlaceholder: string;
      promoHint: string; sendBtn: string; successSend: string; errorPrefix: string; errorNetwork: string;
    }
    team: {
      title: string; addBtn: string; editTitle: string; newTitle: string;
      nameRu: string; posRu: string; bioRu: string;
      inactiveBadge: string;
    }
    promos: {
      createTitle: string; codePlaceholder: string; discountPlaceholder: string; createBtn: string; discountText: string;
    }
    settings: {
      title: string; intervalLabel: string; sec: string; intervalDesc: string; saving: string; saveBtn: string;
      saved: string;
    }
    reviews: {
      title: string; subtitle: string; empty: string; pendingBanner: string;
      noOrder: string; statusPublished: string; statusModeration: string;
      publishBtn: string; unpublishBtn: string; editBtn: string; saveBtn: string; cancelBtn: string;
      deleteAria: string; deleteConfirm: string; deleted: string; saved: string;
      published: string; unpublished: string; textTooShort: string;
      saveError: string; updateError: string; deleteError: string;
    }
    blog: {
      title: string; subtitle: string; slugPlaceholder: string; coverTitle: string; coverHint: string;
      removeCover: string; uploadCover: string; uploadingCover: string; coverUrlPlaceholder: string;
      youtubePlaceholder: string; authorPlaceholder: string; defaultAuthor: string;
      isPublished: string; createBtn: string; updateBtn: string; publishedBadge: string; draftBadge: string;
      linksSummary: string; emptyPosts: string;
      i18nTitle: string; i18nHint: string; autoTranslateBtn: string; translating: string;
      titlePlaceholder: string; contentPlaceholder: string;
      linksTitle: string; linksHint: string; linksSelectedTotal: string;
      linksProductsTitle: string; linksProductsHint: string;
      linksCategoriesTitle: string; linksCategoriesHint: string;
      linksIngredientsTitle: string; linksIngredientsHint: string;
      searchPlaceholder: string; searchEmpty: string; selectedCount: string;
    }
    cartUpsell: {
      title: string; subtitle: string; newTierBtn: string; loading: string; empty: string;
      editTierTitle: string; newTierTitle: string; fromAmount: string; toAmount: string;
      discount: string; sortOrder: string; activeTier: string; discountedProducts: string;
      noLimitPlaceholder: string; disabledSuffix: string; productCount: string; perItemSuffix: string;
      saving: string; saveChanges: string; createTier: string; cancel: string;
      editAria: string; deleteAria: string; addProductsFirst: string;
      loadError: string; authRequired: string; tierUpdated: string; tierCreated: string;
      saveError: string; deleteConfirm: string; deleted: string; deleteError: string;
    }
    adminPhones: {
      title: string; description: string; phoneLabel: string; noteLabel: string; notePlaceholder: string;
      addBtn: string; loading: string; empty: string;
      colPhone: string; colNote: string; colAdded: string; colActions: string;
      primaryBadge: string; protectedBadge: string; deleteBtn: string; deleteAria: string;
      loadError: string; phoneRequired: string; addError: string; added: string;
      deleteConfirm: string; deleted: string; error: string;
    }
    crm: {
      customersTab: string; inquiriesTab: string; customersTitle: string; searchPlaceholder: string;
      colName: string; colPhone: string; colEmail: string; colOrders: string; colTotal: string;
      colConsent: string; colLastOrder: string; rowHint: string; empty: string; loading: string;
      cardTitle: string; fieldName: string; fieldPhone: string; fieldEmail: string; fieldAccount: string;
      fieldOrders: string; fieldTotal: string; fieldBonuses: string; fieldConsent: string;
      orderHistory: string; orderStatus: string; orderAddress: string; orderPayment: string;
      orderComment: string; noOrders: string; createMailing: string;
    }
    contactInquiries: {
      title: string; totalLabel: string; unreadLabel: string;
      filterAll: string; filterUnread: string; filterRead: string;
      refreshBtn: string; markAllReadBtn: string;
      colDate: string; colName: string; colContacts: string; colMessage: string;
      empty: string; loading: string; footerHint: string;
      detailTitle: string; messageLabel: string; deleteBtn: string; closeBtn: string;
      deleteAria: string; closeAria: string; deleteConfirm: string;
      loadError: string; markReadError: string; markAllReadSuccess: string;
      deleted: string; deleteError: string;
    }
    userBonus: {
      title: string; balanceLabel: string; globalCashbackLabel: string; effectivePercentLabel: string;
      disabled: string; personalPercentLabel: string; personalPercentCheckbox: string;
      personalPercentField: string; useGlobalHint: string;
      adjustmentLabel: string; adjustmentPlaceholder: string; adjustmentHint: string;
      cancelBtn: string; saveBtn: string; closeAria: string;
      saveError: string; saved: string; networkError: string;
    }
  }
  notifications: {
    title: string
    pageSubtext: string
    empty: string
    emptySubtext: string
    emptySms: [string, string, string]
    markAllRead: string
    liveHint: string
    liveActive: string
    newToastLabel: string
    guestTitle: string
    guestSubtext: string
    guestLoginCta: string
    guestRegisterCta: string
  }
  // Додайте це до інтерфейсу Translations:
  menuView: {
    itemsCount: string
    emptyCategoryTitle: string
    emptyCategoryDesc: string
    seeAll: string
    /** Aria для кнопки «Дивитися все» під категорією */
    seeAllCategoryAria: string
    /** Кнопка «Показати ще» на головній — розгорнути решту страв категорії */
    showMore: string
    showMoreWithCount: string
    showMoreCategoryAria: string
    /** Aria для кнопки «Дивитися все меню» (загальна секція) */
    seeAllMenuAria: string
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
    /** Підзаголовок під «Меню» на головній */
    homeCatalogIntro: string
    /** Підказка: товари на окремій сторінці */
    catalogOnCategoryPageHint: string
    categoryPageBack: string
    categoryPageEmpty: string
    categoryPageOpenCart: string
    /** Сторінка /menu — повний каталог */
    fullMenuTitle: string
    fullMenuIntroKicker: string
    fullMenuIntroKickerScript: string
    fullMenuIntroHeadlineLead: string
    fullMenuIntroHeadlineMark: string
    fullMenuIntroSub: string
    fullMenuIntroStatFresh: string
    fullMenuIntroStatHits: string
    fullMenuIntroStatOrder: string
    fullMenuWant: string
    fullMenuCategoriesAria: string
    fullMenuLoading: string
    fullMenuEmpty: string
    /** Таб «усі категорії» у стрічці на /menu */
    fullMenuAllTab: string
    fullMenuBalloonsBtn: string
    fullMenuBalloonsAria: string
    /** Aria для горизонтальної стрічки страв у категорії на головній */
    categoryRailAria: string
    /** Aria для сітки страв у категорії на головній (планшет / десктоп) */
    categoryGridAria: string
    /** Заголовок поверх фото-банера на головній */
    heroBannerOverlayTitle: string
    /** Підзаголовок / коротка «цитата» під заголовком на банері */
    heroBannerOverlaySub: string
    /** Під банером — стилізація як SMS від бренду */
    heroBannerSmsSender: string
    heroBannerSmsBadge: string
    heroBannerSmsTime: string
    /** Aria: секція промо-банерів (видимий заголовок знято) */
    heroBannersSectionAria: string
    /** Головна: API меню недоступне — порожній каталог */
    homeMenuApiUnavailableTitle: string
    homeMenuApiUnavailableHint: string
    homeMenuApiUnavailableHintProd: string
    /** Aria: текст під hero-відео, перед блоком хітів */
    homeAfterHeroIntroAria: string
    /** Короткий рядок-акцент (кирилиця / латиниця — під мову) */
    homeAfterHeroIntroKicker: string
    /** Заголовок вступу */
    homeAfterHeroIntroTitle: string
    /** Основний абзац */
    homeAfterHeroIntroBody: string
    /** Якщо міста ще не підвантажились — підстановка замість {{city}} */
    homeAfterHeroIntroCityPlaceholder: string
  }
  cinematicFooter: {
    /** Рядок над заголовком «Наші хіти» (без бейджа) */
    readyTitleEyebrow: string
    /** Короткий кікер (бейдж) у блоці над стрічками */
    readyTitleKicker: string
    /** Друга частина — в один ряд з кікером */
    readyTitleSub: string
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
    /** Підзаголовок під «Новинки» на /menu */
    sectionNewInMenuLead: string
    /** Блок «Новинки» на /menu (isMenuNew) */
    sectionNewInMenu: string
    /** Кнопка після прев’ю хітів на головній */
    seeFullMenu: string
    sectionRecommendedTitle: string
    /** Підзаголовок під «Наші хіти» на /menu */
    sectionRecommendedLead: string
    /** Популярні / хіти з адмінки (isPopular) */
    sectionPopularTitle: string
    /** Горизонтальний ряд чипів категорій під підказкою */
    sectionCategoriesTitle: string
    recommendedBadge: string
    popularBadge: string
    promoStripAria: string
    /** Підзаголовок під блоком акцій на /menu */
    sectionPromoLead: string
    recommendedStripAria: string
    popularStripAria: string
    categoriesStripAria: string
    animationSlotAria: string
    /** Фрази бігучого рядка після hero-відео, через | */
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

export type Translations = SiteTranslations
