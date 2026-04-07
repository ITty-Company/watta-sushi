-- AlterTable (IF NOT EXISTS: локальні БД могли вже мати колонки до застосування міграції)
ALTER TABLE "City" ADD COLUMN IF NOT EXISTS "restaurantLatitude" DOUBLE PRECISION;
ALTER TABLE "City" ADD COLUMN IF NOT EXISTS "restaurantLongitude" DOUBLE PRECISION;

-- Новий колір зон за замовчуванням
ALTER TABLE "DeliveryZone" ALTER COLUMN "color" SET DEFAULT '#145142';
