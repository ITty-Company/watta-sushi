import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
];

// ИСПРАВЛЕНИЕ: Добавили тип ": any", чтобы TypeScript не ругался
let creds: any; 

if (process.env.GOOGLE_CREDS) {
    // Если мы на Render, парсим строку JSON из переменных
    creds = JSON.parse(process.env.GOOGLE_CREDS);
} else {
    // Фолбек для локального запуска
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        creds = require('../google-service-account.json');
    } catch (e) {
        console.error('CRITICAL: Google credentials not found! Check .env or json file.');
    }
}

// Проверка на случай, если creds так и не загрузились
const jwt = creds ? new JWT({
  email: creds.client_email,
  key: creds.private_key,
  scopes: SCOPES,
}) : null; // Если ключей нет, jwt будет null

export const addOrderToSheet = async (order: any, items: any[]) => {
  // Добавили проверку на jwt
  if (!process.env.GOOGLE_SHEET_ID || !jwt) {
      console.log('Skipping Sheets: No credentials or Sheet ID provided');
      return;
  }

  try {
    // Передаем jwt, который точно не null благодаря проверке выше
    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID as string, jwt);
    
    await doc.loadInfo();
    
    const sheet = doc.sheetsByIndex[0];

    const itemsString = items.map((i: any) => `${i.product.name_ru} (${i.quantity})`).join(', ');

    await sheet.addRow({
      'ID': order.id,
      'Дата': new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Kyiv' }),
      'Имя': order.customerName,
      'Телефон': order.phone,
      'Сумма': order.totalPrice,
      'Оплата': order.paymentMethod,
      'Адрес': order.address,
      'Состав': itemsString,
      'Комментарий': order.comment || ''
    });

    console.log('Order added to Google Sheets');
  } catch (error) {
    console.error('Error adding to Sheets:', error);
  }
};