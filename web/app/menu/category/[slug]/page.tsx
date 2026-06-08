import { redirect } from 'next/navigation'

type Props = { params: { slug: string } }

/** Legacy /menu/category/:slug → єдина сторінка /menu з якорем секції. */
export default function MenuCategoryPage({ params }: Props) {
  const slug = params.slug?.trim()
  if (!slug) redirect('/menu')
  redirect(`/menu?cat=${encodeURIComponent(slug)}`)
}
