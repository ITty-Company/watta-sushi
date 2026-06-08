-- Scheduled delivery / pickup date and time slot chosen at checkout
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "scheduledForDate" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "scheduledForSlot" TEXT;

CREATE INDEX IF NOT EXISTS "Order_scheduledForDate_idx" ON "Order"("scheduledForDate");
