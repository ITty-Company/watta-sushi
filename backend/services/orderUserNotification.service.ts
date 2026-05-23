import type { PrismaClient } from '@prisma/client';

const AMSTERDAM_TZ = 'Europe/Amsterdam';

type LocaleKey = 'uk' | 'ru' | 'en';

function formatReadyAt(d: Date, locale: LocaleKey): string {
  const loc = locale === 'uk' ? 'uk-UA' : locale === 'ru' ? 'ru-RU' : 'en-GB';
  return d.toLocaleString(loc, {
    timeZone: AMSTERDAM_TZ,
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const STATUS_COPY: Record<string, Record<LocaleKey, string>> = {
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

function statusTitle(
  status: string,
  orderId: number,
  readyAt?: Date | null,
  fulfillmentType?: string | null,
): { title: string; body: string } {
  const copy = STATUS_COPY[status] ?? STATUS_COPY.PENDING;
  const title = copy.uk;
  let body = `${copy.uk} №${orderId}`;

  if (readyAt && (status === 'CONFIRMED' || status === 'COOKING')) {
    const when = formatReadyAt(readyAt, 'uk');
    const isPickup = String(fulfillmentType || '').toUpperCase() === 'PICKUP';
    if (isPickup) {
      body = `Замовлення №${orderId} буде готове до ${when} (самовивіз)`;
    } else {
      body = `Замовлення №${orderId} буде доставлено до ${when}`;
    }
  }

  return { title, body };
}

export type OrderStatusNotifyOptions = {
  readyAt?: Date | string | null;
  fulfillmentType?: string | null;
};

export async function notifyUserOrderStatusChange(
  prisma: PrismaClient,
  userId: number,
  orderId: number,
  status: string,
  previousStatus?: string | null,
  options?: OrderStatusNotifyOptions,
): Promise<void> {
  if (!userId || !orderId || !status) return;
  if (previousStatus && previousStatus === status && !options?.readyAt) return;

  const readyAt =
    options?.readyAt != null && options.readyAt !== ''
      ? new Date(options.readyAt)
      : null;
  const readyAtValid = readyAt && !Number.isNaN(readyAt.getTime()) ? readyAt : null;

  const { title, body } = statusTitle(
    status,
    orderId,
    readyAtValid,
    options?.fulfillmentType,
  );

  try {
    await prisma.userNotification.create({
      data: {
        userId,
        type: 'ORDER_STATUS',
        title,
        body,
        orderId,
        meta: {
          status,
          previousStatus: previousStatus ?? null,
          readyAt: readyAtValid?.toISOString() ?? null,
          fulfillmentType: options?.fulfillmentType ?? null,
        },
      },
    });
  } catch (e) {
    console.error('UserNotification create failed:', e);
  }
}
