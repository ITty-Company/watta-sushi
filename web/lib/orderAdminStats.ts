/** Спільна логіка з backend/lib/orderAdminStats.ts — для fallback, якщо /orders/stats недоступний. */
export const COMPLETED_ORDER_STATUSES = ['COMPLETED', 'DELIVERED'] as const;

export type AdminOrderStatusBucket = {
  PENDING: number;
  CONFIRMED: number;
  COOKING: number;
  DELIVERING: number;
  COMPLETED: number;
  CANCELLED: number;
};

export type AdminDailySeriesPoint = {
  date: string;
  revenue: number;
  orders: number;
};

export type AdminOrderStatsPayload = {
  totalOrders: number;
  revenueCompleted: number;
  paymentPaidCount: number;
  todayOrders: number;
  todayRevenue: number;
  byStatus: AdminOrderStatusBucket;
  rawStatusCounts?: Record<string, number>;
  dailySeries14?: AdminDailySeriesPoint[];
};

const STATS_TIMEZONE = 'Europe/Amsterdam';

function countFromRaw(raw: Record<string, number>, status: string): number {
  return raw[status] ?? 0;
}

export function buildByStatusFromOrders(orders: { status: string }[]): AdminOrderStatusBucket {
  const raw: Record<string, number> = {};
  for (const order of orders) {
    const s = String(order.status || 'PENDING');
    raw[s] = (raw[s] || 0) + 1;
  }
  return buildByStatus(raw);
}

export function buildByStatus(raw: Record<string, number>): AdminOrderStatusBucket {
  return {
    PENDING: countFromRaw(raw, 'PENDING'),
    CONFIRMED: countFromRaw(raw, 'CONFIRMED'),
    COOKING: countFromRaw(raw, 'COOKING'),
    DELIVERING: countFromRaw(raw, 'DELIVERING'),
    COMPLETED: countFromRaw(raw, 'COMPLETED') + countFromRaw(raw, 'DELIVERED'),
    CANCELLED: countFromRaw(raw, 'CANCELLED'),
  };
}

export function isCompletedOrderStatus(status: string): boolean {
  return (COMPLETED_ORDER_STATUSES as readonly string[]).includes(status);
}

function ymdInTimeZone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function lastNDaysKeysInTimeZone(n: number, timeZone: string): string[] {
  const out: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    out.push(ymdInTimeZone(d, timeZone));
  }
  return out;
}

type OrderLite = {
  createdAt: string | Date;
  totalPrice: number;
  status: string;
};

export function buildDailySeries14(orders: OrderLite[], timeZone = STATS_TIMEZONE): AdminDailySeriesPoint[] {
  const keys = lastNDaysKeysInTimeZone(14, timeZone);
  const revenueByDay = new Map<string, number>();
  const ordersByDay = new Map<string, number>();
  for (const k of keys) {
    revenueByDay.set(k, 0);
    ordersByDay.set(k, 0);
  }

  for (const order of orders) {
    const createdAt = order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt);
    if (Number.isNaN(createdAt.getTime())) continue;
    const key = ymdInTimeZone(createdAt, timeZone);
    if (!ordersByDay.has(key)) continue;
    ordersByDay.set(key, (ordersByDay.get(key) || 0) + 1);
    if (isCompletedOrderStatus(order.status)) {
      revenueByDay.set(key, (revenueByDay.get(key) || 0) + (Number(order.totalPrice) || 0));
    }
  }

  return keys.map((date) => ({
    date,
    revenue: Math.round((revenueByDay.get(date) || 0) * 100) / 100,
    orders: ordersByDay.get(date) || 0,
  }));
}

export function buildTodayMetrics(orders: OrderLite[], timeZone = STATS_TIMEZONE): {
  todayOrders: number;
  todayRevenue: number;
} {
  const todayKey = ymdInTimeZone(new Date(), timeZone);
  let todayOrders = 0;
  let todayRevenue = 0;

  for (const order of orders) {
    const createdAt = order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt);
    if (Number.isNaN(createdAt.getTime())) continue;
    if (ymdInTimeZone(createdAt, timeZone) !== todayKey) continue;
    todayOrders += 1;
    if (isCompletedOrderStatus(order.status)) {
      todayRevenue += Number(order.totalPrice) || 0;
    }
  }

  return {
    todayOrders,
    todayRevenue: Math.round(todayRevenue * 100) / 100,
  };
}

export function buildStatsFromOrders(orders: OrderLite[]): AdminOrderStatsPayload {
  const byStatus = buildByStatusFromOrders(orders);
  const { todayOrders, todayRevenue } = buildTodayMetrics(orders);
  const revenueCompleted = orders
    .filter((o) => isCompletedOrderStatus(o.status))
    .reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0);

  return {
    totalOrders: orders.length,
    revenueCompleted: Math.round(revenueCompleted * 100) / 100,
    paymentPaidCount: 0,
    todayOrders,
    todayRevenue,
    byStatus,
    dailySeries14: buildDailySeries14(orders),
  };
}
