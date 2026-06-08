import type { PrismaClient } from '@prisma/client';
import { cleanPhoneInput, isValidInternationalPhone } from './phoneAccountLimits.js';

/** Головний номер власника — завжди має доступ до адмін-панелі. */
export const PRIMARY_ADMIN_PHONE = '380953398039';

export function formatAdminPhoneOut(cleanPhone: string): string {
  const digits = cleanPhoneInput(cleanPhone);
  return digits ? `+${digits}` : '';
}

export function isPrimaryAdminPhone(cleanPhone: string): boolean {
  return cleanPhoneInput(cleanPhone) === PRIMARY_ADMIN_PHONE;
}

export async function isAdminPhone(prisma: PrismaClient, cleanPhone: string): Promise<boolean> {
  const phone = cleanPhoneInput(cleanPhone);
  if (!phone) return false;
  if (isPrimaryAdminPhone(phone)) return true;
  const row = await prisma.adminPhone.findUnique({ where: { phone } });
  return Boolean(row);
}

/** Синхронізує role користувача з таблицею AdminPhone. */
export async function syncUserAdminRole(
  prisma: PrismaClient,
  userId: number,
): Promise<'ADMIN' | 'USER'> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, phone: true, role: true },
  });
  if (!user) return 'USER';

  const shouldBeAdmin = await isAdminPhone(prisma, user.phone);
  const nextRole = shouldBeAdmin ? 'ADMIN' : 'USER';

  if (user.role !== nextRole) {
    await prisma.user.update({
      where: { id: userId },
      data: { role: nextRole },
    });
  }

  return nextRole;
}

export async function syncUsersForAdminPhone(
  prisma: PrismaClient,
  cleanPhone: string,
  isAdmin: boolean,
): Promise<void> {
  const phone = cleanPhoneInput(cleanPhone);
  if (!phone) return;
  await prisma.user.updateMany({
    where: { phone, isPhoneVerified: true },
    data: { role: isAdmin ? 'ADMIN' : 'USER' },
  });
}

export async function ensurePrimaryAdminPhone(prisma: PrismaClient): Promise<void> {
  await prisma.adminPhone.upsert({
    where: { phone: PRIMARY_ADMIN_PHONE },
    update: {},
    create: {
      phone: PRIMARY_ADMIN_PHONE,
      label: 'Головний адмін',
    },
  });
}

export function parseAdminPhoneInput(raw: string): string | null {
  if (!isValidInternationalPhone(raw)) return null;
  return cleanPhoneInput(raw);
}
