import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getUploadsDir } from './uploadsDir.js';

const uploadDir = getUploadsDir();

/** Превʼю інгредієнтів у картці товару — ~96px; 512px JPEG достатньо. */
export const INGREDIENT_UPLOAD_PRESET = {
  maxEdge: 512,
  quality: 84,
  maxBytes: 160 * 1024,
};

/** Фото товарів у меню / картці — до 1600px, як web/lib/compressProductImage.ts */
export const PRODUCT_UPLOAD_PRESET = {
  maxEdge: 1600,
  quality: 82,
  maxBytes: 2 * 1024 * 1024,
};

export const INGREDIENT_OPTIMIZE_MIN_BYTES = 180 * 1024;
export const PRODUCT_OPTIMIZE_MIN_BYTES = 420 * 1024;

export async function compressImageBuffer(buf, preset = INGREDIENT_UPLOAD_PRESET) {
  const base = sharp(buf, { failOn: 'none' }).rotate();
  const meta = await base.metadata();
  const resizeOpts = {
    width: preset.maxEdge,
    height: preset.maxEdge,
    fit: 'inside',
    withoutEnlargement: true,
  };

  const encode = (quality) =>
    sharp(buf, { failOn: 'none' })
      .rotate()
      .resize(resizeOpts)
      .jpeg({ quality, mozjpeg: true, chromaSubsampling: '4:2:0' })
      .toBuffer();

  let out = await encode(preset.quality);
  if (out.length <= preset.maxBytes) {
    return { buf: out, ext: 'jpg', width: meta.width, height: meta.height };
  }

  for (const q of [76, 68, 60, 52]) {
    out = await encode(q);
    if (out.length <= preset.maxBytes) break;
  }

  return { buf: out, ext: 'jpg', width: meta.width, height: meta.height };
}

export async function writeCompressedUpload(buf, prefix, preset = INGREDIENT_UPLOAD_PRESET) {
  if (!buf?.length) return null;
  const { buf: compressed, ext } = await compressImageBuffer(buf, preset);
  const name = `${prefix}-${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${ext}`;
  const fp = path.join(uploadDir, name);
  fs.writeFileSync(fp, compressed);
  return `/uploads/${name}`;
}

async function optimizeUploadFileOnDisk(publicPath, prefix, preset, minBytes) {
  const trimmed = String(publicPath || '').trim();
  const prefixPath = `/uploads/${prefix}-`;
  if (!trimmed.startsWith(prefixPath)) return null;
  const base = path.basename(trimmed);
  const fp = path.join(uploadDir, base);
  if (!fs.existsSync(fp)) return null;

  const stat = fs.statSync(fp);
  if (stat.size <= minBytes && !/\.png$/i.test(base)) {
    return null;
  }

  const buf = fs.readFileSync(fp);
  const { buf: compressed, ext } = await compressImageBuffer(buf, preset);
  if (compressed.length >= stat.size && stat.size <= minBytes) {
    return null;
  }

  const name = `${prefix}-${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${ext}`;
  const outFp = path.join(uploadDir, name);
  fs.writeFileSync(outFp, compressed);

  try {
    if (fp !== outFp) fs.unlinkSync(fp);
  } catch {
    /* ignore */
  }

  return `/uploads/${name}`;
}

export function optimizeIngredientFileOnDisk(publicPath) {
  return optimizeUploadFileOnDisk(
    publicPath,
    'ingredient',
    INGREDIENT_UPLOAD_PRESET,
    INGREDIENT_OPTIMIZE_MIN_BYTES,
  );
}

export function optimizeProductFileOnDisk(publicPath) {
  return optimizeUploadFileOnDisk(
    publicPath,
    'product',
    PRODUCT_UPLOAD_PRESET,
    PRODUCT_OPTIMIZE_MIN_BYTES,
  );
}

/** Стискає multipart-файл на диску; повертає новий `/uploads/…` або старий при помилці. */
export async function compressUploadedFileOnDisk(filename, prefix, preset) {
  const base = path.basename(String(filename || '').trim());
  if (!base) return null;
  const fp = path.join(uploadDir, base);
  if (!fs.existsSync(fp)) return null;
  try {
    const buf = fs.readFileSync(fp);
    const url = await writeCompressedUpload(buf, prefix, preset);
    if (url) {
      try {
        fs.unlinkSync(fp);
      } catch {
        /* ignore */
      }
    }
    return url;
  } catch (e) {
    console.error(`${prefix} upload compress failed:`, e);
    return `/uploads/${base}`;
  }
}
