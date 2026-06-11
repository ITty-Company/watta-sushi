import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendMassPromo } from '../services/email.service';
import { checkAdmin } from '../authMiddleware';
import { parseCashbackPercentInput } from '../lib/bonusCashback.js';
import { fetchCrmCustomers } from '../lib/crmCustomers.js';
import {
  PRIMARY_ADMIN_EMAIL,
  PRIMARY_ADMIN_PHONE,
  formatAdminPhoneOut,
  isPrimaryAdminEmail,
  isPrimaryAdminPhone,
  normalizeAdminEmail,
  parseAdminEmailInput,
  parseAdminPhoneInput,
  syncUsersForAdminEmail,
  syncUsersForAdminPhone,
} from '../lib/adminPhones.js';
import { resolveReportDateRange } from '../lib/crmReportPeriod.js';
import {
  fetchCustomersReport,
  fetchOrdersReport,
  fetchProductSalesReport,
} from '../lib/crmReports.js';
import {
  getCrmSheetTitle,
  getGoogleSpreadsheetUrl,
  isGoogleSheetsConfigured,
  syncCrmCustomersToSheet,
  syncCrmReportToSheet,
  type CrmReportSheetType,
} from '../services/sheets.service.js';

const router = Router();
const prisma = new PrismaClient();

function phoneDigits(raw: string): string {
  return String(raw || '').replace(/\D/g, '');
}

router.get('/users', checkAdmin, async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        bonusBalance: true,
        bonusCashbackPercentOverride: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (error) {
    console.error('CRM users error:', error);
    res.status(500).json({ message: 'Ошибка получения пользователей CRM' });
  }
});

router.patch('/users/:id/bonus', checkAdmin, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(String(req.params.id), 10);
    if (!Number.isFinite(userId)) {
      res.status(400).json({ message: 'Некорректный id пользователя' });
      return;
    }

    const body = req.body || {};
    const update: {
      bonusCashbackPercentOverride?: number | null;
      bonusBalance?: { increment: number };
    } = {};

    if ('bonusCashbackPercentOverride' in body) {
      const parsed = parseCashbackPercentInput(body.bonusCashbackPercentOverride);
      if (parsed === undefined) {
        res.status(400).json({ message: 'Некорректный персональный % кешбэка' });
        return;
      }
      update.bonusCashbackPercentOverride = parsed;
    }

    if (body.bonusBalanceDelta != null && body.bonusBalanceDelta !== '') {
      const delta = Number(body.bonusBalanceDelta);
      if (!Number.isFinite(delta) || delta === 0) {
        res.status(400).json({ message: 'Некорректная сумма корректировки баланса' });
        return;
      }
      if (Math.abs(delta) > 10_000) {
        res.status(400).json({ message: 'Слишком большая корректировка (макс. ±10000 €)' });
        return;
      }
      update.bonusBalance = { increment: Math.round(delta * 100) / 100 };
    }

    if (Object.keys(update).length === 0) {
      res.status(400).json({ message: 'Нет полей для обновления' });
      return;
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: update,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        bonusBalance: true,
        bonusCashbackPercentOverride: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { orders: true } },
      },
    });

    res.json(user);
  } catch (error) {
    const code = (error as { code?: string })?.code;
    if (code === 'P2025') {
      res.status(404).json({ message: 'Пользователь не найден' });
      return;
    }
    console.error('CRM user bonus patch error:', error);
    res.status(500).json({ message: 'Ошибка обновления бонусов пользователя' });
  }
});

router.get('/customers/sheets-status', checkAdmin, async (_req: Request, res: Response) => {
  res.json({
    configured: isGoogleSheetsConfigured(),
    spreadsheetUrl: getGoogleSpreadsheetUrl(),
    crmSheetTitle: getCrmSheetTitle(),
  });
});

router.post('/customers/sync-sheets', checkAdmin, async (_req: Request, res: Response) => {
  try {
    if (!isGoogleSheetsConfigured()) {
      res.status(503).json({
        message:
          'Google Таблицы не настроены. Задайте GOOGLE_CREDS и GOOGLE_SHEET_ID на сервере и дайте сервисному аккаунту доступ к таблице.',
      });
      return;
    }

    const customers = await fetchCrmCustomers(prisma);
    const result = await syncCrmCustomersToSheet(customers);
    if (!result) {
      res.status(500).json({ message: 'Не удалось синхронизировать с Google Таблицей' });
      return;
    }

    res.json({
      success: true,
      count: result.count,
      sheetTitle: result.sheetTitle,
      spreadsheetUrl: getGoogleSpreadsheetUrl(),
    });
  } catch (error) {
    console.error('CRM customers sync-sheets error:', error);
    res.status(500).json({ message: 'Ошибка синхронизации с Google Таблицей' });
  }
});

function reportQueryParams(req: Request) {
  const period = String(req.query.period || 'all');
  const from = String(req.query.from || '');
  const to = String(req.query.to || '');
  const range = resolveReportDateRange(period, from, to);
  return { period, from, to, range };
}

function parseReportType(raw: string): CrmReportSheetType | null {
  if (raw === 'products' || raw === 'orders' || raw === 'customers') return raw;
  return null;
}

router.get('/reports/products', checkAdmin, async (req: Request, res: Response) => {
  try {
    const { range } = reportQueryParams(req);
    const report = await fetchProductSalesReport(prisma, range);
    res.json({ ...report, period: range });
  } catch (error) {
    console.error('CRM products report error:', error);
    res.status(500).json({ message: 'Ошибка отчёта по товарам' });
  }
});

router.get('/reports/orders', checkAdmin, async (req: Request, res: Response) => {
  try {
    const { range } = reportQueryParams(req);
    const report = await fetchOrdersReport(prisma, range);
    res.json({ ...report, period: range });
  } catch (error) {
    console.error('CRM orders report error:', error);
    res.status(500).json({ message: 'Ошибка отчёта по заказам' });
  }
});

router.get('/reports/customers', checkAdmin, async (req: Request, res: Response) => {
  try {
    const { range } = reportQueryParams(req);
    const q = String(req.query.q || '');
    const report = await fetchCustomersReport(prisma, range, q);
    res.json({ ...report, period: range });
  } catch (error) {
    console.error('CRM customers report error:', error);
    res.status(500).json({ message: 'Ошибка отчёта по клиентам' });
  }
});

router.post('/reports/sync-sheets', checkAdmin, async (req: Request, res: Response) => {
  try {
    if (!isGoogleSheetsConfigured()) {
      res.status(503).json({
        message:
          'Google Таблицы не настроены. Задайте GOOGLE_CREDS и GOOGLE_SHEET_ID на сервере и дайте сервисному аккаунту доступ к таблице.',
      });
      return;
    }

    const body = req.body || {};
    const type = parseReportType(String(body.type || ''));
    if (!type) {
      res.status(400).json({ message: 'Укажите type: products | orders | customers' });
      return;
    }

    const range = resolveReportDateRange(
      String(body.period || 'all'),
      body.from ? String(body.from) : undefined,
      body.to ? String(body.to) : undefined,
    );

    let result: { count: number; sheetTitle: string } | null = null;

    if (type === 'products') {
      const report = await fetchProductSalesReport(prisma, range);
      result = await syncCrmReportToSheet(type, range, {
        products: report.rows,
        summary: report.summary,
      });
    } else if (type === 'orders') {
      const report = await fetchOrdersReport(prisma, range);
      result = await syncCrmReportToSheet(type, range, {
        orders: report.rows,
        summary: report.summary,
      });
    } else {
      const q = body.q ? String(body.q) : '';
      const report = await fetchCustomersReport(prisma, range, q);
      result = await syncCrmReportToSheet(type, range, {
        customers: report.rows,
        summary: report.summary,
      });
    }

    if (!result) {
      res.status(500).json({ message: 'Не удалось синхронизировать с Google Таблицей' });
      return;
    }

    res.json({
      success: true,
      count: result.count,
      sheetTitle: result.sheetTitle,
      spreadsheetUrl: getGoogleSpreadsheetUrl(),
      period: range,
    });
  } catch (error) {
    console.error('CRM reports sync-sheets error:', error);
    res.status(500).json({ message: 'Ошибка синхронизации отчёта с Google Таблицей' });
  }
});

router.get('/customers', checkAdmin, async (req: Request, res: Response) => {
  try {
    const q = String(req.query.q || '');
    const customers = await fetchCrmCustomers(prisma, q);
    res.json(customers);
  } catch (error) {
    console.error('CRM customers error:', error);
    res.status(500).json({ message: 'Ошибка получения базы клиентов' });
  }
});

router.get('/customers/detail', checkAdmin, async (req: Request, res: Response) => {
  try {
    const phoneKey = phoneDigits(String(req.query.phone || ''));
    if (!phoneKey) {
      return res.status(400).json({ message: 'Укажите phone' });
    }

    const orders = await prisma.order.findMany({
      where: {
        phone: { not: '' },
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name_ru: true,
                name_ua: true,
                name_en: true,
                name_nl: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            bonusBalance: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const matchedOrders = orders.filter((o) => phoneDigits(o.phone) === phoneKey);
    const linkedUser = matchedOrders.find((o) => o.user)?.user ?? null;
    const user =
      linkedUser ??
      (await prisma.user
        .findMany({
          where: { phone: { not: '' } },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            bonusBalance: true,
            createdAt: true,
          },
        })
        .then((list) => list.find((u) => phoneDigits(u.phone || '') === phoneKey) ?? null));

    const latest = matchedOrders[0];
    const totalSpent = matchedOrders.reduce((s, o) => s + o.totalPrice, 0);

    res.json({
      phoneKey,
      displayPhone: latest?.phone || user?.phone || phoneKey,
      customerName: latest?.customerName || user?.name || '—',
      email: user?.email ?? null,
      userId: user?.id ?? latest?.userId ?? null,
      bonusBalance: Number(user?.bonusBalance ?? 0),
      registered: Boolean(user),
      orderCount: matchedOrders.length,
      totalSpent,
      dataProcessingConsentAt:
        matchedOrders.find((o) => o.dataProcessingConsentAt)?.dataProcessingConsentAt?.toISOString() ??
        null,
      orders: matchedOrders.map((o) => ({
        id: o.id,
        createdAt: o.createdAt,
        status: o.status,
        totalPrice: o.totalPrice,
        usedBonuses: o.usedBonuses,
        customerName: o.customerName,
        phone: o.phone,
        address: o.address,
        fulfillmentType: o.fulfillmentType,
        deliveryFee: o.deliveryFee,
        paymentMethod: o.paymentMethod,
        paymentStatus: o.paymentStatus,
        comment: o.comment,
        noCallbackConfirm: o.noCallbackConfirm,
        noDoorbellRing: o.noDoorbellRing,
        dataProcessingConsentAt: o.dataProcessingConsentAt,
        items: o.items.map((line) => ({
          id: line.id,
          quantity: line.quantity,
          price: line.price,
          productId: line.productId,
          productName: line.product?.name_ru || `ID ${line.productId}`,
        })),
      })),
    });
  } catch (error) {
    console.error('CRM customer detail error:', error);
    res.status(500).json({ message: 'Ошибка получения карточки клиента' });
  }
});

router.post('/send-promo', checkAdmin, async (req: Request, res: Response) => {
  try {
    const { channel, subject, message } = req.body as {
      channel?: 'email' | 'sms';
      subject?: string;
      message?: string;
    };

    if (!channel || !message) {
      return res.status(400).json({ message: 'channel и message обязательны' });
    }

    const users = await prisma.user.findMany({
      select: { email: true, phone: true, name: true },
    });

    if (channel === 'email') {
      const emails = users.map((u) => String(u.email || '').trim()).filter(Boolean);
      await sendMassPromo(emails, subject || 'Watta Sushi promo', message);
      return res.json({ success: true, channel: 'email', count: emails.length });
    }

    const phones = users.map((u) => String(u.phone || '').trim()).filter(Boolean);
    console.log('SMS promo placeholder:', { subject, message, phonesCount: phones.length });
    return res.json({ success: true, channel: 'sms', count: phones.length });
  } catch (error) {
    console.error('CRM send-promo error:', error);
    res.status(500).json({ message: 'Ошибка отправки рассылки' });
  }
});

router.get('/admin-phones', checkAdmin, async (_req: Request, res: Response) => {
  try {
    const rows = await prisma.adminPhone.findMany({
      orderBy: [{ phone: 'asc' }],
    });
    res.json(
      rows.map((row) => ({
        id: row.id,
        phone: formatAdminPhoneOut(row.phone),
        phoneDigits: row.phone,
        label: row.label,
        isPrimary: isPrimaryAdminPhone(row.phone),
        createdAt: row.createdAt.toISOString(),
      })),
    );
  } catch (error) {
    console.error('CRM admin-phones GET error:', error);
    res.status(500).json({ message: 'Не вдалося завантажити номери адмінів' });
  }
});

router.post('/admin-phones', checkAdmin, async (req: Request, res: Response) => {
  try {
    const rawPhone = String(req.body?.phone ?? '').trim();
    const label = String(req.body?.label ?? '').trim() || null;
    const cleanPhone = parseAdminPhoneInput(rawPhone);
    if (!cleanPhone) {
      res.status(400).json({ message: 'Некорректный номер телефона (7–15 цифр)' });
      return;
    }

    const existing = await prisma.adminPhone.findUnique({ where: { phone: cleanPhone } });
    if (existing) {
      res.status(400).json({ message: 'Этот номер уже добавлен в список админов' });
      return;
    }

    const created = await prisma.adminPhone.create({
      data: { phone: cleanPhone, label },
    });
    await syncUsersForAdminPhone(prisma, cleanPhone, true);

    res.status(201).json({
      id: created.id,
      phone: formatAdminPhoneOut(created.phone),
      phoneDigits: created.phone,
      label: created.label,
      isPrimary: isPrimaryAdminPhone(created.phone),
      createdAt: created.createdAt.toISOString(),
    });
  } catch (error) {
    console.error('CRM admin-phones POST error:', error);
    res.status(500).json({ message: 'Не вдалося додати номер адміна' });
  }
});

router.delete('/admin-phones/:id', checkAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (!Number.isFinite(id)) {
      res.status(400).json({ message: 'Некорректный id' });
      return;
    }

    const row = await prisma.adminPhone.findUnique({ where: { id } });
    if (!row) {
      res.status(404).json({ message: 'Номер не найден' });
      return;
    }

    if (isPrimaryAdminPhone(row.phone) || row.phone === PRIMARY_ADMIN_PHONE) {
      res.status(400).json({ message: 'Головний номер адміністратора не можна видалити' });
      return;
    }

    await prisma.adminPhone.delete({ where: { id } });
    await syncUsersForAdminPhone(prisma, row.phone, false);

    res.json({ ok: true });
  } catch (error) {
    console.error('CRM admin-phones DELETE error:', error);
    res.status(500).json({ message: 'Не вдалося видалити номер адміна' });
  }
});

router.get('/admin-emails', checkAdmin, async (_req: Request, res: Response) => {
  try {
    const rows = await prisma.adminEmail.findMany({
      orderBy: [{ email: 'asc' }],
    });
    res.json(
      rows.map((row) => ({
        id: row.id,
        email: row.email,
        label: row.label,
        isPrimary: isPrimaryAdminEmail(row.email),
        createdAt: row.createdAt.toISOString(),
      })),
    );
  } catch (error) {
    console.error('CRM admin-emails GET error:', error);
    res.status(500).json({ message: 'Не вдалося завантажити email адмінів' });
  }
});

router.post('/admin-emails', checkAdmin, async (req: Request, res: Response) => {
  try {
    const rawEmail = String(req.body?.email ?? '').trim();
    const label = String(req.body?.label ?? '').trim() || null;
    const normalizedEmail = parseAdminEmailInput(rawEmail);
    if (!normalizedEmail) {
      res.status(400).json({ message: 'Некорректный email' });
      return;
    }

    const existing = await prisma.adminEmail.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      res.status(400).json({ message: 'Этот email уже добавлен в список админов' });
      return;
    }

    const created = await prisma.adminEmail.create({
      data: { email: normalizedEmail, label },
    });
    await syncUsersForAdminEmail(prisma, normalizedEmail, true);

    res.status(201).json({
      id: created.id,
      email: created.email,
      label: created.label,
      isPrimary: isPrimaryAdminEmail(created.email),
      createdAt: created.createdAt.toISOString(),
    });
  } catch (error) {
    console.error('CRM admin-emails POST error:', error);
    res.status(500).json({ message: 'Не вдалося додати email адміна' });
  }
});

router.delete('/admin-emails/:id', checkAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (!Number.isFinite(id)) {
      res.status(400).json({ message: 'Некорректный id' });
      return;
    }

    const row = await prisma.adminEmail.findUnique({ where: { id } });
    if (!row) {
      res.status(404).json({ message: 'Email не найден' });
      return;
    }

    if (isPrimaryAdminEmail(row.email) || normalizeAdminEmail(row.email) === PRIMARY_ADMIN_EMAIL) {
      res.status(400).json({ message: 'Головний email адміністратора не можна видалити' });
      return;
    }

    await prisma.adminEmail.delete({ where: { id } });
    await syncUsersForAdminEmail(prisma, row.email, false);

    res.json({ ok: true });
  } catch (error) {
    console.error('CRM admin-emails DELETE error:', error);
    res.status(500).json({ message: 'Не вдалося видалити email адміна' });
  }
});

export default router;
