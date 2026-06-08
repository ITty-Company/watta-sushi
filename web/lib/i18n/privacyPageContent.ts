/** Тексти сторінки політики конфіденційності (усі мови сайту). */

export type PrivacyPolicyBlock = {
  id: string
  title: string
  paragraphs: readonly string[]
  bullets?: readonly string[]
}

export type PrivacyPageContent = {
  title: string
  back: string
  updated: string
  heroKicker: string
  heroSubtitle: string
  heroBadge: string
  contentTitle: string
  contentSubtitle: string
  tocTitle: string
  rightsTitle: string
  rightsIntro: string
  rightsItems: readonly string[]
  contactTitle: string
  contactBody: string
  blocks: readonly PrivacyPolicyBlock[]
}

export const privacyPageRu: PrivacyPageContent = {
  title: 'Политика конфиденциальности',
  back: 'Назад',
  updated: 'Последнее обновление: 1 мая 2026',
  heroKicker: 'Watta Sushi',
  heroSubtitle:
    'Ваши данные — только для заказа, сервиса и связи с вами.',
  heroBadge: 'GDPR · Прозрачность',
  contentTitle: 'Полный текст политики',
  contentSubtitle: 'Разделы можно открыть по ссылкам слева или пролистать страницу.',
  tocTitle: 'Содержание',
  rightsTitle: 'Ваши права в кратком виде',
  rightsIntro:
    'Вы можете воспользоваться правами в любой момент — напишите нам через раздел «Контакты» или на email, указанный там. Мы ответим в сроки, установленные законом (как правило, до 30 дней).',
  rightsItems: [
    'Право на доступ к своим данным и копию обработки',
    'Право на исправление неточных или неполных данных',
    'Право на удаление («право быть забытым»), если нет законных оснований хранить',
    'Право ограничить обработку в определённых случаях',
    'Право на переносимость данных в структурированном формате',
    'Право возразить против обработки, в том числе в маркетинговых целях',
    'Право отозвать согласие — без влияния на законность обработки до отзыва',
    'Право подать жалобу в надзорный орган по защите данных в вашей стране',
  ],
  contactTitle: 'Вопросы по конфиденциальности',
  contactBody:
    'По запросам о персональных данных, удалении аккаунта или уточнении политики обращайтесь через страницу «Контакты» на сайте или по контактам, указанным в подвале. Укажите тему «Конфиденциальность» и email, с которым оформляли заказы — так мы быстрее найдём ваши данные.',
  blocks: [
    {
      id: 'controller',
      title: '1. Контролёр персональных данных',
      paragraphs: [
        'Контролёром (лицом, определяющим цели и способы обработки) является оператор сервиса Watta Sushi — юридическое лицо / предприниматель, осуществляющий деятельность под брендом Watta Sushi и принимающий заказы через данный веб-сайт.',
        'Контактные данные для вопросов о конфиденциальности, реализации прав субъекта данных и жалоб: раздел «Контакты» на сайте, телефон и электронная почта, указанные в подвале и на странице контактов.',
      ],
    },
    {
      id: 'scope',
      title: '2. Область применения',
      paragraphs: [
        'Политика распространяется на всех посетителей сайта, зарегистрированных пользователей, клиентов, оформляющих заказы, а также лиц, направляющих сообщения через формы обратной связи, чат или мессенджеры, указанные на сайте.',
        'Политика не заменяет Публичный договор (условия заказа, оплаты и доставки), но дополняет их в части персональных данных. Условия купли-продажи изложены в отдельном документе «Публичный договор». Отдельные услуги третьих лиц (платёжные системы, карты, внешние ссылки) могут иметь собственные политики — ознакомьтесь с ними отдельно.',
      ],
    },
    {
      id: 'data',
      title: '3. Какие персональные данные мы обрабатываем',
      paragraphs: ['В зависимости от ваших действий мы можем обрабатывать следующие категории данных:'],
      bullets: [
        'Идентификационные: имя, фамилия (если указаны), никнейм в аккаунте',
        'Контактные: номер телефона, адрес электронной почты',
        'Адресные: адрес доставки, этаж, домофон, комментарии курьеру, город и зона доставки',
        'Заказ и оплата: состав заказа, сумма, способ оплаты, статус, история заказов, промокоды',
        'Учётная запись: хэш пароля (пароль в открытом виде не храним), дата регистрации, избранное, настройки языка',
        'Коммуникации: текст обращений в поддержку, отзывы, оценки, переписка по заказу',
        'Технические: IP-адрес, тип устройства и браузера, язык интерфейса, файлы cookie, идентификаторы сессии, данные журналов сервера',
        'Маркетинг (при согласии): подписка на рассылку, история открытий и отписок',
      ],
    },
    {
      id: 'sources',
      title: '4. Источники данных',
      paragraphs: [
        'Данные поступают непосредственно от вас при заполнении форм, оформлении заказа, регистрации или переписке; автоматически — при использовании сайта (технические и cookie-данные); а также от платёжных и логистических партнёров в объёме, необходимом для исполнения заказа (например, статус оплаты или доставки).',
        'Предоставление контактных и адресных данных для доставки необходимо для заключения и исполнения договора купли-продажи / оказания услуги доставки. Отказ от обязательных полей может сделать оформление заказа невозможным.',
      ],
    },
    {
      id: 'purposes',
      title: '5. Цели и правовые основания обработки',
      paragraphs: ['Мы обрабатываем данные только при наличии законного основания по ст. 6 GDPR:'],
      bullets: [
        'Исполнение договора — приём, приготовление, передача курьеру, доставка или самовывоз, уведомления о статусе заказа',
        'Законный интерес — безопасность сайта, предотвращение мошенничества, улучшение сервиса, внутренняя отчётность в обезличенном виде',
        'Согласие — маркетинговые email/SMS/push, необязательные cookie аналитики, где требуется согласие',
        'Юридическая обязанность — бухгалтерский и налоговый учёт, ответы государственным органам в пределах закона',
      ],
    },
    {
      id: 'orders',
      title: '6. Заказы, аккаунт и уведомления',
      paragraphs: [
        'При оформлении заказа без регистрации мы используем указанные телефон и адрес для связи и доставки; история может быть привязана к номеру телефона или email при повторных заказах.',
        'Зарегистрированный аккаунт позволяет хранить адреса, избранное и историю заказов. Вы можете запросить удаление аккаунта — персональные данные будут удалены или обезличены, если иное не требуется законом (например, хранение данных о транзакциях).',
        'Уведомления о статусе заказа (подтверждение, готовность, в пути) отправляются по каналам, которые вы используете при заказе (сайт, SMS, мессенджеры — в зависимости от настроек сервиса).',
      ],
    },
    {
      id: 'cookies',
      title: '7. Файлы cookie и локальное хранилище',
      paragraphs: [
        'Сайт использует cookie и аналогичные технологии (localStorage) для работы корзины, сохранения языка интерфейса, сессии авторизации и, при вашем согласии, аналитики посещаемости.',
        'Строго необходимые cookie работают без отдельного согласия, так как без них сайт не может функционировать. Аналитические и маркетинговые cookie (если применяются) включаются только при наличии согласия или настроек браузера.',
        'Вы можете удалить cookie и ограничить их в настройках браузера; часть функций (корзина, вход в аккаунт) может перестать работать корректно.',
      ],
    },
    {
      id: 'marketing',
      title: '8. Рассылки и маркетинг',
      paragraphs: [
        'Рекламные и информационные сообщения (акции, новинки меню) мы отправляем только при наличии вашего согласия или в рамках законного soft opt-in, где это допускается местным правом.',
        'В каждом письме или сообщении доступна отписка (ссылка «Отписаться» или аналог). Отзыв согласия не влияет на законность обработки до момента отзыва.',
      ],
    },
    {
      id: 'sharing',
      title: '9. Передача данных третьим лицам',
      paragraphs: [
        'Мы не продаём персональные данные. Передача возможна только получателям, которые помогают нам оказывать услугу, и только в нужном объёме:',
        'С такими получателями заключаются договоры обработки данных (DPA) или применяются стандартные договорные положения, где это требуется.',
      ],
      bullets: [
        'Платёжные провайдеры — для приёма оплаты картой или другими способами',
        'Курьерские и логистические службы — имя, телефон, адрес и комментарии к заказу',
        'Хостинг, CDN, email- и SMS-сервисы — техническая инфраструктура и доставка уведомлений',
        'Профессиональные консультанты — по обязательству конфиденциальности, если требуется по закону',
      ],
    },
    {
      id: 'transfers',
      title: '10. Международная передача',
      paragraphs: [
        'Серверы и подрядчики могут находиться в странах ЕЭЗ или за её пределами. При передаче за пределы ЕЭЗ мы обеспечиваем надлежащие гарантии: решение Европейской комиссии о достаточности, стандартные договорные положения (SCC) или иные механизмы, предусмотренные GDPR.',
      ],
    },
    {
      id: 'retention',
      title: '11. Сроки хранения',
      paragraphs: [
        'Данные заказов и расчётов хранятся столько, сколько требует бухгалтерское и налоговое законодательство (как правило, от нескольких лет в зависимости от юрисдикции).',
        'Данные аккаунта — до удаления аккаунта по вашему запросу или длительной неактивности с предварительным уведомлением, если применимо.',
        'Технические логи и cookie — в пределах сроков, указанных в настройках сервиса или браузера, обычно от нескольких дней до 24 месяцев для аналитики.',
        'Обращения в поддержку — до разрешения вопроса и разумного срока для истории качества сервиса, если вы не просите удалить раньше.',
      ],
    },
    {
      id: 'security',
      title: '12. Безопасность данных',
      paragraphs: [
        'Мы применяем организационные и технические меры: шифрование передачи (HTTPS/TLS), ограничение доступа сотрудников по ролям, резервное копирование, мониторинг инцидентов.',
        'Ни один метод передачи в интернете не гарантирует 100% безопасности; при подозрении на утечку, затрагивающую ваши права, мы уведомим вас и надзорный орган в сроки, установленные законом.',
      ],
    },
    {
      id: 'rights-detail',
      title: '13. Подробно о ваших правах',
      paragraphs: [
        'Вы вправе запросить подтверждение обработки, копию данных, исправление, удаление, ограничение, перенос данных и возражение. Для маркетинга достаточно отписаться от рассылки.',
        'Мы можем запросить подтверждение личности, чтобы не раскрыть данные третьим лицам. Если отказ обоснован законом (например, обязательное хранение счёта), мы объясним причину.',
      ],
    },
    {
      id: 'children',
      title: '14. Дети',
      paragraphs: [
        'Сервис не предназначен для лиц младше 16 лет (или иного возраста согласия в вашей стране) без согласия родителей. Если нам станет известно о сборе данных ребёнка без согласия, мы удалим такие данные.',
      ],
    },
    {
      id: 'automated',
      title: '15. Автоматизированные решения',
      paragraphs: [
        'Мы не принимаем решений, имеющих для вас существенные правовые последствия, исключительно на основе автоматизированной обработки без участия человека. Расчёт стоимости доставки и зоны — алгоритмические правила по адресу, а не профилирование личности.',
      ],
    },
    {
      id: 'links',
      title: '16. Ссылки на сторонние сайты',
      paragraphs: [
        'На сайте могут быть ссылки на соцсети, карты или партнёров. Мы не контролируем их политики конфиденциальности — рекомендуем читать условия каждого ресурса отдельно.',
      ],
    },
    {
      id: 'changes',
      title: '17. Изменения политики',
      paragraphs: [
        'Мы можем обновлять эту страницу при изменении законодательства, сервиса или процессов обработки. Дата «Последнее обновление» вверху страницы указывает актуальную редакцию.',
        'Существенные изменения могут дополнительно сообщаться по email или баннеру на сайте. Продолжение использования сервиса после публикации новой версии означает ознакомление с обновлённой политикой, если иное не требуется законом.',
      ],
    },
    {
      id: 'authority',
      title: '18. Надзорный орган',
      paragraphs: [
        'Вы вправе подать жалобу в орган по защите персональных данных в стране вашего обычного проживания, места работы или предполагаемого нарушения. Для резидентов Нидерландов — Autoriteit Persoonsgegevens (AP); для Украины — Уполномоченный Верховной Рады по правам человека или уполномоченный по защите персональных данных в рамках действующего законодательства.',
      ],
    },
  ],
}

export const privacyPageUk: PrivacyPageContent = {
  title: 'Політика конфіденційності',
  back: 'Назад',
  updated: 'Останнє оновлення: 1 травня 2026',
  heroKicker: 'Watta Sushi',
  heroSubtitle:
    'Ваші дані — лише для замовлення, сервісу та зв’язку з вами.',
  heroBadge: 'GDPR · Прозорість',
  contentTitle: 'Повний текст політики',
  contentSubtitle: 'Розділи можна відкрити за посиланнями зліва або прокрутити сторінку.',
  tocTitle: 'Зміст',
  rightsTitle: 'Ваші права коротко',
  rightsIntro:
    'Ви можете скористатися правами в будь-який момент — напишіть нам через розділ «Контакти» або на email, вказаний там. Ми відповімо у строки, встановлені законом (зазвичай до 30 днів).',
  rightsItems: [
    'Право на доступ до своїх даних і копію обробки',
    'Право на виправлення неточних або неповних даних',
    'Право на видалення («право бути забутим»), якщо немає законних підстав зберігати',
    'Право обмежити обробку в певних випадках',
    'Право на переносимість даних у структурованому форматі',
    'Право заперечити проти обробки, зокрема в маркетингових цілях',
    'Право відкликати згоду — без впливу на законність обробки до відкликання',
    'Право подати скаргу до наглядового органу з захисту даних у вашій країні',
  ],
  contactTitle: 'Питання щодо конфіденційності',
  contactBody:
    'Запити про персональні дані, видалення облікового запису або уточнення політики надсилайте через сторінку «Контакти» або контакти в підвалі. Вкажіть тему «Конфіденційність» та email, з яким оформлювали замовлення.',
  blocks: [
    {
      id: 'controller',
      title: '1. Контролер персональних даних',
      paragraphs: [
        'Контролером (особою, що визначає цілі та способи обробки) є оператор сервісу Watta Sushi — суб’єкт господарювання, що діє під брендом Watta Sushi та приймає замовлення через цей веб-сайт.',
        'Контактні дані для питань конфіденційності, реалізації прав суб’єкта даних і скарг: розділ «Контакти» на сайті, телефон і електронна пошта в підвалі та на сторінці контактів.',
      ],
    },
    {
      id: 'scope',
      title: '2. Сфера застосування',
      paragraphs: [
        'Політика поширюється на всіх відвідувачів сайту, зареєстрованих користувачів, клієнтів, що оформлюють замовлення, а також осіб, які надсилають повідомлення через форми зворотного зв’язку, чат або месенджери, зазначені на сайті.',
        'Політика не замінює Публічний договор (умови замовлення, оплати та доставки), але доповнює їх щодо персональних даних. Умови купівлі-продажу викладені в окремому документі «Публічний договор». Окремі послуги третіх осіб (платіжні системи, карти, зовнішні посилання) можуть мати власні політики.',
      ],
    },
    {
      id: 'data',
      title: '3. Які персональні дані ми обробляємо',
      paragraphs: ['Залежно від ваших дій ми можемо обробляти такі категорії даних:'],
      bullets: [
        'Ідентифікаційні: ім’я, прізвище (за наявності), нікнейм в обліковому записі',
        'Контактні: номер телефону, адреса електронної пошти',
        'Адресні: адреса доставки, поверх, домофон, коментарі кур’єру, місто та зона доставки',
        'Замовлення та оплата: склад замовлення, сума, спосіб оплати, статус, історія замовлень, промокоди',
        'Обліковий запис: хеш пароля (пароль у відкритому вигляді не зберігаємо), дата реєстрації, обране, мова інтерфейсу',
        'Комунікації: текст звернень у підтримку, відгуки, оцінки, листування щодо замовлення',
        'Технічні: IP-адреса, тип пристрою та браузера, мова інтерфейсу, файли cookie, ідентифікатори сесії, журнали сервера',
        'Маркетинг (за згодою): підписка на розсилку, історія відкриттів та відписок',
      ],
    },
    {
      id: 'sources',
      title: '4. Джерела даних',
      paragraphs: [
        'Дані надходять безпосередньо від вас при заповненні форм, оформленні замовлення, реєстрації або листуванні; автоматично — під час використання сайту; а також від платіжних і логістичних партнерів у обсязі, необхідному для виконання замовлення.',
        'Надання контактних і адресних даних для доставки необхідне для укладення та виконання договору. Відмова від обов’язкових полів може зробити оформлення замовлення неможливим.',
      ],
    },
    {
      id: 'purposes',
      title: '5. Цілі та правові підстави обробки',
      paragraphs: ['Ми обробляємо дані лише за наявності законної підстави згідно зі ст. 6 GDPR:'],
      bullets: [
        'Виконання договору — прийом, приготування, передача кур’єру, доставка або самовивіз, сповіщення про статус',
        'Законний інтерес — безпека сайту, запобігання шахрайству, покращення сервісу, внутрішня звітність у знеособленому вигляді',
        'Згода — маркетингові email/SMS/push, необов’язкові cookie аналітики',
        'Юридичний обов’язок — бухгалтерський і податковий облік, відповіді державним органам у межах закону',
      ],
    },
    {
      id: 'orders',
      title: '6. Замовлення, обліковий запис і сповіщення',
      paragraphs: [
        'При замовленні без реєстрації ми використовуємо вказаний телефон і адресу для зв’язку та доставки; історія може бути прив’язана до номера або email при повторних замовленнях.',
        'Зареєстрований обліковий запис дозволяє зберігати адреси, обране та історію. Ви можете запросити видалення — дані будуть видалені або знеособлені, якщо інше не вимагає закон.',
        'Сповіщення про статус замовлення надсилаються каналами, які ви використовуєте при замовленні.',
      ],
    },
    {
      id: 'cookies',
      title: '7. Файли cookie та локальне сховище',
      paragraphs: [
        'Сайт використовує cookie та localStorage для кошика, мови інтерфейсу, сесії авторизації та, за вашою згодою, аналітики.',
        'Строго необхідні cookie працюють без окремої згоди. Аналітичні та маркетингові — лише за згодою або налаштуваннями браузера.',
        'Ви можете видалити cookie в налаштуваннях браузера; частина функцій може працювати некоректно.',
      ],
    },
    {
      id: 'marketing',
      title: '8. Розсилки та маркетинг',
      paragraphs: [
        'Рекламні повідомлення надсилаємо лише за згодою або в межах soft opt-in, де це дозволено законом.',
        'У кожному листі доступна відписка. Відкликання згоди не впливає на законність обробки до відкликання.',
      ],
    },
    {
      id: 'sharing',
      title: '9. Передача даних третім особам',
      paragraphs: [
        'Ми не продаємо персональні дані. Передача можлива лише отримувачам, що допомагають надавати послугу:',
        'З такими отримувачами укладаються договори обробки даних (DPA) або стандартні договірні положення.',
      ],
      bullets: [
        'Платіжні провайдери — для прийому оплати',
        'Кур’єрські служби — ім’я, телефон, адреса та коментарі до замовлення',
        'Хостинг, CDN, email- та SMS-сервіси — технічна інфраструктура',
        'Професійні консультанти — за обов’язком конфіденційності, якщо вимагає закон',
      ],
    },
    {
      id: 'transfers',
      title: '10. Міжнародна передача',
      paragraphs: [
        'Сервери та підрядники можуть бути в країнах ЄЕЗ або за її межами. При передачі за межі ЄЕЗ ми забезпечуємо належні гарантії: рішення Єврокомісії, SCC або інші механізми GDPR.',
      ],
    },
    {
      id: 'retention',
      title: '11. Строки зберігання',
      paragraphs: [
        'Дані замовлень зберігаються стільки, скільки вимагає бухгалтерське та податкове законодавство.',
        'Дані облікового запису — до видалення за запитом або тривалої неактивності з повідомленням, якщо застосовно.',
        'Технічні логи — від кількох днів до 24 місяців для аналітики.',
        'Звернення в підтримку — до вирішення питання та розумного строку для якості сервісу.',
      ],
    },
    {
      id: 'security',
      title: '12. Безпека даних',
      paragraphs: [
        'Застосовуємо HTTPS/TLS, обмеження доступу за ролями, резервне копіювання, моніторинг інцидентів.',
        'При підозрі на витік, що зачіпає ваші права, повідомимо вас і наглядовий орган у встановлені строки.',
      ],
    },
    {
      id: 'rights-detail',
      title: '13. Детально про ваші права',
      paragraphs: [
        'Ви можете запитати підтвердження обробки, копію, виправлення, видалення, обмеження, перенесення та заперечити. Для маркетингу достатньо відписатися.',
        'Можемо запросити підтвердження особи. При відмові пояснимо причину, якщо це вимагає закон.',
      ],
    },
    {
      id: 'children',
      title: '14. Діти',
      paragraphs: [
        'Сервіс не призначений для осіб молодше 16 років без згоди батьків. Якщо дізнаємося про збір даних дитини без згоди — видалимо їх.',
      ],
    },
    {
      id: 'automated',
      title: '15. Автоматизовані рішення',
      paragraphs: [
        'Ми не приймаємо рішень із суттєвими правовими наслідками виключно автоматизовано без участі людини. Розрахунок доставки — правила за адресою, а не профілювання особистості.',
      ],
    },
    {
      id: 'links',
      title: '16. Посилання на сторонні сайти',
      paragraphs: [
        'На сайті можуть бути посилання на соцмережі, карти або партнерів. Їхні політики конфіденційності ми не контролюємо.',
      ],
    },
    {
      id: 'changes',
      title: '17. Зміни політики',
      paragraphs: [
        'Ми можемо оновлювати цю сторінку. Дата «Останнє оновлення» вказує актуальну редакцію.',
        'Суттєві зміни можуть додатково повідомлятися email або банером. Продовження використання сервісу після публікації означає ознайомлення з оновленою політикою.',
      ],
    },
    {
      id: 'authority',
      title: '18. Наглядовий орган',
      paragraphs: [
        'Ви можете подати скаргу до органу захисту персональних даних у країні проживання або порушення. Для Нідерландів — Autoriteit Persoonsgegevens (AP); для України — уповноважений з захисту персональних даних у межах чинного законодавства.',
      ],
    },
  ],
}

export const privacyPageEn: PrivacyPageContent = {
  title: 'Privacy policy',
  back: 'Back',
  updated: 'Last updated: 1 May 2026',
  heroKicker: 'Watta Sushi',
  heroSubtitle:
    'Your data is used for orders, service, and communication with you.',
  heroBadge: 'GDPR · Transparency',
  contentTitle: 'Full policy text',
  contentSubtitle: 'Jump to a section from the list or scroll through the page.',
  tocTitle: 'Contents',
  rightsTitle: 'Your rights at a glance',
  rightsIntro:
    'You may exercise your rights at any time—contact us via the Contacts page or the email listed there. We respond within statutory time limits (typically up to 30 days).',
  rightsItems: [
    'Right of access to your data and a copy of processing',
    'Right to rectification of inaccurate or incomplete data',
    'Right to erasure (“right to be forgotten”) where no legal retention applies',
    'Right to restrict processing in certain cases',
    'Right to data portability in a structured format',
    'Right to object to processing, including for marketing',
    'Right to withdraw consent without affecting lawfulness before withdrawal',
    'Right to lodge a complaint with a data protection supervisory authority',
  ],
  contactTitle: 'Privacy enquiries',
  contactBody:
    'For requests about personal data, account deletion, or clarifications on this policy, use the Contacts page or details in the site footer. Include “Privacy” in the subject and the email used for orders so we can locate your data faster.',
  blocks: [
    {
      id: 'controller',
      title: '1. Data controller',
      paragraphs: [
        'The controller (entity determining purposes and means of processing) is the operator of Watta Sushi—the business acting under the Watta Sushi brand and accepting orders through this website.',
        'Contact details for privacy questions, data subject requests, and complaints: the Contacts section on the site, phone, and email shown in the footer and contacts page.',
      ],
    },
    {
      id: 'scope',
      title: '2. Scope',
      paragraphs: [
        'This policy applies to website visitors, registered users, customers placing orders, and anyone sending messages via feedback forms, chat, or messengers listed on the site.',
        'It does not replace the Public agreement (ordering, payment, and delivery terms) but supplements it regarding personal data. Purchase terms are set out in a separate document, the Public agreement. Third-party services (payments, maps, external links) have their own policies.',
      ],
    },
    {
      id: 'data',
      title: '3. Personal data we process',
      paragraphs: ['Depending on your actions we may process:'],
      bullets: [
        'Identity: first name, last name (if provided), account display name',
        'Contact: phone number, email address',
        'Address: delivery address, floor, door code, courier notes, city and delivery zone',
        'Order & payment: order contents, amount, payment method, status, order history, promo codes',
        'Account: password hash (we do not store plain passwords), registration date, favourites, language preference',
        'Communications: support messages, reviews, ratings, order-related correspondence',
        'Technical: IP address, device and browser type, interface language, cookies, session IDs, server logs',
        'Marketing (with consent): newsletter subscription, open/unsubscribe history',
      ],
    },
    {
      id: 'sources',
      title: '4. Sources of data',
      paragraphs: [
        'Data comes directly from you when filling forms, placing orders, registering, or messaging us; automatically when using the site; and from payment/logistics partners as needed to fulfil orders.',
        'Providing contact and address data for delivery is necessary to perform the contract. Refusing required fields may prevent checkout.',
      ],
    },
    {
      id: 'purposes',
      title: '5. Purposes and legal bases',
      paragraphs: ['We process data only where Art. 6 GDPR provides a lawful basis:'],
      bullets: [
        'Contract — order acceptance, preparation, courier handover, delivery or pickup, status notifications',
        'Legitimate interests — site security, fraud prevention, service improvement, anonymised internal reporting',
        'Consent — marketing email/SMS/push, non-essential analytics cookies where required',
        'Legal obligation — accounting, tax records, responses to authorities within the law',
      ],
    },
    {
      id: 'orders',
      title: '6. Orders, account, and notifications',
      paragraphs: [
        'Guest checkout uses the phone and address you provide; history may be linked to that phone or email on repeat orders.',
        'A registered account stores addresses, favourites, and history. You may request deletion—data will be erased or anonymised unless law requires retention.',
        'Order status updates are sent via channels used at checkout (site, SMS, messengers—depending on service configuration).',
      ],
    },
    {
      id: 'cookies',
      title: '7. Cookies and local storage',
      paragraphs: [
        'We use cookies and localStorage for the cart, language, login session, and—with consent—visit analytics.',
        'Strictly necessary cookies run without separate consent. Analytics/marketing cookies only with consent or browser settings.',
        'You may clear cookies in your browser; some features may stop working correctly.',
      ],
    },
    {
      id: 'marketing',
      title: '8. Newsletters and marketing',
      paragraphs: [
        'Promotional messages are sent only with your consent or where soft opt-in is permitted by local law.',
        'Every message includes unsubscribe. Withdrawing consent does not affect lawfulness of processing before withdrawal.',
      ],
    },
    {
      id: 'sharing',
      title: '9. Sharing with third parties',
      paragraphs: [
        'We do not sell personal data. Recipients who help deliver the service may receive limited data:',
        'Data processing agreements (DPAs) or standard contractual clauses apply where required.',
      ],
      bullets: [
        'Payment providers — to process card and other payments',
        'Courier/logistics — name, phone, address, order comments',
        'Hosting, CDN, email/SMS — technical infrastructure and notifications',
        'Professional advisers — under confidentiality where required by law',
      ],
    },
    {
      id: 'transfers',
      title: '10. International transfers',
      paragraphs: [
        'Servers and processors may be in the EEA or elsewhere. Transfers outside the EEA use adequacy decisions, Standard Contractual Clauses (SCCs), or other GDPR mechanisms.',
      ],
    },
    {
      id: 'retention',
      title: '11. Retention periods',
      paragraphs: [
        'Order and billing data are kept as long as accounting/tax law requires.',
        'Account data until deletion on request or prolonged inactivity with notice where applicable.',
        'Technical logs—from days to 24 months for analytics.',
        'Support tickets until resolved and a reasonable period for quality records unless you ask for earlier deletion.',
      ],
    },
    {
      id: 'security',
      title: '12. Security',
      paragraphs: [
        'We use HTTPS/TLS, role-based access, backups, and incident monitoring.',
        'If a breach likely affects your rights, we will notify you and the supervisory authority within legal deadlines.',
      ],
    },
    {
      id: 'rights-detail',
      title: '13. Your rights in detail',
      paragraphs: [
        'You may request confirmation, access, rectification, erasure, restriction, portability, and object to processing. For marketing, unsubscribe is enough.',
        'We may verify identity before disclosure. If we refuse a request, we explain the legal reason.',
      ],
    },
    {
      id: 'children',
      title: '14. Children',
      paragraphs: [
        'The service is not aimed at under-16s (or local age of consent) without parental consent. If we learn we collected a child’s data without consent, we delete it.',
      ],
    },
    {
      id: 'automated',
      title: '15. Automated decision-making',
      paragraphs: [
        'We do not make decisions with significant legal effect based solely on automated processing without human involvement. Delivery fees and zones are rule-based on address, not personality profiling.',
      ],
    },
    {
      id: 'links',
      title: '16. Third-party links',
      paragraphs: [
        'Links to social networks, maps, or partners may appear on the site. We do not control their privacy practices—read their policies separately.',
      ],
    },
    {
      id: 'changes',
      title: '17. Changes to this policy',
      paragraphs: [
        'We may update this page when law, services, or processing change. The “Last updated” date shows the current version.',
        'Material changes may also be announced by email or site banner. Continued use after publication means you have read the updated policy where the law allows.',
      ],
    },
    {
      id: 'authority',
      title: '18. Supervisory authority',
      paragraphs: [
        'You may complain to the data protection authority in your country of residence, workplace, or alleged infringement. In the Netherlands: Autoriteit Persoonsgegevens (AP); in Ukraine: the competent personal data protection authority under applicable law.',
      ],
    },
  ],
}

export const privacyPageNl: PrivacyPageContent = {
  title: 'Privacybeleid',
  back: 'Terug',
  updated: 'Laatst bijgewerkt: 1 mei 2026',
  heroKicker: 'Watta Sushi',
  heroSubtitle:
    'Uw gegevens worden gebruikt voor bestellingen, service en contact.',
  heroBadge: 'AVG · Transparantie',
  contentTitle: 'Volledige beleidstekst',
  contentSubtitle: 'Ga naar een sectie via de lijst of scroll door de pagina.',
  tocTitle: 'Inhoud',
  rightsTitle: 'Uw rechten in het kort',
  rightsIntro:
    'U kunt uw rechten te allen tijde uitoefenen—neem contact op via Contacten of het e-mailadres op de site. Wij reageren binnen de wettelijke termijnen (meestal tot 30 dagen).',
  rightsItems: [
    'Recht op inzage in uw gegevens en een kopie van de verwerking',
    'Recht op rectificatie van onjuiste of onvolledige gegevens',
    'Recht op verwijdering (“recht om vergeten te worden”) waar geen wettelijke bewaarplicht geldt',
    'Recht op beperking van verwerking in bepaalde gevallen',
    'Recht op gegevensoverdraagbaarheid in een gestructureerd formaat',
    'Recht van bezwaar tegen verwerking, ook voor marketing',
    'Recht om toestemming in te trekken zonder de rechtmatigheid vóór intrekking aan te tasten',
    'Recht om een klacht in te dienen bij een toezichthoudende autoriteit',
  ],
  contactTitle: 'Privacyvragen',
  contactBody:
    'Voor verzoeken over persoonsgegevens, verwijdering van uw account of vragen over dit beleid: gebruik de pagina Contacten of de gegevens in de footer. Vermeld “Privacy” en het e-mailadres van uw bestellingen.',
  blocks: [
    {
      id: 'controller',
      title: '1. Verwerkingsverantwoordelijke',
      paragraphs: [
        'De verwerkingsverantwoordelijke is de exploitant van Watta Sushi—de onderneming die onder dit merk opereert en bestellingen via deze website accepteert.',
        'Contact voor privacy, verzoeken van betrokkenen en klachten: Contacten op de site, telefoon en e-mail in de footer en op de contactpagina.',
      ],
    },
    {
      id: 'scope',
      title: '2. Toepassingsgebied',
      paragraphs: [
        'Dit beleid geldt voor bezoekers, geregistreerde gebruikers, klanten die bestellen en iedereen die berichten stuurt via formulieren, chat of messengers op de site.',
        'Het vervangt geen publieke offerte (bestel-, betaal- en bezorgvoorwaarden) maar vult deze aan wat betreft persoonsgegevens. Koopvoorwaarden staan in een apart document, de publieke offerte. Diensten van derden hebben eigen privacybeleid.',
      ],
    },
    {
      id: 'data',
      title: '3. Welke persoonsgegevens verwerken wij',
      paragraphs: ['Afhankelijk van uw handelingen kunnen wij verwerken:'],
      bullets: [
        'Identiteit: voornaam, achternaam, weergavenaam account',
        'Contact: telefoonnummer, e-mailadres',
        'Adres: bezorgadres, verdieping, deurcode, opmerkingen koerier, stad en zone',
        'Bestelling & betaling: inhoud, bedrag, betaalmethode, status, geschiedenis, promocodes',
        'Account: wachtwoordhash, registratiedatum, favorieten, taalvoorkeur',
        'Communicatie: supportberichten, reviews, beoordelingen, correspondentie over bestellingen',
        'Technisch: IP-adres, apparaat en browser, taal, cookies, sessie-ID’s, serverlogs',
        'Marketing (met toestemming): nieuwsbrief, open/afmeldgeschiedenis',
      ],
    },
    {
      id: 'sources',
      title: '4. Bronnen van gegevens',
      paragraphs: [
        'Gegevens komen rechtstreeks van u bij formulieren, bestellingen, registratie of berichten; automatisch bij gebruik van de site; en van betaal-/logistieke partners voor uitvoering van bestellingen.',
        'Contact- en adresgegevens voor bezorging zijn nodig voor de overeenkomst. Weigering van verplichte velden kan checkout blokkeren.',
      ],
    },
    {
      id: 'purposes',
      title: '5. Doelen en rechtsgronden',
      paragraphs: ['Wij verwerken alleen met een rechtsgrond uit art. 6 AVG:'],
      bullets: [
        'Overeenkomst — bestelling, bereiding, koerier, bezorging of afhalen, statusmeldingen',
        'Gerechtvaardigd belang — beveiliging, fraudepreventie, verbetering dienst, geanonimiseerde rapportage',
        'Toestemming — marketing e-mail/SMS/push, niet-noodzakelijke analytische cookies',
        'Wettelijke verplichting — administratie, belasting, reacties aan autoriteiten',
      ],
    },
    {
      id: 'orders',
      title: '6. Bestellingen, account en meldingen',
      paragraphs: [
        'Gastbestelling gebruikt opgegeven telefoon en adres; geschiedenis kan aan dat nummer of e-mail gekoppeld worden.',
        'Een account bewaart adressen, favorieten en geschiedenis. Verwijdering op verzoek—gegevens worden gewist of geanonimiseerd tenzij de wet anders vereist.',
        'Statusupdates via kanalen die u bij bestelling gebruikt.',
      ],
    },
    {
      id: 'cookies',
      title: '7. Cookies en lokale opslag',
      paragraphs: [
        'Cookies en localStorage voor winkelwagen, taal, login en—with toestemming—analytics.',
        'Strikt noodzakelijke cookies zonder aparte toestemming. Analytics/marketing alleen met toestemming of browserinstellingen.',
        'Cookies wissen kan functies beperken.',
      ],
    },
    {
      id: 'marketing',
      title: '8. Nieuwsbrieven en marketing',
      paragraphs: [
        'Promotionele berichten alleen met toestemming of waar soft opt-in is toegestaan.',
        'Elk bericht bevat afmelden. Intrekken tast rechtmatigheid vóór intrekken niet aan.',
      ],
    },
    {
      id: 'sharing',
      title: '9. Delen met derden',
      paragraphs: [
        'Wij verkopen geen persoonsgegevens. Beperkte doorgifte aan ontvangers die de dienst mogelijk maken:',
        'Verwerkersovereenkomsten (DPA) of standaardcontractbepalingen waar vereist.',
      ],
      bullets: [
        'Betalingsproviders',
        'Koeriers/logistiek — naam, telefoon, adres, opmerkingen',
        'Hosting, CDN, e-mail/SMS',
        'Professionele adviseurs onder geheimhouding',
      ],
    },
    {
      id: 'transfers',
      title: '10. Internationale doorgifte',
      paragraphs: [
        'Servers kunnen in de EER of daarbuiten zijn. Doorgifte buiten de EER met adequaatheidsbesluiten, SCC’s of andere AVG-mechanismen.',
      ],
    },
    {
      id: 'retention',
      title: '11. Bewaartermijnen',
      paragraphs: [
        'Bestel- en factuurgegevens zolang administratie/belasting vereist.',
        'Account tot verwijdering of inactiviteit met kennisgeving.',
        'Technische logs—dagen tot 24 maanden voor analytics.',
        'Support tot afhandeling en redelijke kwaliteitsperiode.',
      ],
    },
    {
      id: 'security',
      title: '12. Beveiliging',
      paragraphs: [
        'HTTPS/TLS, rolgebaseerde toegang, back-ups, incidentmonitoring.',
        'Bij inbreuk met impact op uw rechten melden wij u en de toezichthouder binnen wettelijke termijnen.',
      ],
    },
    {
      id: 'rights-detail',
      title: '13. Uw rechten in detail',
      paragraphs: [
        'Inzage, rectificatie, verwijdering, beperking, overdraagbaarheid, bezwaar—op verzoek. Voor marketing volstaat afmelden.',
        'Identiteitscontrole mogelijk. Bij weigering leggen wij de reden uit.',
      ],
    },
    {
      id: 'children',
      title: '14. Kinderen',
      paragraphs: [
        'Niet gericht op onder 16 zonder ouderlijke toestemming. Onbedoelde verzameling wordt verwijderd.',
      ],
    },
    {
      id: 'automated',
      title: '15. Geautomatiseerde besluitvorming',
      paragraphs: [
        'Geen besluiten met grote juridische gevolgen uitsluitend automatisch zonder mens. Bezorgkosten zijn adresregels, geen profilering.',
      ],
    },
    {
      id: 'links',
      title: '16. Links naar derden',
      paragraphs: [
        'Links naar sociale media, kaarten of partners—hun privacybeleid geldt apart.',
      ],
    },
    {
      id: 'changes',
      title: '17. Wijzigingen',
      paragraphs: [
        'Wij kunnen deze pagina bijwerken. De datum “Laatst bijgewerkt” toont de actuele versie.',
        'Materiële wijzigingen kunnen per e-mail of banner worden gemeld. Voortgezet gebruik betekent kennisname waar de wet dit toestaat.',
      ],
    },
    {
      id: 'authority',
      title: '18. Toezichthouder',
      paragraphs: [
        'Klacht bij de autoriteit in uw land. In Nederland: Autoriteit Persoonsgegevens (AP).',
      ],
    },
  ],
}

export const privacyPageByLang = {
  uk: privacyPageUk,
  ru: privacyPageRu,
  en: privacyPageEn,
  nl: privacyPageNl,
} as const
