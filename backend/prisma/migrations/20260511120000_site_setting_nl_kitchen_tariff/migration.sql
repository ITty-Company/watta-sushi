-- NL-wide delivery kitchen + stepped tariff (editable in admin)
ALTER TABLE "SiteSetting" ADD COLUMN IF NOT EXISTS "deliveryKitchenAddress" TEXT NOT NULL DEFAULT 'Helicopterstraat 20, 1059 CG Amsterdam, Netherlands';
ALTER TABLE "SiteSetting" ADD COLUMN IF NOT EXISTS "deliveryKitchenLat" DOUBLE PRECISION;
ALTER TABLE "SiteSetting" ADD COLUMN IF NOT EXISTS "deliveryKitchenLng" DOUBLE PRECISION;
ALTER TABLE "SiteSetting" ADD COLUMN IF NOT EXISTS "deliveryTariffStepKm" DOUBLE PRECISION NOT NULL DEFAULT 3;
ALTER TABLE "SiteSetting" ADD COLUMN IF NOT EXISTS "deliveryTariffStepEur" DOUBLE PRECISION NOT NULL DEFAULT 1.5;
