'use client'

import AboutPageView from './AboutPageView'

/** @deprecated Використовуйте маршрут /about; залишено для сумісності зі вбудованим переглядом. */
export default function AboutView({
  onBack,
  onMenuClick,
}: {
  onBack: () => void
  onMenuClick: () => void
}) {
  return <AboutPageView embedded onBack={onBack} onMenuClick={onMenuClick} />
}
