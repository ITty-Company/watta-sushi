import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sendSms } from '../utils/smsSender'; // Твоя утилита отправки SMS

const router = Router();
const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET || 'secret-key';

// 1. РЕГИСТРАЦИЯ (Email + Pass + Phone)
router.post('/register', async (req: any, res: any) => {
  const { email, password, name, phone } = req.body;

  try {
    // Очистка телефона от лишних символов
    const cleanPhone = phone.replace(/\D/g, ''); 

    // Проверка уникальности Email
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({ message: 'Этот email уже используется' });
    }

    // Проверка уникальности Телефона (Главная защита!)
    const existingPhone = await prisma.user.findUnique({ where: { phone: cleanPhone } });
    if (existingPhone) {
      return res.status(400).json({ message: 'Этот номер телефона уже зарегистрирован' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Генерируем 4-значный код для SMS
    const verificationCode = Math.floor(1000 + Math.random() * 9000).toString();

    // Создаем пользователя
    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone: cleanPhone,
        verificationCode,
        isPhoneVerified: false // Важно: пока не подтвердил - false
      },
    });

    // Отправляем SMS
    try {
    // Пытаемся отправить СМС
    await sendSms(phone, `Код подтверждения Watta Sushi: ${verificationCode}`);
  } catch (smsError) {
    // Если не вышло - не страшно, просто пишем в лог
    console.error('Ошибка отправки СМС (игнорируем):', smsError);
    console.log('>>> ВАШ КОД ПОДТВЕРЖДЕНИЯ (СМС не ушло):', verificationCode, '<<<');
  }

    res.status(201).json({ message: 'Код подтверждения отправлен в SMS' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сервера при регистрации' });
  }
});

// 2. ПОДТВЕРЖДЕНИЕ КОДА (SMS)
router.post('/verify', async (req: any, res: any) => {
  const { email, code } = req.body; // Ищем по email, так как пользователь "в процессе" входа

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) return res.status(404).json({ message: 'Пользователь не найден' });
    if (user.isPhoneVerified) return res.status(400).json({ message: 'Уже подтвержден' });
    
    // Проверка кода
    if (user.verificationCode !== code) {
        return res.status(400).json({ message: 'Неверный код из SMS' });
    }

    // Активируем пользователя
    await prisma.user.update({
      where: { email },
      data: { isPhoneVerified: true, verificationCode: null }
    });

    // Выдаем токен
    const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role }, 
        SECRET_KEY, 
        { expiresIn: '30d' }
    );

    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка подтверждения' });
  }
});

// 3. ВХОД (Login)
router.post('/login', async (req: any, res: any) => {
  const { email, password } = req.body;
  
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ message: 'Неверный email или пароль' });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(400).json({ message: 'Неверный email или пароль' });

    // ГЛАВНОЕ: Не пускаем, если телефон не подтвержден
    if (!user.isPhoneVerified) {
        // Можно тут перегенерировать код и отправить SMS повторно, если нужно
        return res.status(403).json({ message: 'Номер телефона не подтвержден. Пожалуйста, завершите регистрацию.' });
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

// ... остальные роуты (check-user, users и т.д.) оставляем как есть

export default router;