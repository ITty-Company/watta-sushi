import type { PrismaClient } from '@prisma/client';

export function normalizeAddressLine(raw: string): string {
  return String(raw ?? '')
    .trim()
    .replace(/\s+/g, ' ');
}

/** Базова адреса доставки без деталей під'їзду/поверху з коментаря замовлення. */
export function extractBaseDeliveryAddress(raw: string): string {
  const trimmed = normalizeAddressLine(raw);
  if (!trimmed) return '';
  const withoutDetails = trimmed.split(/\.\s+/)[0]?.trim() ?? trimmed;
  return normalizeAddressLine(withoutDetails);
}

export function serializeUserAddress(row: { id: number; address: string; createdAt: Date }) {
  return {
    id: row.id,
    address: row.address,
    createdAt: row.createdAt.toISOString(),
  };
}

/** Синхронізує User.address з першою збереженою адресою (для кошика та сумісності). */
export async function syncUserPrimaryAddress(
  prisma: PrismaClient,
  userId: number,
): Promise<string> {
  const first = await prisma.userAddress.findFirst({
    where: { userId },
    orderBy: { createdAt: 'asc' },
    select: { address: true },
  });
  const primary = first?.address?.trim() ?? '';
  await prisma.user.update({
    where: { id: userId },
    data: { address: primary },
  });
  return primary;
}

/** Додає адресу в книгу, якщо її ще немає (без помилки на дублікат). */
export async function saveUserAddressIfNew(
  prisma: PrismaClient,
  userId: number,
  rawAddress: string,
): Promise<{ created: boolean; address: string }> {
  const address = extractBaseDeliveryAddress(rawAddress);
  if (address.length < 3) {
    return { created: false, address: '' };
  }
  if (address.length > 500) {
    return { created: false, address: '' };
  }

  const duplicate = await prisma.userAddress.findFirst({
    where: { userId, address },
  });
  if (duplicate) {
    return { created: false, address };
  }

  await prisma.userAddress.create({
    data: { userId, address },
  });
  await syncUserPrimaryAddress(prisma, userId);
  return { created: true, address };
}
