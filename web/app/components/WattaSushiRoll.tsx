'use client'

import { useState } from 'react'
import type { WattaSushiRollData } from '@/lib/wattaSushiRolls'

type WattaSushiRollProps = {
  roll: WattaSushiRollData
  /** Перші видимі роли — eager; решта lazy. */
  eager?: boolean
  /** Лише 2–4 LCP-роли: fetchPriority high; усі інші — async decode. */
  priority?: boolean
}

export default function WattaSushiRoll({ roll, eager = false, priority = false }: WattaSushiRollProps) {
  const [hidden, setHidden] = useState(false)

  if (hidden) return null

  return (
    <div className="watta-roll watta-roll--product">
      <span className="watta-roll__shadow" aria-hidden />
      <div className="watta-roll__media">
        <img
          src={roll.imageUrl}
          alt={roll.title}
          className="watta-roll__img"
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          draggable={false}
          fetchPriority={priority ? 'high' : 'auto'}
          onError={() => setHidden(true)}
        />
      </div>
    </div>
  )
}
