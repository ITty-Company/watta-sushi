import { Router, Request, Response } from 'express';
import { Prisma, PrismaClient } from '@prisma/client';
import { checkAdmin } from '../authMiddleware';

const router = Router();
const prisma = new PrismaClient();

function normalizeIngredientNames(body: Record<string, unknown>): {
  name_ru: string;
  name_ua: string;
  name_en: string;
  name_nl: string;
} | null {
  const name_ru = String(body.name_ru ?? '').trim();
  if (!name_ru) return null;
  const name_ua = String(body.name_ua ?? '').trim() || name_ru;
  const name_en = String(body.name_en ?? '').trim() || name_ru;
  const name_nl = String(body.name_nl ?? '').trim() || name_ru;
  return { name_ru, name_ua, name_en, name_nl };
}

// Получить все ингредиенты
router.get('/', async (_req: Request, res: Response) => {
  try {
    const list = await prisma.ingredient.findMany({ orderBy: { id: 'asc' } });
    res.json(list);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка загрузки ингредиентов' });
  }
});

// Создать ингредиент
router.post('/', checkAdmin, async (req: Request, res: Response) => {
  try {
    const names = normalizeIngredientNames(req.body as Record<string, unknown>);
    const imageUrl = String((req.body as { imageUrl?: unknown }).imageUrl ?? '').trim();
    if (!names) {
      return res.status(400).json({ message: 'Укажите название (RU) и переводы' });
    }
    if (!imageUrl) {
      return res.status(400).json({ message: 'Добавьте фото ингредиента' });
    }
    const ing = await prisma.ingredient.create({
      data: { ...names, imageUrl },
    });
    res.json(ing);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка создания ингредиента' });
  }
});

// Обновить ингредиент
router.put('/:id', checkAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ message: 'Некорректный ID' });
    }
    const existing = await prisma.ingredient.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: 'Ингредиент не найден' });
    }
    const names = normalizeIngredientNames(req.body as Record<string, unknown>);
    const imageUrlRaw = (req.body as { imageUrl?: unknown }).imageUrl;
    const imageUrl =
      imageUrlRaw !== undefined && imageUrlRaw !== null
        ? String(imageUrlRaw).trim()
        : existing.imageUrl;
    if (!names) {
      return res.status(400).json({ message: 'Укажите название (RU) и переводы' });
    }
    if (!imageUrl) {
      return res.status(400).json({ message: 'Добавьте фото ингредиента' });
    }
    const ing = await prisma.ingredient.update({
      where: { id },
      data: { ...names, imageUrl },
    });
    res.json(ing);
  } catch (error) {
    console.error(error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({ message: 'Ингредиент не найден' });
    }
    res.status(500).json({ message: 'Ошибка обновления ингредиента' });
  }
});

// Удалить ингредиент
router.delete('/:id', checkAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ message: 'Некорректный ID' });
    }
    const existing = await prisma.ingredient.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: 'Ингредиент не найден' });
    }
    await prisma.$transaction(async (tx) => {
      await tx.ingredient.update({
        where: { id },
        data: { products: { set: [] } },
      });
      await tx.ingredient.delete({ where: { id } });
    });
    res.json({ message: 'Ингредиент удален', id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка удаления ингредиента' });
  }
});

export default router;
