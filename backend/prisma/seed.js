import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Start seeding...');

  // 1. Очистка базы (важен порядок!)
  // Используем try-catch для игнорирования ошибок удаления, если таблиц еще нет
  try {
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();
  } catch (e) {
    console.log('⚠️ База была пуста или таблицы еще не созданы');
  }

  // 2. СОЗДАЕМ АДМИНА
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.create({
    data: {
      email: 'admin@sushi.com',
      password: hashedPassword,
      name: 'Big Boss',
      role: 'ADMIN',
      phone: '+380999999999'
    }
  });
  console.log(`👤 Admin created: ${admin.email}`);

  // 3. СОЗДАЕМ КАТЕГОРИИ
  const catRolls = await prisma.category.create({
    data: { name_ru: 'Роллы', name_en: 'Rolls', name_uk: 'Роли', name_nl: 'Rolls', slug: 'rolls' }
  });

  const catSets = await prisma.category.create({
    data: { name_ru: 'Сеты', name_en: 'Sets', name_uk: 'Сети', name_nl: 'Sets', slug: 'sets' }
  });

  const catDrinks = await prisma.category.create({
    data: { name_ru: 'Напитки', name_en: 'Drinks', name_uk: 'Напої', name_nl: 'Dranken', slug: 'drinks' }
  });

  // 4. СОЗДАЕМ ТОВАРЫ
  // --- Роллы ---
  await prisma.product.create({
    data: {
      categoryId: catRolls.id,
      price: 245.00,
      imageUrl: 'https://placehold.co/600x400/orange/white?text=Philadelphia',
      name_ru: 'Филадельфия Классик', name_en: 'Philadelphia Classic', name_uk: 'Філадельфія Класик', name_nl: 'Philadelphia Classic',
      ingredients_ru: 'Лосось, сливочный сыр, огурец, рис, нори',
      ingredients_en: 'Salmon, cream cheese, cucumber, rice, nori',
      isPopular: true
    }
  });

  await prisma.product.create({
    data: {
      categoryId: catRolls.id,
      price: 280.00,
      imageUrl: 'https://placehold.co/600x400/green/white?text=Green+Dragon',
      name_ru: 'Зеленый Дракон', name_en: 'Green Dragon', name_uk: 'Зелений Дракон', name_nl: 'Green Dragon',
      ingredients_ru: 'Угорь, авокадо, унаги соус, кунжут',
      ingredients_en: 'Eel, avocado, unagi sauce, sesame',
      isChefRecommendation: true
    }
  });

  // --- Сеты ---
  await prisma.product.create({
    data: {
      categoryId: catSets.id,
      price: 950.00,
      imageUrl: 'https://placehold.co/600x400/black/white?text=Ninja+Set',
      name_ru: 'Сет Ниндзя', name_en: 'Ninja Set', name_uk: 'Сет Ніндзя', name_nl: 'Ninja Set',
      description_ru: 'Большой набор для компании. 1 кг удовольствия.',
      isPopular: true
    }
  });

  // --- Напитки ---
  await prisma.product.create({
    data: {
      categoryId: catDrinks.id,
      price: 45.00,
      imageUrl: 'https://placehold.co/600x400/red/white?text=Cola',
      name_ru: 'Coca-Cola 0.5', name_en: 'Coca-Cola 0.5', name_uk: 'Coca-Cola 0.5', name_nl: 'Coca-Cola 0.5'
    }
  });

  console.log('✅ Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });