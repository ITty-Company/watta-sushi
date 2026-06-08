import type { PrismaClient } from '@prisma/client';
import { cleanPhoneInput, isValidInternationalPhone } from './phoneAccountLimits.js';

/** Головний номер власника — завжди має доступ до адмін-панелі. */
export const PRIMARY_ADMIN_PHONE = '380953398039';

/** Головний email власника — завжди має доступ до адмін-панелі. */
export const PRIMARY_ADMIN_EMAIL = 'krasnovaanastasiia@knu.ua';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeAdminEmail(email: string): string {
  return String(email ?? '').trim().toLowerCase();
}

export function formatAdminPhoneOut(cleanPhone: string): string {
  const digits = cleanPhoneInput(cleanPhone);
  return digits ? `+${digits}` : '';
}

export function isPrimaryAdminPhone(cleanPhone: string): boolean {
  return cleanPhoneInput(cleanPhone) === PRIMARY_ADMIN_PHONE;
}

export function isPrimaryAdminEmail(email: string): boolean {
  return normalizeAdminEmail(email) === PRIMARY_ADMIN_EMAIL;
}

export async function isAdminPhone(prisma: PrismaClient, cleanPhone: string): Promise<boolean> {
  const phone = cleanPhoneInput(cleanPhone);
  if (!phone) return false;
  if (isPrimaryAdminPhone(phone)) return true;
  const row = await prisma.adminPhone.findUnique({ where: { phone } });
  return Boolean(row);
}

export async function isAdminEmail(prisma: PrismaClient, email: string): Promise<boolean> {
  const normalized = normalizeAdminEmail(email);
  if (!normalized) return false;
  if (isPrimaryAdminEmail(normalized)) return true;
  const row = await prisma.adminEmail.findUnique({ where: { email: normalized } });
  return Boolean(row);
}

/** Телефон або email зі списку адмінів. */
export async function hasAdminAccess(
  prisma: PrismaClient,
  phone: string,
  email: string,
): Promise<boolean> {
  const [byPhone, byEmail] = await Promise.all([
    isAdminPhone(prisma, phone),
    isAdminEmail(prisma, email),
  ]);
  return byPhone || byEmail;
}

/** Синхронізує role користувача з таблицями AdminPhone / AdminEmail. */
export async function syncUserAdminRole(
  prisma: PrismaClient,
  userId: number,
): Promise<'ADMIN' | 'USER'> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, phone: true, email: true, role: true },
  });
  if (!user) return 'USER';

  const shouldBeAdmin = await hasAdminAccess(prisma, user.phone, user.email);
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
  const users = await prisma.user.findMany({
    where: { phone, isPhoneVerified: true },
    select: { id: true },
  });
  for (const user of users) {
    if (isAdmin) {
      await prisma.user.update({
        where: { id: user.id },
        data: { role: 'ADMIN' },
      });
    } else {
      await syncUserAdminRole(prisma, user.id);
    }
  }
}

export async function syncUsersForAdminEmail(
  prisma: PrismaClient,
  email: string,
  isAdmin: boolean,
): Promise<void> {
  const normalized = normalizeAdminEmail(email);
  if (!normalized) return;
  const users = await prisma.user.findMany({
    where: { email: normalized },
    select: { id: true },
  });
  for (const user of users) {
    if (isAdmin) {
      await prisma.user.update({
        where: { id: user.id },
        data: { role: 'ADMIN' },
      });
    } else {
      await syncUserAdminRole(prisma, user.id);
    }
  }
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

export async function ensurePrimaryAdminEmail(prisma: PrismaClient): Promise<void> {
  await prisma.adminEmail.upsert({
    where: { email: PRIMARY_ADMIN_EMAIL },
    update: {},
    create: {
      email: PRIMARY_ADMIN_EMAIL,
      label: 'Головний адмін',
    },
  });
}

export function parseAdminPhoneInput(raw: string): string | null {
  if (!isValidInternationalPhone(raw)) return null;
  return cleanPhoneInput(raw);
}

export function parseAdminEmailInput(raw: string): string | null {
  const normalized = normalizeAdminEmail(raw);
  if (!normalized || !EMAIL_RE.test(normalized)) return null;
  return normalized;
}
