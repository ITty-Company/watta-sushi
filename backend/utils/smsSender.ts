import axios from 'axios';

// Токен из настроек TurboSMS
const SMS_TOKEN = process.env.TURBOSMS_TOKEN; 

export const sendSms = async (phone: string, message: string) => {
  console.log(`📨 [SMS] to ${phone}: ${message}`);

  // Если мы в разработке - не тратим деньги, просто логируем
  if (process.env.NODE_ENV !== 'production') {
    return true; 
  }

  try {
    // Пример запроса к TurboSMS
    const response = await axios.post('https://api.turbosms.ua/message/send.json', {
      recipients: [phone],
      sms: {
        sender: "WattaSushi", // Ваше альфа-имя (надо регистрировать)
        text: message
      }
    }, {
      headers: { 'Authorization': `Bearer ${SMS_TOKEN}` }
    });
    
    return response.data.response_code === 0; // 0 - успех
  } catch (error) {
    console.error("SMS Send Error:", error);
    return false;
  }
};