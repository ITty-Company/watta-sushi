import nextDynamic from 'next/dynamic'

const HomeClient = nextDynamic(() => import('./HomeClient'), {
  ssr: false,
  loading: () => (
    <div style={{
      minHeight: '50vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        width: 32,
        height: 32,
        border: '3px solid #145142',
        borderTopColor: 'transparent',
        borderRadius: '50%',
        animation: 'clientOnlySpin 0.8s linear infinite',
      }} />
    </div>
  ),
})

export default function Home() {
  return <HomeClient />
}
