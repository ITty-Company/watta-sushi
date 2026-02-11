import nodemailer from 'nodemailer';

// Настройка транспорта (замените на свои данные)
const transporter = nodemailer.createTransport({
  service: 'gmail', // Или 'smtp.yourprovider.com'
  auth: {
    user: process.env.EMAIL_USER, // Ваш email
    pass: process.env.EMAIL_PASS  // Ваш пароль приложения (App Password)
  }
});

export const sendVerificationEmail = async (to: string, code: string) => {
  await transporter.sendMail({
    from: '"Watta Sushi" <no-reply@watta-sushi.com>',
    to,
    subject: 'Код подтверждения регистрации',
    html: `
      <h1>Добро пожаловать в Watta Sushi!</h1>
      <p>Ваш код подтверждения:</p>
      <h2 style="color: #155044; letter-spacing: 5px;">${code}</h2>
      <p>Никому не сообщайте этот код.</p>
    `
  });
};

export const sendNewsletterEmail = async (to: string[], subject: string, htmlContent: string) => {
  // Отправляем скрытой копией (BCC), чтобы получатели не видели адреса друг друга
  await transporter.sendMail({
    from: '"Watta Sushi Admin" <no-reply@watta-sushi.com>',
    bcc: to, 
    subject: subject,
    html: htmlContent
  });
};