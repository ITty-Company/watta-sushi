#!/usr/bin/env node
/**
 * Одноразово стиснути всі /uploads/ingredient-* і оновити URL у БД.
 * npm run compress:ingredients   (з кореня репо або cd backend)
 */
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { getUploadsDir } from '../lib/uploadsDir.js';
import { optimizeIngredientFileOnDisk } from '../lib/compressUploadImage.js';

const prisma = new PrismaClient();
const uploadDir = getUploadsDir();

async function main() {
  console.log(`Uploads dir: ${uploadDir}`);
  const diskCount = fs.readdirSync(uploadDir).filter((n) => n.startsWith('ingredient-')).length;
  console.log(`ingredient-* files on disk: ${diskCount}`);

  const rows = await prisma.ingredient.findMany({ orderBy: { id: 'asc' } });
  let updated = 0;
  let missingOnDisk = 0;
  let alreadySmall = 0;
  let withUploadUrls = 0;

  for (const row of rows) {
    const url = String(row.imageUrl || '').trim();
    if (!url.startsWith('/uploads/ingredient-')) continue;
    withUploadUrls += 1;

    const fp = path.join(uploadDir, path.basename(url));
    if (!fs.existsSync(fp)) {
      missingOnDisk += 1;
      console.warn(`  missing on disk: ${url} (ingredient id=${row.id})`);
      continue;
    }

    const optimized = await optimizeIngredientFileOnDisk(url);
    if (!optimized || optimized === url) {
      alreadySmall += 1;
      continue;
    }
    await prisma.ingredient.update({
      where: { id: row.id },
      data: { imageUrl: optimized },
    });
    updated += 1;
    console.log(`id=${row.id} ${url} → ${optimized}`);
  }

  console.log('');
  console.log(`Ingredients in DB: ${rows.length}`);
  console.log(`With /uploads/ingredient-* URLs: ${withUploadUrls}`);
  console.log(`Missing files on disk: ${missingOnDisk}`);
  console.log(`Already optimized / skipped: ${alreadySmall}`);
  console.log(`Done. Updated ${updated} / ${rows.length} ingredients.`);

  if (missingOnDisk > 0) {
    console.log('');
    console.log('Hint: перезавантажте фото в адмінці — файл збережеться в backend/uploads і стиснеться автоматично.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
