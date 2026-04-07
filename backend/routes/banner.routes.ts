import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

function clampFocal(value: unknown, fallback: number): number {
  const n =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? parseFloat(value)
        : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(100, n));
}

// 1. Получить все активные баннеры (отсортированные по порядку)
router.get('/', async (req, res) => {
  try {
    const banners = await prisma.banner.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        order: 'asc'
      }
    });
    res.json(banners);
  } catch (error) {
    console.error('Ошибка получения баннеров:', error);
    res.status(500).json({ message: 'Ошибка получения баннеров' });
  }
});

// 2. Получить все баннеры (включая неактивные) для админки
router.get('/all', async (req, res) => {
  try {
    const banners = await prisma.banner.findMany({
      orderBy: {
        order: 'asc'
      }
    });
    res.json(banners);
  } catch (error) {
    console.error('Ошибка получения всех баннеров:', error);
    res.status(500).json({ message: 'Ошибка получения баннеров' });
  }
});

// 3. Создать баннер
router.post('/', async (req: Request, res: Response) => {
  try {
    const { 
      title_ru, title_ua, title_en, title_nl,
      imageUrl, order, isActive,
      focalX, focalY
    } = req.body;

    const banner = await prisma.banner.create({
      data: {
        title_ru,
        title_ua: title_ua || title_ru,
        title_en: title_en || title_ru,
        title_nl: title_nl || title_ru,
        imageUrl,
        focalX: clampFocal(focalX, 50),
        focalY: clampFocal(focalY, 50),
        order: order || 0,
        isActive: isActive !== undefined ? isActive : true
      }
    });
    res.json(banner);
  } catch (error) {
    console.error('Ошибка создания баннера:', error);
    res.status(500).json({ error: 'Ошибка создания баннера' });
  }
});

// 4. Обновить баннер
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { 
      title_ru, title_ua, title_en, title_nl,
      imageUrl, order, isActive,
      focalX, focalY
    } = req.body;

    const banner = await prisma.banner.update({
      where: { id },
      data: {
        title_ru,
        title_ua,
        title_en,
        title_nl,
        imageUrl,
        ...(focalX !== undefined && focalX !== null
          ? { focalX: clampFocal(focalX, 50) }
          : {}),
        ...(focalY !== undefined && focalY !== null
          ? { focalY: clampFocal(focalY, 50) }
          : {}),
        order,
        isActive
      }
    });
    res.json(banner);
  } catch (error) {
    console.error('Ошибка обновления баннера:', error);
    res.status(500).json({ error: 'Ошибка обновления баннера' });
  }
});

// 5. Удалить баннер
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.banner.delete({
      where: { id }
    });
    res.json({ message: 'Баннер удален' });
  } catch (error) {
    console.error('Ошибка удаления баннера:', error);
    res.status(500).json({ error: 'Ошибка удаления баннера' });
  }
});

export default router;
