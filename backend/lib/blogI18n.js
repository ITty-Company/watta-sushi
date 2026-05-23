/** Багатомовні поля статей блогу (uk / ru / en / nl). */

const LANGS = ['ua', 'ru', 'en', 'nl'];

const FIELD_ORDER = {
  uk: ['ua', 'en', 'nl', 'ru'],
  en: ['en', 'nl', 'ua', 'ru'],
  ru: ['ru', 'en', 'ua', 'nl'],
  nl: ['nl', 'en', 'ua', 'ru'],
};

export function parseBlogLang(raw) {
  const v = String(raw || '')
    .trim()
    .toLowerCase();
  if (v === 'uk' || v === 'ua') return 'uk';
  if (v === 'en' || v === 'ru' || v === 'nl') return v;
  return 'uk';
}

function pickField(post, field, suf) {
  const key = `${field}_${suf}`;
  const v = post?.[key];
  return typeof v === 'string' ? v.trim() : '';
}

/** Текст поля `title` / `content` для мови сайту. */
export function pickBlogLocalized(post, field, lang) {
  const order = FIELD_ORDER[parseBlogLang(lang)] || FIELD_ORDER.uk;
  for (const suf of order) {
    const s = pickField(post, field, suf);
    if (s) return s;
  }
  const legacy = post?.[field];
  return typeof legacy === 'string' ? legacy.trim() : '';
}

export function primaryBlogLocalized(post, field) {
  for (const suf of LANGS) {
    const s = pickField(post, field, suf);
    if (s) return s;
  }
  const legacy = post?.[field];
  return typeof legacy === 'string' ? legacy.trim() : '';
}

export function blogI18nFromBody(body) {
  const b = body || {};
  const out = {};
  for (const field of ['title', 'content']) {
    for (const suf of LANGS) {
      const key = `${field}_${suf}`;
      if (b[key] !== undefined) {
        out[key] = b[key] == null ? '' : String(b[key]);
      }
    }
  }
  const titlePrimary =
    pickField({ ...b, ...out }, 'title', 'ua') ||
    primaryBlogLocalized({ ...b, ...out }, 'title') ||
    (b.title != null ? String(b.title).trim() : '');
  const contentPrimary =
    pickField({ ...b, ...out }, 'content', 'ua') ||
    primaryBlogLocalized({ ...b, ...out }, 'content') ||
    (b.content != null ? String(b.content) : '');

  if (titlePrimary) out.title = titlePrimary;
  if (contentPrimary) out.content = contentPrimary;

  return out;
}

export function formatBlogPostAdmin(post) {
  if (!post) return post;
  const row = { ...post };
  for (const suf of LANGS) {
    if (row[`title_${suf}`] == null) row[`title_${suf}`] = '';
    if (row[`content_${suf}`] == null) row[`content_${suf}`] = '';
  }
  if (!row.title) row.title = primaryBlogLocalized(row, 'title');
  if (!row.content) row.content = primaryBlogLocalized(row, 'content');
  return row;
}

export function localizeBlogPostForPublic(post, lang) {
  const row = formatBlogPostAdmin(post);
  return {
    ...row,
    title: pickBlogLocalized(row, 'title', lang),
    content: pickBlogLocalized(row, 'content', lang),
  };
}
