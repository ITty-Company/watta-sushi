import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { checkAdmin } from '../authMiddleware';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();
const router = Router();
let promoGalleryUrlsMissing = false;
let promoProductOffersMissing = false;

const uploadDir = path.join(__dirname, '../../web/public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req: any, _file: any, cb: any) => {
    cb(null, uploadDir);
  },
  filename: (_req: any, file: any, cb: any) => {
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    cb(null, `promo-${Date.now()}-${sanitized}`);
  },
});
const upload = multer({ storage });
const uploadNews = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'images', maxCount: 24 },
]);

function safeJsonArray(raw: unknown, fallback: unknown[] = []): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      const p = JSON.parse(raw);
      return Array.isArray(p) ? p : fallback;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

function normalizeGalleryUrls(body: any, files: Express.Multer.File[] | undefined): string[] {
  const existing = safeJsonArray(body?.galleryUrls, [])
    .filter((u): u is string => typeof u === 'string' && u.length > 0);
  const fromUploads = (files || []).map((f) => `/uploads/${f.filename}`);
  return [...existing, ...fromUploads];
}

function normalizeProductOffers(body: any): { productId: number; discountPercent: number }[] {
  const raw = safeJsonArray(body?.productOffers, []);
  const out: { productId: number; discountPercent: number }[] = [];
  for (const row of raw) {
    if (!row || typeof row !== 'object') continue;
    const productId = Number((row as any).productId);
    const discountPercent = Number((row as any).discountPercent);
    if (!Number.isFinite(productId) || productId < 1) continue;
    if (!Number.isFinite(discountPercent)) continue;
    const d = Math.min(100, Math.max(0, Math.round(discountPercent)));
    out.push({ productId, discountPercent: d });
  }
  return out;
}

const promoBaseSelect = {
  id: true,
  title: true,
  description: true,
  content: true,
  imageUrl: true,
  isHit: true,
  createdAt: true,
  updatedAt: true,
} as const;

function withCompatGallery<T extends { imageUrl?: string | null }>(promo: T): T & { galleryUrls: string[] } {
  const fromImage = promo.imageUrl ? [promo.imageUrl] : [];
  return { ...promo, galleryUrls: fromImage };
}

function isMissingColumnError(e: unknown, column: 'galleryUrls' | 'productOffers'): boolean {
  const err = e as { code?: string; meta?: { column?: string } };
  return err?.code === 'P2022' && String(err?.meta?.column || '').includes(`Promo.${column}`);
}

router.get('/', async (_req: any, res: any) => {
  try {
    const promos = await prisma.promo.findMany({
      orderBy: { createdAt: 'desc' },
      select: promoBaseSelect,
    });
    res.json(promos.map((p) => withCompatGallery(p as any)));
  } catch (e) {
    if (isMissingColumnError(e, 'galleryUrls') || isMissingColumnError(e, 'productOffers')) {
      if (isMissingColumnError(e, 'galleryUrls')) promoGalleryUrlsMissing = true;
      if (isMissingColumnError(e, 'productOffers')) promoProductOffersMissing = true;
      try {
        const promos = await prisma.promo.findMany({
          orderBy: { createdAt: 'desc' },
          select: promoBaseSelect,
        });
        res.json(promos.map((p) => withCompatGallery(p as any)));
        return;
      } catch (inner) {
        console.error(inner);
      }
    }
    console.error(e);
    res.status(500).json({ error: 'Error fetching promos' });
  }
});

router.get('/:id', async (req: any, res: any) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: 'Invalid id' });
      return;
    }
    const promo = await prisma.promo.findUnique({ where: { id }, select: promoBaseSelect });
    if (!promo) {
      res.status(404).json({ error: 'News not found' });
      return;
    }
    const offers = promoProductOffersMissing ? [] : normalizeProductOffers({ productOffers: (promo as any).productOffers });
    const ids = [...new Set(offers.map((o) => o.productId))];
    const products =
      ids.length > 0
        ? await prisma.product.findMany({
            where: { id: { in: ids } },
            include: { category: true },
          })
        : [];
    const offerProducts = products.map((p) => ({
      ...p,
      offerDiscountPercent: offers.find((o) => o.productId === p.id)?.discountPercent ?? 0,
    }));
    res.json({ ...withCompatGallery(promo as any), offerProducts });
  } catch (e) {
    if (isMissingColumnError(e, 'galleryUrls')) {
      promoGalleryUrlsMissing = true;
    }
    if (isMissingColumnError(e, 'productOffers')) {
      promoProductOffersMissing = true;
    }
    res.status(500).json({ error: 'Error fetching promo' });
  }
});

router.post('/', checkAdmin, uploadNews, async (req: any, res: any) => {
  try {
    const { title, description, content, isHit } = req.body;
    const files = req.files as { image?: Express.Multer.File[]; images?: Express.Multer.File[] } | undefined;
    const single = files?.image?.[0];
    const multi = files?.images || [];
    const fromSingle = single ? [`/uploads/${single.filename}`] : [];
    const gallery = [...fromSingle, ...normalizeGalleryUrls(req.body, multi)];
    const deduped = [...new Set(gallery)];
    const imageUrl = deduped[0] || null;
    const productOffers = normalizeProductOffers(req.body);

    const createData: Record<string, unknown> = {
      title: String(title || '').trim(),
      description: String(description || '').trim(),
      content: content != null ? String(content) : String(description || '').trim(),
      imageUrl,
      isHit: isHit === 'true' || isHit === true,
    };
    if (!promoGalleryUrlsMissing) {
      createData.galleryUrls = deduped as object;
    }
    if (!promoProductOffersMissing) {
      createData.productOffers = productOffers as object;
    }
    try {
      const promo = await prisma.promo.create({
        data: createData as any,
        select: promoBaseSelect,
      });
      res.json(withCompatGallery(promo as any));
    } catch (e) {
      if (
        (isMissingColumnError(e, 'galleryUrls') && !promoGalleryUrlsMissing) ||
        (isMissingColumnError(e, 'productOffers') && !promoProductOffersMissing)
      ) {
        if (isMissingColumnError(e, 'galleryUrls')) {
          promoGalleryUrlsMissing = true;
          delete createData.galleryUrls;
        }
        if (isMissingColumnError(e, 'productOffers')) {
          promoProductOffersMissing = true;
          delete createData.productOffers;
        }
        const promo = await prisma.promo.create({
          data: createData as any,
          select: promoBaseSelect,
        });
        res.json(withCompatGallery(promo as any));
        return;
      }
      throw e;
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Create error' });
  }
});

router.put('/:id', checkAdmin, uploadNews, async (req: any, res: any) => {
  try {
    const id = Number(req.params.id);
    const { title, description, content, isHit } = req.body;
    const files = req.files as { image?: Express.Multer.File[]; images?: Express.Multer.File[] } | undefined;
    const single = files?.image?.[0];
    const multi = files?.images || [];
    const fromSingle = single ? [`/uploads/${single.filename}`] : [];
    const merged = [...fromSingle, ...normalizeGalleryUrls(req.body, multi)];
    const deduped = [...new Set(merged)];

    const updateData: Record<string, unknown> = {
      title: String(title || '').trim(),
      description: String(description || '').trim(),
      content: content != null ? String(content) : undefined,
      isHit: isHit === 'true' || isHit === true,
      imageUrl: deduped.length > 0 ? deduped[0] : null,
    };
    if (!promoGalleryUrlsMissing) {
      updateData.galleryUrls = deduped as object;
    }
    if (!promoProductOffersMissing) {
      updateData.productOffers = normalizeProductOffers(req.body) as object;
    }

    try {
      const promo = await prisma.promo.update({
        where: { id },
        data: updateData as any,
        select: promoBaseSelect,
      });
      res.json(withCompatGallery(promo as any));
    } catch (e) {
      if (
        (isMissingColumnError(e, 'galleryUrls') && !promoGalleryUrlsMissing) ||
        (isMissingColumnError(e, 'productOffers') && !promoProductOffersMissing)
      ) {
        if (isMissingColumnError(e, 'galleryUrls')) {
          promoGalleryUrlsMissing = true;
          delete updateData.galleryUrls;
        }
        if (isMissingColumnError(e, 'productOffers')) {
          promoProductOffersMissing = true;
          delete updateData.productOffers;
        }
        const promo = await prisma.promo.update({
          where: { id },
          data: updateData as any,
          select: promoBaseSelect,
        });
        res.json(withCompatGallery(promo as any));
        return;
      }
      throw e;
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Update error' });
  }
});

router.delete('/:id', checkAdmin, async (req: any, res: any) => {
  try {
    await prisma.promo.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Delete error' });
  }
});

export default router;
