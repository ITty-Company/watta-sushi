/** Валідація дати/слота доставки (Europe/Amsterdam) — дзеркало web/lib/deliverySlotsAmsterdam.ts */

export type DeliveryDateKey = string;

const OPEN_MIN = 14 * 60;
const CLOSE_MIN = 21 * 60;
const STEP_MIN = 30;
const BUFFER_MIN = 45;

function pad2(n: number) {
  return n.toString().padStart(2, '0');
}

export function getAmsterdamTodayKey(reference = new Date()): DeliveryDateKey {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Amsterdam',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(reference);
}

export function getAmsterdamMinutesFromMidnight(date = new Date()): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Amsterdam',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const h = parseInt(parts.find((p) => p.type === 'hour')?.value || '0', 10);
  const m = parseInt(parts.find((p) => p.type === 'minute')?.value || '0', 10);
  return h * 60 + m;
}

export function buildAmsterdamSlotValues(
  dateKey: DeliveryDateKey,
  reference = new Date(),
): string[] {
  const values: string[] = ['asap'];
  const isToday = dateKey === getAmsterdamTodayKey(reference);
  const nowMin = getAmsterdamMinutesFromMidnight(reference);

  for (let t = OPEN_MIN; t < CLOSE_MIN; t += STEP_MIN) {
    const endT = t + STEP_MIN;
    if (isToday && t < nowMin + BUFFER_MIN) continue;
    const sh = Math.floor(t / 60);
    const sm = t % 60;
    const eh = Math.floor(endT / 60);
    const em = endT % 60;
    values.push(`${pad2(sh)}:${pad2(sm)}-${pad2(eh)}:${pad2(em)}`);
  }
  return values;
}

export function parseScheduledForDate(value: unknown): DeliveryDateKey | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  const [y, m, d] = trimmed.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (
    dt.getUTCFullYear() !== y ||
    dt.getUTCMonth() !== m - 1 ||
    dt.getUTCDate() !== d
  ) {
    return null;
  }
  return trimmed;
}

export function parseScheduledForSlot(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (trimmed === 'asap') return 'asap';
  if (/^\d{2}:\d{2}-\d{2}:\d{2}$/.test(trimmed)) return trimmed;
  return null;
}

export function assertScheduledDeliveryAllowed(
  dateKey: DeliveryDateKey,
  slot: string,
  reference = new Date(),
): { ok: true } | { ok: false; message: string } {
  const today = getAmsterdamTodayKey(reference);
  if (dateKey < today) {
    return { ok: false, message: 'Дата доставки не може бути в минулому' };
  }
  const allowed = buildAmsterdamSlotValues(dateKey, reference);
  if (!allowed.includes(slot)) {
    return { ok: false, message: 'Обраний час доставки недоступний' };
  }
  return { ok: true };
}
