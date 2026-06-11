'use client'

import { useMemo } from 'react'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import {
  addDaysToDateKey,
  buildOrdersByServiceDate,
  getAmsterdamTodayKey,
  getOrderServiceDateKey,
  isDateKeyInRange,
} from '@/lib/orderServiceDate'
import {
  orderMatchesResolvedPeriod,
  resolveOrdersPeriod,
  type OrdersPeriodKind,
  type ResolvedOrdersPeriod,
} from '@/lib/orderReportPeriod'

export type { OrdersPeriodKind }

export type AdminOrderDayRow = {
  createdAt: string
  status: string
  totalPrice: number
  scheduledForDate?: string | null
}

type Props = {
  orders: AdminOrderDayRow[]
  periodKind: OrdersPeriodKind
  onPeriodKindChange: (kind: OrdersPeriodKind) => void
  selectedDate: string
  onSelectedDateChange: (date: string) => void
  rangeFrom: string
  rangeTo: string
  onRangeFromChange: (date: string) => void
  onRangeToChange: (date: string) => void
}

const PERIOD_KINDS: OrdersPeriodKind[] = [
  'day',
  'week',
  'month',
  'lastMonth',
  'year',
  'all',
  'custom',
]

function formatDayHeading(dateKey: string, locale: string, todayLabel: string): string {
  const today = getAmsterdamTodayKey()
  if (dateKey === today) return todayLabel
  const [y, mo, d] = dateKey.split('-').map(Number)
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Amsterdam',
  }).format(new Date(Date.UTC(y, mo - 1, d, 12, 0, 0)))
}

function formatRangeHeading(from: string, to: string, locale: string): string {
  const fmt = (key: string) => {
    const [y, mo, d] = key.split('-').map(Number)
    return new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'Europe/Amsterdam',
    }).format(new Date(Date.UTC(y, mo - 1, d, 12, 0, 0)))
  }
  const start = from <= to ? from : to
  const end = from <= to ? to : from
  return `${fmt(start)} — ${fmt(end)}`
}

function summarizeOrders(
  orders: AdminOrderDayRow[],
  period: ResolvedOrdersPeriod,
): { orders: number; revenue: number } {
  let count = 0
  let revenue = 0
  for (const order of orders) {
    const key = getOrderServiceDateKey(order)
    if (!orderMatchesResolvedPeriod(key, period)) continue
    count += 1
    if (order.status === 'COMPLETED' || order.status === 'DELIVERED') {
      revenue += Number(order.totalPrice) || 0
    }
  }
  return { orders: count, revenue: Math.round(revenue * 100) / 100 }
}

export default function AdminOrdersByDayPanel({
  orders,
  periodKind,
  onPeriodKindChange,
  selectedDate,
  onSelectedDateChange,
  rangeFrom,
  rangeTo,
  onRangeFromChange,
  onRangeToChange,
}: Props) {
  const { t, language } = useLanguage()
  const ao = t.adminPanel.orders
  const cr = t.adminPanel.crmReports

  const resolvedPeriod = useMemo(
    () =>
      resolveOrdersPeriod({
        kind: periodKind,
        dayKey: selectedDate,
        customFrom: rangeFrom,
        customTo: rangeTo,
      }),
    [periodKind, selectedDate, rangeFrom, rangeTo],
  )

  const byDay = useMemo(() => buildOrdersByServiceDate(orders), [orders])

  const daySummaries = useMemo(() => {
    return [...byDay.values()].sort((a, b) => b.date.localeCompare(a.date))
  }, [byDay])

  const activeStats = useMemo(
    () => summarizeOrders(orders, resolvedPeriod),
    [orders, resolvedPeriod],
  )

  const dayHeading = formatDayHeading(selectedDate, language, ao.ordersByDayToday)
  const rangeHeading =
    resolvedPeriod.fromYmd && resolvedPeriod.toYmd
      ? formatRangeHeading(resolvedPeriod.fromYmd, resolvedPeriod.toYmd, language)
      : cr.periodAll

  const showPickDayHint =
    periodKind === 'day' && activeStats.orders === 0 && daySummaries.length > 0

  const periodDaySummaries = useMemo(() => {
    if (periodKind === 'day') return daySummaries
    if (periodKind === 'all') return daySummaries
    if (!resolvedPeriod.fromYmd || !resolvedPeriod.toYmd) return []
    return daySummaries.filter((row) =>
      isDateKeyInRange(row.date, resolvedPeriod.fromYmd!, resolvedPeriod.toYmd!),
    )
  }, [periodKind, daySummaries, resolvedPeriod])

  return (
    <section className="admin-orders-by-day w-full">
      <div className="admin-orders-by-day__head">
        <h2 className="admin-orders-by-day__title">{ao.ordersByDayTitle}</h2>
      </div>

      <div className="admin-orders-by-day__period-row">
        <p className="admin-orders-by-day__period-label">{cr.periodLabel}</p>
        <div className="admin-orders-by-day__period-chips">
          {PERIOD_KINDS.map((kind) => {
            const label =
              kind === 'day'
                ? ao.ordersViewDay
                : kind === 'week'
                  ? ao.ordersViewWeek
                  : kind === 'month'
                    ? cr.periodMonth
                    : kind === 'lastMonth'
                      ? cr.periodLastMonth
                      : kind === 'year'
                        ? cr.periodYear
                        : kind === 'all'
                          ? cr.periodAll
                          : cr.periodCustom
            return (
              <button
                key={kind}
                type="button"
                className={`admin-orders-by-day__period-chip${periodKind === kind ? ' admin-orders-by-day__period-chip--active' : ''}`}
                onClick={() => onPeriodKindChange(kind)}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {periodKind === 'day' ? (
        <div className="admin-orders-by-day__nav-wrap">
          <div className="admin-orders-by-day__nav">
            <button
              type="button"
              className="admin-orders-by-day__nav-btn"
              aria-label={ao.ordersByDayPrev}
              onClick={() => onSelectedDateChange(addDaysToDateKey(selectedDate, -1))}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </button>
            <label className="admin-orders-by-day__date-pill">
              <CalendarDays className="h-4 w-4 shrink-0" aria-hidden />
              <span>{dayHeading}</span>
              <input
                type="date"
                className="admin-orders-by-day__date-input"
                value={selectedDate}
                onChange={(e) => {
                  if (e.target.value) onSelectedDateChange(e.target.value)
                }}
              />
            </label>
            <button
              type="button"
              className="admin-orders-by-day__nav-btn"
              aria-label={ao.ordersByDayNext}
              onClick={() => onSelectedDateChange(addDaysToDateKey(selectedDate, 1))}
            >
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
            <button
              type="button"
              className="admin-orders-by-day__today-btn"
              onClick={() => onSelectedDateChange(getAmsterdamTodayKey())}
            >
              {ao.ordersByDayToday}
            </button>
          </div>
        </div>
      ) : periodKind === 'custom' ? (
        <div className="admin-orders-by-day__range">
          <p className="admin-orders-by-day__range-heading">{rangeHeading}</p>
          <div className="admin-orders-by-day__range-inputs">
            <label className="admin-orders-by-day__range-field">
              <span>{ao.ordersRangeFrom}</span>
              <input
                type="date"
                value={rangeFrom}
                onChange={(e) => {
                  if (e.target.value) onRangeFromChange(e.target.value)
                }}
              />
            </label>
            <label className="admin-orders-by-day__range-field">
              <span>{ao.ordersRangeTo}</span>
              <input
                type="date"
                value={rangeTo}
                onChange={(e) => {
                  if (e.target.value) onRangeToChange(e.target.value)
                }}
              />
            </label>
          </div>
        </div>
      ) : (
        <p className="admin-orders-by-day__range-heading admin-orders-by-day__range-heading--preset">
          {cr.selectedPeriod}: <strong>{periodKind === 'all' ? cr.periodAll : rangeHeading}</strong>
        </p>
      )}

      <div className="admin-orders-by-day__stats">
        <div className="admin-orders-by-day__stat">
          <span className="admin-orders-by-day__stat-k">{ao.ordersByDayCount}</span>
          <span className="admin-orders-by-day__stat-v">{activeStats.orders}</span>
        </div>
        <div className="admin-orders-by-day__stat">
          <span className="admin-orders-by-day__stat-k">{ao.ordersByDayRevenue}</span>
          <span className="admin-orders-by-day__stat-v">{activeStats.revenue.toFixed(2)} €</span>
        </div>
      </div>

      {showPickDayHint ? (
        <p className="admin-orders-by-day__hint">{ao.ordersByDayPickHint}</p>
      ) : null}

      {periodDaySummaries.length > 0 ? (
        <div className="admin-orders-by-day__chips-wrap">
          <p className="admin-orders-by-day__chips-label">
            {periodKind === 'day' ? ao.daysWithOrders : ao.daysWithOrdersInRange}
          </p>
          <div className="admin-orders-by-day__chips">
            {periodDaySummaries.slice(0, 40).map((row) => (
              <button
                key={row.date}
                type="button"
                className={`admin-orders-by-day__chip${
                  periodKind === 'day' && row.date === selectedDate
                    ? ' admin-orders-by-day__chip--active'
                    : ''
                }`}
                onClick={() => {
                  onPeriodKindChange('day')
                  onSelectedDateChange(row.date)
                }}
              >
                <span>{row.date.slice(5)}</span>
                <strong>{row.orders}</strong>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  )
}
