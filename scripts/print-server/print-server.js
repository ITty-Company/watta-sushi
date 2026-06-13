/**
 * Watta Sushi — локальний print-server
 * ======================================
 *
 * Запускається на комп'ютері в ресторані (або Raspberry Pi), підключеному
 * до термопринтера через USB. Кожні N секунд опитує бекенд Watta Sushi
 * на предмет нових оплачених замовлень і друкує чеки.
 *
 * Використання:
 *   node print-server.js                      # звичайний запуск
 *   node print-server.js --test-print          # тестовий друк
 *   node print-server.js --once                # одна ітерація (для cron)
 *
 * Конфігурація: .env (див. .env.example)
 */

import { Printer, types } from 'node-thermal-printer';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// ─── Конфігурація з .env ──────────────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '.env');

if (existsSync(envPath)) {
  const lines = readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    // Не перезаписуємо вже встановлені змінні (пріоритет у реальний env)
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
}

const API_URL = (process.env.API_URL || 'http://localhost:5050').replace(/\/+$/, '');
const TOKEN = process.env.PRINT_SERVER_TOKEN || '';
const POLL_INTERVAL_MS = (parseInt(process.env.POLL_INTERVAL_SEC || '5', 10) || 5) * 1000;
const PRINTER_TYPE = (process.env.PRINTER_TYPE || 'EPSON').toUpperCase();
const PRINTER_INTERFACE = process.env.PRINTER_INTERFACE || 'usb';
const PRINTER_WIDTH_MM = parseInt(process.env.PRINTER_WIDTH_MM || '58', 10) || 58;
const PRINTER_CHARACTER_SET = process.env.PRINTER_CHARACTER_SET || 'CP866';

// ─── Стан ─────────────────────────────────────────────────────────────────
let lastOrderId = 0;          // ID останнього отриманого замовлення
let consecutiveErrors = 0;    // лічильник помилок для backoff

// ─── Принтер ───────────────────────────────────────────────────────────────
let printer = null;

function getPrinterType() {
  switch (PRINTER_TYPE) {
    case 'EPSON': return types.EPSON;
    case 'STAR':  return types.STAR;
    default:      return types.EPSON;
  }
}

function createPrinter() {
  return new Printer({
    type: getPrinterType(),
    interface: PRINTER_INTERFACE,
    width: PRINTER_WIDTH_MM,                  // ширина в mm (58 або 80)
    characterSet: PRINTER_CHARACTER_SET,       // CP866 для кирилиці
    removeSpecialCharacters: false,
    options: {
      timeout: 5000,
    },
  });
}

/**
 * Тестовий друк: перевіряє, чи принтер підключений і чи правильно налаштований.
 */
async function testPrint() {
  try {
    printer = createPrinter();
    const isConnected = await printer.isPrinterConnected();
    console.log(`🔌 Принтер підключений: ${isConnected}`);

    if (!isConnected) {
      console.error('❌ Принтер не знайдено. Перевірте PRINTER_INTERFACE.');
      process.exit(1);
    }

    printer.alignCenter();
    printer.println('=== WATTA SUSHI ===');
    printer.newLine();
    printer.println('ТЕСТОВИЙ ЧЕК');
    printer.println('Якщо ви це читаєте');
    printer.println('— принтер працює!');
    printer.newLine();
    printer.println(new Date().toLocaleString('uk-UA'));
    printer.newLine();
    printer.cut();

    await printer.execute();
    console.log('✅ Тестовий чек надруковано!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Помилка тестового друку:', err.message);
    process.exit(1);
  }
}

// ─── HTTP helper ────────────────────────────────────────────────────────────

async function apiGet(path) {
  const url = `${API_URL}${path}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: 'application/json',
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

async function apiPost(path, body) {
  const url = `${API_URL}${path}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

// ─── Форматування та друк чека ─────────────────────────────────────────────

function formatReceipt(order) {
  const lines = [];
  const div = '='.repeat(PRINTER_WIDTH_MM < 60 ? 28 : 36);
  const dash = '-'.repeat(PRINTER_WIDTH_MM < 60 ? 28 : 36);

  // Шапка
  lines.push('');
  lines.push('   WATTA SUSHI');
  lines.push(div);
  lines.push(`  Замовлення #${order.id}`);
  lines.push(dash);

  // Позиції
  if (Array.isArray(order.items)) {
    for (const item of order.items) {
      const name = item.productNameSnapshot || item.product?.name_ru || 'Товар';
      const qty = item.quantity || 1;
      const price = Number(item.price || 0);
      const total = (qty * price).toFixed(2);
      lines.push(`  ${name}`);
      lines.push(`    ${qty} x ${price.toFixed(2)}  ${total} EUR`);
    }
  }

  lines.push(dash);

  // Доставка
  const deliveryFee = Number(order.deliveryFee || 0);
  if (deliveryFee > 0) {
    lines.push(`  Доставка          ${deliveryFee.toFixed(2)} EUR`);
  }

  // Бонуси
  const bonuses = Number(order.usedBonuses || 0);
  if (bonuses > 0) {
    lines.push(`  Бонуси           -${bonuses.toFixed(2)} EUR`);
  }

  // Разом
  lines.push(div);
  const total = Number(order.totalPrice || 0).toFixed(2);
  lines.push(`  РАЗОМ:           ${total} EUR`);
  lines.push(div);

  // Статус оплати
  const isPaid = order.paymentStatus === 'PAID';
  lines.push(`  Статус: ${isPaid ? 'ОПЛАЧЕНО ✓' : order.paymentStatus || '—'}`);

  // Дата
  const createdAt = order.createdAt
    ? new Date(order.createdAt).toLocaleString('uk-UA', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';
  lines.push(`  ${createdAt}`);

  // Спосіб оплати
  const payMethod = order.paymentMethod === 'CARD' ? 'Карта (онлайн)' : 'Готівка';
  lines.push(`  Спосіб: ${payMethod}`);

  // Тип отримання
  const fulfillment = order.fulfillmentType === 'PICKUP' ? 'Самовивіз' : 'Доставка';
  lines.push(`  ${fulfillment}`);

  // Адреса (якщо доставка)
  if (order.fulfillmentType !== 'PICKUP' && order.address) {
    lines.push(`  ${order.address}`);
  }

  lines.push('');
  lines.push('  Дякуємо за замовлення!');
  lines.push('  Приємного апетиту 🍣');
  lines.push('');
  lines.push(div);

  return lines.join('\n');
}

async function printReceipt(order) {
  if (!printer) {
    printer = createPrinter();
  }

  // Перевіряємо підключення
  try {
    const isConnected = await printer.isPrinterConnected();
    if (!isConnected) {
      console.warn('⚠️ Принтер не підключений. Спроба перепідключення...');
      printer = createPrinter();
      const retry = await printer.isPrinterConnected();
      if (!retry) {
        throw new Error('Принтер не підключений після повторної спроби');
      }
    }
  } catch (connErr) {
    throw new Error(`Помилка підключення принтера: ${connErr.message}`);
  }

  const text = formatReceipt(order);

  // Друк через node-thermal-printer
  printer.alignCenter();
  printer.println('WATTA SUSHI');
  printer.drawLine();
  printer.alignLeft();
  printer.println(text);
  printer.newLine();
  printer.cut();

  await printer.execute();
}

// ─── Основна логіка опитування ─────────────────────────────────────────────

async function pollOnce() {
  try {
    console.log(`🔍 Перевірка нових замовлень (since=${lastOrderId})...`);
    const data = await apiGet(`/api/orders/ready-to-print?since=${lastOrderId}`);

    if (!data.orders || data.orders.length === 0) {
      console.log('😴 Нових замовлень немає');
      consecutiveErrors = 0;
      return;
    }

    const { orders } = data;
    console.log(`📋 Знайдено ${orders.length} нових замовлень для друку`);

    const printedIds = [];

    for (const order of orders) {
      console.log(`🖨️ Друк чека #${order.id}...`);
      try {
        await printReceipt(order);
        console.log(`✅ Чек #${order.id} надруковано`);
        printedIds.push(order.id);
      } catch (printErr) {
        console.error(`❌ Помилка друку #${order.id}:`, printErr.message);
        // Продовжуємо з наступним — не блокуємо всі чеки через один
      }
    }

    // Позначаємо надруковані
    if (printedIds.length > 0) {
      console.log(`📝 Позначення ${printedIds.length} замовлень як надруковані...`);
      await apiPost('/api/orders/mark-printed', { orderIds: printedIds });
      console.log(`✅ Позначено: ${printedIds.join(', ')}`);
    }

    // Оновлюємо lastOrderId ТІЛЬКИ для успішно надрукованих замовлень.
    // Якщо якийсь чек не надрукувався (paper jam, out of paper, помилка),
    // він залишиться з receiptPrinted=false і буде отриманий знову в наступному циклі.
    if (printedIds.length > 0) {
      const maxPrinted = Math.max(...printedIds);
      if (maxPrinted > lastOrderId) {
        lastOrderId = maxPrinted;
      }
    }

    consecutiveErrors = 0;
  } catch (err) {
    consecutiveErrors++;
    const backoff = Math.min(consecutiveErrors, 10); // max 10 сек
    console.error(`❌ Помилка (${consecutiveErrors}): ${err.message}`);
    console.log(`⏳ Чекаю ${backoff} сек перед повторною спробою...`);
    await sleep(backoff * 1000);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Точка входу ───────────────────────────────────────────────────────────

async function main() {
  console.log('');
  console.log('══════════════════════════════════════');
  console.log('  WATTA SUSHI — PRINT SERVER');
  console.log('══════════════════════════════════════');
  console.log(`  API:       ${API_URL}`);
  console.log(`  Принтер:   ${PRINTER_TYPE} (${PRINTER_INTERFACE})`);
  console.log(`  Формат:    ${PRINTER_WIDTH_MM}mm`);
  console.log(`  Інтервал:  ${POLL_INTERVAL_MS / 1000}с`);
  console.log('══════════════════════════════════════');
  console.log('');

  if (!TOKEN) {
    console.error('❌ PRINT_SERVER_TOKEN не заданий!');
    console.error('   Вкажіть його в .env або в змінній середовища.');
    process.exit(1);
  }

  // --test-print: тестовий друк і вихід
  if (process.argv.includes('--test-print')) {
    console.log('🧪 Тестовий друк...');
    await testPrint();
    return;
  }

  // --once: одна ітерація (для cron / ручного запуску)
  if (process.argv.includes('--once')) {
    await pollOnce();
    return;
  }

  // Основний цикл
  console.log('🚀 Запуск циклу опитування...');
  console.log('');
  while (true) {
    await pollOnce();
    await sleep(POLL_INTERVAL_MS);
  }
}

main().catch((err) => {
  console.error('❌ Критична помилка:', err);
  process.exit(1);
});
