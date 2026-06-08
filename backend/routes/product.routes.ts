import { Router, Request, Response } from 'express';
import { Prisma, PrismaClient } from '@prisma/client';
import { checkAdmin } from '../authMiddleware';
import { cachePublicGet, PUBLIC_CACHE_CATALOG_SEC, PUBLIC_CACHE_MENU_SEC } from '../lib/publicApiCache.js';
import { clearCatalogCache, getCached, setCached } from '../lib/memoryCache.js';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import multer from 'multer';
import { getUploadsDir } from '../lib/uploadsDir.js';
import {
  compressUploadedFileOnDisk,
  INGREDIENT_UPLOAD_PRESET,
  optimizeProductFileOnDisk,
  PRODUCT_UPLOAD_PRESET,
} from '../lib/compressUploadImage.js';
import {
  categorySlugFromNames,
  resolveUniqueCategorySlug,
} from '../lib/categorySlug.js';

const router = Router();
const prisma = new PrismaClient();

const MAX_PRODUCT_GALLERY = 24;
const MAX_IMAGE_URL_LENGTH = 2048;
const uploadDir = getUploadsDir();

const categoryImageDiskUpload = multer({
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
      cb(null, `category-${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`);
    },
  }),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype?.startsWith('image/')) cb(null, true);
    else cb(new Error('Дозволені лише зображення'));
  },
});

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

function persistDataUrlCategoryImage(dataUrl: string): string | null {
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
  if (buf.length < 24 || buf.length > 8 * 1024 * 1024) return null;

  const name = `category-${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${ext}`;
  const fp = path.join(uploadDir, name);
  try {
    fs.writeFileSync(fp, buf);
  } catch (e) {
    console.error('Category image write failed:', e);
    return null;
  }
  return `/uploads/${name}`;
}

function normalizeCategoryImageUrl(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') return null;
  const url = value.trim();
  if (!url) return null;
  if (url.startsWith('data:image/')) return persistDataUrlCategoryImage(url);
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

function bodyContainsDataUrl(imageUrls: unknown, imageUrl: unknown): boolean {
  const check = (v: unknown) => typeof v === 'string' && v.trim().startsWith('data:image/');
  if (check(imageUrl)) return true;
  if (Array.isArray(imageUrls)) return imageUrls.some(check);
  return false;
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

function isMissingIsArchivedColumn(e: unknown): boolean {
  const err = e as { code?: string; meta?: { column?: string }; message?: string };
  if (err?.code === 'P2022' && String(err?.meta?.column || '').toLowerCase().includes('isarchived')) {
    return true;
  }
  const msg = String(err?.message || e || '').toLowerCase();
  return msg.includes('isarchived') || msg.includes('unknown column') && msg.includes('product');
}

async function findPublicProducts(
  where: Prisma.ProductWhereInput = {},
  include: Prisma.ProductInclude = { category: true },
  extra?: Omit<Prisma.ProductFindManyArgs, 'where' | 'include'>,
) {
  try {
    return await prisma.product.findMany({
      where: { ...whereNotArchived, ...where },
      include,
      ...extra,
    });
  } catch (e) {
    if (isMissingIsArchivedColumn(e)) {
      console.warn('Product.isArchived missing — run prisma migrate deploy on backend');
      return await prisma.product.findMany({
        where,
        include,
        ...extra,
      });
    }
    throw e;
  }
}

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

/** Список меню: лише id інгредієнтів (без фото/назв) — клієнт зливає з GET /api/ingredients. */
function toMenuListProduct(
  p: { ingredients?: { id: number }[] } & Record<string, unknown>,
) {
  const base = sanitizeProductImagesForApi(p as { imageUrl?: string | null; imageUrls?: unknown });
  const ingredientIds = Array.isArray(p.ingredients)
    ? p.ingredients.map((i) => i.id).filter((id) => Number.isFinite(id) && id > 0)
    : [];
  const { ingredients: _ing, ...rest } = base as typeof base & { ingredients?: unknown };
  return { ...rest, ingredientIds };
}

/** Великі product-*.png у /uploads/ — перекодувати у JPEG у фоні (не блокує відповідь). */
function scheduleProductImagesOptimize(
  products: { id: number; imageUrl: string | null; imageUrls: unknown }[],
): void {
  const batch = products.slice(0, 24);
  void (async () => {
    for (const row of batch) {
      const urls = new Set<string>();
      const main = String(row.imageUrl || '').trim();
      if (main.startsWith('/uploads/product-')) urls.add(main);
      let gallery = row.imageUrls;
      if (typeof gallery === 'string') {
        try {
          gallery = JSON.parse(gallery);
        } catch {
          gallery = [];
        }
      }
      if (Array.isArray(gallery)) {
        for (const u of gallery) {
          const s = String(u || '').trim();
          if (s.startsWith('/uploads/product-')) urls.add(s);
        }
      }
      if (urls.size === 0) continue;

      const map = new Map<string, string>();
      for (const u of urls) {
        try {
          const optimized = await optimizeProductFileOnDisk(u);
          if (optimized && optimized !== u) map.set(u, optimized);
        } catch (e) {
          console.error(`Product image optimize failed id=${row.id} url=${u}:`, e);
        }
      }
      if (map.size === 0) continue;

      let imageUrl = main;
      if (map.has(imageUrl)) imageUrl = map.get(imageUrl)!;

      let imageUrlsArr = Array.isArray(gallery) ? [...gallery] : [];
      imageUrlsArr = imageUrlsArr.map((u) => {
        const s = String(u || '').trim();
        return map.has(s) ? map.get(s)! : s;
      });

      try {
        await prisma.product.update({
          where: { id: row.id },
          data: {
            imageUrl: imageUrl || imageUrlsArr[0] || '',
            imageUrls: imageUrlsArr,
          },
        });
      } catch (e) {
        console.error(`Product image optimize DB update failed id=${row.id}:`, e);
      }
    }
  })();
}

// 1. Получить ВСЕ товары (с фильтрацией по городу)
router.get('/', cachePublicGet(PUBLIC_CACHE_MENU_SEC), async (req, res) => {
  try {
    const cityId = req.query.cityId ? parseInt(req.query.cityId as string) : null;
    const cityWhere = whereVisibleInCity(Number.isFinite(cityId) && cityId > 0 ? cityId! : null);

    // In-memory кеш лише для анонімних запитів вітрини. Адмінка (з Authorization)
    // завжди отримує свіжі дані, бо мутації чистять кеш одразу.
    const cacheable = !req.headers.authorization;
    const cacheKey = `products:${Number.isFinite(cityId) && cityId! > 0 ? cityId : 'all'}`;
    if (cacheable) {
      const hit = getCached<unknown[]>(cacheKey);
      if (hit) {
        res.json(hit);
        return;
      }
    }

    const products = await findPublicProducts(cityWhere ? { ...cityWhere } : {}, {
      category: true,
      ingredients: { select: { id: true } },
    });
    scheduleProductImagesOptimize(
      products as { id: number; imageUrl: string | null; imageUrls: unknown }[],
    );
    const payload = products.map((p) =>
      toMenuListProduct(p as { ingredients?: { id: number }[] } & Record<string, unknown>),
    );
    if (cacheable) setCached(cacheKey, payload, PUBLIC_CACHE_MENU_SEC);
    res.json(payload);
  } catch (error) {
    console.error('Ошибка получения товаров:', error);
    res.status(500).json({ message: 'Ошибка получения товаров' });
  }
});

// 2. Получить ВСЕ категории (ВАЖНО: должен быть ПЕРЕД роутом /:id)
router.get('/categories', cachePublicGet(PUBLIC_CACHE_CATALOG_SEC), async (req, res) => {
  try {
    const cacheable = !req.headers.authorization;
    if (cacheable) {
      const hit = getCached<unknown[]>('categories:all');
      if (hit) {
        res.json(hit);
        return;
      }
    }
    const categories = await prisma.category.findMany({
      orderBy: { order: 'asc' }
    });
    if (cacheable) setCached('categories:all', categories, PUBLIC_CACHE_CATALOG_SEC);
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка получения категорий' });
  }
});

// 2.1. Создать категорию
router.post('/categories', checkAdmin, async (req: Request, res: Response) => {
  try {
    const { name_ru, name_ua, name_en, name_nl, slug, emoji, order, isActive, allowRecommendations, imageUrl, hoverImageUrl } = req.body;
    
    if (!name_ru) {
      return res.status(400).json({ error: 'Название категории (name_ru) обязательно' });
    }
    
    const normalizedImageUrl = imageUrl !== undefined ? normalizeCategoryImageUrl(imageUrl) : null;
    const normalizedHoverImageUrl = hoverImageUrl !== undefined ? normalizeCategoryImageUrl(hoverImageUrl) : null;
    
    const baseSlug = categorySlugFromNames({ slug, name_ru, name_ua, name_en, name_nl });
    const finalSlug = await resolveUniqueCategorySlug(prisma, baseSlug);
    
    const category = await prisma.category.create({
      data: {
        name_ru,
        name_ua: name_ua || name_ru,
        name_en: name_en || name_ru,
        name_nl: name_nl || name_ru,
        slug: finalSlug,
        emoji: emoji || '🍣',
        ...(imageUrl !== undefined ? { imageUrl: normalizedImageUrl } : {}),
        ...(hoverImageUrl !== undefined ? { hoverImageUrl: normalizedHoverImageUrl } : {}),
        order: order || 0,
        isActive: isActive !== undefined ? isActive : true,
        allowRecommendations: allowRecommendations !== undefined ? Boolean(allowRecommendations) : true
      }
    });
    clearCatalogCache();
    res.json(category);
  } catch (error: any) {
    console.error('Ошибка создания категории:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Категория с таким slug уже существует' });
    }
    res.status(500).json({ error: 'Ошибка создания категории', message: error.message });
  }
});

// 2.2. Обновить категорию
router.put('/categories/:id', checkAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { name_ru, name_ua, name_en, name_nl, slug, emoji, order, isActive, allowRecommendations, imageUrl, hoverImageUrl } = req.body;
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Категория не найдена' });
    }
    const baseSlug = categorySlugFromNames({
      slug,
      name_ru: name_ru ?? existing.name_ru,
      name_ua: name_ua ?? existing.name_ua,
      name_en: name_en ?? existing.name_en,
      name_nl: name_nl ?? existing.name_nl,
    });
    const finalSlug = await resolveUniqueCategorySlug(prisma, baseSlug, id);

    const category = await prisma.category.update({
      where: { id },
      data: {
        name_ru, name_ua, name_en, name_nl, slug: finalSlug, emoji, order, isActive,
        ...(allowRecommendations !== undefined ? { allowRecommendations: Boolean(allowRecommendations) } : {}),
        ...(imageUrl !== undefined ? { imageUrl: normalizeCategoryImageUrl(imageUrl) } : {}),
        ...(hoverImageUrl !== undefined ? { hoverImageUrl: normalizeCategoryImageUrl(hoverImageUrl) } : {}),
      }
    });
    clearCatalogCache();
    res.json(category);
  } catch (error: unknown) {
    console.error('Ошибка обновления категории:', error);
    if (error && typeof error === 'object' && 'code' in error && (error as { code?: string }).code === 'P2002') {
      return res.status(400).json({ error: 'Категория с таким slug уже существует' });
    }
    res.status(500).json({ error: 'Ошибка обновления категории' });
  }
});

// 2.3. Удалить категорию (товары переносятся в moveToCategoryId или в другую активную)
router.delete('/categories/:id', checkAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ error: 'Некорректный id категории' });
    }

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Категория не найдена' });
    }

    const rawMoveTo = req.query.moveToCategoryId ?? (req.body as { moveToCategoryId?: unknown })?.moveToCategoryId;
    const requestedMoveTo =
      rawMoveTo != null && String(rawMoveTo).trim() !== ''
        ? parseInt(String(rawMoveTo), 10)
        : null;

    const productsCount = await prisma.product.count({ where: { categoryId: id } });
    let movedToCategoryId: number | null = null;
    let movedToCategoryName: string | null = null;

    if (productsCount > 0) {
      let targetId = requestedMoveTo;
      if (targetId != null && (!Number.isFinite(targetId) || targetId <= 0 || targetId === id)) {
        targetId = null;
      }

      if (targetId != null) {
        const target = await prisma.category.findUnique({ where: { id: targetId } });
        if (!target) {
          return res.status(400).json({ error: 'Категория для переноса товаров не найдена' });
        }
        movedToCategoryId = target.id;
        movedToCategoryName = target.name_ru;
      } else {
        const fallback = await prisma.category.findFirst({
          where: { id: { not: id }, isActive: true },
          orderBy: [{ order: 'asc' }, { id: 'asc' }],
        });
        if (!fallback) {
          const anyOther = await prisma.category.findFirst({
            where: { id: { not: id } },
            orderBy: [{ order: 'asc' }, { id: 'asc' }],
          });
          if (!anyOther) {
            return res.status(400).json({
              error:
                'Нельзя удалить единственную категорию, пока в ней есть товары. Создайте другую категорию.',
              productsCount,
            });
          }
          movedToCategoryId = anyOther.id;
          movedToCategoryName = anyOther.name_ru;
        } else {
          movedToCategoryId = fallback.id;
          movedToCategoryName = fallback.name_ru;
        }
      }

      await prisma.product.updateMany({
        where: { categoryId: id },
        data: { categoryId: movedToCategoryId },
      });
    }

    await prisma.category.delete({ where: { id } });
    clearCatalogCache();
    res.json({
      message: 'Категория удалена',
      movedProducts: productsCount,
      movedToCategoryId,
      movedToCategoryName,
    });
  } catch (error) {
    console.error('Ошибка удаления категории:', error);
    res.status(500).json({ error: 'Ошибка удаления категории' });
  }
});

/** Завантаження іконки категорії для панелі меню (multipart). */
router.post('/categories/upload-image', checkAdmin, (req: Request, res: Response, next) => {
  categoryImageDiskUpload.single('image')(req, res, (err: unknown) => {
    if (err) {
      const msg = err instanceof Error ? err.message : 'Помилка завантаження';
      res.status(400).json({ message: msg });
      return;
    }
    next();
  });
}, async (req: Request, res: Response) => {
  const file = (req as Request & { file?: { filename: string } }).file;
  if (!file?.filename) {
    res.status(400).json({ message: 'Потрібен файл image' });
    return;
  }
  const url = await compressUploadedFileOnDisk(file.filename, 'category', INGREDIENT_UPLOAD_PRESET);
  res.json({ url: url ?? `/uploads/${file.filename}` });
});

/** Завантаження фото товару (multipart) — sharp JPEG після запису на диск. */
router.post('/upload-image', checkAdmin, (req: Request, res: Response, next) => {
  productImageDiskUpload.single('image')(req, res, (err: unknown) => {
    if (err) {
      const msg = err instanceof Error ? err.message : 'Помилка завантаження';
      res.status(400).json({ message: msg });
      return;
    }
    next();
  });
}, async (req: Request, res: Response) => {
  const file = (req as Request & { file?: { filename: string } }).file;
  if (!file?.filename) {
    res.status(400).json({ message: 'Потрібен файл image' });
    return;
  }
  const url = await compressUploadedFileOnDisk(file.filename, 'product', PRODUCT_UPLOAD_PRESET);
  res.json({ url: url ?? `/uploads/${file.filename}` });
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

    if (bodyContainsDataUrl(imageUrlsBody, imageUrl)) {
      return res.status(400).json({
        error:
          'Не отправляйте фото в base64 в JSON. Загрузите через кнопку «Добавить» и дождитесь «Фото загружено», затем сохраните.',
        message: 'product_image_data_url_forbidden',
      });
    }

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
    clearCatalogCache();
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

    if (bodyContainsDataUrl(imageUrlsBody, imageUrl)) {
      return res.status(400).json({
        error:
          'Не отправляйте фото в base64 в JSON. Загрузите через кнопку «Добавить» и дождитесь «Фото загружено», затем сохраните.',
        message: 'product_image_data_url_forbidden',
      });
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

    const category = await prisma.category.findUnique({ where: { id: cid }, select: { id: true } });
    if (!category) {
      return res.status(400).json({
        error: 'Категория не найдена. Обновите страницу и выберите категорию снова.',
        message: 'category_not_found',
      });
    }

    const cityIdsNorm = Array.isArray(cityIds)
      ? cityIds
          .map((cityId: unknown) => parseInt(String(cityId), 10))
          .filter((n) => Number.isFinite(n) && n > 0)
      : [];

    if (cityIdsNorm.length > 0) {
      const citiesFound = await prisma.city.count({ where: { id: { in: cityIdsNorm } } });
      if (citiesFound !== cityIdsNorm.length) {
        return res.status(400).json({
          error: 'Часть городов не найдена. Обновите страницу админки.',
          message: 'city_not_found',
        });
      }
    }

    const ingredientIdsNorm = Array.isArray(ingredientIds)
      ? ingredientIds
          .map((ingId: unknown) => parseInt(String(ingId), 10))
          .filter((n) => Number.isFinite(n) && n > 0)
      : [];

    if (ingredientIdsNorm.length > 0) {
      const ingFound = await prisma.ingredient.count({ where: { id: { in: ingredientIdsNorm } } });
      if (ingFound !== ingredientIdsNorm.length) {
        return res.status(400).json({
          error: 'Часть ингредиентов не найдена. Обновите вкладку «Ингредиенты» и страницу.',
          message: 'ingredient_not_found',
        });
      }
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

        cities:
          cityIdsNorm.length > 0
            ? {
                create: cityIdsNorm.map((cityId) => ({ cityId })),
              }
            : undefined,

        ingredients: {
          set: ingredientIdsNorm.map((id) => ({ id })),
        },
      },
      include: {
        cities: { include: { city: true } },
        ingredients: true,
      },
    });

    clearCatalogCache();
    res.json(sanitizeProductImagesForApi(updatedProduct));
  } catch (error: unknown) {
    console.error('PUT /api/products/:id', error);
    const code =
      typeof error === 'object' && error && 'code' in error
        ? String((error as { code: string }).code)
        : '';
    if (code === 'P2003' || code === 'P2025') {
      return res.status(400).json({
        message: 'Связанные данные устарели (категория, город или ингредиент). Обновите страницу.',
      });
    }
    const msg =
      error instanceof Error && error.message ? String(error.message) : 'Ошибка обновления товара';
    res.status(500).json({ message: msg, error: 'Ошибка обновления товара' });
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
      clearCatalogCache();
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

    clearCatalogCache();
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

    let recommendations = await findPublicProducts(
      baseWhere,
      { category: true, ingredients: true },
      {
        take,
        orderBy: [{ cartRecommendOrder: 'asc' }, { recommendOrder: 'asc' }, { id: 'asc' }],
      },
    );

    if (recommendations.length === 0) {
      recommendations = await findPublicProducts(
        {
          ...(excludeId && Number.isFinite(excludeId) ? { id: { not: excludeId } } : {}),
          ...(cityScope || {}),
        },
        { category: true, ingredients: true },
        {
          take: Math.min(12, take),
          orderBy: [{ isPopular: 'desc' }, { id: 'asc' }],
        },
      );
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

    const numericId = Number(id);
    const cacheable = !req.headers.authorization;
    const cacheKey = `product:${numericId}`;
    if (cacheable) {
      const hit = getCached<unknown>(cacheKey);
      if (hit) return res.json(hit);
    }

    const product = await prisma.product.findUnique({
      where: { id: numericId },
      include: { 
        category: true,
        cities: { include: { city: true } },
        ingredients: true // Не забудьте это, если нужны ингредиенты
      } 
    });

    if (!product || (product as { isArchived?: boolean }).isArchived === true) {
      return res.status(404).json({ error: 'Product not found' });
    }
    const payload = sanitizeProductImagesForApi(product);
    if (cacheable) setCached(cacheKey, payload, PUBLIC_CACHE_MENU_SEC);
    res.json(payload);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error fetching product' });
  }
});

export default router;