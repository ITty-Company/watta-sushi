'use client'

import { useRouter } from 'next/navigation'
import ContactsView from '../components/ContactsView'

export default function ContactsPage() {
  const router = useRouter()

  return (
    <div className="w-full max-w-[100vw] overflow-x-hidden bg-[#f2f5f3]">
      <ContactsView
        onBack={() => {
          if (typeof window !== 'undefined' && window.history.length > 1) {
            router.back()
          } else {
            router.push('/')
          }
        }}
      />
    </div>
  )
}
