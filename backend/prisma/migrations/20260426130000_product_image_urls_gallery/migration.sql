-- Галерея зображень товару (масив URL); перше дзеркалить imageUrl на клієнті/в меню
ALTER TABLE "Product" ADD COLUMN "imageUrls" JSONB NOT NULL DEFAULT '[]';

UPDATE "Product"
SET "imageUrls" = jsonb_build_array("imageUrl")
WHERE "imageUrl" IS NOT NULL AND BTRIM("imageUrl") <> '';
