import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

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

        res.status(201).json({ token, user: { id: user.id, email: user.email, role: user.role } });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ошибка регистрации' });
    }
});

export default router;