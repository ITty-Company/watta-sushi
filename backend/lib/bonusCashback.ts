import type { Prisma, PrismaClient } from '@prisma/client'

export const DEFAULT_BONUS_CASHBACK_PERCENT = 5

export function clampCashbackPercent(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.min(100, Math.max(0, value))
}

export function parseCashbackPercentInput(value: unknown): number | null | undefined {
  if (value === undefined) return undefined
  if (value === null || value === '') return null
  const n = Number(value)
  if (!Number.isFinite(n)) return undefined
  return clampCashbackPercent(n)
}

type SiteBonusConfig = {
  bonusCashbackEnabled: boolean
  bonusCashbackPercent: number
}

type UserBonusOverride = {
  bonusCashbackPercentOverride: number | null
} | null

export function resolveCashbackPercent(
  site: SiteBonusConfig,
  user: UserBonusOverride,
): number {
  if (!site.bonusCashbackEnabled) return 0
  const override = user?.bonusCashbackPercentOverride
  if (override != null && Number.isFinite(override)) {
    return clampCashbackPercent(override)
  }
  return clampCashbackPercent(site.bonusCashbackPercent)
}

export function computeCashbackAmount(merchandiseTotal: number, percent: number): number {
  if (percent <= 0 || merchandiseTotal <= 0) return 0
  return Math.round(merchandiseTotal * (percent / 100) * 100) / 100
}

export async function getSiteBonusConfig(
  prisma: PrismaClient | Prisma.TransactionClient,
): Promise<SiteBonusConfig> {
  const site = await prisma.siteSetting.findUnique({ where: { id: 1 } })
  return {
    bonusCashbackEnabled: site?.bonusCashbackEnabled ?? true,
    bonusCashbackPercent: site?.bonusCashbackPercent ?? DEFAULT_BONUS_CASHBACK_PERCENT,
  }
}

/** Нарахувати кешбэк один раз на замовлення; повертає суму € або 0. */
export async function awardOrderCashbackIfEligible(
  prisma: PrismaClient,
  orderId: number,
  userId: number,
): Promise<number> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { bonusCashbackAwardedAt: true, userId: true },
  })
  if (!order || order.userId !== userId || order.bonusCashbackAwardedAt) return 0

  const [site, user, orderItems] = await Promise.all([
    getSiteBonusConfig(prisma),
    prisma.user.findUnique({
      where: { id: userId },
      select: { bonusCashbackPercentOverride: true },
    }),
    prisma.orderItem.findMany({
      where: { orderId },
      select: { price: true, quantity: true },
    }),
  ])

  const percent = resolveCashbackPercent(site, user)
  const merchandiseTotal = orderItems.reduce(
    (sum, item) => sum + Number(item.price) * Number(item.quantity),
    0,
  )
  const cashback = computeCashbackAmount(merchandiseTotal, percent)
  if (cashback <= 0) return 0

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { bonusBalance: { increment: cashback } },
    }),
    prisma.order.update({
      where: { id: orderId },
      data: { bonusCashbackAwardedAt: new Date() },
    }),
  ])

  return cashback
}
