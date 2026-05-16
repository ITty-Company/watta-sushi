ALTER TABLE "SiteSetting" ADD COLUMN IF NOT EXISTS "deliveryHeroVideoUrl" TEXT NOT NULL DEFAULT '/watta-sushi-2-hero.mp4';
ALTER TABLE "SiteSetting" ADD COLUMN IF NOT EXISTS "deliveryHeroVideoUrls" TEXT NOT NULL DEFAULT '[]';

UPDATE "SiteSetting"
SET "deliveryHeroVideoUrls" = json_build_array("deliveryHeroVideoUrl")::text
WHERE ("deliveryHeroVideoUrls" IS NULL OR "deliveryHeroVideoUrls" = '[]' OR trim("deliveryHeroVideoUrls") = '')
  AND "deliveryHeroVideoUrl" IS NOT NULL
  AND trim("deliveryHeroVideoUrl") <> '';
