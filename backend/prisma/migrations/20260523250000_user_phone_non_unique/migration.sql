-- Один номер може бути у до 10 підтверджених акаунтів (унікальність лише email).
DROP INDEX IF EXISTS "User_phone_key";
CREATE INDEX IF NOT EXISTS "User_phone_idx" ON "User"("phone");
