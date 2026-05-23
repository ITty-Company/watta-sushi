/** Парсинг / збереження ID товарів, категорій, інгредієнтів у BlogPost (JSON-масив у TEXT). */

export function parseBlogIdList(raw) {
  if (Array.isArray(raw)) {
    return [...new Set(raw.map((n) => Number(n)).filter((n) => Number.isInteger(n) && n > 0))]
  }
  if (typeof raw === 'string' && raw.trim()) {
    try {
      return parseBlogIdList(JSON.parse(raw))
    } catch {
      return []
    }
  }
  return []
}

export function serializeBlogIdList(ids) {
  return JSON.stringify(parseBlogIdList(ids))
}

export function blogLinkFieldsFromBody(body) {
  const b = body || {}
  return {
    linkedProductIds:
      b.linkedProductIds !== undefined ? serializeBlogIdList(b.linkedProductIds) : undefined,
    linkedCategoryIds:
      b.linkedCategoryIds !== undefined ? serializeBlogIdList(b.linkedCategoryIds) : undefined,
    linkedIngredientIds:
      b.linkedIngredientIds !== undefined ? serializeBlogIdList(b.linkedIngredientIds) : undefined,
  }
}

export function formatBlogPostRow(post) {
  if (!post) return post
  const { linkedProductIds: lp, linkedCategoryIds: lc, linkedIngredientIds: li, ...rest } = post
  return {
    ...rest,
    linkedProductIds: parseBlogIdList(lp),
    linkedCategoryIds: parseBlogIdList(lc),
    linkedIngredientIds: parseBlogIdList(li),
  }
}
