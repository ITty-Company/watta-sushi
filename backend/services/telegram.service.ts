import fetch from 'node-fetch'; 

const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TG_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export const sendTelegramNotification = async (order: any, items: any[]) => {
  if (!TG_TOKEN || !TG_CHAT_ID) return;

  const itemsList = items.map((i: any) => 
    `— ${i.product.name_ru} x${i.quantity} (${i.price * i.quantity} ₴)`
  ).join('\n');

  // ИСПОЛЬЗУЕМ ПРАВИЛЬНЫЕ ПОЛЯ (customerName, totalPrice)
  const message = `
🍣 <b>НОВЫЙ ЗАКАЗ #${order.id}</b>

👤 <b>Клиент:</b> ${order.customerName} 
📞 <b>Телефон:</b> ${order.phone}
📍 <b>Адрес:</b> ${order.address}
💰 <b>Оплата:</b> ${order.paymentMethod === 'CASH' ? 'Наличные' : 'Карта'}
💬 <b>Комментарий:</b> ${order.comment || 'Нет'}

🛒 <b>Заказ:</b>
${itemsList}

💵 <b>ИТОГО: ${order.totalPrice} ₴</b>
  `;

  try {
    await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TG_CHAT_ID,
        text: message,
        parse_mode: 'HTML'
      })
    });
  } catch (error) {
    console.error('TG Error:', error);
  }
};