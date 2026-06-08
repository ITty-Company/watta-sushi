-- CreateTable
CREATE TABLE "AdminPhone" (
    "id" SERIAL NOT NULL,
    "phone" TEXT NOT NULL,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminPhone_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminPhone_phone_key" ON "AdminPhone"("phone");

-- Головний номер адміністратора
INSERT INTO "AdminPhone" ("phone", "label", "createdAt")
VALUES ('380953398039', 'Головний адмін', NOW())
ON CONFLICT ("phone") DO NOTHING;
