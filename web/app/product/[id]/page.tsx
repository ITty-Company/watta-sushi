import ProductPageClient from './ProductPageClient'
import { normalizeProductRouteId } from '@/lib/fetchProductById'
import { fetchProductDetailForPage } from '@/lib/fetchProductDetailServer'

type ProductPageProps = {
  params: { id: string }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const id = normalizeProductRouteId(params.id)
  const { product, ingredientsCatalog } = id
    ? await fetchProductDetailForPage(id)
    : { product: null, ingredientsCatalog: [] }

  return (
    <ProductPageClient
      productId={id != null ? String(id) : ''}
      initialProduct={product}
      initialIngredientsCatalog={ingredientsCatalog}
    />
  )
}
