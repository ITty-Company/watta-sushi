ALTER TABLE "SiteSetting" ADD COLUMN IF NOT EXISTS "menuHeroVideoUrl" TEXT NOT NULL DEFAULT '/watta-sushi-2-hero.mp4';
ALTER TABLE "SiteSetting" ADD COLUMN IF NOT EXISTS "menuHeroVideoUrls" TEXT NOT NULL DEFAULT '[]';

UPDATE "SiteSetting"
SET "menuHeroVideoUrls" = json_build_array("menuHeroVideoUrl")::text
WHERE COALESCE(TRIM("menuHeroVideoUrls"), '[]') IN ('', '[]');
