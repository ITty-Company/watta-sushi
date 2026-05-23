'use client'

import { Suspense } from 'react'
import { useParams } from 'next/navigation'
import OrderReceiptPageClient from '@/app/components/profile/OrderReceiptPageClient'

function ReceiptPageInner() {
  const params = useParams()
  const raw = params?.id
  const orderId = typeof raw === 'string' ? parseInt(raw, 10) : NaN

  if (!Number.isFinite(orderId)) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-gray-600">
        Invalid order
      </div>
    )
  }

  return <OrderReceiptPageClient orderId={orderId} />
}

export default function OrderReceiptPage() {
  return (
    <Suspense fallback={null}>
      <ReceiptPageInner />
    </Suspense>
  )
}
