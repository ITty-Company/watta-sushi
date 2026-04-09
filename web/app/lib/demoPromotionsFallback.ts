import type { Language } from '@/app/context/LanguageContext'

/** Клієнтський fallback, коли API повертає порожній список новин/акцій. id < 0 — не з бекенду. */

type Loc = {
  category: string
  dateDisplay: string
  title: string
  description: string
  content: string
}

const IMG = {
  a: 'https://images.unsplash.com/photo-1579584425555-c7ce17fd4351?w=900&q=80',
  b: 'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=900&q=80',
  c: 'https://images.unsplash.com/photo-1580822184713-fc5400e7fe10?w=900&q=80',
  d: 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=900&q=80',
  e: 'https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=900&q=80',
  f: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=900&q=80',
}

const DEFINITIONS: {
  id: number
  imageUrl: string
  galleryUrls: string[]
  isHit: boolean
  byLang: Record<Language, Loc>
}[] = [
  {
    id: -101,
    imageUrl: IMG.a,
    galleryUrls: [IMG.a],
    isHit: true,
    byLang: {
      uk: {
        category: 'Оновлення меню',
        dateDisplay: '07.04.2026',
        title: 'Весна з Watta — п’ять нових ролів',
        description: 'Сезонні поєднання, більше зелені та легкі соуси — вже в застосунку.',
        content:
          'Ми додали п’ять нових позицій до меню: акцент на авокадо, лосось гриль і домашні соуси без зайвої солі. Спробуйте всі — і оберіть улюблений у профілі.\n\nЗамовлення доступні щодня з 14:00 до 21:00.',
      },
      ru: {
        category: 'Обновление меню',
        dateDisplay: '07.04.2026',
        title: 'Весна с Watta — пять новых роллов',
        description: 'Сезонные сочетания, больше зелени и лёгкие соусы — уже в приложении.',
        content:
          'Мы добавили пять новых позиций: акцент на авокадо, гриль-лосось и домашние соусы. Попробуйте все и сохраните любимое в профиле.\n\nЗаказ каждый день с 14:00 до 21:00.',
      },
      en: {
        category: 'Menu update',
        dateDisplay: 'Apr 7, 2026',
        title: 'Spring at Watta — five new rolls',
        description: 'Seasonal combos, more greens, lighter sauces — live in the app.',
        content:
          'Five new items landed: avocado-forward builds, grilled salmon, and house sauces with a lighter touch. Try them all and save a favourite in your profile.\n\nOpen daily 14:00–21:00.',
      },
      nl: {
        category: 'Menu-update',
        dateDisplay: '7 apr 2026',
        title: 'Lente bij Watta — vijf nieuwe rollen',
        description: 'Seizoenscombinaties, meer groen, lichtere sauzen — nu in de app.',
        content:
          'Vijf nieuwe gerechten: focus op avocado, gegrilde zalm en huisgemaakte sauzen. Probeer ze allemaal en bewaar je favoriet in je profiel.\n\nDagelijks 14:00–21:00.',
      },
    },
  },
  {
    id: -102,
    imageUrl: IMG.b,
    galleryUrls: [IMG.b],
    isHit: false,
    byLang: {
      uk: {
        category: 'З кухні',
        dateDisplay: '05.04.2026',
        title: 'Як ми тримаємо рис ідеальним',
        description: 'Температура, час варіння та баланс оцту — коротко про базу кожного ролу.',
        content:
          'Рис для суші — це окрема дисципліна: ми контролюємо кожну партію, охолоджуємо за протоколом і змішуємо з оцтом у стабільній пропорції. Так начинка не «пливе», а смак залишається чистим.',
      },
      ru: {
        category: 'С кухни',
        dateDisplay: '05.04.2026',
        title: 'Как мы держим рис идеальным',
        description: 'Температура, время варки и баланс уксуса — основа каждого ролла.',
        content:
          'Рис для суши — отдельная дисциплина: контролируем партию, охлаждаем по протоколу, смешиваем с уксусом в стабильной пропорции. Начинка держит форму, вкус остаётся чистым.',
      },
      en: {
        category: 'From the kitchen',
        dateDisplay: 'Apr 5, 2026',
        title: 'How we keep rice spot-on',
        description: 'Temperature, cook time, and vinegar balance — the base of every roll.',
        content:
          'Sushi rice is its own discipline: we track each batch, cool it to spec, and mix vinegar in a steady ratio. That keeps fillings stable and flavour clean.',
      },
      nl: {
        category: 'Van de keuken',
        dateDisplay: '5 apr 2026',
        title: 'Zo houden we de rijst perfect',
        description: 'Temperatuur, kooktijd en azijnbalans — de basis van elke rol.',
        content:
          'Sushirijst is een vak apart: elke batch wordt gecontroleerd, afgekoeld volgens protocol en gemengd met azijn in een vaste verhouding. Vulling blijft strak, smaak helder.',
      },
    },
  },
  {
    id: -103,
    imageUrl: IMG.c,
    galleryUrls: [IMG.c],
    isHit: false,
    byLang: {
      uk: {
        category: 'Доставка',
        dateDisplay: '02.04.2026',
        title: 'Тепла їжа та акуратна упаковка',
        description: 'Термобокси, маршрути кур’єрів і що робити, якщо дощ.',
        content:
          'Ми пакуємо гаряче й холодне окремо, використовуємо термоматеріали там, де це потрібно, і навчаємо кур’єрів мінімізувати час у дорозі. Якщо погода псує план — повідомимо в чаті.',
      },
      ru: {
        category: 'Доставка',
        dateDisplay: '02.04.2026',
        title: 'Тёплая еда и аккуратная упаковка',
        description: 'Термобоксы, маршруты курьеров и дождь.',
        content:
          'Горячее и холодное раздельно, термоматериалы по необходимости, курьеры ориентируются на минимальное время в пути. Если портится погода — напишем в чате.',
      },
      en: {
        category: 'Delivery',
        dateDisplay: 'Apr 2, 2026',
        title: 'Warm food, neat packaging',
        description: 'Thermal bags, courier routing, and rainy days.',
        content:
          'We split hot and cold, add insulation when it matters, and train couriers to keep time in transit short. If the weather fights us, we’ll flag it in chat.',
      },
      nl: {
        category: 'Bezorging',
        dateDisplay: '2 apr 2026',
        title: 'Warm eten, nette verpakking',
        description: 'Thermoboxen, routes en regen.',
        content:
          'Warm en koud gescheiden, isolatie waar nodig, bezorgers houden de tijd kort. Bij slecht weer melden we het in de chat.',
      },
    },
  },
  {
    id: -104,
    imageUrl: IMG.d,
    galleryUrls: [IMG.d],
    isHit: false,
    byLang: {
      uk: {
        category: 'Watta',
        dateDisplay: '28.03.2026',
        title: 'Лайфстайл #wattafam',
        description: 'Меню, колаборації та історії з кухні — підписуйтесь на соцмережі.',
        content:
          'У соцмережах ми ділимося дропами меню, бекстейджем з кухні та відповідаємо на питання про інгредієнти. Хештег #wattafam — ваші фото та відгуки.',
      },
      ru: {
        category: 'Watta',
        dateDisplay: '28.03.2026',
        title: 'Лайфстайл #wattafam',
        description: 'Меню, коллаборации и истории с кухни — в соцсетях.',
        content:
          'Показываем дропы меню, бэкстейдж и отвечаем про ингредиенты. Хештег #wattafam — ваши фото и отзывы.',
      },
      en: {
        category: 'Watta',
        dateDisplay: 'Mar 28, 2026',
        title: 'Lifestyle #wattafam',
        description: 'Menu drops, collabs, and kitchen stories — follow along.',
        content:
          'We share menu drops, kitchen BTS, and ingredient FAQs. Tag #wattafam with your photos and reviews.',
      },
      nl: {
        category: 'Watta',
        dateDisplay: '28 mrt 2026',
        title: 'Lifestyle #wattafam',
        description: 'Menulanceringen, collabs en keukenverhalen.',
        content:
          'Menu-updates, kijkjes in de keuken en antwoorden over ingrediënten. Tag #wattafam met je foto’s en reviews.',
      },
    },
  },
  {
    id: -105,
    imageUrl: IMG.e,
    galleryUrls: [IMG.e],
    isHit: false,
    byLang: {
      uk: {
        category: 'Інгредієнти',
        dateDisplay: '25.03.2026',
        title: 'Чому ми довіряємо постачальникам морепродуктів',
        description: 'Перевірки, сертифікати та холодний ланцюг.',
        content:
          'Працюємо з перевіреними партнерами, дивимося на умови зберігання та регулярність поставок. Будь-яка партія може піти назад, якщо не відповідає стандарту — без компромісів для смаку й безпеки.',
      },
      ru: {
        category: 'Ингредиенты',
        dateDisplay: '25.03.2026',
        title: 'Почему мы доверяем поставщикам морепродуктов',
        description: 'Проверки, сертификаты и холодная цепь.',
        content:
          'Работаем с проверенными партнёрами, смотрим на хранение и регулярность поставок. Партия может уйти обратно, если не тянет на стандарт.',
      },
      en: {
        category: 'Ingredients',
        dateDisplay: 'Mar 25, 2026',
        title: 'Why we trust our seafood partners',
        description: 'Checks, paperwork, and the cold chain.',
        content:
          'We work with vetted suppliers, watch storage and delivery cadence, and we’ll reject a batch that misses the bar — no compromises on taste or safety.',
      },
      nl: {
        category: 'Ingrediënten',
        dateDisplay: '25 mrt 2026',
        title: 'Waarom we onze visleveranciers vertrouwen',
        description: 'Checks, certificaten en de koude keten.',
        content:
          'We werken met vaste partners, letten op opslag en leverfrequentie. Een partij gaat terug als hij niet aan de standaard voldoet.',
      },
    },
  },
  {
    id: -106,
    imageUrl: IMG.f,
    galleryUrls: [IMG.f],
    isHit: false,
    byLang: {
      uk: {
        category: 'Акції',
        dateDisplay: '20.03.2026',
        title: 'Вікенд з друзями: сет на чотирьох',
        description: 'Збірка ролів і закусок — зручно замовити одним кліком.',
        content:
          'Зібрали сет, щоб не сперечатися, хто що любить: класика, трохи гострого та напої окремо. Ідеально для п’ятниці вдома або на офісі — перевірте розділ «Сети» в меню.',
      },
      ru: {
        category: 'Акции',
        dateDisplay: '20.03.2026',
        title: 'Уикенд с друзьями: сет на четверых',
        description: 'Роллы и закуски — одним заказом.',
        content:
          'Собрали сет без споров: классика, немного острого, напитки отдельно. Отлично для пятницы дома или в офисе — смотрите раздел «Сеты».',
      },
      en: {
        category: 'Offers',
        dateDisplay: 'Mar 20, 2026',
        title: 'Weekend with friends: set for four',
        description: 'Rolls and snacks in one tap.',
        content:
          'A crowd-pleasing mix: classics, a little heat, drinks on the side. Great for Friday at home or the office — check the Sets section.',
      },
      nl: {
        category: 'Acties',
        dateDisplay: '20 mrt 2026',
        title: 'Weekend met vrienden: set voor vier',
        description: "Rollen en snacks in één bestelling.",
        content:
          'Een mix waar iedereen blij van wordt: klassiek, een beetje pittig, drank apart. Perfect voor vrijdag — zie Sets in het menu.',
      },
    },
  },
]

export function getClientFallbackPromotions(lang: Language) {
  return DEFINITIONS.map((row) => {
    const L = row.byLang[lang] || row.byLang.uk
    return {
      id: row.id,
      title: L.title,
      description: L.description,
      content: L.content,
      imageUrl: row.imageUrl,
      galleryUrls: row.galleryUrls,
      productOffers: [] as { productId: number; discountPercent: number }[],
      isHit: row.isHit,
      createdAt: '2026-04-07T12:00:00.000Z',
      updatedAt: '2026-04-07T12:00:00.000Z',
      categoryLabel: L.category,
      displayDate: L.dateDisplay,
    }
  })
}

export function getClientFallbackPromotionById(id: number, lang: Language) {
  const row = DEFINITIONS.find((r) => r.id === id)
  if (!row) return null
  const L = row.byLang[lang] || row.byLang.uk
  return {
    id: row.id,
    title: L.title,
    description: L.description,
    content: L.content,
    imageUrl: row.imageUrl,
    galleryUrls: row.galleryUrls,
    productOffers: [] as { productId: number; discountPercent: number }[],
    isHit: row.isHit,
    offerProducts: [],
    categoryLabel: L.category,
    displayDate: L.dateDisplay,
  }
}

export function isClientFallbackPromoId(id: number) {
  return id < 0 && DEFINITIONS.some((r) => r.id === id)
}

/** Позитивні id для `USE_LOCAL_MOCK` у middleware — збігаються з клієнтським fallback за змістом. */
export function getMiddlewareMockPromotions() {
  return DEFINITIONS.map((row, i) => {
    const L = row.byLang.uk
    return {
      id: i + 1,
      title: L.title,
      description: L.description,
      content: L.content,
      imageUrl: row.imageUrl,
      galleryUrls: row.galleryUrls,
      productOffers: [] as { productId: number; discountPercent: number }[],
      isHit: row.isHit,
      createdAt: '2026-04-07T12:00:00.000Z',
      updatedAt: '2026-04-07T12:00:00.000Z',
    }
  })
}
