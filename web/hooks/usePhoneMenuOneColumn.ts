'use client'

import { useLayoutEffect, useState } from 'react'

/** Телефон: одна картка в ряд (як /favorites), без горизонтальної стрічки та без 2 колонок. */
export function usePhoneMenuOneColumn(): boolean {
  const [phone, setPhone] = useState(false)

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(max-width: 767px)')
    const apply = () => setPhone(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  return phone
}
