'use client'

import { useMemo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { BookOpen, CalendarDays, ChevronRight, Globe, Image as ImageIcon, Layers, ListOrdered, Package, Receipt, RefreshCw, Sparkles, Tag, TrendingUp, Users } from 'lucide-react'
import { MapPin, ShoppingBag, User } from '@/lib/wattaInlineIcons'
import { useLanguage } from '../../context/LanguageContext'
import type { AdminDailySeriesPoint } from '@/lib/orderAdminStats'
import type { AdminNavTabId } from './AdminNavDrawer'

export type DashboardOrderStatusFilter =
  | 'PENDING'
  | 'CONFIRMED'
  | 'COOKING'
  | 'DELIVERING'
  | 'COMPLETED'
  | 'CANCELLED'

export type DashboardNavigateOpts = {
  orderStatus?: DashboardOrderStatusFilter
}

export type DashboardMetricsStudio = {
  revenue: number
  totalOrders: number
  paidOrders: number
  todayOrders: number
  todayRevenue: number
  pending: number
  confirmed: number
  cooking: number
  delivering: number
  completed: number
  cancelled: number
  dailySeries14: AdminDailySeriesPoint[]
  fromDb: boolean
}

type ContentCounts = {
  products: number
  cities: number
  countries: number
  promos: number
  categories: number
  users: number
  banners: number
  blog: number
  ingredients: number
  team: number
}

type Props = {
  isLoading: boolean
  dashboardMetrics: DashboardMetricsStudio
  counts: ContentCounts
  onNavigate: (tab: AdminNavTabId, opts?: DashboardNavigateOpts) => void
}

const BRAND = {
  green: 'var(--watta-brand-action)',
  greenMid: 'var(--watta-brand-action-hover)',
  mint: 'var(--watta-brand-action)',
  accent: '#ff5c00',
  danger: '#c45c4a',
  warm: '#e07a3a',
} as const

type StatusTone = 'default' | 'accent' | 'mint' | 'muted' | 'danger'

export default function AdminDashboardStudio({
  isLoading,
  dashboardMetrics,
  counts,
  onNavigate,
}: Props) {
  const { t } = useLanguage()
  const reduceMotion = useReducedMotion()
  const d = t.adminPanel.dashboard

  const openAria = (section: string) => d.openSectionAria.replace('{{section}}', section)

  const fadeUp = reduceMotion
    ? { initial: false, animate: {} }
    : {
        initial: { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0 },
      }

  const stagger = reduceMotion ? 0 : 0.06

  const series14 = useMemo(
    () =>
      dashboardMetrics.dailySeries14.map((row) => ({
        date: row.date.slice(5),
        revenue: row.revenue,
        orders: row.orders,
      })),
    [dashboardMetrics.dailySeries14],
  )

  const pieData = useMemo(
    () => [
      { name: d.statusPending, value: dashboardMetrics.pending, color: BRAND.warm, status: 'PENDING' as const },
      { name: d.statusConfirmed, value: dashboardMetrics.confirmed, color: BRAND.mint, status: 'CONFIRMED' as const },
      { name: d.statusCooking, value: dashboardMetrics.cooking, color: BRAND.accent, status: 'COOKING' as const },
      { name: d.statusDelivering, value: dashboardMetrics.delivering, color: BRAND.greenMid, status: 'DELIVERING' as const },
      { name: d.statusCompleted, value: dashboardMetrics.completed, color: BRAND.green, status: 'COMPLETED' as const },
      { name: d.statusCancelled, value: dashboardMetrics.cancelled, color: BRAND.danger, status: 'CANCELLED' as const },
    ],
    [d, dashboardMetrics],
  )

  const pieTotal = pieData.reduce((s, x) => s + x.value, 0)
  const hasChartData = series14.some((r) => r.revenue > 0 || r.orders > 0)
  const avgTicket =
    dashboardMetrics.completed > 0
      ? dashboardMetrics.revenue / dashboardMetrics.completed
      : 0

  const tooltipStyle = {
    borderRadius: 12,
    border: '1px solid color-mix(in srgb, var(--watta-brand-action) 15%, transparent)',
    boxShadow: '0 12px 40px -12px color-mix(in srgb, var(--watta-brand-action) 25%, transparent)',
    fontSize: 12,
    fontWeight: 600,
  }

  const chartHeight = 220
  const pieChartHeight = 180
  const chartInitialDimension = { width: 480, height: chartHeight }

  const metricCards = [
    {
      key: 'today-rev',
      label: d.todayRevenue,
      value: `${dashboardMetrics.todayRevenue.toFixed(2)} €`,
      icon: CalendarDays,
      accent: true,
      tab: 'orders' as const,
    },
    {
      key: 'today-ord',
      label: d.todayOrders,
      value: String(dashboardMetrics.todayOrders),
      icon: Package,
      accent: false,
      tab: 'orders' as const,
    },
    {
      key: 'rev',
      label: d.revenue,
      value: `${dashboardMetrics.revenue.toFixed(2)} €`,
      icon: TrendingUp,
      accent: false,
      tab: 'orders' as const,
    },
    {
      key: 'ord',
      label: d.orders,
      value: String(dashboardMetrics.totalOrders),
      icon: Receipt,
      accent: false,
      tab: 'orders' as const,
    },
    {
      key: 'paid',
      label: d.paidOrders,
      value: String(dashboardMetrics.paidOrders),
      icon: Receipt,
      accent: false,
      tab: 'orders' as const,
    },
    {
      key: 'avg',
      label: d.avgOrderValue,
      value: `${avgTicket.toFixed(2)} €`,
      icon: Sparkles,
      accent: true,
      tab: 'orders' as const,
    },
    {
      key: 'prod',
      label: d.products,
      value: String(counts.products),
      icon: ShoppingBag,
      accent: false,
      tab: 'products' as const,
    },
    {
      key: 'city',
      label: d.cities,
      value: String(counts.cities),
      icon: MapPin,
      accent: false,
      tab: 'cities' as const,
    },
    {
      key: 'ctr',
      label: d.countries,
      value: String(counts.countries),
      icon: Globe,
      accent: false,
      tab: 'cities' as const,
    },
  ]

  const statusRows: { label: string; count: number; status: DashboardOrderStatusFilter; tone: StatusTone }[] = [
    { label: d.statusPending, count: dashboardMetrics.pending, status: 'PENDING', tone: 'accent' },
    { label: d.statusConfirmed, count: dashboardMetrics.confirmed, status: 'CONFIRMED', tone: 'mint' },
    { label: d.statusCooking, count: dashboardMetrics.cooking, status: 'COOKING', tone: 'accent' },
    { label: d.statusDelivering, count: dashboardMetrics.delivering, status: 'DELIVERING', tone: 'default' },
    { label: d.statusCompleted, count: dashboardMetrics.completed, status: 'COMPLETED', tone: 'mint' },
    { label: d.statusCancelled, count: dashboardMetrics.cancelled, status: 'CANCELLED', tone: 'danger' },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <RefreshCw size={36} className="text-watta-action/50 animate-spin" strokeWidth={2.25} />
          <p className="text-sm font-semibold text-watta-action/65">{d.loading}</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="admin-watta-dashboard flex min-w-0 flex-col gap-8 sm:gap-10 md:gap-12">
      <motion.section
        {...fadeUp}
        transition={{ duration: reduceMotion ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="admin-watta-dash-hero"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="admin-watta-dash-hero__badge">
              <Sparkles size={12} className="text-[#ff5c00]" strokeWidth={2.5} aria-hidden />
              {d.studioBadge}
            </div>
            <h2 className="admin-watta-page-title admin-watta-page-title--brand">
              {d.studioHeadline}
            </h2>
            <p className="admin-watta-section-lead mt-1 max-w-xl">{d.studioSub}</p>
          </div>
          <div className="admin-watta-dash-hero__hint">
            {d.statsHint}
            {dashboardMetrics.fromDb ? (
              <span className="ml-1 font-semibold text-watta-action/45">· DB</span>
            ) : (
              <span className="ml-1 font-semibold text-[#e07a3a]">· {d.statsFallback}</span>
            )}
          </div>
        </div>
      </motion.section>

      <motion.div
        className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5"
        initial={reduceMotion ? false : 'hidden'}
        animate="show"
        variants={{
          hidden: {},
          show: {
            transition: { staggerChildren: stagger, delayChildren: reduceMotion ? 0 : 0.05 },
          },
        }}
      >
        {metricCards.map((card) => (
          <motion.div
            key={card.key}
            variants={{
              hidden: reduceMotion ? {} : { opacity: 0, y: 14, scale: 0.98 },
              show: reduceMotion ? {} : { opacity: 1, y: 0, scale: 1 },
            }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <button
              type="button"
              className={`admin-watta-dash-card group p-3 sm:p-4${card.accent ? ' admin-watta-dash-card--accent' : ''}`}
              aria-label={openAria(card.label)}
              title={`${card.label}: ${card.value}`}
              onClick={() => onNavigate(card.tab)}
            >
              <div className="relative flex items-start gap-2.5">
                <div
                  className={`admin-watta-dash-card__icon${card.accent ? ' admin-watta-dash-card__icon--accent' : ''}`}
                >
                  <card.icon size={18} strokeWidth={2.4} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="admin-watta-dash-card__label">{card.label}</p>
                  <p className="admin-watta-dash-card__value">{card.value}</p>
                </div>
                <ChevronRight
                  size={16}
                  className="mt-1 shrink-0 text-watta-action/25 transition group-hover:translate-x-0.5 group-hover:text-watta-action/55"
                  aria-hidden
                />
              </div>
            </button>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        {...fadeUp}
        transition={{ delay: reduceMotion ? 0 : 0.12, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="grid min-w-0 gap-4 lg:grid-cols-2 xl:grid-cols-3"
      >
        <button
          type="button"
          className="admin-watta-dash-panel group text-left"
          aria-label={openAria(d.chartRevenue14d)}
          onClick={() => onNavigate('orders')}
        >
          <h3 className="admin-watta-section-head flex items-center justify-between gap-2">
            <span className="min-w-0">{d.chartRevenue14d}</span>
            <ChevronRight size={14} className="shrink-0 text-watta-action/35" aria-hidden />
          </h3>
          {!hasChartData ? (
            <p className="py-12 text-center text-sm font-medium text-watta-action/45">{d.chartNoData}</p>
          ) : (
            <div className="w-full pt-2 pointer-events-none" style={{ height: chartHeight }}>
              <ResponsiveContainer
                width="100%"
                height={chartHeight}
                minWidth={0}
                initialDimension={chartInitialDimension}
              >
                <AreaChart data={series14} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="adminRevFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={BRAND.green} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={BRAND.greenMid} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 8" stroke="color-mix(in srgb, var(--watta-brand-action) 8%, transparent)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: BRAND.green, fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fill: BRAND.green, fontSize: 10, fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                    width={36}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v) => [`${(Number(v) || 0).toFixed(2)} €`, d.revenue]}
                    labelFormatter={(l) => l}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke={BRAND.green}
                    strokeWidth={2.5}
                    fill="url(#adminRevFill)"
                    animationDuration={reduceMotion ? 0 : 900}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </button>

        <button
          type="button"
          className="admin-watta-dash-panel group text-left"
          aria-label={openAria(d.chartOrders14d)}
          onClick={() => onNavigate('orders')}
        >
          <h3 className="admin-watta-section-head flex items-center justify-between gap-2">
            <span className="min-w-0">{d.chartOrders14d}</span>
            <ChevronRight size={14} className="shrink-0 text-watta-action/35" aria-hidden />
          </h3>
          {!hasChartData ? (
            <p className="py-12 text-center text-sm font-medium text-watta-action/45">{d.chartNoData}</p>
          ) : (
            <div className="w-full pt-2 pointer-events-none" style={{ height: chartHeight }}>
              <ResponsiveContainer
                width="100%"
                height={chartHeight}
                minWidth={0}
                initialDimension={chartInitialDimension}
              >
                <BarChart data={series14} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 8" stroke="color-mix(in srgb, var(--watta-brand-action) 8%, transparent)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: BRAND.green, fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: BRAND.green, fontSize: 10, fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                    width={28}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar
                    dataKey="orders"
                    fill={BRAND.accent}
                    radius={[8, 8, 4, 4]}
                    animationDuration={reduceMotion ? 0 : 800}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </button>

        <button
          type="button"
          className="admin-watta-dash-panel group text-left lg:col-span-2 xl:col-span-1"
          aria-label={openAria(d.chartStatusPie)}
          onClick={() => onNavigate('orders')}
        >
          <h3 className="admin-watta-section-head flex items-center justify-between gap-2">
            <span className="min-w-0">{d.chartStatusPie}</span>
            <ChevronRight size={14} className="shrink-0 text-watta-action/35" aria-hidden />
          </h3>
          {pieTotal === 0 ? (
            <p className="py-12 text-center text-sm font-medium text-watta-action/45">{d.chartNoData}</p>
          ) : (
            <div className="pointer-events-none flex min-h-[220px] flex-col items-center justify-center sm:flex-row sm:gap-4">
              <div className="w-full max-w-[200px]" style={{ height: pieChartHeight }}>
                <ResponsiveContainer
                  width="100%"
                  height={pieChartHeight}
                  minWidth={0}
                  initialDimension={{ width: 200, height: pieChartHeight }}
                >
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={72}
                      paddingAngle={2}
                      animationDuration={reduceMotion ? 0 : 750}
                    >
                      {pieData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} stroke="rgba(255,255,255,0.9)" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-2 grid w-full min-w-0 grid-cols-1 gap-1.5 text-xs font-semibold sm:mt-0 sm:flex-1 lg:grid-cols-2 xl:grid-cols-1">
                {pieData.map((s) => (
                  <li
                    key={s.name}
                    className="flex min-w-0 items-center gap-2 rounded-xl border border-watta-action/10 bg-white px-2.5 py-1.5"
                  >
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
                    <span className="min-w-0 flex-1 truncate leading-snug text-watta-action/85" title={s.name}>
                      {s.name}
                    </span>
                    <span className="ml-auto shrink-0 pl-2 tabular-nums text-[#0d3d34]">{s.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </button>
      </motion.div>

      <motion.section
        {...fadeUp}
        transition={{ delay: reduceMotion ? 0 : 0.18, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <h3 className="admin-watta-section-head mb-3">{d.statusTitle}</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-6">
          {statusRows.map((row, idx) => (
            <motion.div
              key={row.status}
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduceMotion ? 0 : 0.04 * idx, duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            >
              <button
                type="button"
                className={`admin-watta-dash-status group w-full text-left${
                  row.tone !== 'default' ? ` admin-watta-dash-status--${row.tone}` : ''
                }`}
                aria-label={openAria(row.label)}
                title={`${row.label}: ${row.count}`}
                onClick={() => onNavigate('orders', { orderStatus: row.status })}
              >
                <p className="admin-watta-dash-card__label">{row.label}</p>
                <p className="admin-watta-dash-card__value text-2xl sm:text-3xl">{row.count}</p>
                <ChevronRight
                  size={14}
                  className="absolute bottom-3 right-3 text-watta-action/20 transition group-hover:text-watta-action/50"
                  aria-hidden
                />
              </button>
            </motion.div>
          ))}
        </div>
      </motion.section>

      <motion.section
        {...fadeUp}
        transition={{ delay: reduceMotion ? 0 : 0.22, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <h3 className="admin-watta-section-head mb-3">{d.contentSection}</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-7">
          {[
            { icon: Tag, label: d.promos, value: counts.promos, tab: 'promos' as const },
            { icon: Layers, label: d.categories, value: counts.categories, tab: 'menuCategories' as const },
            { icon: User, label: d.users, value: counts.users, tab: 'users' as const },
            { icon: ImageIcon, label: d.banners, value: counts.banners, tab: 'banners' as const },
            { icon: BookOpen, label: d.blog, value: counts.blog, tab: 'blog' as const },
            { icon: ListOrdered, label: d.ingredients, value: counts.ingredients, tab: 'ingredients' as const },
            { icon: Users, label: d.team, value: counts.team, tab: 'team' as const },
          ].map(({ icon: Icon, label, value, tab }, idx) => (
            <motion.div
              key={tab}
              initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: reduceMotion ? 0 : 0.035 * idx, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <button
                type="button"
                className="admin-watta-dash-card group flex items-center gap-2.5 p-3"
                aria-label={openAria(label)}
                title={`${label}: ${value}`}
                onClick={() => onNavigate(tab)}
              >
                <div className="admin-watta-dash-card__icon">
                  <Icon size={16} strokeWidth={2.4} />
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <p className="admin-watta-dash-card__label">{label}</p>
                  <p className="admin-watta-dash-card__value text-lg">{value}</p>
                </div>
                <ChevronRight size={14} className="shrink-0 text-watta-action/20 group-hover:text-watta-action/50" aria-hidden />
              </button>
            </motion.div>
          ))}
        </div>
      </motion.section>
    </div>
  )
}
