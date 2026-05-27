-- Migration: add clientRequestId to Order for idempotency protection
-- Prevents duplicate orders from double-click, network retry, or frontend retry.
--
-- Safety notes:
--   • Column is nullable (TEXT) — all existing orders keep clientRequestId = NULL.
--     Multiple NULL values do NOT conflict on the unique index (PostgreSQL standard).
--   • ALTER TABLE ADD COLUMN acquires AccessExclusiveLock for a brief moment.
--     For a small orders table (< 100k rows) this is a few milliseconds.
--   • CREATE UNIQUE INDEX runs inside Prisma's transaction, so CONCURRENTLY is not used.
--     This is acceptable for a small table. No table scan lock is held after index creation.
--   • Render: this migration runs automatically on deploy (init-db → prisma migrate deploy)
--     before the new server code starts. Zero-downtime: old code doesn't reference this column.

ALTER TABLE "Order" ADD COLUMN "clientRequestId" TEXT;
CREATE UNIQUE INDEX "Order_clientRequestId_key" ON "Order"("clientRequestId");
