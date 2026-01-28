-- CreateTable
CREATE TABLE "TeamMember" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name_ru" TEXT NOT NULL,
    "name_ua" TEXT,
    "name_en" TEXT,
    "name_nl" TEXT,
    "position_ru" TEXT NOT NULL,
    "position_ua" TEXT,
    "position_en" TEXT,
    "position_nl" TEXT,
    "imageUrl" TEXT,
    "bio_ru" TEXT,
    "bio_ua" TEXT,
    "bio_en" TEXT,
    "bio_nl" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
