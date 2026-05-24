import { Router, type Request, type Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
import { checkAdmin } from '../authMiddleware';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logPath = path.join(__dirname, '../data/contact-inquiries.log');

const router = Router();
const prisma = new PrismaClient();

let logImportAttempted = false;

function validateContactBody(body: Record<string, unknown>) {
  if (String(body.website || '').trim()) {
    return { ok: true as const, honeypot: true };
  }
  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim();
  const phone = String(body.phone || '').trim().slice(0, 48);
  const message = String(body.message || '').trim();

  if (name.length < 2 || name.length > 120) {
    return { ok: false as const, status: 400, error: 'bad_name' };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 120) {
    return { ok: false as const, status: 400, error: 'bad_email' };
  }
  if (message.length < 10 || message.length > 4000) {
    return { ok: false as const, status: 400, error: 'bad_message' };
  }

  return {
    ok: true as const,
    honeypot: false,
    data: { name, email, phone, message: message.slice(0, 4000) },
  };
}

async function importLegacyLogFileOnce() {
  if (logImportAttempted) return;
  logImportAttempted = true;

  try {
    const existing = await prisma.contactInquiry.count();
    if (existing > 0 || !fs.existsSync(logPath)) return;

    const raw = fs.readFileSync(logPath, 'utf8');
    const lines = raw.split('\n').map((line) => line.trim()).filter(Boolean);
    if (lines.length === 0) return;

    const rows: {
      name: string;
      email: string;
      phone: string;
      message: string;
      createdAt: Date;
    }[] = [];

    for (const line of lines) {
      try {
        const parsed = JSON.parse(line) as {
          at?: string;
          name?: string;
          email?: string;
          phone?: string;
          message?: string;
        };
        const name = String(parsed.name || '').trim();
        const email = String(parsed.email || '').trim();
        const message = String(parsed.message || '').trim();
        if (name.length < 2 || !email || message.length < 10) continue;
        const createdAt = parsed.at ? new Date(parsed.at) : new Date();
        if (Number.isNaN(createdAt.getTime())) continue;
        rows.push({
          name,
          email,
          phone: String(parsed.phone || '').trim().slice(0, 48),
          message: message.slice(0, 4000),
          createdAt,
        });
      } catch {
        /* skip malformed line */
      }
    }

    if (rows.length === 0) return;

    await prisma.contactInquiry.createMany({ data: rows });
    console.log(`[contact] imported ${rows.length} legacy inquiries from log file`);
  } catch (e) {
    console.error('[contact] legacy log import error', e);
  }
}

router.get('/inquiries', checkAdmin, async (req: Request, res: Response) => {
  try {
    await importLegacyLogFileOnce();

    const filter = String(req.query.filter || 'all');
    const where =
      filter === 'unread'
        ? { isRead: false }
        : filter === 'read'
          ? { isRead: true }
          : undefined;

    const [items, totalCount, unreadCount] = await Promise.all([
      prisma.contactInquiry.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.contactInquiry.count(),
      prisma.contactInquiry.count({ where: { isRead: false } }),
    ]);

    res.json({ items, totalCount, unreadCount });
  } catch (e) {
    console.error('[contact] inquiries list error', e);
    res.status(500).json({ message: 'Не удалось загрузить обращения' });
  }
});

router.patch('/inquiries/mark-all-read', checkAdmin, async (_req: Request, res: Response) => {
  try {
    await prisma.contactInquiry.updateMany({
      where: { isRead: false },
      data: { isRead: true },
    });
    res.json({ ok: true });
  } catch (e) {
    console.error('[contact] mark-all-read error', e);
    res.status(500).json({ message: 'Не удалось отметить прочитанными' });
  }
});

router.patch('/inquiries/:id', checkAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (!Number.isFinite(id)) {
      res.status(400).json({ message: 'Некорректный id' });
      return;
    }

    const body = req.body || {};
    const data: { isRead?: boolean } = {};
    if (typeof body.isRead === 'boolean') data.isRead = body.isRead;

    const updated = await prisma.contactInquiry.update({
      where: { id },
      data,
    });
    res.json(updated);
  } catch (e) {
    const code = (e as { code?: string })?.code;
    if (code === 'P2025') {
      res.status(404).json({ message: 'Обращение не найдено' });
      return;
    }
    console.error('[contact] inquiry patch error', e);
    res.status(500).json({ message: 'Ошибка обновления' });
  }
});

router.delete('/inquiries/:id', checkAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (!Number.isFinite(id)) {
      res.status(400).json({ message: 'Некорректный id' });
      return;
    }

    await prisma.contactInquiry.delete({ where: { id } });
    res.json({ ok: true });
  } catch (e) {
    const code = (e as { code?: string })?.code;
    if (code === 'P2025') {
      res.status(404).json({ message: 'Обращение не найдено' });
      return;
    }
    console.error('[contact] inquiry delete error', e);
    res.status(500).json({ message: 'Не удалось удалить' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const validated = validateContactBody((req.body || {}) as Record<string, unknown>);
    if (!validated.ok) {
      res.status(validated.status).json({ error: validated.error });
      return;
    }
    if (validated.honeypot) {
      res.json({ ok: true });
      return;
    }

    const { name, email, phone, message } = validated.data;

    const record = {
      at: new Date().toISOString(),
      name,
      email,
      phone,
      message,
    };
    const line = JSON.stringify(record) + '\n';
    try {
      fs.mkdirSync(path.dirname(logPath), { recursive: true });
      fs.appendFileSync(logPath, line, 'utf8');
    } catch (e) {
      console.error('[contact] log file error', e);
    }

    await prisma.contactInquiry.create({
      data: { name, email, phone, message },
    });

    console.log('[contact inquiry]', name, email);
    res.json({ ok: true });
  } catch (e) {
    console.error('[contact]', e);
    res.status(500).json({ error: 'server' });
  }
});

export default router;
