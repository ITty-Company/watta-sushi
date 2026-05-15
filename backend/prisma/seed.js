import { execSync } from 'child_process'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Start seeding...')

  // 0. Создаем администратора
  const adminEmail = 'admin@sushi.com'
  const adminPassword = 'admin123'
  const hashedPassword = await bcrypt.hash(adminPassword, 10)
  
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      password: hashedPassword, // Обновляем пароль, если администратор уже существует
      role: 'ADMIN'
    },
    create: {
      email: 'admin@sushi.com',
      phone: '+31649326549',
      name: 'Администратор',
      password: hashedPassword,
      role: 'ADMIN',
      isPhoneVerified: true
    }
  })
  console.log('✅ Admin user created:', adminEmail)

  // 1. Создаем ВСЕ категории
  const categories = [
    { name_ru: 'Роллы', name_ua: 'Роли', name_en: 'Rolls', name_nl: 'Rolls', slug: 'rolls', emoji: '🍣', order: 0 },
    { name_ru: 'Суши', name_ua: 'Суші', name_en: 'Sushi', name_nl: 'Sushi', slug: 'sushi', emoji: '🍙', order: 1 },
    { name_ru: 'Сеты', name_ua: 'Сети', name_en: 'Sets', name_nl: 'Menu\'s', slug: 'sets', emoji: '🍱', order: 2 },
    { name_ru: 'Супы', name_ua: 'Супи', name_en: 'Soups', name_nl: "Soepen", slug: 'soups', emoji: '🍜', order: 3 },
    { name_ru: 'Боулы', name_ua: 'Боули', name_en: 'Bowls', name_nl: 'Bowls', slug: 'bowls', emoji: '🥗', order: 4 },
    { name_ru: 'Закуски', name_ua: 'Закуски', name_en: 'Snacks', name_nl: 'Snacks', slug: 'snacks', emoji: '🍤', order: 5 },
    { name_ru: 'Напитки', name_ua: 'Напої', name_en: 'Drinks', name_nl: 'Dranken', slug: 'drinks', emoji: '🧃', order: 6 },
    { name_ru: 'Соусы', name_ua: 'Соуси', name_en: 'Sauces', name_nl: 'Sauzen', slug: 'sauces', emoji: '🌶️', order: 7 },
  ]

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        emoji: cat.emoji,
        order: cat.order,
        name_ua: cat.name_ua,
        name_en: cat.name_en,
        name_nl: cat.name_nl,
        name_ru: cat.name_ru,
      },
      create: cat,
    })
  }
  console.log('✅ Categories created')

  // Банери головної сторінки: URL відносно фронта (/file у web/public). На проді таблиця часто порожня — без рядків показується «заглушка».
  const bannerCount = await prisma.banner.count()
  if (bannerCount === 0) {
    await prisma.banner.createMany({
      data: [
        {
          title_ru: 'Watta Sushi',
          title_ua: 'Watta Sushi',
          title_en: 'Watta Sushi',
          title_nl: 'Watta Sushi',
          imageUrl: '/watta-sushi.jpg',
          focalX: 50,
          focalY: 36,
          order: 0,
          isActive: true,
        },
        {
          title_ru: 'Свіжі роли та суші',
          title_ua: 'Свіжі роли та суші',
          title_en: 'Fresh rolls & sushi',
          title_nl: 'Verse rolls en sushi',
          imageUrl: '/sushi.png',
          focalX: 50,
          focalY: 48,
          order: 1,
          isActive: true,
        },
        {
          title_ru: 'Якість і доставка',
          title_ua: 'Якість і доставка',
          title_en: 'Quality & delivery',
          title_nl: 'Kwaliteit & bezorging',
          imageUrl: '/profile-background.jpg',
          focalX: 50,
          focalY: 42,
          order: 2,
          isActive: true,
        },
      ],
    })
    console.log('✅ Default banners created (paths /watta-sushi.jpg, /sushi.png, … on the web host)')
  }

  // Получаем ID всех категорий
  const rollsCat = await prisma.category.findUnique({ where: { slug: 'rolls' } })
  const sushiCat = await prisma.category.findUnique({ where: { slug: 'sushi' } })
  const setsCat = await prisma.category.findUnique({ where: { slug: 'sets' } })
  const bowlsCat = await prisma.category.findUnique({ where: { slug: 'bowls' } })
  const soupsCat = await prisma.category.findUnique({ where: { slug: 'soups' } })
  const snacksCat = await prisma.category.findUnique({ where: { slug: 'snacks' } })
  const drinksCat = await prisma.category.findUnique({ where: { slug: 'drinks' } })
  const saucesCat = await prisma.category.findUnique({ where: { slug: 'sauces' } })

  // 2. Полный демо-каталог (мультиязычные названия и описания). Повторный сиды не дублирует позиции.
  const t = (ru, ua, en, nl) => ({
    name_ru: ru,
    name_ua: ua,
    name_en: en,
    name_nl: nl,
  })
  const d = (ru, ua, en, nl) => ({
    description_ru: ru,
    description_ua: ua,
    description_en: en,
    description_nl: nl,
  })

  const products = [
    // --- РОЛЛЫ (12) ---
    { ...t('Филадельфия Лайт', 'Філадельфія Лайт', 'Philadelphia Light', 'Philadelphia Light'), ...d('Лосось, сливочный сыр, огурец, рис, нори', 'Лосось, вершковий сир, огірок, рис, норі', 'Salmon, cream cheese, cucumber, rice, nori', 'Zalm, roomkaas, komkommer, rijst, nori'), price: 180, categoryId: rollsCat.id, imageUrl: 'https://placehold.co/400x300/1a4d2e/fff?text=Phila+Light', isHomeHit: true, recommendOrder: 1 },
    { ...t('Филадельфия в кунжуте', 'Філадельфія в кунжуті', 'Sesame Philadelphia', 'Sesam Philadelphia'), ...d('Лосось, сливочный сыр, огурец, рис, нори, кунжут снаружи', 'Лосось, вершковий сир, огірок, рис, норі, кунжут зовні', 'Salmon, cream cheese, cucumber, nori, toasted sesame outside', 'Zalm, roomkaas, komkommer, nori, sesam buitenom'), price: 195, categoryId: rollsCat.id, imageUrl: 'https://placehold.co/400x300/2d6a4f/fff?text=Phila+Sesame', isCartRecommend: true, cartRecommendOrder: 2 },
    { ...t('Калифорния с крабом', 'Каліфорнія з крабом', 'California with crab', 'California met krab'), ...d('Снежный краб, авокадо, огурец, икра тобико', 'Сніжний краб, авокадо, огірок, ікра тобіко', 'Snow crab, avocado, cucumber, tobiko', 'Sneeuwkrab, avocado, komkommer, tobiko'), price: 165, categoryId: rollsCat.id, imageUrl: 'https://placehold.co/400x300/c45c26/fff?text=California' },
    { ...t('Золотой дракон', 'Золотий дракон', 'Golden Dragon', 'Gouden draak'), ...d('Угорь, авокадо, унаги, кунжут', 'Вугор, авокадо, унагі, кунжут', 'Eel, avocado, eel sauce, sesame', 'Paling, avocado, unagisaus, sesam'), price: 245, categoryId: rollsCat.id, imageUrl: 'https://placehold.co/400x300/b8860b/1a1a1a?text=Golden+Dragon', isPopular: true, promoDiscountPercent: 10 },
    { ...t('Канада', 'Канада', 'Canada roll', 'Canada roll'), ...d('Копчёный лосось, сливочный сыр, огурец, соус унаги', 'Копчений лосось, вершковий сир, огірок, унагі', 'Smoked salmon, cream cheese, cucumber, eel sauce', 'Gerookte zalm, roomkaas, komkommer, unagisaus'), price: 210, categoryId: rollsCat.id, imageUrl: 'https://placehold.co/400x300/8b3a3a/fff?text=Canada' },
    { ...t('Спайси тунец', 'Спайсі тунець', 'Spicy tuna', 'Pittige tonijn'), ...d('Тунец, спайси-майонез, огурец, зелёный лук', 'Тунець, соус спайсі, зелена цибуля, огірок', 'Tuna, spicy mayo, cucumber, spring onion', 'Tonijn, pittige mayonaise, komkommer, lente-ui'), price: 190, categoryId: rollsCat.id, imageUrl: 'https://placehold.co/400x300/6b1c1c/fff?text=Spicy+Tuna' },
    { ...t('Маки с лососем', 'Макі з лососем', 'Salmon maki', 'Zalm maki'), ...d('Классика: лосось / рис / нори', 'Класика: лосось / рис / норі', 'Classic salmon, rice, nori', 'Klassieke zalm, rijst, nori'), price: 120, categoryId: rollsCat.id, imageUrl: 'https://placehold.co/400x300/f4a261/1a1a1a?text=Maki+Salmon' },
    { ...t('Маки с авокадо', 'Макі з авокадо', 'Avocado maki', 'Avocado maki'), ...d('Авокадо, рис, кунжут', 'Авокадо, рис, кунжут', 'Avocado, rice, sesame', 'Avocado, rijst, sesam'), price: 95, categoryId: rollsCat.id, imageUrl: 'https://placehold.co/400x300/2a6f4a/fff?text=Maki+Avo' },
    { ...t('Бонито с кatsuobushi', 'Боніто', 'Bonito maki', 'Bonito maki'), ...d('Кацуобуси, васаби, соус унаги, огурец', 'Кацуобусі, васабі, унагі, огірок', 'Dried fish flakes, wasabi, eel sauce, cucumber', 'Bonitovlokken, wasabi, unagisaus, komkommer'), price: 185, categoryId: rollsCat.id, imageUrl: 'https://placehold.co/400x300/5c3d2e/fff?text=Bonito' },
    { ...t('Унаги maki', 'Унагі макі', 'Unagi maki', 'Unagi maki'), ...d('Угорь, огурец, соус унаги, кунжут', 'Вугор, огірок, унагі, кунжут', 'Eel, cucumber, eel sauce, sesame', 'Paling, komkommer, unagisaus, sesam'), price: 200, categoryId: rollsCat.id, imageUrl: 'https://placehold.co/400x300/3d2914/fff?text=Unagi' },
    { ...t('Ролл с креветкой темпура', 'Рол з креветкою темпура', 'Shrimp tempura roll', 'Garnaal tempura roll'), ...d('Темпура креветка, сыр, сладкий соус, нори', 'Темпура, сир, солодкий соус', 'Tempura prawn, cheese, sweet chili style', 'Tempura gamba, kaas, milde saus'), price: 175, categoryId: rollsCat.id, imageUrl: 'https://placehold.co/400x300/d4a574/1a1a1a?text=Tempura+Roll' },
    { ...t('Веганский ролл', 'Веганський рол', 'Vegan roll', 'Vegan roll'), ...d('Авокадо, печёная тыква, шпинат, кунжут', 'Авокадо, печена гарбуз, шпинат', 'Avocado, baked pumpkin, spinach, sesame', 'Avocado, geroosterde pompoen, spinazie'), price: 155, categoryId: rollsCat.id, imageUrl: 'https://placehold.co/400x300/264653/fff?text=Vegan' },

    // --- СУШИ (7) ---
    { ...t('Нигири с лососем (2 шт)', 'Нігірі з лососем (2 шт)', 'Salmon nigiri (2)', 'Zalm nigiri (2)'), ...d('Свежий лосось на рисе', 'Свіжий лосось на рисі', 'Fresh salmon on sushi rice', 'Verse zalm op sushirijst'), price: 55, categoryId: sushiCat.id, imageUrl: 'https://placehold.co/400x300/e76f51/fff?text=Nigiri+Sal' },
    { ...t('Нигири с тунцом (2 шт)', 'Нігірі з тунцем (2 шт)', 'Tuna nigiri (2)', 'Tonijn nigiri (2)'), ...d('Тунец, лёгкий соевый глаз', 'Тунець, легкий глазур з сою', 'Tuna, light soy brush', 'Tonijn, lichte sojaglazuur'), price: 60, categoryId: sushiCat.id, imageUrl: 'https://placehold.co/400x300/1d3557/fff?text=Nigiri+Tun' },
    { ...t('Суши с креветкой (2 шт)', 'Суші з креветкою (2 шт)', 'Shrimp nigiri (2)', 'Garnaal nigiri (2)'), ...d('Варёные тигровые креветки, соус', 'Варені тигрові креветки', 'Cooked tiger prawns, sauce', 'Gekookte gamba’s, saus'), price: 58, categoryId: sushiCat.id, imageUrl: 'https://placehold.co/400x300/f4a3a3/1a1a1a?text=Nigiri+Shr' },
    { ...t('Гункан с икрой лосося', 'Гункан з ікрою лосося', 'Salmon roe gunkan', 'Zalmeitjes gunkan'), ...d('Нори, рис, сочная икра', 'Норі, рис, соковита ікра', 'Nori, rice, briny roe', 'Nori, rijst, kuit'), price: 85, categoryId: sushiCat.id, imageUrl: 'https://placehold.co/400x300/ff6b6b/fff?text=Gunkan+Ik', isHomeHit: true, recommendOrder: 3 },
    { ...t('Гункан с чукой', 'Гункан з чукой', 'Chuka gunkan', 'Chuka gunkan'), ...d('Салат чука, ореховый соус, рис', 'Салат чука, горіховий соус, рис', 'Chuka, nut sauce, rice', 'Chuka, notensaus, rijst'), price: 62, categoryId: sushiCat.id, imageUrl: 'https://placehold.co/400x300/2a9d4d/fff?text=Gunkan+Ch' },
    { ...t('Сашими лосось (5 шт)', 'Сашимі лосось (5 шт)', 'Salmon sashimi (5)', 'Zalm sashimi (5)'), ...d('Порции нежного лосося без риса', 'Порції ніжного лосося', 'Sliced raw salmon, no rice', 'Plakjes rauwe zalm, geen rijst'), price: 150, categoryId: sushiCat.id, imageUrl: 'https://placehold.co/400x300/ef476f/fff?text=Sashimi' },
    { ...t('Сашими микс', 'Сашимі мікс', 'Sashimi mix', 'Sashimi mix'), ...d('Лосось, тунец, сибас — шеф-нарезка', 'Лосось, тунець, сіба — нарізка', 'Salmon, tuna, sea bass', 'Zalm, tonijn, zeebaars'), price: 280, categoryId: sushiCat.id, imageUrl: 'https://placehold.co/400x300/7209b7/fff?text=Sashimi+Mix', isPopular: true },

    // --- СЕТЫ (6) ---
    { ...t('Сет «Филадельфия»', 'Сет «Філадельфія»', 'Philadelphia set', 'Philadelphia set'), ...d('32 шт: три вида филадельфии, соевый соус', '32 шт: три види, соєвий соус', '32 pcs, three phila-style rolls, soy', '32 st, drie philadelphia-rolls, soja'), price: 650, categoryId: setsCat.id, imageUrl: 'https://placehold.co/400x300/264653/fff?text=Set+Phila', isPopular: true, isHomeHit: true, recommendOrder: 0 },
    { ...t('Сет «Запечённый»', 'Сет «Запечений»', 'Baked set', 'Gebakken set'), ...d('Запечённые роллы: лосось, угорь, краб', 'Запечені роли: лосось, вугор, краб', 'Baked rolls with salmon, eel, crab', 'Gegrilde rolls met zalm, paling, krab'), price: 520, categoryId: setsCat.id, imageUrl: 'https://placehold.co/400x300/9c6644/fff?text=Set+Hot' },
    { ...t('Сет «Суши-любовь»', 'Сет «Суші-любов»', 'Sushi love set', 'Sushi liefde set'), ...d('Суши и маки — микс на двоих', 'Суші та макі — мікс на двох', 'Nigiri and maki mix for two', 'Nigiri en maki mix voor twee'), price: 480, categoryId: setsCat.id, imageUrl: 'https://placehold.co/400x300/06d6a0/1a1a1a?text=Set+Love' },
    { ...t('Сет «Всё веган»', 'Сет «Все веган»', 'All vegan set', 'Alles vegaan'), ...d('Овощные и фруктовые роллы, без рыбы', 'Овочеві роли без риби', 'Vegetable & fruit rolls, no fish', 'Groente- en fruitrollen, geen vis'), price: 420, categoryId: setsCat.id, imageUrl: 'https://placehold.co/400x300/52b69a/fff?text=Set+Vegan' },
    { ...t('Сет «Премиум»', 'Сет «Преміум»', 'Premium set', 'Premium set'), ...d('Сашими, нигири, тунец татаки', 'Сашимі, нігірі, тунець татакі', 'Sashimi, nigiri, tataki tuna', 'Sashimi, nigiri, tataki tonijn'), price: 890, categoryId: setsCat.id, imageUrl: 'https://placehold.co/400x300/bb8fce/1a1a1a?text=Premium' },
    { ...t('Сет детский', 'Сет дитячий', 'Kids set', 'Kinderen set'), ...d('Мини-маки, креветка темпура, сок 0,2', 'Міні-макі, сік 0,2', 'Mini maki, tempura shrimp, small juice', 'Mini maki, tempura, sapje'), price: 220, categoryId: setsCat.id, imageUrl: 'https://placehold.co/400x300/ffd166/1a1a1a?text=Kids' },

    // --- БОУЛЫ (5) ---
    { ...t('Поке с лососем', 'Поке з лососем', 'Salmon poké', 'Zalm poké'), ...d('Рис, лосось, эдамаме, авокадо, соус поке', 'Рис, лосось, едамаме, авокадо', 'Rice, salmon, edamame, avocado, poké sauce', 'Rijst, zalm, edamame, avocado, pokésaus'), price: 225, categoryId: bowlsCat.id, imageUrl: 'https://placehold.co/400x300/2a9d8f/fff?text=Poké+Sal' },
    { ...t('Боул с курицей терияки', 'Боул з куркою теріякі', 'Teriyaki chicken bowl', 'Teriyaki kip bowl'), ...d('Рис, курица, кукуруза, кунжут, соус', 'Рис, курка, кукурудза, кунжут', 'Rice, chicken, corn, sesame, teriyaki', 'Rijst, kip, maïs, sesam, teriyaki'), price: 195, categoryId: bowlsCat.id, imageUrl: 'https://placehold.co/400x300/7f5539/fff?text=Teriyaki' },
    { ...t('Боул с тунцом', 'Боул з тунцем', 'Tuna bowl', 'Tonijn bowl'), ...d('Киноа или рис, тунец, манго, кунжут', 'Кіноа або рис, тунець, манго', 'Quinoa or rice, tuna, mango, sesame', 'Quinoa of rijst, tonijn, mango, sesam'), price: 230, categoryId: bowlsCat.id, imageUrl: 'https://placehold.co/400x300/003049/fff?text=Tuna+Bowl' },
    { ...t('Веган боул', 'Веган боул', 'Vegan bowl', 'Vegane bowl'), ...d('Рис бурый, нори, баклажан, кунжут, соевый соус', 'Бурий рис, норі, баклажан', 'Brown rice, nori, eggplant, sesame, soy', 'Bruine rijst, nori, aubergine, soja'), price: 175, categoryId: bowlsCat.id, imageUrl: 'https://placehold.co/400x300/2d6a4f/fff?text=Vegan+B' },
    { ...t('Креветки + авокадо боул', 'Креветки + авокадо', 'Prawn avocado bowl', 'Garnaal avocado bowl'), ...d('Поке-стайл: креветка, рис, лайм, кинза, чили', 'Поке: креветка, рис, лайм, кінза, чилі', 'Poké: prawn, rice, lime, cilantro, chili', 'Poké: gamba, rijst, limoen, koriander, chili'), price: 240, categoryId: bowlsCat.id, imageUrl: 'https://placehold.co/400x300/e9c46a/1a1a1a?text=Poké+Shr', isCartRecommend: true, cartRecommendOrder: 0 },

    // --- СУПЫ (4) ---
    { ...t('Мисо суп', 'Місо суп', 'Miso soup', 'Misosoep'), ...d('Тофу, вакаме, лук, бульон мисо', 'Тофу, вакаме, цибуля', 'Tofu, wakame, spring onion, miso', 'Tofu, wakame, lente-ui, miso'), price: 85, categoryId: soupsCat.id, imageUrl: 'https://placehold.co/400x300/6f4e37/fff?text=Miso' },
    { ...t('Том ям с креветками', 'Том ям з креветками', 'Tom yum with prawns', 'Tom yam met garnalen'), ...d('Острый бульон, креветки, кокос, лемонграсс', 'Гострий бульйон, креветки, кокос', 'Spicy broth, prawns, coconut, lemongrass', 'Pittige bouillon, gamba, kokos, citroengras'), price: 265, categoryId: soupsCat.id, imageUrl: 'https://placehold.co/400x300/c1121f/fff?text=Tom+Yam', isPopular: true, isHomeHit: true, recommendOrder: 2 },
    { ...t('Рамен с курицей', 'Рамен з куркою', 'Chicken ramen', 'Kip ramen'), ...d('Сливочно-соевый бульон, курица, яйцо, нори', "Вершково-соївий бульйон, курка, яйце", 'Rich broth, chicken, egg, nori, corn', 'Kippenbouillon, ei, nori, maïs'), price: 195, categoryId: soupsCat.id, imageUrl: 'https://placehold.co/400x300/432818/fff?text=Ramen' },
    { ...t('Суп удон с грибами', 'Удон з грибами', 'Udon with mushrooms', 'Udon met paddenstoelen'), ...d('Пшеничная лапша, ситаке, зелёный лук', "Пшенична локшина, шиітаке", 'Udon wheat noodles, shiitake, scallions', 'Udon, shiitake, bosui'), price: 175, categoryId: soupsCat.id, imageUrl: 'https://placehold.co/400x300/4a4e69/fff?text=Udon' },

    // --- ЗАКУСКИ (6) ---
    { ...t('Салат чука', 'Салат чука', 'Chuka salad', 'Chukasalade'), ...d('Водоросли в ореховом соусе, кунжут', 'Водорослі в горіховому соусі', 'Seaweed, nutty dressing, sesame', 'Zeewier, notige dressing, sesam'), price: 115, categoryId: snacksCat.id, imageUrl: 'https://placehold.co/400x300/52b69a/fff?text=Chuka' },
    { ...t('Креветки темпура (6 шт)', 'Креветки темпура (6 шт)', 'Tempura prawns (6)', 'Tempura gamba (6)'), ...d('Подаются с лёгким соусом', 'Подаються з легким соусом', 'With light dipping sauce', 'Met lichte dipsaus'), price: 195, categoryId: snacksCat.id, imageUrl: 'https://placehold.co/400x300/f4a261/1a1a1a?text=Tempura' },
    { ...t('Спринг-роллы вег', 'Спрінг-роли вег', 'Vegetable spring rolls', 'Groente loempia’s'), ...d('С фирменным сладким чили', 'З солодким чилі', 'With sweet chili dip', 'Met zoete chilidip'), price: 125, categoryId: snacksCat.id, imageUrl: 'https://placehold.co/400x300/cae9ff/1a1a1a?text=Spring' },
    { ...t('Куриные крылья BBQ', 'Курячі крила BBQ', 'BBQ chicken wings', 'BBQ vleugels'), ...d('С хрустящей корочкой, лук порей', "Зі скоринкою, зелена цибуля", 'Crispy, BBQ glaze, scallions', 'Knapperig, BBQ, bosui'), price: 160, categoryId: snacksCat.id, imageUrl: 'https://placehold.co/400x300/7c2d12/fff?text=BBQ' },
    { ...t('Эдамаме', 'Едамаме', 'Edamame', 'Edamame'), ...d('Тёплые бобы с солью или чили-чеснок', 'Квасоля з сіллю або чилі', 'Warm with sea salt or chili garlic', 'Warm met zeezout of chililook'), price: 95, categoryId: snacksCat.id, imageUrl: 'https://placehold.co/400x300/95d5b2/1a1a1a?text=Edamame' },
    { ...t('Такояки (4 шт)', 'Такоякі (4 шт)', 'Takoyaki (4)', 'Takoyaki (4)'), ...d('Шарики с осьминогом, соус, стружка бонито', "Кульки з восьминогом, соус, боніто", 'Octopus balls, bonito flakes, okonomi', 'Inktvisballen, bonitovlokken, saus'), price: 145, categoryId: snacksCat.id, imageUrl: 'https://placehold.co/400x300/f77f00/1a1a1a?text=Takoyaki' },

    // --- СОУСЫ (5) ---
    { ...t('Соевый соус 40 мл', 'Соєвий соус 40 мл', 'Soy sauce 40 ml', 'Sojasaus 40 ml'), ...d('Классика к суши', 'Класика до суші', 'Classic pairing for sushi', 'Klassiek bij sushi'), price: 15, categoryId: saucesCat.id, imageUrl: 'https://placehold.co/400x300/1a1a1a/fff?text=Soy' },
    { ...t('Соус унаги', 'Соус унагі', 'Unagi sauce', 'Unagisaus'), ...d('Сладковато-соевый, к угрю', 'Солодко-сієвий, до вугра', 'Sweet thick soy, for eel dishes', 'Zoete, dikke soja, bij paling'), price: 35, categoryId: saucesCat.id, imageUrl: 'https://placehold.co/400x300/3c153b/fff?text=Unagi' },
    { ...t('Ореховый соус', 'Горіховий соус', 'Nut sauce', 'Notensaus'), ...d('К чуке и десертным роллам', 'До чуки та десертних ролів', 'For chuka and sweet rolls', 'Bij chuka en zoete rolls'), price: 32, categoryId: saucesCat.id, imageUrl: 'https://placehold.co/400x300/f9c74f/1a1a1a?text=Nut' },
    { ...t('Спайси майо', 'Спайсі майо', 'Spicy mayo', 'Pittige mayo'), ...d('Секретный рецепт, ядреный к чуке-гункан', 'Секретна формула, гострота', 'House spicy — try with gunkan', 'Huisgemaakt pittig — bij gunkan'), price: 28, categoryId: saucesCat.id, imageUrl: 'https://placehold.co/400x300/ff006e/fff?text=Spicy' },
    { ...t('Васаби (порция)', 'Васабі (порція)', 'Wasabi portion', 'Wasabi portie'), ...d('Свежемолотый хрен васаби', 'Свіжо посічений', 'Fresh wasabi or classic paste', 'Verse of klassieke wasabi'), price: 20, categoryId: saucesCat.id, imageUrl: 'https://placehold.co/400x300/2d6a4f/fff?text=Wasabi' },

    // --- НАПИТКИ (8) ---
    { ...t('Coca-Cola 0.5 л', 'Coca-Cola 0.5 л', 'Coca-Cola 0.5L', 'Coca-Cola 0,5L'), ...d('Охлаждённая', 'Охолоджена', 'Chilled can', 'Gekoeld'), price: 40, categoryId: drinksCat.id, imageUrl: 'https://placehold.co/400x300/e41f25/fff?text=Cola' },
    { ...t('Fanta Апельсин 0.5 л', 'Fanta Апельсин 0.5 л', 'Fanta Orange 0.5L', 'Fanta Orange 0,5L'), ...d('Газировка', 'Газований напій', 'Sparkling soft drink', 'Bruisend'), price: 40, categoryId: drinksCat.id, imageUrl: 'https://placehold.co/400x300/ff8800/fff?text=Fanta' },
    { ...t('Вода б/г 0.5', 'Вода н/г 0.5', 'Still water 0.5L', 'Plat water 0,5L'), ...d('Питьевая', 'Питна', 'Still mineral', 'Licht koolzuurvrij'), price: 25, categoryId: drinksCat.id, imageUrl: 'https://placehold.co/400x300/4cc9f0/1a1a1a?text=Water' },
    { ...t('Сок Rich апельсин 1л', 'Сік Rich апельсин 1л', 'Rich orange 1L', 'Sinaasappel 1L'), ...d('Нектар, безалкогольный', 'Нектар', 'Fruit nectar', 'Vruchtensap'), price: 48, categoryId: drinksCat.id, imageUrl: 'https://placehold.co/400x300/f77f00/fff?text=Juice' },
    { ...t('Липтон лимон 0.5', 'Lipton лимон 0.5', 'Lipton ice tea lemon', 'Lipton ijsthee citroen'), ...d('Холодный чай', "Холодний чай", 'Iced black tea, lemon', 'Koude thee, citroen'), price: 45, categoryId: drinksCat.id, imageUrl: 'https://placehold.co/400x300/ffd60a/1a1a1a?text=Ice+Tea' },
    { ...t('Матча латте 0.4', 'Матча латте 0.4', 'Matcha latte 0.4L', 'Matcha latte 0,4L'), ...d('Молоко, японский зелёный чай', 'Молоко, японський зелений чай', 'Milk and ceremonial matcha', 'Melk en matcha'), price: 75, categoryId: drinksCat.id, imageUrl: 'https://placehold.co/400x300/7cb518/1a1a1a?text=Matcha' },
    { ...t('Смузи манго', 'Смузі манго', 'Mango smoothie', 'Mango smoothie'), ...d('Без добавления сахара, фреш', 'Без дод. цукру', 'No extra sugar, fresh', 'Zonder suiker, vers'), price: 85, categoryId: drinksCat.id, imageUrl: 'https://placehold.co/400x300/ffbe0b/1a1a1a?text=Smoothie' },
    { ...t('Айрян 0.3', 'Айрян 0.3', 'Ayran 0.3L', 'Ayran 0,3L'), ...d('Солёно-кисломолочный, освежает', 'Солоно-молочний', 'Yoghurt drink, refreshing', 'Verfrissende yoghurtdrank'), price: 38, categoryId: drinksCat.id, imageUrl: 'https://placehold.co/400x300/90e0ef/1a1a1a?text=Ayran' },
  ]

  const legacyPlaceholdUrl = products.map((p) => p.imageUrl)

  // Placehold: замість ?text=… — унікальні ?n=index (без англійських написів на зображенні)
  products.forEach((p, i) => {
    if (p.imageUrl && String(p.imageUrl).includes('placehold.co')) {
      const base = String(p.imageUrl).split('?')[0]
      p.imageUrl = `${base}?n=${i}`
    }
  })

  const productI18nData = (row) => ({
    name_ua: row.name_ua,
    name_en: row.name_en,
    name_nl: row.name_nl,
    description_ua: row.description_ua,
    description_en: row.description_en,
    description_nl: row.description_nl,
    imageUrl: row.imageUrl,
  })

  const alreadyHasProducts = await prisma.product.count()
  if (alreadyHasProducts > 0) {
    console.log('⏭️ Товары в базе уже есть — пропуск пакетного сида (удалите товары для повторного заполнения).')
  } else {
    await prisma.product.createMany({ data: products })
    console.log(`✅ Создано товаров: ${products.length}`)
  }

  // 1) За name_ru + categoryId: переклади + нормалізований imageUrl (зняти англійські ?text= з placehold)
  let i18nRows = 0
  for (const row of products) {
    const res = await prisma.product.updateMany({
      where: { name_ru: row.name_ru, categoryId: row.categoryId },
      data: productI18nData(row),
    })
    i18nRows += res.count
  }
  if (i18nRows > 0) {
    console.log(`✅ Переклади (за name_ru) оновлено у ${i18nRows} позиції(й).`)
  }
  // 2) Той самий товар, але змінена назва RU в адмінці: злиття за imageUrl, як у seed
  let i18nByUrl = 0
  for (const row of products) {
    if (!row.imageUrl) continue
    const res = await prisma.product.updateMany({
      where: { imageUrl: row.imageUrl },
      data: productI18nData(row),
    })
    if (res.count) i18nByUrl += res.count
  }
  if (i18nByUrl > 0) {
    console.log(`✅ Переклади (за imageUrl) оновлено у ${i18nByUrl} позиції(й) — зокрема після зміни name_ru вручну.`)
  }
  // 3) Старі URL з ?text=… у БД
  let i18nLegacy = 0
  for (let i = 0; i < products.length; i++) {
    const row = products[i]
    const legacy = legacyPlaceholdUrl[i]
    if (!legacy || !row.imageUrl || legacy === row.imageUrl) continue
    const res = await prisma.product.updateMany({
      where: { imageUrl: legacy },
      data: productI18nData(row),
    })
    if (res.count) i18nLegacy += res.count
  }
  if (i18nLegacy > 0) {
    console.log(`✅ Оновлено ${i18nLegacy} поз. за старим placehold-URL (перехід ?text= → ?n=).`)
  }

  console.log('✅ Сид меню завершён.')

  try {
    execSync('npx tsx scripts/seed-countries.ts', { stdio: 'inherit' })
  } catch (e) {
    console.warn('⚠️ seed-countries:', e?.message || e)
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })