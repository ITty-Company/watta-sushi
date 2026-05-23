import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { checkAdmin } from '../authMiddleware';
import { cachePublicGet, PUBLIC_CACHE_CATALOG_SEC } from '../lib/publicApiCache.js';
import path from 'path';
import crypto from 'crypto';
import multer from 'multer';
import { getUploadsDir } from '../lib/uploadsDir.js';
import {
  blogLinkFieldsFromBody,
  formatBlogPostRow,
} from '../lib/blogLinks.js';
import { expandBlogPostLinks } from '../lib/blogExpandLinks.js';
import {
  blogI18nFromBody,
  formatBlogPostAdmin,
  localizeBlogPostForPublic,
  parseBlogLang,
  primaryBlogLocalized,
} from '../lib/blogI18n.js';
import { translateBlogFromUkrainian } from '../lib/blogTranslate.js';

const RESERVED_SLUGS = new Set(['upload-image', 'all', 'translate']);

function formatAdminPost(post: Awaited<ReturnType<typeof prisma.blogPost.findUnique>>) {
  if (!post) return post;
  return formatBlogPostRow(formatBlogPostAdmin(post));
}

function formatPublicPost(
  post: NonNullable<Awaited<ReturnType<typeof prisma.blogPost.findUnique>>>,
  lang: string,
) {
  return formatBlogPostRow(localizeBlogPostForPublic(post, lang));
}

const router = Router();
const prisma = new PrismaClient();
const uploadDir = getUploadsDir();

const blogImageDiskUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const rawExt = path.extname(file.originalname || '').toLowerCase();
      const ext =
        rawExt === '.jpeg' || rawExt === '.jpg'
          ? '.jpg'
          : ['.png', '.webp', '.gif'].includes(rawExt)
            ? rawExt
            : '.jpg';
      cb(null, `blog-${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`);
    },
  }),
  limits: { fileSize: 12 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype?.startsWith('image/')) cb(null, true);
    else cb(new Error('Дозволені лише зображення'));
  },
});

router.get('/', cachePublicGet(PUBLIC_CACHE_CATALOG_SEC), async (req: Request, res: Response) => {
  try {
    const lang = parseBlogLang(req.query.lang);
    const posts = await prisma.blogPost.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(posts.map((p) => formatPublicPost(p, lang)));
  } catch (error) {
    console.error('Ошибка получения blog posts:', error);
    res.status(500).json({ message: 'Ошибка получения статей' });
  }
});

/** Завантаження обкладинки статті (multipart, поле image). */
router.post('/upload-image', checkAdmin, (req: Request, res: Response, next) => {
  blogImageDiskUpload.single('image')(req, res, (err: unknown) => {
    if (err) {
      const msg = err instanceof Error ? err.message : 'Помилка завантаження';
      res.status(400).json({ message: msg });
      return;
    }
    next();
  });
}, (req: Request, res: Response) => {
  const file = (req as Request & { file?: { filename: string } }).file;
  if (!file?.filename) {
    res.status(400).json({ message: 'Потрібен файл image' });
    return;
  }
  res.json({ url: `/uploads/${file.filename}` });
});

router.get('/all', checkAdmin, async (_req: Request, res: Response) => {
  try {
    const posts = await prisma.blogPost.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(posts.map((p) => formatAdminPost(p)));
  } catch (error) {
    console.error('Ошибка получения всех blog posts:', error);
    res.status(500).json({ message: 'Ошибка получения статей' });
  }
});

router.post('/translate', checkAdmin, async (req: Request, res: Response) => {
  try {
    const { title_ua, content_ua } = req.body || {};
    const translated = await translateBlogFromUkrainian({ title_ua, content_ua });
    res.json(translated);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Помилка перекладу';
    console.error('blog translate:', error);
    res.status(400).json({ message: msg });
  }
});

router.get('/:slug', cachePublicGet(PUBLIC_CACHE_CATALOG_SEC), async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    if (RESERVED_SLUGS.has(slug)) {
      return res.status(404).json({ message: 'Статья не найдена' });
    }

    const lang = parseBlogLang(req.query.lang);
    const post = await prisma.blogPost.findUnique({
      where: { slug },
    });

    if (!post || !post.isPublished) {
      return res.status(404).json({ message: 'Статья не найдена' });
    }

    const formatted = formatPublicPost(post, lang);
    const links = await expandBlogPostLinks(prisma, post);
    res.json({ ...formatted, links });
  } catch (error) {
    console.error('Ошибка получения статьи по slug:', error);
    res.status(500).json({ message: 'Ошибка получения статьи' });
  }
});

router.post('/', checkAdmin, async (req: Request, res: Response) => {
  try {
    const { slug, imageUrl, videoUrl, author, isPublished } = req.body;
    const i18n = blogI18nFromBody(req.body);
    const title = primaryBlogLocalized(i18n, 'title');
    const content = primaryBlogLocalized(i18n, 'content');
    if (!slug || !title || !content) {
      return res.status(400).json({ message: 'slug та текст хоча б однією мовою обовʼязкові' });
    }

    const linkFields = blogLinkFieldsFromBody(req.body);

    const created = await prisma.blogPost.create({
      data: {
        ...i18n,
        title,
        slug: String(slug).trim(),
        content,
        imageUrl: imageUrl ? String(imageUrl).trim() : null,
        videoUrl: videoUrl ? String(videoUrl).trim() : null,
        author: author ? String(author).trim() : 'Команда Watta Sushi',
        isPublished: isPublished !== undefined ? Boolean(isPublished) : true,
        linkedProductIds: linkFields.linkedProductIds ?? '[]',
        linkedCategoryIds: linkFields.linkedCategoryIds ?? '[]',
        linkedIngredientIds: linkFields.linkedIngredientIds ?? '[]',
      },
    });

    res.json(formatAdminPost(created));
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
    const { slug, imageUrl, videoUrl, author, isPublished } = req.body;
    const i18n = blogI18nFromBody(req.body);
    const linkFields = blogLinkFieldsFromBody(req.body);

    const data: Record<string, unknown> = {
      ...i18n,
      slug: slug !== undefined ? String(slug).trim() : undefined,
      imageUrl: imageUrl !== undefined ? (imageUrl ? String(imageUrl).trim() : null) : undefined,
      videoUrl: videoUrl !== undefined ? (videoUrl ? String(videoUrl).trim() : null) : undefined,
      author: author !== undefined ? String(author).trim() : undefined,
      isPublished: isPublished !== undefined ? Boolean(isPublished) : undefined,
      ...linkFields,
    };

    if (Object.keys(i18n).length > 0) {
      data.title = primaryBlogLocalized(i18n, 'title');
      data.content = primaryBlogLocalized(i18n, 'content');
    }

    const updated = await prisma.blogPost.update({
      where: { id },
      data,
    });

    res.json(formatAdminPost(updated));
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
