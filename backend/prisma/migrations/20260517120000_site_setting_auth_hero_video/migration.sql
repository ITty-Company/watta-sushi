ALTER TABLE "SiteSetting" ADD COLUMN IF NOT EXISTS "authHeroVideoUrl" TEXT NOT NULL DEFAULT '/watta-sushi-2-hero.mp4';
ALTER TABLE "SiteSetting" ADD COLUMN IF NOT EXISTS "authHeroVideoUrls" TEXT NOT NULL DEFAULT '[]';

UPDATE "SiteSetting"
SET "authHeroVideoUrls" = json_build_array("authHeroVideoUrl")::text
WHERE ("authHeroVideoUrls" IS NULL OR "authHeroVideoUrls" = '[]' OR trim("authHeroVideoUrls") = '')
  AND "authHeroVideoUrl" IS NOT NULL
  AND trim("authHeroVideoUrl") <> '';
