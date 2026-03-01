'use client'

import { useState, useEffect, ReactNode } from 'react'

/**
 * Renders children only on the client. Avoids SSR issues with context/hydration on Render.
 */
export default function ClientOnly({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
        <div style={{ width: 32, height: 32, border: '3px solid #145142', borderTopColor: 'transparent', borderRadius: '50%', animation: 'clientOnlySpin 0.8s linear infinite' }} />
      </div>
    )
  }
  return <>{children}</>
}
