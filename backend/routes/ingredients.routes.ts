import { Router, Request, Response } from 'express';
import { Prisma, PrismaClient } from '@prisma/client';
import { checkAdmin } from '../authMiddleware';
import { cachePublicGet, PUBLIC_CACHE_CATALOG_SEC } from '../lib/publicApiCache.js';
import { optimizeIngredientFileOnDisk } from '../lib/compressUploadImage.js';
import {
  normalizeIngredientImageUrl,
  persistDataUrlIngredientImage,
  sanitizeIngredientForApi,
} from '../lib/ingredientImage.js';

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

/** Поступово переносить base64 з БД у /uploads/ (не блокує відповідь). */
function scheduleIngredientImageRepair(
  rows: { id: number; imageUrl: string }[],
): void {
  const pending = rows.filter((r) => String(r.imageUrl).trim().startsWith('data:image/'));
  if (pending.length === 0) return;

  void (async () => {
    for (const row of pending) {
      try {
        const saved = await persistDataUrlIngredientImage(row.imageUrl);
        if (!saved) continue;
        await prisma.ingredient.update({
          where: { id: row.id },
          data: { imageUrl: saved },
        });
      } catch (e) {
        console.error(`Ingredient image repair failed id=${row.id}:`, e);
      }
    }
  })();
}

/** Великі PNG/JPEG у /uploads/ — перекодувати у легкий JPEG (фон). */
function scheduleIngredientImageOptimize(
  rows: { id: number; imageUrl: string }[],
): void {
  const candidates = rows.filter((r) => {
    const u = String(r.imageUrl).trim();
    return u.startsWith('/uploads/ingredient-');
  });
  if (candidates.length === 0) return;

  void (async () => {
    for (const row of candidates) {
      try {
        const optimized = await optimizeIngredientFileOnDisk(row.imageUrl);
        if (!optimized || optimized === row.imageUrl) continue;
        await prisma.ingredient.update({
          where: { id: row.id },
          data: { imageUrl: optimized },
        });
      } catch (e) {
        console.error(`Ingredient image optimize failed id=${row.id}:`, e);
      }
    }
  })();
}

router.get('/', cachePublicGet(PUBLIC_CACHE_CATALOG_SEC), async (_req: Request, res: Response) => {
  try {
    const list = await prisma.ingredient.findMany({ orderBy: { id: 'asc' } });
    scheduleIngredientImageRepair(list);
    scheduleIngredientImageOptimize(list);
    res.json(list.map((row) => sanitizeIngredientForApi(row)));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка загрузки ингредиентов' });
  }
});

router.post('/', checkAdmin, async (req: Request, res: Response) => {
  try {
    const names = normalizeIngredientNames(req.body as Record<string, unknown>);
    const imageUrl = await normalizeIngredientImageUrl(
      (req.body as { imageUrl?: unknown }).imageUrl,
    );
    if (!names) {
      return res.status(400).json({ message: 'Укажите название (RU) и переводы' });
    }
    if (!imageUrl) {
      return res.status(400).json({ message: 'Добавьте фото ингредиента' });
    }
    const ing = await prisma.ingredient.create({
      data: { ...names, imageUrl },
    });
    res.json(sanitizeIngredientForApi(ing));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка создания ингредиента' });
  }
});

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
        ? await normalizeIngredientImageUrl(imageUrlRaw)
        : String(existing.imageUrl ?? '').trim();
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
    res.json(sanitizeIngredientForApi(ing));
  } catch (error) {
    console.error(error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({ message: 'Ингредиент не найден' });
    }
    res.status(500).json({ message: 'Ошибка обновления ингредиента' });
  }
});

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
