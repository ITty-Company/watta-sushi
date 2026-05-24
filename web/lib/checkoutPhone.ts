/** Макс. довжина поля (цифри, +, пробіли, дужки). */
export const CHECKOUT_PHONE_INPUT_MAX_LEN = 32

/** Мінімум/максимум цифр — будь-яка країна, без фіксованого коду. */
export const PHONE_MIN_DIGITS = 7
export const PHONE_MAX_DIGITS = 15

/** Лише цифри для підрахунку. */
export function phoneDigitCount(value: string): number {
  return value.replace(/\D/g, '').length
}

/**
 * Вільне введення: опційний + на початку, цифри, типові роздільники.
 * Не підставляємо жоден код країни — людина вводить свій номер як хоче.
 */
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

/** Будь-який номер: 7–15 цифр, код країни на вибір користувача. */
export function isValidCheckoutPhone(value: string): boolean {
  const digits = phoneDigitCount(value.trim())
  return digits >= PHONE_MIN_DIGITS && digits <= PHONE_MAX_DIGITS
}
