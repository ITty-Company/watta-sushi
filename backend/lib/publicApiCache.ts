import type { Request, Response, NextFunction, RequestHandler } from 'express';

/** Меню / товари — короткий TTL, адмінка інвалідує клієнтський sessionStorage. */
export const PUBLIC_CACHE_MENU_SEC = 60;
/** Категорії та баннери змінюються рідше. */
export const PUBLIC_CACHE_CATALOG_SEC = 120;
/** Міста / країни — майже статичні для вітрини. */
export const PUBLIC_CACHE_GEO_SEC = 600;
/** Hero-відео, інтервал банера — оновлення з адмінки. */
export const PUBLIC_CACHE_SETTINGS_SEC = 30;

export function setPublicJsonCache(res: Response, maxAgeSec: number, swrSec?: number): void {
  const swr = swrSec ?? Math.min(maxAgeSec * 10, 600);
  res.setHeader('Cache-Control', `public, max-age=${maxAgeSec}, stale-while-revalidate=${swr}`);
}

/** Express middleware: лише GET отримує Cache-Control (POST/PUT/DELETE без змін). */
export function cachePublicGet(maxAgeSec: number, swrSec?: number): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET') return next();
    setPublicJsonCache(res, maxAgeSec, swrSec);
    next();
  };
}
