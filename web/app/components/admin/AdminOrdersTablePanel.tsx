'use client'

import { Fragment, useMemo, useState } from 'react'
import {
  Check,
  CheckCircle,
  ChefHat,
  ChevronDown,
  MapPin,
  Phone,
  Truck,
  User,
  XCircle,
} from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import { formatSlotLabel, getOrderServiceDateKey } from '@/lib/orderServiceDate'

export type AdminOrdersTableRow = {
  id: number
  createdAt: string
  status: string
  totalPrice: number
  customerName: string
  phone: string
  address: string
  comment?: string
  items: { product: { name_ru: string }; quantity: number }[]
  fulfillmentType?: string
  deliveryFee?: number
  readyAt?: string | null
  scheduledForDate?: string | null
  scheduledForSlot?: string | null
  paymentMethod: 'CASH' | 'CARD' | 'APPLE_PAY' | 'GOOGLE_PAY' | 'IDEAL'
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED'
}

type Props = {
  orders: AdminOrdersTableRow[]
  isLoading: boolean
  emptyLabel: string
  emptyHint?: string
  onStatusChange: (order: AdminOrdersTableRow, status: string) => void
}

function adminOrderStatusChipClass(status: string): string {
  const base = 'admin-watta-chip'
  switch (status) {
    case 'PENDING':
      return `${base} admin-watta-chip--pending`
    case 'CONFIRMED':
      return `${base} admin-watta-chip--confirmed`
    case 'COOKING':
      return `${base} admin-watta-chip--cooking`
    case 'DELIVERING':
      return `${base} admin-watta-chip--delivering`
    case 'COMPLETED':
    case 'DELIVERED':
      return `${base} admin-watta-chip--completed`
    case 'CANCELLED':
      return `${base} admin-watta-chip--cancelled`
    default:
      return base
  }
}

function formatReadyAtDisplay(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('uk-UA', {
    timeZone: 'Europe/Amsterdam',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function AdminOrdersTablePanel({
  orders,
  isLoading,
  emptyLabel,
  emptyHint,
  onStatusChange,
}: Props) {
  const { t, adminUiLanguage } = useLanguage()
  const ao = t.adminPanel.orders
  const cr = t.adminPanel.crmReports
  const locale = adminUiLanguage === 'ru' ? 'ru-RU' : 'uk-UA'
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const sorted = useMemo(
    () =>
      [...orders].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [orders],
  )

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString(locale, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return iso
    }
  }

  const itemsSummary = (order: AdminOrdersTableRow) =>
    order.items
      .map((item) => `${item.product.name_ru} ×${item.quantity}`)
      .join(', ')

  const toggleRow = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  return (
    <section className="admin-watta-glass-panel admin-watta-scroll-x admin-watta-scroll-hint admin-orders-table-panel w-full">
      <table className="admin-watta-crm-table admin-orders-table min-w-full text-sm">
        <thead>
          <tr className="border-b border-watta-action/15 text-left text-watta-action/80">
            <th className="py-3 pr-3">№</th>
            <th className="py-3 pr-4">{cr.colDate}</th>
            <th className="py-3 pr-4">{cr.colCustomer}</th>
            <th className="py-3 pr-4">{cr.colPhone}</th>
            <th className="hidden py-3 pr-4 md:table-cell">{ao.colFulfillment}</th>
            <th className="py-3 pr-4">{cr.colStatus}</th>
            <th className="py-3 pr-4">{cr.colTotal}</th>
            <th className="hidden py-3 pr-3 lg:table-cell">{cr.colItems}</th>
            <th className="w-8 py-3" aria-hidden />
          </tr>
        </thead>
        <tbody>
          {sorted.map((order) => {
            const expanded = expandedId === order.id
            return (
              <Fragment key={order.id}>
                <tr
                  className={`admin-orders-table__row cursor-pointer border-b border-watta-action/10 text-[#0f241e]/85 transition hover:bg-watta-action/[0.04]${expanded ? ' admin-orders-table__row--open' : ''}`}
                  onClick={() => toggleRow(order.id)}
                >
                  <td className="py-3 pr-3 font-semibold tabular-nums">{order.id}</td>
                  <td className="py-3 pr-4 whitespace-nowrap text-xs">{formatDate(order.createdAt)}</td>
                  <td className="max-w-[8rem] truncate py-3 pr-4 font-medium sm:max-w-[10rem]">
                    {order.customerName}
                  </td>
                  <td className="py-3 pr-4 whitespace-nowrap text-xs">{order.phone}</td>
                  <td className="hidden py-3 pr-4 md:table-cell">
                    <span
                      className={`admin-watta-chip ${
                        order.fulfillmentType === 'PICKUP'
                          ? 'admin-watta-chip--pickup'
                          : 'admin-watta-chip--delivery'
                      }`}
                    >
                      {order.fulfillmentType === 'PICKUP'
                        ? ao.fulfillmentPickup
                        : ao.fulfillmentDelivery}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className={adminOrderStatusChipClass(order.status)}>{order.status}</span>
                  </td>
                  <td className="py-3 pr-4 font-semibold tabular-nums text-watta-action">
                    {order.totalPrice} €
                  </td>
                  <td className="hidden max-w-[12rem] truncate py-3 pr-3 text-xs lg:table-cell">
                    {itemsSummary(order)}
                  </td>
                  <td className="py-3 text-watta-action/45">
                    <ChevronDown
                      className={`h-4 w-4 transition-transform${expanded ? ' rotate-180' : ''}`}
                      aria-hidden
                    />
                  </td>
                </tr>
                {expanded ? (
                  <tr className="admin-orders-table__detail-row">
                    <td colSpan={9} className="p-0">
                      <div className="admin-orders-table__detail">
                        <div className="admin-orders-table__detail-grid">
                          <div className="admin-orders-table__detail-block">
                            <p className="admin-orders-table__detail-label">{cr.colCustomer}</p>
                            <p className="admin-orders-table__detail-line">
                              <User size={15} aria-hidden /> {order.customerName}
                            </p>
                            <p className="admin-orders-table__detail-line">
                              <Phone size={15} aria-hidden /> {order.phone}
                            </p>
                            <p className="admin-orders-table__detail-line">
                              <MapPin size={15} aria-hidden /> {order.address}
                            </p>
                          </div>

                          <div className="admin-orders-table__detail-block">
                            <p className="admin-orders-table__detail-label">{ao.payment}</p>
                            <p className="admin-orders-table__detail-line">
                              {order.paymentMethod === 'CASH' ? ao.cash : ao.online}
                            </p>
                            <span
                              className={`admin-watta-chip ${
                                order.paymentStatus === 'PAID'
                                  ? 'admin-watta-chip--paid'
                                  : order.paymentStatus === 'FAILED'
                                    ? 'admin-watta-chip--failed'
                                    : 'admin-watta-chip--waiting'
                              }`}
                            >
                              {order.paymentStatus === 'PAID' ? (
                                <Check size={12} className="mr-0.5" aria-hidden />
                              ) : null}
                              {order.paymentStatus === 'PAID'
                                ? ao.paid
                                : order.paymentStatus === 'FAILED'
                                  ? ao.error
                                  : ao.waiting}
                            </span>
                          </div>

                          <div className="admin-orders-table__detail-block">
                            <p className="admin-orders-table__detail-label">{ao.scheduledForLabel}</p>
                            <p className="admin-orders-table__detail-line">
                              {getOrderServiceDateKey(order)}
                              {order.scheduledForSlot
                                ? ` · ${formatSlotLabel(order.scheduledForSlot, t.cartSection.slotAsap)}`
                                : ''}
                            </p>
                            {order.readyAt ? (
                              <p className="admin-orders-table__detail-line text-watta-action">
                                {order.fulfillmentType === 'PICKUP'
                                  ? ao.readyAtPickup
                                  : ao.readyAtDelivery}{' '}
                                {formatReadyAtDisplay(order.readyAt)}
                              </p>
                            ) : null}
                            {order.fulfillmentType !== 'PICKUP' &&
                            typeof order.deliveryFee === 'number' ? (
                              <p className="admin-orders-table__detail-line">
                                {ao.deliveryFeeAdmin}{' '}
                                {order.deliveryFee > 0 ? `${order.deliveryFee} €` : '0 €'}
                              </p>
                            ) : null}
                          </div>
                        </div>

                        {order.comment ? (
                          <p className="admin-orders-table__comment">📝 {order.comment}</p>
                        ) : (
                          <p className="admin-orders-table__comment admin-orders-table__comment--empty">
                            {ao.noComment}
                          </p>
                        )}

                        <ul className="admin-orders-table__items">
                          {order.items.map((item, idx) => (
                            <li key={idx}>
                              <span>{item.product.name_ru}</span>
                              <strong>×{item.quantity}</strong>
                            </li>
                          ))}
                        </ul>

                        <div
                          className="admin-orders-table__actions"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => onStatusChange(order, 'CONFIRMED')}
                            className="admin-watta-status-btn admin-watta-status-btn--confirmed"
                          >
                            <CheckCircle size={16} className="shrink-0" />
                            <span>{ao.btnConfirmed}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onStatusChange(order, 'COOKING')}
                            className="admin-watta-status-btn admin-watta-status-btn--cooking"
                          >
                            <ChefHat size={16} className="shrink-0" />
                            <span>{ao.btnCooking}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onStatusChange(order, 'DELIVERING')}
                            className="admin-watta-status-btn admin-watta-status-btn--delivering"
                          >
                            <Truck size={16} className="shrink-0" />
                            <span>{ao.btnDelivering}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onStatusChange(order, 'COMPLETED')}
                            className="admin-watta-status-btn admin-watta-status-btn--completed"
                          >
                            <Check size={16} className="shrink-0" />
                            <span>{ao.btnCompleted}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onStatusChange(order, 'CANCELLED')}
                            className="admin-watta-status-btn admin-watta-status-btn--cancelled"
                          >
                            <XCircle size={16} className="shrink-0" />
                            <span>{ao.btnCancel}</span>
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            )
          })}
          {!isLoading && sorted.length === 0 ? (
            <tr>
              <td colSpan={9} className="py-10 text-center text-watta-action/45">
                <p className="font-semibold text-watta-action/70">{emptyLabel}</p>
                {emptyHint ? (
                  <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-relaxed text-watta-action/55">
                    {emptyHint}
                  </p>
                ) : null}
              </td>
            </tr>
          ) : null}
          {isLoading ? (
            <tr>
              <td colSpan={9} className="py-10 text-center text-watta-action/60">
                {t.adminPanel.dashboard.loading}
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
      <p className="mt-3 text-xs text-watta-action/60">{ao.tableRowHint}</p>
    </section>
  )
}
