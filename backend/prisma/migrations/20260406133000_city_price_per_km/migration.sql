-- Колонка є в schema.prisma, але не була в init-міграції; без неї Prisma create падає на проді після migrate deploy.
ALTER TABLE "City" ADD COLUMN IF NOT EXISTS "pricePerKm" DOUBLE PRECISION NOT NULL DEFAULT 10;
