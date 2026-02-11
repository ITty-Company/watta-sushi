import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const generatePersonalPromo = async (userId: number, type: 'WELCOME' | 'BIRTHDAY' | 'REACTIVATION') => {
  
  let prefix = '';
  let discount = 0;
  let daysValid = 7;

  switch (type) {
    case 'WELCOME':
      prefix = 'HELLO';
      discount = 10; // 10% скидка новичкам
      daysValid = 14;
      break;
    case 'BIRTHDAY':
      prefix = 'BDAY';
      discount = 20; // 20% на ДР
      daysValid = 7; // Действует неделю
      break;
    case 'REACTIVATION':
      prefix = 'COMEBACK';
      discount = 15; // 15% тем, кто пропал
      daysValid = 30;
      break;
  }

  // Генерируем уникальный хвост
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  const code = `${prefix}-${randomSuffix}`;
  
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + daysValid);

  // Сохраняем в БД
  await prisma.personalPromo.create({
    data: {
      userId,
      code,
      type,
      discount,
      expiresAt
    }
  });

  // Тут можно сразу отправить SMS: "Вам начислен промокод HELLO-XD21 на скидку 10%!"
  // await sendSms(userPhone, `Вам подарок! Промокод ${code} на скидку ${discount}%`);
};