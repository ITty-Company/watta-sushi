import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { checkAdmin } from '../authMiddleware.js';

const router = Router();
const prisma = new PrismaClient();

// POST /api/auth/login
router.post('/login', async (req: any, res: any) => {
  try {
    const { email, password } = req.body;

    // 1. Ищем пользователя
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'Пользователь не найден' });
    }

    // 2. Проверяем пароль
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(400).json({ message: 'Неверный пароль' });
    }

    // 3. Создаем токен (пропуск)
    const secret = process.env.JWT_SECRET || 'secret';
    const token = jwt.sign(
      { userId: user.id, role: user.role }, // Что зашито в токене
      secret,
      { expiresIn: '24h' } // Срок действия 24 часа
    );

    // 4. Отправляем ответ
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// POST /api/auth/register (На будущее, для обычных юзеров)
router.post('/register', async (req: any, res: any) => {
    try {
        const { email, password, name, phone } = req.body;

        // Валидация
        if (!email || !password) {
            return res.status(400).json({ message: 'Email и пароль обязательны' });
        }

        // Проверка формата email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Неверный формат email' });
        }

        // Проверка минимальной длины пароля
        if (password.length < 6) {
            return res.status(400).json({ message: 'Пароль должен содержать минимум 6 символов' });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) return res.status(400).json({ message: 'Email уже занят' });

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                phone,
                role: 'USER' // По умолчанию - обычный юзер
            }
        });

        // Сразу даем токен, чтобы не логиниться после регистрации
        const secret = process.env.JWT_SECRET || 'secret';
        const token = jwt.sign({ userId: user.id, role: user.role }, secret, { expiresIn: '24h' });

        res.status(201).json({ 
          token, 
          user: { 
            id: user.id, 
            email: user.email, 
            name: user.name,
            phone: user.phone,
            role: user.role 
          } 
        });

    } catch (error: any) {
        console.error('Ошибка регистрации:', error);
        
        // Более детальная обработка ошибок
        if (error.code === 'P2002') {
            // Prisma unique constraint violation
            return res.status(400).json({ message: 'Email уже занят' });
        }
        
        if (error.name === 'PrismaClientKnownRequestError') {
            return res.status(400).json({ message: 'Ошибка базы данных. Попробуйте позже.' });
        }
        
        // Для других ошибок возвращаем общее сообщение
        res.status(500).json({ 
            message: error.message || 'Ошибка регистрации. Попробуйте позже.' 
        });
    }
});

// GET /api/auth/check-user?email=... - Проверка существования пользователя
router.get('/check-user', async (req: any, res: any) => {
    try {
        const { email } = req.query;
        
        if (!email) {
            return res.status(400).json({ message: 'Email обязателен' });
        }

        const user = await prisma.user.findUnique({ where: { email: email as string } });
        
        res.json({ exists: !!user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ошибка проверки пользователя' });
    }
});

// GET /api/auth/users - Получить список всех пользователей (только для админов)
router.get('/users', checkAdmin, async (req: any, res: any) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                phone: true,
                role: true,
                createdAt: true,
                updatedAt: true,
                _count: {
                    select: {
                        orders: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.json(users);
    } catch (error) {
        console.error('Ошибка получения пользователей:', error);
        res.status(500).json({ message: 'Ошибка получения пользователей' });
    }
});

export default router;