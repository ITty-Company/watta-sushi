/** Дата обслуговування замовлення (доставка / самовивіз) для адмін-фільтрів. */

const STATS_TIMEZONE = 'Europe/Amsterdam';

export type OrderWithSchedule = {
  scheduledForDate?: string | null;
  createdAt: string | Date;
};

function ymdInTimeZone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function getAmsterdamTodayKey(reference = new Date()): string {
  return ymdInTimeZone(reference, STATS_TIMEZONE);
}

export function getAmsterdamMonthStartKey(reference = new Date()): string {
  const today = getAmsterdamTodayKey(reference);
  return `${today.slice(0, 8)}01`;
}

export function isDateKeyInRange(dateKey: string, from: string, to: string): boolean {
  const start = from <= to ? from : to;
  const end = from <= to ? to : from;
  return dateKey >= start && dateKey <= end;
}

export function addDaysToDateKey(key: string, days: number): string {
  const [y, m, d] = key.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  const pad2 = (n: number) => n.toString().padStart(2, '0');
  return `${dt.getUTCFullYear()}-${pad2(dt.getUTCMonth() + 1)}-${pad2(dt.getUTCDate())}`;
}

export function getOrderServiceDateKey(order: OrderWithSchedule): string {
  if (order.scheduledForDate && /^\d{4}-\d{2}-\d{2}$/.test(order.scheduledForDate)) {
    return order.scheduledForDate;
  }
  const createdAt =
    order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt);
  if (Number.isNaN(createdAt.getTime())) return getAmsterdamTodayKey();
  return ymdInTimeZone(createdAt, STATS_TIMEZONE);
}

export function formatSlotLabel(slot: string | null | undefined, asapLabel: string): string {
  if (!slot || slot === 'asap') return asapLabel;
  return slot.replace('-', ' – ');
}

export type DayOrderSummary = {
  date: string;
  orders: number;
  revenue: number;
};

export function buildOrdersByServiceDate<T extends OrderWithSchedule & { status: string; totalPrice: number }>(
  orders: T[],
  completedStatuses: readonly string[] = ['COMPLETED', 'DELIVERED'],
): Map<string, DayOrderSummary> {
  const map = new Map<string, DayOrderSummary>();
  for (const order of orders) {
    const date = getOrderServiceDateKey(order);
    const row = map.get(date) ?? { date, orders: 0, revenue: 0 };
    row.orders += 1;
    if (completedStatuses.includes(order.status)) {
      row.revenue += Number(order.totalPrice) || 0;
    }
    map.set(date, row);
  }
  for (const row of map.values()) {
    row.revenue = Math.round(row.revenue * 100) / 100;
  }
  return map;
}
