'use client'

import { useState, useEffect } from 'react'

function LoadingFallback() {
  return (
    <div
      className="app-web"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f5f5f5',
      }}
    >
      <div style={{ textAlign: 'center', color: '#145142' }}>
        <div
          style={{
            width: 48,
            height: 48,
            margin: '0 auto 12px',
            border: '3px solid #145142',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'clientOnlySpin 0.8s linear infinite',
          }}
        />
        <div>Загрузка...</div>
      </div>
    </div>
  )
}

export default function HomeClientLoader() {
  const [HomeClient, setHomeClient] = useState<React.ComponentType | null>(null)

  useEffect(() => {
    import('./HomeClient').then((m) => setHomeClient(() => m.default))
  }, [])

  if (!HomeClient) return <LoadingFallback />
  return <HomeClient />
}
