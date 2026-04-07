import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();
const prisma = new PrismaClient();

/** Після збереження в БД лише короткі шляхи /uploads/… або зовнішні URL */
const MAX_IMAGE_URL_LENGTH = 2048;

const uploadDir = path.join(__dirname, '../../web/public/uploads');

function ensureUploadDir() {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
}

/** Адмінка шле base64 data URL після вибору файлу — зберігаємо у web/public/uploads (як promotions). */
function persistDataUrlBannerImage(dataUrl: string): string | null {
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
  if (buf.length < 24) return null;
  if (buf.length > 12 * 1024 * 1024) return null;

  ensureUploadDir();
  const name = `banner-${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${ext}`;
  const fp = path.join(uploadDir, name);
  try {
    fs.writeFileSync(fp, buf);
  } catch (e) {
    console.error('Banner image write failed:', e);
    return null;
  }
  return `/uploads/${name}`;
}

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

function normalizeImageUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const url = value.trim();
  if (!url) return null;

  if (url.startsWith('data:image/')) {
    return persistDataUrlBannerImage(url);
  }

  if (url.length > MAX_IMAGE_URL_LENGTH) return null;

  // Allow local static paths (/file.jpg) and absolute URLs.
  if (url.startsWith('/') || /^https?:\/\//i.test(url)) return url;
  return null;
}

// 1. Получить все активные баннеры (отсортированные по порядку)
router.get('/', async (req, res) => {
  try {
    const banners = await prisma.banner.findMany({
      where: {
        isActive: true,
        OR: [
          { imageUrl: { startsWith: '/' } },
          { imageUrl: { startsWith: 'http://' } },
          { imageUrl: { startsWith: 'https://' } }
        ]
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
      where: {
        OR: [
          { imageUrl: { startsWith: '/' } },
          { imageUrl: { startsWith: 'http://' } },
          { imageUrl: { startsWith: 'https://' } }
        ]
      },
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
    const safeImageUrl = normalizeImageUrl(imageUrl);
    if (!safeImageUrl) {
      return res.status(400).json({ error: 'Некорректный imageUrl для баннера' });
    }

    const banner = await prisma.banner.create({
      data: {
        title_ru,
        title_ua: title_ua || title_ru,
        title_en: title_en || title_ru,
        title_nl: title_nl || title_ru,
        imageUrl: safeImageUrl,
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
    const safeImageUrl =
      imageUrl !== undefined ? normalizeImageUrl(imageUrl) : undefined;
    if (imageUrl !== undefined && !safeImageUrl) {
      return res.status(400).json({ error: 'Некорректный imageUrl для баннера' });
    }

    const banner = await prisma.banner.update({
      where: { id },
      data: {
        title_ru,
        title_ua,
        title_en,
        title_nl,
        ...(safeImageUrl !== undefined ? { imageUrl: safeImageUrl } : {}),
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
