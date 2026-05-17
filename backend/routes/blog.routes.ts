import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { checkAdmin } from '../authMiddleware';
import { cachePublicGet, PUBLIC_CACHE_CATALOG_SEC } from '../lib/publicApiCache.js';

const router = Router();
const prisma = new PrismaClient();

router.get('/', cachePublicGet(PUBLIC_CACHE_CATALOG_SEC), async (_req: Request, res: Response) => {
  try {
    const posts = await prisma.blogPost.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(posts);
  } catch (error) {
    console.error('Ошибка получения blog posts:', error);
    res.status(500).json({ message: 'Ошибка получения статей' });
  }
});

router.get('/all', checkAdmin, async (_req: Request, res: Response) => {
  try {
    const posts = await prisma.blogPost.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(posts);
  } catch (error) {
    console.error('Ошибка получения всех blog posts:', error);
    res.status(500).json({ message: 'Ошибка получения статей' });
  }
});

router.get('/:slug', cachePublicGet(PUBLIC_CACHE_CATALOG_SEC), async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const post = await prisma.blogPost.findUnique({
      where: { slug },
    });

    if (!post || !post.isPublished) {
      return res.status(404).json({ message: 'Статья не найдена' });
    }

    res.json(post);
  } catch (error) {
    console.error('Ошибка получения статьи по slug:', error);
    res.status(500).json({ message: 'Ошибка получения статьи' });
  }
});

router.post('/', checkAdmin, async (req: Request, res: Response) => {
  try {
    const { title, slug, content, imageUrl, videoUrl, author, isPublished } = req.body;
    if (!title || !slug || !content) {
      return res.status(400).json({ message: 'title, slug и content обязательны' });
    }

    const created = await prisma.blogPost.create({
      data: {
        title: String(title).trim(),
        slug: String(slug).trim(),
        content: String(content),
        imageUrl: imageUrl ? String(imageUrl).trim() : null,
        videoUrl: videoUrl ? String(videoUrl).trim() : null,
        author: author ? String(author).trim() : 'Шеф Watta Sushi',
        isPublished: isPublished !== undefined ? Boolean(isPublished) : true,
      },
    });

    res.json(created);
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return res.status(400).json({ message: 'Такой slug уже существует' });
    }
    console.error('Ошибка создания статьи:', error);
    res.status(500).json({ message: 'Ошибка создания статьи' });
  }
});

router.put('/:id', checkAdmin, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { title, slug, content, imageUrl, videoUrl, author, isPublished } = req.body;

    const updated = await prisma.blogPost.update({
      where: { id },
      data: {
        title: title !== undefined ? String(title).trim() : undefined,
        slug: slug !== undefined ? String(slug).trim() : undefined,
        content: content !== undefined ? String(content) : undefined,
        imageUrl: imageUrl !== undefined ? (imageUrl ? String(imageUrl).trim() : null) : undefined,
        videoUrl: videoUrl !== undefined ? (videoUrl ? String(videoUrl).trim() : null) : undefined,
        author: author !== undefined ? String(author).trim() : undefined,
        isPublished: isPublished !== undefined ? Boolean(isPublished) : undefined,
      },
    });

    res.json(updated);
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return res.status(404).json({ message: 'Статья не найдена' });
    }
    if (error?.code === 'P2002') {
      return res.status(400).json({ message: 'Такой slug уже существует' });
    }
    console.error('Ошибка обновления статьи:', error);
    res.status(500).json({ message: 'Ошибка обновления статьи' });
  }
});

router.delete('/:id', checkAdmin, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await prisma.blogPost.delete({ where: { id } });
    res.json({ ok: true });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return res.status(404).json({ message: 'Статья не найдена' });
    }
    console.error('Ошибка удаления статьи:', error);
    res.status(500).json({ message: 'Ошибка удаления статьи' });
  }
});

export default router;
