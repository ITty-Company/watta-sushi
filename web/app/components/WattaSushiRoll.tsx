'use client'

import { useState } from 'react'
import Image from 'next/image'
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
        <Image
          src={roll.imageUrl}
          alt={roll.title}
          width={130}
          height={130}
          sizes="130px"
          className="watta-roll__img"
          loading={eager ? 'eager' : 'lazy'}
          priority={priority}
          draggable={false}
          onError={() => setHidden(true)}
        />
      </div>
    </div>
  )
}
