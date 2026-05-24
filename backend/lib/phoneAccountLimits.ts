import type { PrismaClient } from '@prisma/client';

/** Скільки підтверджених акаунтів можна прив’язати до одного номера. */
export const MAX_VERIFIED_ACCOUNTS_PER_PHONE = 10;

export function cleanPhoneInput(phone: string): string {
  return String(phone ?? '').replace(/\D/g, '');
}

/** 7–15 цифр — будь-який код країни, без фіксованого формату. */
export const PHONE_MIN_DIGITS = 7;
export const PHONE_MAX_DIGITS = 15;

export function isValidInternationalPhone(phone: string): boolean {
  const digits = cleanPhoneInput(phone);
  return digits.length >= PHONE_MIN_DIGITS && digits.length <= PHONE_MAX_DIGITS;
}

export async function countVerifiedUsersByPhone(
  prisma: PrismaClient,
  cleanPhone: string,
  excludeUserId?: number,
): Promise<number> {
  return prisma.user.count({
    where: {
      phone: cleanPhone,
      isPhoneVerified: true,
      ...(excludeUserId != null ? { id: { not: excludeUserId } } : {}),
    },
  });
}

export function isPhoneVerifiedSlotsFull(verifiedCount: number): boolean {
  return verifiedCount >= MAX_VERIFIED_ACCOUNTS_PER_PHONE;
}

export const PHONE_ACCOUNTS_LIMIT_MESSAGE =
  'С этим номером уже создано максимум 10 аккаунтов. Войдите в существующий или используйте другой номер.';
