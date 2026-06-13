-- Add receiptPrinted field to Order model for thermal printer tracking
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "receiptPrinted" BOOLEAN NOT NULL DEFAULT false;
