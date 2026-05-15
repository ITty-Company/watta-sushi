ALTER TABLE "SiteSetting" ADD COLUMN IF NOT EXISTS "homeHeroVideoUrls" TEXT NOT NULL DEFAULT '[]';

UPDATE "SiteSetting"
SET "homeHeroVideoUrls" = json_build_array("homeHeroVideoUrl")::text
WHERE ("homeHeroVideoUrls" IS NULL OR "homeHeroVideoUrls" = '[]' OR trim("homeHeroVideoUrls") = '')
  AND "homeHeroVideoUrl" IS NOT NULL
  AND trim("homeHeroVideoUrl") <> '';
