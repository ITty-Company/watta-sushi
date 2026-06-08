'use client'

import dynamic from 'next/dynamic'
import { useEffect } from 'react'
import { useNotificationsDrawer } from '../context/NotificationsDrawerContext'
import { useOptionalRightNavDrawerActions } from '../context/RightNavDrawerContext'

const NotificationsView = dynamic(
  () =>
    import('./NotificationsView').then((m) => ({
      default: m.NotificationsView,
    })),
  { ssr: false },
)

export default function WattaNotificationsPanel() {
  const { isOpen, close, enabled } = useNotificationsDrawer()
  const rightNavDrawer = useOptionalRightNavDrawerActions()

  useEffect(() => {
    if (!isOpen) return
    rightNavDrawer?.close()
  }, [isOpen, rightNavDrawer])

  if (!enabled) return null

  return <NotificationsView isOpen={isOpen} onClose={close} />
}
