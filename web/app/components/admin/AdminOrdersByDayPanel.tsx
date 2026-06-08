'use client'

import { useMemo } from 'react'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import {
  addDaysToDateKey,
  buildOrdersByServiceDate,
  getAmsterdamTodayKey,
} from '@/lib/orderServiceDate'

export type AdminOrderDayRow = {
  createdAt: string
  status: string
  totalPrice: number
  scheduledForDate?: string | null
}

type Props = {
  orders: AdminOrderDayRow[]
  selectedDate: string
  onSelectedDateChange: (date: string) => void
}

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

export default function AdminOrdersByDayPanel({
  orders,
  selectedDate,
  onSelectedDateChange,
}: Props) {
  const { t, language } = useLanguage()
  const ao = t.adminPanel.orders

  const byDay = useMemo(() => buildOrdersByServiceDate(orders), [orders])

  const daySummaries = useMemo(() => {
    return [...byDay.values()].sort((a, b) => b.date.localeCompare(a.date))
  }, [byDay])

  const dayStats = byDay.get(selectedDate) ?? { date: selectedDate, orders: 0, revenue: 0 }
  const dayHeading = formatDayHeading(selectedDate, language, ao.ordersByDayToday)

  return (
    <section className="admin-orders-by-day w-full">
      <div className="admin-orders-by-day__head">
        <h2 className="admin-orders-by-day__title">{ao.ordersByDayTitle}</h2>
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

      <div className="admin-orders-by-day__stats">
        <div className="admin-orders-by-day__stat">
          <span className="admin-orders-by-day__stat-k">{ao.ordersByDayCount}</span>
          <span className="admin-orders-by-day__stat-v">{dayStats.orders}</span>
        </div>
        <div className="admin-orders-by-day__stat">
          <span className="admin-orders-by-day__stat-k">{ao.ordersByDayRevenue}</span>
          <span className="admin-orders-by-day__stat-v">{dayStats.revenue.toFixed(2)} €</span>
        </div>
      </div>

      {daySummaries.length > 0 ? (
        <div className="admin-orders-by-day__chips-wrap">
          <p className="admin-orders-by-day__chips-label">{ao.daysWithOrders}</p>
          <div className="admin-orders-by-day__chips">
            {daySummaries.slice(0, 30).map((row) => (
              <button
                key={row.date}
                type="button"
                className={`admin-orders-by-day__chip${row.date === selectedDate ? ' admin-orders-by-day__chip--active' : ''}`}
                onClick={() => onSelectedDateChange(row.date)}
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
