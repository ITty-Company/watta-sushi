import type { PrismaClient } from '@prisma/client';

const STATUS_COPY: Record<string, { uk: string; ru: string; en: string }> = {
  PENDING: {
    uk: 'Замовлення прийнято',
    ru: 'Заказ принят',
    en: 'Order received',
  },
  CONFIRMED: {
    uk: 'Замовлення підтверджено',
    ru: 'Заказ подтверждён',
    en: 'Order confirmed',
  },
  COOKING: {
    uk: 'Готуємо ваше замовлення',
    ru: 'Готовим ваш заказ',
    en: 'We are preparing your order',
  },
  DELIVERING: {
    uk: 'Замовлення вже доставляється',
    ru: 'Заказ уже доставляется',
    en: 'Your order is on the way',
  },
  DELIVERED: {
    uk: 'Замовлення доставлено',
    ru: 'Заказ доставлен',
    en: 'Order delivered',
  },
  COMPLETED: {
    uk: 'Замовлення виконано',
    ru: 'Заказ выполнен',
    en: 'Order completed',
  },
  CANCELLED: {
    uk: 'Замовлення скасовано',
    ru: 'Заказ отменён',
    en: 'Order cancelled',
  },
};

function statusTitle(status: string, orderId: number): { title: string; body: string } {
  const copy = STATUS_COPY[status] ?? STATUS_COPY.PENDING;
  const title = copy.uk;
  const body = `${copy.uk} №${orderId}`;
  return { title, body };
}

export async function notifyUserOrderStatusChange(
  prisma: PrismaClient,
  userId: number,
  orderId: number,
  status: string,
  previousStatus?: string | null,
): Promise<void> {
  if (!userId || !orderId || !status) return;
  if (previousStatus && previousStatus === status) return;

  const { title, body } = statusTitle(status, orderId);

  try {
    await prisma.userNotification.create({
      data: {
        userId,
        type: 'ORDER_STATUS',
        title,
        body,
        orderId,
        meta: { status, previousStatus: previousStatus ?? null },
      },
    });
  } catch (e) {
    console.error('UserNotification create failed:', e);
  }
}
