-- CreateTable
CREATE TABLE "AdminEmail" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminEmail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminEmail_email_key" ON "AdminEmail"("email");

-- Головний email адміністратора
INSERT INTO "AdminEmail" ("email", "label", "createdAt")
VALUES ('krasnovaanastasiia@knu.ua', 'Головний адмін', NOW())
ON CONFLICT ("email") DO NOTHING;
