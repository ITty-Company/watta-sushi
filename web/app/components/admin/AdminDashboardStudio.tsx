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
import {
  BookOpen,
  Globe,
  Image as ImageIcon,
  Layers,
  ListOrdered,
  MapPin,
  Package,
  Receipt,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  Tag,
  TrendingUp,
  User,
  Users,
} from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'

export type DashboardMetricsStudio = {
  revenue: number
  totalOrders: number
  paidOrders: number
  pending: number
  cooking: number
  delivering: number
  completed: number
  cancelled: number
  fromDb: boolean
}

export type AdminDashboardOrderLite = {
  createdAt: string
  totalPrice: number
  status: string
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

function dayKeyLocal(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function lastNDaysKeys(n: number): string[] {
  const out: string[] = []
  const now = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    out.push(`${y}-${m}-${day}`)
  }
  return out
}

const chartGreen = '#145142'
const chartMint = '#1a6b58'
const chartAccent = '#ff6b35'

type Props = {
  isLoading: boolean
  dashboardMetrics: DashboardMetricsStudio
  orders: AdminDashboardOrderLite[]
  counts: ContentCounts
}

export default function AdminDashboardStudio({
  isLoading,
  dashboardMetrics,
  orders,
  counts,
}: Props) {
  const { t } = useLanguage()
  const reduceMotion = useReducedMotion()
  const d = t.adminPanel.dashboard

  const fadeUp = reduceMotion
    ? { initial: false, animate: {} }
    : {
        initial: { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0 },
      }

  const stagger = reduceMotion ? 0 : 0.06

  const series14 = useMemo(() => {
    const keys = lastNDaysKeys(14)
    const revenueByDay = new Map<string, number>()
    const ordersByDay = new Map<string, number>()
    keys.forEach((k) => {
      revenueByDay.set(k, 0)
      ordersByDay.set(k, 0)
    })
    for (const o of orders) {
      const k = dayKeyLocal(o.createdAt)
      if (!k || !ordersByDay.has(k)) continue
      ordersByDay.set(k, (ordersByDay.get(k) || 0) + 1)
      if (o.status === 'COMPLETED' || o.status === 'DELIVERED') {
        revenueByDay.set(k, (revenueByDay.get(k) || 0) + (Number(o.totalPrice) || 0))
      }
    }
    return keys.map((date) => ({
      date: date.slice(5),
      revenue: Math.round((revenueByDay.get(date) || 0) * 100) / 100,
      orders: ordersByDay.get(date) || 0,
    }))
  }, [orders])

  const pieData = useMemo(
    () => [
      { name: d.statusPending, value: dashboardMetrics.pending, color: '#f59e0b' },
      { name: d.statusCooking, value: dashboardMetrics.cooking, color: '#fb923c' },
      { name: d.statusDelivering, value: dashboardMetrics.delivering, color: '#38bdf8' },
      { name: d.statusCompleted, value: dashboardMetrics.completed, color: '#10b981' },
      { name: d.statusCancelled, value: dashboardMetrics.cancelled, color: '#f87171' },
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
    border: '1px solid rgba(20,81,66,0.15)',
    boxShadow: '0 12px 40px -12px rgba(20,81,66,0.25)',
    fontSize: 12,
    fontWeight: 600,
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <RefreshCw size={36} className="text-[#145142]/50 animate-spin" strokeWidth={2.25} />
          <p className="text-sm font-semibold text-[#145142]/65">{d.loading}</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 sm:gap-10 md:gap-12">
      <motion.section
        {...fadeUp}
        transition={{ duration: reduceMotion ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-[1.35rem] border border-[#145142]/14 bg-gradient-to-br from-white/95 via-[#f6fbf8]/98 to-[#eef6f2]/95 p-5 shadow-[0_20px_50px_-24px_rgba(20,81,66,0.35)] sm:p-7 md:p-8"
      >
        <div
          className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#ff6b35]/12 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-24 -left-12 h-64 w-64 rounded-full bg-[#145142]/10 blur-3xl"
          aria-hidden
        />
        <div className="relative flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#145142]/15 bg-white/80 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#145142]/80 shadow-sm">
              <Sparkles size={12} className="text-[#ff6b35]" strokeWidth={2.5} />
              Studio
            </div>
            <h2 className="text-2xl font-black tracking-tight text-[#0d3d34] sm:text-3xl md:text-4xl">
              {d.studioHeadline}
            </h2>
            <p className="mt-1 max-w-xl text-sm font-medium text-[#145142]/65 sm:text-base">{d.studioSub}</p>
          </div>
          <div className="mt-3 rounded-2xl border border-[#145142]/12 bg-white/70 px-4 py-3 text-xs font-medium text-[#145142]/70 shadow-inner sm:mt-0 sm:max-w-sm sm:text-sm">
            {d.statsHint}
            {dashboardMetrics.fromDb ? (
              <span className="ml-1.5 font-mono text-[10px] font-bold uppercase tracking-wide text-[#145142]/45">
                · orders/stats
              </span>
            ) : (
              <span className="ml-1.5 text-[10px] font-bold uppercase tracking-wide text-amber-800/90">
                · {d.statsFallback}
              </span>
            )}
          </div>
        </div>
      </motion.section>

      <motion.div
        className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-7"
        initial={reduceMotion ? false : 'hidden'}
        animate="show"
        variants={{
          hidden: {},
          show: {
            transition: { staggerChildren: stagger, delayChildren: reduceMotion ? 0 : 0.05 },
          },
        }}
      >
        {[
          {
            key: 'rev',
            label: d.revenue,
            value: `${dashboardMetrics.revenue.toFixed(2)} €`,
            icon: TrendingUp,
            gradient: 'from-[#145142] to-[#1a6b58]',
          },
          {
            key: 'ord',
            label: d.orders,
            value: String(dashboardMetrics.totalOrders),
            icon: Package,
            gradient: 'from-[#176b57] to-[#145142]',
          },
          {
            key: 'paid',
            label: d.paidOrders,
            value: String(dashboardMetrics.paidOrders),
            icon: Receipt,
            gradient: 'from-[#0f3d32] to-[#1a6b58]',
          },
          {
            key: 'avg',
            label: d.avgOrderValue,
            value: `${avgTicket.toFixed(2)} €`,
            icon: Sparkles,
            gradient: 'from-[#ff6b35] to-[#ea580c]',
          },
          {
            key: 'prod',
            label: d.products,
            value: String(counts.products),
            icon: ShoppingBag,
            gradient: 'from-[#145142]/90 to-[#2d8f6f]',
          },
          {
            key: 'city',
            label: d.cities,
            value: String(counts.cities),
            icon: MapPin,
            gradient: 'from-[#1a6b58] to-[#145142]',
          },
          {
            key: 'ctr',
            label: d.countries,
            value: String(counts.countries),
            icon: Globe,
            gradient: 'from-[#134a3d] to-[#176b57]',
          },
        ].map((card) => (
          <motion.div
            key={card.key}
            variants={{
              hidden: reduceMotion ? {} : { opacity: 0, y: 14, scale: 0.98 },
              show: reduceMotion ? {} : { opacity: 1, y: 0, scale: 1 },
            }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden rounded-2xl border border-white/70 bg-white/90 p-3 shadow-lg shadow-[#145142]/[0.08] backdrop-blur-md sm:p-4"
          >
            <div
              className={`pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-gradient-to-br ${card.gradient} opacity-[0.12] blur-2xl`}
              aria-hidden
            />
            <div className="relative flex items-center gap-2.5">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${card.gradient} text-white shadow-md shadow-[#145142]/20`}
              >
                <card.icon size={18} strokeWidth={2.4} />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-extrabold uppercase tracking-wider text-[#145142]/55 sm:text-[10px]">
                  {card.label}
                </p>
                <p className="truncate text-base font-black tabular-nums text-[#0d3d34] sm:text-lg">{card.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        {...fadeUp}
        transition={{ delay: reduceMotion ? 0 : 0.12, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3"
      >
        <div className="rounded-[1.25rem] border border-[#145142]/12 bg-gradient-to-b from-white/95 to-[#f4faf7]/95 p-4 shadow-[0_16px_40px_-20px_rgba(20,81,66,0.2)] sm:p-5">
          <h3 className="mb-1 text-xs font-extrabold uppercase tracking-[0.2em] text-[#145142]/55">
            {d.chartRevenue14d}
          </h3>
          {!hasChartData ? (
            <p className="py-12 text-center text-sm font-medium text-[#145142]/45">{d.chartNoData}</p>
          ) : (
            <div className="h-[220px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series14} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="adminRevFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={chartGreen} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={chartMint} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 8" stroke="rgba(20,81,66,0.08)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: '#145142', fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fill: '#145142', fontSize: 10, fontWeight: 600 }}
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
                    stroke={chartGreen}
                    strokeWidth={2.5}
                    fill="url(#adminRevFill)"
                    animationDuration={reduceMotion ? 0 : 900}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="rounded-[1.25rem] border border-[#145142]/12 bg-gradient-to-b from-white/95 to-[#f4faf7]/95 p-4 shadow-[0_16px_40px_-20px_rgba(20,81,66,0.2)] sm:p-5">
          <h3 className="mb-1 text-xs font-extrabold uppercase tracking-[0.2em] text-[#145142]/55">
            {d.chartOrders14d}
          </h3>
          {!hasChartData ? (
            <p className="py-12 text-center text-sm font-medium text-[#145142]/45">{d.chartNoData}</p>
          ) : (
            <div className="h-[220px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={series14} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 8" stroke="rgba(20,81,66,0.08)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: '#145142', fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: '#145142', fontSize: 10, fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                    width={28}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar
                    dataKey="orders"
                    fill={chartAccent}
                    radius={[8, 8, 4, 4]}
                    animationDuration={reduceMotion ? 0 : 800}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="rounded-[1.25rem] border border-[#145142]/12 bg-gradient-to-b from-white/95 to-[#f4faf7]/95 p-4 shadow-[0_16px_40px_-20px_rgba(20,81,66,0.2)] sm:p-5 lg:col-span-2 xl:col-span-1">
          <h3 className="mb-1 text-xs font-extrabold uppercase tracking-[0.2em] text-[#145142]/55">
            {d.chartStatusPie}
          </h3>
          {pieTotal === 0 ? (
            <p className="py-12 text-center text-sm font-medium text-[#145142]/45">{d.chartNoData}</p>
          ) : (
            <div className="flex h-[240px] flex-col items-center justify-center sm:h-[220px] sm:flex-row sm:gap-4">
              <div className="h-[180px] w-full max-w-[200px]">
                <ResponsiveContainer width="100%" height="100%">
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
              <ul className="mt-2 grid w-full max-w-xs grid-cols-2 gap-2 text-[11px] font-bold sm:mt-0 sm:flex-1">
                {pieData.map((s) => (
                  <li key={s.name} className="flex items-center gap-2 rounded-xl bg-white/60 px-2 py-1.5 ring-1 ring-[#145142]/10">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
                    <span className="min-w-0 truncate text-[#145142]/85">{s.name}</span>
                    <span className="ml-auto tabular-nums text-[#0d3d34]">{s.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </motion.div>

      <motion.section
        {...fadeUp}
        transition={{ delay: reduceMotion ? 0 : 0.18, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <h3 className="mb-3 text-xs font-extrabold uppercase tracking-[0.22em] text-[#145142]/55">
          {d.statusTitle}
        </h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5">
          {[
            { label: d.statusPending, count: dashboardMetrics.pending, accent: 'from-amber-400 to-amber-500' },
            { label: d.statusCooking, count: dashboardMetrics.cooking, accent: 'from-orange-400 to-orange-500' },
            { label: d.statusDelivering, count: dashboardMetrics.delivering, accent: 'from-sky-400 to-sky-500' },
            { label: d.statusCompleted, count: dashboardMetrics.completed, accent: 'from-emerald-400 to-emerald-600' },
            { label: d.statusCancelled, count: dashboardMetrics.cancelled, accent: 'from-red-400 to-red-500' },
          ].map((row, idx) => (
            <motion.div
              key={row.label}
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduceMotion ? 0 : 0.04 * idx, duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
              className="relative overflow-hidden rounded-2xl border border-[#145142]/10 bg-white/90 p-4 shadow-md shadow-[#145142]/[0.07]"
            >
              <div
                className={`absolute left-0 top-0 h-full w-1 bg-gradient-to-b ${row.accent}`}
                aria-hidden
              />
              <p className="pl-2 text-[10px] font-extrabold uppercase tracking-wide text-[#145142]/50">{row.label}</p>
              <p className="pl-2 text-2xl font-black tabular-nums text-[#0d3d34] sm:text-3xl">{row.count}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      <motion.section
        {...fadeUp}
        transition={{ delay: reduceMotion ? 0 : 0.22, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <h3 className="mb-3 text-xs font-extrabold uppercase tracking-[0.22em] text-[#145142]/55">
          {d.contentSection}
        </h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-7">
          {[
            { icon: Tag, label: d.promos, value: counts.promos },
            { icon: Layers, label: d.categories, value: counts.categories },
            { icon: User, label: d.users, value: counts.users },
            { icon: ImageIcon, label: d.banners, value: counts.banners },
            { icon: BookOpen, label: d.blog, value: counts.blog },
            { icon: ListOrdered, label: d.ingredients, value: counts.ingredients },
            { icon: Users, label: d.team, value: counts.team },
          ].map(({ icon: Icon, label, value }, idx) => (
            <motion.div
              key={label}
              initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: reduceMotion ? 0 : 0.035 * idx, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              whileHover={reduceMotion ? undefined : { y: -3, transition: { duration: 0.22 } }}
              className="flex items-center gap-2.5 rounded-2xl border border-[#145142]/11 bg-gradient-to-br from-white to-[#f6fbf8] p-3 shadow-md shadow-[#145142]/[0.06]"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#145142]/10 text-[#145142]">
                <Icon size={16} strokeWidth={2.4} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[10px] font-extrabold uppercase tracking-wide text-[#145142]/50">{label}</p>
                <p className="text-lg font-black tabular-nums text-[#0d3d34]">{value}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>
    </div>
  )
}
