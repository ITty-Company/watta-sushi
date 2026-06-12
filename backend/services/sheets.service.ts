import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleSpreadsheet, type GoogleSpreadsheetWorksheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import type { PrismaClient } from '@prisma/client';
import type { CustomerAggregate } from '../lib/crmCustomers.js';
import { fetchCrmCustomers } from '../lib/crmCustomers.js';
import type {
  OrderReportRow,
  ProductSalesRow,
} from '../lib/crmReports.js';
import type { ReportDateRange } from '../lib/crmReportPeriod.js';

const serviceAccountPath = join(
  dirname(fileURLToPath(import.meta.url)),
  '../google-service-account.json',
);

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

function getCrmSheetTitleValue(): string {
  return process.env.GOOGLE_CRM_SHEET_TITLE?.trim() || 'Клиенты';
}

let jwtClient: JWT | null | undefined;

function getGoogleCredsJson(): string | null {
  const raw = process.env.GOOGLE_CREDS?.trim() || process.env.GOOGLE_CREDSS?.trim();
  return raw || null;
}

function loadServiceAccountCreds(): Record<string, string> | null {
  const credsJson = getGoogleCredsJson();
  if (credsJson) {
    try {
      return JSON.parse(credsJson) as Record<string, string>;
    } catch {
      console.warn(
        'Google Sheets: GOOGLE_CREDS / GOOGLE_CREDSS не є валідним JSON — експорт у таблицю вимкнено.',
      );
      return null;
    }
  }

  try {
    return JSON.parse(readFileSync(serviceAccountPath, 'utf8')) as Record<string, string>;
  } catch {
    if (process.env.NODE_ENV === 'production') {
      console.warn(
        'Google Sheets: немає облікових даних (GOOGLE_CREDS, GOOGLE_CREDSS або backend/google-service-account.json). Експорт замовлень у таблицю вимкнено.',
      );
    }
    return null;
  }
}

function getJwtClient(): JWT | null {
  if (jwtClient !== undefined) return jwtClient;

  const creds = loadServiceAccountCreds();
  jwtClient = creds?.client_email && creds?.private_key
    ? new JWT({
        email: creds.client_email,
        key: creds.private_key,
        scopes: SCOPES,
      })
    : null;

  return jwtClient;
}

export function isGoogleSheetsConfigured(): boolean {
  return Boolean(process.env.GOOGLE_SHEET_ID?.trim() && getJwtClient());
}

export function getGoogleSpreadsheetUrl(): string | null {
  const id = process.env.GOOGLE_SHEET_ID?.trim();
  if (!id) return null;
  return `https://docs.google.com/spreadsheets/d/${id}/edit`;
}

export function getCrmSheetTitle(): string {
  return getCrmSheetTitleValue();
}

export function getGoogleServiceAccountEmail(): string | null {
  const creds = loadServiceAccountCreds();
  return creds?.client_email?.trim() || null;
}

function getHttpStatus(error: unknown): number | null {
  const status = (error as { response?: { status?: number } })?.response?.status;
  return typeof status === 'number' ? status : null;
}

export function formatGoogleSheetsSyncError(error: unknown): string {
  const email = getGoogleServiceAccountEmail();
  const status = getHttpStatus(error);
  const sheetTitle = getCrmSheetTitleValue();

  if (status === 403) {
    return [
      'Нет доступа к Google Таблице (403).',
      email
        ? `Откройте таблицу → «Настройки доступа» → добавьте ${email} как Редактор (Editor).`
        : 'Проверьте GOOGLE_CREDS / GOOGLE_CREDSS на Render и доступ service account к таблице.',
      `Вкладка CRM: «${sheetTitle}». Имя должно совпадать с GOOGLE_CRM_SHEET_TITLE.`,
      'Снимите защиту листа: Данные → Защищённые листы и диапазоны.',
    ].join(' ');
  }

  if (status === 404) {
    return 'Google Таблица не найдена. Проверьте GOOGLE_SHEET_ID на Render.';
  }

  const message = (error as { message?: string })?.message?.trim();
  if (message?.includes('GOOGLE_CREDS')) return message;
  if (message) return message;

  return 'Ошибка синхронизации с Google Таблицей';
}

async function clearWorksheetRows(sheet: GoogleSpreadsheetWorksheet): Promise<void> {
  try {
    await sheet.clear();
    return;
  } catch (error) {
    if (getHttpStatus(error) !== 403) throw error;
  }

  await sheet.loadHeaderRow();
  let rows = await sheet.getRows();
  while (rows.length > 0) {
    await Promise.all(rows.map((row) => row.delete()));
    rows = await sheet.getRows();
  }
}

async function ensureCrmWorksheet(
  doc: GoogleSpreadsheet,
  crmSheetTitle: string,
): Promise<GoogleSpreadsheetWorksheet> {
  let sheet = doc.sheetsByTitle[crmSheetTitle];
  if (!sheet) {
    return doc.addSheet({ title: crmSheetTitle, headerValues: CRM_HEADER_VALUES });
  }

  try {
    await clearWorksheetRows(sheet);
    return sheet;
  } catch (error) {
    if (getHttpStatus(error) !== 403) throw error;
    const sheetId = sheet.sheetId;
    await doc.deleteSheet(sheetId);
    return doc.addSheet({ title: crmSheetTitle, headerValues: CRM_HEADER_VALUES });
  }
}

export async function probeGoogleSheetsWriteAccess(): Promise<{
  ok: boolean;
  serviceAccountEmail: string | null;
  spreadsheetTitle?: string;
  crmSheetTitle: string;
  crmSheetExists: boolean;
  error?: string;
}> {
  const crmSheetTitle = getCrmSheetTitleValue();
  const serviceAccountEmail = getGoogleServiceAccountEmail();

  if (!isGoogleSheetsConfigured()) {
    return {
      ok: false,
      serviceAccountEmail,
      crmSheetTitle,
      crmSheetExists: false,
      error: 'Google Таблицы не настроены (GOOGLE_CREDS / GOOGLE_CREDSS + GOOGLE_SHEET_ID).',
    };
  }

  try {
    const doc = await getSpreadsheetDoc();
    if (!doc) {
      return {
        ok: false,
        serviceAccountEmail,
        crmSheetTitle,
        crmSheetExists: false,
        error: 'Не удалось открыть Google Таблицу.',
      };
    }

    const crmSheetExists = Boolean(doc.sheetsByTitle[crmSheetTitle]);
    const probeTitle = '__watta_access_probe__';
    const existingProbe = doc.sheetsByTitle[probeTitle];
    if (existingProbe) {
      await doc.deleteSheet(existingProbe.sheetId);
    }

    const probeSheet = await doc.addSheet({ title: probeTitle, headerValues: ['probe'] });
    await probeSheet.addRow({ probe: 'ok' });
    await doc.deleteSheet(probeSheet.sheetId);

    return {
      ok: true,
      serviceAccountEmail,
      crmSheetTitle,
      crmSheetExists,
      spreadsheetTitle: doc.title,
    };
  } catch (error) {
    return {
      ok: false,
      serviceAccountEmail,
      crmSheetTitle,
      crmSheetExists: false,
      error: formatGoogleSheetsSyncError(error),
    };
  }
}

async function getSpreadsheetDoc(): Promise<GoogleSpreadsheet | null> {
  const sheetId = process.env.GOOGLE_SHEET_ID?.trim();
  const jwt = getJwtClient();
  if (!sheetId || !jwt) return null;
  const doc = new GoogleSpreadsheet(sheetId, jwt);
  await doc.loadInfo();
  return doc;
}

function formatKyivDateTime(iso: string | null): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('ru-RU', { timeZone: 'Europe/Kyiv' });
  } catch {
    return iso;
  }
}

const CRM_HEADER_VALUES = [
  'Телефон (ключ)',
  'Телефон',
  'Имя',
  'Email',
  'ID пользователя',
  'Заказов',
  'Сумма (€)',
  'Бонусы (€)',
  'Зарегистрирован',
  'Согласие на данные',
  'Последний заказ',
  'Обновлено',
];

export async function syncCrmCustomersToSheet(
  customers: CustomerAggregate[],
): Promise<{ count: number; sheetTitle: string } | null> {
  const doc = await getSpreadsheetDoc();
  if (!doc) {
    console.log('Skipping CRM Sheets sync: No credentials or Sheet ID provided');
    return null;
  }

  const crmSheetTitle = getCrmSheetTitleValue();

  try {
    const sheet = await ensureCrmWorksheet(doc, crmSheetTitle);
    await sheet.setHeaderRow(CRM_HEADER_VALUES);

    const syncedAt = new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Kyiv' });
    const rows = customers.map((c) => ({
      'Телефон (ключ)': c.phoneKey,
      Телефон: c.displayPhone,
      Имя: c.customerName,
      Email: c.email || '',
      'ID пользователя': c.userId ?? '',
      Заказов: c.orderCount,
      'Сумма (€)': Number(c.totalSpent.toFixed(2)),
      'Бонусы (€)': Number(c.bonusBalance.toFixed(2)),
      Зарегистрирован: c.registered ? 'Да' : 'Нет',
      'Согласие на данные': formatKyivDateTime(c.dataProcessingConsentAt),
      'Последний заказ': formatKyivDateTime(c.lastOrderAt),
      Обновлено: syncedAt,
    }));

    if (rows.length > 0) {
      await sheet.addRows(rows);
    }

    console.log(`CRM: synced ${rows.length} customers to Google Sheets tab "${crmSheetTitle}"`);
    return { count: rows.length, sheetTitle: crmSheetTitle };
  } catch (error) {
    console.error('Error syncing CRM to Sheets:', error);
    throw error;
  }
}

let crmSyncTimer: ReturnType<typeof setTimeout> | null = null;

export function scheduleCrmSheetsSync(prisma: PrismaClient): void {
  if (!isGoogleSheetsConfigured()) return;
  if (crmSyncTimer) clearTimeout(crmSyncTimer);
  crmSyncTimer = setTimeout(() => {
    crmSyncTimer = null;
    void fetchCrmCustomers(prisma)
      .then((customers) => syncCrmCustomersToSheet(customers))
      .catch((error) => console.error('Scheduled CRM Sheets sync failed:', error));
  }, 8000);
}

export type CrmReportSheetType = 'products' | 'orders' | 'customers';

function buildReportSheetTitle(
  type: CrmReportSheetType,
  range: ReportDateRange,
): string {
  const prefix =
    type === 'products' ? 'Товары' : type === 'orders' ? 'Заказы' : 'Клиенты';
  if (!range.fromYmd && !range.toYmd) return prefix;
  if (range.fromYmd === range.toYmd) return `${prefix} ${range.fromYmd}`;
  return `${prefix} ${range.label}`;
}

function formatKyivDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('ru-RU', {
      timeZone: 'Europe/Kyiv',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export async function syncCrmReportToSheet(
  type: CrmReportSheetType,
  range: ReportDateRange,
  data: {
    products?: ProductSalesRow[];
    orders?: OrderReportRow[];
    customers?: CustomerAggregate[];
    summary?: { orderCount: number; revenue: number; itemCount: number };
  },
): Promise<{ count: number; sheetTitle: string } | null> {
  const doc = await getSpreadsheetDoc();
  if (!doc) {
    console.log('Skipping CRM report Sheets sync: No credentials or Sheet ID provided');
    return null;
  }

  const sheetTitle = buildReportSheetTitle(type, range);
  const syncedAt = new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Kyiv' });
  const periodLabel = range.label;

  try {
    let sheet = doc.sheetsByTitle[sheetTitle];
    if (sheet) {
      await sheet.clear();
    } else {
      const headers =
        type === 'products'
          ? PRODUCT_REPORT_HEADERS
          : type === 'orders'
            ? ORDER_REPORT_HEADERS
            : CUSTOMER_REPORT_HEADERS;
      sheet = await doc.addSheet({ title: sheetTitle, headerValues: headers });
    }

    if (type === 'products') {
      await sheet.setHeaderRow(PRODUCT_REPORT_HEADERS);
      const rows = (data.products || []).map((row) => ({
        'ID товара': row.productId,
        Товар: row.productName,
        Категория: row.categoryName,
        'Кол-во (шт.)': row.quantity,
        'Выручка (€)': row.revenue,
        Заказов: row.orderCount,
        Период: periodLabel,
        Обновлено: syncedAt,
      }));
      if (rows.length > 0) await sheet.addRows(rows);
      console.log(`CRM report: synced ${rows.length} products to "${sheetTitle}"`);
      return { count: rows.length, sheetTitle };
    }

    if (type === 'orders') {
      await sheet.setHeaderRow(ORDER_REPORT_HEADERS);
      const rows = (data.orders || []).map((row) => ({
        '№ заказа': row.id,
        Дата: formatKyivDate(row.createdAt),
        Имя: row.customerName,
        Телефон: row.phone,
        Статус: row.status,
        'Сумма (€)': row.totalPrice,
        Оплата: row.paymentMethod,
        'Статус оплаты': row.paymentStatus,
        Адрес: row.address,
        Состав: row.itemsSummary,
        Период: periodLabel,
        Обновлено: syncedAt,
      }));
      if (rows.length > 0) await sheet.addRows(rows);
      console.log(`CRM report: synced ${rows.length} orders to "${sheetTitle}"`);
      return { count: rows.length, sheetTitle };
    }

    await sheet.setHeaderRow(CUSTOMER_REPORT_HEADERS);
    const rows = (data.customers || []).map((c) => ({
      'Телефон (ключ)': c.phoneKey,
      Телефон: c.displayPhone,
      Имя: c.customerName,
      Email: c.email || '',
      'ID пользователя': c.userId ?? '',
      Заказов: c.orderCount,
      'Сумма (€)': Number(c.totalSpent.toFixed(2)),
      'Бонусы (€)': Number(c.bonusBalance.toFixed(2)),
      Зарегистрирован: c.registered ? 'Да' : 'Нет',
      'Согласие на данные': formatKyivDateTime(c.dataProcessingConsentAt),
      'Последний заказ': formatKyivDateTime(c.lastOrderAt),
      Период: periodLabel,
      Обновлено: syncedAt,
    }));
    if (rows.length > 0) await sheet.addRows(rows);
    console.log(`CRM report: synced ${rows.length} customers to "${sheetTitle}"`);
    return { count: rows.length, sheetTitle };
  } catch (error) {
    console.error('Error syncing CRM report to Sheets:', error);
    throw error;
  }
}

const PRODUCT_REPORT_HEADERS = [
  'ID товара',
  'Товар',
  'Категория',
  'Кол-во (шт.)',
  'Выручка (€)',
  'Заказов',
  'Период',
  'Обновлено',
];

const ORDER_REPORT_HEADERS = [
  '№ заказа',
  'Дата',
  'Имя',
  'Телефон',
  'Статус',
  'Сумма (€)',
  'Оплата',
  'Статус оплаты',
  'Адрес',
  'Состав',
  'Период',
  'Обновлено',
];

const CUSTOMER_REPORT_HEADERS = [
  ...CRM_HEADER_VALUES.slice(0, -1),
  'Период',
  'Обновлено',
];

export const addOrderToSheet = async (order: any, items: any[]) => {
  if (!isGoogleSheetsConfigured()) {
    console.log('Skipping Sheets: No credentials or Sheet ID provided');
    return;
  }

  try {
    const doc = await getSpreadsheetDoc();
    if (!doc) return;

    const sheet = doc.sheetsByIndex[0];
    const itemsString = items
      .map((i: any) => `${i.product.name_ru} (${i.quantity})`)
      .join(', ');

    await sheet.addRow({
      ID: order.id,
      Дата: new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Kyiv' }),
      Имя: order.customerName,
      Телефон: order.phone,
      Сумма: order.totalPrice,
      Оплата: order.paymentMethod,
      Адрес: order.address,
      Состав: itemsString,
      Комментарий: order.comment || '',
    });

    console.log('Order added to Google Sheets');
  } catch (error) {
    console.error('Error adding to Sheets:', error);
  }
};
