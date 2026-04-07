import CategoryMenuClient from './CategoryMenuClient'

type Props = { params: { slug: string } }

export default function MenuCategoryPage({ params }: Props) {
  return <CategoryMenuClient slug={params.slug} />
}
