import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'
import { getJwtSecret } from './lib/jwtSecret'

const prisma = new PrismaClient()

export interface AuthRequest extends Request {
  user?: { id: number; role?: string; email?: string | null; name?: string | null }
}

/** Адмінські операції (БД, розсилки, банери тощо). */
export const checkAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader) {
      return res.status(401).json({ message: 'Нет токена авторизации' })
    }

    const token = req.cookies?.auth_token || req.headers.authorization?.split(' ')[1];
    const decoded = jwt.verify(token, getJwtSecret()) as { userId?: string | number }
    const uid = Number(decoded.userId)
    if (!Number.isFinite(uid)) {
      return res.status(403).json({ message: 'Неверный токен' })
    }

    const user = await prisma.user.findUnique({ where: { id: uid } })

    if (!user) {
      return res.status(401).json({ message: 'Пользователь не найден' })
    }

    if (user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Доступ запрещен! Вы не админ.' })
    }

    req.user = { id: user.id, role: user.role, email: user.email, name: user.name }
    next()
  } catch {
    return res.status(403).json({ message: 'Неверный токен' })
  }
}

/** Залогінений клієнт (обране, «мої замовлення»). `req.user.id` — з JWT, без довіри до body/query. */
export const authenticateUser = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader) {
      return res.status(401).json({ message: 'Нет токена авторизации' })
    }
    const token = req.cookies?.auth_token || req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Нет токена авторизации' })
    }
    const decoded = jwt.verify(token, getJwtSecret()) as { userId?: string | number }
    const uid = Number(decoded.userId)
    if (!Number.isFinite(uid)) {
      return res.status(403).json({ message: 'Неверный токен' })
    }
    req.user = { id: uid }
    next()
  } catch {
    return res.status(403).json({ message: 'Неверный токен' })
  }
}
