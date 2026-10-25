/** true, коли код виконується в Cloudflare Workers (workerd), а не в Node. */
export const isWorkersRuntime =
  typeof navigator !== 'undefined' && navigator.userAgent === 'Cloudflare-Workers'

/**
 * Workers: рядок підключення до Postgres через Hyperdrive. Читати можна лише всередині запиту
 * (доступ до binding на рівні модуля заборонений), тому — функція.
 */
export async function workersDatabaseUrl() {
  const { env } = await import('cloudflare:workers')
  return env.HYPERDRIVE?.connectionString || process.env.DATABASE_URL
}
