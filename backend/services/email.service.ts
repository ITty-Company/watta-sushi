import nodemailer from 'nodemailer';

type ReceiptItem = {
  quantity: number;
  price: number;
  product?: { name_ru?: string | null };
};

type ReceiptOrder = {
  id: number;
  createdAt?: Date | string;
  totalPrice: number;
  paymentMethod?: string;
  items?: ReceiptItem[];
};

const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpPort === 465,
  auth: smtpUser && smtpPass ? { user: smtpUser, pass: smtpPass } : undefined,
});

function buildReceiptHtml(order: ReceiptOrder) {
  const rows = (order.items || [])
    .map((item) => {
      const name = item.product?.name_ru || 'Товар';
      const qty = Number(item.quantity || 1);
      const price = Number(item.price || 0);
      const lineTotal = (qty * price).toFixed(2);
      return `<tr>
        <td style="padding:8px 0;color:#1f2937;">${name}</td>
        <td style="padding:8px 0;color:#6b7280;text-align:center;">x${qty}</td>
        <td style="padding:8px 0;color:#145142;text-align:right;font-weight:700;">${lineTotal} €</td>
      </tr>`;
    })
    .join('');

  return `
  <div style="font-family:Arial,sans-serif;background:#f4f6f8;padding:24px;">
    <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:16px;padding:24px;border:1px solid #e5e7eb;">
      <h1 style="margin:0 0 8px;color:#145142;">Спасибо за заказ!</h1>
      <p style="margin:0 0 18px;color:#6b7280;">Ваш чек по заказу #${order.id}</p>
      <table style="width:100%;border-collapse:collapse;border-top:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb;">
        ${rows || '<tr><td style="padding:10px 0;color:#6b7280;">Состав заказа недоступен</td></tr>'}
      </table>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:16px;">
        <span style="color:#111827;font-size:18px;font-weight:700;">Итого:</span>
        <span style="color:#145142;font-size:24px;font-weight:800;">${Number(order.totalPrice || 0).toFixed(2)} €</span>
      </div>
      <p style="margin-top:18px;color:#6b7280;">Watta Sushi благодарит вас за доверие. Приятного аппетита!</p>
    </div>
  </div>`;
}

export async function sendOrderReceipt(order: ReceiptOrder, userEmail: string) {
  if (!userEmail || !smtpHost || !smtpUser || !smtpPass) return;

  const html = buildReceiptHtml(order);
  await transporter.sendMail({
    from: `"Watta Sushi" <${smtpUser}>`,
    to: userEmail,
    subject: `Ваш чек по заказу #${order.id}`,
    html,
  });
}

export async function sendMassPromo(emails: string[], subject: string, htmlContent: string) {
  if (!emails.length || !smtpHost || !smtpUser || !smtpPass) return;
  const valid = emails.filter((email) => /\S+@\S+\.\S+/.test(email));
  if (!valid.length) return;

  await Promise.allSettled(
    valid.map((email) =>
      transporter.sendMail({
        from: `"Watta Sushi" <${smtpUser}>`,
        to: email,
        subject,
        html: htmlContent,
      })
    )
  );
}
