import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();
const router = Router();

// Папка для загрузки картинок (в публичную папку фронтенда)
const uploadDir = path.join(__dirname, '../../web/public/uploads');

// Создаем папку, если её нет
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Настройка Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Убираем спецсимволы
        const sanitized = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
        cb(null, `promo-${Date.now()}-${sanitized}`);
    }
});
const upload = multer({ storage });

// 1. Получить все новости
router.get('/', async (req: any, res: any) => {
    try {
        const promos = await prisma.promo.findMany({ orderBy: { createdAt: 'desc' } });
        res.json(promos);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Error fetching promos' });
    }
});

// 2. Получить одну новость
router.get('/:id', async (req: any, res: any) => {
    try {
        const promo = await prisma.promo.findUnique({ where: { id: Number(req.params.id) } });
        if (!promo) return res.status(404).json({ error: 'News not found' });
        res.json(promo);
    } catch (e) {
        res.status(500).json({ error: 'Error fetching promo' });
    }
});

// 3. Создать новость
router.post('/', upload.single('image'), async (req: any, res: any) => {
    try {
        const { title, description, content, isHit } = req.body;
        const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

        const promo = await prisma.promo.create({
            data: {
                title,
                description,
                content: content || description,
                imageUrl,
                isHit: isHit === 'true'
            }
        });
        res.json(promo);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Create error" });
    }
});

// 4. Обновить новость
router.put('/:id', upload.single('image'), async (req: any, res: any) => {
    try {
        const { title, description, content, isHit } = req.body;
        const updateData: any = {
            title,
            description,
            content,
            isHit: isHit === 'true'
        };

        if (req.file) {
            updateData.imageUrl = `/uploads/${req.file.filename}`;
        }

        const promo = await prisma.promo.update({
            where: { id: Number(req.params.id) },
            data: updateData
        });
        res.json(promo);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Update error" });
    }
});

// 5. Удалить новость
router.delete('/:id', async (req: any, res: any) => {
    try {
        await prisma.promo.delete({ where: { id: Number(req.params.id) } });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: "Delete error" });
    }
});

export default router;