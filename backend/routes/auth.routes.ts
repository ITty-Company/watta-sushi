import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sendSms } from '../utils/smsSender';

const router = Router();
const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET || 'secret-key';

// 1. РЕГИСТРАЦИЯ
router.post('/register', async (req: any, res: any) => {
  const { email, password, name, phone } = req.body;

  try {
    const cleanPhone = phone.replace(/\D/g, ''); 

    // 1. Ищем, есть ли уже записи с таким Email или Телефоном
    const existingEmailUser = await prisma.user.findUnique({ where: { email } });
    const existingPhoneUser = await prisma.user.findUnique({ where: { phone: cleanPhone } });

    // 2. Если есть ПОДТВЕРЖДЕННЫЙ пользователь с таким Email — ошибка
    if (existingEmailUser && existingEmailUser.isPhoneVerified) {
      return res.status(400).json({ message: 'Этот email уже используется' });
    }

    // 3. Если есть ПОДТВЕРЖДЕННЫЙ пользователь с таким Телефоном — ошибка
    if (existingPhoneUser && existingPhoneUser.isPhoneVerified) {
      return res.status(400).json({ message: 'Этот номер телефона уже зарегистрирован' });
    }

    // Подготовка данных
    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationCode = Math.floor(1000 + Math.random() * 9000).toString();

    // Логика обработки "черновиков" (неподтвержденных пользователей)
    let userToUpdate = null;

    // Если нашли неподтвержденного по email
    if (existingEmailUser && !existingEmailUser.isPhoneVerified) {
        userToUpdate = existingEmailUser;
    }
    
    // Если нашли неподтвержденного по телефону
    if (existingPhoneUser && !existingPhoneUser.isPhoneVerified) {
        // Сценарий конфликта: нашли двух разных неподтвержденных (одного по email, другого по phone)
        if (userToUpdate && userToUpdate.id !== existingPhoneUser.id) {
             // Удаляем того, кого нашли по телефону, чтобы освободить номер для обновления основного аккаунта
             await prisma.user.delete({ where: { id: existingPhoneUser.id } });
        } else if (!userToUpdate) {
             // Если по email никого не нашли, берем этого пользователя для обновления
             userToUpdate = existingPhoneUser;
        }
    }

    if (userToUpdate) {
        // ОБНОВЛЯЕМ существующую неподтвержденную запись
        // Это позволяет "перезапустить" регистрацию для того же email/телефона
        await prisma.user.update({
            where: { id: userToUpdate.id },
            data: {
                email, 
                phone: cleanPhone, 
                password: hashedPassword,
                name,
                verificationCode,
                // isPhoneVerified оставляем false (или можно явно указать false)
            }
        });
    } else {
        // СОЗДАЕМ новую запись, если совпадений не найдено
        await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                phone: cleanPhone,
                verificationCode,
                isPhoneVerified: false 
            },
        });
    }

    // Отправка СМС
    try {
      await sendSms(phone, `Код подтверждения Watta Sushi: ${verificationCode}`);
    } catch (smsError) {
      console.error('Ошибка отправки СМС:', smsError);
      console.log('>>> КОД ПОДТВЕРЖДЕНИЯ:', verificationCode, '<<<');
    }

    res.status(201).json({ message: 'Код подтверждения отправлен' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сервера при регистрации' });
  }
});

// 2. ПОДТВЕРЖДЕНИЕ КОДА (ИСПРАВЛЕНО: Ищем по телефону)
router.post('/verify', async (req: any, res: any) => {
  // БЫЛО: const { email, code } = req.body;
  // СТАЛО: Берем телефон, так как код пришел на телефон
  const { phone, code } = req.body; 

  try {
    if (!phone) return res.status(400).json({ message: 'Не указан телефон' });

    // Очищаем телефон так же, как при регистрации
    const cleanPhone = phone.replace(/\D/g, '');

    // Ищем пользователя по ТЕЛЕФОНУ
    const user = await prisma.user.findUnique({ where: { phone: cleanPhone } });

    if (!user) return res.status(404).json({ message: 'Пользователь с таким телефоном не найден' });
    
    // Если уже подтвержден - просто отдаем токен (чтобы не было ошибки)
    if (user.isPhoneVerified) {
        const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, SECRET_KEY, { expiresIn: '30d' });
        return res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
    }

    // Проверка кода
    if (user.verificationCode !== code) {
        // Для тестов можно оставить лазейку, если код '1111'
        // if (code !== '1111' && user.verificationCode !== code) ...
        return res.status(400).json({ message: 'Неверный код' });
    }

    // Обновляем статус
    const updatedUser = await prisma.user.update({
      where: { id: user.id }, // Надежнее обновлять по ID
      data: { isPhoneVerified: true, verificationCode: null }
    });

    // Генерируем токен
    const token = jwt.sign(
        { userId: updatedUser.id, email: updatedUser.email, role: updatedUser.role }, 
        SECRET_KEY, 
        { expiresIn: '30d' }
    );

    // Возвращаем данные. Фронтенд ждет user.id!
    res.json({ 
        token, 
        user: { 
            id: updatedUser.id, 
            email: updatedUser.email, 
            name: updatedUser.name, 
            phone: updatedUser.phone,
            role: updatedUser.role 
        } 
    });

  } catch (error) {
    console.error('Ошибка верификации:', error);
    res.status(500).json({ message: 'Ошибка сервера при подтверждении' });
  }
});

// ... логин оставляем как был
router.post('/login', async (req: any, res: any) => {
  const { email, password } = req.body;
  
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ message: 'Неверный email или пароль' });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(400).json({ message: 'Неверный email или пароль' });

    if (!user.isPhoneVerified) {
        return res.status(403).json({ message: 'Номер телефона не подтвержден.' });
    }

    const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role }, 
        SECRET_KEY, 
        { expiresIn: '30d' }
    );
    
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (e) {
    res.status(500).json({ message: 'Ошибка входа' });
  }
});

export default router;