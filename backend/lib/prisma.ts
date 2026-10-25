import { AsyncLocalStorage } from 'node:async_hooks'
import { PrismaClient } from '@prisma/client'
import { isWorkersRuntime } from './runtime.js'

/**
 * Один спільний Prisma-клієнт для всіх модулів.
 *
 * Node: звичайний singleton (як було з `new PrismaClient()` у кожному файлі, але одне з'єднання).
 * Cloudflare Workers: TCP-з'єднання не можна переносити між запитами, тому клієнт
 * створюється на кожен запит (`withRequestPrisma`) і береться з AsyncLocalStorage.
 */
const requestClient = new AsyncLocalStorage<PrismaClient>()
let nodeClient: PrismaClient | null = null

function currentClient(): PrismaClient {
  const scoped = requestClient.getStore()
  if (scoped) return scoped
  if (isWorkersRuntime) {
    throw new Error('Prisma у Workers доступна лише всередині запиту (withRequestPrisma)')
  }
  nodeClient ??= new PrismaClient()
  return nodeClient
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = currentClient()
    const value = Reflect.get(client, prop, client)
    return typeof value === 'function' ? value.bind(client) : value
  },
})

/** Express-middleware для Workers: увесь ланцюжок обробників запиту бачить свій клієнт. */
export function requestPrismaMiddleware(connectionString: string) {
  return (_req: unknown, res: { on: (e: string, cb: () => void) => void }, next: (err?: unknown) => void) => {
    import('pg').then(async ({ Pool }) => {
      const { PrismaPg } = await import('@prisma/adapter-pg')
      const pool = new Pool({ connectionString, max: 1 })
      const client = new PrismaClient({ adapter: new PrismaPg(pool) })
      let closed = false
      const close = () => {
        if (closed) return
        closed = true
        void client.$disconnect().catch(() => {}).finally(() => pool.end().catch(() => {}))
      }
      res.on('finish', close)
      res.on('close', close)
      requestClient.run(client, next)
    }, next)
  }
}
