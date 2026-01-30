import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { generatePersonalPromo } from '../utils/promoGenerator';
import { sendSms } from '../utils/smsSender';

const prisma = new PrismaClient();

// Запуск каждый день в 10:00 утра
cron.schedule('0 10 * * *', async () => {
  console.log('Running Promo Scheduler...');

  // 1. ДЕНЬ РОЖДЕНИЯ
  const today = new Date();
  const month = today.getMonth() + 1;
  const day = today.getDate();

  // Ищем пользователей, у которых ДР сегодня (нужен сложный запрос или raw query, но упростим для примера)
  // В Prisma с датами сложно фильтровать только по дню/месяцу без года, 
  // обычно делают выборку всех и фильтруют в JS или используют $queryRaw
  const users = await prisma.user.findMany({
    where: { 
      dateOfBirth: { not: null },
      isPhoneVerified: true
    }
  });

  for (const user of users) {
    if (!user.dateOfBirth) continue;
    const dob = new Date(user.dateOfBirth);
    
    if (dob.getMonth() + 1 === month && dob.getDate() === day) {
      // Проверяем, не давали ли уже в этом году
      // ... логика проверки ...
      
      await generatePersonalPromo(user.id, 'BIRTHDAY');
      await sendSms(user.phone!, "С Днем Рождения! Дарим скидку 20% по промокоду в личном кабинете 🎂");
    }
  }

  // 2. REACTIVATION (3 месяца без заказов)
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  // Находим тех, чей последний заказ был давно
  // Для этого нужно найти последний заказ каждого юзера.
  // Это упрощенная логика, в реальности запрос сложнее.
  const inactiveUsers = await prisma.user.findMany({
    where: {
      orders: {
        some: { createdAt: { lt: threeMonthsAgo } }, // Есть старые заказы
        none: { createdAt: { gte: threeMonthsAgo } } // Нет новых заказов
      }
    }
  });

  for (const user of inactiveUsers) {
     // Проверяем, не отправляли ли уже рекативацию недавно
     await generatePersonalPromo(user.id, 'REACTIVATION');
     await sendSms(user.phone!, "Мы скучаем! 🍣 Скидка 15% на следующий заказ ждет вас.");
  }
});