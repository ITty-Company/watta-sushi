import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET || 'secret123'; // Тот же ключ, что при логине!

// Расширяем тип Request, чтобы TS не ругался (если используешь TypeScript)
export interface AuthRequest extends Request {
  user?: any;
}

export const checkAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // 1. Достаем токен из заголовка (Bearer eyJhbGci...)
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: 'Нет токена авторизации' });
    }

    const token = authHeader.split(' ')[1]; // Берем часть после "Bearer"

    // 2. Проверяем токен
    const decoded: any = jwt.verify(token, SECRET_KEY);
    
    // 3. Ищем юзера в базе и проверяем роль
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

    if (!user) {
      return res.status(401).json({ message: 'Пользователь не найден' });
    }

    if (user.role !== 'ADMIN') { // <--- САМАЯ ВАЖНАЯ ПРОВЕРКА
      return res.status(403).json({ message: 'Доступ запрещен! Вы не админ.' });
    }

    // Если все ок — пускаем дальше
    req.user = user;
    next();

  } catch (e) {
    return res.status(403).json({ message: 'Неверный токен' });
  }
};