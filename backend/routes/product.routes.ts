import { Router, Request, Response } from 'express';
import { Prisma, PrismaClient } from '@prisma/client';
import { checkAdmin } from '../authMiddleware';
import { cachePublicGet, PUBLIC_CACHE_CATALOG_SEC, PUBLIC_CACHE_MENU_SEC } from '../lib/publicApiCache.js';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import multer from 'multer';
import { getUploadsDir } from '../lib/uploadsDir.js';

const router = Router();
const prisma = new PrismaClient();

const MAX_PRODUCT_GALLERY = 24;
const MAX_IMAGE_URL_LENGTH = 2048;
const uploadDir = getUploadsDir();

const productImageDiskUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const rawExt = path.extname(file.originalname || '').toLowerCase();
      const ext =
        rawExt === '.jpeg' || rawExt === '.jpg'
          ? '.jpg'
          : ['.png', '.webp', '.gif'].includes(rawExt)
            ? rawExt
            : '.jpg';
      cb(null, `product-${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`);
    },
  }),
  limits: { fileSize: 12 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype?.startsWith('image/')) cb(null, true);
    else cb(new Error('Дозволені лише зображення'));
  },
});

/** Адмінка шле data URL — зберігаємо у uploads, у БД лише /uploads/… */
function persistDataUrlProductImage(dataUrl: string): string | null {
  const trimmed = dataUrl.trim();
  const m = /^data:image\/(png|jpeg|jpg|webp|gif);base64,([\s\S]+)$/i.exec(trimmed);
  if (!m) return null;
  let ext = m[1].toLowerCase();
  if (ext === 'jpeg') ext = 'jpg';
  const b64 = m[2].replace(/\s/g, '');
  let buf: Buffer;
  try {
    buf = Buffer.from(b64, 'base64');
  } catch {
    return null;
  }
  if (buf.length < 24 || buf.length > 12 * 1024 * 1024) return null;

  const name = `product-${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${ext}`;
  const fp = path.join(uploadDir, name);
  try {
    fs.writeFileSync(fp, buf);
  } catch (e) {
    console.error('Product image write failed:', e);
    return null;
  }
  return `/uploads/${name}`;
}

function normalizeProductImageUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const url = value.trim();
  if (!url) return null;
  if (url.startsWith('data:image/')) return persistDataUrlProductImage(url);
  if (url.length > MAX_IMAGE_URL_LENGTH) return null;
  if (url.startsWith('/') || /^https?:\/\//i.test(url)) return url;
  return null;
}

/** Порядок URL у каруселі; data URL → файл у uploads */
function normalizeProductImageList(imageUrls: unknown, imageUrl: unknown): string[] {
  const fromArray = Array.isArray(imageUrls)
    ? imageUrls
        .map((x) => normalizeProductImageUrl(x))
        .filter((s): s is string => Boolean(s))
    : [];
  if (fromArray.length > 0) return fromArray.slice(0, MAX_PRODUCT_GALLERY);
  const single = normalizeProductImageUrl(imageUrl);
  return single ? [single] : [];
}

function hasIncomingImagePayload(imageUrls: unknown, imageUrl: unknown): boolean {
  if (Array.isArray(imageUrls)) {
    return imageUrls.some((x) => typeof x === 'string' && x.trim().length > 0);
  }
  return typeof imageUrl === 'string' && imageUrl.trim().length > 0;
}

function existingProductGallery(row: {
  imageUrl?: string | null;
  imageUrls?: unknown;
}): string[] {
  return normalizeProductImageList(row.imageUrls, row.imageUrl);
}

/** У відповідях API не віддаємо base64 — інакше /api/products важить десятки МБ і меню падає */
function sanitizeProductImagesForApi<T extends { imageUrl?: string | null; imageUrls?: unknown }>(p: T): T {
  const clean = (raw: string) => {
    const u = raw.trim();
    if (u.startsWith('data:') || u.startsWith('blob:') || u.length > MAX_IMAGE_URL_LENGTH) return '';
    return u;
  };
  const imageUrl = p.imageUrl != null && String(p.imageUrl).trim() !== '' ? clean(String(p.imageUrl)) : '';
  let imageUrls: string[] = [];
  if (Array.isArray(p.imageUrls)) {
    imageUrls = p.imageUrls
      .map((x) => (x == null ? '' : clean(String(x))))
      .filter((s) => s.length > 0)
      .slice(0, MAX_PRODUCT_GALLERY);
  }
  if (imageUrls.length === 0 && imageUrl) imageUrls = [imageUrl];
  return { ...p, imageUrl, imageUrls };
}

const whereNotArchived = { isArchived: false } as const;

/** Доступність у місті: явне додавання в ProductCity АБО «усі міста» (нема жодного зв’язку). */
function whereVisibleInCity(cityId: number | null) {
  if (cityId == null || !Number.isFinite(cityId) || cityId <= 0) return undefined;
  return {
    OR: [
      { cities: { some: { cityId } } },
      { cities: { none: {} } },
    ],
  } as const;
}

// 1. Получить ВСЕ товары (с фильтрацией по городу)
router.get('/', cachePublicGet(PUBLIC_CACHE_MENU_SEC), async (req, res) => {
  try {
    const cityId = req.query.cityId ? parseInt(req.query.cityId as string) : null;
    const cityWhere = whereVisibleInCity(Number.isFinite(cityId) && cityId > 0 ? cityId! : null);

    // Список для меню/адмін-таблиці: тільки category. Інакше 100+ товарів × ingredients → величезний JSON,
    // Safari/мобілка можуть не отримати тіло. Деталі — GET /:id, інгредієнти — /api/ingredients.
    const products = await prisma.product.findMany({
      where: { ...whereNotArchived, ...(cityWhere ? cityWhere : {}) },
      include: { category: true },
    });
    res.json(products.map(sanitizeProductImagesForApi));
  } catch (error) {
    console.error('Ошибка получения товаров:', error);
    res.status(500).json({ message: 'Ошибка получения товаров' });
  }
});

// 2. Получить ВСЕ категории (ВАЖНО: должен быть ПЕРЕД роутом /:id)
router.get('/categories', cachePublicGet(PUBLIC_CACHE_CATALOG_SEC), async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { order: 'asc' }
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка получения категорий' });
  }
});

// 2.1. Создать категорию
router.post('/categories', checkAdmin, async (req: Request, res: Response) => {
  try {
    const { name_ru, name_ua, name_en, name_nl, slug, emoji, order, isActive, allowRecommendations } = req.body;
    
    if (!name_ru) {
      return res.status(400).json({ error: 'Название категории (name_ru) обязательно' });
    }
    
    let categorySlug = slug || name_ru.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    let finalSlug = categorySlug;
    let counter = 1;
    const maxAttempts = 100;
    
    while (counter <= maxAttempts) {
      const existing = await prisma.category.findUnique({
        where: { slug: finalSlug }
      });
      if (!existing) break;
      finalSlug = `${categorySlug}-${counter}`;
      counter++;
    }
    
    if (counter > maxAttempts) finalSlug = `${categorySlug}-${Date.now()}`;
    
    const category = await prisma.category.create({
      data: {
        name_ru,
        name_ua: name_ua || name_ru,
        name_en: name_en || name_ru,
        name_nl: name_nl || name_ru,
        slug: finalSlug,
        emoji: emoji || '🍣',
        order: order || 0,
        isActive: isActive !== undefined ? isActive : true,
        allowRecommendations: allowRecommendations !== undefined ? Boolean(allowRecommendations) : true
      }
    });
    res.json(category);
  } catch (error: any) {
    console.error('Ошибка создания категории:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Категория с таким slug уже существует' });
    }
    res.status(500).json({ error: 'Ошибка создания категории', message: error.message });
  }
});

/** Слаг для маршрутів /menu; «-» або порожнє ламають фронт. */
function safeCategorySlug(input: unknown, name_ru: string | undefined): string {
  const base = (name_ru || 'category')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'category';
  if (input == null || String(input).trim() === '') return base;
  const s = String(input)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  if (s.length < 2 || s === '-' || s === '—') return base;
  return s;
}

// 2.2. Обновить категорию
router.put('/categories/:id', checkAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { name_ru, name_ua, name_en, name_nl, slug, emoji, order, isActive, allowRecommendations } = req.body;
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Категория не найдена' });
    }
    const nameForSlug = name_ru != null && String(name_ru).trim() !== '' ? String(name_ru) : existing.name_ru;
    const finalSlug = safeCategorySlug(slug, nameForSlug);

    const category = await prisma.category.update({
      where: { id },
      data: {
        name_ru, name_ua, name_en, name_nl, slug: finalSlug, emoji, order, isActive,
        ...(allowRecommendations !== undefined ? { allowRecommendations: Boolean(allowRecommendations) } : {})
      }
    });
    res.json(category);
  } catch (error) {
    console.error('Ошибка обновления категории:', error);
    res.status(500).json({ error: 'Ошибка обновления категории' });
  }
});

// 2.3. Удалить категорию
router.delete('/categories/:id', checkAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const productsCount = await prisma.product.count({ where: { categoryId: id } });
    
    if (productsCount > 0) {
      return res.status(400).json({ error: 'Нельзя удалить категорию с товарами.' });
    }
    
    await prisma.category.delete({ where: { id } });
    res.json({ message: 'Категория удалена' });
  } catch (error) {
    console.error('Ошибка удаления категории:', error);
    res.status(500).json({ error: 'Ошибка удаления категории' });
  }
});

/** Завантаження фото товару (multipart) — надійніше за base64 у JSON. */
router.post('/upload-image', checkAdmin, (req: Request, res: Response, next) => {
  productImageDiskUpload.single('image')(req, res, (err: unknown) => {
    if (err) {
      const msg = err instanceof Error ? err.message : 'Помилка завантаження';
      res.status(400).json({ message: msg });
      return;
    }
    next();
  });
}, (req: Request, res: Response) => {
  const file = (req as Request & { file?: { filename: string } }).file;
  if (!file?.filename) {
    res.status(400).json({ message: 'Потрібен файл image' });
    return;
  }
  res.json({ url: `/uploads/${file.filename}` });
});

// 3. Создать товар
router.post('/', checkAdmin, async (req: Request, res: Response) => {
  try {
    const { 
      name_ru, name_ua, name_en, name_nl, 
      price, 
      description_ru, description_ua, description_en, description_nl,
      categoryId, imageUrl, imageUrls: imageUrlsBody,
      cityIds, // массив ID городов
      ingredientIds, // массив ID ингредиентов
      isPopular,
      isMenuNew,
      isHomeHit,
      isCartRecommend,
      recommendOrder,
      cartRecommendOrder,
      promoDiscountPercent
    } = req.body;

    const nameRuT = [name_ru, name_ua, name_en, name_nl]
      .map((s) => (s != null && String(s).trim() !== '' ? String(s).trim() : ''))
      .find((s) => s !== '')
    if (!nameRuT) {
      return res.status(400).json({
        error: 'Введите название товара (хотя бы на одном языке).',
        message: 'name_required',
      })
    }

    const cid = parseInt(String(categoryId), 10)
    if (!Number.isFinite(cid) || cid < 1) {
      return res.status(400).json({
        error: 'Выберите категорию из списка.',
        message: 'categoryId_invalid',
      })
    }

    const priceN = Number(price)
    if (!Number.isFinite(priceN) || priceN < 0) {
      return res.status(400).json({
        error: 'Укажите корректную цену (число ≥ 0).',
        message: 'price_invalid',
      })
    }

    const cityIdsNorm =
      cityIds && Array.isArray(cityIds)
        ? cityIds
            .map((x: unknown) => parseInt(String(x), 10))
            .filter((n) => Number.isFinite(n) && n > 0)
        : []

    const ingredientIdsNorm =
      ingredientIds && Array.isArray(ingredientIds)
        ? ingredientIds
            .map((x: unknown) => parseInt(String(x), 10))
            .filter((n) => Number.isFinite(n) && n > 0)
        : []

    const promoPct = Math.min(100, Math.max(0, Math.round(Number(promoDiscountPercent) || 0)))

    const gallery = normalizeProductImageList(imageUrlsBody, imageUrl);
    if (hasIncomingImagePayload(imageUrlsBody, imageUrl) && gallery.length === 0) {
      return res.status(400).json({
        error:
          'Не вдалося зберегти фото. Спробуйте менший файл або перевірте UPLOAD_DIR / диск на сервері.',
        message: 'product_image_save_failed',
      });
    }
    const img = gallery[0] ?? null;

    const descRu = description_ru != null ? String(description_ru) : ''
    const nonEmpty = (s: unknown) => (s != null && String(s).trim() !== '' ? String(s) : '')

    const product = await prisma.product.create({
      data: {
        name_ru: name_ru && String(name_ru).trim() !== '' ? String(name_ru).trim() : nameRuT,
        name_ua: nonEmpty(name_ua) || nameRuT,
        name_en: nonEmpty(name_en) || nameRuT,
        name_nl: nonEmpty(name_nl) || nameRuT,
        price: priceN,
        description_ru: descRu,
        description_ua: nonEmpty(description_ua) || descRu,
        description_en: nonEmpty(description_en) || descRu,
        description_nl: nonEmpty(description_nl) || descRu,
        categoryId: cid,
        imageUrl: img,
        imageUrls: gallery,
        isPopular: Boolean(isPopular),
        isMenuNew: Boolean(isMenuNew),
        isHomeHit: Boolean(isHomeHit),
        isCartRecommend: Boolean(isCartRecommend),
        recommendOrder: Math.round(Number(recommendOrder) || 0),
        cartRecommendOrder: Math.round(Number(cartRecommendOrder) || 0),
        promoDiscountPercent: promoPct,
        cities:
          cityIdsNorm.length > 0
            ? {
                create: cityIdsNorm.map((cityId) => ({ cityId })),
              }
            : undefined,

        ingredients:
          ingredientIdsNorm.length > 0
            ? { connect: ingredientIdsNorm.map((id) => ({ id })) }
            : undefined
      },
      include: {
        cities: { include: { city: true } },
        ingredients: true
      }
    });
    res.json(sanitizeProductImagesForApi(product));
  } catch (error: any) {
    console.error(error);
    const hint =
      typeof error?.code === 'string' && error.code.startsWith('P')
        ? ` (Prisma ${error.code})`
        : ''
    res.status(500).json({
      error: 'Ошибка создания товара',
      message: error?.message ? `${String(error.message)}${hint}` : 'Проверьте категорию, города и миграции БД.',
    });
  }
});

// 4. Обновить товар
router.put('/:id', checkAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { 
      name_ru, name_ua, name_en, name_nl,
      price, 
      description_ru, description_ua, description_en, description_nl,
      imageUrl, imageUrls: imageUrlsBody, categoryId,
      cityIds,
      ingredientIds, // массив ID ингредиентов
      isPopular,
      isMenuNew,
      isHomeHit,
      isCartRecommend,
      recommendOrder,
      cartRecommendOrder,
      promoDiscountPercent
    } = req.body;

    const promoPct = Math.min(100, Math.max(0, Math.round(Number(promoDiscountPercent) || 0)));
    const productId = parseInt(id, 10);

    const cid = parseInt(String(categoryId), 10);
    if (!Number.isFinite(cid) || cid < 1) {
      return res.status(400).json({
        error: 'Выберите категорию из списка.',
        message: 'categoryId_invalid',
      });
    }

    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
      select: { imageUrl: true, imageUrls: true },
    });
    if (!existingProduct) {
      return res.status(404).json({ message: 'Товар не найден' });
    }

    let gallery = normalizeProductImageList(imageUrlsBody, imageUrl);
    const incomingImages = hasIncomingImagePayload(imageUrlsBody, imageUrl);
    if (incomingImages && gallery.length === 0) {
      return res.status(400).json({
        error:
          'Не вдалося зберегти фото. Спробуйте менший файл або перевірте UPLOAD_DIR / диск на сервері.',
        message: 'product_image_save_failed',
      });
    }
    if (!incomingImages && gallery.length === 0) {
      gallery = existingProductGallery(existingProduct);
    }

    // Сначала удаляем все связи с городами (старый метод)
    await prisma.productCity.deleteMany({
      where: { productId },
    });

    // Для ингредиентов проще использовать set: [] внутри update, Prisma сама разберется

    const priceN = Number(price);
    if (!Number.isFinite(priceN) || priceN < 0) {
      return res.status(400).json({
        error: 'Укажите корректную цену (число ≥ 0).',
        message: 'price_invalid',
      });
    }

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        name_ru, name_ua, name_en, name_nl,
        price: priceN,
        description_ru, description_ua, description_en, description_nl,
        categoryId: cid,
        imageUrl: gallery[0] || '',
        imageUrls: gallery,
        isPopular: Boolean(isPopular),
        isMenuNew: Boolean(isMenuNew),
        isHomeHit: Boolean(isHomeHit),
        isCartRecommend: Boolean(isCartRecommend),
        recommendOrder: Math.round(Number(recommendOrder) || 0),
        cartRecommendOrder: Math.round(Number(cartRecommendOrder) || 0),
        promoDiscountPercent: promoPct,

        // Обновляем связи с городами
        cities: cityIds && Array.isArray(cityIds) && cityIds.length > 0 ? {
          create: cityIds.map((cityId: any) => ({
            cityId: parseInt(cityId)
          }))
        } : undefined,

        // Обновляем ингредиенты (перезаписываем список)
        ingredients: {
            set: ingredientIds && Array.isArray(ingredientIds) 
                 ? ingredientIds.map((ingId: any) => ({ id: Number(ingId) }))
                 : []
        }
      },
      include: {
        cities: { include: { city: true } },
        ingredients: true
      }
    });

    res.json(sanitizeProductImagesForApi(updatedProduct));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка обновления товара' });
  }
});

// 5. Удалить товар (повне видалення або архівація, якщо є в замовленнях)
router.delete('/:id', checkAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const productId = parseInt(id, 10);
    if (!Number.isFinite(productId)) {
      return res.status(400).json({ message: 'Некорректный ID товара' });
    }
    const existing = await prisma.product.findUnique({ where: { id: productId } });
    if (!existing) {
      return res.status(404).json({ message: 'Товар не найден' });
    }
    if (existing.isArchived) {
      return res.json({
        message: 'Товар уже убран из меню',
        id: productId,
        archived: true,
      });
    }

    const orderItems = await prisma.orderItem.count({ where: { productId } });

    if (orderItems > 0) {
      await prisma.$transaction(async (tx) => {
        await tx.productCity.deleteMany({ where: { productId } });
        await tx.favorite.deleteMany({ where: { productId } });
        await tx.product.update({
          where: { id: productId },
          data: {
            isArchived: true,
            isPopular: false,
            isMenuNew: false,
            isHomeHit: false,
            isCartRecommend: false,
            ingredients: { set: [] },
          },
        });
      });
      return res.json({
        message: 'Товар убран из меню (есть в заказах)',
        id: productId,
        archived: true,
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.favorite.deleteMany({ where: { productId } });
      await tx.productCity.deleteMany({ where: { productId } });
      await tx.product.update({
        where: { id: productId },
        data: { ingredients: { set: [] } },
      });
      await tx.product.delete({ where: { id: productId } });
    });

    res.json({ message: 'Товар удален', id: productId, archived: false });
  } catch (error: unknown) {
    console.error('DELETE /api/products/:id', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2003' || error.code === 'P2014') {
        return res.status(409).json({
          message:
            'Нельзя удалить: товар связан с заказами. Обновите страницу — после деплоя он будет скрыт из меню.',
        });
      }
      if (error.code === 'P2025') {
        return res.status(404).json({ message: 'Товар не найден' });
      }
      if (error.code === 'P2022') {
        return res.status(503).json({
          message: 'Нужна миграция БД (isArchived). Запустите deploy бэкенда с migrate deploy.',
        });
      }
    }
    res.status(500).json({ message: 'Ошибка удаления' });
  }
});

router.get('/recommendations', cachePublicGet(PUBLIC_CACHE_MENU_SEC), async (req: any, res: any) => {
  try {
    const excludeId = req.query.excludeId ? parseInt(String(req.query.excludeId), 10) : null;
    const cityId = req.query.cityId ? parseInt(String(req.query.cityId), 10) : null;
    const take = Math.min(48, Math.max(4, parseInt(String(req.query.limit || '24'), 10) || 24));

    const cityScope =
      cityId && Number.isFinite(cityId) && cityId > 0 ? whereVisibleInCity(cityId) : undefined;

    const baseWhere: any = {
      ...whereNotArchived,
      isCartRecommend: true,
      category: { is: { allowRecommendations: true } },
      ...(excludeId && Number.isFinite(excludeId) ? { id: { not: excludeId } } : {}),
      ...(cityScope || {}),
    };

    let recommendations = await prisma.product.findMany({
      where: baseWhere,
      take,
      include: { category: true, ingredients: true },
      orderBy: [{ cartRecommendOrder: 'asc' }, { recommendOrder: 'asc' }, { id: 'asc' }],
    });

    if (recommendations.length === 0) {
      recommendations = await prisma.product.findMany({
        where: {
          ...whereNotArchived,
          ...(excludeId && Number.isFinite(excludeId) ? { id: { not: excludeId } } : {}),
          ...(cityScope || {}),
        },
        take: Math.min(12, take),
        include: { category: true, ingredients: true },
        orderBy: [{ isPopular: 'desc' }, { id: 'asc' }],
      });
    }

    res.json(recommendations.map(sanitizeProductImagesForApi));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error fetching recommendations' });
  }
});

// ============================================
// ПОТОМ динамические маршруты (:id)
// ============================================

// 6. Получить один товар по ID
router.get('/:id', cachePublicGet(PUBLIC_CACHE_MENU_SEC), async (req: any, res: any) => {
  const { id } = req.params;
  try {
    // Проверка на категории, если вдруг запрос пролетел
    if (id === 'categories' || id === 'recommendations') return res.status(404).json({ error: 'Not found here' });
    
    if (isNaN(Number(id))) return res.status(400).json({ error: 'Invalid ID' });

    const product = await prisma.product.findUnique({
      where: { id: Number(id) },
      include: { 
        category: true,
        cities: { include: { city: true } },
        ingredients: true // Не забудьте это, если нужны ингредиенты
      } 
    });

    if (!product || product.isArchived) return res.status(404).json({ error: 'Product not found' });
    res.json(sanitizeProductImagesForApi(product));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error fetching product' });
  }
});

export default router;