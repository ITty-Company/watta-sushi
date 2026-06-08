/** ISO date YYYY-MM-DD in Europe/Amsterdam */
export type DeliveryDateKey = string

/** Скільки днів показувати в горизонтальній стрічці (не ліміт бронювання). */
export const DELIVERY_DATE_RAIL_DAYS = 6

/** @deprecated використовуйте DELIVERY_DATE_RAIL_DAYS; залишено для сумісності */
export const DELIVERY_BOOKING_DAYS_AHEAD = DELIVERY_DATE_RAIL_DAYS

export const KITCHEN_OPEN_MIN = 14 * 60
export const KITCHEN_CLOSE_MIN = 21 * 60
const OPEN_MIN = KITCHEN_OPEN_MIN
const CLOSE_MIN = KITCHEN_CLOSE_MIN
const STEP_MIN = 30
/** Minimum lead time from now (Amsterdam) before a slot is bookable */
const BUFFER_MIN = 45

function pad2(n: number) {
  return n.toString().padStart(2, '0')
}

export function getAmsterdamMinutesFromMidnight(date = new Date()): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Amsterdam',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date)
  const h = parseInt(parts.find((p) => p.type === 'hour')?.value || '0', 10)
  const m = parseInt(parts.find((p) => p.type === 'minute')?.value || '0', 10)
  return h * 60 + m
}

export function getAmsterdamTodayKey(reference = new Date()): DeliveryDateKey {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Amsterdam',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(reference)
}

export function addDaysToDateKey(key: DeliveryDateKey, days: number): DeliveryDateKey {
  const [y, m, d] = key.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d + days))
  return `${dt.getUTCFullYear()}-${pad2(dt.getUTCMonth() + 1)}-${pad2(dt.getUTCDate())}`
}

export function getMaxDeliveryDateKey(
  daysAhead = DELIVERY_DATE_RAIL_DAYS,
  reference = new Date(),
): DeliveryDateKey {
  return addDaysToDateKey(getAmsterdamTodayKey(reference), daysAhead)
}

export function formatDeliveryDateLabel(
  dateKey: DeliveryDateKey,
  locale: string,
  relative: { today: string; tomorrow: string },
): string {
  const today = getAmsterdamTodayKey()
  const tomorrow = addDaysToDateKey(today, 1)
  if (dateKey === today) return relative.today
  if (dateKey === tomorrow) return relative.tomorrow
  const [y, mo, d] = dateKey.split('-').map(Number)
  return new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    timeZone: 'Europe/Amsterdam',
  }).format(new Date(Date.UTC(y, mo - 1, d, 12, 0, 0)))
}

export function isDeliveryDateKeyAllowed(
  dateKey: DeliveryDateKey,
  reference = new Date(),
): boolean {
  return dateKey >= getAmsterdamTodayKey(reference)
}

export function buildDeliveryDateOptions(
  locale: string,
  relative: { today: string; tomorrow: string },
  railDays = DELIVERY_DATE_RAIL_DAYS,
  reference = new Date(),
): { value: DeliveryDateKey; label: string }[] {
  const today = getAmsterdamTodayKey(reference)
  const tomorrow = addDaysToDateKey(today, 1)

  const options: { value: DeliveryDateKey; label: string }[] = []
  for (let i = 0; i <= railDays; i++) {
    const value = addDaysToDateKey(today, i)
    options.push({
      value,
      label: formatDeliveryDateLabel(value, locale, relative),
    })
  }
  return options
}

export function buildAmsterdamSlots(
  dateKey: DeliveryDateKey,
  asapLabel: string,
  reference = new Date(),
): { value: string; label: string }[] {
  const slots: { value: string; label: string }[] = [{ value: 'asap', label: asapLabel }]
  const isToday = dateKey === getAmsterdamTodayKey(reference)
  const nowMin = getAmsterdamMinutesFromMidnight(reference)

  for (let t = OPEN_MIN; t < CLOSE_MIN; t += STEP_MIN) {
    const endT = t + STEP_MIN
    if (isToday && t < nowMin + BUFFER_MIN) continue
    const sh = Math.floor(t / 60)
    const sm = t % 60
    const eh = Math.floor(endT / 60)
    const em = endT % 60
    const label = `${pad2(sh)}:${pad2(sm)} – ${pad2(eh)}:${pad2(em)}`
    const value = `${pad2(sh)}:${pad2(sm)}-${pad2(eh)}:${pad2(em)}`
    slots.push({ value, label })
  }
  return slots
}

export function hasBookableSlotsToday(reference = new Date()): boolean {
  const nowMin = getAmsterdamMinutesFromMidnight(reference)
  for (let t = OPEN_MIN; t < CLOSE_MIN; t += STEP_MIN) {
    if (t >= nowMin + BUFFER_MIN) return true
  }
  return false
}

/** Кухня приймає замовлення «зараз» (Europe/Amsterdam, 14:00–21:00). */
export function isKitchenOpenNow(reference = new Date()): boolean {
  const nowMin = getAmsterdamMinutesFromMidnight(reference)
  return nowMin >= OPEN_MIN && nowMin < CLOSE_MIN
}

export function formatKitchenHoursRange(): string {
  const sh = Math.floor(OPEN_MIN / 60)
  const sm = OPEN_MIN % 60
  const eh = Math.floor(CLOSE_MIN / 60)
  const em = CLOSE_MIN % 60
  return `${pad2(sh)}:${pad2(sm)} – ${pad2(eh)}:${pad2(em)}`
}

/** Найближча дата передзамовлення, коли сьогодні вже немає слотів. */
export function getDefaultPreorderDateKey(reference = new Date()): DeliveryDateKey {
  const today = getAmsterdamTodayKey(reference)
  if (isKitchenOpenNow(reference) && hasBookableSlotsToday(reference)) return today
  return addDaysToDateKey(today, 1)
}

export function pickPreorderSlotValue(
  dateKey: DeliveryDateKey,
  asapLabel: string,
  reference = new Date(),
): string {
  const slots = buildAmsterdamSlots(dateKey, asapLabel, reference)
  if (!isKitchenOpenNow(reference) || dateKey !== getAmsterdamTodayKey(reference)) {
    return slots.find((s) => s.value !== 'asap')?.value ?? slots[0]?.value ?? 'asap'
  }
  return slots[0]?.value ?? 'asap'
}

export function assertScheduledDeliveryAllowed(
  dateKey: DeliveryDateKey,
  slot: string,
  reference = new Date(),
): { ok: true } | { ok: false; message: string } {
  const today = getAmsterdamTodayKey(reference)
  if (dateKey < today) {
    return { ok: false, message: 'Дата доставки не може бути в минулому' }
  }
  const allowed = buildAmsterdamSlots(dateKey, 'asap', reference).map((s) => s.value)
  if (!allowed.includes(slot)) {
    return { ok: false, message: 'Обраний час доставки недоступний' }
  }
  return { ok: true }
}

/** @deprecated use DeliveryDateKey */
export type DeliveryDay = 'today' | 'tomorrow'
