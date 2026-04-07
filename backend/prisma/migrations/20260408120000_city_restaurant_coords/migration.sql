-- AlterTable
ALTER TABLE "City" ADD COLUMN "restaurantLatitude" DOUBLE PRECISION;
ALTER TABLE "City" ADD COLUMN "restaurantLongitude" DOUBLE PRECISION;

-- Новий колір зон за замовчуванням
ALTER TABLE "DeliveryZone" ALTER COLUMN "color" SET DEFAULT '#145142';
