/*
  Warnings:

  - You are about to drop the column `name_uk` on the `Category` table. All the data in the column will be lost.
  - You are about to drop the column `ingredients_en` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `ingredients_ru` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `isChefRecommendation` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `name_uk` on the `Product` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "City" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "name_nl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ProductCity" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productId" INTEGER NOT NULL,
    "cityId" INTEGER NOT NULL,
    CONSTRAINT "ProductCity_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProductCity_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PromoCode" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "discount" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Category" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name_ru" TEXT NOT NULL,
    "name_en" TEXT,
    "name_ua" TEXT,
    "name_nl" TEXT,
    "slug" TEXT NOT NULL
);
INSERT INTO "new_Category" ("id", "name_en", "name_nl", "name_ru", "slug") SELECT "id", "name_en", "name_nl", "name_ru", "slug" FROM "Category";
DROP TABLE "Category";
ALTER TABLE "new_Category" RENAME TO "Category";
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");
CREATE TABLE "new_Product" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name_ru" TEXT NOT NULL,
    "name_ua" TEXT DEFAULT '',
    "name_en" TEXT DEFAULT '',
    "name_nl" TEXT DEFAULT '',
    "description_ru" TEXT,
    "description_ua" TEXT DEFAULT '',
    "description_en" TEXT DEFAULT '',
    "description_nl" TEXT DEFAULT '',
    "price" REAL NOT NULL,
    "imageUrl" TEXT,
    "isPopular" BOOLEAN NOT NULL DEFAULT false,
    "categoryId" INTEGER NOT NULL,
    CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Product" ("categoryId", "description_ru", "id", "imageUrl", "isPopular", "name_en", "name_nl", "name_ru", "price") SELECT "categoryId", "description_ru", "id", "imageUrl", "isPopular", "name_en", "name_nl", "name_ru", "price" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "City_name_key" ON "City"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ProductCity_productId_cityId_key" ON "ProductCity"("productId", "cityId");

-- CreateIndex
CREATE UNIQUE INDEX "PromoCode_code_key" ON "PromoCode"("code");
