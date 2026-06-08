#!/usr/bin/env node
/**
 * Стиснути /uploads/product-* і оновити imageUrl / imageUrls у БД.
 * npm run compress:products   (з кореня репо або cd backend)
 */
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { getUploadsDir } from '../lib/uploadsDir.js';
import { optimizeProductFileOnDisk } from '../lib/compressUploadImage.js';

const prisma = new PrismaClient();
const uploadDir = getUploadsDir();

function collectUrls(product) {
  const out = new Set();
  const main = String(product.imageUrl || '').trim();
  if (main.startsWith('/uploads/product-')) out.add(main);
  let urls = product.imageUrls;
  if (typeof urls === 'string') {
    try {
      urls = JSON.parse(urls);
    } catch {
      urls = [];
    }
  }
  if (Array.isArray(urls)) {
    for (const u of urls) {
      const s = String(u || '').trim();
      if (s.startsWith('/uploads/product-')) out.add(s);
    }
  }
  return [...out];
}

async function main() {
  console.log(`Uploads dir: ${uploadDir}`);
  const diskCount = fs.readdirSync(uploadDir).filter((n) => n.startsWith('product-')).length;
  console.log(`product-* files on disk: ${diskCount}`);

  const products = await prisma.product.findMany({ select: { id: true, imageUrl: true, imageUrls: true } });
  let withUploadUrls = 0;
  let missingOnDisk = 0;
  let alreadySmall = 0;
  let productsUpdated = 0;
  let filesOptimized = 0;

  for (const row of products) {
    const urls = collectUrls(row);
    if (urls.length === 0) continue;
    withUploadUrls += 1;

    const map = new Map();
    for (const u of urls) {
      const fp = path.join(uploadDir, path.basename(u));
      if (!fs.existsSync(fp)) {
        missingOnDisk += 1;
        console.warn(`  missing on disk: ${u} (product id=${row.id})`);
        continue;
      }
      const optimized = await optimizeProductFileOnDisk(u);
      if (!optimized || optimized === u) {
        alreadySmall += 1;
        continue;
      }
      map.set(u, optimized);
      filesOptimized += 1;
      console.log(`  ${u} → ${optimized}`);
    }
    if (map.size === 0) continue;

    let imageUrl = String(row.imageUrl || '').trim();
    if (map.has(imageUrl)) imageUrl = map.get(imageUrl);

    let gallery = row.imageUrls;
    if (typeof gallery === 'string') {
      try {
        gallery = JSON.parse(gallery);
      } catch {
        gallery = [];
      }
    }
    if (!Array.isArray(gallery)) gallery = [];
    const imageUrls = gallery.map((u) => {
      const s = String(u || '').trim();
      return map.has(s) ? map.get(s) : s;
    });

    await prisma.product.update({
      where: { id: row.id },
      data: {
        imageUrl: imageUrl || imageUrls[0] || '',
        imageUrls,
      },
    });
    productsUpdated += 1;
    console.log(`product id=${row.id} updated`);
  }

  console.log('');
  console.log(`Products in DB: ${products.length}`);
  console.log(`With /uploads/product-* URLs: ${withUploadUrls}`);
  console.log(`Missing files on disk: ${missingOnDisk}`);
  console.log(`Already optimized / skipped: ${alreadySmall}`);
  console.log(`Done. Optimized ${filesOptimized} files, updated ${productsUpdated} products.`);

  if (withUploadUrls === 0) {
    console.log('');
    console.log(
      'Hint: локальна seed-БД часто має placehold.co замість /uploads/product-*. На проді з реальними фото скрипт стисне їх автоматично.',
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
