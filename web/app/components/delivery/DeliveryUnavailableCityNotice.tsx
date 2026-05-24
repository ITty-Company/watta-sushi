'use client'

export type DeliveryUnavailableCityNoticeProps = {
  title: string
  compact?: boolean
}

export default function DeliveryUnavailableCityNotice({
  title,
  compact = false,
}: DeliveryUnavailableCityNoticeProps) {
  return (
    <div
      className={`delivery-unavailable-city-notice${compact ? ' delivery-unavailable-city-notice--compact' : ''}`}
      role="status"
    >
      <p className="delivery-unavailable-city-notice__title">{title}</p>
    </div>
  )
}
