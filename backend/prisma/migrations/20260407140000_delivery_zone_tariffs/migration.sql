-- Зональні тарифи: безкоштовно / фікс / стандарт (база + €/км міста)
ALTER TABLE "DeliveryZone" ADD COLUMN IF NOT EXISTS "isFreeDelivery" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "DeliveryZone" ADD COLUMN IF NOT EXISTS "flatDeliveryFee" DOUBLE PRECISION;
