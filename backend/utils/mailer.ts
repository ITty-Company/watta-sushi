import nodemailer from 'nodemailer';

// Настройка транспорта (замените на свои данные)
// Транспорт створюється при першій відправці: у Cloudflare Workers I/O на рівні модуля заборонене.
let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;
const getTransporter = () => (transporter ??= nodemailer.createTransport({
  service: 'gmail', // Или 'smtp.yourprovider.com'
  auth: {
    user: process.env.EMAIL_USER, // Ваш email
    pass: process.env.EMAIL_PASS  // Ваш пароль приложения (App Password)
  }
}));

export const sendVerificationEmail = async (to: string, code: string) => {
  await getTransporter().sendMail({
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

export const sendPasswordResetEmail = async (to: string, code: string) => {
  await getTransporter().sendMail({
    from: '"Watta Sushi" <no-reply@watta-sushi.com>',
    to,
    subject: 'Восстановление пароля Watta Sushi',
    html: `
      <h1>Восстановление пароля</h1>
      <p>Вы запросили сброс пароля. Введите этот код в приложении:</p>
      <h2 style="color: #155044; letter-spacing: 5px;">${code}</h2>
      <p>Код действует ограниченное время. Если вы не запрашивали сброс — проигнорируйте письмо.</p>
    `,
  });
};

export const sendNewsletterEmail = async (to: string[], subject: string, htmlContent: string) => {
  // Отправляем скрытой копией (BCC), чтобы получатели не видели адреса друг друга
  await getTransporter().sendMail({
    from: '"Watta Sushi Admin" <no-reply@watta-sushi.com>',
    bcc: to, 
    subject: subject,
    html: htmlContent
  });
};