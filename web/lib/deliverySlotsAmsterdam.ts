export type DeliveryDay = 'today' | 'tomorrow'

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

export function buildAmsterdamSlots(day: DeliveryDay): { value: string; label: string }[] {
  const slots: { value: string; label: string }[] = [
    { value: 'asap', label: 'Якнайшвидше' },
  ]
  const nowMin = getAmsterdamMinutesFromMidnight()
  for (let t = OPEN_MIN; t < CLOSE_MIN; t += STEP_MIN) {
    const endT = t + STEP_MIN
    if (day === 'today' && t < nowMin + BUFFER_MIN) continue
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

export function hasBookableSlotsToday(): boolean {
  const nowMin = getAmsterdamMinutesFromMidnight()
  for (let t = OPEN_MIN; t < CLOSE_MIN; t += STEP_MIN) {
    if (t >= nowMin + BUFFER_MIN) return true
  }
  return false
}
