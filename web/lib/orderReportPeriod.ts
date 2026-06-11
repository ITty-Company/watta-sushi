/** Періоди для фільтра замовлень і CRM-звітів у адмінці. */

import { addDaysToDateKey, getAmsterdamTodayKey } from '@/lib/orderServiceDate'

export type OrdersPeriodKind = 'day' | 'week' | 'month' | 'lastMonth' | 'year' | 'all' | 'custom'

export type CrmReportPeriodKind = 'all' | 'month' | 'lastMonth' | 'year' | 'custom'

export type ResolvedOrdersPeriod = {
  kind: OrdersPeriodKind
  label: string
  fromYmd: string | null
  toYmd: string | null
  crmPeriod: CrmReportPeriodKind
  crmFrom: string | null
  crmTo: string | null
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

function lastDayOfMonth(y: number, m: number): number {
  return new Date(y, m, 0).getDate()
}

function monthLabel(y: number, m: number): string {
  return `${pad2(m)}.${y}`
}

function sortedRange(from: string, to: string): { from: string; to: string } {
  return from <= to ? { from, to } : { from: to, to: from }
}

export function resolveOrdersPeriod(input: {
  kind: OrdersPeriodKind
  dayKey?: string
  customFrom?: string
  customTo?: string
}): ResolvedOrdersPeriod {
  const today = getAmsterdamTodayKey()
  const dayKey = input.dayKey && /^\d{4}-\d{2}-\d{2}$/.test(input.dayKey) ? input.dayKey : today
  const [ty, tm] = today.split('-').map(Number)

  if (input.kind === 'all') {
    return {
      kind: 'all',
      label: 'all',
      fromYmd: null,
      toYmd: null,
      crmPeriod: 'all',
      crmFrom: null,
      crmTo: null,
    }
  }

  if (input.kind === 'day') {
    return {
      kind: 'day',
      label: dayKey,
      fromYmd: dayKey,
      toYmd: dayKey,
      crmPeriod: 'custom',
      crmFrom: dayKey,
      crmTo: dayKey,
    }
  }

  if (input.kind === 'week') {
    const fromYmd = addDaysToDateKey(today, -6)
    const range = sortedRange(fromYmd, today)
    return {
      kind: 'week',
      label: `${range.from} — ${range.to}`,
      fromYmd: range.from,
      toYmd: range.to,
      crmPeriod: 'custom',
      crmFrom: range.from,
      crmTo: range.to,
    }
  }

  if (input.kind === 'month') {
    const fromYmd = `${ty}-${pad2(tm)}-01`
    return {
      kind: 'month',
      label: monthLabel(ty, tm),
      fromYmd,
      toYmd: today,
      crmPeriod: 'month',
      crmFrom: null,
      crmTo: null,
    }
  }

  if (input.kind === 'lastMonth') {
    let py = ty
    let pm = tm - 1
    if (pm < 1) {
      pm = 12
      py -= 1
    }
    const fromYmd = `${py}-${pad2(pm)}-01`
    const toYmd = `${py}-${pad2(pm)}-${pad2(lastDayOfMonth(py, pm))}`
    return {
      kind: 'lastMonth',
      label: monthLabel(py, pm),
      fromYmd,
      toYmd,
      crmPeriod: 'lastMonth',
      crmFrom: null,
      crmTo: null,
    }
  }

  if (input.kind === 'year') {
    const fromYmd = `${ty}-01-01`
    return {
      kind: 'year',
      label: String(ty),
      fromYmd,
      toYmd: today,
      crmPeriod: 'year',
      crmFrom: null,
      crmTo: null,
    }
  }

  const dateRe = /^\d{4}-\d{2}-\d{2}$/
  const rawFrom = input.customFrom && dateRe.test(input.customFrom) ? input.customFrom : today
  const rawTo = input.customTo && dateRe.test(input.customTo) ? input.customTo : today
  const range = sortedRange(rawFrom, rawTo)
  return {
    kind: 'custom',
    label: `${range.from} — ${range.to}`,
    fromYmd: range.from,
    toYmd: range.to,
    crmPeriod: 'custom',
    crmFrom: range.from,
    crmTo: range.to,
  }
}

export function orderMatchesResolvedPeriod(
  serviceDateKey: string,
  period: ResolvedOrdersPeriod,
): boolean {
  if (period.kind === 'all' || !period.fromYmd || !period.toYmd) return true
  return serviceDateKey >= period.fromYmd && serviceDateKey <= period.toYmd
}
