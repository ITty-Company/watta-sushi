-- AlterTable
ALTER TABLE "SiteSetting" ADD COLUMN IF NOT EXISTS "bonusCashbackEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "SiteSetting" ADD COLUMN IF NOT EXISTS "bonusCashbackPercent" DOUBLE PRECISION NOT NULL DEFAULT 5;

-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "bonusCashbackPercentOverride" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "bonusCashbackAwardedAt" TIMESTAMP(3);
