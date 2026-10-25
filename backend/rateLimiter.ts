// backend/rateLimiter.ts
import rateLimit from 'express-rate-limit';
import type { RequestHandler } from 'express';
import { isWorkersRuntime } from './lib/runtime.js';

type RateLimitOptions = Parameters<typeof rateLimit>[0];

/**
 * Cloudflare Workers: лімітер створюється на першому запиті — його MemoryStore запускає таймер,
 * а таймери на рівні модуля там заборонені. Node: звичайне створення при старті.
 */
export function lazyRateLimit(options: RateLimitOptions): RequestHandler {
  if (!isWorkersRuntime) return rateLimit(options);
  let limiter: RequestHandler | null = null;
  return (req, res, next) =>
    (limiter ??= rateLimit({ ...options, validate: { creationStack: false } }))(req, res, next);
}

// Строгий лимит для логина и регистрации (10 попыток за 15 минут с одного IP)
export const authRateLimiter = lazyRateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 10, // Лимит 10 запросов на IP в течение windowMs
  standardHeaders: true, // Возвращает инфу о лимитах в заголовках `RateLimit-*`
  legacyHeaders: false, // Отключает устаревшие заголовки `X-RateLimit-*`
  message: { message: 'Слишком много попыток входа. Пожалуйста, подождите 15 минут.' },
});

// Отдельный лимит для отправки кодов (SMS/Email) - 3 попытки за минуту
export const sendCodeRateLimiter = lazyRateLimit({
  windowMs: 60 * 1000, // 1 минута
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Слишком много запросов кода. Подождите одну минуту.' },
});

// Лимит для проверки OTP кода (защита от перебора) - 5 попыток за 5 минут
export const verifyCodeRateLimiter = lazyRateLimit({
  windowMs: 5 * 60 * 1000, // 5 минут
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Слишком много неверных попыток ввода кода. Подождите 5 минут.' },
});