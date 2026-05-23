-- Allow multiple reviews per user/order; optional order link

DROP INDEX IF EXISTS "OrderReview_orderId_key";

ALTER TABLE "OrderReview" ALTER COLUMN "orderId" DROP NOT NULL;

CREATE INDEX IF NOT EXISTS "OrderReview_orderId_idx" ON "OrderReview"("orderId");
