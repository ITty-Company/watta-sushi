/** Інтервал автопрокрутки банерів на головній (мс). Адмін може змінити в налаштуваннях. */
export const HOME_BANNER_AUTO_INTERVAL_MS = 4_000

export function normalizeBannerIntervalMs(raw: unknown): number {
  const n = typeof raw === 'number' ? raw : parseInt(String(raw ?? ''), 10)
  if (!Number.isFinite(n) || n < 1_000) return HOME_BANNER_AUTO_INTERVAL_MS
  return Math.min(n, 60_000)
}
