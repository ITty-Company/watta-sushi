/** True if stored/API user payload marks site administrator (case-insensitive). */
export function isAdminRole(role: unknown): boolean {
  if (role == null || typeof role !== 'string') return false
  return role.trim().toUpperCase() === 'ADMIN'
}

export function readIsAdminFromCurrentUserJson(raw: string | null): boolean {
  if (!raw) return false
  try {
    const p = JSON.parse(raw) as { role?: unknown }
    return isAdminRole(p?.role)
  } catch {
    return false
  }
}
