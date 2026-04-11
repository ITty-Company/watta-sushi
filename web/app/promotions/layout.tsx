import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Акції та новини',
  description: 'Акції, спецпропозиції та новини Watta Sushi.',
}

export default function PromotionsLayout({ children }: { children: React.ReactNode }) {
  return children
}
