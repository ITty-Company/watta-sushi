import { parseBlogIdList } from './blogLinks.js';

function orderByIds(rows, ids) {
  const map = new Map(rows.map((r) => [r.id, r]));
  return ids.map((id) => map.get(id)).filter(Boolean);
}

function firstProductImage(p) {
  if (p.imageUrl?.trim()) return p.imageUrl.trim();
  if (typeof p.imageUrls === 'string' && p.imageUrls.trim().startsWith('[')) {
    try {
      const arr = JSON.parse(p.imageUrls);
      if (Array.isArray(arr) && arr[0]) return String(arr[0]).trim();
    } catch {
      /* ignore */
    }
  }
  if (Array.isArray(p.imageUrls) && p.imageUrls[0]) return String(p.imageUrls[0]).trim();
  return null;
}

export async function expandBlogPostLinks(prisma, post) {
  const productIds = parseBlogIdList(post.linkedProductIds);
  const categoryIds = parseBlogIdList(post.linkedCategoryIds);
  const ingredientIds = parseBlogIdList(post.linkedIngredientIds);

  if (productIds.length === 0 && categoryIds.length === 0 && ingredientIds.length === 0) {
    return { products: [], categories: [], ingredients: [] };
  }

  const [productsRaw, categoriesRaw, ingredientsRaw] = await Promise.all([
    productIds.length
      ? prisma.product.findMany({
          where: { id: { in: productIds } },
          select: {
            id: true,
            name_ru: true,
            name_ua: true,
            name_en: true,
            name_nl: true,
            price: true,
            imageUrl: true,
            imageUrls: true,
            isArchived: true,
          },
        })
      : [],
    categoryIds.length
      ? prisma.category.findMany({
          where: { id: { in: categoryIds }, isActive: true },
          select: {
            id: true,
            slug: true,
            name_ru: true,
            name_ua: true,
            name_en: true,
            name_nl: true,
            emoji: true,
          },
        })
      : [],
    ingredientIds.length
      ? prisma.ingredient.findMany({
          where: { id: { in: ingredientIds } },
          select: {
            id: true,
            name_ru: true,
            name_ua: true,
            name_en: true,
            name_nl: true,
            imageUrl: true,
          },
        })
      : [],
  ]);

  const products = orderByIds(
    productsRaw
      .filter((p) => !p.isArchived)
      .map((p) => ({
        id: p.id,
        name_ru: p.name_ru,
        name_ua: p.name_ua,
        name_en: p.name_en,
        name_nl: p.name_nl,
        price: p.price,
        imageUrl: firstProductImage(p),
      })),
    productIds,
  );

  return {
    products,
    categories: orderByIds(categoriesRaw, categoryIds),
    ingredients: orderByIds(ingredientsRaw, ingredientIds),
  };
}
