/**
 * Signed delivery quote token (HMAC-SHA256).
 *
 * Проблема: стоимость доставки рассчитывается сервером (/delivery/check с геокодингом,
 * зонами и NL-тарифом), но при создании заказа клиент присылал её значение сам — уязвимость.
 *
 * Решение: /delivery/check подписывает рассчитанную стоимость и возвращает
 * deliveryQuoteToken. При создании заказа сервер верифицирует токен и извлекает fee.
 *
 * Формат токена: base64url(JSON payload) + "." + base64url(HMAC-SHA256)
 * TTL: 30 минут (достаточно для завершения чекаута)
 *
 * Переменная окружения: DELIVERY_QUOTE_SECRET (если не задана — fallback на JWT_SECRET).
 * В production одна из них ОБЯЗАТЕЛЬНА.
 */

import { createHmac, timingSafeEqual } from 'crypto'

const QUOTE_TTL_SECONDS = 30 * 60 // 30 минут

// ---------------------------------------------------------------------------
// Внутренние функции
// ---------------------------------------------------------------------------

function getQuoteSecret(): string {
  const s = (process.env.DELIVERY_QUOTE_SECRET || process.env.JWT_SECRET)?.trim()
  if (s) return s
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'DELIVERY_QUOTE_SECRET (или JWT_SECRET) обязателен в production для верификации стоимости доставки',
    )
  }
  // Dev-fallback — никогда не совпадёт с production-секретом
  return 'dev-delivery-quote-secret-do-not-use-in-production'
}

// ---------------------------------------------------------------------------
// Публичные типы
// ---------------------------------------------------------------------------

export interface DeliveryQuotePayload {
  /** Рассчитанная стоимость доставки в валюте заказа */
  fee: number
  cityId: number
  /** Для зональной доставки (status: 'inside') */
  zoneId?: number | null
  /** true = NL-тарифный расчёт по километражу */
  isNlTariff?: boolean
  /** Unix timestamp (секунды) истечения токена */
  expiresAt: number
}

export type DeliveryQuoteVerifyResult =
  | { ok: true; payload: DeliveryQuotePayload }
  | { ok: false; reason: 'invalid_format' | 'invalid_signature' | 'expired' }

// ---------------------------------------------------------------------------
// sign / verify
// ---------------------------------------------------------------------------

/**
 * Подписывает рассчитанную стоимость доставки.
 * Включать в ответ /delivery/check вместе с estimatedDeliveryFee.
 */
export function signDeliveryQuote(
  data: Omit<DeliveryQuotePayload, 'expiresAt'>,
): string {
  const payload: DeliveryQuotePayload = {
    ...data,
    expiresAt: Math.floor(Date.now() / 1000) + QUOTE_TTL_SECONDS,
  }
  const json = JSON.stringify(payload)
  const b64 = Buffer.from(json, 'utf8').toString('base64url')
  const sig = createHmac('sha256', getQuoteSecret()).update(b64).digest('base64url')
  return `${b64}.${sig}`
}

/**
 * Верифицирует delivery quote токен.
 * При ok=true payload.fee содержит проверенную стоимость доставки.
 */
export function verifyDeliveryQuote(token: string): DeliveryQuoteVerifyResult {
  if (!token || typeof token !== 'string') {
    return { ok: false, reason: 'invalid_format' }
  }

  const dot = token.indexOf('.')
  // Точка должна быть не первым и не последним символом
  if (dot <= 0 || dot >= token.length - 1) {
    return { ok: false, reason: 'invalid_format' }
  }

  const b64 = token.slice(0, dot)
  const sig = token.slice(dot + 1)

  // Constant-time comparison — защита от timing side-channel атаки
  const expectedSig = createHmac('sha256', getQuoteSecret()).update(b64).digest('base64url')
  let sigMatch = false
  try {
    const sigBuf = Buffer.from(sig, 'base64url')
    const expBuf = Buffer.from(expectedSig, 'base64url')
    // timingSafeEqual требует одинаковую длину буферов
    sigMatch = sigBuf.length === expBuf.length && timingSafeEqual(sigBuf, expBuf)
  } catch {
    return { ok: false, reason: 'invalid_signature' }
  }

  if (!sigMatch) {
    return { ok: false, reason: 'invalid_signature' }
  }

  // Декодируем и валидируем payload
  let payload: DeliveryQuotePayload
  try {
    payload = JSON.parse(
      Buffer.from(b64, 'base64url').toString('utf8'),
    ) as DeliveryQuotePayload
  } catch {
    return { ok: false, reason: 'invalid_format' }
  }

  if (
    !Number.isFinite(payload.fee) ||
    payload.fee < 0 ||
    !Number.isFinite(payload.cityId) ||
    !Number.isFinite(payload.expiresAt)
  ) {
    return { ok: false, reason: 'invalid_format' }
  }

  if (Math.floor(Date.now() / 1000) > payload.expiresAt) {
    return { ok: false, reason: 'expired' }
  }

  return { ok: true, payload }
}
