import type { Prisma, PrismaClient } from '@prisma/client'

/** Нормалізація телефону для порівняння (лише цифри). */
export function normalizePhoneDigits(raw: string): string {
  return String(raw || '').replace(/\D/g, '')
}

/**
 * Прив’язує попередні гостеві замовлення (userId = null) до акаунта за збігом телефону.
 * Повертає кількість оновлених замовлень.
 */
export async function linkGuestOrdersToUser(
  prisma: PrismaClient | Prisma.TransactionClient,
  userId: number,
  phone: string,
): Promise<number> {
  const digits = normalizePhoneDigits(phone)
  if (!digits || digits.length < 9) return 0

  const orphans = await prisma.order.findMany({
    where: { userId: null, phone: { not: '' } },
    select: { id: true, phone: true },
  })

  const ids = orphans
    .filter((o) => normalizePhoneDigits(o.phone) === digits)
    .map((o) => o.id)

  if (ids.length === 0) return 0

  const result = await prisma.order.updateMany({
    where: { id: { in: ids } },
    data: { userId },
  })

  return result.count
}
