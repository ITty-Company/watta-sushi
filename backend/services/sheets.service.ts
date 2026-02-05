import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import creds from '../google-service-account.json.json'; 

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

const jwt = new JWT({
  email: creds.client_email,
  key: creds.private_key,
  scopes: SCOPES,
});

export const addOrderToSheet = async (order: any, items: any[]) => {
  try {
    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID as string, jwt);
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];

    const itemsString = items.map((i: any) => `${i.product.name_ru} (${i.quantity})`).join(', ');

    // ИСПОЛЬЗУЕМ ПРАВИЛЬНЫЕ ПОЛЯ
    await sheet.addRow({
      'ID': order.id,
      'Дата': new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Kyiv' }),
      'Имя': order.customerName, // Исправлено
      'Телефон': order.phone,    // Исправлено
      'Сумма': order.totalPrice, // Исправлено
      'Оплата': order.paymentMethod,
      'Адрес': order.address,
      'Состав': itemsString,
      'Комментарий': order.comment || ''
    });
  } catch (error) {
    console.error('Sheets Error:', error);
  }
};