export type CheckoutErrorFocusTarget =
  | { kind: 'section'; sectionId: string; focusSelector?: string }
  | { kind: 'field'; fieldId: string }

export const CHECKOUT_FOCUS_SECTIONS = {
  order: 'cart-checkout-order',
  contact: 'cart-checkout-contact',
  delivery: 'cart-delivery-time',
  pay: 'cart-checkout-pay',
} as const

type FocusRule = {
  match: (message: string) => boolean
  target: CheckoutErrorFocusTarget
}

const FOCUS_RULES: FocusRule[] = [
  {
    match: (m) => /кошик порожній|некоректні товари|товар.*недоступн|оновіть кошик/i.test(m),
    target: { kind: 'section', sectionId: CHECKOUT_FOCUS_SECTIONS.order },
  },
  {
    match: (m) => /дата доставки|час доставки|обраний час|немає вільних слотів|no slots/i.test(m),
    target: {
      kind: 'section',
      sectionId: CHECKOUT_FOCUS_SECTIONS.delivery,
      focusSelector: '.watta-cart-delivery-time-block',
    },
  },
  {
    match: (m) =>
      /адрес|індекс|postal|доставк.*не підтвердж|сесія доставки|некоректні дані доставки|геокод|зони доставки|межами зон/i.test(
        m,
      ),
    target: {
      kind: 'section',
      sectionId: CHECKOUT_FOCUS_SECTIONS.delivery,
      focusSelector:
        'input[autocomplete="street-address"], input[autocomplete="postal-code"], .watta-checkout-saved-addresses',
    },
  },
  {
    match: (m) => /бонус/i.test(m),
    target: { kind: 'section', sectionId: CHECKOUT_FOCUS_SECTIONS.pay, focusSelector: '.watta-cart-checkout-total__bonus' },
  },
  {
    match: (m) => /оплат|карт|stripe|liqpay|готівк/i.test(m),
    target: { kind: 'section', sectionId: CHECKOUT_FOCUS_SECTIONS.pay },
  },
  {
    match: (m) => /телефон|phone/i.test(m),
    target: { kind: 'field', fieldId: 'cart-checkout-phone' },
  },
  {
    match: (m) => /згод|обробк.*даних|consent/i.test(m),
    target: { kind: 'field', fieldId: 'cart-data-processing-consent' },
  },
  {
    match: (m) => /ім'я|name|контакт/i.test(m),
    target: { kind: 'field', fieldId: 'cart-checkout-name' },
  },
]

export function resolveCheckoutErrorFocus(message: string): CheckoutErrorFocusTarget {
  const trimmed = message.trim()
  for (const rule of FOCUS_RULES) {
    if (rule.match(trimmed)) return rule.target
  }
  return { kind: 'section', sectionId: CHECKOUT_FOCUS_SECTIONS.contact }
}
