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
      email: adminEmail,
      password: hashedPassword,
      name: 'Администратор',
      role: 'ADMIN'
    }
  })
  console.log('✅ Admin user created:', adminEmail)

  // 1. Создаем ВСЕ категории
  const categories = [
    { name_ru: 'Роллы', slug: 'rolls', emoji: '🍣', order: 0 },
    { name_ru: 'Суши', slug: 'sushi', emoji: '🍙', order: 1 },
    { name_ru: 'Сеты', slug: 'sets', emoji: '🍱', order: 2 },
    { name_ru: 'Супы', slug: 'soups', emoji: '🍜', order: 3 },
    { name_ru: 'Боулы', slug: 'bowls', emoji: '🥗', order: 4 },
    { name_ru: 'Закуски', slug: 'snacks', emoji: '🍤', order: 5 },
    { name_ru: 'Напитки', slug: 'drinks', emoji: '🧃', order: 6 },
    { name_ru: 'Соусы', slug: 'sauces', emoji: '🌶️', order: 7 },
  ]

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        emoji: cat.emoji,
        order: cat.order
      },
      create: cat,
    })
  }
  console.log('✅ Categories created')

  // Получаем ID всех категорий
  const rollsCat = await prisma.category.findUnique({ where: { slug: 'rolls' } })
  const sushiCat = await prisma.category.findUnique({ where: { slug: 'sushi' } })
  const setsCat = await prisma.category.findUnique({ where: { slug: 'sets' } })
  const bowlsCat = await prisma.category.findUnique({ where: { slug: 'bowls' } })
  const soupsCat = await prisma.category.findUnique({ where: { slug: 'soups' } })
  const snacksCat = await prisma.category.findUnique({ where: { slug: 'snacks' } })
  const drinksCat = await prisma.category.findUnique({ where: { slug: 'drinks' } })
  const saucesCat = await prisma.category.findUnique({ where: { slug: 'sauces' } })

  // 2. Создаем товары
  const products = [
    // --- РОЛЛЫ ---
    {
      name_ru: 'Филадельфия Лайт',
      price: 180,
      description_ru: 'Лосось, сливочный сыр, огурец, рис, нори',
      categoryId: rollsCat.id,
      imageUrl: 'https://placehold.co/400x300/orange/white?text=Phila'
    },
    {
      name_ru: 'Калифорния с крабом',
      price: 160,
      description_ru: 'Снежный краб, авокадо, огурец, икра масаго',
      categoryId: rollsCat.id,
      imageUrl: 'https://placehold.co/400x300/red/white?text=Cali'
    },
    {
      name_ru: 'Золотой Дракон',
      price: 240,
      description_ru: 'Угорь, авокадо, унаги соус, кунжут',
      categoryId: rollsCat.id,
      imageUrl: 'https://placehold.co/400x300/gold/black?text=Dragon'
    },

    // --- СУШИ ---
    {
      name_ru: 'Суши с лососем',
      price: 55,
      description_ru: 'Свежий лосось, рис',
      categoryId: sushiCat.id,
      imageUrl: 'https://placehold.co/400x300/salmon/white?text=Sushi+Sal'
    },
    {
      name_ru: 'Гункан Чука',
      price: 60,
      description_ru: 'Водоросли чука, ореховый соус, рис, нори',
      categoryId: sushiCat.id,
      imageUrl: 'https://placehold.co/400x300/green/white?text=Gunkan'
    },

    // --- СЕТЫ ---
    {
      name_ru: 'Сет Филадельфия',
      price: 650,
      description_ru: 'Три вида Филадельфии для большой компании (32 шт)',
      categoryId: setsCat.id,
      isPopular: true,
      imageUrl: 'https://placehold.co/400x300/orange/white?text=Set+Phila'
    },
    {
      name_ru: 'Сет Жара',
      price: 500,
      description_ru: 'Запеченные роллы с мидиями и крабом',
      categoryId: setsCat.id,
      imageUrl: 'https://placehold.co/400x300/red/white?text=Set+Hot'
    },

    // --- БОУЛЫ ---
    {
      name_ru: 'Боул с лососем',
      price: 220,
      description_ru: 'Рис, лосось, авокадо, бобы эдамаме, чука, соус поке',
      categoryId: bowlsCat.id,
      imageUrl: 'https://placehold.co/400x300/orange/white?text=Bowl+Salmon'
    },
    {
      name_ru: 'Боул с курицей терияки',
      price: 190,
      description_ru: 'Рис, курица, кукуруза, огурец, соус терияки, кунжут',
      categoryId: bowlsCat.id,
      imageUrl: 'https://placehold.co/400x300/brown/white?text=Bowl+Chicken'
    },

    // --- СУПЫ ---
    {
      name_ru: 'Мисо суп',
      price: 80,
      description_ru: 'Бульон мисо, тофу, водоросли вакаме, зеленый лук',
      categoryId: soupsCat.id,
      imageUrl: 'https://placehold.co/400x300/brown/white?text=Miso'
    },
    {
      name_ru: 'Том Ям с креветками',
      price: 260,
      description_ru: 'Острый бульон, креветки, грибы, кокосовое молоко, кинза',
      categoryId: soupsCat.id,
      isPopular: true,
      imageUrl: 'https://placehold.co/400x300/red/white?text=TomYum'
    },

    // --- ЗАКУСКИ ---
    {
      name_ru: 'Салат Чука',
      price: 110,
      description_ru: 'Водоросли чука, ореховый соус, кунжут',
      categoryId: snacksCat.id,
      imageUrl: 'https://placehold.co/400x300/green/white?text=Chuka'
    },
    {
      name_ru: 'Креветки темпура (5 шт)',
      price: 180,
      description_ru: 'Тигровые креветки в хрустящем кляре',
      categoryId: snacksCat.id,
      imageUrl: 'https://placehold.co/400x300/orange/white?text=Tempura'
    },

    // --- СОУСЫ ---
    {
      name_ru: 'Соевый соус',
      price: 15,
      description_ru: 'Классический соевый соус (40г)',
      categoryId: saucesCat.id,
      imageUrl: 'https://placehold.co/400x300/black/white?text=Soy'
    },
    {
      name_ru: 'Ореховый соус',
      price: 30,
      description_ru: 'Густой и ароматный соус к чуке (40г)',
      categoryId: saucesCat.id,
      imageUrl: 'https://placehold.co/400x300/yellow/black?text=Nut'
    },

    // --- НАПИТКИ ---
    {
      name_ru: 'Coca-Cola 0.5',
      price: 35,
      description_ru: 'Классическая кола',
      categoryId: drinksCat.id,
      imageUrl: 'https://placehold.co/400x300/black/white?text=Cola'
    },
    {
      name_ru: 'Сок Rich Апельсин',
      price: 45,
      description_ru: 'Апельсиновый нектар 1л',
      categoryId: drinksCat.id,
      imageUrl: 'https://placehold.co/400x300/orange/white?text=Juice'
    }
  ]

  for (const product of products) {
    // Используем upsert, чтобы не дублировать товары при повторном запуске
    try {
      await prisma.product.create({ data: product })
    } catch (error) {
      // Игнорируем ошибки дубликатов (если товар уже существует)
      if (!error.message?.includes('Unique constraint') && !error.code?.includes('P2002')) {
        console.warn(`⚠️ Ошибка при создании товара ${product.name_ru}:`, error.message)
      }
    }
  }

  console.log('✅ Full Menu created!')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })