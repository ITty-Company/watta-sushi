/** Тексти сторінки публічного договору (оферти) — усі мови сайту. */

export type PublicOfferBlock = {
  id: string
  title: string
  paragraphs: readonly string[]
  bullets?: readonly string[]
}

export type PublicOfferTerm = {
  term: string
  definition: string
}

export type PublicOfferPageContent = {
  title: string
  updated: string
  heroKicker: string
  heroSubtitle: string
  heroBadge: string
  tocTitle: string
  termsTitle: string
  terms: readonly PublicOfferTerm[]
  blocks: readonly PublicOfferBlock[]
  sellerTitle: string
  sellerLines: readonly string[]
  sellerEmailLabel: string
  sellerEmail: string
  legalCredit: string
  contactTitle: string
  contactBody: string
}

const SITE = 'wattasushi.com.ua'
const BRAND = 'Watta Sushi'
const CONTACT_EMAIL = 'info@wattasushi.com'
const KITCHEN_ADDRESS = 'Amstelveenseweg 192, 1075 XR Amsterdam, Netherlands'
const PHONE = '+31 649 326 549'

const personalDataBlockUk: PublicOfferBlock = {
  id: 'personal-data',
  title: '9. Персональні дані',
  paragraphs: [
    '9.1. Обробка персональних даних Покупця під час використання Сайту та оформлення замовлень регулюється окремим документом — Політикою конфіденційності.',
    '9.2. Оформлюючи замовлення або створюючи обліковий запис, Покупець підтверджує ознайомлення з Політикою конфіденційності та погодження на обробку даних у межах, описаних у ній.',
    '9.3. Цей Публічний договор визначає умови купівлі-продажу та доставки. Політика конфіденційності — окремий юридичний документ про захист персональних даних; це не один і той самий документ.',
  ],
}

const personalDataBlockRu: PublicOfferBlock = {
  id: 'personal-data',
  title: '9. Персональные данные',
  paragraphs: [
    '9.1. Обработка персональных данных Покупателя при использовании Сайта и оформлении заказов регулируется отдельным документом — Политикой конфиденциальности.',
    '9.2. Оформляя заказ или создавая учётную запись, Покупатель подтверждает ознакомление с Политикой конфиденциальности и согласие на обработку данных в объёме, описанном в ней.',
    '9.3. Настоящий Публичный договор определяет условия купли-продажи и доставки. Политика конфиденциальности — отдельный юридический документ о защите персональных данных; это не один и тот же документ.',
  ],
}

const personalDataBlockEn: PublicOfferBlock = {
  id: 'personal-data',
  title: '9. Personal data',
  paragraphs: [
    '9.1. Processing of the Buyer’s personal data when using the Site and placing orders is governed by a separate document — the Privacy Policy.',
    '9.2. By placing an order or creating an account, the Buyer confirms they have read the Privacy Policy and agree to data processing as described there.',
    '9.3. This Public agreement sets out purchase and delivery terms. The Privacy Policy is a separate legal document on personal data protection; they are not the same document.',
  ],
}

const personalDataBlockNl: PublicOfferBlock = {
  id: 'personal-data',
  title: '9. Persoonsgegevens',
  paragraphs: [
    '9.1. Verwerking van persoonsgegevens van de Koper bij gebruik van de Site en het plaatsen van bestellingen valt onder een apart document — het Privacybeleid.',
    '9.2. Door een bestelling te plaatsen of een account aan te maken bevestigt de Koper kennis te hebben genomen van het Privacybeleid en stemt hij in met gegevensverwerking zoals daarin beschreven.',
    '9.3. Deze publieke offerte regelt koop- en bezorgvoorwaarden. Het Privacybeleid is een apart juridisch document over bescherming van persoonsgegevens; het zijn niet dezelfde documenten.',
  ],
}

export const publicOfferPageUk: PublicOfferPageContent = {
  title: 'Публічний договір',
  updated: 'Редакція від 21 квітня 2026 року',
  heroKicker: BRAND,
  heroSubtitle: 'Умови замовлення, оплати та доставки — прозоро та зрозуміло.',
  heroBadge: 'Замовлення онлайн',
  tocTitle: 'Зміст',
  termsTitle: 'Терміни',
  terms: [
    {
      term: 'Договір',
      definition: 'публічний договір на використання послуг Сайту та купівлю-продаж товарів',
    },
    {
      term: 'Сайт',
      definition: `вебсайт з доменним ім’ям ${SITE} та пов’язані з ним мобільні сторінки`,
    },
    {
      term: 'Продавець',
      definition: `оператор сервісу ${BRAND} — суб’єкт господарювання, що діє під брендом ${BRAND}, приймає замовлення через Сайт. Адреса кухні: ${KITCHEN_ADDRESS}. Телефон: ${PHONE}.`,
    },
    {
      term: 'Покупець',
      definition:
        'дієздатна фізична особа, відвідувач Сайту, що обрала щонайменше один товар і здійснила його замовлення',
    },
  ],
  blocks: [
    {
      id: 'general',
      title: '1. Загальні положення',
      paragraphs: [
        '1.1. Цей документ визначає істотні умови купівлі-продажу та є формальною пропозицією укласти публічний договір.',
        '1.2. Починаючи використовувати Сайт і здійснюючи вибір та замовлення товару, ви (Покупець) погоджуєтесь з усіма умовами Договору без повних або часткових вилучень. Це право є персональним і не може бути передано іншим особам.',
        '1.3. Продавець може змінювати умови Договору в будь-який час і зазначати дату редакції. Нова редакція набирає чинності з дати публікації, якщо інше не буде зазначено в Договорі.',
        '1.4. Оскільки зміни можуть бути внесені між відвідуваннями Сайту, Покупець зобов’язується самостійно перевіряти умови Договору перед здійсненням замовлення.',
        '1.5. Відвідувачі Сайту та Покупці користуються Сайтом виключно під власну відповідальність. Сайт може бути частково або повністю недоступним у разі технічних робіт або з інших причин без попереднього попередження.',
        '1.6. Продавець має право на відступлення (або інший спосіб передачі своїх прав та обов’язків) третім особам.',
        '1.7. У разі проведення акцій або інших заходів з просування товарів Продавець має право встановлювати спеціальні положення. Такі умови є невід’ємною частиною Договору для учасників акції.',
      ],
    },
    {
      id: 'product',
      title: '2. Товар',
      paragraphs: [
        '2.1. На Сайті зазначається основна інформація про товар та фотографії.',
        '2.2. Фотографії є ілюстраціями до товару та можуть відрізнятися від фактичного зовнішнього вигляду.',
        '2.3. Опис на Сайті може містити помилки; Продавець надає актуальну інформацію за запитом Покупця. Якщо помилка суттєво впливає на замовлення, Покупець може змінити або скасувати його після перевірки.',
        '2.4. Продавець має право змінити опис, ціну або вилучити товар з продажу. Якщо сплачений товар вилучено, Продавець відшкодовує повну сплачену суму за не поставлений товар.',
        '2.5. Інформація про асортимент, у тому числі алкогольну продукцію, розміщується для інформування Покупця та не є рекламою алкоголю в розумінні спеціальних вимог до такої реклами.',
      ],
    },
    {
      id: 'order',
      title: '3. Замовлення',
      paragraphs: [
        '3.1. Покупець може оформити запит на придбання і доставку товару, який є в наявності й представлений на Сайті — телефоном або через інтернет.',
        '3.2. Замовлення телефоном: Покупець вказує товари, кількість, контактні дані, адресу доставки та спосіб оплати.',
        '3.3. Замовлення через «Кошик»: Покупець самостійно перевіряє вибір, заповнює дані, адресу та спосіб оплати.',
        '3.4. Покупець несе відповідальність за неправдиві або помилкові відомості, що унеможливлюють виконання зобов’язань Продавцем.',
        '3.5. Підтверджуючи замовлення, Покупець засвідчує отримання інформації про Продавця, характеристики товару, ціну, доставку, оплату, гарантії та порядок розірвання договору.',
        '3.6. При зміні ціни або асортименту Продавець зв’язується з Покупцем для підтвердження або скасування. За відсутності зв’язку замовлення може вважатися скасованим.',
        '3.7. Продавець може відмовитися від оформлення, якщо Покупець раніше відмовлявся від товару з причин, не пов’язаних з якістю.',
        '3.8. Продавець може скасувати замовлення через форс-мажор або інші обставини. Сплачені кошти повертаються повністю.',
      ],
    },
    {
      id: 'payment',
      title: '4. Оплата',
      paragraphs: [
        '4.1. Ціна товару на Сайті вказується у євро (€), якщо інше не зазначено біля позиції.',
        '4.2. Ціна не містить комісій банків і платіжних систем — їх сплачує Покупець самостійно.',
        '4.3. Ціна діє на момент оплати й може бути змінена Продавцем на умовах Договору. При розбіжності Продавець узгоджує оновлену ціну або скасовує замовлення.',
        '4.4. Онлайн-оплата здійснюється через захищені платіжні сервіси (Visa, Mastercard, iDEAL, Apple Pay, Google Pay тощо). Оплата регулюється правилами платіжних систем і банку-емітента картки.',
        '4.5. Продавець не зберігає повні реквізити банківських карток. У разі помилок або відмов у оплаті звертайтеся до банку або платіжного сервісу.',
        '4.6. Будь-яка оплата з використанням персональних даних та платіжних засобів Покупця вважається здійсненою самим Покупцем.',
      ],
    },
    {
      id: 'delivery',
      title: '5. Доставка',
      paragraphs: [
        '5.1. Доставка здійснюється відповідно до зони, зазначеної на Сайті.',
        '5.2. Дата, час і адреса узгоджуються при оформленні; представник Продавця може уточнити деталі.',
        '5.3. Покупець забезпечує точну адресу та доступ для кур’єра.',
        '5.4. Товар вручається Покупцю або особі за адресою, яка може підтвердити замовлення та оплатити товар, якщо він не був сплачений заздалегідь.',
        '5.5. Ризик випадкового пошкодження переходить до Покупця в момент отримання. Розбіжності фіксуються при передачі.',
        '5.6. Алкогольні напої доставляються лише особам старше 18 років за наявності документа, що підтверджує вік. Без документа товар не передається, його вартість віднімається від замовлення.',
        '5.7. При замовленні алкоголю Покупець погоджується відмовитися від усього переліку алкогольних напоїв, а не їх частини.',
      ],
    },
    {
      id: 'refund',
      title: '6. Повернення оплати',
      paragraphs: [
        '6.1. Покупець має право відмовитися від товару та розірвати Договір протягом 14 календарних днів з дати отримання, крім товарів, що не підлягають поверненню згідно із застосовним законодавством (зокрема швидкопсувні продовольчі товари).',
        '6.2. Алкогольні напої належної якості після оплати поверненню не підлягають, якщо інше не передбачено законом.',
        '6.3. При виявленні недоліків до передачі товару Покупець може вимагати усунення або заміни.',
        '6.4. Повернення коштів за онлайн-оплату здійснюється через платіжні системи за їхніми правилами.',
        '6.5. При односторонній відмові передплачені кошти повертаються тим же способом, що й оплата, не пізніше 30 днів з дати запиту.',
      ],
    },
    {
      id: 'ip',
      title: '7. Інтелектуальна власність',
      paragraphs: [
        '7.1. Авторські права на фотографії, текст, дизайн Сайту належать власнику Сайту та іншим правовласникам за їхньою згодою.',
        `7.2. Торговельні марки, логотип і назва ${BRAND} належать відповідним правовласникам.`,
        '7.3. Треті особи не мають права копіювати, поширювати або використовувати матеріали Сайту без дозволу правовласника.',
        '7.4. Будь-яке несанкціоноване використання є порушенням законодавства про інтелектуальну власність.',
      ],
    },
    {
      id: 'disputes',
      title: '8. Вирішення спорів',
      paragraphs: [
        '8.1. Якщо товар неможливо доставити, Продавець анулює замовлення і повідомляє Покупця. Можливе узгодження нових умов.',
        '8.2. Кур’єр не уповноважений приймати претензії щодо якості чи кількості. Претензії надсилайте через розділ «Контакти» або на email Продавця.',
      ],
    },
    personalDataBlockUk,
  ],
  sellerTitle: '10. Дані продавця',
  sellerLines: [
    `Оператор сервісу ${BRAND}`,
    `Сайт: ${SITE}`,
    `Адреса кухні: ${KITCHEN_ADDRESS}`,
    `Телефон: ${PHONE}`,
  ],
  sellerEmailLabel: 'Електронна пошта',
  sellerEmail: CONTACT_EMAIL,
  legalCredit: 'Юридична підтримка: Mentors Law Firm',
  contactTitle: 'Питання щодо договору',
  contactBody:
    'Запити щодо умов договору, замовлень або претензій надсилайте через сторінку «Контакти» або на email нижче. Вкажіть номер замовлення, якщо він є.',
}

export const publicOfferPageRu: PublicOfferPageContent = {
  ...publicOfferPageUk,
  title: 'Публичный договор',
  updated: 'Редакция от 21 апреля 2026 года',
  heroSubtitle: 'Условия заказа, оплаты и доставки — прозрачно и понятно.',
  heroBadge: 'Заказ онлайн',
  tocTitle: 'Содержание',
  termsTitle: 'Термины',
  terms: [
    { term: 'Договор', definition: 'публичный договор на использование услуг Сайта и куплю-продажу товаров' },
    { term: 'Сайт', definition: `веб-сайт с доменным именем ${SITE} и связанные мобильные страницы` },
    {
      term: 'Продавец',
      definition: `оператор сервиса ${BRAND} — субъект хозяйствования под брендом ${BRAND}, принимающий заказы через Сайт. Адрес кухни: ${KITCHEN_ADDRESS}. Телефон: ${PHONE}.`,
    },
    {
      term: 'Покупатель',
      definition:
        'дееспособное физическое лицо, посетитель Сайта, выбравшее хотя бы один товар и оформившее заказ',
    },
  ],
  blocks: [
    ...publicOfferPageUk.blocks.slice(0, -1).map((b) => ({
      ...b,
      title: b.title
        .replace('Загальні', 'Общие')
        .replace('Товар', 'Товар')
        .replace('Замовлення', 'Заказ')
        .replace('Оплата', 'Оплата')
        .replace('Доставка', 'Доставка')
        .replace('Повернення', 'Возврат')
        .replace('Інтелектуальна', 'Интеллектуальная')
        .replace('Вирішення', 'Разрешение'),
      paragraphs: b.paragraphs.map((p) =>
        p
          .replace(/Покупець/g, 'Покупатель')
          .replace(/Продавець/g, 'Продавец')
          .replace(/Сайт/g, 'Сайт')
          .replace(/Договор/g, 'Договор')
          .replace(/замовлення/g, 'заказ')
          .replace(/Замовлення/g, 'Заказ')
          .replace(/гривнях/g, 'евро (€)')
          .replace(/Кошик/g, 'Корзина')
          .replace(/Контакти/g, 'Контакты')
          .replace(/Профіль/g, 'Профиль'),
      ),
    })),
    personalDataBlockRu,
  ],
  sellerTitle: '10. Данные продавца',
  sellerLines: [
    `Оператор сервиса ${BRAND}`,
    `Сайт: ${SITE}`,
    `Адрес кухни: ${KITCHEN_ADDRESS}`,
    `Телефон: ${PHONE}`,
  ],
  sellerEmailLabel: 'Электронная почта',
  legalCredit: 'Юридическая поддержка: Mentors Law Firm',
  contactTitle: 'Вопросы по договору',
  contactBody:
    'Запросы по условиям договора, заказам или претензиям отправляйте через страницу «Контакты» или на email ниже. Укажите номер заказа, если он есть.',
}

const publicOfferBlocksEn: PublicOfferBlock[] = publicOfferPageUk.blocks.slice(0, -1).map((b, i) => ({
  ...b,
  title: [
    '1. General provisions',
    '2. Products',
    '3. Orders',
    '4. Payment',
    '5. Delivery',
    '6. Refunds',
    '7. Intellectual property',
    '8. Dispute resolution',
  ][i]!,
  paragraphs: b.paragraphs.map((p) =>
    p
      .replace(/Покупець/g, 'Buyer')
      .replace(/Продавець/g, 'Seller')
      .replace(/Сайт/g, 'Site')
      .replace(/Договор/g, 'Agreement')
      .replace(/замовлення/g, 'order')
      .replace(/Замовлення/g, 'Order')
      .replace(/євро \(€\)/g, 'euros (€)')
      .replace(/«Кошик»/g, 'Cart')
      .replace(/«Контакти»/g, 'Contacts')
      .replace(/«Профіль»/g, 'Profile')
      .replace(/Політики конфіденційності/g, 'Privacy Policy')
      .replace(/кухні/g, 'kitchen')
      .replace(/кур’єр/g, 'courier')
      .replace(/кур'єр/g, 'courier'),
  ),
}))

const publicOfferBlocksNl: PublicOfferBlock[] = publicOfferPageUk.blocks.slice(0, -1).map((b, i) => ({
  ...b,
  title: [
    '1. Algemene bepalingen',
    '2. Producten',
    '3. Bestellingen',
    '4. Betaling',
    '5. Bezorging',
    '6. Terugbetaling',
    '7. Intellectueel eigendom',
    '8. Geschillen',
  ][i]!,
}))

export const publicOfferPageEn: PublicOfferPageContent = {
  title: 'Public agreement',
  updated: 'Revision of 21 April 2026',
  heroKicker: BRAND,
  heroSubtitle: 'Ordering, payment, and delivery terms — clear and transparent.',
  heroBadge: 'Online orders',
  tocTitle: 'Contents',
  termsTitle: 'Definitions',
  terms: [
    { term: 'Agreement', definition: 'public offer to use the Site and purchase goods' },
    { term: 'Site', definition: `the website at ${SITE} and related mobile pages` },
    {
      term: 'Seller',
      definition: `the ${BRAND} service operator trading under the ${BRAND} brand and accepting orders via the Site. Kitchen address: ${KITCHEN_ADDRESS}. Phone: ${PHONE}.`,
    },
    {
      term: 'Buyer',
      definition: 'a capable individual visitor who selects at least one product and places an order',
    },
  ],
  blocks: [...publicOfferBlocksEn, personalDataBlockEn],
  sellerTitle: '10. Seller details',
  sellerLines: [
    `${BRAND} service operator`,
    `Site: ${SITE}`,
    `Kitchen address: ${KITCHEN_ADDRESS}`,
    `Phone: ${PHONE}`,
  ],
  sellerEmailLabel: 'Email',
  sellerEmail: CONTACT_EMAIL,
  legalCredit: 'Legal support: Mentors Law Firm',
  contactTitle: 'Questions about this agreement',
  contactBody:
    'For questions about this agreement, orders, or claims, use the Contacts page or the email below. Include your order number if available.',
}

export const publicOfferPageNl: PublicOfferPageContent = {
  title: 'Publieke aanbieding (offerte)',
  updated: 'Revisie van 21 april 2026',
  heroKicker: BRAND,
  heroSubtitle: 'Bestellen, betalen en bezorgen — helder en transparant.',
  heroBadge: 'Online bestellen',
  tocTitle: 'Inhoud',
  termsTitle: 'Begrippen',
  terms: [
    { term: 'Overeenkomst', definition: 'publieke offerte voor gebruik van de Site en aankoop van producten' },
    { term: 'Site', definition: `de website ${SITE} en gerelateerde mobiele pagina’s` },
    {
      term: 'Verkoper',
      definition: `de exploitant van ${BRAND} onder het merk ${BRAND}, die bestellingen via de Site accepteert. Keukenadres: ${KITCHEN_ADDRESS}. Telefoon: ${PHONE}.`,
    },
    {
      term: 'Koper',
      definition: 'een handelingsbekwame bezoeker die minstens één product kiest en een bestelling plaatst',
    },
  ],
  blocks: [...publicOfferBlocksNl, personalDataBlockNl],
  sellerTitle: '10. Gegevens verkoper',
  sellerLines: [
    `Exploitant ${BRAND}`,
    `Site: ${SITE}`,
    `Keukenadres: ${KITCHEN_ADDRESS}`,
    `Telefoon: ${PHONE}`,
  ],
  sellerEmailLabel: 'E-mail',
  sellerEmail: CONTACT_EMAIL,
  legalCredit: 'Juridische ondersteuning: Mentors Law Firm',
  contactTitle: 'Vragen over de overeenkomst',
  contactBody:
    'Voor vragen over de offerte, bestellingen of klachten: gebruik de pagina Contacten of het e-mailadres hieronder. Vermeld uw bestelnummer indien beschikbaar.',
}

export const publicOfferPageByLang = {
  uk: publicOfferPageUk,
  ru: publicOfferPageRu,
  en: publicOfferPageEn,
  nl: publicOfferPageNl,
} as const
