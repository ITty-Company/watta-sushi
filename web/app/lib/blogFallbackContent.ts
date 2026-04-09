import type { Language } from '@/app/context/LanguageContext'

/** Fallback-статті блогу шефа, коли API порожній або запис не знайдено (за slug). */

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
    slug: 'choosing-fish-for-sushi',
    imageUrl: B1,
    createdAt: '2026-04-06T10:00:00.000Z',
    byLang: {
      uk: {
        category: 'З кухні',
        dateDisplay: '06.04.2026',
        title: 'Як обрати лосось для суші вдома',
        excerpt: 'Колір, запах, текстура — прості ознаки свіжого філе.',
        content:
          'Свіжий лосось має рівний колір без «сухих» країв, ледь відчутний запах моря (не аміак) і пружну текстуру. Зберігайте на льоду в холодильнику й використайте протягом 24 годин після покупки.\n\nУ Watta ми працюємо з постачальниками за графіком — вдома повторіть ті самі правила охолодження.',
        author: 'Шеф Watta Sushi',
      },
      ru: {
        category: 'С кухни',
        dateDisplay: '06.04.2026',
        title: 'Как выбрать лосось для суши дома',
        excerpt: 'Цвет, запах, текстура — признаки свежего филе.',
        content:
          'Свежий лосось ровного цвета, без «сухих» кромок, с лёгким запахом моря и упругой текстурой. Храните на льду и используйте в течение 24 часов.\n\nВ Watta поставки по графику — дома соблюдайте такой же холод.',
        author: 'Шеф Watta Sushi',
      },
      en: {
        category: 'Kitchen notes',
        dateDisplay: 'Apr 6, 2026',
        title: 'How to pick salmon for sushi at home',
        excerpt: 'Colour, smell, texture — quick freshness checks.',
        content:
          'Look for even colour, no dry edges, a faint ocean smell (not ammonia), and a firm bounce. Store on ice in the fridge and use within 24 hours.\n\nAt Watta we run scheduled deliveries — mirror the same cold discipline at home.',
        author: 'Chef, Watta Sushi',
      },
      nl: {
        category: 'Van de keuken',
        dateDisplay: '6 apr 2026',
        title: 'Zo kies je zalm voor sushi thuis',
        excerpt: 'Kleur, geur, structuur — vers in een oogopslag.',
        content:
          'Egaal kleur, geen droge randen, een zeezachte geur (geen ammoniak) en stevige textuur. Bewaar op ijs in de koelkast en gebruik binnen 24 uur.\n\nBij Watta werken we met vaste levermomenten — thuis dezelfde koude keten aanhouden.',
        author: 'Chef Watta Sushi',
      },
    },
  },
  {
    id: -202,
    slug: 'rice-vinegar-balance',
    imageUrl: B2,
    createdAt: '2026-04-04T10:00:00.000Z',
    byLang: {
      uk: {
        category: 'Рецепти',
        dateDisplay: '04.04.2026',
        title: 'Рис і оцет: баланс без «кислоти в лоб»',
        excerpt: 'Пропорції для домашніх експериментів і чому на кухні ми ваги не жаліємо.',
        content:
          'Класичний напрямок — трохи солі, цукру та рисового оцту на гарячий рис з легким охолодженням. Важливіше стабільність, ніж «рецепт бабусі»: краще зважувати партії, ніж гадати на око.\n\nУ ресторані ми фіксуємо параметри для кожної зміни.',
        author: 'Су-шеф Watta',
      },
      ru: {
        category: 'Рецепты',
        dateDisplay: '04.04.2026',
        title: 'Рис и уксус: баланс без кислоты',
        excerpt: 'Пропорции для дома и зачем на кухне весы.',
        content:
          'Соль, сахар и рисовый уксус в горячий рис с аккуратным охлаждением. Стабильность важнее «на глаз» — взвешивайте партии.\n\nУ нас параметры фиксируются на смену.',
        author: 'Су-шеф Watta',
      },
      en: {
        category: 'Recipes',
        dateDisplay: 'Apr 4, 2026',
        title: 'Rice & vinegar: balance without the punch',
        excerpt: 'Home ratios and why we weigh every batch.',
        content:
          'Salt, sugar, and rice vinegar folded into hot rice, then cooled gently. Consistency beats eyeballing — a scale saves the day.\n\nIn service we log numbers per shift so every roll tastes the same.',
        author: 'Sous chef, Watta Sushi',
      },
      nl: {
        category: 'Recepten',
        dateDisplay: '4 apr 2026',
        title: 'Rijst & azijn: balans zonder zuur overdreven',
        excerpt: 'Thuisverhoudingen en waarom we alles wegen.',
        content:
          'Zout, suiker en rijstazijn door hete rijst, daarna rustig afkoelen. Consistentie wint van gissen — een weegschaal helpt.\n\nIn de keuken loggen we per dienst.',
        author: 'Souschef Watta',
      },
    },
  },
  {
    id: -203,
    slug: 'nori-crisp-trick',
    imageUrl: B3,
    createdAt: '2026-04-01T10:00:00.000Z',
    byLang: {
      uk: {
        category: 'Поради',
        dateDisplay: '01.04.2026',
        title: 'Хрустке норі: маленький трюк перед згортанням',
        excerpt: 'Підсушування та волога з рису — про що варто пам’ятати.',
        content:
          'Злегка прогрійте лист норі над полум’ям або на сухій сковорідці кілька секунд — так він залишиться хрустким довше. Намагайтеся не класти гарячий рис на всю площу одразу: волога «б’є» по текстурі.',
        author: 'Шеф Watta Sushi',
      },
      ru: {
        category: 'Советы',
        dateDisplay: '01.04.2026',
        title: 'Хрустящее нори: трюк перед скруткой',
        excerpt: 'Просушка и влага от риса.',
        content:
          'Слегка прогрейте лист над огнём или на сухой сковороде — хруст дольше. Не кладите горячий рис на весь лист сразу.',
        author: 'Шеф Watta Sushi',
      },
      en: {
        category: 'Tips',
        dateDisplay: 'Apr 1, 2026',
        title: 'Crisp nori: a quick pre-roll trick',
        excerpt: 'Dry heat vs rice steam — what matters.',
        content:
          'Wave the sheet over flame or a dry pan for a few seconds; it stays snappier longer. Avoid dumping hot rice across the whole sheet at once — steam softens it fast.',
        author: 'Chef, Watta Sushi',
      },
      nl: {
        category: 'Tips',
        dateDisplay: '1 apr 2026',
        title: 'Krokant nori: truc vóór het rollen',
        excerpt: 'Droog hitte versus rijstdamp.',
        content:
          'Houd het vel even boven vuur of een droge pan — het blijft langer knapperig. Giet hete rijst niet in één keer over het hele vel.',
        author: 'Chef Watta Sushi',
      },
    },
  },
  {
    id: -204,
    slug: 'california-roll-at-home',
    imageUrl: B4,
    createdAt: '2026-03-28T10:00:00.000Z',
    byLang: {
      uk: {
        category: 'Рецепти',
        dateDisplay: '28.03.2026',
        title: 'Каліфорнія вдома за 30 хвилин',
        excerpt: 'Мінімум інструменту: килимок, гострий ніж і охолоджений рис.',
        content:
          'Наріжте овочі тонко, крем-сир злегка підсоліть, огірок без серцевини — менше води. Крутіть не надто туго: начинка «дихає», рол ріжеться чистіше.\n\nЗамовити готову Каліфорнію завжди можна у Watta — якщо часу зовсім немає.',
        author: 'Команда Watta',
      },
      ru: {
        category: 'Рецепты',
        dateDisplay: '28.03.2026',
        title: 'Калифорния дома за 30 минут',
        excerpt: 'Коврик, нож и охлаждённый рис.',
        content:
          'Овощи тонко, сыр слегка посолить, огурец без сердцевины. Не перетягивайте ролл — так чище режется.\n\nГотовую Калифорнию закажите в Watta, если времени ноль.',
        author: 'Команда Watta',
      },
      en: {
        category: 'Recipes',
        dateDisplay: 'Mar 28, 2026',
        title: 'California roll at home in 30 minutes',
        excerpt: 'Mat, sharp knife, cooled rice — that’s the core kit.',
        content:
          'Slice veg thin, season cream cheese lightly, core cucumbers for less water. Don’t torque the roll — fillings need a little air for clean cuts.\n\nNo time? Order California from Watta instead.',
        author: 'Watta team',
      },
      nl: {
        category: 'Recepten',
        dateDisplay: '28 mrt 2026',
        title: 'California roll thuis in 30 minuten',
        excerpt: 'Mat, scherp mes, afgekoelde rijst.',
        content:
          'Groente dun snijden, roomkaas licht zouten, komkommer ontkernen. Niet te strak rollen — zo snijd je schoner.\n\nGeen tijd? Bestel California bij Watta.',
        author: 'Team Watta',
      },
    },
  },
  {
    id: -205,
    slug: 'wasabi-and-ginger-why',
    imageUrl: B5,
    createdAt: '2026-03-22T10:00:00.000Z',
    byLang: {
      uk: {
        category: 'Культура їжі',
        dateDisplay: '22.03.2026',
        title: 'Васабі та імбир: навіщо вони поруч',
        excerpt: 'Не «для гостроти на всю страву», а для очищення смаку між шматочками.',
        content:
          'Імбир — палітр-клінер між різними ролами. Васабі краще додавати краплею на шматочок, а не змішувати з соєю в ємності — так ви чуєте рибу, а не один солоно-гострий шар.',
        author: 'Шеф Watta Sushi',
      },
      ru: {
        category: 'Культура еды',
        dateDisplay: '22.03.2026',
        title: 'Васаби и имбирь: зачем рядом',
        excerpt: 'Палитра между кусочками, не «всё обмазать».',
        content:
          'Имбирь чистит вкус между роллами. Васаби — капля на кусочек, не каша в соевом соусе.',
        author: 'Шеф Watta Sushi',
      },
      en: {
        category: 'Food culture',
        dateDisplay: 'Mar 22, 2026',
        title: 'Wasabi & ginger: why they sit together',
        excerpt: 'Palate resets, not a heat contest.',
        content:
          'Pickled ginger clears your palate between different rolls. Dot wasabi on the piece, don’t mash it into a soy puddle — you’ll actually taste the fish.',
        author: 'Chef, Watta Sushi',
      },
      nl: {
        category: 'Eetcultuur',
        dateDisplay: '22 mrt 2026',
        title: 'Wasabi & gember: waarom samen',
        excerpt: 'Palate reset, geen hete-soep-effect.',
        content:
          'Gember reset je smaak tussen verschillende rollen. Wasabi druppels op het stuk, niet roeren in een sojabaaltje.',
        author: 'Chef Watta Sushi',
      },
    },
  },
  {
    id: -206,
    slug: 'knife-care-for-sushi',
    imageUrl: B6,
    createdAt: '2026-03-15T10:00:00.000Z',
    byLang: {
      uk: {
        category: 'Інструмент',
        dateDisplay: '15.03.2026',
        title: 'Ніж для суші: догляд, який економить нерви',
        excerpt: 'Камінь, кут і чому «не ріжте заморожене».',
        content:
          'Тримайте кут 15–20°, використовуйте камінь із правильною зернистістю і не кладіть ніж у посудомийку. Заморожене філе ріжеться криво й тупить сталь швидше — спочатку правильна розморозка.',
        author: 'Су-шеф Watta',
      },
      ru: {
        category: 'Инструмент',
        dateDisplay: '15.03.2026',
        title: 'Нож для суши: уход без нервов',
        excerpt: 'Камень, угол, не резать заморозку.',
        content:
          'Угол 15–20°, камень нужной зернистости, не в ПММ. Заморозка рвет фактуру и тупит сталь — сначала разморозка.',
        author: 'Су-шеф Watta',
      },
      en: {
        category: 'Gear',
        dateDisplay: 'Mar 15, 2026',
        title: 'Sushi knife care that saves your sanity',
        excerpt: 'Stone grit, angle, and why frozen fish cheats the edge.',
        content:
          'Hold 15–20°, pick the right stone grit, never dishwasher. Cutting semi-frozen fish chips the edge — thaw properly first.',
        author: 'Sous chef, Watta Sushi',
      },
      nl: {
        category: 'Gereedschap',
        dateDisplay: '15 mrt 2026',
        title: 'Sushimes onderhoud zonder stress',
        excerpt: 'Steen, hoek, niet bevroren snijden.',
        content:
          '15–20° slijphoek, juiste korrel, niet in de vaatwasser. Bevroren vis breekt de snede — eerst ontdooien.',
        author: 'Souschef Watta',
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
    const L = row.byLang.uk
    return {
      id: i + 1,
      title: L.title,
      slug: row.slug,
      content: L.content,
      imageUrl: row.imageUrl,
      videoUrl: null as string | null,
      author: L.author,
      isPublished: true,
      createdAt: row.createdAt,
      updatedAt: row.createdAt,
    }
  })
}
