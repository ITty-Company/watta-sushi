-- AlterTable: назви товарів на момент замовлення (історія не зникає при зміні меню)
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "productNameSnapshot" TEXT NOT NULL DEFAULT '';
