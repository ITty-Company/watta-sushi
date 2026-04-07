import type { Metadata } from 'next'
import ReviewsPageClient from './ReviewsPageClient'

export const metadata: Metadata = {
  title: 'Відгуки клієнтів | Watta Sushi',
  description: 'Відгуки про доставку та якість Watta Sushi.',
}

export default function ReviewsPage() {
  return <ReviewsPageClient />
}
