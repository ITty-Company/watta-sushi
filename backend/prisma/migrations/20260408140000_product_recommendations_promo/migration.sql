-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "allowRecommendations" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "isRecommended" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN     "recommendOrder" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Product" ADD COLUMN     "promoDiscountPercent" INTEGER NOT NULL DEFAULT 0;
