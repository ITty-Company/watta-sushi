-- OrderReview + UserNotification (idempotent for DBs where tables already exist)

CREATE TABLE IF NOT EXISTS "OrderReview" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "images" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderReview_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "OrderReview_orderId_key" ON "OrderReview"("orderId");
CREATE INDEX IF NOT EXISTS "OrderReview_userId_idx" ON "OrderReview"("userId");
CREATE INDEX IF NOT EXISTS "OrderReview_createdAt_idx" ON "OrderReview"("createdAt");

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'OrderReview_orderId_fkey'
  ) THEN
    ALTER TABLE "OrderReview" ADD CONSTRAINT "OrderReview_orderId_fkey"
      FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'OrderReview_userId_fkey'
  ) THEN
    ALTER TABLE "OrderReview" ADD CONSTRAINT "OrderReview_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "UserNotification" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'ORDER_STATUS',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "orderId" INTEGER,
    "meta" JSONB NOT NULL DEFAULT '{}',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserNotification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "UserNotification_userId_isRead_idx" ON "UserNotification"("userId", "isRead");
CREATE INDEX IF NOT EXISTS "UserNotification_userId_createdAt_idx" ON "UserNotification"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "UserNotification_orderId_idx" ON "UserNotification"("orderId");

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'UserNotification_userId_fkey'
  ) THEN
    ALTER TABLE "UserNotification" ADD CONSTRAINT "UserNotification_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
