import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { getUploadsDir } from './uploadsDir.js';
import { writeCompressedUpload } from './compressUploadImage.js';

const MAX_IMAGE_URL_LENGTH = 2048;
const uploadDir = getUploadsDir();

/** data URL з адмінки → стиснутий JPEG у uploads; у БД лише /uploads/… */
export async function persistDataUrlIngredientImage(dataUrl: string): Promise<string | null> {
  const trimmed = dataUrl.trim();
  const m = /^data:image\/(png|jpeg|jpg|webp|gif);base64,([\s\S]+)$/i.exec(trimmed);
  if (!m) return null;
  const b64 = m[2].replace(/\s/g, '');
  let buf: Buffer;
  try {
    buf = Buffer.from(b64, 'base64');
  } catch {
    return null;
  }
  if (buf.length < 24 || buf.length > 4 * 1024 * 1024) return null;

  try {
    return await writeCompressedUpload(buf, 'ingredient');
  } catch (e) {
    console.error('Ingredient image compress failed, fallback raw write:', e);
    let ext = m[1].toLowerCase();
    if (ext === 'jpeg') ext = 'jpg';
    const name = `ingredient-${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${ext}`;
    const fp = path.join(uploadDir, name);
    fs.writeFileSync(fp, buf);
    return `/uploads/${name}`;
  }
}

/** Для збереження (POST/PUT): data URL → /uploads/… */
export async function normalizeIngredientImageUrl(value: unknown): Promise<string> {
  if (typeof value !== 'string') return '';
  const url = value.trim();
  if (!url) return '';
  if (url.startsWith('data:image/')) {
    return (await persistDataUrlIngredientImage(url)) ?? '';
  }
  if (url.startsWith('data:') || url.startsWith('blob:') || url.length > MAX_IMAGE_URL_LENGTH) {
    return '';
  }
  if (url.startsWith('/') || /^https?:\/\//i.test(url)) return url;
  return '';
}

/** Для GET: не віддаємо base64 (десятки МБ) — ремонт у фоні. */
export function ingredientImageUrlForApi(value: unknown): string {
  if (typeof value !== 'string') return '';
  const url = value.trim();
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('blob:') || url.length > MAX_IMAGE_URL_LENGTH) {
    return '';
  }
  if (url.startsWith('/') || /^https?:\/\//i.test(url)) return url;
  return '';
}

export function sanitizeIngredientForApi<T extends { imageUrl?: string | null }>(row: T): T {
  const imageUrl = ingredientImageUrlForApi(row.imageUrl ?? '');
  return { ...row, imageUrl };
}
