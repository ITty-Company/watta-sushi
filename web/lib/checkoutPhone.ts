/** Макс. довжина поля (форматування: +, пробіли, дужки). */
export const CHECKOUT_PHONE_INPUT_MAX_LEN = 28

/** Лише цифри для підрахунку (E.164: до 15 цифр). */
export function phoneDigitCount(value: string): number {
  return value.replace(/\D/g, '').length
}

/** Дозволено + на початку, цифри та типові роздільники під час введення. */
export function sanitizeCheckoutPhoneInput(value: string): string {
  let result = ''
  for (let i = 0; i < value.length && result.length < CHECKOUT_PHONE_INPUT_MAX_LEN; i++) {
    const ch = value[i]
    if (ch >= '0' && ch <= '9') {
      result += ch
      continue
    }
    if (ch === '+' && result.length === 0) {
      result += ch
      continue
    }
    if ((ch === ' ' || ch === '-' || ch === '(' || ch === ')' || ch === '.') && result.length > 0) {
      result += ch
    }
  }
  return result
}

/** Будь-яка країна: 8–15 цифр (міжнародний формат). */
export function isValidCheckoutPhone(value: string): boolean {
  const digits = phoneDigitCount(value.trim())
  return digits >= 8 && digits <= 15
}
