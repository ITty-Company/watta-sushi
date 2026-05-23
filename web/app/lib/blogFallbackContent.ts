import type { WattaLanguage as Language } from '@/lib/i18n/language'

/** Fallback-статті блогу, коли API порожній (рекомендації для замовлення, не DIY-рецепти). */

export type FallbackBlogCard = {
  id: number
  slug: string
  title: string
  excerpt: string
  content: string
  imageUrl: string
  author: string
  category: string
  dateDisplay: string
  createdAt: string
}

const B1 =
  'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=1200&q=80'
const B2 =
  'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=1200&q=80'
const B3 =
  'https://images.unsplash.com/photo-1580822184713-fc5400e7fe10?w=1200&q=80'
const B4 =
  'https://images.unsplash.com/photo-1553621042-f6e147245754?w=1200&q=80'
const B5 =
  'https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=1200&q=80'
const B6 =
  'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1200&q=80'

const ROWS: {
  id: number
  slug: string
  imageUrl: string
  createdAt: string
  byLang: Record<
    Language,
    { category: string; dateDisplay: string; title: string; excerpt: string; content: string; author: string }
  >
}[] = [
  {
    id: -201,
    slug: 'first-order-watta',
    imageUrl: B1,
    createdAt: '2026-05-20T10:00:00.000Z',
    byLang: {
      uk: {
        category: 'Рекомендації',
        dateDisplay: '20.05.2026',
        title: 'Що замовити вперше в Watta Sushi',
        excerpt: 'Три безпечні хіти для першого разу — без складного вибору.',
        content:
          'Якщо ви вперше у нас — почніть з Філадельфії, Каліфорнії та одного гарячого ролу (наприклад, запечений з лососем). Так ви відчуєте класику й «теплий» смак без перевантаження меню.\n\nДодайте соєвий соус і імбир — ми пакуємо окремо. Замовлення через сайт займає кілька хвилин, доставка приїде готовим сетом — не треба нічого крутити вдома.',
        author: 'Команда Watta Sushi',
      },
      ru: {
        category: 'Рекомендации',
        dateDisplay: '20.05.2026',
        title: 'Что заказать в первый раз в Watta Sushi',
        excerpt: 'Три надёжных хита для первого заказа.',
        content:
          'Впервые у нас — возьмите Филадельфию, Калифорнию и один горячий ролл. Поймёте классику и «тёплый» вкус без лишнего выбора.\n\nСоевый соус и имбирь упакуем отдельно. Закажите на сайте — привезём готовым сетом, без готовки дома.',
        author: 'Команда Watta Sushi',
      },
      en: {
        category: 'Recommendations',
        dateDisplay: 'May 20, 2026',
        title: 'What to order first at Watta Sushi',
        excerpt: 'Three safe hits for your debut order.',
        content:
          'New here? Start with Philadelphia, California, and one baked roll. You’ll taste the classics plus a warm, comforting note without menu overload.\n\nSoy sauce and ginger come on the side. Order online — we deliver a ready set, no rolling at home.',
        author: 'Watta Sushi team',
      },
      nl: {
        category: 'Aanbevelingen',
        dateDisplay: '20 mei 2026',
        title: 'Wat je als eerste bestelt bij Watta Sushi',
        excerpt: 'Drie zekere favorieten voor je eerste bestelling.',
        content:
          'Nieuw? Kies Philadelphia, California en één warme roll. Zo proef je de klassiekers zonder keuzestress.\n\nSojasaus en gember apart verpakt. Bestel online — wij bezorgen klaar, niet zelf rollen thuis.',
        author: 'Team Watta Sushi',
      },
    },
  },
  {
    id: -202,
    slug: 'set-for-two',
    imageUrl: B2,
    createdAt: '2026-05-18T10:00:00.000Z',
    byLang: {
      uk: {
        category: 'Меню',
        dateDisplay: '18.05.2026',
        title: 'Сет на двох: як зібрати ідеальне замовлення',
        excerpt: '24–32 шматочки, один напій і соуси — готова вечеря.',
        content:
          'На двох комфортно: 2–3 роли (24–32 шматочки), салат або суп місо, напій на вибір. Популярний варіант у гостей — Філадельфія + запечений рол + легкий рол з огірком для балансу.\n\nУ кошику додайте імбир і васабі — ми не економимо на порціях. Замовте на вечір — кухня збере свіжий сет під час прийому замовлення.',
        author: 'Команда Watta Sushi',
      },
      ru: {
        category: 'Меню',
        dateDisplay: '18.05.2026',
        title: 'Сет на двоих: идеальный заказ',
        excerpt: '24–32 кусочка, напиток и соусы — готовый ужин.',
        content:
          'На двоих: 2–3 ролла, мисо или салат, напиток. Хит: Филадельфия + запечённый + лёгкий с огурцом.\n\nИмбирь и васаби — отдельно, порции щедрые. Закажите на вечер — соберём свежим.',
        author: 'Команда Watta Sushi',
      },
      en: {
        category: 'Menu',
        dateDisplay: 'May 18, 2026',
        title: 'Dinner for two: build the perfect order',
        excerpt: '24–32 pieces, a drink, sauces — date night sorted.',
        content:
          'For two: 2–3 rolls (24–32 pcs), miso or salad, one drink. Guest favourite: Philadelphia + baked roll + a light cucumber roll.\n\nGinger and wasabi on the side, full portions. Order for the evening — we assemble fresh when your order hits the kitchen.',
        author: 'Watta Sushi team',
      },
      nl: {
        category: 'Menu',
        dateDisplay: '18 mei 2026',
        title: 'Diner voor twee: de perfecte bestelling',
        excerpt: '24–32 stuks, drank en sauzen — klaar voor thuis.',
        content:
          'Met z’n tweeën: 2–3 rolls, miso of salade, één drankje. Favoriet: Philadelphia + gebakken roll + lichte komkommerroll.\n\nGember en wasabi apart. Bestel voor de avond — vers samengesteld bij ontvangst.',
        author: 'Team Watta Sushi',
      },
    },
  },
  {
    id: -203,
    slug: 'delivery-not-diy',
    imageUrl: B3,
    createdAt: '2026-05-15T10:00:00.000Z',
    byLang: {
      uk: {
        category: 'Доставка',
        dateDisplay: '15.05.2026',
        title: 'Чому суші краще замовити, ніж робити вдома',
        excerpt: 'Свіжість, час і стабільний смак — аргументи на користь доставки.',
        content:
          'Домашні роли виглядають просто, але потрібні свіжа риба, правильний рис, ніж і година часу. У Watta це щоденна зміна: постачання за графіком, рецептури на вагах, збирають досвідчені сушисти.\n\nВи економите вечір і отримуєте той самий смак, що в залі. Замовте доставку — ми привеземо в термопакеті, соуси окремо.',
        author: 'Команда Watta Sushi',
      },
      ru: {
        category: 'Доставка',
        dateDisplay: '15.05.2026',
        title: 'Почему суши лучше заказать, а не делать дома',
        excerpt: 'Свежесть, время и стабильный вкус.',
        content:
          'Дома нужны рыба, рис, нож и час. У нас — поставки, весы, опытная сборка каждый день.\n\nСэкономьте вечер — привезём в термопакете, соусы отдельно.',
        author: 'Команда Watta Sushi',
      },
      en: {
        category: 'Delivery',
        dateDisplay: 'May 15, 2026',
        title: 'Why delivery beats DIY sushi',
        excerpt: 'Fresh fish, your time, consistent flavour.',
        content:
          'Home rolls need fresh fish, proper rice, a sharp knife, and an hour. At Watta it’s daily routine: scheduled supply, weighed recipes, skilled assembly.\n\nSave your evening — we deliver in insulated bags with sauces packed separately.',
        author: 'Watta Sushi team',
      },
      nl: {
        category: 'Bezorging',
        dateDisplay: '15 mei 2026',
        title: 'Waarom bezorgen beter is dan zelf rollen',
        excerpt: 'Vers, tijdwinst, vaste kwaliteit.',
        content:
          'Thuis rollen kost verse vis, rijst, een mes en een uur. Bij Watta is dat dagelijkse routine: vaste levering, gewogen recepten, ervaren team.\n\nBespaar je avond — bezorging in thermotas, sauzen apart.',
        author: 'Team Watta Sushi',
      },
    },
  },
  {
    id: -204,
    slug: 'philadelphia-or-baked',
    imageUrl: B4,
    createdAt: '2026-05-12T10:00:00.000Z',
    byLang: {
      uk: {
        category: 'Поради',
        dateDisplay: '12.05.2026',
        title: 'Філадельфія чи запечений рол: що обрати сьогодні',
        excerpt: 'Ніжність лосося проти теплого сиру — під різний настрій.',
        content:
          'Любите класику й охолоджений лосось — беріть Філадельфію. Хочеться «комфорт-їжі» — запечений рол з соусом і теплим сиром.\n\nМожна обидва в одному замовленні: половина гостей так і роблять. Додайте соєвий соус помірно — так відчувається риба, а не лише сіль.',
        author: 'Шеф Watta Sushi',
      },
      ru: {
        category: 'Советы',
        dateDisplay: '12.05.2026',
        title: 'Филадельфия или запечённый рол: что выбрать',
        excerpt: 'Классика лосося или тёплый сыр.',
        content:
          'Классика — Филадельфия. Комфорт — запечённый рол. Часто берут оба в одном заказе.\n\nСоевый соус — умеренно, чтобы чувствовать рыбу.',
        author: 'Шеф Watta Sushi',
      },
      en: {
        category: 'Tips',
        dateDisplay: 'May 12, 2026',
        title: 'Philadelphia or baked roll: pick your mood',
        excerpt: 'Cool salmon classic vs warm cheesy comfort.',
        content:
          'Craving the classic? Philadelphia. Want comfort food? Go baked with warm cheese and sauce.\n\nMany guests order both. Dip soy lightly — you’ll taste the fish, not just salt.',
        author: 'Chef, Watta Sushi',
      },
      nl: {
        category: 'Tips',
        dateDisplay: '12 mei 2026',
        title: 'Philadelphia of gebakken roll: wat past vandaag',
        excerpt: 'Koele klassieker of warme comfortrol.',
        content:
          'Klassiek? Philadelphia. Comfort? Gebakken roll met warme kaas.\n\nVeel gasten nemen beide. Soja met mate — zo proef je de vis.',
        author: 'Chef Watta Sushi',
      },
    },
  },
  {
    id: -205,
    slug: 'weekend-family-set',
    imageUrl: B5,
    createdAt: '2026-05-08T10:00:00.000Z',
    byLang: {
      uk: {
        category: 'Сімʼя',
        dateDisplay: '08.05.2026',
        title: 'Вихідні з дітьми: сімейний сет без зайвих клопотів',
        excerpt: 'Мікс класики та легких ролів — зручно на 3–4 особи.',
        content:
          'На компанію 3–4 людини візьміть мікс: Філадельфія, Каліфорнія, вегетаріанський рол і один гарячий. Діти часто обирають роли з огірком і авокадо — без гостроти.\n\nЗамовте на конкретний час — курʼєр приїде, коли всі вдома. Не треба мити рис і нарізати рибу: просто розкладіть коробки на стіл.',
        author: 'Команда Watta Sushi',
      },
      ru: {
        category: 'Семья',
        dateDisplay: '08.05.2026',
        title: 'Выходные с детьми: семейный сет',
        excerpt: 'Микс на 3–4 человека без хлопот.',
        content:
          'На 3–4: Филадельфия, Калифорния, вега-ролл, один горячий. Детям — с огурцом и авокадо.\n\nЗакажите ко времени — привезём, когда все дома.',
        author: 'Команда Watta Sushi',
      },
      en: {
        category: 'Family',
        dateDisplay: 'May 8, 2026',
        title: 'Weekend with kids: family set, zero fuss',
        excerpt: 'A mix for 3–4 people — classics plus mild rolls.',
        content:
          'Feeding 3–4? Mix Philadelphia, California, a veggie roll, and one baked. Kids often pick cucumber and avocado — no heat.\n\nSchedule delivery for when everyone’s home. No rice to wash — just open the boxes.',
        author: 'Watta Sushi team',
      },
      nl: {
        category: 'Familie',
        dateDisplay: '8 mei 2026',
        title: 'Weekend met kinderen: familiebox',
        excerpt: 'Mix voor 3–4 personen, zonder gedoe.',
        content:
          'Met 3–4 personen: Philadelphia, California, veggie roll, één warme. Kinderen kiezen vaak komkommer en avocado.\n\nBestel op tijd — bezorging als iedereen thuis is.',
        author: 'Team Watta Sushi',
      },
    },
  },
  {
    id: -206,
    slug: 'office-lunch-watta',
    imageUrl: B6,
    createdAt: '2026-05-01T10:00:00.000Z',
    byLang: {
      uk: {
        category: 'Офіс',
        dateDisplay: '01.05.2026',
        title: 'Обід в офіс: як замовити на команду',
        excerpt: 'Один великий заказ, різні смаки, чіткий час доставки.',
        content:
          'На 6–8 колег зручно 4–5 ролів різних видів і соуси на всіх. Залиште коментар з часом «до 13:00» — кухня підлаштує збірку.\n\nДля корпоративів і регулярних обідів напишіть нам через сторінку контактів — підберемо меню й знижку на обсяг.',
        author: 'Команда Watta Sushi',
      },
      ru: {
        category: 'Офис',
        dateDisplay: '01.05.2026',
        title: 'Обед в офис: заказ на команду',
        excerpt: 'Один заказ, разные вкусы, точное время.',
        content:
          'На 6–8 человек — 4–5 роллов и соусы. Укажите время в комментарии.\n\nДля корпоративов — контакты на сайте, подберём меню и скидку.',
        author: 'Команда Watta Sushi',
      },
      en: {
        category: 'Office',
        dateDisplay: 'May 1, 2026',
        title: 'Office lunch: ordering for the team',
        excerpt: 'One big order, varied flavours, precise timing.',
        content:
          'For 6–8 colleagues: 4–5 assorted rolls and shared sauces. Add a note like “by 1 pm” — the kitchen will time assembly.\n\nRegular office catering? Contact us — we’ll tailor the menu and volume pricing.',
        author: 'Watta Sushi team',
      },
      nl: {
        category: 'Kantoor',
        dateDisplay: '1 mei 2026',
        title: 'Kantoorlunch: bestellen voor het team',
        excerpt: 'Eén bestelling, verschillende smaken, op tijd.',
        content:
          'Voor 6–8 collega’s: 4–5 rolls en sauzen. Vermeld de tijd in de opmerking.\n\nVaste kantoorbezorging? Neem contact op — menu en volumekorting.',
        author: 'Team Watta Sushi',
      },
    },
  },
]

export function getFallbackBlogCards(lang: Language): FallbackBlogCard[] {
  return ROWS.map((row) => {
    const L = row.byLang[lang] || row.byLang.uk
    return {
      id: row.id,
      slug: row.slug,
      title: L.title,
      excerpt: L.excerpt,
      content: L.excerpt,
      imageUrl: row.imageUrl,
      author: L.author,
      category: L.category,
      dateDisplay: L.dateDisplay,
      createdAt: row.createdAt,
    }
  })
}

export function getFallbackBlogArticle(slug: string, lang: Language): FallbackBlogCard | null {
  const row = ROWS.find((r) => r.slug === slug)
  if (!row) return null
  const L = row.byLang[lang] || row.byLang.uk
  return {
    id: row.id,
    slug: row.slug,
    title: L.title,
    excerpt: L.excerpt,
    content: L.content,
    imageUrl: row.imageUrl,
    author: L.author,
    category: L.category,
    dateDisplay: L.dateDisplay,
    createdAt: row.createdAt,
  }
}

export function isFallbackBlogSlug(slug: string) {
  return ROWS.some((r) => r.slug === slug)
}

/** Для `USE_LOCAL_MOCK` — ті самі статті, що й у клієнтському fallback (українська версія). */
export function getMiddlewareMockBlogPosts() {
  return ROWS.map((row, i) => {
    const uk = row.byLang.uk
    const ru = row.byLang.ru
    const en = row.byLang.en
    const nl = row.byLang.nl
    return {
      id: i + 1,
      title: uk.title,
      slug: row.slug,
      content: uk.content,
      title_ua: uk.title,
      title_ru: ru.title,
      title_en: en.title,
      title_nl: nl.title,
      content_ua: uk.content,
      content_ru: ru.content,
      content_en: en.content,
      content_nl: nl.content,
      imageUrl: row.imageUrl,
      videoUrl: null as string | null,
      author: uk.author,
      isPublished: true,
      linkedProductIds: [] as number[],
      linkedCategoryIds: [] as number[],
      linkedIngredientIds: [] as number[],
      createdAt: row.createdAt,
      updatedAt: row.createdAt,
    }
  })
}
