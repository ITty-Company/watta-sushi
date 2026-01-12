import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// 1. Проверить код (для Клиента)
router.post('/check', async (req: Request, res: Response) => {
  try {
    const { code } = req.body;
    if (!code) { res.status(400).json({ message: 'Введите код' }); return; }

    const promo = await prisma.promoCode.findUnique({
      where: { code: code.toUpperCase() } 
    });

    if (!promo || !promo.isActive) {
      res.status(404).json({ message: 'Промокод не найден или неактивен' });
      return;
    }
    res.json({ success: true, discount: promo.discount, code: promo.code });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка проверки' });
  }
});

// 2. Получить ВСЕ коды (для Админа) - НОВОЕ
router.get('/', async (req, res) => {
  try {
    const promos = await prisma.promoCode.findMany({ orderBy: { id: 'desc' } });
    res.json(promos);
  } catch (e) {
    res.status(500).json({ error: 'Ошибка получения списка' });
  }
});

// 3. Создать код (для Админа)
router.post('/create', async (req: Request, res: Response) => {
  try {
    const { code, discount } = req.body;
    const newPromo = await prisma.promoCode.create({
      data: { 
        code: code.toUpperCase(), 
        discount: parseInt(discount),
        isActive: true
      }
    });
    res.json(newPromo);
  } catch (e) {
    res.status(500).json({ error: 'Код уже существует или ошибка' });
  }
});

// 4. Удалить код (для Админа) - НОВОЕ
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.promoCode.delete({ where: { id: parseInt(id) } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Ошибка удаления' });
  }
});

export default router;