-- AlterTable
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "dataProcessingConsentAt" TIMESTAMP(3);
