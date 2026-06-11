import type { PrismaClient } from '@prisma/client';
import { COMPLETED_ORDER_STATUSES } from './orderAdminStats.js';
import {
  buildCustomerDirectory,
  type CustomerAggregate,
} from './crmCustomers.js';
import {
  isDateInReportRange,
  type ReportDateRange,
} from './crmReportPeriod.js';

const ACTIVE_ORDER_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'COOKING',
  'DELIVERING',
  ...COMPLETED_ORDER_STATUSES,
] as const;

export type ProductSalesRow = {
  productId: number;
  productName: string;
  categoryName: string;
  quantity: number;
  revenue: number;
  orderCount: number;
};

export type OrderReportRow = {
  id: number;
  createdAt: string;
  customerName: string;
  phone: string;
  status: string;
  totalPrice: number;
  paymentMethod: string;
  paymentStatus: string;
  address: string;
  itemsSummary: string;
};

export type ReportSummary = {
  orderCount: number;
  revenue: number;
  itemCount: number;
};

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

function orderMatchesRange<T extends { createdAt: Date; status: string }>(
  order: T,
  range: ReportDateRange,
  includeCancelled = false,
): boolean {
  if (!includeCancelled && order.status === 'CANCELLED') return false;
  return isDateInReportRange(order.createdAt, range);
}

export async function fetchProductSalesReport(
  prisma: PrismaClient,
  range: ReportDateRange,
): Promise<{ rows: ProductSalesRow[]; summary: ReportSummary }> {
  const orders = await prisma.order.findMany({
    where: {
      status: { in: [...ACTIVE_ORDER_STATUSES] },
    },
    select: {
      id: true,
      createdAt: true,
      status: true,
      items: {
        select: {
          productId: true,
          quantity: true,
          price: true,
          productNameSnapshot: true,
          product: {
            select: {
              name_ru: true,
              category: { select: { name_ru: true } },
            },
          },
        },
      },
    },
  });

  const agg = new Map<
    number,
    ProductSalesRow & { orderIds: Set<number> }
  >();

  for (const order of orders) {
    if (!orderMatchesRange(order, range)) continue;
    for (const line of order.items) {
      const name =
        line.productNameSnapshot?.trim() ||
        line.product?.name_ru ||
        `ID ${line.productId}`;
      const category = line.product?.category?.name_ru || '—';
      const existing = agg.get(line.productId);
      const lineRevenue = line.price * line.quantity;
      if (!existing) {
        agg.set(line.productId, {
          productId: line.productId,
          productName: name,
          categoryName: category,
          quantity: line.quantity,
          revenue: lineRevenue,
          orderCount: 1,
          orderIds: new Set([order.id]),
        });
        continue;
      }
      existing.quantity += line.quantity;
      existing.revenue += lineRevenue;
      existing.orderIds.add(order.id);
      existing.orderCount = existing.orderIds.size;
    }
  }

  const rows = [...agg.values()]
    .map(({ orderIds: _orderIds, ...row }) => ({
      ...row,
      revenue: roundMoney(row.revenue),
    }))
    .sort((a, b) => b.revenue - a.revenue || b.quantity - a.quantity);

  const summary: ReportSummary = {
    orderCount: new Set(
      orders.filter((o) => orderMatchesRange(o, range)).map((o) => o.id),
    ).size,
    revenue: roundMoney(rows.reduce((s, r) => s + r.revenue, 0)),
    itemCount: rows.reduce((s, r) => s + r.quantity, 0),
  };

  return { rows, summary };
}

export async function fetchOrdersReport(
  prisma: PrismaClient,
  range: ReportDateRange,
): Promise<{ rows: OrderReportRow[]; summary: ReportSummary }> {
  const orders = await prisma.order.findMany({
    where: {
      status: { not: 'CANCELLED' },
    },
    select: {
      id: true,
      createdAt: true,
      customerName: true,
      phone: true,
      status: true,
      totalPrice: true,
      paymentMethod: true,
      paymentStatus: true,
      address: true,
      items: {
        select: {
          quantity: true,
          productNameSnapshot: true,
          product: { select: { name_ru: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const filtered = orders.filter((o) => orderMatchesRange(o, range, true));

  const rows: OrderReportRow[] = filtered.map((o) => ({
    id: o.id,
    createdAt: o.createdAt.toISOString(),
    customerName: o.customerName,
    phone: o.phone,
    status: o.status,
    totalPrice: roundMoney(o.totalPrice),
    paymentMethod: o.paymentMethod,
    paymentStatus: o.paymentStatus,
    address: o.address || '',
    itemsSummary: o.items
      .map((line) => {
        const name =
          line.productNameSnapshot?.trim() ||
          line.product?.name_ru ||
          '—';
        return `${name} × ${line.quantity}`;
      })
      .join(', '),
  }));

  const completed = filtered.filter((o) =>
    (COMPLETED_ORDER_STATUSES as readonly string[]).includes(o.status),
  );

  const summary: ReportSummary = {
    orderCount: filtered.length,
    revenue: roundMoney(completed.reduce((s, o) => s + o.totalPrice, 0)),
    itemCount: filtered.reduce(
      (s, o) => s + o.items.reduce((ls, line) => ls + line.quantity, 0),
      0,
    ),
  };

  return { rows, summary };
}

export async function fetchCustomersReport(
  prisma: PrismaClient,
  range: ReportDateRange,
  q = '',
): Promise<{ rows: CustomerAggregate[]; summary: ReportSummary }> {
  const orders = await prisma.order.findMany({
    where: { phone: { not: '' } },
    select: {
      id: true,
      phone: true,
      customerName: true,
      totalPrice: true,
      createdAt: true,
      status: true,
      dataProcessingConsentAt: true,
      userId: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          bonusBalance: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const periodOrders = orders.filter(
    (o) => o.status !== 'CANCELLED' && isDateInReportRange(o.createdAt, range),
  );

  const directory = buildCustomerDirectory(periodOrders, []);

  let rows = [...directory.values()].sort((a, b) => {
    const aT = a.lastOrderAt || '';
    const bT = b.lastOrderAt || '';
    return bT.localeCompare(aT);
  });

  const needle = q.trim().toLowerCase();
  if (needle) {
    rows = rows.filter((c) =>
      [c.customerName, c.displayPhone, c.phoneKey, c.email].some((f) =>
        String(f || '')
          .toLowerCase()
          .includes(needle),
      ),
    );
  }

  const summary: ReportSummary = {
    orderCount: periodOrders.length,
    revenue: roundMoney(periodOrders.reduce((s, o) => s + o.totalPrice, 0)),
    itemCount: rows.length,
  };

  return { rows, summary };
}
