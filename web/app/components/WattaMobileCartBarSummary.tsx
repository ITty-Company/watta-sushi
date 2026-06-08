'use client'

type Props = {
  pieces: number
  totalFormatted: string
  hasItems: boolean
  emptyLabel: string
  leadTemplate: string
  amountTemplate: string
}

/** Ліва частина зеленої смуги: «N товари,» звичайним + сума жирним (як Ninja). */
export function WattaMobileCartBarSummary({
  pieces,
  totalFormatted,
  hasItems,
  leadTemplate,
  amountTemplate,
}: Props) {
  if (!hasItems) {
    // Порожній кошик: ліворуч нічого не пишемо — слово «Кошик» лишається
    // тільки праворуч (після роздільної палички в __cta). Кількість і сума
    // зʼявляються тут лише коли щось додали.
    return <span className="watta-mobile-cart-bar__summary" aria-hidden />
  }

  const lead = leadTemplate.replace('{{pieces}}', String(pieces))
  const amount = amountTemplate.replace('{{total}}', totalFormatted)

  return (
    <span className="watta-mobile-cart-bar__summary">
      <span className="watta-mobile-cart-bar__summary-lead">{lead}</span>
      <span className="watta-mobile-cart-bar__summary-amount">{amount}</span>
    </span>
  )
}

export function formatMobileCartBarAria(
  pieces: number,
  totalFormatted: string,
  hasItems: boolean,
  emptyLabel: string,
  leadTemplate: string,
  amountTemplate: string,
): string {
  if (!hasItems) return emptyLabel
  const lead = leadTemplate.replace('{{pieces}}', String(pieces))
  const amount = amountTemplate.replace('{{total}}', totalFormatted)
  return `${lead} ${amount}`
}
