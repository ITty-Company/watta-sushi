// import { Router } from 'express';
// import { PrismaClient } from '@prisma/client';
// import bcrypt from 'bcryptjs';
// import jwt from 'jsonwebtoken';
// import { checkAdmin } from '../authMiddleware.js';
// import { sendVerificationEmail } from '../utils/mailer';

// const router = Router();
// const prisma = new PrismaClient();

// // POST /api/auth/login
// router.post('/register', async (req: any, res: any) => {
//   const { email, password, name, phone } = req.body;

//   try {
//     const existingUser = await prisma.user.findUnique({ where: { email } });
//     if (existingUser) {
//       return res.status(400).json({ message: 'Пользователь уже существует' });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);
//     // Генерируем 6-значный код
//     const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

//     await prisma.user.create({
//       data: {
//         email,
//         password: hashedPassword,
//         name,
//         phone,
//         verificationCode,
//         isVerified: false // Сначала не подтвержден
//       },
//     });

//     // Отправляем письмо
//     try {
//       await sendVerificationEmail(email, verificationCode);
//     } catch (emailError) {
//       console.error("Ошибка отправки письма:", emailError);
//       // Не блокируем регистрацию, но можно вернуть предупреждение
//     }

//     res.status(201).json({ message: 'Код подтверждения отправлен на почту' });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Ошибка сервера' });
//   }
// });
// // 2. Подтверждение почты (НОВЫЙ РОУТ)
// router.post('/verify', async (req: any, res: any) => {
//   const { email, code } = req.body;

//   try {
//     const user = await prisma.user.findUnique({ where: { email } });

//     if (!user) return res.status(404).json({ message: 'Пользователь не найден' });
//     if (user.isVerified) return res.status(400).json({ message: 'Уже подтвержден' });
//     if (user.verificationCode !== code) return res.status(400).json({ message: 'Неверный код' });

//     // Активируем пользователя и убираем код
//     await prisma.user.update({
//       where: { email },
//       data: { isVerified: true, verificationCode: null }
//     });

//     // Сразу создаем токен для входа
//     const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, SECRET_KEY, { expiresIn: '7d' });

//     res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
//   } catch (error) {
//     res.status(500).json({ message: 'Ошибка подтверждения' });
//   }
// });

// // 3. Логин (добавляем проверку верификации, по желанию)
// router.post('/login', async (req: any, res: any) => {
//   const { email, password } = req.body;
  
//   try {
//     const user = await prisma.user.findUnique({ where: { email } });
//     if (!user) return res.status(400).json({ message: 'Неверные данные' });

//     // Проверка пароля
//     const isValid = await bcrypt.compare(password, user.password);
//     if (!isValid) return res.status(400).json({ message: 'Неверные данные' });

//     // (Опционально) Блокировать вход без подтверждения
//     // if (!user.isVerified) return res.status(403).json({ message: 'Email не подтвержден' });

//     const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, SECRET_KEY, { expiresIn: '7d' });
//     res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
//   } catch (e) {
//     res.status(500).json({ message: 'Ошибка входа' });
//   }
// });



// // POST /api/auth/register (На будущее, для обычных юзеров)
// router.post('/register', async (req: any, res: any) => {
//     try {
//         const { email, password, name, phone } = req.body;

//         // Валидация
//         if (!email || !password) {
//             return res.status(400).json({ message: 'Email и пароль обязательны' });
//         }

//         // Проверка формата email
//         const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//         if (!emailRegex.test(email)) {
//             return res.status(400).json({ message: 'Неверный формат email' });
//         }

//         // Проверка минимальной длины пароля
//         if (password.length < 6) {
//             return res.status(400).json({ message: 'Пароль должен содержать минимум 6 символов' });
//         }

//         const existingUser = await prisma.user.findUnique({ where: { email } });
//         if (existingUser) return res.status(400).json({ message: 'Email уже занят' });

//         const hashedPassword = await bcrypt.hash(password, 10);

//         const user = await prisma.user.create({
//             data: {
//                 email,
//                 password: hashedPassword,
//                 name,
//                 phone,
//                 role: 'USER' // По умолчанию - обычный юзер
//             }
//         });

//         // Сразу даем токен, чтобы не логиниться после регистрации
//         const secret = process.env.JWT_SECRET;
//         if (!secret) {
//             console.error('⚠️ JWT_SECRET не установлен!');
//             return res.status(500).json({ message: 'Ошибка конфигурации сервера' });
//         }
//         const token = jwt.sign({ userId: user.id, role: user.role }, secret, { expiresIn: '24h' });

//         res.status(201).json({ 
//           token, 
//           user: { 
//             id: user.id, 
//             email: user.email, 
//             name: user.name,
//             phone: user.phone,
//             role: user.role 
//           } 
//         });

//     } catch (error: any) {
//         console.error('Ошибка регистрации:', error);
        
//         // Более детальная обработка ошибок
//         if (error.code === 'P2002') {
//             // Prisma unique constraint violation
//             return res.status(400).json({ message: 'Email уже занят' });
//         }
        
//         if (error.name === 'PrismaClientKnownRequestError') {
//             return res.status(400).json({ message: 'Ошибка базы данных. Попробуйте позже.' });
//         }
        
//         // Для других ошибок возвращаем общее сообщение
//         res.status(500).json({ 
//             message: error.message || 'Ошибка регистрации. Попробуйте позже.' 
//         });
//     }
// });

// // GET /api/auth/check-user?email=... - Проверка существования пользователя
// router.get('/check-user', async (req: any, res: any) => {
//     try {
//         const { email } = req.query;
        
//         if (!email) {
//             return res.status(400).json({ message: 'Email обязателен' });
//         }

//         const user = await prisma.user.findUnique({ where: { email: email as string } });
        
//         res.json({ exists: !!user });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Ошибка проверки пользователя' });
//     }
// });

// // GET /api/auth/users - Получить список всех пользователей (только для админов)
// router.get('/users', checkAdmin, async (req: any, res: any) => {
//     try {
//         const users = await prisma.user.findMany({
//             select: {
//                 id: true,
//                 email: true,
//                 name: true,
//                 phone: true,
//                 role: true,
//                 createdAt: true,
//                 updatedAt: true,
//                 _count: {
//                     select: {
//                         orders: true
//                     }
//                 }
//             },
//             orderBy: {
//                 createdAt: 'desc'
//             }
//         });

//         res.json(users);
//     } catch (error) {
//         console.error('Ошибка получения пользователей:', error);
//         res.status(500).json({ message: 'Ошибка получения пользователей' });
//     }
// });

// export default router;

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sendVerificationEmail } from '../utils/mailer.js'; // Добавьте .js если используете ESM
import { checkAdmin } from '../authMiddleware.js'; // Убедитесь, что импорт правильный

const router = Router();
const prisma = new PrismaClient();

// Объявляем SECRET_KEY в начале файла
const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key-change-it';

// 1. РЕГИСТРАЦИЯ (с отправкой кода)
router.post('/register', async (req: any, res: any) => {
  const { email, password, name, phone } = req.body;

  try {
    // Валидация
    if (!email || !password || !name) {
       return res.status(400).json({ message: 'Заполните все поля' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Пользователь уже существует' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
        verificationCode,
        isVerified: false
      },
    });

    try {
      await sendVerificationEmail(email, verificationCode);
    } catch (emailError) {
      console.error("Ошибка отправки письма:", emailError);
    }

    res.status(201).json({ message: 'Код подтверждения отправлен на почту' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// 2. ПОДТВЕРЖДЕНИЕ
router.post('/verify', async (req: any, res: any) => {
  const { email, code } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) return res.status(404).json({ message: 'Пользователь не найден' });
    if (user.isVerified) return res.status(400).json({ message: 'Уже подтвержден' });
    if (user.verificationCode !== code) return res.status(400).json({ message: 'Неверный код' });

    await prisma.user.update({
      where: { email },
      data: { isVerified: true, verificationCode: null }
    });

    const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, SECRET_KEY, { expiresIn: '7d' });

    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка подтверждения' });
  }
});

// 3. ВХОД
router.post('/login', async (req: any, res: any) => {
  const { email, password } = req.body;
  
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ message: 'Неверные данные' });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(400).json({ message: 'Неверные данные' });

    // Опционально: проверка isVerified
    // if (!user.isVerified) return res.status(403).json({ message: 'Email не подтвержден' });

    const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, SECRET_KEY, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (e) {
    res.status(500).json({ message: 'Ошибка входа' });
  }
});

// Дополнительные роуты (проверка юзера, список юзеров)
router.get('/check-user', async (req: any, res: any) => {
    // ... ваш код check-user
    try {
        const { email } = req.query;
        if (!email) return res.status(400).json({ message: 'Email required' });
        const user = await prisma.user.findUnique({ where: { email: email as string } });
        res.json({ exists: !!user });
    } catch (e) {
        res.status(500).json({ error: 'Error' });
    }
});

router.get('/users', checkAdmin, async (req: any, res: any) => {
    try {
        const users = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(users);
    } catch (e) {
        res.status(500).json({ error: 'Error' });
    }
});

export default router;