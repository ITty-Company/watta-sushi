-- Split isRecommended into isHomeHit (main page hits) and isCartRecommend (cart upsell). Both can be set independently.

ALTER TABLE "Product" ADD COLUMN "isHomeHit" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN "isCartRecommend" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN "cartRecommendOrder" INTEGER NOT NULL DEFAULT 0;

UPDATE "Product"
SET
  "isHomeHit" = "isRecommended",
  "isCartRecommend" = "isRecommended",
  "cartRecommendOrder" = "recommendOrder"
WHERE "isRecommended" = true;

ALTER TABLE "Product" DROP COLUMN "isRecommended";
