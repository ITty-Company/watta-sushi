/** ISO date YYYY-MM-DD in Europe/Amsterdam */
export type DeliveryDateKey = string

export const DELIVERY_BOOKING_DAYS_AHEAD = 13

const OPEN_MIN = 11 * 60
const CLOSE_MIN = 22 * 60
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
  daysAhead = DELIVERY_BOOKING_DAYS_AHEAD,
  reference = new Date(),
): DeliveryDateKey {
  return addDaysToDateKey(getAmsterdamTodayKey(reference), daysAhead)
}

export function buildDeliveryDateOptions(
  locale: string,
  relative: { today: string; tomorrow: string },
  daysAhead = DELIVERY_BOOKING_DAYS_AHEAD,
  reference = new Date(),
): { value: DeliveryDateKey; label: string }[] {
  const today = getAmsterdamTodayKey(reference)
  const tomorrow = addDaysToDateKey(today, 1)
  const dateFmt = new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    timeZone: 'Europe/Amsterdam',
  })

  const options: { value: DeliveryDateKey; label: string }[] = []
  for (let i = 0; i <= daysAhead; i++) {
    const value = addDaysToDateKey(today, i)
    if (value === today) {
      options.push({ value, label: relative.today })
      continue
    }
    if (value === tomorrow) {
      options.push({ value, label: relative.tomorrow })
      continue
    }
    const [y, mo, d] = value.split('-').map(Number)
    options.push({
      value,
      label: dateFmt.format(new Date(Date.UTC(y, mo - 1, d, 12, 0, 0))),
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

/** @deprecated use DeliveryDateKey */
export type DeliveryDay = 'today' | 'tomorrow'
