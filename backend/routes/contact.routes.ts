import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logPath = path.join(__dirname, '../data/contact-inquiries.log');

const router = Router();

router.post('/', (req: any, res: any) => {
  try {
    const body = req.body || {};
    if (String(body.website || '').trim()) {
      res.json({ ok: true });
      return;
    }
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim();
    const phone = String(body.phone || '').trim().slice(0, 48);
    const message = String(body.message || '').trim();

    if (name.length < 2 || name.length > 120) {
      res.status(400).json({ error: 'bad_name' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 120) {
      res.status(400).json({ error: 'bad_email' });
      return;
    }
    if (message.length < 10 || message.length > 4000) {
      res.status(400).json({ error: 'bad_message' });
      return;
    }

    const record = {
      at: new Date().toISOString(),
      name,
      email,
      phone,
      message: message.slice(0, 4000),
    };
    const line = JSON.stringify(record) + '\n';
    try {
      fs.mkdirSync(path.dirname(logPath), { recursive: true });
      fs.appendFileSync(logPath, line, 'utf8');
    } catch (e) {
      console.error('[contact] log file error', e);
    }
    console.log('[contact inquiry]', name, email);
    res.json({ ok: true });
  } catch (e) {
    console.error('[contact]', e);
    res.status(500).json({ error: 'server' });
  }
});

export default router;
