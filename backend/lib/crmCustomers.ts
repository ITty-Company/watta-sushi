import type { PrismaClient } from '@prisma/client';

export type CustomerAggregate = {
  phoneKey: string;
  displayPhone: string;
  customerName: string;
  email: string | null;
  userId: number | null;
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string | null;
  dataProcessingConsentAt: string | null;
  bonusBalance: number;
  registered: boolean;
};

function phoneDigits(raw: string): string {
  return String(raw || '').replace(/\D/g, '');
}

function matchesSearch(
  q: string,
  fields: (string | null | undefined)[],
): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  return fields.some((f) => String(f || '').toLowerCase().includes(needle));
}

export function buildCustomerDirectory(
  orders: {
    id: number;
    phone: string;
    customerName: string;
    totalPrice: number;
    createdAt: Date;
    dataProcessingConsentAt: Date | null;
    userId: number | null;
    user: { id: number; name: string | null; email: string; phone: string | null; bonusBalance: number } | null;
  }[],
  users: {
    id: number;
    name: string | null;
    email: string;
    phone: string | null;
    bonusBalance: number;
    createdAt: Date;
  }[],
): Map<string, CustomerAggregate> {
  const map = new Map<string, CustomerAggregate>();

  for (const order of orders) {
    const key = phoneDigits(order.phone);
    if (!key) continue;
    const existing = map.get(key);
    const consentIso = order.dataProcessingConsentAt?.toISOString() ?? null;
    const orderAt = order.createdAt.toISOString();
    if (!existing) {
      map.set(key, {
        phoneKey: key,
        displayPhone: order.phone.trim() || order.phone,
        customerName: order.customerName || order.user?.name || '—',
        email: order.user?.email ?? null,
        userId: order.userId ?? order.user?.id ?? null,
        orderCount: 1,
        totalSpent: order.totalPrice,
        lastOrderAt: orderAt,
        dataProcessingConsentAt: consentIso,
        bonusBalance: Number(order.user?.bonusBalance ?? 0),
        registered: Boolean(order.userId ?? order.user),
      });
      continue;
    }
    existing.orderCount += 1;
    existing.totalSpent += order.totalPrice;
    if (orderAt > (existing.lastOrderAt || '')) {
      existing.lastOrderAt = orderAt;
      existing.displayPhone = order.phone.trim() || order.phone;
      existing.customerName = order.customerName || existing.customerName;
      if (consentIso) existing.dataProcessingConsentAt = consentIso;
    }
    if (!existing.email && order.user?.email) existing.email = order.user.email;
    if (!existing.userId && (order.userId ?? order.user?.id)) {
      existing.userId = order.userId ?? order.user?.id ?? null;
      existing.registered = true;
      existing.bonusBalance = Number(order.user?.bonusBalance ?? existing.bonusBalance);
    }
  }

  for (const user of users) {
    const key = phoneDigits(user.phone || '');
    if (!key) continue;
    const existing = map.get(key);
    if (existing) {
      if (!existing.email) existing.email = user.email;
      if (!existing.userId) {
        existing.userId = user.id;
        existing.registered = true;
        existing.bonusBalance = Number(user.bonusBalance ?? 0);
      }
      if (!existing.customerName || existing.customerName === '—') {
        existing.customerName = user.name || existing.customerName;
      }
      continue;
    }
    map.set(key, {
      phoneKey: key,
      displayPhone: String(user.phone || '').trim(),
      customerName: user.name || '—',
      email: user.email,
      userId: user.id,
      orderCount: 0,
      totalSpent: 0,
      lastOrderAt: null,
      dataProcessingConsentAt: null,
      bonusBalance: Number(user.bonusBalance ?? 0),
      registered: true,
    });
  }

  return map;
}

export async function fetchCrmCustomers(
  prisma: PrismaClient,
  q = '',
): Promise<CustomerAggregate[]> {
  const [orders, users] = await Promise.all([
    prisma.order.findMany({
      where: { phone: { not: '' } },
      select: {
        id: true,
        phone: true,
        customerName: true,
        totalPrice: true,
        createdAt: true,
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
    }),
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        bonusBalance: true,
        createdAt: true,
      },
    }),
  ]);

  const directory = buildCustomerDirectory(orders, users);
  let customers = [...directory.values()].sort((a, b) => {
    const aT = a.lastOrderAt || '';
    const bT = b.lastOrderAt || '';
    return bT.localeCompare(aT);
  });

  if (q.trim()) {
    customers = customers.filter((c) =>
      matchesSearch(q, [c.customerName, c.displayPhone, c.phoneKey, c.email]),
    );
  }

  return customers;
}
